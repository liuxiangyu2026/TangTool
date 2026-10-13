<template>
  <ToolPage class="color-picker-page" :class="{ 'image-color-open': paletteVisible }" :description="t('二维色板选择饱和度/明度，右侧竖条调色相。下方 216 个 Web 安全色独立滚动，点击后上方同步更新。')" :error="error" :status="status">
    <template #actions>
      <button ref="paletteTrigger" class="tool-button bg-violet-600" type="button" @click="showImageColors"><FolderOpen :size="14" />{{ t('图片拾色') }}</button>
      <input ref="paletteFileInput" type="file" accept=".jpg,.jpeg,.png,.webp,.bmp,.ico,.gif" class="sr-only" :aria-label="t('选择拾色图片')" :disabled="paletteBusy" @change="choosePaletteImage" />
      <button class="tool-button bg-emerald-600" type="button" :aria-label="t('复制当前 RGBA')" @click="copyCode(codes.rgba)">
        <Copy :size="14"/>
        {{ t("复制 RGBA") }}
      </button>
      <button class="tool-button bg-blue-600" type="button" :aria-label="t('复制当前 HEX8')" @click="copyCode(codes.hex8)">
        <Copy :size="14"/>
        {{ t("复制 HEX8") }}
      </button>
      <button class="tool-button bg-neutral-700" type="button" @click="selectColor('#336699')">
        <RotateCcw :size="14"/>
        {{ t("重置") }}
      </button>
    </template>
    <section v-if="paletteVisible" class="tool-panel shrink-0 space-y-3" :aria-label="t('图片拾色区域')">
      <div class="flex flex-wrap items-center gap-3 text-sm">
        <button class="tool-button bg-violet-600" type="button" :disabled="paletteBusy" @click="paletteFileInput?.click()"><FolderOpen :size="14" />{{ paletteImage ? t('更换图片') : t('选择图片') }}</button>
        <label class="flex items-center gap-2">{{ t('自动配色数') }}<select v-model.number="paletteCount" class="tool-field" :aria-label="t('自动配色数')" :disabled="paletteBusy"><option v-for="index in 13" :key="index" :value="index + 3">{{ index + 3 }}</option></select></label>
        <span v-if="paletteBusy" class="text-xs text-neutral-500">{{ t('处理中') }}</span>
        <button class="tool-button bg-neutral-600" type="button" @click="hideImageColors">{{ t('收起拾色') }}</button>
      </div>
      <p class="text-xs text-neutral-500">{{ t('仅支持单张图片，最多 20 MiB、2400 万像素。自动配色与手动拾色显示在同一行，重复颜色自动去重。') }}</p>
      <article v-if="paletteImage" :key="paletteImage.id" class="relative min-w-0 space-y-2 rounded-lg border border-neutral-200 p-3" :aria-label="t('图片拾色：{name}', { name: paletteImage.file.name })">
        <header class="flex items-center justify-between gap-3 text-sm">
          <span class="min-w-0 truncate" :title="paletteImage.file.name">{{ paletteImage.file.name }}</span>
          <button class="shrink-0 rounded p-1 text-neutral-500 hover:bg-neutral-100 hover:text-red-600" type="button" :aria-label="t('关闭图片 {name}', { name: paletteImage.file.name })" @click="removePaletteImage"><X :size="14" /></button>
        </header>
        <ImageColorPicker :file="paletteImage.file" @pick="applyImageColor(paletteImage, $event)" />
        <div class="flex flex-nowrap gap-2 overflow-x-auto pb-1" :aria-label="t('{name} 的颜色', { name: paletteImage.file.name })">
          <button v-for="item in imageColors(paletteImage)" :key="item.hex8" class="flex shrink-0 items-center gap-2 rounded border border-neutral-300 px-2 py-1 text-xs" type="button"
            :aria-label="t('应用拾色 {hex}', { hex: item.hex8 })" :title="item.share === null ? t('手动拾色') : t('自动配色')" @click="color = item.color">
            <span class="color-checker h-6 w-8 overflow-hidden rounded border border-black/10"><span class="block h-full w-full" :style="{ backgroundColor: describeColor(item.color).rgba }"></span></span>
            <code>{{ item.color.a === 1 ? item.hex8.slice(0, -2) : item.hex8 }}</code><span v-if="item.share !== null">{{ (item.share * 100).toFixed(1) }}%</span>
          </button>
        </div>
        <p v-if="paletteImage.error" class="text-xs text-red-600">{{ t(paletteImage.error) }}</p>
      </article>
      <p v-if="!paletteImage && !paletteBusy" class="text-xs text-neutral-500">{{ t('选择图片开始拾色。') }}</p>
    </section>
    <div class="color-workspace" :style="{ '--safe-scroll-min-height': `${safeScrollMinHeight}px`, '--safe-panel-min-height': `${safePanelMinHeight}px` }">
      <div class="color-controls">
        <section class="tool-panel flex min-h-0 flex-col gap-3 overflow-auto" :aria-label="t('选色与通道')">
          <ColorPlane v-model="color"/>
          <div class="flex items-center gap-2">
            <div class="color-checker h-8 w-12 shrink-0 overflow-hidden rounded border border-neutral-200">
              <div class="h-full" :style="{ backgroundColor: codes.rgba }"></div>
            </div>
            <label class="flex min-w-0 flex-1 items-center gap-2 text-xs">HEX
              <input v-model="hexInput" class="tool-field min-w-0 w-full py-1 font-mono" spellcheck="false" @keydown.enter="applyHex"/>
            </label>
            <button class="shrink-0 text-xs text-blue-700" type="button" @click="applyHex">{{ t("color.apply") }}</button>
          </div>
          <div class="flex gap-2">
            <label v-for="channel in channels" :key="channel" class="flex min-w-0 flex-1 items-center gap-1 text-xs text-neutral-500">{{ channel.toUpperCase() }}
              <input type="number" :value="color[channel]" min="0" max="255" step="1" class="tool-field min-w-0 w-full px-2 py-1"
                     :aria-label="t('{p0} 通道', { p0: channel.toUpperCase() })" @change="changeChannel(channel, $event)"/>
            </label>
          </div>
          <label class="flex items-center gap-2 text-xs">{{ t("不透明度") }}
            <input type="range" :value="color.a * 100" min="0" max="100" step="1" class="min-w-0 flex-1" @input="changeAlpha"/>
            <span class="w-10 text-right font-mono">{{ Math.round(color.a * 100) }}%</span>
          </label>
          <p class="text-xs text-neutral-500">{{ t("{p0} · 色板支持方向键，Shift 加速。", {p0: codes.isWebSafe ? t("当前为 Web 安全色") : t("当前为自定义颜色")}) }}</p>
        </section>
        <section class="tool-panel flex min-h-0 flex-col overflow-auto" :aria-label="t('颜色编码与对比度')">
          <div class="grid flex-1 grid-rows-7 gap-1.5">
            <button v-for="item in encodings" :key="item.label" type="button"
                    class="flex min-h-8 w-full items-center gap-2 rounded bg-neutral-50 px-3 py-1.5 text-left text-sm hover:bg-neutral-200"
                    :aria-label="t('复制 {p0}', { p0: item.label })" @click="copyCode(item.value)">
              <span class="w-10 shrink-0 text-neutral-500">{{ t(item.label) }}</span><code class="min-w-0 flex-1 break-all">{{ item.value }}</code>
              <Copy :size="12" class="shrink-0"/>
            </button>
          </div>
          <div class="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <span>{{ t("文字对比度 · 叠加底色") }}</span>
            <select v-model="backdrop" class="tool-field min-w-20 px-2 py-0.5 text-xs" :aria-label="t('半透明叠加底色')">
              <option value="white">{{ t("白色") }}</option>
              <option value="black">{{ t("黑色") }}</option>
            </select>
            <span class="flex items-center gap-1.5" :aria-label="t('当前叠加底色')">
              <span class="h-4 w-4 rounded-sm border border-neutral-400" :style="{ backgroundColor: backdrop }" aria-hidden="true"></span>
              <code>{{ backdrop === "white" ? "#FFFFFF" : "#000000" }}</code>
            </span>
          </div>
          <div class="mt-1 grid grid-cols-2 gap-2">
            <div v-for="ink in inks" :key="ink" class="overflow-hidden rounded border border-neutral-200 text-xs">
              <div class="contrast-backdrop p-1" :style="{ backgroundColor: backdrop }" :aria-label="t('{p0}叠加预览', { p0: ink === 'black' ? t('黑字') : t('白字') })">
                <div class="contrast-sample rounded-sm px-2 py-1" :style="{ backgroundColor: codes.rgba, color: ink }">
                  Aa · {{ ink === "black" ? t("黑色文字") : t("白色文字") }}
                </div>
              </div>
              <p class="bg-surface px-2 py-1 text-neutral-700">{{ contrast[ink].toFixed(2) }}:1 · {{ contrast[ink] >= 4.5 ? t("AA 达标") : t("AA 未达标") }}</p>
            </div>
          </div>
          <p class="mt-1 min-h-8 text-[11px] leading-4 text-neutral-500" aria-live="polite">
            {{
              color.a === 1 ? t("当前不透明度为 100%，颜色会完全遮住底色，对比度不随底色变化。降低左侧不透明度可查看叠加效果。") : t("预览与对比度已按当前不透明度叠加到底色上；切换底色不会修改原始颜色编码。")
            }}
          </p>
          <p class="mt-1 text-[11px] leading-4 text-neutral-500">{{ t("AA 普通文字阈值 4.5:1；安全色不保证对比度。HEX/RGB/HSL 不含透明度，HSV 不是 CSS 函数。") }}</p>
        </section>
      </div>
      <section ref="safePanel" class="flex min-h-0 flex-col overflow-hidden rounded-lg border border-neutral-200 bg-surface" :aria-label="t('Web 安全色区域')">
        <header ref="safeHeader" class="flex shrink-0 flex-wrap items-center justify-between gap-1 border-b border-neutral-200 px-3 py-2">
          <h2 class="text-sm font-semibold">{{ t("Web 安全色 · 全部 216 色") }}</h2>
          <span class="text-xs text-neutral-500">{{ t("常用色置前 · 点击选色恢复不透明") }}</span>
        </header>
        <div ref="safeScroll" class="safe-colors-scroll min-h-0 flex-1 overflow-y-scroll overscroll-contain p-2" :aria-label="t('安全色列表')" tabindex="0">
          <div ref="safeGrid" class="safe-colors-grid">
            <button v-for="item in safeCards" :key="item.hex" type="button"
                    class="relative flex aspect-[3/2] min-w-0 flex-col items-center justify-center rounded-md border border-black/15 text-xs"
                    :style="{ backgroundColor: item.hex, color: item.ink }" :aria-label="t('选择安全色 {p0}', { p0: item.hex })"
                    :aria-pressed="codes.hex === item.hex && color.a === 1" @click="selectColor(item.hex)">
              <Check v-if="codes.hex === item.hex && color.a === 1" :size="12" class="absolute right-1 top-1"/>
              <span v-if="item.name" class="text-[11px]">{{ t(item.name) }}</span><code class="font-medium">{{ item.hex }}</code>
            </button>
          </div>
        </div>
      </section>
    </div>
  </ToolPage>
