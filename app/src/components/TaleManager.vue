<template>
  <div class="tale-manager-container">
    <h1 class="page-title">Manage Your Tales</h1>

    <div v-if="!wallet.connected.value" class="wallet-prompt-section">
      <p class="info-text">Please connect your wallet to manage your tales.</p>
      <div class="wallet-button-wrapper">
        <WalletMultiButton />
      </div>
    </div>
     <div v-else-if="!appUser && !isLoadingUser" class="wallet-prompt-section">
      <p class="info-text">
        Please <router-link :to="{name: 'Auth'}" class="link">login or register</router-link> to manage tales.
      </p>
    </div>
    <div v-else-if="appUser && appUser.type !== 'creator'" class="wallet-prompt-section">
        <p class="info-text">
            Only users with the 'creator' role can manage tales.
            Your current role is: <span class="user-role-display">{{ appUser.type }}</span>.
        </p>
         <p class="info-text">
            If you believe this is an error, please contact support or check your profile settings.
        </p>
    </div>


    <div v-if="uiMessage.text"
         :class="['ui-message', `ui-message-${uiMessage.type}`]">
      {{ uiMessage.text }}
       <div v-if="uiMessage.transactionSignature" class="tx-link-container">
        <a :href="getExplorerUrl(uiMessage.transactionSignature)" target="_blank" class="link transaction-link">
          View Transaction
        </a>
      </div>
    </div>

    <div v-if="wallet.connected.value && appUser && appUser.type === 'creator'" class="manager-content">
      <button @click="openTaleModal()" class="btn btn-primary btn-add-tale">
        + Create New Tale
      </button>

      <div v-if="showTaleModal" class="modal-overlay" @click.self="closeTaleModal">
        <div class="modal-content-wrapper">
          <h3 class="modal-title">{{ currentTaleForm.editingExistingOnChainTale ? 'Edit Tale' : 'Create New Tale' }}</h3>
          <form @submit.prevent="handleSaveTale" class="modal-form">
            <div class="form-group">
              <label for="taleTitle" class="form-label">Title (On-Chain):</label>
              <input type="text" id="taleTitle" v-model="currentTaleForm.title" class="form-input" required maxlength="100" />
            </div>
            <div class="form-group">
              <label for="taleGenre" class="form-label">Genre (On-Chain):</label>
              <input type="text" id="taleGenre" v-model="currentTaleForm.genre" class="form-input" maxlength="30" />
            </div>

            <div class="form-group">
              <label for="taleContentMarkdown" class="form-label">Main Content (Markdown, for IPFS):</label>
              <textarea id="taleContentMarkdown" v-model="currentTaleForm.contentMarkdown" class="form-textarea" rows="5"></textarea>
            </div>

            <div class="form-group">
                <label for="coverImageFile" class="form-label">Cover Image (Upload to Pinata):</label>
                <input type="file" id="coverImageFile" @change="handleCoverImageFileChange" class="form-file-input" accept="image/*" />
                <img v-if="currentTaleForm.coverImagePreviewUrl" :src="currentTaleForm.coverImagePreviewUrl" alt="Cover Preview" class="image-preview"/>
                <input type="text" v-model="currentTaleForm.coverImageCid" class="form-input form-input-readonly mt-2" placeholder="IPFS CID for Cover (auto-filled after upload)" readonly />
            </div>
             <div class="form-group">
                <label for="thumbnailImageFile" class="form-label">Thumbnail Image (Upload to Pinata):</label>
                <input type="file" id="thumbnailImageFile" @change="handleThumbnailImageFileChange" class="form-file-input" accept="image/*" />
                <img v-if="currentTaleForm.thumbnailImagePreviewUrl" :src="currentTaleForm.thumbnailImagePreviewUrl" alt="Thumbnail Preview" class="image-preview"/>
                <input type="text" v-model="currentTaleForm.thumbnailCid" class="form-input form-input-readonly mt-2" placeholder="IPFS CID for Thumbnail (auto-filled after upload)" readonly />
            </div>

            <div class="form-group">
              <label for="taleStatus" class="form-label">Status (On-Chain):</label>
              <select id="taleStatus" v-model.number="currentTaleForm.status" class="form-select">
                <option value="0">Draft</option>
                <option value="1">Published</option>
                <option value="2">Archived</option>
              </select>
            </div>

            <fieldset class="form-fieldset">
                <legend class="form-legend">Optional Gating & Monetization</legend>
                 <div class="form-group">
                    <label for="taleCandyMachineAddress" class="form-label">Associated Candy Machine Address (Optional, On-Chain):</label>
                    <input type="text" id="taleCandyMachineAddress" v-model="currentTaleForm.candyMachineAddress" class="form-input" placeholder="e.g., for early access mint" />
                </div>
                <div class="form-group checkbox-group">
                    <label class="form-label checkbox-label">
                        <input type="checkbox" v-model="currentTaleForm.isGovernanceTokenGated" class="form-checkbox" />
                        Gated by Governance Token
                    </label>
                    <label class="form-label checkbox-label">
                        <input type="checkbox" v-model="currentTaleForm.isEarlyAccessTokenGated" class="form-checkbox" />
                        Gated by Early Access Token/NFT
                    </label>
                    <label class="form-label checkbox-label">
                        <input type="checkbox" v-model="currentTaleForm.isRealWorldAssetGated" class="form-checkbox" />
                        Gated by Real World Asset (RWA)
                    </label>
                </div>
            </fieldset>


            <div class="modal-actions">
              <button type="button" @click="closeTaleModal" class="btn btn-secondary">Cancel</button>
              <button type="submit" :disabled="isSavingTale || isUploadingCover || isUploadingThumbnail" class="btn btn-success">
                {{ isSavingTale ? 'Saving...' : (currentTaleForm.editingExistingOnChainTale ? 'Update Tale' : 'Create Tale') }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div v-if="isLoadingTales" class="loading-indicator-list">
         <div class="spinner"></div>
         <p>Loading your tales...</p>
      </div>
      <div v-else-if="authorTales.length === 0" class="info-box no-tales-message">
        You haven't created any tales yet.
      </div>
      <div v-else class="tales-grid">
        <div v-for="tale in authorTales" :key="tale.publicKey.toString()" class="tale-item-card">
          <img v-if="tale.account.thumbnailCid" :src="`https://gateway.pinata.cloud/ipfs/${tale.account.thumbnailCid}`" @error="setDefaultImage" alt="Tale Thumbnail" class="tale-thumbnail-list"/>
          <img v-else-if="tale.account.coverImageCid" :src="`https://gateway.pinata.cloud/ipfs/${tale.account.coverImageCid}`" @error="setDefaultImage" alt="Tale Cover" class="tale-thumbnail-list"/>
          <img v-else src="https://placehold.co/300x200/gray/white?text=No+Image" alt="Default Tale Image" class="tale-thumbnail-list"/>

          <div class="tale-item-content">
            <h3 class="tale-item-title">{{ tale.account.title }}</h3>
            <p class="tale-item-meta">
                On-Chain ID: {{ shortenAddress(tale.account.taleId, 6) }} <br/>
                Status: <span :class="['status-badge', `status-${getStatusString(tale.account.status).toLowerCase()}`]">{{ getStatusString(tale.account.status) }}</span>
            </p>
             <p class="tale-item-meta">
                Gating:
                <span v-if="tale.account.isGovernanceTokenGated" class="gating-tag">Gov</span>
                <span v-if="tale.account.isEarlyAccessTokenGated" class="gating-tag">Early</span>
                <span v-if="tale.account.isRealWorldAssetGated" class="gating-tag">RWA</span>
                <span v-if="!tale.account.isGovernanceTokenGated && !tale.account.isEarlyAccessTokenGated && !tale.account.isRealWorldAssetGated">None</span>
            </p>
            <p v-if="tale.account.candyMachineAddress" class="tale-item-meta">
                CM: {{ shortenAddress(tale.account.candyMachineAddress.toString(), 6) }}
            </p>
            <div class="tale-item-actions">
              <button @click="openEditTaleModal(tale)" class="btn btn-warning btn-xs">Edit On-Chain</button>
              <button @click="confirmDeleteTale(tale)" class="btn btn-danger btn-xs">Delete On-Chain</button>
              <router-link :to="{ name: 'TaleDetail', params: { id: tale.account.taleId } }" class="btn btn-info btn-xs">
                View & Manage Episodes
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useWallet, WalletMultiButton } from 'solana-wallets-vue';
import { Connection, PublicKey, SystemProgram } from '@solana/web3.js';
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import { Buffer } from 'buffer';
import { v4 as uuidv4 } from 'uuid';
import { uploadFileToIPFS, uploadTextToIPFS } from '../services/pinataService';
import axios from 'axios'
// --- Configuration ---
const AUTH_API_BASE_URL = import.meta.env.VITE_APP_AUTH_API_URL || 'http://localhost:3000/api';
const JWT_TOKEN_KEY = 'readium_fun_jwt_token';
const SOLANA_RPC_URL = import.meta.env.VITE_RPC_ENDPOINT || 'https://api.devnet.solana.com';

