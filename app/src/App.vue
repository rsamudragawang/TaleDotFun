<!-- <template>
  <div class="min-h-screen bg-gray-100">
    <header class="bg-white shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex">
            <div class="flex-shrink-0 flex items-center">
              <h1 class="text-2xl font-bold text-indigo-600">Solana NFT Marketplace</h1>
            </div>
            <nav class="ml-6 flex space-x-8">
              <router-link
                to="/"
                class="inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                :class="$route.path === '/' ? 'border-indigo-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'"
              >
                Home
              </router-link>
              <router-link
                to="/create"
                class="inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                :class="$route.path === '/create' ? 'border-indigo-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'"
              >
                Create NFT
              </router-link>
              <router-link
                to="/marketplace"
                class="inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                :class="$route.path === '/marketplace' ? 'border-indigo-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'"
              >
                Marketplace
              </router-link>
            </nav>
          </div>
          <div class="flex items-center">
            <WalletConnect />
          </div>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <router-view />
    </main>
  </div>
</template>

<script>
import WalletConnect from './components/WalletConnect.vue';

export default {
  name: 'App',
  components: {
    WalletConnect,
  },
};
</script> -->


<!-- <template>
  <div class="min-h-screen bg-gray-100">
    <header class="bg-white shadow">
      <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <h1 class="text-3xl font-bold text-gray-900">Solana NFT Marketplace</h1>
      </div>
    </header>
    <main>
      <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <ConnectWallet @wallet-connected="handleWalletConnected" />
        
        <div v-if="connected" class="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          <CreateNFT :walletPublicKey="publicKey" />
          <div>
            <ListNFTs :walletPublicKey="publicKey" />
          </div>
        </div>
        
        <div v-else class="mt-8 text-center">
          <p class="text-lg text-gray-600">Connect your wallet to view and create NFTs</p>
        </div>
      </div>
    </main>
  </div>
</template>

<script>
import ConnectWallet from './new_components/ConnectWallet.vue';
import CreateNFT from './new_components/CreateNFT.vue';
import ListNFTs from './new_components/ListNFTs.vue';

export default {
  name: 'App',
  components: {
    ConnectWallet,
    CreateNFT,
    ListNFTs
  },
  data() {
    return {
      connected: false,
      publicKey: null
    };
  },
  methods: {
    handleWalletConnected(walletData) {
      this.connected = walletData.connected;
      this.publicKey = walletData.publicKey;
    }
  }
};
</script> -->

<template>
  <div class="min-h-screen bg-gray-100 dark:bg-gray-900">
    <header class="bg-white dark:bg-gray-800 shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex">
            <div class="flex-shrink-0 flex items-center">
              <router-link :to="{ name: 'Home' }">
                 <h1 class="text-2xl font-bold text-indigo-600 dark:text-indigo-400">Readium Fun</h1>
              </router-link>
            </div>
            <nav class="ml-6 flex space-x-8 items-center">
              <router-link
                :to="{ name: 'Home' }"
                class="nav-link"
                active-class="nav-link-active"
              >
                Home
              </router-link>
              <router-link
                :to="{ name: 'Tales' }"
                class="nav-link"
                active-class="nav-link-active"
              >
                Tales
              </router-link>
              <router-link
                :to="{ name: 'CreateCandyMachine' }"
                class="nav-link"
                active-class="nav-link-active"
              >
                Create CM
              </router-link>
              <router-link
                :to="{ name: 'MintGeneral' }"
                class="nav-link"
                active-class="nav-link-active"
              >
                Mint NFT
              </router-link>
              </nav>
          </div>
          <div class="flex items-center">
            <WalletMultiButton />
          </div>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <router-view /> </main>

    <footer class="bg-gray-200 dark:bg-gray-900 text-center p-4 mt-auto">
      <p class="text-sm text-gray-600 dark:text-gray-400">&copy; {{ new Date().getFullYear() }} Readium Fun. All rights reserved.</p>
    </footer>
  </div>
</template>

<script setup>
import { WalletMultiButton } from 'solana-wallets-vue';
// You can import useWallet here if needed for app-level wallet state logic
// import { useWallet } from 'solana-wallets-vue';
// const wallet = useWallet();
</script>

<style scoped>
/* Basic styling for nav links, you can adjust as needed */
.nav-link {
  @apply inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-700 hover:text-gray-700 dark:hover:text-gray-200;
}
.nav-link-active {
  @apply border-indigo-500 dark:border-indigo-400 text-gray-900 dark:text-white;
}
/* Ensure body takes full height for footer to be at bottom if content is short */
html, body, #app, .min-h-screen {
  min-height: 100vh;
}
div.min-h-screen { /* If App.vue is the direct child of #app */
  display: flex;
  flex-direction: column;
}
main {
  flex-grow: 1;
}
</style>