# Functional Specification: Language Selector

- **Roadmap Item:** Target language picker — let users choose any language to practice; the selection filters available TTS voices and informs the AI conversation partner
- **Status:** Completed
- **Author:** Serhii Kushnir

---

## 1. Overview and Rationale (The "Why")

INTSE is a conversational language-practice tool — but currently the AI always responds as if the target language is English, and TTS voices are not filtered by language. There is no way for a user to tell the app "I want to practice Spanish today." This makes the app unsuitable for anyone who is not practicing English.

The language selector gives users control over which language they are practicing. Once set, the AI converses in that language, and only voices suitable for that language are offered in the TTS voice picker. The setting lives in the Settings page and persists across sessions so the user does not have to re-select it every time.

---

## 2. Functional Requirements (The "What")

### 2.1 — The Language Selector Control

- The Settings page contains a searchable language picker labelled "Practice language."
- The list shows all languages that have at least one voice available in the user's browser, displayed as English names (e.g., "Spanish", "French", "German").
- The user types in the search box to filter the list in real time.
- Selecting a language saves the choice immediately. No "Save" button needed — the selection takes effect as soon as it is made.
- The selected language persists across browser sessions — returning visitors see their previously chosen language pre-selected.

**Acceptance Criteria:**
- [x] Given the user opens the Settings page, a labelled language picker is visible.
- [x] Given the user types "spa" into the picker, only languages containing those letters (e.g., "Spanish") appear in the list.
- [x] Given the user selects "Spanish", that selection is shown as the active choice and is still shown the next time they open the app.
- [x] Given a brand new visitor opens the app for the first time, "English" is pre-selected in the language picker.

### 2.2 — Effect on the AI Conversation

- When a language is selected, the AI is instructed to converse in that language from the next message the user sends. The current conversation history is not affected or cleared.
- English is the default language for new visitors. The user can change it at any time in Settings.

**Acceptance Criteria:**
- [x] Given the user selects "French" in Settings and returns to Chat, the next AI reply is in French.
- [x] Given a new visitor sends their first message without changing the language, the AI replies in English.
- [x] Given the user changes the language mid-conversation, previous messages are not affected, but the next AI reply uses the new language.

### 2.3 — Effect on TTS Voice List

- The voice picker shown in the per-message context menu (three-dot button on AI messages) shows only voices that match the currently selected practice language.
- If no language is selected, the voice picker shows all available voices.

**Acceptance Criteria:**
- [x] Given the user has selected "Spanish" and opens the voice picker on any AI message, only Spanish voices are listed.
- [x] Given no language is selected, the voice picker lists all voices available in the browser.

---

## 3. Scope and Boundaries

### In-Scope

- A searchable language picker on the Settings page.
- The selection filters TTS voices in the per-message voice picker.
- The selection is passed to the AI so it responds in the chosen language.
- The setting persists across browser sessions.
- Language list is drawn from voices available in the user's own browser (no hard-coded list).

### Out-of-Scope

- Language selector on the Dashboard or Chat page (Settings only for now).
- A mandatory language-selection prompt on first visit.
- Hard-coded language catalogue independent of the browser's voice availability.
- Phase 4 Dashboard features (chat history, usage indicator, custom prompt editor) — separate spec.
- Admin Panel settings editor — separate spec.
- Payment, social features, native apps, grammar scoring, server-side history sync.
