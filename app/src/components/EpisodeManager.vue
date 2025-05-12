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

    <div v-if="uiMessage.text"
         :class="uiMessage.type === 'error' ? 'error-box' : (uiMessage.type === 'success' ? 'success-box' : 'info-box')"
         class="my-4 p-3 rounded-md text-center text-sm">
      {{ uiMessage.text }}
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

          <div class="border-t dark:border-gray-700 pt-4 mt-4">
            <label class="form-label flex items-center">
              <input type="checkbox" v-model="currentEpisode.isNft" @change="toggleNftSection" class="form-checkbox mr-2" />
              This episode is linked to an NFT (requires mint to view full content)
            </label>
          </div>

          <div v-if="currentEpisode.isNft" class="space-y-2 mt-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
            <div v-if="currentEpisode.candyMachineId && !showCandyMachineCreatorForm">
                <label class="form-label">Associated Candy Machine ID:</label>
                <input type="text" :value="currentEpisode.candyMachineId" class="form-input bg-gray-100 dark:bg-gray-600" readonly />
                <button type="button" @click="triggerCandyMachineSetup(true)" class="btn btn-warning btn-xs mt-1">
                    Edit/Recreate CM
                </button>
            </div>
            <div v-else-if="showCandyMachineCreatorForm">
                <p class="text-sm text-gray-600 dark:text-gray-300 mb-2">
                    Setting up a new Candy Machine for: <strong>{{ currentEpisode.episodeName }}</strong>
                </p>
                <CandyMachineCreator
                    :parentTale="parentTale"
                    :currentEpisodeNameFromParent="currentEpisode.episodeName"
                    :episodeImageForNft="uploadedEpisodeImageForNft"
                    :episodeDescriptionForNft="currentEpisode.content"
                    :isWalletManagedExternally="true"
                    @candyMachineCreated="handleCandyMachineCreated"
                    @cancelCandyMachineCreation="showCandyMachineCreatorForm = false"
                />
                <button type="button" @click="showCandyMachineCreatorForm = false" class="btn btn-secondary btn-sm mt-3 w-full">
                    Cancel CM Setup
                </button>
            </div>
            <div v-else>
                 <button type="button" @click="triggerCandyMachineSetup(false)" class="btn btn-info btn-sm">
                    Setup New Candy Machine
                </button>
                <span class="mx-2 text-gray-500 dark:text-gray-400 text-sm">OR</span>
                <input type="text" v-model="manualCandyMachineId" class="form-input inline-w-auto text-sm" placeholder="Enter Existing CM ID" />
                <button type="button" @click="assignManualCandyMachineId" class="btn btn-secondary btn-sm ml-2">Assign</button>
            </div>
          </div>
          <div v-if="!isEpisodeContentLockedForModal">
            <div>
              <label for="episodeContent" class="form-label">Content (Description for Episode/NFT):</label>
              <textarea id="episodeContent" v-model="currentEpisode.content" class="form-textarea h-32"></textarea>
            </div>
            <div class="mt-4">
              <label class="form-label">Episode Images (Max 10, first image used for NFT if applicable):</label>
              <div v-for="(imgUrl, index) in currentEpisode.images" :key="index" class="flex items-center mb-2">
                <input type="url" v-model="currentEpisode.images[index]" class="form-input flex-grow mr-2" placeholder="https://gateway.pinata.cloud/ipfs/..." />
                <button type="button" @click="removeImageField(index)" class="btn btn-danger btn-xs p-1 leading-none">Remove</button>
              </div>
              <button type="button" @click="addImageField" v-if="currentEpisode.images.length < 10" class="btn btn-secondary btn-sm mt-1">
                + Add Image URL
              </button>
              <div class="mt-2">
                  <label for="episodeImageFiles" class="form-label">Or Upload New Images:</label>
                  <input type="file" id="episodeImageFiles" @change="handleImageFilesChange" class="form-file-input" multiple accept="image/*" />
                  <small class="form-text">Selected files will be uploaded to Pinata. URLs will be added above.</small>
                  <div v-if="isUploadingImages" class="mt-2 text-sm text-indigo-600 dark:text-indigo-400">
                      <span class="spinner-inline"></span> Uploading images to Pinata...
                  </div>
              </div>
            </div>
          </div>
          <div v-else class="info-box">
            Content and images for this NFT-linked episode are locked.
            <span v-if="!props.appUser" class="block mt-1">Please connect your wallet and log in.</span>
            <span v-else class="block mt-1">You may need to mint this NFT to view or edit its full content.</span>
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

          <div class="flex justify-end space-x-3 mt-6 pt-4 border-t dark:border-gray-700">
            <button type="button" @click="closeEpisodeModal" class="btn btn-secondary">Cancel</button>
            <button type="submit"
                    :disabled="isSavingEpisode || isUploadingImages || (currentEpisode.isNft && showCandyMachineCreatorForm && !currentEpisode.candyMachineId)"
                    class="btn btn-success">
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
          <h4 class="text-lg font-semibold text-indigo-700 dark:text-indigo-400">{{ episode.episodeName }} (Order: {{episode.order !== undefined ? episode.order : 'N/A'}})</h4>
          
          <p v-if="!isContentLockedForListedEpisode(episode)" class="text-sm text-gray-600 dark:text-gray-400 line-clamp-3" v-html="episode.content ? renderMarkdownMini(episode.content) : 'No content provided.'"></p>
          <div v-else class="text-sm text-gray-500 dark:text-gray-400 italic my-2">
            Full content available after minting this NFT episode.
            <router-link v-if="episode.isNft && episode.candyMachineId" :to="{ name: 'MintPage', params: { candyMachineAddress: episode.candyMachineId } }" class="link ml-1">Mint Now</router-link>
          </div>

          <div class="mt-2">
            <span v-if="episode.isNft" class="tag bg-purple-200 dark:bg-purple-700 text-purple-800 dark:text-purple-100">🔗 NFT-Linked</span>
            <span v-if="episode.isNft && episode.candyMachineId" class="tag bg-teal-200 dark:bg-teal-700 text-teal-800 dark:text-teal-100">
              Ref: {{shortenAddress(episode.candyMachineId, 4)}}
            </span>
            <span class="tag bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200">{{episode.status}}</span>
          </div>

          <div v-if="!isContentLockedForListedEpisode(episode) && episode.images && episode.images.length > 0" class="mt-2 flex flex-wrap gap-2">
            <a v-for="(img, idx) in episode.images" :key="idx" :href="img" target="_blank" class="hover:opacity-80">
              <img :src="img" alt="Episode Image" class="h-16 w-16 object-cover rounded border dark:border-gray-600" @error="setDefaultImage" />
            </a>
          </div>
           <div v-else-if="isContentLockedForListedEpisode(episode) && episode.images && episode.images.length > 0" class="mt-2">
             <img :src="episode.images[0]" @error="setDefaultImage" alt="Episode Thumbnail" class="h-16 w-16 object-cover rounded border dark:border-gray-600 opacity-50" />
             <small class="text-xs text-gray-400 dark:text-gray-500 italic ml-2">More images after mint.</small>
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
import axios from 'axios';
import { uploadFileToIPFS } from '../services/pinataService';
import { marked } from 'marked';
import CandyMachineCreator from './CandyMachineCreator.vue'; // Import the component

