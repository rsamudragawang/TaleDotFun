<template>
  <div class="mint-component-container">
    <h1 class="mint-page-title">Mint Your NFT</h1>

    <!-- <div class="wallet-status-section">
      <h2 class="section-heading">Wallet Status</h2>
      <WalletMultiButton />
      <div v-if="wallet.connected.value && wallet.publicKey.value" class="info-box wallet-connected-info">
        Connected: <span class="wallet-address-display">{{ shortenAddress(wallet.publicKey.value.toBase58()) }}</span>
      </div>
      <div v-else class="warning-box wallet-disconnected-info">
        Please connect your wallet to mint.
      </div>
    </div> -->

    <div v-if="isLoadingInitialData && props.candyMachineAddress" class="loading-indicator-container">
        <div class="spinner"></div>
        <p class="loading-text">Loading Candy Machine details for <span class="cm-address-display">{{ shortenAddress(props.candyMachineAddress, 8) }}</span>...</p>
    </div>
    <div v-else-if="initialLoadingError" class="error-box initial-load-error">
        <p>Failed to load Candy Machine: {{ initialLoadingError }}</p>
        <p class="error-subtext">Ensure the CM ID ({{ props.candyMachineAddress || 'Not Provided' }}) is correct.</p>
    </div>
    <div v-else-if="wallet.connected.value && candyMachine" class="mint-section-active">
      <div class="cm-details-box">
        <h2 class="cm-name">{{ candyMachineDetails.name }}</h2>
        <p class="cm-detail-item">
          Price: <span class="cm-detail-value">{{ formatLamports(candyMachineDetails.price) }} SOL</span>
        </p>
        <p class="cm-detail-item">
          Remaining: <span class="cm-detail-value">{{ candyMachineDetails.itemsRemaining }} / {{ candyMachineDetails.itemsAvailable }}</span>
        </p>
        <p v-if="candyMachineDetails.goLiveDate !== 'Not set'" class="cm-date-info">
          Live Date: {{ candyMachineDetails.goLiveDate }}
        </p>
        <p v-if="candyMachineDetails.endDate !== 'Not set'" class="cm-date-info">
          End Date: {{ candyMachineDetails.endDate }}
        </p>
      </div>

      <div class="mint-button-container">
        <button
          @click="handleMintNFT"
          :disabled="isMinting || !candyMachine || candyMachineDetails.itemsRemaining === 0 || !wallet.connected.value"
          class="btn btn-primary btn-mint"
        >
          <span v-if="isMinting" class="mint-button-inner-text">
            <span class="spinner-inline"></span> Minting...
          </span>
          <span v-else-if="candyMachineDetails.itemsRemaining === 0" class="mint-button-inner-text">Sold Out</span>
          <span v-else class="mint-button-inner-text">Mint NFT</span>
        </button>
      </div>
    </div>
    <div v-else-if="wallet.connected.value && !candyMachine && !isLoadingInitialData && props.candyMachineAddress" class="info-box cm-load-failed-info">
        Could not load Candy Machine with ID: <span class="cm-address-display">{{ props.candyMachineAddress }}</span>.
    </div>
    <div v-else-if="!props.candyMachineAddress && wallet.connected.value" class="warning-box no-cm-id-info">
      No Candy Machine ID has been specified for minting. This component might be accessed via a general '/mint' route.
    </div>

    <div v-if="uiMessage.text"
         :class="['ui-message-display', uiMessage.type === 'error' ? 'error-box' : (uiMessage.type === 'success' ? 'success-box' : 'info-box')]">
      <p class="ui-message-title">{{ uiMessage.type === 'error' ? 'Error:' : (uiMessage.type === 'success' ? 'Success!' : 'Info:') }}</p>
      <p v-html="uiMessage.text"></p>
      <div v-if="uiMessage.type === 'success' && mintResult?.signature" class="tx-link-container">
        <a :href="`https://explorer.solana.com/tx/${mintResult.signature}?cluster=${SOLANA_NETWORK}`" target="_blank" class="link transaction-link">
          View Transaction on Explorer
        </a>
      </div>
    </div>
  </div>
</template>


