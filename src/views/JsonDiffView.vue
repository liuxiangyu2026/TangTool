<template>
  <section class="flex h-full min-h-0 flex-col bg-neutral-100 p-4 sm:p-6">
    <ToolNotice :status="statusMessage" :error="[leftErrorMessage && t('原始 JSON：') + leftErrorMessage, rightErrorMessage && t('目标 JSON：') + rightErrorMessage].filter(Boolean).join('\n')" />
    <header class="shrink-0">
      <p class="text-sm font-medium text-neutral-500">{{ t(String(route.meta.group ?? '')) }}</p>
      <h1 class="mt-1 text-2xl font-semibold text-neutral-900">{{ t(String(route.meta.title ?? '')) }}</h1>
    </header>

    <div class="mt-4 flex min-h-0 flex-1 flex-col gap-4">
      <div class="flex shrink-0 flex-wrap items-center gap-2 rounded-lg border border-neutral-200 bg-surface px-3 py-2">
        <button class="flex items-center gap-1.5 rounded-md bg-violet-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2" type="button" @click="loadExample">
          <BookOpen :size="14" aria-hidden="true" />
          <span>{{ t('示例') }}</span>
        </button>
        <button class="flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2" type="button" @click="compareInputs">
          <GitCompareArrows :size="14" aria-hidden="true" />
          <span>{{ t('对比') }}</span>
        </button>
        <button class="flex items-center gap-1.5 rounded-md bg-cyan-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2" type="button" @click="alignInputs">
          <AlignHorizontalJustifyCenter :size="14" aria-hidden="true" />
          <span>{{ t('对齐') }}</span>
        </button>
        <button class="flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2" type="button" @click="clearInputs">
          <Trash2 :size="14" aria-hidden="true" />
          <span>{{ t('清除') }}</span>
        </button>
      </div>

      <div ref="verticalSplitContainer" class="flex min-h-0 flex-1 flex-col">
        <div ref="editorSplitContainer" class="flex min-h-48 flex-1">
          <section class="flex min-w-0 shrink-0 flex-col overflow-hidden rounded-lg border border-neutral-200 bg-surface" :style="{ flexBasis: `${leftPanelPercent}%` }">
            <header class="flex shrink-0 items-center justify-between gap-2 border-b border-neutral-200 px-3 py-1">
              <h2 class="min-w-0 truncate text-sm font-medium text-neutral-700" :title="t('原始 JSON')">{{ t('原始 JSON') }}</h2>
              <JsonEscapeMenu :label="t('原始 JSON') + ' · ' + t('json.escape')" @select="escapeQuotes('left', $event)" />
            </header>
            <div class="flex shrink-0 justify-end border-b border-neutral-200 px-3 py-2"><JsonFoldActions @fold="setJsonFold(leftEditor, $event)" /></div>
            <div ref="leftEditorHost" class="min-h-0 flex-1 overflow-hidden"></div>
          </section>

          <div class="group flex w-4 shrink-0 cursor-col-resize touch-none items-center justify-center" role="separator" :aria-label="t('调整左右 JSON 编辑器宽度')" aria-orientation="vertical" aria-valuemin="25" aria-valuemax="75" :aria-valuenow="Math.round(leftPanelPercent)" tabindex="0" @keydown="handleEditorSeparatorKeydown" @pointerdown="startResize('horizontal', $event)" @pointermove="resizePanels" @pointerup="stopResize" @pointercancel="stopResize">
            <span class="flex h-12 w-3 items-center justify-center rounded-full border border-neutral-300 bg-surface text-neutral-400 shadow-sm transition group-hover:border-blue-400 group-hover:text-blue-600">
              <GripVertical :size="14" aria-hidden="true" />
            </span>
          </div>

          <section class="flex min-w-0 flex-1 flex-col overflow-hidden rounded-lg border border-neutral-200 bg-surface">
            <header class="flex shrink-0 items-center justify-between gap-2 border-b border-neutral-200 px-3 py-1">
              <h2 class="min-w-0 truncate text-sm font-medium text-neutral-700" :title="t('目标 JSON')">{{ t('目标 JSON') }}</h2>
              <JsonEscapeMenu :label="t('目标 JSON') + ' · ' + t('json.escape')" @select="escapeQuotes('right', $event)" />
            </header>
            <div class="flex shrink-0 justify-end border-b border-neutral-200 px-3 py-2"><JsonFoldActions @fold="setJsonFold(rightEditor, $event)" /></div>
            <div ref="rightEditorHost" class="min-h-0 flex-1 overflow-hidden"></div>
          </section>
        </div>

        <div class="group flex h-4 shrink-0 cursor-row-resize touch-none items-center justify-center" role="separator" :aria-label="t('调整差异结果高度')" aria-orientation="horizontal" aria-valuemin="20" aria-valuemax="60" :aria-valuenow="Math.round(resultPanelPercent)" tabindex="0" @keydown="handleResultSeparatorKeydown" @pointerdown="startResize('vertical', $event)" @pointermove="resizePanels" @pointerup="stopResize" @pointercancel="stopResize">
          <span class="flex h-3 w-12 items-center justify-center rounded-full border border-neutral-300 bg-surface text-neutral-400 shadow-sm transition group-hover:border-blue-400 group-hover:text-blue-600">
            <GripHorizontal :size="14" aria-hidden="true" />
          </span>
        </div>

        <section class="min-h-36 shrink-0 overflow-auto rounded-lg border border-neutral-200 bg-surface" :style="{ flexBasis: `${resultPanelPercent}%` }" :aria-label="t('JSON 差异结果')">
          <header class="sticky top-0 z-10 flex items-center justify-between border-b border-neutral-200 bg-surface px-3 py-2">
            <h2 class="text-sm font-semibold text-neutral-800">{{ t('差异结果') }}</h2>
            <span v-if="hasCompared && !leftErrorMessage && !rightErrorMessage" class="text-xs text-neutral-500">{{ t('{p0} 处差异', { p0: changes.length }) }}</span>
          </header>

          <p v-if="!hasCompared" class="p-4 text-sm text-neutral-500">{{ t('输入左右 JSON 后点击“对比”。') }}</p>
          <p v-else-if="leftErrorMessage || rightErrorMessage" class="p-4 text-sm text-red-700">{{ t('请先修正两侧 JSON 的语法错误。') }}</p>
          <p v-else-if="changes.length === 0" class="p-4 text-sm text-emerald-700">{{ t('左右 JSON 结构和值完全一致。') }}</p>
          <ul v-else class="space-y-2 p-3">
            <li v-for="(change, index) in changes" :key="`${change.type}:${change.pathLabel}`" class="cursor-pointer rounded-md border p-3 outline-none transition focus:ring-2 focus:ring-blue-500 focus:ring-offset-1" :class="[CHANGE_META[change.type].containerClass, selectedChangeIndex === index ? 'ring-2 ring-blue-500 ring-offset-1' : '']" role="button" :aria-label="t('定位差异 {p0}', { p0: change.pathLabel })" tabindex="0" @click="selectChange(change, index)" @keydown.enter.prevent="selectChange(change, index)" @keydown.space.prevent="selectChange(change, index)">
              <div class="flex items-center gap-2">
                <span class="rounded px-2 py-0.5 text-xs font-medium" :class="CHANGE_META[change.type].badgeClass">{{ t(CHANGE_META[change.type].label) }}</span>
                <code class="break-all text-xs font-medium text-neutral-700">{{ change.pathLabel }}</code>
              </div>

              <div v-if="change.type === 'changed'" class="mt-2 grid gap-2 sm:grid-cols-2">
                <div>
                  <p class="mb-1 text-xs text-red-600">{{ t('原值') }}</p>
                  <pre class="overflow-x-auto whitespace-pre-wrap break-words rounded bg-surface/70 p-2 font-mono text-xs text-neutral-700">{{ formatDiffValue(change.oldValue) }}</pre>
                </div>
                <div>
                  <p class="mb-1 text-xs text-emerald-600">{{ t('新值') }}</p>
                  <pre class="overflow-x-auto whitespace-pre-wrap break-words rounded bg-surface/70 p-2 font-mono text-xs text-neutral-700">{{ formatDiffValue(change.newValue) }}</pre>
                </div>
              </div>
              <div v-else class="mt-2">
                <p class="mb-1 text-xs" :class="change.type === 'added' ? 'text-emerald-600' : 'text-red-600'">{{ change.type === "added" ? t('新增值') : t('删除值') }}</p>
                <pre class="overflow-x-auto whitespace-pre-wrap break-words rounded bg-surface/70 p-2 font-mono text-xs text-neutral-700">{{ formatDiffValue(change.type === "added" ? change.newValue : change.oldValue) }}</pre>
              </div>
            </li>
          </ul>
        </section>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { t } from "../i18n/index";
