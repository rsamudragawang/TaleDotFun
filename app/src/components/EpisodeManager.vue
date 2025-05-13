<template>
  <div class="episode-manager-container">
    <h2 class="main-section-title">
      Episodes for "{{ parentTale?.title || 'Tale' }}"
    </h2>

    <div v-if="isAuthorAndCreator" class="add-episode-button-container">
      <button @click="openEpisodeModal()" class="btn btn-primary">
        + Add New Episode
      </button>
    </div>

    <div v-if="uiMessage.text"
         :class="['ui-message', `ui-message-${uiMessage.type}`]">
      {{ uiMessage.text }}
    </div>

    <div v-if="showEpisodeModal" class="modal-overlay">
      <div class="modal-content-wrapper">
        <h3 class="modal-title">
          {{ editingEpisode ? 'Edit Episode' : 'Create New Episode' }}
        </h3>
        <form @submit.prevent="handleSaveEpisode" class="modal-form">
          <div class="form-group">
            <label for="episodeName" class="form-label">Episode Name:</label>
            <input type="text" id="episodeName" v-model="currentEpisode.episodeName" class="form-input" required />
          </div>

          <div class="nft-linking-section">
            <label class="form-label checkbox-label">
              <input type="checkbox" v-model="currentEpisode.isNft" @change="toggleNftSection" class="form-checkbox" />
              This episode is linked to an NFT (requires mint to view full content)
            </label>
          </div>

          <div v-if="currentEpisode.isNft" class="nft-details-section">
            <div v-if="currentEpisode.candyMachineId && !showCandyMachineCreatorForm" class="cm-id-display-wrapper">
                <label class="form-label">Associated Candy Machine ID:</label>
                <input type="text" :value="currentEpisode.candyMachineId" class="form-input form-input-readonly" readonly />
                <button type="button" @click="triggerCandyMachineSetup(true)" class="btn btn-warning btn-xs edit-cm-button">
                    Edit/Recreate CM
                </button>
            </div>
            <div v-else-if="showCandyMachineCreatorForm" class="cm-creator-wrapper">
                <p class="cm-creator-prompt">
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
                <button type="button" @click="showCandyMachineCreatorForm = false" class="btn btn-secondary cancel-cm-button">
                    Cancel CM Setup
                </button>
            </div>
            <div v-else class="cm-setup-options">
                 <button type="button" @click="triggerCandyMachineSetup(false)" class="btn btn-info btn-sm">
                    Setup New Candy Machine
                </button>
                <span class="cm-options-divider">OR</span>
                <input type="text" v-model="manualCandyMachineId" class="form-input manual-cm-input" placeholder="Enter Existing CM ID" />
                <button type="button" @click="assignManualCandyMachineId" class="btn btn-secondary btn-sm assign-cm-button">Assign</button>
            </div>
          </div>
          <div v-if="!isEpisodeContentLockedForModal" class="content-fields-wrapper">
            <div class="form-group">
              <label for="episodeContent" class="form-label">Content (Description for Episode/NFT):</label>
              <textarea id="episodeContent" v-model="currentEpisode.content" class="form-textarea"></textarea>
            </div>
            <div class="image-upload-section">
              <label class="form-label">Episode Images (Max 10, first image used for NFT if applicable):</label>
              <div v-for="(imgUrl, index) in currentEpisode.images" :key="index" class="image-input-row">
                <input type="url" v-model="currentEpisode.images[index]" class="form-input image-url-input" placeholder="https://gateway.pinata.cloud/ipfs/..." />
                <button type="button" @click="removeImageField(index)" class="btn btn-danger btn-xs remove-image-button">Remove</button>
              </div>
              <button type="button" @click="addImageField" v-if="currentEpisode.images.length < 10" class="btn btn-secondary btn-sm add-image-button">
                + Add Image URL
              </button>
              <div class="file-upload-wrapper">
                  <label for="episodeImageFiles" class="form-label">Or Upload New Images:</label>
                  <input type="file" id="episodeImageFiles" @change="handleImageFilesChange" class="form-file-input" multiple accept="image/*" />
                  <small class="form-text">Selected files will be uploaded to Pinata. URLs will be added above.</small>
                  <div v-if="isUploadingImages" class="upload-indicator">
                      <span class="spinner-inline"></span> Uploading images to Pinata...
                  </div>
              </div>
            </div>
          </div>
          <div v-else class="info-box locked-content-message">
            Content and images for this NFT-linked episode are locked.
            <span v-if="!props.appUser" class="login-prompt">Please connect your wallet and log in.</span>
            <span v-else class="login-prompt">You may need to mint this NFT to view or edit its full content.</span>
          </div>

          <div class="form-group">
            <label for="episodeOrder" class="form-label">Order (Optional):</label>
            <input type="number" id="episodeOrder" v-model.number="currentEpisode.order" class="form-input" min="0" />
          </div>
           <div class="form-group">
            <label for="episodeStatus" class="form-label">Status:</label>
            <select id="episodeStatus" v-model="currentEpisode.status" class="form-select">
                <option value="draft">Draft</option>
                <option value="published">Published</option>
            </select>
          </div>

          <div class="modal-actions">
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

    <div v-if="isLoadingEpisodes" class="loading-indicator-list">
      <div class="spinner"></div>
      <p>Loading episodes...</p>
    </div>
    <div v-else-if="episodes.length === 0" class="info-box no-episodes-message">
      This tale has no episodes yet.
      <span v-if="isAuthorAndCreator"> Why not add the first one?</span>
    </div>
    <div v-else class="episodes-grid">
      <div v-for="episode in episodes" :key="episode._id" class="episode-item">
        <div class="episode-item-content">
          <h4 class="episode-name">{{ episode.episodeName }} (Order: {{episode.order !== undefined ? episode.order : 'N/A'}})</h4>
          
          <p v-if="!isContentLockedForListedEpisode(episode)" class="episode-description" v-html="episode.content ? renderMarkdownMini(episode.content) : 'No content provided.'"></p>
          <div v-else class="episode-locked-message">
            Full content available after minting this NFT episode.
            <router-link v-if="episode.isNft && episode.candyMachineId" :to="{ name: 'MintPage', params: { candyMachineAddress: episode.candyMachineId } }" class="link mint-now-link">Mint Now</router-link>
          </div>

          <div class="episode-tags-container">
            <span v-if="episode.isNft" class="tag tag-nft">🔗 NFT-Linked</span>
            <span v-if="episode.isNft && episode.candyMachineId" class="tag tag-cm-ref">
              Ref: {{shortenAddress(episode.candyMachineId, 4)}}
            </span>
            <span class="tag tag-status">{{episode.status}}</span>
          </div>

          <div v-if="!isContentLockedForListedEpisode(episode) && episode.images && episode.images.length > 0" class="episode-image-gallery">
            <a v-for="(img, idx) in episode.images" :key="idx" :href="img" target="_blank" class="episode-image-link">
              <img :src="img" alt="Episode Image" class="episode-thumbnail" @error="setDefaultImage" />
            </a>
          </div>
           <div v-else-if="isContentLockedForListedEpisode(episode) && episode.images && episode.images.length > 0" class="episode-image-teaser">
             <img :src="episode.images[0]" @error="setDefaultImage" alt="Episode Thumbnail" class="episode-thumbnail episode-thumbnail-locked" />
             <small class="image-teaser-text">More images after mint.</small>
          </div>

        </div>
        <div v-if="isAuthorAndCreator" class="episode-actions">
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
/* Main Container */
.episode-manager-container {
  margin-top: 2rem; /* mt-8 */
  padding: 1rem; /* p-4 */
  border: 1px solid #e5e7eb; /* border-gray-200 */
  border-radius: 0.5rem; /* rounded-lg */
}
.dark .episode-manager-container {
  border-color: #374151; /* dark:border-gray-700 */
}
@media (min-width: 768px) { /* md: */
  .episode-manager-container {
    padding: 1.5rem; /* md:p-6 */
  }
}

