<template>
  <div class="episode-manager-container">
    <h2 class="main-section-title">
      Episodes for "{{ parentTale?.onChainAccountData?.title || 'Tale' }}"
    </h2>

    <div v-if="isAuthorOfParentTale" class="add-episode-button-container">
      <button @click="openEpisodeModal()" class="btn btn-primary">
        + Add New Episode
      </button>
    </div>

    <div v-if="uiMessage.text"
         :class="['ui-message', `ui-message-${uiMessage.type}`]">
      {{ uiMessage.text }}
    </div>

    <div v-if="showEpisodeModal" class="modal-overlay">
      <div class="modal-content-wrapper">
        <h3 class="modal-title">
          {{ currentEpisodeForm.editingExistingOnChainEpisode ? 'Edit Episode' : 'Create New Episode' }}
        </h3>
        <form @submit.prevent="handleSaveEpisode" class="modal-form">
          <div class="form-group">
            <label for="episodeName" class="form-label">Episode Name (On-Chain):</label>
            <input type="text" id="episodeName" v-model="currentEpisodeForm.episodeName" class="form-input" required maxlength="100" />
          </div>

          <div class="nft-linking-section">
            <label class="form-label checkbox-label">
              <input type="checkbox" v-model="currentEpisodeForm.isNft" @change="toggleNftSectionInForm" class="form-checkbox" />
              This episode is linked to an NFT
            </label>
          </div>

          <div v-if="currentEpisodeForm.isNft" class="nft-details-section">
            <div v-if="currentEpisodeForm.candyMachineId && !showCandyMachineCreatorFormInModal" class="cm-id-display-wrapper">
                <label class="form-label">Associated Candy Machine ID (On-Chain):</label>
                <input type="text" :value="currentEpisodeForm.candyMachineId" class="form-input form-input-readonly" readonly />
                <button type="button" @click="triggerCandyMachineSetupInModal(true)" class="btn btn-warning btn-xs edit-cm-button">
                    Edit/Recreate CM
                </button>
            </div>
            <div v-else-if="showCandyMachineCreatorFormInModal" class="cm-creator-wrapper">
                <p class="cm-creator-prompt">
                    Setting up a new Candy Machine for: <strong>{{ currentEpisodeForm.episodeName }}</strong>
                </p>
                <CandyMachineCreator
                    :parentTale="parentTale.onChainAccountData"
                    :currentEpisodeNameFromParent="currentEpisodeForm.episodeName"
                    :episodeImageForNft="uploadedEpisodeImageForNftModal"
                    :episodeDescriptionForNft="currentEpisodeForm.contentMarkdown"
                    :isWalletManagedExternally="true"
                    @candyMachineCreated="handleCandyMachineCreatedInModal"
                    @cancelCandyMachineCreation="showCandyMachineCreatorFormInModal = false"
                />
                <button type="button" @click="showCandyMachineCreatorFormInModal = false" class="btn btn-secondary cancel-cm-button">
                    Cancel CM Setup
                </button>
            </div>
            <div v-else class="cm-setup-options">
                <button type="button" @click="triggerCandyMachineSetupInModal(false)" class="btn btn-info btn-sm">
                    Setup New Candy Machine
                </button>
                <span class="cm-options-divider">OR</span>
                <input type="text" v-model="manualCandyMachineIdModal" class="form-input manual-cm-input" placeholder="Enter Existing CM ID" />
                <button type="button" @click="assignManualCandyMachineIdInModal" class="btn btn-secondary btn-sm assign-cm-button">Assign</button>
            </div>
          </div>

          <div class="content-fields-wrapper">
            <div class="form-group">
              <label for="episodeContent" class="form-label">Content (Markdown for IPFS):</label>
              <textarea id="episodeContent" v-model="currentEpisodeForm.contentMarkdown" class="form-textarea"></textarea>
            </div>
            <div class="image-upload-section">
              <label class="form-label">Episode Images (URLs/CIDs managed by backend, max 10):</label>
              <div v-for="(imgUrl, index) in currentEpisodeForm.images" :key="index" class="image-input-row">
                <input type="url" v-model="currentEpisodeForm.images[index]" class="form-input image-url-input" placeholder="https://gateway.pinata.cloud/ipfs/..." />
                <button type="button" @click="removeImageFieldInForm(index)" class="btn btn-danger btn-xs remove-image-button">Remove</button>
              </div>
              <button type="button" @click="addImageFieldInForm" v-if="currentEpisodeForm.images.length < 10" class="btn btn-secondary btn-sm add-image-button">
                + Add Image URL/CID
              </button>
              <div class="file-upload-wrapper">
                  <label for="episodeImageFilesModal" class="form-label">Or Upload New Images to Pinata:</label>
                  <input type="file" id="episodeImageFilesModal" @change="handleImageFilesChangeInModal" class="form-file-input" multiple accept="image/*" />
                  <small class="form-text">Selected files will be uploaded. URLs will be added above.</small>
                  <div v-if="isUploadingImagesModal" class="upload-indicator">
                      <span class="spinner-inline"></span> Uploading images...
                  </div>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label for="episodeOrder" class="form-label">Order (On-Chain):</label>
            <input type="number" id="episodeOrder" v-model.number="currentEpisodeForm.order" class="form-input" min="0" />
          </div>
          <div class="form-group">
            <label for="episodeStatus" class="form-label">Status (On-Chain):</label>
            <select id="episodeStatus" v-model.number="currentEpisodeForm.status" class="form-select">
              <option value="0">Draft</option>
              <option value="1">Published</option>
              <option value="2">Archived</option>
            </select>
          </div>

          <div class="modal-actions">
            <button type="button" @click="closeEpisodeModal" class="btn btn-secondary">Cancel</button>
            <button type="submit"
                    :disabled="isSavingEpisode || isUploadingImagesModal || (currentEpisodeForm.isNft && showCandyMachineCreatorFormInModal && !currentEpisodeForm.candyMachineId)"
                    class="btn btn-success">
              {{ isSavingEpisode ? 'Saving...' : (currentEpisodeForm.editingExistingOnChainEpisode ? 'Update Episode' : 'Create Episode') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="isLoadingEpisodes" class="loading-indicator-list">
      <div class="spinner"></div>
      <p>Loading episodes...</p>
    </div>
    <div v-else-if="combinedEpisodes.length === 0 && parentTale?.onChainAccountData" class="info-box no-episodes-message">
      This tale has no episodes yet.
      <span v-if="isAuthorOfParentTale"> Why not add the first one?</span>
    </div>
    <div v-else-if="!parentTale?.onChainAccountData" class="info-box no-episodes-message">
        Parent tale data not available. Ensure `TaleDetailView` is passing the correct `parentTale` prop.
    </div>
    <div v-else class="episodes-grid">
      <div v-for="episode in combinedEpisodes" :key="episode.onChainPda" class="episode-item">
        <div class="episode-item-content">
          <h4 class="episode-name">{{ episode.name }} (Order: {{episode.order !== undefined ? episode.order : 'N/A'}})</h4>
          
          <p v-if="!isContentLockedForDisplay(episode)" class="episode-description" v-html="episode.contentPreview ? renderMarkdownMini(episode.contentPreview) : 'No content preview.'"></p>
          <div v-else class="episode-locked-message">
            Full content available after minting this NFT episode.
            <router-link v-if="episode.isNft && episode.candyMachineId" :to="{ name: 'MintPage', params: { candyMachineAddress: episode.candyMachineId, episodeOnChainPda: episode.onChainPda } }" class="link mint-now-link">Mint Now</router-link>
          </div>

          <div class="episode-tags-container">
            <span v-if="episode.isNft" class="tag tag-nft">🔗 NFT-Linked</span>
            <span v-if="episode.isNft && episode.candyMachineId" class="tag tag-cm-ref">
              CM: {{shortenAddress(episode.candyMachineId, 4)}}
            </span>
            <span class="tag tag-status">{{ getStatusString(episode.status) }}</span>
             <span v-if="!episode.backendImagesSynced" class="tag tag-warning">Images Not Synced</span>
          </div>

          <div v-if="!isContentLockedForDisplay(episode) && episode.images && episode.images.length > 0" class="episode-image-gallery">
            <a v-for="(img, idx) in episode.images" :key="idx" :href="img" target="_blank" class="episode-image-link">
              <img :src="img" alt="Episode Image" class="episode-thumbnail" @error="setDefaultImage" />
            </a>
          </div>
           <div v-else-if="isContentLockedForDisplay(episode) && episode.images && episode.images.length > 0" class="episode-image-teaser">
            <img :src="episode.images[0]" @error="setDefaultImage" alt="Episode Thumbnail" class="episode-thumbnail episode-thumbnail-locked" />
            <small class="image-teaser-text">More images after mint.</small>
          </div>
        </div>
        <div v-if="isAuthorOfParentTale" class="episode-actions">
          <button @click="openEditModal(episode)" class="btn btn-warning btn-xs">Edit</button>
          <button @click="confirmDeleteCombinedEpisode(episode)" class="btn btn-danger btn-xs">Delete</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, defineProps } from 'vue';
import axios from 'axios';
import { marked } from 'marked';
import { useWallet, WalletMultiButton } from 'solana-wallets-vue';
import { Connection, PublicKey, SystemProgram } from '@solana/web3.js';
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import { Buffer } from 'buffer';
import { v4 as uuidv4 } from 'uuid';

import CandyMachineCreator from './CandyMachineCreator.vue';
import { uploadFileToIPFS, uploadTextToIPFS } from '../services/pinataService';

const props = defineProps({
  parentTale: {
    type: Object,
    required: true,
    validator: (value) => {
      return value &&
             typeof value.onChainPdaString === 'string' &&
             typeof value.onChainAccountData === 'object' &&
             value.onChainAccountData.author &&
             (value.mongoId === null || value.mongoId === undefined || typeof value.mongoId === 'string');
    }
  },
  appUser: { type: Object, default: null },
  userMintActivities: { type: Array, default: () => [] } // Kept for now, but primary check is on-chain
});

// --- Configuration ---
const API_BASE_URL = import.meta.env.VITE_APP_AUTH_API_URL || 'http://localhost:3000/api';
const JWT_TOKEN_KEY = 'readium_fun_jwt_token';
const SOLANA_RPC_URL = import.meta.env.VITE_RPC_ENDPOINT || 'https://api.devnet.solana.com';
import idlFromFile from './readium_fun.json'
const PROGRAM_ID = new PublicKey("EynuKneQ6RX5AAUY8E6Lq6WvNrUVY2F3C8TcFNB7MYh8");
const idl = idlFromFile;
const MAX_ONCHAIN_EPISODE_ID_SEED_LENGTH = 32;

// --- Wallet and Program ---
const wallet = useWallet();
const connection = new Connection(SOLANA_RPC_URL, "confirmed");
let provider;
let program;

// --- Component State ---
const fetchedOnChainEpisodes = ref([]);
const backendImageLinks = ref(new Map());
const isLoadingEpisodes = ref(false); // General loading for episode list
const userOnChainMintActivities = ref([]);
const isLoadingUserMintActivities = ref(false);

const showEpisodeModal = ref(false);
const isSavingEpisode = ref(false); // For combined on-chain and backend save
const isUploadingImagesModal = ref(false); // Specifically for image uploads in modal

const defaultEpisodeForm = () => ({
  editingExistingOnChainEpisode: false,
  episodeOnChainPdaToEdit: null,
  onChainEpisodeIdSeed: '',
  imageSetId: null,
  episodeName: '',
  contentMarkdown: '',
  originalContentMarkdown: '',
  order: 0,
  status: 0,
  isNft: false,
  candyMachineId: '',
  images: [],
});
const currentEpisodeForm = ref(defaultEpisodeForm());

const showCandyMachineCreatorFormInModal = ref(false);
const uploadedEpisodeImageForNftModal = ref('');
const manualCandyMachineIdModal = ref('');
const uiMessage = ref({ text: '', type: 'info' });

// --- Computed Properties ---
const isAuthorOfParentTale = computed(() => {
  return props.appUser &&
         props.parentTale && props.parentTale.onChainAccountData &&
         props.appUser.walletAddress === props.parentTale.onChainAccountData.author?.toString();
});

const combinedEpisodes = computed(() => {
  return fetchedOnChainEpisodes.value.map(ocEpisode => {
    const episodePdaString = ocEpisode.publicKey.toString();
    const imagesFromBackend = backendImageLinks.value.get(episodePdaString) || [];
    return {
      onChainPda: episodePdaString,
      onChainEpisodeIdSeed: ocEpisode.account.episodeIdSeed,
      parentTaleOnChainPda: ocEpisode.account.parentTale.toString(),
      name: ocEpisode.account.episodeName,
      contentCid: ocEpisode.account.contentCid,
      contentPreview: ocEpisode.account.contentCid ? `Content on IPFS: ${ocEpisode.account.contentCid}` : 'No content',
      order: ocEpisode.account.order,
      status: ocEpisode.account.status,
      isNft: ocEpisode.account.isNft,
      candyMachineId: ocEpisode.account.candyMachineId,
      imageSetId: ocEpisode.account.imageSetId,
      author: ocEpisode.account.author,
      images: imagesFromBackend,
      backendImagesSynced: backendImageLinks.value.has(episodePdaString),
      rawOnChainData: ocEpisode.account
    };
  }).sort((a, b) => a.order - b.order);
});

const isEpisodeContentLockedForModalForm = computed(() => {
  if (!currentEpisodeForm.value.isNft) return false;
  if (isAuthorOfParentTale.value) return false;
  return !!(currentEpisodeForm.value.editingExistingOnChainEpisode && currentEpisodeForm.value.episodeOnChainPdaToEdit);
});

const isContentLockedForDisplay = (episode) => {
  if (!episode.isNft) return false;
  if (isAuthorOfParentTale.value) return false;
  if (!props.appUser || !props.appUser.walletAddress || !wallet.publicKey.value) return true;

  return !userOnChainMintActivities.value.some(activity => {
    const acc = activity.account;
    if (acc.episodeOnChainPda && acc.episodeOnChainPda.toString() === episode.onChainPda) {
      return acc.userWallet.toString() === wallet.publicKey.value.toString() && acc.status === 0; // 0 for Active
    }
    if (episode.candyMachineId && acc.candyMachineId.toString() === new PublicKey(episode.candyMachineId).toString()) {
       return acc.userWallet.toString() === wallet.publicKey.value.toString() && acc.status === 0;
    }
    return false;
  });
};


// --- Watcher for wallet and parentTale ---
watch([() => wallet.connected.value, () => props.parentTale?.onChainPdaString, () => props.appUser?.walletAddress],
  async ([isConnected, parentPdaStr, userWalletAddr], [wasConnected, oldParentPdaStr, oldUserWalletAddr]) => {
  if (isConnected && wallet.publicKey.value) {
    let programJustInitialized = false;
    if (!program || provider?.wallet?.publicKey?.toBase58() !== wallet.publicKey.value.toBase58()) {
        if (wallet.wallet.value && wallet.wallet.value.adapter) {
             provider = new AnchorProvider(connection, wallet.wallet.value.adapter, AnchorProvider.defaultOptions());
             try {
                program = new Program(idl, provider);
                console.log("EpisodeManager: Anchor Program Initialized.");
                programJustInitialized = true;
             } catch (e) { console.error("EpisodeManager: Error initializing Program:", e); program = null; provider = null; return; }
        } else { console.error("EpisodeManager: Wallet adapter missing."); program = null; provider = null; return; }
    }
    
    if (program && parentPdaStr) {
        await fetchAllEpisodeData();
    }
    if (program && userWalletAddr && (programJustInitialized || userWalletAddr !== oldUserWalletAddr)) {
        await fetchUserOnChainMintActivities();
    }

  } else {
    program = null; provider = null;
    if (wasConnected === true && !isConnected) {
        fetchedOnChainEpisodes.value = [];
        backendImageLinks.value.clear();
        userOnChainMintActivities.value = [];
    }
  }
}, { immediate: true, deep: true });

// --- Utility Functions ---
function showUiMessage(msg, type = 'info', duration = 5000) { uiMessage.value = { text: msg, type }; if (duration > 0) setTimeout(() => { uiMessage.value = { text: '', type: 'info' }; }, duration); }
const shortenAddress = (address, chars = 6) => address ? `${address.slice(0, chars)}...${address.slice(-chars)}` : '';
const setDefaultImage = (event) => { event.target.src = 'https://placehold.co/100x100/gray/white?text=Error'; };
const renderMarkdownMini = (markdownText) => {
  if (!markdownText) return '';
  const plainText = marked(markdownText, { breaks: true, gfm: true }).replace(/<[^>]+>/g, '');
  return plainText.length > 100 ? plainText.substring(0, 100) + '...' : plainText;
};
const getStatusString = (statusNum) => (['Draft', 'Published', 'Archived'][statusNum] || 'Unknown');

// --- API Client for Backend ---
const backendApiClient = axios.create({ baseURL: API_BASE_URL });
backendApiClient.interceptors.request.use(config => { const token = localStorage.getItem(JWT_TOKEN_KEY); if (token) config.headers.Authorization = `Bearer ${token}`; return config; });
backendApiClient.interceptors.response.use(response => response.data, error => { const msg = error.response?.data?.message || error.message || 'Backend API error.'; showUiMessage(msg, 'error'); return Promise.reject(error.response?.data || { message: msg, error }); });

// --- Data Fetching ---
async function fetchUserOnChainMintActivities() {
    if (!program || !props.appUser?.walletAddress) {
        userOnChainMintActivities.value = [];
        return;
    }
    isLoadingUserMintActivities.value = true;
    try {
        const userPk = new PublicKey(props.appUser.walletAddress);
        const activities = await program.account.mintActivity.all([
            { memcmp: { offset: 8, bytes: userPk.toBase58() } }
        ]);
        userOnChainMintActivities.value = activities;
    } catch (error) {
        console.error("Error fetching user's on-chain mint activities:", error);
        userOnChainMintActivities.value = [];
    } finally {
        isLoadingUserMintActivities.value = false;
    }
}

async function fetchAllEpisodeData() {
  if (!program || !props.parentTale?.onChainPdaString) { return; }
  isLoadingEpisodes.value = true;
  fetchedOnChainEpisodes.value = [];
  backendImageLinks.value.clear();
  try {
    const parentTalePk = new PublicKey(props.parentTale.onChainPdaString);
    const onChainAccounts = await program.account.episode.all([
      { memcmp: { offset: 8 + 32, bytes: parentTalePk.toBase58() } }
    ]);
    fetchedOnChainEpisodes.value = onChainAccounts;

    if (onChainAccounts.length > 0) {
      const newImageLinks = new Map();
      for (const ocEpisode of onChainAccounts) {
        const episodePdaString = ocEpisode.publicKey.toString();
        const imageSetId = ocEpisode.account.imageSetId;
        if (imageSetId) {
          try {
            const imgResponse = await backendApiClient.get(`/episodes/image-set/${imageSetId}`);
            if (imgResponse.success && Array.isArray(imgResponse.data)) {
              newImageLinks.set(episodePdaString, imgResponse.data);
            } else { newImageLinks.set(episodePdaString, []); }
          } catch (e) { newImageLinks.set(episodePdaString, []); }
        } else {
          newImageLinks.set(episodePdaString, []);
        }
      }
      backendImageLinks.value = newImageLinks;
    }
  } catch (error) { showUiMessage(`Fetch error: ${error.message}`, "error");}
  finally { isLoadingEpisodes.value = false; }
}

// --- Modal & Form Logic ---
function toggleNftSectionInForm() {
  if (!currentEpisodeForm.value.isNft) {
    showCandyMachineCreatorFormInModal.value = false;
    currentEpisodeForm.value.candyMachineId = '';
  }
}
function triggerCandyMachineSetupInModal(isEditing = false) {
    if (currentEpisodeForm.value.images.length > 0) {
        uploadedEpisodeImageForNftModal.value = currentEpisodeForm.value.images[0];
    } else {
        showUiMessage("Add at least one image URL first. This image will be used for the NFT if you set up a new Candy Machine.", "warning");
        // Do not return, allow proceeding if they plan to link an existing CM ID
    }
    if (!isEditing) currentEpisodeForm.value.candyMachineId = '';
    manualCandyMachineIdModal.value = '';
    showCandyMachineCreatorFormInModal.value = true;
}
function assignManualCandyMachineIdInModal() {
    if (manualCandyMachineIdModal.value.trim()) {
        currentEpisodeForm.value.candyMachineId = manualCandyMachineIdModal.value.trim();
        showCandyMachineCreatorFormInModal.value = false;
        manualCandyMachineIdModal.value = '';
    } else { showUiMessage("Please enter a valid CM ID.", "warning"); }
}
function handleCandyMachineCreatedInModal(newCmId) {
  currentEpisodeForm.value.candyMachineId = newCmId;
  showCandyMachineCreatorFormInModal.value = false;
}

function openEpisodeModal() {
  if (!isAuthorOfParentTale.value) { showUiMessage("Not authorized.", "error"); return; }
  currentEpisodeForm.value = defaultEpisodeForm();
  currentEpisodeForm.value.order = combinedEpisodes.value.length; // Default order
  currentEpisodeForm.value.editingExistingOnChainEpisode = false;
  currentEpisodeForm.value.episodeOnChainPdaToEdit = null;
  currentEpisodeForm.value.imageSetId = null; // Ensure new episodes start with no imageSetId

  showCandyMachineCreatorFormInModal.value = false;
  uploadedEpisodeImageForNftModal.value = '';
  manualCandyMachineIdModal.value = '';
  showEpisodeModal.value = true;
}

async function openEditModal(combinedEpisode) {
    if (!isAuthorOfParentTale.value) { showUiMessage("Not authorized.", "error"); return; }
    
    let contentMarkdownForForm = "";
    if (combinedEpisode.contentCid) {
        try {
            const response = await axios.get(`https://gateway.pinata.cloud/ipfs/${combinedEpisode.contentCid}`);
            contentMarkdownForForm = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
        } catch (e) { contentMarkdownForForm = `Error fetching content (CID: ${combinedEpisode.contentCid}).`; }
    }

    currentEpisodeForm.value = {
        editingExistingOnChainEpisode: true,
        episodeOnChainPdaToEdit: combinedEpisode.onChainPda,
        onChainEpisodeIdSeed: combinedEpisode.onChainEpisodeIdSeed,
        imageSetId: combinedEpisode.imageSetId, // Load existing imageSetId from on-chain data
        episodeName: combinedEpisode.name,
        contentMarkdown: contentMarkdownForForm,
        originalContentMarkdown: contentMarkdownForForm, // For diff checking
        order: combinedEpisode.order,
        status: combinedEpisode.status,
        isNft: combinedEpisode.isNft,
        candyMachineId: combinedEpisode.candyMachineId || '',
        images: [...combinedEpisode.images], // Images from combined data (originally from backend)
    };
    uploadedEpisodeImageForNftModal.value = currentEpisodeForm.value.images.length > 0 ? currentEpisodeForm.value.images[0] : '';
    showCandyMachineCreatorFormInModal.value = false;
    manualCandyMachineIdModal.value = '';
    showEpisodeModal.value = true;
}

function closeEpisodeModal() {
    showEpisodeModal.value = false;
    currentEpisodeForm.value = defaultEpisodeForm(); // Reset form
    showCandyMachineCreatorFormInModal.value = false;
    uploadedEpisodeImageForNftModal.value = '';
    const fileInput = document.getElementById('episodeImageFilesModal');
    if (fileInput) fileInput.value = null;
    isUploadingImagesModal.value = false; // Reset upload indicator
}

async function handleImageFilesChangeInModal(event) {
  const files = event.target.files;
  if (!files || files.length === 0) return;
  if (currentEpisodeForm.value.images.length + files.length > 10) {
    showUiMessage("Max 10 images.", "warning"); return;
  }
  isUploadingImagesModal.value = true;
  showUiMessage(`Uploading ${files.length} image(s)...`, "info", 0);
  try {
    for (const file of files) {
      const uploadResult = await uploadFileToIPFS(file); // Assumes this is from your pinataService
      if (uploadResult.success && uploadResult.imageUrl) {
        currentEpisodeForm.value.images.push(uploadResult.imageUrl);
      } else { throw new Error(uploadResult.error || `Failed to upload ${file.name}`); }
    }
    if (currentEpisodeForm.value.images.length > 0 && !uploadedEpisodeImageForNftModal.value) {
        uploadedEpisodeImageForNftModal.value = currentEpisodeForm.value.images[0];
    }
    showUiMessage(`${currentEpisodeForm.value.images.length} image(s) in list.`, "success");
  } catch (uploadError) { showUiMessage(`Image upload error: ${uploadError.message}`, "error"); }
  finally { isUploadingImagesModal.value = false; event.target.value = null; }
}

function addImageFieldInForm() {
  if (currentEpisodeForm.value.images.length < 10) {
    currentEpisodeForm.value.images.push('');
  } else {
    showUiMessage("Max 10 images.", "warning");
  }
}

function removeImageFieldInForm(index) {
  const removed = currentEpisodeForm.value.images.splice(index, 1)[0];
  if (uploadedEpisodeImageForNftModal.value === removed && currentEpisodeForm.value.images.length > 0) {
    uploadedEpisodeImageForNftModal.value = currentEpisodeForm.value.images[0];
  } else if (currentEpisodeForm.value.images.length === 0) {
    uploadedEpisodeImageForNftModal.value = '';
  }
}

async function handleSaveEpisode() {
  if (!program || !wallet.publicKey.value || !props.parentTale?.onChainPdaString) {
    showUiMessage("Wallet, program, or parent tale info missing.", "error"); return;
  }
  if (!isAuthorOfParentTale.value) { showUiMessage("Not authorized.", "error"); return; }
  
  isSavingEpisode.value = true;
  let contentCidForOnChain = '';
  let finalImageSetId = currentEpisodeForm.value.imageSetId; // Use existing if editing, will be updated if new/changed

  try {
    // Step 1: Upload content markdown to IPFS (if new or changed)
    if (currentEpisodeForm.value.contentMarkdown &&
        (!currentEpisodeForm.value.editingExistingOnChainEpisode ||
         currentEpisodeForm.value.contentMarkdown !== currentEpisodeForm.value.originalContentMarkdown)) {
      showUiMessage("Uploading content to IPFS...", "info", 0);
      const textFileName = `${(currentEpisodeForm.value.episodeName || 'ep').replace(/\s+/g, '_')}_${Date.now()}.md`;
      const textUploadResult = await uploadTextToIPFS(currentEpisodeForm.value.contentMarkdown, textFileName);
      if (textUploadResult.success) {
        contentCidForOnChain = textUploadResult.ipfsHash;
        showUiMessage("Content uploaded to IPFS.", "info", 1000);
      } else {
        throw new Error(textUploadResult.error || "Content IPFS upload failed");
      }
    } else if (currentEpisodeForm.value.editingExistingOnChainEpisode) {
        // If editing and markdown didn't change, use existing CID from the loaded on-chain data
        const existingOcEpisode = fetchedOnChainEpisodes.value.find(ep => ep.publicKey.toString() === currentEpisodeForm.value.episodeOnChainPdaToEdit);
        contentCidForOnChain = existingOcEpisode?.account?.contentCid || '';
    }

    // Step 2: Create/Update ImageSet in Backend (sends current list of images)
    showUiMessage("Syncing images with backend...", "info", 0);
    const imageSetPayload = {
        images: currentEpisodeForm.value.images.filter(img => img && img.trim() !== ''),
        existingImageSetId: currentEpisodeForm.value.imageSetId, // Pass if editing existing image set
        // Optional: If your backend uses these for context when creating/updating image set
        // parentTaleOnChainPda: props.parentTale.onChainPdaString,
        // taleMongoId: props.parentTale.mongoId 
    };
    // This backend endpoint should handle create (if existingImageSetId is null) or update
    const imageSetResponse = await backendApiClient.post('/episodes/image-set', imageSetPayload);
    if (!imageSetResponse.success || !imageSetResponse.imageSetId) {
        throw new Error(imageSetResponse.message || "Failed to create/update image set in backend.");
    }
    finalImageSetId = imageSetResponse.imageSetId; // This is the MongoDB _id to store on-chain
    showUiMessage("Image set synced with backend.", "info", 1500);

    // Step 3: Prepare On-Chain Data & Perform Transaction
    const onChainMethodArgs = [ // For update_episode
        currentEpisodeForm.value.episodeName,
        contentCidForOnChain,
        finalImageSetId, // Store the MongoDB _id of the image set
        currentEpisodeForm.value.order,
        currentEpisodeForm.value.status,
        currentEpisodeForm.value.isNft,
        currentEpisodeForm.value.isNft ? currentEpisodeForm.value.candyMachineId : "",
    ];
    let episodeOnChainPdaString;
    let usedEpisodeIdSeed = currentEpisodeForm.value.onChainEpisodeIdSeed; // From form if editing

    if (currentEpisodeForm.value.editingExistingOnChainEpisode && currentEpisodeForm.value.episodeOnChainPdaToEdit) {
      showUiMessage("Updating on-chain episode...", "info", 0);
      episodeOnChainPdaString = currentEpisodeForm.value.episodeOnChainPdaToEdit;
      await program.methods.updateEpisode(...onChainMethodArgs)
      .accounts({ episodeAccount: new PublicKey(episodeOnChainPdaString), author: wallet.publicKey.value })
      .rpc();
      showUiMessage("On-chain episode updated!", "info", 2000);
    } else { // Creating new on-chain episode
      usedEpisodeIdSeed = uuidv4().substring(0, MAX_ONCHAIN_EPISODE_ID_SEED_LENGTH);
      showUiMessage("Creating on-chain episode...", "info", 0);
      const [pda, _bump] = PublicKey.findProgramAddressSync(
        [Buffer.from("episode"), new PublicKey(props.parentTale.onChainPdaString).toBuffer(), Buffer.from(usedEpisodeIdSeed)],
        PROGRAM_ID
      );
      episodeOnChainPdaString = pda.toString();

      // Prepend seed for create_episode
      const createArgs = [usedEpisodeIdSeed, ...onChainMethodArgs];
      await program.methods.createEpisode(...createArgs)
      .accounts({
        episodeAccount: episodeOnChainPdaString,
        parentTaleAccount: new PublicKey(props.parentTale.onChainPdaString),
        author: wallet.publicKey.value,
        systemProgram: SystemProgram.programId,
      }).rpc();
      showUiMessage("On-chain episode created!", "info", 2000);
    }

    // Step 4. (Optional but good) Update backend EpisodeImageSet with on-chain PDA link
    if (finalImageSetId && episodeOnChainPdaString) {
        showUiMessage("Linking on-chain PDA to backend image set...", "info", 0);
        try {
            // Use the dedicated linking endpoint or ensure createOrUpdateImageSet can handle this
            await backendApiClient.put(`/episodes/image-set/${finalImageSetId}/link-pda`, {
                linkedEpisodeOnChainPda: episodeOnChainPdaString, // The PDA of the on-chain episode
                parentTaleOnChainPda: props.parentTale.onChainPdaString, // For context
                onChainEpisodeIdSeed: usedEpisodeIdSeed // For context
            });
            showUiMessage("Backend image set linked.", "info", 1500);
        } catch (linkError) {
            console.warn("Failed to link on-chain PDA to backend image set:", linkError);
            showUiMessage("Could not finalize backend link for images. You might need to edit the episode again to establish the link if it's missing.", "warning");
        }
    }

    showUiMessage("Episode saved successfully!", "success");
    fetchAllEpisodeData();
    closeEpisodeModal();
  } catch (error) {
    console.error('Error saving episode:', error);
    let errorMsg = error.message || error.toString();
    if (error.logs) errorMsg += ` Logs: ${error.logs.join(', ')}`;
    showUiMessage(`Save episode error: ${errorMsg}`, "error");
  } finally {
    isSavingEpisode.value = false;
  }
}

async function confirmDeleteCombinedEpisode(combinedEpisode) {
    if (!program || !wallet.publicKey.value || !isAuthorOfParentTale.value) {
        showUiMessage("Not authorized or program not ready.", "error"); return;
    }
    if (window.confirm(`Delete episode "${combinedEpisode.name}"? This will delete from on-chain and backend.`)) {
        isSavingEpisode.value = true;
        try {
            const imageSetIdToDelete = combinedEpisode.imageSetId; // Get from on-chain data

            if (combinedEpisode.onChainPda) {
                showUiMessage("Deleting on-chain episode...", "info", 0);
                await program.methods.deleteEpisode()
                    .accounts({ episodeAccount: new PublicKey(combinedEpisode.onChainPda), author: wallet.publicKey.value })
                    .rpc();
                showUiMessage("On-chain episode deleted.", "info", 1500);
            } else {
                 showUiMessage("No on-chain PDA found for this episode. Skipping on-chain delete.", "warning");
            }

            if (imageSetIdToDelete) {
                showUiMessage("Deleting backend image set...", "info", 0);
                await backendApiClient.delete(`/episodes/image-set/${imageSetIdToDelete}`);
                showUiMessage("Backend image set deleted.", "success");
            } else {
                 showUiMessage("No imageSetId found for this episode. Skipping backend image set delete.", "warning");
            }
            fetchAllEpisodeData();
        } catch (error) {
            console.error('Error deleting episode:', error);
            showUiMessage(`Delete error: ${error.message || error.toString()}`, "error");
        } finally { isSavingEpisode.value = false; }
    }
}

// --- Lifecycle Hooks and Watchers ---
watch(() => props.parentTale?.onChainPdaString, (newParentPda) => {
  if (newParentPda && program && props.parentTale.onChainAccountData) {
    fetchAllEpisodeData();
  } else if (!newParentPda) {
    fetchedOnChainEpisodes.value = [];
    backendImageLinks.value.clear();
  }
}, { immediate: true, deep: true }); // deep:true on parentTale might be too sensitive if onChainAccountData changes often without PdaString changing.

watch(() => props.appUser?.walletAddress, (newUserWalletAddr, oldUserWalletAddr) => {
    if (newUserWalletAddr && newUserWalletAddr !== oldUserWalletAddr && program) {
        fetchUserOnChainMintActivities();
    } else if (!newUserWalletAddr) {
        userOnChainMintActivities.value = [];
    }
}, { immediate: true });


onMounted(() => {
  if (typeof window !== 'undefined' && !window.Buffer) { window.Buffer = Buffer; }
  // Initial data fetch is primarily handled by the watchers now.
});

</script>



<style scoped>
/* Main Container */
.episode-manager-container {
  margin-top: 2rem; /* mt-8 */
  padding: 1rem; /* p-4 */
  border: 1px solid #e5e7eb; /* border-gray-200 */
  border-radius: 0.5rem; /* rounded-lg */
}
.dark .episode-manager-container {
  border-color: #374151; /* dark:border-gray-700 */
}
@media (min-width: 768px) { /* md: */
  .episode-manager-container {
    padding: 1.5rem; /* md:p-6 */
  }
}

.main-section-title {
  font-size: 1.5rem; /* text-2xl */
  font-weight: 600; /* font-semibold */
  margin-bottom: 1.5rem; /* mb-6 */
  color: #1f2937; /* text-gray-800 */
}
.dark .main-section-title {
  color: #ffffff; /* dark:text-white */
}

.add-episode-button-container {
  margin-bottom: 1.5rem; /* mb-6 */
  text-align: right;
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
  background-color: rgba(0, 0, 0, 0.75); /* bg-black bg-opacity-75 */
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem; /* p-4 */
  z-index: 60; /* z-[60] */
}
.modal-content-wrapper { /* Was modal-content */
  background-color: #ffffff; /* bg-white */
  padding: 1.5rem; /* p-6 */
  border-radius: 0.5rem; /* rounded-lg */
  box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05); /* shadow-xl */
  max-width: 42rem; /* max-w-2xl */
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}
.dark .modal-content-wrapper {
  background-color: #1f2937; /* dark:bg-gray-800 */
}
.modal-title {
  font-size: 1.25rem; /* text-xl */
  font-weight: 700; /* font-bold */
  margin-bottom: 1.5rem; /* mb-6 */
  color: #1f2937; /* text-gray-800 */
}
.dark .modal-title {
  color: #ffffff; /* dark:text-white */
}
.modal-form {
  /* Uses form-group for spacing */
}
.modal-form > div:not(:last-child), .modal-form > fieldset:not(:last-child) {
    margin-bottom: 1rem; /* space-y-4 approx */
}