const props = defineProps({
  parentTale: { type: Object, required: true },
  appUser: { type: Object, default: null },
  userMintActivities: { type: Array, default: () => [] }
});

const API_BASE_URL = import.meta.env.VITE_APP_AUTH_API_URL || 'http://localhost:3000/api';
const JWT_TOKEN_KEY = 'readium_fun_jwt_token';

const episodes = ref([]);
const isLoadingEpisodes = ref(false);
const showEpisodeModal = ref(false);
const editingEpisode = ref(null);
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
const manualCandyMachineId = ref('');

// State for Candy Machine Creator integration
const showCandyMachineCreatorForm = ref(false);
const uploadedEpisodeImageForNft = ref('');

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
const setDefaultImage = (event) => {
  event.target.src = 'https://placehold.co/100x100/gray/white?text=Error';
};
const renderMarkdownMini = (markdownText) => {
    if (!markdownText) return '';
    const plainText = marked(markdownText, { breaks: true, gfm: true }).replace(/<[^>]+>/g, '');
    return plainText.length > 150 ? plainText.substring(0, 150) + '...' : plainText;
};

const isAuthorAndCreator = computed(() => {
  return props.appUser &&
         props.parentTale &&
         (props.appUser.id === props.parentTale.author?._id || props.appUser.walletAddress === props.parentTale.authorWalletAddress) &&
         props.appUser.type === 'creator';
});

