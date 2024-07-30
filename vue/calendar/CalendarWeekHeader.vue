<script setup lang="ts">
import { eachHourOfInterval } from 'date-fns/eachHourOfInterval';
import { endOfDay } from 'date-fns/endOfDay';
import { startOfDay } from 'date-fns/startOfDay';
import { ts } from '../add-game-times/time';

// TODO: i am actually not sure if this always results in a 24 hour day LOL
const hours = eachHourOfInterval({ start: startOfDay(new Date()), end: endOfDay(new Date()) });
</script>
    
<template>
    <div class="calendar-week-header">
        <div class="calendar-week-hour-label" v-for="hour in hours" :key="hour.valueOf()">
            {{ ts(hour) }}
        </div>
    </div>
</template>