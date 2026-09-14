<template>
  <div class="min-h-full bg-neutral-100 p-4 text-neutral-900">
    <ToolNotice :error="error || preferences.storageError" />
    <p class="text-xs text-neutral-500">应用</p>
    <h1 class="mt-1 text-xl font-semibold">用户设置</h1>
    <div class="mt-4 max-w-3xl space-y-5 rounded-lg border border-neutral-200 bg-surface p-5">
      <fieldset>
        <legend class="text-sm font-medium">外观主题</legend>
        <p class="mt-1 text-xs text-neutral-500">跟随系统时，会随电脑的深色模式自动切换。</p>
        <div class="mt-3 flex flex-wrap gap-2">
          <label v-for="option in themes" :key="option.value" class="flex cursor-pointer items-center gap-2 rounded-md border border-neutral-300 px-3 py-2 text-sm has-checked:border-blue-500 has-checked:bg-blue-50">
            <input v-model="preferences.theme" type="radio" name="theme" :value="option.value" class="accent-blue-600" />
            <component :is="option.icon" :size="16" />{{ option.label }}
          </label>
        </div>
      </fieldset>
      <div class="border-t border-neutral-200 pt-5">
        <label for="interface-size" class="block text-sm font-medium">界面字号</label>
        <select id="interface-size" v-model="preferences.fontSize" class="mt-3 rounded-md border border-neutral-300 bg-surface px-3 py-2 text-sm">
          <option :value="14">紧凑</option>
          <option :value="16">标准（默认）</option>
          <option :value="18">较大</option>
        </select>
        <p class="mt-2 text-xs text-neutral-500">文字、间距和编辑器按比例缩放，即时生效。</p>
      </div>
      <div class="rounded-md bg-neutral-50 p-3 text-sm leading-6 text-neutral-600">设置仅保存在这台电脑。不会保存输入的 JSON、文档内容或生成的密码，也不会同步到网络。</div>
      <fieldset class="border-t border-neutral-200 pt-5">
        <legend class="text-sm font-medium">工具收藏</legend>
        <p class="mt-2 text-xs text-neutral-500">收藏后在首页优先显示；也可在首页点击星标。</p>
        <div class="mt-3 grid gap-2 sm:grid-cols-2">
          <label v-for="tool in tools" :key="tool.path" class="flex items-center gap-2 text-sm">
            <input type="checkbox" :checked="preferences.favorites.includes(tool.path)" @change="preferences.toggleFavorite(tool.path)" />{{ tool.label }}
          </label>
        </div>
      </fieldset>
      <div class="space-y-3 border-t border-neutral-200 pt-5 text-sm">
        <h2 class="font-medium">窗口与分栏</h2>
        <label class="flex items-center gap-2"><input v-model="preferences.rememberWindow" type="checkbox" />记住窗口大小与最大化状态</label>
        <label class="flex items-center gap-2"><input v-model="preferences.rememberPanels" type="checkbox" />记住各工具分栏比例</label>
        <p class="text-xs text-neutral-500">关闭记忆会清除已保存的相应布局；再次启动使用默认布局。浏览器预览不调整浏览器窗口。</p>
      </div>
      <div class="space-y-3 border-t border-neutral-200 pt-5 text-sm">
        <h2 class="font-medium">编辑器</h2>
        <div class="flex flex-wrap gap-3">
          <label class="flex items-center gap-2">字体 <select v-model="preferences.editorFont" class="tool-field"><option value="system">系统等宽字体</option><option value="consolas">Consolas</option><option value="menlo">Menlo</option></select></label>
          <label class="flex items-center gap-2">缩进宽度 <select v-model="preferences.indentWidth" class="tool-field"><option :value="2">2 空格</option><option :value="4">4 空格</option><option :value="8">8 空格</option></select></label>
        </div>
        <label class="flex items-center gap-2"><input v-model="preferences.editorWrap" type="checkbox" />自动换行</label>
        <p class="text-xs leading-5 text-neutral-500">字体未安装时回退等宽字体；换行是显示效果，不改动内容。缩进用于 JSON 编辑/格式化/对齐及新生成的 JSON，已有文本需再次格式化或转换。</p>
      </div>
      <div class="space-y-3 border-t border-neutral-200 pt-5 text-sm">
        <h2 class="font-medium">导出默认值</h2>
        <label for="export-directory" class="block text-xs text-neutral-500">默认导出目录（留空沿用系统对话框默认目录）</label>
        <div class="flex gap-2">
          <input id="export-directory" :value="preferences.exportDirectory" class="tool-field min-w-0 flex-1" placeholder="尚未指定目录" readonly />
          <button type="button" class="text-xs text-blue-700" @click="chooseDirectory">选择目录</button>
          <button type="button" class="text-xs text-neutral-500" @click="preferences.exportDirectory = ''">清除</button>
        </div>
        <label class="flex items-center gap-2">文件命名 <select v-model="preferences.filenameRule" class="tool-field"><option value="original">保留工具默认名称</option><option value="timestamp">默认名称 + 日期时间</option></select></label>
        <p class="text-xs text-neutral-500">示例：{{ filenamePreview }}。只作为保存对话框预填值，每次仍需确认，不自动覆盖文件。浏览器下载只应用命名规则。</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import ToolNotice from "../components/ToolNotice.vue";
import { Monitor, Moon, Sun } from "lucide-vue-next";
import { usePreferencesStore } from "../stores/preferences";
import { computed, ref } from "vue";
import { isTauri } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { tools } from "../data/tools";
import { buildExportName } from "../utils/exportDefaults";

const preferences = usePreferencesStore();
const error = ref("");
const filenamePreview = computed(() => buildExportName("tangtool.json", preferences.filenameRule));

async function chooseDirectory() {
  error.value = "";
  if (!isTauri()) {
    error.value = "请在桌面应用中选择默认导出目录；浏览器无法设置本机下载目录。";
    return;
  }
  try {
    const directory = await open({ title: "选择默认导出目录", directory: true, multiple: false });
    if (typeof directory === "string") preferences.exportDirectory = directory;
  } catch {
    error.value = "目录选择失败，请重试。";
  }
}
const themes = [
  { value: "system", label: "跟随系统", icon: Monitor },
  { value: "light", label: "浅色", icon: Sun },
  { value: "dark", label: "深色", icon: Moon },
];
</script>
