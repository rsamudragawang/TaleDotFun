<template>
  <div class="home-view">
    <div class="circle-bg"></div>
    <div class="flex gap-8">
      <div class="flex-6 bg-white rounded-lg p-1">
        <div class="flex items-end w-full h-[365px] rounded-lg text-3xl text-white p-4"
          style="background-image: url(/public/images/bg_header_1.png); background-size: cover; background-repeat: no-repeat;">
          Your Gateway to Cultural<br> Webcomics & Digital Collectibles
        </div>
      </div>
      <div class="flex-4 bg-white rounded-lg p-1">
        <div
          class="border-6 from-[#23172c] to-[#38007e] bg-linear-to-t h-full rounded-lg border-black flex text-center flex-col items-center justify-center">
          <div class="p-8 flex flex-col items-center justify-center gap-4">
            <img src="/public/icons/card.svg" alt="">
            <h1 class="text-[24px] text-white">Explore Cultural Collectibles That Tell
              a Story</h1>
          </div>
        </div>
      </div>
    </div>

    <div
      class="bg-gradient-to-r from-[#2f196e] to-[#4a2ba7] flex flex-col items-center text-center justify-center rounded-lg p-4 mt-4 gap-4"
      v-if="!appUser && !isLoadingUser && !wallet.connected.value">
      <p class="text-white text-2xl">Connect your wallet to get started.</p>
      <div class="wallet-button-wrapper">
        <WalletMultiButton />
      </div>
    </div>
    <div class="mt-4 flex items-center justify-center" v-else-if="!appUser && !isLoadingUser && wallet.connected.value">
      <router-link :to="{ name: 'Auth' }" class="btn btn-primary auth-button">
        Login / Register to Create & Manage Tales
      </router-link>
    </div>
    <div v-if="appUser" class="welcome-user-section mt-4">
      <p>
        Welcome back, <span class="user-name">{{ appUser.name }}</span>!
        <span v-if="appUser.type === 'creator'">
          <router-link :to="{ name: 'Tales' }" class="link manage-tales-link">Manage Your Tales</router-link>
        </span>
      </p>
    </div>

    <div v-if="uiMessage.text" :class="['ui-message', `ui-message-${uiMessage.type}`]">
      {{ uiMessage.text }}
    </div>

    <div class="mt-8">
      <div class="flex justify-center gap-4">
        <Button label="Recommendation" severity="contrast" icon="pi pi-bolt" @click="activeTab = 0"
          :pt="activeTab !== 0 ? { 'root': '!bg-transparent !border-color-transparent !text-white' } : {}" />
        <Button label="Featured" severity="contrast" icon="pi pi-crown" @click="activeTab = 1"
          :pt="activeTab !== 1 ? { 'root': '!bg-transparent !border--transparent !text-white' } : {}" />
        <Button label="Popular" severity="contrast" icon="pi pi-globe" @click="activeTab = 2"
          :pt="activeTab !== 2 ? { 'root': '!bg-transparent !border-color-transparent !text-white' } : {}" />
      </div>
      <Tabs :value="activeTab">
        <TabPanels :pt="{ 'root': '!bg-transparent !border-color-transparent' }">
          <TabPanel header="Featured" :value="0">
            <div class="grid grid-cols-12 gap-4 mt-8">
              <div 
                class="col-span-12 md:col-span-6 lg:col-span-3"
                v-for="tale in featuredTales" 
                :key="tale.publicKey.toString()"
                @click="goToSeriesDetail(tale.account.taleId)"
                style="cursor: pointer;"
              >
                <div class="rounded-lg p-4 bg-gradient-to-b from-[#372754] to-[#2a1d40]">
                  <div class="bg-[#43B4CA] rounded-lg p-8 relative">
                    <img src="/public/icons/grid.svg" alt="" class="absolute top-[4%] right-[8%] w-[85%] z-0">
                    <img :src="tale.account.thumbnailCid ? `https://gateway.pinata.cloud/ipfs/${tale.account.thumbnailCid}` : '/public/images/comic_1.png'" alt="Featured Content"
                      class="w-full h-[250px] mx-auto rounded-lg object-cover object-center z-10 relative">
                    <div class="flex justify-between mt-5 relative z-10">
                      <div class="text-white text-xs p-2 bg-[rgba(0,0,0,0.4)] rounded-full border">{{ tale.chapterCount }} Chapters</div>
                      <div class="relative">
                        <div
                          class="absolute right-0 top-0 font-bold min-w-[80px] text-xs text-black rounded-full bg-[#DBB106] px-2 py-2 border-white border">
                          {{ formatLikeCount(tale.likeCount) }} Likes
                        </div>
                      </div>
                    </div>
                  </div>
                  <p class="text-medium text-lg mt-4">{{ tale.account.title }}</p>
                  <div class="flex w-fit text-sm justify-start mt-4 p-1 px-3 items-center gap-4 bg-slate-800 rounded-full">
                    <img src="/public/icons/nft.svg" alt="" class="w-[20px] h-[20px]">
                    <p>{{ tale.nftCount }} NFTs Collection</p>
                  </div>
                </div>
              </div>
            </div>
          </TabPanel>
          <TabPanel header="Popular" :value="1">
            <div class="p-4">
              <h3 class="text-xl text-white mb-4">Popular Content</h3>
              <p class="text-gray-300">See what's trending in our community of creators and collectors.</p>
            </div>
          </TabPanel>
          <TabPanel header="New" :value="2">
            <div class="p-4">
              <h3 class="text-xl text-white mb-4">New Arrivals</h3>
              <p class="text-gray-300">Check out the latest tales and collectibles added to our platform.</p>
            </div>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </div>

    <div class="mt-[48px] pt-[48px] border-t border-white">
      <h1 class="text-white text-2xl">Trending Author</h1>
      <div v-if="trendingAuthorsToShow.length === 0" class="text-slate-400 text-center py-8">
        No trending authors yet.
      </div>
      <Carousel 
        v-else
        :value="trendingAuthorsToShow" 
        :numVisible="Math.min(3, trendingAuthorsToShow.length)" 
        :numScroll="1" 
        :responsiveOptions="responsiveOptions"
        :autoplayInterval="3000"
        :circular="true"
        class="-mx-[60px] mt-[20px]"
        @mouseenter="carouselPaused = true"
        @mouseleave="carouselPaused = false"
      >
        <template #item="slotProps">
          <div
            :key="slotProps"
            class="mx-2 rounded-lg"
            style="background-color: rgba(0, 0, 0, 0.5);"
          >
            <div class="h-[75px] rounded-t-lg relative"
              style="background-image: url(/public/icons/community_card.svg); background-size: cover; background-repeat: no-repeat; background-position: center;">
              <Tag severity="success" value="Favorite Author" class="absolute" style="right:5px; top: 5px" />
            </div>
            <div class="relative p-4">
              <img :src="slotProps?.data?.avatar || `https://ui-avatars.com/api/?rounded=true&bold=true&name=${encodeURIComponent(slotProps?.data?.name || 'User')}`" 
                :alt="slotProps?.data?.name || 'Author'"
                class="w-[64px] h-[64px] rounded-full translate-y-[-40px]">
              <div class="-mt-5">
                <h1 class="text-lg">{{ slotProps.data.name || 'Unknown Author' }}</h1>
                <div class="flex gap-4 py-4">
                  <p class="text-sm">{{ slotProps.data.storyCount || 0 }} Stories</p>
                  <p class="text-sm">{{ slotProps.data.nftCount || 0 }} NFTs Launched</p>
                </div>
                <Button class="w-full" severity="secondary">See Profile</Button>
              </div>
            </div>
          </div>
        </template>
       
      </Carousel>
    </div>

    <div class="mt-[120px]">
      <div class="flex gap-[80px]">
        <div class="flex-1">
          <h1 class="text-white text-3xl">Celebrate Cultural Stories and Empower Local Creators with Our Unique NFT
            Collection</h1>
          <p class="text-slate-400 mt-6">Dive into a world where tradition meets innovation. At taledotfun , we bring
            cultural tales to life through
            digital storytelling and support local creators by turning their stories into unique NFTs — preserving
            heritage
            while empowering creativity.
          </p>
        </div>
        <div class="flex-2">
          <Galleria :value="[1, 2, 3, 4]" :responsiveOptions="responsiveOptions" :numVisible="1" :circular="true"
            containerStyle="w-full" :showItemNavigators="true" :showThumbnails="false"
            :pt="{ root: '!border-color-transparent', 'prevButton': 'relative z-10', 'nextButton': 'relative z-10' }">
            <template #item="slotProps">
              <div class="bg-[#171717] px-[100px] py-[30px]">
                <img src="/public/icons/circular.svg" alt="" class="absolute left-0 top-0 z-0">
                <img src="/public/icons/grid_2.svg" alt="" class="absolute right-0 top-0 z-0">
                {{ slotProps.item }}
                <h1 class="text-white text-3xl mt-[100px]">Discover Authentic Cultural Stories</h1>
                <p class="text-slate-400 mt-4">Explore handpicked tales rooted in tradition, passed down through
                  generations, and brought to life
                  with digital creativity.</p>
              </div>
            </template>
          </Galleria>
        </div>
      </div>
    </div>

    <div class="mt-[120px] pt-[48px] border-t border-white">
      <div class="flex items-center justify-between">
        <h1 class="text-white text-2xl">Engaging NFTs from Creator</h1>
        <router-link to="/launch-nft" class="text-slate-400 hover:underline cursor-pointer flex items-center">
          See all <i class="pi pi-arrow-right ml-4"></i>
        </router-link>
      </div>
      <div class="grid grid-cols-12 gap-[24px]">
        <div v-for="(nft, i) in listedNfts.slice(0, 4)" :key="i" class="col-span-3 rounded-lg mt-5" style="background-color: rgba(0, 0, 0, 0.5);">
          <img :src="nft.image" alt="NFT Image" style="height:400px;width:100%;height:auto;object-fit:cover;">
          <div class="relative p-4">
            <div class="mt-5">
              <h1 class="text-lg">{{ nft.name }}</h1>
              <div class="flex gap-4 py-4 justify-between items-center">
                <div class="flex gap-2 items-center">
                  <img src="/public/icons/solana.svg" alt="solana">
                  <p class="text-slate-400">{{ nft.price ? nft.price.toLocaleString(undefined, { maximumFractionDigits: 3 }) : '-' }} SOL</p>
                </div>
                <div class="flex gap-2 items-center">
                  <i class="pi pi-user"></i>
                  <p class="text-slate-400">{{ nft.itemsRemaining || 0 }}/{{ nft.itemsAvailable || 0 }}</p>
                </div>
              </div>
              <div class="pt-4 mt-6 border-t border-white">
                <div class="flex items-center justify-between">
                  <p class="text-slate-400">a story from</p>
                  <div class="flex gap-2 items-center">
                    <img :src="nft.creatorAvatar" alt="avatar" class="w-6 h-6 rounded-full">
                    <p class="text-slate-400">{{ nft.creatorName }}</p>
                  </div>
                </div>
              </div>
              <Button class="w-full mt-4" severity="secondary">Mint & Get Special Access</Button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <section class="tales-list-section hidden">
      <h2 class="section-title">Explore Published On-Chain Tales</h2>
      <button @click="fetchPublishedOnChainTales" :disabled="isLoadingTales || !wallet.connected.value"
        class="btn btn-info refresh-button">
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
          <img v-if="tale.account.coverImageCid"
            :src="`https://gateway.pinata.cloud/ipfs/${tale.account.coverImageCid}`" @error="setDefaultImage"
            alt="Tale Cover" class="tale-cover-image" />
          <img v-else src="https://placehold.co/600x400/gray/white?text=No+Image" alt="Default Tale Cover"
            class="tale-cover-image" />
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

    <div v-if="viewingTale" class="modal-overlay">
      <div class="modal-content">
        <h2 class="modal-title">{{ viewingTale.account.title }}</h2>
        <img v-if="viewingTale.account.coverImageCid"
          :src="`https://gateway.pinata.cloud/ipfs/${viewingTale.account.coverImageCid}`" @error="setDefaultImage"
          alt="Tale Cover" class="modal-cover-image" />
        <p class="modal-meta">Author: {{ shortenAddress(viewingTale.account.author.toString()) }}</p>
        <p class="modal-meta">Genre: {{ viewingTale.account.genre }} | Status: {{
          getStatusString(viewingTale.account.status) }}</p>
        <div class="prose-styles modal-prose">
          <p><strong>Content Preview (from IPFS):</strong></p>
          <div v-if="ipfsContentLoading" class="spinner"></div>
          <div v-else-if="ipfsContentError" class="error-box">{{ ipfsContentError }}</div>
          <div v-else class="line-clamp-10" v-html="renderMarkdown(fetchedIpfsContent)"></div>
        </div>
        <button @click="navigateToTaleDetailAndCloseModal(viewingTale.account.taleId)"
          class="btn btn-primary modal-action-button">
          View Full Tale & Episodes
        </button>
        <button @click="viewingTale = null; fetchedIpfsContent = ''; ipfsContentError = '';"
          class="btn btn-secondary modal-action-button">Close Preview</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import Tabs from 'primevue/tabs';
