<script setup lang="ts">
defineProps<{
  discord_id: string;
  username: string;
  display_name: string;
  avatar: string;
}>();
</script>

<template>
  <a :href="`/users/${discord_id}`" class="inline-user">
    <img :src="avatar" aria-hidden />
    <span>{{ display_name || username }}</span>
  </a>
</template>
