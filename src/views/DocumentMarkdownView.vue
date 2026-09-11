<template>
  <section class="flex h-full min-h-0 flex-col bg-neutral-100 p-4 sm:p-6">
    <header class="shrink-0"><p class="text-sm font-medium text-neutral-500">{{ route.meta.group }}</p>
      <h1 class="mt-1 text-2xl font-semibold text-neutral-900">{{ route.meta.title }}</h1></header>
    <div class="mt-4 flex min-h-0 flex-1 flex-col gap-4">
      <div class="flex shrink-0 flex-wrap items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2">
        <button class="rounded-md bg-violet-600 px-3 py-1.5 text-sm text-white" type="button" @click="selectDocuments">选择文档</button>
        <button class="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white disabled:opacity-50" type="button" :disabled="paths.length === 0 || converting"
                @click="convertDocuments">{{ converting ? "转换中" : "转换 Markdown" }}
        </button>
        <button class="rounded-md bg-emerald-600 px-3 py-1.5 text-sm text-white disabled:opacity-50" type="button" :disabled="markdown === ''" @click="copyMarkdown">复制</button>
        <button class="rounded-md bg-sky-600 px-3 py-1.5 text-sm text-white disabled:opacity-50" type="button" :disabled="markdown === ''" @click="saveMarkdown">保存 Markdown
        </button>
        <button class="rounded-md bg-red-600 px-3 py-1.5 text-sm text-white" type="button" @click="clearAll">清除</button>
        <p v-if="status" class="ml-auto text-sm text-emerald-700">{{ status }}</p></div>
      <div ref="splitRoot" class="flex min-h-0 flex-1">
        <section class="flex min-w-0 shrink-0 flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white" :style="{ flexBasis: `${leftPercent}%` }">
          <header class="border-b border-neutral-200 px-3 py-2"><h2 class="text-sm font-medium">输入文档（{{ paths.length }}）</h2>
            <p class="mt-0.5 text-xs text-neutral-400">支持 DOCX 和 PDF；可一次选择多个文件。扫描版 PDF、复杂排版和表格可能存在识别误差。</p></header>
          <div class="min-h-0 flex-1 overflow-auto p-3">
            <button class="w-full rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-5 text-left" type="button" @click="selectDocuments"><span
                class="block text-sm font-medium">点击选择多个 DOCX/PDF 文档</span><span class="mt-1 block text-xs text-neutral-500">{{
                fileNames.join("、") || "文件只在本机处理"
              }}</span></button>
          </div>
        </section>
        <div class="group flex w-4 shrink-0 cursor-col-resize touch-none items-center justify-center" role="separator" tabindex="0" aria-label="调整文档和预览宽度"
             @pointerdown="startResize" @pointermove="resize" @pointerup="stopResize" @pointercancel="stopResize"><span
            class="flex h-12 w-3 items-center justify-center rounded-full border border-neutral-300 bg-white text-neutral-400 shadow-sm transition group-hover:border-blue-400 group-hover:text-blue-600"><GripVertical
            :size="14"/></span></div>
        <section class="flex min-w-0 flex-1 flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white">
          <header class="flex items-center justify-between border-b border-neutral-200 px-3 py-2"><h2 class="text-sm font-medium">Markdown 预览</h2>
            <div class="flex rounded border border-neutral-200 bg-neutral-50 p-0.5">
              <button class="px-2 py-1 text-xs" :class="previewMode === 'rendered' ? 'rounded bg-white text-blue-700 shadow-sm' : 'text-neutral-500'" type="button"
                      @click="previewMode = 'rendered'">格式化预览
              </button>
              <button class="px-2 py-1 text-xs" :class="previewMode === 'raw' ? 'rounded bg-white text-blue-700 shadow-sm' : 'text-neutral-500'" type="button"
                      @click="previewMode = 'raw'">原始 Markdown
              </button>
            </div>
          </header>
          <div v-if="previewMode === 'rendered'" class="markdown-preview min-h-0 flex-1 overflow-auto p-5" v-html="renderedMarkdown"></div>
          <textarea v-else class="min-h-0 flex-1 resize-none bg-neutral-50 p-5 font-mono text-sm leading-6" aria-label="原始 Markdown" :value="markdown" readonly
                    placeholder="转换结果会显示在这里"></textarea>
          <p v-if="error" class="border-t border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{{ error }}</p></section>
      </div>
    </div>
  </section>
</template>
<script setup lang="ts">
import {invoke} from "@tauri-apps/api/core";
import {open, save} from "@tauri-apps/plugin-dialog";
import {writeText} from "@tauri-apps/plugin-clipboard-manager";
import {writeTextFile} from "@tauri-apps/plugin-fs";
import {GripVertical} from "lucide-vue-next";
import {computed, onBeforeUnmount, ref} from "vue";
import {useRoute} from "vue-router";

