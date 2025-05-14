<template>
  <div class="mint-editions-container">
    <h3>Mint Editions for Design: {{ designId }}</h3>
    <p v-if="baseDesign?.baseName">Base Name: {{ baseDesign.baseName }}</p>

    <!-- Loading / Error / Completion States -->
    <div v-if="loading" class="loading-state">
        <p><span class="spinner-dark"></span> Loading edition details from backend...</p>
    </div>
    <div v-else-if="error" class="error-message">
        <p>Error loading editions: {{ error }}</p>
        <button @click="fetchUnminted" class="button-retry">Retry Fetch</button>
    </div>
     <div v-else-if="!loading && fetched && unmintedEditions.length === 0" class="completion-message">
      <p>✅ All {{ totalEditionsToMint }} editions for this design appear to be minted.</p>
    </div>

    <!-- Minting Controls (shown if editions are ready) -->
    <div v-else-if="unmintedEditions.length > 0" class="minting-controls">
      <p>
        <strong class="highlight">{{ unmintedEditions.length }}</strong>
         edition(s) remaining to mint (out of {{ totalEditionsToMint }} total).
      </p>
      <p class="cost-info">Estimated cost per mint: ~0.001-0.002 SOL (Network fees + Rent). Ensure you have enough SOL.</p>

      <div class="mint-actions">
        <button @click="mintNextEdition" :disabled="isMinting || mintingComplete || !canMint" class="button-primary">
          <span v-if="isMinting && currentlyMintingEditionNumber === nextEditionToMint">
              <span class="spinner"></span> Minting #{{ currentlyMintingEditionNumber }}...
          </span>
          <span v-else>
              Mint Next Edition (#{{ nextEditionToMint }})
          </span>
        </button>

        <button @click="mintAllEditions" :disabled="isMinting || mintingComplete || !canMint" class="button-secondary">
          <span v-if="isMinting && batchMintInProgress">
              <span class="spinner"></span> Minting Batch...
          </span>
          <span v-else>
              Mint All Remaining ({{ unmintedEditions.length }})
          </span>
        </button>
      </div>
       <p v-if="isMinting" class="progress-message">{{ progressMessage }}</p>
    </div>

    <!-- Log Output Section -->
    <div class="log-section">
        <h4>Minting Activity Log:</h4>
        <ul class="log-list" ref="logContainerRef">
          <li v-for="(log, index) in mintingLog" :key="index" :class="log.type">
             <span class="log-timestamp">[{{ new Date(log.timestamp).toLocaleTimeString() }}]</span>
             <span class="log-message">{{ log.message }}</span>
          </li>
           <li v-if="mintingLog.length === 0 && !loading">No minting activity initiated yet.</li>
        </ul>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, nextTick } from 'vue';
import { useWallet } from 'solana-wallets-vue';
import { umi } from '../../utils/umi'; // Your Umi instance
import {
    generateSigner,
    some, // For Option types in Umi (like collection)
    publicKey as umiPublicKey // Utility if needed
} from '@metaplex-foundation/umi';
import {
    createV1, // The primary function for creating Core assets
    mplCore, // Represents the Core Program, used internally by createV1 via Umi context
    AssetData // Type definition for asset data if needed
} from '@metaplex-foundation/mpl-core';
import { fromWeb3JsPublicKey, toWeb3JsPublicKey } from '@metaplex-foundation/umi-web3js-adapters';
import { PublicKey as Web3PublicKey } from '@solana/web3.js';
import { bs58 } from '@metaplex-foundation/umi/serializers'; // Correct import
import apiService from '../../services/apiService'; // Your backend API service

// --- Props ---
const props = defineProps({
  designId: { // Passed from parent component managing creator's designs
    type: String,
    required: true,
  },
  baseDesign: { // Pass the parent NftDesignDefinition object for context (name, total editions etc)
    type: Object,
    required: true,
  }
});

// --- Wallet State ---
const { connected, publicKey: creatorWallet } = useWallet();

