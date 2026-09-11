<template>
  <section class="flex h-full min-h-0 flex-col bg-neutral-100 p-4 sm:p-6">
    <header class="shrink-0"><p class="text-sm font-medium text-neutral-500">{{ route.meta.group }}</p>
      <h1 class="mt-1 text-2xl font-semibold text-neutral-900">{{ route.meta.title }}</h1></header>
    <div class="mt-4 flex min-h-0 flex-1 flex-col gap-4">
      <div class="flex shrink-0 flex-wrap items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2">
        <button class="rounded-md bg-violet-600 px-3 py-1.5 text-sm text-white" type="button" @click="selectDocuments">选择文档</button>
        <button class="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white disabled:opacity-50" type="button" :disabled="documents.length === 0 || converting"
                @click="convertDocuments">{{ converting ? "转换中" : "转换 Markdown" }}
        </button>
        <button class="rounded-md bg-emerald-600 px-3 py-1.5 text-sm text-white disabled:opacity-50" type="button" :disabled="!activeDocument?.markdown" @click="copyMarkdown">
          复制
        </button>
        <button class="rounded-md bg-sky-600 px-3 py-1.5 text-sm text-white disabled:opacity-50" type="button" :disabled="!activeDocument?.markdown" @click="saveMarkdown">保存
          Markdown
        </button>
        <button class="rounded-md bg-red-600 px-3 py-1.5 text-sm text-white" type="button" @click="clearAll">清除</button>
        <p v-if="status" class="ml-auto text-sm text-emerald-700" role="status">{{ status }}</p></div>
      <div ref="splitRoot" class="flex min-h-0 flex-1">
        <section class="flex min-w-0 shrink-0 flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white" :style="{ flexBasis: `${leftPercent}%` }">
          <header class="shrink-0 border-b border-neutral-200 px-3 py-2"><h2 class="text-sm font-medium">文档列表（{{ documents.length }}/10）</h2>
            <p class="mt-0.5 text-xs text-neutral-400">支持 DOCX 和 PDF，点击文档查看对应内容。</p></header>
          <div class="min-h-0 flex-1 overflow-auto p-2">
            <div v-for="(document, index) in documents" :key="document.path" class="mb-1 flex items-center gap-1 rounded-md"
                 :class="activeIndex === index ? 'bg-blue-50 text-blue-700' : 'text-neutral-700 hover:bg-neutral-50'">
              <button class="min-w-0 flex-1 truncate px-3 py-2 text-left text-sm" type="button" @click="activeIndex = index"><span
                  class="mr-2 inline-block w-5 text-right text-xs text-neutral-400">{{ index + 1 }}</span>{{ document.name }}<span v-if="document.error"
                                                                                                                                   class="ml-2 text-xs text-red-600">失败</span><span
                  v-else-if="document.markdown" class="ml-2 text-xs text-emerald-600">完成</span></button>
              <button class="shrink-0 px-2 py-2 text-neutral-400 hover:text-red-600" type="button" :aria-label="`删除 ${document.name}`" @click="removeDocument(index)">
                <Trash2 :size="14"/>
              </button>
            </div>
            <p v-if="documents.length === 0" class="p-3 text-sm text-neutral-400">请选择需要转换的文档。</p></div>
        </section>
        <div class="group flex w-4 shrink-0 cursor-col-resize touch-none items-center justify-center" role="separator" aria-label="调整文档列表和预览宽度" tabindex="0"
             @keydown="handleSeparatorKeydown" @pointerdown="startResize" @pointermove="resize" @pointerup="stopResize" @pointercancel="stopResize"><span
            class="flex h-12 w-3 items-center justify-center rounded-full border border-neutral-300 bg-white text-neutral-400 shadow-sm group-hover:border-blue-400 group-hover:text-blue-600"><GripVertical
            :size="14"/></span></div>
        <section class="flex min-w-0 flex-1 flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white">
          <header class="flex shrink-0 items-center justify-between border-b border-neutral-200 px-3 py-2"><h2 class="min-w-0 truncate text-sm font-medium">
            {{ activeDocument?.name || "Markdown 预览" }}</h2>
            <div class="flex rounded border border-neutral-200 bg-neutral-50 p-0.5">
              <button class="px-2 py-1 text-xs" :class="previewMode === 'rendered' ? 'rounded bg-white text-blue-700 shadow-sm' : 'text-neutral-500'" type="button"
                      @click="previewMode = 'rendered'">预览
              </button>
              <button class="px-2 py-1 text-xs" :class="previewMode === 'raw' ? 'rounded bg-white text-blue-700 shadow-sm' : 'text-neutral-500'" type="button"
                      @click="previewMode = 'raw'">原始
              </button>
            </div>
          </header>
          <div v-if="previewMode === 'rendered'" class="markdown-preview min-h-0 flex-1 overflow-auto p-5" v-html="renderedMarkdown"></div>
          <textarea v-else class="min-h-0 flex-1 resize-none bg-neutral-50 p-5 font-mono text-sm leading-6" aria-label="原始 Markdown" :value="activeDocument?.markdown || ''"
                    readonly placeholder="转换结果会显示在这里"></textarea>
          <p v-if="activeDocument?.error" class="border-t border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{{ activeDocument.error }}</p></section>
      </div>
    </div>
  </section>
