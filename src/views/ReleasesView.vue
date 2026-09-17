<template>
  <div class="min-h-full bg-neutral-100 p-4 text-neutral-900">
    <ToolNotice :error="error" />
    <p class="text-xs text-neutral-500">{{ t('应用') }}</p>
    <h1 class="mt-1 text-xl font-semibold">{{ t('版本与升级说明') }}</h1>
    <div class="mt-4 max-w-3xl space-y-5 rounded-lg border border-neutral-200 bg-surface p-5">
      <div class="flex flex-wrap items-center gap-3">
        <h2 class="font-semibold">{{ t('当前版本 v{p0}', { p0: version }) }}</h2>
        <span class="rounded-full bg-orange-50 px-2 py-1 text-xs text-orange-700">{{ t('未签名版本') }}</span>
      </div>
      <section class="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="min-w-0">
            <h2 class="text-sm font-semibold" aria-live="polite" :class="updates.available ? 'text-blue-600' : 'text-neutral-700'">{{ updateStatus }}</h2>
            <p v-if="checkedAt" class="mt-1 text-xs text-neutral-500">{{ t('上次检查：{time}', { time: checkedAt }) }}</p>
          </div>
          <button type="button" class="flex items-center gap-2 rounded-md border border-neutral-300 bg-surface px-3 py-1.5 text-xs disabled:opacity-50" :disabled="updates.checking || updates.installBusy" @click="updates.check">
            <RefreshCw :size="14" :class="{ 'animate-spin': updates.checking }" />{{ updates.checking ? t('正在检查…') : t('检查更新') }}
          </button>
        </div>
        <p v-if="updates.errorKey" class="mt-2 text-xs text-amber-600">{{ t(updates.errorKey) }}</p>
        <template v-if="updates.available">
          <div class="release-notes mt-4 max-h-64 overflow-auto border-t border-neutral-200 pt-3 text-sm leading-6" v-html="releaseNotes"></div>
          <button type="button" class="mt-3 flex items-center gap-2 rounded-md bg-blue-600 px-3 py-1.5 text-xs text-white disabled:opacity-50" :disabled="updates.installBusy || updates.checking" @click="updates.installUpdate"><Download :size="14" />{{ t('更新') }}</button>
        </template>
        <p v-if="updates.installError" class="mt-3 text-sm text-red-600" role="alert">{{ updates.installError }}</p>
      </section>
      <p class="text-sm leading-6 text-neutral-600">{{ t('检查更新不会自动安装。点击更新并确认后，将在应用内下载、校验签名，完成后自动安装并重启。') }}</p>
      <article v-for="release in changelog" :key="release.version" class="border-l-2 border-blue-500 pl-4">
        <h3 class="text-sm font-semibold">v{{ release.version }} · {{ t(release.status) }}</h3>
        <ul class="mt-2 list-disc space-y-2 pl-4 text-sm text-neutral-600">
          <li v-for="entry in release.entries" :key="entry">{{ t(entry) }}</li>
        </ul>
      </article>
      <div class="rounded-md bg-neutral-50 p-3 text-sm leading-6 text-neutral-600">
        {{ t('更新前请结束正在运行的任务并保存内容。系统可能要求安装授权；更新包签名不等于系统开发者签名或公证。') }}
      </div>
      <button type="button" class="flex items-center gap-2 rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700" @click="openReleases"><ExternalLink :size="14" />{{ t('查看 GitHub 版本列表') }}</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { locale, t } from "../i18n/index";
import ToolNotice from "../components/ToolNotice.vue";
import { computed, ref } from "vue";
import { isTauri } from "@tauri-apps/api/core";
import { openUrl } from "@tauri-apps/plugin-opener";
import { Download, ExternalLink, RefreshCw } from "lucide-vue-next";
import { version } from "../../package.json";
import changelog from "../data/changelog.json";
import { useUpdatesStore } from '../stores/updates';
import { renderMarkdownPreview } from '../utils/markdownPreview';

const error = ref("");
const updates = useUpdatesStore();
const checkedAt = computed(() => updates.lastCheckedAt ? new Intl.DateTimeFormat(locale.value, { dateStyle: 'short', timeStyle: 'short' }).format(updates.lastCheckedAt) : '');
const updateStatus = computed(() => {
  if (updates.checking) return t('正在检查更新…');
  if (updates.available) return t('发现新版本 {version}', { version: updates.available.tag });
  if (updates.errorKey) return t('暂时无法检查更新');
  return updates.lastCheckedAt ? t('当前没有可用更新') : t('尚未检查更新');
});
const releaseNotes = computed(() => renderMarkdownPreview(updates.available?.body || t('此版本未提供更新说明，请打开版本页面查看。')));

async function openReleases() {
  error.value = "";
  const url = "https://github.com/liuxiangyu2026/TangTool/releases";
  try {
    if (isTauri()) await openUrl(url);
    else window.open(url, "_blank", "noopener,noreferrer");
  } catch {
    error.value = t('无法打开浏览器，请在 GitHub 仓库的 Releases 页面查看版本。');
  }
}
</script>

<style scoped>
.release-notes :deep(h1), .release-notes :deep(h2), .release-notes :deep(h3) {
  margin: 0.8rem 0 0.4rem;
  font-size: 1em;
  font-weight: 600;
}
.release-notes :deep(p) {
  margin: 0.4rem 0;
}
.release-notes :deep(ul), .release-notes :deep(ol) {
  padding-left: 1.25rem;
}
.release-notes :deep(ul) {
  list-style: disc;
}
.release-notes :deep(ol) {
  list-style: decimal;
}
.release-notes :deep(pre) {
  overflow: auto;
}
.release-notes :deep(th), .release-notes :deep(td) {
  border: 1px solid var(--color-neutral-300);
  padding: 0.25rem 0.5rem;
}
</style>
