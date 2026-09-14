<template>
  <div class="min-h-full bg-neutral-100 p-4 text-neutral-900">
    <ToolNotice :error="error" />
    <p class="text-xs text-neutral-500">应用</p>
    <h1 class="mt-1 text-xl font-semibold">版本与升级说明</h1>
    <div class="mt-4 max-w-3xl space-y-5 rounded-lg border border-neutral-200 bg-surface p-5">
      <div class="flex flex-wrap items-center gap-3">
        <h2 class="font-semibold">当前版本 v{{ version }}</h2>
        <span class="rounded-full bg-orange-50 px-2 py-1 text-xs text-orange-700">开发阶段</span>
      </div>
      <p class="text-sm leading-6 text-neutral-600">以下是随应用附带的版本记录，不代表已公开发布。查看线上版本会在浏览器打开 GitHub；应用不会自动联网检查或安装更新。</p>
      <article v-for="release in changelog" :key="release.version" class="border-l-2 border-blue-500 pl-4">
        <h3 class="text-sm font-semibold">v{{ release.version }} · {{ release.status }}</h3>
        <ul class="mt-2 list-disc space-y-2 pl-4 text-sm text-neutral-600">
          <li v-for="entry in release.entries" :key="entry">{{ entry }}</li>
        </ul>
      </article>
      <div class="rounded-md bg-neutral-50 p-3 text-sm leading-6 text-neutral-600">
        升级方式：查看公开版本 → 下载对应系统与芯片的安装包 → 关闭旧版应用后安装或替换。请先保存正在处理的内容；自动更新、签名公证及跨版本升级验收尚未完成。
      </div>
      <button type="button" class="flex items-center gap-2 rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700" @click="openReleases"><ExternalLink :size="14" />查看 GitHub 版本列表</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import ToolNotice from "../components/ToolNotice.vue";
import { ref } from "vue";
import { isTauri } from "@tauri-apps/api/core";
import { openUrl } from "@tauri-apps/plugin-opener";
import { ExternalLink } from "lucide-vue-next";
import { version } from "../../package.json";
import changelog from "../data/changelog.json";

const error = ref("");
async function openReleases() {
  error.value = "";
  const url = "https://github.com/liuxiangyu2026/TangTool/releases";
  try {
    if (isTauri()) await openUrl(url);
    else window.open(url, "_blank", "noopener,noreferrer");
  } catch {
    error.value = "无法打开浏览器，请在 GitHub 仓库的 Releases 页面查看版本。";
  }
}
</script>
