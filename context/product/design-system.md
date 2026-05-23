# INTSE Design System

> Business · Engineering · High Contrast · Bold Typography

---

## Color Palette

| Token | Dark Mode | Light Mode |
|---|---|---|
| `--bg` | `#0D1117` | `#FFFFFF` |
| `--surface` | `#161B22` | `#F6F8FA` |
| `--surface-2` | `#21262D` | `#EAEEF2` |
| `--text` | `#F0F6FC` | `#0D1117` |
| `--text-muted` | `#8B949E` | `#6E7781` |
| `--accent` | `#2F81F7` | `#2F81F7` |
| `--accent-hover` | `#58A6FF` | `#1A6FD4` |
| `--border` | `rgba(255,255,255,0.08)` | `rgba(0,0,0,0.08)` |
| `--error` | `#F85149` | `#CF222E` |
| `--success` | `#3FB950` | `#1A7F37` |
| `--warning` | `#D29922` | `#9A6700` |

## Typography

| Role | Font | Size | Weight | Notes |
|---|---|---|---|---|
| Display | Inter | 32px | 700 | Page titles, hero greetings |
| Heading | Inter | 24px | 700 | Section headers |
| Subheading | Inter | 18px | 600 | Card titles |
| Body | Inter | 16px | 400 | Default text |
| Body small | Inter | 14px | 400 | Secondary info |
| Label | Inter | 12px | 500 | Uppercase, `letter-spacing: 0.08em` |
| Mono | JetBrains Mono | 13px | 400 | Token counters, IDs, stats |

## Spacing & Shape

| Token | Value |
|---|---|
| Card border-radius | `8px` |
| Button border-radius | `10px` |
| Input border-radius | `8px` |
| Pill (FAB / badges) | `999px` |
| Card padding | `16–20px` |
| Section gap | `24px` |
| Border width | `1px` |

## Component Patterns (from design references)

- **Welcome / Dashboard home:** AI avatar circle + greeting headline + horizontal-scroll prompt chip row ("Start a chat") + history card list + floating "New Chat" pill button (bottom-right)
- **Prompt chips:** Rounded cards (`8px`), surface-2 background, accent-colored text, subtle border — horizontal scroll, no wrap
- **History cards:** Full-width surface cards, session title (bold) + date (muted mono), chevron or subtle right indicator
- **Bottom navigation:** 4–5 icon tabs, active tab in accent color, inactive in muted — fixed to bottom on mobile
- **Three-dot message menu:** Sheet/popover with icon rows — speed slider, voice picker, repeat, copy, delete
- **Universal Popup:** Centered modal on mobile, max-width `360px`, surface background, accent border-top or icon, action buttons full-width

## Theme Toggle

Both themes follow the same structural tokens. Switching is done via a CSS class on `<html>` (`class="dark"` / `class="light"`). Tailwind v4 `dark:` variants + CSS custom properties handle the swap. Default: dark.

## Fonts Loading (Next.js)

```ts
// src/app/layout.tsx
import { Inter, JetBrains_Mono } from 'next/font/google'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' })
```
