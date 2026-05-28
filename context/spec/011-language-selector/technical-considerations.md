# Technical Specification: Language Selector

- **Functional Specification:** [functional-spec.md](./functional-spec.md)
- **Status:** Completed
- **Author(s):** Serhii Kushnir

---

## 1. High-Level Technical Approach

Three layers need to change, all self-contained within the existing stack:

1. **Settings store** — no changes needed; `targetLanguage` already defaults to `'English'` and persists to localStorage.
2. **Frontend** — fill the empty Language section on the Settings page with a searchable picker; pass `targetLanguage` in the chat request body.
3. **Backend** — accept `targetLanguage` in the chat route; inject it into the system prompt via a `buildSystemPrompt(language)` factory.

No new external services. No database changes. Language persists to `localStorage` via the existing settings store.

---

## 2. Proposed Solution & Implementation Plan

### 2.1 Settings Store (`src/store/useSettingsStore.ts`)

No changes required. `targetLanguage` already defaults to `'English'`, the type is `string`, and `setTargetLanguage` already resets `selectedVoiceURI` to `null` on change.

### 2.2 System Prompt (`src/lib/systemPrompt.ts`)

| Change | Detail |
|---|---|
| New export | `buildSystemPrompt(targetLanguage: string): string` — injects the language name into the prompt copy (replaces hardcoded "English" references) |
| Existing export | `DEFAULT_SYSTEM_PROMPT` becomes `buildSystemPrompt('English')` — preserves backwards compatibility |

### 2.3 Chat API Route (`src/app/api/chat/route.ts`)

| Change | Detail |
|---|---|
| Request body | Accept optional `targetLanguage?: string` |
| System prompt | Replace `DEFAULT_SYSTEM_PROMPT` with `buildSystemPrompt(targetLanguage ?? 'English')` |

No other changes to the route. Admin bypass, limit enforcement, and streaming are unaffected.

### 2.4 Chat Input (`src/components/chat/ChatInput.tsx`)

| Change | Detail |
|---|---|
| Read from store | `targetLanguage` from `useSettingsStore` |
| Request body | Add `targetLanguage: targetLanguage ?? undefined` to the fetch payload |

### 2.5 Language Selector UI (`src/app/(admin)/settings/page.tsx`)

The empty "Language" placeholder section is replaced with the selector. Implemented inline within the settings page.

**Language list derivation:**
- On mount, call `window.speechSynthesis.getVoices()` (already loaded via `useTTS`).
- Extract unique BCP 47 language codes from `voice.lang` (e.g., `en-US`, `es-ES`).
- Convert each code to an English display name via `new Intl.DisplayNames('en', { type: 'language' })` (e.g., `es` → `'Spanish'`).
- Deduplicate by display name; sort alphabetically.

**Picker behaviour:**
- Controlled text input for search; filters the list in real time.
- Selecting an entry calls `setTargetLanguage(displayName)`.
- If `targetLanguage` is `null`, the input shows a placeholder ("Search languages…").
- If a language is set, the input pre-fills with the current value.

**`useTTS` voice filtering:**
- No null handling needed — `targetLanguage` is always a non-empty string (`'English'` by default).

---

## 3. Impact and Risk Analysis

**System Dependencies**

| Dependency | Impact |
|---|---|
| `useTTS` hook | No changes needed — always receives a non-empty string. |
| `MessageMenu` voice selector | Receives pre-filtered voices from `useTTS`. No change needed. |
| STT language in `ChatInput` | `langToSpeechCode(targetLanguage)` already works correctly — no change needed. |
| `DEFAULT_SYSTEM_PROMPT` export | Preserved as an alias; no existing import sites break. |
| Admin bypass in `/api/chat` | Unaffected — `targetLanguage` injection is independent of the admin/limit check path. |

**Potential Risks & Mitigations**

| Risk | Severity | Mitigation |
|---|---|---|
| `Intl.DisplayNames` not available in very old browsers | Low | Wrap in try/catch; fall back to displaying the raw BCP 47 code |
| Multiple locale codes map to the same display name (e.g., `en-US` and `en-GB` both → "English") | Low | Deduplicate by display name — one entry per language name |
| User has no TTS voices installed | Low | If voice list is empty, show a message: "No voices available in your browser." Selector is hidden. |
| Returning visitors who had `'English'` in localStorage | None | Default was already `'English'` — no migration or localStorage change needed. |

---

## 4. Testing Strategy

Manual verification against functional spec acceptance criteria:

1. Open Settings — language picker shows "English" pre-selected.
2. Type "spa" — list filters to "Spanish" only.
3. Select "Spanish" — active choice shown; reload page — still "Spanish".
4. Open Chat — send a message — AI reply is in Spanish.
5. Change language mid-conversation — previous messages unchanged; next reply uses the new language.
6. Open voice picker on any AI message — only Spanish voices listed.
7. New visitor (clear localStorage) — "English" is pre-selected; first chat message receives English AI reply.
8. User with no TTS voices installed — language section shows "No voices available" message.
