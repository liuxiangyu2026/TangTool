import { GIFEncoder, applyPalette, quantize } from "gifenc";
import { configureLocale, normalizeLocale, t } from "../i18n/core";

self.onmessage = (event: MessageEvent<{ pixels: Uint8ClampedArray; width: number; height: number; locale?: string }>) => {
  configureLocale(() => normalizeLocale(event.data.locale));
  try {
    const { pixels, width, height } = event.data;
    // 大图只抽样计算调色板，再映射所有像素，限制量化耗时与临时内存。
    const stride = Math.max(1, Math.ceil(width * height / 65536));
    const sample = new Uint8ClampedArray(Math.ceil(width * height / stride) * 4);
    for (let pixel = 0, target = 0; pixel < width * height; pixel += stride, target += 4) {
      sample.set(pixels.subarray(pixel * 4, pixel * 4 + 4), target);
    }
    const palette = quantize(sample, 255);
    const indexed = applyPalette(pixels, palette);
    // 固定保留透明索引，避免稀少的透明像素因调色板抽样而丢失；GIF 只支持一位透明。
    palette.unshift([0, 0, 0]);
    for (let pixel = 0; pixel < indexed.length; pixel++) {
      indexed[pixel] = pixels[pixel * 4 + 3]! < 128 ? 0 : indexed[pixel]! + 1;
    }
    const encoder = GIFEncoder();
    encoder.writeFrame(indexed, width, height, { palette, transparent: true, transparentIndex: 0, repeat: -1 });
    encoder.finish();
    self.postMessage({ value: encoder.bytes() });
  } catch (reason) {
    self.postMessage({ error: reason instanceof Error ? reason.message : t('图片编码失败。') });
  }
};
