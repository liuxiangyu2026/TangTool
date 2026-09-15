<template>
  <section class="flex h-full min-h-0 flex-col bg-neutral-100 p-4 sm:p-6">
    <ToolNotice :status="status" :error="operationError || activeDocument?.error" />
    <header class="shrink-0">
      <p class="text-sm font-medium text-neutral-500">{{ t(String(route.meta.group ?? '')) }}</p>
      <h1 class="mt-1 text-2xl font-semibold text-neutral-900">{{ t(String(route.meta.title ?? '')) }}</h1>
    </header>
    <div class="mt-4 flex min-h-0 flex-1 flex-col gap-4">
      <div class="grid min-h-[76px] shrink-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-neutral-200 bg-surface px-3 py-2">
        <div class="min-w-0">
          <p class="text-sm font-medium" :class="runtime?.available ? 'text-emerald-600' : 'text-amber-600'">{{ runtimeChecking ? t('正在检测文档组件…') : runtime?.available ? t('文档转换组件已就绪') : t('需要安装文档转换组件') }}</p>
          <p class="mt-1 truncate text-xs text-neutral-500" :title="runtimeDescription">{{ runtimeDescription }}</p>
        </div>
        <div class="flex gap-2">
          <button type="button" class="flex items-center gap-1 rounded-md bg-blue-600 px-2.5 py-1.5 text-xs text-white" @click="openComponentDownload"><Download :size="14" />{{ t('组件安装包') }}</button>
          <button type="button" class="flex items-center gap-1 rounded-md border border-neutral-300 px-2.5 py-1.5 text-xs disabled:opacity-50" :disabled="queueBusy" @click="checkRuntime"><RefreshCw :size="14" />{{ t('重新检测') }}</button>
        </div>
      </div>
      <div class="flex shrink-0 flex-wrap items-center gap-2 rounded-lg border border-neutral-200 bg-surface px-3 py-2">
        <button class="rounded-md bg-violet-600 px-3 py-1.5 text-sm text-white disabled:opacity-50" type="button" :disabled="queueBusy || !runtime?.available" @click="selectDocuments">{{ t('选择文档') }}</button>
        <button class="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white disabled:opacity-50" type="button" :disabled="documents.length === 0 || queueBusy || !runtime?.available"
          @click="convertDocuments">
          {{ converting ? t('转换中') : t('转换 Markdown') }}
        </button>
        <button class="rounded-md bg-emerald-600 px-3 py-1.5 text-sm text-white disabled:opacity-50" type="button" :disabled="!activeDocument?.markdown"
          @click="copyMarkdown">
          {{ t('复制') }}
        </button>
        <button class="rounded-md bg-sky-600 px-3 py-1.5 text-sm text-white disabled:opacity-50" type="button" :disabled="!activeDocument?.markdown || saving" @click="saveMarkdown">
          {{ t('保存 Markdown') }}
        </button>
        <button class="rounded-md bg-red-600 px-3 py-1.5 text-sm text-white disabled:opacity-50" type="button" :disabled="queueBusy" @click="clearAll">{{ t('清除') }}</button>
      </div>
      <div ref="splitRoot" class="flex min-h-0 flex-1">
        <section class="flex min-w-0 shrink-0 flex-col overflow-hidden rounded-lg border border-neutral-200 bg-surface" :style="{ flexBasis: `${leftPercent}%` }">
          <header class="shrink-0 border-b border-neutral-200 px-3 py-2">
            <h2 class="text-sm font-medium">{{ t('文档列表（{p0}/10）', { p0: documents.length }) }}</h2>
            <p class="mt-0.5 text-xs text-neutral-400">{{ t('支持 DOCX 和 PDF，点击文档查看对应内容。') }}</p>
          </header>
          <div class="min-h-0 flex-1 overflow-auto p-2">
            <div v-for="(document, index) in documents" :key="document.path" class="mb-1 flex items-center gap-1 rounded-md"
              :class="activeIndex === index ? 'bg-blue-50 text-blue-700' : 'text-neutral-700 hover:bg-neutral-50'">
              <button class="min-w-0 flex-1 truncate px-3 py-2 text-left text-sm" type="button" @click="activeIndex = index">
                <span class="mr-2 inline-block w-5 text-right text-xs text-neutral-400">{{ index + 1 }}</span>
                {{ document.name }}
                <span v-if="document.error" class="ml-2 text-xs text-red-600">{{ t('失败') }}</span>
                <span v-else-if="document.markdown" class="ml-2 text-xs text-emerald-600">{{ t('完成') }}</span>
              </button>
              <button class="shrink-0 px-2 py-2 text-neutral-400 hover:text-red-600 disabled:opacity-50" type="button" :disabled="queueBusy" :aria-label="t('删除 {p0}', { p0: document.name })" @click="removeDocument(index)">
                <Trash2 :size="14" />
              </button>
            </div>
            <p v-if="documents.length === 0" class="p-3 text-sm text-neutral-400">{{ t('请选择需要转换的文档。') }}</p>
          </div>
        </section>
        <div class="group flex w-4 shrink-0 cursor-col-resize touch-none items-center justify-center" role="separator" :aria-label="t('调整文档列表和预览宽度')" tabindex="0"
          @keydown="handleSeparatorKeydown" @pointerdown="startResize" @pointermove="resize" @pointerup="stopResize" @pointercancel="stopResize">
          <span class="flex h-12 w-3 items-center justify-center rounded-full border border-neutral-300 bg-surface text-neutral-400 shadow-sm group-hover:border-blue-400 group-hover:text-blue-600">
            <GripVertical :size="14" />
          </span>
        </div>
        <section class="flex min-w-0 flex-1 flex-col overflow-hidden rounded-lg border border-neutral-200 bg-surface">
          <header class="flex shrink-0 items-center justify-between border-b border-neutral-200 px-3 py-2">
            <h2 class="min-w-0 truncate text-sm font-medium">
              {{ activeDocument?.name || t('Markdown 预览') }}
            </h2>
            <div class="flex rounded border border-neutral-200 bg-neutral-50 p-0.5">
              <button class="px-2 py-1 text-xs" :class="previewMode === 'rendered' ? 'rounded bg-surface text-blue-700 shadow-sm' : 'text-neutral-500'" type="button"
                @click="previewMode = 'rendered'">
                {{ t('预览') }}
              </button>
              <button class="px-2 py-1 text-xs" :class="previewMode === 'raw' ? 'rounded bg-surface text-blue-700 shadow-sm' : 'text-neutral-500'" type="button"
                @click="previewMode = 'raw'">
                {{ t('原始') }}
              </button>
            </div>
          </header>
          <div v-if="previewMode === 'rendered'" class="markdown-preview min-h-0 flex-1 overflow-auto p-5" v-html="renderedMarkdown"></div>
          <textarea v-else class="min-h-0 flex-1 resize-none bg-neutral-50 p-5 font-mono text-sm leading-6" :aria-label="t('原始 Markdown')"
            :value="activeDocument?.markdown || ''" readonly :placeholder="t('转换结果会显示在这里')"></textarea>
          <p class="shrink-0 border-t border-neutral-100 px-3 py-2 text-xs text-neutral-500">{{ t('预览仅展示排版，不加载图片或打开链接；复制与保存保留原始 Markdown。') }}</p>
        </section>
      </div>
    </div>
  </section>
