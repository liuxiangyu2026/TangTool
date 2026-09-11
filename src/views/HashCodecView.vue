<template>
  <section class="flex h-full min-h-0 flex-col bg-neutral-100 p-4 sm:p-6">
    <header class="shrink-0">
      <p class="text-sm font-medium text-neutral-500">{{ route.meta.group }}</p>
      <h1 class="mt-1 text-2xl font-semibold text-neutral-900">{{ route.meta.title }}</h1>
      <div class="mt-4 inline-flex rounded-md border border-neutral-200 bg-white p-1" role="tablist" aria-label="编码工具模式">
        <button class="flex items-center gap-1.5 rounded px-3 py-1.5 text-sm font-medium transition" :class="mode === 'url' ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:bg-neutral-100'" type="button" role="tab" :aria-selected="mode === 'url'" @click="mode = 'url'">
          <Link2 :size="14" aria-hidden="true" />
          <span>URL 编码</span>
        </button>
        <button class="flex items-center gap-1.5 rounded px-3 py-1.5 text-sm font-medium transition" :class="mode === 'md5' ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:bg-neutral-100'" type="button" role="tab" :aria-selected="mode === 'md5'" @click="mode = 'md5'">
          <Hash :size="14" aria-hidden="true" />
          <span>文本 MD5</span>
        </button>
        <button class="flex items-center gap-1.5 rounded px-3 py-1.5 text-sm font-medium transition" :class="mode === 'file-md5' ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:bg-neutral-100'" type="button" role="tab" :aria-selected="mode === 'file-md5'" @click="mode = 'file-md5'">
          <FileText :size="14" aria-hidden="true" />
          <span>文件 MD5</span>
        </button>
      </div>
    </header>

    <div v-if="mode === 'url'" class="mt-4 flex min-h-0 flex-1 flex-col gap-4">
      <div class="flex shrink-0 flex-wrap items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2">
        <button class="flex items-center gap-1.5 rounded-md bg-violet-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2" type="button" @click="loadUrlExample">
          <BookOpen :size="14" aria-hidden="true" />
          <span>示例</span>
        </button>
        <button class="flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2" type="button" @click="encodeUrlInput">
          <ArrowUpRight :size="14" aria-hidden="true" />
          <span>URL 编码</span>
        </button>
        <button class="flex items-center gap-1.5 rounded-md bg-cyan-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2" type="button" @click="decodeUrlInput">
          <ArrowDownLeft :size="14" aria-hidden="true" />
          <span>URL 解码</span>
        </button>
        <button class="flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60" type="button" :disabled="urlResult === ''" @click="copyUrlResult">
          <Copy :size="14" aria-hidden="true" />
          <span>复制</span>
        </button>
        <button class="flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2" type="button" @click="clearUrl">
          <Trash2 :size="14" aria-hidden="true" />
          <span>清除</span>
        </button>
        <p v-if="urlStatus" class="ml-auto text-sm text-emerald-700" role="status">{{ urlStatus }}</p>
      </div>

      <div class="grid min-h-0 flex-1 gap-4 lg:grid-cols-2">
        <section class="flex min-h-0 flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white">
          <header class="shrink-0 border-b border-neutral-200 px-3 py-2">
            <h2 class="text-sm font-medium text-neutral-700">输入内容</h2>
            <p class="mt-0.5 text-xs text-neutral-400">按 URL 参数组件处理，空格会编码为 `%20`。</p>
          </header>
          <textarea v-model="urlInput" class="min-h-0 flex-1 resize-none bg-white p-3 font-mono text-sm leading-6 text-neutral-800 outline-none placeholder:text-neutral-400" aria-label="URL 编码输入" placeholder="请输入 URL、参数或文本" spellcheck="false" @input="resetUrlResult"></textarea>
        </section>

        <section class="flex min-h-0 flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white">
          <header class="shrink-0 border-b border-neutral-200 px-3 py-2">
            <h2 class="text-sm font-medium text-neutral-700">处理结果</h2>
            <p class="mt-0.5 text-xs text-neutral-400">结果只在本机处理，不会发起网络请求。</p>
          </header>
          <textarea class="min-h-0 flex-1 resize-none bg-neutral-50 p-3 font-mono text-sm leading-6 text-neutral-800 outline-none" aria-label="URL 编码结果" :value="urlResult" placeholder="处理结果会显示在这里" readonly spellcheck="false"></textarea>
          <p v-if="urlError" class="shrink-0 border-t border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{{ urlError }}</p>
        </section>
      </div>
    </div>

    <div v-else-if="mode === 'md5'" class="mt-4 flex min-h-0 flex-1 flex-col gap-4">
      <div class="flex shrink-0 flex-wrap items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2">
        <button class="flex items-center gap-1.5 rounded-md bg-violet-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2" type="button" @click="loadMd5Example">
          <BookOpen :size="14" aria-hidden="true" />
          <span>示例</span>
        </button>
        <button class="flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2" type="button" @click="calculateMd5">
          <Hash :size="14" aria-hidden="true" />
          <span>计算 MD5</span>
        </button>
        <button class="flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60" type="button" :disabled="md5Result === ''" @click="copyMd5">
          <Copy :size="14" aria-hidden="true" />
          <span>复制</span>
        </button>
        <button class="flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2" type="button" @click="clearMd5">
          <Trash2 :size="14" aria-hidden="true" />
          <span>清除</span>
        </button>
        <p v-if="md5Status" class="ml-auto text-sm text-emerald-700" role="status">{{ md5Status }}</p>
      </div>

      <div class="grid min-h-0 flex-1 gap-4 lg:grid-cols-2">
        <section class="flex min-h-0 flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white">
          <header class="shrink-0 border-b border-neutral-200 px-3 py-2">
            <h2 class="text-sm font-medium text-neutral-700">文本输入</h2>
            <p class="mt-0.5 text-xs text-neutral-400">按 UTF-8 字节计算 MD5 摘要。</p>
          </header>
          <textarea v-model="md5Input" class="min-h-0 flex-1 resize-none bg-white p-3 text-sm leading-6 text-neutral-800 outline-none placeholder:text-neutral-400" aria-label="MD5 文本输入" placeholder="请输入需要计算摘要的文本" spellcheck="false" @input="resetMd5Result"></textarea>
        </section>

        <section class="flex min-h-0 flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white">
          <header class="shrink-0 border-b border-neutral-200 px-3 py-2">
            <h2 class="text-sm font-medium text-neutral-700">MD5 摘要</h2>
            <p class="mt-0.5 text-xs text-neutral-400">MD5 是摘要算法，不是加密，不能用于存储密码。</p>
          </header>
          <textarea class="min-h-0 flex-1 resize-none bg-neutral-50 p-3 font-mono text-sm leading-6 text-neutral-800 outline-none" aria-label="MD5 摘要结果" :value="md5Result" placeholder="MD5 摘要会显示在这里" readonly spellcheck="false"></textarea>
          <p v-if="md5Error" class="shrink-0 border-t border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{{ md5Error }}</p>
        </section>
      </div>
    </div>

    <div v-else class="mt-4 flex min-h-0 flex-1 flex-col gap-4">
      <div class="flex shrink-0 flex-wrap items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2">
        <button class="flex items-center gap-1.5 rounded-md bg-violet-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2" type="button" @click="selectFile">
          <FolderOpen :size="14" aria-hidden="true" />
          <span>选择文件</span>
        </button>
        <button class="flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60" type="button" :disabled="filePath === '' || isFileCalculating" @click="calculateFileMd5">
          <Hash :size="14" aria-hidden="true" />
          <span>{{ isFileCalculating ? "计算中" : "计算 MD5" }}</span>
        </button>
        <button class="flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60" type="button" :disabled="fileMd5Result === ''" @click="copyFileMd5">
          <Copy :size="14" aria-hidden="true" />
          <span>复制</span>
        </button>
        <button class="flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2" type="button" @click="clearFile">
          <Trash2 :size="14" aria-hidden="true" />
          <span>清除</span>
        </button>
        <p v-if="fileStatus" class="ml-auto text-sm text-emerald-700" role="status">{{ fileStatus }}</p>
      </div>

      <div class="grid min-h-0 flex-1 gap-4 lg:grid-cols-2">
        <section class="flex min-h-0 flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white">
          <header class="shrink-0 border-b border-neutral-200 px-3 py-2">
            <h2 class="text-sm font-medium text-neutral-700">文件输入</h2>
            <p class="mt-0.5 text-xs text-neutral-400">文件只在本机读取，采用流式处理，不会上传。</p>
          </header>
          <div class="min-h-0 flex-1 overflow-auto p-4">
            <button class="flex w-full items-center gap-3 rounded-lg border border-dashed border-neutral-300 bg-neutral-50 px-4 py-4 text-left transition hover:border-blue-400 hover:bg-blue-50" type="button" @click="selectFile">
              <FolderOpen :size="20" class="shrink-0 text-blue-600" aria-hidden="true" />
              <span class="min-w-0">
                <span class="block text-sm font-medium text-neutral-800">{{ fileName || "选择需要计算的文件" }}</span>
                <span class="mt-1 block truncate text-xs text-neutral-500">{{ fileName ? "点击重新选择文件" : "支持任意本地文件" }}</span>
              </span>
            </button>
          </div>
        </section>

        <section class="flex min-h-0 flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white">
          <header class="shrink-0 border-b border-neutral-200 px-3 py-2">
            <h2 class="text-sm font-medium text-neutral-700">文件 MD5 摘要</h2>
            <p class="mt-0.5 text-xs text-neutral-400">MD5 是摘要算法，不是加密，不能用于存储密码。</p>
          </header>
          <div class="min-h-0 flex-1 overflow-auto p-4">
            <div class="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
              <p class="break-all font-mono text-sm leading-6 text-neutral-800">{{ fileMd5Result || "选择文件并点击计算 MD5" }}</p>
            </div>
            <div v-if="isFileCalculating || fileProgress > 0" class="mt-4">
              <div class="flex items-center justify-between text-xs text-neutral-500">
                <span>{{ isFileCalculating ? "正在读取文件…" : "处理完成" }}</span>
                <span>{{ fileProgressPercent }}%</span>
              </div>
              <div class="mt-2 h-2 overflow-hidden rounded-full bg-neutral-100">
                <div class="h-full rounded-full bg-blue-600 transition-all" :style="{ width: `${fileProgressPercent}%` }"></div>
              </div>
            </div>
            <p v-if="fileByteLength !== null" class="mt-4 text-sm text-neutral-500">文件大小：{{ formatFileSize(fileByteLength) }}</p>
            <p v-if="fileError" class="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{{ fileError }}</p>
          </div>
        </section>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { open } from "@tauri-apps/plugin-dialog";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { ArrowDownLeft, ArrowUpRight, BookOpen, Copy, FileText, FolderOpen, Hash, Link2, Trash2 } from "lucide-vue-next";
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useRoute } from "vue-router";

