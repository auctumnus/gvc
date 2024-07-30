<script setup lang="ts">
import { eachDayOfInterval } from 'date-fns/eachDayOfInterval';
import { isSameDay } from 'date-fns/isSameDay';
import { min } from 'date-fns/min';
import { max } from 'date-fns/max';
import type { GameTime } from '../add-game-times/types';
import { computed, ComputedRef, ref } from 'vue';
import { endOfDay } from 'date-fns/endOfDay';
import CalendarDay from './CalendarDay.vue';
import { EventT } from './types';
import { startOfWeek } from 'date-fns/startOfWeek';
import { differenceInDays } from 'date-fns/differenceInDays';
import { endOfWeek } from 'date-fns/endOfWeek';
import CalendarWeek from './CalendarWeek.vue';
import { subDays } from 'date-fns/subDays';
import { addDays } from 'date-fns/addDays';
import CalendarHeader from './CalendarHeader.vue';
import HelpModal from './HelpModal.vue';

type CalendarTime = GameTime & { game?: number }

const props = defineProps<{
    current: GameTime[], // outside of the add game times page, `running` includes all `current`
                         // and `current` is empty
    running: GameTime[],
    entered: GameTime[],
    other: GameTime[],
    startOfCon: number,
    endOfCon: number,
}>()

const startOfCon = computed(() => new Date(props.startOfCon))
const endOfCon = computed(() => new Date(props.endOfCon))

const days = computed(() => eachDayOfInterval({ start: startOfCon.value, end: endOfCon.value }))

type CalendarTimeWithKind = CalendarTime & { kind: 'current' | 'running' | 'entered' | 'other' }

const calendarTimes: ComputedRef<CalendarTimeWithKind[]> = computed(() => [
    ...props.current.map(g => ({ ...g, kind: 'current' as const })),
    ...props.running.map(g => ({ ...g, kind: 'running' as const })),
    ...props.entered.map(g => ({ ...g, kind: 'entered' as const })),
    ...props.other.map(g => ({ ...g, kind: 'other' as const }))
])

const eventsOnEachDay = computed(() => 
    days
        .value
        .map(day => 
            calendarTimes
                .value
                .filter(g => isSameDay(g.start, day) || isSameDay(g.end, day))
                .map(g => ({ 
                    ...g, 
                    start: max([g.start, day]),
                    end: min([g.end, endOfDay(day)]),
                    startedYesterday: g.start < day.valueOf(), 
                    endsTomorrow: g.end > endOfDay(day).valueOf(),
                    past: g.end < Date.now(),
                    concurrentIndex: undefined as (number | undefined)
                })
            )
        )
)

// i love you O(n^3) algorithm
const eventsWithConcurrency: ComputedRef<EventT[][]> = computed(() => {
    const events = eventsOnEachDay.value
    const eventsWithConcurrency: EventT[][] = []

    for (let i = 0; i < events.length; i++) {
        const dayEvents = events[i]
        const dayEventsWithConcurrency: EventT[] = []

        for (let j = 0; j < dayEvents.length; j++) {
            const event = dayEvents[j]
            const concurrentWith = dayEvents
                .filter(e => e !== event)
                .filter(e => 
                    (e.start >= event.start && e.start < event.end) || // start is within
                    (e.end > event.start && e.end <= event.end) || // end is within
                    (e.start < event.start && e.end > event.end) // event is within
                )
            
            let lastid = 0;

            if(!event.concurrentIndex) {
                event.concurrentIndex = lastid;
                lastid++;
            }
            
            concurrentWith.forEach(e => {
                if (!e.concurrentIndex) {
                    e.concurrentIndex = lastid;
                    lastid++;
                }
            })

            dayEventsWithConcurrency.push({ ...event, concurrentWith: concurrentWith.length })
        }

        eventsWithConcurrency.push(dayEventsWithConcurrency)
    }

    return eventsWithConcurrency
})

const eventsPerDay = computed(() => eventsWithConcurrency.value.map((events, i) => ({
    day: days.value[i],
    events
})))

const alignedToWeeks = computed(() => [
    ...eachDayOfInterval({ start: startOfWeek(startOfCon.value), end: subDays(startOfCon.value, 1) }).map(d => ({ day: d, events: []})),
    ...eventsPerDay.value,
    ...eachDayOfInterval({ start: addDays(endOfCon.value, 1), end: endOfWeek(endOfCon.value) }).map(d => ({ day: d, events: []}))
])


const DAYS_IN_WEEK = 7

const weeks = computed(() => alignedToWeeks.value.reduce((weeks, day, i) => {
    const weekIndex = Math.floor(i / DAYS_IN_WEEK)
    if(!weeks[weekIndex]) {
        weeks[weekIndex] = []
    }
    weeks[weekIndex].push(day)
    return weeks
}, [] as {day: Date, events: EventT[]}[][]))

const currentWeek = ref(0);
const lastWeek = computed(() => weeks.value.length - 1)

const firstDayOfCurrentWeek = computed(() => weeks.value[currentWeek.value][0].day)
const lastDayOfCurrentWeek = computed(() => weeks.value[currentWeek.value][DAYS_IN_WEEK - 1].day)

const helpModalShown = ref(false)
</script>

<template>
    
    <div class="calendar">
        <div class="calendar-help-container">
            <button class="link" @click="helpModalShown = true">Calendar help</button>
        </div>
        <div class="calendar-controls">
            <button @click="currentWeek--" :disabled="currentWeek === 0">Previous</button>
            <h2>{{ firstDayOfCurrentWeek.toLocaleDateString() }} - {{ lastDayOfCurrentWeek.toLocaleDateString() }}</h2>
            <button @click="currentWeek++" :disabled="currentWeek === lastWeek">Next</button>
        </div>
        <calendar-header :week="weeks[currentWeek]" />
        <calendar-week
            :days="weeks[currentWeek]"
            :start-of-con="startOfCon"
            :end-of-con="endOfCon"
        />
    </div>
    <help-modal :visible="helpModalShown" @close="helpModalShown = false" />
</template>