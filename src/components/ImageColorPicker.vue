<template>
  <div class="space-y-2">
    <p class="text-xs text-neutral-500">{{ t('移动光标查看像素，点击拾色（含透明度）；方向键微调，Enter 拾色，Escape 隐藏放大镜。动画只取首帧。') }}</p>
    <p class="text-xs text-neutral-500">{{ t('默认按宽高适应预览，初始高度不超过 400px；可自行放大，长图随工具内容整体滚动。') }}</p>
    <p v-if="loading" class="text-xs text-neutral-500">{{ t('正在载入图片…') }}</p>
    <p v-if="error" class="text-xs text-red-600">{{ error }}</p>
    <div v-if="ready" class="flex flex-wrap items-center gap-2 text-xs">
      <span>{{ t('图片缩放') }}</span>
      <button class="tool-button bg-blue-600" type="button" :disabled="zoom <= 0.01" :aria-label="t('缩小图片')" @click="changeZoom(zoom / 1.25)"><ZoomOut :size="14" /></button>
      <output class="min-w-12 text-center font-mono" :aria-label="t('缩放比例')">{{ Math.round(zoom * 100) }}%</output>
      <button class="tool-button bg-blue-600" type="button" :disabled="zoom >= 4" :aria-label="t('放大图片')" @click="changeZoom(zoom * 1.25)"><ZoomIn :size="14" /></button>
      <button class="tool-button bg-neutral-700" type="button" @click="changeZoom(1)">{{ t('原始大小') }}</button>
      <button class="tool-button bg-neutral-700" type="button" @click="fitImage('preview')">{{ t('适应预览') }}</button>
      <button class="tool-button bg-neutral-700" type="button" @click="fitImage('width')">{{ t('适应宽度') }}</button>
    </div>
    <div v-show="ready" ref="viewport" class="image-picker-viewport min-w-0 w-full" @scroll="scrollImage">
      <div ref="surface" class="image-picker-checker image-eyedropper relative mx-auto box-content rounded border border-neutral-300" :style="displaySize" tabindex="0" role="button"
        :aria-label="t('图片拾色，方向键移动，Enter 拾色，Escape 隐藏放大镜')" @pointermove="move" @pointerdown="move" @pointerleave="showLens = false"
        @click="pickPointer" @focus="showLens = true" @blur="showLens = false" @keydown="keyDown">
        <canvas ref="preview" class="pointer-events-none absolute block" :style="renderPosition"></canvas>
      </div>
    </div>
    <div v-show="ready && showLens && sample" class="pointer-events-none fixed z-20 flex w-36 flex-col items-center gap-1" :style="lensPosition" aria-hidden="true">
      <div class="image-picker-checker relative overflow-hidden rounded-full border-4 border-white shadow-[0_0_0_2px_#2563eb,0_4px_16px_#0006]">
        <canvas ref="lens" width="117" height="117" class="block"></canvas>
        <span class="absolute left-1/2 top-1/2 h-[13px] w-[13px] -translate-x-1/2 -translate-y-1/2 border-2 border-white shadow-[0_0_0_1px_#171717]"></span>
      </div>
      <code class="rounded bg-black px-2 py-1 text-xs text-white">{{ sampleCodes?.hex8 }}</code>
    </div>
    <div v-if="sample" class="flex flex-wrap items-center gap-3 text-xs text-neutral-600" aria-live="polite">
      <span>{{ t('原图像素') }}: {{ sample.x }}, {{ sample.y }} / {{ dimensions.width }} × {{ dimensions.height }}</span>
      <code>{{ sampleCodes?.hex8 }}</code><code>{{ sampleCodes?.rgba }}</code>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onActivated, onBeforeUnmount, onDeactivated, onMounted, ref, watch } from "vue";
import { ZoomIn, ZoomOut } from "lucide-vue-next";
import { t } from "../i18n";
import { decodeImage, readImageFile } from "../utils/imageCompression";
import { describeColor, type RgbaColor } from "../utils/color";

