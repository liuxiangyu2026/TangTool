<template>
  <section class="flex h-full min-h-0 flex-col bg-neutral-100 p-4 text-neutral-900">
    <header class="shrink-0">
      <p class="text-sm text-neutral-500">{{ t(String(route.meta.group ?? '')) }}</p>
      <h1 class="mt-1 text-2xl font-semibold">{{ t(String(route.meta.title ?? '')) }}</h1>
      <p class="mt-2 text-xs leading-5 text-neutral-500">{{ description }}</p>
    </header>
    <div class="mt-4 flex shrink-0 flex-wrap items-center gap-2 rounded-lg border border-neutral-200 bg-surface px-3 py-2">
      <slot name="actions" />
    </div>
    <ToolNotice :error="error" :status="status" />
    <div class="mt-4 flex min-h-0 flex-1 flex-col gap-3 overflow-auto"><slot /></div>
  </section>
</template>

<script setup lang="ts">
import { t } from "../i18n/index";
import { useRoute } from "vue-router";
import ToolNotice from "./ToolNotice.vue";

defineProps<{ description: string; error?: string; status?: string }>();
const route = useRoute();
</script>
