<!-- This document describes HOW to build the feature at an architectural level. -->

# Technical Specification: Speech Input (STT)

- **Functional Specification:** [context/spec/006-speech-input-stt/functional-spec.md](./functional-spec.md)
- **Status:** Completed
- **Author(s):** Serhii Kushnir

---

## 1. High-Level Technical Approach

This feature is entirely client-side. It uses the browser's built-in `SpeechRecognition` API (`window.SpeechRecognition` / `window.webkitSpeechRecognition`) — no new npm packages, no backend changes, no API routes.

The implementation consists of three parts:
1. A **`useSpeechToText` hook** that encapsulates the full `SpeechRecognition` lifecycle.
2. Two new **UI components** (`STTButton`, `AutoDialogToggle`) rendered inside the existing chat input area.
3. A new **`autoDialogActive` field** added to `useChatStore` to coordinate the hands-free loop with the TTS feature (next spec).

`ChatInput.tsx` is updated to wire everything together.

---

## 2. Proposed Solution & Implementation Plan

### 2.1 New Hook — `src/hooks/useSpeechToText.ts`

Encapsulates the entire `SpeechRecognition` lifecycle. No component should interact with the Web Speech API directly.

**Responsibilities:**
- Instantiate `SpeechRecognition` once (or report `isSupported: false` if the API is absent)
- Set `recognition.continuous = false`, `recognition.interimResults = true`, and `recognition.lang` from the provided `lang` parameter
- Expose `startListening()` and `stopListening()` methods
- Fire the provided callbacks: `onInterimResult(transcript)` on each interim update, `onFinalResult(transcript)` when recognition ends with a result, `onError(errorCode)` on any recognition error
- Clean up the recognition instance on unmount

**Returned shape:** `{ isListening: boolean, isSupported: boolean, startListening, stopListening }`

---

### 2.2 Language Mapping Utility — `src/utils/langToSpeechCode.ts`

`useSettingsStore.targetLanguage` holds plain-language names like `"English"` or `"French"`. The Web Speech API requires BCP-47 tags (e.g. `"en-US"`, `"fr-FR"`).

A small lookup utility maps the most common language names to their primary BCP-47 tag. Any name not in the map falls back to `"en-US"`. This utility will be replaced or extended when the Language Selector spec ships proper BCP-47 values directly.

---

### 2.3 New Component — `src/components/chat/STTButton.tsx`

A presentational button component with three visual states:

| State | Trigger | Appearance |
|---|---|---|
| Default | Idle, supported | Mic icon, muted colour |
| Active | `isListening === true` | Mic icon, accent colour, pulse animation |
| Disabled | `disabled === true` or `!isSupported` | Mic icon, `opacity-40 cursor-not-allowed` |

Props: `{ isListening: boolean, disabled: boolean, isSupported: boolean, onClick: () => void }`

---

### 2.4 New Component — `src/components/chat/AutoDialogToggle.tsx`

A presentational toggle button for hands-free mode with two visual states:

| State | Trigger | Appearance |
|---|---|---|
| Inactive | `isActive === false` | Loop/headphones icon, muted colour |
| Active | `isActive === true` | Same icon, accent colour, persistent glow |
| Disabled | `disabled === true` | `opacity-40 cursor-not-allowed` |

Props: `{ isActive: boolean, disabled: boolean, onClick: () => void }`

Disabled when TTS is unavailable — this prop is passed from `ChatInput` and will be wired to the TTS availability check in the Speech Output spec. For this spec, `disabled` is always `false`; the TTS guard is added when that spec ships.

---

### 2.5 Store Change — `src/store/useChatStore.ts`

Add one field and one action (not persisted):

| Addition | Type | Default | Purpose |
|---|---|---|---|
| `autoDialogActive` | `boolean` | `false` | Whether the hands-free loop is running. Shared between STT (this spec) and TTS (next spec). |
| `setAutoDialogActive(v)` | action | — | Toggled by `AutoDialogToggle`; read by the TTS hook to know when to re-trigger STT after playback ends. |

