<template>
  <div class="bg-white border rounded-lg overflow-hidden shadow-md">
    <div class="relative pb-2/3">
      <img 
        :src="imageUrl" 
        :alt="nft.name" 
        class="absolute h-48 w-full object-cover object-center"
        @error="handleImageError"
      />
    </div>
    
    <div class="p-4">
      <h3 class="text-lg font-medium text-gray-900 truncate">{{ nft.name }}</h3>
      <p class="mt-1 text-sm text-gray-500 h-12 overflow-hidden">{{ nft.description }}</p>
      
      <div class="mt-2 flex items-center justify-between">
        <div class="text-sm font-medium text-gray-900">
          {{ nft.price ? `${nft.price} SOL` : 'Not for sale' }}
        </div>
        
        <div>
          <button 
            v-if="!isOwner && nft.price"
            @click="buyNFT"
            class="px-3 py-1 text-xs font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            :disabled="isPurchasing"
          >
            {{ isPurchasing ? 'Buying...' : 'Buy' }}
          </button>
          
          <button 
            v-if="isOwner"
            @click="listForSale = !listForSale"
            class="px-3 py-1 text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
          >
            {{ listForSale ? 'Cancel' : 'List for Sale' }}
          </button>
        </div>
      </div>
      
      <div v-if="isOwner && listForSale" class="mt-2">
        <div class="flex items-center">
          <input 
            type="number" 
            v-model="listingPrice" 
            min="0" 
            step="0.01" 
            class="block w-full px-2 py-1 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" 
          />
          <button 
            @click="updateListing"
            class="ml-2 px-3 py-1 text-xs font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            :disabled="isUpdating"
          >
            {{ isUpdating ? 'Updating...' : 'Confirm' }}
          </button>
        </div>
      </div>
      
      <div v-if="error" class="mt-2 text-xs text-red-600">
        {{ error }}
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue';
import { buyNFT as purchaseNFT, updateNFTListing } from '../new_services/metaplex';

export default {
  name: 'NFTCard',
  props: {
    nft: {
      type: Object,
      required: true
    },
    isOwner: {
      type: Boolean,
      default: false
    },
    walletPublicKey: {
      type: Object,
      default: null
    }
  },
  emits: ['nft-purchased'],
  setup(props, { emit }) {
    const isPurchasing = ref(false);
    const isUpdating = ref(false);
    const error = ref('');
    const listForSale = ref(false);
    const listingPrice = ref(props.nft.price || 0);
    const imageLoadError = ref(false);
    
    const imageUrl = computed(() => {
      if (imageLoadError.value) {
        return '/api/placeholder/300/300'; // Fallback placeholder
      }
      
      let url = props.nft.image || '';
      
      // Handle IPFS URLs
      if (url.startsWith('ipfs://')) {
        // Convert IPFS URL to HTTP gateway URL
        const ipfsHash = url.replace('ipfs://', '');
        return `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
      }
      
      return url;
    });
    
    const handleImageError = () => {
      imageLoadError.value = true;
    };
    
    const buyNFT = async () => {
      if (!props.walletPublicKey) {
        error.value = 'Wallet not connected';
        return;
      }
      
      isPurchasing.value = true;
      error.value = '';
      
      try {
        await purchaseNFT(props.walletPublicKey, props.nft.mint, props.nft.price);
        emit('nft-purchased');
      } catch (err) {
        console.error('Error buying NFT:', err);
        error.value = err.message || 'Failed to buy NFT';
      } finally {
        isPurchasing.value = false;
      }
    };
    
    const updateListing = async () => {
      if (!props.walletPublicKey) {
        error.value = 'Wallet not connected';
        return;
      }
      
      isUpdating.value = true;
      error.value = '';
      
      try {
        await updateNFTListing(props.walletPublicKey, props.nft.mint, listingPrice.value);
        listForSale.value = false;
        emit('nft-purchased'); // Trigger refresh
      } catch (err) {
        console.error('Error updating NFT listing:', err);
        error.value = err.message || 'Failed to update listing';
      } finally {
        isUpdating.value = false;
      }
    };
    
    return {
      isPurchasing,
      isUpdating,
      error,
      listForSale,
      listingPrice,
      imageUrl,
      handleImageError,
      buyNFT,
      updateListing
    };
  }
};
</script>