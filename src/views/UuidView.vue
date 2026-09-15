<template>
  <ToolPage :description="t('批量生成 UUID v4，使用安全随机源。不包含设备标识和时间信息；不作为密码使用。')" :error="error" :status="status">
    <template #actions>
      <button class="tool-button bg-blue-600" type="button" @click="generate">
        <RefreshCw :size="14" />
        {{ t('生成') }}
      </button>
      <button class="tool-button bg-emerald-600" type="button" :disabled="!result" @click="copyResult">
        <Copy :size="14" />
        {{ t('复制全部') }}
      </button>
      <button class="tool-button bg-red-600" type="button" @click="clear">
        <Trash2 :size="14" />
        {{ t('清除') }}
      </button>
    </template>
    <div class="tool-panel flex flex-wrap items-center gap-5 text-sm">
      <label class="flex items-center gap-2">
        {{ t('数量') }}
        <input v-model.number="count" class="tool-field w-24" type="number" min="1" max="1000" step="1" @input="clear" />
      </label>
      <label class="flex items-center gap-2">
        <input v-model="uppercase" type="checkbox" @change="status = ''" />
        {{ t('大写') }}
      </label>
      <label class="flex items-center gap-2">
        <input v-model="hyphens" type="checkbox" @change="status = ''" />
        {{ t('保留连字符') }}
      </label>
      <span class="text-xs text-neutral-500">{{ t('每次 1～1000 条，默认 10 条') }}</span>
    </div>
    <textarea class="tool-editor" :value="result" readonly :aria-label="t('UUID 生成结果')" :placeholder="t('点击生成，每行一个 UUID')"></textarea>
  </ToolPage>
</template>

<script setup lang="ts">
import { t } from "../i18n/index";
import { computed, ref } from "vue";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { Copy, RefreshCw, Trash2 } from "lucide-vue-next";
import ToolPage from "../components/ToolPage.vue";
import { generateUuids } from "../utils/developerTools";

const count = ref(10);
const uppercase = ref(false);
const hyphens = ref(true);
const values = ref<string[]>([]);
const error = ref("");
const status = ref("");
const result = computed(() =>
  values.value
    .map((value) => {
      const formatted = hyphens.value ? value : value.replace(/-/g, "");
      return uppercase.value ? formatted.toUpperCase() : formatted;
    })
    .join("\n"),
);

function clear() {
  values.value = [];
  error.value = "";
  status.value = "";
}

function generate() {
  clear();
  try {
    values.value = generateUuids(count.value);
    status.value = t('已生成 {p0} 条 UUID', { p0: values.value.length });
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : t('生成失败');
  }
}

async function copyResult() {
  try {
    await writeText(result.value);
    status.value = t('已复制全部 UUID');
  } catch {
    error.value = t('复制失败，请重试。');
  }
}
</script>
