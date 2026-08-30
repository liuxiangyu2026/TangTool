<template>
  <div>
    <h1>Tool Placeholder</h1>
    <section class="p-6">
        <p class="text-sm text-neutral-500">{{ route.meta?.group }}</p>
        <h1 class="mt-1 text-2xl font-semibold text-neutral-900">{{ route.meta?.title }}</h1>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from "vue-router";

const route = useRoute();
</script>

<style scoped>

</style>