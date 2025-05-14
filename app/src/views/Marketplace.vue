<template>
  <div>
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 class="text-3xl font-extrabold text-gray-900 mb-8">
        NFT Marketplace
      </h1>
      
      <div v-if="!walletConnected" class="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm text-yellow-700">
              Connect your wallet to buy NFTs.
            </p>
          </div>
        </div>
      </div>
      
      <div class="bg-white shadow overflow-hidden sm:rounded-md mb-8">
        <div class="px-4 py-5 border-b border-gray-200 sm:px-6">
          <h3 class="text-lg leading-6 font-medium text-gray-900">
            Available NFTs
          </h3>
          <p class="mt-1 max-w-2xl text-sm text-gray-500">
            Browse and collect unique digital assets on the Solana blockchain.
          </p>
        </div>
        <div class="px-4 py-5 sm:px-6">
          <NFTList :show-buy-button="true" @buy="handleBuy" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import NFTList from '../components/NFTList.vue';
import { getWalletInfo } from '../services/walletService';

export default {
  name: 'Marketplace',
  components: {
    NFTList
  },
  setup() {
    const walletConnected = ref(false);
    
    const checkWalletConnection = () => {
      const walletInfo = getWalletInfo();
      walletConnected.value = walletInfo.connected;
    };
    
    const handleBuy = (nft) => {
      if (!walletConnected.value) {
        alert('Please connect your wallet first');
        return;
      }
      
      // In a real application, this would trigger a purchase transaction
      alert(`Buying NFT: ${nft.metadata.name}`);
    };
    
    onMounted(() => {
      checkWalletConnection();
      
      // Check wallet connection status periodically
      const interval = setInterval(checkWalletConnection, 1000);
      
      return () => {
        clearInterval(interval);
      };
    });
    
    return {
      walletConnected,
      handleBuy
    };
  }
};
</script>