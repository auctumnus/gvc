<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import Modal from './Modal.vue';
import { useDataStore } from './store';
import { GameTime } from './types';
import { ds, ts } from './time';
import { isSameDay } from 'date-fns';
import User from './User.vue';

const data = useDataStore()

const props = defineProps<{
    gameTime: GameTime;
    visible: boolean;
}>()

const emit = defineEmits<{ (e: 'close'): void }>()

const submitting = ref(false)

interface GameEntry {
    id: number;
  game_time: number;
  priority: number;
  accepted: boolean;
  created_at: number;
    user: {
        discord_id: string,
        username: string,
        display_name: string,
        avatar: string
    }
}

const entries = ref([] as GameEntry[])

const error = ref('')

const handleError = (e: Error) => {
    console.error(e)
    error.value = e.message
}

const getEntries = async () => {
    try {
        const response = await fetch(window.location.pathname + `/${props.gameTime.id}/entries`)
        if(!response.ok) {
            console.error(await response.text())
            handleError(new Error('Failed to fetch entries'))
            return
        }

        entries.value = await response.json()
    } catch(e) {
        handleError(e)
    }
}

const start = computed(() => new Date(props.gameTime.start))
const end = computed(() => new Date(props.gameTime.end))

watch(() => props.visible, async (visible) => {
    if(visible) {
        await getEntries()
    }
})

const changeStatus = async (id: number, accept: boolean) => {
    try {
        const response = await fetch(window.location.pathname + `/${props.gameTime.id}/entries/${id}?accepted=${accept}`, {
            method: 'PATCH',
            body: JSON.stringify({ accepted: accept }),
            headers: {
                'Content-Type': 'application/json'
            }
        })
        if(!response.ok) {
            console.error(await response.text())
            handleError(new Error('Failed to accept entry'))
            return
        }

        await getEntries()
    } catch(e) {
        handleError(e)
    }
}


</script>

<template>
  <modal :visible="visible" @close="() => emit('close')" class="pretty-modal">
    <h2>
      Entries for
      <span v-if="isSameDay(gameTime.start, gameTime.end)">
        {{ ds(start) }} <span class="nowrap">{{ ts(start) }}</span> -
        <span class="nowrap">{{ ts(end) }}</span>
      </span>
      <span v-else>
        {{ ds(start) }} <span class="nowrap">{{ ts(start) }}</span> -
        {{ ds(end) }} <span class="nowrap">{{ ts(end) }}</span>
      </span>
    </h2>
    <p v-if="error" class="error">{{ error }}</p>
    <div class="entries-modal-table-head">
        <p v-if="!entries.length"><b>No</b> entries</p>
        <p v-else-if="entries.length === 1"><b>1</b> entry</p>
        <p v-else><b>{{ entries.length }}</b> entries</p>

        <p v-if="!entries.filter(e => e.accepted).length"><b>None</b> accepted</p>
        <p v-else><b>{{ entries.filter(e => e.accepted).length }}</b> accepted</p>
    </div>
    <table v-if="entries.length">
        <thead>
            <tr>
                <th>Priority</th>
                <th>User</th>
                <th>Created at</th>
                <th>Accepted?</th>
                <th></th>
            </tr>
        </thead>
        <tbody>
            <tr v-for="entry in entries" :key="entry.id">
                <td>{{ entry.priority }}</td>
                <td><user v-bind="entry.user"></user></td>
                <td>{{ ds(new Date(entry.created_at * 1000)) }} {{ ts(new Date(entry.created_at * 1000)) }}</td>
                <td>{{ entry.accepted ? 'Yes' : 'No' }}</td>
                <td v-if="entry.accepted"><button @click="changeStatus(entry.id, false)">Ignore</button></td>
                <td v-else><button @click="changeStatus(entry.id, true)">Accept</button></td>
            </tr>
        </tbody>
    </table>
    <div class="buttons">
        <button @click="() => emit('close')" class="secondary">Close</button>
    </div>
  </modal>
</template>