/* Form Elements */
.form-group {
  margin-bottom: 1rem; /* Default spacing between form groups */
}
.form-label {
  display: block;
  font-size: 0.875rem; /* text-sm */
  font-weight: 500; /* font-medium */
  color: #374151; /* text-gray-700 */
  margin-bottom: 0.25rem; /* mb-1 */
}
.dark .form-label {
  color: #d1d5db; /* dark:text-gray-300 */
}
.form-input, .form-select, .form-textarea {
  margin-top: 0.25rem; /* mt-1 */
  display: block;
  width: 100%;
  border-radius: 0.375rem; /* rounded-md */
  border: 1px solid #d1d5db; /* border-gray-300 */
  box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05); /* shadow-sm */
  padding: 0.5rem 0.75rem; /* Vuetify-like padding */
  font-size: 0.875rem; /* sm:text-sm */
  background-color: #ffffff; /* bg-white */
  color: #111827; /* text-gray-900 */
}
.form-input:focus, .form-select:focus, .form-textarea:focus {
  border-color: #4f46e5; /* focus:border-indigo-500 */
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.5); /* focus:ring-indigo-500 */
  outline: none;
}
.dark .form-input, .dark .form-select, .dark .form-textarea {
  border-color: #4b5568; /* dark:border-gray-600 */
  background-color: #374151; /* dark:bg-gray-700 */
  color: #f3f4f6; /* dark:text-gray-100 */
}
.form-textarea {
  min-height: 8rem; /* h-32 */
}
.form-input-readonly {
  background-color: #f3f4f6; /* bg-gray-100 */
}
.dark .form-input-readonly {
  background-color: #4b5568; /* dark:bg-gray-600 */
}