.main-section-title {
  font-size: 1.5rem; /* text-2xl */
  font-weight: 600; /* font-semibold */
  margin-bottom: 1.5rem; /* mb-6 */
  color: #1f2937; /* text-gray-800 */
}
.dark .main-section-title {
  color: #ffffff; /* dark:text-white */
}

.add-episode-button-container {
  margin-bottom: 1.5rem; /* mb-6 */
  text-align: right;
}

/* UI Message */
.ui-message {
  margin-top: 1rem; /* my-4 */
  margin-bottom: 1rem;
  padding: 0.75rem; /* p-3 */
  border-radius: 0.375rem; /* rounded-md */
  text-align: center;
  font-size: 0.875rem; /* text-sm */
}
/* Specific message types (info, success, error) would extend this */
.ui-message-info {
  background-color: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe;
}
.dark .ui-message-info {
  background-color: rgba(30, 58, 138, 0.3); color: #93c5fd; border-color: rgba(59, 130, 246, 0.5);
}
.ui-message-success {
  background-color: #f0fdf4; color: #166534; border: 1px solid #bbf7d0;
}
.dark .ui-message-success {
  background-color: rgba(22, 101, 52, 0.3); color: #86efac; border-color: rgba(34, 197, 94, 0.5);
}
.ui-message-error {
  background-color: #fef2f2; color: #b91c1c; border: 1px solid #fecaca;
}
.dark .ui-message-error {
  background-color: rgba(153, 27, 27, 0.3); color: #fca5a5; border-color: rgba(220, 38, 38, 0.5);
}


