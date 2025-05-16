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
  <div class="max-w-[1440px] mx-auto">
    <header class="app-header" :class="{ 'scrolled': isScrolled }">
      <div class="header-content">
        <div class="header-left text-white">
          <router-link :to="{ name: 'Home' }" class="logo-link">
            <img src="/public/icons/logo.svg" alt="Readium Fun" class="logo-image">
          </router-link>
          <nav class="main-navigation">
            <router-link :to="{ name: 'Home' }" class="nav-link" active-class="nav-link-active">
              Discovery
            </router-link>
            <router-link :to="{ name: 'Tales' }" class="nav-link" active-class="nav-link-active">
              Tales
            </router-link>
            <router-link :to="{ name: 'Governance' }" class="nav-link" active-class="nav-link-active">
              Governance
            </router-link>
            <router-link :to="{ name: 'MintGeneral' }" class="nav-link" active-class="nav-link-active">
              Mint NFT
            </router-link>
            <router-link :to="{ name: 'LaunchNFT' }" class="nav-link" active-class="nav-link-active">
              Launch NFT
            </router-link>
          </nav>
        </div>
        <div class="header-right">
          <router-link
            v-if="wallet.connected.value && wallet.publicKey.value"
            :to="{ name: 'Auth' }"
            class="profile-link btn btn-primary-nav flex items-center gap-2"
          >
            <span class="wallet-address">{{ shortenAddress(wallet.publicKey.value.toBase58()) }}</span>
          </router-link>
          <WalletMultiButton v-else />
          <div class="mobile-menu-button-container">
            <button @click="mobileMenuOpen = !mobileMenuOpen" type="button" class="mobile-menu-button">
              <span class="sr-only">Open main menu</span>
              <svg v-if="!mobileMenuOpen" class="menu-icon" xmlns="http://www.w3.org/2000/svg" fill="none"
                viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <svg v-else class="menu-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      <div v-if="mobileMenuOpen" class="mobile-menu" id="mobile-menu">
        <div class="mobile-menu-content">
          <router-link :to="{ name: 'Home' }" class="mobile-nav-link" active-class="mobile-nav-link-active"
            @click="mobileMenuOpen = false">Home</router-link>
          <router-link :to="{ name: 'Tales' }" class="mobile-nav-link" active-class="mobile-nav-link-active"
            @click="mobileMenuOpen = false">Tales</router-link>
          <router-link :to="{ name: 'CreateCandyMachine' }" class="mobile-nav-link"
            active-class="mobile-nav-link-active" @click="mobileMenuOpen = false">Create CM</router-link>
          <router-link :to="{ name: 'MintGeneral' }" class="mobile-nav-link" active-class="mobile-nav-link-active"
            @click="mobileMenuOpen = false">Mint NFT</router-link>
          <router-link :to="{ name: 'LaunchNFT' }" class="mobile-nav-link" active-class="mobile-nav-link-active"
            @click="mobileMenuOpen = false">Launch NFT</router-link>
        </div>
      </div>
    </header>

    <div class="p-8">
      <router-view />
    </div>

  </div>
</template>

<script setup>
import { WalletMultiButton } from 'solana-wallets-vue';
import { ref, onMounted, onUnmounted } from 'vue';
import { useWallet } from 'solana-wallets-vue';

const mobileMenuOpen = ref(false);
const isScrolled = ref(false);
const wallet = useWallet();

const handleScroll = () => {
  isScrolled.value = window.scrollY > 0;
};

const shortenAddress = (address, chars = 6) => {
  if (!address) return '';
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
};

onMounted(() => {
  const element = document.querySelector('html');
  element.classList.add('app');
  window.addEventListener('scroll', handleScroll);
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
});
</script>

<style scoped>
/* Header Styles */
.app-header {
  position: sticky;
  top: 0;
  z-index: 50;
  border-bottom: 1px solid #252131;
  transition: background-color 0.3s ease;
}

.app-header.scrolled {
  background-color: #100C18;
}

.dark .app-header {
  background-color: #100C18;
  /* dark:bg-gray-800 */
}

.header-content {
  max-width: 1280px;
  /* max-w-7xl */
  margin-left: auto;
  margin-right: auto;
  padding-left: 1rem;
  /* px-4 */
  padding-right: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 4rem;
  /* h-16 */
}

.nav-link-active {
  position: relative;
}

.nav-link-active::after {
  content: "";
  display: block;
  width: 100%;
  height: 4px;
  border-radius: 10px;
  background-color: white;
  position: absolute;
  bottom: -20px;
  left: 0;
}

@media (min-width: 640px) {

  /* sm: */
  .header-content {
    padding-left: 1.5rem;
    /* sm:px-6 */
    padding-right: 1.5rem;
  }
}