.form-file-input {
  margin-top: 0.25rem; /* mt-1 */
  display: block;
  width: 100%;
  font-size: 0.875rem; /* text-sm */
  color: #6b7280; /* text-gray-500 */
}
.dark .form-file-input {
  color: #9ca3af; /* dark:text-gray-400 */
}
.form-file-input::file-selector-button {
  margin-right: 1rem; /* file:mr-4 */
  padding: 0.5rem 1rem; /* file:py-2 file:px-4 */
  border-radius: 0.375rem; /* file:rounded-md */
  border-width: 0; /* file:border-0 */
  font-size: 0.875rem; /* file:text-sm */
  font-weight: 600; /* file:font-semibold */
  background-color: #e0e7ff; /* file:bg-indigo-50 */
  color: #4338ca; /* file:text-indigo-700 */
  cursor: pointer;
}
.form-file-input:hover::file-selector-button {
  background-color: #c7d2fe; /* hover:file:bg-indigo-100 */
}
.dark .form-file-input::file-selector-button {
  background-color: #3730a3; /* dark:file:bg-indigo-800 */
  color: #c7d2fe; /* dark:file:text-indigo-300 */
}
.dark .form-file-input:hover::file-selector-button {
  background-color: #4338ca; /* dark:hover:file:bg-indigo-700 */
}

