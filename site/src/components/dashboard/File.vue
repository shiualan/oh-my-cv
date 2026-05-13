<template>
  <div class="flex gap-2">
    <UiButton @click="exportToJSON">
      <span i-ic:baseline-save-as size-4 mr-1 />
      {{ $t("dashboard.saveas") }}
    </UiButton>
    <UiButton
      class="bg-neutral-800 hover:(bg-neutral-800/90 ring-neutral-800/40) dark:(bg-secondary hover:bg-background hover:ring-secondary/40)"
      @click="open"
    >
      <span i-ic:round-upload-file size-4 mr-1 />
      {{ $t("dashboard.import") }}
    </UiButton>
  </div>
</template>

<script lang="ts" setup>
import { useShortcuts } from "@ohmycv/vue-shortcuts";
import { useFileDialog, readFile } from "@renovamen/utils";

const emits = defineEmits<{
  (e: "update"): void;
}>();

const MAX_JSON_IMPORT_BYTES = 2 * 1024 * 1024;

const { open, onChange } = useFileDialog(".json");

onChange(async (file) => {
  try {
    const content = await readFile(file, MAX_JSON_IMPORT_BYTES);
    await storageService.importFromJson(content);
    emits("update");
  } catch (error) {
    console.error(error);
  }
});

const exportToJSON = () => storageService.exportToJSON();

useShortcuts("shift+ctrl+s", exportToJSON);
</script>
