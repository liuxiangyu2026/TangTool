<template>
  <section class="flex h-full min-h-0 flex-col bg-neutral-100 p-4 sm:p-6">
    <ToolNotice :status="statusMessage" :error="errorMessage" :tone="statusTone" />
    <header class="shrink-0">
      <p class="text-sm font-medium text-neutral-500">{{ route.meta.group }}</p>
      <h1 class="mt-1 text-2xl font-semibold text-neutral-900">{{ route.meta.title }}</h1>
    </header>

    <div class="mt-4 flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-neutral-200 bg-surface">
      <div class="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-neutral-200 px-4 py-3">
        <div class="flex flex-wrap items-center gap-2">
          <button class="flex items-center gap-1.5 rounded-md bg-violet-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2" type="button" @click="loadExample">
            <BookOpen :size="14" aria-hidden="true" />
            <span>示例</span>
          </button>
          <button class="flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2" type="button" @click="transformJson(formatJson)">
            <WandSparkles :size="14" aria-hidden="true" />
            <span>格式化</span>
          </button>
          <button class="flex items-center gap-1.5 rounded-md bg-amber-500 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:ring-offset-2" type="button" @click="transformJson(minifyJson)">
            <Minimize2 :size="14" aria-hidden="true" />
            <span>压缩</span>
          </button>
          <button class="flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2" type="button" @click="copyJson">
            <Copy :size="14" aria-hidden="true" />
            <span>复制</span>
          </button>
          <button class="flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2" type="button" @click="clearJson">
            <Trash2 :size="14" aria-hidden="true" />
            <span>清除</span>
          </button>
          <button class="flex items-center gap-1.5 rounded-md bg-sky-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2" type="button" @click="importJsonFile">
            <FolderOpen :size="14" aria-hidden="true" />
            <span>导入</span>
          </button>
          <button class="flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2" type="button" @click="exportJsonFile">
            <Save :size="14" aria-hidden="true" />
            <span>导出</span>
          </button>
        </div>
      </div>

      <div ref="editorHost" class="min-h-0 flex-1 overflow-hidden"></div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { editorPreferences } from "../utils/editorPreferences";
import { usePreferencesStore } from "../stores/preferences";
import { exportDefaults } from "../utils/exportDefaults";
import ToolNotice from "../components/ToolNotice.vue";
import { jsonHighlightStyle, jsonEditorTheme } from "../utils/jsonEditorAppearance";
import { json } from "@codemirror/lang-json";
import { syntaxHighlighting } from "@codemirror/language";
import { forceLinting, linter, lintGutter } from "@codemirror/lint";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { open, save } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { basicSetup, EditorView } from "codemirror";
import { BookOpen, Copy, FolderOpen, Minimize2, Save, Trash2, WandSparkles } from "lucide-vue-next";
import { onActivated, onBeforeUnmount, onMounted, ref } from "vue";
import { useRoute } from "vue-router";

import { formatJson, formatJsonErrorMessage, minifyJson, validateJson, type FormatJsonResult, type JsonErrorResult } from "../utils/json";

type JsonTransform = (input: string) => FormatJsonResult;
type StatusTone = "success" | "neutral";

const EXAMPLE_JSON = JSON.stringify({
  name: "TangTool",
  version: "0.1.0",
  offline: true,
  tools: [
    { name: "JSON 格式化", enabled: true },
    { name: "JSON 对比", enabled: false },
  ],
  settings: {
    indent: 2,
    theme: null,
  },
}, null, 2);

const JSON_FILE_FILTERS = [{ name: "JSON 文件", extensions: ["json"] }];

const route = useRoute();
const preferences = usePreferencesStore();
const editorHost = ref<HTMLDivElement | null>(null);
const errorMessage = ref("");
const statusMessage = ref("");
const statusTone = ref<StatusTone>("success");
let editorView: EditorView | null = null;

