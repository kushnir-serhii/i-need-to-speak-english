# Technical Specification: Chat History Persistence

- **Functional Specification:** [functional-spec.md](./functional-spec.md)
- **Status:** Completed
- **Author(s):** Serhii Kushnir

---

## 1. High-Level Technical Approach

The backend API and Mongoose model are already fully implemented. This work is almost entirely frontend, with one small backend addition (bulk delete). The changes fall into three areas:

1. **Store persistence** — add Zustand `persist` middleware to `useChatStore` so the current session survives page reloads.
2. **New conversation flow** — add a "New conversation" button and Save/Discard/Cancel dialog to the Chat page.
3. **History page upgrades** — add "Continue" and "Clear all history" actions to the existing `/history` page.

---

## 2. Proposed Solution & Implementation Plan

### 2.1 Backend — Bulk Delete Endpoint

**`DELETE /api/history`** — one new method added to `src/app/api/history/route.ts`.

| Field | Detail |
|---|---|
| Auth | `visitorId` query param (same pattern as GET) |
| Action | `ChatSession.deleteMany({ visitorId })` |
| Response 200 | `{ ok: true, deleted: number }` |
| Errors | `400` missing visitorId, `500` server error |

No new file — added alongside the existing `GET` and `POST` handlers in the same route file.

### 2.2 Store — Persist Current Session (`src/store/useChatStore.ts`)

| Change | Detail |
|---|---|
| Add `persist` middleware | Wrap store with Zustand `persist`; storage key `'intse-chat'` |
| Persisted fields | `messages`, `sessionId` only |
| Excluded fields | `isStreaming`, `sessionTokens`, `autoDialogActive`, `speakingMessageId` (always reset on load) |
| New action: `loadSession(messages, sessionId)` | Replaces current `messages` with the provided array and sets `sessionId`. Used by the history "Continue" flow. |
| New field: `sessionSaved` (boolean, default `false`) | Tracks whether the current session has been POSTed to the server. Reset to `false` on `clearMessages()` and `loadSession()`; set to `true` after a successful save POST. Excluded from persist. |

`initSessionId()` is already in the store — called from the Chat page on mount to ensure a new session has a UUID before the first message.

### 2.3 Chat Page — "New Conversation" Button and Dialog (`src/app/(admin)/page.tsx`)

| Change | Detail |
|---|---|
| "New conversation" button | Added to the Chat page header area (above `ChatThread`). Disabled when `messages.length === 0`. |
| Dialog | Uses the existing `Popup` / modal pattern — three buttons: **Save**, **Discard**, **Cancel**. |
| Save handler | `POST /api/history` with `{ sessionId, visitorId, messages }` → sets `sessionSaved = true` → then `clearMessages()`. |
| Discard handler | `clearMessages()` directly (also resets persisted localStorage state). |
| Cancel handler | Closes dialog, no action. |

### 2.4 History Page Upgrades (`src/app/(admin)/history/page.tsx`)

| Change | Detail |
|---|---|
| "Continue" button | Added to each session card alongside the existing Delete button. Clicking it: (a) checks `messages.length > 0 && !sessionSaved` → if unsaved, shows Save/Discard/Cancel prompt; (b) fetches full session via `GET /api/history/[sessionId]`; (c) calls `loadSession(messages, sessionId)` on the store; (d) navigates to `/`. |
| "Clear all history" button | Added at the top of the list (hidden when list is empty). Shows confirmation: *"Delete all [N] conversations? This cannot be undone."* → on confirm: `DELETE /api/history?visitorId=...` → clears local state. |
| Save-before-continue prompt | Re-uses the same Save/Discard/Cancel dialog structure as the Chat page. |

### 2.5 Rehydration Cleanup

On store rehydration (page reload), any message with `isStreaming: true` is corrected to `false`. This handles the edge case where the user reloads mid-stream. Applied via Zustand `persist`'s `onRehydrateStorage` callback or a one-time `useEffect` on the Chat page.

---

## 3. Impact and Risk Analysis

**System Dependencies**

| Dependency | Impact |
|---|---|
| `useChatStore` persist | Messages array stored in localStorage under `'intse-chat'`. Single-session buffer — cleared on save or discard. |
| Existing `/history` page expand feature | Preserved as-is; "Continue" is added alongside the existing expand/collapse. |
| `clearMessages()` | Already resets `sessionId` to `null` — with persist, this also clears localStorage. No change needed to the action itself. |
| Existing `Popup` / modal component | Reused for Save/Discard/Cancel and clear-all confirmation dialogs. |

**Potential Risks & Mitigations**

| Risk | Severity | Mitigation |
|---|---|---|
| Page reload mid-stream leaves `isStreaming: true` in localStorage | Low | Rehydration cleanup corrects all messages to `isStreaming: false` on load. |
| User navigates to `/` from history while session fetch is in-flight | Low | Disable "Continue" button per row while fetching (loading state). |
| `visitorId` is null when history page mounts | Low | Existing guard `if (!visitorId) return` already in the page — no change needed. |
| Bulk delete races with a concurrent save | Low | `deleteMany` is atomic at the collection level; concurrent `findOneAndUpdate` on a different `sessionId` is unaffected. |

---

## 4. Testing Strategy

Manual verification against functional spec acceptance criteria:

1. Send a message, refresh page — messages reappear.
2. Click "New conversation" with messages present — Save/Discard/Cancel dialog appears.
3. Choose "Save" — session appears in `/history`, chat clears.
4. Choose "Discard" — chat clears, session not in `/history`.
5. Choose "Cancel" — messages unchanged.
6. On `/history`, click "Continue" on a saved session — Chat page loads with that conversation.
7. Send a new message after "Continue" — AI replies using conversation context.
8. On `/history` with unsaved messages in chat, click "Continue" — Save/Discard/Cancel prompt appears.
9. Click trash icon on a history entry — entry removed immediately.
10. Click "Clear all history", confirm — all entries removed, empty state shown.
11. Click "Clear all history", cancel — entries unchanged.
