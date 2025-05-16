<template>
  <div class="cm-creator-embedded">
    <h4 class="cm-creator-title">
      {{ createdCandyMachineId ? 'Candy Machine Created!' : 'Setup New Candy Machine for this Episode' }}
    </h4>

    <!-- <div v-if="!isWalletManagedExternally && !wallet.connected.value" class="cm-wallet-button-container">
      <WalletMultiButton />
    </div>
     <div v-if="!isWalletManagedExternally && wallet.connected.value" class="cm-info-box cm-wallet-info">
      Wallet: <span class="cm-wallet-address">{{ shortenAddress(wallet.publicKey.value?.toBase58()) }}</span>
    </div> -->

    <form @submit.prevent="handleCreateCandyMachine" v-if="wallet.connected.value && !createdCandyMachineId" class="cm-form">
      <fieldset class="cm-fieldset">
        <legend class="cm-legend">1. Collection Link (Optional)</legend>
         <!-- <p class="cm-fieldset-description">
           The Candy Machine will be linked to a new Collection NFT.
           The Collection NFT's metadata will use details from the current Tale:
           <br/>Name: "{{ episodeProps.parentTale?.title || 'Episode Collection' }}",
           Symbol: "{{ episodeProps.parentTale?.title?.substring(0,3).toUpperCase().replace(/[^A-Z0-9]/g, '') || 'ECL' }}"
        </p> -->
        <div class="form-group">
          <label for="cmCollectionName" class="form-label">Collection Name (for on-chain NFT):</label>
          <input type="text" id="cmCollectionName" v-model="collectionConfig.name" class="form-input" required />
        </div>
         <div class="form-group">
          <label for="cmCollectionSymbol" class="form-label">Collection Symbol:</label>
          <input type="text" id="cmCollectionSymbol" v-model="collectionConfig.symbol" class="form-input" />
        </div>
        <div class="form-group">
          <label for="collectionSellerFee" class="form-label">Collection Seller Fee Basis Points (e.g., 500 for 5%):</label>
          <input type="number" id="collectionSellerFee" v-model.number="collectionConfig.sellerFeeBasisPoints" class="form-input" min="0" max="10000" required />
        </div>
      </fieldset>

      <fieldset class="cm-fieldset">
        <legend class="cm-legend">2. Candy Machine Settings</legend>
        <div class="form-group">
          <label for="cmItemsAvailable" class="form-label">Total Items (typically 1 for a single episode NFT):</label>
          <input type="number" id="cmItemsAvailable" v-model.number="cmConfig.itemsAvailable" class="form-input" min="1" required />
        </div>
        <div class="form-group">
          <label for="cmNamePrefix" class="form-label">NFT Name Prefix (e.g., "{{ currentEpisodeName }} #"):</label>
          <input type="text" id="cmNamePrefix" v-model="cmConfig.namePrefix" class="form-input" required />
        </div>
        <div class="form-group">
          <label for="cmSellerFee" class="form-label">NFT Seller Fee Basis Points:</label>
          <input type="number" id="cmSellerFee" v-model.number="cmConfig.sellerFeeBasisPoints" class="form-input" min="0" max="10000" required />
        </div>
         <input type="hidden" v-model="cmConfig.symbol" />
        <input type="hidden" v-model="cmConfig.creatorsJson" />
        <label for="collectionImage">Collection Image:</label>
        <input type="file" id="collectionImage" @change="handleImageUpload" accept="image/*" />

      </fieldset>

      <fieldset class="cm-fieldset">
        <legend class="cm-legend">3. Minting Rules (Candy Guard)</legend>
        <div class="form-group">
          <label for="cmSolPaymentAmount" class="form-label">SOL Price per NFT (e.g., 0.1):</label>
          <input type="number" step="any" id="cmSolPaymentAmount" v-model.number="guardConfig.solPayment.amount" class="form-input" min="0" />
        </div>
        <div class="form-group">
          <label for="cmSolPaymentDestination" class="form-label">Payment Destination (your wallet):</label>
          <input type="text" id="cmSolPaymentDestination" v-model="guardConfig.solPayment.destination" class="form-input" readonly />
           <small class="form-text">Will use your connected wallet.</small>
        </div>
      </fieldset>

      <fieldset class="cm-fieldset">
        <legend class="cm-legend">4. NFT Metadata for this Episode</legend>
        <p class="cm-fieldset-description">
           This metadata will be used for all {{ cmConfig.itemsAvailable }} item(s) in this new Candy Machine.
           The NFT name will be "{{ cmConfig.namePrefix }}[Number]".
           The image and description will come from the Episode details you've already provided.
        </p>
        <div v-if="nftBaseMetadata.generatedJsonUri" class="form-group">
            <label class="form-label">Generated NFT Metadata URI:</label>
            <input type="text" :value="nftBaseMetadata.generatedJsonUri" class="form-input" readonly/>
        </div>
         <small v-else class="alert alert-info generated-uri-info">NFT Metadata URI will be generated upon CM creation using the Episode's image and description.</small>
      </fieldset>

      <button type="submit" :disabled="isLoading || !wallet.connected.value" class="btn btn-success cm-submit-button">
        {{ isLoading ? 'Creating CM...' : 'Create Candy Machine' }}
      </button>
    </form>

    <div v-if="isLoading && !createdCandyMachineId" class="loading-indicator cm-loading-indicator">
      Creating Candy Machine... check wallet for approvals. This may take a moment.
    </div>
    <div v-if="createdCandyMachineId" class="alert alert-success cm-success-message">
      CM Created! ID: <span class="cm-id-display">{{ createdCandyMachineId }}</span>.
      <br/>Collection ID: <span class="cm-id-display">{{ createdCollectionId }}</span>
      <br/>This ID will be saved with the episode.
    </div>
    <div v-if="errorMessage" class="alert alert-danger cm-error-message">
      Error: {{ errorMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch,defineEmits,defineProps } from 'vue';
import { useWallet, WalletMultiButton } from 'solana-wallets-vue';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { walletAdapterIdentity } from '@metaplex-foundation/umi-signer-wallet-adapters';
import {
    mplCandyMachine,
    create,
    addConfigLines,
    CandyMachine,
    CandyGuard,
    ConfigLine,
    // TokenStandard as UmiTokenStandard, // This is UMI's enum/type
} from '@metaplex-foundation/mpl-candy-machine';
import { createNft, TokenStandard } from '@metaplex-foundation/mpl-token-metadata'; // For collection
import {
    generateSigner,
    percentAmount,
    sol,
    dateTime,
    some,
    PublicKey as UmiPublicKey, // UMI's PublicKey type
    publicKey as umiPublicKeyUtil, // UMI's utility to create a PublicKey
    Signer,
    none,
    publicKey,
} from '@metaplex-foundation/umi';
import { setComputeUnitLimit, setComputeUnitPrice } from '@metaplex-foundation/mpl-toolbox';
import { base58 } from '@metaplex-foundation/umi/serializers';
import { createCollection } from '@metaplex-foundation/mpl-core'
import { initWallet } from '../services/walletService';
import { uploadFileToIPFS, uploadJsonToIPFS } from '../services/pinataService';
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import axios from 'axios'
// Using @solana/web3.js's PublicKey for type annotation from useWallet if needed, but mostly dealing with UMI's PublicKey
import { PublicKey, PublicKey as SolanaWeb3JsPublicKey,Connection } from '@solana/web3.js';
const AUTH_API_BASE_URL = import.meta.env.VITE_APP_AUTH_API_URL || 'http://localhost:3000/api';

const RPC_ENDPOINT = import.meta.env.VITE_RPC_ENDPOINT || 'https://api.devnet.solana.com';
const WALLET_PLACEHOLDER = "YOUR_WALLET_ADDRESS_PLACEHOLDER";
const JWT_TOKEN_KEY = 'readium_fun_jwt_token';

const wallet = useWallet(); // wallet.publicKey.value is a SolanaWeb3JsPublicKey | null
const connection = new Connection(RPC_ENDPOINT, "confirmed");
const emit = defineEmits(['candyMachineCreated']);
const isLoading = ref(false);
const appUser = ref(null);
const isLoadingUser = ref(false);
const nftList = ref(null);
const successMessage = ref('');
const errorMessage = ref('');
const createdCandyMachineId = ref('');
const createdCollectionId = ref('');
const transactionSignature = ref('');
import idlFromFile from '../anchor/tale_nft.json';
const PROGRAM_ID = new SolanaWeb3JsPublicKey(idlFromFile.address);
const idl = idlFromFile;
let provider;
let program;
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
    fetchAppUser();
  } else {
    program = null; provider = null; appUser.value = null; nftList.value = [];
  }
}, { immediate: true });
// // --- UMI Instance ---
// const umi = computed(() => {
//   if (wallet.connected.value && wallet.publicKey.value) {
//     console.log(wallet)
//     return createUmi(RPC_ENDPOINT)
//       .use(walletAdapterIdentity(wallet)) // Uses the SolanaWeb3JsPublicKey from wallet adapter
//       .use(mplCandyMachine());
//   }
//   return null;
// });

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
// --- Form Data Refs ---
const collectionConfig = ref({
  name: 'My Awesome Collection',
  symbol: 'MAC',
  uri: 'https://arweave.net/your-collection-metadata.json',
  sellerFeeBasisPoints: 500,
});

