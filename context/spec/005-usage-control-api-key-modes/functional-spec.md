# Functional Specification: Usage Control & API Key Modes

- **Roadmap Item:** Phase 2 — Usage Control & API Key Modes
- **Status:** Approved
- **Author:** Serhii Kushnir

---

## 1. Overview and Rationale (The "Why")

INTSE is a free, open-to-anyone practice tool — which means left unchecked, a handful of heavy users could exhaust the owner's AI budget in a single day. Without usage controls, the app cannot be kept free and accessible for everyone.

At the same time, power users like Andriy (who has their own AI account) shouldn't be constrained by limits that don't apply to them. They should be able to paste their own key and get unlimited access.

**Success looks like:** A casual user can have meaningful practice sessions within a daily message allowance and always knows how much they have left. A power user can bypass those limits instantly by supplying their own key. The owner's AI costs are protected automatically, every day, without any manual intervention.

---

## 2. Functional Requirements (The "What")

### 2.1 Two Operating Modes

The app always operates in one of two modes:

- **Free mode** — the app uses the owner's shared AI key. Each user gets a fixed number of messages per day. When that allowance is used up, the chat is paused until the next day.
- **Your key mode** — the user has supplied their own AI key. There is no daily message limit. The app tracks and displays how many AI tokens the user is consuming, as an informational counter only.

The current mode is always visible in the chat interface via a subtle label — either **"Free mode"** or **"Using your key"** — so the user always knows which mode they are in.

### 2.2 Daily Message Counter (Free Mode)

While in Free mode, a counter is shown in the chat interface that tells the user how many messages they have left for the day, for example: **"15 messages left today"**. This counter updates immediately after each message the user sends, so they can always pace themselves. The counter is hidden when in Your Key mode.

### 2.3 Reaching the Daily Limit (Free Mode)

When the user sends their last allowed message, the chat input area is immediately disabled — the text field and the Send button become greyed out and unresponsive. At the same moment, a popup appears with the following message:

> *"You've reached your daily message limit. Come back tomorrow — or use your own AI key to continue now."*

The popup has two buttons:
- **"Enter your key"** — expands the popup to show a field where the user can paste their own AI key. Once saved, the app immediately switches to Your Key mode, the popup closes, the input area re-enables, and the user can continue chatting without limits.
- **"OK"** — dismisses the popup. The chat input remains disabled. The user can still scroll and read the conversation thread, but cannot send new messages.

### 2.4 Daily Limit Reset

Limits restore automatically at the start of a new day. There is no notification — the user simply finds the input active and their counter refreshed the next time they open the app.

### 2.5 Entering a Key (Your Key Mode)

There are two ways to enter a personal AI key:

1. **Settings page** — a clearly labelled field where the user can paste their key at any time. Once saved, the app switches to Your Key mode immediately. The mode indicator in the chat updates to "Using your key" and the daily message counter disappears.
2. **Limit-reached popup** — as described in §2.3, the "Enter your key" button opens an inline key entry field directly within the popup, so the user doesn't have to navigate away to continue.

### 2.6 Token Usage Counter (Your Key Mode)

When in Your Key mode, a running token counter is visible in two places:
- **In the chat interface** — updated after each exchange, showing the total tokens consumed so far in the current session (combined input and output).
- **On the dashboard** — shows the cumulative token count since the user first switched to Your Key mode.

This counter is informational only. It never blocks the user from sending messages.

### 2.7 Invalid or Expired Key

If a user is in Your Key mode and their key is rejected (invalid, expired, or incorrectly formatted), the app shows a specific error message:

> *"Your API key appears to be invalid. Please check it in Settings."*

The user's message remains visible in the conversation thread. They can go to Settings, correct the key, and continue.

### 2.8 Removing a Key

The user can clear their key from the Settings page. Doing so immediately returns the app to Free mode — the mode indicator reverts to "Free mode", the daily message counter reappears, and the daily limit applies from that moment.

---

## 3. Acceptance Criteria

**Mode indicator**
- [ ] The chat interface always shows a label indicating the current mode — either "Free mode" or "Using your key".
- [ ] Switching modes (entering or removing a key) updates the label immediately without a page reload.

**Daily message counter (Free mode)**
- [ ] While in Free mode, a counter is visible in the chat showing how many messages the user has left today (e.g. "15 messages left today").
- [ ] The counter decrements by one immediately after each message is sent.
- [ ] The counter is not visible in Your Key mode.

**Limit enforcement (Free mode)**
- [ ] When the user's last allowed message is sent, the text field and Send button become disabled.
- [ ] A popup appears with the message: "You've reached your daily message limit. Come back tomorrow — or use your own AI key to continue now."
- [ ] The popup has an "Enter your key" button and an "OK" button.
- [ ] Pressing "OK" dismisses the popup; the input remains disabled.
- [ ] Pressing "Enter your key" expands the popup to show a key entry field.
- [ ] After entering a valid key in the popup, the app switches to Your Key mode, the popup closes, and the chat input becomes enabled.
- [ ] After the daily reset, the input is enabled again and the counter is restored to its full value.

**BYO key entry (Settings page)**
- [ ] The Settings page has a labelled field for entering a personal AI key.
- [ ] Saving a key immediately switches the app to Your Key mode.
- [ ] Clearing the key field and saving immediately returns the app to Free mode.

**Token counter (Your Key mode)**
- [ ] While in Your Key mode, a token counter is visible in the chat interface, updating after each exchange.
- [ ] The same cumulative token count is visible on the dashboard.
- [ ] The token counter is not visible in Free mode.

**Invalid key**
- [ ] If a message fails due to an invalid or expired key, the error message shown is: "Your API key appears to be invalid. Please check it in Settings."
- [ ] The failed message remains visible in the conversation thread.

**Key removal**
- [ ] Removing the key from Settings immediately reverts the app to Free mode.
- [ ] Daily limits apply again from the moment the key is removed.

---

## 4. Scope and Boundaries

### In-Scope
- Daily message limit enforcement per user in Free mode
- Daily limit counter in the chat interface
- Limit-reached popup with key entry shortcut
- Settings page key entry field
- Mode switching (Free ↔ Your Key) at any time
- Token usage counter in chat and dashboard (Your Key mode)
- Mode indicator label in the chat interface
- Invalid key error message
- Silent daily limit reset

### Out-of-Scope
The following are covered by other roadmap items and specs:
- **Voice input / speech-to-text** — Phase 3
- **AI voice playback** — Phase 3
- **Per-message actions menu** — Phase 3
- **Chat history browser on dashboard** — Phase 4
- **Custom system prompt** — Phase 4
- **Language selector** — Phase 4
- **Admin monitoring panel** — usage monitoring is done directly via database queries; no UI is built for it in this version
