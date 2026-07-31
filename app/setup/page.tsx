"use client";

import { useProjectStore } from "@/store/project-store";
import { useMounted } from "@/hooks/use-mounted";
import { DateRangeForm } from "@/components/date-range-form";
import { IntensityMapForm } from "@/components/intensity-map-form";
import { ContributionGraph, GraphLegend } from "@/components/contribution-graph";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { TextPatternForm } from "@/components/text-pattern-form";
import { ImageImportDialog } from "@/components/image-import-dialog";

export default function SetupPage() {
  const mounted = useMounted();
  const project = useProjectStore((s) => s.project);
  const setName = useProjectStore((s) => s.setName);

  if (!mounted) return null;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Setup</h1>
        <p className="text-sm text-muted-foreground">
          Choose your date range and commit intensity mapping.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-w-sm space-y-1.5">
            <Label htmlFor="project-name">Pattern name</Label>
            <Input
              id="project-name"
              value={project.name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Date range</CardTitle>
          <CardDescription>
            The grid is 7 rows (Sun–Sat) by one column per week, exactly like
            GitHub.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DateRangeForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contribution intensity</CardTitle>
          <CardDescription>
            Commits generated per pixel shade. Jitter randomizes counts to look
            organic.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <IntensityMapForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pattern</CardTitle>
          <CardDescription>
            Render text into the grid, import an image, pick a template from
            the library, or draw by hand in the editor.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <TextPatternForm />
          <div className="flex gap-2 border-t pt-4">
            <ImageImportDialog />
            <Button variant="outline" asChild>
              <Link href="/library">Browse library</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/editor">Open editor</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current grid</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ContributionGraph
            grid={project.grid}
            startDate={project.startDate}
            endDate={project.endDate}
          />
          <GraphLegend />
        </CardContent>
      </Card>
    </div>
  );
}