const collectionMetadataDetails = ref({
    description: 'This is an amazing collection, automatically described!',
    imageFile: null as File | null,
    imagePreviewUrl: null as string | null,
    imageUrl: '', // e.g., 'https://arweave.net/default_collection_logo.png'
    external_url: '', // e.g., 'https://myproject.com'
    // Attributes for collection can be added here if needed, similar to nftBaseMetadata.attributes
});

const episodeProps = defineProps({
  parentTale: Object,
  currentEpisodeNameFromParent: String,
  episodeImageForNft: String,
  episodeDescriptionForNft: String,
  isWalletManagedExternally: {
    type: Boolean,
    default: false
  }
});

// Use UMI's TokenStandard for the select options, but store its value
const UmiTokenStandardForSelect = TokenStandard; // Alias for template
const cmConfig = ref({
  itemsAvailable: 1,
  sellerFeeBasisPoints: 500,
  namePrefix: 'Sequential NFT #', // NEW: For configLineSettings.prefixName
  symbol: 'MACNFT',
  isMutable: true,
  tokenStandard: TokenStandard.ProgrammableNonFungible, // Default to pNFT (UMI's enum value)
  maxEditionSupply: 0,
  creatorsJson: `[{"address": "${WALLET_PLACEHOLDER}", "verified": false, "share": 100}]`
});

