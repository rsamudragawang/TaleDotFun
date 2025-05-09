<template>
  <div class="candy-machine-creator">
    <h2>Create Your Own Candy Machine</h2>
    <div class="wallet-button-container">
      <WalletMultiButton />
    </div>

    <div v-if="!wallet.connected.value" class="alert alert-warning">
      Please connect your wallet to continue.
    </div>

    <form @submit.prevent="handleCreateCandyMachine" v-if="wallet.connected.value">
      <!-- Collection Details -->
      <fieldset>
        <legend>1. Collection NFT Details & Metadata</legend>
        <div>
          <label for="collectionName">Collection Name (for on-chain NFT & JSON):</label>
          <input type="text" id="collectionName" v-model="collectionConfig.name" required />
        </div>
        <div>
          <label for="collectionSymbol">Collection Symbol (for on-chain NFT & JSON, optional in JSON):</label>
          <input type="text" id="collectionSymbol" v-model="collectionConfig.symbol" />
        </div>
        <div>
          <label for="collectionDescription">Collection Description (for JSON):</label>
          <textarea id="collectionDescription" v-model="collectionMetadataDetails.description" placeholder="Detailed description of your collection..."></textarea>
        </div>
        <div>
            <label for="collectionImageFile">Collection Image/Logo (for JSON, upload preferred):</label>
            <input type="file" id="collectionImageFile" @change="handleCollectionImageFileChange" accept="image/*" />
            <small v-if="collectionMetadataDetails.imagePreviewUrl">Preview: <img :src="collectionMetadataDetails.imagePreviewUrl" alt="collection preview" class="image-preview" /></small>
            <small v-if="collectionMetadataDetails.imageFile && !collectionMetadataDetails.imagePreviewUrl">File selected: {{ collectionMetadataDetails.imageFile.name }}</small>
        </div>
        <div>
            <label for="collectionImageUrl">Or Collection Image/Logo URL (if not uploading file):</label>
            <input type="url" id="collectionImageUrl" v-model="collectionMetadataDetails.imageUrl" placeholder="https://example.com/collection-logo.png" :disabled="!!collectionMetadataDetails.imageFile" />
            <small v-if="collectionMetadataDetails.imageUrl && !collectionMetadataDetails.imageFile">Using URL: {{ collectionMetadataDetails.imageUrl }}</small>
        </div>
        <div>
          <label for="collectionExternalUrl">Collection External URL (e.g., project website, for JSON):</label>
          <input type="url" id="collectionExternalUrl" v-model="collectionMetadataDetails.external_url" placeholder="https://mycollection.com" />
        </div>
        <div>
          <label for="collectionSellerFee">Collection Seller Fee Basis Points (for on-chain NFT & JSON, e.g., 500 for 5%):</label>
          <input type="number" id="collectionSellerFee" v-model.number="collectionConfig.sellerFeeBasisPoints" min="0" max="10000" required />
        </div>
        <div v-if="collectionConfig.uri">
            <label>Generated Collection Metadata URI:</label>
            <input type="text" :value="collectionConfig.uri" readonly disabled/>
            <small>This URI will be used for the on-chain Collection NFT. It was generated from the details above.</small>
        </div>
         <div v-else>
            <small class="alert alert-info" style="margin-top:10px;">
                The Collection Metadata URI will be automatically generated and populated here when you submit the form.
            </small>
        </div>
      </fieldset>

      <!-- Candy Machine Details -->
      <fieldset>
        <legend>2. Candy Machine Configuration</legend>
        <div>
          <label for="itemsAvailable">Total Items Available:</label>
          <input type="number" id="itemsAvailable" v-model.number="cmConfig.itemsAvailable" min="1" required />
        </div>
          <div>
          <label for="tokenStandard">Token Standard:</label>
          <select v-model="cmConfig.tokenStandard">
            <option :value="UmiTokenStandardForSelect.NonFungible">NonFungible (Original)</option>
            <option :value="UmiTokenStandardForSelect.ProgrammableNonFungible">ProgrammableNonFungible (pNFT)</option>
          </select>
        </div>
        <div>
          <label for="sellerFee">CM Seller Fee Basis Points (inherited by NFTs, e.g., 500 for 5%):</label>
          <input type="number" id="sellerFee" v-model.number="cmConfig.sellerFeeBasisPoints" min="0" max="10000" required />
        </div>
        <div>
          <label for="isMutable">Is Mutable (can settings be changed later?):</label>
          <input type="checkbox" id="isMutable" v-model="cmConfig.isMutable" />
        </div>
        <div>
          <label for="symbol">Symbol for minted NFTs (often same as collection):</label>
          <input type="text" id="symbol" v-model="cmConfig.symbol" />
          <small>If blank, will use empty string. Max 10 chars.</small>
        </div>
          <div>
          <label for="maxEditionSupply">Max Edition Supply (for pNFT masters, 0 for unique):</label>
          <input type="number" id="maxEditionSupply" v-model.number="cmConfig.maxEditionSupply" min="0" />
          <small>Usually 0 for 1/1 NFTs from CM. Used if CM mints master editions.</small>
        </div>
          <div>
            <label for="creators">Creators (JSON Array - Address must be Base58):</label>
            <textarea id="creators" v-model="cmConfig.creatorsJson" placeholder='[{"address": "YOUR_WALLET_ADDRESS_PLACEHOLDER", "share": 100}]'></textarea>
            <small>Example: [{"address": "...", "verified": false, "share": 100}]. 'verified' typically false initially.</small>
        </div>
      </fieldset>

      <!-- Candy Guard Details (Simplified) -->
      <fieldset>
        <legend>3. Candy Guard (Basic Setup)</legend>
        <div>
          <label for="solPaymentAmount">SOL Payment Amount (e.g., 0.1 for 0.1 SOL):</label>
          <input type="number" step="any" id="solPaymentAmount" v-model.number="guardConfig.solPayment.amount" min="0" />
        </div>
        <div>
          <label for="cmNamePrefix">NFT Name Prefix (for on-chain sequence, e.g., "My NFT #"):</label>
          <input type="text" id="cmNamePrefix" v-model="cmConfig.namePrefix" placeholder="e.g., Cool NFT #" required />
          <small>A sequential number will be auto-appended by the Candy Machine. Max {{ 32 - String(cmConfig.itemsAvailable).length -1 }} chars for prefix usually.</small>
        </div>
          <div>
          <label for="solPaymentDestination">SOL Payment Destination (Base58 Address):</label>
          <input type="text" id="solPaymentDestination" v-model="guardConfig.solPayment.destination" />
            <small>Defaults to your connected wallet if left blank.</small>
        </div>
        <div>
          <label for="startDate">Go Live Date (UTC):</label>
          <input type="datetime-local" id="startDate" v-model="guardConfig.startDate" />
        </div>
          <div>
          <label for="endDate">End Date (UTC, optional):</label>
          <input type="datetime-local" id="endDate" v-model="guardConfig.endDate" />
        </div>
      </fieldset>

      <!-- Items to Insert -->
     <fieldset>
        <legend>4. Shared NFT Metadata (used for all {{ cmConfig.itemsAvailable }} items)</legend>
        <div class="item-metadata-entry single-metadata-entry">
          <!-- Name Prefix input removed from here -->
          <div>
            <label for="itemDescription">Description (shared by all NFTs):</label>
            <textarea id="itemDescription" v-model="nftBaseMetadata.description" placeholder="Detailed description for all NFTs"></textarea>
          </div>
          <div>
            <label for="itemImageFile">Image File (shared by all NFTs, upload preferred):</label>
            <input type="file" id="itemImageFile" @change="handleImageFileChange" accept="image/*" />
            <small v-if="nftBaseMetadata.imagePreviewUrl">Preview: <img :src="nftBaseMetadata.imagePreviewUrl" alt="preview" class="image-preview" /></small>
            <small v-if="nftBaseMetadata.imageFile && !nftBaseMetadata.imagePreviewUrl">File selected: {{ nftBaseMetadata.imageFile.name }}</small>
          </div>
          <div>
            <label for="itemImageUrl">Or Image URL (if not uploading file, shared by all NFTs):</label>
            <input type="url" id="itemImageUrl" v-model="nftBaseMetadata.imageUrl" placeholder="https://example.com/image.png" :disabled="!!nftBaseMetadata.imageFile" />
            <small v-if="nftBaseMetadata.imageUrl && !nftBaseMetadata.imageFile">Using URL: {{ nftBaseMetadata.imageUrl }}</small>
          </div>

          <fieldset class="attributes-fieldset">
            <legend>Attributes (shared by all NFTs)</legend>
            <div v-for="(attr, attrIndex) in nftBaseMetadata.attributes" :key="attrIndex" class="attribute-entry">
              <input type="text" v-model="attr.trait_type" placeholder="Trait Type (e.g., Color)" />
              <input type="text" v-model="attr.value" placeholder="Value (e.g., Red)" />
              <button type="button" @click="removeAttribute(attrIndex)" class="remove-attribute-btn">-</button>
            </div>
            <button type="button" @click="addAttribute" class="add-attribute-btn">+ Add Attribute</button>
          </fieldset>
        </div>
      </fieldset>

      <button type="submit" :disabled="isLoading || !wallet.connected.value">
        {{ isLoading ? 'Creating...' : 'Create Candy Machine & Insert Items' }}
      </button>
    </form>

    <div v-if="isLoading" class="loading-indicator">
      Processing... please wait and do not close this window. Check your wallet for transaction approvals.
    </div>
    <div v-if="successMessage" class="alert alert-success">
      {{ successMessage }}
      <div v-if="createdCollectionId">Collection ID: {{ createdCollectionId }}</div>
      <div v-if="createdCandyMachineId">Candy Machine ID: {{ createdCandyMachineId }}</div>
      <div v-if="transactionSignature">Last TX: <a :href="`https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`" target="_blank">{{ transactionSignature }}</a></div>
    </div>
    <div v-if="errorMessage" class="alert alert-danger">
      Error: {{ errorMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
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

// Using @solana/web3.js's PublicKey for type annotation from useWallet if needed, but mostly dealing with UMI's PublicKey
import { PublicKey, PublicKey as SolanaWeb3JsPublicKey } from '@solana/web3.js';

const RPC_ENDPOINT = import.meta.env.VITE_RPC_ENDPOINT || 'https://api.devnet.solana.com';
const WALLET_PLACEHOLDER = "YOUR_WALLET_ADDRESS_PLACEHOLDER";

const wallet = useWallet(); // wallet.publicKey.value is a SolanaWeb3JsPublicKey | null

const isLoading = ref(false);
const successMessage = ref('');
const errorMessage = ref('');
const createdCandyMachineId = ref('');
const createdCollectionId = ref('');
const transactionSignature = ref('');

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

  let finalImageUrl = nftBaseMetadata.value.imageUrl;
  if (nftBaseMetadata.value.imageFile) {
      const url  = await uploadFileToIPFS(nftBaseMetadata.value.imageFile);
      finalImageUrl = url.imageUrl
  }
  if (!finalImageUrl) throw new Error(`Image missing for shared NFT metadata.`);
  
  // 3. Create metadata JSON

  const metadata = {
    name: cmConfig.value.namePrefix.trim(), // Name in JSON
    symbol: cmConfig.value.symbol,
    description: nftBaseMetadata.value.description,
    seller_fee_basis_points: cmConfig.value.sellerFeeBasisPoints,
    image: finalImageUrl,
    attributes: nftBaseMetadata.value.attributes,
    properties: {
        files: [{ uri: finalImageUrl, type: nftBaseMetadata.value.imageFile?.type || "image/png" }],
        category: "image",
        creators: JSON.parse(cmConfig.value.creatorsJson).map((c:any) => ({ address: c.address, share: c.share })),
    },
    collection: { name: collectionConfig.value.name, family: collectionConfig.value.symbol }
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
.candy-machine-creator {
  max-width: 800px;
  margin: 20px auto;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 8px;
  font-family: sans-serif;
}
.wallet-button-container {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 20px;
}
fieldset {
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 15px;
  margin-bottom: 20px;
}
legend {
  font-weight: bold;
  padding: 0 10px;
}
label {
  display: block;
  margin-top: 10px;
  margin-bottom: 5px;
  font-weight: 500;
}
input[type="text"],
input[type="url"],
input[type="number"],
input[type="datetime-local"],
select,
textarea {
  width: calc(100% - 22px);
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
}
textarea {
    min-height: 80px;
    font-family: monospace;
}
input[type="checkbox"] {
  margin-right: 5px;
}
small {
  display: block;
  font-size: 0.85em;
  color: #555;
  margin-top: 3px;
}
button[type="submit"] {
  background-color: #4CAF50;
  color: white;
  padding: 12px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1em;
  transition: background-color 0.3s;
}
button[type="submit"]:hover {
  background-color: #45a049;
}
button[type="submit"]:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}
.item-entry {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 10px;
}
.item-entry input {
  flex-grow: 1;
}
.remove-item-btn, .add-item-btn {
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
}
.remove-item-btn {
  background-color: #f44336;
  color: white;
  border: none;
}
.add-item-btn {
  background-color: #2196F3;
  color: white;
  border: none;
  margin-top: 10px;
}
.alert {
  padding: 15px;
  margin-bottom: 20px;
  border: 1px solid transparent;
  border-radius: 4px;
  word-break: break-word;
}
.alert-warning {
  color: #856404;
  background-color: #fff3cd;
  border-color: #ffeeba;
}
.alert-success {
  color: #155724;
  background-color: #d4edda;
  border-color: #c3e6cb;
}
.alert-danger {
  color: #721c24;
  background-color: #f8d7da;
  border-color: #f5c6cb;
}
.loading-indicator {
  text-align: center;
  padding: 20px;
  font-style: italic;
}
</style>