.form-checkbox {
  height: 1rem; /* h-4 */
  width: 1rem; /* w-4 */
  color: #4f46e5; /* text-indigo-600 */
  border: 1px solid #d1d5db; /* border-gray-300 */
  border-radius: 0.25rem; /* rounded */
  margin-right: 0.5rem; /* mr-2 */
}
.form-checkbox:focus {
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.5); /* focus:ring-indigo-500 */
}
.dark .form-checkbox {
  border-color: #6b7280; /* dark:border-gray-500 */
  background-color: #374151; /* dark:bg-gray-700, for checkmark contrast */
}
.checkbox-label { /* for the label containing the checkbox */
    display: flex;
    align-items: center;
}

.form-text {
  font-size: 0.75rem; /* text-xs */
  color: #6b7280; /* text-gray-500 */
  margin-top: 0.25rem; /* mt-1 */
}
.dark .form-text {
  color: #9ca3af; /* dark:text-gray-400 */
}

/* NFT Details Section in Modal */
.nft-linking-section {
  border-top: 1px solid #e5e7eb; /* border-t dark:border-gray-700 */
  padding-top: 1rem; /* pt-4 */
  margin-top: 1rem; /* mt-4 */
}
.dark .nft-linking-section {
  border-color: #374151;
}
.nft-details-section {
  /* space-y-2 approx */
  margin-top: 0.5rem; /* mt-2 */
  padding: 0.75rem; /* p-3 */
  background-color: #f9fafb; /* bg-gray-50 */
  border-radius: 0.375rem; /* rounded-md */
}
.nft-details-section > div:not(:last-child) {
    margin-bottom: 0.5rem;
}
.dark .nft-details-section {
  background-color: rgba(55, 65, 81, 0.5); /* dark:bg-gray-700/50 */
}
.cm-id-display-wrapper .form-input {
  background-color: #f3f4f6; /* bg-gray-100 */
}
.dark .cm-id-display-wrapper .form-input {
  background-color: #4b5568; /* dark:bg-gray-600 */
}
.edit-cm-button {
  margin-top: 0.25rem; /* mt-1 */
}
.cm-creator-wrapper {
  /* Styles for this wrapper if needed */
}
.cm-creator-prompt {
  font-size: 0.875rem; /* text-sm */
  color: #4b5563; /* text-gray-600 */
  margin-bottom: 0.5rem; /* mb-2 */
}
.dark .cm-creator-prompt {
  color: #d1d5db; /* dark:text-gray-300 */
}
.cancel-cm-button {
  margin-top: 0.75rem; /* mt-3 */
  width: 100%;
}
.cm-setup-options {
  display: flex;
  align-items: center;
  gap: 0.5rem; /* For spacing between button, OR, input */
  flex-wrap: wrap; /* Allow wrapping on small screens */
}
.cm-options-divider {
  margin-left: 0.5rem; /* mx-2 */
  margin-right: 0.5rem;
  color: #6b7280; /* text-gray-500 */
  font-size: 0.875rem; /* text-sm */
}
.dark .cm-options-divider {
  color: #9ca3af; /* dark:text-gray-400 */
}
.manual-cm-input {
  display: inline-block; /* inline-w-auto */
  width: auto;
  max-width: 12rem; /* max-w-xs approx */
  font-size: 0.875rem; /* text-sm */
}
.assign-cm-button {
  margin-left: 0.5rem; /* ml-2 */
}


