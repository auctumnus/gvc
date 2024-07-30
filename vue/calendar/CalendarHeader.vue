<script setup lang="ts">

defineProps<{
    week: { day: Date }[]
}>()


const weekday = (day: Date) => {
    return day.toLocaleDateString(undefined, { weekday: 'short' })
}

const ds = (day: Date) => {
    return day.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

</script>

<template>
    <div class="calendar-header">
        <div class="calendar-header-spacer" />
        <div class="calendar-header-day" v-for="{ day } in week">
            <h2>{{ weekday(day) }}</h2>
            <h2>{{ ds(day) }}</h2>
        </div>
    </div>
</template>