<script setup>
import { ref, onMounted, watch, defineProps } from 'vue';
import { useWallet, WalletMultiButton } from 'solana-wallets-vue';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { walletAdapterIdentity } from '@metaplex-foundation/umi-signer-wallet-adapters';
import {
  mplCandyMachine,
  fetchCandyMachine,
  fetchCandyGuard,
  mintV2,
} from '@metaplex-foundation/mpl-candy-machine';
import { fetchDigitalAsset } from '@metaplex-foundation/mpl-token-metadata';
import {
  publicKey,
  generateSigner,
  transactionBuilder,
  some,
  sol,
} from '@metaplex-foundation/umi';
import { setComputeUnitLimit } from '@metaplex-foundation/mpl-toolbox';
import { base58 } from '@metaplex-foundation/umi/serializers';
import axios from 'axios';
// Removed import for initWalletService as we are standardizing on useWallet
import { initWallet as initWalletService } from '../services/walletService';

const props = defineProps({
  candyMachineAddress: {
    type: String,
    default: null,
  },
});

const RPC_ENDPOINT = import.meta.env.VITE_RPC_ENDPOINT || 'https://api.devnet.solana.com';
const SOLANA_NETWORK = RPC_ENDPOINT.includes('mainnet') ? 'mainnet-beta' : (RPC_ENDPOINT.includes('testnet') ? 'testnet' : 'devnet');
const API_BASE_URL = import.meta.env.VITE_APP_AUTH_API_URL || 'http://localhost:3000/api';
const JWT_TOKEN_KEY = 'readium_fun_jwt_token';
// const {umi } = initWalletService()
const wallet = useWallet(); // Use the global wallet adapter from solana-wallets-vue
let umi = null; // This will be the primary UMI instance
console.log(wallet.wallet.value.adapter,"wallleeett")
const isLoadingInitialData = ref(false);
const initialLoadingError = ref('');
const candyMachine = ref(null);
const candyGuard = ref(null);
const collectionNft = ref(null);
const candyMachineDetails = ref({
  name: 'Loading...',
  price: 0,
  itemsAvailable: 0,
  itemsMinted: 0,
  itemsRemaining: 0,
  goLiveDate: 'Not set',
  endDate: 'Not set',
});

const isMinting = ref(false);
const mintResult = ref(null);
const uiMessage = ref({ text: '', type: 'info' });

