import { describe, expect, it } from "vitest";
import { buildSchedule, computeStats, randomizeCommits } from "@/lib/schedule";
import { computeGridInfo } from "@/lib/date-grid";
import { DEFAULT_INTENSITY, type Grid, type Level, type Project } from "@/lib/types";

function makeGrid(startDate: string, endDate: string, level: Level = 0): Grid {
  const { weeks } = computeGridInfo(startDate, endDate);
  return { weeks, cells: new Array<Level>(weeks * 7).fill(level) };
}

describe("buildSchedule", () => {
  it("creates one entry per in-range day with commits from intensity", () => {
    const grid = makeGrid("2027-01-01", "2027-01-31", 2);
    const s = buildSchedule("2027-01-01", "2027-01-31", grid, DEFAULT_INTENSITY);
    expect(s).toHaveLength(31);
    expect(s.every((e) => e.commits === DEFAULT_INTENSITY.levels[2])).toBe(true);
    expect(s[0].date).toBe("2027-01-01");
  });

  it("preserves locked entries across rebuilds", () => {
    const grid = makeGrid("2027-01-01", "2027-01-31", 1);
    let s = buildSchedule("2027-01-01", "2027-01-31", grid, DEFAULT_INTENSITY);
    s = s.map((e) =>
      e.date === "2027-01-10" ? { ...e, commits: 99, locked: true } : e,
    );
    const rebuilt = buildSchedule("2027-01-01", "2027-01-31", grid, DEFAULT_INTENSITY, s);
    expect(rebuilt.find((e) => e.date === "2027-01-10")!.commits).toBe(99);
    expect(rebuilt.find((e) => e.date === "2027-01-11")!.commits).toBe(
      DEFAULT_INTENSITY.levels[1],
    );
  });

  it("preserves status of unlocked entries", () => {
    const grid = makeGrid("2027-01-01", "2027-01-05", 1);
    let s = buildSchedule("2027-01-01", "2027-01-05", grid, DEFAULT_INTENSITY);
    s = s.map((e) => (e.date === "2027-01-02" ? { ...e, status: "done" as const } : e));
    const rebuilt = buildSchedule("2027-01-01", "2027-01-05", grid, DEFAULT_INTENSITY, s);
    expect(rebuilt.find((e) => e.date === "2027-01-02")!.status).toBe("done");
  });
});

describe("randomizeCommits", () => {
  it("stays within jitter bounds and skips locked/empty days", () => {
    const grid = makeGrid("2027-01-01", "2027-03-31", 3);
    let s = buildSchedule("2027-01-01", "2027-03-31", grid, DEFAULT_INTENSITY);
    s = s.map((e, i) => (i === 0 ? { ...e, locked: true, commits: 7 } : e));
    const out = randomizeCommits(s, DEFAULT_INTENSITY);
    const base = DEFAULT_INTENSITY.levels[3];
    const lo = Math.round(base * (1 - DEFAULT_INTENSITY.jitter));
    const hi = Math.round(base * (1 + DEFAULT_INTENSITY.jitter));
    expect(out[0].commits).toBe(7); // locked untouched
    for (const e of out.slice(1)) {
      expect(e.commits).toBeGreaterThanOrEqual(lo);
      expect(e.commits).toBeLessThanOrEqual(hi);
    }
  });

  it("never yields 0 for a filled level", () => {
    const grid = makeGrid("2027-01-01", "2027-01-31", 1);
    const s = buildSchedule("2027-01-01", "2027-01-31", grid, {
      levels: [0, 1, 8, 15, 25],
      jitter: 1,
    });
    const out = randomizeCommits(s, { levels: [0, 1, 8, 15, 25], jitter: 1 }, () => 0);
    expect(out.every((e) => e.commits >= 1)).toBe(true);
  });
});

describe("computeStats", () => {
  it("computes totals and completion", () => {
    const grid = makeGrid("2027-01-01", "2027-01-10", 1);
    let schedule = buildSchedule("2027-01-01", "2027-01-10", grid, DEFAULT_INTENSITY);
    schedule = schedule.map((e, i) => (i < 5 ? { ...e, status: "done" as const } : e));
    const project: Project = {
      version: 1, id: "t", name: "t",
      startDate: "2027-01-01", endDate: "2027-01-10",
      grid, intensity: DEFAULT_INTENSITY, schedule,
      updatedAt: "",
    };
    const stats = computeStats(project);
    expect(stats.totalDays).toBe(10);
    expect(stats.filledCells).toBe(10);
    expect(stats.totalCommits).toBe(30);
    expect(stats.completedCommits).toBe(15);
    expect(stats.remainingCommits).toBe(15);
    expect(stats.completionPct).toBe(50);
    expect(stats.daysRemaining).toBe(5);
    expect(stats.maxPerDay).toBe(3);
  });
});