import { editorPreferences } from "../utils/editorPreferences";
import { usePreferencesStore } from "../stores/preferences";
import { usePanelRatio } from "../composables/usePanelRatio";
import ToolNotice from "../components/ToolNotice.vue";
import JsonEscapeMenu from "../components/JsonEscapeMenu.vue";
import JsonFoldActions from "../components/JsonFoldActions.vue";
import { setJsonFold } from "../utils/jsonFolding";
import { transformQuoteEscapes, type QuoteEscapeAction } from "../utils/quoteEscape";
import { json } from "@codemirror/lang-json";
import { HighlightStyle, syntaxHighlighting, syntaxTree } from "@codemirror/language";
import { StateEffect, StateField } from "@codemirror/state";
import { Decoration, type DecorationSet, EditorView } from "@codemirror/view";
import { tags } from "@lezer/highlight";
import { basicSetup } from "codemirror";
import { AlignHorizontalJustifyCenter, BookOpen, GitCompareArrows, GripHorizontal, GripVertical, Trash2 } from "lucide-vue-next";
import { onActivated, onBeforeUnmount, onMounted, ref } from "vue";
import { useRoute } from "vue-router";

import { formatJsonErrorMessage } from "../utils/json";
import { alignJsonKeys, compareJson, type JsonDiffChange } from "../utils/jsonDiff";

