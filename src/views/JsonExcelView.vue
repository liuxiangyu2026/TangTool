<template>
  <section class="flex h-full min-h-0 flex-col bg-neutral-100 p-4 sm:p-6">
    <ToolNotice :status="statusMessage" :error="errorMessage" :tone="statusTone" />
    <header class="shrink-0">
      <p class="text-sm font-medium text-neutral-500">{{ route.meta.group }}</p>
      <h1 class="mt-1 text-2xl font-semibold text-neutral-900">{{ route.meta.title }}</h1>
      <p class="mt-2 text-xs leading-5 text-neutral-600">
        <span class="font-medium text-blue-700">多 Sheet：</span>数组字段可生成独立工作表，并在每行重复所选主要字段。
        <span class="ml-2 font-medium text-blue-700">递归平铺：</span>树形数据按末级节点生成行，依次保留全部父级数据。
      </p>
      <p class="text-xs leading-5 text-neutral-500">点击“生成预览”后，右侧会显示适用选项；启用递归平铺时输出单个 Sheet，不与数组分表同时使用。</p>
    </header>

    <div class="mt-4 flex min-h-0 flex-1 flex-col gap-4">
      <div class="flex shrink-0 flex-wrap items-center gap-2 rounded-lg border border-neutral-200 bg-surface px-3 py-2">
        <button class="flex items-center gap-1.5 rounded-md bg-violet-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2" type="button" @click="loadExample">
          <BookOpen :size="14" aria-hidden="true" />
          <span>示例</span>
        </button>
        <button class="flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2" type="button" @click="generatePreview">
          <Table2 :size="14" aria-hidden="true" />
          <span>生成预览</span>
        </button>
        <button class="flex items-center gap-1.5 rounded-md bg-sky-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2" type="button" @click="importJsonFile">
          <FolderOpen :size="14" aria-hidden="true" />
          <span>导入</span>
        </button>
        <button class="flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2" type="button" @click="saveXlsxFile">
          <Save :size="14" aria-hidden="true" />
          <span>保存 XLSX</span>
        </button>
        <button class="flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2" type="button" @click="clearJson">
          <Trash2 :size="14" aria-hidden="true" />
          <span>清除</span>
        </button>
      </div>

      <div ref="panelSplitContainer" class="flex min-h-0 flex-1">
        <section class="flex min-h-0 min-w-0 shrink-0 flex-col overflow-hidden rounded-lg border border-neutral-200 bg-surface" :style="{ flexBasis: `${leftPanelPercent}%` }">
          <h2 class="shrink-0 border-b border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-700">JSON 数据</h2>
          <div ref="editorHost" class="min-h-0 flex-1 overflow-hidden"></div>
        </section>

        <div class="group flex w-4 shrink-0 cursor-col-resize touch-none items-center justify-center" role="separator" aria-label="调整 JSON 编辑器和 Excel 预览宽度" aria-orientation="vertical" aria-valuemin="25" aria-valuemax="75" :aria-valuenow="Math.round(leftPanelPercent)" tabindex="0" @keydown="handleSeparatorKeydown" @pointerdown="startResize" @pointermove="resizePanels" @pointerup="stopResize" @pointercancel="stopResize">
          <span class="flex h-12 w-3 items-center justify-center rounded-full border border-neutral-300 bg-surface text-neutral-400 shadow-sm transition group-hover:border-blue-400 group-hover:text-blue-600">
            <GripVertical :size="14" aria-hidden="true" />
          </span>
        </div>

        <section class="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-lg border border-neutral-200 bg-surface" aria-label="Excel 数据预览">
          <header class="flex shrink-0 items-center justify-between border-b border-neutral-200 px-3 py-2">
            <h2 class="text-sm font-medium text-neutral-700">Excel 预览</h2>
            <span v-if="activeSheet" class="text-xs text-neutral-500">{{ activeSheet.rows.length }} 行 × {{ activeSheet.columns.length }} 列</span>
          </header>

          <div v-if="arrayFields.length > 0 || recursiveArrayFields.length > 0" class="max-h-40 shrink-0 overflow-auto border-b border-blue-100 bg-blue-50/70 px-3 py-2 text-xs">
            <div v-if="recursiveArrayFields.length > 0" class="flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <span class="font-semibold text-violet-900">递归数据平铺</span>
              <label v-for="field in recursiveArrayFields" :key="field.path" class="flex cursor-pointer items-center gap-1.5 text-neutral-700" :title="`将 ${field.path} 的每条末级路径平铺为一行`">
                <input class="h-3.5 w-3.5 accent-violet-600" type="checkbox" :checked="selectedRecursivePath === field.path" @change="toggleRecursiveFlatten(field.path)" />
                <span>平铺 {{ field.path }}</span>
              </label>
              <span v-if="selectedRecursivePath" class="text-neutral-500">每行依次展示全部父级和末级节点</span>
            </div>

            <div v-if="selectedRecursivePath === '' && arrayFields.length > 0" class="flex flex-wrap items-center gap-x-3 gap-y-1.5" :class="recursiveArrayFields.length > 0 ? 'mt-2 border-t border-blue-100 pt-2' : ''">
              <span class="font-semibold text-blue-900">数组生成独立 Sheet</span>
              <label v-for="field in arrayFields" :key="field.path" class="flex cursor-pointer items-center gap-1.5 text-neutral-700" :title="field.path">
                <input v-model="selectedArrayPaths" class="h-3.5 w-3.5 accent-blue-600" type="checkbox" :value="field.path" @change="updateGenerationOptions" />
                <span>{{ field.path }}</span>
              </label>
            </div>

            <div v-if="selectedRecursivePath === '' && selectedArrayPaths.length > 0" class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-blue-100 pt-2">
              <span class="font-semibold text-blue-900">重复主要字段</span>
              <label v-for="column in repeatableColumns" :key="column" class="flex cursor-pointer items-center gap-1.5 text-neutral-700">
                <input v-model="selectedRepeatColumns" class="h-3.5 w-3.5 accent-emerald-600" type="checkbox" :value="column" @change="updateGenerationOptions" />
                <span>{{ column }}</span>
              </label>
              <span v-if="repeatableColumns.length === 0" class="text-neutral-500">没有可重复的非数组字段</span>
            </div>
          </div>

          <p v-if="!hasPreview" class="p-4 text-sm text-neutral-500">输入 JSON 后点击“生成预览”。</p>
          <div v-else-if="activeSheet" class="flex min-h-0 flex-1 flex-col">
            <nav v-if="sheets.length > 1" class="flex shrink-0 gap-1 overflow-x-auto border-b border-neutral-200 bg-neutral-50 px-2 pt-2" aria-label="工作表预览">
              <button v-for="(worksheetName, index) in worksheetNames" :key="`${worksheetName}:${index}`" class="whitespace-nowrap rounded-t-md border border-b-0 px-3 py-1.5 text-xs font-medium transition" :class="activeSheetIndex === index ? 'border-neutral-300 bg-surface text-blue-700' : 'border-transparent text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700'" type="button" @click="activeSheetIndex = index">
                {{ worksheetName }}
              </button>
            </nav>
            <div class="min-h-0 flex-1 overflow-auto">
              <table class="min-w-full border-separate border-spacing-0 text-left text-xs">
                <thead class="sticky top-0 z-10 bg-neutral-100">
                  <tr>
                    <th v-for="column in activeSheet.columns" :key="column" class="whitespace-nowrap border-b border-r border-neutral-200 px-3 py-2 font-semibold text-neutral-700">{{ column }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, rowIndex) in visibleRows" :key="rowIndex" class="odd:bg-surface even:bg-neutral-50">
                    <td v-for="column in activeSheet.columns" :key="column" class="max-w-80 whitespace-nowrap border-b border-r border-neutral-100 px-3 py-2 font-mono text-neutral-700" :title="formatPreviewCell(row[column])">{{ formatPreviewCell(row[column]) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p class="shrink-0 border-t border-neutral-200 px-3 py-2 text-xs text-neutral-500">当前 Sheet 预览前 {{ visibleRows.length }} 行，保存时包含全部 {{ activeSheet.rows.length }} 行。</p>
          </div>
        </section>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { editorPreferences } from "../utils/editorPreferences";
import { usePanelRatio } from "../composables/usePanelRatio";
import { exportDefaults } from "../utils/exportDefaults";
import ToolNotice from "../components/ToolNotice.vue";
import { json } from "@codemirror/lang-json";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { forceLinting, linter, lintGutter } from "@codemirror/lint";
import { open, save } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeFile } from "@tauri-apps/plugin-fs";
import { tags } from "@lezer/highlight";
import { basicSetup, EditorView } from "codemirror";
import { BookOpen, FolderOpen, GripVertical, Save, Table2, Trash2 } from "lucide-vue-next";
import { computed, onActivated, onBeforeUnmount, onMounted, ref } from "vue";
import { useRoute } from "vue-router";

import { formatJsonErrorMessage, validateJson, type JsonErrorResult } from "../utils/json";
import { jsonToWorkbook, type JsonArrayField, type JsonRecursiveArrayField, type JsonTableRow, type JsonTableSheet, type JsonToWorkbookResult } from "../utils/jsonToTable";
import { createWorksheetNames, createXlsxData } from "../utils/xlsx";

type StatusTone = "success" | "neutral";
type JsonWorkbookSuccessResult = Extract<JsonToWorkbookResult, { ok: true }>;

const PREVIEW_ROW_LIMIT = 50;
const EXAMPLE_JSON = JSON.stringify([
  {
    name: "TangTool",
    version: "0.1.0",
    user: { age: 18, active: true },
    tags: ["JSON", "Tauri"],
    modules: [
      { name: "格式化", enabled: true },
      { name: "对比", enabled: true },
    ],
    note: null,
  },
  {
    name: "TangTool Desktop",
    version: "0.2.0",
    user: { age: 20, active: false },
    tags: [],
    modules: [
      { name: "转 Excel", enabled: true },
    ],
    platform: "macOS",
  },
], null, 2);

const JSON_FILE_FILTERS = [{ name: "JSON 文件", extensions: ["json"] }];
const XLSX_FILE_FILTERS = [{ name: "Excel 工作簿", extensions: ["xlsx"] }];

const route = useRoute();
const editorHost = ref<HTMLDivElement | null>(null);
const panelSplitContainer = ref<HTMLDivElement | null>(null);
const sheets = ref<JsonTableSheet[]>([]);
const arrayFields = ref<JsonArrayField[]>([]);
const recursiveArrayFields = ref<JsonRecursiveArrayField[]>([]);
const repeatableColumns = ref<string[]>([]);
const selectedArrayPaths = ref<string[]>([]);
const selectedRepeatColumns = ref<string[]>([]);
const selectedRecursivePath = ref("");
const activeSheetIndex = ref(0);
const errorMessage = ref("");
const statusMessage = ref("");
const statusTone = ref<StatusTone>("success");
const leftPanelPercent = usePanelRatio("json-excel:left", 45, 25, 75);
const hasPreview = computed(() => sheets.value.length > 0);
const activeSheet = computed(() => sheets.value[activeSheetIndex.value]);
const visibleRows = computed(() => activeSheet.value?.rows.slice(0, PREVIEW_ROW_LIMIT) ?? []);
const worksheetNames = computed(() => createWorksheetNames(sheets.value.map((sheet) => sheet.name)));
let editorView: EditorView | null = null;
let activePointerId: number | null = null;
let activeResizeHandle: HTMLElement | null = null;
let previousUserSelect = "";

const jsonHighlightStyle = HighlightStyle.define([
  { tag: tags.propertyName, color: "var(--syntax-key)" },
  { tag: tags.string, color: "var(--syntax-string)" },
  { tag: tags.number, color: "var(--syntax-number)" },
  { tag: [tags.bool, tags.null], color: "var(--syntax-literal)" },
]);

const editorTheme = EditorView.theme({
  "&": { height: "100%", fontSize: "0.875rem" },
  ".cm-scroller": {
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    lineHeight: "1.5",
    overflow: "auto",
  },
  ".cm-content": { minHeight: "100%", padding: "12px 0" },
  ".cm-gutters": { backgroundColor: "var(--color-neutral-50)", borderRight: "1px solid var(--color-neutral-200)", color: "var(--color-neutral-500)" },
  ".cm-activeLine": { backgroundColor: "var(--color-neutral-50)" },
  ".cm-activeLineGutter": { backgroundColor: "var(--color-neutral-200)" },
}, { dark: false });

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
      editorTheme,
      EditorView.contentAttributes.of({ "aria-label": "JSON 转 Excel 编辑器" }),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          resetPreview();
          errorMessage.value = "";
          statusMessage.value = "";
        }
      }),
    ],
  });
});

