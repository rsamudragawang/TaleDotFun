<template>
  <div class="candy-machine-container">
    <h1>Solana NFT Candy Machine Mint</h1>
    
    <div v-if="!walletConnected" class="connect-section">
      <button @click="connectWallet" class="connect-button">Connect Wallet</button>
    </div>
    
    <div v-else class="mint-section">
      <div class="wallet-info">
        <p>Connected: {{ walletPublicKey }}</p>
        <button @click="disconnectWallet" class="disconnect-button">Disconnect</button>
      </div>
      
      <div v-if="candyMachine" class="candy-details"> <!-- Added v-if="candyMachine" to prevent rendering before loaded -->
        <h2>{{ candyMachineDetails.name }}</h2>
        <p>Price: {{ formatLamports(candyMachineDetails.price) }} SOL</p>
        <p>Items Remaining: {{ candyMachineDetails.itemsAvailable - candyMachineDetails.itemsMinted }}</p>
        <p>Total Items: {{ candyMachineDetails.itemsAvailable }}</p>
      </div>
      <div v-else class="candy-details">
        <p>Loading Candy Machine details...</p>
      </div>

      <div class="mint-controls">
        <button 
          @click="mintNFT" 
          :disabled="isMinting || !candyMachine" 
          class="mint-button"
        >
          {{ isMinting ? 'Minting...' : 'Mint NFT' }}
        </button>
      </div>

      <div v-if="mintResult" class="mint-result">
        <h3>Mint Successful!</h3>
        <p>Transaction: <a :href="'https://explorer.solana.com/tx/' + mintResult.signature + '?cluster=' + network" target="_blank">View on Explorer</a></p>
      </div>
      
      <div v-if="error" class="error-message">
        {{ error }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import {
  mplCandyMachine,
  fetchCandyMachine as fetchCandyMachineAccount, // Aliased to avoid conflict
  fetchCandyGuard as fetchCandyGuardAccount,     // Aliased to avoid conflict
  // mintV2 is now umi.candyMachines().mint()
  mintV2,
} from '@metaplex-foundation/mpl-candy-machine';
import { publicKey,
  generateSigner,transactionBuilder
 } from '@metaplex-foundation/umi';
import { fetchDigitalAsset } from '@metaplex-foundation/mpl-token-metadata';
import { 
  setComputeUnitLimit,
} from '@metaplex-foundation/mpl-toolbox'; 
// Import your wallet service
import { initWallet, disconnectWallet as disconnectWalletService, getWalletInfo } from '../services/walletService'; // Ensure this path is correct

// Configuration
const CANDY_MACHINE_ID = ref('F3LREwVCB97fq9wZCgh41fuDn9a3QpuUFPt3Qzsm3VvK'); // Replace with your actual Candy Machine address
const network = process.env.VUE_APP_SOLANA_NETWORK === 'mainnet' ? 'mainnet-beta' : 'devnet';

// Reactive state
const walletConnected = ref(false);
const walletPublicKey = ref('');
const umiInstance = ref(null);
const candyMachine = ref(null); // Stores the fetched CandyMachine account data
const candyGuard = ref(null);   // Stores the fetched CandyGuard account data
const collectionNft = ref(null); // To store fetched collection NFT data
const candyMachineDetails = ref({
  name: 'Loading...',
  price: 0,
  itemsAvailable: 0,
  itemsMinted: 0,
  goLiveDate: null,
  endDate: null,
});
const isMinting = ref(false);
const mintResult = ref(null);
const error = ref(null);

// Methods
const connectWallet = async () => {
  try {
    error.value = null;
    const walletData = await initWallet();
    
    if (!walletData || !walletData.umi || !walletData.publicKey) {
        throw new Error("Wallet initialization failed or did not return expected data.");
    }

    walletConnected.value = true;
    walletPublicKey.value = walletData.publicKey.toString();
    umiInstance.value = walletData.umi;
    
    // Add the Candy Machine plugin (important for umi.candyMachines().mint())
    umiInstance.value.use(mplCandyMachine());
    
    await loadCandyMachineData();
  } catch (err) {
    error.value = `Failed to connect wallet: ${err.message}`;
    console.error('Wallet connection error:', err);
    walletConnected.value = false;
  }
};

const disconnectWallet = async () => {
  try {
    await disconnectWalletService();
    walletConnected.value = false;
    walletPublicKey.value = '';
    umiInstance.value = null;
    candyMachine.value = null;
    candyGuard.value = null;
    candyMachineDetails.value = { name: 'Loading...', price: 0, itemsAvailable: 0, itemsMinted: 0, goLiveDate: null, endDate: null };
    mintResult.value = null;
  } catch (err) {
    error.value = `Failed to disconnect wallet: ${err.message}`;
    console.error('Wallet disconnection error:', err);
  }
};

const formatLamports = (lamports) => {
  if (typeof lamports !== 'number' || isNaN(lamports)) return 'N/A';
  return (lamports / 1_000_000_000).toFixed(2); // 1 SOL = 10^9 lamports
};

const formatTimestamp = (timestamp) => {
  if (!timestamp) return 'N/A';
  return new Date(Number(timestamp) * 1000).toLocaleString();
};

const loadCandyMachineData = async () => {
  if (!umiInstance.value) {
    error.value = "UMI instance not available. Cannot fetch Candy Machine data.";
    console.error(error.value);
    return;
  }
  if (!CANDY_MACHINE_ID.value) {
    error.value = "Candy Machine ID is not set.";
    console.error(error.value);
    return;
  }
  
  console.log("Attempting to fetch Candy Machine and Guard:", CANDY_MACHINE_ID.value);
  try {
    error.value = null;
    const cmPublicKey = publicKey(CANDY_MACHINE_ID.value);
    
    // 1. Fetch the Candy Machine state account
    const cmAccount = await fetchCandyMachineAccount(umiInstance.value, cmPublicKey);
    if (!cmAccount) {
        throw new Error(`Candy Machine account not found at address: ${cmPublicKey.toString()}`);
    }
    candyMachine.value = cmAccount;
    console.log("Fetched Candy Machine account:", cmAccount);

    // 2. Fetch the Candy Guard account (if its public key is on the candy machine)
    // if (!cmAccount.candyGuard) { // candyGuard is the PublicKey of the guard account
    //     throw new Error("Candy Guard address not found on the Candy Machine account.");
    // }
    const cgPublicKey = publicKey('8Xp2wrgfBqDCiaZ5BATV1Vfgd4Uc8mNvXQYpjBExJZaf');
    const cgAccount = await fetchCandyGuardAccount(umiInstance.value, cgPublicKey);
    if (!cgAccount) {
        throw new Error(`Candy Guard account not found at address: ${cmAccount.candyGuard.toString()}`);
    }
    candyGuard.value = cgAccount;
    console.log("Fetched Candy Guard account:", cgAccount);

    // Fetch Collection NFT details
    if (!cmAccount.collectionMint) throw new Error("Collection Mint address not found on CM account.");
    console.log("Fetching Collection NFT details for mint:", cmAccount.collectionMint.toString());
    const fetchedCollectionNft = await fetchDigitalAsset(umiInstance.value, cmAccount.collectionMint);
    if (!fetchedCollectionNft) throw new Error(`Collection NFT not found: ${cmAccount.collectionMint}`);
    collectionNft.value = fetchedCollectionNft;
    console.log("Fetched Collection NFT:", fetchedCollectionNft);

    // 3. Populate details for the UI
    let priceLamports = 0;
    let goLiveDate = null;
    let endDate = null;

    // Extract price from solPayment guard if it exists
    const solPaymentGuard = cgAccount.guards.solPayment;
    if (solPaymentGuard?.value) {
        priceLamports = Number(solPaymentGuard.value.lamports);
    } else {
        console.warn("No SOL payment guard found or lamports value missing. Price might be 0 or handled by other guards.");
    }

    // Extract goLiveDate (startDate) and endDate from guards if they exist
    const startDateGuard = cgAccount.guards.startDate;
    if (startDateGuard?.value) {
        goLiveDate = startDateGuard.value.date;
    }
    const endDateGuard = cgAccount.guards.endDate;
    if (endDateGuard?.value) {
        endDate = endDateGuard.value.date;
    }

    candyMachineDetails.value = {
      name: cmAccount.symbol || 'Unnamed Collection',
      price: priceLamports,
      itemsAvailable: Number(cmAccount.itemsAvailable),
      itemsMinted: Number(cmAccount.itemsRedeemed),
      goLiveDate: goLiveDate ? formatTimestamp(goLiveDate) : 'Not set',
      endDate: endDate ? formatTimestamp(endDate) : 'Not set',
    };
    console.log("Candy Machine details updated:", candyMachineDetails.value);

  } catch (err) {
    error.value = `Failed to load Candy Machine data: ${err.message}`;
    console.error('Error loading Candy Machine data:', err.stack || err);
    candyMachine.value = null; 
    candyGuard.value = null;
    candyMachineDetails.value = { name: 'Error loading', price: 0, itemsAvailable: 0, itemsMinted: 0, goLiveDate: null, endDate: null };
  }
};

const mintNFT = async () => {
  if (!umiInstance.value || !candyMachine.value || !candyGuard.value || !collectionNft.value) {
    error.value = "Required data not loaded (Wallet, CM, CG, or Collection NFT).";
    console.error(error.value);
    return;
  }
  
  console.log("Attempting to mint NFT via transactionBuilder...");
  try {
    isMinting.value = true;
    error.value = null;
    mintResult.value = null;

    const nftMintSigner = generateSigner(umiInstance.value);
    console.log("Generated NFT Mint Signer:", nftMintSigner.publicKey.toString());

    // Ensure collection update authority is a Signer if it's the umi.identity
    // If collectionNft.value.metadata.updateAuthority is a PublicKey and it's NOT the umi.identity,
    // then this mint can only succeed if that authority is a PDA or has signed.
    // For simplicity, if it's the connected wallet, we use umi.identity. Otherwise, it must be handled by the program.
    let collectionUpdateAuthoritySigner;
    if (collectionNft.value.metadata.updateAuthority.toString() === umiInstance.value.identity.publicKey.toString()) {
        collectionUpdateAuthoritySigner = umiInstance.value.identity;
    } else {
        // If the UA is not the connected wallet, it's typically a PDA (like the Candy Machine itself)
        // or another authority. For mintV2, it expects a PublicKey if not a signer.
        // The program logic handles if this non-signer UA is valid.
        collectionUpdateAuthoritySigner = collectionNft.value.metadata.updateAuthority;
        console.warn(
            `Collection Update Authority (${collectionUpdateAuthoritySigner.toString()}) is not the connected wallet. ` +
            `Ensure this authority is a PDA or the transaction is otherwise authorized.`
        );
    }

    // Prepare mintV2 arguments
    const mintV2Args = {
      candyMachine: candyMachine.value.publicKey,
      nftMint: nftMintSigner, // This is a Signer
      collectionMint: collectionNft.value.publicKey, // This is a PublicKey
      collectionUpdateAuthority: collectionUpdateAuthoritySigner, // This is a Signer or PublicKey
      // Make sure tokenStandard is correctly sourced. It's on the CandyMachine account.
      tokenStandard: candyMachine.value.tokenStandard, 
      // candyGuard is implicitly derived by mintV2 if it's the one on candyMachine.authorityEnder.
      // However, it's safer to provide it if your setup is complex or uses non-default guards.
      candyGuard: candyMachine.value.candyGuard, // PublicKey of the guard
      // group: null, // Specify if using guard groups, e.g. some('public')
      // mintArgs: some({ ... }), // For specific guard arguments like allowList, etc.
    };
    
    console.log("mintV2 arguments:", {
        ...mintV2Args,
        nftMint: mintV2Args.nftMint.publicKey.toString(), // log PK for signer
        // Log other PKs as strings for readability
        candyMachine: mintV2Args.candyMachine.toString(),
        collectionMint: mintV2Args.collectionMint.toString(),
        collectionUpdateAuthority: typeof mintV2Args.collectionUpdateAuthority === 'object' && 'publicKey' in mintV2Args.collectionUpdateAuthority
            ? mintV2Args.collectionUpdateAuthority.publicKey.toString()
            : mintV2Args.collectionUpdateAuthority.toString(),
        candyGuard: mintV2Args.candyGuard?.toString(),
    });


    const builder = transactionBuilder()
      .add(setComputeUnitLimit(umiInstance.value, { units: 800_000 }))
      .add(mintV2(umiInstance.value, mintV2Args));
    
    console.log("Sending mint transaction...");
    const result = await builder.sendAndConfirm(umiInstance.value, {
      confirm: { commitment: 'finalized' },
      // send: { skipPreflight: true } // uncomment for easier debugging of on-chain errors
    });
    
    console.log("Mint successful, tx signature:", result.signature.toString());
    mintResult.value = {
      signature: result.signature.toString()
    };
    
    await loadCandyMachineData(); // Refresh data
    
  } catch (err) {
    error.value = `Mint failed: ${err.message}`;
    console.error('Mint error (raw):', err);
    if (err.cause) console.error('Mint error cause:', err.cause);
    if (err.logs) {
        console.error("Transaction logs:", err.logs);
    }
    // More detailed error for UMI Transaction errors
    if (err.name === 'UmiError' && err.context?.transactionError) {
        console.error("Transaction Error Details:", err.context.transactionError);
    }
  } finally {
    isMinting.value = false;
  }
};

// Lifecycle hooks
onMounted(async () => {
  const walletInfo = getWalletInfo();
  
  if (walletInfo && walletInfo.connected && walletInfo.umi && walletInfo.publicKey) {
    walletConnected.value = true;
    walletPublicKey.value = walletInfo.publicKey.toString();
    umiInstance.value = walletInfo.umi;
    
    umiInstance.value.use(mplCandyMachine());
    
    await loadCandyMachineData();
  }
});
</script>

<style scoped>
.candy-machine-container {
  max-width: 600px;
  margin: 2rem auto;
  padding: 2rem;
  background: #f0f2f5; /* Lighter background */
  border-radius: 12px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08); /* Softer shadow */
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
}

