<template>
  <span :class="['priority-pill', `priority-${priority}`]">
    P{{ priority }} · {{ label }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Priority } from '../../domain/types'
import { getPriorityInfo } from '../../domain/priority'

const props = defineProps<{ priority: Priority }>()

const label = computed(() => getPriorityInfo(props.priority).label)
</script>
