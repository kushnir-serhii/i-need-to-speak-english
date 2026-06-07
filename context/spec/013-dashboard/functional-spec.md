# Functional Specification: Personal Dashboard

- **Roadmap Item:** Phase 4 — Dashboard (Usage indicator, Language selector, Prompt management)
- **Status:** Completed
- **Author:** Serhii Kushnir

---

## 1. Overview and Rationale (The "Why")

The Chat page is the heart of the app, but users currently have no single place to configure how it works or to see how much of their daily allowance they've used. Without this, they must guess whether they're close to their daily limit and can't personalise the AI's behaviour without leaving the chat.

The Dashboard gives every user a personal control panel: a live usage summary, a language picker that immediately applies to their next conversation, and a prompt editor that lets them shape how the AI responds. These three controls are collected in one place so users can set up their session before they start talking.

---

## 2. Functional Requirements

### 2.1 Usage Indicator

Users on the shared key see how many messages they've sent today versus their daily allowance. Users on their own key see a running total of how many tokens their conversations have consumed in the current session.

**Shared-key users:**
- The Dashboard displays a message counter in the format "X / Y messages today" (e.g., "12 / 20 messages today").
- The display is informational only — there is no colour change or visual alert. The counter simply reflects the current state.
- The count updates to reflect the latest usage each time the user views the Dashboard.

**Own-key users:**
- The Dashboard displays a token counter showing total tokens consumed during the current session (e.g., "4,318 tokens used").
- No daily limit is shown because there isn't one.

**Acceptance Criteria:**
- [x] Given I am a shared-key user, when I open the Dashboard, I see a message counter showing how many messages I've sent today out of my daily allowance (e.g., "12 / 20 messages today").
- [x] Given I am a shared-key user who has used 0 messages, the counter shows "0 / Y messages today."
- [x] Given I am a shared-key user who has hit the daily limit, the counter shows "Y / Y messages today" with no additional warning.
- [x] Given I am using my own API key, I see a token counter instead of a message counter (e.g., "4,318 tokens used").
- [x] Given I am using my own API key, no daily limit or allowance is shown.

---

### 2.2 Language Selector

Users choose which language they want to practice. The selection determines which language the AI responds in and which voices are available for audio playback.

- The Dashboard displays a language picker where users can select any language they want to practice.
- When a user selects a new language, the current conversation is automatically saved and a fresh conversation begins. No confirmation is shown — the change takes effect immediately.
- The selected language persists across sessions — if the user leaves the app and returns, the same language is still selected.
- The language the user has currently selected is visibly highlighted or shown as the active choice in the picker.

**Acceptance Criteria:**
- [x] Given I am on the Dashboard, I see a language selector showing the currently active language.
- [x] Given I select a different language, the current conversation is saved and the Chat page resets to a new, empty conversation.
- [x] Given I select a different language, no confirmation dialog is shown before the change takes effect.
- [x] Given I close the app and reopen it, the language I last selected is still shown as active.
- [x] Given I have not chosen a language previously, a sensible default language is pre-selected (e.g., English).

---

### 2.3 Prompt Management

Users can write their own instruction for the AI and switch between it and the built-in default at any time.

- The Dashboard includes a text area where users can type a custom instruction for the AI (e.g., "Respond only in formal English and correct my grammar after each reply").
- A toggle switch above or beside the text area controls whether the custom instruction or the built-in default is active.
- Switching the toggle to "Default" deactivates the custom instruction without deleting the text — the text remains in the area so the user can re-enable it later without retyping.
- Switching the toggle back to "Custom" re-activates the text currently in the text area.
- Changes to the text area are saved automatically — the user does not need to press a Save button.
- The custom instruction only takes effect from the next message the user sends. It does not retroactively change the current conversation.
- If the toggle is set to "Custom" but the text area is empty, the app behaves as if the toggle were set to "Default" — the built-in prompt is used.

**Acceptance Criteria:**
- [x] Given I am on the Dashboard, I see a text area for writing a custom AI instruction and a toggle to choose between "Default" and "Custom."
- [x] Given the toggle is set to "Default," the built-in prompt is active and any text I've written in the text area is preserved but not in use.
- [x] Given I type a custom instruction and set the toggle to "Custom," the next message I send on the Chat page uses my custom instruction instead of the default.
- [x] Given I switch the toggle from "Custom" back to "Default," the text I wrote remains in the text area unchanged.
- [x] Given I type in the text area and navigate away, when I return to the Dashboard my text is still there.
- [x] Given the text area is empty and the toggle is set to "Custom," the AI uses the built-in default prompt (an empty custom instruction is treated as no custom instruction).

---

## 3. Scope and Boundaries

### In-Scope

- A usage counter on the Dashboard for shared-key users (messages used / daily allowance).
- A session token counter on the Dashboard for own-key users.
- A language selector that saves the selection and immediately starts a new conversation when changed.
- A single custom-prompt text area with a Default / Custom toggle.
- Automatic saving of the custom prompt text (no explicit save action required).

### Out-of-Scope

- Visual warning states on the usage indicator (limit alerts are handled on the Chat page, not the Dashboard).
- A prompt library or multiple named custom prompts (single slot only).
- A confirmation dialog when changing language (the change is immediate and silent).
- Browsing or replaying past conversations — covered by the Chat History spec.
- Admin Panel KPI cards and visitor management — separate feature, separate spec.
- Any global settings editor for the daily visitor cap or per-user limits — deferred.
