<template>
  <section class="min-h-full bg-neutral-100 p-4 text-neutral-900 sm:p-6" :aria-label="t('首页')">
    <div class="mx-auto w-full max-w-[1200px]">
      <div class="home-search mx-auto mt-8 flex w-full items-center gap-3 border-b border-neutral-300 px-1 py-3 focus-within:border-blue-500 sm:mt-12 sm:w-3/5">
        <Search :size="18" class="shrink-0 text-neutral-400" />
        <input v-model="query" type="search" class="min-w-0 flex-1 border-0 bg-transparent text-sm" :aria-label="t('搜索工具')" :placeholder="t('搜索名称、英文或拼音，例如 Excel、二维码、cron…')" />
        <button v-if="query" type="button" class="p-1 text-neutral-500" :aria-label="t('清除搜索')" @click="query = ''"><X :size="16" /></button>
      </div>
      <div class="mt-10 flex flex-wrap items-center justify-between gap-3 text-xs text-neutral-500">
        <p role="status">{{ t('{p0} · 收藏优先', { p0: query.trim() ? t('找到 {p0} 个工具', { p0: matches.length }) : t('共 {p0} 个工具', { p0: matches.length }) }) }}</p>
        <label class="flex items-center gap-2"><input v-model="favoritesOnly" type="checkbox" />{{ t('只看收藏') }}</label>
      </div>
      <div class="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <div v-for="tool in matches" :key="tool.path" class="relative rounded-lg border border-neutral-200 bg-surface transition hover:border-blue-400 hover:shadow-sm">
          <RouterLink :to="tool.path" class="flex h-full gap-3 p-4 pr-10">
            <component :is="tool.icon" :size="21" class="mt-0.5 shrink-0 text-blue-600" />
            <div class="min-w-0">
              <h2 class="text-sm font-semibold">{{ t(tool.label) }}</h2>
              <p class="mt-1 text-xs leading-5 text-neutral-500">{{ t(tool.description) }}</p>
            </div>
          </RouterLink>
          <button type="button" class="absolute right-2 top-3 rounded p-1 text-neutral-400 hover:text-amber-600" :aria-label="`${preferences.favorites.includes(tool.path) ? t('取消收藏') : t('收藏')} ${t(tool.label)}`"
            :aria-pressed="preferences.favorites.includes(tool.path)" @click="preferences.toggleFavorite(tool.path)">
            <Star :size="15" :fill="preferences.favorites.includes(tool.path) ? 'currentColor' : 'none'" :class="{ 'text-amber-600': preferences.favorites.includes(tool.path) }" />
          </button>
        </div>
      </div>
      <p v-if="!matches.length" class="mt-8 text-center text-sm text-neutral-500">{{ t('没有找到匹配工具，试试更短的关键词。') }}</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { t } from "../i18n/index";
import { computed, ref } from "vue";
import { Search, X, Star } from "lucide-vue-next";
import { tools } from "../data/tools";
import { searchTools } from "../utils/toolSearch";
import { usePreferencesStore } from "../stores/preferences";

const query = ref("");
const favoritesOnly = ref(false);
const preferences = usePreferencesStore();
const matches = computed(() => searchTools(tools.filter(tool => !favoritesOnly.value || preferences.favorites.includes(tool.path)), query.value)
  .sort((a, b) => Number(preferences.favorites.includes(b.path)) - Number(preferences.favorites.includes(a.path))));
</script>
