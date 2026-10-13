<template>
  <ToolPage :description="t('本地将图片制作成多尺寸 Logo / 图标，导出 PNG 或多尺寸 ICO。')" :error="error" :status="status">
    <template #actions>
      <label class="tool-button cursor-pointer bg-violet-600">
        <FolderOpen :size="14" />{{ t('选择图片') }}
        <input type="file" class="sr-only" accept="image/jpeg,image/png,image/webp" :aria-label="t('选择图片文件')" @change="selectFile" />
      </label>
      <button class="tool-button bg-blue-600" type="button" :disabled="!source || busy" @click="generate"><ImageDown :size="14" />{{ busy ? t('处理中') : t('生成预览') }}</button>
      <button class="tool-button bg-emerald-600" type="button" :disabled="!images.length || exporting" @click="exportImages('png')"><Save :size="14" />{{ t('导出 PNG') }}</button>
      <button class="tool-button bg-emerald-600" type="button" :disabled="!images.some(image => image.size <= 256) || exporting" @click="exportImages('ico')"><Save :size="14" />{{ t('导出 ICO') }}</button>
      <button class="tool-button bg-red-600" type="button" @click="clear"><Trash2 :size="14" />{{ t('清除') }}</button>
    </template>
    <div class="tool-panel flex flex-wrap items-center gap-4 text-sm">
      <label class="flex items-center gap-2">{{ t('适配方式') }}
        <select v-model="mode" class="tool-field"><option value="contain">{{ t('完整图片等比留白') }}</option><option value="cover">{{ t('正方形居中裁剪') }}</option></select>
      </label>
      <label class="flex items-center gap-2">{{ t('四周留白') }}<input v-model.number="padding" class="tool-field w-20" type="number" min="0" max="40" />%</label>
      <label class="flex items-center gap-2"><input v-model="transparent" type="checkbox" />{{ t('透明背景') }}</label>
      <label v-if="!transparent" class="flex items-center gap-2">{{ t('背景颜色') }}<input v-model="background" type="color" :aria-label="t('背景颜色')" /></label>
    </div>
    <fieldset class="tool-panel flex flex-wrap gap-3 text-sm">
      <legend class="px-1">{{ t('输出尺寸') }}</legend>
      <label v-for="size in logoSizes" :key="size" class="flex items-center gap-1.5"><input v-model="sizes" type="checkbox" :value="size" />{{ size }} × {{ size }}</label>
    </fieldset>
    <p class="text-xs text-neutral-500">{{ t('透明背景不去除原图底色；小图放大可能模糊。PNG 多尺寸打包 ZIP；ICO 仅包含所选的 16～256px 尺寸。') }}</p>
    <p class="text-xs text-neutral-500">{{ t('支持 JPEG / PNG / WebP，最多 20 MiB、2400 万像素；不保留元数据。ICO 可用于网站及 Windows 图标，不生成 macOS ICNS。') }}</p>
    <SplitPane direction="horizontal" :label="t('调整原图和图标预览宽度')">
      <template #first>
        <div class="tool-panel flex min-h-0 flex-col gap-3">
          <h2 class="break-all text-sm font-medium">{{ source?.name || t('原图') }}</h2>
          <img v-if="sourceUrl" :src="sourceUrl" :alt="t('原图预览')" class="min-h-0 w-full flex-1 object-contain" />
        </div>
      </template>
      <template #second>
        <div class="tool-panel min-h-0 overflow-auto">
          <h2 class="mb-3 text-sm font-medium">{{ t('图标预览') }}</h2>
          <div class="flex flex-wrap items-start gap-4">
            <figure v-for="preview in previews" :key="preview.size" class="flex flex-col items-center gap-2">
              <div class="logo-checkerboard flex items-center justify-center rounded border border-neutral-300 p-2">
                <img :src="preview.url" :alt="t('{size}px 图标预览', { size: preview.size })" :width="Math.min(preview.size, 128)" :height="Math.min(preview.size, 128)" />
              </div>
              <figcaption class="text-xs text-neutral-500">{{ preview.size }} × {{ preview.size }}</figcaption>
            </figure>
          </div>
        </div>
      </template>
    </SplitPane>
  </ToolPage>
</template>

<script setup lang="ts">
import { onActivated, onBeforeUnmount, onDeactivated, ref, shallowRef, watch } from "vue";
import { FolderOpen, ImageDown, Save, Trash2 } from "lucide-vue-next";
import JSZip from "jszip";
import ToolPage from "../components/ToolPage.vue";
import SplitPane from "../components/SplitPane.vue";
import { t } from "../i18n";
import { createLogoIco, generateLogoImages, logoSizes, type LogoImage } from "../utils/logoImage";
import { saveOutput } from "../utils/saveOutput";

