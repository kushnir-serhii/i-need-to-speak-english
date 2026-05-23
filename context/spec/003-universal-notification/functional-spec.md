# Functional Specification: Universal Notification System

- **Roadmap Item:** Phase 1 — Shared UI Primitives
- **Status:** Completed
- **Author:** Serhii Kushnir

---

## 1. Overview and Rationale (The "Why")

INTSE needs a single, consistent way to communicate important events to the user — whether that's a helpful confirmation ("Your API key has been saved"), a time-sensitive warning ("You've used your daily message allowance"), or a request for permission before a destructive action ("Delete this message?").

Without a shared notification system, each part of the app would handle these messages differently — some might be silent, others might use browser dialogs, and the result would feel inconsistent and unpolished. A single reusable component ensures every notification in the app looks and behaves the same way, regardless of where it is triggered.

**Success looks like:** Any part of the app can show the user a clear, well-styled message — brief and non-intrusive for simple information, persistent and attention-grabbing for warnings, and blocking with explicit choices for anything requiring a decision.

---

## 2. Functional Requirements (The "What")

### 2.1 Toast Notification

A **toast** is a small notification panel that slides up from the bottom-center of the screen. It is used for messages that do not require the user to make a decision — they simply need to be aware of something.

**Three visual types:**

| Type | Colour | Icon | When to use |
|---|---|---|---|
| **Info** | Blue | ℹ️ | Neutral confirmations (e.g., "API key saved", "Language changed") |
| **Warning** | Amber | ⚠️ | Something the user should be aware of (e.g., "You're approaching your daily limit") |
| **Error** | Red | ✕ | Something has gone wrong or a hard limit has been reached (e.g., "Daily message allowance used") |

**Appearance:**
- Slides up from the bottom-center of the viewport
- Contains: a type icon on the left, a message text, and an × close button on the right
- Sits above all other app content so it is always visible

**Dismissal behaviour:**
- **Info toasts** — automatically disappear after **4 seconds**. The user can also tap × to dismiss sooner.
- **Warning and error toasts** — remain on screen until the user taps × to dismiss them. They do not auto-disappear.

**Multiple toasts:** If more than one toast is triggered in quick succession, they stack vertically above each other (newest on top).

---

### 2.2 Confirmation Modal

A **confirmation modal** is used when the user is about to take an action that cannot be easily undone (e.g., deleting a chat message, clearing chat history). The modal requires the user to explicitly confirm or cancel before anything happens.

**Appearance:**
- A dimmed, semi-transparent overlay covers the entire screen behind the modal
- A centered card appears containing:
  - A **title** (short, one line — e.g., "Delete this message?")
  - A **body message** (one to two sentences explaining what will happen)
  - Two buttons: a **primary action button** (e.g., "Delete") and a **"Cancel" button**

**Behaviour:**
- The app behind the modal is completely non-interactive while the modal is open
- Tapping **Cancel** or tapping the dimmed background area closes the modal without taking any action
- Tapping the **primary action button** carries out the action and closes the modal
- The primary action button is styled to signal the nature of the action: red/destructive for deletions, accent-blue for confirmations

---

### 2.3 General Behaviour

- Only **one toast** of the same type can be visible at a time. If a second toast of the same type is triggered while the first is still on screen, the first is replaced.
- Only **one confirmation modal** can be open at a time.
- Both toasts and modals are rendered above all other content, including the navigation and header.
- On mobile, toasts are full-width with small horizontal padding so they are easy to read and dismiss with a thumb.

---

## 3. Acceptance Criteria

**Toasts — Info**
- [x] Triggering an info notification shows a blue toast at the bottom-center of the screen.
- [x] The toast contains a blue info icon, a message, and an × button.
- [x] The toast disappears automatically after 4 seconds with no user interaction.
- [x] Tapping × dismisses the toast immediately before the 4 seconds expire.

**Toasts — Warning**
- [x] Triggering a warning notification shows an amber toast at the bottom-center.
- [x] The toast does not disappear automatically — it stays until the user taps ×.

**Toasts — Error**
- [x] Triggering an error notification shows a red toast at the bottom-center.
- [x] The toast does not disappear automatically — it stays until the user taps ×.

**Toast stacking**
- [x] If two different toasts are triggered in quick succession, both are visible, stacked vertically.
- [x] If a second toast of the same type appears while the first is visible, the first is replaced by the new one.

**Confirmation Modal**
- [x] Triggering a confirmation shows a dimmed background and a centered card with a title, body message, primary action button, and Cancel button.
- [x] While the modal is open, tapping anything behind the overlay has no effect.
- [x] Tapping Cancel (or the dimmed background) closes the modal; the action is not taken.
- [x] Tapping the primary action button closes the modal and carries out the described action.

**Mobile**
- [x] On a screen narrower than 480px, toasts span the full width of the screen with small side padding.
- [x] The confirmation modal card fits within the mobile screen with visible padding on all sides.

---

## 4. Scope and Boundaries

### In-Scope
- Toast component: info, warning, and error types
- Auto-dismiss for info toasts (4 seconds); manual dismiss for warning and error
- Confirmation modal with title, body, primary action, and cancel
- Stacking behaviour for multiple simultaneous toasts
- Mobile-responsive layout for both toasts and modal

### Out-of-Scope
- **The specific messages shown by other features** (daily limit text, delete confirmation text, etc.) — those are defined in the Phase 2 and Phase 3 specs that trigger this component.
- Progress bars, loading spinners, or any notification beyond the three toast types and the modal.
- Sound effects or vibration on notification.
- Notification history / inbox (there is no log of past notifications).
- All Phase 2–4 features: chat, voice, dashboard, token counters, API key input.