const props = defineProps<{ file: File }>();
const emit = defineEmits<{ pick: [color: RgbaColor] }>();
const preview = ref<HTMLCanvasElement | null>(null);
const lens = ref<HTMLCanvasElement | null>(null);
const viewport = ref<HTMLDivElement | null>(null);
const surface = ref<HTMLDivElement | null>(null);
const renderPosition = ref({ left: "0px", top: "0px", width: "0px", height: "0px" });
const zoom = ref(1);
const fitMode = ref<"preview" | "width" | null>("preview");
const loading = ref(false);
const error = ref("");
const ready = ref(false);
const showLens = ref(false);
const dimensions = ref({ width: 0, height: 0 });
const displaySize = computed(() => ({ width: `${dimensions.value.width * zoom.value}px`, height: `${dimensions.value.height * zoom.value}px` }));
const sample = ref<{ x: number; y: number; color: RgbaColor } | null>(null);
const sampleCodes = computed(() => sample.value ? describeColor(sample.value.color) : null);
const lensPosition = ref({ left: "0px", top: "0px" });
let bitmap: ImageBitmap | null = null;
let pixelCanvas: HTMLCanvasElement | null = null;
let revision = 0;
let active = true;
let resizeObserver: ResizeObserver | null = null;
let contentScroll: HTMLElement | null = null;
let renderFrame = 0;

function scrollImage() {
  showLens.value = false;
  if (renderFrame) return;
  renderFrame = requestAnimationFrame(() => {
    renderFrame = 0;
    renderVisibleImage();
  });
}

function renderVisibleImage() {
  if (!bitmap || !ready.value || !preview.value || !viewport.value || !surface.value) return;
  const bounds = surface.value.getBoundingClientRect();
  const viewportBounds = viewport.value.getBoundingClientRect();
  const contentBounds = contentScroll?.getBoundingClientRect();
  const imageLeft = bounds.left + surface.value.clientLeft;
  const imageTop = bounds.top + surface.value.clientTop;
  // 多绘制少量边缘区域，减少滚动时的重绘；画布尺寸只取决于视口，不取决于长图总高度。
  // 裁切边界对齐原图像素，避免原始大小下截取小数像素后再次缩放而变模糊。
  const left = Math.floor(Math.max(0, Math.max(viewportBounds.left, contentBounds?.left ?? 0, 0) - imageLeft - 64) / zoom.value) * zoom.value;
  const top = Math.floor(Math.max(0, Math.max(contentBounds?.top ?? 0, 0) - imageTop - 128) / zoom.value) * zoom.value;
  const right = Math.min(dimensions.value.width, Math.ceil((Math.min(viewportBounds.right, contentBounds?.right ?? window.innerWidth, window.innerWidth) - imageLeft + 64) / zoom.value)) * zoom.value;
  const bottom = Math.min(dimensions.value.height, Math.ceil((Math.min(contentBounds?.bottom ?? window.innerHeight, window.innerHeight) - imageTop + 128) / zoom.value)) * zoom.value;
  const width = Math.max(0, right - left);
  const height = Math.max(0, bottom - top);
  if (!width || !height) {
    preview.value.width = 0;
    preview.value.height = 0;
    renderPosition.value = { left: "0px", top: "0px", width: "0px", height: "0px" };
    return;
  }
  const density = Math.min(window.devicePixelRatio || 1, 2, 8192 / width, 8192 / height, Math.sqrt(8_000_000 / (width * height)));
  preview.value.width = Math.max(1, Math.floor(width * density));
  preview.value.height = Math.max(1, Math.floor(height * density));
  const context = preview.value.getContext("2d");
  if (!context) return;
  context.drawImage(bitmap, left / zoom.value, top / zoom.value, width / zoom.value, height / zoom.value, 0, 0, preview.value.width, preview.value.height);
  renderPosition.value = { left: `${left}px`, top: `${top}px`, width: `${width}px`, height: `${height}px` };
}

function changeZoom(value: number) {
  fitMode.value = null;
  zoom.value = Math.max(0.01, Math.min(4, value));
  showLens.value = false;
}

