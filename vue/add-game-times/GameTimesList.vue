<script setup lang="ts">
import { computed } from "vue";
import InputtedGameTime from "./InputtedGameTime.vue";
import { useDataStore } from "./store";

const data = useDataStore();

const numGames = computed(() => data.current.length);

const emit = defineEmits<{
  (e: "add-time"): void;
}>();
</script>

<template>
  <p>
    All times on this page are in your browser's time zone ({{
      Intl.DateTimeFormat().resolvedOptions().timeZone
    }}).
  </p>
  <div class="game-times-list" v-if="numGames === 0">
    <div class="table-prelude">
      <p>No game times have been entered yet.</p>
      <button @click="() => emit('add-time')">Add new time</button>
    </div>
  </div>

  <div class="game-times-list" v-else>
    <div class="table-prelude">
      <p>
        <strong>{{ numGames }}</strong> game time{{ numGames > 1 ? "s" : "" }}
      </p>
      <button @click="() => emit('add-time')">Add new time</button>
    </div>
    <table class="game-times">
      <thead>
        <tr>
          <th>Time</th>
          <th>Entries</th>
          <th></th>
          <th></th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <inputted-game-time
          v-for="gameTime in data.current"
          :key="gameTime.id"
          :game-time="gameTime"
        />
      </tbody>
    </table>
    <p v-if="data.minPlayers > 0">
      Asterisks (*) mark games that are
      <strong>under the minimum player count</strong> for this game
      <span class="nowrap"
        >(currently set to <strong>{{ data.minPlayers }}</strong
        >).</span
      >
    </p>
  </div>
</template>
