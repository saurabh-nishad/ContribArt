import { describe, expect, it } from "vitest";
import {
  computeGridInfo,
  dateToCell,
  cellToDate,
  enumerateDates,
  formatDate,
  isCellInRange,
  monthLabels,
  parseDate,
} from "@/lib/date-grid";

describe("computeGridInfo", () => {
  it("handles a full year starting on a Friday (2027)", () => {
    // 2027-01-01 is a Friday; 2027-12-31 is a Friday.
    const info = computeGridInfo("2027-01-01", "2027-12-31");
    expect(info.totalDays).toBe(365);
    expect(formatDate(info.gridStart)).toBe("2026-12-27"); // Sunday
    expect(formatDate(info.gridEnd)).toBe("2028-01-01"); // Saturday
    expect(info.weeks).toBe(53);
  });

  it("range starting on Sunday needs no leading pad", () => {
    // 2026-01-04 is a Sunday.
    const info = computeGridInfo("2026-01-04", "2026-01-31");
    expect(formatDate(info.gridStart)).toBe("2026-01-04");
    expect(info.weeks).toBe(4);
    expect(info.totalDays).toBe(28);
  });

  it("single-day range yields one week", () => {
    const info = computeGridInfo("2026-07-15", "2026-07-15");
    expect(info.weeks).toBe(1);
    expect(info.totalDays).toBe(1);
  });
});

describe("dateToCell / cellToDate", () => {
  const info = computeGridInfo("2027-01-01", "2027-12-31");

  it("maps startDate to its weekday cell in week 0", () => {
    const cell = dateToCell(parseDate("2027-01-01"), info.gridStart);
    expect(cell).toEqual({ week: 0, day: 5 }); // Friday
  });

  it("round-trips", () => {
    const d = parseDate("2027-06-15");
    const { week, day } = dateToCell(d, info.gridStart);
    expect(formatDate(cellToDate(week, day, info.gridStart))).toBe("2027-06-15");
  });

  it("survives DST transition dates (US: 2027-03-14)", () => {
    const before = dateToCell(parseDate("2027-03-13"), info.gridStart);
    const after = dateToCell(parseDate("2027-03-14"), info.gridStart);
    expect(after.week).toBe(before.week + 1);
    expect(after.day).toBe(0);
  });
});

describe("isCellInRange", () => {
  it("excludes leading pad cells", () => {
    // 2027-01-01 = Friday → Sun–Thu of week 0 are out of range.
    expect(isCellInRange(0, 0, "2027-01-01", "2027-12-31")).toBe(false);
    expect(isCellInRange(0, 4, "2027-01-01", "2027-12-31")).toBe(false);
    expect(isCellInRange(0, 5, "2027-01-01", "2027-12-31")).toBe(true);
  });
});

describe("enumerateDates", () => {
  it("covers every day exactly once, in order", () => {
    const days = enumerateDates("2027-02-25", "2027-03-05");
    expect(days).toHaveLength(9);
    expect(days[0].date).toBe("2027-02-25");
    expect(days.at(-1)!.date).toBe("2027-03-05");
  });
});

describe("monthLabels", () => {
  it("labels each month once for a full year", () => {
    const labels = monthLabels("2027-01-01", "2027-12-31");
    expect(labels.map((l) => l.label)).toEqual([
      "Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec",
    ]);
  });
});
