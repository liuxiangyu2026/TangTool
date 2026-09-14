import { Compartment, EditorState } from "@codemirror/state";
import { EditorView, ViewPlugin } from "@codemirror/view";
import { indentUnit } from "@codemirror/language";
import { watch } from "vue";
import { usePreferencesStore } from "../stores/preferences";

export function editorPreferences() {
  const settings = usePreferencesStore();
  const compartment = new Compartment();
  const extensions = () => [indentUnit.of(" ".repeat(settings.indentWidth)), EditorState.tabSize.of(settings.indentWidth), ...(settings.editorWrap ? [EditorView.lineWrapping] : [])];
  return [compartment.of(extensions()), ViewPlugin.define(view => {
    const stop = watch(() => [settings.indentWidth, settings.editorWrap], () => view.dispatch({ effects: compartment.reconfigure(extensions()) }));
    return { destroy: stop };
  })];
}
