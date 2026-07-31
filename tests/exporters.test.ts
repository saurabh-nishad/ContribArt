import { describe, expect, it } from "vitest";
import { toCsv, toJson, toMarkdown } from "@/lib/exporters";
import { generateSh, scheduleData } from "@/lib/scripts/generate-sh";
import { generatePy } from "@/lib/scripts/generate-py";
import { buildSchedule } from "@/lib/schedule";
import { computeGridInfo } from "@/lib/date-grid";
import { DEFAULT_INTENSITY, type Level, type Project } from "@/lib/types";

function makeProject(): Project {
  const startDate = "2027-01-01";
  const endDate = "2027-01-10";
  const { weeks } = computeGridInfo(startDate, endDate);
  const cells = new Array<Level>(weeks * 7).fill(0);
  cells[5] = 2; // 2027-01-01 is Friday of week 0 → index 5
  const grid = { weeks, cells };
  let schedule = buildSchedule(startDate, endDate, grid, DEFAULT_INTENSITY);
  schedule = schedule.map((e) =>
    e.date === "2027-01-02" ? { ...e, commits: 5, status: "done" as const } : e,
  );
  return {
    version: 1,
    id: "t",
    name: 'My "Pattern", v1',
    startDate,
    endDate,
    grid,
    intensity: DEFAULT_INTENSITY,
    schedule,
    updatedAt: "",
  };
}

describe("toCsv", () => {
  it("emits header + one row per day", () => {
    const csv = toCsv(makeProject());
    const lines = csv.trim().split("\n");
    expect(lines).toHaveLength(11);
    expect(lines[0]).toBe(
      "date,day_of_week,week,level,level_name,commits,locked,status",
    );
    expect(lines[1]).toContain("2027-01-01");
    expect(lines[1]).toContain("Medium");
    expect(lines[1]).toContain("8"); // level 2 default commits
  });

  it("excel variant has BOM and CRLF", () => {
    const csv = toCsv(makeProject(), { excel: true });
    expect(csv.startsWith("\ufeff")).toBe(true);
    expect(csv).toContain("\r\n");
  });
});

describe("toJson", () => {
  it("round-trips the schedule", () => {
    const parsed = JSON.parse(toJson(makeProject()));
    expect(parsed.schedule).toHaveLength(10);
    // Fri 2027-01-01 → Sun 2027-01-10 spans 3 week columns.
    expect(parsed.grid.weeks).toBe(3);
  });
});

describe("toMarkdown", () => {
  it("renders a table with all days", () => {
    const md = toMarkdown(makeProject());
    expect(md).toContain("| Date | Day | Week | Pixel | Commits | Status |");
    expect(md.match(/\| 2027-01-\d\d \|/g)).toHaveLength(10);
  });
});

describe("script generation", () => {
  it("scheduleData excludes done days and empty days", () => {
    const data = scheduleData(makeProject());
    // Only 2027-01-01 has commits (level 2) and is pending; 01-02 is done.
    expect(data).toEqual([["2027-01-01", 8]]);
  });

  it("generate.sh embeds dates and env vars with LF endings", () => {
    const sh = generateSh(makeProject());
    expect(sh).toContain("2027-01-01 8");
    expect(sh).toContain("GIT_AUTHOR_DATE");
    expect(sh).toContain("GIT_COMMITTER_DATE");
    expect(sh).not.toContain("\r\n");
    expect(sh.startsWith("#!/usr/bin/env bash")).toBe(true);
  });

  it("generate.py embeds the schedule tuple list", () => {
    const py = generatePy(makeProject());
    expect(py).toContain('("2027-01-01", 8),');
    expect(py).toContain("GIT_AUTHOR_DATE");
    expect(py.startsWith("#!/usr/bin/env python3")).toBe(true);
  });
});
