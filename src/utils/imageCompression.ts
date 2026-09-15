import { t } from "../i18n/core";
export type CompressionOptions = { format: "image/jpeg" | "image/webp"; quality: number; maxEdge: number };
export type CompressionResult = { blob: Blob; width: number; height: number; originalWidth: number; originalHeight: number };

export async function compressImage(file: File, options: CompressionOptions): Promise<CompressionResult> {
  if (!Number.isInteger(options.quality) || options.quality < 10 || options.quality > 100) throw new Error(t('质量需要是 10～100 的整数。'));
  if (!Number.isInteger(options.maxEdge) || options.maxEdge < 64 || options.maxEdge > 8192) throw new Error(t('最长边需要是 64～8192 像素的整数。'));
  if (file.size > 20 * 1024 * 1024 || !/^image\/(jpeg|png|webp)$/.test(file.type)) throw new Error(t('请选择 20 MiB 以内的 JPEG、PNG 或 WebP 图片。'));
  const bitmap = await createImageBitmap(file);
  try {
    if (bitmap.width * bitmap.height > 24_000_000) throw new Error(t('图片超过 2400 万像素，请先缩小后再处理。'));
    const ratio = Math.min(1, options.maxEdge / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * ratio));
    const height = Math.max(1, Math.round(bitmap.height * ratio));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error(t('当前环境无法创建图像画布。'));
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    // JPEG 不支持透明，显式铺白，避免透明背景变黑。
    if (options.format === "image/jpeg") {
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, width, height);
    }
    context.drawImage(bitmap, 0, 0, width, height);
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((value) => (value ? resolve(value) : reject(new Error(t('图片编码失败。')))), options.format, options.quality / 100);
    });
    if (blob.type !== options.format) throw new Error(t('当前系统不支持此输出格式，请切换 JPEG 或升级系统。'));
    return { blob, width, height, originalWidth: bitmap.width, originalHeight: bitmap.height };
  } finally {
    bitmap.close();
  }
}
