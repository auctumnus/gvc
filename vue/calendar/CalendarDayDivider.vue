<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  duringCon: boolean;
  past: boolean;
}>();

const classes = computed(() => ({
  "calendar-day-divider": true,
  "outside-con": !props.duringCon,
  past: props.past,
}));
</script>

<template>
  <div :class="classes" />
</template>
