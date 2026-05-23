# Tasks: AI Chat Interface

- **Spec:** [functional-spec.md](./functional-spec.md) · [technical-considerations.md](./technical-considerations.md)
- **Status:** Ready for implementation

---

- [x] **Slice 1: Chat layout + user message bubbles (no API)**
  - [x] Create `src/store/useChatStore.ts` — `Message` type (`id`, `role`, `content`, `isStreaming`, `timestamp`), state fields (`messages`, `isStreaming`), and actions `addMessage`, `setStreaming`, `clearMessages`. No persist middleware. **[Agent: nextjs-frontend]**
  - [x] Create `src/components/chat/EmptyState.tsx` — pure presentational, shown when `messages.length === 0`. **[Agent: nextjs-frontend]**
  - [x] Create `src/components/chat/MessageBubble.tsx` — right-aligned for `role: 'user'` (`bg-[#2F81F7]`), left-aligned for `role: 'assistant'` (`bg-[#161B22]`); receives a `Message` prop. **[Agent: nextjs-frontend]**
  - [x] Create `src/components/chat/TypingIndicator.tsx` — three animated dots in pure CSS (no JS timers). **[Agent: nextjs-frontend]**
  - [x] Create `src/components/chat/CharCounter.tsx` — displays `N / 1000`; hidden when `N === 0`; accent colour switches to amber (`#D29922`) at ≥ 900 chars. **[Agent: nextjs-frontend]**
  - [x] Create `src/components/chat/ChatThread.tsx` — scrollable container (`flex-1 min-h-0 overflow-y-auto`); renders `EmptyState` when no messages, otherwise maps messages to `MessageBubble`; includes a `<div ref={bottomRef} />` scroll sentinel. **[Agent: nextjs-frontend]**
  - [x] Create `src/components/chat/ChatInput.tsx` — controlled `<textarea>`; local `inputValue` state; Enter submits (calls `addMessage('user', input)` only — no API call yet), Shift+Enter inserts newline; Send button disabled when empty; renders `CharCounter`; clears input after submit. **[Agent: nextjs-frontend]**
  - [x] Create `src/components/chat/index.ts` — barrel exports for all six components. **[Agent: nextjs-frontend]**
  - [x] Replace `src/app/(admin)/page.tsx` with the chat layout: `<div className="flex flex-col h-full">` containing `<ChatThread />` (`flex-1 min-h-0`) and `<ChatInput />` (`flex-none border-t`). **[Agent: nextjs-frontend]**
  - [x] Verify with Playwright: navigate to `http://localhost:3000`; confirm empty state is visible; type a message and press Enter → right-aligned blue bubble appears, input clears; Shift+Enter adds a newline without submitting; Send button is disabled when input is empty; character counter appears while typing and turns amber at 900+ chars. **[Agent: nextjs-frontend]**

---

- [x] **Slice 2: `POST /api/chat` streaming endpoint**
  - [x] Run `npm install openai server-only` to add the required packages. **[Agent: general-purpose]**
  - [x] Add `OPENAI_API_KEY=<your-key>` and `OPENAI_MODEL=gpt-4o-mini` to `.env.local`. **[Agent: general-purpose]**
  - [x] Create `src/lib/openai.ts` — imports `server-only`, exports `getOpenAIClient(): OpenAI` singleton factory; throws a clear error if `OPENAI_API_KEY` is not set. **[Agent: nextjs-backend]**
  - [x] Create `src/lib/systemPrompt.ts` — exports `DEFAULT_SYSTEM_PROMPT: string`; instructs the model to act as a friendly English conversation partner, gently correct mistakes, keep replies to 2–4 sentences, and encourage the user to continue. **[Agent: nextjs-backend]**
  - [x] Create `src/app/api/chat/route.ts` — `POST` handler: validates `messages` (non-empty, valid roles) and `visitorId` (present); validates last user message ≤ 1000 chars; prepends `DEFAULT_SYSTEM_PROMPT` as system message; calls `getOpenAIClient().chat.completions.create({ stream: true, model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini', max_tokens: 1024 })`; wraps the async iterable in a `ReadableStream` encoding each `delta.content` chunk; returns `new Response(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })`; returns structured JSON errors on all failure paths. **[Agent: nextjs-backend]**
  - [x] Verify with `curl` (run `npm run dev` first):
    - Valid request → streaming plain text response from the AI
    - Missing `messages` → `400 { "error": "invalid_request" }`
    - Message > 1000 chars → `400 { "error": "message_too_long" }`
    - Missing `visitorId` → `400 { "error": "missing_visitor_id" }`
    **[Agent: nextjs-backend]**

---

- [ ] **Slice 3: Wire streaming to frontend + error handling + final build**
  - [ ] Add `appendChunk(id, chunk)` and `finalizeMessage(id)` actions to `src/store/useChatStore.ts`. **[Agent: nextjs-frontend]**
  - [ ] Update `ChatInput.tsx` — on submit: call `addMessage('user', input)`, then `addMessage('assistant', '')` (captures its `id`), then `setStreaming(true)`; `POST /api/chat` with the full message list and `visitorId` from `useUserStore.getState()`; loop `response.body.getReader()` calling `appendChunk(id, chunk)` per chunk; on stream end call `finalizeMessage(id)`; on `catch` call `finalizeMessage(id)` and fire `useNotification().toast('error', 'Something went wrong. Please try again.')`. **[Agent: nextjs-frontend]**
  - [ ] Update `ChatThread.tsx` — for each message: if `role === 'assistant' && isStreaming && content === ''` render `<TypingIndicator />`; otherwise render `<MessageBubble />`; add auto-scroll `useEffect` with `messages` as dependency calling `bottomRef.current?.scrollIntoView({ behavior: 'smooth' })`. **[Agent: nextjs-frontend]**
  - [ ] Run `npm run build` — confirm zero TypeScript errors. **[Agent: general-purpose]**
  - [ ] Verify with Playwright: send a message → typing indicator (animated dots) appears → AI response streams in word by word → thread auto-scrolls to bottom with each chunk; send a second message → conversation continues with context; open DevTools Network tab and confirm `POST /api/chat` is called with the full conversation history; simulate a failed request → red error toast appears with "Something went wrong. Please try again." **[Agent: nextjs-frontend]**
