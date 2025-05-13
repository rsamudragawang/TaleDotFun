<template>
  <div class="tale-detail-view-container">
    <div v-if="viewUiMessage.text"
         :class="['view-ui-message', `view-ui-message-${viewUiMessage.type}`]">
      {{ viewUiMessage.text }}
    </div>

    <div v-if="isLoadingTale || isLoadingAppUser || isLoadingUserMints" class="loading-container">
      <div class="spinner"></div>
      <p class="loading-text">
        <span v-if="isLoadingTale">Loading tale details...</span>
        <span v-else-if="isLoadingAppUser">Loading user information...</span>
        <span v-else-if="isLoadingUserMints">Loading your mint activities...</span>
      </p>
    </div>
    <div v-else-if="!tale" class="error-container">
      Tale not found or an error occurred while fetching details.
      <button @click="goBack" class="btn btn-secondary btn-back">Go Back</button>
    </div>
    <div v-else class="tale-content-wrapper">
      <section class="tale-details-section">
        <button @click="goBack" class="btn btn-secondary btn-back-tales">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="back-arrow-icon">
            <path fill-rule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" clip-rule="evenodd" />
          </svg>
          Back to Tales List
        </button>
        <h1 class="tale-main-title">{{ tale.title }}</h1>
        <img v-if="tale.coverImage" :src="tale.coverImage" @error="setDefaultImage" alt="Tale Cover" class="tale-cover-image-large"/>
        <div class="tale-meta-info">
          <span class="meta-item">By: {{ tale.author?.name || shortenAddress(tale.authorWalletAddress) }}</span>
          <span class="meta-item">Genre: {{ tale.genre || 'N/A' }}</span>
          <span class="meta-item">Status: <span :class="['status-badge', `status-${tale.status}`]">{{ tale.status }}</span></span>
        </div>
        <div class="prose-styles tale-prose-content" v-html="renderMarkdown(tale.content)"></div>
        <div v-if="tale.tags && tale.tags.length > 0" class="tags-container">
            <span v-for="tagItem in tale.tags" :key="tagItem" class="tag">{{ tagItem }}</span>
        </div>
      </section>

      <hr class="section-divider"/>

      <EpisodeManager
        :parentTale="tale"
        :appUser="appUser"
        :userMintActivities="userMintActivities"
      />
       <div v-if="!appUser && !isLoadingAppUser && tale" class="login-prompt-box">
          Public episodes are shown. <router-link :to="{name: 'Auth'}" class="link">Login or Register</router-link> to manage episodes if you are the author or to view token-gated content.
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
.tale-detail-view-container {
  padding: 1rem; /* p-4 */
  background-color: #f9fafb; /* bg-gray-50 */
  min-height: 100vh;
}
.dark .tale-detail-view-container {
  background-color: #111827; /* dark:bg-gray-900 */
}

.view-ui-message {
  position: fixed;
  top: 1.25rem; /* top-5 */
  right: 1.25rem; /* right-5 */
  z-index: 100;
  padding: 0.75rem; /* p-3 */
  border-radius: 0.375rem; /* rounded-md */
  text-align: center;
  font-size: 0.875rem; /* text-sm */
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06); /* shadow-lg */
  max-width: 24rem; /* max-w-md */
}
.view-ui-message-info {
  background-color: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe;
}
.dark .view-ui-message-info {
  background-color: rgba(30, 58, 138, 0.8); color: #93c5fd; border-color: rgba(59, 130, 246, 0.7);
}
.view-ui-message-success {
  background-color: #f0fdf4; color: #166534; border: 1px solid #bbf7d0;
}
.dark .view-ui-message-success {
  background-color: rgba(22, 101, 52, 0.8); color: #86efac; border-color: rgba(34, 197, 94, 0.7);
}
.view-ui-message-error {
  background-color: #fef2f2; color: #b91c1c; border: 1px solid #fecaca;
}
.dark .view-ui-message-error {
  background-color: rgba(153, 27, 27, 0.8); color: #fca5a5; border-color: rgba(220, 38, 38, 0.7);
}


.loading-container {
  text-align: center;
  padding-top: 2.5rem; /* py-10 */
  padding-bottom: 2.5rem;
}
.loading-text {
  margin-top: 0.75rem; /* mt-3 */
  font-size: 1.125rem; /* text-lg */
  color: #4b5563; /* text-gray-600 */
}
.dark .loading-text {
  color: #d1d5db; /* dark:text-gray-300 */
}

.error-container {
  text-align: center;
  margin-top: 2.5rem; /* mt-10 */
  max-width: 32rem; /* max-w-lg */
  margin-left: auto;
  margin-right: auto;
  padding: 1rem;
  background-color: #fff1f2; /* A bit softer red for error box background */
  color: #991b1b; /* A bit softer red for error text */
  border: 1px solid #fecdd3;
  border-radius: 0.375rem;
}
.dark .error-container {
    background-color: rgba(127, 29, 29, 0.5);
    color: #fca5a5;
    border-color: rgba(220, 38, 38, 0.6);
}
.btn-back {
  margin-top: 1rem; /* mt-4 */
}

.tale-content-wrapper {
  max-width: 56rem; /* max-w-4xl */
  margin-left: auto;
  margin-right: auto;
}

