<script setup lang="ts">
import { onClickOutside } from "@vueuse/core";
import { ref, watch } from "vue";

const props = defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  (e: "close"): void;
}>();

const modal = ref<HTMLDialogElement | null>(null);

watch(props, ({ visible: _open }, _) => {
  // these functions are from `/static/js/main.js`
  if (_open) {
    openModal(modal.value);
  } else {
    closeModal(modal.value);
  }
});

onClickOutside(modal, () => {
  if (props.visible) {
    emit("close");
  }
});
</script>

<template>
  <Teleport to="body">
    <dialog
      class="fullscreen-modal"
      v-bind="$attrs"
      ref="modal"
      @keydown.esc="() => emit('close')"
    >
      <slot></slot>
    </dialog>
  </Teleport>
</template>
