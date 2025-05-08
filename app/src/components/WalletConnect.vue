<template>
  <div>
    <button
      v-if="!walletInfo.connected"
      @click="connectWallet"
      class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
    >
      Connect Wallet
    </button>
    <div v-else class="flex items-center space-x-4">
      <span class="text-sm text-gray-700">{{ shortenAddress(walletInfo.publicKey) }}</span>
      <button
        @click="disconnectWalletHandler"
        class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
      >
        Disconnect
      </button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { initWallet, disconnectWallet, getWalletInfo } from '../services/walletService';

export default {
  name: 'WalletConnect',
  setup() {
    const walletInfo = ref({ connected: false, publicKey: '' });

    const connectWallet = async () => {
      try {
        const result = await initWallet();
        walletInfo.value = {
          connected: true,
          publicKey: result.publicKey
        };
      } catch (error) {
        console.error('Failed to connect wallet:', error);
        alert('Failed to connect to Phantom wallet. Make sure you have Phantom installed and try again.');
      }
    };

    const disconnectWalletHandler = async () => {
      try {
        await disconnectWallet();
        walletInfo.value = { connected: false, publicKey: '' };
      } catch (error) {
        console.error('Failed to disconnect wallet:', error);
      }
    };

    const shortenAddress = (address) => {
      if (!address) return '';
      return `${address.slice(0, 4)}...${address.slice(-4)}`;
    };

    onMounted(() => {
      // Check if wallet is already connected
      const info = getWalletInfo();
      if (info.connected) {
        walletInfo.value = info;
      }
    });

    return {
      walletInfo,
      connectWallet,
      disconnectWalletHandler,
      shortenAddress
    };
  }
};
</script>
