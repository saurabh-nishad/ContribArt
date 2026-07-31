"use client";

import { create } from "zustand";
import { temporal } from "zundo";
import type { Grid, Level } from "@/lib/types";
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

export type Tool = "paint" | "erase" | "rect" | "fill";

interface EditorState {
  grid: Grid;
  tool: Tool;
  brushLevel: Level;
  /** rect tool anchor while dragging */
  anchor: { week: number; day: number } | null;
  setGrid: (grid: Grid) => void;
  setTool: (tool: Tool) => void;
  setBrushLevel: (level: Level) => void;
  setAnchor: (a: { week: number; day: number } | null) => void;
  paint: (week: number, day: number) => void;
  fill: (week: number, day: number) => void;
  applyRect: (week: number, day: number) => void;
  mirrorHorizontal: () => void;
  mirrorVertical: () => void;
  rotate: () => void;
  clear: () => void;
  /** Stamp another pattern (text or art) onto the current grid at a column
   *  offset so different sources can be composed together; optionally clear
   *  the canvas first to use this as a "replace" instead. */
  insertPattern: (source: Grid, colOffset: number, clearFirst?: boolean) => void;
}

export const useEditorStore = create<EditorState>()(
  temporal(
    (set, get) => ({
      grid: { weeks: 1, cells: [0] },
      tool: "paint",
      brushLevel: 4,
      anchor: null,

      setGrid: (grid) => set({ grid }),
      setTool: (tool) => set({ tool, anchor: null }),
      setBrushLevel: (brushLevel) => set({ brushLevel }),
      setAnchor: (anchor) => set({ anchor }),

      paint: (week, day) => {
        const { grid, tool, brushLevel } = get();
        const level = tool === "erase" ? 0 : brushLevel;
        set({ grid: setCell(grid, week, day, level) });
      },

      fill: (week, day) => {
        const { grid, brushLevel } = get();
        set({ grid: floodFill(grid, week, day, brushLevel) });
      },

      applyRect: (week, day) => {
        const { grid, anchor, brushLevel } = get();
        if (!anchor) return;
        set({
          grid: drawRect(grid, anchor.week, anchor.day, week, day, brushLevel),
          anchor: null,
        });
      },

      mirrorHorizontal: () => set({ grid: mirrorH(get().grid) }),
      mirrorVertical: () => set({ grid: mirrorV(get().grid) }),
      rotate: () => set({ grid: rotate180(get().grid) }),
      clear: () => set({ grid: clearGrid(get().grid) }),

      insertPattern: (source, colOffset, clearFirst = false) => {
        const base = clearFirst ? clearGrid(get().grid) : get().grid;
        set({ grid: stampGrid(base, source, colOffset) });
      },
    }),
    {
      partialize: (s) => ({ grid: s.grid }),
      limit: 100,
      equality: (a, b) => a.grid === b.grid,
    },
  ),
);
