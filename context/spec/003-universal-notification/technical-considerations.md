<!-- This document describes HOW to build the feature at an architectural level. -->

# Technical Specification: Universal Notification System

- **Functional Specification:** [context/spec/003-universal-notification/functional-spec.md](./functional-spec.md)
- **Status:** Completed
- **Author(s):** Serhii Kushnir

> **Context:** The enrollment gate, Zustand stores, and layout structure are all in place from specs 001–002. This spec adds a fourth ephemeral Zustand store, a custom hook, and three new UI components mounted once in the root layout. No server-side work is required.

---

## 1. High-Level Technical Approach

Add a **lightweight ephemeral Zustand store** (`useNotificationStore`) that holds the active toast queue and the current modal state. Two client components (`ToastContainer`, `ConfirmModal`) subscribe to this store and render their output into the DOM above all other content. They are mounted once in `(admin)/layout.tsx`. Any component anywhere in the app calls `useNotification()` to trigger a toast or open a confirmation modal. No persistence, no server interaction.

---

## 2. Proposed Solution & Implementation Plan

### 2.1 New Store — `src/store/useNotificationStore.ts`

**No `persist` middleware** — notifications are ephemeral and intentionally reset on each page load.

**State shape:**

| Field | Type | Default |
|---|---|---|
| `toasts` | `Toast[]` | `[]` |
| `modal` | `ModalState \| null` | `null` |

**`Toast` object:**

| Field | Type |
|---|---|
| `id` | `string` (random UUID) |
| `type` | `'info' \| 'warning' \| 'error'` |
| `message` | `string` |

**`ModalState` object:**

| Field | Type |
|---|---|
| `title` | `string` |
| `message` | `string` |
| `confirmLabel` | `string` |
| `variant` | `'primary' \| 'danger'` |
| `onConfirm` | `() => void` |

**Actions:**

| Action | Behaviour |
|---|---|
| `addToast(type, message)` | Appends a toast with a generated `id`. If a toast of the same `type` already exists, it is replaced (not duplicated). For `'info'` type only: schedules `removeToast(id)` after 4 000 ms. Timer reference stored in a `Map<id, ReturnType<typeof setTimeout>>` inside the store closure so it can be cleared on manual dismiss. |
| `removeToast(id)` | Removes the toast by `id`; cancels any pending auto-dismiss timer for that id. |
| `openModal(options: ModalState)` | Sets `modal` to the provided options. |
| `closeModal()` | Sets `modal` to `null`. |

---

### 2.2 Custom Hook — `src/hooks/useNotification.ts`

A thin wrapper that reads `addToast` and `openModal` from the store via `useNotificationStore.getState()` (not as a subscription — callers are dispatchers, not subscribers).

| Exported function | Signature |
|---|---|
| `toast` | `(type: 'info' \| 'warning' \| 'error', message: string) => void` |
| `confirm` | `(options: { title, message, confirmLabel, variant, onConfirm }) => void` |

Usage in any component: `const { toast, confirm } = useNotification()`

---

### 2.3 Components

**`src/components/ui/Toast.tsx`**

| Prop | Type |
|---|---|
| `id` | `string` |
| `type` | `'info' \| 'warning' \| 'error'` |
| `message` | `string` |
| `onDismiss` | `(id: string) => void` |

Layout: surface card (`bg-[#161B22]`), left-side type icon, message text, × button on the right. Left-border accent by type.

| Type | Accent colour |
|---|---|
| `info` | `#2F81F7` (project accent blue) |
| `warning` | `#D29922` (amber) |
| `error` | `#DA3633` (red) |

---

**`src/components/ui/ToastContainer.tsx`**

`'use client'`. Subscribes to `useNotificationStore.toasts`.

- Positioned: `fixed bottom-4 left-1/2 -translate-x-1/2 flex flex-col-reverse gap-2 z-50`
- Renders a `<Toast>` for each active toast; passes `removeToast` as `onDismiss`
- On screens narrower than 480 px: toasts span full width (`w-screen px-4`)

---

**`src/components/ui/ConfirmModal.tsx`**

`'use client'`. Subscribes to `useNotificationStore.modal`.

- Renders nothing when `modal === null`
- When `modal !== null`: `fixed inset-0 z-50 flex items-center justify-center`
  - Background: `bg-black/60` (dimmed overlay — clicking it calls `closeModal()`)
  - Card: `bg-[#161B22]` centered, `rounded-xl`, `max-w-sm w-full mx-4`, `p-6`
  - Contents: `<h2>` title, `<p>` message, two buttons (primary action + "Cancel")
  - **Danger variant** primary button: `bg-[#DA3633] hover:bg-red-600`
  - **Primary variant** primary button: `bg-[#2F81F7] hover:bg-blue-500`
  - Cancel button: muted, outlined
  - Primary button click: calls `onConfirm()` then `closeModal()`

---

### 2.4 Layout Integration — `src/app/(admin)/layout.tsx`

Add both containers **outside** the main content tree, as siblings inside the `EnrollmentGate`:

```tsx
<EnrollmentGate>
  <div className="flex min-h-screen">
    <Sidebar />
    <div>
      <Header />
      {children}
    </div>
  </div>
  <ToastContainer />
  <ConfirmModal />
</EnrollmentGate>
```

Both components are `'use client'` — Next.js App Router handles importing client components into a Server Component layout without a wrapper.

---

### 2.5 Export Additions

- `src/components/ui/index.ts` — add exports for `Toast`, `ToastContainer`, `ConfirmModal`
- `src/hooks/` directory — create with `useNotification.ts` (directory does not exist yet; standard Next.js convention)

---

## 3. Impact and Risk Analysis

| Risk | Impact | Mitigation |
|---|---|---|
| Auto-dismiss timer fires after the toast has been manually dismissed | `removeToast` called on a non-existent id — no-op, harmless | Store `setTimeout` reference by id in a closure-level `Map`; always `clearTimeout` in `removeToast` |
| `onConfirm` captures a stale closure from the caller | Destructive action targets wrong item | Modal stores the callback provided at open time; caller always supplies a fresh closure when opening |
| `ToastContainer` and `NamePrompt` share `z-50` — DOM order determines winner | Notifications may render behind the name prompt | `ToastContainer` and `ConfirmModal` are rendered after `EnrollmentGate`'s children in the DOM, so they naturally paint on top |
| `src/hooks/` directory is new | Needs creating | Standard Next.js project convention; no configuration required |

---

## 4. Testing Strategy

```bash
# Build check
npm run build

# Dev server — verify from browser DevTools console:
# import { useNotificationStore } from the module, or access via React DevTools
```

Browser verification checklist:
- Info toast auto-dismisses after 4 s; × dismisses immediately
- Warning/error toasts persist until manually dismissed
- Second same-type toast replaces the first (not stacked)
- Two different-type toasts stack vertically
- Modal blocks background interaction; Cancel and overlay click both close without action
- Primary button triggers `onConfirm` then closes modal
- Mobile: toasts span full width; modal card has visible padding on all sides
