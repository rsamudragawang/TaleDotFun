<template>
  <div class="auth-container">
    <h1 class="auth-title">User Authentication</h1>

    <div class="auth-section wallet-section">
      <h2 class="section-title">1. Wallet Connection</h2>
      <div class="wallet-button-wrapper">
        <WalletMultiButton />
      </div>
      <div v-if="wallet.connected.value && wallet.publicKey.value" class="info-box connected-wallet-info">
        Connected: <span class="wallet-address">{{ shortenAddress(wallet.publicKey.value.toBase58()) }}</span>
      </div>
      <div v-else class="info-box">
        Please connect your wallet to proceed.
      </div>
    </div>

    <div v-if="wallet.connected.value && !isAuthenticated && !showRegistrationForm && !pendingSignatureVerification" class="auth-section sign-message-section">
      <h2 class="section-title">2. Verify Ownership</h2>
      <button @click="handleSignMessageAndVerify" :disabled="isLoadingAuth" class="btn btn-primary action-button">
        {{ isLoadingAuth ? 'Verifying...' : 'Login / Register with Wallet' }}
      </button>
      <p class="form-text info-text">You'll be asked to sign a message to verify wallet ownership.</p>
    </div>

    <div v-if="showRegistrationForm" class="auth-section registration-section">
      <h2 class="section-title">3. Complete Your Profile</h2>
      <p class="registration-prompt">Welcome! Your wallet is verified. Please provide a display name to finish setting up your account.</p>
      <form @submit.prevent="handleCompleteRegistrationWithSignature" class="auth-form">
        <div>
          <label for="nameInput" class="form-label">Your Name:</label>
          <input type="text" id="nameInput" v-model="name" class="form-input-auth" placeholder="Enter your display name" required>
        </div>
        <!-- <div>
          <label for="typeInput" class="form-label">User Type (optional):</label>
          <select id="typeInput" v-model="userType" class="form-input-auth">
            <option value="user">User</option>
            <option value="creator">Creator</option>
            <option value="customer">Customer</option>
          </select>
        </div> -->
        <button type="submit" :disabled="isLoadingAuth" class="btn btn-success form-submit-button">
          {{ isLoadingAuth ? 'Completing Registration...' : 'Complete Registration' }}
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

    <div v-if="pendingSignatureVerification" class="auth-section loading-message info-box">
        Verifying signature and account status... Please wait.
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
import { Buffer } from 'buffer'; // Needed for TextEncoder if running in environment where it's not global

const router = useRouter();
const route = useRoute();
const wallet = useWallet();

// Configuration
const AUTH_API_BASE_URL = import.meta.env.VITE_APP_AUTH_API_URL || 'http://localhost:3000/api';
const JWT_TOKEN_KEY = 'readium_fun_jwt_token';

// Auth State
const token = ref(localStorage.getItem(JWT_TOKEN_KEY));
const currentUser = ref(null);
const isLoadingAuth = ref(false); // General loading state for auth operations
const showRegistrationForm = ref(false);
const pendingSignatureVerification = ref(false); // New state for when verifying signature

// Store message and signature if profile completion is needed
const signedAuthData = ref({ message: '', signature: null, walletAddress: '' });

const isAuthenticated = computed(() => !!token.value && !!currentUser.value);

// Form Inputs for registration
const name = ref('');
const userType = ref('creator');

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

const authApiClient = axios.create({
  baseURL: AUTH_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});
authApiClient.interceptors.request.use(config => {
  const currentToken = localStorage.getItem(JWT_TOKEN_KEY); // Get fresh token
  if (currentToken) {
    config.headers.Authorization = `Bearer ${currentToken}`;
  }
  return config;
});
authApiClient.interceptors.response.use(
  (response) => response.data,
  (error) => Promise.reject(error.response?.data || { message: error.message || 'Network error (Auth API)' })
);

// New API call functions
async function verifySignatureApi(payload) {
  // payload: { walletAddress, message, signature (base64) }
  return authApiClient.post('/auth/verify-signature', payload);
}
async function completeProfileWithSignatureApi(payload) {
  // payload: { walletAddress, name, type, message, signature (base64) }
  return authApiClient.post('/auth/complete-profile-with-signature', payload);
}
async function fetchUserProfileApi() { // Removed authToken param, uses interceptor
  return authApiClient.get('/auth/me');
}

