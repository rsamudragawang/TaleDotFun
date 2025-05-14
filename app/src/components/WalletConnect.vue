<template>
  <div class="wallet-connect-wrapper">
    <button
      v-if="!walletInfo.connected"
      @click="connectWallet"
      class="btn btn-connect"
    >
      Connect Wallet
    </button>
    <div v-else class="connected-state-display">
      <span class="connected-address-text">{{ shortenAddress(walletInfo.publicKey) }}</span>
      <button
        @click="disconnectWalletHandler"
        class="btn btn-disconnect"
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

<style scoped>
.wallet-connect-wrapper {
  /* This is the root div, can add alignment/positioning here if needed */
  display: inline-block; /* Or flex, depending on how it's used */
}

.btn {
  padding: 0.5rem 1rem; /* px-4 py-2 */
  color: #ffffff; /* text-white */
  border-radius: 0.375rem; /* rounded-md */
  font-weight: 500; /* font-medium (Tailwind default for buttons) */
  font-size: 0.875rem; /* text-sm (Tailwind default for buttons) */
  border: 1px solid transparent; /* For focus ring consistency */
  cursor: pointer;
  transition: background-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}
.btn:focus {
  outline: 2px solid transparent;
  outline-offset: 2px;
}
.btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-connect {
  background-color: #4f46e5; /* bg-indigo-600 */
}
.btn-connect:hover {
  background-color: #4338ca; /* hover:bg-indigo-700 */
}
.btn-connect:focus {
  box-shadow: 0 0 0 2px #ffffff, 0 0 0 4px #4f46e5; /* focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 */
}
/* Dark mode for connect button */
@media (prefers-color-scheme: dark) {
  .btn-connect {
    background-color: #6366f1; /* Example dark mode color */
  }
  .btn-connect:hover {
    background-color: #4f46e5; /* Example dark mode hover */
  }
}


.connected-state-display {
  display: flex;
  align-items: center;
  gap: 1rem; /* space-x-4 */
}

.connected-address-text {
  font-size: 0.875rem; /* text-sm */
  color: #374151; /* text-gray-700 */
  font-family: monospace; /* Good for addresses */
}
@media (prefers-color-scheme: dark) {
  .connected-address-text {
    color: #d1d5db; /* dark:text-gray-300 */
  }
}

.btn-disconnect {
  background-color: #dc2626; /* bg-red-600 */
}
.btn-disconnect:hover {
  background-color: #b91c1c; /* hover:bg-red-700 */
}
.btn-disconnect:focus {
  box-shadow: 0 0 0 2px #ffffff, 0 0 0 4px #dc2626; /* focus:ring-2 focus:ring-offset-2 focus:ring-red-500 */
}
/* Dark mode for disconnect button */
@media (prefers-color-scheme: dark) {
  .btn-disconnect {
    background-color: #ef4444; /* Example dark mode color */
  }
  .btn-disconnect:hover {
    background-color: #dc2626; /* Example dark mode hover */
  }
}
</style>