/* Modal Styles */
.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.75); /* bg-black bg-opacity-75 */
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem; /* p-4 */
  z-index: 60; /* z-[60] */
}
.modal-content-wrapper { /* Was modal-content */
  background-color: #ffffff; /* bg-white */
  padding: 1.5rem; /* p-6 */
  border-radius: 0.5rem; /* rounded-lg */
  box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05); /* shadow-xl */
  max-width: 36rem; /* max-w-xl */
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}
.dark .modal-content-wrapper {
  background-color: #1f2937; /* dark:bg-gray-800 */
}
.modal-title {
  font-size: 1.25rem; /* text-xl */
  font-weight: 700; /* font-bold */
  margin-bottom: 1.5rem; /* mb-6 */
  color: #1f2937; /* text-gray-800 */
}
.dark .modal-title {
  color: #ffffff; /* dark:text-white */
}
.modal-form {
  /* Uses form-group for spacing */
}
.modal-form > div:not(:last-child), .modal-form > fieldset:not(:last-child) {
    margin-bottom: 1rem; /* space-y-4 approx */
}


/* Form Elements */
.form-group {
  margin-bottom: 1rem; /* Default spacing between form groups */
}
.form-label {
  display: block;
  font-size: 0.875rem; /* text-sm */
  font-weight: 500; /* font-medium */
  color: #374151; /* text-gray-700 */
  margin-bottom: 0.25rem; /* mb-1 */
}
.dark .form-label {
  color: #d1d5db; /* dark:text-gray-300 */
}
.form-input, .form-select, .form-textarea {
  margin-top: 0.25rem; /* mt-1 */
  display: block;
  width: 100%;
  border-radius: 0.375rem; /* rounded-md */
  border: 1px solid #d1d5db; /* border-gray-300 */
  box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05); /* shadow-sm */
  padding: 0.5rem 0.75rem; /* Vuetify-like padding */
  font-size: 0.875rem; /* sm:text-sm */
  background-color: #ffffff; /* bg-white */
  color: #111827; /* text-gray-900 */
}
.form-input:focus, .form-select:focus, .form-textarea:focus {
  border-color: #4f46e5; /* focus:border-indigo-500 */
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.5); /* focus:ring-indigo-500 */
  outline: none;
}
.dark .form-input, .dark .form-select, .dark .form-textarea {
  border-color: #4b5568; /* dark:border-gray-600 */
  background-color: #374151; /* dark:bg-gray-700 */
  color: #f3f4f6; /* dark:text-gray-100 */
}
.form-textarea {
  min-height: 8rem; /* h-32 */
}
.form-input-readonly {
  background-color: #f3f4f6; /* bg-gray-100 */
}
.dark .form-input-readonly {
  background-color: #4b5568; /* dark:bg-gray-600 */
}