import idlFromFile from '../anchor/tale_story.json';
const PROGRAM_ID = new PublicKey(idlFromFile.address);
const idl = idlFromFile;

const MAX_ONCHAIN_TALE_ID_LENGTH = 32;

// --- Wallet and Program ---
const wallet = useWallet();
const connection = new Connection(SOLANA_RPC_URL, "confirmed");
let provider;
let program;

// --- Component State ---
const appUser = ref(null);
const isLoadingUser = ref(false);
const authorTales = ref([]);
const isLoadingTales = ref(false);

const showTaleModal = ref(false);
const isSavingTale = ref(false);
const isUploadingCover = ref(false);
const isUploadingThumbnail = ref(false); // New state for thumbnail upload

const defaultTaleForm = () => ({
  editingExistingOnChainTale: false,
  onChainTaleIdSeedToEdit: null,
  title: '',
  genre: '',
  contentMarkdown: '',
  originalContentMarkdown: '',
  coverImageFile: null,
  coverImagePreviewUrl: '',
  coverImageCid: '',
  thumbnailImageFile: null,         // New form field
  thumbnailImagePreviewUrl: '',     // New form field
  thumbnailCid: '',                 // New form field
  status: 0,
  candyMachineAddress: '',
  isGovernanceTokenGated: false,
  isEarlyAccessTokenGated: false,
  isRealWorldAssetGated: false,
});
const currentTaleForm = ref(defaultTaleForm());
const uiMessage = ref({ text: '', type: 'info', transactionSignature: null });

