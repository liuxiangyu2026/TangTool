<template>
  <div class="flex h-screen overflow-hidden bg-surface text-neutral-900">
    <aside class="flex shrink-0 flex-col border-r border-neutral-200 bg-neutral-50 p-2" :class="preferences.sidebarCollapsed ? 'w-16' : 'w-56'" :aria-label="t('侧栏')">
      <img v-if="preferences.sidebarCollapsed" src="/tangtool.svg" :alt="t('TangTool 模块 T Logo')" class="mx-auto mb-1 mt-1 h-8 w-8 shrink-0" />
      <div class="mb-4 flex h-11 shrink-0 items-center" :class="preferences.sidebarCollapsed ? 'justify-center' : 'justify-between px-2'">
        <div v-if="!preferences.sidebarCollapsed" class="flex items-center gap-2">
          <img src="/tangtool.svg" :alt="t('TangTool 模块 T Logo')" class="h-8 w-8 shrink-0" />
          <span class="text-lg font-semibold">TangTool</span>
        </div>
        <button type="button" class="rounded-md p-2 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-900"
          :aria-label="preferences.sidebarCollapsed ? t('展开侧栏') : t('折叠侧栏')" :title="preferences.sidebarCollapsed ? t('展开侧栏') : t('折叠侧栏')"
          :aria-expanded="!preferences.sidebarCollapsed" aria-controls="tool-navigation" @click="preferences.sidebarCollapsed = !preferences.sidebarCollapsed">
          <component :is="preferences.sidebarCollapsed ? PanelLeftOpen : PanelLeftClose" :size="18" />
        </button>
      </div>
      <RouterLink to="/" class="mb-3 flex shrink-0 items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-neutral-100"
        :class="{ 'justify-center': preferences.sidebarCollapsed }" exact-active-class="bg-neutral-200 text-neutral-900" :aria-label="t('首页')" :title="t('首页')">
        <House :size="18" class="shrink-0" /><span v-if="!preferences.sidebarCollapsed">{{ t('首页') }}</span>
      </RouterLink>
      <button type="button" class="mb-3 flex shrink-0 items-center gap-2 rounded-md px-3 py-1.5 text-xs hover:bg-neutral-200"
        :class="[preferences.sidebarCollapsed ? 'justify-center' : '', preferences.sidebarFavoritesOnly ? 'bg-amber-50 text-amber-700' : 'text-neutral-500']"
        :aria-label="t('只看收藏')" :title="t('只看收藏')" :aria-pressed="preferences.sidebarFavoritesOnly" @click="preferences.sidebarFavoritesOnly = !preferences.sidebarFavoritesOnly">
        <Star :size="14" class="shrink-0" :fill="preferences.sidebarFavoritesOnly ? 'currentColor' : 'none'" /><span v-if="!preferences.sidebarCollapsed">{{ t('只看收藏') }}</span>
      </button>
      <nav id="tool-navigation" class="min-h-0 flex-1 space-y-4 overflow-y-auto" :aria-label="t('工具导航')">
        <p v-if="!visibleGroups.length" class="px-2 text-xs leading-5 text-neutral-500" :title="t('尚未收藏工具，请在首页添加收藏。')">{{ preferences.sidebarCollapsed ? t('暂无收藏') : t('尚未收藏工具，请在首页添加收藏。') }}</p>
        <section v-for="group in visibleGroups" :key="group.id">
          <h2 v-if="!preferences.sidebarCollapsed">
            <button type="button" class="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium hover:bg-neutral-200"
              :class="group.items.some((item) => item.path === route.path) ? 'text-blue-700' : 'text-neutral-500'"
              :aria-expanded="!preferences.collapsedGroups.includes(group.id)" :aria-controls="`menu-${group.id}`" @click="toggleGroup(group.id)">
              {{ t(group.label) }}
              <ChevronDown :size="14" :class="{ '-rotate-90': preferences.collapsedGroups.includes(group.id) }" />
            </button>
          </h2>
          <div v-show="preferences.sidebarCollapsed || !preferences.collapsedGroups.includes(group.id)" :id="`menu-${group.id}`" class="mt-1 space-y-1">
            <RouterLink v-for="item in group.items" :key="item.path" :to="item.path" class="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-neutral-100"
              :class="{ 'justify-center': preferences.sidebarCollapsed }" :title="t(item.label)" :aria-label="t(item.label)"
              exact-active-class="bg-neutral-200 text-neutral-900">
              <component :is="item.icon" :size="18" class="shrink-0" />
              <span v-if="!preferences.sidebarCollapsed" class="min-w-0 truncate">{{ t(item.label) }}</span>
            </RouterLink>
          </div>
        </section>
      </nav>
      <div class="mt-3 shrink-0 space-y-1 border-t border-neutral-200 pt-2">
        <button v-if="!preferences.sidebarCollapsed && visibleGroups.length" type="button"
          class="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-xs text-neutral-500 hover:bg-neutral-100"
          @click="toggleAllGroups">
          <ListTree :size="14" />
          {{ allGroupsCollapsed ? t('展开全部分组') : t('折叠到一级') }}
        </button>
        <RouterLink v-for="item in footerItems" :key="item.path" :to="item.path"
          class="relative flex items-center gap-2 rounded-md px-3 py-1.5 text-xs text-neutral-500 hover:bg-neutral-100" :class="{ 'justify-center': preferences.sidebarCollapsed }"
          exact-active-class="bg-neutral-200 text-neutral-900" :title="item.title" :aria-label="item.title">
          <component :is="item.icon" :size="14" class="shrink-0" />
          <span v-if="!preferences.sidebarCollapsed">{{ t(item.label) }}</span>
          <span v-if="item.path === '/releases' && updates.available" aria-hidden="true"
            :class="preferences.sidebarCollapsed ? 'absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-red-500' : 'ml-auto shrink-0 rounded bg-red-500 px-1 py-0.5 text-[10px] leading-none text-white'">{{ preferences.sidebarCollapsed ? '' : t('新版') }}</span>
        </RouterLink>
      </div>
    </aside>
    <main class="min-w-0 flex-1 overflow-auto">
      <RouterView v-slot="{ Component, route }">
        <KeepAlive>
          <component :is="Component" :key="route.name" />
        </KeepAlive>
      </RouterView>
    </main>
  </div>
