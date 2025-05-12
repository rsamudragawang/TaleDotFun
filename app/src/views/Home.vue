<template>
  <div class="home-view p-4 md:p-6 max-w-5xl mx-auto">
    <header class="mb-8 text-center">
      <h1 class="text-4xl font-bold text-gray-800 dark:text-white">Welcome to Readium Fun!</h1>
      <p class="text-lg text-gray-600 dark:text-gray-400 mt-2">Discover, create, and collect amazing tales.</p>
    </header>

    <div class="mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-md text-center">
      <h2 class="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-3">Wallet Connection</h2>
      <WalletMultiButton />
      <div v-if="wallet.connected.value && wallet.publicKey.value" class="info-box mt-3">
        Connected: <span class="font-mono text-sm">{{ shortenAddress(wallet.publicKey.value.toBase58()) }}</span>
      </div>
    </div>

    <div class="mb-8 text-center" v-if="!appUser && !isLoadingUser">
      <router-link :to="{ name: 'Auth' }" class="btn btn-primary text-lg px-6 py-3">
        Login / Register to Create & Manage Tales
      </router-link>
    </div>
     <div v-if="appUser" class="mb-6 p-4 bg-green-50 dark:bg-green-900/30 rounded-lg text-center">
      <p class="text-green-700 dark:text-green-300">
        Welcome back, <span class="font-semibold">{{ appUser.name }}</span>!
        <span v-if="appUser.type === 'creator'">
            <router-link :to="{ name: 'Tales' }" class="font-semibold underline hover:text-green-500 ml-2">Manage Your Tales</router-link>
        </span>
      </p>
    </div>

    <section class="tales-list mt-10">
      <h2 class="text-2xl font-semibold mb-6 text-gray-700 dark:text-gray-200">Explore Published Tales</h2>
      <div v-if="isLoadingTales" class="text-center p-6">
        <div class="spinner"></div>
        <p class="mt-2 text-gray-600 dark:text-gray-300">Loading tales...</p>
      </div>
      <div v-else-if="tales.length === 0" class="info-box text-center">
        No tales have been published yet.
      </div>
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div v-for="tale in tales" :key="tale._id" class="tale-card bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden flex flex-col">
          <img v-if="tale.coverImage" :src="tale.coverImage" @error="setDefaultImage" alt="Tale Cover" class="w-full h-48 object-cover"/>
          <img v-else src="https://placehold.co/600x400/gray/white?text=No+Image" alt="Default Tale Cover" class="w-full h-48 object-cover"/>
          <div class="p-4 flex flex-col flex-grow">
            <h3 class="text-xl font-semibold mb-2 text-gray-800 dark:text-white">{{ tale.title }}</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">By: {{ tale.author?.name || shortenAddress(tale.authorWalletAddress) }}</p>
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-2">Genre: {{ tale.genre }}</p>
            <div class="mb-3">
                <span v-for="tag in tale.tags" :key="tag" class="tag">{{ tag }}</span>
            </div>
            <button @click="openPreviewModal(tale)" class="btn btn-info btn-sm mt-auto w-full">
              Read More
            </button>
          </div>
        </div>
      </div>
    </section>

    <div v-if="viewingTale" class="modal-overlay">
      <div class="modal-content dark:bg-gray-800 max-w-2xl">
        <h2 class="text-3xl font-bold mb-4 text-gray-800 dark:text-white">{{ viewingTale.title }}</h2>
        <img v-if="viewingTale.coverImage" :src="viewingTale.coverImage" @error="setDefaultImage" alt="Tale Cover" class="w-full h-64 object-cover rounded-md mb-4"/>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">By: {{ viewingTale.author?.name || shortenAddress(viewingTale.authorWalletAddress) }}</p>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-3">Genre: {{ viewingTale.genre }} | Status: {{ viewingTale.status }}</p>
        <div class="prose dark:prose-invert max-w-none mb-4 line-clamp-5" v-html="renderMarkdown(viewingTale.content)"></div>
         <div v-if="viewingTale.tags && viewingTale.tags.length > 0" class="mb-4">
            <span v-for="tag in viewingTale.tags" :key="tag" class="tag">{{ tag }}</span>
        </div>
        <button @click="navigateToTaleDetailAndCloseModal(viewingTale._id)" class="btn btn-primary w-full mb-2">
          View Full Tale & Episodes
        </button>
        <button @click="viewingTale = null" class="btn btn-secondary w-full">Close Preview</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useWallet, WalletMultiButton } from 'solana-wallets-vue';
import axios from 'axios';
import { marked } from 'marked';

const AUTH_API_BASE_URL = import.meta.env.VITE_APP_AUTH_API_URL || 'http://localhost:3000/api';
const TALES_API_BASE_URL = AUTH_API_BASE_URL;
const JWT_TOKEN_KEY = 'readium_fun_jwt_token';

const router = useRouter();
const wallet = useWallet();

const appUser = ref(null);
const isLoadingUser = ref(false);
const tales = ref([]);
const isLoadingTales = ref(false);
const viewingTale = ref(null); // This will hold the tale object for the modal