// --- Watcher for wallet connection ---
watch(() => wallet.connected.value, (isConnected) => {
  if (isConnected && wallet.publicKey.value) {
    if (!program || provider?.wallet?.publicKey?.toBase58() !== wallet.publicKey.value.toBase58()) {
        if (wallet.wallet.value && wallet.wallet.value.adapter) {
            provider = new AnchorProvider(connection, wallet.wallet.value.adapter, AnchorProvider.defaultOptions());
            try {
                program = new Program(idl, provider);
                console.log("TaleManager: Anchor Program Initialized.");
            } catch (e) {
                console.error("TaleManager: Error initializing Anchor Program:", e);
                showUiMessage(`Failed to initialize on-chain program: ${e.message}`, "error");
                program = null; provider = null; return;
            }
        } else {
            console.error("TaleManager: Wallet adapter not available.");
            program = null; provider = null; return;
        }
    }
    fetchAppUser().then(() => {
        if (appUser.value && appUser.value.type === 'creator' && program) {
            fetchAuthorOnChainTales();
        }
    });
  } else {
    program = null; provider = null; appUser.value = null; authorTales.value = [];
  }
}, { immediate: true });

// --- Utility Functions ---
function showUiMessage(msg, type = 'info', txSig = null, duration = 5000) {
  uiMessage.value = { text: msg, type, transactionSignature: txSig };
  if (duration > 0 && type !== 'loading') {
    setTimeout(() => { uiMessage.value = { text: '', type: 'info', transactionSignature: null }; }, duration);
  }
}
const shortenAddress = (address, chars = 6) => address ? `${address.slice(0, chars)}...${address.slice(-chars)}` : '';
const setDefaultImage = (event) => { event.target.src = 'https://placehold.co/300x200/gray/white?text=No+Img'; };
const getStatusString = (statusNum) => (['Draft', 'Published', 'Archived'][statusNum] || 'Unknown');
const getExplorerUrl = (signature) => `https://explorer.solana.com/tx/${signature}?cluster=${SOLANA_RPC_URL.includes('mainnet') ? 'mainnet-beta' : 'devnet'}`;