// --- Component State ---
const unmintedEditions = ref([]); // Array of MintedEditionInfo objects { _id, editionNumber, metadataIpfsUri }
const loading = ref(false);
const fetched = ref(false);
const error = ref('');
const isMinting = ref(false); // Master flag for ANY minting activity
const batchMintInProgress = ref(false); // Specifically for the "Mint All" action
const mintingComplete = ref(false);
const progressMessage = ref('');
const mintingLog = ref([]); // Array of { type: 'success'|'error'|'info', message: string, timestamp: Date }
const currentlyMintingEditionNumber = ref(null); // Track which edition# is being processed
const logContainerRef = ref(null); // Ref for auto-scrolling log


// --- Computed Properties ---
const canMint = computed(() => connected.value && creatorWallet.value && !loading.value);

const nextEditionToMint = computed(() => {
    if (unmintedEditions.value.length > 0) {
        // Assume already sorted by fetchUnminted
        return unmintedEditions.value[0].editionNumber;
    }
    return null;
});

const totalEditionsToMint = computed(() => props.baseDesign?.totalEditions || 0);

// --- Log Utility ---
function logMinting(message, type = 'info') {
    console[type === 'error' ? 'error' : 'log'](message); // Log to console for debugging
    mintingLog.value.push({ type, message, timestamp: new Date() });
    // Auto-scroll log view to bottom
    nextTick(() => {
        if (logContainerRef.value) {
            logContainerRef.value.scrollTop = logContainerRef.value.scrollHeight;
        }
    });
}

// --- Fetch Unminted Editions from Backend ---
async function fetchUnminted() {
  if (!props.designId) {
      error.value = "No Design ID provided.";
      logMinting("Cannot fetch: No Design ID.", "error");
      return;
  }
  loading.value = true;
  fetched.value = false;
  error.value = '';
  unmintedEditions.value = [];
  mintingComplete.value = false;
  logMinting(`Fetching unminted editions for Design ID: ${props.designId}...`, 'info');
  try {
    const editions = await apiService.getUnmintedEditions(props.designId);
    unmintedEditions.value = editions || [];
    if (unmintedEditions.value.length === 0) {
        logMinting("No remaining unminted editions found for this design.", 'info');
        mintingComplete.value = true;
    } else {
        logMinting(`Found ${unmintedEditions.value.length} edition(s) ready to mint.`, 'info');
        mintingComplete.value = false;
        unmintedEditions.value.sort((a, b) => a.editionNumber - b.editionNumber); // Ensure sorted
    }
    fetched.value = true;
  } catch (err) {
    console.error("Failed to fetch unminted editions:", err);
    const errMsg = `Failed to load editions: ${err?.message || 'Unknown API error'}`;
    error.value = errMsg;
    logMinting(errMsg, 'error');
  } finally {
    loading.value = false;
  }
}

// Fetch data when component mounts
onMounted(fetchUnminted);
// Refetch if the designId prop changes
watch(() => props.designId, fetchUnminted);
// Refetch if wallet connects
watch(connected, (newVal, oldVal) => { if(newVal && !oldVal) fetchUnminted(); });


