<template>
  <div class="container mx-auto p-4 md:p-8 max-w-2xl bg-white dark:bg-gray-800 shadow-lg rounded-lg">
    <h1 class="text-3xl font-bold text-center text-gray-800 dark:text-white mb-8">User Authentication</h1>

    <div class="mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-md">
      <h2 class="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-3">Wallet Connection</h2>
      <div class="flex justify-center my-4">
        <WalletMultiButton />
      </div>
      <div v-if="wallet.connected.value && wallet.publicKey.value" class="info-box mt-3 text-center">
        Connected: <span class="font-mono text-sm">{{ shortenAddress(wallet.publicKey.value.toBase58()) }}</span>
      </div>
    </div>

    <div v-if="wallet.connected.value && !isAuthenticated && showRegistrationForm" class="mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-md">
      <h2 class="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-3">Complete Your Profile</h2>
      <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">Welcome! Please provide a display name to finish setting up your account.</p>
      <form @submit.prevent="handleCompleteRegistration" class="space-y-4">
        <div>
          <label for="nameInput" class="label">Your Name:</label>
          <input type="text" id="nameInput" v-model="name" class="input-field-auth" placeholder="Enter your display name" required>
        </div>
        <div>
          <label for="typeInput" class="label">User Type (optional):</label>
          <select id="typeInput" v-model="userType" class="input-field-auth">
            <option value="user">User</option>
            <option value="creator">Creator</option>
            <!-- <option value="customer">Customer</option> -->
          </select>
        </div>
        <button type="submit" :disabled="isLoadingAuth" class="btn btn-primary w-full disabled:opacity-50">
          {{ isLoadingAuth ? 'Registering...' : 'Register and Login' }}
        </button>
      </form>
    </div>

    <div v-if="isAuthenticated" class="mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-md text-center">
      <h2 class="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-3">Welcome Back!</h2>
      <div v-if="currentUser" class="info-box space-y-1">
        <p><strong>Name:</strong> {{ currentUser.name }}</p>
        <p><strong>Wallet:</strong> <span class="font-mono text-sm">{{ shortenAddress(currentUser.walletAddress) }}</span></p>
        <p>You are successfully authenticated.</p>
      </div>
      <button @click="goToCreateCandyMachine" class="btn btn-primary w-full mt-4">
          Proceed to Create Candy Machine
      </button>
      <button @click="performLogout" class="btn btn-danger w-full mt-3">Logout from App</button>
    </div>

    <div v-if="wallet.connected.value && !isAuthenticated && !showRegistrationForm && isLoadingAuth" class="mb-6 p-4 info-box text-center">
        Verifying account status...
    </div>

    <div v-if="uiMessage.text"
         :class="uiMessage.type === 'error' ? 'error-box' : (uiMessage.type === 'success' ? 'success-box' : 'info-box')"
         class="mt-6 p-3 rounded-md text-center">
      {{ uiMessage.text }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useWallet, WalletMultiButton } from 'solana-wallets-vue';
import axios from 'axios';

const router = useRouter();
const route = useRoute();
const wallet = useWallet();

// Configuration
const AUTH_API_BASE_URL = import.meta.env.VITE_APP_AUTH_API_URL || 'http://localhost:3000/api';
const JWT_TOKEN_KEY = 'readium_fun_jwt_token';

// Auth State
const token = ref(localStorage.getItem(JWT_TOKEN_KEY));
const currentUser = ref(null);
const isLoadingAuth = ref(false);
const showRegistrationForm = ref(false);

const isAuthenticated = computed(() => !!token.value && !!currentUser.value);

// Form Inputs for registration
const name = ref('testingUser');
const userType = ref('user');

// UI Message
const uiMessage = ref({ text: '', type: 'info' });

function showUiMessage(msg, type = 'info', duration = 4000) {
  uiMessage.value = { text: msg, type };
  if (duration > 0) {
    setTimeout(() => { uiMessage.value = { text: '', type: 'info' }; }, duration);
  }
}

const shortenAddress = (address, chars = 6) => {
  if (!address) return '';
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
};

// Auth API Client
const authApiClient = axios.create({
  baseURL: AUTH_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});
authApiClient.interceptors.response.use(
  (response) => response.data,
  (error) => Promise.reject(error.response?.data || { message: error.message || 'Network error (Auth API)' })
);

async function attemptAutoLoginApi(walletAddr) {
  return authApiClient.post('/auth/simplified-wallet-login', { walletAddress: walletAddr });
}
async function completeRegistrationApi(credentials) {
  return authApiClient.post('/auth/simplified-wallet-login', credentials);
}
async function fetchUserProfileApi(authToken) {
  return authApiClient.get('/auth/me', {
    headers: { 'Authorization': `Bearer ${authToken}` },
  });
}

async function handleCompleteRegistration() {
  if (!wallet.publicKey.value) {
    showUiMessage('Wallet not connected.', 'error'); return;
  }
  if (!name.value.trim()) {
    showUiMessage('Please enter your name.', 'error'); return;
  }
  isLoadingAuth.value = true;
  showUiMessage('Registering and logging in...', 'info', null);
  try {
    const result = await completeRegistrationApi({
      walletAddress: wallet.publicKey.value.toBase58(),
      name: name.value.trim(),
      type: userType.value,
    });
    if (result.success && result.token) {
      localStorage.setItem(JWT_TOKEN_KEY, result.token);
      token.value = result.token;
      currentUser.value = result.data;
      showRegistrationForm.value = false;
      showUiMessage('Successfully registered and logged in!', 'success');
      name.value = ''; // Clear form
      // REMOVED: navigateToNext(); 
    } else { throw new Error(result.message || 'Registration failed.'); }
  } catch (error) {
    showUiMessage(error.message || 'An unknown error occurred during registration.', 'error');
    performLogout(false);
  } finally { isLoadingAuth.value = false; }
}

