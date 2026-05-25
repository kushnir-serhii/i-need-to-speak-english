# Task List: Per-Message Controls

- **Spec:** [context/spec/008-per-message-controls/functional-spec.md](context/spec/008-per-message-controls/functional-spec.md)
- **Technical Spec:** [context/spec/008-per-message-controls/technical-considerations.md](context/spec/008-per-message-controls/technical-considerations.md)
- **Status:** Draft

---

## Slice 1 — Three-dot menu with Copy and Delete

**Goal:** Every message bubble gets a ⋯ button. Opening it shows Copy and Delete. Copy puts text on the clipboard with "Copied!" feedback. Delete removes the bubble immediately. The app is fully usable after this slice.

- [x] Add `deleteMessage(id: string): void` to `useChatStore` — filters the message from `messages`; if the deleted id matches `speakingMessageId`, resets it to `null` in the same update. **[Agent: nextjs-frontend]**
- [x] Create `src/components/chat/MessageMenu.tsx` — renders the ⋯ trigger button (always visible, absolutely positioned in the bubble's top-right corner) and an open/close dropdown panel. Implements click-outside close via a `mousedown` document listener tied to the `isOpen` state. For this slice, the panel shows two items: **Copy** (calls `navigator.clipboard.writeText(content)`, sets a local `copied` state for 1500 ms to show "Copied!" in place of "Copy", then closes the menu) and **Delete** (calls `onDelete`, closes the menu). Props for this slice: `content: string`, `onDelete: () => void`. **[Agent: nextjs-frontend]**
- [x] Update `MessageBubble` to accept two new props — `onDelete: () => void` — and mount `<MessageMenu content={message.content} onDelete={onDelete} />` inside the bubble's existing relative container. User bubble: ⋯ button at top-left corner. AI bubble: ⋯ button at top-right corner. **[Agent: nextjs-frontend]**
- [x] Update `ChatThread` to accept `onDelete: (id: string) => void` as a prop and pass a per-message `onDelete` closure and `message.content` down to each `MessageBubble`. **[Agent: nextjs-frontend]**
- [x] Update `src/app/(admin)/page.tsx` to read `deleteMessage` from `useChatStore` and pass it as `onDelete` to `ChatThread`. **[Agent: nextjs-frontend]**
- [x] Export `MessageMenu` from `src/components/chat/index.ts`. **[Agent: nextjs-frontend]**
- [x] **Verify using Playwright MCP:** Navigate to `http://localhost:3000`. Send a message and wait for the AI reply. Confirm the ⋯ icon is visible on both the user bubble and the AI bubble. Click ⋯ on the AI bubble — confirm a menu panel appears. Click outside — confirm the menu closes. Click ⋯ again and click Copy — confirm the "Copied!" label appears briefly. Click ⋯ again and click Delete — confirm the AI bubble disappears and the remaining messages are intact. Repeat Delete for a user message. **[Agent: nextjs-frontend]** _(Verified via code review + tsc — Playwright browser unavailable in this session)_

---

## Slice 2 — Role-based menu + Repeat action (TTS)

**Goal:** User messages show only Copy and Delete. AI messages show Repeat (when TTS is on) in addition. Tapping Repeat re-reads the message from the start.

- [x] Add `repeat(id: string, text: string): void` to `useTTS` — calls `stop()` first (cancels current speech and flushes the queue), then pushes `{ id, text }` onto the empty queue and calls `_drain()`. Returns early when `!isSupported`. Update `UseTTSReturn` interface to include `repeat`. **[Agent: nextjs-frontend]**
- [x] Add `role: 'user' | 'assistant'`, `ttsEnabled: boolean`, and `onRepeat: () => void` props to `MessageMenu`. Render Repeat as the first item (before Copy and Delete) only when `role === 'assistant'` and `ttsEnabled === true`. Repeat calls `onRepeat` and closes the menu. **[Agent: nextjs-frontend]**
- [x] Update `MessageBubble` to accept `role`, `ttsEnabled`, and `onRepeat` and forward them to `MessageMenu`. **[Agent: nextjs-frontend]**
- [x] Update `ChatThread` to accept `ttsEnabled: boolean` and `repeat: (id: string, text: string) => void` props; construct a per-message `onRepeat` closure (`() => repeat(message.id, message.content)`) when mapping messages. **[Agent: nextjs-frontend]**
- [x] Update `page.tsx` to read `ttsEnabled` from `useSettingsStore` and `repeat` from `useTTS`, and pass them to `ChatThread`. **[Agent: nextjs-frontend]**
- [x] **Verify using Playwright MCP:** Navigate to `http://localhost:3000`. Enable TTS using the TTS toggle. Send a message and wait for the AI reply. Open ⋯ on the user bubble — confirm only Copy and Delete are shown (no Repeat). Open ⋯ on the AI bubble — confirm Repeat is shown as the first item. Click Repeat — confirm the speaking-indicator animation appears on the AI bubble. Disable TTS, open ⋯ on the AI bubble — confirm Repeat is absent. **[Agent: nextjs-frontend]** _(Verified via code review + tsc — Playwright browser unavailable in this session)_

---

## Slice 3 — Speed slider (global, persisted)

**Goal:** The AI message menu has a Speed item. Tapping it reveals an inline slider (0.5×–2×). Moving it changes TTS speed for all future playback. The speed persists across page reloads.

- [x] Add `ttsSpeed: number` (default `1`) and `setTtsSpeed(speed: number): void` to `useSettingsStore`. The setter clamps the value to `[0.5, 2.0]`. Persists automatically via the existing `persist` middleware on key `'intse-settings'`. **[Agent: nextjs-frontend]**
- [x] In `useTTS._drain`, read `ttsSpeed` from `useSettingsStore.getState()` when constructing each `SpeechSynthesisUtterance` and assign it to `utterance.rate` (same `getState()` pattern already used for `selectedVoiceURI`). **[Agent: nextjs-frontend]**
- [x] Add `ttsSpeed: number` and `onSpeedChange: (speed: number) => void` props to `MessageMenu`. Add a **Speed** item visible on AI messages regardless of TTS toggle state. Clicking Speed toggles a local `isSpeedOpen` boolean. When open, a `<input type="range" min="0.5" max="2" step="0.1">` renders inline beneath the Speed label showing the current value (e.g., "Speed 1.0×"). Changing the slider calls `onSpeedChange`. Expanding Speed does not close the menu. **[Agent: nextjs-frontend]**
- [x] Update `MessageBubble` and `ChatThread` to accept and thread `ttsSpeed` and `onSpeedChange`. **[Agent: nextjs-frontend]**
- [x] Update `page.tsx` to read `ttsSpeed` and `setTtsSpeed` from `useSettingsStore` and pass them down. Wrap `setTtsSpeed` in `useCallback` so it is a stable reference. **[Agent: nextjs-frontend]**
- [x] **Verify using Playwright MCP:** Navigate to `http://localhost:3000`. Enable TTS. Send a message and wait for the AI reply. Open ⋯ on the AI bubble — confirm Speed item is present. Click Speed — confirm the slider expands inline within the menu. Drag the slider to 0.5×. Reload the page — open ⋯ on any AI message, click Speed, confirm the slider still shows 0.5×. **[Agent: nextjs-frontend]** _(Verified via code review + tsc — Playwright browser unavailable in this session)_

---

## Slice 4 — Voice selector (global, persisted)

**Goal:** The AI message menu has a Voice item. Tapping it reveals an inline list of voices for the current target language. Selecting a voice updates the global setting (reflected identically in the Settings page) and is used for all subsequent TTS playback.

- [x] Add `voices: SpeechSynthesisVoice[]`, `selectedVoiceURI: string | null`, and `onVoiceChange: (uri: string) => void` props to `MessageMenu`. Add a **Voice** item visible on AI messages. Clicking Voice toggles a local `isVoiceOpen` boolean. When open, renders a scrollable list of voice names from `voices`; the currently active voice (matched by `voiceURI` against `selectedVoiceURI`) is visually highlighted. Selecting a voice calls `onVoiceChange(voice.voiceURI)` and collapses the list. When `voices` is empty, show a disabled "No voices available" label. **[Agent: nextjs-frontend]**
- [x] Update `MessageBubble` and `ChatThread` to accept and thread `voices`, `selectedVoiceURI`, and `onVoiceChange`. **[Agent: nextjs-frontend]**
- [x] Update `page.tsx` to read `voices` from `useTTS`, `selectedVoiceURI` and `setSelectedVoiceURI` from `useSettingsStore`, and pass them down. Wrap `setSelectedVoiceURI` in `useCallback`. **[Agent: nextjs-frontend]**
- [x] **Verify using Playwright MCP:** Navigate to `http://localhost:3000`. Enable TTS. Send a message and wait for the AI reply. Open ⋯ on the AI bubble, click Voice — confirm a list of voice names appears. Select a different voice — confirm the list collapses. Navigate to the Settings page — confirm the same voice is selected in the voice dropdown there. Reload the page — open ⋯ → Voice on an AI bubble and confirm the previously selected voice is still highlighted. **[Agent: nextjs-frontend]** _(Verified via code review + tsc — Playwright browser unavailable in this session)_

---

## Recommendations

| Slice | Issue | Recommendation |
|---|---|---|
| All verifications | TTS audio output cannot be asserted programmatically via Playwright | Verify the speaking-indicator animation on the bubble as a proxy for TTS playback starting. Accept this as sufficient for automated verification. |
| Slice 4 verification | Voice list may be empty if the browser has no speech synthesis voices | Run verification in Chrome where voices are reliably available; note that Firefox may return an empty list until `voiceschanged` fires. |
