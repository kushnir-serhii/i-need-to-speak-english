# Functional Specification: Speech Output (TTS)

- **Roadmap Item:** Phase 3 — Voice: Speech Output (TTS) + Language-Aware Voice Selection
- **Status:** Completed
- **Author:** Serhii Kushnir

---

## 1. Overview and Rationale (The "Why")

INTSE is a speaking practice tool. Until now, the app can hear the user (via microphone input) but cannot speak back. This means the user reads AI responses silently — missing the listening practice that is central to language learning.

This feature completes the voice loop: once the AI finishes its reply, the app reads it aloud in the user's target practice language. The user hears correct pronunciation and natural rhythm, which is the core value of the product for language learners who want real conversation practice — not just reading and typing.

**Success looks like:** A user enables TTS in the chat toolbar, receives an AI response, hears it spoken aloud in their chosen language, and sees the message visually highlighted while speech is playing.

---

## 2. Functional Requirements (The "What")

### 2.1 TTS On/Off Toggle (Chat Toolbar)

- A speaker icon toggle button is visible in the chat toolbar (alongside the microphone button).
- By default, for every new visitor, TTS is **off**.
- The user taps/clicks the toggle to enable TTS. The icon changes state to show TTS is active (e.g., filled speaker vs. muted speaker).
- The user can toggle TTS off at any time, mid-conversation.
- If the user's browser does not support text-to-speech, the toggle is **not shown at all**. The chat works normally without it.

**Acceptance Criteria:**
- [x] Given a new visitor opens the app, the TTS toggle is visible in the chat toolbar in an "off" state.
- [x] When the user clicks the TTS toggle, it switches to an "on" state (icon changes visually).
- [x] When the user clicks it again, it switches back to "off."
- [x] Given a browser with no text-to-speech support, the TTS toggle is not rendered anywhere in the chat.

---

### 2.2 Auto-Play AI Responses

- When TTS is **on** and an AI response finishes streaming, the app automatically begins reading the full response aloud.
- TTS does **not** start mid-stream — playback begins only after the complete response has arrived.
- While TTS is playing, the message bubble being read aloud shows a visual indicator (e.g., an animated speaker icon or a pulsing highlight on the message).
- The visual indicator disappears when playback finishes.
- If the user sends a new message **while a response is still being read aloud**, the in-progress speech finishes completely before the next AI response is played. The new response is queued.
- If the user turns TTS **off** mid-playback, the speech stops immediately.

**Acceptance Criteria:**
- [x] Given TTS is on, when an AI reply finishes arriving, the app reads it aloud without the user pressing anything.
- [x] Given TTS is on, the message being read aloud shows a visual animation or highlight during playback; it disappears when speech ends.
- [x] Given TTS is playing and the user sends another message, the current speech finishes before the new AI response is read.
- [x] Given TTS is playing and the user turns TTS off, speech stops immediately.
- [x] Given TTS is off, AI responses arrive silently with no speech playback.

---

### 2.3 Language-Aware Voice Selection

- The voice used for TTS playback matches the user's chosen target practice language (e.g., if the user is practicing English, the app speaks in an English voice).
- The app uses whichever voice the browser designates as the default for that language.
- If no voice is available for the target language, the app falls back silently to the browser's system default voice. No error is shown.
- In the **Settings area** (separate from the chat view), the user can see a dropdown list of all voices available on their device for their chosen language, and select a preferred one. This selection persists across sessions on the same device.
- When the user changes their target practice language, the voice list in Settings updates to show only voices available for the new language. If a previously selected voice is no longer relevant, the selection resets to the browser's default for the new language.

**Acceptance Criteria:**
- [x] Given the user's target language is set to English and TTS is on, AI responses are spoken in an English-language voice.
- [x] Given no English voices are available, the app speaks using the browser's system default voice without showing an error.
- [x] Given the user opens Settings, they see a voice selector dropdown populated with voices available for their current target language.
- [x] When the user selects a voice in Settings and returns to chat, the next TTS playback uses the newly chosen voice.
- [x] Given the user changes their target language, the voice selector in Settings shows only voices for the new language, and the selection resets to the new language's default.

---

## 3. Scope and Boundaries

### In-Scope

- TTS toggle button in the chat toolbar (on/off).
- Auto-play of the complete AI response after it finishes streaming.
- Visual playback indicator on the message currently being spoken.
- Speech queuing: in-progress speech completes before the next response plays.
- Language-aware automatic voice matching based on the user's target language.
- Global voice selector in the Settings area.
- Fallback to system default voice when no matching voice exists.
- Hiding TTS controls entirely on browsers without speech support.

### Out-of-Scope

- **Per-message controls** (three-dot menu on individual messages with Repeat, Speed slider, per-message voice selector, Copy, Delete) — covered by the next Phase 3 roadmap item.
- **Target language picker UI** — the selector for choosing which language to practice is a separate roadmap item (Language Selector).
- **Speech Input (STT)** — covered by spec 006.
- **Chat history persistence and dashboard history browser** — Phase 4 items.
- **Playback speed control** — part of the per-message controls spec.
