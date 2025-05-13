<template>
  <div class="auth-container">
    <h1 class="auth-title">User Authentication</h1>

    <div class="auth-section wallet-section">
      <h2 class="section-title">Wallet Connection</h2>
      <div class="wallet-button-wrapper">
        <WalletMultiButton />
      </div>
      <div v-if="wallet.connected.value && wallet.publicKey.value" class="info-box connected-wallet-info">
        Connected: <span class="wallet-address">{{ shortenAddress(wallet.publicKey.value.toBase58()) }}</span>
      </div>
    </div>

    <div v-if="wallet.connected.value && !isAuthenticated && showRegistrationForm" class="auth-section registration-section">
      <h2 class="section-title">Complete Your Profile</h2>
      <p class="registration-prompt">Welcome! Please provide a display name to finish setting up your account.</p>
      <form @submit.prevent="handleCompleteRegistration" class="auth-form">
        <div>
          <label for="nameInput" class="form-label">Your Name:</label>
          <input type="text" id="nameInput" v-model="name" class="form-input-auth" placeholder="Enter your display name" required>
        </div>
        <div>
          <label for="typeInput" class="form-label">User Type (optional):</label>
          <select id="typeInput" v-model="userType" class="form-input-auth">
            <option value="user">User</option>
            <option value="creator">Creator</option>
            <option value="customer">Customer</option>
          </select>
        </div>
        <button type="submit" :disabled="isLoadingAuth" class="btn btn-primary form-submit-button">
          {{ isLoadingAuth ? 'Registering...' : 'Register and Login' }}
        </button>
      </form>
    </div>

    <div v-if="isAuthenticated" class="auth-section welcome-section">
      <h2 class="section-title">Welcome Back!</h2>
      <div v-if="currentUser" class="info-box user-details">
        <p><strong>Name:</strong> {{ currentUser.name }}</p>
        <p><strong>Wallet:</strong> <span class="wallet-address">{{ shortenAddress(currentUser.walletAddress) }}</span></p>
        <p>You are successfully authenticated.</p>
      </div>
      <button @click="goToCreateCandyMachine" class="btn btn-primary action-button">
        Proceed to Create Candy Machine
      </button>
      <button @click="performLogout" class="btn btn-danger action-button logout-button">Logout from App</button>
    </div>

    <div v-if="wallet.connected.value && !isAuthenticated && !showRegistrationForm && isLoadingAuth" class="auth-section loading-message">
        Verifying account status...
    </div>

    <div v-if="uiMessage.text"
         :class="['ui-message-box', uiMessage.type === 'error' ? 'error-box' : (uiMessage.type === 'success' ? 'success-box' : 'info-box')]"
         >
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
/* Main Container */
.auth-container {
  max-width: 42rem; /* max-w-2xl */
  margin-left: auto;
  margin-right: auto;
  padding: 1rem; /* p-4 */
  background-color: #ffffff; /* bg-white */
  box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05); /* shadow-lg */
  border-radius: 0.5rem; /* rounded-lg */
}
@media (min-width: 768px) { /* md: */
  .auth-container {
    padding: 2rem; /* md:p-8 */
  }
}
@media (prefers-color-scheme: dark) {
  .auth-container {
    background-color: #1f2937; /* dark:bg-gray-800 */
  }
}

/* Titles */
.auth-title {
  font-size: 1.875rem; /* text-3xl */
  line-height: 2.25rem;
  font-weight: 700; /* font-bold */
  text-align: center;
  color: #1f2937; /* text-gray-800 */
  margin-bottom: 2rem; /* mb-8 */
}
@media (prefers-color-scheme: dark) {
  .auth-title {
    color: #ffffff; /* dark:text-white */
  }
}

.section-title {
  font-size: 1.25rem; /* text-xl */
  line-height: 1.75rem;
  font-weight: 600; /* font-semibold */
  color: #374151; /* text-gray-700 */
  margin-bottom: 0.75rem; /* mb-3 */
}
@media (prefers-color-scheme: dark) {
  .section-title {
    color: #e5e7eb; /* dark:text-gray-200 */
  }
}

