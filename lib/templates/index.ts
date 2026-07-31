import type { Grid, Level } from "@/lib/types";
import { cellIndex } from "@/lib/date-grid";
import { renderTextGrid, textWidth } from "@/lib/pixel-font";

/**
 * Pixel-art templates: 7 rows of equal-width strings.
 * '.' = empty, '1'–'4' = intensity levels.
 */
export interface ArtTemplate {
  id: string;
  name: string;
  kind: "art";
  rows: string[];
}

export interface TextTemplate {
  id: string;
  name: string;
  kind: "text";
  text: string;
}

export type Template = ArtTemplate | TextTemplate;

const art = (id: string, name: string, rows: string[]): ArtTemplate => ({
  id,
  name,
  kind: "art",
  rows,
});

const txt = (id: string, name: string, text: string): TextTemplate => ({
  id,
  name,
  kind: "text",
  text,
});

export const TEMPLATES: Template[] = [
  txt("sn", "SN", "SN"),
  txt("sn-007", "SN-007", "SN-007"),
  txt("techmonk", "TECHMONK", "TECHMONK"),
  txt("stm32", "STM32", "STM32"),
  txt("hello", "HELLO", "HELLO"),
  art("rocket", "Rocket", [
    "..3..",
    ".333.",
    ".343.",
    ".333.",
    ".333.",
    "33333",
    "2.2.2",
  ]),
  art("satellite", "Satellite", [
    ".3...33",
    "3.3..33",
    ".3.3...",
    "...3...",
    "..333..",
    "..343..",
    "..333..",
  ]),
  art("gps", "GPS Pin", [
    ".333.",
    "33333",
    "33433",
    "33333",
    ".333.",
    "..3..",
    "..3..",
  ]),
  art("lightning", "Lightning", [
    "...33",
    "..33.",
    ".3333",
    "..33.",
    ".33..",
    "33...",
    "3....",
  ]),
  art("robot", "Robot", [
    ".3...3.",
    "3333333",
    "3.4.4.3",
    "3333333",
    "3.333.3",
    "3333333",
    ".3...3.",
  ]),
  art("heart", "Heart", [
    ".......",
    ".33.33.",
    "3443443",
    "3444443",
    ".34443.",
    "..343..",
    "...3...",
  ]),
  art("octocat", "Octocat", [
    ".3...3.",
    "3333333",
    "3343433",
    "3333333",
    ".33333.",
    "..3.3..",
    ".3...3.",
  ]),
  art("wifi", "WiFi", [
    ".33333.",
    "3.....3",
    "..333..",
    ".3...3.",
    ".......",
    "...3...",
    ".......",
  ]),
  art("circuit", "Circuit", [
    "4..3..4",
    ".3.3.3.",
    "..333..",
    "3334333",
    "..333..",
    ".3.3.3.",
    "4..3..4",
  ]),
  art("battery", "Battery", [
    ".........",
    "33333333.",
    "3.44.44.3",
    "3.44.44.3",
    "33333333.",
    ".........",
    ".........",
  ]),
  art("chip", "Embedded Chip", [
    ".3.3.3.",
    "3333333",
    "3.....3",
    "3..4..3",
    "3.....3",
    "3333333",
    ".3.3.3.",
  ]),
  art("penguin", "Linux Penguin", [
    ".333.",
    "34343",
    "33233",
    "31113",
    "31113",
    "31113",
    ".3.3.",
  ]),
];

export function templateWidth(t: Template): number {
  return t.kind === "text" ? textWidth(t.text) : t.rows[0].length;
}

/** Stamp a template into a fresh 7×weeks grid, horizontally centered. */
export function templateToGrid(t: Template, weeks: number): Grid {
  if (t.kind === "text") {
    return renderTextGrid(t.text, { weeks });
  }
  const cells = new Array<Level>(weeks * 7).fill(0);
  const width = t.rows[0].length;
  const startCol = Math.max(0, Math.floor((weeks - width) / 2));
  for (let r = 0; r < 7; r++) {
    for (let c = 0; c < width; c++) {
      const ch = t.rows[r]?.[c] ?? ".";
      if (ch === ".") continue;
      const week = startCol + c;
      if (week >= weeks) continue;
      cells[cellIndex(week, r)] = Number(ch) as Level;
    }
  }
  return { weeks, cells };
}

/** Weeks needed to preview a template comfortably. */
export function templatePreviewWeeks(t: Template): number {
  return templateWidth(t) + 2;
}
