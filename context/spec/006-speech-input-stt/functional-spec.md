# Functional Specification: Speech Input (STT)

- **Roadmap Item:** Phase 3 — Voice / Speech Input (STT)
- **Status:** Completed
- **Author:** Serhii Kushnir

---

## 1. Overview and Rationale (The "Why")

INTSE is a speaking practice tool, but today the only way to compose a message is by typing. Typing creates a gap between the skill being practiced (spoken conversation) and the tool being used. Maria wants to open the app, speak a sentence out loud, and get a response — the way a real conversation works.

The STT button closes that gap. It gives any user a way to compose messages with their voice, directly from the chat screen, using whatever speech recognition the browser already provides — no accounts, no third-party services, no installs.

Beyond single voice messages, the app also supports a fully hands-free **auto-dialog mode**: the user taps once to start, then speaks and listens in an uninterrupted conversational loop — no further button taps required. This is the closest the app gets to a natural two-person conversation.

Success looks like: a user can hold their phone, tap the mic, say a sentence in the language they are practising, and have it appear in the message field ready to send — without ever touching the keyboard. Or they tap the loop button and have a full back-and-forth conversation entirely by voice.

---

## 2. Functional Requirements (The "What")

### 2.1 The Mic Button

A microphone button is displayed in the chat input area alongside the Send button. Its purpose is to start a single voice message. It is always visible, whether or not the user has previously used voice input.

The button is **disabled** in two situations:
- While the AI is generating a response (the Send button is also disabled at this time).
- When voice input is not supported by the user's browser (see §2.7).

### 2.2 Starting Voice Input

When the user taps the mic button:
- The button changes to an **active state** — visually distinct from its default state (e.g. a pulsing animation or highlighted colour) to make it clear that the app is listening.
- The browser may prompt the user to allow microphone access the first time. This is handled by the browser natively.
- The app begins listening immediately.

### 2.3 Live Transcript

As the user speaks, their words appear in the message input field **in real time**, word by word, as the browser recognises them. Any text that was previously in the field is **replaced** by the spoken transcript — voice input always starts fresh.

The user can watch the words appear as they speak. Interim results (partial, unconfirmed words) may flicker as recognition refines them — this is normal browser behaviour.

### 2.4 Stopping and Finalising (Single-Message Mode)

Voice input **stops automatically** when the browser detects a pause in speech. At that point:
- The mic button returns to its default (inactive) state.
- The final, confirmed transcript is left in the message input field.
- The cursor is placed at the end of the text, ready for editing.

The user can freely **edit the transcript** before sending — correct a word, add punctuation, or delete everything. Sending works exactly as it does for typed messages: tap the Send button or press Enter.

### 2.5 Auto-Dialog Mode (Hands-Free Conversation Loop)

Auto-dialog mode turns the app into a fully hands-free conversation partner. Once enabled, the user and the AI take turns speaking without either party needing to touch the screen.

**Enabling the mode:**
A dedicated toggle button is shown in the chat input area (visually distinct from the mic button — for example, a loop or headphones icon). Tapping it once **starts** auto-dialog mode; tapping it again **stops** it. The button shows a clear active state while the loop is running.

**The conversation loop, step by step:**
1. The user taps the toggle to start.
2. The mic activates immediately — the user speaks their message.
3. When speech stops (pause detected), the message is **sent automatically** — no tap required.
4. The AI generates and **speaks its reply aloud** (via the TTS feature).
5. As soon as the AI finishes speaking, the mic activates again automatically.
6. The cycle repeats from step 2.

**Stopping the loop:**
The user taps the toggle button at any point to exit auto-dialog mode. The mic stops listening, and the app returns to its normal state. The conversation thread remains visible and intact.

**Auto-dialog depends on TTS being available.** The loop trigger is the end of the AI's spoken reply. If TTS is unavailable or disabled, the auto-dialog toggle is also disabled, because the handoff point (AI finishes speaking → mic activates) cannot occur.

