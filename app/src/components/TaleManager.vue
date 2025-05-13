<template>
  <div class="tales-manager-container">
    <h1 class="page-main-title">Tales of Readium</h1>

    <!-- <div class="wallet-connect-section">
      <h2 class="section-heading">Wallet</h2>
      <WalletMultiButton />
      <div v-if="wallet.connected.value && wallet.publicKey.value" class="info-box connected-wallet-display">
        Connected: <span class="wallet-address-mono">{{ shortenAddress(wallet.publicKey.value.toBase58()) }}</span>
      </div>
    </div> -->

    <div v-if="wallet.connected.value && appUser" class="user-welcome-banner">
      <p>Welcome, <span class="user-name-display">{{ appUser.name }}</span> ({{ appUser.type }})!</p>
      <button
        v-if="appUser.type === 'creator'"
        @click="showCreateModal = true"
        class="btn btn-primary create-tale-button"
      >
        + Create New Tale
      </button>
    </div>
     <div v-else-if="wallet.connected.value && !appUser && !isLoadingUser" class="login-register-prompt">
        <p>Please <router-link :to="{name: 'Auth'}" class="link auth-link">Login/Register</router-link> to manage tales.</p>
    </div>

    <div v-if="uiMessage.text"
         :class="['ui-message-global', `ui-message-${uiMessage.type}`]">
      {{ uiMessage.text }}
    </div>


    <div v-if="showCreateModal || editingTale" class="modal-overlay">
      <div class="modal-content-container">
        <h2 class="modal-main-title">{{ editingTale ? 'Edit Tale' : 'Create New Tale' }}</h2>
        <form @submit.prevent="handleSaveTale" class="modal-form-layout">
          <div class="form-group">
            <label for="taleTitle" class="form-label">Title:</label>
            <input type="text" id="taleTitle" v-model="currentTale.title" class="form-input-field" required />
          </div>
          <div class="form-group">
            <label for="taleContent" class="form-label">Content (Markdown supported):</label>
            <textarea id="taleContent" v-model="currentTale.content" class="form-textarea-field" required></textarea>
          </div>
          <div class="form-grid-halves">
            <div class="form-group">
              <label for="taleGenre" class="form-label">Genre:</label>
              <input type="text" id="taleGenre" v-model="currentTale.genre" class="form-input-field" placeholder="e.g., Fantasy, Sci-Fi" />
            </div>
            <div class="form-group">
              <label for="taleStatus" class="form-label">Status:</label>
              <select id="taleStatus" v-model="currentTale.status" class="form-select-field">
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label for="taleTags" class="form-label">Tags (comma-separated):</label>
            <input type="text" id="taleTags" v-model="tagsInput" class="form-input-field" placeholder="e.g., magic, adventure, space" />
          </div>
          <div class="form-group">
            <label for="taleCoverImageFile" class="form-label">Cover Image:</label>
            <input type="file" id="taleCoverImageFile" @change="handleCoverImageFileChange" class="form-file-upload" accept="image/*" />
            <div v-if="coverImagePreview" class="image-preview-container">
              <img :src="coverImagePreview" alt="Cover Preview" class="cover-image-preview" />
            </div>
            <small v-else-if="currentTale.coverImage" class="form-text-info">Current image: <a :href="currentTale.coverImage" target="_blank" class="link">{{ shortenAddress(currentTale.coverImage, 20) }}</a></small>
          </div>

          <div class="modal-action-buttons">
            <button type="button" @click="closeModal" class="btn btn-secondary">Cancel</button>
            <button type="submit" :disabled="isSavingTale" class="btn btn-success">
              {{ isSavingTale ? 'Saving...' : (editingTale ? 'Update Tale' : 'Create Tale') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <div class="tales-list-section">
      <h2 class="section-title-main">Published Tales</h2>
      <div v-if="isLoadingTales" class="loading-tales-indicator">
        <div class="spinner"></div>
        <p>Loading tales...</p>
      </div>
      <div v-else-if="tales.length === 0" class="info-box no-tales-message">
        No tales found. Be the first to create one if you're a creator!
      </div>
      <div v-else class="tales-grid-layout">
        <div v-for="tale in tales" :key="tale._id" class="tale-card-item">
          <img v-if="tale.coverImage" :src="tale.coverImage" @error="setDefaultImage" alt="Tale Cover" class="tale-card-image"/>
          <img v-else src="https://placehold.co/600x400/gray/white?text=No+Image" alt="Default Tale Cover" class="tale-card-image"/>
          <div class="tale-card-body">
            <h3 class="tale-card-title">{{ tale.title }}</h3>
            <p class="tale-card-meta">By: {{ tale.author?.name || shortenAddress(tale.authorWalletAddress) }}</p>
            <p class="tale-card-meta">Genre: {{ tale.genre }}</p>
            <p class="tale-card-description">{{ tale.content }}</p>
            <div class="tale-card-tags">
                <span v-for="tagItem in tale.tags" :key="tagItem" class="tag-item">{{ tagItem }}</span>
            </div>
            <button @click="viewTale(tale)" class="btn btn-info tale-card-button">Read More</button>
            <div v-if="appUser && (appUser.id === tale.author?._id || appUser.walletAddress === tale.authorWalletAddress || appUser.type === 'admin')" class="tale-card-actions">
              <button @click="editTale(tale)" class="btn btn-warning btn-xs">Edit</button>
              <button @click="confirmDeleteTale(tale._id)" class="btn btn-danger btn-xs">Delete</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="viewingTale" class="modal-overlay view-tale-modal">
      <div class="modal-content-container view-tale-modal-content">
        <h2 class="modal-main-title view-tale-title">{{ viewingTale.title }}</h2>
        <img v-if="viewingTale.coverImage" :src="viewingTale.coverImage" @error="setDefaultImage" alt="Tale Cover" class="view-tale-cover-image"/>
        <p class="view-tale-meta">By: {{ viewingTale.author?.name || shortenAddress(viewingTale.authorWalletAddress) }}</p>
        <p class="view-tale-meta">Genre: {{ viewingTale.genre }} | Status: {{ viewingTale.status }}</p>
        <div class="prose-styles view-tale-prose" v-html="renderMarkdown(viewingTale.content)"></div>
        <div v-if="viewingTale.tags && viewingTale.tags.length > 0" class="view-tale-tags">
            <span v-for="tagItem in viewingTale.tags" :key="tagItem" class="tag-item">{{ tagItem }}</span>
        </div>
        <button @click="viewingTale = null" class="btn btn-secondary view-tale-close-button">Close</button>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useWallet, WalletMultiButton } from 'solana-wallets-vue';
import axios from 'axios';
import { uploadFileToIPFS } from '../services/pinataService'; // Adjust path as needed
import { marked } from 'marked'; // For rendering Markdown content

// Configuration
const AUTH_API_BASE_URL = import.meta.env.VITE_APP_AUTH_API_URL || 'http://localhost:3000/api'; // Same backend for auth and tales
const TALES_API_BASE_URL = AUTH_API_BASE_URL; // Assuming tales are on the same backend
const JWT_TOKEN_KEY = 'readium_fun_jwt_token';

const wallet = useWallet();

// App User State (fetched from /auth/me)
const appUser = ref(null);
const isLoadingUser = ref(false);

// Tales State
const tales = ref([]);
const isLoadingTales = ref(false);
const showCreateModal = ref(false);
const editingTale = ref(null); // Tale object if editing, null otherwise
const viewingTale = ref(null); // Tale object for view modal
const isSavingTale = ref(false);

const defaultTale = () => ({
  title: '',
  content: '',
  genre: 'General',
  status: 'draft',
  coverImage: '',
  tags: [],
});
const currentTale = ref(defaultTale());
const tagsInput = ref(''); // For comma-separated tags input
const coverImageFile = ref(null);
const coverImagePreview = ref('');

// UI Message
const uiMessage = ref({ text: '', type: 'info' });
function showUiMessage(msg, type = 'info', duration = 4000) { /* ... (same as before) ... */
  uiMessage.value = { text: msg, type };
  if (duration > 0) {
    setTimeout(() => { uiMessage.value = { text: '', type: 'info' }; }, duration);
  }
}
const shortenAddress = (address, chars = 6) => { /* ... (same as before) ... */
  if (!address) return '';
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
};
const setDefaultImage = (event) => {
  event.target.src = 'https://placehold.co/600x400/gray/white?text=Image+Error';
};
const renderMarkdown = (markdownText) => {
    if (!markdownText) return '';
    return marked(markdownText);
};


// API Client for Tales (shares base URL with auth for this example)
const apiClient = axios.create({
  baseURL: TALES_API_BASE_URL, // e.g., http://localhost:5002/api
});

apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem(JWT_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  response => response.data, // Return data directly
  error => {
    console.error('API Error (Tales):', error.response || error.message || error);
    const message = error.response?.data?.message || error.message || 'An API error occurred.';
    showUiMessage(message, 'error');
    return Promise.reject(error.response?.data || { message });
  }
);

// --- User Fetching ---
async function fetchAppUser() {
  const token = localStorage.getItem(JWT_TOKEN_KEY);
  if (!token || !wallet.connected.value) {
    appUser.value = null;
    return;
  }
  isLoadingUser.value = true;
  try {
    // Use a separate axios instance for auth if its base URL is different
    // For this example, assuming auth is on the same backend as tales
    const authSpecificApiClient = axios.create({ baseURL: AUTH_API_BASE_URL });
    const response = await authSpecificApiClient.get('/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.data.success) {
      appUser.value = response.data.data;
    } else {
      appUser.value = null;
      localStorage.removeItem(JWT_TOKEN_KEY); // Token might be invalid
    }
  } catch (error) {
    console.error("Failed to fetch app user:", error);
    appUser.value = null;
    localStorage.removeItem(JWT_TOKEN_KEY);
  } finally {
    isLoadingUser.value = false;
  }
}


// --- Tale CRUD Functions ---
async function fetchTales() {
  isLoadingTales.value = true;
  try {
    const response = await apiClient.get('/tales'); // Fetches published by default from controller
    if (response.success) {
      tales.value = response.data;
    }
  } catch (error) {
    // Error already shown by interceptor
  } finally {
    isLoadingTales.value = false;
  }
}

function handleCoverImageFileChange(event) {
  const file = event.target.files[0];
  if (file) {
    coverImageFile.value = file;
    const reader = new FileReader();
    reader.onload = (e) => { coverImagePreview.value = e.target.result; };
    reader.readAsDataURL(file);
  } else {
    coverImageFile.value = null;
    coverImagePreview.value = '';
  }
}

async function handleSaveTale() {
  if (!appUser.value || (editingTale.value ? (appUser.value.id !== editingTale.value.author._id && appUser.value.type !== 'admin') : appUser.value.type !== 'creator')) {
    showUiMessage("You are not authorized to perform this action.", "error");
    return;
  }

  isSavingTale.value = true;
  let coverImageUrl = editingTale.value ? currentTale.value.coverImage : '';

  if (coverImageFile.value) {
    showUiMessage("Uploading cover image to Pinata...", "info", 0); // No timeout
    try {
      const uploadResult = await uploadFileToIPFS(coverImageFile.value); // From pinataService.js
      if (uploadResult.success) {
        coverImageUrl = uploadResult.imageUrl; // Use the public gateway URL
        showUiMessage("Cover image uploaded!", "success");
      } else {
        throw new Error(uploadResult.error || "Pinata upload failed");
      }
    } catch (uploadError) {
      showUiMessage(`Cover image upload failed: ${uploadError.message}`, "error");
      isSavingTale.value = false;
      return;
    }
  }

  const taleData = {
    ...currentTale.value,
    coverImage: coverImageUrl,
    tags: tagsInput.value.split(',').map(tag => tag.trim()).filter(tag => tag),
  };

  try {
    let response;
    if (editingTale.value) {
      response = await apiClient.put(`/tales/${editingTale.value._id}`, taleData);
      showUiMessage("Tale updated successfully!", "success");
    } else {
      response = await apiClient.post('/tales', taleData);
      showUiMessage("Tale created successfully!", "success");
    }
    if (response.success) {
      fetchTales(); // Refresh the list
      closeModal();
    }
  } catch (error) {
    // Error already shown by interceptor
  } finally {
    isSavingTale.value = false;
  }
}

function editTale(tale) {
  editingTale.value = { ...tale }; // Create a copy for editing
  currentTale.value = { // Populate form fields
    title: tale.title,
    content: tale.content,
    genre: tale.genre,
    status: tale.status,
    coverImage: tale.coverImage || '', // Ensure it's not null for v-model
    tags: tale.tags || [],
  };
  tagsInput.value = tale.tags ? tale.tags.join(', ') : '';
  coverImageFile.value = null;
  coverImagePreview.value = tale.coverImage || ''; // Show current image as preview
  showCreateModal.value = true;
}

async function confirmDeleteTale(taleId) {
  if (window.confirm("Are you sure you want to delete this tale? This action cannot be undone.")) {
    try {
      const response = await apiClient.delete(`/tales/${taleId}`);
      if (response.success) {
        showUiMessage("Tale deleted successfully.", "success");
        fetchTales(); // Refresh list
      }
    } catch (error) {
      // Error shown by interceptor
    }
  }
}

function viewTale(tale) {
    viewingTale.value = tale;
}

function closeModal() {
  showCreateModal.value = false;
  editingTale.value = null;
  currentTale.value = defaultTale();
  tagsInput.value = '';
  coverImageFile.value = null;
  coverImagePreview.value = '';
}

// Watch wallet connection to fetch user and tales
watch(() => wallet.connected.value, (isConnected) => {
  if (isConnected) {
    fetchAppUser().then(() => {
        if(appUser.value) fetchTales(); // Fetch tales only if user is resolved
    });
  } else {
    appUser.value = null; // Clear user if wallet disconnects
    tales.value = []; // Clear tales
    localStorage.removeItem(JWT_TOKEN_KEY); // Clear token on wallet disconnect
  }
}, { immediate: true }); // immediate true to run on component mount if wallet is already connected

onMounted(() => {
  if (wallet.connected.value) {
    fetchAppUser().then(() => {
        if(appUser.value) fetchTales();
    });
  } else {
    // User needs to connect wallet first
    showUiMessage("Please connect your wallet to manage or view tales.", "info");
  }
});

</script>

<style scoped>
/* Main Container */
.tales-manager-container {
  padding: 1rem; /* p-4 */
  max-width: 56rem; /* max-w-4xl */
  margin-left: auto;
  margin-right: auto;
  color: #1f2937; /* Default text */
}
.dark .tales-manager-container {
  color: #d1d5db; /* Default dark text */
}
@media (min-width: 768px) { /* md: */
  .tales-manager-container {
    padding: 1.5rem; /* md:p-6 */
  }
}

.page-main-title {
  font-size: 1.875rem; /* text-3xl */
  font-weight: 700; /* font-bold */
  margin-bottom: 2rem; /* mb-8 */
  text-align: center;
  color: #1f2937; /* text-gray-800 */
}
.dark .page-main-title {
  color: #ffffff; /* dark:text-white */
}

/* Wallet Connect Section */
.wallet-connect-section {
  margin-bottom: 1.5rem; /* mb-6 */
  padding: 1rem; /* p-4 */
  border: 1px solid #e5e7eb; /* border-gray-200 */
  border-radius: 0.375rem; /* rounded-md */
  text-align: center;
}
.dark .wallet-connect-section {
  border-color: #374151; /* dark:border-gray-700 */
}
.wallet-connect-section .section-heading { /* h2 */
  font-size: 1.25rem; /* text-xl */
  font-weight: 600; /* font-semibold */
  color: #374151; /* text-gray-700 */
  margin-bottom: 0.75rem; /* mb-3 */
}
.dark .wallet-connect-section .section-heading {
  color: #e5e7eb; /* dark:text-gray-200 */
}
.connected-wallet-display { /* Extends .info-box */
  margin-top: 0.75rem; /* mt-3 */
}
.wallet-address-mono {
  font-family: monospace;
  font-size: 0.875rem; /* text-sm */
}

/* User Welcome Banner */
.user-welcome-banner {
  margin-bottom: 1.5rem; /* mb-6 */
  padding: 1rem; /* p-4 */
  background-color: #e0e7ff; /* bg-indigo-50 */
  border-radius: 0.5rem; /* rounded-lg */
}
.dark .user-welcome-banner {
  background-color: rgba(79, 70, 229, 0.3); /* dark:bg-indigo-900/30 */
}
.user-welcome-banner p {
  font-size: 0.875rem; /* text-sm */
  color: #3730a3; /* text-indigo-700 */
}
.dark .user-welcome-banner p {
  color: #c7d2fe; /* dark:text-indigo-300 */
}
.user-name-display {
  font-weight: 600; /* font-semibold */
}
.create-tale-button {
  margin-top: 0.75rem; /* mt-3 */
  width: 100%;
}
@media (min-width: 640px) { /* sm: */
  .create-tale-button {
    width: auto; /* sm:w-auto */
  }
}

/* Login/Register Prompt */
.login-register-prompt {
  margin-bottom: 1.5rem; /* mb-6 */
  padding: 1rem; /* p-4 */
  background-color: #fefce8; /* bg-yellow-50 */
  border-radius: 0.5rem; /* rounded-lg */
  text-align: center;
}
.dark .login-register-prompt {
  background-color: rgba(133, 77, 14, 0.3); /* dark:bg-yellow-900/30 */
}
.login-register-prompt p {
  color: #a16207; /* text-yellow-700 */
}
.dark .login-register-prompt p {
  color: #fde047; /* dark:text-yellow-300 */
}
.auth-link {
  font-weight: 600; /* font-semibold */
  text-decoration: underline;
}
.auth-link:hover {
  color: #ca8a04; /* hover:text-yellow-500 */
}

/* Global UI Message */
.ui-message-global {
  margin-top: 1rem;
  margin-bottom: 1rem;
  padding: 0.75rem;
  border-radius: 0.375rem;
  text-align: center;
  font-size: 0.875rem;
}
/* Specific message types (info, success, error) would extend this */
.ui-message-info {
  background-color: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe;
}
.dark .ui-message-info {
  background-color: rgba(30, 58, 138, 0.3); color: #93c5fd; border-color: rgba(59, 130, 246, 0.5);
}
.ui-message-success {
  background-color: #f0fdf4; color: #166534; border: 1px solid #bbf7d0;
}
.dark .ui-message-success {
  background-color: rgba(22, 101, 52, 0.3); color: #86efac; border-color: rgba(34, 197, 94, 0.5);
}
.ui-message-error {
  background-color: #fef2f2; color: #b91c1c; border: 1px solid #fecaca;
}
.dark .ui-message-error {
  background-color: rgba(153, 27, 27, 0.3); color: #fca5a5; border-color: rgba(220, 38, 38, 0.5);
}


/* Modal Styles */
.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  z-index: 50;
}
.modal-content-container {
  background-color: #ffffff;
  padding: 1.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05);
  width: 100%;
  max-width: 36rem; /* max-w-lg */
  max-height: 90vh;
  overflow-y: auto;
}
.dark .modal-content-container {
  background-color: #1f2937; /* dark:bg-gray-800 */
}
.modal-main-title {
  font-size: 1.5rem; /* text-2xl */
  font-weight: 700; /* font-bold */
  margin-bottom: 1.5rem; /* mb-6 */
  color: #1f2937; /* text-gray-800 */
}
.dark .modal-main-title {
  color: #ffffff; /* dark:text-white */
}
.modal-form-layout > div:not(:last-child) { /* space-y-4 approx */
    margin-bottom: 1rem;
}

