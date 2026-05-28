# Tasks: Language Selector

**Spec:** [functional-spec.md](./functional-spec.md) · [technical-considerations.md](./technical-considerations.md)
**Status:** Ready for implementation

---

## Slice 1 — Language picker UI on Settings page

_Goal: the Settings page shows a working, searchable language picker pre-filled with "English". Selecting a language persists across reloads and immediately filters the TTS voice list in the per-message menu. No AI behavior changes yet — app remains fully functional throughout._

- [x] **Build language selector on Settings page** — replace the empty Language placeholder section with a searchable picker: load browser TTS voices on mount, extract unique language names via `Intl.DisplayNames('en', { type: 'language' })`, deduplicate and sort alphabetically, filter in real time as the user types, call `setTargetLanguage(name)` on selection, pre-fill with the current value from the store (defaults to `'English'`). If no voices are available in the browser, show "No voices available in your browser." and hide the picker. **[Agent: nextjs-frontend]**
- [x] **Verify Slice 1** — load Playwright via `ToolSearch` first. Navigate to Settings. Confirm "English" is pre-selected. Type "spa" — only "Spanish" appears. Select "Spanish" — selection shown. Reload — "Spanish" still selected. Open Chat, send a message, open the per-message voice menu — only Spanish voices listed. **[Agent: nextjs-frontend]**

---

## Slice 2 — Selected language flows to the AI

_Goal: the AI responds in the user's chosen language. Switching language mid-conversation takes effect on the very next message._

- [x] **Update `systemPrompt.ts`** — export `buildSystemPrompt(targetLanguage: string): string` that injects the language name into the prompt (replaces hard-coded "English" references). Keep `DEFAULT_SYSTEM_PROMPT` as `buildSystemPrompt('English')` for backwards compatibility. **[Agent: nextjs-backend]**
- [x] **Update `/api/chat` route** — accept optional `targetLanguage?: string` in the request body; replace `DEFAULT_SYSTEM_PROMPT` with `buildSystemPrompt(targetLanguage ?? 'English')`. No other changes to the route. **[Agent: nextjs-backend]**
- [x] **Update `ChatInput`** — read `targetLanguage` from `useSettingsStore`; include it in the fetch payload sent to `/api/chat`. **[Agent: nextjs-frontend]**
- [x] **Verify Slice 2** — load Playwright via `ToolSearch` first. In Settings, select "French". Open Chat, send "Hello" — confirm AI reply is in French. Go back to Settings, select "Spanish", return to Chat, send a message — AI replies in Spanish. Clear localStorage and reload — "English" is pre-selected and AI replies in English. **[Agent: nextjs-frontend]**

---

## Gaps & Recommendations

| Task / Slice | Issue | Recommendation |
|---|---|---|
| All Slices — Browser verification | Playwright MCP tools are deferred and must be loaded via `ToolSearch` before use | No installation needed — MCP is already configured. Each implementing agent must call `ToolSearch` first. |