type ResizeAxis = "horizontal" | "vertical";
type JsonSyntaxNode = ReturnType<typeof syntaxTree>["topNode"];
type JsonNodeRange = { from: number; to: number };
type DiffHighlight = JsonNodeRange & { className: string };

const LEFT_EXAMPLE = JSON.stringify({
  user: {
    name: "TangTool",
    roles: ["admin", "editor"],
    active: true,
  },
  version: 1,
  deprecated: true,
}, null, 2);

const RIGHT_EXAMPLE = JSON.stringify({
  version: 2,
  user: {
    active: true,
    roles: ["admin", "viewer"],
    name: "TangTool Desktop",
  },
  updatedAt: "2026-09-10",
}, null, 2);

const CHANGE_META = {
  added: {
    label: "新增",
    containerClass: "border-emerald-200 bg-emerald-50",
    badgeClass: "bg-emerald-100 text-emerald-700",
    editorClass: "cm-diff-added",
  },
  removed: {
    label: "删除",
    containerClass: "border-red-200 bg-red-50",
    badgeClass: "bg-red-100 text-red-700",
    editorClass: "cm-diff-removed",
  },
  changed: {
    label: "修改",
    containerClass: "border-amber-200 bg-amber-50",
    badgeClass: "bg-amber-100 text-amber-700",
    editorClass: "cm-diff-changed",
  },
} as const;

const setDiffHighlight = StateEffect.define<DiffHighlight | null>();
const diffHighlightField = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update(highlights, transaction) {
    let nextHighlights = transaction.docChanged ? Decoration.none : highlights.map(transaction.changes);

    for (const effect of transaction.effects) {
      if (effect.is(setDiffHighlight)) {
        nextHighlights = effect.value
          ? Decoration.set([Decoration.mark({ class: effect.value.className }).range(effect.value.from, effect.value.to)])
          : Decoration.none;
      }
    }

    return nextHighlights;
  },
  provide: (field) => EditorView.decorations.from(field),
});

