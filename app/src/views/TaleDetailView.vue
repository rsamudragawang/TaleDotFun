<!-- <template>
  <div class="tale-detail-view-container">
    <div v-if="viewUiMessage.text"
         :class="['view-ui-message', `view-ui-message-${viewUiMessage.type}`]">
      {{ viewUiMessage.text }}
    </div>

    <div v-if="isLoadingInitialData" class="loading-container">
      <div class="spinner"></div>
      <p class="loading-text">Loading tale details...</p>
    </div>
    <div v-else-if="!taleOnChainAccountData && !isLoadingInitialData" class="error-container">
      Tale not found or an error occurred. The on-chain ID might be incorrect or the tale does not exist.
      <button @click="goBack" class="btn btn-secondary btn-back">Go Back</button>
    </div>
    <div v-else-if="taleOnChainAccountData && taleBackendDoc" class="tale-content-wrapper">
      <section class="tale-details-section">
        <button @click="goBack" class="btn btn-secondary btn-back-tales">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="back-arrow-icon">
            <path fill-rule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" clip-rule="evenodd" />
          </svg>
          Back
        </button>
        <h1 class="tale-main-title">{{ taleOnChainAccountData.title }}</h1>
        <img v-if="taleOnChainAccountData.coverImageCid" :src="`https://gateway.pinata.cloud/ipfs/${taleOnChainAccountData.coverImageCid}`" @error="setDefaultImage" alt="Tale Cover" class="tale-cover-image-large"/>
        <div class="tale-meta-info">
          <span class="meta-item">Author: {{ shortenAddress(taleOnChainAccountData.author.toString()) }}</span>
          <span class="meta-item">Genre: {{ taleOnChainAccountData.genre || 'N/A' }}</span>
          <span class="meta-item">Status: <span :class="['status-badge', `status-${getStatusString(taleOnChainAccountData.status).toLowerCase()}`]">{{ getStatusString(taleOnChainAccountData.status) }}</span></span>
        </div>
        <div class="prose-styles tale-prose-content" v-html="renderMarkdown(fetchedIpfsFullContent)"></div>
        <div v-if="taleBackendDoc.tags && taleBackendDoc.tags.length > 0" class="tags-container">
            <span v-for="tagItem in taleBackendDoc.tags" :key="tagItem" class="tag">{{ tagItem }}</span>
        </div>
         <div v-else-if="!taleBackendDoc" class="info-box">
            <p>Backend details (like tags) for this tale are not yet synced or available.</p>
        </div>
      </section>

      <hr class="section-divider"/>

      <EpisodeManager
        v-if="taleBackendDoc && taleOnChainPdaString && taleOnChainAccountData"
        :parentTale="{
            mongoId: taleBackendDoc._id,
            onChainPdaString: taleOnChainPdaString,
            onChainAccountData: taleOnChainAccountData
        }"
        :appUser="appUser"
        :userMintActivities="userMintActivities"
      />
       <div v-else-if="taleOnChainAccountData && !taleBackendDoc && !isLoadingInitialData" class="info-box">
            Waiting for backend details to load Episode Manager...
      </div>
       <div v-if="!appUser && !isLoadingAppUser && taleOnChainAccountData" class="login-prompt-box">
        Public episodes are shown. <router-link :to="{name: 'Auth'}" class="link">Login or Register</router-link> to manage episodes if you are the author or to view token-gated content.
      </div>
    </div>
  </div>
</template> -->