</template>

<script setup lang="ts">
import {t} from "../i18n/index";
import {computed, nextTick, onActivated, onBeforeUnmount, onDeactivated, onMounted, ref, watch} from "vue";
import {Check, Copy, FolderOpen, RotateCcw, X} from "lucide-vue-next";
import {isTauri} from "@tauri-apps/api/core";
import {writeText} from "@tauri-apps/plugin-clipboard-manager";
import ToolPage from "../components/ToolPage.vue";
import ColorPlane from "../components/ColorPlane.vue";
import ImageColorPicker from "../components/ImageColorPicker.vue";
import {EmptyImagePaletteError, extractImagePalette, type PaletteColor} from "../utils/imagePalette";
import {describeColor, parseHexColor, recommendedColors, textContrast, webSafeColors, type RgbaColor} from "../utils/color";

const color = ref(parseHexColor("#336699"));
const hexInput = ref("#336699");
const status = ref("");
const error = ref("");
const backdrop = ref<"white" | "black">("white");
type PaletteImage = { id: number; file: File; palette: PaletteColor[]; picked: RgbaColor[]; error: string };
const paletteImage = ref<PaletteImage | null>(null);
const paletteCount = ref(8);
const paletteVisible = ref(false);
const paletteBusy = ref(false);
const paletteFileInput = ref<HTMLInputElement | null>(null);
const paletteTrigger = ref<HTMLButtonElement | null>(null);
let paletteRevision = 0;
let nextPaletteId = 0;
watch(paletteCount, refreshPalette);
const safePanel = ref<HTMLElement | null>(null);
const safeHeader = ref<HTMLElement | null>(null);
const safeScroll = ref<HTMLDivElement | null>(null);
const safeGrid = ref<HTMLDivElement | null>(null);
const safeScrollMinHeight = ref(240);
const safePanelMinHeight = ref(280);
let safeResizeObserver: ResizeObserver | null = null;

