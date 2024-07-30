<script setup lang="ts">
import { eachHourOfInterval, type Interval } from 'date-fns';
import CalendarDayDivider from './CalendarDayDivider.vue';
import Event from './Event.vue';
import type { EventT as EventT } from './types';
import { isSameDay } from 'date-fns/isSameDay';
import { eachMinuteOfInterval } from 'date-fns/eachMinuteOfInterval';
import { startOfDay } from 'date-fns/startOfDay';
import { endOfDay } from 'date-fns/endOfDay';
import { computed } from 'vue';
import { addHours } from 'date-fns/addHours';

const props = defineProps<{
    events: EventT[]
    day: Date
    startOfCon: Date
    endOfCon: Date
}>()

const hoursOfDay = computed(() => {
    const start = props.startOfCon
    const end = props.endOfCon

    const hours = eachHourOfInterval({ start: startOfDay(props.day), end: endOfDay(props.day) })

    return hours.map(h => ({
        time: h,
        duringCon: h >= start && (addHours(h, 1)) <= end,
        past: addHours(h, 1).valueOf() < Date.now()
    }))
})

</script>

<template>
    <div class="calendar-day">
        <calendar-day-divider
            v-for="{time, duringCon, past} in hoursOfDay"
            :key="time.valueOf()"
            :duringCon="duringCon"
            :past="past"
        />
        <event
            v-for="event in events"
            :key="event.id"
            :event="event"
        />
    </div>
</template>