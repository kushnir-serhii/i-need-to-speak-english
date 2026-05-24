# Technical Specification: Per-Message Controls

- **Functional Specification:** [context/spec/008-per-message-controls/functional-spec.md](context/spec/008-per-message-controls/functional-spec.md)
- **Status:** Draft
- **Author(s):** Serhii Kushnir

---

## 1. High-Level Technical Approach

This feature is entirely client-side. No new API routes, no database changes. The work consists of:

1. Adding `ttsSpeed` to the settings store and `deleteMessage` to the chat store.
2. Extending `useTTS` with speed application and a `repeat` function.
3. Creating a new `MessageMenu` component (the three-dot menu panel).
4. Extending `MessageBubble` to mount `MessageMenu` and accept the necessary callbacks and TTS props.
5. Threading the new props and callbacks from the page level through `ChatThread` down to each `MessageBubble`.

No architectural changes are needed. All new data (speed, voice) persists automatically via the Zustand `persist` middleware already on `useSettingsStore`.

---

## 2. Proposed Solution & Implementation Plan

### 2.1 Store Changes

**`useSettingsStore` (`src/store/useSettingsStore.ts`)**

Add to `SettingsState`:

| Field / Action | Type | Default | Notes |
|---|---|---|---|
| `ttsSpeed` | `number` | `1` | Bounded 0.5–2.0, enforced in the setter |
| `setTtsSpeed(speed)` | `(number) => void` | — | Clamps input before storing |

Because the store already uses `persist` with key `'intse-settings'`, `ttsSpeed` is persisted automatically. Existing users without the key stored will receive the default of `1`.

Speed is language-agnostic; the existing `setTargetLanguage` action (which resets `selectedVoiceURI` to `null`) does not need to touch `ttsSpeed`.

**`useChatStore` (`src/store/useChatStore.ts`)**

Add to `ChatState`:

| Action | Signature | Notes |
|---|---|---|
| `deleteMessage` | `(id: string) => void` | Filters the message from `messages`; if the deleted id matches `speakingMessageId`, also sets `speakingMessageId` to `null` in the same update |

Chat history has no persistence in Phase 3 (no `persist` middleware on this store), so the delete only affects the in-memory store. The action signature is forward-compatible with Phase 4, which will extend it to also remove the record from IndexedDB without changing callers.

---

### 2.2 Hook Changes — `useTTS` (`src/hooks/useTTS.ts`)

**Apply speed to utterances**

Inside `_drain`, when constructing the `SpeechSynthesisUtterance`, read `ttsSpeed` from `useSettingsStore.getState()` at speak time (same `getState()` pattern already used for `selectedVoiceURI`) and assign it to `utterance.rate`. Speed is read at the moment of utterance creation, not reactively — this means adjusting the slider mid-playback takes effect on the next utterance only (current speech plays at its originally set rate). This is acceptable behaviour.

**New `repeat` function**

Add `repeat(id: string, text: string): void` to `UseTTSReturn`. Unlike `speak`, which skips if the same id is already queued, `repeat` must force re-play:

1. Call `stop()` to cancel current speech and flush the queue.
2. Push `{ id, text }` onto the now-empty queue.
3. Call `_drain()` immediately.

`repeat` returns early when `!isSupported`. It does not check `ttsEnabled` — the caller (`MessageMenu`) is responsible for not rendering the Repeat option when TTS is off. This keeps the hook free of UI policy decisions.

---

### 2.3 New Component — `MessageMenu` (`src/components/chat/MessageMenu.tsx`)

**Props interface**

| Prop | Type | Notes |
|---|---|---|
| `role` | `'user' \| 'assistant'` | Determines which menu items to render |
| `content` | `string` | The message text; used for Copy |
| `ttsEnabled` | `boolean` | When false, Repeat is omitted entirely |
| `voices` | `SpeechSynthesisVoice[]` | Filtered list from `useTTS` for the Voice dropdown |
| `ttsSpeed` | `number` | Current speed; drives the slider display |
| `selectedVoiceURI` | `string \| null` | Current selection; drives the Voice dropdown |
| `onRepeat` | `() => void` | Calls `repeat(id, content)` in the parent |
| `onDelete` | `() => void` | Calls `deleteMessage(id)` in the parent |
| `onSpeedChange` | `(speed: number) => void` | Calls `setTtsSpeed` in the parent |
| `onVoiceChange` | `(uri: string) => void` | Calls `setSelectedVoiceURI` in the parent |

**Menu configurations**

| Context | Items shown |
|---|---|
| AI message, TTS on | Repeat, Speed, Voice, Copy, Delete |
| AI message, TTS off | Speed, Voice, Copy, Delete (Repeat omitted, not disabled) |
| User message | Copy, Delete only |

**Open / close behaviour**

Open state is local `useState<boolean>` inside `MessageMenu`. The three-dot trigger toggles it. A `useEffect` on `isOpen === true` attaches a `mousedown` listener on `document`; the handler checks `menuRef.current.contains(event.target)` and calls `setIsOpen(false)` if outside. The effect cleans up the listener on teardown. Each `MessageMenu` instance manages its own listener — no global singleton needed.

**Speed inline expansion**