const uiMessage = ref({ text: '', type: 'info' }); // Make sure uiMessage is defined

function showUiMessage(msg, type = 'info', duration = 4000) {
  uiMessage.value = { text: msg, type };
  if (duration > 0) {
    setTimeout(() => { uiMessage.value = { text: '', type: 'info' }; }, duration);
  }
}

const shortenAddress = (address, chars = 6) => {
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

const apiClient = axios.create({
  baseURL: TALES_API_BASE_URL,
});
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem(JWT_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
apiClient.interceptors.response.use(
  response => response.data,
  error => {
    console.error('API Error (Home View):', error.response?.data?.message || error.message || error);
    showUiMessage(error.response?.data?.message || error.message || 'An API error occurred.', 'error');
    return Promise.reject(error.response?.data || { message: 'An API error occurred.' });
  }
);

async function fetchAppUser() {
  const token = localStorage.getItem(JWT_TOKEN_KEY);
  if (!token) {
    appUser.value = null;
    return;
  }
  isLoadingUser.value = true;
  try {
    const authSpecificApiClient = axios.create({ baseURL: AUTH_API_BASE_URL });
    const response = await authSpecificApiClient.get('/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.data.success) {
      appUser.value = response.data.data;
    } else {
      appUser.value = null;
    }
  } catch (error) {
    console.error("Failed to fetch app user:", error);
    appUser.value = null;
  } finally {
    isLoadingUser.value = false;
  }
}

async function fetchPublishedTales() {
  isLoadingTales.value = true;
  try {
    const response = await apiClient.get('/tales'); // Assumes this endpoint returns published tales
    if (response.success) {
      tales.value = response.data;
    }
  } catch (error) {
    // Error handled by interceptor
  } finally {
    isLoadingTales.value = false;
  }
}

// Renamed function to clarify it opens the modal
function openPreviewModal(tale) {
  viewingTale.value = tale; // Set the tale for the modal
}

// Function to navigate to the full detail page
function navigateToTaleDetailAndCloseModal(taleId) {
  viewingTale.value = null; // Close the modal
  router.push({ name: 'TaleDetail', params: { id: taleId } });
}

watch(() => wallet.publicKey.value, (newVal, oldVal) => {
    fetchAppUser();
}, { immediate: true });

onMounted(() => {
  fetchAppUser();
  fetchPublishedTales();
});

</script>

<style scoped>
/* Styles remain the same, but ensure your .line-clamp-X works or use Tailwind's plugin */
.form-label { @apply block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1; }
.form-input, .form-select, .form-textarea { @apply mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100; }
.form-file-input { @apply mt-1 block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 dark:file:bg-indigo-800 file:text-indigo-700 dark:file:text-indigo-300 hover:file:bg-indigo-100 dark:hover:file:bg-indigo-700; }
.form-text { @apply text-xs text-gray-500 dark:text-gray-400 mt-1; }

.btn { @apply px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed; }
.btn-primary { @apply bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400 disabled:bg-indigo-300 dark:disabled:bg-indigo-700; }
.btn-secondary { @apply bg-gray-500 hover:bg-gray-600 focus:ring-gray-500 dark:bg-gray-600 dark:hover:bg-gray-500 disabled:bg-gray-300 dark:disabled:bg-gray-700; }
.btn-info { @apply bg-blue-500 hover:bg-blue-600 focus:ring-blue-500 dark:bg-blue-500 dark:hover:bg-blue-400 text-white disabled:bg-blue-300 dark:disabled:bg-blue-700; }
.btn-sm { @apply px-3 py-1.5 text-xs; }

.info-box { @apply p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md border border-gray-200 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-200; }
.link { @apply text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 underline; }

.modal-overlay { @apply fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50; }
.modal-content { @apply bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto; }

.tale-card { transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out; }
.tale-card:hover { @apply transform -translate-y-1 shadow-2xl; }
/* For text truncation in preview modal */
.line-clamp-5 {
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 5; /* number of lines to show */
  -webkit-box-orient: vertical;
}
.tag { @apply inline-block bg-gray-200 dark:bg-gray-700 rounded-full px-3 py-1 text-xs font-semibold text-gray-700 dark:text-gray-200 mr-2 mb-2; }
.spinner { @apply inline-block w-8 h-8 border-4 border-t-indigo-600 dark:border-t-indigo-400 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin; }

.prose :deep(h1), .prose :deep(h2), .prose :deep(h3) { @apply mb-2 mt-4 font-semibold; }
.prose :deep(p) { @apply mb-3 leading-relaxed; }
.prose :deep(ul), .prose :deep(ol) { @apply ml-5 mb-3; }
.prose :deep(li) { @apply mb-1; }
.prose :deep(a) { @apply text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300; }
.prose :deep(blockquote) { @apply border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic text-gray-600 dark:text-gray-400 my-4; }
.prose :deep(pre) { @apply bg-gray-100 dark:bg-gray-900 p-3 rounded-md overflow-x-auto text-sm; }
.prose :deep(code) { @apply bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-sm; }
.prose :deep(pre) :deep(code) { @apply bg-transparent p-0 rounded-none; }
</style>