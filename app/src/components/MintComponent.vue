<template>
  <div class="mint-component-container">
    <h1 class="mint-page-title">Mint Your NFT</h1>

    <div v-if="!wallet.connected.value" class="wallet-prompt-section">
        <p class="info-text">Please connect your wallet to mint or view Candy Machine details.</p>
        <div class="wallet-button-wrapper">
            <WalletMultiButton />
        </div>
    </div>

    <div v-if="isLoadingInitialData && props.candyMachineAddress" class="loading-indicator-container">
        <div class="spinner"></div>
        <p class="loading-text">Loading Candy Machine details for <span class="cm-address-display">{{ shortenAddress(props.candyMachineAddress, 8) }}</span>...</p>
    </div>
    <div v-else-if="initialLoadingError && props.candyMachineAddress" class="error-box initial-load-error">
        <p>Failed to load Candy Machine: {{ initialLoadingError }}</p>
        <p class="error-subtext">Ensure the CM ID ({{ props.candyMachineAddress || 'Not Provided' }}) is correct and your wallet is connected to the correct network ({{ SOLANA_NETWORK }}).</p>
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
        <p v-if="props.episodeOnChainPda" class="cm-detail-item info-text-sm">
            Minting for Episode: <span class="cm-detail-value episode-link-display">{{ shortenAddress(props.episodeOnChainPda, 6) }}</span>
        </p>
      </div>

      <div class="mint-button-container">
        <button
          @click="handleMintNFT"
          :disabled="isMinting || !candyMachine || candyMachineDetails.itemsRemaining === 0 || !wallet.connected.value || !anchorProgram"
          class="btn btn-primary btn-mint"
        >
          <span v-if="isMinting" class="mint-button-inner-text">
            <span class="spinner-inline"></span> Minting...
          </span>
          <span v-else-if="candyMachineDetails.itemsRemaining === 0" class="mint-button-inner-text">Sold Out</span>
           <span v-else-if="!anchorProgram && wallet.connected.value" class="mint-button-inner-text">Initializing Program...</span>
          <span v-else class="mint-button-inner-text">Mint NFT</span>
        </button>
      </div>
    </div>
    <div v-else-if="wallet.connected.value && !candyMachine && !isLoadingInitialData && props.candyMachineAddress" class="info-box cm-load-failed-info">
        Could not load Candy Machine with ID: <span class="cm-address-display">{{ props.candyMachineAddress }}</span>. Please check the ID and network.
    </div>
    <div v-else-if="wallet.connected.value && !props.candyMachineAddress" class="warning-box no-cm-id-info">
      No Candy Machine ID has been specified for minting.
    </div>


    <div v-if="uiMessage.text"
         :class="['ui-message-display', uiMessage.type === 'error' ? 'error-box' : (uiMessage.type === 'success' ? 'success-box' : 'info-box')]">
      <p class="ui-message-title">{{ uiMessage.type === 'error' ? 'Error:' : (uiMessage.type === 'success' ? 'Success!' : 'Info:') }}</p>
      <p v-html="uiMessage.text"></p>
      <div v-if="uiMessage.type === 'success' && mintResult?.signature" class="tx-link-container">
        <a :href="`https://explorer.solana.com/tx/${mintResult.signature}?cluster=${SOLANA_NETWORK}`" target="_blank" class="link transaction-link">
          View Mint Transaction
        </a>
      </div>
       <div v-if="uiMessage.type === 'success' && mintResult?.activityLogSignature" class="tx-link-container">
        <a :href="`https://explorer.solana.com/tx/${mintResult.activityLogSignature}?cluster=${SOLANA_NETWORK}`" target="_blank" class="link transaction-link">
          View Activity Log Transaction
        </a>
      </div>
    </div>
  </div>
</template>


<script setup>
import { ref, onMounted, watch, defineProps } from 'vue';
import { useWallet, WalletMultiButton } from 'solana-wallets-vue';
import { Connection, PublicKey, SystemProgram } from '@solana/web3.js';
import { Program, AnchorProvider, web3 } from '@coral-xyz/anchor';
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
  publicKey as umiPublicKeyUtil,
  generateSigner as umiGenerateSigner,
  transactionBuilder as umiTransactionBuilder,
  some as umiSome,
  sol as umiSol,
  // Option, // For UMI's Option type
} from '@metaplex-foundation/umi';
import { setComputeUnitLimit } from '@metaplex-foundation/mpl-toolbox';
import { base58 } from '@metaplex-foundation/umi/serializers';
// No axios needed if not logging to a separate backend

// Import your program's IDL and Program ID
// **CRITICAL**: Adjust this path to your actual IDL file generated by `anchor build`
import idlFromFile from '../anchor/tale_nft' // Adjust path as necessary
const READIUM_FUN_PROGRAM_ID = new PublicKey("DJgfvt8jXgkXXkRx7CaFa9FJSXbcc1SALnfyCdXHZR1j"); // Your Program ID from IDL
const idl = idlFromFile;


