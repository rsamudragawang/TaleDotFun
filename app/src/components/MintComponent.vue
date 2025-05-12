<template>
  <div class="mint-component-container p-4 md:p-6 max-w-lg mx-auto bg-white dark:bg-gray-800 shadow-xl rounded-lg">
    <h1 class="text-2xl font-bold text-center text-gray-800 dark:text-white mb-6">Mint Your NFT</h1>

    <div class="mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-md text-center">
      <h2 class="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-3">Wallet Status</h2>
      <WalletMultiButton /> {/* Standard wallet button */}
      <div v-if="wallet.connected.value && wallet.publicKey.value" class="info-box mt-3">
        Connected: <span class="font-mono text-sm">{{ shortenAddress(wallet.publicKey.value.toBase58()) }}</span>
      </div>
      <div v-else class="warning-box mt-3">
        Please connect your wallet to mint.
      </div>
    </div>

    <div v-if="isLoadingInitialData && props.candyMachineAddress" class="text-center py-5">
        <div class="spinner"></div>
        <p class="mt-2 text-gray-600 dark:text-gray-400">Loading Candy Machine details for <span class="font-mono text-xs">{{ shortenAddress(props.candyMachineAddress, 8) }}</span>...</p>
    </div>
    <div v-else-if="initialLoadingError" class="error-box text-center">
        <p>Failed to load Candy Machine: {{ initialLoadingError }}</p>
        <p class="mt-1 text-xs">Ensure the CM ID ({{ props.candyMachineAddress || 'Not Provided' }}) is correct.</p>
    </div>
    <div v-else-if="wallet.connected.value && candyMachine" class="mint-section">
      <div class="candy-details p-4 bg-gray-50 dark:bg-gray-700 rounded-md mb-6">
        <h2 class="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">{{ candyMachineDetails.name }}</h2>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Price: <span class="font-semibold">{{ formatLamports(candyMachineDetails.price) }} SOL</span>
        </p>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Remaining: <span class="font-semibold">{{ candyMachineDetails.itemsRemaining }} / {{ candyMachineDetails.itemsAvailable }}</span>
        </p>
        <p v-if="candyMachineDetails.goLiveDate !== 'Not set'" class="text-xs text-gray-500 dark:text-gray-300 mt-1">
          Live Date: {{ candyMachineDetails.goLiveDate }}
        </p>
        <p v-if="candyMachineDetails.endDate !== 'Not set'" class="text-xs text-gray-500 dark:text-gray-300 mt-1">
          End Date: {{ candyMachineDetails.endDate }}
        </p>
      </div>

      <div class="mint-controls text-center">
        <button
          @click="handleMintNFT"
          :disabled="isMinting || !candyMachine || candyMachineDetails.itemsRemaining === 0 || !wallet.connected.value"
          class="btn btn-primary btn-lg w-full disabled:opacity-60"
        >
          <span v-if="isMinting">
            <span class="spinner-inline"></span> Minting...
          </span>
          <span v-else-if="candyMachineDetails.itemsRemaining === 0">Sold Out</span>
          <span v-else>Mint NFT</span>
        </button>
      </div>
    </div>
    <div v-else-if="wallet.connected.value && !candyMachine && !isLoadingInitialData && props.candyMachineAddress" class="info-box text-center">
        Could not load Candy Machine with ID: <span class="font-mono">{{ props.candyMachineAddress }}</span>.
    </div>
    <div v-else-if="!props.candyMachineAddress && wallet.connected.value" class="warning-box text-center">
      No Candy Machine ID has been specified for minting. This component might be accessed via a general '/mint' route.
    </div>

    <div v-if="uiMessage.text"
         :class="uiMessage.type === 'error' ? 'error-box' : (uiMessage.type === 'success' ? 'success-box' : 'info-box')"
         class="mt-6 p-3 rounded-md text-center text-sm">
      <p class="font-medium">{{ uiMessage.type === 'error' ? 'Error:' : (uiMessage.type === 'success' ? 'Success!' : 'Info:') }}</p>
      <p v-html="uiMessage.text"></p>
      <div v-if="uiMessage.type === 'success' && mintResult?.signature" class="mt-2">
        <a :href="`https://explorer.solana.com/tx/${mintResult.signature}?cluster=${SOLANA_NETWORK}`" target="_blank" class="link">
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
/* Styles from previous MintComponent.vue */
.mint-component-container { /* Existing styles */ }
.info-box { @apply mt-2 p-3 bg-blue-50 dark:bg-blue-700/30 rounded-md border border-blue-200 dark:border-blue-600 text-sm text-blue-700 dark:text-blue-200; }
.warning-box { @apply mt-2 p-3 bg-yellow-50 dark:bg-yellow-700/30 rounded-md border border-yellow-300 dark:border-yellow-600 text-sm text-yellow-700 dark:text-yellow-200; }
.error-box { @apply mt-2 p-3 bg-red-50 dark:bg-red-700/30 rounded-md border border-red-300 dark:border-red-600 text-sm text-red-700 dark:text-red-200; }
.success-box { @apply mt-2 p-3 bg-green-50 dark:bg-green-700/30 rounded-md border border-green-300 dark:border-green-600 text-sm text-green-700 dark:text-green-200; }
.link { @apply text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 underline font-medium; }
.spinner { @apply inline-block w-8 h-8 border-4 border-t-indigo-600 dark:border-t-indigo-400 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin; }
.spinner-inline { @apply inline-block w-4 h-4 border-2 border-current border-r-transparent rounded-full animate-spin mr-2; }

.btn { @apply px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed; }
.btn-primary { @apply bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400 disabled:bg-indigo-400 dark:disabled:bg-indigo-700; }
.btn-lg { @apply px-6 py-3 text-base; }

.candy-machine-container {
  max-width: 600px;
  margin: 2rem auto;
  padding: 2rem;
  background: #f0f2f5;
  border-radius: 12px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
}
.dark .candy-machine-container {
    background: #2d3748; /* gray-800 */
}


h1 {
  color: #333;
  margin-bottom: 1.5rem;
  text-align: center;
  font-size: 24px;
  font-weight: 600;
}
.dark h1 {
    color: #f7fafc; /* gray-100 */
}


h2 {
  color: #444;
  margin-top: 0;
  margin-bottom: 0.5rem;
  font-size: 20px;
}
.dark h2 {
    color: #e2e8f0; /* gray-200 */
}

/* .connect-section and button styles are handled by WalletMultiButton and its global styles */

.wallet-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #e9ecef;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}
.dark .wallet-info {
    background: #4a5568; /* gray-700 */
}
.dark .wallet-info p {
    color: #e2e8f0; /* gray-200 */
}


.candy-details {
  background: #fff;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}
.dark .candy-details {
    background: #374151; /* gray-700 */
}
.dark .candy-details p {
    color: #cbd5e0; /* gray-300 */
}
.dark .candy-details h2 {
    color: #f0f2f5; /* gray-100 */
}


.mint-controls {
  text-align: center;
  margin-bottom: 1.5rem;
}

.mint-result {
  margin-top: 1.5rem;
  padding: 1rem;
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
  border-radius: 8px;
  text-align: center;
}
.dark .mint-result {
    background: #2f855a; /* green-700 */
    color: #c6f6d5; /* green-200 */
    border-color: #38a169; /* green-600 */
}
.dark .mint-result a {
    color: #9ae6b4; /* green-300 */
}
</style>