const apiClient = axios.create({ baseURL: API_BASE_URL });
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem(JWT_TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
apiClient.interceptors.response.use(
  response => response.data,
  error => {
    console.error('API Error (MintComponent):', error.response?.data?.message || error.message);
    return Promise.reject(error.response?.data || { message: 'API Error' });
  }
);

const showUiMessage = (msg, type = 'info', duration = 7000) => {
  uiMessage.value = { text: msg, type };
  if (duration > 0) {
    setTimeout(() => { uiMessage.value = { text: '', type: 'info' }; }, duration);
  }
};
const shortenAddress = (address, chars = 4) => {
  if (!address) return '';
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
};
const formatLamports = (lamports) => {
  if (typeof lamports !== 'number' || isNaN(lamports)) return 'N/A';
  return (Number(lamports) / 1_000_000_000).toFixed(4);
};
const formatTimestamp = (dateObject) => {
  if (!dateObject || !(dateObject instanceof Date)) {
      if (dateObject && typeof dateObject.basisPoints === 'bigint') {
          try {
            return new Date(Number(dateObject.basisPoints) * 1000).toLocaleString();
          } catch (e) { return 'Invalid Date'; }
      }
      return 'Not set';
  }
  try {
    return dateObject.toLocaleString();
  } catch (e) {
    return 'Invalid Date';
  }
};

const tryInitializeUmi = () => {
  // Critical guards: wallet must be connected, adapter and publicKey must be available
  if (wallet.connected.value && wallet.wallet.value.adapter && wallet.publicKey.value) {
    // Condition to (re-)initialize UMI:
    // 1. UMI doesn't exist yet.
    // 2. Or, UMI exists, but its identity's public key doesn't match the current wallet's public key.
    if (!umi || !umi.identity.publicKey || umi.identity.publicKey.toString() !== wallet.publicKey.value.toBase58()) {
      console.log("MintComponent: Wallet ready. Initializing/Re-initializing UMI...");
      try {
        umi = createUmi(RPC_ENDPOINT)
          .use(walletAdapterIdentity(wallet.wallet.value.adapter)) // This is where UninitializedWalletAdapterError can occur
          .use(mplCandyMachine());
        console.log("MintComponent: UMI Initialized/Updated with wallet:", wallet.publicKey.value.toBase58());
        return true;
      } catch (e) {
        console.error("MintComponent: UMI Initialization failed", e);
        initialLoadingError.value = `Failed to initialize Solana connection: ${e.message}`;
        showUiMessage(initialLoadingError.value, "error");
        umi = null; // Ensure UMI is null on failure
        return false;
      }
    }
    // console.log("MintComponent: UMI already initialized and identity matches.");
    return true; // UMI already initialized and identity matches
  }
  // console.log("MintComponent: Wallet (useWallet) not fully ready for UMI. Clearing UMI instance if exists.");
  if (umi) { // If UMI was previously set but wallet is no longer fully ready
    console.log("MintComponent: Wallet no longer fully ready, clearing UMI.");
    umi = null;
  }
  return false;
};


const loadCandyMachineData = async () => {
  if (!props.candyMachineAddress) {
    initialLoadingError.value = "No Candy Machine ID specified for this page.";
    showUiMessage(initialLoadingError.value, "warning");
    candyMachine.value = null; candyGuard.value = null; collectionNft.value = null;
    candyMachineDetails.value = { name: 'N/A', price: 0, itemsAvailable: 0, itemsMinted: 0, itemsRemaining: 0, goLiveDate: 'N/A', endDate: 'N/A' };
    return;
  }
  if (!umi) {
    initialLoadingError.value = "Solana connection (UMI) not ready. Please connect your wallet.";
    showUiMessage(initialLoadingError.value, "error");
    return;
  }

  isLoadingInitialData.value = true;
  initialLoadingError.value = '';
  showUiMessage(`Loading Candy Machine: ${shortenAddress(props.candyMachineAddress, 6)}...`, "info", 0);

  try {
    const cmPublicKey = publicKey(props.candyMachineAddress);
    const cmAccount = await fetchCandyMachine(umi, cmPublicKey);
    if (!cmAccount) throw new Error(`CM account not found: ${props.candyMachineAddress}`);
    candyMachine.value = cmAccount;

    if (!cmAccount.mintAuthority) throw new Error("Candy Guard address (mintAuthority) not found on CM.");
    const cgAccount = await fetchCandyGuard(umi, cmAccount.mintAuthority);
    if (!cgAccount) throw new Error(`Candy Guard not found for CM: ${cmAccount.mintAuthority}`);
    candyGuard.value = cgAccount;

    if (!cmAccount.collectionMint) throw new Error("Collection Mint address not found on CM.");
    const fetchedCollectionNft = await fetchDigitalAsset(umi, cmAccount.collectionMint);
    if (!fetchedCollectionNft) throw new Error(`Collection NFT not found: ${cmAccount.collectionMint}`);
    collectionNft.value = fetchedCollectionNft;

    let priceLamports = 0;
    const solPaymentGuard = candyGuard.value.guards.solPayment?.value;
    if (solPaymentGuard && typeof solPaymentGuard.lamports.basisPoints === 'bigint') {
      priceLamports = Number(solPaymentGuard.lamports.basisPoints);
    }

    candyMachineDetails.value = {
      name: fetchedCollectionNft.metadata.name || 'Unnamed Collection',
      price: priceLamports,
      itemsAvailable: Number(cmAccount.data.itemsAvailable),
      itemsMinted: Number(cmAccount.itemsRedeemed),
      itemsRemaining: Number(cmAccount.data.itemsAvailable) - Number(cmAccount.itemsRedeemed),
      goLiveDate: formatTimestamp(candyGuard.value.guards.startDate?.value?.date),
      endDate: formatTimestamp(candyGuard.value.guards.endDate?.value?.date),
    };
    showUiMessage("Candy Machine loaded!", "success");
  } catch (err) {
    console.error('Error loading Candy Machine data:', err);
    initialLoadingError.value = err.message || "Failed to load CM data.";
    showUiMessage(initialLoadingError.value, "error");
    candyMachine.value = null; candyGuard.value = null; collectionNft.value = null;
  } finally {
    isLoadingInitialData.value = false;
  }
};

const handleMintNFT = async () => {
  if (!tryInitializeUmi()) { // Ensure UMI is ready before minting
      showUiMessage("Wallet or Solana connection not ready. Please try again.", "error");
      return;
  }
  // After tryInitializeUmi, 'umi' global variable is either set or null
  if (!umi || !candyMachine.value || !candyGuard.value || !collectionNft.value || !wallet.publicKey.value) {
    showUiMessage("Required data or wallet connection is missing. Please connect wallet and ensure CM is loaded.", "error");
    return;
  }
  if (!props.candyMachineAddress) {
    showUiMessage("Critical error: Candy Machine address is missing for logging. Minting aborted.", "error");
    console.error("handleMintNFT: props.candyMachineAddress is missing.");
    return;
  }

  isMinting.value = true;
  mintResult.value = null;
  showUiMessage("Preparing to mint... Please approve in your wallet.", "info", 0);

  try {
    const nftMintSigner = generateSigner(umi);

    let collectionUpdateAuthoritySigner = collectionNft.value.metadata.updateAuthority; // This is a PublicKey
    console.log(collectionNft.value.metadata.updateAuthority.toString())
    // If the UMI identity is the update authority, pass the identity (Signer)
    if (umi.identity.publicKey.toString() === collectionNft.value.metadata.updateAuthority.toString()) {
        collectionUpdateAuthoritySigner = umi.identity;
    }


    const solPaymentGuardValue = candyGuard.value.guards.solPayment?.value;
    let solPaymentArg = undefined;
    if (solPaymentGuardValue && solPaymentGuardValue.destination) {
        solPaymentArg = some({ destination: solPaymentGuardValue.destination });
    }

    const startDateGuardValue = candyGuard.value.guards.startDate?.value;
    let startDateArg = undefined;
    if (startDateGuardValue && startDateGuardValue.date) {
        startDateArg = some({ date: startDateGuardValue.date });
    }

    // --- THIS SECTION IS UNCHANGED AS PER YOUR REQUEST ---
    const mintV2Args = {
      candyMachine: candyMachine.value.publicKey,
      nftMint: nftMintSigner,
      collectionMint: collectionNft.value.publicKey,
      collectionUpdateAuthority: collectionUpdateAuthoritySigner,
      tokenStandard: candyMachine.value.tokenStandard,
      candyGuard: candyGuard.value.publicKey,
      mintArgs: { // Only include relevant guard args
        ...(solPaymentArg && { solPayment: solPaymentArg }),
        ...(startDateArg && { startDate: startDateArg }),
        botTax: some({ lamports: sol(0.001), lastInstruction: true }), // Example bot tax
      },
    };
    console.log("MintV2 args:", JSON.stringify(mintV2Args, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value, 2));

    const builder = transactionBuilder()
      .add(setComputeUnitLimit(umi, { units: 800_000 }))
      .add(mintV2(umi, mintV2Args));
    // --- END OF UNCHANGED SECTION ---

    console.log("Sending mint transaction...");
    const result = await builder.sendAndConfirm(umi, {
      confirm: { commitment: 'finalized' },
    });

    const signatureBytes = result.signature;
    const signature = base58.deserialize(signatureBytes)[0];
    const mintedNftAddress = nftMintSigner.publicKey.toString();

    mintResult.value = { signature, nftMintAddress:mintedNftAddress };

    showUiMessage(`Successfully minted NFT: ${shortenAddress(mintedNftAddress)}! Signature: ${shortenAddress(signature, 8)}`, "success");

    if (!props.candyMachineAddress) {
        console.error("Cannot log mint activity: Candy Machine Address prop is missing after mint success.");
        showUiMessage("Mint successful, but could not log activity due to missing CM Address. Contact support.", "warning");
    } else {
        try {
          const logPayload = {
            candyMachineId: props.candyMachineAddress,
            nftMintAddress: mintedNftAddress,
            transactionSignature: signature,
          };
          console.log("Logging mint activity with payload:", logPayload);
          await apiClient.post('/mint-activities', logPayload);
          console.log("Mint activity logged to backend.");
        } catch (apiError) {
          console.error("Failed to log mint activity:", apiError);
          showUiMessage(`Mint successful (NFT: ${shortenAddress(mintedNftAddress)}), but failed to log activity. Error: ${apiError.message}`, "warning");
        }
    }
    await loadCandyMachineData();
  } catch (err) {
    console.error('Minting failed:', err);
    const errorMsg = err.message || "An unknown error occurred during minting.";
    showUiMessage(errorMsg, "error");
    if (err.logs) {
        console.error("Transaction Logs:", err.logs);
        const programErrorLog = err.logs.find(log => log.includes("Program log: Error:") || log.includes("Program failed to complete: "));
        if (programErrorLog) {
            showUiMessage(`Mint failed: ${programErrorLog}`, "error");
        }
    }
  } finally {
    isMinting.value = false;
  }
};

// Watch for wallet state changes to initialize UMI and load data
watch(
  () => [wallet.connected.value, wallet.publicKey.value, wallet.wallet.value.adapter],
  async ([isConnected, currentPublicKey, currentAdapter], [wasConnected, oldPublicKey, oldAdapter]) => {
    console.log("Wallet watcher triggered. Connected:", isConnected, "PK available:", !!currentPublicKey, "Adapter available:", !!currentAdapter);
    if (isConnected && currentPublicKey && currentAdapter) {
      if (tryInitializeUmi()) {
        if (props.candyMachineAddress && (!candyMachine.value || isLoadingInitialData.value)) {
          await loadCandyMachineData();
        } else if (!props.candyMachineAddress) {
          initialLoadingError.value = "No Candy Machine ID specified.";
          showUiMessage(initialLoadingError.value, "warning");
        }
      }
    } else if (!isConnected && wasConnected) {
      console.log("Wallet disconnected, clearing UMI.");
      umi = null;
      candyMachine.value = null; candyGuard.value = null; collectionNft.value = null;
      candyMachineDetails.value = { name: 'Loading...', price: 0, itemsAvailable: 0, itemsMinted: 0, itemsRemaining: 0, goLiveDate: 'Not set', endDate: 'Not set' };
      if (props.candyMachineAddress) {
        showUiMessage("Wallet disconnected. Please reconnect to mint.", "info");
      }
    }
  },
  { immediate: true, deep: false }
);

// Watch for changes in candyMachineAddress prop
watch(() => props.candyMachineAddress, async (newAddress, oldAddress) => {
  if (newAddress && newAddress !== oldAddress) {
    console.log("candyMachineAddress prop changed to:", newAddress);
    if (wallet.connected.value && wallet.wallet.value.adapter && wallet.publicKey.value) { // Check full wallet readiness
        if (tryInitializeUmi()) {
            await loadCandyMachineData();
        }
    } else if (!wallet.connected.value) {
        showUiMessage("Please connect your wallet to load details for the new Candy Machine.", "info");
    }
  } else if (!newAddress && oldAddress) {
    initialLoadingError.value = "No Candy Machine ID specified.";
    showUiMessage(initialLoadingError.value, "warning");
    candyMachine.value = null; candyGuard.value = null; collectionNft.value = null;
    candyMachineDetails.value = { name: 'N/A', price: 0, itemsAvailable: 0, itemsMinted: 0, itemsRemaining: 0, goLiveDate: 'N/A', endDate: 'N/A' };
  }
}, { immediate: false });

onMounted(() => {
  // The watcher with immediate:true handles initial setup if wallet is already connected.
  if (!props.candyMachineAddress) {
    initialLoadingError.value = "No Candy Machine ID has been specified for this minting page.";
  } else if (!wallet.connected.value) {
     showUiMessage("Please connect your wallet to interact with the Candy Machine.", "info");
  }
});

</script>

<style scoped>
/* Main Container */
.mint-component-container {
  padding: 1rem;
  max-width: 36rem; /* max-w-lg */
  margin-left: auto;
  margin-right: auto;
  background-color: #ffffff; /* bg-white */
  box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04); /* shadow-xl */
  border-radius: 0.5rem; /* rounded-lg */
}
@media (min-width: 768px) { /* md: */
  .mint-component-container {
    padding: 1.5rem; /* md:p-6 */
  }
}
.dark .mint-component-container {
  background-color: #1f2937; /* dark:bg-gray-800 */
}

