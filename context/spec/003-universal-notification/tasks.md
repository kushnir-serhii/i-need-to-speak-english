# Tasks: Universal Notification System

- **Spec:** [functional-spec.md](./functional-spec.md) · [technical-considerations.md](./technical-considerations.md)
- **Status:** Ready for implementation

---

- [x] **Slice 1: Info Toast — store + component + layout integration**
  - [x] Create `src/store/useNotificationStore.ts` with `Toast`/`ModalState` types, `toasts`/`modal` state, and `addToast`/`removeToast` for `'info'` type only — including 4-second auto-dismiss using a closure-level `Map<id, timer>`. **[Agent: nextjs-frontend]**
  - [x] Create `src/components/ui/Toast.tsx` for the `info` variant: `bg-[#161B22]` card, blue left-border accent (`#2F81F7`), ℹ️ icon, message text, and × dismiss button. **[Agent: nextjs-frontend]**
  - [x] Create `src/components/ui/ToastContainer.tsx` (`'use client'`) — subscribes to `useNotificationStore.toasts`, positioned `fixed bottom-4 left-1/2 -translate-x-1/2 flex flex-col-reverse gap-2 z-50`, renders a `<Toast>` per active toast with `removeToast` as `onDismiss`. **[Agent: nextjs-frontend]**
  - [x] Mount `<ToastContainer />` in `src/app/(admin)/layout.tsx` as a sibling after the main content, inside `EnrollmentGate`. **[Agent: nextjs-frontend]**
  - [x] Add `Toast` and `ToastContainer` exports to `src/components/ui/index.ts`. **[Agent: nextjs-frontend]**
  - [x] Run `npm run build`, then `npm run dev`. Open the app in a browser, open DevTools console and call `addToast('info', 'API key saved')` via the store. Verify: blue toast appears at bottom-center, auto-dismisses after 4 s, and × dismisses it immediately. **[Agent: nextjs-frontend]**

---

- [x] **Slice 2: Warning + Error toast types, same-type replacement, and `useNotification` hook**
  - [x] Extend `addToast` in `useNotificationStore.ts` to handle `'warning'` and `'error'` types: no auto-dismiss, and replace an existing toast of the same type instead of appending a duplicate. **[Agent: nextjs-frontend]**
  - [x] Update `Toast.tsx` to render warning (amber `#D29922`, ⚠️ icon) and error (red `#DA3633`, ✕ icon) variants based on the `type` prop. **[Agent: nextjs-frontend]**
  - [x] Create `src/hooks/useNotification.ts` — reads `addToast` and `openModal` from `useNotificationStore.getState()` (no subscription) and exports `{ toast, confirm }` dispatchers. **[Agent: nextjs-frontend]**
  - [x] Verify: amber warning toast persists past 4 s without dismissing; triggering a second warning toast while the first is visible replaces it (only one amber toast on screen); triggering an info + warning toast simultaneously produces two stacked toasts. **[Agent: nextjs-frontend]**

---

- [x] **Slice 3: Confirmation Modal end-to-end**
  - [x] Add `openModal(options: ModalState)` and `closeModal()` actions to `useNotificationStore.ts`. **[Agent: nextjs-frontend]**
  - [x] Create `src/components/ui/ConfirmModal.tsx` (`'use client'`) — renders nothing when `modal === null`; when open, renders a `fixed inset-0 z-50` overlay (`bg-black/60`) with a centered card (`bg-[#161B22] rounded-xl max-w-sm w-full mx-4 p-6`) containing: title `<h2>`, body `<p>`, primary action button (danger variant=`#DA3633`, primary variant=`#2F81F7`), and a muted outlined Cancel button. Overlay click and Cancel call `closeModal()`; primary button calls `onConfirm()` then `closeModal()`. **[Agent: nextjs-frontend]**
  - [x] Mount `<ConfirmModal />` alongside `<ToastContainer />` in `src/app/(admin)/layout.tsx`. **[Agent: nextjs-frontend]**
  - [x] Add `ConfirmModal` export to `src/components/ui/index.ts`. **[Agent: nextjs-frontend]**
  - [x] Verify: open a danger modal from the browser console; confirm the overlay blocks all clicks on content behind it; Cancel and overlay click both close the modal without triggering the action; primary button fires `onConfirm` callback and then closes the modal. **[Agent: nextjs-frontend]**

---

- [x] **Slice 4: Mobile responsiveness + final build**
  - [x] Update `ToastContainer.tsx` so on screens narrower than 480 px (`max-sm:` breakpoint) toasts render full-width (`w-screen px-4`) instead of the default centered layout. **[Agent: nextjs-frontend]**
  - [x] Verify in DevTools Device Mode (375 px): toasts span the full screen width with small side padding; the modal card has visible padding on all four sides and does not overflow the viewport. Run `npm run build` for a final clean compilation check. **[Agent: nextjs-frontend]**

---

## Recommendations

| Task/Slice | Issue | Recommendation |
|---|---|---|
| All verification sub-tasks | No browser automation MCP is configured (no Playwright/Puppeteer MCP available) | Verification is manual — run `npm run dev` and test in the browser. Consider installing a Playwright MCP to enable automated UI verification in future specs. |
