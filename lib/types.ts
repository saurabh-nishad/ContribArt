export type Level = 0 | 1 | 2 | 3 | 4;

/** Column-major grid: index = week * 7 + dayOfWeek (0 = Sunday). */
export interface Grid {
  weeks: number;
  cells: Level[];
}

/** Base commits per level + jitter fraction (0–1) applied on randomize. */
export interface IntensityMap {
  levels: [number, number, number, number, number];
  jitter: number;
}

export type DayStatus = "pending" | "done" | "skipped";

export interface ScheduleEntry {
  /** 'yyyy-MM-dd' */
  date: string;
  week: number;
  /** 0 = Sunday … 6 = Saturday */
  dayOfWeek: number;
  level: Level;
  commits: number;
  locked: boolean;
  status: DayStatus;
}

export interface Project {
  version: 1;
  id: string;
  name: string;
  /** 'yyyy-MM-dd' */
  startDate: string;
  /** 'yyyy-MM-dd' */
  endDate: string;
  grid: Grid;
  intensity: IntensityMap;
  schedule: ScheduleEntry[];
  updatedAt: string;
}

export const DEFAULT_INTENSITY: IntensityMap = {
  levels: [0, 3, 8, 15, 25],
  jitter: 0.2,
};

export const LEVEL_NAMES = ["Empty", "Light", "Medium", "Dark", "Very Dark"] as const;

export const GITHUB_COLORS = [
  "#ebedf0",
  "#9be9a8",
  "#40c463",
  "#30a14e",
  "#216e39",
] as const;

export const GITHUB_COLORS_DARK = [
  "#161b22",
  "#0e4429",
  "#006d32",
  "#26a641",
  "#39d353",
] as const;
