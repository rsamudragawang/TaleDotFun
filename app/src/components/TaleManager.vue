<template>
  <div class="tales-manager p-4 md:p-6 max-w-4xl mx-auto">
    <h1 class="text-3xl font-bold mb-8 text-center text-gray-800 dark:text-white">Tales of Readium</h1>

    <div class="mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-md text-center">
      <h2 class="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-3">Wallet</h2>
      <WalletMultiButton />
      <div v-if="wallet.connected.value && wallet.publicKey.value" class="info-box mt-3">
        Connected: <span class="font-mono text-sm">{{ shortenAddress(wallet.publicKey.value.toBase58()) }}</span>
      </div>
    </div>

    <div v-if="wallet.connected.value && appUser" class="mb-6 p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
      <p class="text-sm text-indigo-700 dark:text-indigo-300">Welcome, <span class="font-semibold">{{ appUser.name }}</span> ({{ appUser.type }})!</p>
      <button
        v-if="appUser.type === 'creator'"
        @click="showCreateModal = true"
        class="btn btn-primary mt-3 w-full sm:w-auto"
      >
        + Create New Tale
      </button>
    </div>
     <div v-else-if="wallet.connected.value && !appUser && !isLoadingUser" class="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg text-center">
        <p class="text-yellow-700 dark:text-yellow-300">Please <router-link :to="{name: 'Auth'}" class="font-semibold underline hover:text-yellow-500">Login/Register</router-link> to manage tales.</p>
    </div>


    <div v-if="showCreateModal || editingTale" class="modal-overlay">
      <div class="modal-content dark:bg-gray-800">
        <h2 class="text-2xl font-bold mb-6 text-gray-800 dark:text-white">{{ editingTale ? 'Edit Tale' : 'Create New Tale' }}</h2>
        <form @submit.prevent="handleSaveTale" class="space-y-4">
          <div>
            <label for="taleTitle" class="form-label">Title:</label>
            <input type="text" id="taleTitle" v-model="currentTale.title" class="form-input" required />
          </div>
          <div>
            <label for="taleContent" class="form-label">Content (Markdown supported):</label>
            <textarea id="taleContent" v-model="currentTale.content" class="form-textarea h-48" required></textarea>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label for="taleGenre" class="form-label">Genre:</label>
              <input type="text" id="taleGenre" v-model="currentTale.genre" class="form-input" placeholder="e.g., Fantasy, Sci-Fi" />
            </div>
            <div>
              <label for="taleStatus" class="form-label">Status:</label>
              <select id="taleStatus" v-model="currentTale.status" class="form-select">
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>
          <div>
            <label for="taleTags" class="form-label">Tags (comma-separated):</label>
            <input type="text" id="taleTags" v-model="tagsInput" class="form-input" placeholder="e.g., magic, adventure, space" />
          </div>
          <div>
            <label for="taleCoverImageFile" class="form-label">Cover Image:</label>
            <input type="file" id="taleCoverImageFile" @change="handleCoverImageFileChange" class="form-file-input" accept="image/*" />
            <div v-if="coverImagePreview" class="mt-2">
              <img :src="coverImagePreview" alt="Cover Preview" class="image-preview" />
            </div>
            <small v-else-if="currentTale.coverImage" class="form-text">Current image: <a :href="currentTale.coverImage" target="_blank" class="link">{{ shortenAddress(currentTale.coverImage, 20) }}</a></small>
          </div>

          <div class="flex justify-end space-x-3 mt-6">
            <button type="button" @click="closeModal" class="btn btn-secondary">Cancel</button>
            <button type="submit" :disabled="isSavingTale" class="btn btn-success">
              {{ isSavingTale ? 'Saving...' : (editingTale ? 'Update Tale' : 'Create Tale') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <div class="mt-10">
      <h2 class="text-2xl font-semibold mb-4 text-gray-700 dark:text-gray-200">Published Tales</h2>
      <div v-if="isLoadingTales" class="text-center p-6">
        <div class="spinner"></div>
        <p class="mt-2 text-gray-600 dark:text-gray-300">Loading tales...</p>
      </div>
      <div v-else-if="tales.length === 0" class="info-box text-center">
        No tales found. Be the first to create one if you're a creator!
      </div>
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div v-for="tale in tales" :key="tale._id" class="tale-card bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden flex flex-col">
          <img v-if="tale.coverImage" :src="tale.coverImage" @error="setDefaultImage" alt="Tale Cover" class="w-full h-48 object-cover"/>
          <img v-else src="https://placehold.co/600x400/gray/white?text=No+Image" alt="Default Tale Cover" class="w-full h-48 object-cover"/>
          <div class="p-4 flex flex-col flex-grow">
            <h3 class="text-xl font-semibold mb-2 text-gray-800 dark:text-white">{{ tale.title }}</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">By: {{ tale.author?.name || shortenAddress(tale.authorWalletAddress) }}</p>
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-2">Genre: {{ tale.genre }}</p>
            <p class="text-gray-700 dark:text-gray-300 text-sm mb-3 line-clamp-3 flex-grow">{{ tale.content }}</p>
            <div class="mb-3">
                <span v-for="tag in tale.tags" :key="tag" class="tag">{{ tag }}</span>
            </div>
            <button @click="viewTale(tale)" class="btn btn-info btn-sm mt-auto w-full mb-2">Read More</button>
            <div v-if="appUser && (appUser.id === tale.author?._id || appUser.walletAddress === tale.authorWalletAddress || appUser.type === 'admin')" class="mt-2 pt-2 border-t dark:border-gray-700 flex justify-end space-x-2">
              <button @click="editTale(tale)" class="btn btn-warning btn-xs">Edit</button>
              <button @click="confirmDeleteTale(tale._id)" class="btn btn-danger btn-xs">Delete</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="viewingTale" class="modal-overlay">
      <div class="modal-content dark:bg-gray-800 max-w-2xl">
        <h2 class="text-3xl font-bold mb-4 text-gray-800 dark:text-white">{{ viewingTale.title }}</h2>
        <img v-if="viewingTale.coverImage" :src="viewingTale.coverImage" @error="setDefaultImage" alt="Tale Cover" class="w-full h-64 object-cover rounded-md mb-4"/>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">By: {{ viewingTale.author?.name || shortenAddress(viewingTale.authorWalletAddress) }}</p>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-3">Genre: {{ viewingTale.genre }} | Status: {{ viewingTale.status }}</p>
        <div class="prose dark:prose-invert max-w-none mb-4" v-html="renderMarkdown(viewingTale.content)"></div>
        <div v-if="viewingTale.tags && viewingTale.tags.length > 0" class="mb-4">
            <span v-for="tag in viewingTale.tags" :key="tag" class="tag">{{ tag }}</span>
        </div>
        <button @click="viewingTale = null" class="btn btn-secondary mt-6 w-full">Close</button>
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
/* Using Tailwind utility classes directly in the template. Add component-specific overrides here if needed. */
.form-label { @apply block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1; }
.form-input, .form-select, .form-textarea { @apply mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100; }
.form-file-input { @apply mt-1 block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 dark:file:bg-indigo-800 file:text-indigo-700 dark:file:text-indigo-300 hover:file:bg-indigo-100 dark:hover:file:bg-indigo-700; }
.form-text { @apply text-xs text-gray-500 dark:text-gray-400 mt-1; }

.btn { @apply px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed; }
.btn-primary { @apply bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400 disabled:bg-indigo-300 dark:disabled:bg-indigo-700; }
.btn-secondary { @apply bg-gray-500 hover:bg-gray-600 focus:ring-gray-500 dark:bg-gray-600 dark:hover:bg-gray-500 disabled:bg-gray-300 dark:disabled:bg-gray-700; }
.btn-success { @apply bg-green-600 hover:bg-green-700 focus:ring-green-500 dark:bg-green-500 dark:hover:bg-green-400 disabled:bg-green-300 dark:disabled:bg-green-700; }
.btn-danger { @apply bg-red-600 hover:bg-red-700 focus:ring-red-500 dark:bg-red-500 dark:hover:bg-red-400 disabled:bg-red-300 dark:disabled:bg-red-700; }
.btn-warning { @apply bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-500 dark:bg-yellow-500 dark:hover:bg-yellow-400 text-white disabled:bg-yellow-300 dark:disabled:bg-yellow-700; }
.btn-info { @apply bg-blue-500 hover:bg-blue-600 focus:ring-blue-500 dark:bg-blue-500 dark:hover:bg-blue-400 text-white disabled:bg-blue-300 dark:disabled:bg-blue-700; }
.btn-sm { @apply px-3 py-1.5 text-xs; }
.btn-xs { @apply px-2.5 py-1 text-xs; }


.info-box { @apply p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md border border-gray-200 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-200; }
.error-box { @apply p-3 bg-red-50 dark:bg-red-700/30 text-red-700 dark:text-red-300 rounded-md border border-red-200 dark:border-red-500/50 text-sm; }
.success-box { @apply p-3 bg-green-50 dark:bg-green-700/30 text-green-700 dark:text-green-300 rounded-md border border-green-200 dark:border-green-500/50 text-sm; }
.link { @apply text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 underline; }

.modal-overlay { @apply fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50; }
.modal-content { @apply bg-white p-6 rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto; }

.image-preview { @apply max-w-[150px] max-h-[150px] mt-2 border border-gray-300 dark:border-gray-600 rounded object-contain; }
.tale-card { transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out; }
.tale-card:hover { @apply transform -translate-y-1 shadow-2xl; }
.line-clamp-3 { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.tag { @apply inline-block bg-gray-200 dark:bg-gray-700 rounded-full px-3 py-1 text-xs font-semibold text-gray-700 dark:text-gray-200 mr-2 mb-2; }

.spinner { @apply inline-block w-8 h-8 border-4 border-t-indigo-600 dark:border-t-indigo-400 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin; }

/* For Markdown content in view modal */
.prose :deep(h1), .prose :deep(h2), .prose :deep(h3) { @apply mb-2 mt-4 font-semibold; }
.prose :deep(p) { @apply mb-3 leading-relaxed; }
.prose :deep(ul), .prose :deep(ol) { @apply ml-5 mb-3; }
.prose :deep(li) { @apply mb-1; }
.prose :deep(a) { @apply text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300; }
.prose :deep(blockquote) { @apply border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic text-gray-600 dark:text-gray-400 my-4; }
.prose :deep(pre) { @apply bg-gray-100 dark:bg-gray-900 p-3 rounded-md overflow-x-auto text-sm; }
.prose :deep(code) { @apply bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-sm; }
.prose :deep(pre) :deep(code) { @apply bg-transparent p-0 rounded-none; } /* Reset for code within pre */

</style>
