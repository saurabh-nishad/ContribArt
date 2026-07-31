import { describe, expect, it } from "vitest";
import {
  clearGrid,
  drawRect,
  floodFill,
  mirrorH,
  mirrorV,
  rotate180,
  setCell,
  stampGrid,
} from "@/lib/grid-ops";
import { cellIndex } from "@/lib/date-grid";
import type { Grid, Level } from "@/lib/types";

function grid(weeks: number, fill: Level = 0): Grid {
  return { weeks, cells: new Array<Level>(weeks * 7).fill(fill) };
}

describe("setCell", () => {
  it("sets a single cell immutably", () => {
    const g = grid(3);
    const g2 = setCell(g, 1, 2, 4);
    expect(g2.cells[cellIndex(1, 2)]).toBe(4);
    expect(g.cells[cellIndex(1, 2)]).toBe(0);
  });

  it("returns same reference when no-op", () => {
    const g = grid(3);
    expect(setCell(g, 0, 0, 0)).toBe(g);
  });
});

describe("floodFill", () => {
  it("fills a bounded region without leaking", () => {
    // Wall of level 4 at week 1 splits a 3-week grid.
    let g = grid(3);
    for (let d = 0; d < 7; d++) g = setCell(g, 1, d, 4);
    const filled = floodFill(g, 0, 0, 2);
    for (let d = 0; d < 7; d++) {
      expect(filled.cells[cellIndex(0, d)]).toBe(2);
      expect(filled.cells[cellIndex(1, d)]).toBe(4); // wall intact
      expect(filled.cells[cellIndex(2, d)]).toBe(0); // other side untouched
    }
  });

  it("no-ops when target equals fill level", () => {
    const g = grid(2, 3);
    expect(floodFill(g, 0, 0, 3)).toBe(g);
  });
});

describe("drawRect", () => {
  it("fills the inclusive rectangle regardless of corner order", () => {
    const g = drawRect(grid(5), 3, 4, 1, 2, 2);
    for (let w = 1; w <= 3; w++)
      for (let d = 2; d <= 4; d++)
        expect(g.cells[cellIndex(w, d)]).toBe(2);
    expect(g.cells[cellIndex(0, 0)]).toBe(0);
  });
});

describe("mirror / rotate", () => {
  it("mirrorH and mirrorV are involutions", () => {
    let g = grid(4);
    g = setCell(g, 0, 1, 3);
    g = setCell(g, 2, 5, 1);
    expect(mirrorH(mirrorH(g)).cells).toEqual(g.cells);
    expect(mirrorV(mirrorV(g)).cells).toEqual(g.cells);
    expect(rotate180(rotate180(g)).cells).toEqual(g.cells);
  });

  it("mirrorH moves a cell to the opposite column", () => {
    const g = setCell(grid(4), 0, 3, 4);
    expect(mirrorH(g).cells[cellIndex(3, 3)]).toBe(4);
  });

  it("rotate180 equals mirrorH∘mirrorV", () => {
    let g = grid(3);
    g = setCell(g, 0, 0, 1);
    g = setCell(g, 1, 4, 2);
    expect(rotate180(g).cells).toEqual(mirrorH(mirrorV(g)).cells);
  });
});

describe("clearGrid", () => {
  it("zeroes everything", () => {
    const g = clearGrid(grid(3, 4));
    expect(g.cells.every((c) => c === 0)).toBe(true);
  });
});

describe("stampGrid", () => {
  it("overlays non-empty source cells at the given column offset", () => {
    const base = grid(5, 1);
    const source = grid(2, 3);
    const result = stampGrid(base, source, 2);
    for (let d = 0; d < 7; d++) {
      expect(result.cells[cellIndex(0, d)]).toBe(1); // untouched
      expect(result.cells[cellIndex(1, d)]).toBe(1); // untouched
      expect(result.cells[cellIndex(2, d)]).toBe(3); // stamped
      expect(result.cells[cellIndex(3, d)]).toBe(3); // stamped
      expect(result.cells[cellIndex(4, d)]).toBe(1); // untouched
    }
  });

  it("treats empty (level 0) source cells as transparent", () => {
    let source = grid(2, 0);
    source = setCell(source, 0, 0, 4);
    const base = grid(2, 2);
    const result = stampGrid(base, source, 0);
    expect(result.cells[cellIndex(0, 0)]).toBe(4); // stamped
    expect(result.cells[cellIndex(1, 0)]).toBe(2); // left as base (transparent)
  });

  it("clips columns that fall outside the base grid", () => {
    const base = grid(3, 0);
    const source = grid(3, 4);
    const result = stampGrid(base, source, 2);
    expect(result.cells[cellIndex(2, 0)]).toBe(4); // only in-range column stamped
    expect(result.weeks).toBe(3);
  });
});
