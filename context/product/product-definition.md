# Product Definition: INTSE (I Need to Speak English)

- **Version:** 1.0
- **Status:** Proposed

---

## 1. The Big Picture (The "Why")

### 1.1. Project Vision & Purpose

To give non-native English speakers (and any language learners) a private, AI-powered conversational practice partner that is always available, free to use within daily limits, and works entirely in the browser — voice and text — with zero sign-up friction. Visitors are enrolled anonymously and automatically; no registration, email, or password is ever required.

### 1.2. Target Audience

Non-native speakers of any language who want to practice conversational fluency in English (or any language supported by the AI). Users range from beginners to advanced learners. The app is designed to run on Vercel's free tier, so it is aimed at small-scale personal and shared use rather than enterprise scale.

### 1.3. User Personas

- **Persona 1: "Maria the Learner"**
  - **Role:** University student, native Spanish speaker, wants to improve English for job interviews.
  - **Goal:** Practice speaking and listening daily without paying for a tutor.
  - **Frustration:** Most apps focus on drills, not real conversation. She wants to speak freely and hear natural responses.

- **Persona 2: "Andriy the Developer"**
  - **Role:** Software engineer, native Ukrainian speaker, has his own OpenAI API key.
  - **Goal:** Use his own key for unlimited practice sessions and track exactly how many tokens each session costs.
  - **Frustration:** Generic chatbots don't follow a language-learning prompt; he wants a default system prompt tuned for language practice.

### 1.4. Success Metrics

- Users can complete a full voice conversation (STT → AI → TTS) without errors in the browser.
- Chat history is persisted in browser storage and is fully browsable across sessions on the same device.
- Default-key users never trigger unexpected Vercel costs — daily request count and token budget limits are enforced correctly in MongoDB.
- Zero overage charges on Vercel's free tier in the first month of use.

---

## 2. The Product Experience (The "What")

### 2.1. Core Features

1. **Anonymous auto-enrollment** — No registration, no login, no form of any kind. When someone opens the app for the first time, they are silently assigned an invisible visitor ID stored in their browser. A daily cap controls how many new visitors can be enrolled per day. A one-time optional name prompt ("What's your name?") personalises the greeting — the name is saved on-device only, never sent to the server.

2. **Two API-key modes**
   - *Default key mode:* The app uses the owner's API key. Per-user daily limits (request count + token budget) are enforced via MongoDB counters.
   - *BYO key mode:* The user pastes their own API key into a settings input. The app uses it directly. No limits enforced; input/output token usage is displayed as an informational counter only.

3. **AI chat interface (text + voice)**
   - Textarea for typing messages.
   - STT button to dictate input via the browser's Web Speech API.
   - TTS playback of AI responses via the browser's Speech Synthesis API.
   - Per-message context menu (three-dot button) with: playback speed slider, voice selector (voices available for the current language), repeat, copy, delete.

4. **System prompt management**
   - A hard-coded default prompt lives in the codebase (language-learning focused).
   - Users can write a custom prompt in a textarea on the dashboard; it is saved to browser storage (IndexedDB / localStorage) and used instead of the default when present.

5. **Dashboard**
   - Select the target language to practice (any language — free-text or searchable list drawn from the browser's available TTS voices).
   - Toggle between default system prompt and the user's custom prompt.
   - View and browse full chat history (stored in browser DB).
   - Token usage counter (for BYO-key users) or daily limit indicator (for default-key users).

6. **Universal popup / notification system**
   - A reusable popup component for alerts, limit warnings, confirmations, and informational messages.
   - Used throughout the app for consistent UX.

7. **Usage control via MongoDB**
   - Records per-user request count and token usage, reset daily.
   - Counts total unique users per day for monitoring.
   - Enforced server-side in Next.js API routes before proxying the AI request.

### 2.2. User Journey

1. User opens the app and enters their name → logged in (record created or matched in MongoDB).
2. User lands on the **Dashboard** — selects their target language, optionally edits the system prompt.
3. User starts a **chat session** — types or speaks a message.
4. App checks MongoDB limits (default-key mode) → sends request to AI → streams response.
5. AI response appears as a chat bubble; TTS reads it aloud automatically (or on demand).
6. User can tap the three-dot menu on any message to adjust voice speed, switch voice, repeat, copy, or delete.
7. Session ends; full history is saved to browser DB and visible in the Dashboard history tab.
8. Next day, MongoDB counters reset; user can start fresh.

---

## 3. Project Boundaries

### 3.1. What's In-Scope for this Version

- Name-based login backed by MongoDB (no passwords, no OAuth).
- Default API key with per-user daily limits (request count + token budget) enforced in MongoDB.
- BYO API key mode with informational token counter.
- AI chat UI with text input, STT input, and TTS output.
- Per-message three-dot menu (speed, voice, repeat, copy, delete).
- Custom system prompt saved to browser storage.
- Dashboard: language selector, prompt toggle, chat history browser, usage indicator.
- Universal popup/notification component.
- Responsive, mobile-first layout.
- Deployment on Vercel free tier with MongoDB Atlas free tier as the external DB.

### 3.2. What's Out-of-Scope (Non-Goals)

- Payment, subscription billing, or any paid tiers.
- Social features: shared rooms, leaderboards, friend lists.
- Native iOS or Android applications (web-responsive only).
- Automated grammar scoring or correction engine.
- Server-side chat history storage (history lives in browser DB only).
- Multi-device sync of chat history or custom prompts.
- Admin panel UI (usage monitoring is done directly via MongoDB queries for now).