const guardConfig = ref({
  solPayment: {
    amount: 0.1,
    destination: '', // Will be populated by watcher or user input (as base58 string)
  },
  startDate: new Date().toISOString().slice(0, 16),
  endDate: '',
});

const nftBaseMetadata =ref({
  description: 'This is one of many awesome sequential NFTs!',
  imageFile: null,
  imagePreviewUrl: null,
  imageUrl: '',
  attributes: [{ trait_type: 'Type', value: 'Sequential' }],
  generatedJsonUri:''
});

interface Item {
  name: string;
  uri: string;
}
const items = ref<Item[]>([{ name: 'NFT #1', uri: 'https://arweave.net/your-collection-metadata.json' }]);

function addItem() {
  items.value.push({ name: `NFT #${items.value.length + 1}`, uri: '' });
}
function removeItem(index: number) {
  items.value.splice(index, 1);
}

watch(() => episodeProps.parentTale, (newTale) => {
    collectionConfig.value.name = newTale?.title ? `${newTale.title} Collection` : 'Episode Collection';
    const taleSymbol = newTale?.title?.substring(0,3).toUpperCase().replace(/[^A-Z0-9]/g, '');
    collectionConfig.value.symbol = taleSymbol || 'ECL';
    cmConfig.value.symbol = collectionConfig.value.symbol;
}, { immediate: true, deep: true });

watch(() => episodeProps.currentEpisodeNameFromParent, (newName) => {
    cmConfig.value.namePrefix = newName ? `${newName} #` : 'Episode NFT #';
}, { immediate: true });
// --- NEW: Handle Collection Image File ---
function handleCollectionImageFileChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (file) {
    collectionMetadataDetails.value.imageFile = file;
    collectionMetadataDetails.value.imageUrl = ''; // Clear URL if file is selected
    const reader = new FileReader();
    reader.onload = (e) => {
      collectionMetadataDetails.value.imagePreviewUrl = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  } else {
    collectionMetadataDetails.value.imageFile = null;
    collectionMetadataDetails.value.imagePreviewUrl = null;
  }
}
function handleImageFileChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (file) {
    nftBaseMetadata.value.imageFile = file;
    nftBaseMetadata.value.imageUrl = '';
    const reader = new FileReader();
    reader.onload = (e) => {
      nftBaseMetadata.value.imagePreviewUrl = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  } else {
    nftBaseMetadata.value.imageFile = null;
    nftBaseMetadata.value.imagePreviewUrl = null;
  }
}
// Watch for wallet connection changes to update default creator and SOL destination
watch(wallet.publicKey, (solanaWeb3jsPk: SolanaWeb3JsPublicKey | null) => {
  if (solanaWeb3jsPk) {
    const userAddressBase58 = solanaWeb3jsPk.toBase58(); // Correct for SolanaWeb3JsPublicKey
    // Update creatorsJson only if it's still the placeholder
    if (cmConfig.value.creatorsJson.includes(WALLET_PLACEHOLDER)) {
        cmConfig.value.creatorsJson = `[{"address": "${userAddressBase58}", "verified": false, "share": 100}]`;
    }
    // Update SOL payment destination only if it's empty or was the placeholder
    if (!guardConfig.value.solPayment.destination || guardConfig.value.solPayment.destination === WALLET_PLACEHOLDER) {
        guardConfig.value.solPayment.destination = userAddressBase58;
    }
  } else {
    // Wallet disconnected - optionally revert to placeholder if user hasn't changed them
    if (cmConfig.value.creatorsJson.includes(wallet.publicKey.value?.toBase58() || 'random_never_match_string')) { // Check if current wallet was in there
        cmConfig.value.creatorsJson = `[{"address": "${WALLET_PLACEHOLDER}", "verified": false, "share": 100}]`;
    }
    if (guardConfig.value.solPayment.destination === (wallet.publicKey.value?.toBase58() || 'random_never_match_string')) {
        guardConfig.value.solPayment.destination = ''; // Or WALLET_PLACEHOLDER
    }
  }
}, { immediate: true }); // Run on mount to set initial values if wallet already connected


