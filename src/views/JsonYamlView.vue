<template>
  <ToolPage :description="t('本地 JSON / YAML 1.2 互转。仅转换数据，YAML 注释和排版不保留；不支持多文档、循环别名和非字符串键。')" :error="error" :status="status">
    <template #actions>
      <button class="tool-button bg-violet-600" type="button" @click="example"><BookOpen :size="14" />{{ t('示例') }}</button>
      <label class="tool-button cursor-pointer bg-sky-600"><FolderOpen :size="14" />{{ t('导入文件') }}<input type="file" accept=".json,.yaml,.yml,.txt" class="sr-only" :aria-label="t('导入 JSON 或 YAML 文件')" @change="importFile" /></label>
      <button class="tool-button bg-blue-600" type="button" :disabled="busy" @click="run"><ArrowLeftRight :size="14" />{{ busy ? t('处理中') : t('转换') }}</button>
      <button class="tool-button bg-emerald-600" type="button" :disabled="!output" @click="copy"><Copy :size="14" />{{ t('复制结果') }}</button>
      <button class="tool-button bg-indigo-600" type="button" :disabled="!output" @click="save"><Save :size="14" />{{ t('导出') }}</button>
      <button class="tool-button bg-red-600" type="button" @click="input = ''; reset()"><Trash2 :size="14" />{{ t('清除') }}</button>
    </template>
    <label class="tool-panel flex items-center gap-3 text-sm">{{ t('转换方向') }}
      <select v-model="direction" class="tool-field"><option value="json-yaml">JSON → YAML</option><option value="yaml-json">YAML → JSON</option></select>
    </label>
    <SplitPane :label="t('调整转换输入和结果宽度')">
      <template #first><textarea v-model="input" class="tool-editor h-full" :aria-label="t('JSON / YAML 输入')" spellcheck="false"></textarea></template>
      <template #second><textarea :value="output" class="tool-editor h-full" :aria-label="t('JSON / YAML 转换结果')" readonly></textarea></template>
    </SplitPane>
  </ToolPage>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from "vue";
import { ArrowLeftRight, BookOpen, Copy, FolderOpen, Save, Trash2 } from "lucide-vue-next";
import ToolPage from "../components/ToolPage.vue";
import SplitPane from "../components/SplitPane.vue";
import { t } from "../i18n";
import { usePreferencesStore } from "../stores/preferences";
import { runWorker } from "../utils/workerTask";
import { copyText } from "../utils/textClipboard";
import { saveOutput } from "../utils/saveOutput";

const preferences = usePreferencesStore();
const direction = ref<"json-yaml" | "yaml-json">("json-yaml");
const input = ref("");
const output = ref("");
const error = ref("");
const status = ref("");
const busy = ref(false);
let revision = 0;
let controller: AbortController | undefined;
watch([input, direction, () => preferences.indentWidth], reset, { flush: "sync" });
onBeforeUnmount(() => controller?.abort());

function reset() {
  controller?.abort();
  revision++;
  output.value = "";
  error.value = "";
  status.value = "";
  busy.value = false;
}

function example() {
  input.value = direction.value === "json-yaml"
    ? JSON.stringify({ name: "TangTool", local: true, tools: ["JSON", "YAML"], settings: null }, null, 2)
    : 'name: TangTool\nlocal: true\ntools:\n  - JSON\n  - YAML\nsettings: null\n';
}

async function importFile(event: Event) {
  const element = event.target as HTMLInputElement;
  const file = element.files?.[0];
  element.value = "";
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) {
    error.value = t('文件最多 2 MiB。');
    return;
  }
  reset();
  const id = revision;
  try {
    const text = await file.text();
    if (id !== revision) return;
    direction.value = /\.ya?ml$/i.test(file.name) ? "yaml-json" : "json-yaml";
    input.value = text;
  } catch {
    if (id === revision) error.value = t('读取文件失败。');
  }
}

async function run() {
  reset();
  const id = revision;
  controller = new AbortController();
  busy.value = true;
  try {
    const result = await runWorker<string>(new Worker(new URL("../workers/jsonYaml.worker.ts", import.meta.url), { type: "module" }), { input: input.value, direction: direction.value, indent: preferences.indentWidth }, 5000, controller.signal);
    if (id === revision) {
      output.value = result;
      status.value = t('转换完成');
    }
  } catch (reason) {
    if (id === revision) error.value = reason instanceof Error ? reason.message : t('转换失败，请检查输入。');
  } finally {
    if (id === revision) busy.value = false;
  }
}

async function copy() {
  try {
    await copyText(output.value);
    status.value = t('已复制到剪贴板');
  } catch {
    error.value = t('复制失败，请检查剪贴板权限。');
  }
}

async function save() {
  const id = revision;
  const extension = direction.value === "json-yaml" ? "yaml" : "json";
  try {
    const saved = await saveOutput(new TextEncoder().encode(output.value), `converted.${extension}`, extension, "text/plain;charset=utf-8");
    if (id === revision) status.value = saved ? t('已保存') : t('已取消保存');
  } catch {
    if (id === revision) error.value = t('保存失败，请检查目标路径。');
  }
}
</script>
