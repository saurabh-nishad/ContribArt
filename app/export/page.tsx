"use client";

import { useMemo } from "react";
import { useProjectStore } from "@/store/project-store";
import { useMounted } from "@/hooks/use-mounted";
import { toCsv, toJson, toMarkdown } from "@/lib/exporters";
import { downloadText } from "@/lib/exporters/download";
import { generateSh } from "@/lib/scripts/generate-sh";
import { generatePy } from "@/lib/scripts/generate-py";
import { scheduleData } from "@/lib/scripts/generate-sh";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileDown, FileTerminal } from "lucide-react";

export default function ExportPage() {
  const mounted = useMounted();
  const project = useProjectStore((s) => s.project);

  const slug = useMemo(
    () => project.name.replace(/\s+/g, "-").toLowerCase() || "pattern",
    [project.name],
  );
  const pending = useMemo(() => scheduleData(project), [project]);
  const pendingCommits = pending.reduce((s, [, c]) => s + c, 0);

  if (!mounted) return null;

  const exports = [
    {
      label: "CSV",
      desc: "Comma-separated schedule for spreadsheets and scripts.",
      action: () => downloadText(toCsv(project), `${slug}.csv`, "text/csv"),
    },
    {
      label: "Excel CSV",
      desc: "CSV with BOM + CRLF — opens cleanly in Excel.",
      action: () =>
        downloadText(toCsv(project, { excel: true }), `${slug}-excel.csv`, "text/csv"),
    },
    {
      label: "JSON",
      desc: "Full project: dates, grid, intensity map, schedule.",
      action: () => downloadText(toJson(project), `${slug}.json`, "application/json"),
    },
    {
      label: "Markdown",
      desc: "Schedule as a Markdown table.",
      action: () => downloadText(toMarkdown(project), `${slug}.md`, "text/markdown"),
    },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Export</h1>
        <p className="text-sm text-muted-foreground">
          Download the schedule or a ready-to-run git automation script.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Schedule data</CardTitle>
          <CardDescription>
            {project.schedule.length} days · {project.startDate} →{" "}
            {project.endDate}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {exports.map((e) => (
            <div
              key={e.label}
              className="flex items-center justify-between rounded-md border p-3"
            >
              <div>
                <div className="text-sm font-medium">{e.label}</div>
                <div className="text-xs text-muted-foreground">{e.desc}</div>
              </div>
              <Button variant="outline" size="icon" onClick={e.action}>
                <FileDown className="size-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Git automation scripts</CardTitle>
          <CardDescription>
            {pending.length} pending days · {pendingCommits.toLocaleString()}{" "}
            commits. Run inside a dedicated repo, then push it to GitHub.
            Completed days are excluded.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button
            onClick={() =>
              downloadText(generateSh(project), "generate.sh", "text/x-shellscript")
            }
          >
            <FileTerminal className="size-4" />
            generate.sh
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              downloadText(generatePy(project), "generate.py", "text/x-python")
            }
          >
            <FileTerminal className="size-4" />
            generate.py
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