.mint-page-title {
  font-size: 1.5rem; /* text-2xl */
  font-weight: 700; /* font-bold */
  text-align: center;
  color: #1f2937; /* text-gray-800 */
  margin-bottom: 1.5rem; /* mb-6 */
}
.dark .mint-page-title {
  color: #ffffff; /* dark:text-white */
}

/* Wallet Status Section */
.wallet-status-section {
  margin-bottom: 1.5rem; /* mb-6 */
  padding: 1rem; /* p-4 */
  border: 1px solid #e5e7eb; /* border-gray-200 */
  border-radius: 0.375rem; /* rounded-md */
  text-align: center;
}
.dark .wallet-status-section {
  border-color: #374151; /* dark:border-gray-700 */
}
.wallet-status-section .section-heading { /* h2 */
  font-size: 1.125rem; /* text-lg */
  font-weight: 600; /* font-semibold */
  color: #374151; /* text-gray-700 */
  margin-bottom: 0.75rem; /* mb-3 */
}
.dark .wallet-status-section .section-heading {
  color: #e5e7eb; /* dark:text-gray-200 */
}
.wallet-connected-info, .wallet-disconnected-info { /* Extends .info-box or .warning-box */
  margin-top: 0.75rem; /* mt-3 */
}
.wallet-address-display {
  font-family: monospace;
  font-size: 0.875rem; /* text-sm */
}

