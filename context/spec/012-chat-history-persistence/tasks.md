# Tasks: Chat History Persistence

**Spec:** [functional-spec.md](./functional-spec.md) · [technical-considerations.md](./technical-considerations.md)
**Status:** Ready for implementation

---

## Slice 1 — Current session survives page reload

_Goal: messages and session ID are saved to the browser so that refreshing the page restores the conversation exactly as it was. No new UI. App is fully functional after this slice._

- [x] **Add `persist` middleware to `useChatStore`** — wrap the store with Zustand `persist` (storage key `'intse-chat'`); persist only `messages` and `sessionId`; exclude `isStreaming`, `sessionTokens`, `autoDialogActive`, `speakingMessageId`. Add a rehydration cleanup step that sets `isStreaming: false` on all messages after reload (handles the mid-stream reload edge case). **[Agent: nextjs-frontend]**
- [x] **Call `initSessionId()` on Chat page mount** — add a `useEffect` in `src/app/(admin)/page.tsx` that calls `useChatStore.getState().initSessionId()` once on mount, ensuring every session has a UUID before the first message is sent. **[Agent: nextjs-frontend]**
- [x] **Verify Slice 1** — load Playwright via `ToolSearch` first. Open the chat, send a message, reload the page — confirm the message is still visible. Send a second message after reload — confirm the session continues normally. **[Agent: nextjs-frontend]**

---

## Slice 2 — Save and start a new conversation

_Goal: the user can explicitly save the current conversation to history and start fresh via a "New conversation" button with a Save / Discard / Cancel dialog._

- [x] **Add `sessionSaved` flag to `useChatStore`** — add `sessionSaved: boolean` (default `false`, excluded from persist); reset to `false` in `clearMessages()`; set to `true` after a successful save POST. This flag drives the "unsaved" check used in later slices. **[Agent: nextjs-frontend]**
- [x] **Add "New conversation" button and dialog to Chat page** — add a button (disabled when `messages.length === 0`) to the Chat page header. On click, show a Save / Discard / Cancel confirmation using the existing popup/modal pattern. Save handler: `POST /api/history` with `{ sessionId, visitorId, messages }` → set `sessionSaved = true` → call `clearMessages()`. Discard handler: call `clearMessages()`. Cancel handler: close dialog. **[Agent: nextjs-frontend]**
- [x] **Verify Slice 2** — load Playwright via `ToolSearch` first. Send a message. Click "New conversation" — confirm dialog appears. Click "Save" — confirm chat clears and the session appears at `/history`. Repeat: send a message, click "New conversation", click "Discard" — confirm chat clears but no new entry appears in `/history`. Repeat: click "New conversation", click "Cancel" — confirm messages are unchanged. **[Agent: nextjs-frontend]**

---

## Slice 3 — Continue a past conversation from History

_Goal: clicking "Continue" on a history entry loads that conversation as the active session and navigates to the Chat page. If the user has unsaved messages, they are prompted first._

- [x] **Add `loadSession` action to `useChatStore`** — add `loadSession(messages: Message[], sessionId: string)` that replaces `messages`, sets `sessionId`, and resets `sessionSaved` to `false`. **[Agent: nextjs-frontend]**
- [x] **Add "Continue" button to history page** — add a "Continue" button to each session card in `src/app/(admin)/history/page.tsx`. On click: (a) if `messages.length > 0 && !sessionSaved`, show the Save/Discard/Cancel prompt before proceeding; (b) fetch full session via `GET /api/history/[sessionId]?visitorId=...`; (c) call `loadSession(messages, sessionId)`; (d) navigate to `/`. Disable the button per row while the fetch is in flight. **[Agent: nextjs-frontend]**
- [x] **Verify Slice 3** — load Playwright via `ToolSearch` first. Save a conversation, click "New conversation" to clear the chat. Go to `/history`, click "Continue" on the saved session — confirm the Chat page loads with the conversation. Send a new message — confirm the AI replies. Go back to `/history`, start a new message without saving, then click "Continue" on a different session — confirm the Save/Discard/Cancel prompt appears. **[Agent: nextjs-frontend]**

---

## Slice 4 — Clear all history

_Goal: the user can delete all saved conversations at once from the History page._

- [x] **Add `DELETE /api/history` bulk delete endpoint** — add a `DELETE` handler to `src/app/api/history/route.ts` that reads `visitorId` from the query string and calls `ChatSession.deleteMany({ visitorId })`. Returns `{ ok: true, deleted: number }`. Returns `400` if `visitorId` is missing. **[Agent: nextjs-backend]**
- [x] **Add "Clear all history" button to history page** — add the button at the top of the sessions list (hidden when list is empty). On click, show a confirmation: *"Delete all [N] conversations? This cannot be undone."* with **Delete all** and **Cancel** buttons. On confirm: call `DELETE /api/history?visitorId=...` → clear the sessions list in local state → show empty-state message. **[Agent: nextjs-frontend]**
- [x] **Verify Slice 4** — load Playwright via `ToolSearch` first. Save two conversations. Go to `/history` — confirm both are listed. Click "Clear all history", confirm — confirm all entries are removed and the empty-state message is shown. Repeat: save a session, go to `/history`, click "Clear all history", click "Cancel" — confirm entries are unchanged. **[Agent: nextjs-frontend]**

---

## Gaps & Recommendations

| Task / Slice | Issue | Recommendation |
|---|---|---|
| All Slices — Browser verification | Playwright MCP tools are deferred and must be loaded via `ToolSearch` before use | No installation needed — MCP is already configured. Each implementing agent must call `ToolSearch` first. |
