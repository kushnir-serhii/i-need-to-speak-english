# Functional Specification: Anonymous Access with Daily User Cap

- **Roadmap Item:** Phase 1 — Identity & Access (revised approach — supersedes the auth section of spec 001)
- **Status:** Completed
- **Author:** Serhii Kushnir

> **Note:** The project cleanup work completed in spec 001 (Slices 1–2: dead code removal, font migration, Zustand stores) remains valid. Only the authentication mechanism is replaced by this spec.

---

## 1. Overview and Rationale (The "Why")

INTSE uses the owner's AI API key to power conversations. Without any access control, a single person could make unlimited requests and rack up significant costs. However, requiring a registration form with email and password adds unnecessary friction for a language-practice app — many users would abandon it before they even started a conversation.

The solution is invisible identity: when someone opens the app for the first time, they are silently and automatically enrolled as a visitor. No sign-up form, no email, no password. The app tracks visitors anonymously to enforce a daily cap on how many new people can access it per day, and to apply a fair per-visitor request limit for those using the owner's key.

**Success looks like:** A visitor opens the app, is greeted immediately, types (or speaks) a message, and gets an AI response — all without filling in a single form. The owner never receives an unexpected API bill.

---

## 2. Functional Requirements (The "What")

### 2.1 First Visit — Silent Enrollment

When someone opens the app for the first time on a device:

1. The app **silently checks** whether the daily visitor cap has been reached.
2. **If the cap has not been reached:** the visitor is enrolled (their invisible ID is saved in their browser) and the app proceeds normally.
3. **If the cap has been reached:** the visitor sees the Daily Limit Reached screen (see §2.3) and cannot access the app until the next day.

This happens instantly with no visible loading state or form.

- **Acceptance Criteria:**
  - [x] A brand-new visitor on a device with no app history either enters the app or sees the limit screen — never a registration form.
  - [x] A returning visitor (previously enrolled on this device) always enters the app directly, regardless of whether the daily cap is full.

### 2.2 First Visit — Name Prompt

After a new visitor is successfully enrolled, the app shows a one-time welcome prompt:

- A friendly message: **"What's your name?"**
- A text input field
- A **"Let's go"** button
- A **"Skip"** link (the name is optional)

The name is saved only on the visitor's own device. It is never sent to any server. If provided, the app uses it for a personalised greeting (e.g., **"Hi, Maria!"**) throughout the session.

Returning visitors who already enrolled on a previous visit **never see this prompt again**, even if they previously skipped it.

- **Acceptance Criteria:**
  - [x] A newly enrolled visitor sees the name prompt before reaching the dashboard.
  - [x] Entering a name and tapping "Let's go" saves the name and proceeds to the dashboard.
  - [x] Tapping "Skip" proceeds to the dashboard without saving a name.
  - [x] A returning visitor (enrolled on a previous visit) never sees the name prompt again.
  - [x] If a name was provided, the dashboard greets the user by name. If skipped, a generic greeting is shown (e.g., "Hi there!").

### 2.3 Daily User Cap — Limit Reached Screen

When the daily cap of new visitors is full, any brand-new visitor sees a limit screen instead of the app. The screen displays:

- The INTSE logo and name
- A clear message: **"We've reached our daily visitor limit. Come back tomorrow!"**
- The current count and the cap (e.g., **"100 / 100 visitors today"**)
- No form, no input — only the message and branding

Existing enrolled visitors are **not affected** — they can always access the app regardless of the cap.

- **Acceptance Criteria:**
  - [x] A new visitor who arrives when the daily cap is full sees the limit screen, not the app.
  - [x] The limit screen shows the current visitor count and the daily cap.
  - [x] An existing visitor who arrives when the daily cap is full enters the app normally.

### 2.4 Daily Visitor Counter in the Header

The app header displays a live visitor counter, visible to all users:

- Format: **"X / Y visitors today"** (e.g., "47 / 100 visitors today")
- X = number of unique new visitors enrolled today
- Y = the daily cap set by the owner
- Reflects the current calendar day

- **Acceptance Criteria:**
  - [x] The visitor counter is visible in the header on every page of the app.
  - [x] The count increases as new visitors enroll during the day.
  - [x] The count resets to 0 at the start of each new calendar day.

### 2.5 Per-Visitor Request Limits (Default Key Only)

The server tracks a daily request counter per visitor (`dailyRequests`, `dailyRequestLimit`) and resets it lazily on each `/api/stats` call at the start of a new calendar day. The counter infrastructure is fully in place.

> **Note:** Chat-side enforcement (limit notification, disabled input, BYO key bypass) requires the Phase 2 chat UI and will be verified in the Phase 2 spec.

- **Acceptance Criteria:**
  - [x] The per-visitor request counter resets at the start of each new calendar day (lazy reset in `/api/stats`).

### 2.6 Returning Visitor Recognition

When a visitor who has already enrolled on a previous visit opens the app:

- No cap check is performed — they go straight to the app
- Their saved name (if they provided one) is shown in the greeting
- Their personal daily request count for the current day is tracked and enforced normally

- **Acceptance Criteria:**
  - [x] A returning visitor on the same device bypasses the cap check and enters the app immediately.
  - [x] The visitor's previously saved name is shown in the greeting.
  - [x] Their daily request count starts fresh each new calendar day.

---

## 3. Scope and Boundaries

### In-Scope

- Silent auto-enrollment of new visitors (no form, no registration)
- Daily cap on total new visitors per day
- Daily Limit Reached screen for new visitors when the cap is full
- One-time optional name prompt for newly enrolled visitors (name saved on-device only)
- Visitor counter in the header showing current count vs. daily cap
- Per-visitor daily request limit for visitors using the owner's API key
- Returning visitor recognition (bypasses cap check, shows saved name)
- All counters reset daily at the start of a new calendar day

### Out-of-Scope

- Email, password, OAuth, or any login/registration form — not in this version
- Email verification or account recovery
- User profiles or any persistent account data stored on the server
- Admin panel for viewing per-visitor usage (monitoring via database queries directly)
- Usage limits for visitors using their own API key
- All chat, voice, and dashboard features (Phases 2–4)
