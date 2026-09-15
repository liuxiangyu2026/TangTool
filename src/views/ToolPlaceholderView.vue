<template>
  <section class="min-h-full bg-neutral-100 p-4 sm:p-6">
    <div class="w-full">
      <header>
        <p class="text-sm font-medium text-neutral-500">{{ t(String(route.meta.group ?? '')) }}</p>
        <h1 class="mt-1 text-2xl font-semibold text-neutral-900">{{ t(String(route.meta.title ?? '')) }}</h1>
      </header>

      <div :aria-label="t('工具工作区')" class="mt-6 min-h-96 rounded-lg border border-neutral-200 bg-white p-6"></div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { t } from "../i18n/index";
import { useRoute } from "vue-router";

const route = useRoute();
</script>
