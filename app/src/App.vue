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
  <div class="app-container">
    <header class="app-header">
      <div class="header-content">
        <div class="header-left">
          <router-link :to="{ name: 'Home' }" class="logo-link">
            <h1 class="logo-text">Readium Fun</h1>
          </router-link>
          <nav class="main-navigation">
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
        <div class="header-right">
          <WalletMultiButton />
          <div class="mobile-menu-button-container">
            <button @click="mobileMenuOpen = !mobileMenuOpen" type="button" class="mobile-menu-button">
              <span class="sr-only">Open main menu</span>
              <svg v-if="!mobileMenuOpen" class="menu-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
              <svg v-else class="menu-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
      </div>
      <div v-if="mobileMenuOpen" class="mobile-menu" id="mobile-menu">
        <div class="mobile-menu-content">
          <router-link :to="{ name: 'Home' }" class="mobile-nav-link" active-class="mobile-nav-link-active" @click="mobileMenuOpen = false">Home</router-link>
          <router-link :to="{ name: 'Tales' }" class="mobile-nav-link" active-class="mobile-nav-link-active" @click="mobileMenuOpen = false">Tales</router-link>
          <router-link :to="{ name: 'CreateCandyMachine' }" class="mobile-nav-link" active-class="mobile-nav-link-active" @click="mobileMenuOpen = false">Create CM</router-link>
          <router-link :to="{ name: 'MintGeneral' }" class="mobile-nav-link" active-class="mobile-nav-link-active" @click="mobileMenuOpen = false">Mint NFT</router-link>
        </div>
      </div>
    </header>

    <main class="main-content">
      <router-view /> </main>

    <footer class="app-footer">
      <p>&copy; {{ new Date().getFullYear() }} Readium Fun. All rights reserved.</p>
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
/* General App Container */
.app-container {
  min-height: 100vh;
  background-color: #f3f4f6; /* bg-gray-100 */
  display: flex;
  flex-direction: column;
  color: #1f2937; /* Default text color */
}
.dark .app-container {
  background-color: #111827; /* dark:bg-gray-900 */
  color: #f3f4f6; /* Default dark text color */
}

/* Header Styles */
.app-header {
  background-color: #ffffff; /* bg-white */
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06); /* shadow-md */
  position: sticky;
  top: 0;
  z-index: 50;
}
.dark .app-header {
  background-color: #1f2937; /* dark:bg-gray-800 */
}
.header-content {
  max-width: 1280px; /* max-w-7xl */
  margin-left: auto;
  margin-right: auto;
  padding-left: 1rem; /* px-4 */
  padding-right: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 4rem; /* h-16 */
}
@media (min-width: 640px) { /* sm: */
  .header-content {
    padding-left: 1.5rem; /* sm:px-6 */
    padding-right: 1.5rem;
  }
}
@media (min-width: 1024px) { /* lg: */
  .header-content {
    padding-left: 2rem; /* lg:px-8 */
    padding-right: 2rem;
  }
}

.header-left {
  display: flex;
  align-items: center;
}
.logo-link {
  flex-shrink: 0;
  text-decoration: none;
}
.logo-link:hover {
  opacity: 0.8;
  transition: opacity 0.15s ease-in-out;
}
.logo-text {
  font-size: 1.5rem; /* text-2xl */
  font-weight: 700; /* font-bold */
  color: #4f46e5; /* text-indigo-600 */
}
.dark .logo-text {
  color: #818cf8; /* dark:text-indigo-400 */
}

.main-navigation {
  display: none; /* hidden */
}
@media (min-width: 768px) { /* md: */
  .main-navigation {
    margin-left: 1.5rem; /* md:ml-6 */
    display: flex; /* md:flex */
    column-gap: 2rem; /* md:space-x-8 */
    align-items: center; /* md:items-center */
  }
}

.nav-link {
  display: inline-flex;
  align-items: center;
  padding-top: 0.25rem; /* pt-1 */
  border-bottom-width: 2px;
  border-color: transparent;
  font-size: 0.875rem; /* text-sm */
  line-height: 1.25rem;
  font-weight: 500; /* font-medium */
  color: #6b7280; /* text-gray-500 */
  text-decoration: none;
  transition: color 0.15s ease-in-out, border-color 0.15s ease-in-out;
}
.dark .nav-link {
  color: #9ca3af; /* dark:text-gray-400 */
}
.nav-link:hover {
  border-color: #d1d5db; /* hover:border-gray-300 */
  color: #374151; /* hover:text-gray-700 */
}
.dark .nav-link:hover {
  border-color: #4b5568; /* dark:hover:border-gray-600 */
  color: #e5e7eb; /* dark:hover:text-gray-200 */
}
.nav-link-active {
  border-color: #6366f1; /* border-indigo-500 */
  color: #111827; /* text-gray-900 */
}
.dark .nav-link-active {
  border-color: #818cf8; /* dark:border-indigo-400 */
  color: #ffffff; /* dark:text-white */
}

