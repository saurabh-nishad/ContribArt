"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  DayStatus,
  Grid,
  IntensityMap,
  Level,
  Project,
} from "@/lib/types";
import { DEFAULT_INTENSITY } from "@/lib/types";
import { computeGridInfo } from "@/lib/date-grid";
import { buildSchedule, randomizeCommits } from "@/lib/schedule";

function emptyGrid(weeks: number): Grid {
  return { weeks, cells: new Array<Level>(weeks * 7).fill(0) };
}

function defaultProject(): Project {
  const year = new Date().getFullYear();
  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;
  const { weeks } = computeGridInfo(startDate, endDate);
  const grid = emptyGrid(weeks);
  return {
    version: 1,
    id: crypto.randomUUID(),
    name: "My Pattern",
    startDate,
    endDate,
    grid,
    intensity: DEFAULT_INTENSITY,
    schedule: buildSchedule(startDate, endDate, grid, DEFAULT_INTENSITY),
    updatedAt: new Date().toISOString(),
  };
}

interface ProjectState {
  project: Project;
  setName: (name: string) => void;
  setDateRange: (startDate: string, endDate: string) => void;
  applyGrid: (grid: Grid) => void;
  setIntensity: (intensity: IntensityMap) => void;
  setDayCommits: (date: string, commits: number) => void;
  toggleLock: (date: string) => void;
  setDayStatus: (date: string, status: DayStatus) => void;
  randomize: () => void;
  resetProject: () => void;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set) => {
      const touch = (p: Project): Project => ({
        ...p,
        updatedAt: new Date().toISOString(),
      });
      const update = (fn: (p: Project) => Project) =>
        set((s) => ({ project: touch(fn(s.project)) }));

      return {
        project: defaultProject(),

        setName: (name) => update((p) => ({ ...p, name })),

        setDateRange: (startDate, endDate) =>
          update((p) => {
            const { weeks } = computeGridInfo(startDate, endDate);
            // Keep existing cells where they still fit; new cells empty.
            const cells = new Array<Level>(weeks * 7).fill(0);
            for (let i = 0; i < Math.min(cells.length, p.grid.cells.length); i++) {
              cells[i] = p.grid.cells[i];
            }
            const grid = { weeks, cells };
            return {
              ...p,
              startDate,
              endDate,
              grid,
              schedule: buildSchedule(startDate, endDate, grid, p.intensity, p.schedule),
            };
          }),

        applyGrid: (grid) =>
          update((p) => ({
            ...p,
            grid,
            schedule: buildSchedule(p.startDate, p.endDate, grid, p.intensity, p.schedule),
          })),

        setIntensity: (intensity) =>
          update((p) => ({
            ...p,
            intensity,
            schedule: buildSchedule(p.startDate, p.endDate, p.grid, intensity, p.schedule),
          })),

        setDayCommits: (date, commits) =>
          update((p) => ({
            ...p,
            schedule: p.schedule.map((e) =>
              e.date === date ? { ...e, commits: Math.max(0, commits) } : e,
            ),
          })),

        toggleLock: (date) =>
          update((p) => ({
            ...p,
            schedule: p.schedule.map((e) =>
              e.date === date ? { ...e, locked: !e.locked } : e,
            ),
          })),

        setDayStatus: (date, status) =>
          update((p) => ({
            ...p,
            schedule: p.schedule.map((e) =>
              e.date === date ? { ...e, status } : e,
            ),
          })),

        randomize: () =>
          update((p) => ({
            ...p,
            schedule: randomizeCommits(p.schedule, p.intensity),
          })),

        resetProject: () => set({ project: defaultProject() }),
      };
    },
    { name: "pg:project:v1", version: 1 },
  ),
);