import { decodeUrlComponent, encodeUrlComponent, type UrlCodecResult } from "../utils/url";

type CodecMode = "url" | "md5" | "file-md5";
type FileMd5Progress = { processedBytes: number; totalBytes: number };
type FileMd5Result = { digest: string; byteLength: number };

const URL_EXAMPLE = "name=张三&keyword=照明灯具&redirect=/products?page=1";
const MD5_EXAMPLE = "TangTool 文本摘要示例";

const route = useRoute();
const mode = ref<CodecMode>("url");
const urlInput = ref("");
const urlResult = ref("");
const urlError = ref("");
const urlStatus = ref("");
const md5Input = ref("");
const md5Result = ref("");
const md5Error = ref("");
const md5Status = ref("");
const filePath = ref("");
const fileName = ref("");
const fileMd5Result = ref("");
const fileByteLength = ref<number | null>(null);
const fileError = ref("");
const fileStatus = ref("");
const fileProgress = ref(0);
const isFileCalculating = ref(false);
let stopFileProgress: (() => void) | null = null;

const fileProgressPercent = computed(() => Math.min(Math.max(fileProgress.value, 0), 100));

onMounted(async () => {
  try {
    stopFileProgress = await listen<FileMd5Progress>("md5-file-progress", (event) => {
      const { processedBytes, totalBytes } = event.payload;
      fileProgress.value = totalBytes === 0 ? 100 : Math.round((processedBytes / totalBytes) * 100);
    });
  } catch {
    // 浏览器预览环境没有 Tauri 事件总线，真实桌面窗口仍会注册进度监听。
  }
});

