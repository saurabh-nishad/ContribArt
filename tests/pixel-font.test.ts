import { describe, expect, it } from "vitest";
import { renderTextGrid, textWidth, isRenderable } from "@/lib/pixel-font";
import { cellIndex } from "@/lib/date-grid";

describe("textWidth", () => {
  it("measures glyphs + gaps", () => {
    expect(textWidth("A")).toBe(3);
    expect(textWidth("AB")).toBe(7); // 3 + 1 + 3
    expect(textWidth("SN-007")).toBe(23); // 6 glyphs * 3 + 5 gaps
    expect(textWidth("A B")).toBe(10); // 3 + 1 + 2 + 1 + 3
  });
});

describe("renderTextGrid", () => {
  it("renders 'I' at the requested position and level", () => {
    const grid = renderTextGrid("I", { weeks: 5, level: 3, startCol: 1, row: 1 });
    // Top row of I: "###" at row 1, cols 1-3.
    expect(grid.cells[cellIndex(1, 1)]).toBe(3);
    expect(grid.cells[cellIndex(2, 1)]).toBe(3);
    expect(grid.cells[cellIndex(3, 1)]).toBe(3);
    // Middle of I: only center col.
    expect(grid.cells[cellIndex(1, 2)]).toBe(0);
    expect(grid.cells[cellIndex(2, 2)]).toBe(3);
    // Rows 0 and 6 stay empty.
    for (let w = 0; w < 5; w++) {
      expect(grid.cells[cellIndex(w, 0)]).toBe(0);
      expect(grid.cells[cellIndex(w, 6)]).toBe(0);
    }
  });

  it("clips overflowing glyphs instead of wrapping", () => {
    const grid = renderTextGrid("WWWW", { weeks: 6, startCol: 0 });
    expect(grid.cells).toHaveLength(42);
    // Nothing painted outside the 6 weeks (no exception, correct length).
    expect(grid.cells.every((c) => c >= 0 && c <= 4)).toBe(true);
  });

  it("centers by default", () => {
    const grid = renderTextGrid("I", { weeks: 11 });
    // width 3 in 11 weeks → startCol 4 → columns 4-6 used.
    expect(grid.cells[cellIndex(4, 1)]).toBe(4);
    expect(grid.cells[cellIndex(3, 1)]).toBe(0);
  });

  it("ignores unsupported characters", () => {
    const a = renderTextGrid("A@B", { weeks: 20, startCol: 0 });
    const b = renderTextGrid("AB", { weeks: 20, startCol: 0 });
    expect(a.cells).toEqual(b.cells);
  });
});

describe("isRenderable", () => {
  it("accepts letters, digits, dash, dot, space", () => {
    for (const c of "az09-. ") expect(isRenderable(c)).toBe(true);
    expect(isRenderable("@")).toBe(false);
  });
});