/* Image Upload Section in Modal */
.image-upload-section {
  margin-top: 1rem; /* mt-4 */
}
.image-input-row {
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem; /* mb-2 */
}
.image-url-input {
  flex-grow: 1;
  margin-right: 0.5rem; /* mr-2 */
}
.remove-image-button {
  padding: 0.25rem 0.5rem !important; /* p-1 for btn-xs */
  line-height: 1 !important; /* leading-none for btn-xs */
}
.add-image-button {
  margin-top: 0.25rem; /* mt-1 */
}
.file-upload-wrapper {
  margin-top: 0.5rem; /* mt-2 */
}
.upload-indicator {
  margin-top: 0.5rem; /* mt-2 */
  font-size: 0.875rem; /* text-sm */
  color: #4f46e5; /* text-indigo-600 */
}
.dark .upload-indicator {
  color: #818cf8; /* dark:text-indigo-400 */
}


.locked-content-message { /* Extends .info-box */
  /* Specific styles if needed, otherwise relies on .info-box */
}
.login-prompt {
  display: block;
  margin-top: 0.25rem; /* mt-1 */
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  column-gap: 0.75rem; /* space-x-3 */
  margin-top: 1.5rem; /* mt-6 */
  padding-top: 1rem; /* pt-4 */
  border-top: 1px solid #e5e7eb; /* border-t dark:border-gray-700 */
}
.dark .modal-actions {
  border-color: #374151;
}