h1 {
  color: #333; /* Darker text for better contrast */
  margin-bottom: 1.5rem;
  text-align: center;
  font-size: 24px;
  font-weight: 600;
}

h2 {
  color: #444;
  margin-top: 0;
  margin-bottom: 0.5rem;
  font-size: 20px;
}

.connect-section {
  display: flex;
  justify-content: center;
  margin: 2rem 0;
}

.connect-button, .mint-button, .disconnect-button {
  background-color: #007bff; /* Primary blue */
  color: white;
  border: none;
  padding: 10px 20px; /* Adjusted padding */
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease, transform 0.1s ease; /* Smoother transitions */
}

.connect-button:hover, .mint-button:hover, .disconnect-button:hover {
  background-color: #0056b3; /* Darker blue on hover */
}
.connect-button:active, .mint-button:active, .disconnect-button:active {
  transform: scale(0.98); /* Slight press effect */
}

.mint-button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.wallet-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #e9ecef; /* Lighter gray for info section */
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.wallet-info p {
  margin: 0;
  font-size: 14px;
  color: #555;
  word-break: break-all; /* For long public keys */
}

.disconnect-button {
  background-color: #dc3545; /* Red for disconnect */
  padding: 8px 15px;
}
.disconnect-button:hover {
  background-color: #c82333;
}

.candy-details {
  background: #fff;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.candy-details p {
  margin: 0.5rem 0;
  color: #555;
  font-size: 16px;
}

.mint-controls {
  text-align: center;
  margin-bottom: 1.5rem;
}

.mint-result {
  margin-top: 1.5rem;
  padding: 1rem;
  background: #d4edda; /* Success green */
  color: #155724;
  border: 1px solid #c3e6cb;
  border-radius: 8px;
  text-align: center;
}
.mint-result h3 {
  margin-top: 0;
  margin-bottom: 0.5rem;
}
.mint-result a {
  color: #0f5132; /* Darker green for links */
  text-decoration: none;
}
.mint-result a:hover {
  text-decoration: underline;
}

.error-message {
  margin-top: 1.5rem;
  padding: 1rem;
  background: #f8d7da; /* Error red */
  color: #721c24;
  border: 1px solid #f5c6cb;
  border-radius: 8px;
  text-align: center;
  word-break: break-word;
}
</style>