</template>
<script setup lang="ts">
import { t } from "../i18n/index";
import { errorMessage } from "../i18n/errors";
import runtimeConfig from "../../sidecar/runtime.json";
import { isTauri } from "@tauri-apps/api/core";
import { openUrl } from "@tauri-apps/plugin-opener";
import { usePanelRatio } from "../composables/usePanelRatio";
import { exportDefaults } from "../utils/exportDefaults";
import ToolNotice from "../components/ToolNotice.vue";
import { invoke } from "../utils/invoke";
import { open, save } from "@tauri-apps/plugin-dialog";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { writeTextFile } from "@tauri-apps/plugin-fs";
import { renderMarkdownPreview } from "../utils/markdownPreview";
import { computed, onActivated, onBeforeUnmount, ref } from "vue";
import { useRoute } from "vue-router";
import { Download, GripVertical, RefreshCw, Trash2 } from "lucide-vue-next";

type DocumentItem = { path: string; name: string; markdown: string; error: string };
type RuntimeStatus = { available: boolean; version: string; downloadUrl: string | null; error: unknown };

const route = useRoute();
const documents = ref<DocumentItem[]>([]);
const activeIndex = ref(0);
const previewMode = ref<"rendered" | "raw">("rendered");
const status = ref("");
const operationError = ref("");
const converting = ref(false);
const selecting = ref(false);
const saving = ref(false);
const runtime = ref<RuntimeStatus | null>(null);
const runtimeChecking = ref(false);
const queueBusy = computed(() => converting.value || selecting.value || runtimeChecking.value);
const runtimeDescription = computed(() => {
  if (runtimeChecking.value) return t('安装组件后点击重新检测，无需重启应用。');
  if (runtime.value?.error) return errorMessage(runtime.value.error);
  return runtime.value?.available ? t('组件 v{version} · 仅在本机处理文档', { version: runtime.value.version }) : t('未安装文档转换组件，安装后才能使用此功能');
});
const leftPercent = usePanelRatio("document:left", 35, 25, 55);
const splitRoot = ref<HTMLDivElement | null>(null);
let pointerId: number | null = null;
let handle: HTMLElement | null = null;
const activeDocument = computed(() => documents.value[activeIndex.value]);
const renderedMarkdown = computed(() =>
  activeDocument.value?.markdown
    ? renderMarkdownPreview(activeDocument.value.markdown)
    : renderMarkdownPreview(t('转换结果会显示在这里')),
);

