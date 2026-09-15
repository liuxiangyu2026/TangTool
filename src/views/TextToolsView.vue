<template>
  <ToolPage :description="t('逐行整理文本：先去首尾空白，再移除空行、去重，最后排序。区分大小写；排序按字符顺序，不按拼音或数值。')" :error="error" :status="status">
    <template #actions>
      <button class="tool-button bg-violet-600" type="button" @click="input = ' banana \napple\n\napple\nBanana\n橙子'">
        <FileText :size="14" />
        {{ t('示例') }}
      </button>
      <button class="tool-button bg-blue-600" type="button" @click="process">
        <ListFilter :size="14" />
        {{ t('整理') }}
      </button>
      <button class="tool-button bg-emerald-600" type="button" :disabled="!result" @click="copyResult">
        <Copy :size="14" />
        {{ t('复制结果') }}
      </button>
      <button class="tool-button bg-red-600" type="button" @click=" input = ''; reset(); ">
        <Trash2 :size="14" />
        {{ t('清除') }}
      </button>
    </template>
    <div class="tool-panel flex flex-wrap items-center gap-4 text-sm">
      <label class="flex items-center gap-2">
        <input v-model="trim" type="checkbox" />
        {{ t('去首尾空白') }}
      </label>
      <label class="flex items-center gap-2">
        <input v-model="removeEmpty" type="checkbox" />
        {{ t('移除空行') }}
      </label>
      <label class="flex items-center gap-2">
        <input v-model="deduplicate" type="checkbox" />
        {{ t('去重（保留首次出现）') }}
      </label>
      <select v-model="sort" class="tool-field" :aria-label="t('文本排序')">
        <option value="none">{{ t('保留顺序') }}</option>
        <option value="ascending">{{ t('升序') }}</option>
        <option value="descending">{{ t('降序') }}</option>
      </select>
    </div>
    <SplitPane direction="horizontal" :label="t('调整文本整理输入和结果宽度')">
      <template #first>
        <textarea v-model="input" class="tool-editor h-full" :aria-label="t('待整理文本')" :placeholder="t('每行一项')"></textarea>
      </template>
      <template #second>
        <textarea class="tool-editor h-full" :value="result" readonly :aria-label="t('整理结果')" :placeholder="t('结果显示在这里')"></textarea>
      </template>
    </SplitPane>
  </ToolPage>
</template>

<script setup lang="ts">
import { t } from "../i18n/index";
import SplitPane from "../components/SplitPane.vue";
import { ref, watch } from "vue";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { Copy, FileText, ListFilter, Trash2 } from "lucide-vue-next";
import ToolPage from "../components/ToolPage.vue";
import { organizeText } from "../utils/developerTools";

const input = ref("");
const result = ref("");
const error = ref("");
const status = ref("");
const trim = ref(true);
const removeEmpty = ref(true);
const deduplicate = ref(true);
const sort = ref<"none" | "ascending" | "descending">("none");
watch([input, trim, removeEmpty, deduplicate, sort], reset, { flush: "sync" });

function reset() {
  result.value = "";
  error.value = "";
  status.value = "";
}

function process() {
  reset();
  if (!input.value) {
    error.value = t('请先输入文本。');
    return;
  }
  if (input.value.length > 1_000_000) {
    error.value = t('单次最多处理 100 万个字符，请分批整理。');
    return;
  }
  result.value = organizeText(input.value, { trim: trim.value, removeEmpty: removeEmpty.value, deduplicate: deduplicate.value, sort: sort.value });
  status.value = result.value ? t('文本整理完成') : t('整理完成，没有保留任何非空内容');
}

async function copyResult() {
  try {
    await writeText(result.value);
    status.value = t('已复制整理结果');
  } catch {
    error.value = t('复制失败，请重试。');
  }
}
</script>
