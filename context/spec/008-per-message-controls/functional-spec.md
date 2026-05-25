# Functional Specification: Per-Message Controls

- **Roadmap Item:** Phase 3 — Voice: Per-Message Controls (Three-dot context menu)
- **Status:** Completed
- **Author:** Serhii Kushnir

---

## 1. Overview and Rationale (The "Why")

INTSE is a voice-first language practice tool. The Speech Output feature lets the app read AI replies aloud automatically — but once a message has been spoken, the user has no way to re-hear it, change the reading speed, try a different voice, or remove a message they don't need.

This feature gives every message bubble a small action menu — a three-dot (⋯) button — that unlocks fine-grained, per-message control. For AI messages, this means replaying speech, adjusting how fast it's read, switching to a different voice, copying the text, or deleting the message. For messages the user sent themselves, Copy and Delete are available.

The goal is to make INTSE feel like a real practice partner: the user can slow down a difficult phrase, replay it, or try a different voice until the pronunciation clicks — all without leaving the conversation.

**Success looks like:** A learner hears an AI reply that was spoken too quickly, taps ⋯ on that bubble, drags the speed slider down to 0.75×, taps Repeat, and hears the message again at a comfortable pace — all within a few seconds.

---

## 2. Functional Requirements (The "What")

### 2.1 Three-Dot Menu Button

- Every message bubble in the conversation — both AI replies and messages sent by the user — displays a small three-dot (⋯) icon.
- The icon is **always visible**; it does not require hovering or long-pressing to reveal.
- Tapping or clicking the three-dot icon opens a small action menu attached to that message bubble.
- Tapping or clicking anywhere outside the open menu closes it without taking any action.

**Acceptance Criteria:**
- [x] Given any message (AI or user) in the conversation, a three-dot icon is visible on the bubble at all times.
- [x] When the user taps the three-dot icon, a menu appears adjacent to that message bubble.
- [x] When the user taps anywhere outside the open menu, the menu closes with no action taken.

---

### 2.2 AI Message Menu Options

When the three-dot menu is opened on an **AI message**, five options are available:

#### Repeat

- Tapping **Repeat** reads the message aloud from the beginning using the current voice and speed settings.
- This option is only available when the global TTS toggle is **on**. When TTS is off, Repeat is either hidden or shown as visually disabled (greyed out, not interactive).
- If another message is already being read aloud, tapping Repeat stops the current playback and immediately begins reading the selected message from the start.

**Acceptance Criteria:**
- [x] Given TTS is on, when the user taps Repeat on an AI message, the message is read aloud from the beginning.
- [x] Given TTS is off, the Repeat option is either hidden or visually disabled (not interactive).
- [x] Given TTS is actively speaking and the user taps Repeat on a different message, the current speech stops and the new message begins playing immediately.

---

#### Speed

- Tapping **Speed** reveals an inline speed slider within the menu.
- The slider range is **0.5× to 2×**.
- The default speed is **1×**.
- Adjusting the slider changes the playback speed **globally** — all future TTS playback (auto-play and Repeat) uses the new speed.
- The selected speed is saved and persists the next time the user opens the app.

**Acceptance Criteria:**
- [x] When the user taps Speed, a speed slider appears within the menu, ranging from 0.5× to 2×, defaulting to 1×.
- [x] After the user moves the slider, the next TTS playback — whether auto-play or Repeat — uses the newly selected speed.
- [x] After the user closes and reopens the app, the previously selected speed is preserved.

---

#### Voice Selector

- Tapping **Voice** reveals a dropdown list of all voices available on the device for the user's current target language.
- Selecting a voice updates the **global** voice setting — this is the same as changing the voice in the Settings area. Both reflect the same active selection.
- All subsequent TTS playback uses the newly selected voice.

**Acceptance Criteria:**
- [x] When the user taps Voice, a dropdown of available voices for the current target language appears.
- [x] When the user selects a voice, the next TTS playback uses that voice.
- [x] The voice selected here is reflected in the Settings area — both show the same active voice.
- [x] After the user closes and reopens the app, the selected voice is preserved.

---

#### Copy

- Tapping **Copy** copies the full text of the AI message to the device clipboard.
- A brief visual confirmation appears (e.g., "Copied!" shown briefly) and the menu closes.

**Acceptance Criteria:**
- [x] When the user taps Copy on an AI message, the full message text is placed on the clipboard.
- [x] A brief visual confirmation ("Copied!" or equivalent) is shown after the copy action.
- [x] The menu closes after copying.

---

#### Delete

- Tapping **Delete** immediately removes the AI message from the conversation view with no confirmation prompt.
- The message is removed from the conversation history saved in the browser — it does not reappear on refresh or next visit.
- The remaining messages in the conversation are unaffected.

**Acceptance Criteria:**
- [x] When the user taps Delete on an AI message, the bubble is immediately removed with no confirmation prompt.
- [x] After refreshing or returning to the app, the deleted message does not reappear.
- [x] The remaining messages in the conversation are unaffected.

---

### 2.3 User Message Menu Options

When the three-dot menu is opened on a **message sent by the user**, only **Copy** and **Delete** are shown.

- Repeat, Speed, and Voice are not shown on user messages.
- Copy and Delete behave identically to their behavior on AI messages (described in Section 2.2).

**Acceptance Criteria:**
- [x] Given the user opens the three-dot menu on one of their own messages, only Copy and Delete are shown.
- [x] Copy places the user's message text on the clipboard and shows a brief visual confirmation.
- [x] Delete immediately removes the user's message with no confirmation, and the message does not reappear after a refresh.

---

## 3. Scope and Boundaries

### In-Scope

- Three-dot (⋯) icon always visible on every message bubble (AI and user).
- AI messages: Repeat, Speed slider (0.5×–2×), Voice selector, Copy, Delete.
- User messages: Copy and Delete only.
- Speed and Voice changes apply globally and persist across sessions.
- Repeat is hidden or disabled when the global TTS toggle is off.
- Immediate delete with no confirmation step.
- Brief visual "Copied!" confirmation on Copy action.

### Out-of-Scope

- **Language Selector** (choosing which language to practice) — a separate Phase 3 roadmap item.
- **Global TTS on/off toggle** — covered by spec 007 (Speech Output TTS).
- **Chat history browser on the dashboard** — Phase 4.
- **Multi-device sync** of speed or voice preferences — out of scope for this version.
- **Editing messages** — not part of this roadmap item.
