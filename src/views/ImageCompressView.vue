<template>
  <ToolPage :description="t('单张 JPEG / PNG / WebP 转 JPEG 或 WebP，可调质量和尺寸。默认另存为新文件，不放大原图；动画仅保留首帧，元数据不保留。')" :error="error" :status="status">
    <template #actions>
      <label class="tool-button cursor-pointer bg-violet-600">
        <FolderOpen :size="14" />
        {{ t('选择图片') }}
        <input type="file" class="sr-only" accept="image/jpeg,image/png,image/webp" :aria-label="t('选择图片文件')" @change="selectFile" />
      </label>
      <button class="tool-button bg-blue-600" type="button" :disabled="!source || busy" @click="run">
        <ImageDown :size="14" />
        {{ busy ? t('压缩中') : t('压缩') }}
      </button>
      <button class="tool-button bg-emerald-600" type="button" :disabled="!result" @click="exportImage">
        <Save :size="14" />
        {{ t('另存图片') }}
      </button>
      <button class="tool-button bg-red-600" type="button" @click="clear">
        <Trash2 :size="14" />
        {{ t('清除') }}
      </button>
    </template>
    <div class="tool-panel flex flex-wrap items-center gap-4 text-sm">
      <label class="flex items-center gap-2">
        {{ t('输出') }}
        <select v-model="format" class="tool-field">
          <option value="image/jpeg">{{ t('JPEG（白底）') }}</option>
          <option value="image/webp">{{ t('WebP（保留透明）') }}</option>
        </select>
      </label>
      <label class="flex items-center gap-2">
        {{ t('质量') }}
        <input v-model.number="quality" type="range" min="10" max="100" class="w-24" />
        <input v-model.number="quality" type="number" min="10" max="100" class="tool-field w-20" />
      </label>
      <label class="flex items-center gap-2">
        {{ t('最长边') }}
        <input v-model.number="maxEdge" type="number" min="64" max="8192" class="tool-field w-28" />
        px
      </label>
    </div>
    <p class="text-xs text-neutral-500">{{ t('JPEG / WebP 为有损压缩；质量越高不一定体积越小。文件最多 20 MiB、2400 万像素。保存前请检查预览。') }}</p>
    <SplitPane direction="horizontal" :label="t('调整原图和压缩预览宽度')">
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
          <h2 class="text-sm font-medium">{{ t('压缩结果') }}</h2>
          <p v-if="result" class="text-xs text-neutral-500">{{ formatBytes(result.blob.size) }} · {{ result.width }} × {{ result.height }} · {{ sizeMessage }}</p>
          <img v-if="resultUrl" :src="resultUrl" :alt="t('压缩结果预览')" class="min-h-0 w-full flex-1 object-contain" />
        </div>
      </template>
    </SplitPane>
  </ToolPage>
</template>

<script setup lang="ts">
import { t } from "../i18n/index";
import SplitPane from "../components/SplitPane.vue";
import { computed, onBeforeUnmount, ref, shallowRef, watch } from "vue";
import { FolderOpen, ImageDown, Save, Trash2 } from "lucide-vue-next";
import ToolPage from "../components/ToolPage.vue";
import { compressImage, type CompressionResult } from "../utils/imageCompression";
import { saveOutput } from "../utils/saveOutput";

const source = shallowRef<File | null>(null);
const sourceUrl = ref("");
const result = shallowRef<CompressionResult | null>(null);
const resultUrl = ref("");
const format = ref<"image/jpeg" | "image/webp">("image/jpeg");
const quality = ref(82);
const maxEdge = ref(3200);
const error = ref("");
const status = ref("");
const busy = ref(false);
let revision = 0;
const sizeMessage = computed(() => {
  if (!source.value || !result.value) return "";
  const reduction = 1 - result.value.blob.size / source.value.size;
  return reduction > 0 ? t('减少 {p0}%', { p0: (reduction * 100).toFixed(1) }) : t('体积未减小，建议保留原图');
});
watch([format, quality, maxEdge], reset, { flush: "sync" });
onBeforeUnmount(clear);

function reset() {
  revision++;
  URL.revokeObjectURL(resultUrl.value);
  resultUrl.value = "";
  result.value = null;
  error.value = "";
  status.value = "";
  busy.value = false;
}

function clear() {
  reset();
  URL.revokeObjectURL(sourceUrl.value);
  sourceUrl.value = "";
  source.value = null;
}

function selectFile(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (!file) return;
  clear();
  if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size > 20 * 1024 * 1024 || file.size === 0) {
    error.value = t('请选择非空且不超过 20 MiB 的 JPEG、PNG 或 WebP 图片。');
    return;
  }
  source.value = file;
  sourceUrl.value = URL.createObjectURL(file);
}

async function run() {
  if (!source.value) return;
  reset();
  const id = revision;
  busy.value = true;
  try {
    const value = await compressImage(source.value, { format: format.value, quality: quality.value, maxEdge: maxEdge.value });
    if (id !== revision) return;
    result.value = value;
    resultUrl.value = URL.createObjectURL(value.blob);
    status.value = t('处理完成，检查预览后另存。');
  } catch (reason) {
    if (id === revision) error.value = reason instanceof Error ? reason.message : t('图片无法解码或压缩。');
  } finally {
    if (id === revision) busy.value = false;
  }
}

async function exportImage() {
  if (!source.value || !result.value) return;
  const blob = result.value.blob;
  const extension = blob.type === "image/jpeg" ? "jpg" : "webp";
  const name = `${source.value.name.replace(/\.[^.]+$/, "")}_compressed.${extension}`;
  try {
    const saved = await saveOutput(new Uint8Array(await blob.arrayBuffer()), name, extension, blob.type);
    status.value = saved ? t('图片已另存') : t('已取消保存');
  } catch {
    error.value = t('保存失败，请检查目标路径。');
  }
}

function formatBytes(bytes: number) {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(2)} MiB` : `${(bytes / 1024).toFixed(1)} KiB`;
}
</script>
