<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div v-if="loading" class="flex justify-center items-center py-12">
      <div class="spinner"></div>
    </div>
    
    <div v-else-if="error" class="text-center py-12">
      <p class="text-red-500">{{ error }}</p>
      <router-link to="/marketplace" class="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
        Back to Marketplace
      </router-link>
    </div>
    
    <div v-else-if="nft" class="bg-white shadow overflow-hidden sm:rounded-lg">
      <div class="px-4 py-5 sm:px-6 flex justify-between items-center">
        <div>
          <h3 class="text-lg leading-6 font-medium text-gray-900">
            {{ nft.metadata.name }}
          </h3>
          <p class="mt-1 max-w-2xl text-sm text-gray-500">
            NFT Details
          </p>
        </div>
        <button
          v-if="walletConnected"
          @click="handleBuy"
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Buy NFT
        </button>
      </div>
      
      <div class="border-t border-gray-200">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="p-4">
            <img 
              :src="nft.metadata.image" 
              :alt="nft.metadata.name" 
              class="w-full rounded-lg shadow-lg"
              @error="handleImageError" 
            />
          </div>
          
          <div class="p-4">
            <div class="border-t border-gray-200">
              <dl>
                <div class="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt class="text-sm font-medium text-gray-500">
                    Name
                  </dt>
                  <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {{ nft.metadata.name }}
                  </dd>
                </div>
                <div class="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt class="text-sm font-medium text-gray-500">
                    Description
                  </dt>
                  <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {{ nft.metadata.description }}
                  </dd>
                </div>
                <div class="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt class="text-sm font-medium text-gray-500">
                    Mint address
                  </dt>
                  <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {{ mint }}
                  </dd>
                </div>
                <div v-if="nft.metadata.attributes && nft.metadata.attributes.length > 0" class="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt class="text-sm font-medium text-gray-500">
                    Attributes
                  </dt>
                  <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    <ul class="border border-gray-200 rounded-md divide-y divide-gray-200">
                      <li v-for="(attr, index) in nft.metadata.attributes" :key="index" class="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                        <div class="w-0 flex-1 flex items-center">
                          <span class="flex-1 w-0 truncate">
                            {{ attr.trait_type }}
                          </span>
                        </div>
                        <div class="ml-4 flex-shrink-0">
                          <span class="font-medium">{{ attr.value }}</span>
                        </div>
                      </li>
                    </ul>
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { getAllNFTs } from '../services/solanaService';
import { getWalletInfo } from '../services/walletService';

export default {
  name: 'NFTDetail',
  setup() {
    const route = useRoute();
    const mint = ref(route.params.mint);
    const nft = ref(null);
    const loading = ref(true);
    const error = ref('');
    const walletConnected = ref(false);
    
    const fetchNFT = async () => {
      loading.value = true;
      error.value = '';
      
      try {
        // In a real app, you'd fetch a specific NFT by mint address
        // For this example, we'll fetch all and find the one with matching mint
        const result = await getAllNFTs();
        console.log(result)
        if (result.success) {
          const foundNFT = result.nfts.find(item => item.mint === mint.value);
          if (foundNFT) {
            nft.value = foundNFT;
          } else {
            error.value = 'NFT not found';
          }
        } else {
          error.value = result.error || 'Failed to fetch NFT';
        }
      } catch (err) {
        error.value = err.message || 'An unexpected error occurred';
      } finally {
        loading.value = false;
      }
    };
    
    const handleImageError = (event) => {
      event.target.src = '/placeholder-nft.png'; // Fallback image
    };
    
    const handleBuy = () => {
      if (!walletConnected.value) {
        alert('Please connect your wallet first');
        return;
      }
      
      // In a real application, this would trigger a purchase transaction
      alert(`Buying NFT: ${nft.value.metadata.name}`);
    };
    
    const checkWalletConnection = () => {
      const walletInfo = getWalletInfo();
      walletConnected.value = walletInfo.connected;
    };
    
    onMounted(() => {
      fetchNFT();
      checkWalletConnection();
      
      // Check wallet connection status periodically
      const interval = setInterval(checkWalletConnection, 1000);
      
      return () => {
        clearInterval(interval);
      };
    });
    
    return {
      mint,
      nft,
      loading,
      error,
      walletConnected,
      handleImageError,
      handleBuy
    };
  }
};
</script>

<style scoped>
.spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border-left-color: #5a67d8;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>