onMounted(() => {
  if (!editorHost.value) {
    return;
  }

  editorView = new EditorView({
    parent: editorHost.value,
    extensions: [
      basicSetup, editorPreferences(), json(),
      linter((view) => {
        const result = validateJson(view.state.doc.toString());
        if (result.ok || result.position === undefined) {
          return [];
        }

        const from = Math.min(result.position, view.state.doc.length);
        return [{
          from,
          to: Math.min(from + 1, view.state.doc.length),
          message: formatJsonErrorMessage(result),
          severity: "error",
        }];
      }, { delay: 300 }),
      lintGutter(),
      syntaxHighlighting(jsonHighlightStyle),
      jsonEditorTheme,
      EditorView.contentAttributes.of({ "aria-label": "JSON 编辑器" }),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          errorMessage.value = "";
          statusMessage.value = "";
        }
      }),
    ],
  });
});

onBeforeUnmount(() => {
  editorView?.destroy();
});

onActivated(() => {
  editorView?.requestMeasure();
});

function transformJson(transform: JsonTransform) {
  const input = editorView?.state.doc.toString() ?? "";
  const result = transform === formatJson ? formatJson(input, preferences.indentWidth) : transform(input);
  statusMessage.value = "";

  if (!result.ok) {
    showJsonError(result);
    return;
  }

  replaceEditorContent(result.value);
  errorMessage.value = "";
}

function loadExample() {
  replaceEditorContent(EXAMPLE_JSON);
  setStatus("已填充示例 JSON");
}

async function importJsonFile() {
  errorMessage.value = "";
  statusMessage.value = "";

  try {
    const selected = await open({
      title: "导入 JSON 文件",
      multiple: false,
      directory: false,
      filters: JSON_FILE_FILTERS,
    });

    if (selected === null) {
      setStatus("已取消导入", "neutral");
      return;
    }

    const content = await readTextFile(selected);
    replaceEditorContent(content);
    const validationResult = validateJson(content);

    if (!validationResult.ok) {
      showJsonError(validationResult);
      return;
    }

    const fileName = selected.split(/[\\/]/).pop() || "JSON 文件";
    setStatus(`已导入 ${fileName}`);
  } catch {
    errorMessage.value = "读取 JSON 文件失败，请确认文件可访问且为 UTF-8 文本";
  }
}

async function exportJsonFile() {
  const content = editorView?.state.doc.toString() ?? "";
  const validationResult = validateJson(content);
  statusMessage.value = "";

  if (!validationResult.ok) {
    showJsonError(validationResult);
    return;
  }

  try {
    const selected = await save({
      title: "导出 JSON 文件",
      defaultPath: exportDefaults("tangtool.json").path,
      filters: JSON_FILE_FILTERS,
    });

    if (selected === null) {
      setStatus("已取消导出", "neutral");
      return;
    }

    await writeTextFile(selected, content);
    setStatus("JSON 文件已保存");
  } catch {
    errorMessage.value = "保存 JSON 文件失败，请确认目标位置可写";
  }
}

function replaceEditorContent(content: string) {
  const view = editorView;
  if (!view) {
    return;
  }

  view.dispatch({
    changes: {
      from: 0,
      to: view.state.doc.length,
      insert: content,
    },
  });
  view.focus();
  forceLinting(view);
}

function showJsonError(result: JsonErrorResult) {
  const view = editorView;
  errorMessage.value = formatJsonErrorMessage(result);

  if (!view || result.position === undefined) {
    return;
  }

  const from = Math.min(result.position, view.state.doc.length);
  view.dispatch({
    selection: {
      anchor: from,
      head: Math.min(from + 1, view.state.doc.length),
    },
    effects: EditorView.scrollIntoView(from, { y: "center" }),
  });
  view.focus();
  forceLinting(view);
}

function setStatus(message: string, tone: StatusTone = "success") {
  errorMessage.value = "";
  statusMessage.value = message;
  statusTone.value = tone;
}

async function copyJson() {
  const content = editorView?.state.doc.toString() ?? "";
  statusMessage.value = "";

  if (content.trim() === "") {
    errorMessage.value = "没有可复制的 JSON 内容";
    return;
  }

  try {
    await writeText(content);
    setStatus("已复制到剪贴板");
  } catch {
    errorMessage.value = "复制失败，请检查系统剪贴板权限";
  }
}

function clearJson() {
  replaceEditorContent("");
  errorMessage.value = "";
  statusMessage.value = "";
}

</script>
