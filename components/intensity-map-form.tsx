"use client";

import { useProjectStore } from "@/store/project-store";
import { LEVEL_NAMES, GITHUB_COLORS } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

export function IntensityMapForm() {
  const intensity = useProjectStore((s) => s.project.intensity);
  const setIntensity = useProjectStore((s) => s.setIntensity);

  const setLevel = (i: number, value: number) => {
    const levels = [...intensity.levels] as typeof intensity.levels;
    levels[i] = Math.max(0, value);
    setIntensity({ ...intensity, levels });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-5 gap-3">
        {LEVEL_NAMES.map((name, i) => (
          <div key={name} className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-xs">
              <span
                className="inline-block size-3 rounded-[2px]"
                style={{ backgroundColor: GITHUB_COLORS[i] }}
              />
              {name}
            </Label>
            <Input
              type="number"
              min={0}
              value={intensity.levels[i]}
              disabled={i === 0}
              onChange={(e) => setLevel(i, Number(e.target.value))}
            />
          </div>
        ))}
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">
          Randomization jitter: ±{Math.round(intensity.jitter * 100)}%
        </Label>
        <Slider
          min={0}
          max={50}
          step={5}
          value={[Math.round(intensity.jitter * 100)]}
          onValueChange={([v]) => setIntensity({ ...intensity, jitter: v / 100 })}
        />
      </div>
    </div>
  );
}
