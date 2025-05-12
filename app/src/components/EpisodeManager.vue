<template>
  <div class="episode-manager mt-8 p-4 md:p-6 border border-gray-200 dark:border-gray-700 rounded-lg">
    <h2 class="text-2xl font-semibold mb-6 text-gray-800 dark:text-white">
      Episodes for "{{ parentTale?.title || 'Tale' }}"
    </h2>

    <div v-if="isAuthorAndCreator" class="mb-6 text-right">
      <button @click="openEpisodeModal()" class="btn btn-primary">
        + Add New Episode
      </button>
    </div>

    <div v-if="showEpisodeModal" class="modal-overlay">
      <div class="modal-content dark:bg-gray-800">
        <h3 class="text-xl font-bold mb-6 text-gray-800 dark:text-white">
          {{ editingEpisode ? 'Edit Episode' : 'Create New Episode' }}
        </h3>
        <form @submit.prevent="handleSaveEpisode" class="space-y-4">
          <div>
            <label for="episodeName" class="form-label">Episode Name:</label>
            <input type="text" id="episodeName" v-model="currentEpisode.episodeName" class="form-input" required />
          </div>
          <div>
            <label for="episodeContent" class="form-label">Content (Optional):</label>
            <textarea id="episodeContent" v-model="currentEpisode.content" class="form-textarea h-32"></textarea>
          </div>
          <div>
            <label for="episodeOrder" class="form-label">Order (Optional):</label>
            <input type="number" id="episodeOrder" v-model.number="currentEpisode.order" class="form-input" min="0" />
          </div>
           <div>
            <label for="episodeStatus" class="form-label">Status:</label>
            <select id="episodeStatus" v-model="currentEpisode.status" class="form-select">
                <option value="draft">Draft</option>
                <option value="published">Published</option>
            </select>
          </div>

          <div class="border-t dark:border-gray-700 pt-4 mt-4">
            <label class="form-label flex items-center">
              <input type="checkbox" v-model="currentEpisode.isNft" class="form-checkbox mr-2" />
              Is this episode an NFT?
            </label>
          </div>

          <div v-if="currentEpisode.isNft" class="space-y-4 mt-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
            <div>
              <label for="candyMachineId" class="form-label">Candy Machine ID (Optional):</label>
              <input type="text" id="candyMachineId" v-model="currentEpisode.candyMachineId" class="form-input" placeholder="Enter CM ID if applicable" />
            </div>
          </div>

          <div class="mt-4">
            <label class="form-label">Images (Max 10, URLs from Pinata):</label>
            <div v-for="(imgUrl, index) in currentEpisode.images" :key="index" class="flex items-center mb-2">
              <input type="url" v-model="currentEpisode.images[index]" class="form-input flex-grow mr-2" placeholder="https://gateway.pinata.cloud/ipfs/..." />
              <button type="button" @click="removeImageField(index)" class="btn btn-danger btn-xs p-1 leading-none">Remove</button>
            </div>
            <button type="button" @click="addImageField" v-if="currentEpisode.images.length < 10" class="btn btn-secondary btn-sm mt-1">
              + Add Image URL
            </button>
            <div class="mt-2">
                <label for="episodeImageFiles" class="form-label">Or Upload New Images (to get URLs):</label>
                <input type="file" id="episodeImageFiles" @change="handleImageFilesChange" class="form-file-input" multiple accept="image/*" />
                <small class="form-text">Selected files will be uploaded to Pinata. URLs will be added above once uploaded.</small>
                <div v-if="isUploadingImages" class="mt-2 text-sm text-indigo-600 dark:text-indigo-400">
                    <span class="spinner-inline"></span> Uploading images to Pinata...
                </div>
            </div>
          </div>


          <div class="flex justify-end space-x-3 mt-6 pt-4 border-t dark:border-gray-700">
            <button type="button" @click="closeEpisodeModal" class="btn btn-secondary">Cancel</button>
            <button type="submit" :disabled="isSavingEpisode" class="btn btn-success">
              {{ isSavingEpisode ? 'Saving...' : (editingEpisode ? 'Update Episode' : 'Create Episode') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="isLoadingEpisodes" class="text-center p-6">
      <div class="spinner"></div>
      <p class="mt-2 text-gray-600 dark:text-gray-300">Loading episodes...</p>
    </div>
    <div v-else-if="episodes.length === 0" class="info-box text-center">
      This tale has no episodes yet.
      <span v-if="isAuthorAndCreator"> Why not add the first one?</span>
    </div>
    <div v-else class="space-y-4">
      <div v-for="episode in episodes" :key="episode._id" class="episode-item p-4 bg-white dark:bg-gray-800 rounded-lg shadow flex justify-between items-start">
        <div>
          <h4 class="text-lg font-semibold text-indigo-700 dark:text-indigo-400">{{ episode.episodeName }} (Order: {{episode.order}})</h4>
          <p class="text-sm text-gray-600 dark:text-gray-400 line-clamp-2" v-if="episode.content">{{ episode.content }}</p>
          <div class="mt-2">
            <span v-if="episode.isNft" class="tag bg-purple-200 dark:bg-purple-700 text-purple-800 dark:text-purple-100">NFT</span>
            <span class="tag bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200">{{episode.status}}</span>
            <p v-if="episode.isNft && episode.candyMachineId" class="text-xs text-gray-500 dark:text-gray-400 mt-1">CM ID: {{ shortenAddress(episode.candyMachineId, 8) }}</p>
          </div>
          <div v-if="episode.images && episode.images.length > 0" class="mt-2 flex flex-wrap gap-2">
            <a v-for="(img, idx) in episode.images" :key="idx" :href="img" target="_blank" class="hover:opacity-80">
              <img :src="img" alt="Episode Image" class="h-16 w-16 object-cover rounded border dark:border-gray-600" @error="setDefaultImage" />
            </a>
          </div>
        </div>
        <div v-if="isAuthorAndCreator" class="flex flex-col sm:flex-row items-end sm:items-center gap-2 mt-2 sm:mt-0 ml-2 flex-shrink-0">
          <button @click="editEpisode(episode)" class="btn btn-warning btn-xs">Edit</button>
          <button @click="confirmDeleteEpisode(episode._id)" class="btn btn-danger btn-xs">Delete</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, defineProps } from 'vue';
import { useWallet } from 'solana-wallets-vue'; // Assuming global wallet setup
import axios from 'axios';
import { uploadFileToIPFS } from '../services/pinataService'; // Adjust path

// Props
const props = defineProps({
  parentTale: { // Pass the parent Tale object to this component
    type: Object,
    required: true,
  },
  appUser: { // Pass the currently authenticated app user object
    type: Object,
    default: null,
  }
});

const wallet = useWallet();

// Configuration
const API_BASE_URL = import.meta.env.VITE_APP_AUTH_API_URL || 'http://localhost:3000/api'; // Base URL for your backend
const JWT_TOKEN_KEY = 'readium_fun_jwt_token';

// Episode State
const episodes = ref([]);
const isLoadingEpisodes = ref(false);
const showEpisodeModal = ref(false);
const editingEpisode = ref(null); // Episode object if editing
const isSavingEpisode = ref(false);
const isUploadingImages = ref(false);

const defaultEpisode = () => ({
  episodeName: '',
  content: '',
  images: [],
  isNft: false,
  candyMachineId: '',
  order: 0,
  status: 'draft',
});
const currentEpisode = ref(defaultEpisode());

// UI Message
const uiMessage = ref({ text: '', type: 'info' });
function showUiMessage(msg, type = 'info', duration = 4000) { /* ... (implementation from auth.vue) ... */
  uiMessage.value = { text: msg, type };
  if (duration > 0) {
    setTimeout(() => { uiMessage.value = { text: '', type: 'info' }; }, duration);
  }
}
const shortenAddress = (address, chars = 6) => { /* ... (implementation from auth.vue) ... */
  if (!address) return '';
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
};
const setDefaultImage = (event) => {
  event.target.src = 'https://placehold.co/100x100/gray/white?text=Error';
};

// Computed property to check if the current appUser is the author of the parentTale AND a creator
const isAuthorAndCreator = computed(() => {
  return props.appUser &&
         props.parentTale &&
         (props.appUser.id === props.parentTale.author._id || props.appUser.walletAddress === props.parentTale.authorWalletAddress) && // Check both ID and walletAddress for safety
         props.appUser.type === 'creator';
});


// API Client for Episodes
const episodeApiClient = axios.create({
  baseURL: API_BASE_URL,
});
episodeApiClient.interceptors.request.use(config => {
  const token = localStorage.getItem(JWT_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
episodeApiClient.interceptors.response.use(
  response => response.data,
  error => {
    console.error('API Error (Episodes):', error.response || error.message || error);
    const message = error.response?.data?.message || error.message || 'An API error occurred with episodes.';
    showUiMessage(message, 'error');
    return Promise.reject(error.response?.data || { message });
  }
);

// --- Episode CRUD Functions ---
async function fetchEpisodesForTale() {
  if (!props.parentTale?._id) return;
  isLoadingEpisodes.value = true;
  try {
    // GET /api/tales/:taleId/episodes
    const response = await episodeApiClient.get(`/tales/${props.parentTale._id}/episodes`);
    if (response.success) {
      episodes.value = response.data;
    }
  } catch (error) {
    // Error message handled by interceptor
  } finally {
    isLoadingEpisodes.value = false;
  }
}

function openEpisodeModal(episodeToEdit = null) {
  if (!isAuthorAndCreator.value) {
    showUiMessage("You are not authorized to manage episodes for this tale.", "error");
    return;
  }
  if (episodeToEdit) {
    editingEpisode.value = { ...episodeToEdit }; // Copy
    currentEpisode.value = { // Populate form
      episodeName: episodeToEdit.episodeName,
      content: episodeToEdit.content || '',
      images: [...(episodeToEdit.images || [])], // Ensure it's a new array
      isNft: episodeToEdit.isNft || false,
      candyMachineId: episodeToEdit.candyMachineId || '',
      order: episodeToEdit.order || 0,
      status: episodeToEdit.status || 'draft',
    };
  } else {
    editingEpisode.value = null;
    currentEpisode.value = defaultEpisode();
    currentEpisode.value.order = episodes.value.length; // Default order to next
  }
  showEpisodeModal.value = true;
}

function closeEpisodeModal() {
  showEpisodeModal.value = false;
  editingEpisode.value = null;
  currentEpisode.value = defaultEpisode();
  // Clear file input if you have a ref to it: document.getElementById('episodeImageFiles').value = null;
}

async function handleImageFilesChange(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    if (currentEpisode.value.images.length + files.length > 10) {
        showUiMessage("Cannot add more than 10 images in total.", "warning");
        return;
    }

    isUploadingImages.value = true;
    showUiMessage(`Uploading ${files.length} image(s) to Pinata...`, "info", 0);

    const uploadedUrls = [];
    for (const file of files) {
        try {
            const uploadResult = await uploadFileToIPFS(file); // From pinataService.js
            if (uploadResult.success && uploadResult.imageUrl) {
                uploadedUrls.push(uploadResult.imageUrl);
            } else {
                throw new Error(uploadResult.error || `Failed to upload ${file.name}`);
            }
        } catch (uploadError) {
            showUiMessage(`Image upload failed for ${file.name}: ${uploadError.message}`, "error");
            isUploadingImages.value = false;
            return; // Stop if any upload fails
        }
    }
    currentEpisode.value.images.push(...uploadedUrls);
    isUploadingImages.value = false;
    showUiMessage(`${uploadedUrls.length} image(s) uploaded and URLs added.`, "success");
    event.target.value = null; // Reset file input
}


function addImageField() {
  if (currentEpisode.value.images.length < 10) {
    currentEpisode.value.images.push('');
  } else {
    showUiMessage("Maximum 10 images allowed per episode.", "warning");
  }
}
function removeImageField(index) {
  currentEpisode.value.images.splice(index, 1);
}

async function handleSaveEpisode() {
  if (!props.parentTale?._id) {
    showUiMessage("Parent tale information is missing.", "error");
    return;
  }
  isSavingEpisode.value = true;

  const payload = {
    ...currentEpisode.value,
    images: currentEpisode.value.images.filter(imgUrl => imgUrl && imgUrl.trim() !== ''), // Filter out empty strings
  };
  if (!payload.isNft) {
    delete payload.candyMachineId; // Don't send CM ID if not an NFT
  }


  try {
    let response;
    if (editingEpisode.value) {
      // PUT /api/episodes/:episodeId
      response = await episodeApiClient.put(`/episodes/${editingEpisode.value._id}`, payload);
      showUiMessage("Episode updated successfully!", "success");
    } else {
      // POST /api/tales/:taleId/episodes
      response = await episodeApiClient.post(`/tales/${props.parentTale._id}/episodes`, payload);
      showUiMessage("Episode created successfully!", "success");
    }
    if (response.success) {
      fetchEpisodesForTale();
      closeEpisodeModal();
    }
  } catch (error) {
    // Error already shown by interceptor
  } finally {
    isSavingEpisode.value = false;
  }
}

async function confirmDeleteEpisode(episodeId) {
  if (window.confirm("Are you sure you want to delete this episode?")) {
    try {
      // DELETE /api/episodes/:episodeId
      const response = await episodeApiClient.delete(`/episodes/${episodeId}`);
      if (response.success) {
        showUiMessage("Episode deleted successfully.", "success");
        fetchEpisodesForTale();
      }
    } catch (error) {
      // Error shown by interceptor
    }
  }
}

// Watch for parentTale changes to reload episodes
watch(() => props.parentTale?._id, (newTaleId, oldTaleId) => {
  if (newTaleId && newTaleId !== oldTaleId) {
    episodes.value = []; // Clear previous episodes
    fetchEpisodesForTale();
  }
}, { immediate: true }); // Fetch on component mount if parentTale is already available

// Also watch for appUser changes, especially if parentTale might be available before appUser
watch(() => props.appUser?.id, (newUserId) => {
    if (newUserId && props.parentTale?._id && episodes.value.length === 0 && !isLoadingEpisodes.value) {
        // If user is resolved and episodes haven't been loaded yet for the current tale
        fetchEpisodesForTale();
    }
});


onMounted(() => {
  if (props.parentTale?._id && props.appUser) { // Ensure both are available
    fetchEpisodesForTale();
  } else if (!props.parentTale?._id) {
    console.warn("EpisodeManager: Parent Tale ID not provided on mount.");
  } else if (!props.appUser) {
    console.warn("EpisodeManager: App user not available on mount. Episodes might not load if permissions depend on it.");
  }
});

</script>

<style scoped>
/* Using Tailwind utility classes directly in the template. */
.form-label { @apply block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1; }
.form-input, .form-select, .form-textarea { @apply mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100; }
.form-file-input { @apply mt-1 block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 dark:file:bg-indigo-800 file:text-indigo-700 dark:file:text-indigo-300 hover:file:bg-indigo-100 dark:hover:file:bg-indigo-700; }
.form-checkbox { @apply h-4 w-4 text-indigo-600 border-gray-300 dark:border-gray-500 rounded focus:ring-indigo-500 bg-white dark:bg-gray-700; }
.form-text { @apply text-xs text-gray-500 dark:text-gray-400 mt-1; }

.btn { @apply px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed; }
.btn-primary { @apply bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400 disabled:bg-indigo-300 dark:disabled:bg-indigo-700; }
.btn-secondary { @apply bg-gray-500 hover:bg-gray-600 focus:ring-gray-500 dark:bg-gray-600 dark:hover:bg-gray-500 disabled:bg-gray-300 dark:disabled:bg-gray-700; }
.btn-success { @apply bg-green-600 hover:bg-green-700 focus:ring-green-500 dark:bg-green-500 dark:hover:bg-green-400 disabled:bg-green-300 dark:disabled:bg-green-700; }
.btn-danger { @apply bg-red-600 hover:bg-red-700 focus:ring-red-500 dark:bg-red-500 dark:hover:bg-red-400 disabled:bg-red-300 dark:disabled:bg-red-700; }
.btn-warning { @apply bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-500 dark:bg-yellow-500 dark:hover:bg-yellow-400 text-white disabled:bg-yellow-300 dark:disabled:bg-yellow-700; }
.btn-info { @apply bg-blue-500 hover:bg-blue-600 focus:ring-blue-500 dark:bg-blue-500 dark:hover:bg-blue-400 text-white disabled:bg-blue-300 dark:disabled:bg-blue-700; }
.btn-sm { @apply px-3 py-1.5 text-xs; }
.btn-xs { @apply px-2.5 py-1 text-xs; }

.info-box { @apply p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md border border-gray-200 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-200; }
.error-box { @apply p-3 bg-red-50 dark:bg-red-700/30 text-red-700 dark:text-red-300 rounded-md border border-red-200 dark:border-red-500/50 text-sm; }
.success-box { @apply p-3 bg-green-50 dark:bg-green-700/30 text-green-700 dark:text-green-300 rounded-md border border-green-200 dark:border-green-500/50 text-sm; }
.link { @apply text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 underline; }

.modal-overlay { @apply fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-[60]; } /* Increased z-index */
.modal-content { @apply bg-white p-6 rounded-lg shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto; }

.image-preview { @apply max-w-[100px] max-h-[100px] mt-2 border border-gray-300 dark:border-gray-600 rounded object-contain; }
.line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.tag { @apply inline-block bg-gray-200 dark:bg-gray-700 rounded-full px-2 py-0.5 text-xs font-semibold text-gray-700 dark:text-gray-200 mr-1 mb-1; }
.spinner { @apply inline-block w-8 h-8 border-4 border-t-indigo-600 dark:border-t-indigo-400 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin; }
.spinner-inline { @apply inline-block w-4 h-4 border-2 border-t-white border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin ml-2 align-middle; }

.prose :deep(h1), .prose :deep(h2), .prose :deep(h3) { @apply mb-2 mt-4 font-semibold; }
.prose :deep(p) { @apply mb-3 leading-relaxed; }
.prose :deep(ul), .prose :deep(ol) { @apply ml-5 mb-3; }
.prose :deep(li) { @apply mb-1; }
.prose :deep(a) { @apply text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300; }
.prose :deep(blockquote) { @apply border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic text-gray-600 dark:text-gray-400 my-4; }
.prose :deep(pre) { @apply bg-gray-100 dark:bg-gray-900 p-3 rounded-md overflow-x-auto text-sm; }
.prose :deep(code) { @apply bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-sm; }
.prose :deep(pre) :deep(code) { @apply bg-transparent p-0 rounded-none; }
</style>