const props = defineProps({
  candyMachineAddress: {
    type: String,
    default: null,
  },
  episodeOnChainPda: { // Optional: String PDA of the on-chain Episode this mint is for
    type: String,
    default: null,
  }
});

const RPC_ENDPOINT = import.meta.env.VITE_RPC_ENDPOINT || 'https://api.devnet.solana.com';
const SOLANA_NETWORK = RPC_ENDPOINT.includes('mainnet') ? 'mainnet-beta' : (RPC_ENDPOINT.includes('testnet') ? 'testnet' : 'devnet');

const wallet = useWallet();
let umi = null; // Umi instance for Metaplex
let anchorProvider = null; // Anchor provider
let anchorProgram = null;  // Anchor program instance for your custom program

const isLoadingInitialData = ref(false);
const initialLoadingError = ref('');
const candyMachine = ref(null);
const candyGuard = ref(null);
const collectionNft = ref(null);
const candyMachineDetails = ref({
  name: 'Loading...', price: 0, itemsAvailable: 0, itemsMinted: 0, itemsRemaining: 0, goLiveDate: 'Not set', endDate: 'Not set',
});

const isMinting = ref(false);
const mintResult = ref(null);
const uiMessage = ref({ text: '', type: 'info' });

const showUiMessage = (msg, type = 'info', duration = 7000) => {
  uiMessage.value = { text: msg, type };
  if (duration > 0) {
    setTimeout(() => { uiMessage.value = { text: '', type: 'info' }; }, duration);
  }
};
const shortenAddress = (address, chars = 4) => address ? `${address.slice(0, chars)}...${address.slice(-chars)}` : '';
const formatLamports = (lamports) => (typeof lamports !== 'number' || isNaN(lamports)) ? 'N/A' : (Number(lamports) / 1_000_000_000).toFixed(4);
const formatTimestamp = (dateObject) => {
  if (!dateObject || !(dateObject instanceof Date)) {
      if (dateObject && typeof dateObject.basisPoints === 'bigint') { // UMI dateTime is an object with basisPoints
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


const tryInitializeUmiAndAnchor = () => {
  if (wallet.connected.value && wallet.wallet.value?.adapter && wallet.publicKey.value) {
    // Initialize UMI
    if (!umi || umi.identity.publicKey.toString() !== wallet.publicKey.value.toBase58()) {
      try {
        umi = createUmi(RPC_ENDPOINT)
          .use(walletAdapterIdentity(wallet.wallet.value.adapter))
          .use(mplCandyMachine());
        console.log("MintComponent: UMI Initialized/Updated:", wallet.publicKey.value.toBase58());
      } catch (e) {
        console.error("MintComponent: UMI Init failed", e);
        initialLoadingError.value = `Failed to init UMI: ${e.message}`;
        umi = null; // Ensure UMI is null on failure
        return false;
      }
    }

    // Initialize Anchor
    if (!anchorProgram || anchorProvider?.wallet?.publicKey?.toBase58() !== wallet.publicKey.value.toBase58()) {
        try {
            const connectionForAnchor = new Connection(RPC_ENDPOINT, "confirmed");
            // Pass wallet.wallet.value.adapter which implements the SignerWalletAdapter interface
            anchorProvider = new AnchorProvider(connectionForAnchor, wallet.wallet.value.adapter, AnchorProvider.defaultOptions());
            anchorProgram = new Program(idl,  anchorProvider);
            console.log("MintComponent: Anchor Program Initialized:", wallet.publicKey.value.toBase58());
        } catch (e) {
            console.error("MintComponent: Anchor Program Init failed", e);
            initialLoadingError.value = (initialLoadingError.value ? initialLoadingError.value + " | " : "") + `Anchor Init: ${e.message}`;
            anchorProgram = null; anchorProvider = null;
            // Don't return false here, UMI might still be fine for CM loading
        }
    }
    return true; // UMI is ready, Anchor status depends on its init
  }
  umi = null; anchorProgram = null; anchorProvider = null;
  return false;
};


const loadCandyMachineData = async () => {
  if (!props.candyMachineAddress) {
    initialLoadingError.value = "No Candy Machine ID specified.";
    showUiMessage(initialLoadingError.value, "warning");
    return;
  }
  if (!umi) {
    initialLoadingError.value = "Umi (Metaplex SDK) not ready. Please connect wallet.";
    showUiMessage(initialLoadingError.value, "error");
    return;
  }

  isLoadingInitialData.value = true; initialLoadingError.value = '';
  showUiMessage(`Loading CM: ${shortenAddress(props.candyMachineAddress, 6)}...`, "info", 0);

  try {
    const cmPublicKey = umiPublicKeyUtil(props.candyMachineAddress);
    const cmAccount = await fetchCandyMachine(umi, cmPublicKey);
    if (!cmAccount) throw new Error(`CM account not found: ${props.candyMachineAddress}`);
    candyMachine.value = cmAccount;

    if (!cmAccount.mintAuthority) throw new Error("CM mintAuthority (guard address) not found.");
    const cgAccount = await fetchCandyGuard(umi, cmAccount.mintAuthority);
    if (!cgAccount) throw new Error(`Candy Guard not found for CM: ${cmAccount.mintAuthority}`);
    candyGuard.value = cgAccount;

    if (!cmAccount.collectionMint) throw new Error("CM collectionMint address not found.");
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
    showUiMessage("", "info"); // Clear loading message
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
  if (!tryInitializeUmiAndAnchor() || !umi || !anchorProgram) { // Ensure Anchor program is also ready
    showUiMessage("Wallet, Umi, or Anchor Program not ready. Please try again.", "error"); return;
  }
  if (!candyMachine.value || !candyGuard.value || !collectionNft.value || !wallet.publicKey.value) {
    showUiMessage("Required data missing. Ensure CM is loaded & wallet connected.", "error"); return;
  }

  isMinting.value = true; mintResult.value = null;
  showUiMessage("Preparing to mint NFT... Approve in wallet.", "info", 0);

  let nftMintTxSignature = '';
  let mintedNftAddressString = '';

  try {
    // 1. Mint NFT via Candy Machine (Umi)
    const nftMintSigner = umiGenerateSigner(umi); // This is an Umi Signer
    mintedNftAddressString = nftMintSigner.publicKey.toString();

    const solPaymentGuardValue = candyGuard.value.guards.solPayment?.value;
    let solPaymentArg = undefined;
    if (solPaymentGuardValue && solPaymentGuardValue.destination) {
        solPaymentArg = umiSome({ destination: solPaymentGuardValue.destination });
    }
    const startDateGuardValue = candyGuard.value.guards.startDate?.value;
    let startDateArg = undefined;
    if (startDateGuardValue && startDateGuardValue.date) {
        startDateArg = umiSome({ date: startDateGuardValue.date });
    }
    
    const mintV2Args = {
      candyMachine: candyMachine.value.publicKey,
      nftMint: nftMintSigner,
      collectionMint: collectionNft.value.publicKey,
      collectionUpdateAuthority: collectionNft.value.metadata.updateAuthority,
      tokenStandard: candyMachine.value.tokenStandard,
      candyGuard: candyGuard.value.publicKey,
      mintArgs: {
        ...(solPaymentArg && { solPayment: solPaymentArg }),
        ...(startDateArg && { startDate: startDateArg }),
        botTax: umiSome({ lamports: umiSol(0.001), lastInstruction: true }),
      },
    };

    const builder = umiTransactionBuilder()
      .add(setComputeUnitLimit(umi, { units: 800_000 }))
      .add(mintV2(umi, mintV2Args));

    const result = await builder.sendAndConfirm(umi, { confirm: { commitment: 'finalized' } });
    nftMintTxSignature = base58.deserialize(result.signature)[0];
    mintResult.value = { signature: nftMintTxSignature, nftMintAddress: mintedNftAddressString };
    showUiMessage(`NFT Minted: ${shortenAddress(mintedNftAddressString)}! Sig: ${shortenAddress(nftMintTxSignature, 8)}. Logging activity...`, "success", 0);

    // 2. Log Mint Activity On-Chain using Anchor
    if (anchorProgram && wallet.publicKey.value) { // Ensure anchorProgram is initialized
      const userWalletPk_web3 = wallet.publicKey.value; // web3.js PublicKey
      const nftMintPk_web3 = new PublicKey(mintedNftAddressString); // web3.js PublicKey
      const candyMachinePk_web3 = new PublicKey(props.candyMachineAddress); // web3.js PublicKey
      
      const episodePdaOption_web3 = props.episodeOnChainPda ? new PublicKey(props.episodeOnChainPda) : null;

      // Derive PDA for the mint_activity_account
      const [mintActivityPDA, _bump] = await PublicKey.findProgramAddress(
          [
              Buffer.from("mint_activity"),
              userWalletPk_web3.toBuffer(),
              nftMintPk_web3.toBuffer()
          ],
          READIUM_FUN_PROGRAM_ID
      );
      
      try {
        const logTxSignature = await anchorProgram.methods.logMintActivity(
          candyMachinePk_web3,      // candy_machine_id_arg (Pubkey)
          nftMintTxSignature,       // transaction_signature_str (String)
          episodePdaOption_web3     // episode_on_chain_pda_option (Option<Pubkey>)
        )
        .accounts({
          mintActivityAccount: mintActivityPDA,
          nftMintAddress: nftMintPk_web3, // Pass the Pubkey of the minted NFT
          userWallet: userWalletPk_web3,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
        
        mintResult.value.activityLogSignature = logTxSignature;
        showUiMessage(`NFT Minted & Activity Logged! Mint Sig: ${shortenAddress(nftMintTxSignature, 6)}, Log Sig: ${shortenAddress(logTxSignature, 6)}`, "success");
        console.log("Mint activity logged on-chain. Tx Signature:", logTxSignature);

      } catch (logError) {
          console.error('On-chain activity logging failed:', logError);
          let logErrorMsg = logError.message || "Unknown error during on-chain logging.";
          if (logError.logs) logErrorMsg += ` Logs: ${logError.logs.join(', ')}`;
          showUiMessage(`NFT Minted, but on-chain activity log failed: ${logErrorMsg}`, "warning");
      }
    } else {
        showUiMessage("NFT Minted, but Anchor program not ready for on-chain logging.", "warning");
    }
    await loadCandyMachineData(); // Refresh CM details

  } catch (err) {
    console.error('Minting or initial logging failed:', err);
    let errorMsg = err.message || "An unknown error occurred during minting.";
    if (err.logs) errorMsg += ` Logs: ${err.logs.join(', ')}`;
    showUiMessage(errorMsg, "error");
  } finally {
    isMinting.value = false;
  }
};

watch(
  () => [wallet.connected.value, wallet.publicKey.value?.toBase58(), wallet.wallet.value?.adapter],
  async ([isConnected, currentPublicKeyString, currentAdapter], [wasConnected, oldPublicKeyString, oldAdapter]) => {
    if (isConnected && currentAdapter) {
      if (tryInitializeUmiAndAnchor()) {
        if (props.candyMachineAddress && (!candyMachine.value || isLoadingInitialData.value)) {
          await loadCandyMachineData();
        } else if (!props.candyMachineAddress) {
          initialLoadingError.value = "No Candy Machine ID specified.";
        }
      }
    } else if (!isConnected && wasConnected) {
      umi = null; anchorProgram = null; anchorProvider = null;
      candyMachine.value = null; candyGuard.value = null; collectionNft.value = null;
      candyMachineDetails.value = { name: 'Loading...', price: 0, itemsAvailable: 0, itemsMinted: 0, itemsRemaining: 0, goLiveDate: 'Not set', endDate: 'Not set' };
      if (props.candyMachineAddress) showUiMessage("Wallet disconnected.", "info");
    }
  },
  { immediate: true, deep: false }
);

watch(() => props.candyMachineAddress, async (newAddress, oldAddress) => {
  if (newAddress && newAddress !== oldAddress) {
    if (wallet.connected.value && wallet.wallet.value?.adapter) {
      if (tryInitializeUmiAndAnchor()) await loadCandyMachineData();
    } else if (!wallet.connected.value) {
      showUiMessage("Connect wallet to load new CM.", "info");
    }
  } else if (!newAddress && oldAddress) { 
      initialLoadingError.value = "Candy Machine ID removed.";
      candyMachine.value = null; candyGuard.value = null; collectionNft.value = null;
      candyMachineDetails.value = { name: 'N/A', price: 0, itemsAvailable: 0, itemsMinted: 0, itemsRemaining: 0, goLiveDate: 'N/A', endDate: 'N/A' };
  }
}, { immediate: false });

onMounted(() => {
  if (typeof window !== 'undefined' && !window.Buffer) { // Polyfill Buffer if needed
    window.Buffer = Buffer;
  }
  if (!props.candyMachineAddress) initialLoadingError.value = "No CM ID specified.";
  // Initial UMI/Anchor setup and CM load is handled by the watcher.
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

.wallet-prompt-section {
    text-align: center;
    margin-bottom: 1.5rem;
    padding: 1rem;
    background-color: #f9fafb; /* bg-gray-50 */
    border-radius: 0.375rem; /* rounded-md */
}
.dark .wallet-prompt-section {
    background-color: #374151; /* dark:bg-gray-700 */
}
.wallet-prompt-section .info-text {
    margin-bottom: 0.75rem;
    font-size: 0.875rem;
    color: #4b5563;
}
.dark .wallet-prompt-section .info-text {
    color: #d1d5db;
}
.wallet-button-wrapper {
    display: flex;
    justify-content: center;
    margin-top: 1rem;
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
.episode-link-display {
    font-family: monospace;
    font-weight: normal;
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
  margin-bottom: 0.25rem;
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
.info-text-sm {
    font-size: 0.75rem; /* text-xs */
    margin-top: 0.5rem; /* mt-2 */
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