.form-file-input {
  margin-top: 0.25rem; /* mt-1 */
  display: block;
  width: 100%;
  font-size: 0.875rem; /* text-sm */
  color: #6b7280; /* text-gray-500 */
}
.dark .form-file-input {
  color: #9ca3af; /* dark:text-gray-400 */
}
/* Styling file input's button part is tricky and browser-dependent,
   this provides a basic structure. Tailwind's `file:` variant is powerful. */
.form-file-input::file-selector-button {
  margin-right: 1rem; /* file:mr-4 */
  padding: 0.5rem 1rem; /* file:py-2 file:px-4 */
  border-radius: 0.375rem; /* file:rounded-md */
  border-width: 0; /* file:border-0 */
  font-size: 0.875rem; /* file:text-sm */
  font-weight: 600; /* file:font-semibold */
  background-color: #e0e7ff; /* file:bg-indigo-50 */
  color: #4338ca; /* file:text-indigo-700 */
  cursor: pointer;
}
.form-file-input:hover::file-selector-button {
  background-color: #c7d2fe; /* hover:file:bg-indigo-100 */
}
.dark .form-file-input::file-selector-button {
  background-color: #3730a3; /* dark:file:bg-indigo-800 */
  color: #c7d2fe; /* dark:file:text-indigo-300 */
}
.dark .form-file-input:hover::file-selector-button {
  background-color: #4338ca; /* dark:hover:file:bg-indigo-700 */
}

.form-checkbox {
  height: 1rem; /* h-4 */
  width: 1rem; /* w-4 */
  color: #4f46e5; /* text-indigo-600 */
  border: 1px solid #d1d5db; /* border-gray-300 */
  border-radius: 0.25rem; /* rounded */
  margin-right: 0.5rem; /* mr-2 */
}
.form-checkbox:focus {
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.5); /* focus:ring-indigo-500 */
}
.dark .form-checkbox {
  border-color: #6b7280; /* dark:border-gray-500 */
  background-color: #374151; /* dark:bg-gray-700, for checkmark contrast */
}
.checkbox-label { /* for the label containing the checkbox */
    display: flex;
    align-items: center;
}

.form-text {
  font-size: 0.75rem; /* text-xs */
  color: #6b7280; /* text-gray-500 */
  margin-top: 0.25rem; /* mt-1 */
}
.dark .form-text {
  color: #9ca3af; /* dark:text-gray-400 */
}

