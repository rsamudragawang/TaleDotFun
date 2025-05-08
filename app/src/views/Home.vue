<template>
  <div>
    <div class="bg-indigo-700">
      <div class="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8">
        <div class="text-center">
          <h1 class="text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl">
            Solana NFT Marketplace
          </h1>
          <p class="mt-6 max-w-2xl mx-auto text-xl text-indigo-200">
            Create, collect, and trade unique NFTs on the Solana blockchain.
          </p>
          <div class="mt-10 flex justify-center space-x-6">
            <router-link
              to="/create"
              class="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-indigo-700 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Create NFT
            </router-link>
            <router-link
              to="/marketplace"
              class="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Browse Marketplace
            </router-link>
          </div>
        </div>
      </div>
    </div>

    <div class="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <h2 class="text-3xl font-extrabold text-gray-900 sm:text-4xl mb-8">
        Featured NFTs
      </h2>
      <NFTList :show-buy-button="true" @buy="handleBuy" />
    </div>

    <div class="bg-gray-50">
      <div class="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <h2 class="text-3xl font-extrabold text-gray-900 sm:text-4xl mb-8">
          How It Works
        </h2>
        <div class="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div class="bg-white p-6 rounded-lg shadow">
            <div class="h-12 w-12 bg-indigo-100 rounded-md flex items-center justify-center text-indigo-600 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h3 class="text-lg font-medium text-gray-900">Create</h3>
            <p class="mt-2 text-base text-gray-500">
              Upload your artwork, add a title and description, set attributes, and mint your NFT on the Solana blockchain.
            </p>
          </div>

          <div class="bg-white p-6 rounded-lg shadow">
            <div class="h-12 w-12 bg-indigo-100 rounded-md flex items-center justify-center text-indigo-600 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 class="text-lg font-medium text-gray-900">Collect</h3>
            <p class="mt-2 text-base text-gray-500">
              Browse through a wide variety of NFTs and add them to your collection with fast and low-cost transactions.
            </p>
          </div>

          <div class="bg-white p-6 rounded-lg shadow">
            <div class="h-12 w-12 bg-indigo-100 rounded-md flex items-center justify-center text-indigo-600 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <h3 class="text-lg font-medium text-gray-900">Trade</h3>
            <p class="mt-2 text-base text-gray-500">
              Sell your NFTs to other collectors or buy NFTs to grow your collection and invest in digital assets.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';
import NFTList from '../components/NFTList.vue';
import { getWalletInfo } from '../services/walletService';

export default {
  name: 'Home',
  components: {
    NFTList
  },
  setup() {
    const handleBuy = (nft) => {
      const walletInfo = getWalletInfo();
      if (!walletInfo.connected) {
        alert('Please connect your wallet first');
        return;
      }
      
      // In a real application, this would trigger a purchase transaction
      alert(`Buying NFT: ${nft.metadata.name}`);
    };
    
    return {
      handleBuy
    };
  }
};
</script>