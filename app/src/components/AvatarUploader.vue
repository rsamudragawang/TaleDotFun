<template>
  <div
    class="avatar-dropzone"
    @dragover.prevent="onDragOver"
    @dragleave.prevent="onDragLeave"
    @drop.prevent="onDrop"
    :class="{ 'drag-active': isDragActive }"
  >
    <div v-if="previewUrl" class="avatar-preview">
      <img :src="previewUrl" alt="Avatar Preview" class="avatar-img" />
      <button class="remove-btn" @click="removeImage" type="button">✕</button>
    </div>
    <div v-else class="avatar-placeholder">
      <span>Drag & drop or click to select an image</span>
    </div>
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      class="avatar-input"
      @change="onFileChange"
      style="display: none"
    />
    <button class="select-btn" type="button" @click="triggerFileInput">Select Image</button>
  </div>
</template>

<script setup>
import { ref, watch, defineEmits } from 'vue';

const emit = defineEmits(['file-selected']);

const isDragActive = ref(false);
const previewUrl = ref('');
const file = ref(null);
const fileInput = ref(null);

function onDragOver() {
  isDragActive.value = true;
}
function onDragLeave() {
  isDragActive.value = false;
}
function onDrop(e) {
  isDragActive.value = false;
  const droppedFile = e.dataTransfer.files[0];
  handleFile(droppedFile);
}
function onFileChange(e) {
  const selectedFile = e.target.files[0];
  handleFile(selectedFile);
}
function triggerFileInput() {
  fileInput.value.click();
}
function handleFile(selectedFile) {
  if (!selectedFile) return;
  file.value = selectedFile;
  previewUrl.value = URL.createObjectURL(selectedFile);
  emit('file-selected', selectedFile);
}
function removeImage() {
  file.value = null;
  previewUrl.value = '';
  emit('file-selected', null);
}
watch(() => file.value, (newFile) => {
  if (!newFile && previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value);
    previewUrl.value = '';
  }
});
</script>

<style scoped>
.avatar-dropzone {
  border: 2px dashed #bbb;
  border-radius: 12px;
  padding: 1rem;
  text-align: center;
  position: relative;
  background: #fafafa;
  transition: border-color 0.2s;
}
.avatar-dropzone.drag-active {
  border-color: #4f46e5;
  background: #f0f4ff;
}
.avatar-preview {
  position: relative;
  display: inline-block;
}
.avatar-img {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #eee;
}
.remove-btn {
  position: absolute;
  top: 0;
  right: 0;
  background: #fff;
  border: none;
  border-radius: 50%;
  color: #b91c1c;
  font-size: 1.2rem;
  cursor: pointer;
  width: 28px;
  height: 28px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
}
.avatar-placeholder {
  color: #888;
  margin-bottom: 0.5rem;
}
.select-btn {
  margin-top: 0.5rem;
  background: #4f46e5;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 0.4rem 1rem;
  cursor: pointer;
}
</style> 