// --- API Client for Auth ---
const authApiClient = axios.create({ baseURL: AUTH_API_BASE_URL });
authApiClient.interceptors.request.use(config => {
  const token = localStorage.getItem(JWT_TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
authApiClient.interceptors.response.use(
  response => response.data,
  error => {
    const msg = error.response?.data?.message || error.message || 'An API error occurred.';
    showUiMessage(msg, 'error');
    if (error.response?.status === 401 && error.response?.data?.message?.includes("token failed")) {
        localStorage.removeItem(JWT_TOKEN_KEY);
        appUser.value = null;
    }
    return Promise.reject(error.response?.data || { message: msg, error });
  }
);

// --- Data Fetching ---
async function fetchAppUser() {
  const token = localStorage.getItem(JWT_TOKEN_KEY);
  if (!token || !wallet.connected.value) { appUser.value = null; return; }
  isLoadingUser.value = true;
  try {
    const response = await authApiClient.get('/auth/me');
    appUser.value = response.success ? response.data : null;
    if (!response.success) localStorage.removeItem(JWT_TOKEN_KEY);
  } catch (error) {
    console.error("TaleManager: Failed to fetch app user:", error);
    appUser.value = null;
  } finally {
    isLoadingUser.value = false;
  }
}

async function fetchAuthorOnChainTales() {
  if (!program) {
    if (wallet.connected.value) {
        showUiMessage("On-chain program not ready. Try reconnecting wallet or refreshing.", "warning");
    }
    authorTales.value = [];
    return;
  }
  isLoadingTales.value = true;
  showUiMessage("Fetching your on-chain tales...", "loading", null, 0); // Keep loading message active
  // const accounts = await program.account.tale.all();
  // console.log(accounts)
  try {
    // When IDL has accounts defined only by discriminator and full types in `idl.types`,
    // Anchor JS should resolve this.
    const accounts = await program.account.tale.all();
    authorTales.value = accounts.sort((a, b) => Number(b.account.timestamp) - Number(a.account.timestamp));
    if (accounts.length > 0) {
        showUiMessage(`Fetched ${accounts.length} on-chain tales.`, "success", 2000);
    }
  } catch (error) {
    console.error('Error fetching on-chain tales:', error);
    showUiMessage(`Error fetching on-chain tales: ${error.message}`, "error");
    onChainTales.value = [];
  } finally {
    isLoadingTales.value = false;
  }
 
}

// --- On-Chain Tale CRUD Functions ---
async function fetchOnChainTales() {
  if (!program) {
    if (wallet.connected.value) {
        showUiMessage("On-chain program not ready. Try reconnecting wallet or refreshing.", "warning");
    }
    onChainTales.value = [];
    return;
  }
  isLoadingTales.value = true;
  try {
    // When IDL has accounts defined only by discriminator and full types in `idl.types`,
    // Anchor JS should resolve this.
    const accounts = await program.account.tale.all();
    onChainTales.value = accounts.sort((a, b) => Number(b.account.timestamp) - Number(a.account.timestamp));
    if (accounts.length > 0) {
        showUiMessage(`Fetched ${accounts.length} on-chain tales.`, "success", 2000);
    }
  } catch (error) {
    console.error('Error fetching on-chain tales:', error);
    showUiMessage(`Error fetching on-chain tales: ${error.message}`, "error");
    onChainTales.value = [];
  } finally {
    isLoadingTales.value = false;
  }
}
// --- Modal & Form Logic ---
function handleCoverImageFileChange(event) {
  const file = event.target.files[0];
  if (file) {
    currentTaleForm.value.coverImageFile = file;
    currentTaleForm.value.coverImagePreviewUrl = URL.createObjectURL(file);
    currentTaleForm.value.coverImageCid = '';
  }
}
// New handler for thumbnail image
function handleThumbnailImageFileChange(event) {
  const file = event.target.files[0];
  if (file) {
    currentTaleForm.value.thumbnailImageFile = file;
    currentTaleForm.value.thumbnailImagePreviewUrl = URL.createObjectURL(file);
    currentTaleForm.value.thumbnailCid = '';
  }
}

function openTaleModal() {
  currentTaleForm.value = defaultTaleForm();
  showTaleModal.value = true;
}

async function openEditTaleModal(taleAccount) {
    let contentMarkdownForForm = "";
    if (taleAccount.account.contentCid) {
        try {
            const response = await axios.get(`https://gateway.pinata.cloud/ipfs/${taleAccount.account.contentCid}`);
            contentMarkdownForForm = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
        } catch (e) {
            contentMarkdownForForm = `Error fetching content (CID: ${taleAccount.account.contentCid}). Please re-upload or edit.`;
            showUiMessage("Could not fetch existing content from IPFS for editing.", "warning");
        }
    }

  currentTaleForm.value = {
    editingExistingOnChainTale: true,
    onChainTaleIdSeedToEdit: taleAccount.account.taleId,
    title: taleAccount.account.title,
    genre: taleAccount.account.genre,
    contentMarkdown: contentMarkdownForForm,
    originalContentMarkdown: contentMarkdownForForm,
    coverImageFile: null,
    coverImagePreviewUrl: taleAccount.account.coverImageCid ? `https://gateway.pinata.cloud/ipfs/${taleAccount.account.coverImageCid}` : '',
    coverImageCid: taleAccount.account.coverImageCid,
    thumbnailImageFile: null, // New
    thumbnailImagePreviewUrl: taleAccount.account.thumbnailCid ? `https://gateway.pinata.cloud/ipfs/${taleAccount.account.thumbnailCid}` : '', // New
    thumbnailCid: taleAccount.account.thumbnailCid, // New
    status: taleAccount.account.status,
    candyMachineAddress: taleAccount.account.candyMachineAddress ? taleAccount.account.candyMachineAddress.toString() : '',
    isGovernanceTokenGated: taleAccount.account.isGovernanceTokenGated,
    isEarlyAccessTokenGated: taleAccount.account.isEarlyAccessTokenGated,
    isRealWorldAssetGated: taleAccount.account.isRealWorldAssetGated,
  };
  showTaleModal.value = true;
}

function closeTaleModal() {
  showTaleModal.value = false;
  currentTaleForm.value = defaultTaleForm();
  const coverInput = document.getElementById('coverImageFile');
  if (coverInput) coverInput.value = null;
  const thumbInput = document.getElementById('thumbnailImageFile'); // Clear thumbnail input
  if (thumbInput) thumbInput.value = null;
}

async function handleSaveTale() {
  if (!program || !wallet.publicKey.value) {
    showUiMessage("Wallet not connected or program not initialized.", "error"); return;
  }
  isSavingTale.value = true;
  let finalCoverImageCid = currentTaleForm.value.coverImageCid;
  let finalThumbnailCid = currentTaleForm.value.thumbnailCid;
  let finalContentCid = '';

  try {
    // 1. Upload Cover Image
    if (currentTaleForm.value.coverImageFile) {
      isUploadingCover.value = true;
      showUiMessage("Uploading cover image...", "loading", null, 0);
      const coverUploadResult = await uploadFileToIPFS(currentTaleForm.value.coverImageFile);
      isUploadingCover.value = false;
      if (coverUploadResult.success) {
        finalCoverImageCid = coverUploadResult.ipfsHash;
        currentTaleForm.value.coverImageCid = finalCoverImageCid;
        showUiMessage("Cover image uploaded.", "info", null, 2000);
      } else {
        throw new Error(coverUploadResult.error || "Cover image IPFS upload failed");
      }
    }
    // 2. Upload Thumbnail Image
    if (currentTaleForm.value.thumbnailImageFile) {
      isUploadingThumbnail.value = true;
      showUiMessage("Uploading thumbnail image...", "loading", null, 0);
      const thumbUploadResult = await uploadFileToIPFS(currentTaleForm.value.thumbnailImageFile);
      isUploadingThumbnail.value = false;
      if (thumbUploadResult.success) {
        finalThumbnailCid = thumbUploadResult.ipfsHash;
        currentTaleForm.value.thumbnailCid = finalThumbnailCid;
        showUiMessage("Thumbnail image uploaded.", "info", null, 2000);
      } else {
        throw new Error(thumbUploadResult.error || "Thumbnail image IPFS upload failed");
      }
    }
    // 3. Upload Content Markdown
    if (currentTaleForm.value.contentMarkdown &&
        (!currentTaleForm.value.editingExistingOnChainTale ||
         currentTaleForm.value.contentMarkdown !== currentTaleForm.value.originalContentMarkdown)) {
      showUiMessage("Uploading content to IPFS...", "loading", null, 0);
      const textFileName = `${(currentTaleForm.value.title || 'tale').replace(/\s+/g, '_')}_${Date.now()}.md`;
      const textUploadResult = await uploadTextToIPFS(currentTaleForm.value.contentMarkdown, textFileName);
      if (textUploadResult.success) {
        finalContentCid = textUploadResult.ipfsHash;
        showUiMessage("Content uploaded to IPFS.", "info", null, 2000);
      } else {
        throw new Error(textUploadResult.error || "Content IPFS upload failed");
      }
    } else if (currentTaleForm.value.editingExistingOnChainTale) {
        const existingTale = authorTales.value.find(t => t.account.taleId === currentTaleForm.value.onChainTaleIdSeedToEdit);
        finalContentCid = existingTale?.account?.contentCid || '';
    }
    console.log(`Final Content CID for on-chain: "${finalContentCid}" (Length: ${finalContentCid?.length || 0})`);
    const taleIdSeed = currentTaleForm.value.editingExistingOnChainTale
      ? currentTaleForm.value.onChainTaleIdSeedToEdit
      : uuidv4().substring(0, MAX_ONCHAIN_TALE_ID_LENGTH);

    let candyMachineAddressPk = null;
    if (currentTaleForm.value.candyMachineAddress && currentTaleForm.value.candyMachineAddress.trim() !== '') {
        try {
            candyMachineAddressPk = new PublicKey(currentTaleForm.value.candyMachineAddress.trim());
        } catch (e) {
            throw new Error("Invalid Candy Machine Address format.");
        }
    }

    const commonArgs = [
      currentTaleForm.value.title,
      finalContentCid,
      currentTaleForm.value.genre,
      finalCoverImageCid,
      finalThumbnailCid,
      currentTaleForm.value.status, // This is the initial_status for create_tale
      candyMachineAddressPk,
      currentTaleForm.value.isGovernanceTokenGated,
      currentTaleForm.value.isEarlyAccessTokenGated,
      currentTaleForm.value.isRealWorldAssetGated,
    ];

    let txSignature = '';
    const taleIdSeedBuffer = Buffer.from(taleIdSeed, 'utf-8');

    if (currentTaleForm.value.editingExistingOnChainTale) {
      showUiMessage("Updating on-chain tale...", "loading", null, 0);
      const taleAccountPda = (await PublicKey.findProgramAddress(
          [Buffer.from("tale", 'utf-8'), taleIdSeedBuffer], PROGRAM_ID
      ))[0];

      // ***** DIAGNOSTIC LOG for update_tale *****
      console.log("Calling updateTale with args:", ...commonArgs);
      console.log("Status value for update:", currentTaleForm.value.status, "Type:", typeof currentTaleForm.value.status);


      txSignature = await program.methods.updateTale(...commonArgs)
        .accounts({
          taleAccount: taleAccountPda,
          author: wallet.publicKey.value,
        })
        .rpc();
      showUiMessage("On-chain tale updated!", "success", txSignature);
    } else {
      showUiMessage("Creating on-chain tale...", "loading", null, 0);
      const createArgs = [taleIdSeed, ...commonArgs];

      // ***** DIAGNOSTIC LOG for create_tale *****
      console.log("Calling createTale with args:", ...createArgs);
      console.log("Status value for create:", currentTaleForm.value.status, "Type:", typeof currentTaleForm.value.status);


      const taleAccountPda = (await PublicKey.findProgramAddress(
          [Buffer.from("tale", 'utf-8'), taleIdSeedBuffer], PROGRAM_ID
      ))[0];

      txSignature = await program.methods.createTale(...createArgs)
        .accounts({
          taleAccount: taleAccountPda,
          author: wallet.publicKey.value,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      showUiMessage("On-chain tale created!", "success", txSignature);
    }

    await fetchAuthorOnChainTales();
    closeTaleModal();

  } catch (error) {
    console.error('TaleManager: Error saving tale:', error);
    let errorMsg = error.message || error.toString();
    if (error.logs) errorMsg += ` Logs: ${error.logs.join(', ')}`;
    showUiMessage(`Save tale error: ${errorMsg}`, "error", error.signature);
  } finally {
    isSavingTale.value = false;
    isUploadingCover.value = false;
    isUploadingThumbnail.value = false;
    if (uiMessage.value.type === 'loading') showUiMessage("","info");
  }
}

async function confirmDeleteTale(taleAccount) {
  if (!program || !wallet.publicKey.value) {
    showUiMessage("Wallet not connected or program not initialized.", "error"); return;
  }
  if (window.confirm(`Are you sure you want to delete the on-chain record for "${taleAccount.account.title}"? This cannot be undone.`)) {
    isSavingTale.value = true;
    showUiMessage(`Deleting tale "${taleAccount.account.title}"...`, "loading", null, 0);
    try {
      const talePda = (await PublicKey.findProgramAddress(
          [Buffer.from("tale"), Buffer.from(taleAccount.account.taleId)], PROGRAM_ID
      ))[0];

      const txSignature = await program.methods.deleteTale()
        .accounts({
          taleAccount: talePda,
          author: wallet.publicKey.value,
        })
        .rpc();
      showUiMessage(`Tale "${taleAccount.account.title}" deleted successfully.`, "success", txSignature);
      await fetchAuthorOnChainTales();
    } catch (error) {
      console.error('TaleManager: Error deleting tale:', error);
      let errorMsg = error.message || error.toString();
      if (error.logs) errorMsg += ` Logs: ${error.logs.join(', ')}`;
      showUiMessage(`Delete tale error: ${errorMsg}`, "error", error.signature);
    } finally {
      isSavingTale.value = false;
      if (uiMessage.value.type === 'loading') showUiMessage("","info");
    }
  }
}

// --- Lifecycle Hooks ---
onMounted(() => {
  if (typeof window !== 'undefined' && !window.Buffer) { window.Buffer = Buffer; }
  if (!wallet.connected.value) {
    showUiMessage("Please connect your wallet to manage tales.", "info");
  }
});

</script>

<style scoped>
.tale-manager-container {
  max-width: 1200px;
  margin: 2rem auto;
  padding: 1rem 2rem;
  font-family: 'Arial', sans-serif;
}

.page-title {
  text-align: center;
  color: #2c3e50;
  margin-bottom: 2rem;
  font-size: 2.5rem;
}
.wallet-prompt-section, .info-box {
  text-align: center;
  padding: 2rem;
  background-color: #f0f4f8; /* Light blue-grey */
  border-radius: 8px;
  margin-bottom: 2rem;
  color: #4a5568; /* Slate */
}
.wallet-button-wrapper {
  margin-top: 1rem;
  display: flex;
  justify-content: center;
}
.wallet-button-wrapper > :deep(.wallet-adapter-button-trigger) {
  background-color: #4A90E2 !important; /* Brighter Blue */
  color: white !important;
  font-weight: bold !important;
  border-radius: 6px !important;
  padding: 0.75rem 1.5rem !important;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
.wallet-button-wrapper > :deep(.wallet-adapter-button-trigger:hover) {
  background-color: #357ABD !important;
}
.user-role-display {
    font-weight: bold;
    color: #c0392b; /* Reddish for emphasis */
}
.link {
    color: #3498db;
    text-decoration: underline;
    cursor: pointer;
}
.link:hover {
    color: #2980b9;
}

.ui-message {
  padding: 1rem;
  margin-bottom: 1.5rem;
  border-radius: 6px;
  text-align: center;
  font-weight: 500;
}
.ui-message-error { background-color: #ffebee; border: 1px solid #ef9a9a; color: #c62828; }
.ui-message-success { background-color: #e8f5e9; border: 1px solid #a5d6a7; color: #2e7d32; }
.ui-message-info { background-color: #e3f2fd; border: 1px solid #90caf9; color: #1565c0; }
.ui-message-loading { background-color: #fffde7; border: 1px solid #fff59d; color: #f57f17; }
.ui-message-warning { background-color: #fff3e0; border: 1px solid #ffcc80; color: #e65100; }

.tx-link-container { margin-top: 0.5rem; }
.transaction-link { font-size: 0.9rem; text-decoration: underline; }

.manager-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.btn {
  padding: 0.6rem 1.2rem;
  border: none;
  border-radius: 6px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease, box-shadow 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
}
.btn:disabled {
  background-color: #ccc !important;
  color: #666 !important;
  cursor: not-allowed;
  box-shadow: none;
}
.btn-primary { background-color: #3498db; color: white; } /* Blue */
.btn-primary:hover:not(:disabled) { background-color: #2980b9; }
.btn-success { background-color: #2ecc71; color: white; } /* Green */
.btn-success:hover:not(:disabled) { background-color: #27ae60; }
.btn-warning { background-color: #f39c12; color: white; } /* Orange */
.btn-warning:hover:not(:disabled) { background-color: #e67e22; }
.btn-danger { background-color: #e74c3c; color: white; } /* Red */
.btn-danger:hover:not(:disabled) { background-color: #c0392b; }
.btn-info { background-color: #1abc9c; color: white; } /* Turquoise */
.btn-info:hover:not(:disabled) { background-color: #16a085; }
.btn-secondary { background-color: #bdc3c7; color: #2c3e50; } /* Clouds */
.btn-secondary:hover:not(:disabled) { background-color: #95a5a6; }
.btn-xs { padding: 0.3rem 0.6rem; font-size: 0.8rem; }
.btn-add-tale { font-size: 1.1rem; padding: 0.8rem 1.5rem; margin-bottom: 1rem; align-self: flex-start; }

.modal-overlay {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background-color: rgba(0,0,0,0.6); display: flex;
  justify-content: center; align-items: center; z-index: 1000;
}
.modal-content-wrapper {
  background-color: white; padding: 2rem; border-radius: 8px;
  box-shadow: 0 5px 20px rgba(0,0,0,0.25); width: 90%; max-width: 650px;
  max-height: 90vh; overflow-y: auto;
}
.modal-title { font-size: 1.8rem; color: #333; margin-bottom: 1.5rem; text-align: center; }
.modal-form { display: flex; flex-direction: column; gap: 1.25rem; }
.form-group { display: flex; flex-direction: column; }
.form-label { margin-bottom: 0.5rem; font-weight: 600; color: #555; font-size: 0.9rem; }
.form-input, .form-select, .form-textarea, .form-file-input {
  padding: 0.75rem; border: 1px solid #ccc; border-radius: 4px; font-size: 1rem;
  width: 100%; box-sizing: border-box;
}
.form-input-readonly { background-color: #f8f9fa; cursor: not-allowed; }
.form-textarea { min-height: 100px; resize: vertical; }
.form-checkbox { margin-right: 0.5rem; transform: scale(1.1); }
.checkbox-label { display: flex; align-items: center; font-weight: normal; font-size: 0.95rem; }
.checkbox-group { display: flex; flex-direction: column; gap: 0.5rem; }
.image-preview { max-width: 150px; max-height: 100px; margin-top: 0.5rem; border-radius: 4px; border: 1px solid #ddd; object-fit: cover;}
.modal-actions { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1.5rem; }
.mt-2 { margin-top: 0.5rem; }

.form-fieldset {
    border: 1px solid #e0e0e0;
    padding: 1rem 1.5rem;
    border-radius: 6px;
    margin-top: 0.5rem;
}
.form-legend {
    font-weight: bold;
    color: #3f51b5;
    padding: 0 0.5rem;
    margin-left: 0.5rem;
    font-size: 1rem;
}

.loading-indicator-list, .no-tales-message { text-align: center; padding: 2rem; color: #555; }
.spinner {
  border: 4px solid rgba(0,0,0,0.1);
  width: 36px; height: 36px;
  border-radius: 50%;
  border-left-color: #09f;
  animation: spin 1s ease infinite;
  margin: 0 auto 1rem;
}
@keyframes spin { to { transform: rotate(360deg); } }

.tales-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}
.tale-item-card {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.tale-item-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 5px 15px rgba(0,0,0,0.12);
}
.tale-thumbnail-list {
  width: 100%;
  height: 180px;
  object-fit: cover;
  border-bottom: 1px solid #eee;
}
.tale-item-content {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}
.tale-item-title {
  font-size: 1.25rem;
  color: #333;
  margin: 0 0 0.5rem 0;
  line-height: 1.3;
}
.tale-item-meta {
  font-size: 0.85rem;
  color: #666;
  margin-bottom: 0.3rem;
}
.status-badge {
    padding: 0.2em 0.5em;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: bold;
    text-transform: uppercase;
    color: white;
}
.status-draft { background-color: #78909c; } /* Blue Grey */
.status-published { background-color: #66bb6a; } /* Green */
.status-archived { background-color: #bdbdbd; } /* Grey */
.gating-tag {
    background-color: #e0e0e0;
    color: #555;
    padding: 0.15em 0.4em;
    border-radius: 3px;
    font-size: 0.7rem;
    margin-right: 0.3em;
}

.tale-item-actions {
  margin-top: auto; /* Pushes actions to the bottom */
  padding-top: 0.75rem;
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap; /* Allow buttons to wrap on small cards */
}
</style>