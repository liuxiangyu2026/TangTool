import { t } from "../i18n/core";
import { createLogoIco } from "./logoImage";
import { runWorker } from "./workerTask";

export type ImageFormat = "image/jpeg" | "image/png" | "image/webp" | "image/bmp" | "image/gif" | "image/vnd.microsoft.icon";
export type CompressionOptions = { format: ImageFormat; quality: number; maxEdge: number; keepOriginal?: boolean; icoSize?: number };
export type CompressionResult = { blob: Blob; width: number; height: number; originalWidth: number; originalHeight: number; preview: Blob };
export const imageExtensions: Record<ImageFormat, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/bmp": "bmp", "image/gif": "gif", "image/vnd.microsoft.icon": "ico" };

/** 依据文件头识别，兼容系统没有填写 MIME 的 BMP/ICO，同时拒绝仅改后缀的其他文件。 */
export async function readImageFile(file: File): Promise<Blob> {
  if (!file.size || file.size > 20 * 1024 * 1024) throw new Error(t('请选择非空且不超过 20 MiB 的 JPEG、PNG、WebP、BMP、ICO 或 GIF 图片。'));
  const bytes = new Uint8Array(await file.slice(0, 32).arrayBuffer());
  const text = new TextDecoder("ascii").decode(bytes);
  let type: ImageFormat;
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) type = "image/jpeg";
  else if (bytes[0] === 137 && text.slice(1, 4) === "PNG") type = "image/png";
  else if (text.startsWith("RIFF") && text.slice(8, 12) === "WEBP") type = "image/webp";
  else if (text.startsWith("BM")) type = "image/bmp";
  else if (/^GIF8[79]a/.test(text)) type = "image/gif";
  else if (bytes[0] === 0 && bytes[1] === 0 && bytes[2] === 1 && bytes[3] === 0) type = "image/vnd.microsoft.icon";
  else throw new Error(t('请选择 JPEG、PNG、WebP、BMP、ICO 或 GIF 图片；不支持 HEIC。'));
  const header = new DataView(bytes.buffer);
  let width = 0;
  let height = 0;
  if (type === "image/png" && bytes.length >= 24) {
    width = header.getUint32(16);
    height = header.getUint32(20);
  } else if (type === "image/gif" && bytes.length >= 10) {
    width = header.getUint16(6, true);
    height = header.getUint16(8, true);
  } else if (type === "image/bmp" && bytes.length >= 26 && header.getUint32(14, true) >= 40) {
    width = Math.abs(header.getInt32(18, true));
    height = Math.abs(header.getInt32(22, true));
  }
  if (width * height > 24_000_000) throw new Error(t('图片超过 2400 万像素，请先缩小后再处理。'));
  return file.slice(0, file.size, type);
}

