<template>
  <ToolPage :description="t('批量 JPEG / PNG / WebP / BMP / ICO / GIF 本地互转，最多 50 张。统一参数，逐张处理；动画只取首帧，不保留元数据。')" :error="error" :status="status">
    <template #actions>
      <label class="tool-button cursor-pointer bg-violet-600">
        <FolderOpen :size="14" />
        {{ t('添加图片') }}
        <input type="file" multiple :disabled="busy || selecting || exporting" class="sr-only" accept=".jpg,.jpeg,.png,.webp,.bmp,.ico,.gif,image/jpeg,image/png,image/webp,image/bmp,image/gif,image/x-icon,image/vnd.microsoft.icon" :aria-label="t('选择图片文件')" @change="selectFile" />
      </label>
      <button class="tool-button bg-blue-600" type="button" :disabled="!entries.length || busy || selecting" @click="run">
        <ImageDown :size="14" />
        {{ busy ? t('处理中') : t('处理全部') }}
      </button>
      <button class="tool-button bg-emerald-600" type="button" :disabled="!result || exporting || busy" @click="exportImage">
        <Save :size="14" />
        {{ t('另存图片') }}
      </button>
      <button class="tool-button bg-indigo-600" type="button" :disabled="!completed.length || exporting || busy" @click="exportAll"><Archive :size="14" />{{ t('导出 ZIP') }}</button>
      <button v-if="busy" class="tool-button bg-orange-600" type="button" @click="stop"><Square :size="14" />{{ t('停止') }}</button>
      <button class="tool-button bg-red-600" type="button" :disabled="busy || selecting || exporting" @click="clear">
        <Trash2 :size="14" />
        {{ t('清除') }}
      </button>
    </template>
    <fieldset :disabled="busy || selecting || exporting" class="tool-panel flex flex-wrap items-center gap-4 text-sm">
      <label class="flex items-center gap-2">
        {{ t('输出') }}
        <select v-model="format" class="tool-field">
          <option value="image/jpeg">{{ t('JPEG（白底）') }}</option>
          <option value="image/png">{{ t('PNG（保留透明）') }}</option>
          <option value="image/webp">{{ t('WebP（保留透明）') }}</option>
          <option value="image/bmp">{{ t('BMP（白底）') }}</option>
          <option value="image/gif">{{ t('GIF（静态，256 色）') }}</option>
          <option value="image/vnd.microsoft.icon">ICO</option>
        </select>
      </label>
      <label v-if="format === 'image/jpeg' || format === 'image/webp'" class="flex items-center gap-2">
        {{ t('质量') }}
        <input v-model.number="quality" type="range" min="10" max="100" class="w-24" />
        <input v-model.number="quality" type="number" min="10" max="100" class="tool-field w-20" />
      </label>
      <label v-if="format !== 'image/vnd.microsoft.icon'" class="flex items-center gap-2"><input v-model="keepOriginal" type="checkbox" />{{ t('保持原尺寸') }}</label>
      <label v-if="format !== 'image/vnd.microsoft.icon' && !keepOriginal" class="flex items-center gap-2">
        {{ t('最长边') }}
        <input v-model.number="maxEdge" type="number" min="64" max="8192" class="tool-field w-28" />
        px
      </label>
      <label v-if="format === 'image/vnd.microsoft.icon'" class="flex items-center gap-2">{{ t('图标尺寸') }}
        <select v-model.number="icoSize" class="tool-field"><option v-for="size in [16, 24, 32, 48, 64, 128, 256]" :key="size" :value="size">{{ size }} × {{ size }}</option></select>
      </label>
    </fieldset>
    <p v-if="format === 'image/vnd.microsoft.icon'" class="text-xs text-neutral-500">{{ t('ICO 等比缩小并居中留白，不放大原图；需要多尺寸 ICO 请使用 Logo / 图标制作。') }}</p>
    <p class="text-xs text-neutral-500">{{ t('JPEG / WebP 可调有损质量；PNG / ICO 保留透明；BMP 为白底；GIF 最多 256 色，半透明按阈值转为透明或不透明。体积可能增大，最多 20 MiB、2400 万像素。') }}</p>
    <div v-if="entries.length" class="tool-panel max-h-48 shrink-0 overflow-auto text-xs">
      <p class="mb-2 text-neutral-500">{{ t('已添加 {count} 张，完成 {done} 张；输入和结果各最多 200 MiB，重名导出自动编号。', { count: entries.length, done: completed.length }) }}</p>
      <div v-for="(entry, index) in entries" :key="entry.id" class="flex items-center gap-3 border-t border-neutral-200 py-1.5">
        <button class="min-w-0 flex-1 truncate text-left" :class="index === activeIndex ? 'font-semibold text-blue-600' : ''" type="button" @click="activeIndex = index">{{ entry.file.name }}</button>
        <span>{{ formatBytes(entry.file.size) }}</span>
        <span :class="entry.state === 'failed' ? 'text-red-600' : 'text-neutral-500'" :title="entry.error">{{ t(stateLabels[entry.state]) }}</span>
        <button class="text-neutral-500 disabled:opacity-50" type="button" :disabled="busy || selecting || exporting" :aria-label="t('移除 {name}', { name: entry.file.name })" @click="remove(index)"><X :size="14" /></button>
      </div>
      <p v-if="activeEntry?.error" class="mt-2 break-all text-red-600">{{ activeEntry.error }}</p>
    </div>
    <SplitPane direction="horizontal" :label="t('调整原图和处理预览宽度')">
      <template #first>
        <div class="tool-panel flex min-h-0 flex-col gap-3">
          <h2 class="break-all text-sm font-medium">{{ source?.name || t('原图') }}</h2>
          <p v-if="source" class="text-xs text-neutral-500">
            {{ formatBytes(source.size) }}
            <span v-if="result">· {{ result.originalWidth }} × {{ result.originalHeight }}</span>
          </p>
          <img v-if="sourceUrl" :src="sourceUrl" :alt="t('原图预览')" class="min-h-0 w-full flex-1 object-contain" />
        </div>
      </template>
      <template #second>
        <div class="tool-panel flex min-h-0 flex-col gap-3">
          <h2 class="text-sm font-medium">{{ t('处理结果') }}</h2>
          <p v-if="result" class="text-xs text-neutral-500">{{ formatBytes(result.blob.size) }} · {{ result.width }} × {{ result.height }} · {{ sizeMessage }}</p>
          <img v-if="resultUrl" :src="resultUrl" :alt="t('处理结果预览')" class="min-h-0 w-full flex-1 object-contain" />
        </div>
      </template>
    </SplitPane>
  </ToolPage>
