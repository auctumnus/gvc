<script setup lang="ts">
import { ref } from 'vue';
import Modal from './Modal.vue';
import { useDataStore } from './store';
import { GameTime } from './types';

const data = useDataStore()

const props = defineProps<{
    gameTime: GameTime;
    visible: boolean;
}>()

const emit = defineEmits<{ (e: 'close'): void }>()

const submitting = ref(false)

const remove = async () => {
    submitting.value = true
    await data.removeTime(props.gameTime.id)
    emit('close')
    submitting.value = false
    // TODO: remove this dumb bodge
    // for some reason the modal backdrop isnt getting removed but only for this particular modal. i have no clue why
    setTimeout(() => {
        document.querySelector('#modal-backdrop')?.remove()
    }, 300)
}

</script>

<template>
    <modal :visible="visible" @close="() => emit('close')" class="pretty-modal">
        <h2>Remove game time</h2>
        <p>Are you sure you want to remove this game time?</p>
        <p v-if="gameTime.entries_count">
            <strong>{{ gameTime.entries_count }}</strong> {{ gameTime.entries_count > 1 ? 'people have' : 'person has' }} made {{ gameTime.entries_count > 1 ? 'entries' : 'an entry' }} for this time.
        </p>
        <div class="buttons">
            <button @click="() => emit('close')" class="secondary">Cancel</button>
            <button @click="remove">Remove</button>
        </div>
    </modal>
</template>