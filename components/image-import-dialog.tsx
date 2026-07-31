"use client";

import { useMemo, useState } from "react";
import { useProjectStore } from "@/store/project-store";
import { imageToGrid, loadImage } from "@/lib/image-to-grid";
import type { Grid } from "@/lib/types";
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
import { ContributionGraph } from "@/components/contribution-graph";
import { ImageUp } from "lucide-react";

export function ImageImportDialog({
  onApply,
}: {
  /** Defaults to applying to the project grid; the editor passes its own. */
  onApply?: (grid: Grid) => void;
}) {
  const project = useProjectStore((s) => s.project);
  const applyGrid = useProjectStore((s) => s.applyGrid);
  const [open, setOpen] = useState(false);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [threshold, setThreshold] = useState(0.9);
  const [invert, setInvert] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const weeks = project.grid.weeks;

  const preview = useMemo<Grid | null>(() => {
    if (!img) return null;
    try {
      return imageToGrid(img, { weeks, threshold, invert });
    } catch {
      return null;
    }
  }, [img, weeks, threshold, invert]);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      setImg(await loadImage(file));
      setError(null);
    } catch {
      setError("Could not decode that file. Try PNG, SVG, or BMP.");
    }
  };

  const apply = () => {
    if (!preview) return;
    (onApply ?? applyGrid)(preview);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <ImageUp className="size-4" />
          Import image
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import image</DialogTitle>
          <DialogDescription>
            PNG, SVG, or BMP — downsampled to the 7×{weeks} grid and quantized
            to 5 shades.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            type="file"
            accept="image/png,image/svg+xml,image/bmp,image/jpeg,image/webp"
            onChange={(e) => onFile(e.target.files?.[0])}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          {img && (
            <>
              <div className="space-y-1.5">
                <Label className="text-xs">
                  Ink threshold: {Math.round(threshold * 100)}%
                </Label>
                <Slider
                  min={50}
                  max={99}
                  step={1}
                  value={[Math.round(threshold * 100)]}
                  onValueChange={([v]) => setThreshold(v / 100)}
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={invert} onCheckedChange={setInvert} id="invert" />
                <Label htmlFor="invert" className="text-xs">
                  Invert (light artwork on dark background)
                </Label>
              </div>
              {preview && (
                <ContributionGraph
                  grid={preview}
                  startDate={project.startDate}
                  endDate={project.endDate}
                  showLabels={false}
                  interactive={false}
                />
              )}
            </>
          )}
        </div>
        <DialogFooter>
          <Button disabled={!preview} onClick={apply}>
            Apply to grid
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