async function checkRuntime() {
  if (queueBusy.value) return;
  runtimeChecking.value = true;
  try {
    if (!isTauri()) {
      runtime.value = { available: false, version: runtimeConfig.version, downloadUrl: null, error: { key: '请在桌面应用中安装和检测文档组件' } };
      return;
    }
    runtime.value = await invoke<RuntimeStatus>('check_document_runtime');
  } catch (error) {
    runtime.value = { available: false, version: runtimeConfig.version, downloadUrl: runtime.value?.downloadUrl ?? null, error };
  } finally {
    runtimeChecking.value = false;
  }
}

async function openComponentDownload() {
  const url = runtime.value?.downloadUrl ?? `https://github.com/liuxiangyu2026/TangTool/releases/tag/${runtimeConfig.release}`;
  try {
    if (isTauri()) await openUrl(url);
    else window.open(url, '_blank', 'noopener,noreferrer');
  } catch {
    operationError.value = t('无法打开浏览器，请到官网下载安装文档组件。');
  }
}

onActivated(checkRuntime);

async function selectDocuments() {
  if (queueBusy.value || !runtime.value?.available) return;
  selecting.value = true;
  operationError.value = "";
  status.value = "";
  try {
    const selected = await open({
      title: t('选择 DOCX/PDF 文档（最多 10 个）'),
      multiple: true,
      directory: false,
      filters: [{ name: t('文档'), extensions: ["docx", "pdf"] }],
    });
    if (!selected) return;
    const existing = new Set(documents.value.map((document) => document.path));
    const uniquePaths = new Set(Array.isArray(selected) ? selected : [selected]);
    const candidates = [...uniquePaths].filter((path) => !existing.has(path));
    const available = Math.max(10 - documents.value.length, 0);
    const added = candidates.slice(0, available).map((path) => ({
      path,
      name: path.split(/[\\/]/).pop() || path,
      markdown: "",
      error: "",
    }));
    documents.value.push(...added);
    if (added.length) activeIndex.value = documents.value.length - added.length;
    status.value = candidates.length > available ? t('已追加 {p0} 个文档，最多支持 10 个', { p0: added.length }) : t('已追加 {p0} 个文档', { p0: added.length });
  } catch {
    operationError.value = t('选择文档失败，请重试。');
  } finally {
    selecting.value = false;
  }
}

async function convertDocuments() {
  if (queueBusy.value || documents.value.length === 0) return;
  await checkRuntime();
  if (!runtime.value?.available) return;
  converting.value = true;
  status.value = "";
  operationError.value = "";
  // 本次任务固定队列；转换期间禁止增删，仍可切换查看已经完成的文档。
  const queue = [...documents.value];
  let failed = 0;
  try {
    for (const document of queue) {
      document.markdown = "";
      document.error = "";
      try {
        document.markdown = await invoke<string>("convert_document_to_markdown", { path: document.path });
      } catch (error) {
        failed += 1;
        document.error = typeof error === "string" ? error : t('转换失败，请检查文档或重新安装文档组件。');
      }
    }
    status.value = failed ? t('完成 {p0} 个，失败 {p1} 个', { p0: queue.length - failed, p1: failed }) : t('已转换 {p0} 个文档', { p0: queue.length });
  } finally {
    converting.value = false;
  }
}

async function copyMarkdown() {
  const markdown = activeDocument.value?.markdown;
  if (!markdown) return;
  operationError.value = "";
  status.value = "";
  try {
    await writeText(markdown);
    status.value = t('已复制到剪贴板');
  } catch {
    operationError.value = t('复制失败，请检查剪贴板权限。');
  }
}