</template>

<script setup lang="ts">
import { t } from "../i18n/index";
import SplitPane from "../components/SplitPane.vue";
import { computed, onActivated, onBeforeUnmount, onDeactivated, ref, watch } from "vue";
import { Archive, FolderOpen, ImageDown, Save, Square, Trash2, X } from "lucide-vue-next";
import JSZip from "jszip";
import ToolPage from "../components/ToolPage.vue";
import { compressImage, imageExtensions, readImageFile, type ImageFormat, type CompressionResult } from "../utils/imageCompression";
import { saveOutput } from "../utils/saveOutput";

type Entry = { id: number; file: File; state: "pending" | "processing" | "done" | "failed"; result: CompressionResult | null; error: string };
const entries = ref<Entry[]>([]);
const activeIndex = ref(0);
const activeEntry = computed(() => entries.value[activeIndex.value]);
const source = computed(() => activeEntry.value?.file ?? null);
const result = computed(() => activeEntry.value?.result ?? null);
const completed = computed(() => entries.value.filter(entry => entry.result !== null));
const stateLabels = { pending: "待处理", processing: "处理中", done: "已完成", failed: "失败" };
const sourceUrl = ref("");
const resultUrl = ref("");
const format = ref<ImageFormat>("image/jpeg");
const quality = ref(82);
const maxEdge = ref(3200);
const keepOriginal = ref(true);
const icoSize = ref(256);
const error = ref("");
const status = ref("");
const busy = ref(false);
const selecting = ref(false);
const exporting = ref(false);
let nextId = 0;
let revision = 0;
let controller: AbortController | undefined;
let pageActive = true;
const sizeMessage = computed(() => {
  if (!source.value || !result.value) return "";
  const reduction = 1 - result.value.blob.size / source.value.size;
  return reduction > 0 ? t('减少 {p0}%', { p0: (reduction * 100).toFixed(1) }) : t('体积未减小，仍可保存转换结果');
});
watch([format, quality, maxEdge, keepOriginal, icoSize], reset, { flush: "sync" });
watch([source, result], refreshPreviews, { flush: "sync" });
onBeforeUnmount(clear);
onDeactivated(() => {
  pageActive = false;
  releasePreviews();
});
onActivated(() => {
  pageActive = true;
  refreshPreviews();
});

function releasePreviews() {
  URL.revokeObjectURL(sourceUrl.value);
  URL.revokeObjectURL(resultUrl.value);
  sourceUrl.value = "";
  resultUrl.value = "";
}

function refreshPreviews() {
  releasePreviews();
  if (!pageActive) return;
  if (source.value) sourceUrl.value = URL.createObjectURL(source.value);
  if (result.value) resultUrl.value = URL.createObjectURL(result.value.preview);
}

function stop() {
  controller?.abort();
  revision++;
  busy.value = false;
  for (const entry of entries.value) if (entry.state === "processing") entry.state = "pending";
}

function reset() {
  stop();
  for (const entry of entries.value) {
    entry.result = null;
    entry.state = "pending";
    entry.error = "";
  }
  error.value = "";
  status.value = "";
}

function clear() {
  stop();
  entries.value = [];
  activeIndex.value = 0;
  releasePreviews();
  error.value = "";
  status.value = "";
}

function remove(index: number) {
  if (busy.value || selecting.value || exporting.value) return;
  entries.value.splice(index, 1);
  if (index < activeIndex.value) activeIndex.value--;
  activeIndex.value = Math.max(0, Math.min(activeIndex.value, entries.value.length - 1));
}

