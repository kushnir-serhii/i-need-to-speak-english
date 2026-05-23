# Tasks: Speech Input (STT)

- **Spec:** [functional-spec.md](./functional-spec.md) · [technical-considerations.md](./technical-considerations.md)
- **Status:** Ready for implementation

---

- [x] **Slice 1: `useSpeechToText` hook + language utility + `STTButton` (static shell)**

  > **Why first:** The hook and utility are the foundation everything else builds on. The button gives immediate visual proof the feature exists before any wiring happens. App must remain buildable after this slice.

  - [x] Create `src/utils/langToSpeechCode.ts` — maps plain language names (`"English"`, `"French"`, `"Spanish"`, `"German"`, `"Portuguese"`, `"Italian"`, `"Ukrainian"`, `"Polish"`) to their primary BCP-47 tag; any unknown name falls back to `"en-US"`. **[Agent: nextjs-frontend]**
  - [x] Create `src/hooks/useSpeechToText.ts` — accepts `{ lang: string, onInterimResult: (t: string) => void, onFinalResult: (t: string) => void, onError: (code: string) => void }`; detects `window.SpeechRecognition ?? window.webkitSpeechRecognition`; sets `continuous = false`, `interimResults = true`, `recognition.lang = lang`; exposes `{ isListening, isSupported, startListening, stopListening }`; calls `recognition.abort()` on unmount cleanup. **[Agent: nextjs-frontend]**
  - [x] Create `src/components/chat/STTButton.tsx` — props `{ isListening, disabled, isSupported, onClick }`; three visual states: default (mic icon, muted `#8B949E`), active (mic icon, accent `#2F81F7`, CSS pulse animation), disabled (`opacity-40 cursor-not-allowed`); when `!isSupported` the button is always disabled. **[Agent: nextjs-frontend]**
  - [x] Add `STTButton` export to `src/components/chat/index.ts`. **[Agent: nextjs-frontend]**
  - [x] Update `src/components/chat/ChatInput.tsx` — import and render `<STTButton>` alongside the Send button (`flex-none`); pass `isListening={false}`, `disabled={disabled || isStreaming}`, `isSupported={true}`, `onClick={() => {}}` as static placeholders for now. **[Agent: nextjs-frontend]**
  - [x] Verify with Playwright: navigate to `http://localhost:3000`; confirm mic button is visible in the chat input area next to the Send button; confirm it is in its default (inactive) state. Run `npm run build` — zero TypeScript errors. **[Agent: nextjs-frontend]**

---

- [x] **Slice 2: Wire STTButton to live transcript + error toasts**

  > **Why second:** Delivers the core single-message voice input flow end-to-end. After this slice a user can speak and see their words appear in real time.

  - [x] Update `src/components/chat/ChatInput.tsx` — instantiate `useSpeechToText` with `lang` derived from `langToSpeechCode(useSettingsStore.getState().targetLanguage)`; wire `onInterimResult` and `onFinalResult` to `setInputValue(transcript)` (replacing existing text); wire `onError(code)` to call `toast('error', message)` using this mapping: `'not-allowed'` → `"Microphone access was denied. Please allow it in your browser settings."`, `'no-speech'` → `"No speech was detected. Please try again."`, any other code → `"Voice input encountered an error. Please try again."`; pass real `isListening` and `isSupported` values to `<STTButton>`; `onClick` calls `startListening()`. **[Agent: nextjs-frontend]**
  - [x] Add unsupported-browser toast: when `!isSupported`, keep the button disabled and add a `useEffect` that fires the toast once on mount if `!isSupported` — toast message: `"Speech recognition isn't supported in this browser. Try Chrome or Edge."` **[Agent: nextjs-frontend]**
  - [x] Verify with Playwright (Chrome): navigate to `http://localhost:3000`; click the mic button → button enters active state; speak a sentence → words appear in the textarea in real time; pause → transcript finalised, button returns to default state; the transcript is editable and sendable normally. **[Agent: nextjs-frontend]**

---

- [x] **Slice 3: `autoDialogActive` store field + `AutoDialogToggle` + auto-send loop**

  > **Why third:** Completes all STT-side functionality. After this slice auto-dialog works for the send half; the TTS spec will complete the listen-again half.

  - [x] Add `autoDialogActive: boolean` (default `false`, not persisted) and `setAutoDialogActive(v: boolean)` action to `src/store/useChatStore.ts`. **[Agent: nextjs-frontend]**
  - [x] Create `src/components/chat/AutoDialogToggle.tsx` — props `{ isActive, disabled, onClick }`; two visual states: inactive (loop/headphones icon, muted `#8B949E`), active (same icon, accent `#2F81F7`, persistent glow); disabled state applies `opacity-40 cursor-not-allowed`; for this spec `disabled` is always `false` (TTS guard added in the Speech Output spec). **[Agent: nextjs-frontend]**
  - [x] Add `AutoDialogToggle` export to `src/components/chat/index.ts`. **[Agent: nextjs-frontend]**
  - [x] Update `src/components/chat/ChatInput.tsx` — render `<AutoDialogToggle>` alongside `<STTButton>` and the Send button; `onClick` calls `setAutoDialogActive(!autoDialogActive)` and, when activating, immediately calls `startListening()`; in the `onFinalResult` callback, if `autoDialogActive` is `true` call `handleSubmit()` immediately after `setInputValue(transcript)` (auto-send); pass `disabled={disabled || isStreaming}` to both buttons. **[Agent: nextjs-frontend]**
  - [x] Verify with Playwright: navigate to `http://localhost:3000`; click the auto-dialog toggle → it enters active state; speak a sentence → transcript appears → message is sent automatically (no Send tap); AI generates a response; mic does NOT re-activate yet (TTS half is pending next spec); click the toggle again → it returns to inactive state. Run `npm run build` — zero TypeScript errors. **[Agent: nextjs-frontend]**

---

## Recommendations

| Task/Slice | Issue | Recommendation |
|---|---|---|
| Slice 2 verification | Microphone access requires user permission; Playwright may not grant it automatically | Grant mic permission via `browserContext.grantPermissions(['microphone'])` in the Playwright context, or verify manually in Chrome |
| Slice 3 auto-send | Auto-dialog completes only the STT side; the loop is incomplete until the TTS spec ships | Expected — the `useSpeechToText` hook's `startListening()` will be called by the TTS hook after playback ends |