/* Episode List Styles */
.loading-indicator-list {
  text-align: center;
  padding: 1.5rem; /* p-6 */
}
.loading-indicator-list p {
  margin-top: 0.5rem; /* mt-2 */
  color: #4b5563; /* text-gray-600 */
}
.dark .loading-indicator-list p {
  color: #d1d5db; /* dark:text-gray-300 */
}
.no-episodes-message { /* Extends .info-box */
  text-align: center;
}
.episodes-grid {
  /* space-y-4 */
}
.episodes-grid > .episode-item:not(:last-child) {
    margin-bottom: 1rem;
}

.episode-item {
  padding: 1rem; /* p-4 */
  background-color: #ffffff; /* bg-white */
  border-radius: 0.5rem; /* rounded-lg */
  box-shadow: 0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px 0 rgba(0,0,0,0.06); /* shadow */
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}
.dark .episode-item {
  background-color: #1f2937; /* dark:bg-gray-800 */
}
.episode-item-content {
  /* Flex grow handled by parent structure */
}
.episode-name {
  font-size: 1.125rem; /* text-lg */
  font-weight: 600; /* font-semibold */
  color: #4f46e5; /* text-indigo-700 */
}
.dark .episode-name {
  color: #818cf8; /* dark:text-indigo-400 */
}
.episode-description {
  font-size: 0.875rem; /* text-sm */
  color: #4b5563; /* text-gray-600 */
  /* line-clamp-2/3 implemented with -webkit properties */
  display: -webkit-box;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
    line-height: 1.4; /* Approximate for line clamping */
}
.line-clamp-3 { /* If used for episode description */
    -webkit-line-clamp: 3;
    max-height: calc(1.4em * 3); /* line-height * number of lines */
}
.line-clamp-2 { /* If used for episode description */
    -webkit-line-clamp: 2;
    max-height: calc(1.4em * 2);
}
.dark .episode-description {
  color: #9ca3af; /* dark:text-gray-400 */
}
.episode-locked-message {
  font-size: 0.875rem; /* text-sm */
  color: #6b7280; /* text-gray-500 */
  font-style: italic;
  margin-top: 0.5rem; /* my-2 */
  margin-bottom: 0.5rem;
}
.dark .episode-locked-message {
  color: #9ca3af; /* dark:text-gray-400 */
}
.mint-now-link {
  margin-left: 0.25rem; /* ml-1 */
}

