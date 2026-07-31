import type { Grid, Level } from "@/lib/types";

export interface ImageConvertOptions {
  weeks: number;
  /** 0–1: luminance above this maps to empty; below is spread over levels 1–4 */
  threshold?: number;
  invert?: boolean;
}

/** Load a File (PNG/SVG/BMP/…) into an HTMLImageElement. Browser only. */
export function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not decode image"));
    };
    img.src = url;
  });
}

/**
 * Downsample an image onto the 7×weeks grid and quantize to 5 levels.
 * Dark pixels become high levels (ink-on-paper semantics); use `invert`
 * for light-on-dark artwork.
 */
export function imageToGrid(
  img: HTMLImageElement,
  { weeks, threshold = 0.9, invert = false }: ImageConvertOptions,
): Grid {
  const canvas = document.createElement("canvas");
  canvas.width = weeks;
  canvas.height = 7;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  // White background so transparency reads as empty.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, weeks, 7);

  // Fit image inside the grid preserving aspect ratio, centered.
  // A contribution cell is visually square, so grid aspect = weeks/7.
  const scale = Math.min(weeks / img.width, 7 / img.height);
  const w = img.width * scale;
  const h = img.height * scale;
  ctx.drawImage(img, (weeks - w) / 2, (7 - h) / 2, w, h);

  const data = ctx.getImageData(0, 0, weeks, 7).data;
  const cells = new Array<Level>(weeks * 7).fill(0);
  for (let y = 0; y < 7; y++) {
    for (let x = 0; x < weeks; x++) {
      const i = (y * weeks + x) * 4;
      let lum =
        (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255;
      if (invert) lum = 1 - lum;
      // Darkness 0–1; anything below (1 - threshold) is empty.
      const darkness = 1 - lum;
      const cutoff = 1 - threshold;
      let level: Level = 0;
      if (darkness > cutoff) {
        const t = (darkness - cutoff) / (1 - cutoff); // 0–1 across levels 1–4
        level = (Math.min(4, 1 + Math.floor(t * 4)) as Level);
      }
      cells[x * 7 + y] = level; // column-major
    }
  }
  return { weeks, cells };
}
