<template>
  <section class="flex h-full min-h-0 flex-col bg-neutral-100 p-4 sm:p-6">
    <ToolNotice :status="status" :error="error" />
    <header>
      <p class="text-sm font-medium text-neutral-500">{{ route.meta.group }}</p>
      <h1 class="mt-1 text-2xl font-semibold text-neutral-900">{{ route.meta.title }}</h1>
      <div class="mt-4 inline-flex rounded-md border border-neutral-200 bg-surface p-1">
        <button class="rounded px-3 py-1.5 text-sm" :class="kind === 'text' ? 'bg-neutral-900 text-white' : 'text-neutral-600'" type="button" :disabled="busy || selecting" @click="kind = 'text'">
          文本 MD5
        </button>
        <button class="rounded px-3 py-1.5 text-sm" :class="kind === 'file' ? 'bg-neutral-900 text-white' : 'text-neutral-600'" type="button" :disabled="busy || selecting" @click="kind = 'file'">
          文件 MD5
        </button>
      </div>
    </header>
    <div class="mt-4 flex min-h-0 flex-1 flex-col gap-4">
      <div class="flex shrink-0 flex-wrap gap-2 rounded-lg border border-neutral-200 bg-surface px-3 py-2">
        <button class="rounded-md bg-violet-600 px-3 py-1.5 text-sm text-white disabled:opacity-50" type="button" :disabled="busy || selecting" @click="kind === 'text' ? (input = 'TangTool 文本摘要示例') : selectFile()">
          示例/选择文件
        </button>
        <button class="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white disabled:opacity-50" type="button" :disabled="busy || selecting || (kind === 'file' && filePath === '')" @click="calculate">
          {{ busy ? "计算中" : "计算 MD5" }}
        </button>
        <button class="rounded-md bg-emerald-600 px-3 py-1.5 text-sm text-white disabled:opacity-50" type="button" :disabled="result === ''" @click="copyResult">
          复制
        </button>
        <button class="rounded-md bg-red-600 px-3 py-1.5 text-sm text-white" type="button" @click="clearAll">清除</button>
      </div>
      <SplitPane direction="horizontal" label="调整MD5 输入和摘要宽度">
        <template #first>
          <section class="flex min-h-0 flex-col overflow-hidden rounded-lg border border-neutral-200 bg-surface">
            <h2 class="border-b border-neutral-200 px-3 py-2 text-sm font-medium">{{ kind === "text" ? "文本输入" : "文件输入" }}</h2>
            <textarea v-if="kind === 'text'" v-model="input" class="min-h-0 flex-1 resize-none p-3 text-sm" aria-label="MD5 文本输入" placeholder="请输入文本"></textarea>
            <button v-else class="m-4 rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-6 text-left text-sm disabled:opacity-50" type="button" :disabled="busy || selecting" @click="selectFile">
              {{ fileName || "点击选择文件" }}
            </button>
          </section>
        </template>
        <template #second>
          <section class="flex min-h-0 flex-col overflow-hidden rounded-lg border border-neutral-200 bg-surface">
            <h2 class="border-b border-neutral-200 px-3 py-2 text-sm font-medium">MD5 摘要</h2>
            <textarea class="min-h-0 flex-1 resize-none bg-neutral-50 p-3 font-mono text-sm" aria-label="MD5 结果" :value="busy ? `正在计算，请稍候…${progress === null ? '' : ` ${progress}%`}` : result" readonly placeholder="摘要会显示在这里"></textarea>
            <p class="border-t border-neutral-100 px-3 py-2 text-xs text-neutral-500">MD5 是摘要算法，不是加密。</p>
          </section>
        </template>
      </SplitPane>
    </div>
  </section>
</template>
<script setup lang="ts">
import SplitPane from "../components/SplitPane.vue";
import ToolNotice from "../components/ToolNotice.vue";
import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { open } from "@tauri-apps/plugin-dialog";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { ref, watch } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const kind = ref<"text" | "file">("text");
const input = ref("");
const result = ref("");
const error = ref("");
const status = ref("");
const filePath = ref("");
const fileName = ref("");
const busy = ref(false);
const selecting = ref(false);
const progress = ref<number | null>(null);
let revision = 0;

function invalidateResult() {
  revision += 1;
  result.value = "";
  error.value = "";
  status.value = "";
  progress.value = null;
}

// 同步失效，避免同一事件循环内复制旧结果；迟到响应也必须匹配这一版输入。
watch([input, filePath, kind], invalidateResult, { flush: "sync" });

async function selectFile() {
  if (busy.value || selecting.value) return;
  selecting.value = true;
  invalidateResult();
  const selectedRevision = revision;
  try {
    const selected = await open({ title: "选择文件", multiple: false, directory: false });
    if (typeof selected === "string" && selectedRevision === revision) {
      filePath.value = selected;
      fileName.value = selected.split(/[\\/]/).pop() || selected;
      status.value = "已选择文件";
    }
  } catch {
    if (selectedRevision === revision) error.value = "选择文件失败，请重试。";
  } finally {
    selecting.value = false;
  }
}

async function calculate() {
  if (busy.value || selecting.value || (kind.value === "file" && !filePath.value)) return;
  invalidateResult();
  const taskRevision = revision;
  const taskKind = kind.value;
  const sourcePath = filePath.value;
  const sourceText = input.value;
  const requestId = crypto.randomUUID();
  let unlisten: UnlistenFn | undefined;
  busy.value = true;
  try {
    let digest: string;
    if (taskKind === "file") {
      unlisten = await listen<{ requestId: string; processedBytes: number; totalBytes: number }>("md5-file-progress", ({ payload }) => {
        if (payload.requestId !== requestId || taskRevision !== revision) return;
        progress.value = payload.totalBytes === 0 ? 100 : Math.min(100, Math.floor(payload.processedBytes / payload.totalBytes * 100));
      });
      if (taskRevision !== revision) return;
      const value = await invoke<{ digest: string }>("calculate_file_md5", { path: sourcePath, requestId });
      digest = value.digest;
    } else {
      digest = await invoke<string>("calculate_text_md5", { input: sourceText });
    }
    if (taskRevision === revision) {
      result.value = digest;
      status.value = "计算完成";
    }
  } catch (e) {
    if (taskRevision === revision) error.value = typeof e === "string" ? e : "计算失败";
  } finally {
    unlisten?.();
    busy.value = false;
    progress.value = null;
  }
}

async function copyResult() {
  if (!result.value) return;
  const copiedRevision = revision;
  try {
    await writeText(result.value);
    if (copiedRevision === revision) status.value = "已复制到剪贴板";
  } catch {
    if (copiedRevision === revision) error.value = "复制失败，请检查剪贴板权限。";
  }
}

function clearAll() {
  invalidateResult();
  input.value = "";
  result.value = "";
  filePath.value = "";
  fileName.value = "";
  error.value = "";
  status.value = "";
}
</script>
