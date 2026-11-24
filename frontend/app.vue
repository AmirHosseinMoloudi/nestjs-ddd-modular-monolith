<template>
  <div>
    <NuxtLoadingIndicator color="#3b82f6" />
    <NuxtPage />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useAuthStore } from '~/stores/auth';

const auth = useAuthStore();

onMounted(() => {
  auth.initAuth();
});
</script>
