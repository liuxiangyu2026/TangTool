import { t } from "../i18n/core";

export const logoSizes = [16, 24, 32, 48, 64, 128, 180, 192, 256, 512, 1024] as const;
export type LogoOptions = { mode: "contain" | "cover"; padding: number; background: string | null; sizes: number[] };
export type LogoImage = { size: number; blob: Blob };

export async function generateLogoImages(file: File, options: LogoOptions): Promise<LogoImage[]> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size === 0 || file.size > 20 * 1024 * 1024) {
    throw new Error(t('请选择非空且不超过 20 MiB 的 JPEG、PNG 或 WebP 图片。'));
  }
  const sizes = [...new Set(options.sizes)].sort((a, b) => a - b);
  if (!sizes.length || sizes.some(size => !logoSizes.includes(size as typeof logoSizes[number]))) {
    throw new Error(t('请至少选择一个输出尺寸。'));
  }
  if (!Number.isInteger(options.padding) || options.padding < 0 || options.padding > 40) {
    throw new Error(t('留白需要是 0～40 的整数。'));
  }
  if (options.background !== null && !/^#[0-9a-f]{6}$/i.test(options.background)) {
    throw new Error(t('请选择有效的背景颜色。'));
  }
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  try {
    if (bitmap.width * bitmap.height > 24_000_000) throw new Error(t('图片超过 2400 万像素，请先缩小后再处理。'));
    const context = canvas.getContext("2d");
    if (!context) throw new Error(t('当前环境无法创建图像画布。'));
    const images: LogoImage[] = [];
    // 顺序编码，避免同时持有多个大画布；每个尺寸均从原图绘制，避免连续缩放失真。
    for (const size of sizes) {
      canvas.width = size;
      canvas.height = size;
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      if (options.background) {
        context.fillStyle = options.background;
        context.fillRect(0, 0, size, size);
      }
      const inset = size * options.padding / 100;
      const edge = size - inset * 2;
      const ratio = options.mode === "cover"
        ? edge / Math.min(bitmap.width, bitmap.height)
        : edge / Math.max(bitmap.width, bitmap.height);
      const width = bitmap.width * ratio;
      const height = bitmap.height * ratio;
      context.save();
      context.beginPath();
      context.rect(inset, inset, edge, edge);
      context.clip();
      context.drawImage(bitmap, (size - width) / 2, (size - height) / 2, width, height);
      context.restore();
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(value => value ? resolve(value) : reject(new Error(t('图片编码失败。'))), "image/png");
      });
      images.push({ size, blob });
    }
    return images;
  } finally {
    bitmap.close();
    canvas.width = 0;
    canvas.height = 0;
  }
}

/** ICO 目录指向独立 PNG 数据，256px 在目录的单字节尺寸字段中按规范记为 0。 */
export async function createLogoIco(images: LogoImage[]): Promise<Blob> {
  const entries = images.filter(image => image.size <= 256);
  if (!entries.length) throw new Error(t('导出 ICO 请至少选择一个不超过 256px 的尺寸。'));
  const buffers = await Promise.all(entries.map(image => image.blob.arrayBuffer()));
  const header = new ArrayBuffer(6 + entries.length * 16);
  const view = new DataView(header);
  view.setUint16(2, 1, true);
  view.setUint16(4, entries.length, true);
  let offset = header.byteLength;
  entries.forEach((image, index) => {
    const position = 6 + index * 16;
    view.setUint8(position, image.size === 256 ? 0 : image.size);
    view.setUint8(position + 1, image.size === 256 ? 0 : image.size);
    view.setUint16(position + 4, 1, true);
    view.setUint16(position + 6, 32, true);
    view.setUint32(position + 8, buffers[index]!.byteLength, true);
    view.setUint32(position + 12, offset, true);
    offset += buffers[index]!.byteLength;
  });
  return new Blob([header, ...buffers], { type: "image/vnd.microsoft.icon" });
}