async function selectFile(event: Event) {
  const input = event.target as HTMLInputElement;
  const files = [...(input.files ?? [])];
  input.value = "";
  if (!files.length || busy.value || selecting.value) return;
  const id = revision;
  selecting.value = true;
  error.value = "";
  const failures: string[] = [];
  let total = entries.value.reduce((bytes, entry) => bytes + entry.file.size, 0);
  try {
    for (const file of files) {
      if (id !== revision) return;
      if (entries.value.some(entry => entry.file.name === file.name && entry.file.size === file.size && entry.file.lastModified === file.lastModified)) continue;
      if (entries.value.length >= 50 || total + file.size > 200 * 1024 * 1024) {
        failures.push(t('最多 50 张图片，总输入不超过 200 MiB。'));
        break;
      }
      try {
        const blob = await readImageFile(file);
        if (id !== revision) return;
        // 标准化 MIME，切换页面后重建预览仍能正确识别 BMP / ICO。
        const normalized = new File([blob], file.name, { type: blob.type, lastModified: file.lastModified });
        entries.value.push({ id: ++nextId, file: normalized, state: "pending", result: null, error: "" });
        total += file.size;
      } catch (reason) {
        failures.push(`${file.name}: ${reason instanceof Error ? reason.message : t('读取文件失败。')}`);
      }
    }
    if (id === revision) error.value = failures.join("\n");
  } finally {
    selecting.value = false;
  }
}

async function run() {
  if (!entries.value.length || busy.value || selecting.value) return;
  reset();
  const id = revision;
  const abort = new AbortController();
  controller = abort;
  busy.value = true;
  let resultBytes = 0;
  const options = { format: format.value, quality: quality.value, maxEdge: maxEdge.value, keepOriginal: keepOriginal.value, icoSize: icoSize.value };
  try {
    // 一次仅解码/绘制一张图片，失败继续下一张；不并发分配多张大画布。
    for (const entry of entries.value) {
      if (id !== revision) return;
      entry.state = "processing";
      try {
        const value = await compressImage(entry.file, options, abort.signal);
        if (id !== revision) return;
        const bytes = value.blob.size + (value.preview === value.blob ? 0 : value.preview.size);
        if (resultBytes + bytes > 200 * 1024 * 1024) throw new Error(t('结果总量超过 200 MiB，请减少图片或缩小尺寸。'));
        entry.result = value;
        resultBytes += bytes;
        entry.state = "done";
      } catch (reason) {
        if (id !== revision) return;
        entry.error = reason instanceof Error ? reason.message : t('图片无法解码或压缩。');
        entry.state = "failed";
      }
    }
    if (id === revision) status.value = t('处理完成：成功 {done} 张，失败 {failed} 张。', { done: completed.value.length, failed: entries.value.filter(entry => entry.state === "failed").length });
  } finally {
    if (id === revision) busy.value = false;
  }
}

async function exportImage() {
  if (!source.value || !result.value || exporting.value || busy.value) return;
  const id = revision;
  const blob = result.value.blob;
  const extension = imageExtensions[blob.type as ImageFormat];
  const name = `${source.value.name.replace(/\.[^.]+$/, "")}_converted.${extension}`;
  exporting.value = true;
  try {
    const data = new Uint8Array(await blob.arrayBuffer());
    if (id !== revision) return;
    const saved = await saveOutput(data, name, extension, blob.type);
    if (id === revision) status.value = saved ? t('图片已另存') : t('已取消保存');
  } catch {
    if (id === revision) error.value = t('保存失败，请检查目标路径。');
  } finally {
    exporting.value = false;
  }
}

async function exportAll() {
  if (!completed.value.length || exporting.value || busy.value) return;
  const id = revision;
  const snapshot = completed.value.map(entry => ({ name: entry.file.name, blob: entry.result!.blob }));
  exporting.value = true;
  try {
    const zip = new JSZip();
    const used = new Set<string>();
    for (const entry of snapshot) {
      const extension = imageExtensions[entry.blob.type as ImageFormat];
      // ZIP 内仅写安全的单层文件名，跨目录重名及大小写冲突也自动避让。
      const base = entry.name.replace(/\.[^.]+$/, "").replace(/[\\/:*?"<>|\x00-\x1f]/g, "_").replace(/^\.+$/, "image") || "image";
      let name = `${base}_converted.${extension}`;
      let suffix = 2;
      while (used.has(name.toLowerCase())) name = `${base}_converted_${suffix++}.${extension}`;
      used.add(name.toLowerCase());
      zip.file(name, await entry.blob.arrayBuffer());
    }
    const data = await zip.generateAsync({ type: "uint8array" });
    if (id !== revision) return;
    const saved = await saveOutput(data, "converted_images.zip", "zip", "application/zip");
    if (id === revision) status.value = saved ? t('已保存') : t('已取消保存');
  } catch {
    if (id === revision) error.value = t('保存失败，请检查目标路径。');
  } finally {
    exporting.value = false;
  }
}

function formatBytes(bytes: number) {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(2)} MiB` : `${(bytes / 1024).toFixed(1)} KiB`;
}
</script>
