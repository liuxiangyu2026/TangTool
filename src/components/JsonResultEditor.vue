<template>
  <section class="json-result-editor flex min-h-48 flex-1 flex-col overflow-hidden rounded-lg border border-neutral-200 bg-surface" :aria-label="t('JSON 结果区域')">
    <header class="flex shrink-0 items-center justify-between gap-3 border-b border-neutral-200 px-3 py-2 text-xs">
      <h2 class="font-medium text-neutral-700">{{ t('JSON 结果') }}</h2>
      <div class="flex items-center gap-3">
        <button type="button" class="flex items-center gap-1 text-blue-700 disabled:opacity-50" :disabled="!value" @click="foldResult(true)"><FoldVertical :size="14" />{{ t('全部折叠') }}</button>
        <button type="button" class="flex items-center gap-1 text-blue-700 disabled:opacity-50" :disabled="!value" @click="foldResult(false)"><UnfoldVertical :size="14" />{{ t('全部展开') }}</button>
      </div>
    </header>
    <div ref="host" class="min-h-0 flex-1 overflow-hidden"></div>
  </section>
</template>

<script setup lang="ts">
import { t } from "../i18n/index";
import { editorPreferences } from "../utils/editorPreferences";
import { onActivated, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { json } from "@codemirror/lang-json";
import { EditorState } from "@codemirror/state";
import { foldAll, unfoldAll, foldService, syntaxHighlighting } from "@codemirror/language";
import { basicSetup, EditorView } from "codemirror";
import { FoldVertical, UnfoldVertical } from "lucide-vue-next";
import { jsonEditorTheme, jsonHighlightStyle } from "../utils/jsonEditorAppearance";

const props = defineProps<{ value: string }>();
const host = ref<HTMLDivElement | null>(null);
let editor: EditorView | null = null;
onMounted(() => {
  if (!host.value) return;
  editor = new EditorView({
    parent: host.value,
    doc: props.value,
    extensions: [
      basicSetup, editorPreferences("表格转 JSON 结果", "选择表格后生成结果"), json(), syntaxHighlighting(jsonHighlightStyle), jsonEditorTheme,
      EditorState.readOnly.of(true), EditorView.editable.of(false),
      EditorView.contentAttributes.of({ "aria-readonly": "true", role: "textbox", tabindex: "0" }),
      foldService.of((state, lineStart) => {
        // 输出始终是合法数组/对象。根级折叠不必等待大文档的语法树全部解析完成。
        if (lineStart !== 0 || state.doc.lines < 2) return null;
        const first = state.doc.sliceString(0, 1);
        const last = state.doc.sliceString(state.doc.length - 1);
        return (first === "[" && last === "]") || (first === "{" && last === "}") ? { from: 1, to: state.doc.length - 1 } : null;
      }),
    ],
  });
});
watch(() => props.value, value => {
  if (editor && editor.state.doc.toString() !== value) {
    editor.dispatch({ changes: { from: 0, to: editor.state.doc.length, insert: value } });
  }
});
onActivated(() => editor?.requestMeasure());
onBeforeUnmount(() => editor?.destroy());

function foldResult(collapse: boolean) {
  if (!editor) return;
  if (collapse) foldAll(editor);
  else unfoldAll(editor);
}
</script>
