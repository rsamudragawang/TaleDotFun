<template>
  <div class="bg-white shadow rounded-lg p-6">
    <h2 class="text-lg font-medium text-gray-900">Wallet Connection</h2>
    <div class="mt-4 flex items-center justify-between">
      <div>
        <p v-if="!connected" class="text-gray-600">Not connected</p>
        <p v-else class="text-green-600">Connected: {{ shortAddress }}</p>
      </div>
      <button
        @click="toggleWalletConnection"
        class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white"
        :class="connected ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'"
      >
        {{ connected ? 'Disconnect' : 'Connect Phantom Wallet' }}
      </button>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { initWallet, connectWallet, disconnectWallet } from '../new_services/wallet';

export default {
  name: 'ConnectWallet',
  emits: ['wallet-connected'],
  setup(props, { emit }) {
    const connected = ref(false);
    const publicKey = ref(null);
    
    const shortAddress = computed(() => {
      if (!publicKey.value) return '';
      const address = publicKey.value.toString();
      return `${address.slice(0, 4)}...${address.slice(-4)}`;
    });

    onMounted(async () => {
      await initWallet();
      
      // Check if wallet is already connected
      if (window.solana && window.solana.isPhantom && window.solana.isConnected) {
        const walletPublicKey = window.solana.publicKey;
        if (walletPublicKey) {
          connected.value = true;
          publicKey.value = walletPublicKey;
          emit('wallet-connected', {
            connected: true,
            publicKey: walletPublicKey
          });
        }
      }
      
      // Listen for wallet connection/disconnection events
      if (window.solana) {
        window.solana.on('connect', (publicKeyObj) => {
          connected.value = true;
          publicKey.value = publicKeyObj;
          emit('wallet-connected', {
            connected: true,
            publicKey: publicKey.value
          });
        });
        
        window.solana.on('disconnect', () => {
          connected.value = false;
          publicKey.value = null;
          emit('wallet-connected', {
            connected: false,
            publicKey: null
          });
        });
      }
    });

    const toggleWalletConnection = async () => {
      if (connected.value) {
        await disconnectWallet();
        connected.value = false;
        publicKey.value = null;
        emit('wallet-connected', {
          connected: false,
          publicKey: null
        });
      } else {
        try {
          const walletPublicKey = await connectWallet();
          connected.value = true;
          publicKey.value = walletPublicKey;
          emit('wallet-connected', {
            connected: true,
            publicKey: walletPublicKey
          });
        } catch (error) {
          console.error('Failed to connect wallet:', error);
        }
      }
    };

    return {
      connected,
      publicKey,
      shortAddress,
      toggleWalletConnection
    };
  }
};
</script>