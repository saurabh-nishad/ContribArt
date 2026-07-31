"use client";

import { useState } from "react";
import { useProjectStore } from "@/store/project-store";
import { computeGridInfo } from "@/lib/date-grid";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function DateRangeForm() {
  const project = useProjectStore((s) => s.project);
  const setDateRange = useProjectStore((s) => s.setDateRange);
  const [start, setStart] = useState(project.startDate);
  const [end, setEnd] = useState(project.endDate);

  const valid = start && end && start <= end;
  const info = valid ? computeGridInfo(start, end) : null;
  const dirty = start !== project.startDate || end !== project.endDate;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="start-date">Start date</Label>
          <Input
            id="start-date"
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="end-date">End date</Label>
          <Input
            id="end-date"
            type="date"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
          />
        </div>
      </div>
      {info && (
        <p className="text-sm text-muted-foreground">
          {info.totalDays} days · {info.weeks} week columns · 7 rows
        </p>
      )}
      {!valid && (
        <p className="text-sm text-destructive">
          Start date must be on or before end date.
        </p>
      )}
      {dirty && (
        <Button
          size="sm"
          disabled={!valid}
          onClick={() => setDateRange(start, end)}
        >
          Apply date range
        </Button>
      )}
    </div>
  );
}
