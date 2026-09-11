<template>
  <section class="flex h-full min-h-0 flex-col bg-neutral-100 p-4 sm:p-6">
    <header class="shrink-0"><p class="text-sm font-medium text-neutral-500">{{ route.meta.group }}</p><h1 class="mt-1 text-2xl font-semibold text-neutral-900">{{ route.meta.title }}</h1></header>
    <div class="mt-4 flex min-h-0 flex-1 flex-col gap-4">
      <div class="flex shrink-0 flex-wrap items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2">
        <button class="flex items-center gap-1.5 rounded-md bg-violet-600 px-3 py-1.5 text-sm text-white" type="button" @click="selectDocument"><FolderOpen :size="14" />选择文档</button>
        <button class="flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white disabled:opacity-50" type="button" :disabled="filePath === '' || isConverting" @click="convertDocument"><RefreshCw :size="14" :class="isConverting ? 'animate-spin' : ''" />{{ isConverting ? '转换中' : '转换 Markdown' }}</button>
        <button class="flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-sm text-white disabled:opacity-50" type="button" :disabled="markdown === ''" @click="copyMarkdown"><Copy :size="14" />复制</button>
        <button class="flex items-center gap-1.5 rounded-md bg-sky-600 px-3 py-1.5 text-sm text-white disabled:opacity-50" type="button" :disabled="markdown === ''" @click="saveMarkdown"><Save :size="14" />保存 Markdown</button>
        <button class="flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-1.5 text-sm text-white" type="button" @click="clearAll"><Trash2 :size="14" />清除</button>
        <p v-if="status" class="ml-auto text-sm text-emerald-700" role="status">{{ status }}</p>
      </div>
      <div class="grid min-h-0 flex-1 gap-4 lg:grid-cols-2">
        <section class="flex min-h-0 flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white"><header class="shrink-0 border-b border-neutral-200 px-3 py-2"><h2 class="text-sm font-medium">输入文档</h2><p class="mt-0.5 text-xs text-neutral-400">支持 DOCX 和 PDF。扫描版 PDF、复杂排版和表格可能存在识别误差。</p></header><button class="m-4 rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-6 text-left transition hover:border-blue-400 hover:bg-blue-50" type="button" @click="selectDocument" @dragover.prevent @drop.prevent="handleDrop"><span class="block text-sm font-medium">{{ fileName || '点击选择或拖放 DOCX/PDF 文件' }}</span><span class="mt-1 block text-xs text-neutral-500">{{ fileName ? '点击重新选择' : '文件只在本机处理' }}</span></button></section>
        <section class="flex min-h-0 flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white"><header class="shrink-0 border-b border-neutral-200 px-3 py-2"><h2 class="text-sm font-medium">Markdown 预览</h2></header><textarea class="min-h-0 flex-1 resize-none bg-neutral-50 p-3 font-mono text-sm leading-6" aria-label="Markdown 预览" :value="markdown" readonly placeholder="转换结果会显示在这里"></textarea><p v-if="error" class="shrink-0 border-t border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{{ error }}</p></section>
      </div>
    </div>
  </section>
</template>
<script setup lang="ts">
import { invoke } from "@tauri-apps/api/core";
import { open, save } from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { Copy, FolderOpen, RefreshCw, Save, Trash2 } from "lucide-vue-next";
import { ref } from "vue";
import { useRoute } from "vue-router";
const route = useRoute(); const filePath = ref(""); const fileName = ref(""); const markdown = ref(""); const error = ref(""); const status = ref(""); const isConverting = ref(false);
async function selectDocument() { const selected = await open({ title: "选择 DOCX 或 PDF 文件", multiple: false, directory: false, filters: [{ name: "文档", extensions: ["docx", "pdf"] }] }); if (typeof selected === "string") { filePath.value = selected; fileName.value = selected.split(/[\\/]/).pop() || selected; markdown.value = ""; error.value = ""; status.value = "已选择文档"; } }
async function convertDocument() { isConverting.value = true; error.value = ""; status.value = ""; try { markdown.value = await invoke<string>("convert_document_to_markdown", { path: filePath.value }); status.value = "转换完成"; } catch (e) { markdown.value = ""; error.value = typeof e === "string" ? e : "文档转换失败，请检查 MarkItDown 环境"; } finally { isConverting.value = false; } }
async function copyMarkdown() { await writeText(markdown.value); status.value = "已复制到剪贴板"; }
async function saveMarkdown() { const output = await save({ title: "保存 Markdown", defaultPath: `${fileName.value.replace(/\.[^.]+$/, "") || "document"}.md`, filters: [{ name: "Markdown 文件", extensions: ["md"] }] }); if (!output) return; try { await writeTextFile(output, markdown.value); status.value = "Markdown 已保存"; } catch { error.value = "保存 Markdown 失败，请确认目标位置可写"; } }
function handleDrop(event: DragEvent) { const file = event.dataTransfer?.files[0]; if (!file) return; error.value = "浏览器拖放只提供文件名，桌面窗口请使用选择文件按钮"; }
function clearAll() { filePath.value = ""; fileName.value = ""; markdown.value = ""; error.value = ""; status.value = ""; }
</script>
