<template>
    <div class="circle-bg"></div>
    <div class="home-view mt-8">
        <div class="flex gap-8">
            <div class="flex-2 p-8 bg-[#BB3FDA] rounded-lg relative z-10 overflow-hidden">
                <img src="/public/icons/grid.svg" alt="grid"
                    class="absolute -top-10 -right-10 w-[319px] h-[319px] -z-1">
                <div class="flex gap-8 items-center">
                    <div class="flex-3">
                        <h1 class="text-white text-4xl font-bold">{{ taleOnChainAccountData.title }}</h1>
                        <p class="text-white text-sm mt-2">
													{{  fetchedIpfsFullContent }}
                        </p>
                    </div>
                    <div class="flex-2">
                        <img :src="`https://gateway.pinata.cloud/ipfs/${taleOnChainAccountData.coverImageCid}`" alt="timun-mas" class="rounded-lg">
                    </div>
                </div>
                <p class="text-white/60 text-sm mt-4">a series from</p>
                <div class="flex gap-2 mt-2">
                    <img :src="`https://gateway.pinata.cloud/ipfs/${taleOnChainAccountData.coverImageCid}`" alt="profile" class="w-6 h-6 rounded-full">
                    <p class="text-white text-sm">{{ shortenAddress(taleOnChainAccountData.author.toString()) }}</p>
                </div>
            </div>
            <div class="flex-1 py-6 px-4 bg-white/5 rounded-lg flex flex-col">
                <div class="flex items-center gap-2">
                    <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                    <p class="text-white text-base font-bold">Ongoing</p>
                </div>
                <!-- <div class="flex items-center gap-2 justify-between py-4">
                    <p class="text-white text-sm">Scheduled Upload</p>
                    <div class="flex items-center gap-2">
                        <i class="pi pi-calendar"></i>
                        <p class="text-white/40 text-sm">2025-05-17 <span class="text-white">01:00 AM</span></p>
                    </div>
                </div> -->
                <div class="rounded-lg border border-black/40 p-4 bg-black/40 flex-1 flex flex-col justify-between">
                    <div class="flex items-center gap-2 justify-between">
                        <!-- <div class="bg-black rounded-full py-1 px-2 text-white text-sm border border-white">98K Views
                        </div> -->
                        <div
                            class="bg-yellow-500 rounded-full font-medium py-1 px-2 text-black text-sm border border-white">
                            {{ taleOnChainAccountData.likeCount }}
                            Likes</div>
                    </div>
                    <Button @click="handleLikeEpisode(taleOnChainPdaString)" label="Like This" class="w-full mt-4" />
                </div>
            </div>
        </div>
        <!-- <div class="mt-[50px]">
            <div class="flex gap-4">
                <div class="flex-3">
                    <div class="flex items-center gap-8">
                        <h1 class="text-white text-2xl font-bold">Chapter Lists</h1>
                        <div class="bg-[#BB3FDA]/20 py-1 px-2 text-white rounded-full text-sm border border-slate-400">7
                            Chapter
                        </div>
                    </div>
                    <div class="mt-6 rounded-lg bg-gradient-to-r from-[#372754] to-[#2a1d40/50] p-4 border border-white/5"
                        v-for="i in 7" :key="i">
                        <div class="flex items-center gap-2 justify-between">
                            <div class="flex items-center gap-4">
                                <img src="/public/images/comic_1.png" alt="comic"
                                    class="w-[64px] h-[64px] object-cover rounded-lg">
                                <div>
                                    <div class="flex items-center gap-8">
                                        <div
                                            class="bg-[#BB3FDA] py-1 px-2 text-white rounded-full text-sm border border-white">
                                            Chapter {{ (7 - i) + 1 }}</div>
                                        <div class="flex items-center gap-2">
                                            <i class="pi pi-calendar"></i>
                                            <p class="text-white/40 text-sm">13 May</p>
                                        </div>
                                    </div>
                                    <h1 class="text-white text-lg font-bold mt-2">Pertarungan Ajaib</h1>
                                </div>
                            </div>
                            <div class="flex items-center gap-4">
                                <div class="px-4 py-1 bg-white/5 rounded-full font-medium">150 Votes</div>
                                <img src="/public/icons/checklist.svg" alt="checklist" class="w-6 h-6">
                            </div>
                        </div>
                    </div>
                </div>
                <div class="flex-2">
                    <h1 class="text-white text-2xl font-bold">NFTs Collection</h1>
                    <div
                        class="mt-6 rounded-lg bg-gradient-to-r from-[#372754] to-[#2a1d40/20] p-4 flex items-center gap-8 justify-between border border-white/5">
                        <p class="text-slate-400 text-sm">Total</p>
                        <div class="w-[50%] h-[2px] bg-slate-400/5 rounded-full"></div>
                        <div class="flex items-center gap-2">
                            <img src="/public/icons/nft.svg" alt="nft" class="w-6 h-6">
                            <p class="text-white text-sm">3 NFTs</p>
                        </div>
                    </div>
                    <div class="bg-[#1F1F1F] rounded-lg p-4 mt-8">
                        <div class="relative">
                            <img src="/public/images/nft_chromatic.png" class="w-full">
                            <div class="absolute bottom-4 right-4 text-white text-lg p-4 bg-black/80 rounded-lg">
                                The Heroic With Timun
                            </div>
                        </div>
                        <Button label="Mint Now" class="w-full mt-4" />
                    </div>
                </div>
            </div>

        </div> -->
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
    </div>
</template>

<script setup>
import Button from 'primevue/button';
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
                taleAccount: new PublicKey(episodePdaString),
                user: wallet.publicKey.value,
            })
            .rpc();
        // showUiMessage("Episode liked!", "success", txSignature);
        // Optimistically update or re-fetch
        // const episodeIndex = taleOnChainAccountData.value.findIndex(ep => ep.publicKey.toString() === episodePdaString);
        // if (episodeIndex !== -1) {
        //     const currentLikes = taleOnChainAccountData.value[episodeIndex].account.likeCount;
        //     // Ensure likeCount is treated as BN if it comes as such from chain, then convert for UI
        //     const newLikes = currentLikes instanceof BN ? currentLikes.add(new BN(1)) : new BN((Number(currentLikes) || 0) + 1);
        //     taleOnChainAccountData.value[episodeIndex].account.likeCount = newLikes; // Update local state
        // }
				loadAllTaleData(route.params.id);
        // Or, for guaranteed consistency: await fetchAllEpisodeData();
    } catch (error) {
        console.error("Error liking episode:", error);
        let errorMsg = error.message || "Failed to like episode.";
        if (error.logs) errorMsg += ` Logs: ${error.logs.join(', ')}`;
        // showUiMessage(errorMsg, "error", error.signature);
    } finally {
        isLikingEpisode.value = { ...isLikingEpisode.value, [episodePdaString]: false };
        // if (uiMessage.value.type === 'loading') showUiMessage("","info");
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