/* Loading and Error Indicators */
.loading-indicator-container {
  text-align: center;
  padding-top: 1.25rem; /* py-5 */
  padding-bottom: 1.25rem;
}
.spinner {
  display: inline-block;
  width: 2rem;
  height: 2rem;
  border-width: 4px;
  border-top-color: #4f46e5; /* Indigo 600 */
  border-right-color: transparent;
  border-bottom-color: transparent;
  border-left-color: transparent;
  border-radius: 9999px;
  animation: spin 1s linear infinite;
}
.dark .spinner {
  border-top-color: #818cf8; /* Indigo 400 */
}
@keyframes spin { to { transform: rotate(360deg); } }

.loading-text {
  margin-top: 0.5rem; /* mt-2 */
  color: #4b5563; /* text-gray-600 */
}
.dark .loading-text {
  color: #9ca3af; /* dark:text-gray-400 */
}
.cm-address-display {
  font-family: monospace;
  font-size: 0.75rem; /* text-xs */
}
.initial-load-error { /* Extends .error-box */
  text-align: center;
}
.error-subtext {
  margin-top: 0.25rem; /* mt-1 */
  font-size: 0.75rem; /* text-xs */
}

/* Active Mint Section */
.mint-section-active {
  /* Container for CM details and mint button when active */
}
.cm-details-box {
  padding: 1rem; /* p-4 */
  background-color: #f9fafb; /* bg-gray-50 */
  border-radius: 0.375rem; /* rounded-md */
  margin-bottom: 1.5rem; /* mb-6 */
}
.dark .cm-details-box {
  background-color: #374151; /* dark:bg-gray-700 */
}
.cm-name {
  font-size: 1.25rem; /* text-xl */
  font-weight: 600; /* font-semibold */
  color: #374151; /* text-gray-700 */
  margin-bottom: 0.5rem; /* mb-2 */
}
.dark .cm-name {
  color: #e5e7eb; /* dark:text-gray-200 */
}
.cm-detail-item {
  font-size: 0.875rem; /* text-sm */
  color: #4b5563; /* text-gray-600 */
}
.dark .cm-detail-item {
  color: #9ca3af; /* dark:text-gray-400 */
}
.cm-detail-value {
  font-weight: 600; /* font-semibold */
}
.cm-date-info {
  font-size: 0.75rem; /* text-xs */
  color: #6b7280; /* text-gray-500 */
  margin-top: 0.25rem; /* mt-1 */
}
.dark .cm-date-info {
  color: #d1d5db; /* dark:text-gray-300 */
}

