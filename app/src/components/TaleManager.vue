<template>
  <div class="tales-manager-container">
    <h1 class="page-main-title">Tales of Readium (On-Chain)</h1>

    <div v-if="wallet.connected.value && appUser" class="user-welcome-banner">
      <p>Welcome, <span class="user-name-display">{{ appUser.name }}</span> ({{ appUser.type }})!</p>
      <button
        v-if="appUser.type === 'creator'"
        @click="openCreateModal()"
        class="btn btn-primary create-tale-button"
      >
        + Create New Tale (On-Chain)
      </button>
    </div>
     <div v-else-if="wallet.connected.value && !appUser && !isLoadingUser" class="login-register-prompt">
        <p>Please <router-link :to="{name: 'Auth'}" class="link auth-link">Login/Register</router-link> to manage tales.</p>
    </div>
     <div v-else-if="!wallet.connected.value" class="login-register-prompt">
        <p>Please connect your wallet to manage or view tales.</p>
        <div class="wallet-button-wrapper">
            <WalletMultiButton />
        </div>
    </div>

    <div v-if="uiMessage.text"
         :class="['ui-message-global', `ui-message-${uiMessage.type}`]">
      {{ uiMessage.text }}
    </div>

    <div v-if="showCreateModal || editingTale" class="modal-overlay">
      <div class="modal-content-container">
        <h2 class="modal-main-title">{{ editingTale ? 'Edit On-Chain Tale' : 'Create New On-Chain Tale' }}</h2>
        <form @submit.prevent="handleSaveTale" class="modal-form-layout">
          <div class="form-group">
            <label for="taleTitle" class="form-label">Title (max 100 chars):</label>
            <input type="text" id="taleTitle" v-model="currentTale.title" class="form-input-field" required maxlength="100" />
          </div>
          <div class="form-group">
            <label for="taleContent" class="form-label">Content (Markdown - will be uploaded to IPFS):</label>
            <textarea id="taleContent" v-model="currentTale.contentMarkdown" class="form-textarea-field" required></textarea>
          </div>
           <div class="form-group">
            <label for="taleCoverImageFile" class="form-label">Cover Image (will be uploaded to IPFS):</label>
            <input type="file" id="taleCoverImageFile" @change="handleCoverImageFileChange" class="form-file-upload" accept="image/*" />
            <div v-if="coverImagePreview" class="image-preview-container">
              <img :src="coverImagePreview" alt="Cover Preview" class="cover-image-preview" />
            </div>
            <small v-else-if="currentTale.coverImageCid" class="form-text-info">Current image CID: {{ shortenAddress(currentTale.coverImageCid, 15) }}</small>
          </div>
          <div class="form-grid-halves">
            <div class="form-group">
              <label for="taleGenre" class="form-label">Genre (max 30 chars):</label>
              <input type="text" id="taleGenre" v-model="currentTale.genre" class="form-input-field" placeholder="e.g., Fantasy" maxlength="30" />
            </div>
            <div class="form-group">
              <label for="taleStatus" class="form-label">Status:</label>
              <select id="taleStatus" v-model="currentTale.status" class="form-select-field">
                <option value="0">Draft</option>
                <option value="1">Published</option>
                <option value="2">Archived</option>
              </select>
            </div>
          </div>
          <div v-if="editingTale" class="form-group">
            <label class="form-label">Tale ID (On-Chain):</label>
            <input type="text" :value="currentTale.taleId" class="form-input-field" readonly />
          </div>

          <div class="modal-action-buttons">
            <button type="button" @click="closeModal" class="btn btn-secondary">Cancel</button>
            <button type="submit" :disabled="isSavingTale || isUploading" class="btn btn-success">
              <span v-if="isUploading">Uploading to IPFS...</span>
              <span v-else-if="isSavingTale">{{ editingTale ? 'Updating On-Chain...' : 'Creating On-Chain...' }}</span>
              <span v-else>{{ editingTale ? 'Update Tale' : 'Create Tale' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <div class="tales-list-section">
      <h2 class="section-title-main">On-Chain Tales</h2>
       <button @click="fetchOnChainTales" :disabled="isLoadingTales || !wallet.connected.value" class="btn btn-info refresh-button">
        {{ isLoadingTales ? 'Loading...' : 'Refresh On-Chain Tales' }}
      </button>
      <div v-if="isLoadingTales" class="loading-tales-indicator">
        <div class="spinner"></div>
        <p>Loading on-chain tales...</p>
      </div>
      <div v-else-if="onChainTales.length === 0 && wallet.connected.value" class="info-box no-tales-message">
        No on-chain tales found for this program.
      </div>
       <div v-else-if="!wallet.connected.value" class="info-box no-tales-message">
        Connect your wallet to view on-chain tales.
      </div>
      <div v-else class="tales-grid-layout">
        <div v-for="tale in onChainTales" :key="tale.publicKey.toString()" class="tale-card-item">
          <img v-if="tale.account.coverImageCid" :src="`https://gateway.pinata.cloud/ipfs/${tale.account.coverImageCid}`" @error="setDefaultImage" alt="Tale Cover" class="tale-card-image"/>
          <img v-else src="https://placehold.co/600x400/gray/white?text=No+Image" alt="Default Tale Cover" class="tale-card-image"/>
          <div class="tale-card-body">
            <h3 class="tale-card-title">{{ tale.account.title }}</h3>
            <p class="tale-card-meta">Author: {{ shortenAddress(tale.account.author.toString()) }}</p>
            <p class="tale-card-meta">Genre: {{ tale.account.genre }}</p>
            <p class="tale-card-meta">Status: {{ getStatusString(tale.account.status) }}</p>
            <p class="tale-card-meta">Tale ID: {{ shortenAddress(tale.account.taleId, 10) }}</p>
            <p class="tale-card-meta">Content CID: <a :href="`https://gateway.pinata.cloud/ipfs/${tale.account.contentCid}`" target="_blank" class="link">{{ shortenAddress(tale.account.contentCid, 10) }}</a></p>
            <button @click="viewOnChainTale(tale)" class="btn btn-info tale-card-button">View Details</button>
             <div v-if="appUser && wallet.publicKey.value && wallet.publicKey.value.toString() === tale.account.author.toString()" class="tale-card-actions">
              <button @click="editOnChainTale(tale)" class="btn btn-warning btn-xs">Edit</button>
              <button @click="confirmDeleteOnChainTale(tale)" class="btn btn-danger btn-xs">Delete</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="viewingTale" class="modal-overlay view-tale-modal">
      <div class="modal-content-container view-tale-modal-content">
        <h2 class="modal-main-title view-tale-title">{{ viewingTale.account.title }}</h2>
        <img v-if="viewingTale.account.coverImageCid" :src="`https://gateway.pinata.cloud/ipfs/${viewingTale.account.coverImageCid}`" @error="setDefaultImage" alt="Tale Cover" class="view-tale-cover-image"/>
        <p class="view-tale-meta">Author: {{ shortenAddress(viewingTale.account.author.toString()) }}</p>
        <p class="view-tale-meta">Genre: {{ viewingTale.account.genre }} | Status: {{ getStatusString(viewingTale.account.status) }}</p>
        <p class="view-tale-meta">Tale ID (PDA Seed): {{ viewingTale.account.taleId }}</p>
        <p class="view-tale-meta">PDA Address: {{ viewingTale.publicKey.toString() }}</p>
        <div class="prose-styles view-tale-prose">
            <p><strong>Content (from IPFS):</strong></p>
            <div v-if="ipfsContentLoading" class="spinner"></div>
            <div v-else-if="ipfsContentError" class="error-box">{{ ipfsContentError }}</div>
            <div v-else v-html="renderMarkdown(fetchedIpfsContent)"></div>
        </div>
        <button @click="viewingTale = null" class="btn btn-secondary view-tale-close-button">Close</button>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useWallet, WalletMultiButton } from 'solana-wallets-vue';
import { Connection, PublicKey, SystemProgram } from '@solana/web3.js';
import { Program, AnchorProvider, web3 } from '@coral-xyz/anchor';
import { Buffer }from 'buffer';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios'
import { uploadFileToIPFS, uploadJsonToIPFS, uploadTextToIPFS } from '../services/pinataService';
import { marked } from 'marked';
// import { IDL, readium_fun } from "../anchor/idl";
// --- Configuration ---
const AUTH_API_BASE_URL = import.meta.env.VITE_APP_AUTH_API_URL || 'http://localhost:3000/api';
const JWT_TOKEN_KEY = 'readium_fun_jwt_token';
const SOLANA_RPC_URL = import.meta.env.VITE_RPC_ENDPOINT || 'https://api.devnet.solana.com';

// **IMPORTANT**: Replace the placeholder IDL below with a direct import of your actual generated IDL JSON file.
import idl from './readium_fun.json'
// Then use: const idl = idlFromFile;
// The PROGRAM_ID must also match the "address" in your IDL's metadata.
const PROGRAM_ID = new PublicKey("EynuKneQ6RX5AAUY8E6Lq6WvNrUVY2F3C8TcFNB7MYh8"); // Updated to your IDL's address

// const idl = { // This is now structured based on your provided idl.json
//   "address": "EynuKneQ6RX5AAUY8E6Lq6WvNrUVY2F3C8TcFNB7MYh8",
//   "metadata": {
//     "name": "readium_fun",
//     "version": "0.1.0",
//     "spec": "0.1.0",
//     "description": "Created with Anchor"
//   },
//   "instructions": [
//     {
//       "name": "create_tale",
//       "discriminator": [ 97, 241, 193, 26, 247, 45, 207, 73 ],
//       "accounts": [
//         { "name": "tale_account", "writable": true, "pda": { "seeds": [ { "kind": "const", "value": [ 116, 97, 108, 101 ] }, { "kind": "arg", "path": "tale_id" } ] } },
//         { "name": "author", "writable": true, "signer": true },
//         { "name": "system_program", "address": "11111111111111111111111111111111" }
//       ],
//       "args": [
//         { "name": "tale_id", "type": "string" }, { "name": "title", "type": "string" }, { "name": "content_cid", "type": "string" },
//         { "name": "genre", "type": "string" }, { "name": "cover_image_cid", "type": "string" }, { "name": "initial_status", "type": "u8" }
//       ]
//     },
//     {
//       "name": "delete_tale",
//       "discriminator": [ 86, 32, 28, 147, 75, 234, 169, 161 ],
//       "accounts": [
//         { "name": "tale_account", "writable": true, "pda": { "seeds": [ { "kind": "const", "value": [ 116, 97, 108, 101 ] }, { "kind": "account", "path": "tale_account.tale_id", "account": "Tale" } ] } },
//         { "name": "author", "writable": true, "signer": true, "relations": [ "tale_account" ] }
//       ],
//       "args": []
//     },
//     {
//       "name": "update_tale",
//       "discriminator": [ 168, 83, 72, 113, 172, 101, 87, 217 ],
//       "accounts": [
//         { "name": "tale_account", "writable": true, "pda": { "seeds": [ { "kind": "const", "value": [ 116, 97, 108, 101 ] }, { "kind": "account", "path": "tale_account.tale_id", "account": "Tale" } ] } },
//         { "name": "author", "writable": true, "signer": true, "relations": [ "tale_account" ] }
//       ],
//       "args": [
//         { "name": "new_title", "type": "string" }, { "name": "new_content_cid", "type": "string" }, { "name": "new_genre", "type": "string" },
//         { "name": "new_cover_image_cid", "type": "string" }, { "name": "new_status", "type": "u8" }
//       ]
//     }
//   ],
//   "accounts": [ // This section defines how Anchor JS client finds the struct definition
//     {
//       "name": "Tale", // Name matches the account struct name in Rust
//       // The full definition is expected here by default for program.account.tale
//       // However, if your Anchor version links "types" correctly, this might be okay.
//       // For safety and common practice, the full type def is often here.
//       // The error you saw (reading 'size') suggests it might not be finding the full def.
//       // Let's use the structure from your IDL, assuming Anchor JS can link it to `types`.
//       "discriminator": [ 109, 239, 69, 41, 35, 229, 44, 219 ]
//     }
//   ],
//   "errors": [
//     { "code": 6000, "name": "TitleTooLong", "msg": "Title is too long." },
//     { "code": 6001, "name": "ContentCidTooLong", "msg": "Content CID is too long." },
//     { "code": 6002, "name": "GenreTooLong", "msg": "Genre is too long." },
//     { "code": 6003, "name": "CoverImageCidTooLong", "msg": "Cover image CID is too long." },
//     { "code": 6004, "name": "Unauthorized", "msg": "Unauthorized action." },
//     { "code": 6005, "name": "InvalidStatus", "msg": "Invalid status value." },
//     { "code": 6006, "name": "TalePublished", "msg": "Tale is already published and cannot be modified in this way." },
//     { "code": 6007, "name": "CannotDeletePublished", "msg": "Cannot delete a published tale directly. Set to archived first." }
//   ],
//   "types": [ // The full struct definition is here in your IDL
//     {
//       "name": "Tale",
//       "type": {
//         "kind": "struct",
//         "fields": [
//           { "name": "author", "type": "publicKey" }, { "name": "tale_id", "type": "string" }, { "name": "title", "type": "string" },
//           { "name": "content_cid", "type": "string" }, { "name": "genre", "type": "string" }, { "name": "cover_image_cid", "type": "string" },
//           { "name": "status", "type": "u8" }, { "name": "timestamp", "type": "i64" }, { "name": "bump", "type": "u8" }
//         ]
//       }
//     }
//   ]
// };


// --- Wallet and Program ---
const idl = idlFromFile
const wallet = useWallet();
const connection = new Connection(SOLANA_RPC_URL, "confirmed");
let provider;
let program;

// --- App User State ---
const appUser = ref(null);
const isLoadingUser = ref(false);

// --- Tales State ---
const onChainTales = ref([]);
const isLoadingTales = ref(false);
const showCreateModal = ref(false);
const editingTale = ref(null);
const viewingTale = ref(null);
const isSavingTale = ref(false);
const isUploading = ref(false);

const defaultTaleForm = () => ({
  taleId: '',
  title: '',
  contentMarkdown: '',
  contentCid: '',
  genre: 'General',
  status: 0,
  coverImageCid: '',
});
const currentTale = ref(defaultTaleForm());
const coverImageFile = ref(null);
const coverImagePreview = ref('');

const fetchedIpfsContent = ref('');
const ipfsContentLoading = ref(false);
const ipfsContentError = ref('');

const uiMessage = ref({ text: '', type: 'info' });

// --- Watcher for wallet connection ---
watch(() => wallet.connected.value, (isConnected, wasConnected) => {
  if (isConnected && wallet.publicKey.value) {
    if (!program || provider?.wallet?.publicKey?.toBase58() !== wallet.publicKey.value.toBase58()) {
        if (wallet.wallet.value && wallet.wallet.value.adapter) {
             provider = new AnchorProvider(connection, wallet.wallet.value.adapter, AnchorProvider.defaultOptions());
             try {
                program = new Program(idl, provider);
                console.log("TaleManager: Anchor Program Initialized with wallet:", wallet.publicKey.value.toBase58());
             } catch (e) {
                console.error("TaleManager: Error initializing Anchor Program:", e);
                showUiMessage(`Failed to initialize on-chain program: ${e.message}`, "error");
                program = null;
                provider = null;
                return;
             }
        } else {
            console.error("TaleManager: Wallet adapter not available for AnchorProvider.");
            showUiMessage("Wallet adapter missing. Cannot initialize on-chain program.", "error");
            program = null;
            provider = null;
            return;
        }
    }
    if (program) { // Ensure program was successfully initialized
        fetchOnChainTales();
    }
  } else {
    program = null;
    provider = null;
    if (wasConnected === true && !isConnected) {
        if (onChainTales.value.length > 0) {
            onChainTales.value = [];
        }
    } else if (wasConnected === undefined && !isConnected) {
      // Initial load, wallet not connected
    }
  }
}, { immediate: true });


// --- Utility Functions ---
function showUiMessage(msg, type = 'info', duration = 5000) {
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
  event.target.src = 'https://placehold.co/600x400/gray/white?text=Error';
};
const renderMarkdown = (markdownText) => {
  if (!markdownText) return '';
  return marked(markdownText);
};
const getStatusString = (statusNumber) => {
  if (statusNumber === 0) return 'Draft';
  if (statusNumber === 1) return 'Published';
  if (statusNumber === 2) return 'Archived';
  return 'Unknown';
};

// --- User Fetching ---
async function fetchAppUser() {
  const token = localStorage.getItem(JWT_TOKEN_KEY);
  console.log(token)
  if (!token || !wallet.connected.value) {
    appUser.value = null;
    return;
  }
  isLoadingUser.value = true;
  try {
    const authApiClient = axios.create({ baseURL: AUTH_API_BASE_URL });
    const response = await authApiClient.get('/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.data.success) {
      appUser.value = response.data.data;
    } else {
      appUser.value = null;
      // localStorage.removeItem(JWT_TOKEN_KEY);
    }
  } catch (error) {
    console.error("Failed to fetch app user:", error);
    appUser.value = null;
    // localStorage.removeItem(JWT_TOKEN_KEY);
  } finally {
    isLoadingUser.value = false;
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

function handleCoverImageFileChange(event) {
  const file = event.target.files[0];
  if (file) {
    coverImageFile.value = file;
    const reader = new FileReader();
    reader.onload = (e) => { coverImagePreview.value = e.target.result; };
    reader.readAsDataURL(file);
  } else {
    coverImageFile.value = null;
    coverImagePreview.value = '';
  }
}

async function handleSaveTale() {
  console.log(program,wallet)
  if (!program || !wallet.publicKey.value) {
    showUiMessage("Wallet not connected or program not initialized.", "error");
    return;
  }
  if (!appUser.value || appUser.value.type !== 'creator') {
     showUiMessage("Only 'creator' type users can manage on-chain tales.", "error");
    return;
  }

  isUploading.value = true;
  showUiMessage("Preparing data and uploading to IPFS...", "info", 0);

  let coverCid = editingTale.value ? currentTale.value.coverImageCid : '';
  if (coverImageFile.value) {
    try {
      const uploadResult = await uploadFileToIPFS(coverImageFile.value);
      if (uploadResult.success) {
        coverCid = uploadResult.ipfsHash;
      } else {
        throw new Error(uploadResult.error || "Cover image IPFS upload failed");
      }
    } catch (uploadError) {
      showUiMessage(`Cover image upload failed: ${uploadError.message}`, "error");
      isUploading.value = false;
      return;
    }
  }

  let contentCid = editingTale.value ? currentTale.value.contentCid : '';
  if (currentTale.value.contentMarkdown && (!editingTale.value || currentTale.value.contentMarkdown !== editingTale.value.originalContentMarkdown)) {
    try {
      const textFileName = `${(currentTale.value.title || 'tale').replace(/\s+/g, '_')}_${Date.now()}.md`;
      const textUploadResult = await uploadTextToIPFS(currentTale.value.contentMarkdown, textFileName);
      if (textUploadResult.success) {
        contentCid = textUploadResult.ipfsHash;
      } else {
        throw new Error(textUploadResult.error || "Content IPFS upload failed");
      }
    } catch (uploadError) {
      showUiMessage(`Content upload to IPFS failed: ${uploadError.message}`, "error");
      isUploading.value = false;
      return;
    }
  }
  isUploading.value = false;
  isSavingTale.value = true;

  try {
    if (editingTale.value) {
      showUiMessage("Updating tale on-chain...", "info", 0);
      const taleAccountPDA = editingTale.value.publicKey;

      await program.methods.updateTale( // Ensure method name matches IDL: update_tale
        currentTale.value.title,
        contentCid || "",
        currentTale.value.genre || "",
        coverCid || "",
        parseInt(currentTale.value.status, 10)
      )
      .accounts({
        taleAccount: taleAccountPDA,
        author: wallet.publicKey.value,
      })
      .rpc();
      showUiMessage("Tale updated successfully on-chain!", "success");

    } else {
      showUiMessage("Creating tale on-chain...", "info", 0);
      const newTaleId = uuidv4();

      const taleIdForSeedAndStorage = newTaleId.substring(0, 32);
      currentTale.value.taleId = taleIdForSeedAndStorage;

      // PDA derivation is handled by Anchor when accounts are resolved based on seeds in IDL
      // We still need to pass the taleId as an argument.
       // Explicitly derive PDA for create_tale
      //  const [taleAccountPDA, _bump] = PublicKey.findProgramAddressSync(
      //   [Buffer.from("tale"), Buffer.from(newTaleId)],
      //   PROGRAM_ID
      // );
      await program.methods.createTale( // Ensure method name matches IDL: create_tale
      taleIdForSeedAndStorage,
        currentTale.value.title,
        contentCid || "",
        currentTale.value.genre || "",
        coverCid || "",
        parseInt(currentTale.value.status, 10)
      )
      .accounts({
        // taleAccount: taleAccountPDA, // Anchor resolves PDA from seeds in IDL
        author: wallet.publicKey.value,
        systemProgram: SystemProgram.programId,
      })
      // For instructions with PDA init, Anchor often infers the PDA if seeds are args
      // If not, you might need to explicitly pass it if the IDL structure requires it.
      // Given the IDL's `create_tale` `accounts` doesn't explicitly name `tale_account` as a pre-calculated PDA,
      // but defines its seeds, Anchor will derive it.
      .rpc();
      showUiMessage("Tale created successfully on-chain!", "success");
    }
    fetchOnChainTales();
    closeModal();
  } catch (error) {
    console.error('On-chain save error:', error);
    let errorMsg = error.message || error.toString();
    if (error.logs) {
        errorMsg += ` Logs: ${error.logs.join(', ')}`;
    }
    showUiMessage(`On-chain error: ${errorMsg}`, "error");
  } finally {
    isSavingTale.value = false;
  }
}

function openCreateModal() {
  if (!appUser.value || appUser.value.type !== 'creator') {
    showUiMessage("Only creators can create tales.", "warning");
    return;
  }
  editingTale.value = null;
  currentTale.value = defaultTaleForm();
  coverImageFile.value = null;
  coverImagePreview.value = '';
  showCreateModal.value = true;
}

async function editOnChainTale(taleToEdit) {
  if (!appUser.value || wallet.publicKey.value.toString() !== taleToEdit.account.author.toString()) {
    showUiMessage("You are not authorized to edit this tale.", "error");
    return;
  }
  editingTale.value = taleToEdit;
  
  let originalMarkdown = "Loading content...";
  if (taleToEdit.account.contentCid) {
      try {
          const response = await axios.get(`https://gateway.pinata.cloud/ipfs/${taleToEdit.account.contentCid}`);
          originalMarkdown = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
      } catch (e) {
          console.error("Failed to fetch original content for editing:", e);
          originalMarkdown = `Error fetching content. CID: ${taleToEdit.account.contentCid}. You can replace it.`;
          showUiMessage("Could not fetch original content from IPFS for editing.", "warning");
      }
  } else {
      originalMarkdown = "";
  }

  currentTale.value = {
    taleId: taleToEdit.account.taleId,
    title: taleToEdit.account.title,
    contentMarkdown: originalMarkdown,
    originalContentMarkdown: originalMarkdown,
    contentCid: taleToEdit.account.contentCid,
    genre: taleToEdit.account.genre,
    status: taleToEdit.account.status,
    coverImageCid: taleToEdit.account.coverImageCid,
  };
  coverImageFile.value = null;
  coverImagePreview.value = taleToEdit.account.coverImageCid ? `https://gateway.pinata.cloud/ipfs/${taleToEdit.account.coverImageCid}` : '';
  showCreateModal.value = true;
}

async function confirmDeleteOnChainTale(taleToDelete) {
  if (!program || !wallet.publicKey.value || wallet.publicKey.value.toString() !== taleToDelete.account.author.toString()) {
    showUiMessage("You are not authorized to delete this tale.", "error");
    return;
  }
  if (window.confirm(`Are you sure you want to delete the on-chain tale "${taleToDelete.account.title}"? This action is irreversible.`)) {
    isSavingTale.value = true;
    showUiMessage("Deleting tale from blockchain...", "info", 0);
    try {
      // For delete_tale, Anchor will derive the PDA for taleAccount based on the seeds defined in IDL
      // and the `relations` constraint.
      await program.methods.deleteTale() // No args for deleteTale
      .accounts({
        taleAccount: taleToDelete.publicKey, // Provide the PDA public key
        author: wallet.publicKey.value,
      })
      .rpc();
      showUiMessage("Tale deleted successfully from on-chain!", "success");
      fetchOnChainTales();
    } catch (error) {
      console.error('On-chain delete error:', error);
      showUiMessage(`On-chain delete error: ${error.message || error.toString()}`, "error");
    } finally {
      isSavingTale.value = false;
    }
  }
}

async function viewOnChainTale(taleToView) {
  viewingTale.value = taleToView;
  fetchedIpfsContent.value = '';
  ipfsContentError.value = '';
  if (taleToView.account.contentCid) {
    ipfsContentLoading.value = true;
    try {
      const response = await axios.get(`https://gateway.pinata.cloud/ipfs/${taleToView.account.contentCid}`);
      fetchedIpfsContent.value = typeof response.data === 'string' ? response.data : JSON.stringify(response.data, null, 2);
    } catch (error) {
      console.error("Error fetching IPFS content for view modal:", error);
      ipfsContentError.value = "Could not load content from IPFS.";
    } finally {
      ipfsContentLoading.value = false;
    }
  } else {
    fetchedIpfsContent.value = "No content CID provided for this tale.";
  }
}

function closeModal() {
  showCreateModal.value = false;
  editingTale.value = null;
  currentTale.value = defaultTaleForm();
  coverImageFile.value = null;
  coverImagePreview.value = '';
}

// --- Lifecycle and Watchers ---
watch(() => wallet.publicKey.value, (newVal, oldVal) => {
    if (newVal?.toBase58() !== oldVal?.toBase58()) {
        fetchAppUser();
    }
});

onMounted(() => {
  if (typeof window !== 'undefined' && !window.Buffer) {
    window.Buffer = Buffer;
  }
  fetchAppUser();
});

</script>

<style scoped>
/* Styles are largely similar to the previous TaleManager, with minor adjustments */
/* Main Container */
.tales-manager-container {
  padding: 1rem; /* p-4 */
  max-width: 56rem; /* max-w-4xl */
  margin-left: auto;
  margin-right: auto;
  color: #1f2937;
}
.dark .tales-manager-container { color: #d1d5db; }
@media (min-width: 768px) { .tales-manager-container { padding: 1.5rem; } }

.page-main-title {
  font-size: 1.875rem; font-weight: 700; margin-bottom: 2rem; text-align: center; color: #1f2937;
}
.dark .page-main-title { color: #ffffff; }

/* Wallet and User Welcome */
.wallet-button-wrapper { display: flex; justify-content: center; margin-bottom: 1rem; }
.user-welcome-banner {
  margin-bottom: 1.5rem; padding: 1rem; background-color: #e0e7ff; border-radius: 0.5rem;
}
.dark .user-welcome-banner { background-color: rgba(79, 70, 229, 0.3); }
.user-welcome-banner p { font-size: 0.875rem; color: #3730a3; }
.dark .user-welcome-banner p { color: #c7d2fe; }
.user-name-display { font-weight: 600; }
.create-tale-button { margin-top: 0.75rem; width: 100%; }
@media (min-width: 640px) { .create-tale-button { width: auto; } }

.login-register-prompt {
  margin-bottom: 1.5rem; padding: 1rem; background-color: #fefce8; border-radius: 0.5rem; text-align: center;
}
.dark .login-register-prompt { background-color: rgba(133, 77, 14, 0.3); }
.login-register-prompt p { color: #a16207; }
.dark .login-register-prompt p { color: #fde047; }
.auth-link { font-weight: 600; text-decoration: underline; }
.auth-link:hover { color: #ca8a04; }

/* Global UI Message */
.ui-message-global {
  margin-top: 1rem; margin-bottom: 1rem; padding: 0.75rem; border-radius: 0.375rem; text-align: center; font-size: 0.875rem;
}
.ui-message-info { background-color: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }
.dark .ui-message-info { background-color: rgba(30, 58, 138, 0.3); color: #93c5fd; border-color: rgba(59, 130, 246, 0.5); }
.ui-message-success { background-color: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }
.dark .ui-message-success { background-color: rgba(22, 101, 52, 0.3); color: #86efac; border-color: rgba(34, 197, 94, 0.5); }
.ui-message-error { background-color: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
.dark .ui-message-error { background-color: rgba(153, 27, 27, 0.3); color: #fca5a5; border-color: rgba(220, 38, 38, 0.5); }

/* Modal Styles */
.modal-overlay {
  position: fixed; inset: 0; background-color: rgba(0, 0, 0, 0.5); display: flex;
  align-items: center; justify-content: center; padding: 1rem; z-index: 50;
}
.modal-content-container {
  background-color: #ffffff; padding: 1.5rem; border-radius: 0.5rem;
  box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05);
  width: 100%; max-width: 36rem; max-height: 90vh; overflow-y: auto;
}
.dark .modal-content-container { background-color: #1f2937; }
.modal-main-title { font-size: 1.5rem; font-weight: 700; margin-bottom: 1.5rem; color: #1f2937; }
.dark .modal-main-title { color: #ffffff; }
.modal-form-layout > div:not(:last-child) { margin-bottom: 1rem; }

/* Form Elements */
.form-label { display: block; font-size: 0.875rem; font-weight: 500; color: #374151; margin-bottom: 0.25rem; }
.dark .form-label { color: #d1d5db; }
.form-input-field, .form-select-field, .form-textarea-field {
  margin-top: 0.25rem; display: block; width: 100%; border-radius: 0.375rem;
  border: 1px solid #d1d5db; box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05);
  padding: 0.5rem 0.75rem; font-size: 0.875rem; background-color: #ffffff; color: #111827;
}
.form-input-field:focus, .form-select-field:focus, .form-textarea-field:focus {
  border-color: #4f46e5; box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.5); outline: none;
}
.dark .form-input-field, .dark .form-select-field, .dark .form-textarea-field {
  border-color: #4b5568; background-color: #374151; color: #f3f4f6;
}
.form-textarea-field { min-height: 8rem; }
.form-grid-halves { display: grid; gap: 1rem; }
@media (min-width: 768px) { .form-grid-halves { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
.form-file-upload { margin-top: 0.25rem; display: block; width: 100%; font-size: 0.875rem; color: #6b7280; }
.dark .form-file-upload { color: #9ca3af; }
.form-file-upload::file-selector-button {
  margin-right: 1rem; padding: 0.5rem 1rem; border-radius: 0.375rem; border-width: 0;
  font-size: 0.875rem; font-weight: 600; background-color: #e0e7ff; color: #4338ca; cursor: pointer;
}
.form-file-upload:hover::file-selector-button { background-color: #c7d2fe; }
.dark .form-file-upload::file-selector-button { background-color: #3730a3; color: #c7d2fe; }
.dark .form-file-upload:hover::file-selector-button { background-color: #4338ca; }
.image-preview-container { margin-top: 0.5rem; }
.cover-image-preview { max-width: 150px; max-height: 150px; border: 1px solid #d1d5db; border-radius: 0.25rem; object-fit: contain; }
.dark .cover-image-preview { border-color: #4b5568; }
.form-text-info { font-size: 0.75rem; color: #6b7280; margin-top: 0.25rem; }
.dark .form-text-info { color: #9ca3af; }
.modal-action-buttons { display: flex; justify-content: flex-end; column-gap: 0.75rem; margin-top: 1.5rem; }

/* Tales List Section */
.tales-list-section { margin-top: 2.5rem; }
.section-title-main { font-size: 1.5rem; font-weight: 600; margin-bottom: 1rem; color: #374151; }
.dark .section-title-main { color: #e5e7eb; }
.refresh-button { margin-bottom: 1rem; }
.loading-tales-indicator { text-align: center; padding: 1.5rem; }
.loading-tales-indicator p { margin-top: 0.5rem; color: #4b5563; }
.dark .loading-tales-indicator p { color: #d1d5db; }
.no-tales-message { text-align: center; padding: 1rem; background-color: #f3f4f6; border-radius: 0.375rem; }
.dark .no-tales-message { background-color: #374151; }

.tales-grid-layout { display: grid; grid-template-columns: repeat(1, minmax(0, 1fr)); gap: 1.5rem; }
@media (min-width: 768px) { .tales-grid-layout { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (min-width: 1024px) { .tales-grid-layout { grid-template-columns: repeat(3, minmax(0, 1fr)); } }

/* Tale Card Item */
.tale-card-item {
  background-color: #ffffff; border-radius: 0.5rem;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);
  overflow: hidden; display: flex; flex-direction: column;
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
}
.dark .tale-card-item { background-color: #1f2937; }
.tale-card-item:hover { transform: translateY(-0.25rem); box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04); }
.tale-card-image { width: 100%; height: 12rem; object-fit: cover; }
.tale-card-body { padding: 1rem; display: flex; flex-direction: column; flex-grow: 1; }
.tale-card-title { font-size: 1.25rem; font-weight: 600; margin-bottom: 0.5rem; color: #1f2937; }
.dark .tale-card-title { color: #f9fafb; }
.tale-card-meta { font-size: 0.875rem; color: #6b7280; margin-bottom: 0.25rem; overflow-wrap: anywhere; }
.dark .tale-card-meta { color: #9ca3af; }
.tale-card-button { margin-top: auto; width: 100%; margin-bottom: 0.5rem; }
.tale-card-actions { margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px solid #e5e7eb; display: flex; justify-content: flex-end; column-gap: 0.5rem; }
.dark .tale-card-actions { border-color: #374151; }

/* View Tale Modal */
.view-tale-modal-content { max-width: 42rem; }
.view-tale-title { font-size: 1.875rem; }
.view-tale-cover-image { width: 100%; height: 16rem; object-fit: cover; border-radius: 0.375rem; margin-bottom: 1rem; }
.view-tale-meta { font-size: 0.875rem; color: #6b7280; margin-bottom: 0.25rem; }
.dark .view-tale-meta { color: #9ca3af; }
.view-tale-prose { max-width: none; margin-bottom: 1rem; }
.view-tale-close-button { margin-top: 1.5rem; width: 100%; }

/* Spinner (reusable) */
.spinner { display: inline-block; width: 2rem; height: 2rem; border-width: 4px; border-top-color: #4f46e5; border-right-color: transparent; border-bottom-color: transparent; border-left-color: transparent; border-radius: 9999px; animation: spin 1s linear infinite; }
.dark .spinner { border-top-color: #818cf8; }
@keyframes spin { to { transform: rotate(360deg); } }

/* General Button Styles */
.btn { padding: 0.5rem 1rem; border: 1px solid transparent; border-radius: 0.375rem; box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05); font-size: 0.875rem; font-weight: 500; color: #ffffff; cursor: pointer; transition: background-color 0.15s ease-in-out; }
.btn:focus { outline: 2px solid transparent; outline-offset: 2px; }
.btn:disabled { cursor: not-allowed; opacity: 0.7; }
.btn-primary { background-color: #4f46e5; } .btn-primary:hover { background-color: #4338ca; }
.dark .btn-primary { background-color: #6366f1; } .dark .btn-primary:hover { background-color: #818cf8; }
.dark .btn-primary:disabled { background-color: #3730a3; opacity:0.5; }
.btn-secondary { background-color: #6b7280; } .btn-secondary:hover { background-color: #4b5563; }
.dark .btn-secondary { background-color: #4b5568; } .dark .btn-secondary:hover { background-color: #374151; }
.btn-success { background-color: #16a34a; } .btn-success:hover { background-color: #15803d; }
.dark .btn-success { background-color: #22c55e; } .dark .btn-success:hover { background-color: #16a34a; }
.btn-danger { background-color: #dc2626; } .btn-danger:hover { background-color: #b91c1c; }
.dark .btn-danger { background-color: #ef4444; } .dark .btn-danger:hover { background-color: #f87171; }
.btn-warning { background-color: #f59e0b; color: #ffffff; } .btn-warning:hover { background-color: #d97706; }
.dark .btn-warning { background-color: #f59e0b; } .dark .btn-warning:hover { background-color: #fbbf24; }
.btn-info { background-color: #3b82f6; } .btn-info:hover { background-color: #2563eb; }
.dark .btn-info { background-color: #3b82f6; } .dark .btn-info:hover { background-color: #60a5fa; }
.btn-xs { padding: 0.25rem 0.625rem; font-size: 0.75rem; }
.link { color: #4f46e5; text-decoration: underline; } .link:hover { color: #4338ca; }
.dark .link { color: #818cf8; } .dark .link:hover { color: #a78bfa; }

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
