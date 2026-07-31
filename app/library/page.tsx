"use client";

import { useRouter } from "next/navigation";
import { useProjectStore } from "@/store/project-store";
import { useMounted } from "@/hooks/use-mounted";
import {
  TEMPLATES,
  templatePreviewWeeks,
  templateToGrid,
  templateWidth,
} from "@/lib/templates";
import { ContributionGraph } from "@/components/contribution-graph";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function LibraryPage() {
  const mounted = useMounted();
  const router = useRouter();
  const project = useProjectStore((s) => s.project);
  const applyGrid = useProjectStore((s) => s.applyGrid);

  if (!mounted) return null;

  const weeks = project.grid.weeks;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Pattern library</h1>
        <p className="text-sm text-muted-foreground">
          Built-in templates. Applying replaces the current grid (centered in
          your {weeks}-week range).
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {TEMPLATES.map((t) => {
          const previewWeeks = templatePreviewWeeks(t);
          const fits = templateWidth(t) <= weeks;
          return (
            <Card key={t.id}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-base">
                  {t.name}
                  <Badge variant="outline">
                    {t.kind === "text" ? "text" : "pixel art"}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ContributionGraph
                  grid={templateToGrid(t, previewWeeks)}
                  startDate="2027-01-03"
                  endDate="2027-12-31"
                  showLabels={false}
                  interactive={false}
                  scale={1.3}
                />
              </CardContent>
              <CardFooter className="gap-2">
                <Button
                  size="sm"
                  disabled={!fits}
                  onClick={() => {
                    applyGrid(templateToGrid(t, weeks));
                    router.push("/preview");
                  }}
                >
                  Use pattern
                </Button>
                {!fits && (
                  <span className="text-xs text-muted-foreground">
                    Needs {templateWidth(t)} weeks
                  </span>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
