import { foldAll, foldEffect, unfoldAll } from "@codemirror/language";
import type { EditorView } from "@codemirror/view";

export function setJsonFold(view: EditorView | null, collapse: boolean): void {
  if (!view) return;
  if (!collapse) {
    unfoldAll(view);
    return;
  }
  const text = view.state.doc.toString();
  const first = text.search(/\S/);
  let last = text.length - 1;
  while (last > first && /\s/.test(text[last])) last--;

  // 这是显示折叠而非语法校验。直接折叠外层，兼容单行、转义文本和尚未解析完的大文档。
  const root = (text[first] === "{" && text[last] === "}") || (text[first] === "[" && text[last] === "]");
  if (root && last > first + 1) {
    unfoldAll(view);
    view.dispatch({ effects: foldEffect.of({ from: first + 1, to: last }) });
  } else {
    foldAll(view);
  }
}