function measureSafeRows() {
  const card = safeGrid.value?.querySelector("button");
  if (!card || !safeGrid.value || !safeScroll.value || !safeHeader.value || !safePanel.value) return;
  const cardHeight = card.getBoundingClientRect().height;
  if (!cardHeight) return;
  const gridStyle = getComputedStyle(safeGrid.value);
  const scrollStyle = getComputedStyle(safeScroll.value);
  const panelStyle = getComputedStyle(safePanel.value);
  // 色卡宽度随列数变化，按实际卡片高度保留三整行，而不是使用固定的像素高度猜测。
  const minimum = Math.ceil(cardHeight * 3 + parseFloat(gridStyle.rowGap) * 2 + parseFloat(scrollStyle.paddingTop) + parseFloat(scrollStyle.paddingBottom));
  safeScrollMinHeight.value = minimum;
  safePanelMinHeight.value = Math.ceil(minimum + safeHeader.value.getBoundingClientRect().height + parseFloat(panelStyle.borderTopWidth) + parseFloat(panelStyle.borderBottomWidth));
}

function observeSafeRows() {
  measureSafeRows();
  if (safeResizeObserver || !safeGrid.value || !safeHeader.value) return;
  safeResizeObserver = new ResizeObserver(measureSafeRows);
  safeResizeObserver.observe(safeGrid.value);
  safeResizeObserver.observe(safeHeader.value);
}

