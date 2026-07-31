"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import {
  cellIndex,
  cellToDate,
  computeGridInfo,
  parseDate,
} from "@/lib/date-grid";
import type { DayStatus, Grid, Level } from "@/lib/types";
import { GITHUB_COLORS, GITHUB_COLORS_DARK } from "@/lib/types";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const CELL = 11;
const GAP = 4;
const STEP = CELL + GAP;
const LEFT = 30; // day labels
const TOP = 15; // month labels

export interface ContributionGraphProps {
  grid: Grid;
  startDate: string;
  endDate: string;
  /** commits per date for tooltips (optional) */
  commitsByDate?: Map<string, number>;
  statusByDate?: Map<string, DayStatus>;
  scale?: number;
  className?: string;
  /** paint callback — makes cells clickable (used by editor) */
  onCellClick?: (week: number, day: number) => void;
  onCellEnter?: (week: number, day: number, buttons: number) => void;
  showLabels?: boolean;
  interactive?: boolean;
}

export function ContributionGraph({
  grid,
  startDate,
  endDate,
  commitsByDate,
  statusByDate,
  scale = 1,
  className,
  onCellClick,
  onCellEnter,
  showLabels = true,
  interactive = true,
}: ContributionGraphProps) {
  const info = useMemo(
    () => computeGridInfo(startDate, endDate),
    [startDate, endDate],
  );
  const start = useMemo(() => parseDate(startDate), [startDate]);
  const end = useMemo(() => parseDate(endDate), [endDate]);

  const months = useMemo(() => {
    const out: { week: number; label: string }[] = [];
    let last = -1;
    for (let w = 0; w < grid.weeks; w++) {
      for (let d = 0; d < 7; d++) {
        const date = cellToDate(w, d, info.gridStart);
        if (date < start || date > end) continue;
        if (date.getDate() === 1 && date.getMonth() !== last) {
          out.push({ week: w, label: format(date, "MMM") });
          last = date.getMonth();
          break;
        }
      }
    }
    // Also label the very first column with its month if not already labeled.
    if (out.length === 0 || out[0].week > 1) {
      out.unshift({ week: 0, label: format(start, "MMM") });
    }
    return out;
  }, [grid.weeks, info.gridStart, start, end]);

  const left = showLabels ? LEFT : 0;
  const top = showLabels ? TOP : 0;
  const width = left + grid.weeks * STEP;
  const height = top + 7 * STEP;

  const cells = [];
  for (let w = 0; w < grid.weeks; w++) {
    for (let d = 0; d < 7; d++) {
      const date = cellToDate(w, d, info.gridStart);
      const inRange = date >= start && date <= end;
      const dateStr = format(date, "yyyy-MM-dd");
      const level = inRange ? ((grid.cells[cellIndex(w, d)] ?? 0) as Level) : 0;
      const commits = commitsByDate?.get(dateStr);
      const status = statusByDate?.get(dateStr);
      const rect = (
        <rect
          key={`${w}-${d}`}
          x={left + w * STEP}
          y={top + d * STEP}
          width={CELL}
          height={CELL}
          rx={2}
          className={cn(
            !inRange && "opacity-30",
            inRange && onCellClick && "cursor-crosshair",
          )}
          fill={`var(--gh-level-${level})`}
          stroke={
            status === "done"
              ? "var(--gh-done)"
              : status === "skipped"
                ? "var(--gh-skipped)"
                : "rgba(27,31,35,0.06)"
          }
          strokeWidth={status === "done" || status === "skipped" ? 1.5 : 1}
          onPointerDown={
            inRange && onCellClick ? () => onCellClick(w, d) : undefined
          }
          onPointerEnter={
            inRange && onCellEnter
              ? (e) => onCellEnter(w, d, e.buttons)
              : undefined
          }
        />
      );
      cells.push(
        inRange && interactive && !onCellClick ? (
          <Tooltip key={`t-${w}-${d}`}>
            <TooltipTrigger asChild>{rect}</TooltipTrigger>
            <TooltipContent>
              {commits !== undefined
                ? `${commits} contribution${commits === 1 ? "" : "s"} on ${format(date, "MMMM d, yyyy")}`
                : format(date, "MMMM d, yyyy")}
              {status && status !== "pending" ? ` — ${status}` : ""}
            </TooltipContent>
          </Tooltip>
        ) : (
          rect
        ),
      );
    }
  }

  return (
    <div className={cn("overflow-x-auto", className)}>
      <svg
        width={width * scale}
        height={height * scale}
        viewBox={`0 0 ${width} ${height}`}
        className="[--gh-level-0:#ebedf0] [--gh-level-1:#9be9a8] [--gh-level-2:#40c463] [--gh-level-3:#30a14e] [--gh-level-4:#216e39] dark:[--gh-level-0:#161b22] dark:[--gh-level-1:#0e4429] dark:[--gh-level-2:#006d32] dark:[--gh-level-3:#26a641] dark:[--gh-level-4:#39d353] [--gh-done:#1f6feb] [--gh-skipped:#d29922] select-none"
        style={{ touchAction: onCellClick ? "none" : undefined }}
      >
        {showLabels &&
          months.map((m) => (
            <text
              key={`${m.week}-${m.label}`}
              x={left + m.week * STEP}
              y={10}
              className="fill-muted-foreground"
              fontSize={9}
            >
              {m.label}
            </text>
          ))}
        {showLabels &&
          [
            { d: 1, label: "Mon" },
            { d: 3, label: "Wed" },
            { d: 5, label: "Fri" },
          ].map(({ d, label }) => (
            <text
              key={label}
              x={0}
              y={top + d * STEP + CELL - 2}
              className="fill-muted-foreground"
              fontSize={9}
            >
              {label}
            </text>
          ))}
        {cells}
      </svg>
    </div>
  );
}

/** Legend: Less → More */
export function GraphLegend({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center gap-1 text-xs text-muted-foreground",
        className,
      )}
    >
      <span className="mr-1">Less</span>
      {GITHUB_COLORS.map((c) => (
        <span
          key={c}
          className="inline-block size-[11px] rounded-[2px] dark:hidden"
          style={{ backgroundColor: c }}
        />
      ))}
      {GITHUB_COLORS_DARK.map((c) => (
        <span
          key={c}
          className="hidden size-[11px] rounded-[2px] dark:inline-block"
          style={{ backgroundColor: c }}
        />
      ))}
      <span className="ml-1">More</span>
    </div>
  );
}
