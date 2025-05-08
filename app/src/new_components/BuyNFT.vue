<template>
  <div class="bg-white shadow rounded-lg p-6">
    <h2 class="text-lg font-medium text-gray-900">Buy NFT</h2>
    
    <div v-if="nft" class="mt-4">
      <div class="flex items-start">
        <img 
          :src="imageUrl" 
          :alt="nft.name" 
          class="h-24 w-24 object-cover rounded-md"
          @error="imageLoadError = true"
        />
        
        <div class="ml-4">
          <h3 class="text-md font-medium">{{ nft.name }}</h3>
          <p class="text-sm text-gray-500">{{ nft.description }}</p>
          <p class="mt-2 text-lg font-bold">{{ nft.price }} SOL</p>
        </div>
      </div>
      
      <div class="mt-4">
        <button 
          @click="buyNFT"
          class="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          :disabled="isProcessing"
        >
          {{ isProcessing ? 'Processing...' : 'Confirm Purchase' }}
        </button>
      </div>
    </div>
    
    <div v-else class="mt-4 text-center py-4">
      <p class="text-gray-600">No NFT selected for purchase</p>
    </div>
    
    <div v-if="error" class="mt-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
      {{ error }}
    </div>
    
    <div v-if="success" class="mt-4 p-2 bg-green-100 border border-green-400 text-green-700 rounded">
      Purchase successful! <a :href="explorerLink" target="_blank" class="underline">View on Solana Explorer</a>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue';
import { buyNFT as purchaseNFT } from '../new_services/metaplex';

export default {
  name: 'BuyNFT',
  props: {
    nft: {
      type: Object,
      default: null
    },
    walletPublicKey: {
      type: Object,
      default: null
    }
  },
  emits: ['purchase-completed'],
  setup(props, { emit }) {
    const isProcessing = ref(false);
    const error = ref('');
    const success = ref(false);
    const imageLoadError = ref(false);
    const transactionId = ref('');
    
    const imageUrl = computed(() => {
      if (imageLoadError.value || !props.nft?.image) {
        return '/api/placeholder/300/300'; // Fallback placeholder
      }
      
      let url = props.nft.image;
      
      // Handle IPFS URLs
      if (url.startsWith('ipfs://')) {
        // Convert IPFS URL to HTTP gateway URL
        const ipfsHash = url.replace('ipfs://', '');
        return `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
      }
      
      return url;
    });
    
    const explorerLink = computed(() => {
      if (!transactionId.value) return '';
      // Using devnet for testing
      return `https://explorer.solana.com/tx/${transactionId.value}?cluster=devnet`;
    });
    
    const buyNFT = async () => {
      if (!props.walletPublicKey) {
        error.value = 'Wallet not connected';
        return;
      }
      
      if (!props.nft) {
        error.value = 'No NFT selected';
        return;
      }
      
      isProcessing.value = true;
      error.value = '';
      success.value = false;
      
      try {
        const { txid } = await purchaseNFT(
          props.walletPublicKey, 
          props.nft.mint, 
          props.nft.price
        );
        
        transactionId.value = txid;
        success.value = true;
        emit('purchase-completed');
      } catch (err) {
        console.error('Error buying NFT:', err);
        error.value = err.message || 'Failed to buy NFT';
      } finally {
        isProcessing.value = false;
      }
    };
    
    return {
      isProcessing,
      error,
      success,
      imageUrl,
      explorerLink,
      buyNFT
    };
  }
};
</script>
