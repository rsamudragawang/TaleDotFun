<template>
  <div class="bg-white rounded-lg shadow-md overflow-hidden">
    <div class="relative pb-2/3">
      <img
        v-if="nft.metadata.image"
        :src="nft.metadata.image"
        :alt="nft.metadata.name"
        class="absolute h-48 w-full object-cover"
        @error="handleImageError"
      />
      <div v-else class="absolute h-48 w-full bg-gray-200 flex items-center justify-center">
        <span class="text-gray-500">No Image</span>
      </div>
    </div>
    <div class="p-4">
      <h3 class="text-lg font-semibold text-gray-900 truncate">{{ nft.name || 'Unnamed NFT' }}</h3>
      <p class="mt-1 text-sm text-gray-500 line-clamp-2">{{ nft.description || 'No description' }}</p>
      <div class="mt-4 flex items-center justify-between">
        <router-link
          :to="{ name: 'NFTDetail', params: { mint: nft.mint } }"
          class="text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          View Details
        </router-link>
        <button
          v-if="showBuyButton"
          @click="$emit('buy', nft)"
          class="px-3 py-1 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Buy
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';

export default {
  name: 'NFTCard',
  props: {
    nft: {
      type: Object,
      required: true
    },
    showBuyButton: {
      type: Boolean,
      default: false
    }
  },
  setup() {
    const handleImageError = (event) => {
      event.target.src = '/placeholder-nft.png'; // Fallback image
    };

    return {
      handleImageError
    };
  },
  emits: ['buy']
};
</script>