Clicking the "Speed" item toggles a local `isSpeedOpen: boolean`. When expanded, a range input (`min="0.5" max="2" step="0.1"`) renders inline within the menu panel, beneath the Speed label. The current speed value is displayed next to the label (e.g., "Speed 1.0×"). Expanding Speed does not close the menu. Voice follows the same pattern with a separate `isVoiceOpen` boolean, rendering a list of voice names when expanded. Selecting a voice calls `onVoiceChange`, then collapses the expansion.

**Copy confirmation**

Local `copied: boolean` state, initially false. On click: call `navigator.clipboard.writeText(content)`, then set `copied` to true and schedule a `setTimeout` (1500 ms) to reset it. While `copied` is true, the label reads "Copied!" instead of "Copy". The `setTimeout` id is stored in a `ref` and cleared on unmount.

Note: `navigator.clipboard.writeText` requires a secure context (HTTPS or localhost). In production on Vercel this is always satisfied. No fallback is needed for MVP.

**Three-dot button position**

Absolutely positioned within the message bubble's relative container. On AI (left-aligned) bubbles: top-right corner. On user (right-aligned) bubbles: top-left corner, to avoid visual conflict with the right-aligned layout.

---

### 2.4 Modified Component — `MessageBubble` (`src/components/chat/MessageBubble.tsx`)

Extend `MessageBubbleProps` with all props required by `MessageMenu` plus `onRepeat` and `onDelete`. The component does not read from any store directly — all data arrives as props, consistent with the existing pattern for `isSpeaking`. The bubble div already has `relative` positioning (used by the speaking pulse icon); the three-dot button and menu panel anchor to this container. `MessageBubble` passes `message.content` as the `content` prop to `MessageMenu`.

---

### 2.5 Prop Threading

**Where `useTTS` lives:** called once at the page level (`src/app/(admin)/page.tsx`) to ensure a single queue and a single `speakingMessageId` owner.

**Data flow:**

```
page.tsx
  ↳ reads from useSettingsStore: ttsEnabled, ttsSpeed, selectedVoiceURI, setTtsSpeed, setSelectedVoiceURI
  ↳ reads from useChatStore: messages, speakingMessageId, deleteMessage
  ↳ reads from useTTS: voices, repeat
  ↓
ChatThread (props: voices, ttsEnabled, ttsSpeed, selectedVoiceURI, repeat, onSpeedChange, onVoiceChange)
  ↳ maps messages → constructs per-message onRepeat, onDelete closures
  ↓
MessageBubble (per-message: onRepeat, onDelete + shared TTS props)
  ↓
MessageMenu
```

`onSpeedChange` and `onVoiceChange` are stable `useCallback` references at the page level (they call store setters and close over nothing that changes). `onRepeat` and `onDelete` are constructed per-message inside `ChatThread`'s map — new references each render, which is acceptable at current scale. If performance becomes a concern, `MessageBubble` can be wrapped in `React.memo` later.

---

## 3. Impact and Risk Analysis

**System Dependencies**

- `useSettingsStore` — adds `ttsSpeed`; existing `selectedVoiceURI` logic is unchanged.
- `useChatStore` — adds `deleteMessage`; when Phase 4 adds IndexedDB persistence, `deleteMessage` must be extended to also remove the record there.
- `useTTS` — adds `repeat` and speed application; `speak` and `stop` are unchanged.
- `MessageBubble` — new props added; existing rendering is unchanged.
- No backend routes or MongoDB changes.

**Potential Risks & Mitigations**

| Risk | Mitigation |
|---|---|
| Deleting the currently-speaking message leaves a phantom speaking state | `deleteMessage` resets `speakingMessageId` to `null` in the same store update |
| Speed slider changes mid-utterance have no effect on the current speech | Expected behaviour; documented in spec. Only the next utterance picks up the new rate. |
| Voice list is empty on first render (Chrome loads voices async) | Already handled in `useTTS` via `voiceschanged` event listener; Voice dropdown will simply show an empty list until voices load |
| Menu panel clips off-screen on last messages in the thread | Acceptable for MVP with fixed "below" positioning; can be addressed with a viewport-aware placement utility in a later pass |
| `navigator.clipboard.writeText` fails on non-secure contexts | Production (Vercel) is always HTTPS; no mitigation needed for MVP |

---

## 4. Testing Strategy

This feature has no server-side logic, so all testing is manual in the browser:

- **Three-dot menu:** Verify button is visible on all message bubbles (both user and AI). Verify menu opens on tap/click and closes on outside tap/click.
- **AI menu items:** With TTS on — verify all 5 items are present. With TTS off — verify Repeat is absent.
- **User menu items:** Verify only Copy and Delete are shown.
- **Repeat:** Enable TTS, receive an AI reply, open menu, tap Repeat — confirm the message is read aloud from the start.
- **Speed:** Move slider to 0.5×, tap Repeat — confirm audibly slower speech. Refresh page — confirm slider restores to saved value.
- **Voice:** Switch to a different voice, tap Repeat — confirm the new voice is used. Open Settings — confirm the same voice is selected there.
- **Copy:** Tap Copy — confirm "Copied!" label appears briefly; paste into another app to verify text is correct.
- **Delete (AI):** Tap Delete on an AI message — confirm bubble disappears immediately. Confirm adjacent messages are unaffected.
- **Delete (user):** Same as above for a user message.
- **Delete while speaking:** With TTS actively reading a message, delete that message — confirm speech stops and the bubble is removed.
- **Cross-browser:** Verify TTS behaviour (voices, speed) in Chrome and Firefox. Verify Copy works on both.