onBeforeUnmount(() => {
  stopFileProgress?.();
});

function loadUrlExample() {
  urlInput.value = URL_EXAMPLE;
  resetUrlResult();
  urlStatus.value = "已填充 URL 示例";
}

function encodeUrlInput() {
  applyUrlResult(encodeUrlComponent(urlInput.value), "URL 编码完成");
}

function decodeUrlInput() {
  applyUrlResult(decodeUrlComponent(urlInput.value), "URL 解码完成");
}

function applyUrlResult(codecResult: UrlCodecResult, successMessage: string) {
  if (!codecResult.ok) {
    urlResult.value = "";
    urlError.value = codecResult.error;
    urlStatus.value = "";
    return;
  }

  urlResult.value = codecResult.value;
  urlError.value = "";
  urlStatus.value = successMessage;
}

async function copyUrlResult() {
  if (urlResult.value === "") {
    return;
  }

  try {
    await writeText(urlResult.value);
    urlStatus.value = "已复制到剪贴板";
    urlError.value = "";
  } catch {
    urlError.value = "复制失败，请重新尝试";
    urlStatus.value = "";
  }
}

function clearUrl() {
  urlInput.value = "";
  resetUrlResult();
}

function resetUrlResult() {
  urlResult.value = "";
  urlError.value = "";
  urlStatus.value = "";
}

