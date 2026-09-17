<template>
  <button ref="trigger" type="button" class="tool-button shrink-0 bg-slate-600 transition hover:bg-slate-700" :disabled="disabled" :aria-label="label || t('json.escape')" :title="t('json.escapeHint')"
    aria-haspopup="menu" :aria-expanded="opened" :aria-controls="opened ? menuId : undefined" @click="toggleMenu" @keydown.down.prevent="openMenu(0)" @keydown.up.prevent="openMenu(1)">
    <span class="font-mono" aria-hidden="true">\</span>{{ t('json.escapeLabel') }}<ChevronDown :size="12" aria-hidden="true" />
  </button>
  <Teleport to="body">
    <div v-if="opened" :id="menuId" ref="menu" class="fixed z-40 rounded-md border border-neutral-200 bg-surface p-1 text-xs text-neutral-800 shadow-lg" :style="position" role="menu" :aria-label="label || t('json.escape')" @keydown="handleMenuKeydown">
      <button type="button" role="menuitem" tabindex="-1" class="flex w-full items-center gap-2 rounded px-3 py-2 text-left hover:bg-neutral-100 focus:bg-neutral-100 focus:outline-none" @click="selectAction('add')"><Plus :size="14" class="text-blue-600" aria-hidden="true" />{{ t('json.escapeAdd') }}</button>
      <button type="button" role="menuitem" tabindex="-1" class="flex w-full items-center gap-2 rounded px-3 py-2 text-left hover:bg-neutral-100 focus:bg-neutral-100 focus:outline-none" @click="selectAction('remove')"><Minus :size="14" class="text-amber-600" aria-hidden="true" />{{ t('json.escapeRemove') }}</button>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onDeactivated, ref, useId, watch } from "vue";
import { ChevronDown, Minus, Plus } from "lucide-vue-next";
import { t } from "../i18n/index";
import type { QuoteEscapeAction } from "../utils/quoteEscape";

const props = defineProps<{ disabled?: boolean; label?: string }>();
const emit = defineEmits<{ select: [action: QuoteEscapeAction] }>();
const menuId = useId();
const trigger = ref<HTMLButtonElement | null>(null);
const menu = ref<HTMLDivElement | null>(null);
const opened = ref(false);
const position = ref({ left: "0px", top: "0px", width: "184px" });

async function openMenu(index: number) {
  if (props.disabled || !trigger.value) return;
  const anchor = trigger.value.getBoundingClientRect();
  const width = Math.min(184, window.innerWidth - 16);
  position.value = {
    left: `${Math.max(8, Math.min(anchor.left, window.innerWidth - width - 8))}px`,
    top: `${anchor.bottom + 4}px`,
    width: `${width}px`,
  };
  opened.value = true;
  await nextTick();
  if (!opened.value || !menu.value) return;

  // 编辑器外层有 overflow-hidden；传送到 body 的固定浮层不会被裁切或撑高面板。
  const height = menu.value.getBoundingClientRect().height;
  if (anchor.bottom + height + 12 > window.innerHeight) {
    position.value.top = `${Math.max(8, anchor.top - height - 4)}px`;
  }
  menu.value.querySelectorAll<HTMLButtonElement>('[role="menuitem"]')[index]?.focus({ preventScroll: true });
  document.addEventListener("pointerdown", handleOutsideInteraction, true);
  document.addEventListener("focusin", handleOutsideInteraction);
  window.addEventListener("resize", closeMenu);
  window.addEventListener("scroll", closeMenu, true);
}

function closeMenu() {
  opened.value = false;
  document.removeEventListener("pointerdown", handleOutsideInteraction, true);
  document.removeEventListener("focusin", handleOutsideInteraction);
  window.removeEventListener("resize", closeMenu);
  window.removeEventListener("scroll", closeMenu, true);
}

function toggleMenu() {
  if (opened.value) closeMenu();
  else void openMenu(0);
}

function handleOutsideInteraction(event: Event) {
  const target = event.target;
  if (target instanceof Node && !trigger.value?.contains(target) && !menu.value?.contains(target)) {
    closeMenu();
  }
}

function handleMenuKeydown(event: KeyboardEvent) {
  if (event.key === "Escape" || event.key === "Tab") {
    if (event.key === "Escape") event.preventDefault();
    trigger.value?.focus({ preventScroll: true });
    closeMenu();
    return;
  }
  if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
  event.preventDefault();
  const items = Array.from(menu.value?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? []);
  const current = items.findIndex(item => item === document.activeElement);
  let index = event.key === "ArrowUp" ? current - 1 : current + 1;
  if (event.key === "Home") index = 0;
  if (event.key === "End") index = items.length - 1;
  items[(index + items.length) % items.length]?.focus({ preventScroll: true });
}

function selectAction(action: QuoteEscapeAction) {
  trigger.value?.focus({ preventScroll: true });
  closeMenu();
  emit("select", action);
}

watch(() => props.disabled, disabled => {
  if (disabled) closeMenu();
});
// KeepAlive 停用时不会卸载组件，必须同时关闭浮层并移除全局监听。
onDeactivated(closeMenu);
onBeforeUnmount(closeMenu);
</script>