function fitImage(mode: "preview" | "width") {
  fitMode.value = mode;
  if (viewport.value && dimensions.value.width && dimensions.value.height) {
    // 大图初次打开同时限制宽高；“适应宽度”由用户主动选择，不再作为初始模式。
    const maximumHeight = Math.min(400, Math.max(240, window.innerHeight * 0.45));
    zoom.value = Math.min(1, Math.max(1, viewport.value.clientWidth - 2) / dimensions.value.width, mode === "preview" ? maximumHeight / dimensions.value.height : 1);
  }
  showLens.value = false;
}

function resizePreview() {
  if (fitMode.value) fitImage(fitMode.value);
  scrollImage();
}

function release() {
  revision++;
  cancelAnimationFrame(renderFrame);
  renderFrame = 0;
  resizeObserver?.disconnect();
  resizeObserver = null;
  window.removeEventListener("resize", resizePreview);
  contentScroll?.removeEventListener("scroll", scrollImage);
  contentScroll = null;
  bitmap?.close();
  bitmap = null;
  for (const canvas of [preview.value, lens.value, pixelCanvas]) {
    if (canvas) {
      canvas.width = 0;
      canvas.height = 0;
    }
  }
  pixelCanvas = null;
  ready.value = false;
  loading.value = false;
  showLens.value = false;
  sample.value = null;
}

async function load() {
  release();
  const id = revision;
  const file = props.file;
  loading.value = true;
  error.value = "";
  try {
    const image = await decodeImage(await readImageFile(file));
    if (id !== revision || !active) {
      image.close();
      return;
    }
    bitmap = image;
    if (image.width * image.height > 24_000_000) throw new Error(t('图片超过 2400 万像素，请先缩小后再处理。'));
    await nextTick();
    if (id !== revision || !preview.value) return;
    pixelCanvas = document.createElement("canvas");
    pixelCanvas.width = 1;
    pixelCanvas.height = 1;
    dimensions.value = { width: image.width, height: image.height };
    ready.value = true;
    await nextTick();
    if (id !== revision || !viewport.value) return;
    if (fitMode.value) fitImage(fitMode.value);
    let previousWidth = viewport.value.clientWidth;
    resizeObserver = new ResizeObserver(([entry]) => {
      const width = entry?.contentRect.width ?? 0;
      if (!width || width === previousWidth) return;
      previousWidth = width;
      resizePreview();
    });
    resizeObserver.observe(viewport.value);
    contentScroll = viewport.value.closest<HTMLElement>(".tool-page-content");
    contentScroll?.addEventListener("scroll", scrollImage, { passive: true });
    window.addEventListener("resize", resizePreview);
    await nextTick();
    if (id !== revision) return;
    renderVisibleImage();
    samplePixel(Math.floor(image.width / 2), Math.floor(image.height / 2));
  } catch (reason) {
    if (id === revision) {
      release();
      error.value = reason instanceof Error ? reason.message : t('图片无法解码或压缩。');
    }
  } finally {
    if (id === revision) loading.value = false;
  }
}