@media (min-width: 1024px) {

  /* lg: */
  .header-content {
    padding-left: 2rem;
    /* lg:px-8 */
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
  font-size: 1.5rem;
  /* text-2xl */
  font-weight: 700;
  /* font-bold */
  color: #4f46e5;
  /* text-indigo-600 */
}

.dark .logo-text {
  color: #818cf8;
  /* dark:text-indigo-400 */
}

.main-navigation {
  display: none;
  /* hidden */
}

@media (min-width: 768px) {

  /* md: */
  .main-navigation {
    margin-left: 1.5rem;
    /* md:ml-6 */
    display: flex;
    /* md:flex */
    column-gap: 2rem;
    /* md:space-x-8 */
    align-items: center;
    /* md:items-center */
  }
}

.header-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  /* space-x-3 equivalent */
}

/* Base Button Style (can be globalized) */
.btn {
  padding: 0.5rem 1rem;
  border: 1px solid transparent;
  border-radius: 0.375rem;
  /* rounded-md */
  font-size: 0.875rem;
  /* text-sm */
  font-weight: 500;
  /* font-medium */
  line-height: 1.25rem;
  color: #ffffff;
  /* text-white */
  cursor: pointer;
  text-decoration: none;
  /* For router-link acting as button */
  display: inline-flex;
  /* To align text and potential icon */
  align-items: center;
  justify-content: center;
  transition: background-color 0.15s ease-in-out, border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  /* shadow-sm */
}

.btn:focus {
  outline: 2px solid transparent;
  outline-offset: 2px;
  box-shadow: 0 0 0 2px #ffffff, 0 0 0 4px #4f46e5;
  /* Default focus ring, can be overridden */
}

/* Primary Navigation Button Style (for Profile link) */
.btn-primary-nav {
  background-color: #4f46e5;
  /* bg-indigo-600 */
}

.btn-primary-nav:hover {
  background-color: #4338ca;
  /* hover:bg-indigo-700 */
}

.btn-primary-nav:focus {
  box-shadow: 0 0 0 2px #ffffff, 0 0 0 4px #4f46e5;
  /* focus:ring-indigo-500 */
}

.dark .btn-primary-nav {
  background-color: #6366f1;
  /* dark:bg-indigo-500 */
}

.dark .btn-primary-nav:hover {
  background-color: #818cf8;
  /* dark:hover:bg-indigo-400 */
}

@media (min-width: 768px) {

  /* md: */
  .mobile-menu-button-container {
    display: none;
    /* md:hidden */
  }
}

.mobile-menu-button {
  padding: 0.5rem;
  /* p-2 */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.375rem;
  /* rounded-md */
  color: #9ca3af;
  /* text-gray-400 */
  background-color: transparent;
  border: none;
  cursor: pointer;
}

.dark .mobile-menu-button {
  color: #6b7280;
  /* dark:text-gray-500 */
}

.mobile-menu-button:hover {
  color: #6b7280;
  /* hover:text-gray-500 */
  background-color: #f3f4f6;
  /* hover:bg-gray-100 */
}

.dark .mobile-menu-button:hover {
  color: #d1d5db;
  /* dark:hover:text-gray-300 */
  background-color: #374151;
  /* dark:hover:bg-gray-700 */
}

.mobile-menu-button:focus {
  outline: 2px solid transparent;
  outline-offset: 2px;
  box-shadow: 0 0 0 2px #6366f1;
  /* focus:ring-2 focus:ring-inset focus:ring-indigo-500 */
}

.sr-only {
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
  height: 1.5rem;
  /* h-6 */
  width: 1.5rem;
  /* w-6 */
  display: block;
}

.mobile-menu {
  /* Visibility controlled by v-if */
}

.mobile-menu-content {
  padding-left: 0.5rem;
  /* px-2 */
  padding-right: 0.5rem;
  padding-top: 0.5rem;
  /* pt-2 */
  padding-bottom: 0.75rem;
  /* pb-3 */
}

.mobile-menu-content>a:not(:last-child) {
  /* space-y-1 approx */
  margin-bottom: 0.25rem;
}

@media (min-width: 640px) {

  /* sm: */
  .mobile-menu-content {
    padding-left: 0.75rem;
    /* sm:px-3 */
    padding-right: 0.75rem;
  }
}

/* Footer Styles */
.app-footer {
  background-color: #e5e7eb;
  /* bg-gray-200 */
  text-align: center;
  padding: 1rem;
  /* p-4 */
  margin-top: auto;
  /* Pushes footer to bottom in flex column */
}

.dark .app-footer {
  background-color: #030712;
  /* dark:bg-gray-950 */
}

.app-footer p {
  font-size: 0.875rem;
  /* text-sm */
  color: #4b5563;
  /* text-gray-600 */
}

.dark .app-footer p {
  color: #9ca3af;
  /* dark:text-gray-400 */
}

/* WalletMultiButton global styles should be imported in main.js or a global CSS file:
   @import 'solana-wallets-vue/styles.css';
*/
</style>