/* Sections */
.auth-section {
  margin-bottom: 1.5rem; /* mb-6 */
  padding: 1rem; /* p-4 */
  border: 1px solid #e5e7eb; /* border-gray-200 */
  border-radius: 0.375rem; /* rounded-md */
}
@media (prefers-color-scheme: dark) {
  .auth-section {
    border-color: #374151; /* dark:border-gray-700 */
  }
}
.welcome-section, .loading-message {
  text-align: center;
}

/* Wallet Section */
.wallet-button-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 1rem; /* my-4 */
  margin-bottom: 1rem;
}
.connected-wallet-info { /* Extends .info-box */
  margin-top: 0.75rem; /* mt-3 */
  text-align: center;
}
.wallet-address {
  font-family: monospace;
  font-size: 0.875rem; /* text-sm */
}

/* Registration Section */
.registration-prompt {
  font-size: 0.875rem; /* text-sm */
  color: #4b5563; /* text-gray-600 */
  margin-bottom: 0.75rem; /* mb-3 */
}
@media (prefers-color-scheme: dark) {
  .registration-prompt {
    color: #9ca3af; /* dark:text-gray-400 */
  }
}
.auth-form > div:not(:last-child) { /* Replicates space-y-4 */
    margin-bottom: 1rem;
}
.form-submit-button {
  width: 100%; /* w-full */
}
.form-submit-button:disabled {
  opacity: 0.5; /* disabled:opacity-50 */
}


/* Welcome Section */
.user-details { /* Extends .info-box */
  /* space-y-1 equivalent for p tags */
}
.user-details p:not(:last-child) {
    margin-bottom: 0.25rem;
}
.action-button {
  width: 100%; /* w-full */
  margin-top: 1rem; /* mt-4 for first, mt-3 for second */
}
.logout-button {
  margin-top: 0.75rem; /* mt-3 */
}


/* Form Elements (from original @apply rules) */
.form-label {
  display: block;
  font-size: 0.875rem; /* text-sm */
  line-height: 1.25rem;
  font-weight: 500; /* font-medium */
  color: #374151; /* text-gray-700 */
  margin-bottom: 0.25rem; /* mb-1 */
}
@media (prefers-color-scheme: dark) {
  .form-label {
    color: #d1d5db; /* dark:text-gray-300 */
  }
}

.form-input-auth {
  width: 100%;
  padding-left: 0.75rem; /* px-3 */
  padding-right: 0.75rem;
  padding-top: 0.5rem; /* py-2 */
  padding-bottom: 0.5rem;
  border: 1px solid #d1d5db; /* border-gray-300 */
  border-radius: 0.375rem; /* rounded-md */
  box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05); /* shadow-sm */
  font-size: 0.875rem; /* sm:text-sm */
  background-color: #ffffff; /* bg-white */
  color: #111827; /* text-gray-900 */
}
.form-input-auth:focus {
  outline: 2px solid transparent;
  outline-offset: 2px;
  border-color: #6366f1; /* focus:border-indigo-500 */
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.5); /* focus:ring-indigo-500 */
}
@media (prefers-color-scheme: dark) {
  .form-input-auth {
    border-color: #4b5568; /* dark:border-gray-600 */
    background-color: #374151; /* dark:bg-gray-700 */
    color: #f3f4f6; /* dark:text-gray-100 */
  }
}

/* Buttons (from original @apply rules) */
.btn {
  padding: 0.5rem 1rem; /* px-4 py-2 */
  border: 1px solid transparent;
  border-radius: 0.375rem; /* rounded-md */
  box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05); /* shadow-sm */
  font-size: 0.875rem; /* text-sm */
  font-weight: 500; /* font-medium */
  color: #ffffff; /* text-white */
  cursor: pointer;
  transition: background-color 0.15s ease-in-out;
}
.btn:focus {
  outline: 2px solid transparent;
  outline-offset: 2px;
  box-shadow: 0 0 0 2px #ffffff, 0 0 0 4px #6366f1; /* focus:ring-2 focus:ring-offset-2 */
}
.btn:disabled {
  cursor: not-allowed;
  /* opacity is handled by specific button types */
}

