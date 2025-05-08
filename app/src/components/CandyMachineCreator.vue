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
        <legend>1. Collection NFT Details</legend>
        <div>
          <label for="collectionName">Collection Name:</label>
          <input type="text" id="collectionName" v-model="collectionConfig.name" required />
        </div>
        <div>
          <label for="collectionSymbol">Collection Symbol:</label>
          <input type="text" id="collectionSymbol" v-model="collectionConfig.symbol" required />
        </div>
        <div>
          <label for="collectionUri">Collection Metadata URI (Arweave/IPFS JSON):</label>
          <input type="url" id="collectionUri" v-model="collectionConfig.uri" required />
          <small>e.g., https://arweave.net/your-collection-metadata.json</small>
        </div>
        <div>
          <label for="collectionSellerFee">Collection Seller Fee Basis Points (e.g., 500 for 5%):</label>
          <input type="number" id="collectionSellerFee" v-model.number="collectionConfig.sellerFeeBasisPoints" min="0" max="10000" required />
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
        <legend>4. NFT Items (Name and URI)</legend>
        <div v-for="(item, index) in items" :key="index" class="item-entry">
          <input type="text" v-model="item.name" placeholder="NFT Name" required />
          <input type="url" v-model="item.uri" placeholder="NFT Metadata URI (Arweave/IPFS)" required />
          <button type="button" @click="removeItem(index)" class="remove-item-btn">-</button>
        </div>
        <button type="button" @click="addItem" class="add-item-btn">+</button>
        <small>Ensure number of items matches "Total Items Available". URIs should point to individual NFT JSON metadata.</small>
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
    insertItems,
    CandyMachine,
    CandyGuard,
    ConfigLine,
    TokenStandard as UmiTokenStandard, // This is UMI's enum/type
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
} from '@metaplex-foundation/umi';
import { setComputeUnitLimit, setComputeUnitPrice } from '@metaplex-foundation/mpl-toolbox';
import { base58 } from '@metaplex-foundation/umi/serializers';
import { createCollection } from '@metaplex-foundation/mpl-core'
import { initWallet } from '../services/walletService';

// Using @solana/web3.js's PublicKey for type annotation from useWallet if needed, but mostly dealing with UMI's PublicKey
import { PublicKey as SolanaWeb3JsPublicKey } from '@solana/web3.js';

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

// Use UMI's TokenStandard for the select options, but store its value
const UmiTokenStandardForSelect = TokenStandard; // Alias for template
const cmConfig = ref({
  itemsAvailable: 1,
  sellerFeeBasisPoints: 500,
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
  if (items.value.length !== cmConfig.value.itemsAvailable) {
    errorMessage.value = `Number of items (${items.value.length}) must match "Total Items Available" (${cmConfig.value.itemsAvailable}).`;
    return;
  }
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

    // 1. Create Collection NFT
    const collectionMintSigner: Signer = generateSigner(umi); // UMI Signer
    console.log("Creating collection NFT...");
    // console.log(u.identity,umi)
    const createCollectionBuilder = createCollection(umi, {
  collection: collectionMintSigner,
  name: 'My Collection',
  uri: 'https://example.com/my-collection.json',
}).sendAndConfirm(umi)
console.log(createCollectionBuilder)
    // const createCollectionResult = await createCollectionBuilder.sendAndConfirm(u, { confirm: { commitment: 'processed' } });
    // createdCollectionId.value = collectionMintSigner.publicKey.toString(); // UMI PublicKey .toString() is base58
    // transactionSignature.value = base58.deserialize(createCollectionResult.signature)[0];
    // console.log('Collection NFT created:', createdCollectionId.value, "TX:", transactionSignature.value);
    // successMessage.value = `Collection NFT created: ${createdCollectionId.value}. `;

    // 2. Prepare Candy Guard settings
    const candyGuardSigner: Signer = generateSigner(umi);
    const guardsToSet: any = {
        // Default Bot Tax: Good practice to include, even if 0.
        botTax: some({ lamports: sol(0.01), lastInstruction: true }), // Example: 0.01 SOL bot tax
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
    const candyMachineSigner: Signer = generateSigner(umi);
    console.log("Creating Candy Machine with guard...");

    const createCmBuilder = create(u, {
      candyMachine: candyMachineSigner,
      collectionMint: collectionMintSigner.publicKey, // UMI PublicKey
      collectionUpdateAuthority: u.identity, // UMI Signer
      tokenStandard: cmConfig.value.tokenStandard, // UMI's TokenStandard enum value
      sellerFeeBasisPoints: percentAmount(cmConfig.value.sellerFeeBasisPoints / 100, 2),
      itemsAvailable: BigInt(cmConfig.value.itemsAvailable),
      authority: u.identity, // UMI Signer
      isMutable: cmConfig.value.isMutable,
      symbol: cmConfig.value.symbol,
      maxEditionSupply: BigInt(cmConfig.value.maxEditionSupply),
      creators: some(parsedUmiCreators),
      candyGuard: candyGuardSigner,
      guards: guardsToSet,
    }).add(
        setComputeUnitLimit(u, { units: 800_000 })
    );
    const createCmResult = await createCmBuilder.sendAndConfirm(u, { confirm: { commitment: 'processed' } });
    createdCandyMachineId.value = candyMachineSigner.publicKey.toString();
    transactionSignature.value = base58.deserialize(createCmResult.signature)[0];
    console.log('Candy Machine created:', createdCandyMachineId.value, "TX:", transactionSignature.value);
    successMessage.value += `Candy Machine created: ${createdCandyMachineId.value}. `;

    // 4. Insert Items into Candy Machine
    console.log("Inserting items into Candy Machine...");
    const configLines: ConfigLine[] = items.value.map(item => ({
      name: item.name,
      uri: item.uri,
    }));

    const CHUNK_SIZE = 10;
    for (let i = 0; i < configLines.length; i += CHUNK_SIZE) {
        const chunk = configLines.slice(i, i + CHUNK_SIZE);
        const insertBuilder = insertItems(u, {
            candyMachine: candyMachineSigner.publicKey,
            authority: u.identity,
            items: chunk,
            candyGuard: candyGuardSigner.publicKey, // Specify the guard
            index: BigInt(i),
        }).add(
            setComputeUnitLimit(u, { units: 200_000 + (300_000 * chunk.length) }) // Rough estimate
        );
        const insertResult = await insertBuilder.sendAndConfirm(u, { confirm: { commitment: 'processed' } });
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