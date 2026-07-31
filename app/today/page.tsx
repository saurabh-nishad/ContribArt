"use client";

import { useState } from "react";
import { format } from "date-fns";
import { useProjectStore } from "@/store/project-store";
import { useMounted } from "@/hooks/use-mounted";
import { formatDate, parseDate } from "@/lib/date-grid";
import { GITHUB_COLORS, LEVEL_NAMES } from "@/lib/types";
import { StatusBadge } from "@/components/planner-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Copy, SkipForward, Undo2 } from "lucide-react";

export default function TodayPage() {
  const mounted = useMounted();
  const project = useProjectStore((s) => s.project);
  const setDayStatus = useProjectStore((s) => s.setDayStatus);
  const [copied, setCopied] = useState(false);

  if (!mounted) return null;

  const today = formatDate(new Date());
  const entry = project.schedule.find((e) => e.date === today);

  if (!entry) {
    return (
      <div className="mx-auto max-w-xl space-y-4">
        <h1 className="text-2xl font-semibold">Today&apos;s task</h1>
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Today ({today}) is outside the project date range
            <br />
            {project.startDate} → {project.endDate}.
          </CardContent>
        </Card>
      </div>
    );
  }

  const gitCommand = [
    `# ${entry.commits} commit${entry.commits === 1 ? "" : "s"} for ${entry.date}`,
    `for i in $(seq 1 ${entry.commits}); do`,
    `  echo "${entry.date} commit $i" >> activity.log`,
    `  git add activity.log`,
    `  GIT_AUTHOR_DATE="${entry.date}T12:00:00" GIT_COMMITTER_DATE="${entry.date}T12:00:00" \\`,
    `    git commit -m "pattern: ${entry.date} ($i/${entry.commits})"`,
    `done`,
  ].join("\n");

  const copy = async () => {
    await navigator.clipboard.writeText(gitCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-2xl font-semibold">Today&apos;s task</h1>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            {format(parseDate(entry.date), "EEEE, MMMM d, yyyy")}
            <StatusBadge status={entry.status} />
          </CardTitle>
          <CardDescription>
            Week {entry.week + 1} · {project.name}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-muted-foreground">Pattern pixel</div>
              <div className="mt-1 flex items-center gap-2 text-lg font-medium">
                <span
                  className="inline-block size-4 rounded-[3px] border"
                  style={{ backgroundColor: GITHUB_COLORS[entry.level] }}
                />
                {LEVEL_NAMES[entry.level]}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">
                Today&apos;s commits
              </div>
              <div className="mt-1 text-3xl font-bold tabular-nums">
                {entry.commits}
              </div>
            </div>
          </div>

          {entry.commits > 0 && (
            <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs leading-5">
              {gitCommand}
            </pre>
          )}

          <div className="flex flex-wrap gap-2">
            {entry.commits > 0 && (
              <Button variant="outline" onClick={copy}>
                <Copy className="size-4" />
                {copied ? "Copied!" : "Copy git commands"}
              </Button>
            )}
            {entry.status === "pending" ? (
              <>
                <Button onClick={() => setDayStatus(entry.date, "done")}>
                  <Check className="size-4" />
                  Mark complete
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setDayStatus(entry.date, "skipped")}
                >
                  <SkipForward className="size-4" />
                  Skip today
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                onClick={() => setDayStatus(entry.date, "pending")}
              >
                <Undo2 className="size-4" />
                Reset to pending
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
