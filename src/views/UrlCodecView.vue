<template>
  <section class="flex h-full min-h-0 flex-col bg-neutral-100 p-4 sm:p-6">
    <header class="shrink-0">
      <p class="text-sm font-medium text-neutral-500">{{ route.meta.group }}</p>
      <h1 class="mt-1 text-2xl font-semibold text-neutral-900">{{ route.meta.title }}</h1>
    </header>

    <div class="mt-4 flex min-h-0 flex-1 flex-col gap-4">
      <div class="flex shrink-0 flex-wrap items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2">
        <button class="flex items-center gap-1.5 rounded-md bg-violet-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2" type="button" @click="loadExample">
          <BookOpen :size="14" aria-hidden="true" />
          <span>示例</span>
        </button>
        <button class="flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2" type="button" @click="encodeInput">
          <ArrowUpRight :size="14" aria-hidden="true" />
          <span>URL 编码</span>
        </button>
        <button class="flex items-center gap-1.5 rounded-md bg-cyan-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2" type="button" @click="decodeInput">
          <ArrowDownLeft :size="14" aria-hidden="true" />
          <span>URL 解码</span>
        </button>
        <button class="flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60" type="button" :disabled="result === ''" @click="copyResult">
          <Copy :size="14" aria-hidden="true" />
          <span>复制</span>
        </button>
        <button class="flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2" type="button" @click="clearAll">
          <Trash2 :size="14" aria-hidden="true" />
          <span>清除</span>
        </button>
        <p v-if="statusMessage" class="ml-auto text-sm text-emerald-700" role="status">{{ statusMessage }}</p>
      </div>

      <div class="grid min-h-0 flex-1 gap-4 lg:grid-cols-2">
        <section class="flex min-h-0 flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white">
          <header class="shrink-0 border-b border-neutral-200 px-3 py-2">
            <h2 class="text-sm font-medium text-neutral-700">输入内容</h2>
            <p class="mt-0.5 text-xs text-neutral-400">按 URL 参数组件处理，空格会编码为 `%20`。</p>
          </header>
          <textarea v-model="input" class="min-h-0 flex-1 resize-none bg-white p-3 font-mono text-sm leading-6 text-neutral-800 outline-none placeholder:text-neutral-400" aria-label="URL 编码输入" placeholder="请输入 URL、参数或文本" spellcheck="false" @input="resetResult"></textarea>
        </section>

        <section class="flex min-h-0 flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white">
          <header class="shrink-0 border-b border-neutral-200 px-3 py-2">
            <h2 class="text-sm font-medium text-neutral-700">处理结果</h2>
            <p class="mt-0.5 text-xs text-neutral-400">结果只在本机处理，不会发起网络请求。</p>
          </header>
          <textarea class="min-h-0 flex-1 resize-none bg-neutral-50 p-3 font-mono text-sm leading-6 text-neutral-800 outline-none" aria-label="URL 编码结果" :value="result" placeholder="处理结果会显示在这里" readonly spellcheck="false"></textarea>
          <p v-if="errorMessage" class="shrink-0 border-t border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{{ errorMessage }}</p>
        </section>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { ArrowDownLeft, ArrowUpRight, BookOpen, Copy, Trash2 } from "lucide-vue-next";
import { ref } from "vue";
import { useRoute } from "vue-router";

import { decodeUrlComponent, encodeUrlComponent } from "../utils/url";

const EXAMPLE_INPUT = "name=张三&keyword=照明灯具&redirect=/products?page=1";

const route = useRoute();
const input = ref("");
const result = ref("");
const errorMessage = ref("");
const statusMessage = ref("");

function loadExample() {
  input.value = EXAMPLE_INPUT;
  resetResult();
  statusMessage.value = "已填充 URL 示例";
}

function encodeInput() {
  const codecResult = encodeUrlComponent(input.value);
  applyResult(codecResult, "URL 编码完成");
}

function decodeInput() {
  const codecResult = decodeUrlComponent(input.value);
  applyResult(codecResult, "URL 解码完成");
}

function applyResult(codecResult: ReturnType<typeof encodeUrlComponent>, successMessage: string) {
  if (!codecResult.ok) {
    result.value = "";
    errorMessage.value = codecResult.error;
    statusMessage.value = "";
    return;
  }

  result.value = codecResult.value;
  errorMessage.value = "";
  statusMessage.value = successMessage;
}

async function copyResult() {
  if (result.value === "") {
    return;
  }

  try {
    await writeText(result.value);
    statusMessage.value = "已复制到剪贴板";
    errorMessage.value = "";
  } catch {
    errorMessage.value = "复制失败，请重新尝试";
    statusMessage.value = "";
  }
}

function clearAll() {
  input.value = "";
  resetResult();
}

function resetResult() {
  result.value = "";
  errorMessage.value = "";
  statusMessage.value = "";
}
</script>
