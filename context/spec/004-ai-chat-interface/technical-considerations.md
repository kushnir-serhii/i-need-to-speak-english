<!-- This document describes HOW to build the feature at an architectural level. -->

# Technical Specification: AI Chat Interface

- **Functional Specification:** [context/spec/004-ai-chat-interface/functional-spec.md](./functional-spec.md)
- **Status:** Approved
- **Author(s):** Serhii Kushnir

---

## 1. High-Level Technical Approach

Add a `POST /api/chat` route that proxies messages to the OpenAI API and streams the response back as plain UTF-8 text. On the frontend, a new Zustand store (`useChatStore`) holds the session's message list and streaming state. Six new `'use client'` components — assembled in the existing home page (`page.tsx`) — render the conversation thread, message bubbles, typing indicator, and input area. No server-side persistence is involved; messages are session-only (in-memory Zustand, no IndexedDB yet).

---

## 2. Proposed Solution & Implementation Plan

### 2.1 New npm Packages

| Package | Purpose |
|---|---|
| `openai` (v4.x) | OpenAI SDK — server-side only |
| `server-only` | Build-time guard that throws if `src/lib/openai.ts` is ever imported in a Client Component |

### 2.2 New Environment Variables

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `OPENAI_API_KEY` | Yes | — | Owner's OpenAI secret key; server-side only, never in `NEXT_PUBLIC_*` |
| `OPENAI_MODEL` | No | `'gpt-4o-mini'` | Model override — defaults to `gpt-4o-mini` to minimise cost on Hobby tier |

Add both to `.env.local` for local development and to Vercel Environment Variables (Production + Preview) via the Vercel dashboard.

### 2.3 New Files — Backend

**`src/lib/openai.ts`**
Exports a single `getOpenAIClient(): OpenAI` factory function. Imports `server-only` at the top (build-time guard). Reads `OPENAI_API_KEY` at call time and throws a clear error if absent. Returns a lazily-created singleton — same pattern as the existing `connectDB()` in `mongodb.ts`.

**`src/lib/systemPrompt.ts`**
Exports `DEFAULT_SYSTEM_PROMPT: string`. Kept separate from the route so Phase 4 (custom prompts) can swap it out without touching the route handler. Content instructs the model to act as a friendly, patient English conversation partner — responding naturally, gently echoing corrections, keeping replies concise (2–4 sentences), and encouraging the user to continue.

**`src/app/api/chat/route.ts`** — `POST /api/chat`

*Request body:*

| Field | Type | Notes |
|---|---|---|
| `messages` | `{ role: 'user' \| 'assistant', content: string }[]` | Full conversation history including the new user turn; system message prepended server-side |
| `visitorId` | `string` | Visitor UUID from the client store; required now, used for limit enforcement in Spec 005 |

*Route logic (step by step):*
1. Parse and validate `messages` (non-empty array, valid roles, non-empty content strings).
2. Validate last user message is ≤ 1000 characters.
3. Validate `visitorId` is present.
4. Call `getOpenAIClient().chat.completions.create()` with `stream: true`, prepending `DEFAULT_SYSTEM_PROMPT` as the system message, and `max_tokens: 1024`.
5. Wrap the OpenAI async iterable in a `ReadableStream`, encoding each `delta.content` chunk with `TextEncoder`.
6. Return `new Response(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })`.

*Error responses:*

| Scenario | Status | `error` code |
|---|---|---|
| Missing/invalid `messages` | 400 | `invalid_request` |
| Last user message > 1000 chars | 400 | `message_too_long` |
| Missing `visitorId` | 400 | `missing_visitor_id` |
| `OPENAI_API_KEY` not set | 500 | `configuration_error` |
| OpenAI API error | 502 | `upstream_error` |
| Unexpected error | 500 | `server_error` |

*Streaming protocol:* Raw `text/plain` (not SSE). No AI SDK dependency. Client consumes with `fetch` + `response.body.getReader()`.

### 2.4 New Files — Frontend

**`src/store/useChatStore.ts`**

No `persist` middleware — messages are session-only.

*Message object shape:*

| Field | Type | Notes |
|---|---|---|
| `id` | `string` | UUID, generated client-side via `crypto.randomUUID()` |
| `role` | `'user' \| 'assistant'` | Determines bubble alignment and styling |
| `content` | `string` | Accumulated text; grows chunk by chunk during streaming |
| `isStreaming` | `boolean` | `true` only on the in-flight assistant message |
| `timestamp` | `number` | `Date.now()` at creation; reserved for future history display |

*State fields:* `messages: Message[]`, `isStreaming: boolean` (store-level flag for Send button disabled state).

*Actions:*

| Action | Signature | Behaviour |
|---|---|---|
| `addMessage` | `(role, content) => string` | Pushes new `Message`, returns its `id` |
| `appendChunk` | `(id, chunk) => void` | Finds message by `id`, concatenates `chunk` to `content` |
| `finalizeMessage` | `(id) => void` | Sets `message.isStreaming = false`, store `isStreaming = false` |
| `setStreaming` | `(value) => void` | Sets store-level `isStreaming` |
| `clearMessages` | `() => void` | Resets to `[]` — reserved for future "new session" |

