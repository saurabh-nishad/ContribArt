"use client";

import { useMemo, useState } from "react";
import {
  addMonths,
  endOfMonth,
  format,
  getDay,
  getDaysInMonth,
  startOfMonth,
} from "date-fns";
import { useProjectStore } from "@/store/project-store";
import { useMounted } from "@/hooks/use-mounted";
import { formatDate, parseDate } from "@/lib/date-grid";
import { GITHUB_COLORS } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarPage() {
  const mounted = useMounted();
  const project = useProjectStore((s) => s.project);
  const setDayStatus = useProjectStore((s) => s.setDayStatus);
  const [month, setMonth] = useState(() => startOfMonth(new Date()));

  const byDate = useMemo(
    () => new Map(project.schedule.map((e) => [e.date, e])),
    [project.schedule],
  );

  if (!mounted) return null;

  const rangeStart = startOfMonth(parseDate(project.startDate));
  const rangeEnd = endOfMonth(parseDate(project.endDate));
  const firstDay = getDay(month);
  const daysInMonth = getDaysInMonth(month);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Calendar</h1>
          <p className="text-sm text-muted-foreground">
            Click a day to cycle pending → done → skipped.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            disabled={month <= rangeStart}
            onClick={() => setMonth((m) => addMonths(m, -1))}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="w-36 text-center font-medium">
            {format(month, "MMMM yyyy")}
          </span>
          <Button
            variant="outline"
            size="icon"
            disabled={addMonths(month, 1) > rangeEnd}
            onClick={() => setMonth((m) => addMonths(m, 1))}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-4">
          <div className="grid grid-cols-7 gap-1.5">
            {WEEKDAYS.map((d) => (
              <div
                key={d}
                className="pb-1 text-center text-xs font-medium text-muted-foreground"
              >
                {d}
              </div>
            ))}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`pad-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const date = new Date(month.getFullYear(), month.getMonth(), i + 1);
              const key = formatDate(date);
              const entry = byDate.get(key);
              return (
                <button
                  key={key}
                  disabled={!entry}
                  onClick={() => {
                    if (!entry) return;
                    const next =
                      entry.status === "pending"
                        ? "done"
                        : entry.status === "done"
                          ? "skipped"
                          : "pending";
                    setDayStatus(key, next);
                  }}
                  className={cn(
                    "flex aspect-square flex-col items-center justify-center rounded-md border p-1 text-center transition-colors",
                    !entry && "opacity-30",
                    entry && "hover:bg-accent",
                    entry?.status === "done" &&
                      "border-[#238636] bg-[#238636]/10",
                    entry?.status === "skipped" &&
                      "border-amber-500 bg-amber-500/10",
                  )}
                >
                  <span className="text-xs text-muted-foreground">{i + 1}</span>
                  {entry && (
                    <>
                      <span className="flex items-center gap-1 text-sm font-semibold tabular-nums">
                        <span
                          className="inline-block size-2 rounded-[2px]"
                          style={{ backgroundColor: GITHUB_COLORS[entry.level] }}
                        />
                        {entry.commits}
                      </span>
                      <span className="text-[10px] capitalize text-muted-foreground">
                        {entry.status}
                      </span>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