function performLogout(showMsg = true) {
  localStorage.removeItem(JWT_TOKEN_KEY);
  token.value = null;
  currentUser.value = null;
  showRegistrationForm.value = false;
  if (showMsg) { showUiMessage('You have been logged out.', 'info'); }
}

async function checkAuthStateForCurrentWallet() {
  if (!wallet.publicKey.value) {
    if(isAuthenticated.value) performLogout(false);
    showRegistrationForm.value = false;
    return;
  }

  isLoadingAuth.value = true;
  showRegistrationForm.value = false;
  showUiMessage('Verifying account status...', 'info', null);
  const currentWalletAddr = wallet.publicKey.value.toBase58();
  const storedToken = localStorage.getItem(JWT_TOKEN_KEY);

  if (storedToken) {
    try {
      const profileResult = await fetchUserProfileApi(storedToken);
      if (profileResult.success && profileResult.data.walletAddress === currentWalletAddr) {
        token.value = storedToken;
        currentUser.value = profileResult.data;
        isLoadingAuth.value = false;
        showUiMessage('Session restored.', 'success');
        // REMOVED: navigateToNext(); 
        return;
      } else {
        performLogout(false);
      }
    } catch (e) {
      performLogout(false);
    }
  }

  try {
    const autoLoginResult = await attemptAutoLoginApi(currentWalletAddr);
    if (autoLoginResult.success && autoLoginResult.token) {
      localStorage.setItem(JWT_TOKEN_KEY, autoLoginResult.token);
      token.value = autoLoginResult.token;
      currentUser.value = autoLoginResult.data;
      showUiMessage('Welcome back!', 'success');
      // REMOVED: navigateToNext(); 
    } else if (!autoLoginResult.success) {
      showUiMessage('New wallet detected. Please complete your profile.', 'info');
      showRegistrationForm.value = true;
    } else {
      throw new Error(autoLoginResult.message || 'Auto-login check failed.');
    }
  } catch (error) {
    showUiMessage(error.message || 'Could not verify authentication status.', 'error');
    performLogout(false);
  } finally {
    isLoadingAuth.value = false;
  }
}

// This function is still used by the "Proceed to Create Candy Machine" button
function navigateToNext() {
    if (route.query.redirect && typeof route.query.redirect === 'string') {
        router.push(route.query.redirect);
    } else {
        router.push({ name: 'CreateCandyMachine' }); // Default navigation
    }
}

function goToCreateCandyMachine() {
    if (isAuthenticated.value) {
        navigateToNext(); // Use the existing navigation logic
    } else {
        showUiMessage('Authentication error. Please try logging in again.', 'error');
    }
}

watch(() => wallet.publicKey.value, (newPublicKey, oldPublicKey) => {
  const newAddress = newPublicKey?.toBase58();
  const oldAddress = oldPublicKey?.toBase58();

  if (newAddress && newAddress !== oldAddress) {
    console.log('Auth.vue: Wallet connected/changed to', newAddress);
    if (oldAddress && isAuthenticated.value) {
      showUiMessage(`Wallet account switched. Logging out previous session.`, 'info');
      performLogout(false);
    }
    checkAuthStateForCurrentWallet();
  } else if (!newAddress && oldAddress) {
    console.log('Auth.vue: Wallet disconnected from', oldAddress);
    showUiMessage('Wallet disconnected.', 'info');
    performLogout(false);
    showRegistrationForm.value = false;
  }
}, { immediate: false });


onMounted(() => {
  if (wallet.connected.value && wallet.publicKey.value) {
    console.log('Auth.vue: Wallet already connected on mount. Checking auth state for', wallet.publicKey.value.toBase58());
    checkAuthStateForCurrentWallet();
  } else {
    console.log('Auth.vue: No wallet connected on mount. Waiting for user action or auto-connect.');
  }
});

</script>

<style scoped>
/* Styles remain the same */
.label { @apply block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1; }
.input-field-auth { @apply w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100; }
.btn { @apply px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed; }
.btn-primary { @apply bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400 disabled:bg-indigo-300 dark:disabled:bg-indigo-700; }
.btn-secondary { @apply bg-gray-600 hover:bg-gray-700 focus:ring-gray-500 dark:bg-gray-500 dark:hover:bg-gray-400 disabled:bg-gray-300 dark:disabled:bg-gray-700; }
.btn-danger { @apply bg-red-600 hover:bg-red-700 focus:ring-red-500 dark:bg-red-500 dark:hover:bg-red-400 disabled:bg-red-300 dark:disabled:bg-red-700; }
.info-box { @apply mt-2 p-3 bg-gray-100 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-200; }
.error-box { @apply mt-2 p-3 bg-red-100 dark:bg-red-700/30 text-red-700 dark:text-red-300 rounded-md border border-red-200 dark:border-red-500/50 text-sm; }
.success-box { @apply mt-2 p-3 bg-green-100 dark:bg-green-700/30 text-green-700 dark:text-green-300 rounded-md border border-green-200 dark:border-green-500/50 text-sm; }
</style>
