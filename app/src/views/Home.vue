<template>
  <div class="home-view">
    <header class="home-header">
      <h1 class="main-title">Welcome to Readium Fun!</h1>
      <p class="subtitle">Discover, create, and collect amazing tales.</p>
    </header>

    <!-- <div class="wallet-connection-section">
      <h2 class="section-title">Wallet Connection</h2>
      <WalletMultiButton />
      <div v-if="wallet.connected.value && wallet.publicKey.value" class="info-box connected-wallet-info">
        Connected: <span class="wallet-address">{{ shortenAddress(wallet.publicKey.value.toBase58()) }}</span>
      </div>
    </div> -->

    <div class="auth-prompt-section" v-if="!appUser && !isLoadingUser">
      <router-link :to="{ name: 'Auth' }" class="btn btn-primary auth-button">
        Login / Register to Create & Manage Tales
      </router-link>
    </div>
     <div v-if="appUser" class="welcome-user-section">
      <p>
        Welcome back, <span class="user-name">{{ appUser.name }}</span>!
        <span v-if="appUser.type === 'creator'">
            <router-link :to="{ name: 'Tales' }" class="link manage-tales-link">Manage Your Tales</router-link>
        </span>
      </p>
    </div>

    <div v-if="uiMessage.text"
         :class="['ui-message', `ui-message-${uiMessage.type}`]">
      {{ uiMessage.text }}
    </div>

    <section class="tales-list-section">
      <h2 class="section-title">Explore Published Tales</h2>
      <div v-if="isLoadingTales" class="loading-indicator">
        <div class="spinner"></div>
        <p>Loading tales...</p>
      </div>
      <div v-else-if="tales.length === 0" class="info-box no-tales-info">
        No tales have been published yet.
      </div>
      <div v-else class="tales-grid">
        <div v-for="tale in tales" :key="tale._id" class="tale-card">
          <img v-if="tale.coverImage" :src="tale.coverImage" @error="setDefaultImage" alt="Tale Cover" class="tale-cover-image"/>
          <img v-else src="https://placehold.co/600x400/gray/white?text=No+Image" alt="Default Tale Cover" class="tale-cover-image"/>
          <div class="tale-card-content">
            <h3 class="tale-title">{{ tale.title }}</h3>
            <p class="tale-meta">By: {{ tale.author?.name || shortenAddress(tale.authorWalletAddress) }}</p>
            <p class="tale-meta">Genre: {{ tale.genre }}</p>
            <div class="tale-tags">
                <span v-for="tagItem in tale.tags" :key="tagItem" class="tag">{{ tagItem }}</span>
            </div>
            <button @click="openPreviewModal(tale)" class="btn btn-info read-more-button">
              Read More
            </button>
          </div>
        </div>
      </div>
    </section>

    <div v-if="viewingTale" class="modal-overlay">
      <div class="modal-content">
        <h2 class="modal-title">{{ viewingTale.title }}</h2>
        <img v-if="viewingTale.coverImage" :src="viewingTale.coverImage" @error="setDefaultImage" alt="Tale Cover" class="modal-cover-image"/>
        <p class="modal-meta">By: {{ viewingTale.author?.name || shortenAddress(viewingTale.authorWalletAddress) }}</p>
        <p class="modal-meta">Genre: {{ viewingTale.genre }} | Status: {{ viewingTale.status }}</p>
        <div class="prose-styles modal-prose line-clamp-5" v-html="renderMarkdown(viewingTale.content)"></div>
         <div v-if="viewingTale.tags && viewingTale.tags.length > 0" class="modal-tags">
            <span v-for="tagItem in viewingTale.tags" :key="tagItem" class="tag">{{ tagItem }}</span>
        </div>
        <button @click="navigateToTaleDetailAndCloseModal(viewingTale._id)" class="btn btn-primary modal-action-button">
          View Full Tale & Episodes
        </button>
        <button @click="viewingTale = null" class="btn btn-secondary modal-action-button">Close Preview</button>
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
/* General Styles */
.home-view {
  padding: 1rem;
  max-width: 1024px; /* lg:max-w-5xl */
  margin-left: auto;
  margin-right: auto;
  color: #374151; /* Default text color (gray-700) */
}

.dark .home-view {
  color: #d1d5db; /* Default dark text color (gray-300) */
}

.home-header {
  margin-bottom: 2rem; /* mb-8 */
  text-align: center;
}

.main-title {
  font-size: 2.25rem; /* text-4xl */
  line-height: 2.5rem;
  font-weight: 700; /* font-bold */
  color: #1f2937; /* text-gray-800 */
}
.dark .main-title {
  color: #f9fafb; /* dark:text-white */
}