export async function decodeImage(blob: Blob): Promise<ImageBitmap> {
  if (blob.type === "image/vnd.microsoft.icon") {
    const buffer = await blob.arrayBuffer();
    const view = new DataView(buffer);
    if (buffer.byteLength < 6) throw new Error(t('ICO 文件目录无效。'));
    const count = view.getUint16(4, true);
    if (!count || count > 256 || buffer.byteLength < 6 + count * 16) throw new Error(t('ICO 文件目录无效。'));
    let largest = 6;
    let largestArea = 0;
    for (let i = 0; i < count; i++) {
      const position = 6 + i * 16;
      const width = view.getUint8(position) || 256;
      const height = view.getUint8(position + 1) || 256;
      const length = view.getUint32(position + 8, true);
      const offset = view.getUint32(position + 12, true);
      if (!length || offset < 6 + count * 16 || offset + length > buffer.byteLength) throw new Error(t('ICO 文件目录无效。'));
      if (width * height > largestArea) {
        largest = position;
        largestArea = width * height;
      }
    }
    const offset = view.getUint32(largest + 12, true);
    const length = view.getUint32(largest + 8, true);
    const payload = buffer.slice(offset, offset + length);
    if (new Uint8Array(payload)[0] === 137) {
      const png = await readImageFile(new File([payload], "icon.png", { type: "image/png" }));
      return createImageBitmap(png);
    }
    // 老 ICO 的 DIB 数据交给 WebView 图像解码器，仅保留最大尺寸目录，避免自动选择小图标。
    const header = new Uint8Array(22);
    header.set(new Uint8Array(buffer, 0, 6));
    new DataView(header.buffer).setUint16(4, 1, true);
    header.set(new Uint8Array(buffer, largest, 16), 6);
    new DataView(header.buffer).setUint32(18, 22, true);
    blob = new Blob([header, payload], { type: "image/vnd.microsoft.icon" });
  }
  try {
    // 对动画 GIF / WebP，createImageBitmap 固定读取首帧，不受页面预览播放进度影响。
    return await createImageBitmap(blob);
  } catch (reason) {
    if (blob.type !== "image/vnd.microsoft.icon") throw reason;
    const url = URL.createObjectURL(blob);
    try {
      const image = new Image();
      image.src = url;
      await image.decode();
      return await createImageBitmap(image);
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

/** 24 位 BMP 按行补齐至 4 字节，像素顺序为自底向上的 BGR；白底由绘制阶段提供。 */
function encodeBmp(image: ImageData): Blob {
  const stride = Math.ceil(image.width * 3 / 4) * 4;
  const buffer = new ArrayBuffer(54 + stride * image.height);
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);
  bytes.set([0x42, 0x4d]);
  view.setUint32(2, buffer.byteLength, true);
  view.setUint32(10, 54, true);
  view.setUint32(14, 40, true);
  view.setInt32(18, image.width, true);
  view.setInt32(22, image.height, true);
  view.setUint16(26, 1, true);
  view.setUint16(28, 24, true);
  view.setUint32(34, stride * image.height, true);
  for (let y = 0; y < image.height; y++) {
    for (let x = 0; x < image.width; x++) {
      const source = (y * image.width + x) * 4;
      const target = 54 + (image.height - 1 - y) * stride + x * 3;
      bytes[target] = image.data[source + 2]!;
      bytes[target + 1] = image.data[source + 1]!;
      bytes[target + 2] = image.data[source]!;
    }
  }
  return new Blob([buffer], { type: "image/bmp" });
}

export async function compressImage(file: File, options: CompressionOptions, signal?: AbortSignal): Promise<CompressionResult> {
  const lossy = options.format === "image/jpeg" || options.format === "image/webp";
  if (!(options.format in imageExtensions)) throw new Error(t('请选择有效的输出格式。'));
  if (lossy && (!Number.isInteger(options.quality) || options.quality < 10 || options.quality > 100)) throw new Error(t('质量需要是 10～100 的整数。'));
  if (!options.keepOriginal && (!Number.isInteger(options.maxEdge) || options.maxEdge < 64 || options.maxEdge > 8192)) throw new Error(t('最长边需要是 64～8192 像素的整数。'));
  const icoSize = options.icoSize ?? 256;
  if (options.format === "image/vnd.microsoft.icon" && ![16, 24, 32, 48, 64, 128, 256].includes(icoSize)) throw new Error(t('请选择有效的 ICO 尺寸。'));
  const bitmap = await decodeImage(await readImageFile(file));
  const canvas = document.createElement("canvas");
  try {
    if (signal?.aborted) throw new Error(t('任务已取消'));
    if (bitmap.width * bitmap.height > 24_000_000) throw new Error(t('图片超过 2400 万像素，请先缩小后再处理。'));
    const ico = options.format === "image/vnd.microsoft.icon";
    const ratio = ico ? Math.min(1, icoSize / Math.max(bitmap.width, bitmap.height)) : options.keepOriginal ? 1 : Math.min(1, options.maxEdge / Math.max(bitmap.width, bitmap.height));
    const drawWidth = Math.max(1, Math.round(bitmap.width * ratio));
    const drawHeight = Math.max(1, Math.round(bitmap.height * ratio));
    const width = ico ? icoSize : drawWidth;
    const height = ico ? icoSize : drawHeight;
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error(t('当前环境无法创建图像画布。'));
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    if (options.format === "image/jpeg" || options.format === "image/bmp") {
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, width, height);
    }
    context.drawImage(bitmap, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
    let blob: Blob;
    if (options.format === "image/bmp") blob = encodeBmp(context.getImageData(0, 0, width, height));
    else if (options.format === "image/gif") {
      const pixels = context.getImageData(0, 0, width, height).data;
      const bytes = await runWorker<Uint8Array>(new Worker(new URL("../workers/gif.worker.ts", import.meta.url), { type: "module" }), { pixels, width, height }, 20000, signal);
      blob = new Blob([new Uint8Array(bytes)], { type: "image/gif" });
    } else {
      blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(value => value ? resolve(value) : reject(new Error(t('图片编码失败。'))), ico ? "image/png" : options.format, options.quality / 100);
      });
      if (!ico && blob.type !== options.format) throw new Error(t('当前系统不支持此输出格式，请切换 JPEG 或升级系统。'));
      if (ico) blob = await createLogoIco([{ size: icoSize, blob }]);
    }
    // BMP / ICO 在部分 WebView 的 img 支持不同；结果统一用 PNG 预览，保存仍为真实目标格式。
    const preview = options.format === "image/gif" || lossy || options.format === "image/png" ? blob : await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(value => value ? resolve(value) : reject(new Error(t('图片编码失败。'))), "image/png");
    });
    return { blob, preview, width, height, originalWidth: bitmap.width, originalHeight: bitmap.height };
  } finally {
    bitmap.close();
    canvas.width = 0;
    canvas.height = 0;
  }
}
