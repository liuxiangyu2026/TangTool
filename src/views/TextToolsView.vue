<template>
  <ToolPage description="逐行整理文本：先去首尾空白，再移除空行、去重，最后排序。区分大小写；排序按字符顺序，不按拼音或数值。" :error="error" :status="status">
    <template #actions>
      <button class="tool-button bg-violet-600" type="button" @click="input = ' banana \napple\n\napple\nBanana\n橙子'">
        <FileText :size="14" />
        示例
      </button>
      <button class="tool-button bg-blue-600" type="button" @click="process">
        <ListFilter :size="14" />
        整理
      </button>
      <button class="tool-button bg-emerald-600" type="button" :disabled="!result" @click="copyResult">
        <Copy :size="14" />
        复制结果
      </button>
      <button class="tool-button bg-red-600" type="button" @click=" input = ''; reset(); ">
        <Trash2 :size="14" />
        清除
      </button>
    </template>
    <div class="tool-panel flex flex-wrap items-center gap-4 text-sm">
      <label class="flex items-center gap-2">
        <input v-model="trim" type="checkbox" />
        去首尾空白
      </label>
      <label class="flex items-center gap-2">
        <input v-model="removeEmpty" type="checkbox" />
        移除空行
      </label>
      <label class="flex items-center gap-2">
        <input v-model="deduplicate" type="checkbox" />
        去重（保留首次出现）
      </label>
      <select v-model="sort" class="tool-field" aria-label="文本排序">
        <option value="none">保留顺序</option>
        <option value="ascending">升序</option>
        <option value="descending">降序</option>
      </select>
    </div>
    <SplitPane direction="horizontal" label="调整文本整理输入和结果宽度">
      <template #first>
        <textarea v-model="input" class="tool-editor h-full" aria-label="待整理文本" placeholder="每行一项"></textarea>
      </template>
      <template #second>
        <textarea class="tool-editor h-full" :value="result" readonly aria-label="整理结果" placeholder="结果显示在这里"></textarea>
      </template>
    </SplitPane>
  </ToolPage>
</template>

<script setup lang="ts">
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
    error.value = "请先输入文本。";
    return;
  }
  if (input.value.length > 1_000_000) {
    error.value = "单次最多处理 100 万个字符，请分批整理。";
    return;
  }
  result.value = organizeText(input.value, { trim: trim.value, removeEmpty: removeEmpty.value, deduplicate: deduplicate.value, sort: sort.value });
  status.value = result.value ? "文本整理完成" : "整理完成，没有保留任何非空内容";
}

async function copyResult() {
  try {
    await writeText(result.value);
    status.value = "已复制整理结果";
  } catch {
    error.value = "复制失败，请重试。";
  }
}
</script>
