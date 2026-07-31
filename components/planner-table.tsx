"use client";

import { useState } from "react";
import { format } from "date-fns";
import { useProjectStore } from "@/store/project-store";
import { parseDate } from "@/lib/date-grid";
import { GITHUB_COLORS, LEVEL_NAMES } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Lock, LockOpen } from "lucide-react";
import { cn } from "@/lib/utils";

type Filter = "all" | "filled" | "pending" | "done" | "skipped";

export function PlannerTable() {
  const schedule = useProjectStore((s) => s.project.schedule);
  const setDayCommits = useProjectStore((s) => s.setDayCommits);
  const toggleLock = useProjectStore((s) => s.toggleLock);
  const [filter, setFilter] = useState<Filter>("all");

  const rows = schedule.filter((e) => {
    switch (filter) {
      case "filled":
        return e.level > 0;
      case "pending":
        return e.status === "pending" && e.commits > 0;
      case "done":
        return e.status === "done";
      case "skipped":
        return e.status === "skipped";
      default:
        return true;
    }
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Select value={filter} onValueChange={(v) => setFilter(v as Filter)}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All days</SelectItem>
            <SelectItem value="filled">Filled cells only</SelectItem>
            <SelectItem value="pending">Pending work</SelectItem>
            <SelectItem value="done">Completed</SelectItem>
            <SelectItem value="skipped">Skipped</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">{rows.length} days</span>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Day</TableHead>
              <TableHead className="text-right">Week</TableHead>
              <TableHead>Pixel</TableHead>
              <TableHead className="w-28">Commits</TableHead>
              <TableHead className="w-12">Lock</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((e) => (
              <TableRow
                key={e.date}
                className={cn(e.status === "done" && "opacity-60")}
              >
                <TableCell className="font-mono text-xs">{e.date}</TableCell>
                <TableCell>{format(parseDate(e.date), "EEE")}</TableCell>
                <TableCell className="text-right">{e.week + 1}</TableCell>
                <TableCell>
                  <span className="flex items-center gap-1.5">
                    <span
                      className="inline-block size-3 rounded-[2px] border"
                      style={{ backgroundColor: GITHUB_COLORS[e.level] }}
                    />
                    {LEVEL_NAMES[e.level]}
                  </span>
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min={0}
                    className="h-8 w-20"
                    value={e.commits}
                    disabled={e.locked}
                    onChange={(ev) => setDayCommits(e.date, Number(ev.target.value))}
                  />
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={() => toggleLock(e.date)}
                  >
                    {e.locked ? (
                      <Lock className="size-3.5" />
                    ) : (
                      <LockOpen className="size-3.5 text-muted-foreground/50" />
                    )}
                  </Button>
                </TableCell>
                <TableCell>
                  <StatusBadge status={e.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant={
        status === "done"
          ? "default"
          : status === "skipped"
            ? "secondary"
            : "outline"
      }
      className={cn(status === "done" && "bg-[#238636] text-white")}
    >
      {status}
    </Badge>
  );
}