function samplePixel(x: number, y: number) {
  if (!bitmap || !pixelCanvas || !surface.value) return;
  x = Math.max(0, Math.min(bitmap.width - 1, x));
  y = Math.max(0, Math.min(bitmap.height - 1, y));
  const context = pixelCanvas.getContext("2d", { willReadFrequently: true });
  if (!context) return;
  // 显示画布可缩小，取色始终直接读取原图的一个像素，不读缩放后的混合色。
  context.clearRect(0, 0, 1, 1);
  context.drawImage(bitmap, x, y, 1, 1, 0, 0, 1, 1);
  const pixel = context.getImageData(0, 0, 1, 1).data;
  sample.value = { x, y, color: { r: pixel[0]!, g: pixel[1]!, b: pixel[2]!, a: pixel[3]! / 255 } };
  const magnifierContext = lens.value?.getContext("2d");
  if (magnifierContext && lens.value) {
    lens.value.width = 117;
    lens.value.height = 117;
    magnifierContext.imageSmoothingEnabled = false;
    magnifierContext.clearRect(0, 0, 117, 117);
    const left = Math.max(0, x - 4);
    const top = Math.max(0, y - 4);
    const width = Math.min(bitmap.width, x + 5) - left;
    const height = Math.min(bitmap.height, y + 5) - top;
    magnifierContext.drawImage(bitmap, left, top, width, height, (left - x + 4) * 13, (top - y + 4) * 13, width * 13, height * 13);
    magnifierContext.strokeStyle = "rgba(100, 100, 100, 0.3)";
    magnifierContext.lineWidth = 1;
    magnifierContext.beginPath();
    for (let edge = 13; edge < 117; edge += 13) {
      magnifierContext.moveTo(edge + 0.5, 0);
      magnifierContext.lineTo(edge + 0.5, 117);
      magnifierContext.moveTo(0, edge + 0.5);
      magnifierContext.lineTo(117, edge + 0.5);
    }
    magnifierContext.stroke();
  }
  const bounds = surface.value.getBoundingClientRect();
  const clientX = bounds.left + surface.value.clientLeft + (x + 0.5) * zoom.value;
  const clientY = bounds.top + surface.value.clientTop + (y + 0.5) * zoom.value;
  const contentBounds = contentScroll?.getBoundingClientRect();
  const left = Math.max(0, contentBounds?.left ?? 0);
  const right = Math.min(window.innerWidth, contentBounds?.right ?? window.innerWidth);
  const top = Math.max(0, contentBounds?.top ?? 0);
  const bottom = Math.min(window.innerHeight, contentBounds?.bottom ?? window.innerHeight);
  // 放大镜固定在可见内容区域，不随长图离开屏幕，也不遮挡顶部复制工具栏。
  lensPosition.value = {
    left: `${Math.max(left, Math.min(clientX + 20, right - 144))}px`,
    top: `${Math.max(top, Math.min(clientY + 180 > bottom ? clientY - 175 : clientY + 20, bottom - 175))}px`,
  };
}

function move(event: PointerEvent) {
  if (!bitmap || !surface.value || !ready.value) return;
  const bounds = surface.value.getBoundingClientRect();
  if (!bounds.width || !bounds.height) return;
  const x = Math.floor((event.clientX - bounds.left - surface.value.clientLeft) / zoom.value);
  const y = Math.floor((event.clientY - bounds.top - surface.value.clientTop) / zoom.value);
  samplePixel(x, y);
  showLens.value = true;
}

// click 在部分 WebView 中使用整数坐标；沿用指针事件的精确采样，避免悬停和点击色差。
function pickPointer() {
  surface.value?.focus({ preventScroll: true });
  if (sample.value) emit("pick", { ...sample.value.color });
}

function keyDown(event: KeyboardEvent) {
  if (event.key === "Escape") {
    event.preventDefault();
    showLens.value = false;
    surface.value?.blur();
    return;
  }
  if (!sample.value) return;
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    emit("pick", { ...sample.value.color });
    return;
  }
  if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
  event.preventDefault();
  const step = event.shiftKey ? 10 : 1;
  samplePixel(sample.value.x + (event.key === "ArrowLeft" ? -step : event.key === "ArrowRight" ? step : 0), sample.value.y + (event.key === "ArrowUp" ? -step : event.key === "ArrowDown" ? step : 0));
  showLens.value = true;
}

watch(zoom, scrollImage, { flush: "post" });

watch(() => props.file, () => {
  fitMode.value = "preview";
  if (active) void load();
});
onMounted(load);
onDeactivated(() => {
  active = false;
  release();
});
onActivated(() => {
  active = true;
  if (!bitmap && !loading.value) void load();
});
onBeforeUnmount(release);
</script>

<style scoped>
.image-picker-checker {
  background-color: #fff;
  background-image: conic-gradient(#e5e7eb 25%, transparent 0 50%, #e5e7eb 0 75%, transparent 0);
  background-size: 12px 12px;
}
.image-picker-viewport {
  overflow-x: auto;
  overflow-y: hidden;
}
.image-eyedropper {
  cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='4' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m2 22 1-5L16 4l4 4L7 21Z M13 3l8 8 M16 4l3-3 4 4-3 3'/%3E%3Cpath stroke='%23171717' stroke-width='2' d='m2 22 1-5L16 4l4 4L7 21Z M13 3l8 8 M16 4l3-3 4 4-3 3'/%3E%3C/svg%3E") 2 22, crosshair;
}
</style>