const route = useRoute();
const preferences = usePreferencesStore();
const leftEditorHost = ref<HTMLDivElement | null>(null);
const rightEditorHost = ref<HTMLDivElement | null>(null);
const editorSplitContainer = ref<HTMLDivElement | null>(null);
const verticalSplitContainer = ref<HTMLDivElement | null>(null);
const changes = ref<JsonDiffChange[]>([]);
const leftErrorMessage = ref("");
const rightErrorMessage = ref("");
const statusMessage = ref("");
const hasCompared = ref(false);
const selectedChangeIndex = ref<number | null>(null);
const leftPanelPercent = usePanelRatio("json-diff:left", 50, 25, 75);
const resultPanelPercent = usePanelRatio("json-diff:result", 34, 20, 60);
let leftEditor: EditorView | null = null;
let rightEditor: EditorView | null = null;
let activeResizeAxis: ResizeAxis | null = null;
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
  ".cm-diff-added": { backgroundColor: "var(--diff-added)", outline: "1px solid #86efac" },
  ".cm-diff-removed": { backgroundColor: "var(--diff-removed)", outline: "1px solid #fca5a5" },
  ".cm-diff-changed": { backgroundColor: "var(--diff-changed)", outline: "1px solid #fcd34d" },
}, { dark: false });

onMounted(() => {
  if (!leftEditorHost.value || !rightEditorHost.value) {
    return;
  }

  leftEditor = createJsonEditor(leftEditorHost.value, "原始 JSON 编辑器");
  rightEditor = createJsonEditor(rightEditorHost.value, "目标 JSON 编辑器");
});

onActivated(() => {
  requestEditorMeasure();
});

onBeforeUnmount(() => {
  finishResize();
  leftEditor?.destroy();
  rightEditor?.destroy();
});

function createJsonEditor(parent: HTMLDivElement, ariaLabel: string): EditorView {
  return new EditorView({
    parent,
    extensions: [
      basicSetup, editorPreferences(ariaLabel), json(),
      syntaxHighlighting(jsonHighlightStyle),
      editorTheme,
      diffHighlightField,
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          changes.value = [];
          leftErrorMessage.value = "";
          rightErrorMessage.value = "";
          statusMessage.value = "";
          hasCompared.value = false;
          selectedChangeIndex.value = null;
        }
      }),
    ],
  });
}

function loadExample() {
  replaceEditorContent(leftEditor, LEFT_EXAMPLE);
  replaceEditorContent(rightEditor, RIGHT_EXAMPLE);
  statusMessage.value = t('已填充对比示例');
}

function compareInputs() {
  const result = compareJson(
    leftEditor?.state.doc.toString() ?? "",
    rightEditor?.state.doc.toString() ?? "",
  );

  clearEditorHighlights();
  hasCompared.value = true;
  changes.value = [];
  leftErrorMessage.value = "";
  rightErrorMessage.value = "";
  statusMessage.value = "";
  selectedChangeIndex.value = null;

  if (!result.ok) {
    leftErrorMessage.value = result.leftError ? formatJsonErrorMessage(result.leftError) : "";
    rightErrorMessage.value = result.rightError ? formatJsonErrorMessage(result.rightError) : "";
    return;
  }

  changes.value = result.changes;
  statusMessage.value = result.changes.length === 0 ? t('左右 JSON 完全一致') : t('发现 {p0} 处差异', { p0: result.changes.length });
}

