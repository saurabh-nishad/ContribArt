"use client";

import { useProjectStore } from "@/store/project-store";
import { useMounted } from "@/hooks/use-mounted";
import { PlannerTable } from "@/components/planner-table";
import { Button } from "@/components/ui/button";
import { Shuffle } from "lucide-react";

export default function PlannerPage() {
  const mounted = useMounted();
  const randomize = useProjectStore((s) => s.randomize);

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Commit planner</h1>
          <p className="text-sm text-muted-foreground">
            Edit commit counts per day. Locked days survive pattern and
            intensity changes.
          </p>
        </div>
        <Button variant="outline" onClick={randomize}>
          <Shuffle className="size-4" />
          Randomize commits
        </Button>
      </div>
      <PlannerTable />
    </div>
  );
}
