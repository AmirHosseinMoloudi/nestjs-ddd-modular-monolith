<template>
  <div class="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
    <div class="bg-zinc-900/60 border border-zinc-800/80 rounded-lg p-3.5">
      <div class="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Total Tasks</div>
      <div class="text-2xl font-bold text-white mt-1">{{ task.stats.total }}</div>
      <div class="text-[10px] text-zinc-500 mt-1">Across all statuses</div>
    </div>

    <div class="bg-zinc-900/60 border border-zinc-800/80 rounded-lg p-3.5">
      <div class="text-[11px] font-medium text-blue-400 uppercase tracking-wider">In Progress</div>
      <div class="text-2xl font-bold text-blue-400 mt-1">{{ task.stats.byStatus?.IN_PROGRESS || 0 }}</div>
      <div class="text-[10px] text-zinc-500 mt-1">Active execution</div>
    </div>

    <div class="bg-zinc-900/60 border border-amber-500/20 rounded-lg p-3.5 bg-amber-500/5">
      <div class="text-[11px] font-medium text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
        <span>In Review (HITL)</span>
        <span class="h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping"></span>
      </div>
      <div class="text-2xl font-bold text-amber-300 mt-1">{{ task.stats.byStatus?.IN_REVIEW || 0 }}</div>
      <div class="text-[10px] text-amber-400/70 mt-1">Pending Maker-Checker</div>
    </div>

    <div class="bg-zinc-900/60 border border-zinc-800/80 rounded-lg p-3.5">
      <div class="text-[11px] font-medium text-emerald-400 uppercase tracking-wider">Completed</div>
      <div class="text-2xl font-bold text-emerald-400 mt-1">{{ task.stats.byStatus?.COMPLETED || 0 }}</div>
      <div class="text-[10px] text-zinc-500 mt-1">Verified & closed</div>
    </div>

    <div class="bg-zinc-900/60 border border-zinc-800/80 rounded-lg p-3.5 col-span-2 md:col-span-1">
      <div class="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Backlog (Todo)</div>
      <div class="text-2xl font-bold text-zinc-300 mt-1">{{ task.stats.byStatus?.TODO || 0 }}</div>
      <div class="text-[10px] text-zinc-500 mt-1">Awaiting dispatch</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTaskStore } from '~/stores/task';

const task = useTaskStore();
</script>
