"use client";

import { useState } from "react";
import { useProjectStore } from "@/store/project-store";
import { renderTextGrid, textWidth, isRenderable } from "@/lib/pixel-font";
import type { Level } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ContributionGraph } from "@/components/contribution-graph";
import { LEVEL_NAMES } from "@/lib/types";

export function TextPatternForm() {
  const project = useProjectStore((s) => s.project);
  const applyGrid = useProjectStore((s) => s.applyGrid);
  const [text, setText] = useState("SN-007");
  const [level, setLevel] = useState<Level>(4);

  const weeks = project.grid.weeks;
  const width = textWidth(text);
  const fits = width <= weeks;
  const unsupported = [...text].filter((c) => !isRenderable(c));
  const preview = renderTextGrid(text, { weeks, level });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="pattern-text">Text</Label>
          <Input
            id="pattern-text"
            className="w-56"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="SN-007"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Shade</Label>
          <Select
            value={String(level)}
            onValueChange={(v) => setLevel(Number(v) as Level)}
          >
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4].map((l) => (
                <SelectItem key={l} value={String(l)}>
                  {LEVEL_NAMES[l]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button disabled={!text || !fits} onClick={() => applyGrid(preview)}>
          Apply to grid
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        {width} of {weeks} columns used.
        {!fits && " Text is too wide for the selected date range."}
        {unsupported.length > 0 &&
          ` Unsupported characters ignored: ${[...new Set(unsupported)].join(" ")}`}
      </p>
      {text && (
        <ContributionGraph
          grid={preview}
          startDate={project.startDate}
          endDate={project.endDate}
          showLabels={false}
          interactive={false}
        />
      )}
    </div>
  );
}
