<template>
  <div>
    <div v-if="loading" class="flex justify-center items-center py-12">
      <div class="spinner"></div>
    </div>
    <div v-else-if="error" class="text-center py-12">
      <p class="text-red-500">{{ error }}</p>
    </div>
    <div v-else-if="nfts.length === 0" class="text-center py-12">
      <p class="text-gray-500">No NFTs found</p>
    </div>
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      <NFTCard 
        v-for="nft in nfts" 
        :key="nft.mint" 
        :nft="nft"
        :show-buy-button="showBuyButton" 
        @buy="buyNFT"
      />
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import NFTCard from './NFTCard.vue';
import { getAllNFTs } from '../services/solanaService';

export default {
  name: 'NFTList',
  components: {
    NFTCard
  },
  props: {
    showBuyButton: {
      type: Boolean,
      default: false
    }
  },
  setup(props, { emit }) {
    const nfts = ref([]);
    const loading = ref(true);
    const error = ref('');

    const fetchNFTs = async () => {
      loading.value = true;
      error.value = '';
      
      try {
        const result = await getAllNFTs();
        if (result.success) {
          nfts.value = result.nfts;
        } else {
          error.value = result.error || 'Failed to fetch NFTs';
        }
      } catch (err) {
        error.value = err.message || 'An unexpected error occurred';
      } finally {
        loading.value = false;
      }
    };

    const buyNFT = (nft) => {
      emit('buy', nft);
    };

    onMounted(() => {
      fetchNFTs();
    });

    return {
      nfts,
      loading,
      error,
      buyNFT
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