.mint-button-container {
  text-align: center;
}
.btn-mint { /* Extends .btn .btn-primary .btn-lg .w-full */
  width: 100%;
  padding-top: 0.75rem; /* py-3 */
  padding-bottom: 0.75rem;
  font-size: 1rem; /* text-base */
}
.btn-mint:disabled {
  opacity: 0.6;
}
.mint-button-inner-text {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.spinner-inline {
  display: inline-block;
  width: 1rem; /* w-4 */
  height: 1rem; /* h-4 */
  border-width: 2px;
  border-color: currentColor; /* currentColor */
  border-right-color: transparent;
  border-radius: 9999px;
  animation: spin 1s linear infinite;
  margin-right: 0.5rem; /* mr-2 */
}

/* Info/Warning Boxes for CM Status */
.cm-load-failed-info, .no-cm-id-info { /* Extends .info-box or .warning-box */
  text-align: center;
}
.cm-load-failed-info .cm-address-display, .no-cm-id-info .cm-address-display {
  font-family: monospace;
}

/* UI Message Display Area */
.ui-message-display {
  margin-top: 1.5rem; /* mt-6 */
  padding: 0.75rem; /* p-3 */
  border-radius: 0.375rem; /* rounded-md */
  text-align: center;
  font-size: 0.875rem; /* text-sm */
}
.ui-message-title {
  font-weight: 500; /* font-medium */
}
.tx-link-container {
  margin-top: 0.5rem; /* mt-2 */
}
.transaction-link { /* Extends .link */
  /* Additional styles if needed */
}


/* General Reusable Box Styles (from previous versions) */
.info-box {
  margin-top: 0.5rem; /* mt-2 */
  padding: 0.75rem; /* p-3 */
  background-color: #eff6ff; /* bg-blue-50 */
  border-radius: 0.375rem; /* rounded-md */
  border: 1px solid #bfdbfe; /* border-blue-200 */
  font-size: 0.875rem; /* text-sm */
  color: #1d4ed8; /* text-blue-700 */
}
.dark .info-box {
  background-color: rgba(30, 58, 138, 0.3); /* dark:bg-blue-700/30 */
  border-color: rgba(59, 130, 246, 0.5); /* dark:border-blue-600 */
  color: #93c5fd; /* dark:text-blue-200 */
}
.warning-box {
  margin-top: 0.5rem; /* mt-2 */
  padding: 0.75rem; /* p-3 */
  background-color: #fffbeb; /* bg-yellow-50 */
  border-radius: 0.375rem; /* rounded-md */
  border: 1px solid #fde68a; /* border-yellow-300 */
  font-size: 0.875rem; /* text-sm */
  color: #b45309; /* text-yellow-700 */
}
.dark .warning-box {
  background-color: rgba(120, 53, 15, 0.3); /* dark:bg-yellow-700/30 */
  border-color: rgba(245, 158, 11, 0.5); /* dark:border-yellow-600 */
  color: #fcd34d; /* dark:text-yellow-200 */
}
.error-box {
  margin-top: 0.5rem; /* mt-2 */
  padding: 0.75rem; /* p-3 */
  background-color: #fef2f2; /* bg-red-50 */
  border-radius: 0.375rem; /* rounded-md */
  border: 1px solid #fecaca; /* border-red-300 */
  font-size: 0.875rem; /* text-sm */
  color: #b91c1c; /* text-red-700 */
}
.dark .error-box {
  background-color: rgba(153, 27, 27, 0.3); /* dark:bg-red-700/30 */
  border-color: rgba(220, 38, 38, 0.5); /* dark:border-red-600 */
  color: #fca5a5; /* dark:text-red-200 */
}
.success-box {
  margin-top: 0.5rem; /* mt-2 */
  padding: 0.75rem; /* p-3 */
  background-color: #f0fdf4; /* bg-green-50 */
  border-radius: 0.375rem; /* rounded-md */
  border: 1px solid #bbf7d0; /* border-green-300 */
  font-size: 0.875rem; /* text-sm */
  color: #166534; /* text-green-700 */
}
.dark .success-box {
  background-color: rgba(22, 101, 52, 0.3); /* dark:bg-green-700/30 */
  border-color: rgba(34, 197, 94, 0.5); /* dark:border-green-600 */
  color: #86efac; /* dark:text-green-200 */
}

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

/* Reusable Button Styles */
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
  /* opacity is handled by specific button types or .disabled:opacity-60 */
}
.btn-primary {
  background-color: #4f46e5; /* bg-indigo-600 */
}
.btn-primary:hover {
  background-color: #4338ca; /* hover:bg-indigo-700 */
}
.btn-primary:focus {
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.5); /* focus:ring-indigo-500 */
}
.btn-primary:disabled {
  background-color: #a5b4fc; /* disabled:bg-indigo-400 */
  opacity: 0.6;
}
.dark .btn-primary {
  background-color: #6366f1; /* dark:bg-indigo-500 */
}
.dark .btn-primary:hover {
  background-color: #818cf8; /* dark:hover:bg-indigo-400 */
}
.dark .btn-primary:disabled {
  background-color: #4338ca; /* dark:disabled:bg-indigo-700 */
  opacity: 0.6;
}
.btn-lg {
  padding: 0.75rem 1.5rem; /* px-6 py-3 */
  font-size: 1rem; /* text-base */
}
</style>