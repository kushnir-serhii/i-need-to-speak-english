# Product Roadmap: INTSE (I Need to Speak English)

_This roadmap outlines our strategic direction based on user needs and cost constraints. It focuses on the "what" and "why," not the technical "how."_

---

### Phase 1 — Foundation

_The minimal infrastructure that everything else depends on: identity, cost control, and shared UI primitives._

- [x] **Identity & Access**
  - [x] **Anonymous auto-enrollment:** Silently assign a unique visitor ID to each new visitor on their first visit. No registration, email, or password. Store visitor records in MongoDB for usage tracking.
  - [x] **Daily visitor cap:** Enforce a configurable daily limit on new visitors. Visitors who arrive after the cap is reached see a "come back tomorrow" screen. Existing (returning) visitors are always admitted.
  - [x] **Optional name prompt:** Show a one-time "What's your name?" prompt to newly enrolled visitors. Name is saved on-device only and used for personalised greetings. Skippable.
  - [x] **Visitor counter in header:** Display the current day's enrolled visitor count vs. the daily cap (e.g., "47 / 100 visitors today") in the app header.
  - [x] **Per-visitor daily request limit (default key):** Track and enforce a daily AI message cap per visitor when they are using the owner's API key. Reset daily.

- [x] **Project Scaffold & Infrastructure**
  - [x] **Next.js project setup:** Initialize the app with a mobile-first responsive layout, routing, and environment configuration for Vercel deployment.
  - [x] **MongoDB connection:** Establish a reliable connection to MongoDB Atlas (free tier) from Next.js API routes.
  - [ ] **API route skeleton:** Create the foundational server-side route that will proxy AI requests, enforce limits, and return responses. _(Phase 2 — chat proxy not yet built.)_

- [x] **Shared UI Primitives**
  - [x] **Universal popup / notification component:** Build a reusable modal/toast component for alerts, limit warnings, confirmations, and info messages — used across all phases.

---

### Phase 2 — Core Chat Experience

_Once the foundation is solid, deliver the core value: AI-powered text conversation with cost protection._

- [x] **AI Chat Interface**
  - [x] **Text input and streaming response:** Provide a textarea for user messages and stream AI replies into the chat UI in real time.
  - [x] **Default system prompt:** Embed a hard-coded, language-learning-focused system prompt that guides the AI to act as a conversation partner.
  - [x] **Chat message bubbles:** Display user and AI messages in a clear, scrollable conversation thread.

- [x] **Usage Control & API Key Modes**
  - [x] **Default-key mode with daily limits:** Enforce per-user daily limits (request count + token budget) server-side via MongoDB counters before proxying each AI request.
  - [x] **Daily counter reset:** Reset each user's request count and token budget at the start of a new calendar day.
  - [x] **BYO API key mode:** Allow users to paste their own API key; bypass all limits and route requests directly using their key.
  - [x] **Informational token counter (BYO mode):** Display running input/output token totals for users on their own key.
  - [x] **Limit-reached notification:** Show the universal popup when a user hits their daily request or token limit.

---

### Phase 3 — Voice

_Layer in the full voice loop that makes INTSE a speaking practice tool, not just a chat app._

- [x] **Speech Input (STT)**
  - [x] **STT button:** Add a microphone button that activates the browser's Web Speech API to transcribe the user's speech into the message input field.

- [x] **Speech Output (TTS)**
  - [x] **Auto-play AI responses:** Use the browser's Speech Synthesis API to read each AI reply aloud as it arrives.
  - [x] **Language-aware voice selection:** Populate the voice list from voices available in the browser for the user's selected target language.

- [x] **Per-Message Controls**
  - [x] **Three-dot context menu:** Add a menu button to each AI message bubble with the following actions:
    - [x] **Repeat:** Re-read the message aloud via TTS.
    - [x] **Speed control:** A slider to adjust TTS playback speed (0.5× – 2×).
    - [x] **Voice selector:** A dropdown of available voices for the current language.
    - [x] **Copy:** Copy the message text to the clipboard.
    - [x] **Delete:** Remove the message from the conversation view (and browser DB).

- [x] **Language Selector**
  - [x] **Target language picker:** Let users choose any language to practice; the selection filters the available TTS voices and is passed to the AI as part of the system prompt context.

---

### Phase 4 — Dashboard & Persistence

_Give users control over their experience and a way to review their progress over time._

- [x] **Chat History Persistence**
  - [x] **Server-side storage (MongoDB):** Save the full conversation history to MongoDB tied to the visitor's identity, persisting across devices and browser clears.
  - [x] **History browser at /history:** Display a list of past conversations with timestamps and message preview; allow the user to open, continue, or delete any previous session.

- [ ] **Dashboard**
  - [ ] **Usage indicator:** Show the user's current daily usage (requests used / limit, tokens used / budget) for default-key mode, or running token totals for BYO-key mode.
  - [ ] **Language selector control:** Surface the target language picker prominently on the dashboard so users can change it before starting a session.
  - [ ] **Prompt management:** Provide a textarea where users can write a custom system prompt, saved to browser storage, with a toggle to switch between the default and custom prompt.
