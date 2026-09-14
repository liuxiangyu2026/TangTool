import { HighlightStyle } from "@codemirror/language";
import { EditorView } from "@codemirror/view";
import { tags } from "@lezer/highlight";

// 格式化页与只读结果共用配色、行号槽及字号，随全局浅色/深色主题自动变化。
export const jsonHighlightStyle = HighlightStyle.define([
  { tag: tags.propertyName, color: "var(--syntax-key)" },
  { tag: tags.string, color: "var(--syntax-string)" },
  { tag: tags.number, color: "var(--syntax-number)" },
  { tag: [tags.bool, tags.null], color: "var(--syntax-literal)" },
]);

export const jsonEditorTheme = EditorView.theme({
  "&": { height: "100%", fontSize: "0.875rem" },
  ".cm-scroller": { fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace", lineHeight: "1.5", overflow: "auto" },
  ".cm-content": { minHeight: "100%", padding: "12px 0" },
  ".cm-gutters": { backgroundColor: "var(--color-neutral-50)", borderRight: "1px solid var(--color-neutral-200)", color: "var(--color-neutral-500)" },
  ".cm-activeLine": { backgroundColor: "var(--color-neutral-50)" },
  ".cm-activeLineGutter": { backgroundColor: "var(--color-neutral-200)" },
}, { dark: false });
