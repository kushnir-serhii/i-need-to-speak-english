# Tasks: Usage Control & API Key Modes

- **Spec:** [functional-spec.md](./functional-spec.md) · [technical-considerations.md](./technical-considerations.md)
- **Status:** Ready for implementation

---

- [x] **Slice 1: ChatStatusBar — mode label + message counter (no enforcement yet)**
  - [x] Add `apiKey: string` (default `""`) and actions `setApiKey`, `clearApiKey` to `src/store/useSettingsStore.ts`. Persisted under the existing `intse-settings` key. **[Agent: nextjs-frontend]**
  - [x] Add `sessionTokens: number` (default `0`, not persisted) and action `addSessionTokens(n: number)` to `src/store/useChatStore.ts`. **[Agent: nextjs-frontend]**
  - [x] Create `src/components/chat/ChatStatusBar.tsx` — `'use client'`; reads `useSettingsStore.apiKey`, `useUserStore.dailyRequests`, `useUserStore.dailyRequestLimit`, `useChatStore.sessionTokens`; renders left label ("Free mode" or "Using your key") and right content ("N messages left today" or "N tokens used"). **[Agent: nextjs-frontend]**
  - [x] Update `src/app/(admin)/page.tsx` — render `<ChatStatusBar />` between `<ChatThread />` and `<ChatInput />` (`flex-none`). **[Agent: nextjs-frontend]**
  - [x] Verify with Playwright: navigate to `http://localhost:3000`; confirm the status bar is visible below the chat thread; confirm it shows "Free mode" and a message count that matches `dailyRequestLimit - dailyRequests` from the user store; send a message and confirm the count does NOT yet decrement (enforcement is not wired yet — this slice is UI only). **[Agent: nextjs-frontend]**

---

- [x] **Slice 2: Settings page with API key field**
  - [x] Create `src/app/(admin)/settings/page.tsx` — `'use client'`; full settings shell with a title and section layout consistent with the admin layout; one functional section ("Your AI Key") containing: a description paragraph, a password-type `<input>` pre-filled from `useSettingsStore.apiKey`, a "Save" button that calls `setApiKey(value)` and fires an info toast, and a "Remove key" button (shown only when `apiKey !== ""`) that calls `clearApiKey()` and fires a confirmation toast; remaining future sections scaffolded as empty headings. **[Agent: nextjs-frontend]**
  - [x] Verify with Playwright: navigate to `/settings`; confirm the API key section is visible; paste a dummy key and click "Save" — confirm the mode label in the chat status bar switches to "Using your key"; return to settings and click "Remove key" — confirm the label reverts to "Free mode". **[Agent: nextjs-frontend]**

---