import TabPanels from 'primevue/tabpanels';
import TabPanel from 'primevue/tabpanel';
import Button from 'primevue/button';
import Avatar from 'primevue/avatar';
import AvatarGroup from 'primevue/avatargroup';
import Carousel from 'primevue/carousel';
import Tag from 'primevue/tag';
import Galleria from 'primevue/galleria';

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
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { walletAdapterIdentity } from '@metaplex-foundation/umi-signer-wallet-adapters';
import { mplCandyMachine, fetchCandyMachine } from '@metaplex-foundation/mpl-candy-machine';
import taleStoryIdl from '../anchor/tale_story.json';
import { publicKey as umiPublicKey } from '@metaplex-foundation/umi';

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
const activeTab = ref(0);
const responsiveOptions = ref([
  {
    breakpoint: '1400px',
    numVisible: 2,
    numScroll: 1
  },
  {
    breakpoint: '1199px',
    numVisible: 3,
    numScroll: 1
  },
  {
    breakpoint: '767px',
    numVisible: 2,
    numScroll: 1
  },
  {
    breakpoint: '575px',
    numVisible: 1,
    numScroll: 1
  }
]);
const listedNfts = ref([]);
const isLoadingListedNfts = ref(false);
const inspiredNftsError = ref('');
const TALE_STORY_PROGRAM_ID = new PublicKey('6fDFNzPWHCpGfNBKJsEhxvRxaTSxvRptc9rtSQmmFQo2');
const taleStoryProgram = ref(null);
const featuredTales = ref([]);
const trendingAuthors = ref([]);
const isLoadingAuthors = ref(true);
const carouselPaused = ref(false);

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

  console.log("count_for_output_b", count_for_output_b);
  

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

