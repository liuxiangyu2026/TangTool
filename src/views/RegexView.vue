<template>
  <ToolPage description="JavaScript 正则，不加 / 分隔符。字符位置从 0 开始（UTF-16）；最多显示 1000 个匹配，长匹配和捕获组会截断。" :error="error" :status="status">
    <template #actions>
      <button class="tool-button bg-violet-600" type="button" @click="example">
        <FileText :size="14" />
        示例
      </button>
      <button class="tool-button bg-blue-600" type="button" :disabled="busy" @click="run">
        <Regex :size="14" />
        {{ busy ? "匹配中" : "开始匹配" }}
      </button>
      <button v-if="busy" class="tool-button bg-orange-600" type="button" @click="cancel">
        <Square :size="14" />
        停止
      </button>
      <button class="tool-button bg-red-600" type="button" @click=" input = ''; pattern = ''; reset(); ">
        <Trash2 :size="14" />
        清除
      </button>
    </template>
    <div class="tool-panel flex flex-wrap gap-3">
      <label class="flex min-w-0 flex-1 items-center gap-2 text-sm">
        表达式
        <input v-model="pattern" class="tool-field min-w-0 flex-1 font-mono" placeholder="例如 \d+" />
      </label>
      <label class="flex items-center gap-2 text-sm">
        标志
        <input v-model="flags" class="tool-field w-24 font-mono" placeholder="gim" />
      </label>
    </div>
    <SplitPane direction="vertical" label="调整测试文本和匹配结果高度" :initial="65" :min="30" :max="80">
      <template #first>
        <textarea v-model="input" class="tool-editor" aria-label="正则测试文本" placeholder="输入测试文本，最多 10 万字符"></textarea>
      </template>
      <template #second>
        <div class="tool-panel h-full overflow-auto">
          <p class="mb-2 text-xs text-neutral-500">单个匹配最多 2000 字符，前 20 个捕获组各显示最多 500 字符；1 秒内未完成会自动停止。</p>
          <ol class="space-y-2 text-sm" aria-label="正则匹配结果">
            <li v-for="(match, index) in matches" :key="index" class="rounded border border-neutral-200 p-2">
              <span class="text-xs text-neutral-500">#{{ index + 1 }} · 位置 {{ match.index }}</span>
              <pre class="whitespace-pre-wrap break-all">{{ match.value === "" ? "（零长度匹配）" : match.value }}</pre>
              <p v-if="match.groups.length" class="mt-1 break-all text-xs text-neutral-500">捕获组：{{ JSON.stringify(match.groups) }}</p>
            </li>
          </ol>
        </div>
      </template>
    </SplitPane>
  </ToolPage>
</template>

<script setup lang="ts">
import SplitPane from "../components/SplitPane.vue";
import { onBeforeUnmount, onDeactivated, ref, watch } from "vue";
import { FileText, Regex, Square, Trash2 } from "lucide-vue-next";
import ToolPage from "../components/ToolPage.vue";
import type { RegexMatch, RegexResponse } from "../workers/regex.worker";

const pattern = ref("");
const flags = ref("g");
const input = ref("");
const matches = ref<RegexMatch[]>([]);
const busy = ref(false);
const error = ref("");
const status = ref("");
let worker: Worker | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;
watch([pattern, flags, input], reset, { flush: "sync" });
onBeforeUnmount(stopWorker);
onDeactivated(() => {
  if (busy.value) cancel();
});

function stopWorker() {
  clearTimeout(timer);
  worker?.terminate();
  worker = null;
  busy.value = false;
}

function reset() {
  stopWorker();
  matches.value = [];
  error.value = "";
  status.value = "";
}

function cancel() {
  stopWorker();
  status.value = "已停止匹配";
}

function example() {
  pattern.value = "(\\w+)@(\\w+\\.\\w+)";
  flags.value = "g";
  input.value = "联系：hello@example.com，备用：dev@example.org";
}

function run() {
  reset();
  if (!pattern.value || pattern.value.length > 2000 || input.value.length > 100_000) {
    error.value = "请输入表达式（最多 2000 字符），测试文本最多 10 万字符。";
    return;
  }
  try {
    // 正则可能灾难性回溯，必须在独立 Worker 中运行，超时直接终止线程。
    worker = new Worker(new URL("../workers/regex.worker.ts", import.meta.url), { type: "module" });
    busy.value = true;
    worker.onmessage = (event: MessageEvent<RegexResponse>) => {
      matches.value = event.data.matches;
      error.value = event.data.error;
      status.value = event.data.error ? "" : `找到 ${matches.value.length} 个匹配${event.data.limited ? "（已达到展示上限）" : ""}`;
      stopWorker();
    };
    worker.onerror = (event) => {
      event.preventDefault();
      error.value = "正则工作线程无法运行，请重试。";
      stopWorker();
    };
    timer = setTimeout(() => {
      stopWorker();
      error.value = "匹配超过 1 秒，已停止。请简化表达式或缩短测试文本。";
    }, 1000);
    worker.postMessage({ pattern: pattern.value, flags: flags.value, input: input.value });
  } catch {
    stopWorker();
    error.value = "无法启动正则工作线程。";
  }
}
</script>
