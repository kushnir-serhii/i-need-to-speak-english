<!-- 
This document describes HOW to build the feature at an architectural level.
It is NOT a copy-paste implementation guide.
-->

# Technical Specification: Personal Dashboard

- **Functional Specification:** `context/spec/013-dashboard/functional-spec.md`
- **Status:** Approved
- **Author(s):** Serhii Kushnir

---

## 1. High-Level Technical Approach

This is a **frontend-dominant change** with one targeted backend touch. No new API routes or database schema changes are needed.

The three dashboard sections are built as three new client components in `src/components/dashboard/` and composed into the existing stub `src/app/(admin)/dashboard/page.tsx`. Two new fields are added to `useSettingsStore` for prompt management. A single change to the chat API route and `buildSystemPrompt` makes the custom prompt operative server-side.

Additionally, the `/api/owner/` route tree is renamed to `/api/admin/` to align with the role naming convention used throughout the rest of the codebase.

---

## 2. Proposed Solution & Implementation Plan

### Architecture Changes

**Route renaming:** `src/app/api/owner/` → `src/app/api/admin/`

The existing route segments (`login/`, `logout/`, `me/`, `stats/`, `seed/`, `visitors/`) are moved under the new path. All internal `fetch` calls referencing `/api/owner/...` must be updated to `/api/admin/...`. No logic changes — this is a path-only rename.

Affected call sites to update:
- `src/components/common/EnrollmentGate.tsx` — `GET /api/owner/me`
- `src/app/(admin)/admin/page.tsx` — `GET /api/owner/stats`, `GET /api/owner/visitors`, `POST /api/owner/visitors/[id]/reset`
- `src/app/login/page.tsx` — `POST /api/owner/login`
- Any other client-side or server-side references to `/api/owner/`

The architecture document (`context/product/architecture.md`) must be updated to reflect the new paths.

---

### Store Changes — `src/store/useSettingsStore.ts`

Two new persisted fields added to the existing `intse-settings` localStorage key (no key migration needed):

| Field | Type | Default | Purpose |
|---|---|---|---|
| `customPrompt` | `string` | `""` | Raw textarea content |
| `useCustomPrompt` | `boolean` | `false` | Toggle state; `false` = Default mode |

Two new actions: `setCustomPrompt(prompt: string)` and `setUseCustomPrompt(active: boolean)`. The store stores the raw value unconditionally; the consumer is responsible for checking emptiness before treating the custom prompt as active.

---

### Component Breakdown — `src/components/dashboard/`

This directory does not yet exist and must be created.

**`UsageIndicator.tsx`** — pure display, no side effects

- Reads `useSettingsStore.apiKey` to detect BYO-key mode
- Shared-key mode: renders `"X / Y messages today"` from `useUserStore.dailyRequests` / `dailyRequestLimit`
- BYO-key mode: renders `"X tokens used"` from `useChatStore.sessionTokens`
- No local state, no fetches — stats are already loaded by `EnrollmentGate` on every page load

**`LanguageSelectorCard.tsx`** — language change with session-save side-effect

- Reads `useSettingsStore.targetLanguage`, `useChatStore.messages` / `sessionId`, `useUserStore.visitorId`
- Language-change handler (async, lives in the component — not in the store — because `setTargetLanguage` is also called from the Settings page without the session-save behaviour):
  1. If `messages.length > 0`: `POST /api/history` with `{ sessionId, visitorId, messages }` — fire-and-await; network failures are swallowed silently
  2. `setTargetLanguage(lang)` → persists to localStorage immediately
  3. `clearMessages()` on the chat store
  4. `initSessionId()` on the chat store — generates a fresh UUID
- Local state: `langSearch: string`, `langFocused: boolean`, `isSaving: boolean`
- Reuses the same searchable dropdown UI pattern from `src/app/(admin)/settings/page.tsx`; no shared component extraction in this iteration

**`PromptCard.tsx`** — custom prompt textarea + Default/Custom toggle