function addAttribute() {
  nftBaseMetadata.value.attributes.push({ trait_type: '', value: '' });
}

function removeAttribute(attrIndex: number) {
  nftBaseMetadata.value.attributes.splice(attrIndex, 1);
}


// --- Main Creation Logic ---
async function handleCreateCandyMachine() {
  const { umi } = await initWallet();
    // umi.use(mplTokenMetadata());
  umi.use(mplCandyMachine());
  console.log(umi)
  if (!umi || !wallet.publicKey.value) { // wallet.publicKey.value is SolanaWeb3JsPublicKey
    errorMessage.value = 'Wallet not connected or UMI not initialized.';
    return;
  }
  // if (items.value.length !== cmConfig.value.itemsAvailable) {
  //   errorMessage.value = `Number of items (${items.value.length}) must match "Total Items Available" (${cmConfig.value.itemsAvailable}).`;
  //   return;
  // }
  if (!collectionConfig.value.uri) {
    errorMessage.value = "Collection Metadata URI is required.";
    return;
  }
  for (let i = 0; i < items.value.length; i++) {
    if (!items.value[i].name || !items.value[i].uri) {
        errorMessage.value = `Item #${i + 1} is missing a name or URI.`;
        return; // Stop execution
    }
  }

  // let finalImageUrl = nftBaseMetadata.value.imageUrl;
  // if (nftBaseMetadata.value.imageFile) {
  //     const url  = await uploadFileToIPFS(nftBaseMetadata.value.imageFile);
  //     finalImageUrl = url.imageUrl
  // }
  // if (!finalImageUrl) throw new Error(`Image missing for shared NFT metadata.`);
  
  // 3. Create metadata JSON
  console.log(episodeProps,"episdoeprops")
  const metadata = {
    name: collectionConfig.value.name,
      symbol: collectionConfig.value.symbol,
      description: `Official collection for "${episodeProps.parentTale?.title || 'this series of episodes'}". Created for episode: "${episodeProps.currentEpisodeNameFromParent || 'Unnamed Episode'}".`,
      image: episodeProps.episodeImageForNft,
      seller_fee_basis_points: collectionConfig.value.sellerFeeBasisPoints,
      properties: {
          files: [{ uri: episodeProps.episodeImageForNft, type: "image/png" }], // Assuming PNG
          category: "image",
          creators: JSON.parse(cmConfig.value.creatorsJson).map((c: any) => ({ address: c.address, share: c.share })),
      }
  };
  
  // 4. Upload metadata to IPFS
  const metadataUploadResult = await uploadJsonToIPFS(metadata);
  if (!metadataUploadResult.success) {
    throw new Error(`Failed to upload metadata: ${metadataUploadResult.error}`);
  }
  nftBaseMetadata.value.generatedJsonUri = metadataUploadResult.metadataUrl;
  isLoading.value = true;
  successMessage.value = '';
  errorMessage.value = '';
  createdCandyMachineId.value = '';
  createdCollectionId.value = '';
  transactionSignature.value = '';

  const u = umi.value; // UMI instance

  try {
    // 0. Prepare Creators from JSON input
    let parsedUmiCreators: { address: UmiPublicKey; verified: boolean; share: number }[] | null = null;
    try {
        parsedUmiCreators = JSON.parse(cmConfig.value.creatorsJson).map((c: any) => ({
            address: umiPublicKeyUtil(c.address), // Convert base58 string to UMI PublicKey
            verified: c.verified !== undefined ? c.verified : false,
            share: c.share,
        }));
        if (!parsedUmiCreators || parsedUmiCreators.length === 0) {
            throw new Error("Creators array cannot be empty.");
        }
    } catch (e: any) {
        throw new Error(`Invalid JSON format or content for creators: ${e.message}`);
    }
    let collectionImageFinalUrl = collectionMetadataDetails.value.imageUrl;
    if (collectionMetadataDetails.value.imageFile) {
      const url = await uploadFileToIPFS(collectionMetadataDetails.value.imageFile);
      collectionImageFinalUrl = url.imageUrl
    }

    let parsedCollectionCreators: { address: string; share: number }[] = [];
    try {
      // Use the same creators from cmConfig for the collection metadata for simplicity
      parsedCollectionCreators = JSON.parse(cmConfig.value.creatorsJson).map((c: any) => ({
          address: c.address, // Keep as string for JSON
          share: c.share,
      }));
    } catch (e) {
        console.warn("Could not parse creators for collection metadata, skipping in JSON.");
    }
    const collectionJsonToUpload = {
      name: collectionConfig.value.name,
      symbol: collectionConfig.value.symbol || undefined, // Optional
      description: collectionMetadataDetails.value.description,
      image: collectionImageFinalUrl,
      seller_fee_basis_points: collectionConfig.value.sellerFeeBasisPoints,
      external_url: collectionMetadataDetails.value.external_url || undefined, // Optional
      properties: {
          files: [{ uri: collectionImageFinalUrl, type: collectionMetadataDetails.value.imageFile?.type || "image/png" }],
          category: "image",
          creators: parsedCollectionCreators.length > 0 ? parsedCollectionCreators : undefined,
      }
      // Add collection attributes here if you add fields for them
    };
    const collectionMetadata = await uploadJsonToIPFS(collectionJsonToUpload);
    collectionConfig.value.uri = collectionMetadata.metadataUrl;

    // 1. Create Collection NFT
    const collectionUpdateAuthority = generateSigner(umi)
    const collectionMint = generateSigner(umi)
    console.log("Creating collection NFT...");
    // console.log(u.identity,umi)
    const createCollectionBuilder = await createNft(umi, {
      mint: collectionMint,
      authority: umi.identity,
      name: collectionConfig.value.name,
      uri: collectionConfig.value.uri,
      sellerFeeBasisPoints: percentAmount(collectionConfig.value.sellerFeeBasisPoints / 100, 2), // 9.99%
      isCollection: true,
      collectionDetails: {
        __kind: 'V1',
        size: 0,
      }
    }).sendAndConfirm(umi)
    const candyMachineSettings = {
      collectionMint: collectionMint.publicKey,
      collectionUpdateAuthority,
      itemsAvailable: cmConfig.value.itemsAvailable,
    }
    // const createCollectionResult = await createCollectionBuilder.sendAndConfirm(u, { confirm: { commitment: 'processed' } });
    // createdCollectionId.value = collectionMintSigner.publicKey.toString(); // UMI PublicKey .toString() is base58
    // transactionSignature.value = base58.deserialize(createCollectionResult.signature)[0];
    // console.log('Collection NFT created:', createdCollectionId.value, "TX:", transactionSignature.value);
    successMessage.value = `Collection NFT created: ${createCollectionBuilder.result.value}. `;

    // 2. Prepare Candy Guard settings
    const candyGuardSigner: Signer = generateSigner(umi);
    const guardsToSet: any = {
        // Default Bot Tax: Good practice to include, even if 0.
        botTax: some({ lamports: sol(0.01), lastInstruction: true, destination: publicKey(umi.identity)  }), // Example: 0.01 SOL bot tax
    };
    if (guardConfig.value.solPayment.amount > 0) {
      const solPaymentDestinationString = guardConfig.value.solPayment.destination || u.identity.publicKey.toString();
      guardsToSet.solPayment = some({
        lamports: sol(guardConfig.value.solPayment.amount),
        destination: umiPublicKeyUtil(solPaymentDestinationString), // Convert base58 string to UMI PublicKey
      });
    }
    if (guardConfig.value.startDate) {
      try {
        guardsToSet.startDate = some({ date: dateTime(new Date(guardConfig.value.startDate).getTime() / 1000) });
      } catch (e) { console.warn("Invalid start date format, skipping.")}
    }
    if (guardConfig.value.endDate) {
      try {
        guardsToSet.endDate = some({ date: dateTime(new Date(guardConfig.value.endDate).getTime() / 1000) });
      } catch (e) { console.warn("Invalid end date format, skipping.")}
    }

    // 3. Create Candy Machine (and its Candy Guard)
    await new Promise(resolve => setTimeout(resolve, 10000)); // Add this to make sure the createNft was completed.
    console.log("Creating Candy Machine with guard...");
    // console.log(JSON.stringify(guardsToSet, null, 2));
    const candyMachine = generateSigner(umi)
    console.log({
     candyMachine,
      collectionMint: collectionMint.publicKey,
      collectionUpdateAuthority: umi.identity,
      tokenStandard: TokenStandard.NonFungible,
      sellerFeeBasisPoints: percentAmount(cmConfig.value.sellerFeeBasisPoints / 100, 2),
      itemsAvailable: cmConfig.value.itemsAvailable,
      isMutable: cmConfig.value.isMutable,
      symbol: cmConfig.value.symbol,
      maxEditionSupply: cmConfig.value.maxEditionSupply,
      creators: [
        {
          address: umi.identity.publicKey,
          verified: true,
          percentageShare: 100,
        },
      ],
      guards: guardsToSet,
      configLineSettings: some({
        prefixName: cmConfig.value.namePrefix.trim(), // This is the key for sequential names
        nameLength: 0, // With prefixName and isSequential, nameLength is often 0 as CM calculates. Max name is 32.
        prefixUri: '', // Full URI provided in config lines
        uriLength: nftBaseMetadata.value.generatedJsonUri?.length || 80,
        isSequential: true, // Enable sequential numbering
      }),
    })
    const createCandyMachine = await create(umi, {
      candyMachine,
      collectionMint: collectionMint.publicKey,
      collectionUpdateAuthority: umi.identity,
      tokenStandard: TokenStandard.NonFungible,
      sellerFeeBasisPoints: percentAmount(cmConfig.value.sellerFeeBasisPoints / 100, 2),
      itemsAvailable: cmConfig.value.itemsAvailable,
      isMutable: cmConfig.value.isMutable,
      symbol: cmConfig.value.symbol,
      maxEditionSupply: cmConfig.value.maxEditionSupply,
      creators: [
        {
          address: umi.identity.publicKey,
          verified: true,
          percentageShare: 100,
        },
      ],
      guards: guardsToSet,
      configLineSettings: some({
        prefixName: cmConfig.value.namePrefix.trim(), // This is the key for sequential names
        nameLength: 0, // With prefixName and isSequential, nameLength is often 0 as CM calculates. Max name is 32.
        prefixUri: '', // Full URI provided in config lines
        uriLength: nftBaseMetadata.value.generatedJsonUri?.length || 80,
        isSequential: true, // Enable sequential numbering
      }),
    }).then(tx => tx.sendAndConfirm(umi, { confirm: { commitment: 'processed' } }));
    // console.log(createCandyMachine,candyMachine)
    // console.log('Candy Machine created:', createdCandyMachineId.value, "TX:", transactionSignature.value);
    // successMessage.value += `Candy Machine created: ${createCandyMachine}. `;

    // 4. Insert Items into Candy Machine
    // console.log("Inserting items into Candy Machine...");
    await new Promise(resolve => setTimeout(resolve, 10000)); // Add this to make sure the createNft was completed.
     const configLines: ConfigLine[] = [];
    for (let i = 0; i < cmConfig.value.itemsAvailable; i++) {
        // When isSequential is true, the `name` in ConfigLine is often the `prefixName` itself,
        // or can sometimes be an empty string. CM appends the number.
        // Let's use the prefixName here for clarity, CM will add "+index".
        configLines.push({
            name: cmConfig.value.namePrefix.trim(), // This name will have sequence number appended by CM
            uri: nftBaseMetadata.value.generatedJsonUri!,
        });
    }

    const CHUNK_SIZE = 10;
    for (let i = 0; i < configLines.length; i += CHUNK_SIZE) {
        const chunk = configLines.slice(i, i + CHUNK_SIZE);
        const insertBuilder = addConfigLines(umi, {
            candyMachine: candyMachine.publicKey,
            authority: umi.identity,
            configLines: chunk,
            index: Number(i),
        }).add(
            setComputeUnitLimit(umi, { units: 200_000 + (300_000 * chunk.length) }) // Rough estimate
        );
        const insertResult = await insertBuilder.sendAndConfirm(umi, { confirm: { commitment: 'processed' } });
        transactionSignature.value = base58.deserialize(insertResult.signature)[0];
        console.log(`Inserted items ${i + 1}-${i + chunk.length}. TX: ${transactionSignature.value}`);
    }
    successMessage.value += `All ${items.value.length} items inserted successfully!`;
    console.log("All items inserted.");
     // --- 7. Call list_nft from tale_nft program ---
     console.log("Listing Collection NFT with Candy Machine on-chain via tale_nft program...");
    if (!taleNftProgram) { // Ensure taleNftProgram is initialized
        // Attempt to re-initialize if it wasn't set up earlier
        // This is a fallback, ideally it's initialized once wallet connects
        // @ts-ignore
        const provider = new AnchorProvider(umi.rpc.connection, wallet.value, AnchorProvider.defaultOptions());
        anchorProvider = provider; // Not strictly needed again if already set, but for completeness
        // taleNftProgram = new Program(YOUR_IDL_NAME as Idl, TALE_NFT_PROGRAM_ID, provider); // REPLACE YOUR_IDL_NAME
         if (!taleNftProgram) { // If still not initialized (e.g. IDL missing)
            throw new Error("Tale NFT Anchor program could not be initialized. Make sure YOUR_IDL_NAME is set.");
        }
    }
    
    const collectionMintPkForListing = new SolanaWeb3JsPublicKey(createdCollectionId.value); // From collectionMintSigner.publicKey
    const candyMachinePkForListing = new SolanaWeb3JsPublicKey(createdCandyMachineId.value); // From candyMachineSigner.publicKey

    // @ts-ignore
    const listNftTx = await taleNftProgram.methods
      .listNft(collectionMintPkForListing, candyMachinePkForListing)
      .accounts({
        // listedNftAccount: PDA will be derived by Anchor
        creatorWallet: wallet.publicKey.value, // Signer (SolanaWeb3JsPublicKey)
        systemProgram: SystemProgram.programId,
      })
      .rpc({ commitment: 'processed' });
    
    console.log(`list_nft transaction successful. Signature: ${listNftTx}`);
    successMessage.value += `Collection NFT listed with CM on-chain (TX: ${listNftTx}).`;

    // No longer emitting: emit('candyMachineCreated', createdCandyMachineId.value);
    console.log("Candy Machine creation and on-chain listing process complete.");
  } catch (e: any) {
    console.error("Creation failed:", e);
    let detailedMessage = e.message || 'An unknown error occurred during creation.';
    if (e.cause) { // UMI often wraps errors in e.cause
        detailedMessage += ` Cause: ${e.cause.message || e.cause}`;
    }
    if (e.logs && Array.isArray(e.logs)) {
      detailedMessage += ` Logs: ${e.logs.join('\n')}`;
    }
    errorMessage.value = detailedMessage;
  } finally {
    isLoading.value = false;
  }
}
</script>

