# Technical Specification: Speech Output (TTS)

- **Functional Specification:** [context/spec/007-speech-output-tts/functional-spec.md](context/spec/007-speech-output-tts/functional-spec.md)
- **Status:** Completed
- **Author(s):** Serhii Kushnir

---

## 1. High-Level Technical Approach

This feature is entirely client-side. It uses the browser's built-in Speech Synthesis API (`window.speechSynthesis`) — no external service, no backend changes, and no new dependencies.

The work is organized around three concerns:

1. **A new `useTTS` hook** (`src/hooks/useTTS.ts`) that owns all speech synthesis interactions: voice catalogue management, playback queue, and the `speakingMessageId` side effect in the chat store.
2. **Store additions** to `useSettingsStore` (TTS on/off, selected voice URI) and `useChatStore` (which message is currently being spoken).
3. **UI additions**: a `TTSButton` in the chat toolbar, a speaking indicator on `MessageBubble`, and a TTS section in the Settings page.

Systems affected: `useSettingsStore`, `useChatStore`, `ChatInput`, `MessageBubble`, `ChatThread`, the chat page, and the Settings page. No API routes or MongoDB changes are required.

---

## 2. Proposed Solution & Implementation Plan

### 2.1 Store Changes

**`useSettingsStore`** — `src/store/useSettingsStore.ts`

Four new persisted fields are added:

| Field | Type | Default | Purpose |
|---|---|---|---|
| `ttsEnabled` | `boolean` | `false` | Global auto-play on/off |
| `selectedVoiceURI` | `string \| null` | `null` | URI of user-chosen voice; `null` = use language default |
| `setTtsEnabled` | action | — | Toggles `ttsEnabled` |
| `setSelectedVoiceURI` | action | — | Stores the chosen voice URI |

A new `setTargetLanguage` action is added that atomically sets `targetLanguage` **and** resets `selectedVoiceURI` to `null`. This replaces any direct assignment to `targetLanguage` so that a stored voice URI for one language is never applied to another. `voiceURI` (an opaque browser string) is used instead of the human-readable voice name because it is stable across OS updates.

No Zustand migration strategy is needed — the `persist` middleware fills missing keys with defaults on first read.

**`useChatStore`** — `src/store/useChatStore.ts`

One new transient (non-persisted) field:

| Field | Type | Default | Purpose |
|---|---|---|---|
| `speakingMessageId` | `string \| null` | `null` | ID of the message being spoken |
| `setSpeakingMessageId` | action | — | Set/clear the speaking message |

This field is not persisted because it is session-only UI state. It lives in the chat store (not settings store) so `MessageBubble` can subscribe to it cheaply without prop-drilling through `ChatThread`.

---

### 2.2 New Hook: `useTTS`

**File:** `src/hooks/useTTS.ts`

Owns all interaction with `window.speechSynthesis`. Instantiated once at the chat page level — a single consumer per page.

**Accepted options:**

```
{ targetLanguage: string }   // e.g. "English", read from useSettingsStore
```

**Internal state (refs, not component state, to avoid re-renders):**

| Ref | Type | Purpose |
|---|---|---|
| `allVoices` | `SpeechSynthesisVoice[]` | Full catalogue from `getVoices()` |
| `queue` | `Array<{ id: string; text: string }>` | Pending utterances |
| `isPlaying` | `boolean` | Guards re-entrant drain calls |

**Returned interface:**

| Member | Type | Description |
|---|---|---|
| `isSupported` | `boolean` | `typeof window.speechSynthesis !== 'undefined'` |
| `voices` | `SpeechSynthesisVoice[]` | Filtered to the target language's BCP47 prefix |
| `speak` | `(id, text) => void` | Enqueues an utterance and drains |
| `stop` | `() => void` | Cancels all playback, clears queue |

**Browser events handled:**

- `speechSynthesis.onvoiceschanged` — Chrome/Edge populate the voice list asynchronously; the hook calls `getVoices()` both on mount (Firefox fallback) and inside this handler (Chrome/Edge).
- `SpeechSynthesisUtterance.onend` — clears `speakingMessageId`, sets `isPlaying = false`, drains next queued item.
- `SpeechSynthesisUtterance.onerror` — same cleanup as `onend`; logs to console in development. Skips the failed utterance and drains the next.

**On unmount:** calls `speechSynthesis.cancel()`, removes the `voiceschanged` listener, and calls `setSpeakingMessageId(null)`.