async function handleSignMessageAndVerify() {
  if (!wallet.connected.value || !wallet.publicKey.value || !wallet.signMessage.value) {
    showUiMessage('Wallet not connected or does not support message signing.', 'error');
    return;
  }

  isLoadingAuth.value = true;
  pendingSignatureVerification.value = true;
  showUiMessage('Please sign the message in your wallet to continue...', 'info', 0);

  const messageToSign = `Welcome to Readium Fun! Please sign this message to authenticate your wallet. Timestamp: ${Date.now()}`;
  const messageBytes = new TextEncoder().encode(messageToSign);

  try {
    const signatureBytes = await wallet.signMessage.value(messageBytes);
    const signatureBase64 = Buffer.from(signatureBytes).toString('base64'); // Send as base64
    const walletAddress = wallet.publicKey.value.toBase58();

    const verificationResult = await verifySignatureApi({
      walletAddress,
      message: messageToSign,
      signature: signatureBase64,
    });

    if (verificationResult.success) {
      if (verificationResult.needsProfile) {
        showUiMessage('Wallet verified! Please complete your profile.', 'success');
        signedAuthData.value = { message: messageToSign, signature: signatureBase64, walletAddress };
        showRegistrationForm.value = true;
      } else if (verificationResult.token && verificationResult.user) {
        localStorage.setItem(JWT_TOKEN_KEY, verificationResult.token);
        token.value = verificationResult.token;
        currentUser.value = verificationResult.user;
        showRegistrationForm.value = false; // Ensure it's hidden
        showUiMessage('Successfully logged in!', 'success');
        // navigateToNext(); // Or handle navigation as needed
      } else {
        throw new Error("Invalid response from server after signature verification.");
      }
    } else {
      throw new Error(verificationResult.message || 'Signature verification failed.');
    }
  } catch (error) {
    console.error("Error during sign message and verify:", error);
    showUiMessage(error.message || 'An error occurred during wallet verification.', 'error');
    performLogout(false); // Clear any partial auth state
  } finally {
    isLoadingAuth.value = false;
    pendingSignatureVerification.value = false;
    if (uiMessage.value.text.startsWith('Please sign')) showUiMessage('', 'info');
  }
}

async function handleCompleteRegistrationWithSignature() {
  if (!name.value.trim()) {
    showUiMessage('Please enter your name.', 'error'); return;
  }
  if (!signedAuthData.value.signature || !signedAuthData.value.walletAddress) {
    showUiMessage('Verification data missing. Please try the sign-in process again.', 'error');
    showRegistrationForm.value = false; // Reset flow
    return;
  }

  isLoadingAuth.value = true;
  showUiMessage('Completing registration...', 'info', 0);
  try {
    const result = await completeProfileWithSignatureApi({
      walletAddress: signedAuthData.value.walletAddress,
      name: name.value.trim(),
      type: userType.value,
      message: signedAuthData.value.message,
      signature: signedAuthData.value.signature,
    });

    if (result.success && result.token && result.user) {
      localStorage.setItem(JWT_TOKEN_KEY, result.token);
      token.value = result.token;
      currentUser.value = result.user;
      showRegistrationForm.value = false;
      signedAuthData.value = { message: '', signature: null, walletAddress: '' }; // Clear stored data
      showUiMessage('Successfully registered and logged in!', 'success');
      name.value = '';
      // navigateToNext();
    } else {
      throw new Error(result.message || 'Profile completion failed.');
    }
  } catch (error) {
    showUiMessage(error.message || 'An unknown error occurred during registration completion.', 'error');
    // Don't necessarily logout here, user might want to retry form if it was a validation error from backend
  } finally {
    isLoadingAuth.value = false;
    if (uiMessage.value.text.startsWith('Completing registration')) showUiMessage('', 'info');
  }
}

function performLogout(showMsg = true) {
  localStorage.removeItem(JWT_TOKEN_KEY);
  token.value = null;
  currentUser.value = null;
  showRegistrationForm.value = false;
  signedAuthData.value = { message: '', signature: null, walletAddress: '' };
  pendingSignatureVerification.value = false;
  if (showMsg) { showUiMessage('You have been logged out.', 'info'); }
}

