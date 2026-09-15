<template>
  <ToolPage :description="t('按 UTF-8 字节计算文本 SHA-256 / SHA-512。空文本也有合法摘要；摘要不是加密，不能直接用于保存密码。本页暂不处理文件。')" :error="error" :status="status">
    <template #actions>
      <button class="tool-button bg-violet-600" type="button" @click="input = 'abc'">
        <FileText :size="14" />
        {{ t('示例') }}
      </button>
      <button class="tool-button bg-blue-600" type="button" :disabled="busy" @click="calculate">
        <ShieldCheck :size="14" />
        {{ busy ? t('计算中') : t('计算摘要') }}
      </button>
      <button class="tool-button bg-emerald-600" type="button" :disabled="!result" @click="copyResult">
        <Copy :size="14" />
        {{ t('复制') }}
      </button>
      <button class="tool-button bg-red-600" type="button" @click=" input = ''; reset(); ">
        <Trash2 :size="14" />
        {{ t('清除') }}
      </button>
    </template>
    <label class="tool-panel flex items-center gap-3 text-sm">
      {{ t('算法') }}
      <select v-model="algorithm" class="tool-field">
        <option>SHA-256</option>
        <option>SHA-512</option>
      </select>
      <span class="text-xs text-neutral-500">{{ t('不自动裁剪空格或换行，最多 2 MiB') }}</span>
    </label>
    <SplitPane direction="vertical" :label="t('调整SHA 输入和摘要高度')" :initial="65" :min="30" :max="80">
      <template #first>
        <textarea v-model="input" class="tool-editor" :aria-label="t('SHA 文本输入')" :placeholder="t('输入需要计算摘要的文本')"></textarea>
      </template>
      <template #second>
        <div class="tool-panel flex min-h-0 flex-col">
          <h2 class="mb-2 text-sm font-medium">{{ t('十六进制摘要') }}</h2>
          <textarea class="min-h-0 flex-1 w-full resize-none font-mono text-sm" :value="result" readonly rows="3" :aria-label="t('SHA 摘要结果')" :placeholder="t('结果显示在这里')"></textarea>
        </div>
      </template>
    </SplitPane>
  </ToolPage>
</template>

<script setup lang="ts">
import { t } from "../i18n/index";
import SplitPane from "../components/SplitPane.vue";
import { ref, watch } from "vue";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { Copy, FileText, ShieldCheck, Trash2 } from "lucide-vue-next";
import ToolPage from "../components/ToolPage.vue";

const input = ref("");
const algorithm = ref("SHA-256");
const result = ref("");
const error = ref("");
const status = ref("");
const busy = ref(false);
let requestId = 0;
watch([input, algorithm], reset, { flush: "sync" });

function reset() {
  requestId++;
  result.value = "";
  error.value = "";
  status.value = "";
  busy.value = false;
}

async function calculate() {
  reset();
  const id = requestId;
  if (input.value.length > 2 * 1024 * 1024) {
    error.value = t('文本过大，最多处理 2 MiB UTF-8 内容。');
    return;
  }
  const bytes = new TextEncoder().encode(input.value);
  if (bytes.byteLength > 2 * 1024 * 1024) {
    error.value = t('文本过大，最多处理 2 MiB UTF-8 内容。');
    return;
  }
  busy.value = true;
  try {
    const digest = await crypto.subtle.digest(algorithm.value, bytes);
    // 用户修改输入或算法后，不让较早任务把旧摘要写回页面。
    if (id !== requestId) return;
    result.value = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
    status.value = t('摘要计算完成');
  } catch {
    if (id === requestId) error.value = t('无法计算摘要，请确认当前环境支持 Web Crypto。');
  } finally {
    if (id === requestId) busy.value = false;
  }
}

async function copyResult() {
  try {
    await writeText(result.value);
    status.value = t('已复制摘要');
  } catch {
    error.value = t('复制失败，请重试。');
  }
}
</script>
