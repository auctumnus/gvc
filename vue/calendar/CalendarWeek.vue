<script setup lang="ts">
import CalendarDay from './CalendarDay.vue';
import CalendarWeekHeader from './CalendarWeekHeader.vue';
import { EventT } from './types';

defineProps<{
    days: {day: Date, events: EventT[]}[]
    startOfCon: Date,
    endOfCon: Date,
}>()
</script>
<template>
    <div class="calendar-week">
        <calendar-week-header />
        <calendar-day 
            v-for="{day, events} in days" 
            :key="day.valueOf()" 
            :day="day" 
            :events="events"
            :start-of-con="startOfCon"
            :end-of-con="endOfCon"
        />
    </div>
</template>