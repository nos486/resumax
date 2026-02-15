<script setup>
import { toastState, toast } from '../lib/toast'
</script>

<template>
  <div class="fixed top-4 right-4 z-50 flex flex-col gap-2">
    <transition-group name="toast">
      <div 
        v-for="t in toastState.toasts" 
        :key="t.id"
        class="min-w-[300px] p-4 rounded-lg shadow-lg text-white flex justify-between items-center cursor-pointer transform transition-all duration-300"
        :class="{
          'bg-green-600': t.type === 'success',
          'bg-red-600': t.type === 'error',
          'bg-blue-600': t.type === 'info'
        }"
        @click="toast.remove(t.id)"
      >
        <span>{{ t.message }}</span>
        <span class="text-white/80 hover:text-white text-sm">✕</span>
      </div>
    </transition-group>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