onActivated(() => {
  editorView?.requestMeasure();
});

onBeforeUnmount(() => {
  finishResize();
  editorView?.destroy();
});

function startResize(event: PointerEvent) {
  const handle = event.currentTarget as HTMLElement;
  event.preventDefault();
  activePointerId = event.pointerId;
  activeResizeHandle = handle;
  handle.focus();
  previousUserSelect = document.body.style.userSelect;
  document.body.style.userSelect = "none";
  handle.setPointerCapture(event.pointerId);
}

function resizePanels(event: PointerEvent) {
  if (event.pointerId !== activePointerId || !panelSplitContainer.value) {
    return;
  }

  const bounds = panelSplitContainer.value.getBoundingClientRect();
  leftPanelPercent.value = clamp(((event.clientX - bounds.left) / bounds.width) * 100, 25, 75);
  editorView?.requestMeasure();
}

function stopResize(event: PointerEvent) {
  if (event.pointerId === activePointerId) {
    finishResize();
  }
}

function finishResize() {
  if (activeResizeHandle && activePointerId !== null && activeResizeHandle.hasPointerCapture(activePointerId)) {
    activeResizeHandle.releasePointerCapture(activePointerId);
  }

  document.body.style.userSelect = previousUserSelect;
  activePointerId = null;
  activeResizeHandle = null;
}

