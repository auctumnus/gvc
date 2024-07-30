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

const sendEntries = async () => {
    submitting.value = true
    emit('close')
    submitting.value = false
}

</script>

<template>
    <modal :visible="visible" @close="() => emit('close')" class="pretty-modal">
        
    </modal>
</template>