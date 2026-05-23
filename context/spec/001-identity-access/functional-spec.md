# Functional Specification: Identity & Access — Name-Based Login

- **Roadmap Item:** Phase 1 — Identity & Access (Name-based login)
- **Status:** Completed
- **Author:** Serhii Kushnir

---

## 1. Overview and Rationale (The "Why")

INTSE is a personal language-practice tool that needs to know who is using it so it can apply fair daily usage limits. However, requiring an email address and password would create unnecessary friction and discourage casual use.

The solution is a zero-friction "login by name" system: the user simply types a name, and the app either welcomes them for the first time or recognises them as a returning user. The name is remembered on that device so the user never has to type it again unless they choose to switch to a different person.

**Success looks like:** Any user can open the app, type a name, and be on the Dashboard within two taps — with no account setup, no email verification, and no passwords to forget.

---

## 2. Functional Requirements (The "What")

> **Note:** Sections 2.1–2.5 (name-based login) were superseded by spec 002 (anonymous auto-enrollment) before implementation. The cleanup work in §2.6 was fully implemented and verified.

### 2.1 The Welcome / Login Screen

On first open (and whenever no user is currently logged in), the app displays a full-screen welcome screen containing:

- The **app logo and name** ("INTSE") prominently at the top
- A short **tagline** beneath the name (e.g., "Your AI language practice partner")
- A **name input field** with placeholder text (e.g., "Enter your name")
- A **"Continue" button** that submits the name

**As a** first-time visitor, **I want to** enter my name and tap Continue, **so that** I can start using the app without creating an account.

- **Acceptance Criteria:**
  - [ ] When the app is opened for the first time, the welcome screen is the first thing the user sees.
  - [ ] The screen shows the app logo, app name, a tagline, a name input field, and a Continue button.
  - [ ] The Continue button is disabled (or shows a validation message) if the name field is empty.

### 2.2 Name Validation

The name the user enters must meet these rules before the app accepts it:

- At least **2 characters** long
- No more than **32 characters** long
- May only contain **letters, numbers, and spaces**

If the name fails validation, the input field shows an inline error message describing the problem (e.g., "Name must be at least 2 characters" or "Only letters, numbers, and spaces are allowed").

- **Acceptance Criteria:**
  - [ ] Submitting a name shorter than 2 characters shows an inline error and does not proceed.
  - [ ] Submitting a name longer than 32 characters shows an inline error and does not proceed.
  - [ ] Submitting a name with special characters (e.g., `@`, `#`, `-`) shows an inline error and does not proceed.
  - [ ] Submitting a valid name (2–32 characters, letters/numbers/spaces) proceeds to the uniqueness check.

### 2.3 Uniqueness Check

Each name must be unique across all users of the app. If someone else has already registered the same name:

- The app shows an inline error: **"This name is already taken. Please choose a different one."**
- The user can edit the name and try again.

- **Acceptance Criteria:**
  - [ ] Submitting a name that is already registered shows the "already taken" error message on the same screen.
  - [ ] The user can clear the field and try a different name without leaving the welcome screen.
  - [ ] Submitting a name that has never been used before proceeds and takes the user to the Dashboard.

### 2.4 Return Visits — Automatic Recognition

Once a user has successfully logged in, the app remembers them on that device. On every subsequent open:

- The welcome/login screen is **skipped entirely**
- The user lands directly on the **Dashboard**

- **Acceptance Criteria:**
  - [ ] After a successful first login, closing and reopening the app goes straight to the Dashboard without showing the welcome screen.
  - [ ] The Dashboard displays the user's name (e.g., in the header or navigation area).

### 2.5 Switching Users / Logging Out

A **"Switch user"** or **"Log out"** option is accessible from the Dashboard or Settings. When activated:

- The current user's session is cleared from the device
- The app returns to the welcome/login screen
- Another person can now enter their name and log in

- **Acceptance Criteria:**
  - [ ] A "Switch user" or "Log out" control is visible somewhere on the Dashboard or in the Settings area.
  - [ ] Tapping it clears the remembered user and shows the welcome/login screen.
  - [ ] A new name can then be entered and submitted successfully.

### 2.6 Project Cleanup — Public Repository Standards

Because the INTSE repository will be public, the codebase must be clean, intentional, and free of leftovers from previous work. Any developer browsing the repo should only find code that is actually used by the app.

The following cleanup must be completed as part of Phase 1, before any new feature work begins:

**Remove unused files:**
- All chart-related utility files (sinusoid generators, dynamic size scaler) — left over from a previous project
- The type definition file that only contained types for the deleted chart utilities
- All SVG icon files for the deleted forecasting feature
- Navigation icons that have no relevance to INTSE (location pin, package, receipt, shopping cart, sort arrows)

**Remove unused third-party packages** (dependencies that are no longer imported anywhere in the project):
- The charting library (`recharts`)
- The drag-and-drop library (`react-dnd`)
- The file drop zone library (`react-dropzone`)
- The date picker library (`flatpickr`)

**Migrate the theme toggle logic:**
- The app currently manages dark/light theme through a standalone React Context. Since the architecture calls for Zustand as the single state management solution, the theme preference must be moved into the Zustand settings store so the approach is consistent throughout the project.

**What to keep:**
- The `cn` classname utility — used across all components
- The SVG type declaration file — needed for importing SVG files as React components
- Theme toggle icons (moon and sun SVGs) — used by the theme switch control
- The home and log-out navigation icons — relevant to INTSE's navigation

- **Acceptance Criteria:**
  - [x] Running `npm install` produces no warnings about packages being installed but not used.
  - [x] No files remain in the project that are never imported by any other file.
  - [x] The package list contains no libraries whose only purpose was to support the deleted chart or forecasting features.
  - [x] Dark/light theme toggling works correctly and is controlled through the same state management system used by the rest of the app.
  - [x] A developer cloning the repo sees a folder structure with no mystery files or dead code.

---

## 3. Scope and Boundaries

### In-Scope

- The full-screen welcome screen (logo, tagline, name input, Continue button)
- Name validation (length, allowed characters)
- Name uniqueness enforcement with an error message
- Remembering the logged-in user on the device across sessions
- Automatic skip of the login screen for returning users
- "Switch user / Log out" action to clear the session
- Project cleanup: remove all unused files, icons, utilities, and third-party packages
- Migration of theme toggle state into the Zustand settings store

### Out-of-Scope

The following features are part of later roadmap phases and are explicitly excluded from this specification:

- Password, email, or social login (not part of this app at any phase)
- The Dashboard content, navigation, or layout (Phase 4)
- Usage limit enforcement or daily counters (Phase 2)
- API key settings (Phase 2)
- Chat history or any chat functionality (Phases 2–4)
- The universal popup/notification component (separate Phase 1 item)