.subtitle {
  font-size: 1.125rem; /* text-lg */
  line-height: 1.75rem;
  color: #4b5563; /* text-gray-600 */
  margin-top: 0.5rem; /* mt-2 */
}
.dark .subtitle {
  color: #9ca3af; /* dark:text-gray-400 */
}

.section-title {
  font-size: 1.5rem; /* text-2xl */
  line-height: 2rem;
  font-weight: 600; /* font-semibold */
  margin-bottom: 1.5rem; /* mb-6 */
  color: #374151; /* text-gray-700 */
}
.dark .section-title {
  color: #e5e7eb; /* dark:text-gray-200 */
}

/* Wallet Connection Section */
.wallet-connection-section {
  margin-bottom: 1.5rem; /* mb-6 */
  padding: 1rem; /* p-4 */
  border: 1px solid #e5e7eb; /* border-gray-200 */
  border-radius: 0.375rem; /* rounded-md */
  text-align: center;
}
.dark .wallet-connection-section {
  border-color: #4b5568; /* dark:border-gray-700 */
}
.wallet-connection-section .section-title { /* Override for h2 inside */
  font-size: 1.25rem; /* text-xl */
  margin-bottom: 0.75rem; /* mb-3 */
}

/* Info Box & Connected Wallet Info */
.info-box {
  margin-top: 0.75rem; /* mt-3 */
  padding: 0.75rem; /* p-3 */
  background-color: #f9fafb; /* bg-gray-50 */
  border-radius: 0.375rem; /* rounded-md */
  border: 1px solid #e5e7eb; /* border-gray-200 */
  font-size: 0.875rem; /* text-sm */
  color: #374151; /* text-gray-700 */
}
.dark .info-box {
  background-color: rgba(55, 65, 81, 0.5); /* dark:bg-gray-700/50 */
  border-color: #4b5568; /* dark:border-gray-600 */
  color: #e5e7eb; /* dark:text-gray-200 */
}
.wallet-address {
  font-family: monospace;
  font-size: 0.875rem; /* text-sm */
}

/* Auth Prompt Section */
.auth-prompt-section {
  margin-bottom: 2rem; /* mb-8 */
  text-align: center;
}
.auth-button {
  font-size: 1.125rem; /* text-lg */
  padding-left: 1.5rem; /* px-6 */
  padding-right: 1.5rem;
  padding-top: 0.75rem; /* py-3 */
  padding-bottom: 0.75rem;
}

/* Welcome User Section */
.welcome-user-section {
  margin-bottom: 1.5rem; /* mb-6 */
  padding: 1rem; /* p-4 */
  background-color: #eff6ff; /* bg-green-50 (using blue for example) */
  border-radius: 0.5rem; /* rounded-lg */
  text-align: center;
  color: #1d4ed8; /* text-green-700 (using blue) */
}
.dark .welcome-user-section {
  background-color: rgba(30, 58, 138, 0.3); /* dark:bg-green-900/30 (using blue) */
  color: #93c5fd; /* dark:text-green-300 (using blue) */
}
.user-name {
  font-weight: 600; /* font-semibold */
}
.manage-tales-link {
  font-weight: 600; /* font-semibold */
  text-decoration: underline;
  margin-left: 0.5rem; /* ml-2 */
}
.manage-tales-link:hover {
  color: #2563eb; /* hover:text-green-500 (using blue) */
}
.dark .manage-tales-link:hover {
  color: #60a5fa; /* dark:hover:text-green-300 (using blue) */
}


/* UI Message */
.ui-message {
  margin-top: 1rem; /* my-4 */
  margin-bottom: 1rem;
  padding: 0.75rem; /* p-3 */
  border-radius: 0.375rem; /* rounded-md */
  text-align: center;
  font-size: 0.875rem; /* text-sm */
}
.ui-message-info {
  background-color: #eff6ff; /* bg-blue-50 */
  color: #1d4ed8; /* text-blue-700 */
  border: 1px solid #bfdbfe; /* border-blue-200 */
}
.dark .ui-message-info {
  background-color: rgba(30, 58, 138, 0.3); /* dark:bg-blue-700/30 */
  color: #93c5fd; /* dark:text-blue-300 */
  border-color: rgba(59, 130, 246, 0.5); /* dark:border-blue-500/50 */
}
.ui-message-success {
  background-color: #f0fdf4; /* bg-green-50 */
  color: #166534; /* text-green-700 */
  border: 1px solid #bbf7d0; /* border-green-200 */
}
.dark .ui-message-success {
  background-color: rgba(22, 101, 52, 0.3); /* dark:bg-green-700/30 */
  color: #86efac; /* dark:text-green-300 */
  border-color: rgba(34, 197, 94, 0.5); /* dark:border-green-500/50 */
}
.ui-message-error {
  background-color: #fef2f2; /* bg-red-50 */
  color: #b91c1c; /* text-red-700 */
  border: 1px solid #fecaca; /* border-red-200 */
}
.dark .ui-message-error {
  background-color: rgba(153, 27, 27, 0.3); /* dark:bg-red-700/30 */
  color: #fca5a5; /* dark:text-red-300 */
  border-color: rgba(220, 38, 38, 0.5); /* dark:border-red-500/50 */
}