onMounted(observeSafeRows);
onActivated(observeSafeRows);
onDeactivated(() => {
  safeResizeObserver?.disconnect();
  safeResizeObserver = null;
});
onBeforeUnmount(() => {
  paletteRevision++;
  safeResizeObserver?.disconnect();
});
const channels = ["r", "g", "b"] as const;
const inks = ["black", "white"] as const;
const codes = computed(() => describeColor(color.value));
const contrast = computed(() => textContrast(color.value, backdrop.value));
const safeCards = [...recommendedColors, ...webSafeColors.filter(hex => !recommendedColors.some(item => item.hex === hex)).map(hex => ({name: "", hex}))]
    .map(item => ({...item, ink: textContrast(parseHexColor(item.hex), "white").black >= 4.5 ? "#000000" : "#FFFFFF"}));
const encodings = computed(() => [
  {label: "HEX", value: codes.value.hex}, {label: "HEX8", value: codes.value.hex8},
  {label: "RGB", value: codes.value.rgb}, {label: "RGBA", value: codes.value.rgba},
  {label: "HSL", value: codes.value.hsl}, {label: "HSLA", value: codes.value.hsla}, {label: "HSV", value: codes.value.hsv}
]);
watch(color, () => {
  hexInput.value = color.value.a === 1 ? codes.value.hex : codes.value.hex8;
  status.value = "";
  error.value = "";
}, {deep: true, flush: "sync"});

function selectColor(hex: string) {
  color.value = parseHexColor(hex);
}

function applyHex() {
  try {
    color.value = parseHexColor(hexInput.value);
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : t("颜色格式无效。");
  }
}

function changeChannel(channel: typeof channels[number], event: Event) {
  const input = event.target as HTMLInputElement;
  const value = input.valueAsNumber;
  if (!Number.isInteger(value) || value < 0 || value > 255) {
    input.value = String(color.value[channel]);
    error.value = t("RGB 通道需要是 0～255 的整数。");
    return;
  }
  color.value = {...color.value, [channel]: value};
}

function changeAlpha(event: Event) {
  color.value = {...color.value, a: Number((event.target as HTMLInputElement).value) / 100};
}

async function copyCode(value: string) {
  status.value = "";
  error.value = "";
  try {
    if (isTauri()) await writeText(value);
    else await navigator.clipboard.writeText(value);
    status.value = t("已复制 {p0}", {p0: value});
  } catch {
    error.value = t("复制失败，请检查剪贴板权限。");
  }
}
function showImageColors() {
  if (paletteImage.value) paletteVisible.value = true;
  else paletteFileInput.value?.click();
}

async function hideImageColors() {
  // 隐藏时卸载像素画布，但保留原图及其拾色记录，恢复时按需解码。
  paletteVisible.value = false;
  await nextTick();
  paletteTrigger.value?.focus();
}

