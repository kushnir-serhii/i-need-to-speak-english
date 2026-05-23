<!-- This document describes HOW to build the feature at an architectural level. -->

# Technical Specification: Usage Control & API Key Modes

- **Functional Specification:** [context/spec/005-usage-control-api-key-modes/functional-spec.md](./functional-spec.md)
- **Status:** Completed
- **Author(s):** Serhii Kushnir

---

## 1. High-Level Technical Approach

Extend `POST /api/chat` to enforce daily request limits server-side and support an optional client-supplied OpenAI API key. The route fetches the Visitor document, performs an inline daily reset if needed, checks the limit in Free mode, and streams the response. After the stream ends it appends a sentinel chunk carrying token counts, then fire-and-forgets a MongoDB `$inc` update for `dailyRequests` and `dailyTokens`.

On the frontend, `useSettingsStore` gains an `apiKey` field, `useChatStore` gains a session token counter, and the chat page gets a new `ChatStatusBar` component (mode label + counter) and a new `LimitReachedModal` (inline key-entry flow). A new Settings page provides the persistent key management UI.

No new npm packages are required. No Visitor schema changes are needed — `dailyTokens` already exists.

---

## 2. Proposed Solution & Implementation Plan

### 2.1 Shared Reset Utility

**`src/lib/db/resetIfNeeded.ts`**

A standalone function that accepts a Visitor document. It compares the document's `lastResetAt` date to the current UTC date; if a new day has started it applies `$set: { dailyRequests: 0, dailyTokens: 0, lastResetAt: <now> }` with a `lastResetAt: { $lt: todayStart }` condition guard (so only the first concurrent write wins) and returns the updated document. Both `POST /api/chat` and `GET /api/stats` call this function so reset logic cannot drift between routes.

---

### 2.2 Backend — `POST /api/chat` Changes

**Request body** (extended):

| Field | Type | Required | Notes |
|---|---|---|---|
| `messages` | `{ role, content }[]` | Yes | Existing — unchanged |
| `visitorId` | `string` | Yes | Existing — unchanged |
| `apiKey` | `string` | No | Present → Your Key mode; absent → Free mode |

**Route logic (step by step):**

1. Parse and validate body (existing validation unchanged).
2. Fetch Visitor by `visitorId` from MongoDB.
3. Call `resetIfNeeded(visitor)` — resets counters if a new UTC day has begun.
4. **Free mode** (no `apiKey` in body): check `dailyRequests >= dailyRequestLimit`. If exceeded → return `429 { error: "daily_limit_exceeded", dailyRequests, dailyRequestLimit }`.
5. **Your Key mode** (`apiKey` present): validate key format against `/^sk-[A-Za-z0-9\-_]{20,}$/`. If format invalid → return `400 { error: "invalid_api_key_format" }`.
6. Call `openai.chat.completions.create()` with `stream: true`, `stream_options: { include_usage: true }`, and `max_tokens: 1024`. Use the client-supplied key if present, otherwise the env key.
7. Stream text chunks to the client as before.
8. On the final OpenAI chunk (which carries `usage`), write one additional chunk to the response stream: `\n\x00USAGE:{"inputTokens":N,"outputTokens":N,"totalTokens":N}`, then close the stream.
9. Fire-and-forget `Visitor.findOneAndUpdate({ visitorId }, { $inc: { dailyRequests: 1, dailyTokens: totalTokens } })` with a `.catch` for logging.

**Error responses** (full table):

| Scenario | Status | `error` code |
|---|---|---|
| Missing / invalid `messages` | 400 | `invalid_request` |
| Last user message > 1000 chars | 400 | `message_too_long` |
| Missing `visitorId` | 400 | `missing_visitor_id` |
| Daily limit exceeded (Free mode) | 429 | `daily_limit_exceeded` |
| BYO key fails format check | 400 | `invalid_api_key_format` |
| BYO key rejected by OpenAI (HTTP 401) | 401 | `invalid_api_key` |
| `OPENAI_API_KEY` not set | 500 | `configuration_error` |
| Other OpenAI error | 502 | `upstream_error` |
| Unexpected error | 500 | `server_error` |

---

### 2.3 Backend — `GET /api/stats` Changes

Extend the response to include `dailyTokens`:

```
{ count, cap, dailyRequests, dailyRequestLimit, dailyTokens }
```

No other changes. The existing daily reset logic in this route is replaced by a call to the shared `resetIfNeeded` utility.

---

### 2.4 Frontend — State Changes

**`useSettingsStore`** — add one field:

| Field | Type | Default | Notes |
|---|---|---|---|
| `apiKey` | `string` | `""` | Empty = Free mode; non-empty = Your Key mode. Persisted to `intse-settings`. |

Add actions: `setApiKey(key: string)`, `clearApiKey()`.

**`useChatStore`** — add:

| Field | Type | Default | Notes |
|---|---|---|---|
| `sessionTokens` | `number` | `0` | Running total of tokens used in the current session. Not persisted. |

Add action: `addSessionTokens(n: number)` — adds to the running total.

The stream consumer in `ChatInput` (§2.5) parses the USAGE sentinel and calls `addSessionTokens`.

---

### 2.5 Frontend — `ChatInput.tsx` Changes

Four targeted changes to the existing component:

1. **Accept a `disabled` prop** (`boolean`). When `true`, the textarea and Send button are disabled (same styling as the existing empty-input state). The parent (`page.tsx`) computes and passes this prop.
2. **Include `apiKey` in the POST body.** Read `useSettingsStore.getState().apiKey` at submit time and include it in the request JSON if non-empty.
3. **Parse the USAGE sentinel.** In the stream reader loop, after decoding each chunk, check whether the decoded string contains `\x00`. If it does: split on `\x00`, pass the text portion to `appendChunk` as usual, parse the JSON after `USAGE:`, and call `useChatStore.getState().addSessionTokens(totalTokens)`. If no `\x00`, process normally.
4. **Map API key error codes** to a specific toast. On a `401 invalid_api_key` or `400 invalid_api_key_format` response, fire `toast('error', 'Your API key appears to be invalid. Please check it in Settings.')` instead of the generic error message.

