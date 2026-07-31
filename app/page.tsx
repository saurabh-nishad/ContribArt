"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useProjectStore } from "@/store/project-store";
import { useMounted } from "@/hooks/use-mounted";
import { computeStats } from "@/lib/schedule";
import { ContributionGraph, GraphLegend } from "@/components/contribution-graph";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-2xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}

export default function DashboardPage() {
  const mounted = useMounted();
  const project = useProjectStore((s) => s.project);
  const stats = useMemo(() => computeStats(project), [project]);

  const commitsByDate = useMemo(
    () => new Map(project.schedule.map((e) => [e.date, e.commits])),
    [project.schedule],
  );
  const statusByDate = useMemo(
    () => new Map(project.schedule.map((e) => [e.date, e.status])),
    [project.schedule],
  );

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{project.name}</h1>
          <p className="text-sm text-muted-foreground">
            {project.startDate} → {project.endDate} · {project.grid.weeks} weeks
            · {stats.totalDays} days
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/setup">Setup</Link>
          </Button>
          <Button asChild>
            <Link href="/today">Today&apos;s task</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-4 space-y-3">
          <ContributionGraph
            grid={project.grid}
            startDate={project.startDate}
            endDate={project.endDate}
            commitsByDate={commitsByDate}
            statusByDate={statusByDate}
          />
          <GraphLegend />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Progress</CardTitle>
            <CardDescription>
              {stats.completionPct.toFixed(0)}% of active days completed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={stats.completionPct} />
            <div className="grid grid-cols-3 gap-3">
              <Stat label="Days remaining" value={stats.daysRemaining} />
              <Stat
                label="Commits remaining"
                value={stats.remainingCommits.toLocaleString()}
              />
              <Stat
                label="Commits done"
                value={stats.completedCommits.toLocaleString()}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Statistics</CardTitle>
            <CardDescription>
              {stats.filledCells} of {stats.totalDays} cells filled (
              {stats.contributionPct.toFixed(0)}%)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              <Stat
                label="Total commits"
                value={stats.totalCommits.toLocaleString()}
              />
              <Stat label="Avg / day" value={stats.avgPerDay.toFixed(1)} />
              <Stat label="Max / day" value={stats.maxPerDay} />
              <Stat label="Done days" value={stats.doneDays} />
              <Stat label="Skipped days" value={stats.skippedDays} />
              <Stat label="Pending days" value={stats.pendingDays} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
