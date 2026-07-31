# ContribArt

> Turn your GitHub contribution graph into pixel art.

Design pixel patterns (text, icons, custom images) for your GitHub
contribution graph and get a complete day-by-day commit schedule with
exports and git automation scripts.

Client-only Next.js app — all state lives in your browser's localStorage.

## Features

- **Setup** — pick a start/end date; the grid auto-sizes to 7 rows × N week
  columns exactly like GitHub. Configure commits per shade (Empty / Light /
  Medium / Dark / Very Dark) plus randomization jitter.
- **Pattern sources** — render text with a built-in 3×5 pixel font (`SN-007`,
  `TECHMONK`, …), pick from 17 built-in templates (Rocket, Heart, Octocat,
  WiFi, STM32, …), or import a PNG/SVG/BMP image (downsampled and quantized to
  the 5 GitHub shades).
- **Pixel editor** — paint, erase, rectangle, flood fill, mirror, rotate,
  undo/redo (Ctrl+Z / Ctrl+Y), pattern JSON import/export. **Insert pattern**
  lets you drop text and an art template onto the same canvas — position
  each with a column offset and merge (stamp) or replace, so you can combine
  an icon with a text label instead of only ever having one or the other.
- **Preview** — pixel-perfect clone of GitHub's contribution graph with month
  and day labels, per-day tooltips, zoom, light/dark palettes.
- **Commit planner** — per-day table with editable commit counts, day locking,
  and randomize-within-jitter.
- **Today's task** — what to do today: shade, commit count, copyable git
  commands, mark complete / skip.
- **Calendar & dashboard** — monthly status view, progress bar, statistics
  (total/avg/max commits, completion %).
- **Exports** — CSV, Excel-friendly CSV, JSON, Markdown.
- **Git automation** — download `generate.sh` or `generate.py`, which create
  backdated commits via `GIT_AUTHOR_DATE` / `GIT_COMMITTER_DATE` for every
  pending day in the schedule.

## Getting started

```bash
pnpm install
pnpm dev        # http://localhost:3000
```

## Scripts

```bash
pnpm dev        # dev server
pnpm build      # production build
pnpm lint       # eslint
pnpm test       # vitest unit tests (date math, font, grid ops, schedule, exporters)
```

## Using the generated scripts

```bash
mkdir my-pattern-repo && cd my-pattern-repo && git init
bash /path/to/generate.sh          # or: python generate.py [--repo PATH] [--dry-run]
# create an empty repo on GitHub, then:
git remote add origin <url>
git push -u origin main
```

Note: GitHub only shows contributions from commits whose author email matches
a verified email on your account, on the default branch of a non-forked repo.

## Stack

Next.js (App Router) · React · TypeScript · Tailwind CSS · shadcn/ui ·
zustand (+ zundo for undo history) · date-fns · vitest
