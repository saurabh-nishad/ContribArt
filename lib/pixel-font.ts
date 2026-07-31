import type { Grid, Level } from "@/lib/types";
import { cellIndex } from "@/lib/date-grid";

/**
 * 3×5 pixel font. Each glyph is 5 rows of 3 chars; '#' = on.
 * Rendered into grid rows 1–5 (leaving Sunday and Saturday rows clear).
 */
const GLYPHS: Record<string, [string, string, string, string, string]> = {
  A: [".#.", "#.#", "###", "#.#", "#.#"],
  B: ["##.", "#.#", "##.", "#.#", "##."],
  C: [".##", "#..", "#..", "#..", ".##"],
  D: ["##.", "#.#", "#.#", "#.#", "##."],
  E: ["###", "#..", "##.", "#..", "###"],
  F: ["###", "#..", "##.", "#..", "#.."],
  G: [".##", "#..", "#.#", "#.#", ".##"],
  H: ["#.#", "#.#", "###", "#.#", "#.#"],
  I: ["###", ".#.", ".#.", ".#.", "###"],
  J: ["..#", "..#", "..#", "#.#", ".#."],
  K: ["#.#", "#.#", "##.", "#.#", "#.#"],
  L: ["#..", "#..", "#..", "#..", "###"],
  M: ["#.#", "###", "###", "#.#", "#.#"],
  N: ["##.", "#.#", "#.#", "#.#", "#.#"],
  O: [".#.", "#.#", "#.#", "#.#", ".#."],
  P: ["##.", "#.#", "##.", "#..", "#.."],
  Q: [".#.", "#.#", "#.#", "##.", "..#"],
  R: ["##.", "#.#", "##.", "#.#", "#.#"],
  S: [".##", "#..", ".#.", "..#", "##."],
  T: ["###", ".#.", ".#.", ".#.", ".#."],
  U: ["#.#", "#.#", "#.#", "#.#", "###"],
  V: ["#.#", "#.#", "#.#", "#.#", ".#."],
  W: ["#.#", "#.#", "###", "###", "#.#"],
  X: ["#.#", "#.#", ".#.", "#.#", "#.#"],
  Y: ["#.#", "#.#", ".#.", ".#.", ".#."],
  Z: ["###", "..#", ".#.", "#..", "###"],
  "0": ["###", "#.#", "#.#", "#.#", "###"],
  "1": [".#.", "##.", ".#.", ".#.", "###"],
  "2": ["##.", "..#", ".#.", "#..", "###"],
  "3": ["###", "..#", ".##", "..#", "###"],
  "4": ["#.#", "#.#", "###", "..#", "..#"],
  "5": ["###", "#..", "##.", "..#", "##."],
  "6": [".##", "#..", "###", "#.#", "###"],
  "7": ["###", "..#", ".#.", ".#.", ".#."],
  "8": ["###", "#.#", "###", "#.#", "###"],
  "9": ["###", "#.#", "###", "..#", "##."],
  "-": ["...", "...", "###", "...", "..."],
  ".": ["...", "...", "...", "...", ".#."],
  "!": [".#.", ".#.", ".#.", "...", ".#."],
};

const GLYPH_WIDTH = 3;
const GLYPH_GAP = 1;
const SPACE_WIDTH = 2;

/** Width in columns needed to render `text` (no trailing gap). */
export function textWidth(text: string): number {
  let w = 0;
  for (const ch of text.toUpperCase()) {
    if (ch === " ") {
      w += SPACE_WIDTH + GLYPH_GAP;
    } else if (GLYPHS[ch]) {
      w += GLYPH_WIDTH + GLYPH_GAP;
    }
  }
  return Math.max(0, w - GLYPH_GAP);
}

export interface RenderTextOptions {
  weeks: number;
  level?: Level;
  /** left column offset; if omitted the text is centered horizontally */
  startCol?: number;
  /** top row for the 5-row glyphs (0–2); default 1 */
  row?: number;
}

/** Render text into a fresh 7×weeks grid. Glyphs that overflow are clipped. */
export function renderTextGrid(text: string, opts: RenderTextOptions): Grid {
  const { weeks, level = 4, row = 1 } = opts;
  const cells = new Array<Level>(weeks * 7).fill(0);
  const width = textWidth(text);
  let col = opts.startCol ?? Math.max(1, Math.floor((weeks - width) / 2));

  for (const ch of text.toUpperCase()) {
    if (ch === " ") {
      col += SPACE_WIDTH + GLYPH_GAP;
      continue;
    }
    const glyph = GLYPHS[ch];
    if (!glyph) continue;
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < GLYPH_WIDTH; c++) {
        if (glyph[r][c] !== "#") continue;
        const week = col + c;
        const day = row + r;
        if (week < 0 || week >= weeks || day < 0 || day > 6) continue;
        cells[cellIndex(week, day)] = level;
      }
    }
    col += GLYPH_WIDTH + GLYPH_GAP;
  }
  return { weeks, cells };
}

export function isRenderable(ch: string): boolean {
  return ch === " " || ch.toUpperCase() in GLYPHS;
}