**Error handling during the loop:**
If an error occurs during voice recognition inside the loop (e.g. no speech detected), the relevant toast notification is shown (see §2.7) and the loop **pauses**. The toggle remains in its active state so the user can see the loop is suspended — they can tap it to exit, or speak to attempt to resume recognition if the browser allows it.

### 2.6 Recognition Language

The speech recognition listens in the **same language the user has selected as their practice language**. For example, if the user is practising French, the browser listens for French speech. If no language has been selected yet, recognition defaults to English.

*(Language selection is a separate feature covered in its own spec. This spec assumes the selected language is available as a setting.)*

### 2.7 Error States (Single-Message and Auto-Dialog)

If something prevents voice input from working, a toast notification appears with a specific message:

| Situation | Message shown to the user |
|---|---|
| The browser does not support speech recognition | "Speech recognition isn't supported in this browser. Try Chrome or Edge." |
| The user has denied microphone permission | "Microphone access was denied. Please allow it in your browser settings." |
| Recognition started but no speech was detected | "No speech was detected. Please try again." |
| An unexpected recognition error occurred | "Voice input encountered an error. Please try again." |

In every error case, the mic button (or auto-dialog toggle) returns to its default state and the message field is left unchanged.

---

## 3. Acceptance Criteria

**Mic button — single message**
- [x] A microphone button is visible in the chat input area.
- [x] Tapping the mic button starts voice recognition and the button shows its active state.
- [x] Words appear in the message input field in real time as the user speaks.
- [x] Any text previously in the input field is replaced when voice input starts.
- [x] Voice input stops automatically after a pause in speech; the mic button returns to its default state.
- [x] The final transcript remains in the input field and is editable before sending.
- [x] The mic button is disabled while the AI is generating a response.

**Auto-dialog toggle**
- [x] A separate toggle button for auto-dialog mode is visible in the chat input area.
- [x] Tapping the toggle starts the loop; the toggle shows a visible active state.
- [x] When the loop starts, the mic activates immediately and the user can speak.
- [x] After the user's speech stops, the message is sent automatically without tapping Send.
- [?] The mic activates again automatically as soon as the AI finishes speaking its reply aloud. _(Pending Speech Output spec — `autoDialogActive` seam is in place; TTS hook will call `startListening()` after playback ends.)_
- [x] Tapping the toggle again stops the loop; the mic stops listening and the toggle returns to its default state.
- [?] The auto-dialog toggle is disabled when TTS is unavailable. _(Pending Speech Output spec — TTS availability guard will be added there.)_
- [x] If a voice recognition error occurs during the loop, the relevant toast is shown and the loop pauses (toggle stays in active state but mic stops).

**Recognition language**
- [x] Speech recognition listens in the user's selected practice language.
- [x] If no language has been selected, recognition defaults to English.

**Error states**
- [x] If the browser does not support speech recognition, the mic button is disabled and a toast reads: "Speech recognition isn't supported in this browser. Try Chrome or Edge."
- [x] If microphone permission is denied, a toast reads: "Microphone access was denied. Please allow it in your browser settings."
- [x] If no speech is detected, a toast reads: "No speech was detected. Please try again."
- [x] If an unexpected error occurs, a toast reads: "Voice input encountered an error. Please try again."
- [x] In all error cases, the button returns to its default state and the message field is unchanged.

---

## 4. Scope and Boundaries

### In-Scope
- Microphone button for single voice messages
- Live real-time transcript in the message field
- Auto-stop on silence
- Auto-dialog toggle (hands-free conversation loop)
- Automatic message send in auto-dialog mode
- Language-aware recognition (uses the selected practice language)
- Per-error toast notifications

### Out-of-Scope
- **TTS / AI voice playback** — covered in the Speech Output spec (required for auto-dialog, but defined there)
- **Per-message controls** (repeat, speed, voice selector) — covered in the Per-Message Controls spec
- **Language selector UI** — covered in the Language Selector spec
- **Custom wake word or push-to-talk hold gesture** — not planned
- **Server-side speech processing** — recognition runs entirely in the browser; no audio is sent to any server
