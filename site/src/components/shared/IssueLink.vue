<template>
  <a
    :class="cn('hover:underline', props.class)"
    :href="`https://github.com/shiualan/oh-my-cv/issues/${issue}`"
    target="_blank"
    rel="noopener noreferrer"
    >#{{ issue }}</a
  >
</template>

<script lang="ts" setup>
import type { HTMLAttributes } from "vue";
import { cn } from "~/utils/shadcn";

const props = defineProps<{
  issue: string | number;
  class?: HTMLAttributes["class"];
}>();
</script>