const route = useRoute();
const paths = ref<string[]>([]);
const fileNames = ref<string[]>([]);
const markdown = ref("");
const error = ref("");
const status = ref("");
const previewMode = ref<"rendered" | "raw">("rendered");
const converting = ref(false);
const leftPercent = ref(45);
const splitRoot = ref<HTMLDivElement | null>(null);
let pointerId: number | null = null;
let handle: HTMLElement | null = null;
const renderedMarkdown = computed(() => renderMarkdown(markdown.value));
async function selectDocuments() {
  const selected = await open({title: "选择 DOCX/PDF 文档", multiple: true, directory: false, filters: [{name: "文档", extensions: ["docx", "pdf"]}]});
  if (!selected) return;
  const list = Array.isArray(selected) ? selected : [selected];
  paths.value = list;
  fileNames.value = list.map((path) => path.split(/[\\/]/).pop() || path);
  markdown.value = "";
  error.value = "";
  status.value = `已选择 ${list.length} 个文档`;
}
async function convertDocuments() {
  converting.value = true;
  error.value = "";
  status.value = "";
  const outputs: string[] = [];
  try {
    for (const path of paths.value) {
      outputs.push(`## ${path.split(/[\\/]/).pop() || path}\n\n${await invoke<string>("convert_document_to_markdown", {path})}`);
    }
    markdown.value = outputs.join("\n\n---\n\n");
    status.value = `已转换 ${outputs.length} 个文档`;
  } catch (e) {
    error.value = typeof e === "string" ? e : "文档转换失败，请检查 MarkItDown 和 LibreOffice 环境";
  } finally {
    converting.value = false;
  }
}
async function copyMarkdown() {
  await writeText(markdown.value);
  status.value = "已复制到剪贴板";
}
async function saveMarkdown() {
  const output = await save({title: "保存 Markdown", defaultPath: "document.md", filters: [{name: "Markdown 文件", extensions: ["md"]}]});
  if (!output) return;
  await writeTextFile(output, markdown.value);
  status.value = "Markdown 已保存";
}
function clearAll() {
  paths.value = [];
  fileNames.value = [];
  markdown.value = "";
  error.value = "";
  status.value = "";
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
  leftPercent.value = Math.min(Math.max(((event.clientX - rect.left) / rect.width) * 100, 25), 75);
}
function stopResize() {
  if (pointerId !== null && handle?.hasPointerCapture(pointerId)) handle.releasePointerCapture(pointerId);
  pointerId = null;
  handle = null;
  document.body.style.userSelect = "";
}
onBeforeUnmount(stopResize);
function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function inlineMarkdown(value: string) {
  return value.replace(/`([^`]+)`/g, "<code>$1</code>").replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>").replace(/\*([^*]+)\*/g, "<em>$1</em>");
}
function renderMarkdown(value: string) {
  if (!value) return "<p class=\"text-sm text-neutral-400\">转换结果会显示在这里</p>";
  const lines = value.split("\n");
  const blocks: string[] = [];
  let index = 0;
  while (index < lines.length) {
    const line = lines[index];
    if (/^#{1,6}\s/.test(line)) {
      const level = line.match(/^#+/)![0].length;
      blocks.push(`<h${level}>${inlineMarkdown(escapeHtml(line.slice(level + 1)))}</h${level}>`);
      index++;
      continue;
    }
    if (/^\|.*\|$/.test(line) && index + 1 < lines.length && /^\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)+\|?$/.test(lines[index + 1])) {
      const cells = (row: string, tag: string) => row.split("|").slice(1, -1).map((cell) => `<${tag}>${inlineMarkdown(escapeHtml(cell.trim()))}</${tag}>`).join("");
      const header = `<tr>${cells(line, "th")}</tr>`;
      index += 2;
      const body: string[] = [];
      while (index < lines.length && /^\|.*\|$/.test(lines[index])) body.push(`<tr>${cells(lines[index++], "td")}</tr>`);
      blocks.push(`<table><thead>${header}</thead><tbody>${body.join("")}</tbody></table>`);
      continue;
    }
    if (/^[-*]\s/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^[-*]\s/.test(lines[index])) items.push(`<li>${inlineMarkdown(escapeHtml(lines[index++].slice(2)))}</li>`);
      blocks.push(`<ul>${items.join("")}</ul>`);
      continue;
    }
    if (/^>\s?/.test(line)) {
      blocks.push(`<blockquote>${inlineMarkdown(escapeHtml(line.replace(/^>\s?/, "")))}</blockquote>`);
      index++;
      continue;
    }
    if (line.trim() === "") {
      index++;
      continue;
    }
    const paragraph: string[] = [];
    while (index < lines.length && lines[index].trim() !== "" && !/^#{1,6}\s|^[-*]\s|^>|^\|.*\|$/.test(lines[index])) paragraph.push(lines[index++]);
    blocks.push(`<p>${inlineMarkdown(escapeHtml(paragraph.join("\n")).replace(/\n/g, "<br>"))}</p>`);
  }
  return blocks.join("");
}
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

.markdown-preview :deep(h3) {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 1rem 0 .5rem
}

.markdown-preview :deep(p) {
  line-height: 1.7;
  margin: .6rem 0
}

.markdown-preview :deep(ul) {
  list-style: disc;
  margin: .6rem 0;
  padding-left: 1.5rem
}</style>
