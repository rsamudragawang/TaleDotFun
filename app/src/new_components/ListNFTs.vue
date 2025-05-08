<template>
  <div class="bg-white shadow rounded-lg p-6">
    <h2 class="text-lg font-medium text-gray-900">Available NFTs</h2>
    
    <div class="mt-4 flex justify-between items-center">
      <button 
        @click="fetchNFTs" 
        class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
        :disabled="isLoading"
      >
        {{ isLoading ? 'Loading...' : 'Refresh NFTs' }}
      </button>
      
      <div class="flex items-center">
        <label for="filter" class="mr-2 text-sm text-gray-700">Filter:</label>
        <select 
          id="filter" 
          v-model="filter" 
          class="border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        >
          <option value="all">All NFTs</option>
          <option value="owned">My NFTs</option>
          <option value="forsale">For Sale</option>
        </select>
      </div>
    </div>
    
    <div v-if="isLoading" class="mt-4 text-center py-8">
      <div class="spinner border-t-4 border-indigo-500 rounded-full w-12 h-12 mx-auto animate-spin"></div>
      <p class="mt-2 text-gray-600">Loading NFTs...</p>
    </div>
    
    <div v-else-if="nfts.length === 0" class="mt-4 text-center py-8">
      <p class="text-gray-600">No NFTs found</p>
    </div>
    
    <div v-else class="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
      <NFTCard 
        v-for="nft in filteredNFTs" 
        :key="nft.mint" 
        :nft="nft" 
        :is-owner="isOwner(nft)" 
        :wallet-public-key="walletPublicKey"
        @nft-purchased="fetchNFTs"
      />
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue';
import { getNFTs } from '../new_services/metaplex';
import NFTCard from './NFTCard.vue';

export default {
  name: 'ListNFTs',
  components: {
    NFTCard
  },
  props: {
    walletPublicKey: {
      type: Object,
      default: null
    }
  },
  setup(props) {
    const nfts = ref([]);
    const isLoading = ref(true);
    const filter = ref('all');
    
    const filteredNFTs = computed(() => {
      if (filter.value === 'all') {
        return nfts.value;
      } else if (filter.value === 'owned') {
        return nfts.value.filter(nft => isOwner(nft));
      } else if (filter.value === 'forsale') {
        return nfts.value.filter(nft => nft.price && nft.price > 0);
      }
      return nfts.value;
    });
    
    const isOwner = (nft) => {
      if (!props.walletPublicKey || !nft.owner) return false;
      return nft.owner.toString() === props.walletPublicKey.toString();
    };
    
    const fetchNFTs = async () => {
      if (!props.walletPublicKey) return;
      
      isLoading.value = true;
      try {
        const fetchedNFTs = await getNFTs(props.walletPublicKey);
        nfts.value = fetchedNFTs;
      } catch (error) {
        console.error('Error fetching NFTs:', error);
      } finally {
        isLoading.value = false;
      }
    };
    
    onMounted(() => {
      if (props.walletPublicKey) {
        fetchNFTs();
      }
    });
    
    watch(() => props.walletPublicKey, (newValue) => {
      if (newValue) {
        fetchNFTs();
      } else {
        nfts.value = [];
      }
    });
    
    return {
      nfts,
      isLoading,
      filter,
      filteredNFTs,
      isOwner,
      fetchNFTs
    };
  }
};
</script>

<style scoped>
.spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top: 4px solid #4f46e5;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>