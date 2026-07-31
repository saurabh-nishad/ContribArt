import type { Grid, Level } from "@/lib/types";
import { cellIndex } from "@/lib/date-grid";

export function setCell(grid: Grid, week: number, day: number, level: Level): Grid {
  const i = cellIndex(week, day);
  if (grid.cells[i] === level) return grid;
  const cells = [...grid.cells];
  cells[i] = level;
  return { ...grid, cells };
}

/** Iterative BFS flood fill over 4-neighbors matching the start cell's level. */
export function floodFill(grid: Grid, week: number, day: number, level: Level): Grid {
  const target = grid.cells[cellIndex(week, day)];
  if (target === level) return grid;
  const cells = [...grid.cells];
  const queue: [number, number][] = [[week, day]];
  while (queue.length) {
    const [w, d] = queue.pop()!;
    if (w < 0 || w >= grid.weeks || d < 0 || d > 6) continue;
    const i = cellIndex(w, d);
    if (cells[i] !== target) continue;
    cells[i] = level;
    queue.push([w + 1, d], [w - 1, d], [w, d + 1], [w, d - 1]);
  }
  return { ...grid, cells };
}

export function drawRect(
  grid: Grid,
  w1: number,
  d1: number,
  w2: number,
  d2: number,
  level: Level,
): Grid {
  const cells = [...grid.cells];
  for (let w = Math.min(w1, w2); w <= Math.max(w1, w2); w++) {
    for (let d = Math.min(d1, d2); d <= Math.max(d1, d2); d++) {
      cells[cellIndex(w, d)] = level;
    }
  }
  return { ...grid, cells };
}

/** Mirror left↔right (across the vertical axis). */
export function mirrorH(grid: Grid): Grid {
  const cells = [...grid.cells];
  for (let w = 0; w < grid.weeks; w++) {
    for (let d = 0; d < 7; d++) {
      cells[cellIndex(w, d)] = grid.cells[cellIndex(grid.weeks - 1 - w, d)];
    }
  }
  return { ...grid, cells };
}

/** Mirror top↕bottom (across the horizontal axis). */
export function mirrorV(grid: Grid): Grid {
  const cells = [...grid.cells];
  for (let w = 0; w < grid.weeks; w++) {
    for (let d = 0; d < 7; d++) {
      cells[cellIndex(w, d)] = grid.cells[cellIndex(w, 6 - d)];
    }
  }
  return { ...grid, cells };
}

export function rotate180(grid: Grid): Grid {
  return { ...grid, cells: [...grid.cells].reverse() };
}

export function clearGrid(grid: Grid): Grid {
  return { ...grid, cells: new Array<Level>(grid.weeks * 7).fill(0) };
}

/**
 * Stamp `source` onto `base` at a horizontal column offset, so text and art
 * (or several art pieces) can be composed onto one grid. Empty (level 0)
 * source cells are transparent — they leave the base cell untouched — so
 * overlapping non-empty source cells win. Columns outside `base` are clipped.
 */
export function stampGrid(base: Grid, source: Grid, colOffset = 0): Grid {
  const cells = [...base.cells];
  for (let w = 0; w < source.weeks; w++) {
    const targetWeek = w + colOffset;
    if (targetWeek < 0 || targetWeek >= base.weeks) continue;
    for (let d = 0; d < 7; d++) {
      const level = source.cells[cellIndex(w, d)];
      if (!level) continue;
      cells[cellIndex(targetWeek, d)] = level;
    }
  }
  return { ...base, cells };
}