.episode-tags-container {
  margin-top: 0.5rem; /* mt-2 */
}
.tag {
  display: inline-block;
  background-color: #e5e7eb;
  border-radius: 9999px;
  padding: 0.125rem 0.5rem; /* py-0.5 px-2 */
  font-size: 0.75rem; /* text-xs */
  font-weight: 600; /* font-semibold */
  color: #374151;
  margin-right: 0.25rem; /* mr-1 */
  margin-bottom: 0.25rem; /* mb-1 */
}
.dark .tag {
  background-color: #374151;
  color: #e5e7eb;
}
.tag-nft {
  background-color: #e0e7ff; /* bg-purple-200 (using indigo as example) */
  color: #3730a3; /* text-purple-800 (using indigo) */
}
.dark .tag-nft {
  background-color: #4338ca; /* dark:bg-purple-700 (using indigo) */
  color: #c7d2fe; /* dark:text-purple-100 (using indigo) */
}
.tag-cm-ref {
  background-color: #ccfbf1; /* bg-teal-200 */
  color: #0f766e; /* text-teal-800 */
}
.dark .tag-cm-ref {
  background-color: #134e4a; /* dark:bg-teal-700 */
  color: #99f6e4; /* dark:text-teal-100 */
}
.tag-status {
  /* Uses default .tag styles */
}
.tag-warning {
    background-color: #fef3c7; /* bg-yellow-100 */
    color: #92400e; /* text-yellow-700 */
}
.dark .tag-warning {
    background-color: #b45309; /* dark:bg-yellow-700 */
    color: #fde68a; /* dark:text-yellow-100 */
}