<style scoped>
.cm-creator-embedded {
  padding: 1rem; /* p-4 */
  border: 1px solid #d1d5db; /* border-gray-300 */
  border-radius: 0.375rem; /* rounded-md */
  margin-top: 1rem; /* mt-4 */
  background-color: #f9fafb; /* Lighter background for embedded form */
}
.dark .cm-creator-embedded {
  border-color: #4b5568; /* dark:border-gray-600 */
  background-color: #374151; /* Slightly different dark bg */
}

.cm-creator-title {
  font-size: 1.125rem; /* text-lg */
  font-weight: 600; /* font-semibold */
  margin-bottom: 0.75rem; /* mb-3 */
  color: #374151; /* text-gray-700 */
}
.dark .cm-creator-title {
  color: #e5e7eb; /* dark:text-gray-200 */
}

.cm-wallet-button-container {
  margin-bottom: 1rem; /* mb-4 */
  display: flex;
  justify-content: center; /* Center the wallet button if shown */
}
.cm-info-box { /* For connected wallet display */
  margin-bottom: 1rem; /* mb-4 */
  padding: 0.5rem;
  font-size: 0.875rem;
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
  background-color: #e5e7eb;
  text-align: center;
}
.dark .cm-info-box {
  background-color: #4b5568;
  border-color: #6b7280;
  color: #f3f4f6;
}
.cm-wallet-address {
  font-family: monospace;
}