// --- CORE MINTING FUNCTION ---
async function mintEdition(editionInfo) {
  // 1. Pre-checks
  if (!canMint.value) throw new Error("Wallet not connected or ready.");
  if (!umi.identity.publicKey || umi.identity.publicKey.toString() !== creatorWallet.value.toBase58()) {
      throw new Error("Umi signer not set or mismatch. Please ensure wallet is connected and Umi is initialized.");
  }
  if (!editionInfo?._id || !editionInfo.metadataIpfsUri || typeof editionInfo.editionNumber !== 'number') {
       throw new Error(`Invalid edition information: ${JSON.stringify(editionInfo)}`);
  }

  currentlyMintingEditionNumber.value = editionInfo.editionNumber;
  const progressPrefix = `[Ed. #${editionInfo.editionNumber}]`;
  progressMessage.value = `${progressPrefix} Preparing...`;
  logMinting(`Starting mint for Edition #${editionInfo.editionNumber}...`, 'info');

  try {
    // 2. Generate Signer for the new Core Asset (Unique NFT Mint Address)
    const newCoreAssetSigner = generateSigner(umi);
    logMinting(`${progressPrefix} New NFT Address: ${newCoreAssetSigner.publicKey.toString()}`, 'info');

    // 3. Prepare Asset Name and Metadata URI
    const baseName = props.baseDesign?.baseName || `Design_${props.designId.substring(0, 4)}`;
    const assetName = `${baseName} #${editionInfo.editionNumber}`;
    const metadataUri = editionInfo.metadataIpfsUri;

    // 4. Build the Metaplex Core createV1 Transaction Builder
    logMinting(`${progressPrefix} Building transaction...`, 'info');
    const txBuilder = createV1(umi, {
        asset: newCoreAssetSigner,
        name: assetName,
        uri: metadataUri,
        owner: umi.identity.publicKey,
        payer: umi.identity,
        authority: umi.identity,
        // Collection - get from baseDesign prop if available
        collection: props.baseDesign?.collectionMintAddress
            ? some({ key: fromWeb3JsPublicKey(new Web3PublicKey(props.baseDesign.collectionMintAddress)), verified: false })
            : undefined,
        // Royalty - get from baseDesign prop if available
        sellerFeeBasisPoints: props.baseDesign?.baseMetadata?.seller_fee_basis_points !== undefined
             ? some(props.baseDesign.baseMetadata.seller_fee_basis_points)
             : some(500), // Default 5%
        isMutable: true,
    });

    // 5. Send and Confirm the Transaction
    progressMessage.value = `${progressPrefix} Submitting... Please approve in wallet.`;
    logMinting(`${progressPrefix} Sending transaction...`, 'info');
    const { signature } = await txBuilder
        .addRemainingSigners([newCoreAssetSigner]) // Add the NFT's own keypair as signer
        .sendAndConfirm(umi, {
             confirm: { commitment: 'confirmed' },
             send: { skipPreflight: false } // Use preflight
            });

    const sigString = bs58.encode(signature);
    progressMessage.value = `${progressPrefix} Confirmed on-chain! Tx: ${sigString.substring(0, 10)}... Updating backend...`;
    logMinting(`Success: Minted Edition #${editionInfo.editionNumber}. NFT: ${newCoreAssetSigner.publicKey.toString()}, Tx: ${sigString}`, 'success');

    // 6. Confirm with backend API
    try {
        await apiService.confirmEditionMinted(editionInfo._id, { // Pass MongoDB _id
            onChainNftMint: newCoreAssetSigner.publicKey.toString(),
            transactionSignature: sigString,
            ownerWallet: creatorWallet.value.toBase58(),
        });
        logMinting(`${progressPrefix} Backend updated successfully.`, 'info');
    } catch(confirmError) {
        // Log warning but don't fail the whole mint process, NFT is on-chain
        logMinting(`WARNING: Failed to confirm mint with backend for Edition #${editionInfo.editionNumber}. Please check manually. Error: ${confirmError.message}`, 'error');
    }

    // 7. Update Local State (remove from unminted list)
    unmintedEditions.value = unmintedEditions.value.filter(e => e._id !== editionInfo._id);
    if (unmintedEditions.value.length === 0) {
        mintingComplete.value = true;
        progressMessage.value = 'All editions appear to be minted!';
    }

  } catch (err) {
    console.error(`Minting Error (Edition #${editionInfo.editionNumber}):`, err);
    const errorMsg = `Error minting Edition #${editionInfo.editionNumber}: ${err.message || 'Unknown error'}`;
    error.value = errorMsg; // Set top-level error
    logMinting(errorMsg, 'error');
    throw err; // Re-throw for mintAllEditions loop handling
  } finally {
    currentlyMintingEditionNumber.value = null; // Reset tracker
  }
}

// --- Button Handlers ---
async function mintNextEdition() {
  if (isMinting.value || unmintedEditions.value.length === 0) return;
  isMinting.value = true; // Set master minting flag
  batchMintInProgress.value = false; // Not a batch action
  error.value = ''; // Clear previous top-level error

  const editionToMint = unmintedEditions.value[0]; // Assumes sorted list

  try {
    await mintEdition(editionToMint);
  } catch(e) {
     // Error already logged/handled by mintEdition
  } finally {
      isMinting.value = false; // Clear master flag when done/failed
      progressMessage.value = ''; // Clear progress message
  }
}