<template>
  <div class="min-h-screen bg-purple-950 text-white">
    <!-- Main Content -->
    <main class="max-w-6xl mx-auto px-4 py-8">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Series Info - Left and Middle Columns -->
        <div class="lg:col-span-2 bg-purple-600 rounded-xl p-6 relative overflow-hidden">
          <!-- Grid Background -->
          <div class="absolute inset-0 opacity-10">
            <div class="w-full h-full grid grid-cols-12 grid-rows-12">
              <div v-for="i in 144" :key="i" class="border border-white"></div>
            </div>
          </div>
          
          <div class="relative z-10">
            <div class="flex flex-col md:flex-row gap-6">
              <div class="md:w-1/2">
                <h1 class="text-3xl font-bold mb-4">{{ taleOnChainAccountData.title }}</h1>
                <p class="text-sm mb-6">
                  {{  fetchedIpfsFullContent }}
                  <!-- In a quiet village in ancient Java, a lonely old widow longs for a child. One day, she receives a magical cucumber seed from a mysterious hermit. From this golden cucumber, a baby girl is born—Timun Mas. -->
                </p>
                <div class="flex items-center gap-2">
                  <span class="text-sm text-gray-200">a series from</span>
                  <div class="flex items-center gap-1">
                    <div class="w-5 h-5 rounded-full bg-green-400"></div>
                    <span class="text-sm font-medium">{{ shortenAddress(taleOnChainAccountData.author.toString()) }}</span>
                  </div>
                </div>
              </div>
              <div class="md:w-1/2">
                <img 
                  :src="`https://gateway.pinata.cloud/ipfs/${taleOnChainAccountData.coverImageCid}`"
                  alt="The Story of Timun mas" 
                  class="w-full rounded-lg object-cover"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Stats - Right Column -->
        <div class="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6">
          <div class="flex items-center gap-2 mb-4">
            <span class="w-3 h-3 bg-green-500 rounded-full"></span>
            <span class="font-medium">Ongoing</span>
          </div>
          
          <!-- <div class="flex items-center gap-2 mb-6 text-sm text-gray-300">
            <span>Scheduled Upload</span>
            <div class="flex items-center gap-1">
              <span class="i-lucide-calendar text-sm"></span>
              <span>13th May 01:00 AM</span>
            </div>
          </div> -->
          
          <div class="flex justify-between items-center mb-4">
            <!-- <div class="flex items-center gap-2">
              <span class="font-medium">98K Views</span>
            </div> -->
            <div class="flex items-center">
              <!-- <div class="flex -space-x-1 mr-2">
                <div class="w-6 h-6 rounded-full border border-white bg-gray-300"></div>
                <div class="w-6 h-6 rounded-full border border-white bg-gray-400"></div>
                <div class="w-6 h-6 rounded-full border border-white bg-gray-500"></div>
              </div> -->
              <span class="bg-yellow-400 text-black text-xs px-2 py-1 rounded-full">{{ taleOnChainAccountData.likeCount }} Likes</span>
            </div>
          </div>
          
          <button @click="handleLikeEpisode(taleOnChainAccountData.taleId)" class="w-full bg-purple-600 hover:bg-purple-500 text-white py-3 rounded-lg font-medium transition">
            Like This
          </button>
        </div>
      </div>
      <EpisodeManager
        v-if="taleBackendDoc && taleOnChainPdaString && taleOnChainAccountData"
        :parentTale="{
            mongoId: taleBackendDoc._id,
            onChainPdaString: taleOnChainPdaString,
            onChainAccountData: taleOnChainAccountData
        }"
        :appUser="appUser"
        :userMintActivities="userMintActivities"
      />
      
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import { marked } from 'marked';
import { useWallet } from 'solana-wallets-vue';
import { Connection, PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import { Buffer } from 'buffer';

import EpisodeManager from '../components/EpisodeManager.vue';
const isLikingEpisode = ref({});
// --- Configuration ---
const TALES_API_BASE_URL = import.meta.env.VITE_APP_AUTH_API_URL || 'http://localhost:3000/api';
const AUTH_API_BASE_URL = TALES_API_BASE_URL;
const JWT_TOKEN_KEY = 'readium_fun_jwt_token';
const SOLANA_RPC_URL = import.meta.env.VITE_RPC_ENDPOINT || 'https://api.devnet.solana.com';

import idlFromFile from '../anchor/tale_story' // Adjust path as necessary
const PROGRAM_ID = new PublicKey(idlFromFile.address);
const idl = idlFromFile;
const PROGRAM_ID_NFT = new PublicKey("DJgfvt8jXgkXXkRx7CaFa9FJSXbcc1SALnfyCdXHZR1j")
// --- Wallet and Program ---
const wallet = useWallet();
const connection = new Connection(SOLANA_RPC_URL, "confirmed");
let provider;
let program;
let programNft;

// --- Reactive State ---
const taleOnChainAccountData = ref(null);
const taleOnChainPdaString = ref('');
const taleBackendDoc = ref(null); // Stores the MongoDB document for the tale
const isLoadingInitialData = ref(true);

const appUser = ref(null);
const isLoadingAppUser = ref(false);
const userMintActivities = ref([]); // Assuming this is fetched in fetchAppUser
// const isLoadingUserMints = ref(false); // If fetched separately
console.log(taleOnChainPdaString)
const fetchedIpfsFullContent = ref('');
const ipfsFullContentLoading = ref(false);
const ipfsFullContentError = ref('');
const viewUiMessage = ref({ text: '', type: 'info' });
const description = ref('')
const route = useRoute();
const router = useRouter();

// --- Watcher for wallet connection ---
watch(() => wallet.connected.value, (isConnected) => {
  if (isConnected && wallet.publicKey.value) {
    if (!program || provider?.wallet?.publicKey?.toBase58() !== wallet.publicKey.value.toBase58()) {
        if (wallet.wallet.value && wallet.wallet.value.adapter) {
             provider = new AnchorProvider(connection, wallet.wallet.value.adapter, AnchorProvider.defaultOptions());
             try {
                program = new Program(idl, provider);
                programNft = new Program(idl,provider)
                console.log("TaleDetailView: Anchor Program Initialized.");
             } catch (e) {
                console.error("TaleDetailView: Error initializing Anchor Program:", e);
                showViewUiMessage(`Failed to initialize on-chain program: ${e.message}`, "error");
                program = null; provider = null; return;
             }
        } else {
            console.error("TaleDetailView: Wallet adapter not available.");
            program = null; provider = null; return;
        }
    }
    if (program && route.params.id) { // route.params.id is the onChainTaleIdSeed
        loadAllTaleData(route.params.id);
    }
  } else {
    program = null; provider = null;
    taleOnChainAccountData.value = null; taleBackendDoc.value = null; fetchedIpfsFullContent.value = '';
  }
}, { immediate: true });

async function handleLikeEpisode(episodePdaString) {
    if (!program || !wallet.publicKey.value) {
        showUiMessage("Please connect your wallet to like an episode.", "warning");
        return;
    }
    isLikingEpisode.value = { ...isLikingEpisode.value, [episodePdaString]: true };
    // showUiMessage("Liking episode...", "loading", null, 0);
    try {
        const txSignature = await program.methods.likeTale()
            .accounts({
                episodeAccount: new PublicKey(episodePdaString),
                user: wallet.publicKey.value,
            })
            .rpc();
        // showUiMessage("Episode liked!", "success", txSignature);
        // Optimistically update or re-fetch
        const episodeIndex = fetchedOnChainEpisodes.value.findIndex(ep => ep.publicKey.toString() === episodePdaString);
        if (episodeIndex !== -1) {
            const currentLikes = fetchedOnChainEpisodes.value[episodeIndex].account.likeCount;
            // Ensure likeCount is treated as BN if it comes as such from chain, then convert for UI
            const newLikes = currentLikes instanceof BN ? currentLikes.add(new BN(1)) : new BN((Number(currentLikes) || 0) + 1);
            fetchedOnChainEpisodes.value[episodeIndex].account.likeCount = newLikes; // Update local state
        }
        // Or, for guaranteed consistency: await fetchAllEpisodeData();
    } catch (error) {
        console.error("Error liking episode:", error);
        let errorMsg = error.message || "Failed to like episode.";
        if (error.logs) errorMsg += ` Logs: ${error.logs.join(', ')}`;
        showUiMessage(errorMsg, "error", error.signature);
    } finally {
        isLikingEpisode.value = { ...isLikingEpisode.value, [episodePdaString]: false };
        if (uiMessage.value.type === 'loading') showUiMessage("","info");
    }
}

// --- Utility Functions ---
function showViewUiMessage(msg, type = 'info', duration = 5000) {
  viewUiMessage.value = { text: msg, type };
  if (duration > 0) setTimeout(() => { viewUiMessage.value = { text: '', type: 'info' }; }, duration);
}
const shortenAddress = (address, chars = 6) => address ? `${address.slice(0, chars)}...${address.slice(-chars)}` : '';
const setDefaultImage = (event) => { event.target.src = 'https://placehold.co/600x400/gray/white?text=Error'; };
const renderMarkdown = (markdownText) => markdownText ? marked(markdownText) : '';
const getStatusString = (statusNum) => (['Draft', 'Published', 'Archived'][statusNum] || 'Unknown');

// --- API Client ---
const apiClient = axios.create({ baseURL: TALES_API_BASE_URL });
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem(JWT_TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
apiClient.interceptors.response.use(
  response => response.data,
  error => {
    const msg = error.response?.data?.message || error.message || 'An API error occurred.';
    showViewUiMessage(msg, 'error'); // Use view-specific UI message
    return Promise.reject(error.response?.data || { message: msg, error });
  }
);

// --- Data Fetching ---
async function fetchAppUser() {
  const token = localStorage.getItem(JWT_TOKEN_KEY);
  if (!token || !wallet.connected.value) { appUser.value = null; userMintActivities.value = []; return; }
  isLoadingAppUser.value = true;
  try {
    const response = await apiClient.get('/auth/me'); // Assuming apiClient is for AUTH_API_BASE_URL
    if (response.success) { // Check if backend response has a success flag
      appUser.value = response.data;
      if (appUser.value?.walletAddress) await fetchUserMintActivities(appUser.value.walletAddress);
    } else {
      appUser.value = null; userMintActivities.value = []; localStorage.removeItem(JWT_TOKEN_KEY);
    }
  } catch (error) {
    console.error("TaleDetailView: Failed to fetch app user:", error);
    appUser.value = null; userMintActivities.value = [];
  } finally {
    isLoadingAppUser.value = false;
  }
}

async function fetchUserMintActivities(walletAddress) {
  if (!walletAddress) { userMintActivities.value = []; return; }
  // isLoadingUserMints.value = true; // If you have a separate loader for this
  try {
    const response = await apiClient.get(`/mint-activities/by-user/${walletAddress}`);
    userMintActivities.value = response.success ? response.data : [];
  } catch (error) {
    userMintActivities.value = [];
  } finally {
    // isLoadingUserMints.value = false;
  }
}

async function loadAllTaleData(onChainTaleIdSeedFromRoute) {
  if (!program) {
    showViewUiMessage("On-chain program not ready. Connect wallet.", "warning");
    isLoadingInitialData.value = false;
    return;
  }
  if (!onChainTaleIdSeedFromRoute) {
    showViewUiMessage("No Tale ID in route.", "error");
    isLoadingInitialData.value = false;
    return;
  }

  isLoadingInitialData.value = true;
  taleOnChainAccountData.value = null;
  taleBackendDoc.value = null;
  fetchedIpfsFullContent.value = '';
  ipfsFullContentError.value = '';
  taleOnChainPdaString.value = '';

  try {
    // 1. Fetch On-Chain Data
    const [pda, _bump] = PublicKey.findProgramAddressSync(
      [Buffer.from("tale"), Buffer.from(onChainTaleIdSeedFromRoute)], PROGRAM_ID
    );
    taleOnChainPdaString.value = pda.toString(); // Store the PDA string
    console.log(`Fetching on-chain tale data for PDA: ${taleOnChainPdaString.value}`);
    const fetchedTale = await program.account.tale.fetch(pda);
    console.log(fetchedTale)
    taleOnChainAccountData.value = fetchedTale;
    console.log("Fetched on-chain tale:", taleOnChainAccountData.value);

    // 2. Fetch Backend Document using onChainTaleIdSeed
    if (taleOnChainAccountData.value) { // Ensure on-chain data was fetched
      try {
        console.log(`Fetching backend tale doc for seed: ${onChainTaleIdSeedFromRoute}`);
        const backendResponse = await apiClient.get(`/tales/by-seed/${onChainTaleIdSeedFromRoute}`);
        if (backendResponse.success) {
          taleBackendDoc.value = backendResponse.data;
          console.log("Fetched backend tale doc:", taleBackendDoc.value);
        } else {
          // This is not necessarily a critical error if the backend link doesn't exist yet,
          // but it means tags and backend-managed images won't be available.
          console.warn(backendResponse.message || "Backend tale document not found for this on-chain tale.");
          showViewUiMessage("Backend details for this tale are not yet synced.", "info", 3000);
          // Initialize taleBackendDoc to an empty object or specific structure if needed by template
          taleBackendDoc.value = { _id: null, tags: [] }; // Provide a default structure
        }
      } catch (backendError) {
        console.error("Error fetching backend tale doc:", backendError);
        showViewUiMessage(`Could not load backend details: ${backendError.message || 'Unknown error'}`, "warning");
        taleBackendDoc.value = { _id: null, tags: [] }; // Default on error
      }
    }

    // 3. Fetch IPFS Content
    if (taleOnChainAccountData.value?.contentCid) {
      ipfsFullContentLoading.value = true;
      try {
        const ipfsResponse = await axios.get(`https://gateway.pinata.cloud/ipfs/${taleOnChainAccountData.value.contentCid}`);
        fetchedIpfsFullContent.value = typeof ipfsResponse.data === 'string' ? ipfsResponse.data : JSON.stringify(ipfsResponse.data, null, 2);
      } catch (ipfsError) {
        console.error("Error fetching full content from IPFS:", ipfsError);
        ipfsFullContentError.value = "Could not load full tale content from IPFS.";
        fetchedIpfsFullContent.value = "Content not available.";
      } finally {
        ipfsFullContentLoading.value = false;
      }
    } else {
      fetchedIpfsFullContent.value = "No content CID found for this tale.";
    }
    if(taleOnChainAccountData.value) showViewUiMessage("Tale details loaded.", "success", 2000);

  } catch (error) {
    console.error(`Error loading all tale data for ID ${onChainTaleIdSeedFromRoute}:`, error);
    taleOnChainAccountData.value = null;
    taleBackendDoc.value = null;
    fetchedIpfsFullContent.value = '';
    showViewUiMessage(`Failed to load tale: ${error.message}`, "error");
  } finally {
    isLoadingInitialData.value = false;
  }
}
function goBack() {
  if (window.history.length > 2) {
    router.go(-1);
  } else {
    router.push({ name: 'Home' });
  }
}

// --- Lifecycle Hooks and Watchers ---
onMounted(async () => {
  if (typeof window !== 'undefined' && !window.Buffer) { window.Buffer = Buffer; }
  await fetchAppUser();
  // Initial tale data load is triggered by the wallet watcher if wallet is already connected,
  // or by the route param watcher if program is already initialized.
  if (program && route.params.id) {
      loadAllTaleData(route.params.id);
  } else if (!program && wallet.connected.value && route.params.id) {
      console.log("TaleDetailView: Wallet connected on mount, program init pending via watcher.");
  }
});

watch(() => route.params.id, async (newId, oldId) => {
    if (newId && newId !== oldId && program) { // Fetch only if ID changes AND program is ready
        await loadAllTaleData(newId);
    }
}, { immediate: false }); // Don't run immediately, onMounted and wallet watcher handle initial

watch(() => wallet.publicKey.value, (newPk, oldPk) => {
    if (newPk?.toBase58() !== oldPk?.toBase58()) {
        fetchAppUser(); // Re-fetch user if wallet pk changes
    }
});

</script>

<style scoped>
/* Styles are largely similar to the previous TaleDetailView, with minor adjustments */
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
  background-color: #fff1f2;
  color: #991b1b;
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
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
}
.status-published {
  background-color: #def7ec; /* bg-green-100 */
  color: #057a55; /* text-green-700 */
}
.dark .status-published {
  background-color: #059669; /* dark:bg-green-700 */
  color: #a7f3d0; /* dark:text-green-100 */
}
.status-draft {
  background-color: #fef3c7; /* bg-yellow-100 */
  color: #92400e; /* text-yellow-700 */
}
.dark .status-draft {
  background-color: #b45309; /* dark:bg-yellow-700 */
  color: #fde68a; /* dark:text-yellow-100 */
}
.status-archived {
  background-color: #e5e7eb; /* bg-gray-200 */
  color: #4b5563; /* text-gray-700 */
}
.dark .status-archived {
  background-color: #4b5568; /* dark:bg-gray-600 */
  color: #e5e7eb; /* dark:text-gray-200 */
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
.error-box {
  margin-top: 0.5rem; padding: 0.75rem; background-color: #fee2e2; color: #b91c1c; border-radius: 0.375rem; border: 1px solid #fecaca;
}
.dark .error-box { background-color: rgba(153, 27, 27, 0.3); color: #fca5a5; border-color: rgba(220, 38, 38, 0.5); }

</style>
