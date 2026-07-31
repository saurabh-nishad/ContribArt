"use client";

import { useMemo, useState } from "react";
import { useEditorStore } from "@/store/editor-store";
import { useProjectStore } from "@/store/project-store";
import { renderTextGrid, textWidth, isRenderable } from "@/lib/pixel-font";
import { TEMPLATES, templateToGrid, templateWidth } from "@/lib/templates";
import { stampGrid } from "@/lib/grid-ops";
import type { Grid, Level } from "@/lib/types";
import { LEVEL_NAMES } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContributionGraph } from "@/components/contribution-graph";
import { Layers } from "lucide-react";

const ART_TEMPLATES = TEMPLATES.filter((t) => t.kind === "art");

export function InsertPatternDialog() {
  const editor = useEditorStore();
  const project = useProjectStore((s) => s.project);
  const [open, setOpen] = useState(false);
  const [source, setSource] = useState<"text" | "template">("text");
  const [text, setText] = useState("HI");
  const [level, setLevel] = useState<Level>(4);
  const [templateId, setTemplateId] = useState(ART_TEMPLATES[0]?.id ?? "");
  const [colOffset, setColOffset] = useState(0);
  const [clearFirst, setClearFirst] = useState(false);

  const weeks = editor.grid.weeks;

  const pattern: Grid | null = useMemo(() => {
    if (source === "text") {
      const width = textWidth(text);
      if (!width) return null;
      return renderTextGrid(text, { weeks: width, level });
    }
    const t = ART_TEMPLATES.find((t) => t.id === templateId);
    if (!t) return null;
    return templateToGrid(t, templateWidth(t));
  }, [source, text, level, templateId]);

  const patternWidth = pattern?.weeks ?? 0;
  const maxOffset = Math.max(0, weeks - patternWidth);
  const offset = Math.min(colOffset, maxOffset);
  const fits = patternWidth <= weeks;

  const preview = useMemo(() => {
    if (!pattern) return editor.grid;
    const base = clearFirst
      ? { weeks: editor.grid.weeks, cells: new Array(editor.grid.weeks * 7).fill(0) as Level[] }
      : editor.grid;
    return stampGrid(base, pattern, offset);
  }, [pattern, editor.grid, offset, clearFirst]);

  const unsupported =
    source === "text" ? [...text].filter((c) => !isRenderable(c)) : [];

  const insert = () => {
    if (!pattern || !fits) return;
    editor.insertPattern(pattern, offset, clearFirst);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Layers className="size-4" />
          Insert pattern
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Insert pattern</DialogTitle>
          <DialogDescription>
            Add text or an art template onto the current canvas — combine
            both to build things like an icon with a text label.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={source} onValueChange={(v) => setSource(v as "text" | "template")}>
          <TabsList>
            <TabsTrigger value="text">Text</TabsTrigger>
            <TabsTrigger value="template">Art template</TabsTrigger>
          </TabsList>

          <TabsContent value="text" className="space-y-3 pt-3">
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="insert-text">Text</Label>
                <Input
                  id="insert-text"
                  className="w-48"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
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
            </div>
            {unsupported.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Unsupported characters ignored:{" "}
                {[...new Set(unsupported)].join(" ")}
              </p>
            )}
          </TabsContent>

          <TabsContent value="template" className="pt-3">
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {ART_TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTemplateId(t.id)}
                  className={
                    "rounded-md border p-2 text-xs transition-colors hover:bg-accent " +
                    (templateId === t.id ? "border-foreground" : "border-border")
                  }
                >
                  {t.name}
                </button>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {pattern && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">
                Horizontal position: column {offset + 1}
                {maxOffset === 0 && weeks < patternWidth && " (too wide for grid)"}
              </Label>
              <Slider
                min={0}
                max={Math.max(maxOffset, 0)}
                step={1}
                disabled={maxOffset === 0}
                value={[offset]}
                onValueChange={([v]) => setColOffset(v)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={clearFirst}
                onCheckedChange={setClearFirst}
                id="clear-first"
              />
              <Label htmlFor="clear-first" className="text-xs">
                Clear existing pattern first (replace instead of merge)
              </Label>
            </div>
            <ContributionGraph
              grid={preview}
              startDate={project.startDate}
              endDate={project.endDate}
              showLabels={false}
              interactive={false}
            />
            {!fits && (
              <p className="text-sm text-destructive">
                Pattern is {patternWidth} weeks wide — wider than the {weeks}
                -week grid.
              </p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button disabled={!pattern || !fits} onClick={insert}>
            {clearFirst ? "Replace grid" : "Merge into grid"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