.cm-form {
  /* No specific form-wide styles, relies on fieldset and form-group */
}

.cm-fieldset {
  border: 1px solid #cbd5e1; /* border-gray-300/400 */
  border-radius: 0.375rem; /* rounded-md */
  padding: 0.75rem 1rem; /* p-3 p-4 */
  margin-bottom: 1rem; /* mb-4 */
}
.dark .cm-fieldset {
  border-color: #4a5568; /* dark:border-gray-600 */
}

.cm-legend {
  font-weight: 500; /* font-medium */
  color: #374151; /* text-gray-700 */
  padding: 0 0.25rem; /* px-1 */
  font-size: 0.875rem; /* text-sm */
}
.dark .cm-legend {
  color: #d1d5db; /* dark:text-gray-300 */
}

.cm-fieldset-description {
  font-size: 0.75rem; /* text-xs */
  color: #6b7280; /* text-gray-500 */
  margin-bottom: 0.5rem; /* mb-2 */
}
.dark .cm-fieldset-description {
  color: #9ca3af; /* dark:text-gray-400 */
}

.form-group {
  margin-bottom: 0.75rem; /* Consistent spacing for form elements */
}
.form-group:last-child {
  margin-bottom: 0;
}

.form-label { /* Was form-label-sm */
  display: block;
  font-size: 0.75rem; /* text-xs */
  font-weight: 500; /* font-medium */
  color: #4b5563; /* text-gray-600 */
  margin-bottom: 0.125rem; /* mb-0.5 */
}
.dark .form-label {
  color: #9ca3af; /* dark:text-gray-400 */
}