</template>
<script setup lang="ts">
import { t } from "./i18n/index";
import { PanelLeftClose, PanelLeftOpen, Settings, History, ChevronDown, ListTree, House, Star } from "lucide-vue-next";
import { computed, onBeforeUnmount, onMounted } from "vue";
import { useRoute } from "vue-router";
import { usePreferencesStore } from "./stores/preferences";
import { useUpdatesStore } from "./stores/updates";
import { version } from "../package.json";
import { menuGroups } from "./data/tools";
import { useWindowPreferences } from "./composables/useWindowPreferences";

const preferences = usePreferencesStore();
const updates = useUpdatesStore();
onMounted(updates.start);
onBeforeUnmount(updates.stop);
useWindowPreferences();
const route = useRoute();
const visibleGroups = computed(() => menuGroups.map(group => ({
  ...group,
  items: group.items.filter(item => !preferences.sidebarFavoritesOnly || preferences.favorites.includes(item.path)),
})).filter(group => group.items.length));
const allGroupsCollapsed = computed(() => visibleGroups.value.length > 0 && visibleGroups.value.every(group => preferences.collapsedGroups.includes(group.id)));

function toggleAllGroups() {
  const visibleIds = new Set<string>(visibleGroups.value.map(group => group.id));
  // 只看收藏时仅调整可见分组，不覆盖其余分组原来的展开偏好。
  preferences.collapsedGroups = allGroupsCollapsed.value
    ? preferences.collapsedGroups.filter(id => !visibleIds.has(id))
    : [...new Set([...preferences.collapsedGroups, ...visibleIds])];
}

function toggleGroup(id: string) {
  if (preferences.collapsedGroups.includes(id)) {
    preferences.collapsedGroups = preferences.collapsedGroups.filter((key) => key !== id);
  } else {
    preferences.collapsedGroups = [...preferences.collapsedGroups, id];
  }
}

const footerItems = computed(() => {
  const label = t('版本与升级 · {version}', { version });
  return [
    { path: '/releases', label, title: updates.available ? `${label} · ${t('发现新版本 {version}', { version: updates.available.tag })}` : label, icon: History },
    { path: '/settings', label: '用户设置', title: t('用户设置'), icon: Settings },
  ];
});
</script>
