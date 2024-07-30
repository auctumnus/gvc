<script setup lang="ts">
import { ref } from 'vue';
import AddTimeModal from './AddTimeModal.vue';
import GameTimesList from './GameTimesList.vue';
import Calendar from '../calendar/Calendar.vue';
import { useDataStore } from './store';

const showAddTimeModal = ref(false)

const data = useDataStore()
</script>
<template>
    <game-times-list
        @add-time="() => showAddTimeModal = true" 
    />
    <add-time-modal
        :visible="showAddTimeModal"
        @close="() => showAddTimeModal = false"
    />
    <calendar
        :current="data.current"
        :running="data.running"
        :entered="data.entered"
        :other="data.other"
        :start-of-con="data.startOfCon"
        :end-of-con="data.endOfCon"
    />
</template>