.tale-details-section {
  margin-bottom: 2rem; /* mb-8 */
  padding: 1rem; /* p-4 */
  background-color: #ffffff; /* bg-white */
  box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05); /* shadow-xl */
  border-radius: 0.5rem; /* rounded-lg */
}
.dark .tale-details-section {
  background-color: #1f2937; /* dark:bg-gray-800 */
}
@media (min-width: 768px) { /* md: */
  .tale-details-section {
    padding: 1.5rem; /* md:p-6 */
  }
}

.btn-back-tales {
  margin-bottom: 1.5rem; /* mb-6 */
  display: inline-flex;
  align-items: center;
}
.back-arrow-icon {
  width: 1.25rem; /* w-5 */
  height: 1.25rem; /* h-5 */
  margin-right: 0.5rem; /* mr-2 */
}

.tale-main-title {
  font-size: 1.875rem; /* text-3xl */
  line-height: 2.25rem;
  font-weight: 700; /* font-bold */
  margin-bottom: 0.75rem; /* mb-3 */
  color: #111827; /* text-gray-900 */
}
.dark .tale-main-title {
  color: #ffffff; /* dark:text-white */
}
@media (min-width: 768px) { /* md: */
  .tale-main-title {
    font-size: 2.25rem; /* md:text-4xl */
    line-height: 2.5rem;
  }
}

.tale-cover-image-large {
  width: 100%;
  max-height: 32rem; /* max-h-[500px] approx */
  object-fit: cover;
  border-radius: 0.375rem; /* rounded-md */
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06); /* shadow-md */
  margin-bottom: 1.5rem; /* mb-6 */
}

.tale-meta-info {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  font-size: 0.875rem; /* text-sm */
  color: #6b7280; /* text-gray-500 */
  margin-bottom: 1rem; /* mb-4 */
}
.dark .tale-meta-info {
  color: #9ca3af; /* dark:text-gray-400 */
}
.meta-item {
  margin-right: 1rem; /* mr-4 */
  margin-bottom: 0.25rem; /* For wrapping */
}
.status-badge {
  font-weight: 600; /* font-semibold */
}
.status-published {
  color: #059669; /* text-green-600 */
}
.dark .status-published {
  color: #34d399; /* dark:text-green-400 */
}
.status-draft {
  color: #d97706; /* text-yellow-600 */
}
.dark .status-draft {
  color: #f59e0b; /* dark:text-yellow-400 */
}

.tale-prose-content {
  max-width: none; /* max-w-none */
  margin-bottom: 1.5rem; /* mb-6 */
}

.tags-container {
  margin-bottom: 1rem; /* mb-4 */
}
.tag {
  display: inline-block;
  background-color: #e5e7eb;
  border-radius: 9999px;
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #374151;
  margin-right: 0.5rem;
  margin-bottom: 0.5rem;
}
.dark .tag {
  background-color: #374151;
  color: #e5e7eb;
}

.section-divider {
  margin-top: 2rem; /* my-8 */
  margin-bottom: 2rem;
  border-color: #d1d5db; /* border-gray-300 */
}
.dark .section-divider {
  border-color: #374151; /* dark:border-gray-700 */
}

.login-prompt-box {
  margin-top: 1.5rem; /* mt-6 */
  text-align: center;
  padding: 1rem;
  background-color: #eff6ff; /* bg-blue-50 */
  color: #1d4ed8; /* text-blue-700 */
  border: 1px solid #bfdbfe; /* border-blue-200 */
  border-radius: 0.375rem; /* rounded-md */
  font-size: 0.875rem; /* text-sm */
}
.dark .login-prompt-box {
  background-color: rgba(30, 58, 138, 0.3); /* dark:bg-blue-700/30 */
  color: #93c5fd; /* dark:text-blue-300 */
  border-color: rgba(59, 130, 246, 0.5); /* dark:border-blue-500/50 */
}
.link {
  color: #4f46e5;
  text-decoration: underline;
  font-weight: 500; /* font-medium */
}
.link:hover {
  color: #4338ca;
}
.dark .link {
  color: #818cf8;
}
.dark .link:hover {
  color: #a78bfa;
}


/* Spinner (re-defined for encapsulation, or use global) */
.spinner {
  display: inline-block;
  width: 2.5rem; /* w-10 */
  height: 2.5rem; /* h-10 */
  border-width: 4px;
  border-top-color: #4f46e5;
  border-right-color: transparent;
  border-bottom-color: transparent;
  border-left-color: transparent;
  border-radius: 9999px;
  animation: spin 1s linear infinite;
}
.dark .spinner {
  border-top-color: #818cf8;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Button Styles (re-defined for encapsulation, or use global) */
.btn {
  padding: 0.5rem 1rem;
  border: 1px solid transparent;
  border-radius: 0.375rem;
  box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05);
  font-size: 0.875rem;
  font-weight: 500;
  color: #ffffff;
  cursor: pointer;
  transition: background-color 0.15s ease-in-out;
}
.btn:focus {
  outline: 2px solid transparent;
  outline-offset: 2px;
}
.btn:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}
.btn-secondary {
  background-color: #6b7280;
  color: #ffffff;
}
.btn-secondary:hover {
  background-color: #4b5563;
}
.dark .btn-secondary {
  background-color: #4b5568;
}
.dark .btn-secondary:hover {
  background-color: #374151;
}

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