function alignInputs() {
  const result = alignJsonKeys(
    leftEditor?.state.doc.toString() ?? "",
    rightEditor?.state.doc.toString() ?? "",
    preferences.indentWidth,
  );

  clearEditorHighlights();
  leftErrorMessage.value = "";
  rightErrorMessage.value = "";
  statusMessage.value = "";

  if (!result.ok) {
    leftErrorMessage.value = result.leftError ? formatJsonErrorMessage(result.leftError) : "";
    rightErrorMessage.value = result.rightError ? formatJsonErrorMessage(result.rightError) : "";
    return;
  }

  replaceEditorContent(leftEditor, result.leftValue);
  replaceEditorContent(rightEditor, result.rightValue);
  statusMessage.value = t('已对齐共同 key 顺序');
}

function clearInputs() {
  replaceEditorContent(leftEditor, "");
  replaceEditorContent(rightEditor, "");
  leftEditor?.focus();
}

function escapeQuotes(side: "left" | "right", action: QuoteEscapeAction) {
  const editor = side === "left" ? leftEditor : rightEditor;
  const input = editor?.state.doc.toString() ?? "";
  const result = transformQuoteEscapes(input, action);
  if (result === input) {
    statusMessage.value = t("json.escapeUnchanged");
    return;
  }
  // 内容变化后旧差异已失效；只改目标编辑框，同时清理两侧旧定位标记。
  clearEditorHighlights();
  replaceEditorContent(editor, result);
  editor?.focus();
  statusMessage.value = t(action === "add" ? "json.escapeAdded" : "json.escapeRemoved");
}

function replaceEditorContent(editor: EditorView | null, content: string) {
  editor?.dispatch({
    changes: {
      from: 0,
      to: editor.state.doc.length,
      insert: content,
    },
  });
}

function selectChange(change: JsonDiffChange, index: number) {
  const leftRange = change.type === "added" ? null : findJsonPathRange(leftEditor, change.path);
  const rightRange = change.type === "removed" ? null : findJsonPathRange(rightEditor, change.path);
  const editorClass = CHANGE_META[change.type].editorClass;

  selectedChangeIndex.value = index;
  highlightEditorRange(leftEditor, leftRange, editorClass, change.type !== "added");
  highlightEditorRange(rightEditor, rightRange, editorClass, change.type === "added");
}

function findJsonPathRange(editor: EditorView | null, path: (string | number)[]): JsonNodeRange | null {
  if (!editor) {
    return null;
  }

  let currentNode = syntaxTree(editor.state).topNode.firstChild;
  if (!currentNode) {
    return null;
  }

  if (path.length === 0) {
    return { from: currentNode.from, to: currentNode.to };
  }

  for (let index = 0; index < path.length; index++) {
    const segment = path[index];
    const isLastSegment = index === path.length - 1;

    if (typeof segment === "string" && currentNode.name === "Object") {
      const property = findObjectProperty(currentNode, segment, editor);
      if (!property) {
        return null;
      }

      if (isLastSegment) {
        return { from: property.node.from, to: property.node.to };
      }

      currentNode = property.valueNode;
      continue;
    }

    if (typeof segment === "number" && currentNode.name === "Array") {
      const elementNode = findArrayElement(currentNode, segment);
      if (!elementNode) {
        return null;
      }

      if (isLastSegment) {
        return { from: elementNode.from, to: elementNode.to };
      }

      currentNode = elementNode;
      continue;
    }

    return null;
  }

  return null;
}

function findObjectProperty(objectNode: JsonSyntaxNode, key: string, editor: EditorView): { node: JsonSyntaxNode; valueNode: JsonSyntaxNode } | null {
  let child = objectNode.firstChild;

  while (child) {
    if (child.name === "Property") {
      const propertyNameNode = child.getChild("PropertyName");
      let propertyName: unknown;

      if (propertyNameNode) {
        try {
          propertyName = JSON.parse(editor.state.doc.sliceString(propertyNameNode.from, propertyNameNode.to));
        } catch {
          propertyName = undefined;
        }

        if (propertyName === key) {
          let valueNode = propertyNameNode.nextSibling;
          while (valueNode && (valueNode.name === ":" || valueNode.name === ",")) {
            valueNode = valueNode.nextSibling;
          }

          return valueNode ? { node: child, valueNode } : null;
        }
      }
    }

    child = child.nextSibling;
  }

  return null;
}

