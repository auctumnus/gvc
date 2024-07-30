<script setup lang="ts">
import Modal from '../add-game-times/Modal.vue';

defineProps<{
    visible: boolean
}>()

const emit = defineEmits<{ (e: 'close'): void }>()
</script>

<template>
    <modal :visible="visible" @close="() => emit('close')" class="pretty-modal">
        <h2>Help</h2>
        
        <p>
            This shows relevant game times for the convention, related to either the current game, or your personal schedule.
        </p>
        <ul>
            <li>Games colored <span class="color-example entered">gold</span> describe games you've entered.</li>
            <li>Games colored <span class="color-example running">blue</span> describe games that are currently running.</li>
            <li>Games colored <span class="color-example current">green</span> describe the game you're currently looking at.</li>
            <li>Games colored <span class="color-example other">gray</span> describe any other games.</li>
            <li>Clicking on a game will either focus its time or bring up more information.</li>
            <li>On desktop, you can use <kbd>Escape</kbd> to close modals.</li>
        </ul>

        <div class="buttons">
            <button @click="() => emit('close')" class="secondary">Close</button>
        </div>
    </modal>
</template>