.form-input { /* Was form-input-sm */
  font-size: 0.875rem; /* text-sm */
  width: 100%;
  padding: 0.5rem 0.75rem; /* px-2 py-1 */
  border: 1px solid #d1d5db; /* border-gray-300 */
  border-radius: 0.375rem; /* rounded-md */
  box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05); /* shadow-sm */
  background-color: #ffffff;
  color: #111827;
}
.form-input:focus {
  outline: 2px solid transparent;
  outline-offset: 2px;
  border-color: #4f46e5; /* focus:border-indigo-500 */
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.5); /* focus:ring-indigo-500 */
}
.dark .form-input {
  border-color: #6b7280; /* dark:border-gray-500 */
  background-color: #374151; /* dark:bg-gray-700 */
  color: #f3f4f6; /* dark:text-gray-100 */
}

.form-text { /* Was form-text-sm */
  display: block;
  font-size: 0.75rem; /* text-xs */
  color: #6b7280; /* text-gray-500 */
  margin-top: 0.125rem; /* mt-0.5 */
}
.dark .form-text {
  color: #9ca3af; /* dark:text-gray-400 */
}

.generated-uri-info { /* Extends .alert .alert-info */
  font-size: 0.75rem; /* text-xs */
  padding: 0.5rem; /* p-2 */
  margin-top: 0.5rem; /* my-2 */
  margin-bottom: 0.5rem;
  display: block;
}