**`src/components/chat/` — new directory**

| Component | File | Responsibility |
|---|---|---|
| `ChatThread` | `ChatThread.tsx` | Scrollable container; renders `MessageBubble` or `TypingIndicator` per message; owns scroll sentinel `ref` and auto-scroll `useEffect` |
| `MessageBubble` | `MessageBubble.tsx` | Single message bubble — right-aligned (`role: 'user'`), left-aligned (`role: 'assistant'`); receives a `Message` prop |
| `TypingIndicator` | `TypingIndicator.tsx` | Three animated dots (pure CSS, no JS timers); rendered when assistant message has `isStreaming: true` and `content === ''` |
| `ChatInput` | `ChatInput.tsx` | Controlled `<textarea>`; owns local `inputValue` state; handles Enter/Shift+Enter; owns the `fetch` + stream reader loop; holds an `AbortController` ref |
| `CharCounter` | `CharCounter.tsx` | Displays `N / 1000`; hidden when input is empty; warning colour at ≥ 900 chars; pure presentational |
| `EmptyState` | `EmptyState.tsx` | Blank placeholder shown when `messages.length === 0`; pure presentational |
| *(barrel)* | `index.ts` | Re-exports all six components |

All components in this directory are `'use client'`.

**`src/app/(admin)/page.tsx`** — replaced entirely

CSS layout model (no hardcoded pixel heights):

```
<div className="flex flex-col h-full">
  <ChatThread className="flex-1 min-h-0 overflow-y-auto" />
  <ChatInput className="flex-none border-t" />
</div>
```

`min-h-0` on `ChatThread` is critical — without it a flex child ignores `overflow-y-auto` and expands to full content height, breaking the fixed-bottom layout.

### 2.5 Streaming Flow (Client)

1. On submit, `ChatInput` calls `addMessage('user', input)` then `addMessage('assistant', '')` and captures the returned assistant message `id`. Calls `setStreaming(true)`.
2. POSTs to `/api/chat` with the full `messages` array (mapped to `{ role, content }`) and `visitorId` from `useUserStore.getState()`.
3. Reads `response.body.getReader()` in a loop; each decoded chunk calls `appendChunk(id, chunk)`.
4. On stream end (`done === true`): calls `finalizeMessage(id)`.
5. On `catch`: calls `finalizeMessage(id)` + fires `useNotification().toast('error', 'Something went wrong. Please try again.')`.

### 2.6 Auto-Scroll

A `<div ref={bottomRef} />` sentinel sits as the last child inside `ChatThread`. A `useEffect` with `messages` as its dependency calls `bottomRef.current?.scrollIntoView({ behavior: 'smooth' })` — fires on every new bubble and on every streaming chunk (the streaming message object reference changes via `appendChunk`).

### 2.7 Typing Indicator Logic

No separate store boolean. The indicator renders when the latest assistant message satisfies `isStreaming === true && content === ''`. Once the first chunk arrives, `ChatThread` switches to rendering `MessageBubble` with growing text. The `TypingIndicator` uses three `<span>` elements animated purely in CSS.

---

## 3. Impact and Risk Analysis

| Risk | Impact | Mitigation |
|---|---|---|
| Streaming response exceeds Vercel 10 s serverless timeout | Response cut off mid-stream | Vercel Hobby tier supports streaming — chunks flush before the deadline; `max_tokens: 1024` caps length |
| `OPENAI_API_KEY` bundled client-side | Secret exposed in browser | `server-only` import in `src/lib/openai.ts` causes a build error if imported in a Client Component |
| Rapid re-renders during streaming | Jank / dropped frames | `appendChunk` updates only `content` on a single message; Zustand selectors limit re-renders to `ChatThread` and the affected `MessageBubble` |
| Multiple in-flight requests from fast submissions | Interleaved chunks corrupt message content | Each submission creates a new assistant message `id`; `appendChunk` routes by `id`, preventing interleaving |
| No way to cancel a slow stream | Poor UX on slow connections | `AbortController` ref created in `ChatInput` and passed to `fetch`; cancel button wiring deferred to a future slice |

---

## 4. Testing Strategy

```bash
# Install packages and confirm build
npm install openai server-only
npm run build

# Start dev server
npm run dev
```

Playwright verification checklist:
- `POST /api/chat` with a valid payload returns streaming plain text (confirm via `curl` or Playwright `browser_network_request`)
- Missing `messages` → 400 `invalid_request`
- Message > 1000 chars → 400 `message_too_long`
- Type a message → submit → user bubble appears immediately → typing indicator shows → AI text streams in word by word
- Shift+Enter inserts a newline; plain Enter submits
- Character counter appears while typing; turns warning colour at ≥ 900 chars
- Thread auto-scrolls to bottom as chunks arrive
- Simulate a failed fetch → red error toast appears with "Something went wrong. Please try again."
