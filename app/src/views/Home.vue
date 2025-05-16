<template>
  <div class="home-view">
    <header class="home-header">
      <h1 class="main-title">Welcome to Readium Fun!</h1>
      <p class="subtitle">Discover, create, and collect amazing tales on-chain.</p>
    </header>

    <div class="auth-prompt-section" v-if="!appUser && !isLoadingUser && !wallet.connected.value">
       <p>Connect your wallet to get started.</p>
       <div class="wallet-button-wrapper">
           <WalletMultiButton />
       </div>
    </div>
    <div class="auth-prompt-section" v-else-if="!appUser && !isLoadingUser && wallet.connected.value">
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
      <h2 class="section-title">Explore Published On-Chain Tales</h2>
       <button @click="fetchPublishedOnChainTales" :disabled="isLoadingTales || !wallet.connected.value" class="btn btn-info refresh-button">
        {{ isLoadingTales ? 'Loading...' : 'Refresh Tales' }}
      </button>
      <div v-if="isLoadingTales" class="loading-indicator">
        <div class="spinner"></div>
        <p>Loading tales from the blockchain...</p>
      </div>
      <div v-else-if="publishedTales.length === 0 && wallet.connected.value" class="info-box no-tales-info">
        No tales have been published on-chain yet.
      </div>
      <div v-else-if="!wallet.connected.value" class="info-box no-tales-info">
        Please connect your wallet to view on-chain tales.
      </div>
      <div v-else class="tales-grid">
        <div v-for="tale in publishedTales" :key="tale.publicKey.toString()" class="tale-card">
          <img v-if="tale.account.coverImageCid" :src="`https://gateway.pinata.cloud/ipfs/${tale.account.coverImageCid}`" @error="setDefaultImage" alt="Tale Cover" class="tale-cover-image"/>
          <img v-else src="https://placehold.co/600x400/gray/white?text=No+Image" alt="Default Tale Cover" class="tale-cover-image"/>
          <div class="tale-card-content">
            <h3 class="tale-title">{{ tale.account.title }}</h3>
            <p class="tale-meta">Author: {{ shortenAddress(tale.account.author.toString()) }}</p>
            <p class="tale-meta">Genre: {{ tale.account.genre }}</p>
            <div class="tale-tags">
                </div>
            <button @click="openPreviewModal(tale)" class="btn btn-info read-more-button">
              Read Preview
            </button>
          </div>
        </div>

       
      </div>
      <div v-for="creator in creator" :key="creator._id" class="tale-card">
          <!-- <img v-if="tale.account.coverImageCid" :src="`https://gateway.pinata.cloud/ipfs/${tale.account.coverImageCid}`" @error="setDefaultImage" alt="Tale Cover" class="tale-cover-image"/> -->
          <!-- <img v-else src="https://placehold.co/600x400/gray/white?text=No+Image" alt="Default Tale Cover" class="tale-cover-image"/> -->
          <div class="tale-card-content">
            <h3 class="tale-title">{{ creator.name}}</h3>
            <p class="tale-meta">Story: {{ creator.storyCount }}</p>
            <p class="tale-meta">NFT: {{ creator.nftCount }}</p>
            <div class="tale-tags">
                </div>
            <button @click="openPreviewModal(tale)" class="btn btn-info read-more-button">
              Read Preview
            </button>
          </div>
        </div>
    </section>

    <section class="inspired-nfts-section" style="margin-top: 3rem;">
      <h2 class="section-title">Get Inspired by Other Creators</h2>
      <div v-if="isLoadingInspiredNfts" class="loading-indicator">
        <div class="spinner"></div>
        <p>Loading NFTs...</p>
      </div>
      <div v-else-if="inspiredNftsError" class="error-box">{{ inspiredNftsError }}</div>
      <div v-else-if="inspiredNfts.length === 0" class="info-box no-tales-info">
        No NFTs have been minted yet.
      </div>
      <div v-else class="inspired-nfts-grid">
        <NFTCard
          v-for="nft in inspiredNfts"
          :key="nft.nftMintAddress"
          :nft="{
            mint: nft.nftMintAddress,
            name: nft.tale?.title || nft.episode?.episodeName || 'Untitled',
            description: nft.tale?.description || '',
            metadata: { image: nft.tale?.coverImage || '' },
            creator: nft.user?.name || nft.userWalletAddress,
            price: nft.price || null
          }"
          :showBuyButton="false"
        >
          <template #actions>
            <button class="btn btn-info w-full mt-2">Mint & Get Special Access</button>
          </template>
        </NFTCard>
      </div>
    </section>

    <div v-if="viewingTale" class="modal-overlay">
      <div class="modal-content">
        <h2 class="modal-title">{{ viewingTale.account.title }}</h2>
        <img v-if="viewingTale.account.coverImageCid" :src="`https://gateway.pinata.cloud/ipfs/${viewingTale.account.coverImageCid}`" @error="setDefaultImage" alt="Tale Cover" class="modal-cover-image"/>
        <p class="modal-meta">Author: {{ shortenAddress(viewingTale.account.author.toString()) }}</p>
        <p class="modal-meta">Genre: {{ viewingTale.account.genre }} | Status: {{ getStatusString(viewingTale.account.status) }}</p>
        <div class="prose-styles modal-prose">
            <p><strong>Content Preview (from IPFS):</strong></p>
            <div v-if="ipfsContentLoading" class="spinner"></div>
            <div v-else-if="ipfsContentError" class="error-box">{{ ipfsContentError }}</div>
            <div v-else class="line-clamp-10" v-html="renderMarkdown(fetchedIpfsContent)"></div>
        </div>
        <button @click="navigateToTaleDetailAndCloseModal(viewingTale.account.taleId)" class="btn btn-primary modal-action-button">
          View Full Tale & Episodes
        </button>
        <button @click="viewingTale = null; fetchedIpfsContent = ''; ipfsContentError = '';" class="btn btn-secondary modal-action-button">Close Preview</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useWallet, WalletMultiButton } from 'solana-wallets-vue';