.header-right {
  display: flex;
  align-items: center;
}

/* Mobile Menu Styles */
.mobile-menu-button-container {
  margin-left: 0.75rem; /* ml-3 */
}
@media (min-width: 768px) { /* md: */
  .mobile-menu-button-container {
    display: none; /* md:hidden */
  }
}
.mobile-menu-button {
  padding: 0.5rem; /* p-2 */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.375rem; /* rounded-md */
  color: #9ca3af; /* text-gray-400 */
  background-color: transparent;
  border: none;
}
.dark .mobile-menu-button {
  color: #6b7280; /* dark:text-gray-500 */
}
.mobile-menu-button:hover {
  color: #6b7280; /* hover:text-gray-500 */
  background-color: #f3f4f6; /* hover:bg-gray-100 */
}
.dark .mobile-menu-button:hover {
  color: #d1d5db; /* dark:hover:text-gray-300 */
  background-color: #374151; /* dark:hover:bg-gray-700 */
}
.mobile-menu-button:focus {
  outline: 2px solid transparent;
  outline-offset: 2px;
  box-shadow: 0 0 0 2px #6366f1; /* focus:ring-2 focus:ring-inset focus:ring-indigo-500 */
}
.sr-only { /* Screen reader only utility */
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
.menu-icon {
  height: 1.5rem; /* h-6 */
  width: 1.5rem; /* w-6 */
  display: block;
}

.mobile-menu {
  /* No md:hidden here, controlled by v-if */
}
.mobile-menu-content {
  padding-left: 0.5rem; /* px-2 */
  padding-right: 0.5rem;
  padding-top: 0.5rem; /* pt-2 */
  padding-bottom: 0.75rem; /* pb-3 */
  column-gap: 0.25rem; /* space-y-1 (converted to column-gap for flex) */
}
@media (min-width: 640px) { /* sm: */
  .mobile-menu-content {
    padding-left: 0.75rem; /* sm:px-3 */
    padding-right: 0.75rem;
  }
}
.mobile-nav-link {
  display: block;
  padding: 0.5rem 0.75rem; /* px-3 py-2 */
  border-radius: 0.375rem; /* rounded-md */
  font-size: 1rem; /* text-base */
  line-height: 1.5rem;
  font-weight: 500; /* font-medium */
  color: #374151; /* text-gray-700 */
  text-decoration: none;
}
.dark .mobile-nav-link {
  color: #d1d5db; /* dark:text-gray-200 */
}
.mobile-nav-link:hover {
  color: #111827; /* hover:text-gray-900 */
  background-color: #f9fafb; /* hover:bg-gray-50 */
}
.dark .mobile-nav-link:hover {
  color: #ffffff; /* dark:hover:text-white */
  background-color: #374151; /* dark:hover:bg-gray-700 */
}
.mobile-nav-link-active {
  background-color: #e0e7ff; /* bg-indigo-50 */
  color: #4338ca; /* text-indigo-700 */
}
.dark .mobile-nav-link-active {
  background-color: rgba(79, 70, 229, 0.3); /* dark:bg-indigo-900/30 */
  color: #c7d2fe; /* dark:text-indigo-300 */
}


/* Main Content Area */
.main-content {
  flex-grow: 1;
  max-width: 1280px; /* max-w-7xl */
  width: 100%;
  margin-left: auto;
  margin-right: auto;
  padding-top: 1.5rem; /* py-6 */
  padding-bottom: 1.5rem;
}
@media (min-width: 640px) { /* sm: */
  .main-content {
    padding-left: 1.5rem; /* sm:px-6 */
    padding-right: 1.5rem;
  }
}
@media (min-width: 1024px) { /* lg: */
  .main-content {
    padding-left: 2rem; /* lg:px-8 */
    padding-right: 2rem;
  }
}

/* Footer Styles */
.app-footer {
  background-color: #e5e7eb; /* bg-gray-200 */
  text-align: center;
  padding: 1rem; /* p-4 */
  margin-top: auto; /* mt-auto */
}
.dark .app-footer {
  background-color: #030712; /* dark:bg-gray-950 */
}
.app-footer p {
  font-size: 0.875rem; /* text-sm */
  color: #4b5563; /* text-gray-600 */
}
.dark .app-footer p {
  color: #9ca3af; /* dark:text-gray-400 */
}

/* WalletMultiButton might need global styles if not imported with its own CSS */
/* Ensure you have `@import 'solana-wallets-vue/styles.css';` in your main.js or global style file */
</style>