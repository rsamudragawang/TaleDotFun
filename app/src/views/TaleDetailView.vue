<template>
  <div class="tale-detail-view p-4 md:p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
    <div v-if="viewUiMessage.text"
         :class="viewUiMessage.type === 'error' ? 'error-box' : (viewUiMessage.type === 'success' ? 'success-box' : 'info-box')"
         class="my-4 p-3 rounded-md text-center text-sm fixed top-5 right-5 z-[100] shadow-lg max-w-md">
      {{ viewUiMessage.text }}
    </div>

    <div v-if="isLoadingTale || isLoadingAppUser || isLoadingUserMints" class="text-center py-10">
      <div class="spinner"></div>
      <p class="mt-3 text-lg text-gray-600 dark:text-gray-300">
        <span v-if="isLoadingTale">Loading tale details...</span>
        <span v-else-if="isLoadingAppUser">Loading user information...</span>
        <span v-else-if="isLoadingUserMints">Loading your mint activities...</span>
      </p>
    </div>
    <div v-else-if="!tale" class="error-box text-center mt-10 max-w-lg mx-auto">
      Tale not found or an error occurred while fetching details.
      <button @click="goBack" class="btn btn-secondary mt-4">Go Back</button>
    </div>
    <div v-else class="max-w-4xl mx-auto">
      <section class="mb-8 p-4 md:p-6 bg-white dark:bg-gray-800 shadow-xl rounded-lg">
        <button @click="goBack" class="btn btn-secondary mb-6 inline-flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5 mr-2">
            <path fill-rule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" clip-rule="evenodd" />
          </svg>
          Back to Tales List
        </button>
        <h1 class="text-3xl md:text-4xl font-bold mb-3 text-gray-900 dark:text-white">{{ tale.title }}</h1>
        <img v-if="tale.coverImage" :src="tale.coverImage" @error="setDefaultImage" alt="Tale Cover" class="w-full max-h-[500px] object-cover rounded-md shadow-md mb-6"/>
        <div class="flex flex-wrap items-center text-sm text-gray-500 dark:text-gray-400 mb-4">
          <span class="mr-4">By: {{ tale.author?.name || shortenAddress(tale.authorWalletAddress) }}</span>
          <span class="mr-4">Genre: {{ tale.genre || 'N/A' }}</span>
          <span>Status: <span :class="tale.status === 'published' ? 'text-green-600 dark:text-green-400 font-semibold' : 'text-yellow-600 dark:text-yellow-400 font-semibold'">{{ tale.status }}</span></span>
        </div>
        <div class="prose dark:prose-invert max-w-none mb-6" v-html="renderMarkdown(tale.content)"></div>
        <div v-if="tale.tags && tale.tags.length > 0" class="mb-4">
            <span v-for="tag in tale.tags" :key="tag" class="tag">{{ tag }}</span>
        </div>
      </section>

      <hr class="my-8 border-gray-300 dark:border-gray-600"/>

      <EpisodeManager
        :parentTale="tale"
        :appUser="appUser"
        :userMintActivities="userMintActivities"
      />
      <div v-if="!appUser && !isLoadingAppUser && tale" class="mt-6 info-box text-center">
          Public episodes are shown. <router-link :to="{name: 'Auth'}" class="link font-semibold">Login or Register</router-link> to manage episodes if you are the author or to view token-gated content.
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import { marked } from 'marked';
import EpisodeManager from '../components/EpisodeManager.vue'; // Ensure this path is correct
import { useWallet } from 'solana-wallets-vue'; // To check wallet connection for user fetching

// Configuration
const TALES_API_BASE_URL = import.meta.env.VITE_APP_AUTH_API_URL || 'http://localhost:3000/api';
const AUTH_API_BASE_URL = TALES_API_BASE_URL; // Assuming same base for auth
const MINT_ACTIVITIES_API_BASE_URL = TALES_API_BASE_URL; // Assuming same base
const JWT_TOKEN_KEY = 'readium_fun_jwt_token';