</template>
<script setup lang="ts">
import {invoke} from "@tauri-apps/api/core";
import {open, save} from "@tauri-apps/plugin-dialog";
import {writeText} from "@tauri-apps/plugin-clipboard-manager";
import {writeTextFile} from "@tauri-apps/plugin-fs";
import {marked} from "marked";
import {computed, onBeforeUnmount, ref} from "vue";
import {useRoute} from "vue-router";
import {GripVertical, Trash2} from "lucide-vue-next";

type DocumentItem = { path: string; name: string; markdown: string; error: string };
const route = useRoute();
const documents = ref<DocumentItem[]>([]);
const activeIndex = ref(0);
const previewMode = ref<"rendered" | "raw">("rendered");
const status = ref("");
const converting = ref(false);
const leftPercent = ref(35);
const splitRoot = ref<HTMLDivElement | null>(null);
let pointerId: number | null = null;
let handle: HTMLElement | null = null;
const activeDocument = computed(() => documents.value[activeIndex.value]);
const renderedMarkdown = computed(() => activeDocument.value?.markdown ? marked.parse(activeDocument.value.markdown, {async: false}) : "<p class=\"text-sm text-neutral-400\">转换结果会显示在这里</p>");
async function selectDocuments() {
  const selected = await open({title: "选择 DOCX/PDF 文档（最多 10 个）", multiple: true, directory: false, filters: [{name: "文档", extensions: ["docx", "pdf"]}]});
  if (!selected) return;
  const existing = new Set(documents.value.map((document) => document.path));
  const candidates = (Array.isArray(selected) ? selected : [selected]).filter((path) => !existing.has(path));
  const available = Math.max(10 - documents.value.length, 0);
  const added = candidates.slice(0, available).map((path) => ({path, name: path.split(/[\\/]/).pop() || path, markdown: "", error: ""}));
  documents.value.push(...added);
  if (added.length) activeIndex.value = documents.value.length - added.length;
  status.value = candidates.length > available ? `已追加 ${added.length} 个文档，最多支持 10 个` : `已追加 ${added.length} 个文档`;
}
async function convertDocuments() {
  converting.value = true;
  status.value = "";
  for (const document of documents.value) {
    document.markdown = "";
    document.error = "";
    try {
      document.markdown = await invoke<string>("convert_document_to_markdown", {path: document.path});
    } catch (error) {
      document.error = typeof error === "string" ? error : "转换失败，请检查 MarkItDown 环境";
    }
  }
  const failed = documents.value.filter((document) => document.error).length;
  status.value = failed ? `完成 ${documents.value.length - failed} 个，失败 ${failed} 个` : `已转换 ${documents.value.length} 个文档`;
  converting.value = false;
}
async function copyMarkdown() {
  if (!activeDocument.value?.markdown) return;
  await writeText(activeDocument.value.markdown);
  status.value = "已复制到剪贴板";
}
async function saveMarkdown() {
  if (!activeDocument.value?.markdown) return;
  const output = await save({
    title: "保存 Markdown",
    defaultPath: `${activeDocument.value.name.replace(/\.[^.]+$/, "")}.md`,
    filters: [{name: "Markdown 文件", extensions: ["md"]}]
  });
  if (!output) return;
  await writeTextFile(output, activeDocument.value.markdown);
  status.value = "Markdown 已保存";
}
function removeDocument(index: number) {
  documents.value.splice(index, 1);
  if (documents.value.length === 0) activeIndex.value = 0; else if (activeIndex.value >= documents.value.length) activeIndex.value = documents.value.length - 1;
}
function clearAll() {
  if (documents.value.length === 0 || window.confirm(`确定要清除全部 ${documents.value.length} 个文档及其转换结果吗？`)) {
    documents.value = [];
    activeIndex.value = 0;
    status.value = "";
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
<style scoped>.markdown-preview :deep(h1) {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 1rem
}

.markdown-preview :deep(h2) {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 1.25rem 0 .75rem
}

.markdown-preview :deep(h3), .markdown-preview :deep(h4), .markdown-preview :deep(h5), .markdown-preview :deep(h6) {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 1rem 0 .5rem
}

.markdown-preview :deep(p) {
  line-height: 1.7;
  margin: .6rem 0
}

.markdown-preview :deep(ul), .markdown-preview :deep(ol) {
  margin: .6rem 0;
  padding-left: 1.5rem
}

.markdown-preview :deep(ul) {
  list-style: disc
}

.markdown-preview :deep(ol) {
  list-style: decimal
}

.markdown-preview :deep(blockquote) {
  border-left: 3px solid #93c5fd;
  color: #525252;
  margin: .75rem 0;
  padding-left: 1rem
}

.markdown-preview :deep(code) {
  background: #f5f5f5;
  border-radius: 3px;
  padding: .1rem .3rem
}

.markdown-preview :deep(pre) {
  background: #171717;
  border-radius: 6px;
  color: #f5f5f5;
  overflow: auto;
  padding: 1rem
}

.markdown-preview :deep(pre code) {
  background: none;
  padding: 0
}

.markdown-preview :deep(table) {
  border-collapse: collapse;
  margin: 1rem 0;
  min-width: 60%
}

.markdown-preview :deep(th), .markdown-preview :deep(td) {
  border: 1px solid #d4d4d4;
  padding: .5rem .75rem;
  text-align: left
}

.markdown-preview :deep(th) {
  background: #f5f5f5;
  font-weight: 600
}

.markdown-preview :deep(a) {
  color: #2563eb;
  text-decoration: underline
}</style>