async function fetchListedNftsWithMetadata() {
  
  try {
    const provider = new AnchorProvider(connection, wallet.wallet?.value?.adapter || {publicKey: PublicKey.default, signTransaction: async () => {}, signAllTransactions: async () => {}}, AnchorProvider.defaultOptions());
    const program = new Program(taleNftIdl, provider);
    const allListed = await program.account.listedNft.all();
    const umi = createUmi(SOLANA_RPC_URL).use(mplCandyMachine());
    console.log("allListed", allListed);
    listedNfts.value = await Promise.all(
      allListed.map(async (item) => {
        let cmData = null;
        let name = '';
        let image = 'https://placehold.co/326x327';
        let price = null;
        let itemsAvailable = null;
        let itemsMinted = null;
        let itemsRemaining = null;
        let metadata = null;
        try {
          cmData = await fetchCandyMachine(umi, umiPublicKey(item.account.candyMachineAddress.toString()));
          if (cmData.items && cmData.items.length > 0 && cmData.items[0].name) {
            name = cmData.items[0].name;
          } else if (cmData.data.name) {
            name = cmData.data.name;
          }
          if (cmData.header.lamports.basisPoints) {
            price = Number(cmData.header.lamports.basisPoints) / 1_000_000_000;
          } else if (cmData.configLineSettings && cmData.configLineSettings.prefixName){
            name = cmData.configLineSettings.prefixName;
          }
          itemsAvailable = Number(cmData.data.itemsAvailable);
          itemsMinted = Number(cmData.itemsRedeemed);
          itemsRemaining = itemsAvailable - itemsMinted;
          if (cmData.items && cmData.items.length > 0 && cmData.items[0].uri) {
            try {
              const response = await fetch(cmData.items[0].uri.replace(/^https?:\/\/arweave.net\//, 'https://ar-io.dev/'));
              if (response.ok) {
                metadata = await response.json();
                if (metadata.image) {
                  image = metadata.image.replace(/^https?:\/\/arweave.net\//, 'https://ar-io.dev/');
                }
              }
            } catch (fetchErr) {}
          }
        } catch (cmErr) {}
        let creatorName = item.account.creatorWallet.toString().substring(0,6) + "...";
        let creatorAvatar = `https://ui-avatars.com/api/?rounded=true&bold=true&name=${encodeURIComponent(item.account.creatorWallet.toString().substring(0,2))}`;
        try {
          const res = await axios.get(`${AUTH_API_BASE_URL}/wallet/address/${item.account.creatorWallet.toString()}`);
          if (res.data && res.data.data) {
            creatorName = res.data.data.name || item.account.creatorWallet.toString();
            creatorAvatar = res.data.data.avatar || `https://ui-avatars.com/api/?rounded=true&bold=true&name=${encodeURIComponent(creatorName)}`;
          }
        } catch (axiosErr) {
          console.error("HomeView: Error fetching creator info:", axiosErr);
        }
        return {
          name: name || 'Untitled NFT Collection',
          image,
          price,
          itemsAvailable,
          itemsMinted,
          itemsRemaining,
          creatorName,
          creatorAvatar,
          candyMachineAddress: item.account.candyMachineAddress.toString(),
          isMinting: false
        };
      })
    );
  } catch (e) {
    console.error("Failed to fetch listed NFTs:", e);
    listedNfts.value = [];
  }
}

// --- Lifecycle Hooks ---
watch(() => wallet.publicKey.value, (newVal, oldVal) => {
  if (newVal?.toBase58() !== oldVal?.toBase58()) {
    fetchAppUser(); // Re-fetch user if wallet pk changes
  }
});

onMounted(() => {
  fetchAppUser();
  fetchUser();
  fetchListedNftsWithMetadata();
  fetchFeaturedTales();
  fetchTrendingAuthors();
  // fetchPublishedOnChainTales is called by the wallet watcher when program is ready
});

function formatLikeCount(count) {
  if (count >= 1000) return (count / 1000).toFixed(1) + 'K';
  return count;
}

async function fetchFeaturedTales() {
  try {
    const provider = new AnchorProvider(connection, wallet.wallet.value?.adapter || wallet, AnchorProvider.defaultOptions());
    const taleStoryProgram = new Program(taleStoryIdl, provider);
    const allTales = await taleStoryProgram.account.tale.all();
    const allEpisodes = await taleStoryProgram.account.episode.all();

    // Only published
    const publishedTales = allTales.filter(t => t.account.status === 1);
    // Sort by timestamp descending
    publishedTales.sort((a, b) => Number(b.account.timestamp) - Number(a.account.timestamp));
    // Take up to 4
    const talesToShow = publishedTales.slice(0, 4);

    for (const tale of talesToShow) {
      // Chapters
      tale.chapterCount = allEpisodes.filter(e => e.account.parentTale.toBase58() === tale.publicKey.toBase58()).length;
      // NFTs
      tale.nftCount = allEpisodes.filter(e => e.account.parentTale.toBase58() === tale.publicKey.toBase58() && e.account.isNft).length;
      // Like count
      tale.likeCount = tale.account.likeCount || 0;
      // Author info
      try {
        const res = await fetch(`${AUTH_API_BASE_URL}/wallet/address/${tale.account.author.toBase58()}`);
        if (res.ok) {
          const { data } = await res.json();
          tale._authorName = data.name;
          tale._avatars = [data.avatar];
        } else {
          tale._authorName = tale.account.author.toBase58();
          tale._avatars = [];
        }
      } catch {
        tale._authorName = tale.account.author.toBase58();
        tale._avatars = [];
      }
    }
    featuredTales.value = talesToShow;
  } catch (e) {
    featuredTales.value = [];
    console.error('Failed to fetch featured tales:', e);
  }
}

async function fetchTrendingAuthors() {
  try {
    isLoadingAuthors.value = true;
    // Fetch users from backend
    const response = await authApiClient.get('/users');
    console.log('Users API Response:', response.data);
    const users = response.data.success ? response.data.data : [];
    console.log('Parsed Users:', users);
    
    // Fetch on-chain data
    const provider = new AnchorProvider(connection, wallet.wallet.value?.adapter || wallet, AnchorProvider.defaultOptions());
    const taleStoryProgram = new Program(taleStoryIdl, provider);
    const allTales = await taleStoryProgram.account.tale.all();
    const allEpisodes = await taleStoryProgram.account.episode.all();
    console.log('On-chain Tales:', allTales);
    console.log('On-chain Episodes:', allEpisodes);

    // Calculate stories and NFTs for each user
    const authorsWithStats = users.map(user => {
      if (!user || !user.walletAddress) {
        console.log('Skipping user due to missing data:', user);
        return null;
      }

      const userTales = allTales.filter(tale => 
        tale.account.author.toBase58() === user.walletAddress && 
        tale.account.status === 1 // Only published tales
      );
      
      const userNfts = allEpisodes.filter(episode => 
        episode.account.author.toBase58() === user.walletAddress && 
        episode.account.isNft
      );

      console.log(`User ${user.name} stats:`, {
        walletAddress: user.walletAddress,
        storyCount: userTales.length,
        nftCount: userNfts.length
      });

      return {
        ...user,
        storyCount: userTales.length,
        nftCount: userNfts.length,
        avatar: user.avatar || `https://ui-avatars.com/api/?rounded=true&bold=true&name=${encodeURIComponent(user.name || 'User')}`
      };
    }).filter(Boolean); // Remove any null entries

    console.log('Authors with stats:', authorsWithStats);

    // Sort by story count and take top 5
    trendingAuthors.value = authorsWithStats
      .filter(author => author.storyCount > 0)
      .sort((a, b) => b.storyCount - a.storyCount)
      .slice(0, 5);

    console.log('Final trending authors:', trendingAuthors.value);

  } catch (error) {
    console.error('Failed to fetch trending authors:', error);
    trendingAuthors.value = [];
  } finally {
    isLoadingAuthors.value = false;
  }
}

const trendingAuthorsToShow = computed(() => {
  const arr = trendingAuthors.value;
  if (arr.length === 0) return [];
  if (arr.length >= 3) return arr;
  // Duplicate items to reach at least 3
  let result = [];
  while (result.length < 3) {
    result = result.concat(arr);
  }
  return result.slice(0, 3);
});

const goToSeriesDetail = (id) => {
  router.push(`/detail-series/${id}`);
};

</script>

<style>
.circle-bg {
  position: fixed;
  top: 65px;
  left: 0;
  width: 100%;
  height: 100vh;
  /* Adjust height as needed */
  background-color: rgba(16, 12, 24, 0.0);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: -1;
}

.circle-bg::before {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 1000px;
  height: 1000px;
  transform: translate(-50%, -50%);
  background: radial-gradient(circle,
      rgb(61, 12, 222) 0%,
      /* center glow (purple-blue) */
      rgb(46, 4, 98) 40%,
      /* soft blue blend */
      rgba(16, 12, 24, 0.0) 70%
      /* blend into your background */
    );
  border-radius: 50%;
  animation: pulse 4s infinite ease-in-out;
  z-index: 0;
}

@keyframes pulse {
  0% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0.6;

  }

  50% {
    transform: translate(-50%, -50%) scale(1.15);
    opacity: 0.3;

  }

  100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0.6;
  }
}
</style>

<style scoped>
/* General Styles */
.home-header {
  margin-bottom: 2rem;
  /* mb-8 */
  text-align: center;
}

.main-title {
  font-size: 2.25rem;
  /* text-4xl */
  line-height: 2.5rem;
  font-weight: 700;
  /* font-bold */
  color: #1f2937;
  /* text-gray-800 */
}

.dark .main-title {
  color: #f9fafb;
  /* dark:text-white */
}

.subtitle {
  font-size: 1.125rem;
  /* text-lg */
  line-height: 1.75rem;
  color: #4b5563;
  /* text-gray-600 */
  margin-top: 0.5rem;
  /* mt-2 */
}

.dark .subtitle {
  color: #9ca3af;
  /* dark:text-gray-400 */
}

.section-title {
  font-size: 1.5rem;
  /* text-2xl */
  line-height: 2rem;
  font-weight: 600;
  /* font-semibold */
  margin-bottom: 1rem;
  /* mb-4, reduced from mb-6 */
  color: #374151;
  /* text-gray-700 */
}

.dark .section-title {
  color: #e5e7eb;
  /* dark:text-gray-200 */
}

/* Wallet Connection & Auth Prompt */
.wallet-button-wrapper {
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
}

.dark .auth-prompt-section {
  background-color: #1f2937;
}

.auth-prompt-section p {
  margin-bottom: 0.75rem;
}

.auth-button {
  font-size: 1rem;
  /* text-base */
  padding-left: 1.25rem;
  /* px-5 */
  padding-right: 1.25rem;
  padding-top: 0.625rem;
  /* py-2.5 */
  padding-bottom: 0.625rem;
}

/* Welcome User Section */
.welcome-user-section {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background-color: #eff6ff;
  border-radius: 0.5rem;
  text-align: center;
  color: #1d4ed8;
}

.dark .welcome-user-section {
  background-color: rgba(30, 58, 138, 0.3);
  color: #93c5fd;
}

.user-name {
  font-weight: 600;
}

.manage-tales-link {
  font-weight: 600;
  text-decoration: underline;
  margin-left: 0.5rem;
}

.manage-tales-link:hover {
  color: #2563eb;
}

.dark .manage-tales-link:hover {
  color: #60a5fa;
}


/* UI Message */
.ui-message {
  margin-top: 1rem;
  margin-bottom: 1rem;
  padding: 0.75rem;
  border-radius: 0.375rem;
  text-align: center;
  font-size: 0.875rem;
}

.ui-message-info {
  background-color: #eff6ff;
  color: #1d4ed8;
  border: 1px solid #bfdbfe;
}

.dark .ui-message-info {
  background-color: rgba(30, 58, 138, 0.3);
  color: #93c5fd;
  border-color: rgba(59, 130, 246, 0.5);
}

.ui-message-success {
  background-color: #f0fdf4;
  color: #166534;
  border: 1px solid #bbf7d0;
}

.dark .ui-message-success {
  background-color: rgba(22, 101, 52, 0.3);
  color: #86efac;
  border-color: rgba(34, 197, 94, 0.5);
}

.ui-message-error {
  background-color: #fef2f2;
  color: #b91c1c;
  border: 1px solid #fecaca;
}

.dark .ui-message-error {
  background-color: rgba(153, 27, 27, 0.3);
  color: #fca5a5;
  border-color: rgba(220, 38, 38, 0.5);
}


/* Tales List Section */
.tales-list-section {
  margin-top: 2.5rem;
}

.refresh-button {
  margin-bottom: 1rem;
}

.loading-indicator {
  text-align: center;
  padding: 1.5rem;
}

.loading-indicator p {
  margin-top: 0.5rem;
  color: #4b5563;
}

.dark .loading-indicator p {
  color: #d1d5db;
}

.no-tales-info {
  text-align: center;
  padding: 1rem;
  background-color: #f3f4f6;
  border-radius: 0.375rem;
  margin-top: 1rem;
}

.dark .no-tales-info {
  background-color: #374151;
}

.tales-grid {
  display: grid;
  grid-template-columns: repeat(1, minmax(0, 1fr));
  gap: 1.5rem;
}

@media (min-width: 768px) {
  .tales-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1024px) {
  .tales-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

/* Tale Card */
.tale-card {
  background-color: #ffffff;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
}

.dark .tale-card {
  background-color: #1f2937;
}

.tale-card:hover {
  transform: translateY(-0.25rem);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.tale-cover-image {
  width: 100%;
  height: 12rem;
  object-fit: cover;
}

.tale-card-content {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

.tale-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #1f2937;
}

.dark .tale-title {
  color: #f9fafb;
}

.tale-meta {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
  overflow-wrap: anywhere;
}

.dark .tale-meta {
  color: #9ca3af;
}

.tale-tags {
  margin-bottom: 0.75rem;
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

.read-more-button {
  margin-top: auto;
  width: 100%;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  z-index: 60;
}

.modal-content {
  background-color: #ffffff;
  padding: 1.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  width: 100%;
  max-width: 42rem;
  max-height: 90vh;
  overflow-y: auto;
}

.dark .modal-content {
  background-color: #1f2937;
}

.modal-title {
  font-size: 1.875rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: #1f2937;
}

.dark .modal-title {
  color: #f9fafb;
}

.modal-cover-image {
  width: 100%;
  height: 16rem;
  object-fit: cover;
  border-radius: 0.375rem;
  margin-bottom: 1rem;
}

.modal-meta {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
}

.dark .modal-meta {
  color: #9ca3af;
}

.modal-tags {
  margin-bottom: 1rem;
}

.modal-action-button {
  width: 100%;
  margin-top: 0.75rem;
}

.modal-action-button:first-of-type {
  margin-top: 1rem;
}


/* Prose Styles & Line Clamp */
.prose-styles {
  max-width: none;
  margin-bottom: 1rem;
}

.dark .prose-styles {
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

.line-clamp-10 {
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 10;
  /* number of lines to show */
  -webkit-box-orient: vertical;
}


/* Spinner */
.spinner {
  display: inline-block;
  width: 2rem;
  height: 2rem;
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
  to {
    transform: rotate(360deg);
  }
}

/* General Button Styles */
.btn {
  padding: 0.5rem 1rem;
  border: 1px solid transparent;
  border-radius: 0.375rem;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
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

.btn-primary {
  background-color: #4f46e5;
}

.btn-primary:hover {
  background-color: #4338ca;
}

.dark .btn-primary {
  background-color: #6366f1;
}

.dark .btn-primary:hover {
  background-color: #818cf8;
}

.btn-secondary {
  background-color: #6b7280;
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

.btn-info {
  background-color: #3b82f6;
}

.btn-info:hover {
  background-color: #2563eb;
}

.dark .btn-info {
  background-color: #3b82f6;
}

.dark .btn-info:hover {
  background-color: #60a5fa;
}

.link {
  color: #4f46e5;
  text-decoration: underline;
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

.error-box {
  margin-top: 0.5rem;
  padding: 0.75rem;
  background-color: #fee2e2;
  color: #b91c1c;
  border-radius: 0.375rem;
  border: 1px solid #fecaca;
}

.dark .error-box {
  background-color: rgba(153, 27, 27, 0.3);
  color: #fca5a5;
  border-color: rgba(220, 38, 38, 0.5);
}

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