const route = useRoute();
const router = useRouter();
const wallet = useWallet(); // Get wallet status from solana-wallets-vue

// Reactive State
const tale = ref(null);
const isLoadingTale = ref(false);
const appUser = ref(null);
const isLoadingAppUser = ref(false);
const userMintActivities = ref([]);
const isLoadingUserMints = ref(false);

// UI Message for this view
const viewUiMessage = ref({ text: '', type: 'info' });
function showViewUiMessage(msg, type = 'info', duration = 5000) {
  viewUiMessage.value = { text: msg, type };
  if (duration > 0) {
    setTimeout(() => { viewUiMessage.value = { text: '', type: 'info' }; }, duration);
  }
}

// Utility Functions
const shortenAddress = (address, chars = 6) => {
    if (!address) return '';
    return `${address.slice(0, chars)}...${address.slice(-chars)}`;
};
const setDefaultImage = (event) => {
    event.target.src = 'https://placehold.co/600x400/gray/white?text=Image+Load+Error';
};
const renderMarkdown = (markdownText) => {
    if (!markdownText) return '';
    return marked(markdownText);
};

// API Client Setup
const apiClient = axios.create({ baseURL: TALES_API_BASE_URL });
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem(JWT_TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
apiClient.interceptors.response.use(
    response => response.data, // Return data directly for success
    error => {
        const msg = error.response?.data?.message || error.message || 'An API error occurred in TaleDetailView.';
        console.error('API Error (TaleDetailView Interceptor):', msg, error.response || error);
        showViewUiMessage(msg, 'error'); // Use view-specific UI message
        return Promise.reject(error.response?.data || { message: msg, error });
    }
);

// Data Fetching Functions
async function fetchTale(id) {
  if (!id) {
    tale.value = null;
    showViewUiMessage("No Tale ID provided.", "error");
    return;
  }
  isLoadingTale.value = true;
  try {
    const response = await apiClient.get(`/tales/${id}`);
    if (response.success) {
      tale.value = response.data;
    } else {
      tale.value = null;
      showViewUiMessage(response.message || `Tale with ID ${id} not found.`, 'error');
    }
  } catch (error) {
    // Error is handled by the interceptor, but we ensure tale is null
    tale.value = null;
  } finally {
    isLoadingTale.value = false;
  }
}

async function fetchAppUser() {
  const token = localStorage.getItem(JWT_TOKEN_KEY);
  if (!token || !wallet.connected.value) { // Only attempt if token exists and wallet is connected
    appUser.value = null;
    userMintActivities.value = []; // Clear mints if no user/wallet
    return;
  }
  isLoadingAppUser.value = true;
  try {
    const authApiClient = axios.create({ baseURL: AUTH_API_BASE_URL }); // Separate instance for clarity if needed
    const response = await authApiClient.get('/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.data.success) {
        appUser.value = response.data.data;
        // After successfully fetching user, fetch their mint activities
        if (appUser.value?.walletAddress) {
            await fetchUserMintActivities(appUser.value.walletAddress);
        } else {
            userMintActivities.value = []; // Clear if no wallet address on user
        }
    } else {
        appUser.value = null;
        userMintActivities.value = [];
        localStorage.removeItem(JWT_TOKEN_KEY); // Token might be invalid
    }
  } catch (error) {
    console.error("Failed to fetch app user in TaleDetailView:", error);
    appUser.value = null;
    userMintActivities.value = [];
    // Don't remove token here if it's just a network error, Auth.vue handles invalid tokens better
  } finally {
    isLoadingAppUser.value = false;
  }
}

async function fetchUserMintActivities(walletAddress) {
    if (!walletAddress) {
        userMintActivities.value = [];
        return;
    }
    isLoadingUserMints.value = true;
    try {
        // Use the main apiClient as it's already configured with auth interceptor
        const response = await apiClient.get(`/mint-activities/by-user/${walletAddress}`);
        if (response.success) {
            userMintActivities.value = response.data;
        } else {
            userMintActivities.value = [];
            showViewUiMessage(response.message || 'Could not fetch mint activities.', 'warning');
        }
    } catch (error) {
        console.error("Failed to fetch user mint activities:", error);
        userMintActivities.value = [];
        // Error message shown by interceptor
    } finally {
        isLoadingUserMints.value = false;
    }
}

function goBack() {
    // Prefers going back in history, otherwise to Home.
    if (window.history.length > 2) { // Check if there's a page to go back to
        router.go(-1);
    } else {
        router.push({ name: 'Home' });
    }
}

// Lifecycle Hooks and Watchers
onMounted(async () => {
  await fetchAppUser(); // Fetch user and their mints first
  if (route.params.id) {
    await fetchTale(route.params.id);
  }
});

watch(() => route.params.id, async (newId, oldId) => {
    if (newId && newId !== oldId) { // Fetch only if ID actually changes
        await fetchTale(newId);
    }
});

// Watch for wallet connection changes to re-fetch user and their mints
watch(() => wallet.connected.value, async (isConnected) => {
    await fetchAppUser(); // This will also trigger fetchUserMintActivities if user is found
    if (!isConnected) { // If wallet disconnects
        appUser.value = null;
        userMintActivities.value = [];
    }
}, { immediate: false }); // 'immediate: true' might cause issues if wallet initializes after component mount.
                          // fetchAppUser in onMounted handles initial load.

</script>

<style scoped>
.tag { @apply inline-block bg-gray-200 dark:bg-gray-700 rounded-full px-3 py-1 text-xs font-semibold text-gray-700 dark:text-gray-200 mr-2 mb-2; }
.spinner { @apply inline-block w-10 h-10 border-4 border-t-indigo-600 dark:border-t-indigo-400 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin; }
.error-box { @apply p-4 bg-red-50 dark:bg-red-700/30 text-red-700 dark:text-red-300 rounded-md border border-red-200 dark:border-red-500/50 text-sm; }
.success-box { @apply p-4 bg-green-50 dark:bg-green-700/30 text-green-700 dark:text-green-300 rounded-md border border-green-200 dark:border-green-500/50 text-sm; }
.info-box { @apply p-4 bg-blue-50 dark:bg-blue-700/30 text-blue-700 dark:text-blue-300 rounded-md border border-blue-200 dark:border-blue-500/50 text-sm; }
.link { @apply text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 underline font-medium; }

/* Styles for prose from Tailwind Typography, if not using the plugin globally */
.prose :deep(h1), .prose :deep(h2), .prose :deep(h3), .prose :deep(h4) { @apply mb-3 mt-5 font-semibold text-gray-800 dark:text-white; }
.prose :deep(p) { @apply mb-4 leading-relaxed text-gray-700 dark:text-gray-300; }
.prose :deep(ul), .prose :deep(ol) { @apply ml-6 mb-4 list-disc dark:text-gray-300; }
.prose :deep(li) { @apply mb-1; }
.prose :deep(a) { @apply text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300; }
.prose :deep(blockquote) { @apply border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic text-gray-600 dark:text-gray-400 my-5; }
.prose :deep(pre) { @apply bg-gray-100 dark:bg-gray-900 p-4 rounded-md overflow-x-auto text-sm my-5; }
.prose :deep(code) { @apply bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-sm; }
.prose :deep(pre) :deep(code) { @apply bg-transparent p-0 rounded-none; }

.btn { @apply px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed; }
.btn-primary { @apply bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400 disabled:bg-indigo-300 dark:disabled:bg-indigo-700; }
.btn-secondary { @apply bg-gray-500 hover:bg-gray-600 focus:ring-gray-500 dark:bg-gray-600 dark:hover:bg-gray-500 disabled:bg-gray-300 dark:disabled:bg-gray-700; }
</style>