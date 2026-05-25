# Functional Specification: Per-Visitor Daily Message Limit

- **Roadmap Item:** Per-visitor daily request limit (default key)
- **Status:** Completed
- **Author:** Serhii Kushnir

---

## 1. Overview and Rationale (The "Why")

The app uses the owner's AI key to power conversations for all visitors. Without a daily message cap, a single visitor could consume a disproportionate share of the daily allowance, driving up costs or cutting off other users.

This feature enforces a daily ceiling on how many AI messages each visitor can send while using the shared key. Once a visitor hits their limit, they are informed clearly and offered an alternative path — switching to their own key. The limit resets automatically at the start of each new day, restoring full access without any action from the visitor.

**Goal:** Protect the owner's daily budget while giving every visitor a fair, predictable share of the shared allowance.

---

## 2. Functional Requirements (The "What")

### 2.1. Remaining Message Counter in the Chat Header

- While a visitor still has messages available for the day, the chat header displays how many AI messages they can still send (e.g., "12 messages left today").
- The counter decreases by one each time the visitor successfully sends a message and receives an AI reply.
- The counter is only shown when the app is using the shared (owner's) key. Visitors using their own key do not see this counter.

**Acceptance Criteria:**
- [x] When a visitor opens the chat in shared-key mode and has not yet reached the daily limit, the chat header displays a remaining count (e.g., "12 messages left today").
- [x] Each time the visitor sends a message and receives an AI reply, the number in the header decreases by one.
- [x] When the visitor switches to their own key, the remaining message counter disappears from the header.

---

### 2.2. Blocking the Input When the Limit is Reached

- When the visitor uses their last allowed message, the message input field becomes greyed out and unclickable immediately after the AI reply is received.
- The send button is also disabled at that moment.
- A popup notification appears with the message: **"You've reached today's limit. Come back tomorrow! You can also use your own key to continue."**
- The blocked state persists for the remainder of that calendar day.

**Acceptance Criteria:**
- [x] When the visitor's last allowed message receives an AI reply, the input field immediately becomes greyed out and cannot be clicked or typed into.
- [x] The send button is visually disabled and cannot be clicked.
- [x] The popup "You've reached today's limit. Come back tomorrow! You can also use your own key to continue." appears after the final reply is received.
- [x] Dismissing the popup does not restore the input — it remains blocked.
- [x] The remaining counter in the header shows "0 messages left today" (or equivalent) while blocked.

---

### 2.3. Automatic Reset at the Start of a New Day

- At the start of each new calendar day, the visitor's allowance resets to the full daily limit.
- If the visitor's app is still open when midnight passes, the input field automatically re-enables — no page refresh is required.
- The counter in the header updates to show the restored allowance.

**Acceptance Criteria:**
- [x] If the app is open in the blocked state and the day changes, the input field automatically becomes active again without any action from the visitor.
- [x] The header counter resets to the full daily allowance after the reset occurs.
- [x] If a visitor who was blocked the previous day returns the next day in a new session, the input is immediately available and the header shows the full remaining count.

---

### 2.4. No Limit for Visitors Using Their Own Key

- Visitors who have entered their own API key are not subject to the daily message limit.
- The remaining message counter is hidden in this mode.
- The input is never disabled by the daily limit for these visitors.

**Acceptance Criteria:**
- [x] When a visitor is using their own key, no remaining message counter appears in the chat header.
- [x] The message input is never greyed out or disabled due to a daily limit when the visitor is on their own key.

---

## 3. Scope and Boundaries

### In-Scope

- Displaying the remaining daily message count in the chat header (shared-key mode only).
- Disabling the message input and send button when the daily limit is reached.
- Showing the "reached limit" popup with a note about using a personal key.
- Automatically re-enabling the input when the new day begins, without requiring a page refresh.
- Hiding the counter entirely in personal-key mode.

### Out-of-Scope

- Configuring the size of the daily limit — this is an owner setting, not a visitor-facing concern.
- Any daily cap for visitors using their own key.
- Chat history persistence and the history browser (Phase 4 — separate roadmap items).
- The dashboard and its usage indicator panel (Phase 4 — separate roadmap items).
- Language selector (Phase 3 — separate roadmap item).
- Custom system prompt management (Phase 4 — separate roadmap item).