- Reads `useSettingsStore`: `customPrompt`, `useCustomPrompt`, `setCustomPrompt`, `setUseCustomPrompt`
- Toggle renders two pill buttons: "Default" and "Custom"
- "Default" pill: calls `setUseCustomPrompt(false)`; textarea stays visible but visually dimmed (`opacity-50`, non-interactive)
- "Custom" pill: calls `setUseCustomPrompt(true)`
- Textarea `onChange`: calls `setCustomPrompt(value)` directly (Zustand writes are synchronous; debounce not required)
- No save button, no confirmation dialog

**`src/app/(admin)/dashboard/page.tsx`** — modified

Replace the two placeholder stubs with three `<section>` cards (matching the border/bg card style from `settings/page.tsx`) in this order: Usage → Language → AI Prompt. The page file itself contains no logic — it is a layout shell that imports and composes the three components.

---

### `src/lib/systemPrompt.ts` — modified

`buildSystemPrompt` gains an optional second parameter:

```
buildSystemPrompt(targetLanguage: string, customPrompt?: string): string
```

When `customPrompt` is a non-empty trimmed string, it is returned as-is, replacing the default template entirely. When absent or empty, the existing default template is returned. All existing callers with one argument are unaffected.

---

### API Contract — `POST /api/chat` — modified

Two new optional fields added to the request body:

| Field | Type | Validation |
|---|---|---|
| `customPrompt` | `string` (optional) | Trimmed max **2 000 chars**; absent or empty → falls back to default |
| `useCustomPrompt` | `boolean` (optional) | Must be `boolean` when present; non-boolean → 400 |

No change to the response shape (streaming text + `USAGE` sentinel).

**Prompt selection logic** (runs after body validation, after daily-limit check, before the OpenAI call):

```
systemPrompt =
  useCustomPrompt === true AND trim(customPrompt).length > 0
    ? customPrompt
    : buildSystemPrompt(targetLanguage ?? 'English')
```

Both conditions must hold. Either condition alone is not sufficient to override the default. This prevents a stale `true` flag from activating an empty prompt, and prevents a draft prompt from activating when the toggle is off.

---

## 3. Impact and Risk Analysis

**System Dependencies:**
- `EnrollmentGate` already populates `useUserStore` stats on every page load → `UsageIndicator` has up-to-date data with no additional fetch
- `POST /api/history` in `LanguageSelectorCard` reuses the existing history route — no route changes needed
- `src/app/(admin)/settings/page.tsx` is untouched — language selector and TTS settings remain there in full

**Potential Risks & Mitigations:**

| Risk | Mitigation |
|---|---|
| Custom prompt injected verbatim into OpenAI system role (prompt injection surface) | 2 000-char server-side hard cap; non-string types rejected with 400; prompt text never written to logs |
| Language change loses in-progress chat on network failure | Session-save failure is silently swallowed; chat is cleared regardless — aligns with the spec's "no confirmation" requirement |
| `useCustomPrompt: true` with empty `customPrompt` sends no instruction | Conjunctive check in both the route and `buildSystemPrompt` ensures silent fallback to default |
| `sessionTokens` resets to 0 on page reload for BYO users | Correct by design — `sessionTokens` is a per-session counter; the spec says "current session" |
| Route rename breaks existing behaviour | All call sites are enumerated above; rename is a path-only change with no logic impact |

---

## 4. Testing Strategy

- **UsageIndicator:** Render with mocked store states for (a) shared-key user mid-session, (b) shared-key user at limit, (c) BYO-key user. Assert correct label format in each case.
- **LanguageSelectorCard:** Mock `fetch` for the history POST. Assert that on language change: (1) POST is called with the correct payload, (2) `targetLanguage` is updated, (3) messages are cleared, (4) a new `sessionId` is generated. Assert that if messages are empty, no POST is made.
- **PromptCard:** Assert that clicking "Default" dims the textarea and sets `useCustomPrompt` to `false` while preserving the `customPrompt` text. Assert that changes to the textarea call `setCustomPrompt`.
- **Chat route — prompt selection:** Unit-test in isolation: (a) flag off → default prompt used; (b) flag on + non-empty text → custom prompt used; (c) flag on + empty string → default prompt used; (d) string over 2 000 chars → 400 response.
- **Route rename:** Smoke-test each renamed endpoint path after the move to confirm no 404s.
