<script setup lang="ts">
import { useDataStore } from '../add-game-times/store';
import { GameTimeData } from '../add-game-times/types';
import Calendar from './Calendar.vue';

const data = useDataStore()

</script>

<template>
    <Calendar
        :current="data.current"
        :running="data.running"
        :entered="data.entered"
        :other="data.other"
        :start-of-con="data.startOfCon"
        :end-of-con="data.endOfCon"
    />
</template>