/* Form Elements (reusable, consider global) */
.form-label {
  display: block; font-size: 0.875rem; font-weight: 500; color: #374151; margin-bottom: 0.25rem;
}
.dark .form-label { color: #d1d5db; }

.form-input-field, .form-select-field, .form-textarea-field {
  margin-top: 0.25rem; display: block; width: 100%; border-radius: 0.375rem;
  border: 1px solid #d1d5db; box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05);
  padding: 0.5rem 0.75rem; font-size: 0.875rem;
  background-color: #ffffff; color: #111827;
}
.form-input-field:focus, .form-select-field:focus, .form-textarea-field:focus {
  border-color: #4f46e5; box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.5); outline: none;
}
.dark .form-input-field, .dark .form-select-field, .dark .form-textarea-field {
  border-color: #4b5568; background-color: #374151; color: #f3f4f6;
}
.form-textarea-field { min-height: 12rem; /* h-48 */ }

.form-grid-halves { display: grid; gap: 1rem; }
@media (min-width: 768px) { /* md: */
  .form-grid-halves { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

.form-file-upload {
  margin-top: 0.25rem; display: block; width: 100%; font-size: 0.875rem; color: #6b7280;
}
.dark .form-file-upload { color: #9ca3af; }
.form-file-upload::file-selector-button {
  margin-right: 1rem; padding: 0.5rem 1rem; border-radius: 0.375rem; border-width: 0;
  font-size: 0.875rem; font-weight: 600; background-color: #e0e7ff; color: #4338ca; cursor: pointer;
}
.form-file-upload:hover::file-selector-button { background-color: #c7d2fe; }
.dark .form-file-upload::file-selector-button { background-color: #3730a3; color: #c7d2fe; }
.dark .form-file-upload:hover::file-selector-button { background-color: #4338ca; }

.image-preview-container { margin-top: 0.5rem; }
.cover-image-preview {
  max-width: 150px; max-height: 150px; border: 1px solid #d1d5db; border-radius: 0.25rem; object-fit: contain;
}
.dark .cover-image-preview { border-color: #4b5568; }
.form-text-info { font-size: 0.75rem; color: #6b7280; margin-top: 0.25rem; }
.dark .form-text-info { color: #9ca3af; }

.modal-action-buttons {
  display: flex; justify-content: flex-end; column-gap: 0.75rem; margin-top: 1.5rem;
}

/* Tales List Section */
.tales-list-section { margin-top: 2.5rem; /* mt-10 */ }
.section-title-main { /* h2 */
  font-size: 1.5rem; font-weight: 600; margin-bottom: 1rem; color: #374151;
}
.dark .section-title-main { color: #e5e7eb; }

.loading-tales-indicator { text-align: center; padding: 1.5rem; }
.loading-tales-indicator p { margin-top: 0.5rem; color: #4b5563; }
.dark .loading-tales-indicator p { color: #d1d5db; }

.no-tales-message { text-align: center; } /* Extends .info-box */

.tales-grid-layout {
  display: grid; grid-template-columns: repeat(1, minmax(0, 1fr)); gap: 1.5rem;
}
@media (min-width: 768px) { /* md: */
  .tales-grid-layout { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (min-width: 1024px) { /* lg: */
  .tales-grid-layout { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}

/* Tale Card Item */
.tale-card-item {
  background-color: #ffffff; border-radius: 0.5rem;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06); /* shadow-lg */
  overflow: hidden; display: flex; flex-direction: column;
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
}
.dark .tale-card-item { background-color: #1f2937; }
.tale-card-item:hover {
  transform: translateY(-0.25rem);
  box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04); /* shadow-2xl */
}
.tale-card-image { width: 100%; height: 12rem; object-fit: cover; }
.tale-card-body { padding: 1rem; display: flex; flex-direction: column; flex-grow: 1; }
.tale-card-title {
  font-size: 1.25rem; font-weight: 600; margin-bottom: 0.5rem; color: #1f2937;
}
.dark .tale-card-title { color: #f9fafb; }
.tale-card-meta { font-size: 0.875rem; color: #6b7280; margin-bottom: 0.25rem; }
.dark .tale-card-meta { color: #9ca3af; }
.tale-card-description {
  color: #374151; font-size: 0.875rem; margin-bottom: 0.75rem; flex-grow: 1;
  /* line-clamp-3 */
  overflow: hidden; text-overflow: ellipsis; display: -webkit-box;
  -webkit-line-clamp: 3; -webkit-box-orient: vertical;
  line-height: 1.4; max-height: calc(1.4em * 3);
}
.dark .tale-card-description { color: #d1d5db; }
.tale-card-tags { margin-bottom: 0.75rem; }
.tag-item {
  display: inline-block; background-color: #e5e7eb; border-radius: 9999px;
  padding: 0.25rem 0.75rem; font-size: 0.75rem; font-weight: 600;
  color: #374151; margin-right: 0.5rem; margin-bottom: 0.5rem;
}
.dark .tag-item { background-color: #374151; color: #e5e7eb; }
.tale-card-button { margin-top: auto; width: 100%; margin-bottom: 0.5rem; }
.tale-card-actions {
  margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px solid #e5e7eb;
  display: flex; justify-content: flex-end; column-gap: 0.5rem;
}
.dark .tale-card-actions { border-color: #374151; }

/* View Tale Modal */
.view-tale-modal-content { max-width: 42rem; /* max-w-2xl */ }
.view-tale-title { font-size: 1.875rem; /* text-3xl */ }
.view-tale-cover-image {
  width: 100%; height: 16rem; /* h-64 */ object-fit: cover;
  border-radius: 0.375rem; margin-bottom: 1rem;
}
.view-tale-meta { font-size: 0.875rem; color: #6b7280; margin-bottom: 0.25rem; }
.view-tale-meta:last-of-type { margin-bottom: 0.75rem; }
.dark .view-tale-meta { color: #9ca3af; }
.view-tale-prose { max-width: none; margin-bottom: 1rem; }
.view-tale-tags { margin-bottom: 1rem; }
.view-tale-close-button { margin-top: 1.5rem; width: 100%; }


/* Reusable Info/Error/Success Box Styles */
.info-box {
  padding: 0.75rem; background-color: #f9fafb; border-radius: 0.375rem;
  border: 1px solid #e5e7eb; font-size: 0.875rem; color: #374151;
}
.dark .info-box {
  background-color: rgba(55, 65, 81, 0.5); border-color: #4b5568; color: #e5e7eb;
}
/* .error-box, .success-box would be similar, defined in global or here if specific */

/* Spinner (reusable) */
.spinner {
  display: inline-block; width: 2rem; height: 2rem; border-width: 4px;
  border-top-color: #4f46e5; border-right-color: transparent;
  border-bottom-color: transparent; border-left-color: transparent;
  border-radius: 9999px; animation: spin 1s linear infinite;
}
.dark .spinner { border-top-color: #818cf8; }
@keyframes spin { to { transform: rotate(360deg); } }

/* General Button Styles (reusable, ideally global) */
.btn {
  padding: 0.5rem 1rem; border: 1px solid transparent; border-radius: 0.375rem;
  box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05); font-size: 0.875rem; font-weight: 500;
  color: #ffffff; cursor: pointer; transition: background-color 0.15s ease-in-out;
}
.btn:focus { outline: 2px solid transparent; outline-offset: 2px; }
.btn:disabled { cursor: not-allowed; opacity: 0.7; }

.btn-primary { background-color: #4f46e5; }
.btn-primary:hover { background-color: #4338ca; }
.dark .btn-primary { background-color: #6366f1; }
.dark .btn-primary:hover { background-color: #818cf8; }
.dark .btn-primary:disabled { background-color: #3730a3; opacity:0.5; }

.btn-secondary { background-color: #6b7280; }
.btn-secondary:hover { background-color: #4b5563; }
.dark .btn-secondary { background-color: #4b5568; }
.dark .btn-secondary:hover { background-color: #374151; }

.btn-success { background-color: #16a34a; }
.btn-success:hover { background-color: #15803d; }
.dark .btn-success { background-color: #22c55e; }
.dark .btn-success:hover { background-color: #16a34a; }

.btn-danger { background-color: #dc2626; }
.btn-danger:hover { background-color: #b91c1c; }
.dark .btn-danger { background-color: #ef4444; }
.dark .btn-danger:hover { background-color: #f87171; }

.btn-warning { background-color: #f59e0b; color: #ffffff; }
.btn-warning:hover { background-color: #d97706; }
.dark .btn-warning { background-color: #f59e0b; }
.dark .btn-warning:hover { background-color: #fbbf24; }

.btn-info { background-color: #3b82f6; }
.btn-info:hover { background-color: #2563eb; }
.dark .btn-info { background-color: #3b82f6; }
.dark .btn-info:hover { background-color: #60a5fa; }

.btn-sm { padding: 0.375rem 0.75rem; font-size: 0.75rem; }
.btn-xs { padding: 0.25rem 0.625rem; font-size: 0.75rem; }

.link { color: #4f46e5; text-decoration: underline; }
.link:hover { color: #4338ca; }
.dark .link { color: #818cf8; }
.dark .link:hover { color: #a78bfa; }

/* Prose styles for markdown content */
.prose-styles :deep(h1), .prose-styles :deep(h2), .prose-styles :deep(h3), .prose-styles :deep(h4) {
  margin-bottom: 0.75rem; margin-top: 1.25rem; font-weight: 600; color: #1f2937;
}
.dark .prose-styles :deep(h1), .dark .prose-styles :deep(h2), .dark .prose-styles :deep(h3), .dark .prose-styles :deep(h4) {
  color: #f9fafb;
}
.prose-styles :deep(p) {
  margin-bottom: 1rem; line-height: 1.625; color: #374151;
}
.dark .prose-styles :deep(p) {
  color: #d1d5db;
}
.prose-styles :deep(ul), .prose-styles :deep(ol) {
  margin-left: 1.5rem; margin-bottom: 1rem; list-style-type: disc;
}
.dark .prose-styles :deep(ul), .dark .prose-styles :deep(ol) {
  color: #d1d5db;
}
.prose-styles :deep(li) {
  margin-bottom: 0.25rem;
}
.prose-styles :deep(a) {
  color: #4f46e5; text-decoration: underline;
}
.prose-styles :deep(a):hover {
  color: #4338ca;
}
.dark .prose-styles :deep(a) {
  color: #818cf8;
}
.dark .prose-styles :deep(a):hover {
  color: #a78bfa;
}
.prose-styles :deep(blockquote) {
  border-left-width: 4px; border-color: #d1d5db; padding-left: 1rem; font-style: italic; color: #4b5563; margin-top: 1.25rem; margin-bottom: 1.25rem;
}
.dark .prose-styles :deep(blockquote) {
  border-color: #4b5568; color: #9ca3af;
}
.prose-styles :deep(pre) {
  background-color: #f3f4f6; padding: 1rem; border-radius: 0.375rem; overflow-x: auto; font-size: 0.875rem; margin-top: 1.25rem; margin-bottom: 1.25rem;
}
.dark .prose-styles :deep(pre) {
  background-color: #1f2937;
}
.prose-styles :deep(code) { /* Inline code */
  background-color: #e5e7eb; padding-left: 0.25rem; padding-right: 0.25rem; padding-top: 0.125rem; padding-bottom: 0.125rem; border-radius: 0.25rem; font-size: 0.875rem;
}
.dark .prose-styles :deep(code) {
  background-color: #374151; color: #e5e7eb;
}
.prose-styles :deep(pre) :deep(code) { /* Code within pre blocks */
  background-color: transparent; padding: 0; border-radius: 0;
}

</style>