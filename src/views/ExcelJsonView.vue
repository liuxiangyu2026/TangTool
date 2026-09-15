<template>
  <ToolPage :description="t('导入 XLSX / XLS / UTF-8 CSV，选择工作表转 JSON。空单元格为 null；合并单元格只保留左上角值，不执行公式或宏。')" :error="error" :status="status">
    <template #actions>
      <label class="tool-button cursor-pointer bg-violet-600">
        <FolderOpen :size="14" />
        {{ t('选择表格') }}
        <input type="file" class="sr-only" accept=".xlsx,.xls,.csv" :aria-label="t('选择表格文件')" :disabled="busy" @change="selectFile" />
      </label>
      <button class="tool-button bg-blue-600" type="button" :disabled="!data || busy" @click="convert">
        <RefreshCw :size="14" />
        {{ busy ? t('处理中') : t('转换') }}
      </button>
      <button class="tool-button bg-emerald-600" type="button" :disabled="!result" @click="exportJson">
        <Save :size="14" />
        {{ t('保存 JSON') }}
      </button>
      <button class="tool-button bg-cyan-600" type="button" :disabled="!result" @click="copyResult">
        <Copy :size="14" />
        {{ t('复制') }}
      </button>
      <button class="tool-button bg-red-600" type="button" @click="clear">
        <Trash2 :size="14" />
        {{ t('清除') }}
      </button>
    </template>
    <SplitPane direction="vertical" :label="t('调整表格选项和 JSON 结果高度')" :initial="32" :min="20" :max="60">
      <template #first>
        <div class="tool-panel space-y-3 text-sm">
          <p class="break-all">{{ filename || t('尚未选择文件（最大 10 MiB）') }}</p>
          <div class="flex flex-wrap items-center gap-4">
            <label class="flex items-center gap-2">
              {{ t('工作表') }}
              <select v-model="sheet" class="tool-field max-w-64" :disabled="!names.length || allSheets || busy">
                <option v-for="name in names" :key="name">{{ name }}</option>
              </select>
            </label>
            <label class="flex items-center gap-2">
              <input v-model="allSheets" type="checkbox" :disabled="busy" />
              {{ t('全部 Sheet（按表名分组）') }}
            </label>
            <label class="flex items-center gap-2">
              <input v-model="header" type="checkbox" :disabled="busy" />
              {{ t('首行为字段名') }}
            </label>
            <label class="flex items-center gap-2">
              <input v-model="formatted" type="checkbox" :disabled="busy" />
              {{ t('使用显示文本') }}
            </label>
          </div>
          <p class="text-xs leading-5 text-neutral-500">
            {{ t('默认保留 Excel 数值/布尔类型，日期为 Excel 序列号；勾选“使用显示文本”可保留日期、百分比等显示格式。CSV 默认按文本读取，保留前导零。空白行跳过，重名字段自动加后缀。') }}
          </p>
          <p class="h-5 truncate text-xs text-neutral-500" :title="noteText">{{ noteText || t('字段名调整说明将在这里显示。') }}</p>
        </div>
      </template>
      <template #second>
        <JsonResultEditor :value="result" />
      </template>
    </SplitPane>
  </ToolPage>
</template>

<script setup lang="ts">
import { t } from "../i18n/index";
import { usePreferencesStore } from "../stores/preferences";
import SplitPane from "../components/SplitPane.vue";
import { computed, onBeforeUnmount, ref, shallowRef, watch } from "vue";
import { FolderOpen, RefreshCw, Save, Trash2, Copy } from "lucide-vue-next";
import { isTauri } from "@tauri-apps/api/core";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import ToolPage from "../components/ToolPage.vue";
import JsonResultEditor from "../components/JsonResultEditor.vue";
import type { TableJsonResult } from "../utils/tableToJson";
import { runWorker } from "../utils/workerTask";
import { saveOutput } from "../utils/saveOutput";

const preferences = usePreferencesStore();
const data = shallowRef<ArrayBuffer | null>(null);
const filename = ref("");
const names = ref<string[]>([]);
const sheet = ref("");
const allSheets = ref(false);
const header = ref(true);
const formatted = ref(false);
const result = ref("");
const notes = ref<TableJsonResult['notes']>([]);
const noteText = computed(() => notes.value.map(note => t('{name}：第 {column} 列使用字段名 {key}', note)).join('; '));
const busy = ref(false);
const error = ref("");
const status = ref("");
let revision = 0;
let controller: AbortController | undefined;
watch([sheet, allSheets, header, formatted], invalidate, { flush: "sync" });
onBeforeUnmount(() => controller?.abort());

function invalidate() {
  revision++;
  controller?.abort();
  busy.value = false;
  result.value = "";
  notes.value = [];
  error.value = "";
  status.value = "";
}

function clear() {
  invalidate();
  data.value = null;
  filename.value = "";
  names.value = [];
  sheet.value = "";
}

async function selectFile(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (!file) return;
  clear();
  if (!/\.(xlsx|xls|csv)$/i.test(file.name) || file.size > 10 * 1024 * 1024) {
    error.value = t('请选择 10 MiB 以内的 XLSX、XLS 或 UTF-8 CSV 文件。');
    return;
  }
  const id = revision;
  busy.value = true;
  try {
    const bytes = await file.arrayBuffer();
    if (id !== revision) return;
    data.value = bytes;
    filename.value = file.name;
    await convert();
  } catch {
    if (id === revision) error.value = t('读取文件失败。');
  } finally {
    if (id === revision) busy.value = false;
  }
}

async function convert() {
  if (!data.value) return;
  invalidate();
  const id = revision;
  controller = new AbortController();
  busy.value = true;
  try {
    const value = await runWorker<TableJsonResult>(
      new Worker(new URL("../workers/tableJson.worker.ts", import.meta.url), { type: "module" }),
      {
        data: data.value,
        filename: filename.value,
        sheet: sheet.value,
        allSheets: allSheets.value,
        header: header.value,
        formatted: formatted.value,
        indent: preferences.indentWidth,
      },
      15000,
      controller.signal,
    );
    if (id !== revision) return;
    names.value = value.names;
    // 工作表赋值会触发选项清理，必须先完成它，再写入本次转换结果。
    sheet.value = value.selected;
    result.value = value.json;
    notes.value = value.notes;
    status.value = t('已转换 {p0} 行数据', { p0: value.rows });
    busy.value = false;
  } catch (reason) {
    if (id === revision) error.value = reason instanceof Error ? reason.message : t('转换失败。');
  } finally {
    if (id === revision) busy.value = false;
  }
}

async function exportJson() {
  const snapshot = result.value;
  if (!snapshot) return;
  try {
    const saved = await saveOutput(new TextEncoder().encode(snapshot), `${filename.value.replace(/\.[^.]+$/, "")}.json`, "json", "application/json");
    status.value = saved ? t('JSON 已保存') : t('已取消保存');
  } catch {
    error.value = t('保存失败，请检查目标路径。');
  }
}

async function copyResult() {
  const snapshot = result.value;
  if (!snapshot) return;
  error.value = "";
  try {
    if (isTauri()) await writeText(snapshot);
    else await navigator.clipboard.writeText(snapshot);
    status.value = t('已复制完整 JSON');
  } catch {
    error.value = t('复制失败，请检查剪贴板权限。');
  }
}
</script>