/* NFT Details Section in Modal */
.nft-linking-section {
  border-top: 1px solid #e5e7eb; /* border-t dark:border-gray-700 */
  padding-top: 1rem; /* pt-4 */
  margin-top: 1rem; /* mt-4 */
}
.dark .nft-linking-section {
  border-color: #374151;
}
.nft-details-section {
  /* space-y-2 approx */
  margin-top: 0.5rem; /* mt-2 */
  padding: 0.75rem; /* p-3 */
  background-color: #f9fafb; /* bg-gray-50 */
  border-radius: 0.375rem; /* rounded-md */
}
.nft-details-section > div:not(:last-child) {
    margin-bottom: 0.5rem;
}
.dark .nft-details-section {
  background-color: rgba(55, 65, 81, 0.5); /* dark:bg-gray-700/50 */
}
.cm-id-display-wrapper .form-input {
  background-color: #f3f4f6; /* bg-gray-100 */
}
.dark .cm-id-display-wrapper .form-input {
  background-color: #4b5568; /* dark:bg-gray-600 */
}
.edit-cm-button {
  margin-top: 0.25rem; /* mt-1 */
}
.cm-creator-wrapper {
  /* Styles for this wrapper if needed */
}
.cm-creator-prompt {
  font-size: 0.875rem; /* text-sm */
  color: #4b5563; /* text-gray-600 */
  margin-bottom: 0.5rem; /* mb-2 */
}
.dark .cm-creator-prompt {
  color: #d1d5db; /* dark:text-gray-300 */
}
.cancel-cm-button {
  margin-top: 0.75rem; /* mt-3 */
  width: 100%;
}
.cm-setup-options {
  display: flex;
  align-items: center;
  gap: 0.5rem; /* For spacing between button, OR, input */
  flex-wrap: wrap; /* Allow wrapping on small screens */
}
.cm-options-divider {
  margin-left: 0.5rem; /* mx-2 */
  margin-right: 0.5rem;
  color: #6b7280; /* text-gray-500 */
  font-size: 0.875rem; /* text-sm */
}
.dark .cm-options-divider {
  color: #9ca3af; /* dark:text-gray-400 */
}
.manual-cm-input {
  display: inline-block; /* inline-w-auto */
  width: auto;
  max-width: 12rem; /* max-w-xs approx */
  font-size: 0.875rem; /* text-sm */
}
.assign-cm-button {
  margin-left: 0.5rem; /* ml-2 */
}


/* Image Upload Section in Modal */
.image-upload-section {
  margin-top: 1rem; /* mt-4 */
}
.image-input-row {
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem; /* mb-2 */
}
.image-url-input {
  flex-grow: 1;
  margin-right: 0.5rem; /* mr-2 */
}
.remove-image-button {
  padding: 0.25rem 0.5rem !important; /* p-1 for btn-xs */
  line-height: 1 !important; /* leading-none for btn-xs */
}
.add-image-button {
  margin-top: 0.25rem; /* mt-1 */
}
.file-upload-wrapper {
  margin-top: 0.5rem; /* mt-2 */
}
.upload-indicator {
  margin-top: 0.5rem; /* mt-2 */
  font-size: 0.875rem; /* text-sm */
  color: #4f46e5; /* text-indigo-600 */
}
.dark .upload-indicator {
  color: #818cf8; /* dark:text-indigo-400 */
}


.locked-content-message { /* Extends .info-box */
  /* Specific styles if needed, otherwise relies on .info-box */
}
.login-prompt {
  display: block;
  margin-top: 0.25rem; /* mt-1 */
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  column-gap: 0.75rem; /* space-x-3 */
  margin-top: 1.5rem; /* mt-6 */
  padding-top: 1rem; /* pt-4 */
  border-top: 1px solid #e5e7eb; /* border-t dark:border-gray-700 */
}
.dark .modal-actions {
  border-color: #374151;
}

/* Episode List Styles */
.loading-indicator-list {
  text-align: center;
  padding: 1.5rem; /* p-6 */
}
.loading-indicator-list p {
  margin-top: 0.5rem; /* mt-2 */
  color: #4b5563; /* text-gray-600 */
}
.dark .loading-indicator-list p {
  color: #d1d5db; /* dark:text-gray-300 */
}
.no-episodes-message { /* Extends .info-box */
  text-align: center;
}
.episodes-grid {
  /* space-y-4 */
}
.episodes-grid > .episode-item:not(:last-child) {
    margin-bottom: 1rem;
}

