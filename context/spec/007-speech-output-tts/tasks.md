# Task List: Speech Output (TTS)

- **Spec:** [context/spec/007-speech-output-tts/functional-spec.md](context/spec/007-speech-output-tts/functional-spec.md)
- **Technical Considerations:** [context/spec/007-speech-output-tts/technical-considerations.md](context/spec/007-speech-output-tts/technical-considerations.md)
- **Status:** Ready for implementation

---

## Slice 1: Store Foundation

> Adds the new state fields to both stores. The app remains fully working after this slice — no visible change, but the data layer is ready for everything that follows.

- [ ] Add `ttsEnabled` (boolean, default `false`) and `selectedVoiceURI` (string | null, default `null`) fields with their setter actions to `useSettingsStore`. **[Agent: nextjs-frontend]**
- [ ] Add a new `setTargetLanguage` action to `useSettingsStore` that atomically sets `targetLanguage` and resets `selectedVoiceURI` to `null`. Replace any existing direct `targetLanguage` assignments with calls to this action. **[Agent: nextjs-frontend]**
- [ ] Add `speakingMessageId` (string | null, default `null`) and `setSpeakingMessageId` action to `useChatStore` (non-persisted). **[Agent: nextjs-frontend]**
- [ ] **Verify:** Start the dev server. Open the app in the browser via Playwright. Confirm the app loads without console errors and the chat works normally (send a test message and receive a reply). **[Agent: nextjs-frontend]**

---

## Slice 2: TTS Toggle Button in Chat Toolbar

> A speaker icon toggle appears in the chat toolbar. It is hidden if the browser has no TTS support. Clicking it switches visual state. No audio plays yet.

- [ ] Create `src/hooks/useTTS.ts` with: `isSupported` detection (`typeof window.speechSynthesis !== 'undefined'`), voice catalogue loading (call `getVoices()` on mount and inside `voiceschanged` handler), and a filtered `voices` getter (BCP47 prefix match against `targetLanguage` via `langToSpeechCode`). Stub out `speak()` and `stop()` as no-ops for now. **[Agent: nextjs-frontend]**
- [ ] Create `src/components/chat/TTSButton.tsx` with props `isEnabled`, `isSupported`, `disabled`, `onClick`. Visual states: returns `null` when `!isSupported`; muted speaker icon when off; accent-blue speaker icon when on; reduced opacity when disabled. **[Agent: nextjs-frontend]**
- [ ] Instantiate `useTTS({ targetLanguage })` in `src/app/(admin)/page.tsx`. Pass `isSupported` and a toggle handler (`setTtsEnabled(!ttsEnabled)`) down to `ChatInput`. **[Agent: nextjs-frontend]**
- [ ] Add `TTSButton` to `ChatInput`'s toolbar between `AutoDialogToggle` and the Send button. Wire `isEnabled`, `isSupported`, `disabled` (while streaming), and `onClick`. **[Agent: nextjs-frontend]**
- [ ] Export `TTSButton` from `src/components/chat/index.ts`. **[Agent: nextjs-frontend]**
- [ ] **Verify:** Open the app in Playwright. Confirm the speaker icon appears in the toolbar. Click it — icon changes to active state (blue). Click again — returns to muted state. No errors in console. **[Agent: nextjs-frontend]**

---

## Slice 3: Auto-Play AI Responses

> When TTS is enabled, each AI response is read aloud automatically after it finishes streaming. Sending a new message while audio is playing queues it. Turning TTS off mid-speech stops audio immediately.

