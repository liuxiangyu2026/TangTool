<template>
  <ToolPage :description="t('按行高亮新增和删除；忽略空白时不比较行内空格/制表符，但仍比较换行及空白行。每侧最多 2000 行、20 万字符。')" :error="error" :status="status">
    <template #actions>
      <button class="tool-button bg-violet-600" type="button" @click=" left = 'TangTool\n版本 1\n保持本地'; right = 'TangTool\n版本 2\n保持本地\n新增工具'; ">
        <BookOpen :size="14" />
        {{ t('示例') }}
      </button>
      <button class="tool-button bg-blue-600" type="button" :disabled="busy" @click="run">
        <GitCompareArrows :size="14" />
        {{ busy ? t('对比中') : t('对比') }}
      </button>
      <button class="tool-button bg-red-600" type="button" @click=" left = ''; right = ''; reset(); ">
        <Trash2 :size="14" />
        {{ t('清除') }}
      </button>
      <label class="ml-2 flex items-center gap-2 text-sm">
        <input v-model="ignoreWhitespace" type="checkbox" />
        {{ t('忽略空白') }}
      </label>
    </template>
    <SplitPane direction="vertical" :label="t('调整文本输入和差异结果高度')" :initial="55" :min="25" :max="75">
      <template #first>
        <SplitPane direction="horizontal" :label="t('调整左右文本输入宽度')">
          <template #first>
            <textarea v-model="left" class="tool-editor h-full" :aria-label="t('原始文本')" :placeholder="t('原始文本')"></textarea>
          </template>
          <template #second>
            <textarea v-model="right" class="tool-editor h-full" :aria-label="t('目标文本')" :placeholder="t('目标文本')"></textarea>
          </template>
        </SplitPane>
      </template>
      <template #second>
        <div class="h-full overflow-auto rounded-lg border border-neutral-200 bg-surface" :aria-label="t('逐行差异')">
          <p v-if="!result" class="p-3 text-sm text-neutral-500">{{ t('输入两侧文本后点击“对比”。') }}</p>
          <p class="sticky top-0 bg-neutral-50 p-2 text-xs text-neutral-500">{{ t('新增 {p0} 行 / 删除 {p1} 行（空行显示为 ∅）', { p0: result?.added ?? 0, p1: result?.removed ?? 0 }) }}</p>
          <div v-for="(row, index) in result?.rows ?? []" :key="index" class="grid grid-cols-2 border-t border-neutral-200 font-mono text-xs leading-6"
            :class="row.type === 'added' ? 'bg-green-50' : row.type === 'removed' ? 'bg-red-50' : ''">
            <div class="flex min-w-0 gap-2 border-r border-neutral-200 px-2">
              <span class="w-10 shrink-0 text-neutral-500">{{ row.leftNumber }}</span>
              <pre class="whitespace-pre-wrap break-all">{{ row.left === "" ? "∅" : row.left }}</pre>
            </div>
            <div class="flex min-w-0 gap-2 px-2">
              <span class="w-10 shrink-0 text-neutral-500">{{ row.rightNumber }}</span>
              <pre class="whitespace-pre-wrap break-all">{{ row.right === "" ? "∅" : row.right }}</pre>
            </div>
          </div>
        </div>
      </template>
    </SplitPane>
  </ToolPage>
</template>

<script setup lang="ts">
import { t } from "../i18n/index";
import SplitPane from "../components/SplitPane.vue";
import { onBeforeUnmount, ref, watch } from "vue";
import { BookOpen, GitCompareArrows, Trash2 } from "lucide-vue-next";
import ToolPage from "../components/ToolPage.vue";
import type { TextDiffResult } from "../utils/textDiff";
import { runWorker } from "../utils/workerTask";

const left = ref("");
const right = ref("");
const ignoreWhitespace = ref(false);
const result = ref<TextDiffResult | null>(null);
const error = ref("");
const status = ref("");
const busy = ref(false);
let revision = 0;
let controller: AbortController | undefined;
watch([left, right, ignoreWhitespace], reset, { flush: "sync" });
onBeforeUnmount(() => controller?.abort());

function reset() {
  controller?.abort();
  revision++;
  busy.value = false;
  result.value = null;
  error.value = "";
  status.value = "";
}

async function run() {
  reset();
  const id = revision;
  controller = new AbortController();
  busy.value = true;
  try {
    const value = await runWorker<TextDiffResult>(
      new Worker(new URL("../workers/textDiff.worker.ts", import.meta.url), { type: "module" }),
      {
        left: left.value,
        right: right.value,
        ignoreWhitespace: ignoreWhitespace.value,
      },
      5000,
      controller.signal,
    );
    if (id === revision) {
      result.value = value;
      status.value = value.added || value.removed ? t('对比完成') : t('按当前规则，文本一致');
    }
  } catch (reason) {
    if (id === revision) error.value = reason instanceof Error ? reason.message : t('对比失败。');
  } finally {
    if (id === revision) busy.value = false;
  }
}
</script>
