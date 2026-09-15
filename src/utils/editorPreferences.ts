import { Compartment, EditorState } from "@codemirror/state";
import { EditorView, ViewPlugin, placeholder } from "@codemirror/view";
import { indentUnit } from "@codemirror/language";
import { forceLinting } from "@codemirror/lint";
import { watch } from "vue";
import { usePreferencesStore } from "../stores/preferences";
import { t } from "../i18n";

const chineseEditorPhrases = {
  "Fold line": "收起行", "Unfold line": "展开行", "Folded lines": "已收起的行", "Unfolded lines": "已展开的行",
  "folded code": "已收起的代码", "unfold": "展开", "to": "至", "Find": "查找", "Replace": "替换",
  "next": "下一个", "previous": "上一个", "all": "全部", "match case": "区分大小写", "regexp": "正则表达式",
  "by word": "全字匹配", "replace": "替换", "replace all": "全部替换", "close": "关闭", "Go to line": "跳转到行",
  "go": "跳转", "current match": "当前匹配", "on line": "所在行", "Diagnostics": "诊断", "No diagnostics": "没有诊断信息",
  "Completions": "补全建议", "replaced match on line $": "已替换第 $ 行的匹配", "replaced $ matches": "已替换 $ 个匹配",
};

export function editorPreferences(label = "JSON 编辑器", emptyMessage?: string) {
  const settings = usePreferencesStore();
  const compartment = new Compartment();
  const extensions = () => [
    indentUnit.of(" ".repeat(settings.indentWidth)),
    EditorState.tabSize.of(settings.indentWidth),
    EditorView.contentAttributes.of({ "aria-label": t(label) }),
    EditorState.phrases.of(settings.language === "zh-CN" ? chineseEditorPhrases : {}),
    ...(emptyMessage ? [placeholder(t(emptyMessage))] : []),
    ...(settings.editorWrap ? [EditorView.lineWrapping] : []),
  ];
  return [compartment.of(extensions()), ViewPlugin.define(view => {
    const stop = watch(() => [settings.indentWidth, settings.editorWrap, settings.language], () => {
      view.dispatch({ effects: compartment.reconfigure(extensions()) });
      forceLinting(view);
    });
    return { destroy: stop };
  })];
}
