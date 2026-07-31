import {
  addDays,
  differenceInCalendarDays,
  format,
  getDay,
  parse,
  startOfWeek,
  endOfWeek,
} from "date-fns";

export const DATE_FMT = "yyyy-MM-dd";

/** Parse a 'yyyy-MM-dd' string as a local date (never new Date(string) — UTC shift). */
export function parseDate(s: string): Date {
  return parse(s, DATE_FMT, new Date());
}

export function formatDate(d: Date): string {
  return format(d, DATE_FMT);
}

export interface GridInfo {
  /** Sunday on or before startDate. */
  gridStart: Date;
  /** Saturday on or after endDate. */
  gridEnd: Date;
  weeks: number;
  totalDays: number;
}

export function computeGridInfo(startDate: string, endDate: string): GridInfo {
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  const gridStart = startOfWeek(start, { weekStartsOn: 0 });
  const gridEnd = endOfWeek(end, { weekStartsOn: 0 });
  const weeks = (differenceInCalendarDays(gridEnd, gridStart) + 1) / 7;
  return {
    gridStart,
    gridEnd,
    weeks,
    totalDays: differenceInCalendarDays(end, start) + 1,
  };
}

export function dateToCell(date: Date, gridStart: Date): { week: number; day: number } {
  const diff = differenceInCalendarDays(date, gridStart);
  return { week: Math.floor(diff / 7), day: getDay(date) };
}

export function cellToDate(week: number, day: number, gridStart: Date): Date {
  return addDays(gridStart, week * 7 + day);
}

export function cellIndex(week: number, day: number): number {
  return week * 7 + day;
}

/** Is the cell's date within [startDate, endDate]? */
export function isCellInRange(
  week: number,
  day: number,
  startDate: string,
  endDate: string,
): boolean {
  const info = computeGridInfo(startDate, endDate);
  const d = cellToDate(week, day, info.gridStart);
  return (
    differenceInCalendarDays(d, parseDate(startDate)) >= 0 &&
    differenceInCalendarDays(parseDate(endDate), d) >= 0
  );
}

/** All in-range dates in chronological order with their cell coordinates. */
export function enumerateDates(
  startDate: string,
  endDate: string,
): { date: string; week: number; day: number }[] {
  const { gridStart, totalDays } = computeGridInfo(startDate, endDate);
  const start = parseDate(startDate);
  const out: { date: string; week: number; day: number }[] = [];
  for (let i = 0; i < totalDays; i++) {
    const d = addDays(start, i);
    const { week, day } = dateToCell(d, gridStart);
    out.push({ date: formatDate(d), week, day });
  }
  return out;
}

/**
 * Month labels for the graph header: label a week column when it contains
 * the 1st of a month (GitHub convention).
 */
export function monthLabels(
  startDate: string,
  endDate: string,
): { week: number; label: string }[] {
  const { gridStart, weeks } = computeGridInfo(startDate, endDate);
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  const labels: { week: number; label: string }[] = [];
  let lastMonth = -1;
  for (let w = 0; w < weeks; w++) {
    for (let day = 0; day < 7; day++) {
      const d = cellToDate(w, day, gridStart);
      if (d < start || d > end) continue;
      if (d.getDate() === 1 && d.getMonth() !== lastMonth) {
        labels.push({ week: w, label: format(d, "MMM") });
        lastMonth = d.getMonth();
        break;
      }
    }
  }
  return labels;
}