---

### 2.3 TTS Playback Queue

The queue is a `useRef` array inside `useTTS`. Mutations don't trigger re-renders; reads happen only inside the drain callback.

| Event | Action |
|---|---|
| `speak(id, text)` called | Push to queue tail; call `_drain()`. If `id` already in queue, skip (duplicate guard). |
| `_drain()`, `isPlaying = true` | No-op — current utterance's `onend` will drain next. |
| `_drain()`, `isPlaying = false`, queue empty | No-op. |
| `_drain()`, `isPlaying = false`, queue non-empty | Shift first item; set `isPlaying = true`; set `speakingMessageId`; resolve voice; call `speechSynthesis.speak(utterance)`. |
| `onend` or `onerror` fires | Set `isPlaying = false`; clear `speakingMessageId`; call `_drain()`. |
| `stop()` called | `speechSynthesis.cancel()`; clear queue in-place; set `isPlaying = false`; clear `speakingMessageId`. |

**Voice resolution order inside `_drain()`:**
1. `selectedVoiceURI` from store is non-null and matches a voice in the filtered list → use it.
2. Filtered list is non-empty → use `filtered[0]` (browser default for that language).
3. Neither → pass `null` (browser uses its own system default voice silently).

---

### 2.4 New Component: `TTSButton`

**File:** `src/components/chat/TTSButton.tsx`

**Props:**

| Prop | Type | Description |
|---|---|---|
| `isEnabled` | `boolean` | Whether TTS auto-play is on |
| `isSupported` | `boolean` | From `useTTS.isSupported` |
| `disabled` | `boolean` | Disable during streaming |
| `onClick` | `() => void` | Calls `setTtsEnabled(!isEnabled)` |

**Visual states:**

| Condition | Rendering |
|---|---|
| `!isSupported` | Returns `null` — nothing rendered |
| `isEnabled = false` | Speaker icon, muted color, hover lightens |
| `isEnabled = true` | Speaker icon, accent blue (`text-[#2F81F7]`) |
| `disabled = true` | Reduced opacity, `cursor-not-allowed` |

Icon: speaker SVG (18×18) matching `STTButton` sizing. `aria-label` toggles between `'Enable text-to-speech'` and `'Disable text-to-speech'`.

---

### 2.5 Changes to `ChatInput`

**File:** `src/components/chat/ChatInput.tsx`

New props accepted from the chat page:

| Prop | Type | Description |
|---|---|---|
| `speak` | `(id: string, text: string) => void` | From `useTTS` |
| `stop` | `() => void` | From `useTTS` |
| `isSupported` | `boolean` | From `useTTS` |

**Toolbar insertion order** (right side, left to right): `STTButton` → `AutoDialogToggle` → `TTSButton` → Send button.

**TTS trigger point in `handleSubmit`:**

After `finalizeMessage(assistantId)` succeeds (the streaming response has been fully received), if `useSettingsStore.getState().ttsEnabled === true`, call `speak(assistantId, fullContent)`. The full message content is available at this point since all chunks have been appended. Reading `ttsEnabled` from `getState()` (not a closure variable) avoids stale closure issues.

**When TTSButton is toggled off:** the `onClick` handler calls `setTtsEnabled(false)` and also calls `stop()`, which cancels any in-progress speech immediately.

---

### 2.6 Changes to `MessageBubble`

**File:** `src/components/chat/MessageBubble.tsx`

New prop: `isSpeaking: boolean` — true when `speakingMessageId === message.id`.

**Speaking indicator** (assistant bubbles only, hidden for user bubbles):

- The bubble's border color transitions from default to `border-[#2F81F7]` while `isSpeaking = true`.
- An animated speaker icon (`animate-pulse`, 18×18, `text-[#2F81F7]`) appears at the bottom-right of the bubble content.
- Both effects are removed when `isSpeaking` returns to false.

**`ChatThread` (`src/components/chat/ChatThread.tsx`):** subscribes to `useChatStore(s => s.speakingMessageId)` and derives `isSpeaking = speakingMessageId === message.id` for each `MessageBubble` it renders.

---

### 2.7 Chat Page Changes

**File:** `src/app/(admin)/page.tsx`

- Instantiate `useTTS({ targetLanguage })` (where `targetLanguage` is read from `useSettingsStore`).
- Pass `speak`, `stop`, `isSupported` down to `ChatInput` as props.