async function checkExistingSession() {
  const storedToken = localStorage.getItem(JWT_TOKEN_KEY);
  if (storedToken && wallet.publicKey.value) { // Check if wallet is also available
    isLoadingAuth.value = true;
    showUiMessage('Checking existing session...', 'info', 0);
    try {
      const profileResult = await fetchUserProfileApi(); // Token is sent by interceptor
      // Verify token is for the currently connected wallet
      if (profileResult.success && profileResult.data.walletAddress === wallet.publicKey.value.toBase58()) {
        token.value = storedToken; // Re-affirm token
        currentUser.value = profileResult.data;
        showUiMessage('Session restored.', 'success');
      } else {
        // Token is invalid or for a different wallet
        performLogout(false);
        if(wallet.connected.value) showUiMessage('Previous session invalid for current wallet. Please log in.', 'info');
      }
    } catch (error) {
      // API call failed, token likely invalid or expired
      performLogout(false);
      if(wallet.connected.value) showUiMessage('Session expired or invalid. Please log in.', 'info');
    } finally {
      isLoadingAuth.value = false;
      if (uiMessage.value.text.startsWith('Checking existing session')) showUiMessage('', 'info');
    }
  } else {
    // No token or no wallet public key, ensure logged out state
    performLogout(false);
  }
}


function navigateToNext() {
    if (route.query.redirect && typeof route.query.redirect === 'string') {
        router.push(route.query.redirect);
    } else {
        router.push({ name: 'CreateCandyMachine' }); // Default navigation
    }
}
function goToCreateCandyMachine() {
    if (isAuthenticated.value) {
        navigateToNext();
    } else {
        showUiMessage('Authentication error. Please try logging in again.', 'error');
    }
}

watch(() => wallet.publicKey.value, (newPublicKey, oldPublicKey) => {
  const newAddress = newPublicKey?.toBase58();
  const oldAddress = oldPublicKey?.toBase58();

  if (newAddress && newAddress !== oldAddress) { // Wallet connected or changed
    console.log('Auth.vue: Wallet connected/changed to', newAddress);
    performLogout(false); // Always logout previous session on wallet change before new auth attempt
    checkExistingSession(); // Check if there's a valid token for the new wallet
  } else if (!newAddress && oldAddress) { // Wallet disconnected
    console.log('Auth.vue: Wallet disconnected from', oldAddress);
    performLogout(true); // Logout with message
  } else if (newAddress && !isAuthenticated.value && !showRegistrationForm.value) {
    // Wallet is connected, but user is not authenticated and not in registration.
    // This case is handled by the UI showing the "Login / Register with Wallet" button.
    // We might still check for an existing session if one wasn't checked on mount.
    checkExistingSession();
  }
}, { immediate: false }); // Let onMounted handle initial state

