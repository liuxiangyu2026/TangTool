<template>
  <ToolPage :description="t('输入或选项变化时自动更新：去首尾空白 → 去空行 → 去重 → 排序 → 首尾引号 → 分隔符输出。默认按行输出，选择其他分隔符即可拼接。')" :error="copyError" :status="status">
    <template #actions>
      <button class="tool-button bg-violet-600" type="button" @click="input = ' banana \napple\n\napple\nBanana\n001\n002\n002\n橙子'">
        <FileText :size="14" />
        {{ t('示例') }}
      </button>
      <button class="tool-button bg-emerald-600" type="button" :disabled="!result" @click="copyResult">
        <Copy :size="14" />
        {{ t('复制结果') }}
      </button>
      <button class="tool-button bg-red-600" type="button" @click="input = ''">
        <Trash2 :size="14" />
        {{ t('清除') }}
      </button>
    </template>
    <div class="tool-panel flex flex-wrap items-center gap-4 text-sm">
      <label class="flex items-center gap-2"><input v-model="trim" type="checkbox" />{{ t('去首尾空白') }}</label>
      <label class="flex items-center gap-2"><input v-model="removeEmpty" type="checkbox" />{{ t('移除空行') }}</label>
      <label class="flex items-center gap-2"><input v-model="deduplicate" type="checkbox" />{{ t('去重（保留首次出现）') }}</label>
      <select v-model="sort" class="tool-field" :aria-label="t('文本排序')">
        <option value="none">{{ t('保留顺序') }}</option>
        <option value="ascending">{{ t('升序') }}</option>
        <option value="descending">{{ t('降序') }}</option>
      </select>
      <label class="flex items-center gap-2">
        {{ t('分隔符') }}
        <select v-model="separator" class="tool-field">
          <option :value="'\n'">{{ t('换行（每项一行）') }}</option>
          <option v-for="value in textSeparators" :key="value" :value="value">{{ value }}</option>
          <option value=" ">{{ t('空格') }}</option>
          <option value="custom">{{ t('自定义') }}</option>
        </select>
      </label>
      <input v-if="separator === 'custom'" v-model="customSeparator" class="tool-field w-32" maxlength="32" :aria-label="t('自定义分隔符')" :placeholder="t('可留空直接拼接')" />
      <label class="flex items-center gap-2">
        {{ t('引号处理') }}
        <select v-model="quoteAction" class="tool-field">
          <option value="none">{{ t('不处理') }}</option>
          <option value="add">{{ t('添加首尾引号') }}</option>
          <option value="remove">{{ t('去掉首尾一对引号') }}</option>
        </select>
      </label>
      <label v-if="quoteAction === 'add'" class="flex items-center gap-2">
        {{ t('引号类型') }}
        <select v-model="quoteStyle" class="tool-field">
          <option value="double">{{ t('英文双引号') }} " "</option>
          <option value="single">{{ t('英文单引号') }} ' '</option>
          <option value="chineseDouble">{{ t('中文双引号') }} “ ”</option>
          <option value="chineseSingle">{{ t('中文单引号') }} ‘ ’</option>
        </select>
      </label>
      <p class="w-full text-xs leading-5 text-neutral-500">{{ t('去除时自动识别中英文单/双引号，仅去掉首尾一对。按换行拆分，不解析单元格内换行；仅拼接文本，不执行 CSV/SQL 转义。') }}</p>
    </div>
    <p class="h-5 shrink-0 truncate text-xs" :class="processingError ? 'text-red-600' : 'text-neutral-500'" :title="processingError" role="status">{{ processingError || t('共 {count} 项，结果实时更新', { count }) }}</p>
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
import { locale, t } from "../i18n/index";
import SplitPane from "../components/SplitPane.vue";
import { ref, watch } from "vue";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { Copy, FileText, Trash2 } from "lucide-vue-next";
import ToolPage from "../components/ToolPage.vue";
import { processText, textSeparators, type TextProcessingOptions } from "../utils/textProcessing";

const input = ref("");
const result = ref("");
const count = ref(0);
const processingError = ref("");
const copyError = ref("");
const status = ref("");
const trim = ref(true);
const removeEmpty = ref(true);
const deduplicate = ref(true);
const sort = ref<TextProcessingOptions["sort"]>("none");
const separator = ref("\n");
const customSeparator = ref(", ");
const quoteAction = ref<TextProcessingOptions["quoteAction"]>("none");
const quoteStyle = ref<TextProcessingOptions["quoteStyle"]>("double");
let revision = 0;

// 同步计算确保选项改变后不能复制到上一版结果；空输入及清除不会弹出错误提示。
watch([input, trim, removeEmpty, deduplicate, sort, separator, customSeparator, quoteAction, quoteStyle, locale], () => {
  revision += 1;
  copyError.value = "";
  status.value = "";
  try {
    const processed = processText(input.value, {
      trim: trim.value, removeEmpty: removeEmpty.value, deduplicate: deduplicate.value, sort: sort.value,
      separator: separator.value === "custom" ? customSeparator.value : separator.value,
      quoteAction: quoteAction.value, quoteStyle: quoteStyle.value,
    });
    result.value = processed.text;
    count.value = processed.count;
    processingError.value = "";
  } catch (reason) {
    result.value = "";
    count.value = 0;
    processingError.value = reason instanceof Error ? reason.message : t('转换失败。');
  }
}, { flush: "sync", immediate: true });

async function copyResult() {
  const snapshot = result.value;
  if (!snapshot) return;
  const copiedRevision = revision;
  copyError.value = "";
  status.value = "";
  try {
    await writeText(snapshot);
    if (copiedRevision === revision) status.value = t('已复制整理结果');
  } catch {
    if (copiedRevision === revision) copyError.value = t('复制失败，请重试。');
  }
}
</script>