---

### 2.8 Settings Page — TTS Section

**File:** `src/app/(admin)/settings/page.tsx`

A new **"Text to Speech"** section is added. A second `useTTS` instance is mounted here solely to read the voice catalogue; it never plays audio.

**UI structure:**

```
[Card section]
  h2: "Text to Speech"
  p:  "Automatically read AI responses aloud after they finish streaming."

  [Toggle row]
    label: "Enable auto-play"
    <switch toggle> → ttsEnabled / setTtsEnabled

  [Voice selector row]  ← visible only when: ttsEnabled && isSupported && voices.length > 0
    label: "Voice"
    <select>
      <option value="">Default (system)</option>
      <option value={voice.voiceURI}>{voice.name}</option>  × each voice

  [Unsupported notice]  ← visible only when: !isSupported
    p: "Text-to-speech is not supported in this browser."
```

Selecting a voice writes `setSelectedVoiceURI(voice.voiceURI)` immediately (no Save button). When `targetLanguage` changes (via the new `setTargetLanguage` action), `selectedVoiceURI` resets to `null` atomically, so the dropdown shows "Default (system)".

---

### 2.9 File Path Summary

| Path | Change |
|---|---|
| `src/store/useSettingsStore.ts` | Add `ttsEnabled`, `selectedVoiceURI`, `setTtsEnabled`, `setSelectedVoiceURI`, `setTargetLanguage` |
| `src/store/useChatStore.ts` | Add `speakingMessageId`, `setSpeakingMessageId` |
| `src/hooks/useTTS.ts` | **New file** |
| `src/components/chat/TTSButton.tsx` | **New file** |
| `src/components/chat/MessageBubble.tsx` | Add `isSpeaking` prop and speaking indicator |
| `src/components/chat/ChatInput.tsx` | Add `speak`, `stop`, `isSupported` props; insert `TTSButton`; call `speak` post-finalize |
| `src/components/chat/ChatThread.tsx` | Subscribe to `speakingMessageId`; derive `isSpeaking` per message |
| `src/app/(admin)/page.tsx` | Instantiate `useTTS`; pass props to `ChatInput` |
| `src/app/(admin)/settings/page.tsx` | Add TTS section with toggle and voice selector |

---

## 3. Impact and Risk Analysis

**System Dependencies:**

- `useTTS` depends on `useSettingsStore` (`selectedVoiceURI`) and `useChatStore` (`setSpeakingMessageId`). Both stores are already initialized before the chat page mounts.
- `langToSpeechCode` utility is shared with the STT feature (`useSpeechToText`). TTS uses the same language-to-BCP47 mapping for filtering voices.
- No server-side dependencies.

**Potential Risks & Mitigations:**

| Risk | Mitigation |
|---|---|
| `getVoices()` returns empty on Chrome before `voiceschanged` fires | Call `getVoices()` on mount AND inside `voiceschanged` handler. The Settings dropdown and voice resolution both read `allVoices` which will populate within ~100–300ms. |
| `speechSynthesis.speak()` blocked on iOS Safari without a prior user gesture | Known iOS limitation. Document it; defer a workaround (e.g. a one-time "tap to enable audio" prompt) to a future iteration. |
| Two `useTTS` instances (chat page + settings page) racing on the voice list | Both are read-only consumers of `getVoices()`; no shared mutable state. Safe. |
| Stale `selectedVoiceURI` after language change | Addressed by `setTargetLanguage` atomically resetting `selectedVoiceURI`. |
| `speechSynthesis.cancel()` not immediately stopping on all browsers | `cancel()` is the only available API; browser-dependent behaviour is accepted for V1. |

---

## 4. Testing Strategy

- **Unit tests for `useTTS`:** Mock `window.speechSynthesis` and `SpeechSynthesisUtterance`. Test queue drain order, duplicate guard, `stop()` clearing the queue, `onerror` recovery, and voice resolution priority.
- **Unit tests for `useSettingsStore`:** Verify that `setTargetLanguage` atomically resets `selectedVoiceURI`.
- **Component tests for `TTSButton`:** Verify the three rendering states (off, on, unsupported/null).
- **Component tests for `MessageBubble`:** Verify the speaking indicator appears/disappears based on `isSpeaking`.
- **Manual browser testing:** Test in Chrome, Firefox, and Safari (iOS) to validate the `voiceschanged` timing difference and iOS gesture restriction behaviour.
