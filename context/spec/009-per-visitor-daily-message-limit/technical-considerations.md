# Technical Specification: Per-Visitor Daily Message Limit

- **Functional Specification:** [context/spec/009-per-visitor-daily-message-limit/functional-spec.md](context/spec/009-per-visitor-daily-message-limit/functional-spec.md)
- **Status:** Completed
- **Author(s):** Serhii Kushnir

---

## 1. High-Level Technical Approach

This feature is **frontend-only**. All server-side enforcement (429 response on limit exceeded), the daily counter fields (`dailyRequests`, `dailyRequestLimit`) in `useUserStore`, and the modal component infrastructure are already in place from Phase 2. Three targeted changes complete the functional requirements: adding a remaining-messages counter to the header, scheduling a midnight re-sync to auto-unlock the input, and updating the existing modal's copy.

No new API endpoints, no schema changes, no new components.

---

## 2. Proposed Solution & Implementation Plan (The "How")

### 2.1. Remaining Message Counter — `src/layout/Header.tsx`

**What changes:** A `<span>` showing "X messages left today" is added inline to the existing user-area flex row in the header, immediately before the visitor enrollment counter.

**Data sources (all already available):**
- `dailyRequests` and `dailyRequestLimit` — selected from `useUserStore` via individual scalar selectors (no `useShallow` needed).
- `apiKey` — selected from `useSettingsStore` (already imported in this file).

**Derived value:** `remainingMessages = dailyRequestLimit - dailyRequests`, computed inline in the component — not added to the store.

**Visibility rule:** The counter renders only when `apiKey === ''` (shared-key mode). This is a separate conditional from `isLimitReached` — it must render even when the visitor still has messages remaining.

**Display states:**
- Normal: "12 messages left today"
- At zero: "0 messages left today" (input is already blocked by parent; counter remains visible)

---

### 2.2. Midnight Auto-Reset Timer — `src/app/(admin)/page.tsx`

**What changes:** A `useEffect` added to the page component schedules a single `setTimeout` that fires at the next UTC midnight.

**Timer logic:**
- On mount: calculate `msUntilMidnight` (milliseconds from `Date.now()` to the next UTC day boundary).
- On fire: call `useUserStore.getState().updateStats()`, which hits the existing `/api/stats` route. That route's `resetIfNeeded()` guard has already zeroed the MongoDB counters by then, so the response returns a fresh `dailyRequests: 0` and the store updates accordingly.
- On unmount: `clearTimeout` to prevent the callback from firing on a stale instance.

**Why `page.tsx`:** This component already owns `isLimitReached`, `showLimitModal`, and all other limit-related side effects. Co-locating the timer here avoids scattered state ownership.

**Edge case:** If the visitor's device is offline at midnight, the timer fires but the `updateStats()` call fails silently. The input remains blocked until the visitor sends a new message (which triggers a fresh server check) or refreshes. This is acceptable — the server is the source of truth.

---

### 2.3. Popup Message Update — `src/components/ui/LimitReachedModal.tsx`

**What changes:** The `<p>` text content on line 35 is updated.

| | Text |
|--|--|
| **Current** | "You've reached your daily message limit. Come back tomorrow — or use your own AI key to continue now." |
| **Required** | "You've reached today's limit. Come back tomorrow! You can also use your own key to continue." |

No structural changes — the modal layout, buttons, and wiring in `page.tsx` remain unchanged.

---

## 3. Impact and Risk Analysis

**System Dependencies:**
- `useUserStore.updateStats()` must remain functional and continue to populate `dailyRequests` / `dailyRequestLimit` from `/api/stats`. No changes are made to this flow.
- The existing `isLimitReached` condition in `page.tsx` (`apiKey === '' && dailyRequests >= dailyRequestLimit`) already drives the `disabled` prop on `ChatInput`. The header counter and the midnight timer both read from the same store fields — no new state coordination is required.

**Potential Risks & Mitigations:**

| Risk | Mitigation |
|------|-----------|
| Timer fires slightly before the server has reset counters | `resetIfNeeded()` in `/api/stats` uses a UTC date boundary check, not a fixed offset. If it hasn't reset yet, it will reset on the next call (the visitor's first message attempt). Acceptable for this use case. |
| `remainingMessages` goes negative if the server increments before the client | Display is clamped to `Math.max(0, dailyRequestLimit - dailyRequests)` in the header render. |
| Multiple tabs open — timer fires in each | Each tab independently calls `updateStats()`. This is idempotent (read-only). No conflict. |

---

## 4. Testing Strategy

- **Manual / QA (acceptance criteria from functional spec):**
  - Set `DAILY_REQUEST_LIMIT=3` in `.env.local` and send 3 messages. Verify the counter in the header decrements correctly, the input becomes disabled after the third reply, and the popup shows the correct text.
  - After blocking, advance the system clock past midnight (or temporarily lower the `msUntilMidnight` calculation to a short interval in dev). Verify the input re-enables and the counter resets without a page refresh.
  - Switch to BYO-key mode while viewing the counter. Verify the counter disappears.

- **Unit / Component tests (if applicable):**
  - Header: render with `apiKey = ''` and assert the counter is present; render with a non-empty `apiKey` and assert it is absent.
  - `remainingMessages` derivation: assert `Math.max(0, limit - requests)` for normal, zero, and over-limit cases.