const source = shallowRef<File | null>(null);
const sourceUrl = ref("");
const images = shallowRef<LogoImage[]>([]);
const previews = ref<{ size: number; url: string }[]>([]);
const mode = ref<"contain" | "cover">("contain");
const padding = ref(10);
const transparent = ref(true);
const background = ref("#ffffff");
const sizes = ref<number[]>([16, 32, 48, 128, 256, 512]);
const busy = ref(false);
const exporting = ref(false);
const error = ref("");
const status = ref("");
let revision = 0;
let active = true;

function releasePreviews() {
  URL.revokeObjectURL(sourceUrl.value);
  sourceUrl.value = "";
  previews.value.forEach(preview => URL.revokeObjectURL(preview.url));
  previews.value = [];
}

function reset() {
  revision++;
  previews.value.forEach(preview => URL.revokeObjectURL(preview.url));
  previews.value = [];
  images.value = [];
  busy.value = false;
  error.value = "";
  status.value = "";
}

function clear() {
  reset();
  releasePreviews();
  source.value = null;
}

function selectFile(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (!file) return;
  if (!/^image\/(jpeg|png|webp)$/.test(file.type) || !file.size || file.size > 20 * 1024 * 1024) {
    error.value = t('请选择非空且不超过 20 MiB 的 JPEG、PNG 或 WebP 图片。');
    return;
  }
  clear();
  source.value = file;
  sourceUrl.value = URL.createObjectURL(file);
}

async function generate() {
  if (!source.value || busy.value) return;
  reset();
  const id = revision;
  busy.value = true;
  try {
    const result = await generateLogoImages(source.value, { mode: mode.value, padding: padding.value, background: transparent.value ? null : background.value, sizes: [...sizes.value] });
    // 更换图片或设置后的旧结果不能覆盖新输入；切换菜单时保留有效结果。
    if (id !== revision) return;
    images.value = result;
    if (active) previews.value = result.map(image => ({ size: image.size, url: URL.createObjectURL(image.blob) }));
    status.value = t('处理完成，检查预览后另存。');
  } catch (reason) {
    if (id === revision) error.value = reason instanceof Error ? reason.message : t('图片无法解码或压缩。');
  } finally {
    if (id === revision) busy.value = false;
  }
}

async function exportImages(format: "png" | "ico") {
  if (!source.value || !images.value.length || exporting.value) return;
  const snapshot = images.value;
  const name = source.value.name.replace(/\.[^.]+$/, "");
  const id = revision;
  exporting.value = true;
  try {
    let blob: Blob;
    let extension: string;
    let filename: string;
    if (format === "ico") {
      blob = await createLogoIco(snapshot);
      extension = "ico";
      filename = `${name}_logo.ico`;
    } else if (snapshot.length === 1) {
      blob = snapshot[0]!.blob;
      extension = "png";
      filename = `${name}_${snapshot[0]!.size}.png`;
    } else {
      const zip = new JSZip();
      for (const image of snapshot) zip.file(`${name}_${image.size}.png`, await image.blob.arrayBuffer());
      blob = await zip.generateAsync({ type: "blob" });
      extension = "zip";
      filename = `${name}_logo.zip`;
    }
    const data = new Uint8Array(await blob.arrayBuffer());
    if (id !== revision) return;
    const saved = await saveOutput(data, filename, extension, format === "ico" ? "image/vnd.microsoft.icon" : extension === "zip" ? "application/zip" : "image/png");
    if (id === revision) status.value = saved ? t('图片已另存') : t('已取消保存');
  } catch (reason) {
    if (id === revision) error.value = reason instanceof Error ? reason.message : t('保存失败，请检查目标路径。');
  } finally {
    exporting.value = false;
  }
}

watch([mode, padding, transparent, background, sizes], reset, { deep: true, flush: "sync" });
onDeactivated(() => {
  active = false;
  releasePreviews();
});
onActivated(() => {
  active = true;
  if (source.value && !sourceUrl.value) sourceUrl.value = URL.createObjectURL(source.value);
  if (!previews.value.length) previews.value = images.value.map(image => ({ size: image.size, url: URL.createObjectURL(image.blob) }));
});
onBeforeUnmount(clear);
</script>

<style scoped>
/* 棋盘格只用于辨认透明区域，不会写入导出的图片。 */
.logo-checkerboard {
  background-color: #fff;
  background-image: conic-gradient(#e5e7eb 25%, transparent 0 50%, #e5e7eb 0 75%, transparent 0);
  background-size: 16px 16px;
}
</style>
