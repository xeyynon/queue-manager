# Design system

Tokens live in `src/app/globals.css` (light, OS-dark, toggle-dark). Components use Tailwind classes mapped to those tokens (`bg-surface`, `text-ink-2`, …); no colour literals (test-enforced).

## Point of view
A calm counter tool for a busy front desk. Warm paper page, white panels separated by tone (no borders on cards), one deep-indigo accent reserved for the primary action and focus. The one product-world mark is the **ticket stub**: token numbers sit in a recessed tile with a dashed tear line, like a paper token.

## Type
- **Inter** for UI text (dense data UI, good at small sizes).
- **IBM Plex Mono** with tabular figures for every number, token, time and timer (`.num`), so live timers don't jitter.
- Both self-hosted via `next/font` (downloaded at build, served from our origin).

## Shape and spacing
- Radius 6px (`rounded-md`) for panels/buttons, 4px for small tiles: a precision tool, not a consumer app.
- Elevation by tone; the only shadow is the floating menu (`--shadow-pop`; dark mode uses a 1px line instead).
- Touch: buttons grow to 44px under `pointer: coarse`; "Serve next" is 64px and docks to the bottom on phones.

## Colour roles
| Token | Role |
|---|---|
| `--accent` | primary button, focus ring, active nav underline, links |
| `--warn-ink` | "long wait" text (always with clock icon + words) |
| `--danger-ink` | errors and the cancel ✕ |
| `--ok-ink` | reserved for "served" text |
| `--chart-a/-b/-line` | chart series only (DEC-015) |

## Contrast (measured 2026-11-14, `node scripts/contrast.mjs`)
All 24 pairs pass in both themes. Lowest text pairs: light `--ink-3` on `--surface-2` 4.99:1; dark `--ink-3` on `--surface-2` 5.49:1. Lowest graphic: light `--chart-b` on `--surface` 3.20:1 (min 3).

## Motion
Press feedback `scale(.97)` only; no entrance animations on high-frequency actions (serve/add/move happen hundreds of times a day). `prefers-reduced-motion` removes it.
