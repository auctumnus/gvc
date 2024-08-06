<script setup lang="ts">
import Modal from "../add-game-times/Modal.vue";
import { ts } from "../add-game-times/time";
import { EventT } from "./types";

defineProps<{
  visible: boolean;
  event: EventT;
}>();

const emit = defineEmits<{ (e: "close"): void }>();
</script>

<template>
  <modal :visible="visible" @close="() => emit('close')" class="pretty-modal">
    <h2>{{ event.game_name }} ({{ ts(event.start) }} - {{ ts(event.end) }})</h2>

    <p>
      <a :href="`/games/${event.game_slug}`">View game</a>
    </p>

    <div class="buttons">
      <button @click="() => emit('close')" class="secondary">Close</button>
    </div>
  </modal>
</template>
