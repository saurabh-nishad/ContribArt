"use client";

import { useMemo, useState } from "react";
import { useProjectStore } from "@/store/project-store";
import { useMounted } from "@/hooks/use-mounted";
import { ContributionGraph, GraphLegend } from "@/components/contribution-graph";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut } from "lucide-react";

export default function PreviewPage() {
  const mounted = useMounted();
  const project = useProjectStore((s) => s.project);
  const [scale, setScale] = useState(1);

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
          <h1 className="text-2xl font-semibold">Preview</h1>
          <p className="text-sm text-muted-foreground">
            Exactly how your graph will look on GitHub. Hover any day to
            inspect it.
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setScale((s) => Math.max(0.5, s - 0.25))}
          >
            <ZoomOut className="size-4" />
          </Button>
          <span className="w-12 text-center text-sm text-muted-foreground">
            {Math.round(scale * 100)}%
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setScale((s) => Math.min(4, s + 0.25))}
          >
            <ZoomIn className="size-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {project.name} · {project.startDate} → {project.endDate}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ContributionGraph
            grid={project.grid}
            startDate={project.startDate}
            endDate={project.endDate}
            commitsByDate={commitsByDate}
            statusByDate={statusByDate}
            scale={scale}
          />
          <GraphLegend />
        </CardContent>
      </Card>
    </div>
  );
}