.cm-submit-button { /* Extends .btn .btn-success .btn-sm .w-full */
  width: 100%;
  margin-top: 1rem; /* mt-4 */
  padding: 0.375rem 0.75rem; /* btn-sm */
  font-size: 0.75rem; /* btn-sm */
}

.loading-indicator.cm-loading-indicator {
  font-size: 0.75rem; /* text-xs */
  margin-top: 0.5rem; /* mt-2 */
  text-align: center;
  color: #4f46e5;
}
.dark .loading-indicator.cm-loading-indicator {
    color: #a5b4fc;
}


.alert {
  padding: 0.5rem; /* p-2 */
  border-width: 1px;
  border-radius: 0.375rem; /* rounded-md */
  font-size: 0.75rem; /* text-xs */
  margin-top: 0.5rem; /* mt-2 */
}
.alert-success {
  background-color: #f0fdf4; /* bg-green-50 */
  border-color: #a7f3d0; /* border-green-200 */
  color: #047857; /* text-green-700 */
}
.dark .alert-success {
  background-color: rgba(22, 163, 74, 0.3); /* dark:bg-green-700/30 */
  border-color: #34d399; /* dark:border-green-600 */
  color: #a7f3d0; /* dark:text-green-200 */
}
.alert-danger {
  background-color: #fef2f2; /* bg-red-50 */
  border-color: #fecaca; /* border-red-200 */
  color: #b91c1c; /* text-red-700 */
}
.dark .alert-danger {
  background-color: rgba(185, 28, 28, 0.3); /* dark:bg-red-700/30 */
  border-color: #f87171; /* dark:border-red-600 */
  color: #fecaca; /* dark:text-red-200 */
}
.alert-info {
  background-color: #eff6ff; /* bg-blue-50 */
  border-color: #bfdbfe; /* border-blue-200 */
  color: #1d4ed8; /* text-blue-700 */
}
.dark .alert-info {
  background-color: rgba(30, 64, 175, 0.3); /* dark:bg-blue-700/30 */
  border-color: #60a5fa; /* dark:border-blue-600 */
  color: #93c5fd; /* dark:text-blue-200 */
}
.cm-id-display {
  font-family: monospace;
}

/* Reusable Button Styles (if not global) */
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
.btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}
.btn-success {
  background-color: #16a34a; /* bg-green-600 */
}
.btn-success:hover {
  background-color: #15803d; /* hover:bg-green-700 */
}
.dark .btn-success {
  background-color: #22c55e; /* dark:bg-green-500 */
}
.dark .btn-success:hover {
  background-color: #16a34a; /* dark:hover:bg-green-400 (using darker shade for hover) */
}
.dark .btn-success:disabled {
    background-color: #166534; /* dark:disabled:bg-green-700 */
}

</style>