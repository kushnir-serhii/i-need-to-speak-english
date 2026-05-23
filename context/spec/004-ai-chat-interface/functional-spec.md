# Functional Specification: AI Chat Interface

- **Roadmap Item:** Phase 2 — AI Chat Interface
- **Status:** Approved
- **Author:** Serhii Kushnir

---

## 1. Overview and Rationale (The "Why")

INTSE's core promise is to give language learners a natural, conversational AI practice partner. Without the chat interface, there is nothing for the user to actually do — the entire value of the app is unlocked here.

Today, a learner like Maria has no way to practise free-form spoken or written English at any time of day without booking a tutor or paying for a subscription. The chat interface changes that: she opens the app, types a message, and gets a natural AI response immediately — as if texting a fluent conversation partner.

**Success looks like:** A user can open the app, type a message, and see a coherent, language-learning-focused AI response streaming in, all within a few seconds — repeatedly, in a natural back-and-forth flow.

---

## 2. Functional Requirements (The "What")

### 2.1 Chat Screen Layout

The chat screen is the main page of the app, shown immediately after enrollment. It consists of two areas:

- **Conversation thread** — the upper portion of the screen, scrollable, where all messages appear.
- **Input area** — fixed at the bottom of the screen, always visible regardless of scroll position.

### 2.2 Empty State

When the user has not yet sent any messages, the conversation thread is blank. No introductory text, no greeting, no instructions — just the empty thread and the ready input area below.

### 2.3 Message Input

The input area contains:
- A **text field** where the user types their message.
- A **character counter** that appears once the user starts typing, showing how many characters they have typed out of the 1000-character limit (e.g. "240 / 1000"). The counter turns a warning colour as the user approaches the limit.
- A **Send button** that submits the message.

**Submission:** The user can submit their message either by pressing the **Enter key** or by clicking the **Send button**. Pressing **Shift + Enter** inserts a new line without submitting. The Send button and Enter key are disabled when the text field is empty.

### 2.4 Sending a Message

When the user submits a message:
1. The message appears immediately in the conversation thread as a **user message bubble** (right-aligned).
2. The text field clears and is ready for the next message.
3. A **typing indicator** — three animated dots in an AI message bubble — appears in the thread to show the AI is preparing a response.
4. The user may continue typing their next message while the AI is responding.

### 2.5 AI Response

Once the AI begins responding, the typing indicator is replaced by the **AI message bubble** (left-aligned), and the response text appears word by word as it is received — the user sees the reply build in real time rather than waiting for it all at once.

### 2.6 Conversation Thread

- All messages — user and AI — appear in chronological order, oldest at the top.
- **User messages** are visually distinct from AI messages (e.g. different background colour, alignment).
- The thread **always scrolls to the bottom** whenever a new message is added or new words stream in — even if there are many previous messages above.

### 2.7 AI Behaviour (System Prompt)

The AI is invisibly guided by a built-in, language-learning-focused instruction that shapes every response: it acts as a conversational practice partner — encouraging the user, gently correcting mistakes, and keeping the conversation natural. The user never sees or edits this instruction on the chat page.

### 2.8 Error Handling

If a message cannot be delivered to the AI (e.g. the connection is interrupted or the service is temporarily unavailable):
- The typing indicator disappears.
- A **red error toast notification** appears at the bottom of the screen with the message: *"Something went wrong. Please try again."*
- The user's message remains visible in the thread. They can try sending a new message.

---

## 3. Acceptance Criteria

**Empty state**
- [ ] When the user opens the app for the first time, the conversation thread is empty and the input field is focused and ready.

**Message input**
- [ ] The Send button is disabled when the input field is empty.
- [ ] Pressing Enter with text in the field submits the message.
- [ ] Pressing Shift + Enter inserts a new line without submitting.
- [ ] Clicking the Send button submits the message.
- [ ] After submitting, the input field clears immediately.
- [ ] A character counter is visible while typing, showing "X / 1000".
- [ ] The counter changes to a warning colour when the user is close to the limit.

**Sending and response**
- [ ] After submitting a message, the user's message appears as a right-aligned bubble in the thread.
- [ ] A typing indicator (animated dots) appears in the thread while the AI is preparing a response.
- [ ] The user can type in the input field while the typing indicator is showing.
- [ ] The typing indicator is replaced by the AI's response, which streams in word by word.
- [ ] The AI message appears as a left-aligned bubble, visually distinct from the user bubble.

**Auto-scroll**
- [ ] The thread automatically scrolls to the bottom when a new message (user or AI) is added.
- [ ] The thread scrolls to the bottom as each new word streams in from the AI.

**Error**
- [ ] If the AI request fails, the typing indicator disappears and a red toast notification appears with "Something went wrong. Please try again."

---

## 4. Scope and Boundaries

### In-Scope
- Text message input with Enter/Send submission
- 1000-character soft limit with visible counter
- User and AI message bubbles in a scrollable thread
- Streaming AI responses (word-by-word appearance)
- Typing indicator while AI is preparing a response
- Built-in language-learning system prompt (invisible to user)
- Always-on auto-scroll to latest message
- Error toast on failed AI request

### Out-of-Scope
- **Voice input (microphone / speech-to-text)** — Phase 3
- **AI voice playback (text-to-speech)** — Phase 3
- **Per-message actions** (repeat, copy, delete, speed control) — Phase 3
- **Daily request limit enforcement** — covered in the next spec (Usage Control & API Key Modes)
- **BYO API key mode** — covered in the next spec
- **Custom system prompt** — Phase 4 Dashboard spec
- **Chat history persistence across sessions** — Phase 4
- **Language selector** — Phase 4 Dashboard spec