---

### 2.6 Updated Component — `src/components/chat/ChatInput.tsx`

Four targeted changes:

1. **Instantiate the hook:** Call `useSpeechToText({ lang, onInterimResult, onFinalResult, onError })` at the top of the component. `lang` is derived from `useSettingsStore.getState().targetLanguage` via the utility from §2.2.

2. **Render new buttons:** Add `<STTButton>` and `<AutoDialogToggle>` to the input area alongside the existing Send button. Both are `flex-none`.

3. **Transcript handling:** `onInterimResult` and `onFinalResult` both call `setInputValue(transcript)`, replacing whatever was in the field. On `onFinalResult`, if `autoDialogActive` is `true`, also call `handleSubmit()` immediately (auto-send).

4. **Error handling:** `onError(errorCode)` maps the Web Speech API error codes to the four user-facing toast messages defined in the functional spec (§2.7), then calls `toast('error', message)`.

**Disabled propagation:** Both `STTButton` and `AutoDialogToggle` receive `disabled={disabled || isStreaming}` so they are locked out while the AI is generating a response.

---

### 2.7 Auto-Dialog Loop — Integration Seam with TTS Spec

The auto-dialog loop has two halves:
- **This spec (STT side):** User speaks → auto-send when `autoDialogActive` is `true`.
- **Next spec (TTS side):** After TTS playback ends, if `autoDialogActive` is `true`, call `startListening()` to re-activate the mic.

The coordination point is `useChatStore.autoDialogActive`. This spec sets it; the TTS spec reads it. The `useSpeechToText` hook will be imported by the TTS hook (or a shared effect) to call `startListening()` at the right moment.

Until TTS is implemented, the toggle is functional on the STT side (auto-send works), but the mic does not re-activate after AI responses — completing the loop requires the TTS spec.

---

### 2.8 Barrel Export Update — `src/components/chat/index.ts`

Add exports for `STTButton` and `AutoDialogToggle`.

---

## 3. Impact and Risk Analysis

| Risk | Impact | Mitigation |
|---|---|---|
| `SpeechRecognition` absent (Firefox, Safari) | Mic and auto-dialog buttons are non-functional | `isSupported` flag disables both buttons; spec-mandated toast shown once on first attempt |
| `webkitSpeechRecognition` only in some browsers | Runtime error if checking wrong global | Check both `window.SpeechRecognition` and `window.webkitSpeechRecognition`; use whichever is present |
| Interim results replace partially-typed text | User loses typed content | Documented spec behaviour — voice input always starts fresh; user is warned via active button state before speaking |
| Auto-dialog loop fires while AI is still streaming | Double-submit or race condition | `startListening()` is only called after TTS ends (which itself only starts after streaming ends); `disabled` prop blocks the mic during streaming |
| `targetLanguage` value has no BCP-47 mapping | Falls back silently to `en-US` | Fallback is English; no error thrown; Language Selector spec will resolve this properly |
| Recognition stays open across navigation | Memory / microphone leak | `useSpeechToText` calls `recognition.abort()` in its cleanup (`useEffect` return) |

---

## 4. Testing Strategy

```bash
npm run dev
```

**Browser (manual / Playwright):**
- Load in Chrome → mic button visible; click → active state; speak → live transcript appears in field; pause → field finalised, mic returns to default
- Click Send → message sent normally
- Click auto-dialog toggle → active state; speak → message auto-sent (TTS half pending next spec)
- Load in Firefox → both buttons disabled; error toast shown on click
- Deny microphone in Chrome → error toast: "Microphone access was denied. Please allow it in your browser settings."
- Set practice language to a non-English value → verify `recognition.lang` is set correctly (check via DevTools)

**Build:**
```bash
npm run build   # zero TypeScript errors
```
