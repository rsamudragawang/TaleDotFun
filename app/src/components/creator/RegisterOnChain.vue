<template>
    <div>
        <button @click="handleRegisterOnChain" :disabled="isConfirming || confirmed || !canRegister">
          {{ isConfirming ? 'Registering On Chain...' : (confirmed ? '✅ Registered On-Chain' : 'Register Design On Chain (Sign Tx)') }}
        </button>
        <p v-if="message" :class="{'error': isError}" class="status-message">{{ message }}</p>
    </div>
</template>

<script setup>
import { ref, computed, defineProps, defineEmits } from 'vue';
import { useWallet } from 'solana-wallets-vue';
import { umi } from '../../utils/umi';
import { fromWeb3JsPublicKey } from '@metaplex-foundation/umi-web3js-adapters';
import { bs58 } from '@metaplex-foundation/umi/serializers';
import apiService from '../../services/apiService';

// Import generated Umi client functions for your program
import {
    registerDesign,
    findDesignStatePda
} from '@/generated/numberedEditionMinter'; // Adjust path

// --- Props and Emits ---
const props = defineProps({
    designIntentData: { // Passed down from NewDesignView after step 1 succeeds
        type: Object,
        required: true,
    }
});
const emit = defineEmits(['registration-confirmed']); // Emit on successful on-chain + backend confirmation

// --- Wallet and State ---
const { connected, publicKey: creatorWallet } = useWallet();
const isConfirming = ref(false);
const confirmed = ref(false); // Track if this specific action succeeded
const message = ref('');
const isError = ref(false);

const canRegister = computed(() => {
    return connected.value &&
           creatorWallet.value &&
           props.designIntentData &&
           props.designIntentData.onChainCallParams;
});

// --- On-Chain Registration Logic ---
const handleRegisterOnChain = async () => {
  if (!canRegister.value) {
    message.value = 'Cannot register on chain: Wallet/Intent data missing.';
    isError.value = true;
    return;
  }
  if (!umi.identity.publicKey || umi.identity.publicKey.toString() !== creatorWallet.value.toBase58()) {
      message.value = "Umi signer not set or mismatch. Please reconnect wallet.";
      isError.value = true;
      return;
  }

  isConfirming.value = true;
  isError.value = false;
  message.value = 'Preparing on-chain registration... Please sign transaction.';
  confirmed.value = false;

  const params = props.designIntentData.onChainCallParams;

  try {
    // 1. Derive the DesignState PDA
    const designIdHashBytes = new Uint8Array(params.designIdHash); // Ensure it's Uint8Array
    const designStatePda = findDesignStatePda(umi, {
        creator: umi.identity.publicKey,
        designIdHash: designIdHashBytes,
    });
    console.log("Derived Design State PDA for registration:", designStatePda.toString());

    // 2. Build the transaction
    const txBuilder = registerDesign(umi, {
      designIdHash: designIdHashBytes,
      sharedMetadataUri: params.sharedMetadataUri,
      pricePerPurchaseLamports: BigInt(params.priceLamports),
      totalSlots: params.totalSlots,
      creator: umi.identity, // Signer
      designState: designStatePda, // PDA
    });

    // 3. Send and Confirm
    const { signature } = await txBuilder.sendAndConfirm(umi, { confirm: { commitment: 'confirmed' }});
    const sigString = bs58.encode(signature);
    message.value = `On-chain registration successful! Tx: ${sigString.substring(0,10)}... Confirming backend...`;
    confirmed.value = true; // Mark on-chain part done

    // 4. Confirm with backend API
    try {
        const backendResponse = await apiService.confirmDesignRegistered(props.designIntentData.designId, {
            onChainDesignStatePda: designStatePda.toString(),
            transactionSignature: sigString,
        });
        message.value = 'On-chain registration successful and backend confirmed!';
        // Emit success WITH the data needed for step 3 (minting)
        emit('registration-confirmed', {
            designId: props.designIntentData.designId,
            onChainDesignStatePda: designStatePda.toString(),
            designData: backendResponse.design // Pass the full updated design data if backend returns it
        });

    } catch (confirmErr) {
        console.error("Backend confirmation failed:", confirmErr);
        message.value = `On-chain registration successful, but backend update failed: ${confirmErr.message}. Please try refreshing later.`;
        isError.value = true; // Treat backend failure as an overall issue for UX
        confirmed.value = false; // Reset confirmed status if backend fails? Or handle differently.
    }

  } catch (err) {
    console.error(err);
    message.value = `On-chain registration failed: ${err.message}`;
    isError.value = true;
    confirmed.value = false;
  } finally {
    isConfirming.value = false;
  }
};

</script>

<style scoped>
.status-message { font-size: 0.9em; margin-top: 5px; }
.error { color: red; }
button:disabled { opacity: 0.6; cursor: not-allowed; }
</style>