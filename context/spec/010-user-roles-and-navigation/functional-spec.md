# Functional Specification: User Roles & Navigation

- **Roadmap Item:** Role-based access control — USER role with usage limits, ADMIN role with full access, and correct navigation per role
- **Status:** Completed
- **Author:** Serhii Kushnir

---

## 1. Overview and Rationale (The "Why")

The app serves two distinct types of people. **Regular visitors** practice English within daily usage limits — this protects the app's running costs. **The app owner (Admin)** monitors visitor activity, adjusts limits, and manages the app with no usage restrictions.

Currently the two roles exist in the code, but their names are inconsistent, their navigation items are misaligned, and access rules are only partially enforced. This specification defines the correct, authoritative behavior for both roles so that:

- Regular visitors see only the pages relevant to them and are subject to daily limits.
- The Admin can access management tools invisible to everyone else and is never blocked by any daily cap.
- Unauthorized access to protected pages is handled gracefully.

---

## 2. Functional Requirements (The "What")

### 2.1 — Two Roles

**Regular Visitor (USER role)**
- Any visitor who opens the app is a regular user — no registration, no password, no action required.
- Their daily AI message count and token usage are tracked and enforced server-side.
- When they hit the daily limit, the chat input becomes disabled and a notification explains when the limit resets.
- If they provide their own API key in the Settings area, daily limits no longer apply; a running token counter is shown instead for information only.

**App Owner (ADMIN role)**
- The admin accesses the app through a dedicated sign-in page that is not linked from anywhere in the regular user interface.
- Not subject to any daily message or token limits, regardless of which API key is in use.
- Has exclusive access to the Admin Panel.

---

### 2.2 — Sign-In Flow

**Regular Users:**
No sign-in required. The app automatically recognizes returning visitors by their device. A one-time optional name prompt appears on the very first visit for personalisation — it can be skipped.

**Admin:**
1. The admin navigates directly to the sign-in page via a known URL (e.g., `/login`).
2. The page is not linked from anywhere visible to regular users.
3. The admin enters a username and password and submits the form.
4. **On success:** the admin is taken to the Chat page with full admin access active.
5. **On wrong credentials:** an inline error message reads: *"Invalid username or password."*
6. **On network failure:** an inline error message reads: *"Something went wrong. Please try again."*
7. The admin session remains active until the admin explicitly signs out.

**Acceptance Criteria:**
- [x] Given the admin is on the sign-in page, when they enter valid credentials and click "Sign in", they land on the Chat page and the Admin Panel link is visible in navigation.
- [x] Given the admin enters incorrect credentials, when they submit, the error "Invalid username or password." appears below the form without a page reload.
- [x] Given a regular visitor navigates to `/login`, they see the sign-in form with no difference in appearance, but they cannot gain admin access without valid credentials.

---

### 2.3 — Navigation

Navigation is visible in the sidebar on larger screens and the bottom bar on mobile. The items shown depend strictly on the user's role. Items the current role cannot access are **absent entirely** — not greyed out, not hidden behind a lock icon.

**Regular User navigation:**
| Item | Destination |
|------|-------------|
| Chat | Home / main conversation page |
| Dashboard | Personal area: language selector, API key input, usage indicator, custom prompt |
| Sign out | Clears session, returns to enrollment screen |

**Admin navigation:**
| Item | Destination |
|------|-------------|
| Chat | Home / main conversation page |
| Dashboard | Same personal area as user |
| Admin Panel | Global stats, per-visitor data, app settings |
| Sign out | Ends admin session, redirects to the sign-in page |

**Acceptance Criteria:**
- [x] Given a regular user is signed in, only Chat, Dashboard, and Sign out are visible in navigation. No Admin Panel link appears anywhere.
- [x] Given the admin is signed in, Chat, Dashboard, Admin Panel, and Sign out are all visible in navigation.
- [x] Given a regular user clicks Sign out, they are returned to the enrollment/name screen and the session is cleared.
- [x] Given the admin clicks Sign out, they are redirected to the `/login` sign-in page.