const isEpisodeContentLockedForModal = computed(() => {
  if (!currentEpisode.value.isNft) return false;
  if (isAuthorAndCreator.value) return false; 
  if (!props.appUser || !props.appUser.walletAddress) return true;
  return !props.userMintActivities.some(
    activity => activity.candyMachineId === currentEpisode.value.candyMachineId && // Ensure CM ID exists for check
                currentEpisode.value.candyMachineId && // Add this check
                activity.userWalletAddress === props.appUser.walletAddress
  );
});

const isContentLockedForListedEpisode = (episode) => {
  if (!episode.isNft) return false;
  if (props.appUser && (props.appUser.id === episode.author || props.appUser.walletAddress === episode.authorWalletAddress)) {
      return false;
  }
  if (!props.appUser || !props.appUser.walletAddress) return true;
  return !props.userMintActivities.some(
    activity => activity.candyMachineId === episode.candyMachineId && // Ensure CM ID exists for check
                episode.candyMachineId && // Add this check
                activity.userWalletAddress === props.appUser.walletAddress
  );
};

const episodeApiClient = axios.create({ baseURL: API_BASE_URL });
episodeApiClient.interceptors.request.use(config => {
  const token = localStorage.getItem(JWT_TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
episodeApiClient.interceptors.response.use(
  response => response.data,
  error => {
    const message = error.response?.data?.message || error.message || 'An API error occurred.';
    showUiMessage(message, 'error');
    return Promise.reject(error.response?.data || { message });
  }
);

async function fetchEpisodesForTale() {
  if (!props.parentTale?._id) return;
  isLoadingEpisodes.value = true;
  try {
    const response = await episodeApiClient.get(`/tales/${props.parentTale._id}/episodes`);
    if (response.success) {
      episodes.value = response.data.sort((a, b) => (a.order || 0) - (b.order || 0));
    }
  } finally {
    isLoadingEpisodes.value = false;
  }
}

function toggleNftSection() {
    if (!currentEpisode.value.isNft) {
        showCandyMachineCreatorForm.value = false;
        currentEpisode.value.candyMachineId = '';
    }
    // If isNft is checked, the UI will show options to set up or assign CM ID
}

function triggerCandyMachineSetup(isEditingExistingCm = false) {
    if (currentEpisode.value.images.length === 0) {
        showUiMessage("Please upload or add at least one image for the episode. This image will be used for the NFT.", "warning");
        return;
    }
    uploadedEpisodeImageForNft.value = currentEpisode.value.images[0]; // Use first image

    if(isEditingExistingCm && currentEpisode.value.candyMachineId) {
        console.log("Editing/Recreating CM for existing ID:", currentEpisode.value.candyMachineId);
        // Potentially pre-fill CandyMachineCreator with existing CM details if it supports it
    }
    currentEpisode.value.candyMachineId = ''; // Clear any manually entered ID if creating new
    manualCandyMachineId.value = '';
    showCandyMachineCreatorForm.value = true;
}

function assignManualCandyMachineId() {
    if (manualCandyMachineId.value.trim()) {
        currentEpisode.value.candyMachineId = manualCandyMachineId.value.trim();
        showCandyMachineCreatorForm.value = false;
        manualCandyMachineId.value = '';
        showUiMessage(`Candy Machine ID ${currentEpisode.value.candyMachineId} assigned.`, "success");
    } else {
        showUiMessage("Please enter a valid Candy Machine ID.", "warning");
    }
}

function handleCandyMachineCreated(newCmId) {
  console.log("EpisodeManager received candyMachineCreated event with ID:", newCmId);
  currentEpisode.value.candyMachineId = newCmId;
  showCandyMachineCreatorForm.value = false;
  showUiMessage(`New Candy Machine (${newCmId}) created and assigned to this episode.`, "success");
}

function openEpisodeModal(episodeToEdit = null) {
  if (!isAuthorAndCreator.value) {
    showUiMessage("You are not authorized.", "error");
    return;
  }
  showCandyMachineCreatorForm.value = false;
  uploadedEpisodeImageForNft.value = '';
  manualCandyMachineId.value = '';

  if (episodeToEdit) {
    editingEpisode.value = { ...episodeToEdit };
    currentEpisode.value = {
      episodeName: episodeToEdit.episodeName,
      content: episodeToEdit.content || '',
      images: [...(episodeToEdit.images || [])],
      isNft: episodeToEdit.isNft || false,
      candyMachineId: episodeToEdit.candyMachineId || '',
      order: episodeToEdit.order === undefined ? episodes.value.length : episodeToEdit.order,
      status: episodeToEdit.status || 'draft',
    };
    if (currentEpisode.value.images.length > 0) { // Set image for potential CM creation
        uploadedEpisodeImageForNft.value = currentEpisode.value.images[0];
    }
  } else {
    editingEpisode.value = null;
    currentEpisode.value = defaultEpisode();
    currentEpisode.value.order = episodes.value.length;
  }
  showEpisodeModal.value = true;
}

function closeEpisodeModal() {
  showEpisodeModal.value = false;
  editingEpisode.value = null;
  currentEpisode.value = defaultEpisode();
  showCandyMachineCreatorForm.value = false;
  uploadedEpisodeImageForNft.value = '';
  const fileInput = document.getElementById('episodeImageFiles');
  if (fileInput) fileInput.value = null;
}

async function handleImageFilesChange(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    if (currentEpisode.value.images.length + files.length > 10) {
        showUiMessage("Max 10 images.", "warning");
        return;
    }
    isUploadingImages.value = true;
    showUiMessage(`Uploading ${files.length} image(s)...`, "info", 0);
    const uploadedUrls = [];
    try {
        for (const file of files) {
            const uploadResult = await uploadFileToIPFS(file);
            if (uploadResult.success && uploadResult.imageUrl) {
                uploadedUrls.push(uploadResult.imageUrl);
            } else {
                throw new Error(uploadResult.error || `Failed to upload ${file.name}`);
            }
        }
        currentEpisode.value.images.push(...uploadedUrls);
        if (currentEpisode.value.images.length > 0 && !uploadedEpisodeImageForNft.value) {
            uploadedEpisodeImageForNft.value = currentEpisode.value.images[0];
        }
        showUiMessage(`${uploadedUrls.length} image(s) uploaded.`, "success");
    } catch (uploadError) {
        showUiMessage(`Image upload failed: ${uploadError.message}`, "error");
    } finally {
        isUploadingImages.value = false;
        event.target.value = null;
    }
}

function addImageField() {
  if (currentEpisode.value.images.length < 10) {
    currentEpisode.value.images.push('');
  } else {
    showUiMessage("Max 10 images.", "warning");
  }
}
function removeImageField(index) {
  const removedImage = currentEpisode.value.images.splice(index, 1)[0];
  if (uploadedEpisodeImageForNft.value === removedImage && currentEpisode.value.images.length > 0) {
      uploadedEpisodeImageForNft.value = currentEpisode.value.images[0];
  } else if (currentEpisode.value.images.length === 0) {
      uploadedEpisodeImageForNft.value = '';
  }
}

async function handleSaveEpisode() {
  if (!props.parentTale?._id) {
    showUiMessage("Parent tale missing.", "error");
    return;
  }
  if (currentEpisode.value.isNft && !currentEpisode.value.candyMachineId && !showCandyMachineCreatorForm.value) {
      showUiMessage("For an NFT-linked episode, please set up a new Candy Machine or assign an existing ID.", "warning");
      return;
  }
   if (currentEpisode.value.isNft && showCandyMachineCreatorForm.value && !currentEpisode.value.candyMachineId) {
      showUiMessage("Candy Machine setup is in progress. Please complete or cancel it, or assign an existing ID before saving the episode.", "warning");
      return;
  }


  isSavingEpisode.value = true;
  const payload = {
    ...currentEpisode.value,
    images: currentEpisode.value.images.filter(imgUrl => imgUrl && imgUrl.trim() !== ''),
  };
  if (!payload.isNft) {
    payload.candyMachineId = '';
  }

  try {
    let response;
    if (editingEpisode.value) {
      response = await episodeApiClient.put(`/episodes/${editingEpisode.value._id}`, payload);
      showUiMessage("Episode updated!", "success");
    } else {
      response = await episodeApiClient.post(`/tales/${props.parentTale._id}/episodes`, payload);
      showUiMessage("Episode created!", "success");
    }
    if (response.success) {
      fetchEpisodesForTale();
      closeEpisodeModal();
    }
  } finally {
    isSavingEpisode.value = false;
  }
}

async function confirmDeleteEpisode(episodeId) {
  if (window.confirm("Delete this episode?")) {
    try {
      const response = await episodeApiClient.delete(`/episodes/${episodeId}`);
      if (response.success) {
        showUiMessage("Episode deleted.", "success");
        fetchEpisodesForTale();
      }
    } catch (error) { /* Handled by interceptor */ }
  }
}

watch(() => props.parentTale?._id, (newTaleId, oldTaleId) => {
  if (newTaleId && newTaleId !== oldTaleId) {
    episodes.value = [];
    fetchEpisodesForTale();
  }
}, { immediate: true });

watch(() => props.appUser?.id, (newUserId, oldUserId) => {
    if (newUserId !== oldUserId && props.parentTale?._id) {
        fetchEpisodesForTale();
    }
});
watch(() => props.userMintActivities, () => {
    console.log("User mint activities prop changed in EpisodeManager.");
}, { deep: true });


onMounted(() => {
  if (props.parentTale?._id) {
    fetchEpisodesForTale();
  } else {
    console.warn("EpisodeManager: Parent Tale ID not provided on mount.");
  }
});

</script>

<style scoped>
/* Styles from previous EpisodeManager.vue */
.form-label { @apply block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1; }
.form-input, .form-select, .form-textarea { @apply mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100; }
.form-input.inline-w-auto { @apply w-auto inline-block max-w-xs; } /* Added max-w-xs */
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


.modal-overlay { @apply fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-[60]; }
.modal-content { @apply bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto; }

.image-preview { @apply max-w-[100px] max-h-[100px] mt-2 border border-gray-300 dark:border-gray-600 rounded object-contain; }
.line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.line-clamp-3 { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.tag { @apply inline-block bg-gray-200 dark:bg-gray-700 rounded-full px-2 py-0.5 text-xs font-semibold text-gray-700 dark:text-gray-200 mr-1 mb-1; }
.spinner { @apply inline-block w-8 h-8 border-4 border-t-indigo-600 dark:border-t-indigo-400 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin; }
.spinner-inline { @apply inline-block w-4 h-4 border-2 border-t-indigo-600 dark:border-t-indigo-300 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin ml-2 align-middle; }

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