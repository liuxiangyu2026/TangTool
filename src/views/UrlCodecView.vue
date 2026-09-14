<template>
  <section class="flex h-full min-h-0 flex-col bg-neutral-100 p-4 sm:p-6">
    <ToolNotice :status="status" :error="error" />
    <header class="shrink-0">
      <p class="text-sm font-medium text-neutral-500">{{ route.meta.group }}</p>
      <h1 class="mt-1 text-2xl font-semibold text-neutral-900">{{ route.meta.title }}</h1>
    </header>
    <div class="mt-4 flex min-h-0 flex-1 flex-col gap-4">
      <div class="flex shrink-0 flex-wrap items-center gap-2 rounded-lg border border-neutral-200 bg-surface px-3 py-2">
        <button class="rounded-md bg-violet-600 px-3 py-1.5 text-sm font-medium text-white" type="button" @click="input = 'name=张三&keyword=照明灯具'">示例</button>
        <button class="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white" type="button" @click="run('encode')">URL 编码</button>
        <button class="rounded-md bg-cyan-600 px-3 py-1.5 text-sm font-medium text-white" type="button" @click="run('decode')">URL 解码</button>
        <button class="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50" type="button" :disabled="result === ''" @click="copy">
          复制
        </button>
        <button class="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white" type="button" @click="clear">清除</button>
      </div>
      <SplitPane direction="horizontal" label="调整URL 输入和结果宽度">
        <template #first>
          <textarea v-model="input" class="min-h-0 resize-none rounded-lg border border-neutral-200 bg-surface p-3 font-mono text-sm" aria-label="URL 输入"
            placeholder="请输入 URL 或文本" @input="reset"></textarea>
        </template>
        <template #second>
          <div class="flex min-h-0 flex-col rounded-lg border border-neutral-200 bg-surface">
            <textarea class="min-h-0 flex-1 resize-none bg-neutral-50 p-3 font-mono text-sm" aria-label="URL 结果" :value="result" readonly placeholder="结果显示在这里"></textarea>
          </div>
        </template>
      </SplitPane>
    </div>
  </section>
</template>
<script setup lang="ts">
import SplitPane from "../components/SplitPane.vue";
import ToolNotice from "../components/ToolNotice.vue";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { ref } from "vue";
import { useRoute } from "vue-router";
import { decodeUrlComponent, encodeUrlComponent } from "../utils/url";

const route = useRoute();
const input = ref("");
const result = ref("");
const error = ref("");
const status = ref("");

function run(mode: "encode" | "decode") {
  const value = mode === "encode" ? encodeUrlComponent(input.value) : decodeUrlComponent(input.value);
  if (!value.ok) {
    result.value = "";
    error.value = value.error;
    status.value = "";
    return;
  }
  result.value = value.value;
  error.value = "";
  status.value = mode === "encode" ? "编码完成" : "解码完成";
}

async function copy() {
  try {
    await writeText(result.value);
    status.value = "已复制到剪贴板";
  } catch {
    error.value = "复制失败";
  }
}

function reset() {
  result.value = "";
  error.value = "";
  status.value = "";
}

function clear() {
  input.value = "";
  reset();
}
</script>