async function mintAllEditions() {
    if (isMinting.value || unmintedEditions.value.length === 0) return;
    isMinting.value = true; // Set master flag
    batchMintInProgress.value = true; // Set batch flag
    error.value = ''; // Clear previous top-level error

    const editionsToMintInBatch = [...unmintedEditions.value]; // Copy array
    let successCount = 0;
    let failCount = 0;
    progressMessage.value = `Starting batch mint for ${editionsToMintInBatch.length} editions...`;

    for (const edition of editionsToMintInBatch) {
         if (!connected.value || !umi.identity.publicKey) { // Check connection before each mint
            const failMsg = 'Wallet disconnected during batch mint. Stopping.';
            logMinting(failMsg, 'error');
            error.value = failMsg;
            failCount = editionsToMintInBatch.length - successCount; // Mark remaining as failed
            break; // Exit loop
         }
        try {
            // mintEdition handles its own logging and local state update
            await mintEdition(edition);
            successCount++;
            // Optional delay - helps with RPC rate limits and visual feedback
            if (unmintedEditions.value.length > 0) { // Only delay if more are pending
               await new Promise(resolve => setTimeout(resolve, 750)); // 0.75 sec delay
            }
        } catch (e) {
            failCount++;
            logMinting(`Halting batch mint due to error on Edition #${edition.editionNumber}`, 'error');
            // error.value is already set by mintEdition's catch block
            break; // Stop batch minting on first error
        }
    }

    progressMessage.value = `Batch Mint Finished: ${successCount} succeeded, ${failCount} failed.`;
    logMinting(`Batch Mint Finished: ${successCount} succeeded, ${failCount} failed.`, failCount > 0 ? 'error' : 'success');
    isMinting.value = false; // Clear master flag
    batchMintInProgress.value = false; // Clear batch flag

    // Final refresh from backend to ensure accurate state
    await fetchUnminted();
}

</script>

<style scoped>
/* ... (styles from previous example - refined slightly) ... */
.mint-editions-container {
    padding: 20px;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    margin-top: 20px;
    background-color: #fff;
}
.loading-state, .error-message, .completion-message {
    padding: 15px;
    text-align: center;
    border-radius: 5px;
    margin: 10px 0;
}
.error-message { color: #D8000C; border: 1px solid #FFBABA; background-color: #FFD2D2; }
.completion-message { color: #276f00; border: 1px solid #a8d8a0; background-color: #DFF2BF;}
.minting-controls { margin-bottom: 20px; }
.cost-info { font-size: 0.9em; color: #666; margin: 5px 0 15px 0; }
.mint-actions { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 10px; }
button {
    padding: 10px 18px;
    font-size: 0.95rem;
    border-radius: 6px;
    cursor: pointer;
    border: none;
    transition: background-color 0.2s ease, opacity 0.2s ease;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
}
button:disabled { opacity: 0.6; cursor: not-allowed; background-color: #b0b0b0 !important; }
.button-primary { background-color: #007bff; color: white; }
.button-primary:hover:not(:disabled) { background-color: #0056b3; }
.button-secondary { background-color: #6c757d; color: white; }
.button-secondary:hover:not(:disabled) { background-color: #545b62; }
.button-retry { background-color: #ffc107; color: #333; border-color: #ffc107; }
.button-retry:hover:not(:disabled) { background-color: #e0a800; }

.progress-message { margin-top: 15px; font-style: italic; color: #333; background-color: #f0f0f0; padding: 8px; border-radius: 4px;}
.log-section { margin-top: 25px; }
.log-section h4 { margin-bottom: 8px; }
.log-list {
    background-color: #f8f8f8;
    border: 1px solid #eee;
    border-radius: 4px;
    padding: 10px 15px;
    max-height: 300px;
    overflow-y: auto;
    font-size: 0.85em;
    list-style: none;
    margin: 0;
    line-height: 1.6;
}
.log-list li { margin-bottom: 5px; padding-bottom: 5px; border-bottom: 1px dotted #eee; word-wrap: break-word; }
.log-list li:last-child { border-bottom: none; }
.log-list .error { color: #c00; font-weight: 600;}
.log-list .success { color: #080; }
.log-list .info { color: #555; }
.log-list .log-timestamp { color: #999; margin-right: 8px; }
.highlight { color: #0056b3; font-weight: bold;}
.spinner, .spinner-dark { /* Styles from CreateDesignForm */
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top: 2px solid #fff;
    width: 1em; height: 1em;
    animation: spin 1s linear infinite;
    display: inline-block; margin-right: 5px; vertical-align: middle;
}
.spinner-dark {
    border: 2px solid rgba(0, 0, 0, 0.2);
    border-top: 2px solid #333;
}
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
</style>