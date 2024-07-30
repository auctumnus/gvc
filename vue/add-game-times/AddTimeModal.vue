<script setup lang="ts">
import { computed, ref } from 'vue';
import Modal from './Modal.vue';
import { useDataStore } from './store';
import { eachDayOfInterval } from 'date-fns/eachDayOfInterval';
import { eachMinuteOfInterval } from 'date-fns/eachMinuteOfInterval';
import { max as dateMax } from 'date-fns/max';
import { ds, ts } from './time';
import { isSameDay } from 'date-fns/isSameDay';
import { endOfDay } from 'date-fns/endOfDay';
import { startOfDay } from 'date-fns/startOfDay';
import { addMinutes } from 'date-fns/addMinutes';
import type { Interval } from 'date-fns';
import { addHours } from 'date-fns/addHours';
import { compareAsc } from 'date-fns/compareAsc';


const data = useDataStore()

const now = new Date()

const startOfCon = dateMax([new Date(data.startOfCon), now])
const endOfCon = new Date(data.endOfCon)

defineProps<{
    visible: boolean;
}>()

const days = computed(() => {
    return eachDayOfInterval({ start: startOfCon, end: endOfCon })
})

const times = computed(() => {
    const start = startOfCon
    const end = endOfCon

    let interval: Interval = { start, end }

    if(isSameDay(start, day.value)) {
        interval = { start, end: endOfDay(start)}
    } else if(isSameDay(end, day.value)) {
        interval = { start: startOfDay(end), end }
    } else {
        interval = { start: startOfDay(day.value), end: endOfDay(day.value)}
    }

    const halfHours = eachMinuteOfInterval(interval).filter(d => d.getMinutes() % 30 === 0)

    return halfHours
})

const durations = [...Array(16)].map((_, i) => (i + 1) / 2)

const day = ref(days.value[0])

const time = ref(times.value[0])

const duration = ref(durations[0])

const isPastEnd = computed(() => {
    return compareAsc(addHours(time.value, duration.value), addMinutes(endOfCon, 1)) === 1
})

const hasError = computed(() => isPastEnd.value)

const submitting = ref(false)

const emit = defineEmits<{ (e: 'close'): void }>()

const save = async () => {
    const start = time.value
    const end = addHours(time.value, duration.value)

    submitting.value = true;

    await data.addTime(
        start.valueOf(),
        end.valueOf()
    )
    emit('close')

    submitting.value = false;
}

const hs = (duration: number) => {
    if(duration === 0.5) {
        return '30 minutes'
    } else if(duration === 1) {
        return '1 hour'
    } else {
        return `${duration} hours`
    }
}


</script>

<template>
    <Modal :visible="visible" @close="() => emit('close')" class="pretty-modal">
        <h2>Add time</h2>
        <div class="time-input">
            <label for="day">Day</label>
            <label for="time">Time</label>
            <label for="duration">Duration</label>
            <select id="day" v-model="day">
                <option v-for="day in days" :key="day.getTime()" :value="day">
                    {{ ds(day) }}
                </option>
            </select>
            <select id="time" v-model="time">
                <option v-for="time in times" :key="time.getTime()" :value="time">
                    {{ ts(time) }}
                </option>
            </select>
            <select id="duration" v-model="duration">
                <option v-for="duration in durations" :key="duration" :value="duration">
                    {{ hs(duration) }}
                </option>
            </select>
        </div>
        <div class="time-error">
            {{ isPastEnd ? 'This time is past the end of the convention.' : '' }}
        </div>
        <div class="buttons">
            <button @click="() => emit('close')" :disabled="submitting" class="secondary">Cancel</button>
            <button @click="save" :disabled="hasError || submitting">Save</button>
        </div>
    </Modal>
</template>