.btn-primary {
  background-color: #4f46e5; /* bg-indigo-600 */
}
.btn-primary:hover {
  background-color: #4338ca; /* hover:bg-indigo-700 */
}
.btn-primary:focus { /* Specific focus ring color */
   box-shadow: 0 0 0 2px #ffffff, 0 0 0 4px #4f46e5; /* focus:ring-indigo-500 */
}
.btn-primary:disabled {
  background-color: #a5b4fc; /* disabled:bg-indigo-300 */
}
@media (prefers-color-scheme: dark) {
  .btn-primary {
    background-color: #6366f1; /* dark:bg-indigo-500 */
  }
  .btn-primary:hover {
    background-color: #818cf8; /* dark:hover:bg-indigo-400 */
  }
   .btn-primary:disabled {
    background-color: #3730a3; /* dark:disabled:bg-indigo-700 */
  }
}

.btn-danger {
  background-color: #dc2626; /* bg-red-600 */
}
.btn-danger:hover {
  background-color: #b91c1c; /* hover:bg-red-700 */
}
.btn-danger:focus {
   box-shadow: 0 0 0 2px #ffffff, 0 0 0 4px #dc2626; /* focus:ring-red-500 */
}
.btn-danger:disabled {
  background-color: #fca5a5; /* disabled:bg-red-300 */
}
@media (prefers-color-scheme: dark) {
  .btn-danger {
    background-color: #ef4444; /* dark:bg-red-500 */
  }
  .btn-danger:hover {
    background-color: #f87171; /* dark:hover:bg-red-400 */
  }
  .btn-danger:disabled {
    background-color: #7f1d1d; /* dark:disabled:bg-red-700 */
  }
}

/* UI Message Boxes (from original @apply rules) */
.ui-message-box { /* Base for all message types */
  margin-top: 1.5rem; /* mt-6 (for the main one), mt-2 for others */
  padding: 0.75rem; /* p-3 */
  border-radius: 0.375rem; /* rounded-md */
  text-align: center;
  font-size: 0.875rem; /* text-sm */
}

.info-box { /* Specific type */
  margin-top: 0.5rem; /* mt-2 */
  padding: 0.75rem; /* p-3 */
  background-color: #f3f4f6; /* bg-gray-100 */
  border-radius: 0.375rem; /* rounded-md */
  border: 1px solid #e5e7eb; /* border-gray-200 */
  color: #374151; /* text-gray-700 */
}
@media (prefers-color-scheme: dark) {
  .info-box {
    background-color: #374151; /* dark:bg-gray-700 */
    border-color: #4b5568; /* dark:border-gray-600 */
    color: #e5e7eb; /* dark:text-gray-200 */
  }
}

.error-box { /* Specific type */
  margin-top: 0.5rem; /* mt-2 */
  padding: 0.75rem; /* p-3 */
  background-color: #fee2e2; /* bg-red-100 */
  color: #b91c1c; /* text-red-700 */
  border-radius: 0.375rem; /* rounded-md */
  border: 1px solid #fecaca; /* border-red-200 */
}
@media (prefers-color-scheme: dark) {
  .error-box {
    background-color: rgba(153, 27, 27, 0.3); /* dark:bg-red-700/30 */
    color: #fca5a5; /* dark:text-red-300 */
    border-color: rgba(220, 38, 38, 0.5); /* dark:border-red-500/50 */
  }
}

.success-box { /* Specific type */
  margin-top: 0.5rem; /* mt-2 */
  padding: 0.75rem; /* p-3 */
  background-color: #dcfce7; /* bg-green-100 */
  color: #166534; /* text-green-700 */
  border-radius: 0.375rem; /* rounded-md */
  border: 1px solid #bbf7d0; /* border-green-200 */
}
@media (prefers-color-scheme: dark) {
  .success-box {
    background-color: rgba(22, 101, 52, 0.3); /* dark:bg-green-700/30 */
    color: #86efac; /* dark:text-green-300 */
    border-color: rgba(34, 197, 94, 0.5); /* dark:border-green-500/50 */
  }
}

</style>