- [ ] Implement full `speak(id, text)` logic in `useTTS`: push to `queue` ref, call internal `_drain()`. Implement `_drain()`: no-op if `isPlaying`; otherwise shift first item, set `isPlaying = true`, call `setSpeakingMessageId(id)`, resolve voice (stored URI → first filtered voice → null), construct `SpeechSynthesisUtterance`, assign `onend` (reset flags, drain next) and `onerror` (same reset + console warn), call `speechSynthesis.speak(utterance)`. Include duplicate-id guard before pushing. **[Agent: nextjs-frontend]**
- [ ] Implement `stop()` in `useTTS`: call `speechSynthesis.cancel()`, clear queue in-place, set `isPlaying = false`, call `setSpeakingMessageId(null)`. **[Agent: nextjs-frontend]**
- [ ] Add unmount cleanup to `useTTS`: call `stop()` and remove `voiceschanged` listener. **[Agent: nextjs-frontend]**
- [ ] Pass `speak` and `stop` from `useTTS` down to `ChatInput` via `src/app/(admin)/page.tsx`. **[Agent: nextjs-frontend]**
- [ ] In `ChatInput.handleSubmit`, after `finalizeMessage(assistantId)` succeeds, if `useSettingsStore.getState().ttsEnabled === true`, call `speak(assistantId, fullContent)`. **[Agent: nextjs-frontend]**
- [ ] In `TTSButton`'s `onClick`, call both `setTtsEnabled(!isEnabled)` and `stop()` when toggling off (cancel in-progress speech). **[Agent: nextjs-frontend]**
- [ ] **Verify:** Open the app in Playwright. Enable TTS. Send a short message. Confirm `speakingMessageId` is set momentarily in store state and clears after playback (note: Playwright cannot assert audio output directly — store state and absence of console errors are the verification signal). Disable TTS mid-response — confirm `speakingMessageId` clears immediately. **[Agent: nextjs-frontend]**

---

## Slice 4: Speaking Indicator on Message Bubble

> While an AI response is being read aloud, its bubble shows a pulsing blue speaker icon and a blue border. The indicator disappears when playback ends.

- [ ] In `src/components/chat/ChatThread.tsx`, subscribe to `useChatStore(s => s.speakingMessageId)`. Derive `isSpeaking = speakingMessageId === message.id` for each rendered `MessageBubble`. **[Agent: nextjs-frontend]**
- [ ] Add `isSpeaking: boolean` prop to `MessageBubble`. For assistant bubbles only: when `isSpeaking` is true, apply `border-[#2F81F7]` border and render an `animate-pulse` speaker SVG (18×18, `text-[#2F81F7]`) at the bottom-right of the bubble content. **[Agent: nextjs-frontend]**
- [ ] **Verify:** Open the app in Playwright. Enable TTS. Send a message. While the response is being read, take a screenshot and confirm the bubble has the blue border and pulsing icon. After speech ends, take another screenshot and confirm the indicator is gone. **[Agent: nextjs-frontend]**

---

## Slice 5: Settings Page — TTS Section with Voice Selector

> Users can toggle TTS and choose a specific voice for their target language from the Settings page. The selection persists across sessions.

- [ ] In `src/app/(admin)/settings/page.tsx`, instantiate a second `useTTS({ targetLanguage })` (read-only, for voice catalogue; never plays audio). **[Agent: nextjs-frontend]**
- [ ] Add a "Text to Speech" card section below "Your AI Key" with: a description paragraph, an "Enable auto-play" toggle wired to `ttsEnabled` / `setTtsEnabled`, a voice `<select>` dropdown (visible only when `ttsEnabled && isSupported && voices.length > 0`) populated with a "Default (system)" option plus one option per voice (`voiceURI` as value, `name` as label) wired to `selectedVoiceURI` / `setSelectedVoiceURI`, and an unsupported notice (visible only when `!isSupported`). **[Agent: nextjs-frontend]**
- [ ] **Verify:** Open the Settings page in Playwright. Confirm the "Text to Speech" section renders. Toggle the switch — state persists on page reload. If voices are listed, select one, navigate back to chat, enable TTS, send a message, and confirm no console errors occur. **[Agent: nextjs-frontend]**

---

## Gaps & Recommendations

| Slice | Note | Recommendation |
|---|---|---|
| Slice 3 Verification | Playwright cannot assert audio output directly — browser audio playback is outside DOM inspection scope. | Verification covers store state (`speakingMessageId`) and absence of errors. Manual audio spot-check is recommended before merging. |