function removePaletteImage() {
  paletteRevision++;
  paletteBusy.value = false;
  paletteImage.value = null;
  error.value = "";
  status.value = "";
}

function imageColors(image: PaletteImage) {
  const colors = image.palette.map(item => ({ hex8: item.hex + "FF", color: parseHexColor(item.hex), share: item.share as number | null }));
  const used = new Set(colors.map(item => item.hex8));
  for (const value of image.picked) {
    const hex8 = describeColor(value).hex8;
    if (used.has(hex8)) continue;
    used.add(hex8);
    colors.push({ hex8, color: value, share: null });
  }
  return colors;
}

function applyImageColor(image: PaletteImage, value: RgbaColor) {
  if (paletteImage.value !== image) return;
  const hex8 = describeColor(value).hex8;
  if (!image.picked.some(item => describeColor(item).hex8 === hex8)) image.picked.push({ ...value });
  color.value = { ...value };
  status.value = t('已拾色 {color}', { color: hex8 });
}

async function choosePaletteImage(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (!file || paletteBusy.value) return;
  const id = ++paletteRevision;
  paletteVisible.value = true;
  paletteBusy.value = true;
  error.value = "";
  const image: PaletteImage = { id: ++nextPaletteId, file, palette: [], picked: [], error: "" };
  try {
    try {
      image.palette = await extractImagePalette(file, paletteCount.value);
    } catch (reason) {
      // 完全透明图片仍可手动拾色；无效新图片不会覆盖原图及其拾色记录。
      if (!(reason instanceof EmptyImagePaletteError)) throw reason;
      image.error = '图片完全透明，无法提取配色。';
    }
    if (id !== paletteRevision) return;
    paletteImage.value = image;
  } catch (reason) {
    if (id === paletteRevision) error.value = reason instanceof Error ? reason.message : t('图片配色提取失败。');
  } finally {
    if (id === paletteRevision) paletteBusy.value = false;
  }
}

async function refreshPalette() {
  const image = paletteImage.value;
  if (!image) return;
  const id = ++paletteRevision;
  paletteBusy.value = true;
  try {
    // 只重新计算自动配色，手动拾色记录保持不变。
    const palette = await extractImagePalette(image.file, paletteCount.value);
    if (id !== paletteRevision) return;
    image.palette = palette;
    image.error = "";
  } catch (reason) {
    if (id === paletteRevision) image.error = reason instanceof EmptyImagePaletteError ? '图片完全透明，无法提取配色。' : reason instanceof Error ? reason.message : t('图片配色提取失败。');
  } finally {
    if (id === paletteRevision) paletteBusy.value = false;
  }
}

</script>

<style scoped>
.color-picker-page :deep(.tool-page-content) {
  scrollbar-gutter: stable;
}

/* 拾色打开时，工具栏下方整体滚动，选色工作区保留完整高度，不被长图压缩。 */
.image-color-open :deep(.tool-page-content) {
  overflow-y: auto;
  overflow-x: hidden;
}
.image-color-open .color-workspace {
  flex: 0 0 auto;
  height: calc(max(386px, min(46vh, 480px)) + 12px + var(--safe-panel-min-height));
}

.color-workspace {
  display: grid;
  flex: 1;
  min-height: calc(max(386px, min(46vh, 480px)) + 12px + var(--safe-panel-min-height));
  grid-template-rows: minmax(386px, min(46vh, 480px)) minmax(var(--safe-panel-min-height), 1fr);
  gap: 12px;
  overflow: hidden;
}

.color-controls {
  display: grid;
  min-height: 0;
  grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.05fr);
  gap: 12px;
}

.safe-colors-scroll {
  min-height: var(--safe-scroll-min-height);
  scrollbar-gutter: stable;
}

.safe-colors-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
  gap: 8px;
}

.safe-colors-scroll::-webkit-scrollbar {
  width: 8px;
}

.safe-colors-scroll::-webkit-scrollbar-thumb {
  background: var(--color-neutral-400);
  border: 2px solid var(--app-surface);
  border-radius: 8px;
}

@media (max-width: 640px) {
  .color-controls {
    grid-template-columns: minmax(0, 1fr);
    overflow-y: auto;
  }

  .color-controls > section {
    min-height: 290px;
    overflow: visible;
  }
}

.color-checker {
  background-color: white;
  background-image: conic-gradient(#e5e7eb 25%, transparent 0 50%, #e5e7eb 0 75%, transparent 0);
  background-size: 16px 16px;
}
</style>