/* Tales List Section */
.tales-list-section {
  margin-top: 2.5rem; /* mt-10 */
}
.loading-indicator {
  text-align: center;
  padding: 1.5rem; /* p-6 */
}
.loading-indicator p {
  margin-top: 0.5rem; /* mt-2 */
  color: #4b5563; /* text-gray-600 */
}
.dark .loading-indicator p {
  color: #d1d5db; /* dark:text-gray-300 */
}
.no-tales-info {
  text-align: center;
}

.tales-grid {
  display: grid;
  grid-template-columns: repeat(1, minmax(0, 1fr)); /* grid-cols-1 */
  gap: 1.5rem; /* gap-6 */
}
@media (min-width: 768px) { /* md: */
  .tales-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr)); /* md:grid-cols-2 */
  }
}
@media (min-width: 1024px) { /* lg: */
  .tales-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr)); /* lg:grid-cols-3 */
  }
}

/* Tale Card */
.tale-card {
  background-color: #ffffff; /* bg-white */
  border-radius: 0.5rem; /* rounded-lg */
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06); /* shadow-lg */
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
}
.dark .tale-card {
  background-color: #1f2937; /* dark:bg-gray-800 */
}
.tale-card:hover {
  transform: translateY(-0.25rem); /* hover:-translate-y-1 */
  box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04); /* hover:shadow-2xl */
}
.tale-cover-image {
  width: 100%;
  height: 12rem; /* h-48 */
  object-fit: cover;
}
.tale-card-content {
  padding: 1rem; /* p-4 */
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}
.tale-title {
  font-size: 1.25rem; /* text-xl */
  font-weight: 600; /* font-semibold */
  margin-bottom: 0.5rem; /* mb-2 */
  color: #1f2937; /* text-gray-800 */
}
.dark .tale-title {
  color: #f9fafb; /* dark:text-white */
}
.tale-meta {
  font-size: 0.875rem; /* text-sm */
  color: #6b7280; /* text-gray-500 */
  margin-bottom: 0.25rem; /* mb-1 or mb-2 */
}
.dark .tale-meta {
  color: #9ca3af; /* dark:text-gray-400 */
}
.tale-tags {
  margin-bottom: 0.75rem; /* mb-3 */
}
.tag {
  display: inline-block;
  background-color: #e5e7eb; /* bg-gray-200 */
  border-radius: 9999px; /* rounded-full */
  padding: 0.25rem 0.75rem; /* px-3 py-1 */
  font-size: 0.75rem; /* text-xs */
  font-weight: 600; /* font-semibold */
  color: #374151; /* text-gray-700 */
  margin-right: 0.5rem; /* mr-2 */
  margin-bottom: 0.5rem; /* mb-2 */
}
.dark .tag {
  background-color: #374151; /* dark:bg-gray-700 */
  color: #e5e7eb; /* dark:text-gray-200 */
}
.read-more-button {
  margin-top: auto; /* mt-auto */
  width: 100%; /* w-full */
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5); /* bg-black bg-opacity-50 */
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem; /* p-4 */
  z-index: 50;
}
.modal-content {
  background-color: #ffffff; /* bg-white */
  padding: 1.5rem; /* p-6 */
  border-radius: 0.5rem; /* rounded-lg */
  box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05); /* shadow-xl */
  width: 100%;
  max-width: 42rem; /* max-w-2xl */
  max-height: 90vh;
  overflow-y: auto;
}
.dark .modal-content {
  background-color: #1f2937; /* dark:bg-gray-800 */
}
.modal-title {
  font-size: 1.875rem; /* text-3xl */
  font-weight: 700; /* font-bold */
  margin-bottom: 1rem; /* mb-4 */
  color: #1f2937; /* text-gray-800 */
}
.dark .modal-title {
  color: #f9fafb; /* dark:text-white */
}
.modal-cover-image {
  width: 100%;
  height: 16rem; /* h-64 */
  object-fit: cover;
  border-radius: 0.375rem; /* rounded-md */
  margin-bottom: 1rem; /* mb-4 */
}
.modal-meta {
  font-size: 0.875rem; /* text-sm */
  color: #6b7280; /* text-gray-500 */
  margin-bottom: 0.25rem; /* mb-1 or mb-3 */
}
.dark .modal-meta {
  color: #9ca3af; /* dark:text-gray-400 */
}
.modal-tags {
  margin-bottom: 1rem; /* mb-4 */
}
.modal-action-button {
  width: 100%; /* w-full */
  margin-bottom: 0.5rem; /* mb-2 for first, none for last if only one */
}
.modal-action-button:last-child {
  margin-bottom: 0;
}

