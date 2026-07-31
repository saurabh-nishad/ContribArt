import type {
  Grid,
  IntensityMap,
  Level,
  Project,
  ScheduleEntry,
} from "@/lib/types";
import { cellIndex, enumerateDates } from "@/lib/date-grid";

/**
 * Build a schedule from the grid. Preserves commits/lock/status of existing
 * locked entries (matched by date); everything else is recomputed from levels.
 */
export function buildSchedule(
  startDate: string,
  endDate: string,
  grid: Grid,
  intensity: IntensityMap,
  previous: ScheduleEntry[] = [],
): ScheduleEntry[] {
  const prevByDate = new Map(previous.map((e) => [e.date, e]));
  return enumerateDates(startDate, endDate).map(({ date, week, day }) => {
    const level = (grid.cells[cellIndex(week, day)] ?? 0) as Level;
    const prev = prevByDate.get(date);
    if (prev?.locked) {
      return { ...prev, week, dayOfWeek: day, level };
    }
    return {
      date,
      week,
      dayOfWeek: day,
      level,
      commits: intensity.levels[level],
      locked: false,
      status: prev?.status ?? "pending",
    };
  });
}

/** Randomize commits of unlocked days: base * (1 ± jitter), ≥1 when level > 0. */
export function randomizeCommits(
  schedule: ScheduleEntry[],
  intensity: IntensityMap,
  rng: () => number = Math.random,
): ScheduleEntry[] {
  return schedule.map((e) => {
    if (e.locked || e.level === 0) return e;
    const base = intensity.levels[e.level];
    const factor = 1 + (rng() * 2 - 1) * intensity.jitter;
    return { ...e, commits: Math.max(1, Math.round(base * factor)) };
  });
}

export interface ProjectStats {
  totalDays: number;
  filledCells: number;
  totalCommits: number;
  avgPerDay: number;
  maxPerDay: number;
  doneDays: number;
  skippedDays: number;
  pendingDays: number;
  completedCommits: number;
  remainingCommits: number;
  /** done / (days that require action, i.e. commits > 0) */
  completionPct: number;
  /** filled / total cells */
  contributionPct: number;
  daysRemaining: number;
}

export function computeStats(project: Project): ProjectStats {
  const s = project.schedule;
  const active = s.filter((e) => e.commits > 0);
  const totalCommits = s.reduce((sum, e) => sum + e.commits, 0);
  const completedCommits = s
    .filter((e) => e.status === "done")
    .reduce((sum, e) => sum + e.commits, 0);
  const doneDays = s.filter((e) => e.status === "done").length;
  const skippedDays = s.filter((e) => e.status === "skipped").length;
  const doneActive = active.filter((e) => e.status !== "pending").length;
  return {
    totalDays: s.length,
    filledCells: s.filter((e) => e.level > 0).length,
    totalCommits,
    avgPerDay: s.length ? totalCommits / s.length : 0,
    maxPerDay: s.reduce((m, e) => Math.max(m, e.commits), 0),
    doneDays,
    skippedDays,
    pendingDays: s.length - doneDays - skippedDays,
    completedCommits,
    remainingCommits: totalCommits - completedCommits,
    completionPct: active.length ? (doneActive / active.length) * 100 : 0,
    contributionPct: s.length
      ? (s.filter((e) => e.level > 0).length / s.length) * 100
      : 0,
    daysRemaining: active.filter((e) => e.status === "pending").length,
  };
}