function handleSeparatorKeydown(event: KeyboardEvent) {
  if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
    return;
  }

  event.preventDefault();
  leftPanelPercent.value = clamp(leftPanelPercent.value + (event.key === "ArrowRight" ? 2 : -2), 25, 75);
  editorView?.requestMeasure();
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}

function loadExample() {
  replaceEditorContent(EXAMPLE_JSON);
  generatePreview();
}

function generatePreview() {
  const result = createTablePreview();
  if (result) {
    setStatus(createPreviewStatus(result));
  }
}

function updateGenerationOptions() {
  const result = createTablePreview();
  if (result) {
    setStatus(createPreviewStatus(result));
  }
}

function toggleRecursiveFlatten(path: string) {
  selectedRecursivePath.value = selectedRecursivePath.value === path ? "" : path;
  activeSheetIndex.value = 0;
  updateGenerationOptions();
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
    const result = createTablePreview();

    if (result) {
      const fileName = selected.split(/[\\/]/).pop() || "JSON 文件";
      setStatus(`已导入 ${fileName}，主 Sheet 共 ${result.sheets[0].rows.length} 行`);
    }
  } catch {
    errorMessage.value = "读取 JSON 文件失败，请确认文件可访问且为 UTF-8 文本";
  }
}

async function saveXlsxFile() {
  const result = createTablePreview();
  if (!result) {
    return;
  }

  try {
    const selected = await save({
      title: "保存 Excel 工作簿",
      defaultPath: exportDefaults("tangtool-data.xlsx").path,
      filters: XLSX_FILE_FILTERS,
    });

    if (selected === null) {
      setStatus("已取消保存", "neutral");
      return;
    }

    await writeFile(selected, createXlsxData(result.sheets));
    setStatus(`XLSX 文件已保存，共 ${result.sheets.length} 个 Sheet`);
  } catch {
    errorMessage.value = "保存 XLSX 文件失败，请确认目标位置可写";
  }
}