---

### 2.4 — Admin Panel

The Admin Panel is a dedicated page accessible to the Admin only. It contains four sections:

**Summary cards (top of page):**
- Total visitors ever enrolled in the app
- Visitors active today
- AI messages sent today (across all visitors)
- Tokens consumed today (across all visitors)

**Activity chart:**
- A bar chart showing today's top visitors ranked by message count.
- If no visitors have been active today, a message reads: *"No visitor activity today yet."*

**Per-visitor usage list:**
- A list of all visitors with their individual daily request count and daily token usage.
- Each row includes a **Reset** button that clears that visitor's daily counters immediately, allowing them to continue chatting before the automatic midnight reset.
- After clicking Reset, the row updates to show zeroed counters.

**Global settings form:**
- Fields to update:
  - Daily visitor cap (maximum new visitors enrolled per day)
  - Per-visitor daily request limit (maximum AI messages per visitor)
  - Per-visitor daily token budget
- A Save button applies the changes immediately.
- A confirmation message appears after saving: *"Settings updated."*

**Acceptance Criteria:**
- [x] Given the admin is on the Admin Panel, all four summary cards are visible with current values.
- [x] Given a visitor has used 5 of their 10 daily messages, when the admin clicks Reset for that visitor, their daily request count resets to 0 and the updated value is reflected in the list.
- [?] Given the admin changes the daily visitor cap and clicks Save, the new cap is applied immediately and the updated value is reflected in the header visitor counter. _(Deferred — settings remain in env vars per tech spec decision; a dedicated settings editor spec is needed.)_
- [x] Given a regular user navigates directly to the Admin Panel URL, they are silently redirected to the Chat page.
- [x] Given an unauthenticated visitor navigates directly to the Admin Panel URL, they are redirected to the sign-in page. _(Note: auto-enrolled visitors are redirected to `/`; expired admin sessions are redirected to `/login` via the stats-fetch fallback.)_

---

### 2.5 — Usage Limits Enforcement

- After each AI message from a regular visitor, the remaining daily allowance is checked server-side.
- When the limit is reached, the chat input is disabled and a notification is shown.
- Limits reset automatically at midnight UTC.
- The Admin is **never** subject to daily limits — the limit check is skipped entirely for admin sessions.
- A visitor who has entered their own API key is also not subject to daily limits.

**Acceptance Criteria:**
- [x] Given a regular visitor has reached their daily message limit, the chat input is disabled and a notification is shown explaining when the limit resets.
- [x] Given the admin is signed in, the chat input is never disabled due to daily limits, even after many messages.
- [x] Given a regular visitor has entered their own API key, the daily limit is not enforced and a token counter is displayed instead.

---

## 3. Scope and Boundaries

### In-Scope

- Two clearly defined roles: Regular User (USER) and Admin (ADMIN).
- Consistent role naming across all parts of the app.
- Dedicated admin sign-in page at a hidden URL, with username + password.
- Role-based navigation: USER sees Chat + Dashboard + Sign out; ADMIN sees Chat + Dashboard + Admin Panel + Sign out.
- Admin Panel with global summary stats, per-visitor usage list with reset action, and global settings editor.
- Daily usage limits enforced for USER, completely bypassed for ADMIN.
- Redirect rules for unauthorized access: regular users redirected to Chat, unauthenticated visitors redirected to sign-in page.

### Out-of-Scope

- Phase 4 personal Dashboard features (language selector, custom prompt editor, full chat history browser) — covered in a separate specification.
- Payment, subscription billing, or paid tiers.
- Social features: shared rooms, leaderboards, friend lists.
- Native iOS or Android applications.
- Automated grammar scoring or correction engine.
- Server-side chat history storage or multi-device sync.
- All other roadmap items not listed above.