.episode-item {
  padding: 1rem; /* p-4 */
  background-color: #ffffff; /* bg-white */
  border-radius: 0.5rem; /* rounded-lg */
  box-shadow: 0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px 0 rgba(0,0,0,0.06); /* shadow */
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}
.dark .episode-item {
  background-color: #1f2937; /* dark:bg-gray-800 */
}
.episode-item-content {
  /* Flex grow handled by parent structure */
}
.episode-name {
  font-size: 1.125rem; /* text-lg */
  font-weight: 600; /* font-semibold */
  color: #4f46e5; /* text-indigo-700 */
}
.dark .episode-name {
  color: #818cf8; /* dark:text-indigo-400 */
}
.episode-description {
  font-size: 0.875rem; /* text-sm */
  color: #4b5563; /* text-gray-600 */
  /* line-clamp-2/3 implemented with -webkit properties */
  display: -webkit-box;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
   line-height: 1.4; /* Approximate for line clamping */
}
.line-clamp-3 { /* If used for episode description */
   -webkit-line-clamp: 3;
   max-height: calc(1.4em * 3); /* line-height * number of lines */
}
.line-clamp-2 { /* If used for episode description */
   -webkit-line-clamp: 2;
   max-height: calc(1.4em * 2);
}
.dark .episode-description {
  color: #9ca3af; /* dark:text-gray-400 */
}
.episode-locked-message {
  font-size: 0.875rem; /* text-sm */
  color: #6b7280; /* text-gray-500 */
  font-style: italic;
  margin-top: 0.5rem; /* my-2 */
  margin-bottom: 0.5rem;
}
.dark .episode-locked-message {
  color: #9ca3af; /* dark:text-gray-400 */
}
.mint-now-link {
  margin-left: 0.25rem; /* ml-1 */
}

.episode-tags-container {
  margin-top: 0.5rem; /* mt-2 */
}
.tag {
  display: inline-block;
  background-color: #e5e7eb;
  border-radius: 9999px;
  padding: 0.125rem 0.5rem; /* py-0.5 px-2 */
  font-size: 0.75rem; /* text-xs */
  font-weight: 600; /* font-semibold */
  color: #374151;
  margin-right: 0.25rem; /* mr-1 */
  margin-bottom: 0.25rem; /* mb-1 */
}
.dark .tag {
  background-color: #374151;
  color: #e5e7eb;
}
.tag-nft {
  background-color: #e0e7ff; /* bg-purple-200 (using indigo as example) */
  color: #3730a3; /* text-purple-800 (using indigo) */
}
.dark .tag-nft {
  background-color: #4338ca; /* dark:bg-purple-700 (using indigo) */
  color: #c7d2fe; /* dark:text-purple-100 (using indigo) */
}
.tag-cm-ref {
  background-color: #ccfbf1; /* bg-teal-200 */
  color: #0f766e; /* text-teal-800 */
}
.dark .tag-cm-ref {
  background-color: #134e4a; /* dark:bg-teal-700 */
  color: #99f6e4; /* dark:text-teal-100 */
}
.tag-status {
  /* Uses default .tag styles */
}


.episode-image-gallery {
  margin-top: 0.5rem; /* mt-2 */
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem; /* gap-2 */
}
.episode-image-link:hover {
  opacity: 0.8;
}
.episode-thumbnail {
  height: 4rem; /* h-16 */
  width: 4rem; /* w-16 */
  object-fit: cover;
  border-radius: 0.25rem; /* rounded */
  border: 1px solid #d1d5db; /* border */
}
.dark .episode-thumbnail {
  border-color: #4b5568; /* dark:border-gray-600 */
}
.episode-image-teaser {
  margin-top: 0.5rem; /* mt-2 */
}
.episode-thumbnail-locked {
  opacity: 0.5;
}
.image-teaser-text {
  font-size: 0.75rem; /* text-xs */
  color: #9ca3af; /* text-gray-400 */
  font-style: italic;
  margin-left: 0.5rem; /* ml-2 */
}
.dark .image-teaser-text {
  color: #6b7280; /* dark:text-gray-500 */
}


