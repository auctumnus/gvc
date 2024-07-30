<script setup lang="ts">
import { computed, ref, toRef } from 'vue';
import { EventT } from './types';
import { startOfDay as getStartOfDay } from 'date-fns/startOfDay';
import { differenceInMinutes } from 'date-fns/differenceInMinutes';
import { toReactive } from '@vueuse/core';
import { useDataStore } from '../add-game-times/store';
import EventModal from './EventModal.vue';

const data = useDataStore()

const props = defineProps<{ event: EventT }>()

const event = computed(() => props.event)

const classes = computed(() => ({
    event: true,
    'started-yesterday': event.value.startedYesterday,
    'ends-tomorrow': event.value.endsTomorrow,
    [event.value.kind]: true, // current, running, entered, other
    past: event.value.past
}))

const hoursFromTop = computed(() => {
    const start = event.value.start
    const startOfDay = getStartOfDay(start)

    const difference = differenceInMinutes(start, startOfDay) /* can't do differenceInHours bc it returns an integer */

    return difference / 60
})

const durationInHours = computed(() => {
    const start = event.value.start
    const end = event.value.end

    const difference = differenceInMinutes(end, start) /* can't do differenceInHours bc it returns an integer */

    return difference / 60
})

const styles = computed(() => ({
    '--concurrent-with': event.value.concurrentWith,
    '--concurrent-index': event.value.concurrentIndex,
    '--event-start': hoursFromTop.value,
    '--event-duration': durationInHours.value
}))
const underMin = computed(
  () => event.value.entries_count! < data.minPlayers,
);

const accessibleLabel = computed(
  () =>
    `${event.value.entries_count} out of ${data.maxPlayers}${underMin ? " (under minimum)" : ""}`,
);

const readableLabel = computed(
  () =>
    `${event.value.entries_count}/${data.maxPlayers}${underMin ? "*" : ""}`,
);

const eventModalVisible = ref(false)

const focus = () => {
    console.log('meow')
    if(event.value.kind !== 'current') {
        eventModalVisible.value = true
    } else {
        data.focusGameTime(event.value.id)
    }
}

const ariaEventDescription = computed(() => {
    const kind = event.value.kind
    if(kind === 'current') {
        return 'Time is for current event. Click to focus.'
    } else if(kind === 'running') {
        return 'Time is for an event you are running. Click to see more.'
    } else if(kind === 'entered') {
        return 'Time is for an event you entered. Click to see more.'
    } else {
        return 'Time is for other event. Click to see more.'
    }
})

</script>

<template>
    <div :class="classes" :style="styles" ref="el" @click="focus">
        <span :aria-label="ariaEventDescription"></span>
        <h3 v-if="!event.startedYesterday && event.game_name">{{ event.game_name }}</h3>
        <span v-if="!event.startedYesterday && event.entries_count !== undefined" :aria-label="accessibleLabel" :class="underMin ? 'under-min-count' : ''">{{ readableLabel }}</span>
        <event-modal v-if="event.kind !== 'current'" :visible="eventModalVisible" :event="event" @close="eventModalVisible = false" />
    </div>
</template>