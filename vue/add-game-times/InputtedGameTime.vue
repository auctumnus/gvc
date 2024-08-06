<script setup lang="ts">
import { computed, ref, toRef } from "vue";
import { GameTime } from "./types";

import { useDataStore } from "./store";
import { ds, ts } from "./time";
import { isSameDay } from "date-fns/isSameDay";
import RemoveTimeModal from "./RemoveTimeModal.vue";
import EditTimeModal from "./EditTimeModal.vue";
import { onClickOutside } from "@vueuse/core";
import EntriesModal from "./EntriesModal.vue";

const data = useDataStore();

const props = defineProps<{
  gameTime: GameTime;
}>();

const gameTime = toRef(props, "gameTime");

const underMin = computed(
  () => gameTime.value.entries_count! < data.minPlayers,
);

const accessibleLabel = computed(
  () =>
    `${gameTime.value.entries_count} out of ${data.maxPlayers}${underMin ? " (under minimum)" : ""}`,
);

const readableLabel = computed(
  () =>
    `${gameTime.value.entries_count}/${data.maxPlayers}${underMin ? "*" : ""}`,
);

const time = computed(() => {
  const start = new Date(gameTime.value.start);
  const end = new Date(gameTime.value.end);
  return { start, end };
});

const showRemoveTimeModal = ref(false);

const showEditTimeModal = ref(false);

const showEntriesModal = ref(false);

const focused = computed(() => data.focusedGameTime === gameTime.value.id);

const row = ref<HTMLElement | null>(null);

onClickOutside(row, () => {
  if (focused.value) {
    data.unfocusGameTime();
  }
});
</script>

<template>
  <tr
    :id="`game-time-${gameTime.id}`"
    :class="{ focused, managed: true }"
    ref="row"
  >
    <td v-if="isSameDay(time.start, time.end)">
      {{ ds(time.start) }} <span class="nowrap">{{ ts(time.start) }}</span> -
      <span class="nowrap">{{ ts(time.end) }}</span>
    </td>
    <td v-else>
      {{ ds(time.start) }} <span class="nowrap">{{ ts(time.start) }}</span> -
      {{ ds(time.end) }} <span class="nowrap">{{ ts(time.end) }}</span>
    </td>
    <td
      :aria-label="accessibleLabel"
      :class="underMin ? 'under-min-count' : ''"
    >
      {{ readableLabel }}
    </td>
    <td>
      <button class="link" :onClick="() => (showRemoveTimeModal = true)">
        Remove
      </button>
    </td>
    <td>
      <button class="link" :onClick="() => (showEditTimeModal = true)">
        Edit
      </button>
    </td>
    <td>
      <button class="link" :onClick="() => (showEntriesModal = true)">
        Entries
      </button>
    </td>
  </tr>
  <remove-time-modal
    :game-time="gameTime"
    :visible="showRemoveTimeModal"
    @close="() => (showRemoveTimeModal = false)"
  />
  <edit-time-modal
    :game-time="gameTime"
    :visible="showEditTimeModal"
    @close="() => (showEditTimeModal = false)"
  />
  <entries-modal :gameTime="gameTime" :visible="showEntriesModal" @close="() => { showEntriesModal = false; }" />
</template>