.episode-image-gallery {
  margin-top: 0.5rem; /* mt-2 */
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem; /* gap-2 */
}
.episode-image-link:hover {
  opacity: 0.8;
}
.episode-thumbnail {
  height: 4rem; /* h-16 */
  width: 4rem; /* w-16 */
  object-fit: cover;
  border-radius: 0.25rem; /* rounded */
  border: 1px solid #d1d5db; /* border */
}
.dark .episode-thumbnail {
  border-color: #4b5568; /* dark:border-gray-600 */
}
.episode-image-teaser {
  margin-top: 0.5rem; /* mt-2 */
}
.episode-thumbnail-locked {
  opacity: 0.5;
}
.image-teaser-text {
  font-size: 0.75rem; /* text-xs */
  color: #9ca3af; /* text-gray-400 */
  font-style: italic;
  margin-left: 0.5rem; /* ml-2 */
}
.dark .image-teaser-text {
  color: #6b7280; /* dark:text-gray-500 */
}


.episode-actions {
  display: flex;
  flex-direction: column; /* Default mobile: column */
  align-items: flex-end; /* Align to right for column */
  gap: 0.5rem; /* gap-2 */
  margin-top: 0.5rem; /* mt-2 */
  margin-left: 0.5rem; /* ml-2 */
  flex-shrink: 0;
}
@media (min-width: 640px) { /* sm: */
  .episode-actions {
    flex-direction: row; /* sm:flex-row */
    align-items: center; /* sm:items-center */
    margin-top: 0; /* sm:mt-0 */
  }
}

/* Spinner (re-defined for encapsulation, or use global) */
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
.spinner-inline {
  display: inline-block;
  width: 1rem; /* w-4 */
  height: 1rem; /* h-4 */
  border-width: 2px;
  border-top-color: #4f46e5; /* text-indigo-600 */
  border-right-color: transparent;
  border-bottom-color: transparent;
  border-left-color: transparent;
  border-radius: 9999px;
  animation: spin 1s linear infinite;
  margin-left: 0.5rem; /* ml-2 */
  vertical-align: middle;
}
.dark .spinner-inline {
  border-top-color: #c7d2fe; /* dark:text-indigo-300 */
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

/* General Button Styles (reusable, consider globalizing) */
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
  /* Consider box-shadow for focus ring */
}
.btn:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.btn-primary { background-color: #4f46e5; }
.btn-primary:hover { background-color: #4338ca; }
.dark .btn-primary { background-color: #6366f1; }
.dark .btn-primary:hover { background-color: #818cf8; }
.dark .btn-primary:disabled { background-color: #3730a3; opacity: 0.5; }


.btn-secondary { background-color: #6b7280; }
.btn-secondary:hover { background-color: #4b5563; }
.dark .btn-secondary { background-color: #4b5568; }
.dark .btn-secondary:hover { background-color: #374151; }
.dark .btn-secondary:disabled { background-color: #374151; opacity: 0.5; }


.btn-success { background-color: #16a34a; }
.btn-success:hover { background-color: #15803d; }
.dark .btn-success { background-color: #22c55e; }
.dark .btn-success:hover { background-color: #16a34a; }
.dark .btn-success:disabled { background-color: #14532d; opacity: 0.5; }


.btn-danger { background-color: #dc2626; }
.btn-danger:hover { background-color: #b91c1c; }
.dark .btn-danger { background-color: #ef4444; }
.dark .btn-danger:hover { background-color: #f87171; }
.dark .btn-danger:disabled { background-color: #7f1d1d; opacity: 0.5; }


.btn-warning { background-color: #f59e0b; color: #ffffff; }
.btn-warning:hover { background-color: #d97706; }
.dark .btn-warning { background-color: #f59e0b; }
.dark .btn-warning:hover { background-color: #fbbf24; }
.dark .btn-warning:disabled { background-color: #78350f; opacity: 0.5; }


.btn-info { background-color: #3b82f6; }
.btn-info:hover { background-color: #2563eb; }
.dark .btn-info { background-color: #3b82f6; }
.dark .btn-info:hover { background-color: #60a5fa; }
.dark .btn-info:disabled { background-color: #1e3a8a; opacity: 0.5; }


.btn-sm { padding: 0.375rem 0.75rem; font-size: 0.75rem; }
.btn-xs { padding: 0.25rem 0.625rem; font-size: 0.75rem; }

/* Info Box */
.info-box {
  margin-top: 0.5rem; /* mt-2 */
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
.error-box {
  margin-top: 0.5rem; padding: 0.75rem; background-color: #fee2e2; color: #b91c1c; border-radius: 0.375rem; border: 1px solid #fecaca;
}
.dark .error-box { background-color: rgba(153, 27, 27, 0.3); color: #fca5a5; border-color: rgba(220, 38, 38, 0.5); }

.link {
  color: #4f46e5; /* text-indigo-600 */
  text-decoration: underline;
  font-weight: 500; /* font-medium */
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