- [x] **Slice 3: Backend — daily reset utility + limit enforcement in `POST /api/chat` + extended `GET /api/stats`**
  - [x] Create `src/lib/db/resetIfNeeded.ts` — accepts a Visitor document; compares `lastResetAt` to the current UTC midnight; if a new day has begun, applies `findOneAndUpdate` with `$set: { dailyRequests: 0, dailyTokens: 0, lastResetAt: <todayStart> }` guarded by `lastResetAt: { $lt: todayStart }` (so concurrent calls don't double-reset); returns the fresh document. **[Agent: nextjs-backend]**
  - [x] Update `src/app/api/chat/route.ts` — after validating the request body: (1) fetch Visitor by `visitorId`; (2) call `resetIfNeeded(visitor)`; (3) if no `apiKey` in body (Free mode) and `dailyRequests >= dailyRequestLimit`, return `429 { error: "daily_limit_exceeded", dailyRequests, dailyRequestLimit }`; leave all other route logic unchanged for now. **[Agent: nextjs-backend]**
  - [x] Update `src/app/api/stats/route.ts` — replace the inline reset logic with a call to `resetIfNeeded`; add `dailyTokens` to the response shape. **[Agent: nextjs-backend]**
  - [x] Verify with `curl` (run `npm run dev` first):
    - Seed a test visitor in MongoDB so `dailyRequests === dailyRequestLimit`; `POST /api/chat` with that `visitorId` and no `apiKey` → `429 { "error": "daily_limit_exceeded" }`
    - `GET /api/stats?visitorId=<id>` → response includes `dailyTokens`
    - Normal request (under limit) → still streams correctly
    **[Agent: nextjs-backend]**

---

- [x] **Slice 4: Frontend handles 429 — disabled input + LimitReachedModal (static, OK button only)**
  - [x] Update `ChatInput.tsx` — accept a `disabled: boolean` prop; when `true`, apply the same `disabled` attribute and `opacity-40 cursor-not-allowed` styling to the textarea and Send button that the empty-input state already uses. **[Agent: nextjs-frontend]**
  - [x] Create `src/components/ui/LimitReachedModal.tsx` — `'use client'`; standalone modal (not `ConfirmModal`); renders the message "You've reached your daily message limit. Come back tomorrow — or use your own AI key to continue now." with two buttons: "Enter your key" (no-op for now — wired in Slice 5) and "OK" (calls an `onClose` prop); accepts `isOpen: boolean` and `onClose: () => void` props. **[Agent: nextjs-frontend]**
  - [x] Update `src/app/(admin)/page.tsx` — (1) compute `isLimitReached = useSettingsStore(s => s.apiKey) === "" && dailyRequests >= dailyRequestLimit`; (2) pass `disabled={isLimitReached}` to `<ChatInput />`; (3) add `onLimitReached` callback prop to `ChatInput` (called when the route returns 429) that sets local `showLimitModal = true`; (4) render `<LimitReachedModal isOpen={showLimitModal} onClose={() => setShowLimitModal(false)} />`. **[Agent: nextjs-frontend]**
  - [x] Update `ChatInput.tsx` — call the `onLimitReached` callback (if provided) when the API response status is 429, instead of showing the generic error toast. **[Agent: nextjs-frontend]**
  - [x] Verify with Playwright: seed a visitor at the daily limit; open `http://localhost:3000`; confirm the input is disabled; click "OK" in the modal → modal closes, input stays disabled. **[Agent: nextjs-frontend]**

---

- [x] **Slice 5: LimitReachedModal — "Enter your key" inline key entry flow**
  - [x] Update `LimitReachedModal.tsx` — add local state `showKeyField: boolean` and `keyValue: string`; "Enter your key" button sets `showKeyField = true`; when `showKeyField` is true, render a password-type `<input>` bound to `keyValue`, a "Save key" button (calls `useSettingsStore.getState().setApiKey(keyValue)` then `onClose()`), and a "Cancel" button (resets `showKeyField = false`). **[Agent: nextjs-frontend]**
  - [x] Verify with Playwright: at the daily limit → modal appears → click "Enter your key" → key entry field appears → enter any non-empty string → click "Save key" → modal closes → status bar switches to "Using your key" → chat input becomes enabled. **[Agent: nextjs-frontend]**

---

- [x] **Slice 6: BYO key in `POST /api/chat` + token tracking (backend + frontend)**
  - [x] Update `src/app/api/chat/route.ts` — (1) if `apiKey` is present in the body: validate format against `/^sk-[A-Za-z0-9\-_]{20,}$/`; if invalid, return `400 { error: "invalid_api_key_format" }`; skip the daily limit check; instantiate a one-off `new OpenAI({ apiKey })` (do not modify the singleton in `src/lib/openai.ts`); (2) add `stream_options: { include_usage: true }` to the `chat.completions.create` call; (3) after the final text chunk, write `\n\x00USAGE:{"inputTokens":N,"outputTokens":N,"totalTokens":N}` to the stream before closing; (4) fire-and-forget `Visitor.findOneAndUpdate({ visitorId }, { $inc: { dailyRequests: 1, dailyTokens: totalTokens } }).catch(console.error)`; (5) catch OpenAI HTTP 401 → return `401 { error: "invalid_api_key" }`. **[Agent: nextjs-backend]**
  - [x] Update `ChatInput.tsx` — at submit time, read `useSettingsStore.getState().apiKey` and include it as `apiKey` in the POST body if non-empty; in the stream reader loop, after decoding each chunk, check whether the string contains `\x00`; if yes, split on `\x00`, pass the text portion to `appendChunk`, parse the JSON after `USAGE:`, and call `useChatStore.getState().addSessionTokens(parsed.totalTokens)`; if no `\x00`, process the chunk normally. **[Agent: nextjs-frontend]**
  - [x] Verify with `curl`: `POST /api/chat` with a valid `apiKey` and an under-limit visitor → streams normally; final bytes contain `\x00USAGE:`; verify `dailyTokens` incremented in MongoDB after the request. **[Agent: nextjs-backend]**
  - [x] Verify with Playwright: switch to Your Key mode (enter a real key in settings); send a message → status bar shows "Using your key — N tokens used"; send a second message → token count increases; open DevTools Network tab and confirm `POST /api/chat` body contains the `apiKey` field. **[Agent: nextjs-frontend]**

---

- [x] **Slice 7: Invalid key error message + cumulative token display on settings page + final build**
  - [x] Update `ChatInput.tsx` — on `400 invalid_api_key_format` or `401 invalid_api_key` response, fire `toast('error', 'Your API key appears to be invalid. Please check it in Settings.')` instead of the generic error toast. **[Agent: nextjs-frontend]**
  - [x] Update `src/app/(admin)/settings/page.tsx` — in the "Your AI Key" section, add a read-only display below the key input showing cumulative session tokens from `useChatStore.sessionTokens` (e.g. "Tokens used this session: N"); visible only when `apiKey !== ""`. **[Agent: nextjs-frontend]**
  - [x] Run `npm run build` — confirm zero TypeScript errors. **[Agent: general-purpose]**
  - [x] Verify with Playwright: in Your Key mode, manually set an invalid key via DevTools console (`useSettingsStore.getState().setApiKey('sk-bad')`) → send a message → confirm the toast reads exactly "Your API key appears to be invalid. Please check it in Settings." and the failed message remains visible in the thread; navigate to `/settings` → confirm the session token count is displayed. **[Agent: nextjs-frontend]**