function loadMd5Example() {
  md5Input.value = MD5_EXAMPLE;
  resetMd5Result();
  md5Status.value = "已填充文本示例";
}

async function calculateMd5() {
  try {
    md5Result.value = await invoke<string>("calculate_text_md5", { input: md5Input.value });
    md5Error.value = "";
    md5Status.value = "MD5 计算完成";
  } catch (error) {
    md5Result.value = "";
    md5Error.value = typeof error === "string" ? error : "MD5 计算失败，请重新尝试";
    md5Status.value = "";
  }
}

async function copyMd5() {
  if (md5Result.value === "") {
    return;
  }

  try {
    await writeText(md5Result.value);
    md5Status.value = "已复制到剪贴板";
    md5Error.value = "";
  } catch {
    md5Error.value = "复制失败，请重新尝试";
    md5Status.value = "";
  }
}

function clearMd5() {
  md5Input.value = "";
  resetMd5Result();
}

function resetMd5Result() {
  md5Result.value = "";
  md5Error.value = "";
  md5Status.value = "";
}

async function selectFile() {
  try {
    const selected = await open({ title: "选择需要计算 MD5 的文件", multiple: false, directory: false });
    if (selected === null || Array.isArray(selected)) {
      return;
    }

    filePath.value = selected;
    fileName.value = selected.split(/[\\/]/).pop() || selected;
    fileMd5Result.value = "";
    fileByteLength.value = null;
    fileProgress.value = 0;
    fileError.value = "";
    fileStatus.value = "已选择文件";
  } catch {
    fileError.value = "选择文件失败，请确认文件可访问";
    fileStatus.value = "";
  }
}

async function calculateFileMd5() {
  if (filePath.value === "") {
    fileError.value = "请先选择文件";
    return;
  }

  isFileCalculating.value = true;
  fileProgress.value = 0;
  fileMd5Result.value = "";
  fileByteLength.value = null;
  fileError.value = "";
  fileStatus.value = "";

  try {
    const result = await invoke<FileMd5Result>("calculate_file_md5", { path: filePath.value });
    fileMd5Result.value = result.digest;
    fileByteLength.value = result.byteLength;
    fileProgress.value = 100;
    fileStatus.value = "文件 MD5 计算完成";
  } catch (error) {
    fileError.value = typeof error === "string" ? error : "文件 MD5 计算失败，请确认文件可访问";
  } finally {
    isFileCalculating.value = false;
  }
}

async function copyFileMd5() {
  if (fileMd5Result.value === "") {
    return;
  }

  try {
    await writeText(fileMd5Result.value);
    fileStatus.value = "已复制到剪贴板";
    fileError.value = "";
  } catch {
    fileError.value = "复制失败，请重新尝试";
    fileStatus.value = "";
  }
}

function clearFile() {
  filePath.value = "";
  fileName.value = "";
  fileMd5Result.value = "";
  fileByteLength.value = null;
  fileProgress.value = 0;
  fileError.value = "";
  fileStatus.value = "";
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}
</script>
