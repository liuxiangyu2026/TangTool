import { t } from "../i18n/core";
import { decodeImage, readImageFile } from "./imageCompression";

export class EmptyImagePaletteError extends Error {}

export type PaletteColor = { hex: string; share: number };
export async function extractImagePalette(file: File, count: number): Promise<PaletteColor[]> {
  if (!Number.isInteger(count) || count < 4 || count > 16) throw new Error(t('提取颜色数量需要为 4～16。'));
  const bitmap = await decodeImage(await readImageFile(file));
  const canvas = document.createElement("canvas");
  try {
    if (bitmap.width * bitmap.height > 24_000_000) throw new Error(t('图片超过 2400 万像素，请先缩小后再处理。'));
    const ratio = Math.min(1, 128 / Math.max(bitmap.width, bitmap.height));
    canvas.width = Math.max(1, Math.round(bitmap.width * ratio));
    canvas.height = Math.max(1, Math.round(bitmap.height * ratio));
    const context = canvas.getContext("2d");
    if (!context) throw new Error(t('当前环境无法创建图像画布。'));
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    const bins = new Map<number, { r: number; g: number; b: number; weight: number }>();
    for (let i = 0; i < pixels.length; i += 4) {
      const weight = pixels[i + 3]! / 255;
      if (!weight) continue;
      const r = pixels[i]!;
      const g = pixels[i + 1]!;
      const b = pixels[i + 2]!;
      const key = (r >> 4) * 256 + (g >> 4) * 16 + (b >> 4);
      const bin = bins.get(key) ?? { r: 0, g: 0, b: 0, weight: 0 };
      bin.r += r * weight;
      bin.g += g * weight;
      bin.b += b * weight;
      bin.weight += weight;
      bins.set(key, bin);
    }
    const points = [...bins.values()].map(bin => ({ r: bin.r / bin.weight, g: bin.g / bin.weight, b: bin.b / bin.weight, weight: bin.weight })).sort((a, b) => b.weight - a.weight);
    if (!points.length) throw new EmptyImagePaletteError(t('图片完全透明，无法提取配色。'));
    const centers = [{ ...points[0]! }];
    function distance(a: typeof points[number], b: typeof points[number]): number {
      return (a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2;
    }
    // 先选互相远离且有一定占比的颜色，再做加权聚类，避免相近色占满整个色板。
    while (centers.length < Math.min(count, points.length)) {
      const next = points.reduce((best, point) => {
        const score = Math.min(...centers.map(center => distance(point, center))) * Math.sqrt(point.weight);
        return score > best.score ? { point, score } : best;
      }, { point: points[0]!, score: -1 });
      centers.push({ ...next.point });
    }
    for (let pass = 0; pass < 8; pass++) {
      const sums = centers.map(() => ({ r: 0, g: 0, b: 0, weight: 0 }));
      for (const point of points) {
        let nearest = 0;
        for (let index = 1; index < centers.length; index++) if (distance(point, centers[index]!) < distance(point, centers[nearest]!)) nearest = index;
        const sum = sums[nearest]!;
        sum.r += point.r * point.weight;
        sum.g += point.g * point.weight;
        sum.b += point.b * point.weight;
        sum.weight += point.weight;
      }
      sums.forEach((sum, index) => {
        if (sum.weight) centers[index] = { r: sum.r / sum.weight, g: sum.g / sum.weight, b: sum.b / sum.weight, weight: sum.weight };
        else centers[index]!.weight = 0;
      });
    }
    const total = points.reduce((weight, point) => weight + point.weight, 0);
    const merged = new Map<string, number>();
    for (const center of centers) {
      if (!center.weight) continue;
      const hex = "#" + [center.r, center.g, center.b].map(value => Math.round(value).toString(16).padStart(2, "0")).join("").toUpperCase();
      merged.set(hex, (merged.get(hex) ?? 0) + center.weight / total);
    }
    return [...merged].map(([hex, share]) => ({ hex, share })).sort((a, b) => b.share - a.share);
  } finally {
    bitmap.close();
    canvas.width = 0;
    canvas.height = 0;
  }
}
