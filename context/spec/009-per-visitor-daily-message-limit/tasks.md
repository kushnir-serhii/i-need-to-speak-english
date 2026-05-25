# Tasks: Per-Visitor Daily Message Limit

- **Spec:** [functional-spec.md](functional-spec.md) · [technical-considerations.md](technical-considerations.md)
- **Status:** Ready for implementation

---

## Slice 1: Update the limit-reached popup message

*Smallest, self-contained change. Modal already exists and is wired up — only the copy changes.*

- [x] In `src/components/ui/LimitReachedModal.tsx` (line 35), update the `<p>` text from the current message to: "You've reached today's limit. Come back tomorrow! You can also use your own key to continue." **[Agent: nextjs-frontend]**
- [x] Start the dev server and use Playwright to navigate to the app, trigger the limit state (or open the modal directly), and confirm the new text is displayed exactly as specified. **[Agent: general-purpose]**

---

## Slice 2: Remaining message counter in the chat header

*Makes the daily allowance visible to the visitor at all times (while in shared-key mode).*

- [x] In `src/layout/Header.tsx`, add individual Zustand selectors for `dailyRequests` and `dailyRequestLimit` from `useUserStore`, and `apiKey` from `useSettingsStore` (already imported). **[Agent: nextjs-frontend]**
- [x] Compute `remainingMessages = Math.max(0, dailyRequestLimit - dailyRequests)` inline in the component. **[Agent: nextjs-frontend]**
- [x] Render a `<span>` showing "{remainingMessages} messages left today" in the existing user-area flex row, immediately before the visitor enrollment counter. Wrap it in a conditional: render only when `apiKey === ''`. **[Agent: nextjs-frontend]**
- [x] Use Playwright to: (a) open the app with no API key set and confirm the counter appears in the header; (b) enter any value in the API key field and confirm the counter disappears. **[Agent: general-purpose]**

---

## Slice 3: Midnight auto-reset (input re-enables without page refresh)

*Completes the daily-cycle UX — blocked visitors are automatically unlocked when the new day begins.*

- [x] In `src/app/(admin)/page.tsx`, add a `useEffect` that calculates `msUntilMidnight` (milliseconds from `Date.now()` to the next UTC day boundary) and schedules a `setTimeout`. On fire, call `useUserStore.getState().updateStats()`. Return a cleanup that calls `clearTimeout`. **[Agent: nextjs-frontend]**
- [x] Verify the timer by temporarily setting `msUntilMidnight` to 5000ms in dev, blocking the input (send messages until the limit), waiting 5 seconds, and confirming via Playwright that the input re-enables and the header counter resets without a page reload. Revert the temporary value after verifying. **[Agent: general-purpose]**

---

## Agent Assignment Notes

| Slice | Verification Agent | Note |
|-------|-------------------|------|
| Slice 1 | `general-purpose` | No dedicated QA agent. Playwright MCP is available for browser verification. |
| Slice 2 | `general-purpose` | Same as above. |
| Slice 3 | `general-purpose` | Timer testing requires a temporary dev override; no automated time-travel available. |