.episode-actions {
  display: flex;
  flex-direction: column; /* Default mobile: column */
  align-items: flex-end; /* Align to right for column */
  gap: 0.5rem; /* gap-2 */
  margin-top: 0.5rem; /* mt-2 */
  margin-left: 0.5rem; /* ml-2 */
  flex-shrink: 0;
}
@media (min-width: 640px) { /* sm: */
  .episode-actions {
    flex-direction: row; /* sm:flex-row */
    align-items: center; /* sm:items-center */
    margin-top: 0; /* sm:mt-0 */
  }
}

/* Spinner (re-defined for encapsulation, or use global) */
.spinner {
  display: inline-block;
  width: 2rem;
  height: 2rem;
  border-width: 4px;
  border-top-color: #4f46e5;
  border-right-color: transparent;
  border-bottom-color: transparent;
  border-left-color: transparent;
  border-radius: 9999px;
  animation: spin 1s linear infinite;
}
.dark .spinner {
  border-top-color: #818cf8;
}
.spinner-inline {
  display: inline-block;
  width: 1rem; /* w-4 */
  height: 1rem; /* h-4 */
  border-width: 2px;
  border-top-color: #4f46e5; /* text-indigo-600 */
  border-right-color: transparent;
  border-bottom-color: transparent;
  border-left-color: transparent;
  border-radius: 9999px;
  animation: spin 1s linear infinite;
  margin-left: 0.5rem; /* ml-2 */
  vertical-align: middle;
}
.dark .spinner-inline {
  border-top-color: #c7d2fe; /* dark:text-indigo-300 */
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

/* General Button Styles (reusable, consider globalizing) */
.btn {
  padding: 0.5rem 1rem;
  border: 1px solid transparent;
  border-radius: 0.375rem;
  box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05);
  font-size: 0.875rem;
  font-weight: 500;
  color: #ffffff;
  cursor: pointer;
  transition: background-color 0.15s ease-in-out;
}
.btn:focus {
  outline: 2px solid transparent;
  outline-offset: 2px;
  /* Consider box-shadow for focus ring */
}
.btn:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.btn-primary { background-color: #4f46e5; }
.btn-primary:hover { background-color: #4338ca; }
.dark .btn-primary { background-color: #6366f1; }
.dark .btn-primary:hover { background-color: #818cf8; }
.dark .btn-primary:disabled { background-color: #3730a3; opacity: 0.5; }


.btn-secondary { background-color: #6b7280; }
.btn-secondary:hover { background-color: #4b5563; }
.dark .btn-secondary { background-color: #4b5568; }
.dark .btn-secondary:hover { background-color: #374151; }
.dark .btn-secondary:disabled { background-color: #374151; opacity: 0.5; }


.btn-success { background-color: #16a34a; }
.btn-success:hover { background-color: #15803d; }
.dark .btn-success { background-color: #22c55e; }
.dark .btn-success:hover { background-color: #16a34a; }
.dark .btn-success:disabled { background-color: #14532d; opacity: 0.5; }


.btn-danger { background-color: #dc2626; }
.btn-danger:hover { background-color: #b91c1c; }
.dark .btn-danger { background-color: #ef4444; }
.dark .btn-danger:hover { background-color: #f87171; }
.dark .btn-danger:disabled { background-color: #7f1d1d; opacity: 0.5; }


.btn-warning { background-color: #f59e0b; color: #ffffff; }
.btn-warning:hover { background-color: #d97706; }
.dark .btn-warning { background-color: #f59e0b; }
.dark .btn-warning:hover { background-color: #fbbf24; }
.dark .btn-warning:disabled { background-color: #78350f; opacity: 0.5; }


.btn-info { background-color: #3b82f6; }
.btn-info:hover { background-color: #2563eb; }
.dark .btn-info { background-color: #3b82f6; }
.dark .btn-info:hover { background-color: #60a5fa; }
.dark .btn-info:disabled { background-color: #1e3a8a; opacity: 0.5; }


.btn-sm { padding: 0.375rem 0.75rem; font-size: 0.75rem; }
.btn-xs { padding: 0.25rem 0.625rem; font-size: 0.75rem; }

</style>