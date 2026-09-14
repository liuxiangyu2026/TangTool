<template>
  <section class="flex h-full min-h-0 flex-col bg-neutral-100 p-4 sm:p-6">
    <ToolNotice :status="status" :error="error" />
    <header>
      <p class="text-sm font-medium text-neutral-500">{{ route.meta.group }}</p>
      <h1 class="mt-1 text-2xl font-semibold text-neutral-900">{{ route.meta.title }}</h1>
      <div class="mt-4 inline-flex rounded-md border border-neutral-200 bg-surface p-1">
        <button class="rounded px-3 py-1.5 text-sm" :class="kind === 'text' ? 'bg-neutral-900 text-white' : 'text-neutral-600'" type="button" :disabled="fileBusy" @click="kind = 'text'">
          文本
        </button>
        <button class="rounded px-3 py-1.5 text-sm" :class="kind === 'file' ? 'bg-neutral-900 text-white' : 'text-neutral-600'" type="button" :disabled="fileBusy" @click="kind = 'file'">
          文件
        </button>
      </div>
    </header>
    <div class="mt-4 flex min-h-0 flex-1 flex-col gap-4">
      <div class="flex shrink-0 flex-wrap gap-2 rounded-lg border border-neutral-200 bg-surface px-3 py-2">
        <button class="rounded-md bg-violet-600 px-3 py-1.5 text-sm text-white" type="button" :disabled="fileBusy" @click="kind === 'text' ? (input = 'TangTool Base64 示例') : selectFile()">
          示例/选择文件
        </button>
        <button class="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white disabled:opacity-50" type="button" :disabled="fileBusy || (kind === 'file' && path === '')"
          @click="kind === 'text' ? encode() : convertFile('encode')">
          Base64 编码
        </button>
        <button class="rounded-md bg-cyan-600 px-3 py-1.5 text-sm text-white disabled:opacity-50" type="button" :disabled="fileBusy || (kind === 'file' && path === '')"
          @click="kind === 'text' ? decode() : convertFile('decode')">
          Base64 解码
        </button>
        <button class="rounded-md bg-emerald-600 px-3 py-1.5 text-sm text-white disabled:opacity-50" type="button" :disabled="result === ''" @click="copy">复制</button>
        <button class="rounded-md bg-red-600 px-3 py-1.5 text-sm text-white" type="button" :disabled="fileBusy" @click="clear">清除</button>
      </div>
      <SplitPane direction="horizontal" label="调整Base64 输入和结果宽度">
        <template #first>
          <section class="flex min-h-0 flex-col overflow-hidden rounded-lg border border-neutral-200 bg-surface">
            <h2 class="border-b border-neutral-200 px-3 py-2 text-sm font-medium">{{ kind === "text" ? "文本输入" : "文件输入" }}</h2>
            <textarea v-if="kind === 'text'" v-model="input" class="min-h-0 flex-1 resize-none p-3 text-sm" aria-label="Base64 文本输入" placeholder="请输入文本（UTF-8 最多 2 MiB）"></textarea>
            <button v-else class="m-4 rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-6 text-left text-sm" type="button" :disabled="fileBusy" @click="selectFile">
              {{ fileName || "点击选择文件" }}
            </button>
          </section>
        </template>
        <template #second>
          <section class="flex min-h-0 flex-col overflow-hidden rounded-lg border border-neutral-200 bg-surface">
            <h2 class="border-b border-neutral-200 px-3 py-2 text-sm font-medium">处理结果</h2>
            <textarea class="min-h-0 flex-1 resize-none bg-neutral-50 p-3 font-mono text-sm" aria-label="Base64 结果" :value="fileBusy ? '正在处理文件，请稍候…' : result" readonly placeholder="结果显示在这里"></textarea>
            <p class="border-t border-neutral-100 px-3 py-2 text-xs text-neutral-500">Base64 是编码方式，不是加密。</p>
          </section>
        </template>
      </SplitPane>
    </div>
  </section>
</template>
<script setup lang="ts">
import { exportDefaults } from "../utils/exportDefaults";
import SplitPane from "../components/SplitPane.vue";
import ToolNotice from "../components/ToolNotice.vue";
import { invoke } from "@tauri-apps/api/core";
import { open, save } from "@tauri-apps/plugin-dialog";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { ref, watch } from "vue";
import { encodeBase64Text, decodeBase64Text } from "../utils/base64Text";
import { useRoute } from "vue-router";

const route = useRoute();
const kind = ref<"text" | "file">("text");
const input = ref("");
const result = ref("");
const error = ref("");
const status = ref("");
const path = ref("");
const fileName = ref("");
const fileBusy = ref(false);
watch([input, kind], reset, { flush: "sync" });

function encode() {
  reset();
  try {
    result.value = encodeBase64Text(input.value);
    status.value = "编码完成";
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : "Base64 编码失败";
  }
}

function decode() {
  reset();
  try {
    result.value = decodeBase64Text(input.value);
    status.value = "解码完成";
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : "Base64 内容无效";
  }
}

async function selectFile() {
  if (fileBusy.value) return;
  fileBusy.value = true;
  error.value = "";
  status.value = "";
  try {
    const selected = await open({ title: "选择文件", multiple: false, directory: false });
    if (typeof selected === "string") {
      path.value = selected;
      fileName.value = selected.split(/[\\/]/).pop() || selected;
      result.value = "";
      status.value = "已选择文件";
    }
  } catch {
    error.value = "选择文件失败，请重试。";
  } finally {
    fileBusy.value = false;
  }
}

async function convertFile(mode: "encode" | "decode") {
  if (fileBusy.value || !path.value) return;
  // 保存对话框打开前固定输入，避免 await 期间输入状态变化导致处理另一份文件。
  const sourcePath = path.value;
  const sourceName = fileName.value;
  fileBusy.value = true;
  result.value = "";
  error.value = "";
  status.value = "";
  try {
    const output = await save({
      title: mode === "encode" ? "保存 Base64 文件" : "保存解码文件",
      defaultPath: exportDefaults(`${sourceName}.${mode === "encode" ? "base64" : "decoded"}`).path,
    });
    if (!output) {
      status.value = "已取消保存";
      return;
    }
    await invoke(mode === "encode" ? "encode_file_base64" : "decode_file_base64", {
      path: sourcePath,
      outputPath: output,
    });
    status.value = mode === "encode" ? "Base64 文件已保存" : "文件解码完成";
  } catch (reason) {
    error.value = typeof reason === "string" ? reason : "文件处理失败，请检查输入文件和保存位置。";
  } finally {
    fileBusy.value = false;
  }
}

async function copy() {
  if (!result.value) return;
  error.value = "";
  status.value = "";
  try {
    await writeText(result.value);
    status.value = "已复制到剪贴板";
  } catch {
    error.value = "复制失败，请检查剪贴板权限。";
  }
}

function reset() {
  result.value = "";
  error.value = "";
  status.value = "";
}

function clear() {
  if (fileBusy.value) return;
  input.value = "";
  result.value = "";
  path.value = "";
  fileName.value = "";
  error.value = "";
  status.value = "";
}
</script>