/* Prose Styles (for rendered Markdown) */
.prose-styles {
  max-width: none;
  margin-bottom: 1rem;
}
.dark .prose-styles {
  /* Basic dark mode for prose, can be expanded */
  color: #d1d5db;
}
.dark .prose-styles :deep(h1),
.dark .prose-styles :deep(h2),
.dark .prose-styles :deep(h3),
.dark .prose-styles :deep(h4),
.dark .prose-styles :deep(strong) {
  color: #f9fafb;
}
.dark .prose-styles :deep(a) {
  color: #93c5fd;
}
.dark .prose-styles :deep(blockquote) {
  border-left-color: #4b5568;
  color: #9ca3af;
}
.dark .prose-styles :deep(code) {
  background-color: #374151;
  color: #e5e7eb;
}
.dark .prose-styles :deep(pre) {
  background-color: #111827;
}
.line-clamp-5 {
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 5; /* number of lines to show */
  -webkit-box-orient: vertical;
}


/* Spinner */
.spinner {
  display: inline-block;
  width: 2rem; /* w-8 */
  height: 2rem; /* h-8 */
  border-width: 4px;
  border-top-color: #4f46e5; /* border-t-indigo-600 */
  border-right-color: transparent;
  border-bottom-color: transparent;
  border-left-color: transparent;
  border-radius: 9999px; /* rounded-full */
  animation: spin 1s linear infinite;
}
.dark .spinner {
  border-top-color: #818cf8; /* dark:border-t-indigo-400 */
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

/* General Button Styles (reusable) */
.btn {
  padding: 0.5rem 1rem; /* px-4 py-2 */
  border: 1px solid transparent;
  border-radius: 0.375rem; /* rounded-md */
  box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05); /* shadow-sm */
  font-size: 0.875rem; /* text-sm */
  font-weight: 500; /* font-medium */
  color: #ffffff; /* text-white */
  cursor: pointer;
  transition: background-color 0.15s ease-in-out;
}
.btn:focus {
  outline: 2px solid transparent;
  outline-offset: 2px;
  /* Consider box-shadow for focus ring if not using default outline */
}
.btn:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.btn-primary {
  background-color: #4f46e5; /* bg-indigo-600 */
}
.btn-primary:hover {
  background-color: #4338ca; /* hover:bg-indigo-700 */
}
.btn-primary:focus {
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.5); /* focus:ring-indigo-500 */
}
.dark .btn-primary {
  background-color: #6366f1; /* dark:bg-indigo-500 */
}
.dark .btn-primary:hover {
  background-color: #818cf8; /* dark:hover:bg-indigo-400 */
}
.dark .btn-primary:disabled {
  background-color: #4338ca; /* dark:disabled:bg-indigo-700 */
}


.btn-secondary {
  background-color: #6b7280; /* bg-gray-500 */
  color: #ffffff;
}
.btn-secondary:hover {
  background-color: #4b5563; /* hover:bg-gray-600 */
}
.dark .btn-secondary {
  background-color: #4b5568; /* dark:bg-gray-600 */
}
.dark .btn-secondary:hover {
  background-color: #374151; /* dark:hover:bg-gray-500 */
}

.btn-info {
  background-color: #3b82f6; /* bg-blue-500 */
  color: #ffffff;
}
.btn-info:hover {
  background-color: #2563eb; /* hover:bg-blue-600 */
}
.dark .btn-info {
  background-color: #3b82f6; /* dark:bg-blue-500 */
}
.dark .btn-info:hover {
  background-color: #60a5fa; /* dark:hover:bg-blue-400 */
}

.btn-sm {
  padding: 0.375rem 0.75rem; /* px-3 py-1.5 */
  font-size: 0.75rem; /* text-xs */
}

.link {
  color: #4f46e5; /* text-indigo-600 */
  text-decoration: underline;
}
.link:hover {
  color: #4338ca; /* hover:text-indigo-500 */
}
.dark .link {
  color: #818cf8; /* dark:text-indigo-400 */
}
.dark .link:hover {
  color: #a78bfa; /* dark:hover:text-indigo-300 */
}

</style>