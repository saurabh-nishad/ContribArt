"use client";

import { useCallback, useEffect, useRef } from "react";
import { useStore } from "zustand";
import { useRouter } from "next/navigation";
import { useProjectStore } from "@/store/project-store";
import { useEditorStore, type Tool } from "@/store/editor-store";
import { useMounted } from "@/hooks/use-mounted";
import { ContributionGraph, GraphLegend } from "@/components/contribution-graph";
import { ImageImportDialog } from "@/components/image-import-dialog";
import { InsertPatternDialog } from "@/components/insert-pattern-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { GITHUB_COLORS, LEVEL_NAMES, type Grid, type Level } from "@/lib/types";
import { downloadText } from "@/lib/exporters/download";
import {
  Paintbrush,
  Eraser,
  Square,
  PaintBucket,
  FlipHorizontal2,
  FlipVertical2,
  RotateCw,
  Trash2,
  Undo2,
  Redo2,
  FileDown,
  FileUp,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TOOLS: { id: Tool; label: string; icon: typeof Paintbrush }[] = [
  { id: "paint", label: "Paint", icon: Paintbrush },
  { id: "erase", label: "Erase", icon: Eraser },
  { id: "rect", label: "Rectangle", icon: Square },
  { id: "fill", label: "Fill", icon: PaintBucket },
];

export default function EditorPage() {
  const mounted = useMounted();
  const router = useRouter();
  const project = useProjectStore((s) => s.project);
  const applyGrid = useProjectStore((s) => s.applyGrid);

  const editor = useEditorStore();
  const temporal = useStore(useEditorStore.temporal);
  const fileRef = useRef<HTMLInputElement>(null);
  const loadedFor = useRef<string | null>(null);

  // Load the project grid into the editor once per visit / date-range change.
  useEffect(() => {
    if (!mounted) return;
    const key = `${project.startDate}|${project.endDate}`;
    if (loadedFor.current === key) return;
    loadedFor.current = key;
    editor.setGrid(project.grid);
    useEditorStore.temporal.getState().clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, project.startDate, project.endDate]);

  // Keyboard undo/redo.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      if (e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) temporal.redo();
        else temporal.undo();
      } else if (e.key.toLowerCase() === "y") {
        e.preventDefault();
        temporal.redo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [temporal]);

  // Group drag strokes into one undo step: first paint is tracked, the rest
  // of the stroke is painted with tracking paused; resume on pointerup.
  useEffect(() => {
    const onUp = () => useEditorStore.temporal.getState().resume();
    window.addEventListener("pointerup", onUp);
    return () => window.removeEventListener("pointerup", onUp);
  }, []);

  const onCellDown = useCallback(
    (week: number, day: number) => {
      const { tool } = useEditorStore.getState();
      if (tool === "fill") {
        editor.fill(week, day);
      } else if (tool === "rect") {
        editor.setAnchor({ week, day });
      } else {
        editor.paint(week, day);
        useEditorStore.temporal.getState().pause();
      }
    },
    [editor],
  );

  const onCellEnter = useCallback(
    (week: number, day: number, buttons: number) => {
      if (!(buttons & 1)) return;
      const { tool } = useEditorStore.getState();
      if (tool === "paint" || tool === "erase") {
        editor.paint(week, day);
      }
    },
    [editor],
  );

  const onCellUp = useCallback(
    (week: number, day: number) => {
      const { tool, anchor } = useEditorStore.getState();
      if (tool === "rect" && anchor) editor.applyRect(week, day);
    },
    [editor],
  );

  const exportJson = () => {
    downloadText(
      JSON.stringify({ weeks: editor.grid.weeks, cells: editor.grid.cells }),
      `${project.name.replace(/\s+/g, "-").toLowerCase()}-pattern.json`,
      "application/json",
    );
  };

  const importJson = async (file: File | undefined) => {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as Grid;
      if (
        typeof parsed.weeks !== "number" ||
        !Array.isArray(parsed.cells) ||
        parsed.cells.some((c) => typeof c !== "number" || c < 0 || c > 4)
      ) {
        throw new Error("bad shape");
      }
      // Refit into current weeks.
      const weeks = editor.grid.weeks;
      const cells = new Array<Level>(weeks * 7).fill(0);
      for (let w = 0; w < Math.min(weeks, parsed.weeks); w++) {
        for (let d = 0; d < 7; d++) {
          cells[w * 7 + d] = (parsed.cells[w * 7 + d] ?? 0) as Level;
        }
      }
      editor.setGrid({ weeks, cells });
    } catch {
      alert("Invalid pattern file.");
    }
  };

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Pattern editor</h1>
          <p className="text-sm text-muted-foreground">
            7 rows × {editor.grid.weeks} weeks. Click and drag to draw.
          </p>
        </div>
        <Button
          onClick={() => {
            applyGrid(editor.grid);
            router.push("/preview");
          }}
        >
          <Check className="size-4" />
          Apply to project
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="sr-only">Tools</CardTitle>
          <div className="flex flex-wrap items-center gap-1.5">
            {TOOLS.map(({ id, label, icon: Icon }) => (
              <Tooltip key={id}>
                <TooltipTrigger asChild>
                  <Button
                    variant={editor.tool === id ? "default" : "outline"}
                    size="icon"
                    onClick={() => editor.setTool(id)}
                  >
                    <Icon className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{label}</TooltipContent>
              </Tooltip>
            ))}

            <Separator orientation="vertical" className="mx-1 h-6" />

            {([0, 1, 2, 3, 4] as Level[]).map((l) => (
              <Tooltip key={l}>
                <TooltipTrigger asChild>
                  <button
                    aria-label={LEVEL_NAMES[l]}
                    className={cn(
                      "size-7 rounded-md border-2",
                      editor.brushLevel === l && editor.tool !== "erase"
                        ? "border-foreground"
                        : "border-transparent",
                    )}
                    style={{ backgroundColor: GITHUB_COLORS[l] }}
                    onClick={() => {
                      editor.setBrushLevel(l);
                      if (editor.tool === "erase") editor.setTool("paint");
                    }}
                  />
                </TooltipTrigger>
                <TooltipContent>{LEVEL_NAMES[l]}</TooltipContent>
              </Tooltip>
            ))}

            <Separator orientation="vertical" className="mx-1 h-6" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={editor.mirrorHorizontal}>
                  <FlipHorizontal2 className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Mirror left↔right</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={editor.mirrorVertical}>
                  <FlipVertical2 className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Mirror top↕bottom</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={editor.rotate}>
                  <RotateCw className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Rotate 180°</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={editor.clear}>
                  <Trash2 className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Clear grid</TooltipContent>
            </Tooltip>

            <Separator orientation="vertical" className="mx-1 h-6" />

            <Button
              variant="outline"
              size="icon"
              disabled={temporal.pastStates.length === 0}
              onClick={() => temporal.undo()}
            >
              <Undo2 className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={temporal.futureStates.length === 0}
              onClick={() => temporal.redo()}
            >
              <Redo2 className="size-4" />
            </Button>

            <Separator orientation="vertical" className="mx-1 h-6" />

            <ImageImportDialog onApply={(g) => editor.setGrid(g)} />
            <InsertPatternDialog />
            <Button variant="outline" onClick={exportJson}>
              <FileDown className="size-4" />
              Export JSON
            </Button>
            <Button variant="outline" onClick={() => fileRef.current?.click()}>
              <FileUp className="size-4" />
              Import JSON
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                importJson(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <EditorCanvas
            onCellDown={onCellDown}
            onCellEnter={onCellEnter}
            onCellUp={onCellUp}
          />
          <GraphLegend className="mt-3" />
        </CardContent>
      </Card>
    </div>
  );
}

function EditorCanvas({
  onCellDown,
  onCellEnter,
  onCellUp,
}: {
  onCellDown: (w: number, d: number) => void;
  onCellEnter: (w: number, d: number, buttons: number) => void;
  onCellUp: (w: number, d: number) => void;
}) {
  const grid = useEditorStore((s) => s.grid);
  const project = useProjectStore((s) => s.project);
  const lastCell = useRef<{ week: number; day: number } | null>(null);

  return (
    <div
      onPointerUp={() => {
        if (lastCell.current) onCellUp(lastCell.current.week, lastCell.current.day);
      }}
    >
      <ContributionGraph
        grid={grid}
        startDate={project.startDate}
        endDate={project.endDate}
        onCellClick={(w, d) => {
          lastCell.current = { week: w, day: d };
          onCellDown(w, d);
        }}
        onCellEnter={(w, d, buttons) => {
          lastCell.current = { week: w, day: d };
          onCellEnter(w, d, buttons);
        }}
        scale={1.4}
      />
    </div>
  );
}
