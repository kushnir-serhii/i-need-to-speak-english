# Functional Specification: Chat History Persistence

- **Roadmap Item:** Chat History Persistence — save full conversation history to the server; browse, continue, and delete past sessions
- **Status:** Completed
- **Author:** Serhii Kushnir

---

## 1. Overview and Rationale (The "Why")

Every time a user closes or refreshes the app today, their conversation is gone permanently. For a language-practice tool this is a significant loss — reviewing past exchanges is valuable for learning, and accidentally closing a tab means losing work. This feature saves every session to the server tied to the user's identity, so conversations persist across browser clears and devices and can be picked up exactly where they left off.

---

## 2. Functional Requirements (The "What")

### 2.1 — The "New Conversation" Button

- A **New conversation** button is visible in the chat interface at all times.
- When clicked, a confirmation dialog appears with the message: *"Save this conversation before starting a new one?"* and three actions:
  - **Save** — saves the current conversation to history, clears the chat, and starts a fresh empty session.
  - **Discard** — clears the chat and starts a fresh empty session without saving.
  - **Cancel** — dismisses the dialog; the user stays in the current conversation unchanged.
- If the chat is already empty (no messages), clicking the button starts a new session immediately with no dialog.

**Acceptance Criteria:**
- [x] Given the user has messages in the chat and clicks "New conversation", the Save / Discard / Cancel dialog appears.
- [x] Given the user clicks "Save" in the dialog, the current conversation is saved and the chat clears.
- [x] Given the user clicks "Discard", the chat clears without the conversation being saved.
- [x] Given the user clicks "Cancel", nothing changes and the user remains in the current conversation.
- [x] Given the chat is empty, clicking "New conversation" starts a new session immediately with no dialog.

### 2.2 — Conversation Persistence Across Page Loads

- When the user refreshes or revisits the app, the current (most recent unsaved) conversation is automatically restored in the chat — they continue where they left off.
- Only the current unsaved session is restored on load. Saved history is accessible via the History page.

**Acceptance Criteria:**
- [x] Given the user has an ongoing conversation and refreshes the page, the same messages reappear in the chat.

### 2.3 — History Page

- A dedicated **History** page lists all saved conversations for the current visitor.
- Each entry shows:
  - The **date and time** the conversation was saved (e.g., "May 27, 2026 at 14:32").
  - A **preview** of the first message the user sent in that session (truncated to ~80 characters if longer).
- Entries are listed in reverse chronological order (most recent first).
- If no conversations have been saved yet, the page shows: *"No saved conversations yet. Start chatting and save your first session."*
- The History page is accessible from the navigation at `/history`.

**Acceptance Criteria:**
- [x] Given the user has saved two conversations, the History page shows both entries with date/time and a message preview, newest first.
- [x] Given no conversations have been saved, the History page shows the empty-state message.

### 2.4 — Opening and Continuing a Past Conversation

- Clicking a history entry loads that conversation as the active session in the Chat page and navigates the user there.
- The user can send new messages and continue from where that session left off.
- If the user currently has an unsaved conversation in the chat when they click a history entry, a prompt appears: *"You have an unsaved conversation. Save it before opening this one?"* with **Save**, **Discard**, and **Cancel** options.

**Acceptance Criteria:**
- [x] Given the user clicks a history entry, they are taken to the Chat page with the selected conversation loaded.
- [x] Given the loaded history session, the user can send a new message and receive an AI reply that continues the conversation.
- [x] Given the user has an unsaved conversation and clicks a history entry, the Save / Discard / Cancel prompt appears before the history session loads.

### 2.5 — Deleting History

- Each history entry has a **Delete** button (trash icon). Clicking it immediately removes that entry — no confirmation required.
- A **Clear all history** button appears on the History page. Clicking it shows a confirmation: *"Delete all [N] conversations? This cannot be undone."* with **Delete all** and **Cancel** options.
- After clearing all history, the empty-state message is shown.

**Acceptance Criteria:**
- [x] Given the user clicks the Delete button on a history entry, that entry is removed from the list immediately.
- [x] Given the user clicks "Clear all history" and confirms, all entries are removed and the empty-state message is shown.
- [x] Given the user clicks "Clear all history" and cancels, no entries are removed.

---

## 3. Scope and Boundaries

### In-Scope

- Saving and restoring conversations to and from the server, tied to the user's visitor identity.
- "New conversation" button with Save / Discard / Cancel dialog.
- Restoring the current unsaved session on page reload.
- History page at `/history` listing saved sessions with date + first message preview.
- Opening a saved session and continuing it as the active conversation.
- Deleting individual sessions and clearing all history.

### Out-of-Scope

- Searching or filtering within history.
- Exporting or sharing conversation history.
- Phase 4 Dashboard features (usage indicator, language selector on Dashboard, custom prompt editor) — separate spec.
- Admin Panel settings editor — separate spec.
- Admin visibility into individual user conversations.