onMounted(() => {
  // Buffer might not be globally available in all browser contexts for TextEncoder
  if (typeof window !== 'undefined' && !window.Buffer) {
    window.Buffer = Buffer;
  }
  checkExistingSession(); // Check session on component mount
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
.dark .auth-container {
  background-color: #1f2937; /* dark:bg-gray-800 */
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
.dark .auth-title {
  color: #ffffff; /* dark:text-white */
}

.section-title {
  font-size: 1.25rem; /* text-xl */
  line-height: 1.75rem;
  font-weight: 600; /* font-semibold */
  color: #374151; /* text-gray-700 */
  margin-bottom: 0.75rem; /* mb-3 */
}
.dark .section-title {
  color: #e5e7eb; /* dark:text-gray-200 */
}

/* Sections */
.auth-section {
  margin-bottom: 1.5rem; /* mb-6 */
  padding: 1rem; /* p-4 */
  border: 1px solid #e5e7eb; /* border-gray-200 */
  border-radius: 0.375rem; /* rounded-md */
}
.dark .auth-section {
  border-color: #374151; /* dark:border-gray-700 */
}
.sign-message-section, .welcome-section, .loading-message {
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
.dark .registration-prompt {
  color: #9ca3af; /* dark:text-gray-400 */
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


/* Form Elements */
.form-label {
  display: block;
  font-size: 0.875rem; /* text-sm */
  line-height: 1.25rem;
  font-weight: 500; /* font-medium */
  color: #374151; /* text-gray-700 */
  margin-bottom: 0.25rem; /* mb-1 */
}
.dark .form-label {
  color: #d1d5db; /* dark:text-gray-300 */
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
.dark .form-input-auth {
  border-color: #4b5568; /* dark:border-gray-600 */
  background-color: #374151; /* dark:bg-gray-700 */
  color: #f3f4f6; /* dark:text-gray-100 */
}
.form-text.info-text { /* For small informational text below buttons etc. */
    font-size: 0.75rem; /* text-xs */
    color: #6b7280; /* text-gray-500 */
    margin-top: 0.5rem; /* mt-2 */
}
.dark .form-text.info-text {
    color: #9ca3af; /* dark:text-gray-400 */
}


/* Buttons */
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
  opacity: 0.6; /* General disabled opacity */
}

.btn-primary {
  background-color: #4f46e5; /* bg-indigo-600 */
}
.btn-primary:hover {
  background-color: #4338ca; /* hover:bg-indigo-700 */
}
.btn-primary:focus {
   box-shadow: 0 0 0 2px #ffffff, 0 0 0 4px #4f46e5; /* focus:ring-indigo-500 */
}
/* .btn-primary:disabled already handled by .btn:disabled and specific bg below if needed */
.dark .btn-primary {
  background-color: #6366f1; /* dark:bg-indigo-500 */
}
.dark .btn-primary:hover {
  background-color: #818cf8; /* dark:hover:bg-indigo-400 */
}

.btn-success {
  background-color: #16a34a; /* bg-green-600 */
}
.btn-success:hover {
  background-color: #15803d; /* hover:bg-green-700 */
}
.btn-success:focus {
   box-shadow: 0 0 0 2px #ffffff, 0 0 0 4px #16a34a; /* focus:ring-green-500 */
}
.dark .btn-success {
  background-color: #22c55e; /* dark:bg-green-500 */
}
.dark .btn-success:hover {
  background-color: #16a34a;
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
.dark .btn-danger {
  background-color: #ef4444; /* dark:bg-red-500 */
}
.dark .btn-danger:hover {
  background-color: #f87171; /* dark:hover:bg-red-400 */
}


/* UI Message Boxes */
.ui-message-box {
  margin-top: 1.5rem;
  padding: 0.75rem;
  border-radius: 0.375rem;
  text-align: center;
  font-size: 0.875rem;
}

.info-box {
  margin-top: 0.5rem;
  padding: 0.75rem;
  background-color: #f3f4f6; /* bg-gray-100 */
  border-radius: 0.375rem;
  border: 1px solid #e5e7eb; /* border-gray-200 */
  color: #374151; /* text-gray-700 */
}
.dark .info-box {
  background-color: #374151; /* dark:bg-gray-700 */
  border-color: #4b5568; /* dark:border-gray-600 */
  color: #e5e7eb; /* dark:text-gray-200 */
}

.error-box {
  margin-top: 0.5rem;
  padding: 0.75rem;
  background-color: #fee2e2; /* bg-red-100 */
  color: #b91c1c; /* text-red-700 */
  border-radius: 0.375rem;
  border: 1px solid #fecaca; /* border-red-200 */
}
.dark .error-box {
  background-color: rgba(153, 27, 27, 0.3); /* dark:bg-red-700/30 */
  color: #fca5a5; /* dark:text-red-300 */
  border-color: rgba(220, 38, 38, 0.5); /* dark:border-red-500/50 */
}

.success-box {
  margin-top: 0.5rem;
  padding: 0.75rem;
  background-color: #dcfce7; /* bg-green-100 */
  color: #166534; /* text-green-700 */
  border-radius: 0.375rem;
  border: 1px solid #bbf7d0; /* border-green-200 */
}
.dark .success-box {
  background-color: rgba(22, 101, 52, 0.3); /* dark:bg-green-700/30 */
  color: #86efac; /* dark:text-green-300 */
  border-color: rgba(34, 197, 94, 0.5); /* dark:border-green-500/50 */
}

</style>