function findArrayElement(arrayNode: JsonSyntaxNode, targetIndex: number): JsonSyntaxNode | null {
  let elementIndex = 0;
  let child = arrayNode.firstChild;

  while (child) {
    if (child.name !== "[" && child.name !== "]" && child.name !== ",") {
      if (elementIndex === targetIndex) {
        return child;
      }

      elementIndex++;
    }

    child = child.nextSibling;
  }

  return null;
}

function highlightEditorRange(editor: EditorView | null, range: JsonNodeRange | null, className: string, shouldFocus: boolean) {
  if (!editor) {
    return;
  }

  if (!range) {
    editor.dispatch({ effects: setDiffHighlight.of(null) });
    return;
  }

  const effects = [
    setDiffHighlight.of({ ...range, className }),
    EditorView.scrollIntoView(range.from, { y: "center" }),
  ];

  if (shouldFocus) {
    editor.dispatch({
      selection: { anchor: range.from, head: range.to },
      effects,
    });
    editor.focus();
    return;
  }

  editor.dispatch({ effects });
}

function clearEditorHighlights() {
  leftEditor?.dispatch({ effects: setDiffHighlight.of(null) });
  rightEditor?.dispatch({ effects: setDiffHighlight.of(null) });
}

function startResize(axis: ResizeAxis, event: PointerEvent) {
  const handle = event.currentTarget as HTMLElement;
  event.preventDefault();
  activeResizeAxis = axis;
  activePointerId = event.pointerId;
  activeResizeHandle = handle;
  handle.focus();
  previousUserSelect = document.body.style.userSelect;
  document.body.style.userSelect = "none";
  handle.setPointerCapture(event.pointerId);
}

function resizePanels(event: PointerEvent) {
  if (event.pointerId !== activePointerId || !activeResizeAxis) {
    return;
  }

  if (activeResizeAxis === "horizontal" && editorSplitContainer.value) {
    const bounds = editorSplitContainer.value.getBoundingClientRect();
    leftPanelPercent.value = clamp(((event.clientX - bounds.left) / bounds.width) * 100, 25, 75);
  }

  if (activeResizeAxis === "vertical" && verticalSplitContainer.value) {
    const bounds = verticalSplitContainer.value.getBoundingClientRect();
    resultPanelPercent.value = clamp(((bounds.bottom - event.clientY) / bounds.height) * 100, 20, 60);
  }

  requestEditorMeasure();
}

function stopResize(event: PointerEvent) {
  if (event.pointerId !== activePointerId) {
    return;
  }

  finishResize();
}

function finishResize() {
  if (activeResizeHandle && activePointerId !== null && activeResizeHandle.hasPointerCapture(activePointerId)) {
    activeResizeHandle.releasePointerCapture(activePointerId);
  }

  document.body.style.userSelect = previousUserSelect;
  activeResizeAxis = null;
  activePointerId = null;
  activeResizeHandle = null;
}

function handleEditorSeparatorKeydown(event: KeyboardEvent) {
  if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
    return;
  }

  event.preventDefault();
  leftPanelPercent.value = clamp(leftPanelPercent.value + (event.key === "ArrowRight" ? 2 : -2), 25, 75);
  requestEditorMeasure();
}

function handleResultSeparatorKeydown(event: KeyboardEvent) {
  if (event.key !== "ArrowUp" && event.key !== "ArrowDown") {
    return;
  }

  event.preventDefault();
  resultPanelPercent.value = clamp(resultPanelPercent.value + (event.key === "ArrowUp" ? 2 : -2), 20, 60);
  requestEditorMeasure();
}

function requestEditorMeasure() {
  leftEditor?.requestMeasure();
  rightEditor?.requestMeasure();
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}

function formatDiffValue(value: unknown): string {
  return JSON.stringify(value, null, 2) ?? String(value);
}
</script>
