# INTSE Chat Redesign — imported design reference

Source: Claude Design project `Nocturne`
(`a22fbfab-690e-4099-a646-0a3da706a2ee`, file `INTSE Chat Redesign.dc.html`).

## Artboards

| # | Name | Status in code |
| --- | --- | --- |
| 1a | Conversation-first | partially borrowed (quiet corrections, suggestion pills, dock mic) |
| 1b | Voice-first | `TalkPanel` — the "Talk" tab of the coached session (mascot + pulse rings + hands-free auto-dialog) |
| 1c | **Coached session** — chosen direction | `SessionHeader` (progress ring, title, turns, End, Chat/Talk/Prompt tabs), `CorrectionCard` ("One fix"), `StreakChip`, inline `MessageActions` |
| 1d | Desktop shell | icon rail (`Sidebar`/`Navigation`) + centre column (max-w 680) + right `SessionPanel` rail; sheet on mobile |
| 1e | Mark & mascot | `IntseMark` (`idle` / `listening` / `thinking` / `pleased`) |

## Design system (Nocturne)

Dark blue-grey ground (`--color-bg #161826`), Inter medium, 8px radii, one
blurple accent (`--color-accent #9184d9`, OKLCH hue 289.2) used as line and
glow, never a flood. Tonal ramps (`--color-neutral-*`, `--color-accent-*`)
share one OKLCH lightness scale. Compact spacing (density 0.70×).

The tokens live in [`src/app/styles/theme.css`](../src/app/styles/theme.css);
`nocturne-styles.css` here is the upstream source of truth, kept for diffing.

## Animations

- `intse-pulse-ring` — concentric rings behind the voice mascot (1b / empty state)
- `intse-blink` / `TypingIndicator` dots — assistant thinking
- `intse-message-in` — bubble + correction-card entrance
- header progress ring — `stroke-dashoffset` transition toward a 12-turn soft target

All are disabled under `prefers-reduced-motion`.