---

### 2.6 Frontend — New `ChatStatusBar` Component

**`src/components/chat/ChatStatusBar.tsx`**

Pure `'use client'` component rendered in `page.tsx` between `ChatThread` and `ChatInput` (`flex-none`). Reads from three stores: `useSettingsStore` (`apiKey`), `useUserStore` (`dailyRequests`, `dailyRequestLimit`), `useChatStore` (`sessionTokens`).

| Mode | Left label | Right content |
|---|---|---|
| Free mode (`apiKey === ""`) | `"Free mode"` | `"N messages left today"` |
| Your Key mode (`apiKey !== ""`) | `"Using your key"` | `"N tokens used"` |

---

### 2.7 Frontend — New `LimitReachedModal` Component

**`src/components/ui/LimitReachedModal.tsx`**

A standalone `'use client'` modal (not reusing `ConfirmModal`) with its own local state. Rendered by `page.tsx` when `showLimitModal === true`. Internal state: `showKeyField: boolean`, `keyValue: string`.

**Initial view:**
- Message: *"You've reached your daily message limit. Come back tomorrow — or use your own AI key to continue now."*
- Buttons: "Enter your key" | "OK"

**After "Enter your key" is clicked (`showKeyField = true`):**
- A password-type text input appears for the key.
- "Save key" button: calls `useSettingsStore.setApiKey(keyValue)`, closes modal (parent sets `showLimitModal = false`).
- "Cancel" button: resets `showKeyField = false`.

"OK" closes the modal; the chat input remains disabled.

---

### 2.8 Frontend — Settings Page

**`src/app/(admin)/settings/page.tsx`**

New page under the existing `(admin)` layout (inherits sidebar, header, toast container, enrollment gate). Full settings shell scaffolded now; only the API key section is functional in this spec — remaining sections are present as empty heading placeholders.

**API Key section:**
- Section heading: *"Your AI Key"*
- Description: *"Paste your own OpenAI API key to remove daily message limits."*
- Password-type `<input>` bound to local state, pre-filled from `useSettingsStore.apiKey` (masked).
- "Save" button: calls `setApiKey(value)`, shows a success info toast.
- "Remove key" button (shown only when a key is present): calls `clearApiKey()`, shows a confirmation toast, returns the app to Free mode.

---

### 2.9 Frontend — `src/app/(admin)/page.tsx` Changes

1. Reads `dailyRequests`, `dailyRequestLimit` from `useUserStore` and `apiKey` from `useSettingsStore`.
2. Computes `isLimitReached = apiKey === "" && dailyRequests >= dailyRequestLimit`.
3. Renders `<ChatStatusBar />` between `<ChatThread />` and `<ChatInput />`.
4. Passes `disabled={isLimitReached}` to `<ChatInput />`.
5. Holds `showLimitModal: boolean` local state; sets it `true` when a 429 response is received from `ChatInput` (surfaced via an `onLimitReached` callback prop).
6. Renders `<LimitReachedModal />` when `showLimitModal === true`.

---

## 3. Impact and Risk Analysis

| Risk | Impact | Mitigation |
|---|---|---|
| User spoofs `dailyRequests` counter on the client | Bypasses limit | Limits are enforced server-side by reading MongoDB, never trusting client-passed values |
| BYO key stored in `localStorage` | Key visible in browser storage | Acceptable for a personal-use app; key never written to server logs; same risk profile as any OAuth token in localStorage |
| Fire-and-forget `$inc` fails silently | Counter drifts; user gets one extra message per failure | `.catch` logs the error; drift is bounded; no user-facing impact |
| USAGE sentinel `\x00` byte appears in real AI text | Corrupts sentinel parsing | `\x00` is outside the UTF-8 printable range and will never appear in OpenAI text completions |
| `resetIfNeeded` called concurrently from two browser tabs | Double reset could overwrite a freshly-incremented counter | `findOneAndUpdate` uses a `lastResetAt: { $lt: todayStart }` condition guard; only the first write wins |
| New settings route has no auth gate | Unenrolled visitors could reach it | The `(admin)` layout already wraps everything in `EnrollmentGate`; no additional guard needed |

---

## 4. Testing Strategy

```bash
# Start dev server
npm run dev
```

**Backend (curl):**
- Valid request in Free mode → streams normally; final bytes contain `\x00USAGE:`
- Request when `dailyRequests` is at limit (seed MongoDB) → `429 { error: "daily_limit_exceeded" }`
- Request with `apiKey: "bad"` → `400 { error: "invalid_api_key_format" }`
- Request with well-formed but invalid key → `401 { error: "invalid_api_key" }`
- `GET /api/stats` → response shape includes `dailyTokens`

**Frontend (Playwright):**
- Open app → `ChatStatusBar` shows "Free mode" and message count
- Send a message → count decrements immediately
- Simulate limit (seed DB to cap) → chat input disabled; `LimitReachedModal` appears
- Click "OK" → modal closes; input stays disabled
- Click "Enter your key", enter a key, click "Save key" → modal closes; input re-enables; label reads "Using your key"
- Navigate to `/settings` → enter and save a key → mode switches in chat; remove key → reverts to Free mode
- In Your Key mode, send a message → token counter increments in status bar
- Force an invalid key → toast reads "Your API key appears to be invalid. Please check it in Settings."
