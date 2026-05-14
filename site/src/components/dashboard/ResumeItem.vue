<template>
  <div w-56>
    <div h-80>
      <div class="resume-card group/card relative isolate size-fit">
        <nuxt-link
          :to="$nuxt.$localePath(`/editor/${props.resume.id}`)"
          class="relative z-0 block border overflow-hidden rounded-md ring-when-focus peer"
          :style="{
            width: `${size.w}px`,
            height: `${size.h}px`
          }"
        >
          <SharedResumeRender
            :id="resume.id"
            ref="renderRef"
            :markdown="resume.markdown"
            :styles="resume.styles"
            class="origin-top-left"
            :style="{
              transform: `scale(${1 / PAPER.MM_TO_PX})`
            }"
          />
        </nuxt-link>

        <DashboardResumeOptions
          class="z-10 opacity-0 pointer-events-none group-hover/card:opacity-100 group-hover/card:pointer-events-auto peer-focus-within:opacity-100 peer-focus-within:pointer-events-auto focus-within:opacity-100 focus-within:pointer-events-auto"
          pos="absolute right-3 top-3"
          :resume="resume"
          @update="emit('update')"
        />
      </div>
    </div>

    <DashboardResumeInfo :resume="resume" />
  </div>
</template>

<script lang="ts" setup>
import { delay } from "@renovamen/utils";
import type { DbResume } from "~/utils/storage";
import { SharedResumeRender } from "#components";

const props = defineProps<{
  resume: DbResume;
}>();

const emit = defineEmits<{
  (e: "update"): void;
}>();

const { PAPER } = useConstant();
const size = PAPER.SIZES[props.resume.styles.paper];

const renderRef = ref<InstanceType<typeof SharedResumeRender>>();

onMounted(async () => {
  // set styles that are defined via CSS editor
  dynamicCssService.injectCssEditor(props.resume.css, props.resume.id);
  // load Google fonts
  await googleFontsService.resolve(props.resume.styles.fontEN);
  await googleFontsService.resolve(props.resume.styles.fontCJK);
  // set styles that are defined via toolbar
  dynamicCssService.injectToolbar(props.resume.styles, props.resume.id);
  // force update resume render
  await delay(100);
  renderRef.value?.render();
});
</script>

<style scoped>
/* Only need to show the first page of the resume card */
:deep(.resume-render) > *:not(:first-child) {
  @apply hidden;
}
</style>