import { Connection, PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import axios from 'axios';
import { marked } from 'marked';
import NFTCard from '../components/NFTCard.vue';
import apiService from '../services/apiService';
import taleNftIdl from '../anchor/tale_nft.json';

// --- Configuration ---
const AUTH_API_BASE_URL = import.meta.env.VITE_APP_AUTH_API_URL || 'http://localhost:3000/api';
const JWT_TOKEN_KEY = 'readium_fun_jwt_token';
const SOLANA_RPC_URL = import.meta.env.VITE_RPC_ENDPOINT || 'https://api.devnet.solana.com';

// **IMPORTANT**: Import your actual IDL file.
import idlFromFile from '../anchor/tale_story' // Adjust path as necessary
const PROGRAM_ID = new PublicKey("HoSn8RTHXrJmTgw5Wc6XMQDDVdvhuj2VUg6HVtVtPjXe"); // Your Program ID
const idl = idlFromFile;
import idlFromFileNft from '../anchor/tale_nft' // Adjust path as necessary
const READIUM_FUN_PROGRAM_ID_NFT = new PublicKey("DJgfvt8jXgkXXkRx7CaFa9FJSXbcc1SALnfyCdXHZR1j"); // Your Program ID from IDL
const idlNft = idlFromFileNft
// --- Wallet and Program ---
const wallet = useWallet();
const connection = new Connection(SOLANA_RPC_URL, "confirmed");
let provider;
let program;
let programNft;
// --- Component State ---
const appUser = ref(null);
const listUser = ref(null)
const isLoadingUser = ref(false);
const allOnChainTales = ref([]); // Stores all tales fetched
const isLoadingTales = ref(false);
const viewingTale = ref(null);
const fetchedIpfsContent = ref('');
const ipfsContentLoading = ref(false);
const ipfsContentError = ref('');
const listEpisode = ref(null)
const uiMessage = ref({ text: '', type: 'info' });
const inspiredNfts = ref([]);
const isLoadingInspiredNfts = ref(false);
const inspiredNftsError = ref('');

// --- Computed Properties ---
const publishedTales = computed(() => {
  return allOnChainTales.value.filter(tale => tale.account.status === 1); // 1 for Published
});


const creator = computed(()=>{
  const list = listUser?.value?.filter(user => user.type === 'creator')
  
  const result_functional = list?.map(item_a => {
  // 1. Find relevant items from items_c based on item_a.walletAddress
  const relevant_c_items = publishedTales?.value?.filter(item_c => item_c.account.author.toString() === item_a.walletAddress);
  
  // The count for the 'json_c_functional' field in the output
  const count_for_output_c = relevant_c_items?.length;

  // 2. Find relevant items from items_b based on the relevant_c_items
  let count_for_output_b = 0;
  
  relevant_c_items?.forEach(relevant_c_item => {
    const related_b_items_for_this_c = listEpisode.value?.filter(item_b => 
      item_b.account.parentTale.toString() === relevant_c_item.publicKey.toString() && item_b.account.isNft
    );
    count_for_output_b += related_b_items_for_this_c.length;
  });

  return {
    _id: item_a._id,
    walletAddress: item_a.walletAddress,
    storyCount: count_for_output_c, // Name from your 'iwant' example
    nftCount: count_for_output_b,  // Name from your 'iwant' example
    ...item_a
  };
});
  // const episode = listEpisode.value.map(episode => list.map(user => user.walletAddress))
  return result_functional
})

// --- Watcher for wallet connection ---
watch(() => wallet.connected.value, (isConnected, wasConnected) => {
  if (isConnected && wallet.publicKey.value) {
    if (!program || provider?.wallet?.publicKey?.toBase58() !== wallet.publicKey.value.toBase58()) {
        if (wallet.wallet.value && wallet.wallet.value.adapter) {
             provider = new AnchorProvider(connection, wallet.wallet.value.adapter, AnchorProvider.defaultOptions());
             try {
                program = new Program(idl, provider);
                programNft = new Program(idlNft,provider)
                console.log("HomeView: Anchor Program Initialized.");
             } catch (e) {
                console.error("HomeView: Error initializing Anchor Program:", e);
                showUiMessage(`Failed to initialize on-chain program: ${e.message}`, "error");
                program = null; provider = null; return;
             }
        } else {
            console.error("HomeView: Wallet adapter not available.");
            showUiMessage("Wallet adapter missing.", "error");
            program = null; provider = null; return;
        }
    }
    if (program) fetchPublishedOnChainTales();
  } else {
    program = null; provider = null;
    if (wasConnected === true && !isConnected) {
        allOnChainTales.value = [];
    }
  }
}, { immediate: true });

// --- Utility Functions ---
function showUiMessage(msg, type = 'info', duration = 4000) {
  uiMessage.value = { text: msg, type };
  if (duration > 0) setTimeout(() => { uiMessage.value = { text: '', type: 'info' }; }, duration);
}
const shortenAddress = (address, chars = 6) => address ? `${address.slice(0, chars)}...${address.slice(-chars)}` : '';
const setDefaultImage = (event) => { event.target.src = 'https://placehold.co/600x400/gray/white?text=Error'; };
const renderMarkdown = (markdownText) => markdownText ? marked(markdownText) : '';
const getStatusString = (statusNum) => (['Draft', 'Published', 'Archived'][statusNum] || 'Unknown');

// --- API Client for Auth ---
const authApiClient = axios.create({ baseURL: AUTH_API_BASE_URL });
authApiClient.interceptors.request.use(config => {
  const token = localStorage.getItem(JWT_TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// --- Data Fetching ---
async function fetchAppUser() {
  const token = localStorage.getItem(JWT_TOKEN_KEY);
  if (!token || !wallet.connected.value) { appUser.value = null; return; }
  isLoadingUser.value = true;
  try {
    const response = await authApiClient.get('/auth/me');
    appUser.value = response.data.success ? response.data.data : null;
    if (!response.data.success) localStorage.removeItem(JWT_TOKEN_KEY);
  } catch (error) {
    console.error("HomeView: Failed to fetch app user:", error);
    appUser.value = null; localStorage.removeItem(JWT_TOKEN_KEY);
  } finally {
    isLoadingUser.value = false;
  }
}

async function fetchUser() {
  try {
    const response = await authApiClient.get('/users');
    listUser.value = response.data.success ? response.data.data : null
  } catch (error) {
    console.error("HomeView: Failed to fetch app user:", error);
    // appUser.value = null; localStorage.removeItem(JWT_TOKEN_KEY);
  } finally {
    isLoadingUser.value = false;
  }
}

async function fetchPublishedOnChainTales() {
  if (!program) {
    if (wallet.connected.value) showUiMessage("On-chain program not ready.", "warning");
    allOnChainTales.value = [];
    return;
  }
  isLoadingTales.value = true;
  try {
    const accounts = await program.account.tale.all();
    const nft = await program.account.episode.all();
    listEpisode.value = nft
    // Filter for published tales (status === 1) client-side
    allOnChainTales.value = accounts
        // .filter(tale => tale.account.status === 1) // Filter for published status
        .sort((a, b) => Number(b.account.timestamp) - Number(a.account.timestamp));
    if (publishedTales.value.length > 0) {
      showUiMessage(`Fetched ${publishedTales.value.length} published on-chain tales.`, "success", 2000);
    } else if (accounts.length > 0) {
      showUiMessage("Fetched on-chain tales, but none are currently published.", "info", 3000);
    } else {
      // showUiMessage("No on-chain tales found for this program yet.", "info", 3000);
    }
  } catch (error) {
    console.error('HomeView: Error fetching on-chain tales:', error);
    showUiMessage(`Error fetching tales: ${error.message}`, "error");
    allOnChainTales.value = [];
  } finally {
    isLoadingTales.value = false;
  }
}

async function openPreviewModal(tale) {
  viewingTale.value = tale;
  fetchedIpfsContent.value = '';
  ipfsContentError.value = '';
  if (tale.account.contentCid) {
    ipfsContentLoading.value = true;
    try {
      const response = await axios.get(`https://gateway.pinata.cloud/ipfs/${tale.account.contentCid}`);
      fetchedIpfsContent.value = typeof response.data === 'string' ? response.data : JSON.stringify(response.data, null, 2);
    } catch (error) {
      console.error("HomeView: Error fetching IPFS content for preview:", error);
      ipfsContentError.value = "Could not load content preview from IPFS.";
    } finally {
      ipfsContentLoading.value = false;
    }
  } else {
    fetchedIpfsContent.value = "No content CID provided for this tale's preview.";
  }
}

const router = useRouter();
function navigateToTaleDetailAndCloseModal(taleIdOnChain) { // taleIdOnChain is the string ID
  viewingTale.value = null;
  fetchedIpfsContent.value = '';
  ipfsContentError.value = '';
  router.push({ name: 'TaleDetail', params: { id: taleIdOnChain } });
}

// --- On-chain MintActivity Fetch ---
async function fetchInspiredNftsOnChain() {
  isLoadingInspiredNfts.value = true;
  inspiredNftsError.value = '';
  try {
    // Use a read-only provider (no wallet needed for fetching)
    const readOnlyProvider = new AnchorProvider(connection, wallet.wallet.value?.adapter || wallet, AnchorProvider.defaultOptions());
    console.log("Tale NFT Program ID:", taleNftIdl);
    
    const taleNftProgram = new Program(taleNftIdl, readOnlyProvider);

    // Fetch all MintActivity accounts on-chain
    const mintActivities = await taleNftProgram.account.mintActivity.all();

    console.log("Mint Activities:", mintActivities);
    

    // Optionally filter for only public/ready NFTs (status === 1)
    const publicNfts = mintActivities.filter(item => item.account.status === 1);

    // Map to your NFTCard format
    inspiredNfts.value = publicNfts.map(item => ({
      mint: item.account.nftMintAddress.toString(),
      name: 'Minted NFT', // TODO: Fetch real name from NFT metadata if needed
      description: `Minted by: ${item.account.userWallet.toString()}`,
      metadata: { image: '' }, // TODO: Fetch image from NFT metadata if needed
      creator: item.account.userWallet.toString(),
      candyMachineId: item.account.candyMachineId.toString(),
      status: item.account.status,
      timestamp: item.account.timestamp,
      transactionSignature: item.account.transactionSignature,
    }));
  } catch (e) {
    inspiredNftsError.value = e.message || 'Failed to fetch NFTs from chain.';
  } finally {
    isLoadingInspiredNfts.value = false;
  }
}

// --- Lifecycle Hooks ---
watch(() => wallet.publicKey.value, (newVal, oldVal) => {
    if (newVal?.toBase58() !== oldVal?.toBase58()) {
        fetchAppUser(); // Re-fetch user if wallet pk changes
    }
});

onMounted(() => {
  fetchAppUser(); // Fetch user on mount
  fetchUser()
  fetchInspiredNftsOnChain();
  // fetchPublishedOnChainTales is called by the wallet watcher when program is ready
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
  margin-bottom: 1rem; /* mb-4, reduced from mb-6 */
  color: #374151; /* text-gray-700 */
}
.dark .section-title {
  color: #e5e7eb; /* dark:text-gray-200 */
}

/* Wallet Connection & Auth Prompt */
.wallet-button-wrapper { display: flex; justify-content: center; margin-bottom: 1rem; }
.auth-prompt-section {
  margin-bottom: 2rem; /* mb-8 */
  text-align: center;
  padding: 1rem;
  background-color: #f9fafb;
  border-radius: 0.5rem;
}
.dark .auth-prompt-section { background-color: #1f2937;}
.auth-prompt-section p { margin-bottom: 0.75rem; }
.auth-button {
  font-size: 1rem; /* text-base */
  padding-left: 1.25rem; /* px-5 */
  padding-right: 1.25rem;
  padding-top: 0.625rem; /* py-2.5 */
  padding-bottom: 0.625rem;
}

/* Welcome User Section */
.welcome-user-section {
  margin-bottom: 1.5rem; padding: 1rem; background-color: #eff6ff;
  border-radius: 0.5rem; text-align: center; color: #1d4ed8;
}
.dark .welcome-user-section { background-color: rgba(30, 58, 138, 0.3); color: #93c5fd; }
.user-name { font-weight: 600; }
.manage-tales-link { font-weight: 600; text-decoration: underline; margin-left: 0.5rem; }
.manage-tales-link:hover { color: #2563eb; }
.dark .manage-tales-link:hover { color: #60a5fa; }


/* UI Message */
.ui-message { margin-top: 1rem; margin-bottom: 1rem; padding: 0.75rem; border-radius: 0.375rem; text-align: center; font-size: 0.875rem; }
.ui-message-info { background-color: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }
.dark .ui-message-info { background-color: rgba(30, 58, 138, 0.3); color: #93c5fd; border-color: rgba(59, 130, 246, 0.5); }
.ui-message-success { background-color: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }
.dark .ui-message-success { background-color: rgba(22, 101, 52, 0.3); color: #86efac; border-color: rgba(34, 197, 94, 0.5); }
.ui-message-error { background-color: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
.dark .ui-message-error { background-color: rgba(153, 27, 27, 0.3); color: #fca5a5; border-color: rgba(220, 38, 38, 0.5); }


/* Tales List Section */
.tales-list-section { margin-top: 2.5rem; }
.refresh-button { margin-bottom: 1rem; }
.loading-indicator { text-align: center; padding: 1.5rem; }
.loading-indicator p { margin-top: 0.5rem; color: #4b5563; }
.dark .loading-indicator p { color: #d1d5db; }
.no-tales-info { text-align: center; padding: 1rem; background-color: #f3f4f6; border-radius: 0.375rem; margin-top: 1rem;}
.dark .no-tales-info { background-color: #374151; }

.tales-grid { display: grid; grid-template-columns: repeat(1, minmax(0, 1fr)); gap: 1.5rem; }
@media (min-width: 768px) { .tales-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (min-width: 1024px) { .tales-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }

/* Tale Card */
.tale-card {
  background-color: #ffffff; border-radius: 0.5rem;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);
  overflow: hidden; display: flex; flex-direction: column;
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
}
.dark .tale-card { background-color: #1f2937; }
.tale-card:hover { transform: translateY(-0.25rem); box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04); }
.tale-cover-image { width: 100%; height: 12rem; object-fit: cover; }
.tale-card-content { padding: 1rem; display: flex; flex-direction: column; flex-grow: 1; }
.tale-title { font-size: 1.25rem; font-weight: 600; margin-bottom: 0.5rem; color: #1f2937; }
.dark .tale-title { color: #f9fafb; }
.tale-meta { font-size: 0.875rem; color: #6b7280; margin-bottom: 0.25rem; overflow-wrap: anywhere;}
.dark .tale-meta { color: #9ca3af; }
.tale-tags { margin-bottom: 0.75rem; }
.tag {
  display: inline-block; background-color: #e5e7eb; border-radius: 9999px;
  padding: 0.25rem 0.75rem; font-size: 0.75rem; font-weight: 600;
  color: #374151; margin-right: 0.5rem; margin-bottom: 0.5rem;
}
.dark .tag { background-color: #374151; color: #e5e7eb; }
.read-more-button { margin-top: auto; width: 100%; }

/* Modal Styles */
.modal-overlay { position: fixed; inset: 0; background-color: rgba(0,0,0,0.75); display: flex; align-items: center; justify-content: center; padding: 1rem; z-index: 60; }
.modal-content {
  background-color: #ffffff; padding: 1.5rem; border-radius: 0.5rem;
  box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05);
  width: 100%; max-width: 42rem; max-height: 90vh; overflow-y: auto;
}
.dark .modal-content { background-color: #1f2937; }
.modal-title { font-size: 1.875rem; font-weight: 700; margin-bottom: 1rem; color: #1f2937; }
.dark .modal-title { color: #f9fafb; }
.modal-cover-image { width: 100%; height: 16rem; object-fit: cover; border-radius: 0.375rem; margin-bottom: 1rem; }
.modal-meta { font-size: 0.875rem; color: #6b7280; margin-bottom: 0.25rem; }
.dark .modal-meta { color: #9ca3af; }
.modal-tags { margin-bottom: 1rem; }
.modal-action-button { width: 100%; margin-top: 0.75rem; }
.modal-action-button:first-of-type { margin-top: 1rem; }


/* Prose Styles & Line Clamp */
.prose-styles { max-width: none; margin-bottom: 1rem; }
.dark .prose-styles { color: #d1d5db; }
.dark .prose-styles :deep(h1), .dark .prose-styles :deep(h2), .dark .prose-styles :deep(h3), .dark .prose-styles :deep(h4), .dark .prose-styles :deep(strong) { color: #f9fafb; }
.dark .prose-styles :deep(a) { color: #93c5fd; }
.dark .prose-styles :deep(blockquote) { border-left-color: #4b5568; color: #9ca3af; }
.dark .prose-styles :deep(code) { background-color: #374151; color: #e5e7eb; }
.dark .prose-styles :deep(pre) { background-color: #111827; }
.line-clamp-10 {
  overflow: hidden; text-overflow: ellipsis; display: -webkit-box;
  -webkit-line-clamp: 10; /* number of lines to show */
  -webkit-box-orient: vertical;
}


/* Spinner */
.spinner { display: inline-block; width: 2rem; height: 2rem; border-width: 4px; border-top-color: #4f46e5; border-right-color: transparent; border-bottom-color: transparent; border-left-color: transparent; border-radius: 9999px; animation: spin 1s linear infinite; }
.dark .spinner { border-top-color: #818cf8; }
@keyframes spin { to { transform: rotate(360deg); } }

/* General Button Styles */
.btn { padding: 0.5rem 1rem; border: 1px solid transparent; border-radius: 0.375rem; box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05); font-size: 0.875rem; font-weight: 500; color: #ffffff; cursor: pointer; transition: background-color 0.15s ease-in-out; }
.btn:focus { outline: 2px solid transparent; outline-offset: 2px; }
.btn:disabled { cursor: not-allowed; opacity: 0.7; }
.btn-primary { background-color: #4f46e5; } .btn-primary:hover { background-color: #4338ca; }
.dark .btn-primary { background-color: #6366f1; } .dark .btn-primary:hover { background-color: #818cf8; }
.btn-secondary { background-color: #6b7280; } .btn-secondary:hover { background-color: #4b5563; }
.dark .btn-secondary { background-color: #4b5568; } .dark .btn-secondary:hover { background-color: #374151; }
.btn-info { background-color: #3b82f6; } .btn-info:hover { background-color: #2563eb; }
.dark .btn-info { background-color: #3b82f6; } .dark .btn-info:hover { background-color: #60a5fa; }
.link { color: #4f46e5; text-decoration: underline; } .link:hover { color: #4338ca; }
.dark .link { color: #818cf8; } .dark .link:hover { color: #a78bfa; }

.error-box {
  margin-top: 0.5rem; padding: 0.75rem; background-color: #fee2e2; color: #b91c1c; border-radius: 0.375rem; border: 1px solid #fecaca;
}
.dark .error-box { background-color: rgba(153, 27, 27, 0.3); color: #fca5a5; border-color: rgba(220, 38, 38, 0.5); }

.inspired-nfts-section {
  margin-bottom: 2.5rem;
}
.inspired-nfts-grid {
  display: grid;
  grid-template-columns: repeat(1, minmax(0, 1fr));
  gap: 1.5rem;
}
@media (min-width: 768px) {
  .inspired-nfts-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (min-width: 1024px) {
  .inspired-nfts-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

</style>
