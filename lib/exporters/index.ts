import type { Project, ScheduleEntry } from "@/lib/types";
import { LEVEL_NAMES } from "@/lib/types";

function csvEscape(v: string): string {
  return /[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

const HEADER = ["date", "day_of_week", "week", "level", "level_name", "commits", "locked", "status"];

function entryRow(e: ScheduleEntry): string[] {
  return [
    e.date,
    String(e.dayOfWeek),
    String(e.week + 1),
    String(e.level),
    LEVEL_NAMES[e.level],
    String(e.commits),
    String(e.locked),
    e.status,
  ];
}

export function toCsv(project: Project, opts?: { excel?: boolean }): string {
  const eol = opts?.excel ? "\r\n" : "\n";
  const lines = [
    HEADER.join(","),
    ...project.schedule.map((e) => entryRow(e).map(csvEscape).join(",")),
  ].join(eol);
  // UTF-8 BOM so Excel detects encoding.
  return (opts?.excel ? "\ufeff" : "") + lines + eol;
}

export function toJson(project: Project): string {
  return JSON.stringify(
    {
      name: project.name,
      startDate: project.startDate,
      endDate: project.endDate,
      intensity: project.intensity,
      grid: project.grid,
      schedule: project.schedule,
    },
    null,
    2,
  );
}

export function toMarkdown(project: Project): string {
  const lines = [
    `# ${project.name}`,
    "",
    `${project.startDate} → ${project.endDate} · ${project.grid.weeks} weeks`,
    "",
    "| Date | Day | Week | Pixel | Commits | Status |",
    "|------|-----|------|-------|---------|--------|",
    ...project.schedule.map(
      (e) =>
        `| ${e.date} | ${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][e.dayOfWeek]} | ${e.week + 1} | ${LEVEL_NAMES[e.level]} | ${e.commits} | ${e.status} |`,
    ),
  ];
  return lines.join("\n") + "\n";
}
