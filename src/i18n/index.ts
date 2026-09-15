import { ref, watch } from "vue";
import { configureLocale, type Locale } from "./core";

export const locale = ref<Locale>("zh-CN");
configureLocale(() => locale.value);

watch(locale, value => {
  document.documentElement.lang = value;
}, { immediate: true, flush: "sync" });

export { t, translate, normalizeLocale, type Locale } from "./core";