function createTablePreview(): JsonWorkbookSuccessResult | null {
  const result = jsonToWorkbook(editorView?.state.doc.toString() ?? "", {
    arrayPaths: selectedArrayPaths.value,
    repeatColumns: selectedRepeatColumns.value,
    flattenRecursivePath: selectedRecursivePath.value || undefined,
  });

  if (!result.ok) {
    resetPreview();
    showJsonError(result);
    return null;
  }

  const availableArrayPaths = new Set(result.arrayFields.map((field) => field.path));
  const availableRecursivePaths = new Set(result.recursiveArrayFields.map((field) => field.path));
  const availableRepeatColumns = new Set(result.repeatableColumns);
  selectedArrayPaths.value = selectedArrayPaths.value.filter((path) => availableArrayPaths.has(path));
  selectedRepeatColumns.value = selectedRepeatColumns.value.filter((column) => availableRepeatColumns.has(column));
  selectedRecursivePath.value = availableRecursivePaths.has(selectedRecursivePath.value) ? selectedRecursivePath.value : "";
  sheets.value = result.sheets;
  arrayFields.value = result.arrayFields;
  recursiveArrayFields.value = result.recursiveArrayFields;
  repeatableColumns.value = result.repeatableColumns;
  activeSheetIndex.value = Math.min(activeSheetIndex.value, result.sheets.length - 1);
  errorMessage.value = "";
  return result;
}

function createPreviewStatus(result: JsonWorkbookSuccessResult): string {
  if (result.recursiveFlatten) {
    return `已平铺 ${result.sheets[0].rows.length} 个末级节点，共 ${result.recursiveFlatten.maxDepth} 层`;
  }

  const childSheetCount = result.sheets.length - 1;
  if (selectedArrayPaths.value.length === 0) {
    return `已生成 ${result.sheets[0].rows.length} 行 × ${result.sheets[0].columns.length} 列预览`;
  }

  const skippedSheetCount = selectedArrayPaths.value.length - childSheetCount;
  return skippedSheetCount > 0
    ? `已生成 ${result.sheets.length} 个 Sheet，跳过 ${skippedSheetCount} 个空数组 Sheet`
    : `已生成 ${result.sheets.length} 个 Sheet`;
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
  statusMessage.value = "";

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

function clearJson() {
  replaceEditorContent("");
  resetPreview();
  errorMessage.value = "";
  statusMessage.value = "";
}

function resetPreview() {
  sheets.value = [];
  arrayFields.value = [];
  recursiveArrayFields.value = [];
  repeatableColumns.value = [];
  selectedArrayPaths.value = [];
  selectedRepeatColumns.value = [];
  selectedRecursivePath.value = "";
  activeSheetIndex.value = 0;
}

function formatPreviewCell(value: JsonTableRow[string] | undefined): string {
  return value === undefined ? "" : String(value);
}
</script>