async function saveMarkdown() {
  if (saving.value || !activeDocument.value?.markdown) return;
  // 名称与内容来自同一个快照，保存对话框期间切页、删除或重新转换都不影响本次保存。
  const { name, markdown } = activeDocument.value;
  saving.value = true;
  operationError.value = "";
  status.value = "";
  try {
    const output = await save({
      title: t('保存 Markdown'),
      defaultPath: exportDefaults(`${name.replace(/\.[^.]+$/, "")}.md`).path,
      filters: [{ name: t('Markdown 文件'), extensions: ["md"] }],
    });
    if (!output) {
      status.value = t('已取消保存');
      return;
    }
    await writeTextFile(output, markdown);
    status.value = t('{p0} 的 Markdown 已保存', { p0: name });
  } catch {
    operationError.value = t('{p0} 保存失败，请检查保存位置和可用空间。', { p0: name });
  } finally {
    saving.value = false;
  }
}

function removeDocument(index: number) {
  if (queueBusy.value || index < 0 || index >= documents.value.length) return;
  documents.value.splice(index, 1);
  if (documents.value.length === 0) activeIndex.value = 0;
  else if (index < activeIndex.value) activeIndex.value -= 1;
  else if (activeIndex.value >= documents.value.length) activeIndex.value = documents.value.length - 1;
}

function clearAll() {
  if (queueBusy.value) return;
  if (documents.value.length === 0 || window.confirm(t('确定要清除全部 {p0} 个文档及其转换结果吗？', { p0: documents.value.length }))) {
    documents.value = [];
    activeIndex.value = 0;
    status.value = "";
    operationError.value = "";
  }
}

function startResize(event: PointerEvent) {
  pointerId = event.pointerId;
  handle = event.currentTarget as HTMLElement;
  handle.setPointerCapture(pointerId);
  document.body.style.userSelect = "none";
}

function resize(event: PointerEvent) {
  if (event.pointerId !== pointerId || !splitRoot.value) return;
  const rect = splitRoot.value.getBoundingClientRect();
  leftPercent.value = Math.min(Math.max(((event.clientX - rect.left) / rect.width) * 100, 25), 55);
}

function stopResize() {
  if (pointerId !== null && handle?.hasPointerCapture(pointerId)) handle.releasePointerCapture(pointerId);
  pointerId = null;
  handle = null;
  document.body.style.userSelect = "";
}

function handleSeparatorKeydown(event: KeyboardEvent) {
  if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
  event.preventDefault();
  leftPercent.value = Math.min(Math.max(leftPercent.value + (event.key === "ArrowRight" ? 2 : -2), 25), 55);
}
onBeforeUnmount(stopResize);
</script>
<style scoped>
.markdown-preview :deep(h1) {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 1rem;
}

.markdown-preview :deep(h2) {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 1.25rem 0 0.75rem;
}

.markdown-preview :deep(h3),
.markdown-preview :deep(h4),
.markdown-preview :deep(h5),
.markdown-preview :deep(h6) {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 1rem 0 0.5rem;
}

.markdown-preview :deep(p) {
  line-height: 1.7;
  margin: 0.6rem 0;
}

.markdown-preview :deep(ul),
.markdown-preview :deep(ol) {
  margin: 0.6rem 0;
  padding-left: 1.5rem;
}

.markdown-preview :deep(ul) {
  list-style: disc;
}

.markdown-preview :deep(ol) {
  list-style: decimal;
}

.markdown-preview :deep(blockquote) {
  border-left: 3px solid #93c5fd;
  color: var(--color-neutral-600);
  margin: 0.75rem 0;
  padding-left: 1rem;
}

.markdown-preview :deep(code) {
  background: var(--color-neutral-50);
  border-radius: 3px;
  padding: 0.1rem 0.3rem;
}

.markdown-preview :deep(pre) {
  background: #171717;
  border-radius: 6px;
  color: #f5f5f5;
  overflow: auto;
  padding: 1rem;
}

.markdown-preview :deep(pre code) {
  background: none;
  padding: 0;
}

.markdown-preview :deep(table) {
  border-collapse: collapse;
  margin: 1rem 0;
  min-width: 60%;
}

.markdown-preview :deep(th),
.markdown-preview :deep(td) {
  border: 1px solid var(--color-neutral-300);
  padding: 0.5rem 0.75rem;
  text-align: left;
}

.markdown-preview :deep(th) {
  background: var(--color-neutral-50);
  font-weight: 600;
}

.markdown-preview :deep(a) {
  color: var(--syntax-key);
  text-decoration: underline;
}
</style>
