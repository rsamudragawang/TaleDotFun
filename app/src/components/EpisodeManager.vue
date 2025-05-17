<!-- <template>
  <div class="episode-manager-container">
    <h2 class="main-section-title">
      Episodes for "{{ parentTale?.onChainAccountData?.title || 'Tale' }}"
    </h2>

    <div v-if="isAuthorOfParentTale" class="add-episode-button-container">
      <button @click="openEpisodeModal()" class="btn btn-primary">
        + Add New Episode
      </button>
    </div>

    <div v-if="uiMessage.text"
         :class="['ui-message', `ui-message-${uiMessage.type}`]">
      {{ uiMessage.text }}
       <div v-if="uiMessage.transactionSignature" class="tx-link-container">
        <a :href="getExplorerUrl(uiMessage.transactionSignature)" target="_blank" class="link transaction-link">
          View Transaction
        </a>
      </div>
    </div>

    <div v-if="showEpisodeModal" class="modal-overlay" @click.self="closeEpisodeModal">
      <div class="modal-content-wrapper">
        <button @click="closeEpisodeModal" class="modal-close-button">&times;</button>
        <h3 class="modal-title">
          {{ currentEpisodeForm.editingExistingOnChainEpisode ? 'Edit Episode' : 'Create New Episode' }}
        </h3>
        <form @submit.prevent="handleSaveEpisode" class="modal-form">
          <div class="form-group">
            <label for="episodeName" class="form-label">Episode Name (On-Chain):</label>
            <input type="text" id="episodeName" v-model="currentEpisodeForm.episodeName" class="form-input" required maxlength="100" />
          </div>

          <div class="form-group">
            <label for="episodeThumbnailFile" class="form-label">Episode Thumbnail (Upload to Pinata):</label>
            <input type="file" id="episodeThumbnailFile" @change="handleEpisodeThumbnailFileChange" class="form-file-input" accept="image/*" />
            <img v-if="currentEpisodeForm.thumbnailPreviewUrl" :src="currentEpisodeForm.thumbnailPreviewUrl" alt="Thumbnail Preview" class="image-preview"/>
            <input type="text" v-model="currentEpisodeForm.thumbnailCid" class="form-input form-input-readonly mt-2" placeholder="IPFS CID for Thumbnail (auto-filled)" readonly />
          </div>

          <div class="nft-linking-section">
            <label class="form-label checkbox-label">
              <input type="checkbox" v-model="currentEpisodeForm.isNft" @change="toggleNftSectionInForm" class="form-checkbox" />
              This episode is linked to an NFT
            </label>
          </div>

          <div v-if="currentEpisodeForm.isNft" class="nft-details-section">
            <div v-if="currentEpisodeForm.candyMachineId && !showCandyMachineCreatorFormInModal" class="cm-id-display-wrapper">
                <label class="form-label">Associated Candy Machine ID (On-Chain):</label>
                <input type="text" :value="currentEpisodeForm.candyMachineId" class="form-input form-input-readonly" readonly />
                <button type="button" @click="triggerCandyMachineSetupInModal(true)" class="btn btn-warning btn-xs edit-cm-button">
                    Edit/Recreate CM
                </button>
            </div>
            <div v-else-if="showCandyMachineCreatorFormInModal" class="cm-creator-wrapper">
                <p class="cm-creator-prompt">
                    Setting up a new Candy Machine for: <strong>{{ currentEpisodeForm.episodeName }}</strong>
                </p>
                <CandyMachineCreator
                    :parentTale="parentTale.onChainAccountData"
                    :currentEpisodeNameFromParent="currentEpisodeForm.episodeName"
                    :episodeImageForNft="uploadedEpisodeImageForNftModal" 
                    :episodeDescriptionForNft="currentEpisodeForm.contentMarkdown"
                    :isWalletManagedExternally="true"
                    @candyMachineCreated="handleCandyMachineCreatedInModal"
                    @cancelCandyMachineCreation="showCandyMachineCreatorFormInModal = false"
                />
                <button type="button" @click="showCandyMachineCreatorFormInModal = false" class="btn btn-secondary cancel-cm-button">
                    Cancel CM Setup
                </button>
            </div>
            <div v-else class="cm-setup-options">
                <button type="button" @click="triggerCandyMachineSetupInModal(false)" class="btn btn-info btn-sm">
                    Setup New Candy Machine
                </button>
                <span class="cm-options-divider">OR</span>
                <input type="text" v-model="manualCandyMachineIdModal" class="form-input manual-cm-input" placeholder="Enter Existing CM ID" />
                <button type="button" @click="assignManualCandyMachineIdInModal" class="btn btn-secondary btn-sm assign-cm-button">Assign</button>
            </div>
          </div>

          <div class="content-fields-wrapper">
            <div class="form-group">
              <label for="episodeContent" class="form-label">Content (Markdown for IPFS):</label>
              <textarea id="episodeContent" v-model="currentEpisodeForm.contentMarkdown" class="form-textarea"></textarea>
            </div>
            <div class="image-upload-section">
              <label class="form-label">Episode Images (URLs/CIDs managed by backend, max 10):</label>
              <div v-for="(imgUrl, index) in currentEpisodeForm.images" :key="index" class="image-input-row">
                <input type="url" v-model="currentEpisodeForm.images[index]" class="form-input image-url-input" placeholder="https://gateway.pinata.cloud/ipfs/..." />
                <button type="button" @click="removeImageFieldInForm(index)" class="btn btn-danger btn-xs remove-image-button">Remove</button>
              </div>
              <button type="button" @click="addImageFieldInForm" v-if="currentEpisodeForm.images.length < 10" class="btn btn-secondary btn-sm add-image-button">
                + Add Image URL/CID
              </button>
              <div class="file-upload-wrapper">
                  <label for="episodeImageFilesModal" class="form-label">Or Upload New Images to Pinata:</label>
                  <input type="file" id="episodeImageFilesModal" @change="handleImageFilesChangeInModal" class="form-file-input" multiple accept="image/*" />
                  <small class="form-text">Selected files will be uploaded. URLs will be added above.</small>
                  <div v-if="isUploadingImagesModal" class="upload-indicator">
                      <span class="spinner-inline"></span> Uploading images...
                  </div>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label for="episodeOrder" class="form-label">Order (On-Chain):</label>
            <input type="number" id="episodeOrder" v-model.number="currentEpisodeForm.order" class="form-input" min="0" />
          </div>
          <div class="form-group">
            <label for="episodeStatus" class="form-label">Status (On-Chain):</label>
            <select id="episodeStatus" v-model.number="currentEpisodeForm.status" class="form-select">
              <option value="0">Draft</option>
              <option value="1">Published</option>
              <option value="2">Scheduled</option>
              <option value="3">Archived</option>
            </select>
          </div>
          <div v-if="currentEpisodeForm.status === 2" class="scheduling-fields form-fieldset">
                 <legend class="form-legend">Scheduling</legend>
                <div class="form-group">
                    <label for="publishAtTime" class="form-label">Publish At (UTC):</label>
                    <input type="datetime-local" id="publishAtTime" v-model="currentEpisodeForm.publishAtTime" class="form-input">
                </div>
                <div class="form-group">
                    <label for="unpublishAtTime" class="form-label">Unpublish At (Optional, UTC):</label>
                    <input type="datetime-local" id="unpublishAtTime" v-model="currentEpisodeForm.unpublishAtTime" class="form-input">
                </div>
            </div>


          <div class="modal-actions">
            <button type="button" @click="closeEpisodeModal" class="btn btn-secondary">Cancel</button>
            <button type="submit"
                    :disabled="isSavingEpisode || isUploadingImagesModal || isUploadingEpisodeThumbnail || (currentEpisodeForm.isNft && showCandyMachineCreatorFormInModal && !currentEpisodeForm.candyMachineId)"
                    class="btn btn-success">
              {{ isSavingEpisode ? 'Saving...' : (currentEpisodeForm.editingExistingOnChainEpisode ? 'Update Episode' : 'Create Episode') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="isLoadingEpisodes" class="loading-indicator-list">
      <div class="spinner"></div>
      <p>Loading episodes...</p>
    </div>
    <div v-else-if="combinedEpisodes.length === 0 && parentTale?.onChainAccountData" class="info-box no-episodes-message">
      This tale has no episodes yet.
      <span v-if="isAuthorOfParentTale"> Why not add the first one?</span>
    </div>
    <div v-else-if="!parentTale?.onChainAccountData" class="info-box no-episodes-message">
        Parent tale data not available. Ensure `TaleDetailView` is passing the correct `parentTale` prop.
    </div>
    <div v-else class="episodes-grid">
      <div v-for="episode in combinedEpisodes" :key="episode.onChainPda" class="episode-item">
        <div class="episode-item-content">
          <img v-if="episode.thumbnailCid" :src="`https://gateway.pinata.cloud/ipfs/${episode.thumbnailCid}`" @error="setDefaultImage" alt="Episode Thumbnail" class="episode-main-thumbnail"/>
          <img v-else src="https://placehold.co/400x225/gray/white?text=No+Thumbnail" alt="Default Episode Thumbnail" class="episode-main-thumbnail"/>

          <h4 class="episode-name">{{ episode.name }} (Order: {{episode.order !== undefined ? episode.order : 'N/A'}})</h4>
          
          <p v-if="!isContentLockedForDisplay(episode)" class="episode-description" v-html="episode.contentPreview ? renderMarkdownMini(episode.contentPreview) : 'No content preview.'"></p>
          <div v-else class="episode-locked-message">
            Full content available after minting this NFT episode.
            <router-link v-if="episode.isNft && episode.candyMachineId" :to="{ name: 'MintPage', params: { candyMachineAddress: episode.candyMachineId, episodeOnChainPda: episode.onChainPda } }" class="link mint-now-link">Mint Now</router-link>
          </div>

          <div class="episode-tags-container">
            <span v-if="episode.isNft" class="tag tag-nft">🔗 NFT-Linked</span>
            <span v-if="episode.isNft && episode.candyMachineId" class="tag tag-cm-ref">
              CM: {{shortenAddress(episode.candyMachineId, 4)}}
            </span>
            <span class="tag tag-status">{{ getStatusString(episode.status) }}</span>
            <span v-if="!episode.backendImagesSynced" class="tag tag-warning">Images Not Synced</span>
             <span class="tag tag-likes">❤️ {{ episode.likeCount?.toString() || 0 }}</span>
          </div>

           <div v-if="episode.publishAtTime" class="episode-schedule-info">
                Scheduled Publish: {{ formatDateTime(episode.publishAtTime) }}
            </div>
            <div v-if="episode.unpublishAtTime" class="episode-schedule-info">
                Scheduled Unpublish: {{ formatDateTime(episode.unpublishAtTime) }}
            </div>


          <div v-if="!isContentLockedForDisplay(episode) && episode.images && episode.images.length > 0" class="episode-image-gallery">
            <a v-for="(img, idx) in episode.images" :key="idx" :href="img" target="_blank" class="episode-image-link">
              <img :src="img" alt="Episode Image" class="episode-thumbnail" @error="setDefaultImage" />
            </a>
          </div>
            <div v-else-if="isContentLockedForDisplay(episode) && episode.images && episode.images.length > 0" class="episode-image-teaser">
            <img :src="episode.images[0]" @error="setDefaultImage" alt="Episode Thumbnail" class="episode-thumbnail episode-thumbnail-locked" />
            <small class="image-teaser-text">More images after mint.</small>
          </div>
        </div>
        <div class="episode-actions-footer">
            <button @click="handleLikeEpisode(episode.onChainPda)" class="btn btn-like btn-xs" :disabled="isLikingEpisode[episode.onChainPda]">
                <span v-if="isLikingEpisode[episode.onChainPda]" class="spinner-inline-xs"></span> 👍 Like
            </button>
            <div v-if="isAuthorOfParentTale" class="author-actions">
                <button @click="openEditModal(episode)" class="btn btn-warning btn-xs">Edit</button>
                <button @click="confirmDeleteCombinedEpisode(episode)" class="btn btn-danger btn-xs">Delete</button>
            </div>
        </div>
      </div>
    </div>
  </div>
</template> -->
<!-- <template>
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
    <div class="lg:col-span-2">
      <div class="flex items-center gap-3 mb-4">
        <h2 class="text-xl font-bold">Chapter Lists</h2>
        <span class="bg-gray-800 text-white text-xs px-3 py-1 rounded-full">{{ combinedEpisodes.length }} Chapter</span>
      </div>

      <div class="space-y-4">
        
        <div v-for="episode in combinedEpisodes" :key="episode.onChainPda" class="episode-item">
          <div class="bg-gray-900/30 backdrop-blur-sm rounded-lg p-3 flex items-center">
            <img 
              v-if="episode.thumbnailCid" :src="`https://gateway.pinata.cloud/ipfs/${episode.thumbnailCid}`"
              alt="Chapter thumbnail" 
              class="w-16 h-16 rounded-md object-cover mr-4"
            />
            <div class="flex-grow">
              <div class="flex items-center gap-2 mb-1">
                <span class="bg-pink-500 text-white text-xs px-2 py-0.5 rounded-full">Chapter {{episode.order !== undefined ? episode.order : 'N/A'}}</span>
                <div class="flex items-center text-gray-400 text-xs">
                  <span class="i-lucide-calendar text-xs mr-1"></span>
                  <span>15 April</span>
                </div>
              </div>
              <h3 class="font-medium">{{ episode.name }}</h3>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-sm text-gray-300">{{ episode.likeCount }} Like</span>
              <div class="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                <span class="i-lucide-check text-white text-sm"></span>
              </div>
            </div>
          </div>
        </div>  
        
      </div>
    </div>

    <div>
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-bold">NFTs Collection</h2>
      </div>
      
      <div class="mb-2">
        <div class="flex items-center gap-2">
          <span class="text-sm">Total</span>
          <div class="flex items-center gap-1">
            <span class="i-lucide-image text-green-500"></span>
            <span class="text-sm">3 NFTs</span>
          </div>
        </div>
      </div>
      
      <div class="bg-gray-900/30 backdrop-blur-sm rounded-xl p-4">
        <div class="bg-teal-400 rounded-lg p-4 mb-4">
          <img 
            src="" 
            alt="NFT" 
            class="w-full aspect-square object-cover rounded-md mb-2"
          />
          <h3 class="text-center font-medium text-gray-800">The Heroic With Timun</h3>
        </div>
        
        <button class="w-full bg-purple-600 hover:bg-purple-500 text-white py-3 rounded-lg font-medium transition mb-4">
          Mint Now
        </button>
        
        <div class="flex items-center justify-between">
          <button class="text-gray-400 hover:text-white">
            <span class="i-lucide-chevron-left text-xl"></span>
          </button>
          <span class="text-sm">1/3 NFTs</span>
          <button class="text-gray-400 hover:text-white">
            <span class="i-lucide-chevron-right text-xl"></span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template> -->
<template>
  <div class="mt-[50px]">
    <div class="flex gap-4">
      <div class="flex-3">
        <div class="flex items-center gap-8">
          <h1 class="text-white text-2xl font-bold">Chapter Lists</h1>
          <div class="bg-[#BB3FDA]/20 py-1 px-2 text-white rounded-full text-sm border border-slate-400">{{
            combinedEpisodes.length }}
            Chapter
          </div>
        </div>
        <div class="mt-6 rounded-lg bg-gradient-to-r from-[#372754] to-[#2a1d40/50] p-4 border border-white/5"
          v-for="episode in combinedEpisodes" :key="episode.onChainPda">
          <div class="flex items-center gap-2 justify-between cursor" @click="ModalShow(episode)">
            <div class="flex items-center gap-4">
              <img v-if="episode.thumbnailCid" :src="`https://gateway.pinata.cloud/ipfs/${episode.thumbnailCid}`"
                alt="comic" class="w-[64px] h-[64px] object-cover rounded-lg">
              <div>
                <div class="flex items-center gap-8">
                  <div class="bg-[#BB3FDA] py-1 px-2 text-white rounded-full text-sm border border-white">
                    Chapter {{ episode.order !== undefined ? episode.order : 'N/A' }}</div>
                  <div class="flex items-center gap-2">
                    <i class="pi pi-calendar"></i>
                    <p class="text-white/40 text-sm">{{ new Date(parseInt(episode.rawOnChainData.timestamp) *
                      1000).toLocaleString() }}</p>
                  </div>
                </div>
                <h1 class="text-white text-lg font-bold mt-2">{{ episode.name }}</h1>
              </div>
            </div>
            <div class="flex items-center gap-4">
              <div class="px-4 py-1 bg-white/5 rounded-full font-medium">{{ episode.likeCount }} Like</div>
              <img src="/public/icons/checklist.svg" alt="checklist" class="w-6 h-6">
            </div>

          </div>
        </div>
      </div>
      <div v-if="showEpisodeModal" class="modal-overlay" @click.self="closeEpisodeModal">
      <div class="modal-content-wrapper">
        <img :src="selectedEpisode.images[indexModal]"/>
        <div class="flex justify-between mt-2">
          <button  class="btn btn-primary" @click="previous()">Previous</button>
          <button  class="btn btn-primary" @click="next()">Next</button>
        </div>
        <div class="flex justify-center">

          <button @click="handleLikeEpisode(selectedEpisode.onChainPda)" class="btn btn-primary justify-center">Like this episode</button>
        </div>
        <!-- <button @click="closeEpisodeModal" class="modal-close-button">&times;</button>
        <h3 class="modal-title">
          {{ currentEpisodeForm.editingExistingOnChainEpisode ? 'Edit Episode' : 'Create New Episode' }}
        </h3>
        <form @submit.prevent="handleSaveEpisode" class="modal-form">
          <div class="form-group">
            <label for="episodeName" class="form-label">Episode Name (On-Chain):</label>
            <input type="text" id="episodeName" v-model="currentEpisodeForm.episodeName" class="form-input" required maxlength="100" />
          </div>

          <div class="form-group">
            <label for="episodeThumbnailFile" class="form-label">Episode Thumbnail (Upload to Pinata):</label>
            <input type="file" id="episodeThumbnailFile" @change="handleEpisodeThumbnailFileChange" class="form-file-input" accept="image/*" />
            <img v-if="currentEpisodeForm.thumbnailPreviewUrl" :src="currentEpisodeForm.thumbnailPreviewUrl" alt="Thumbnail Preview" class="image-preview"/>
            <input type="text" v-model="currentEpisodeForm.thumbnailCid" class="form-input form-input-readonly mt-2" placeholder="IPFS CID for Thumbnail (auto-filled)" readonly />
          </div>

          <div class="nft-linking-section">
            <label class="form-label checkbox-label">
              <input type="checkbox" v-model="currentEpisodeForm.isNft" @change="toggleNftSectionInForm" class="form-checkbox" />
              This episode is linked to an NFT
            </label>
          </div>

          <div v-if="currentEpisodeForm.isNft" class="nft-details-section">
            <div v-if="currentEpisodeForm.candyMachineId && !showCandyMachineCreatorFormInModal" class="cm-id-display-wrapper">
                <label class="form-label">Associated Candy Machine ID (On-Chain):</label>
                <input type="text" :value="currentEpisodeForm.candyMachineId" class="form-input form-input-readonly" readonly />
                <button type="button" @click="triggerCandyMachineSetupInModal(true)" class="btn btn-warning btn-xs edit-cm-button">
                    Edit/Recreate CM
                </button>
            </div>
            <div v-else-if="showCandyMachineCreatorFormInModal" class="cm-creator-wrapper">
                <p class="cm-creator-prompt">
                    Setting up a new Candy Machine for: <strong>{{ currentEpisodeForm.episodeName }}</strong>
                </p>
                <CandyMachineCreator
                    :parentTale="parentTale.onChainAccountData"
                    :currentEpisodeNameFromParent="currentEpisodeForm.episodeName"
                    :episodeImageForNft="uploadedEpisodeImageForNftModal" 
                    :episodeDescriptionForNft="currentEpisodeForm.contentMarkdown"
                    :isWalletManagedExternally="true"
                    @candyMachineCreated="handleCandyMachineCreatedInModal"
                    @cancelCandyMachineCreation="showCandyMachineCreatorFormInModal = false"
                />
                <button type="button" @click="showCandyMachineCreatorFormInModal = false" class="btn btn-secondary cancel-cm-button">
                    Cancel CM Setup
                </button>
            </div>
            <div v-else class="cm-setup-options">
                <button type="button" @click="triggerCandyMachineSetupInModal(false)" class="btn btn-info btn-sm">
                    Setup New Candy Machine
                </button>
                <span class="cm-options-divider">OR</span>
                <input type="text" v-model="manualCandyMachineIdModal" class="form-input manual-cm-input" placeholder="Enter Existing CM ID" />
                <button type="button" @click="assignManualCandyMachineIdInModal" class="btn btn-secondary btn-sm assign-cm-button">Assign</button>
            </div>
          </div>

          <div class="content-fields-wrapper">
            <div class="form-group">
              <label for="episodeContent" class="form-label">Content (Markdown for IPFS):</label>
              <textarea id="episodeContent" v-model="currentEpisodeForm.contentMarkdown" class="form-textarea"></textarea>
            </div>
            <div class="image-upload-section">
              <label class="form-label">Episode Images (URLs/CIDs managed by backend, max 10):</label>
              <div v-for="(imgUrl, index) in currentEpisodeForm.images" :key="index" class="image-input-row">
                <input type="url" v-model="currentEpisodeForm.images[index]" class="form-input image-url-input" placeholder="https://gateway.pinata.cloud/ipfs/..." />
                <button type="button" @click="removeImageFieldInForm(index)" class="btn btn-danger btn-xs remove-image-button">Remove</button>
              </div>
              <button type="button" @click="addImageFieldInForm" v-if="currentEpisodeForm.images.length < 10" class="btn btn-secondary btn-sm add-image-button">
                + Add Image URL/CID
              </button>
              <div class="file-upload-wrapper">
                  <label for="episodeImageFilesModal" class="form-label">Or Upload New Images to Pinata:</label>
                  <input type="file" id="episodeImageFilesModal" @change="handleImageFilesChangeInModal" class="form-file-input" multiple accept="image/*" />
                  <small class="form-text">Selected files will be uploaded. URLs will be added above.</small>
                  <div v-if="isUploadingImagesModal" class="upload-indicator">
                      <span class="spinner-inline"></span> Uploading images...
                  </div>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label for="episodeOrder" class="form-label">Order (On-Chain):</label>
            <input type="number" id="episodeOrder" v-model.number="currentEpisodeForm.order" class="form-input" min="0" />
          </div>
          <div class="form-group">
            <label for="episodeStatus" class="form-label">Status (On-Chain):</label>
            <select id="episodeStatus" v-model.number="currentEpisodeForm.status" class="form-select">
              <option value="0">Draft</option>
              <option value="1">Published</option>
              <option value="2">Scheduled</option>
              <option value="3">Archived</option>
            </select>
          </div>
          <div v-if="currentEpisodeForm.status === 2" class="scheduling-fields form-fieldset">
                 <legend class="form-legend">Scheduling</legend>
                <div class="form-group">
                    <label for="publishAtTime" class="form-label">Publish At (UTC):</label>
                    <input type="datetime-local" id="publishAtTime" v-model="currentEpisodeForm.publishAtTime" class="form-input">
                </div>
                <div class="form-group">
                    <label for="unpublishAtTime" class="form-label">Unpublish At (Optional, UTC):</label>
                    <input type="datetime-local" id="unpublishAtTime" v-model="currentEpisodeForm.unpublishAtTime" class="form-input">
                </div>
            </div>


          <div class="modal-actions">
            <button type="button" @click="closeEpisodeModal" class="btn btn-secondary">Cancel</button>
            <button type="submit"
                    :disabled="isSavingEpisode || isUploadingImagesModal || isUploadingEpisodeThumbnail || (currentEpisodeForm.isNft && showCandyMachineCreatorFormInModal && !currentEpisodeForm.candyMachineId)"
                    class="btn btn-success">
              {{ isSavingEpisode ? 'Saving...' : (currentEpisodeForm.editingExistingOnChainEpisode ? 'Update Episode' : 'Create Episode') }}
            </button>
          </div>
        </form> -->
      </div>
    </div>
      <div class="flex-2">
        <div v-if="isAuthorOfParentTale" class="add-episode-button-container">
          <button @click="redirectToEpisode()" class="btn btn-primary">
            + Add New Episode
          </button>
        </div>
        <h1 class="text-white text-2xl font-bold">NFTs Collection</h1>
        <div
          class="mt-6 rounded-lg bg-gradient-to-r from-[#372754] to-[#2a1d40/20] p-4 flex items-center gap-8 justify-between border border-white/5">
          <p class="text-slate-400 text-sm">Total</p>
          <div class="w-[50%] h-[2px] bg-slate-400/5 rounded-full"></div>
          <div class="flex items-center gap-2">
            <img src="/public/icons/nft.svg" alt="nft" class="w-6 h-6">
            <p class="text-white text-sm">{{ listedNfts?.length }} NFTs</p>
          </div>
        </div>
        <div class="bg-[#1F1F1F] rounded-lg p-4 mt-8">
          <div class="relative">
            <img :src="listedNfts?.[showedNftIndex]?.image" class="w-full">
            <div class="absolute bottom-4 right-4 text-white text-lg p-4 bg-black/80 rounded-lg">
              {{ listedNfts?.[showedNftIndex]?.name }}
            </div>
          </div>

          <Button @click="handleMint(listedNfts?.[showedNftIndex], showedNftIndex)" label="Mint Now"
            class="w-full mt-4" />
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, defineProps } from 'vue';
import axios from 'axios';
import { marked } from 'marked';
import { useWallet } from 'solana-wallets-vue';
import { Connection, PublicKey, SystemProgram } from '@solana/web3.js';
import { Program, AnchorProvider, BN, utils } from '@coral-xyz/anchor'; // Added BN and utils
import { Buffer } from 'buffer';
import { v4 as uuidv4 } from 'uuid';
import Button from 'primevue/button';

import CandyMachineCreator from './CandyMachineCreator.vue';
import { uploadFileToIPFS, uploadTextToIPFS } from '../services/pinataService';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import {
  mplCandyMachine,
  fetchCandyMachine,
  mintV2,
  fetchCandyGuard
} from '@metaplex-foundation/mpl-candy-machine';
import {
  generateSigner,
  transactionBuilder,
  publicKey as umiPublicKey,
  some as umiSome,
  // sol as umiSol // Not directly used for solPayment value construction here
} from '@metaplex-foundation/umi';
import { walletAdapterIdentity } from '@metaplex-foundation/umi-signer-wallet-adapters';
import { setComputeUnitLimit } from '@metaplex-foundation/mpl-toolbox';
import { useRouter } from 'vue-router';

// For Vue Router
const router = useRouter();
const props = defineProps({
  parentTale: {
    type: Object,
    required: true,
    validator: (value) => value && typeof value.onChainPdaString === 'string' && typeof value.onChainAccountData === 'object' && value.onChainAccountData.author && (value.mongoId === null || value.mongoId === undefined || typeof value.mongoId === 'string')
  },
  appUser: { type: Object, default: null },
  userMintActivities: { type: Array, default: () => [] }
});
const listedNfts = ref([]);
const showedNftIndex = ref(0)
// --- Configuration ---
const API_BASE_URL = import.meta.env.VITE_APP_AUTH_API_URL || 'http://localhost:3000/api';
const JWT_TOKEN_KEY = 'readium_fun_jwt_token';
const SOLANA_RPC_URL = import.meta.env.VITE_RPC_ENDPOINT || 'https://api.devnet.solana.com';
import idlFromFile from '../anchor/tale_story.json';
const PROGRAM_ID = new PublicKey(idlFromFile.address);
const idl = idlFromFile;
import idlFromFileNft from '../anchor/tale_nft' // Adjust path as necessary
const READIUM_FUN_PROGRAM_ID_NFT = new PublicKey(idlFromFileNft.address); // Your Program ID from IDL
const MAX_ONCHAIN_EPISODE_ID_SEED_LENGTH = 32;

// --- Wallet and Program ---
const wallet = useWallet();
const connection = new Connection(SOLANA_RPC_URL, "confirmed");
let provider;
let program;
let programNft;
// --- Component State ---
const fetchedOnChainEpisodes = ref([]);
const backendImageLinks = ref(new Map());
const isLoadingEpisodes = ref(false);
const userOnChainMintActivities = ref([]); // Assuming this is still relevant for content locking
const isLoadingUserMintActivities = ref(false);
const indexModal = ref(0)
const showEpisodeModal = ref(false);
const isSavingEpisode = ref(false);
const isUploadingImagesModal = ref(false);
const isUploadingEpisodeThumbnail = ref(false); // New state
const isLikingEpisode = ref({}); // To track liking status per episode: { [pdaString]: boolean }

const defaultEpisodeForm = () => ({
  editingExistingOnChainEpisode: false,
  episodeOnChainPdaToEdit: null,
  onChainEpisodeIdSeed: '',
  imageSetId: null,
  episodeName: '',
  contentMarkdown: '',
  originalContentMarkdown: '',
  thumbnailCid: '',                 // New
  thumbnailImageFile: null,         // New
  thumbnailPreviewUrl: '',          // New
  order: 0,
  status: 0, // Default to Draft
  isNft: false,
  candyMachineId: '',
  images: [],
  publishAtTime: '', // Store as ISO string from datetime-local
  unpublishAtTime: '', // Store as ISO string from datetime-local
});
const currentEpisodeForm = ref(defaultEpisodeForm());

const showCandyMachineCreatorFormInModal = ref(false);
const uploadedEpisodeImageForNftModal = ref('');
const manualCandyMachineIdModal = ref('');
const uiMessage = ref({ text: '', type: 'info', transactionSignature: null });
const selectedEpisode = ref('')
// --- Computed Properties ---
const isAuthorOfParentTale = computed(() => props.appUser && props.parentTale?.onChainAccountData?.author?.toString() === props.appUser.walletAddress);



const combinedEpisodes = computed(() => {
  return fetchedOnChainEpisodes.value.map(ocEpisode => {
    const episodePdaString = ocEpisode.publicKey.toString();
    const imagesFromBackend = backendImageLinks.value.get(episodePdaString) || [];
    return {
      onChainPda: episodePdaString,
      onChainEpisodeIdSeed: ocEpisode.account.episodeIdSeed,
      parentTaleOnChainPda: ocEpisode.account.parentTale.toString(),
      name: ocEpisode.account.episodeName,
      contentCid: ocEpisode.account.contentCid,
      thumbnailCid: ocEpisode.account.thumbnailCid, // New
      likeCount: ocEpisode.account.likeCount,       // New
      contentPreview: ocEpisode.account.contentCid ? `Content on IPFS: ${ocEpisode.account.contentCid}` : 'No content',
      order: ocEpisode.account.order,
      status: ocEpisode.account.status, // This is the enum object
      isNft: ocEpisode.account.isNft,
      candyMachineId: ocEpisode.account.candyMachineId,
      imageSetId: ocEpisode.account.imageSetId,
      author: ocEpisode.account.author,
      images: imagesFromBackend,
      backendImagesSynced: backendImageLinks.value.has(episodePdaString),
      publishAtTime: ocEpisode.account.publishAtTime, // BN or null
      unpublishAtTime: ocEpisode.account.unpublishAtTime, // BN or null
      rawOnChainData: ocEpisode.account
    };
  }).sort((a, b) => a.order - b.order);
});

function redirectToEpisode() {
  router.push({ name: 'AddEpisode', param: { id: 'testing' } })
}
async function handleMint(nft, index) {
  if (!wallet.connected.value || !wallet.publicKey.value) {
    alert('Please connect your wallet to mint');
    return;
  }

  if (!nft.itemsRemaining) {
    alert('This NFT collection is sold out');
    return;
  }

  listedNfts.value[index].isMinting = true;

  try {
    const umi = createUmi(SOLANA_RPC_URL)
      .use(walletAdapterIdentity(wallet.wallet.value.adapter))
      .use(mplCandyMachine());

    const candyMachine = await fetchCandyMachine(
      umi,
      umiPublicKey(nft.candyMachineAddress)
    );

    const candyGuard = await fetchCandyGuard(
      umi,
      candyMachine.mintAuthority
    );

    const nftMintSigner = generateSigner(umi);

    const builder = transactionBuilder()
      .add(setComputeUnitLimit(umi, { units: 800_000 }))
      .add(
        mintV2(umi, {
          candyMachine: candyMachine.publicKey,
          nftMint: nftMintSigner,
          collectionMint: candyMachine.collectionMint,
          collectionUpdateAuthority: candyMachine.authority,
          candyGuard: candyGuard.publicKey, // candyGuard should always exist for v2 mint
          mintArgs: {
            solPayment: umiSome({ destination: candyGuard.guards.solPayment.value.destination }),
            // Add other guard arguments if needed, e.g., for tokenPayment, allowList, etc.
          },
        })
      );

    const result = await builder.sendAndConfirm(umi, {
      confirm: { commitment: 'confirmed' }
    });

    const nftMintWeb3 = new PublicKey(nftMintSigner.publicKey.toString());
    const userWalletWeb3 = new PublicKey(wallet.publicKey.value.toString());
    const candyMachineIdWeb3 = new PublicKey(candyMachine.publicKey.toString());


    // Correct PDA derivation for mint_activity_account
    const [mintActivityPDA, _mintActivityBump] = await PublicKey.findProgramAddress(
      [
        Buffer.from("mint_activity"),
        userWalletWeb3.toBuffer(),
        nftMintWeb3.toBuffer() // <--- Use the unique NFT mint address here
      ],
      TALE_NFT_PROGRAM_ID
    );

    console.log("Derived mintActivityPDA:", mintActivityPDA.toString());
    console.log("Using candyMachineId for PDA seed:", candyMachineIdWeb3.toString());
    console.log("Calling logMintActivity with arguments:");
    console.log("  candy_machine_id_arg:", candyMachineIdWeb3.toString());
    console.log("  transaction_signature_str:", result.signature.toString()); // Ensure it's a string
    console.log("  episode_on_chain_pda_option:", undefined);
    console.log("Accounts for logMintActivity:");
    console.log("  mintActivityAccount:", mintActivityPDA.toString());
    console.log("  nftMintAddress:", nftMintWeb3.toString());
    console.log("  userWallet:", userWalletWeb3.toString());


    const provider = new AnchorProvider(connection, wallet.wallet.value.adapter, AnchorProvider.defaultOptions());
    const program = new Program(taleNftIdl, provider);


    await program.methods
      .logMintActivity(
        candyMachineIdWeb3, // candy_machine_id_arg (Pubkey)
        Buffer.from(result.signature).toString('base64'), // transaction_signature_str (String) - ensure it's correctly formatted if not already a string
        null // episode_on_chain_pda_option (Option<Pubkey>) - null or undefined for None
      )
      .accounts({
        mintActivityAccount: mintActivityPDA,
        nftMintAddress: nftMintWeb3,
        userWallet: userWalletWeb3,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    alert(`Successfully minted NFT! Transaction: ${Buffer.from(result.signature).toString('base64')}`);
    await fetchListedNftsWithMetadata();

  } catch (error) {
    console.error('Minting error:', error);
    let errorMessage = error.message;
    if (error.logs) {
      errorMessage += "\nProgram Logs:\n" + error.logs.join("\n");
    }
    alert(`Minting failed: ${errorMessage}`);
  } finally {
    listedNfts.value[index].isMinting = false;
  }
}
// Watch the 'fetchedOnChainEpisodes' ref
watch(fetchedOnChainEpisodes, (newValue, oldValue) => {


  // Check if the new value is populated and is an array
  if (newValue && Array.isArray(newValue) && newValue.length > 0) {
    console.log('fetchedOnChainEpisodes is now populated with an array.');

    // You can now safely work with newValue (which is fetchedOnChainEpisodes.value)
    // For example, map it:
    fetchListedNftsWithMetadata()
    // You could assign mappedData to another ref, or use it directly
    // const processedEpisodes = ref(mappedData);

  } else if (newValue && Array.isArray(newValue) && newValue.length === 0) {
    console.log('fetchedOnChainEpisodes is an empty array.');
    // Handle the case where data is fetched but it's an empty list
  } else {
    console.log('fetchedOnChainEpisodes is not yet populated with a valid array or is undefined/null.');
  }
}, {
  // Optional:
  // deep: true, // Use if fetchedOnChainEpisodes.value is an object or array and you want to watch for nested changes.
  // For replacing the ref's value entirely (e.g., fetchedOnChainEpisodes.value = newArray), deep is not strictly necessary.
  // immediate: true // Set to true if you want the watcher callback to run immediately on component setup
  // with the initial value of fetchedOnChainEpisodes.
});
async function fetchListedNftsWithMetadata() {
  try {
    // Use a generic provider for read-only operations if wallet not needed
    const provider = new AnchorProvider(connection, wallet.wallet?.value?.adapter || { publicKey: PublicKey.default, signTransaction: async () => { }, signAllTransactions: async () => { } }, AnchorProvider.defaultOptions());
    const program = new Program(idlFromFileNft, provider);

    // const allListed = await program.account.listedNft.all();
    const allListed = fetchedOnChainEpisodes.value
    const umi = createUmi(SOLANA_RPC_URL).use(mplCandyMachine());
    listedNfts.value = await Promise.all(
      combinedEpisodes?.value?.filter(item => item.candyMachineId !== '')?.map(async (item) => {
        let cmData = null;
        let name = '';
        let image = 'https://placehold.co/326x327'; // Default placeholder
        let price = null;
        let itemsAvailable = null;
        let itemsMinted = null;
        let itemsRemaining = null;
        let metadata = null;
        try {
          cmData = await fetchCandyMachine(umi, umiPublicKey(item.candyMachineId));
          console.log(cmData)
          if (cmData.items && cmData.items.length > 0 && cmData.items[0].name) {
            name = cmData.items[0].name;
          } else if (cmData.data.name) { // Fallback to candy machine name if item name not found
            name = cmData.data.name;
          }

          console.log("pricez", Number(cmData.header.lamports.basisPoints) / 1_000_000_000);


          // Assuming solPayment guard is present for price
          if (cmData.header.lamports.basisPoints) {
            price = Number(cmData.header.lamports.basisPoints) / 1_000_000_000;
          } else if (cmData.configLineSettings && cmData.configLineSettings.prefixName) { //legacy
            name = cmData.configLineSettings.prefixName;
          }


          itemsAvailable = Number(cmData.data.itemsAvailable);
          itemsMinted = Number(cmData.itemsRedeemed);
          itemsRemaining = itemsAvailable - itemsMinted;

          if (cmData.items && cmData.items.length > 0 && cmData.items[0].uri) {
            try {
              const response = await fetch(cmData.items[0].uri.replace(/^https?:\/\/arweave.net\//, 'https://ar-io.dev/'));
              if (response.ok) {
                metadata = await response.json();
                if (metadata.image) {
                  image = metadata.image.replace(/^https?:\/\/arweave.net\//, 'https://ar-io.dev/');
                }
              }
            } catch (fetchErr) {
              console.warn(`Failed to fetch metadata from ${cmData.items[0].uri}`, fetchErr);
            }
          }
        } catch (cmErr) {
          console.warn(`Failed to fetch candy machine ${item.candyMachineId}`, cmErr);
        }

        console.log(item.author.toString(), "item")

        let creatorName = item.author.toString().substring(0, 6) + "...";
        let creatorAvatar = `https://ui-avatars.com/api/?rounded=true&bold=true&name=${encodeURIComponent(item.author.toString().substring(0, 2))}`;
        try {
          const res = await axios.get(`${AUTH_API_BASE_URL}/users/address/${item.author.toString()}`);
          if (res.data && res.data.data) {
            creatorName = res.data.data.name || item.author.toString();
            creatorAvatar = res.data.data.avatar || `https://ui-avatars.com/api/?rounded=true&bold=true&name=${encodeURIComponent(creatorName)}`;
          }
        } catch (axiosErr) {
          // Use default if fetching creator profile fails
        }

        return {
          name: name || 'Untitled NFT Collection',
          image,
          price,
          itemsAvailable,
          itemsMinted,
          itemsRemaining,
          creatorName,
          creatorAvatar,
          candyMachineAddress: item.candyMachineId,
          isMinting: false
        };
      })
    );
  } catch (e) {
    console.error("Failed to fetch listed NFTs:", e);
    listedNfts.value = [];
  }
}


function getMintButtonText(nft) {
  if (!wallet.connected.value) return 'Connect Wallet to Mint';
  if (!nft.itemsRemaining) return 'Sold Out';
  if (nft.isMinting) return 'Minting...';
  return 'Mint & Get Special Access';
}

const isContentLockedForDisplay = (episode) => {
  if (!episode.isNft) return false;
  if (isAuthorOfParentTale.value) return false;
  if (!props.appUser || !props.appUser.walletAddress || !wallet.publicKey.value) return true;

  return !userOnChainMintActivities.value.some(activity => {
    const acc = activity.account;
    if (acc.episodeOnChainPda && acc.episodeOnChainPda.toString() === episode.onChainPda) {
      return acc.userWallet.toString() === wallet.publicKey.value.toString() && acc.status === 0;
    }
    if (episode.candyMachineId && acc.candyMachineId.toString() === new PublicKey(episode.candyMachineId).toString()) {
      return acc.userWallet.toString() === wallet.publicKey.value.toString() && acc.status === 0;
    }
    return false;
  });
};


// --- Watcher for wallet and parentTale ---
watch([() => wallet.connected.value, () => props.parentTale?.onChainPdaString, () => props.appUser?.walletAddress],
  async ([isConnected, parentPdaStr, userWalletAddr], [wasConnected, oldParentPdaStr, oldUserWalletAddr]) => {
    if (isConnected && wallet.publicKey.value) {
      let programJustInitialized = false;
      if (!program || provider?.wallet?.publicKey?.toBase58() !== wallet.publicKey.value.toBase58()) {
        if (wallet.wallet.value && wallet.wallet.value.adapter) {
          provider = new AnchorProvider(connection, wallet.wallet.value.adapter, AnchorProvider.defaultOptions());
          try {
            program = new Program(idl, provider);
            programNft = new Program(idlFromFileNft, provider)
            console.log("EpisodeManager: Anchor Program Initialized.");
            programJustInitialized = true;
          } catch (e) { console.error("EpisodeManager: Error initializing Program:", e); program = null; provider = null; return; }
        } else { console.error("EpisodeManager: Wallet adapter missing."); program = null; provider = null; return; }
      }

      if (program && parentPdaStr) {
        await fetchAllEpisodeData();
      }
      if (program && userWalletAddr && (programJustInitialized || userWalletAddr !== oldUserWalletAddr)) {
        // Assuming fetchUserOnChainMintActivities uses the tale_nft program
        // This part might need adjustment if it's for a different program
        // For now, keeping it as is, but ensure programNft is initialized if needed for this.
        await fetchUserOnChainMintActivities();
      }

    } else {
      program = null; provider = null;
      if (wasConnected === true && !isConnected) {
        fetchedOnChainEpisodes.value = [];
        backendImageLinks.value.clear();
        userOnChainMintActivities.value = [];
      }
    }
  }, { immediate: true, deep: true });

async function fetchUserOnChainMintActivities() {
  if (!program || !props.appUser?.walletAddress) {
    userOnChainMintActivities.value = [];
    return;
  }
  isLoadingUserMintActivities.value = true;
  try {
    const userPk = new PublicKey(props.appUser.walletAddress);
    const activities = await programNft.account.mintActivity.all([
      { memcmp: { offset: 8, bytes: userPk.toBase58() } }
    ]);
    console.log(activities)
    userOnChainMintActivities.value = activities;
  } catch (error) {
    console.error("Error fetching user's on-chain mint activities:", error);
    userOnChainMintActivities.value = [];
  } finally {
    isLoadingUserMintActivities.value = false;
  }
}

// --- Utility Functions ---
function showUiMessage(msg, type = 'info', txSig = null, duration = 5000) {
  uiMessage.value = { text: msg, type, transactionSignature: txSig };
  if (duration > 0 && type !== 'loading') {
    setTimeout(() => { uiMessage.value = { text: '', type: 'info', transactionSignature: null }; }, duration);
  }
}
const ModalShow = (episode)=>{
  console.log(episode)
  selectedEpisode.value = episode
  showEpisodeModal.value = true;
}
const modalDrop = ()=>{
  showEpisodeModal.value = true;
  selectedEpisode.value = null
  indexModal.value = 0
}
const next = ()=>{
  const isLocked = isContentLockedForDisplay(selectedEpisode)
  console.log(isLocked)
  if(indexModal.value+1 < selectedEpisode.value.images.length){
    indexModal.value += 1
  }
}
const previous = ()=>{
  console.log(indexModal.value,selectedEpisode.value.images.length)
  if(indexModal.value+1 >= selectedEpisode.value.images.length){
    indexModal.value -= 1
  }
}
console.log(selectedEpisode)
const shortenAddress = (address, chars = 6) => address ? `${address.slice(0, chars)}...${address.slice(-chars)}` : '';
const setDefaultImage = (event) => { event.target.src = 'https://placehold.co/400x225/gray/white?text=ImgError'; };
const renderMarkdownMini = (markdownText) => {
  if (!markdownText) return '';
  const plainText = marked(markdownText, { breaks: true, gfm: true }).replace(/<[^>]+>/g, '');
  return plainText.length > 100 ? plainText.substring(0, 100) + '...' : plainText;
};
const getStatusString = (statusEnumOrNum) => {
  let statusNum = statusEnumOrNum;
  if (typeof statusEnumOrNum === 'object' && statusEnumOrNum !== null) {
    statusNum = Object.values(statusEnumOrNum)[0]; // Assuming the value is the first property
  }
  return ['Draft', 'Published', 'Scheduled', 'Archived'][statusNum] || 'Unknown';
};
const getExplorerUrl = (signature) => `https://explorer.solana.com/tx/${signature}?cluster=${SOLANA_RPC_URL.includes('mainnet') ? 'mainnet-beta' : 'devnet'}`;
const formatDateTime = (bnTime) => {
  if (!bnTime || (bnTime instanceof BN && (bnTime.isZero() || bnTime.isNeg()))) return 'N/A';
  try {
    const tsNumber = bnTime.toNumber ? bnTime.toNumber() : Number(bnTime);
    if (isNaN(tsNumber) || tsNumber <= 0) return 'N/A';
    return new Date(tsNumber * 1000).toLocaleString();
  } catch (e) { return "Invalid Date"; }
};


// --- API Client for Backend ---
const backendApiClient = axios.create({ baseURL: API_BASE_URL });
backendApiClient.interceptors.request.use(config => { const token = localStorage.getItem(JWT_TOKEN_KEY); if (token) config.headers.Authorization = `Bearer ${token}`; return config; });
backendApiClient.interceptors.response.use(response => response.data, error => { const msg = error.response?.data?.message || error.message || 'Backend API error.'; showUiMessage(msg, 'error'); return Promise.reject(error.response?.data || { message: msg, error }); });

// --- Data Fetching ---
async function fetchAllEpisodeData() {
  if (!program || !props.parentTale?.onChainPdaString) { return; }
  isLoadingEpisodes.value = true;
  fetchedOnChainEpisodes.value = [];
  backendImageLinks.value.clear();
  try {
    const parentTalePk = new PublicKey(props.parentTale.onChainPdaString);
    const onChainAccounts = await program.account.episode.all([
      { memcmp: { offset: 8 + 32, bytes: parentTalePk.toBase58() } } // author (32) + parent_tale (32)
    ]);
    fetchedOnChainEpisodes.value = onChainAccounts;

    if (onChainAccounts.length > 0) {
      const newImageLinks = new Map();
      for (const ocEpisode of onChainAccounts) {
        const episodePdaString = ocEpisode.publicKey.toString();
        const imageSetId = ocEpisode.account.imageSetId;
        if (imageSetId) {
          try {
            const imgResponse = await backendApiClient.get(`/episodes/image-set/${imageSetId}`);
            if (imgResponse.success && Array.isArray(imgResponse.data)) {
              newImageLinks.set(episodePdaString, imgResponse.data);
            } else { newImageLinks.set(episodePdaString, []); }
          } catch (e) { newImageLinks.set(episodePdaString, []); }
        } else {
          newImageLinks.set(episodePdaString, []);
        }
      }
      backendImageLinks.value = newImageLinks;
    }
  } catch (error) { showUiMessage(`Fetch error: ${error.message}`, "error"); }
  finally { isLoadingEpisodes.value = false; }
}

// --- Modal & Form Logic ---
function handleEpisodeThumbnailFileChange(event) {
  const file = event.target.files[0];
  if (file) {
    currentEpisodeForm.value.thumbnailImageFile = file;
    currentEpisodeForm.value.thumbnailPreviewUrl = URL.createObjectURL(file);
    currentEpisodeForm.value.thumbnailCid = ''; // Clear old CID if a new file is selected
  }
}

function toggleNftSectionInForm() {
  if (!currentEpisodeForm.value.isNft) {
    showCandyMachineCreatorFormInModal.value = false;
    currentEpisodeForm.value.candyMachineId = '';
  }
}
function triggerCandyMachineSetupInModal(isEditing = false) {
  if (currentEpisodeForm.value.images.length > 0) {
    uploadedEpisodeImageForNftModal.value = currentEpisodeForm.value.images[0];
  } else {
    showUiMessage("Add at least one main episode image URL first. This image can be used for the NFT if you set up a new Candy Machine.", "warning");
  }
  if (!isEditing) currentEpisodeForm.value.candyMachineId = '';
  manualCandyMachineIdModal.value = '';
  showCandyMachineCreatorFormInModal.value = true;
}
function assignManualCandyMachineIdInModal() {
  if (manualCandyMachineIdModal.value.trim()) {
    currentEpisodeForm.value.candyMachineId = manualCandyMachineIdModal.value.trim();
    showCandyMachineCreatorFormInModal.value = false;
    manualCandyMachineIdModal.value = '';
  } else { showUiMessage("Please enter a valid CM ID.", "warning"); }
}
function handleCandyMachineCreatedInModal(newCmId) {
  currentEpisodeForm.value.candyMachineId = newCmId;
  showCandyMachineCreatorFormInModal.value = false;
}

function openEpisodeModal() {
  if (!isAuthorOfParentTale.value) { showUiMessage("Not authorized.", "error"); return; }
  currentEpisodeForm.value = defaultEpisodeForm();
  currentEpisodeForm.value.order = combinedEpisodes.value.length;
  currentEpisodeForm.value.editingExistingOnChainEpisode = false;
  currentEpisodeForm.value.episodeOnChainPdaToEdit = null;
  currentEpisodeForm.value.imageSetId = null;
  currentEpisodeForm.value.publishAtTime = ''; // Reset schedule times
  currentEpisodeForm.value.unpublishAtTime = '';

  showCandyMachineCreatorFormInModal.value = false;
  uploadedEpisodeImageForNftModal.value = '';
  manualCandyMachineIdModal.value = '';
  showEpisodeModal.value = true;
}

async function openEditModal(combinedEpisode) {
  if (!isAuthorOfParentTale.value) { showUiMessage("Not authorized.", "error"); return; }

  let contentMarkdownForForm = "";
  if (combinedEpisode.contentCid) {
    try {
      const response = await axios.get(`https://gateway.pinata.cloud/ipfs/${combinedEpisode.contentCid}`);
      contentMarkdownForForm = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
    } catch (e) { contentMarkdownForForm = `Error fetching content (CID: ${combinedEpisode.contentCid}).`; }
  }

  const publishAt = combinedEpisode.publishAtTime && !combinedEpisode.publishAtTime.isZero()
    ? new Date(combinedEpisode.publishAtTime.toNumber() * 1000).toISOString().slice(0, 16)
    : '';
  const unpublishAt = combinedEpisode.unpublishAtTime && !combinedEpisode.unpublishAtTime.isZero()
    ? new Date(combinedEpisode.unpublishAtTime.toNumber() * 1000).toISOString().slice(0, 16)
    : '';

  currentEpisodeForm.value = {
    editingExistingOnChainEpisode: true,
    episodeOnChainPdaToEdit: combinedEpisode.onChainPda,
    onChainEpisodeIdSeed: combinedEpisode.onChainEpisodeIdSeed,
    imageSetId: combinedEpisode.imageSetId,
    episodeName: combinedEpisode.name,
    contentMarkdown: contentMarkdownForForm,
    originalContentMarkdown: contentMarkdownForForm,
    thumbnailCid: combinedEpisode.thumbnailCid || '', // New
    thumbnailImageFile: null,                          // New
    thumbnailPreviewUrl: combinedEpisode.thumbnailCid ? `https://gateway.pinata.cloud/ipfs/${combinedEpisode.thumbnailCid}` : '', // New
    order: combinedEpisode.order,
    status: typeof combinedEpisode.status === 'object' ? Object.values(combinedEpisode.status)[0] : combinedEpisode.status,
    isNft: combinedEpisode.isNft,
    candyMachineId: combinedEpisode.candyMachineId || '',
    images: [...combinedEpisode.images],
    publishAtTime: publishAt,
    unpublishAtTime: unpublishAt,
  };
  uploadedEpisodeImageForNftModal.value = currentEpisodeForm.value.images.length > 0 ? currentEpisodeForm.value.images[0] : '';
  showCandyMachineCreatorFormInModal.value = false;
  manualCandyMachineIdModal.value = '';
  showEpisodeModal.value = true;
}

function closeEpisodeModal() {
  showEpisodeModal.value = false;
  currentEpisodeForm.value = defaultEpisodeForm();
  showCandyMachineCreatorFormInModal.value = false;
  uploadedEpisodeImageForNftModal.value = '';
  const fileInput = document.getElementById('episodeImageFilesModal');
  if (fileInput) fileInput.value = null;
  const thumbInput = document.getElementById('episodeThumbnailFile');
  if (thumbInput) thumbInput.value = null;
  isUploadingImagesModal.value = false;
  isUploadingEpisodeThumbnail.value = false;
}

async function handleImageFilesChangeInModal(event) {
  const files = event.target.files;
  if (!files || files.length === 0) return;
  if (currentEpisodeForm.value.images.length + files.length > 10) {
    showUiMessage("Max 10 images.", "warning"); return;
  }
  isUploadingImagesModal.value = true;
  showUiMessage(`Uploading ${files.length} image(s)...`, "info", 0);
  try {
    for (const file of files) {
      const uploadResult = await uploadFileToIPFS(file);
      if (uploadResult.success && uploadResult.imageUrl) {
        currentEpisodeForm.value.images.push(uploadResult.imageUrl);
      } else { throw new Error(uploadResult.error || `Failed to upload ${file.name}`); }
    }
    if (currentEpisodeForm.value.images.length > 0 && !uploadedEpisodeImageForNftModal.value) {
      uploadedEpisodeImageForNftModal.value = currentEpisodeForm.value.images[0];
    }
    showUiMessage(`${currentEpisodeForm.value.images.length} image(s) in list.`, "success");
  } catch (uploadError) { showUiMessage(`Image upload error: ${uploadError.message}`, "error"); }
  finally { isUploadingImagesModal.value = false; event.target.value = null; }
}

function addImageFieldInForm() {
  if (currentEpisodeForm.value.images.length < 10) {
    currentEpisodeForm.value.images.push('');
  } else {
    showUiMessage("Max 10 images.", "warning");
  }
}

function removeImageFieldInForm(index) {
  const removed = currentEpisodeForm.value.images.splice(index, 1)[0];
  if (uploadedEpisodeImageForNftModal.value === removed && currentEpisodeForm.value.images.length > 0) {
    uploadedEpisodeImageForNftModal.value = currentEpisodeForm.value.images[0];
  } else if (currentEpisodeForm.value.images.length === 0) {
    uploadedEpisodeImageForNftModal.value = '';
  }
}

async function handleSaveEpisode() {
  if (!program || !wallet.publicKey.value || !props.parentTale?.onChainPdaString) {
    showUiMessage("Wallet, program, or parent tale info missing.", "error"); return;
  }
  if (!isAuthorOfParentTale.value) { showUiMessage("Not authorized.", "error"); return; }

  isSavingEpisode.value = true;
  let contentCidForOnChain = '';
  let finalImageSetId = currentEpisodeForm.value.imageSetId;
  let finalThumbnailCid = currentEpisodeForm.value.thumbnailCid; // New

  try {
    // 1. Upload Episode Thumbnail if new file is selected
    if (currentEpisodeForm.value.thumbnailImageFile) {
      isUploadingEpisodeThumbnail.value = true;
      showUiMessage("Uploading episode thumbnail...", "loading", null, 0);
      const thumbUploadResult = await uploadFileToIPFS(currentEpisodeForm.value.thumbnailImageFile);
      isUploadingEpisodeThumbnail.value = false;
      if (thumbUploadResult.success) {
        finalThumbnailCid = thumbUploadResult.ipfsHash;
        currentEpisodeForm.value.thumbnailCid = finalThumbnailCid;
        showUiMessage("Episode thumbnail uploaded.", "info", null, 1500);
      } else {
        throw new Error(thumbUploadResult.error || "Episode thumbnail IPFS upload failed");
      }
    }


    // 2. Upload content markdown to IPFS
    if (currentEpisodeForm.value.contentMarkdown &&
      (!currentEpisodeForm.value.editingExistingOnChainEpisode ||
        currentEpisodeForm.value.contentMarkdown !== currentEpisodeForm.value.originalContentMarkdown)) {
      showUiMessage("Uploading content to IPFS...", "info", 0);
      const textFileName = `${(currentEpisodeForm.value.episodeName || 'ep').replace(/\s+/g, '_')}_${Date.now()}.md`;
      const textUploadResult = await uploadTextToIPFS(currentEpisodeForm.value.contentMarkdown, textFileName);
      if (textUploadResult.success) {
        contentCidForOnChain = textUploadResult.ipfsHash;
        showUiMessage("Content uploaded to IPFS.", "info", 1000);
      } else {
        throw new Error(textUploadResult.error || "Content IPFS upload failed");
      }
    } else if (currentEpisodeForm.value.editingExistingOnChainEpisode) {
      const existingOcEpisode = fetchedOnChainEpisodes.value.find(ep => ep.publicKey.toString() === currentEpisodeForm.value.episodeOnChainPdaToEdit);
      contentCidForOnChain = existingOcEpisode?.account?.contentCid || '';
    }

    // 3. Create/Update ImageSet in Backend
    showUiMessage("Syncing images with backend...", "info", 0);
    const imageSetPayload = {
      images: currentEpisodeForm.value.images.filter(img => img && img.trim() !== ''),
      existingImageSetId: currentEpisodeForm.value.imageSetId,
    };
    const imageSetResponse = await backendApiClient.post('/episodes/image-set', imageSetPayload);
    if (!imageSetResponse.success || !imageSetResponse.imageSetId) {
      throw new Error(imageSetResponse.message || "Failed to create/update image set in backend.");
    }
    finalImageSetId = imageSetResponse.imageSetId;
    showUiMessage("Image set synced with backend.", "info", 1500);

    // 4. Prepare On-Chain Data & Perform Transaction
    const publishAtTimestamp = currentEpisodeForm.value.publishAtTime
      ? new BN(Math.floor(new Date(currentEpisodeForm.value.publishAtTime).getTime() / 1000))
      : null;
    const unpublishAtTimestamp = currentEpisodeForm.value.unpublishAtTime
      ? new BN(Math.floor(new Date(currentEpisodeForm.value.unpublishAtTime).getTime() / 1000))
      : null;

    if (publishAtTimestamp && unpublishAtTimestamp && publishAtTimestamp.gte(unpublishAtTimestamp)) {
      throw new Error("Publish time must be before unpublish time.");
    }
    if (currentEpisodeForm.value.status === 2 && !publishAtTimestamp) { // Status 'Scheduled'
      throw new Error("Publish time is required for 'Scheduled' status.");
    }


    const onChainMethodArgs = [ // For update_episode
      currentEpisodeForm.value.episodeName,
      contentCidForOnChain,
      finalThumbnailCid, // New argument
      finalImageSetId,
      currentEpisodeForm.value.order,
      currentEpisodeForm.value.status,
      currentEpisodeForm.value.isNft,
      currentEpisodeForm.value.isNft ? currentEpisodeForm.value.candyMachineId : "",
      publishAtTimestamp, // Option<i64>
      unpublishAtTimestamp, // Option<i64>
    ];
    let episodeOnChainPdaString;
    let usedEpisodeIdSeed = currentEpisodeForm.value.onChainEpisodeIdSeed;

    let txSignature = '';
    if (currentEpisodeForm.value.editingExistingOnChainEpisode && currentEpisodeForm.value.episodeOnChainPdaToEdit) {
      showUiMessage("Updating on-chain episode...", "info", 0);
      episodeOnChainPdaString = currentEpisodeForm.value.episodeOnChainPdaToEdit;
      txSignature = await program.methods.updateEpisode(...onChainMethodArgs)
        .accounts({ episodeAccount: new PublicKey(episodeOnChainPdaString), author: wallet.publicKey.value })
        .rpc();
      showUiMessage("On-chain episode updated!", "success", txSignature);
    } else {
      usedEpisodeIdSeed = uuidv4().substring(0, MAX_ONCHAIN_EPISODE_ID_SEED_LENGTH);
      showUiMessage("Creating on-chain episode...", "info", 0);
      const [pda, _bump] = PublicKey.findProgramAddressSync(
        [Buffer.from("episode"), new PublicKey(props.parentTale.onChainPdaString).toBuffer(), Buffer.from(usedEpisodeIdSeed)],
        PROGRAM_ID
      );
      episodeOnChainPdaString = pda.toString();

      const createArgs = [usedEpisodeIdSeed, ...onChainMethodArgs];
      txSignature = await program.methods.createEpisode(...createArgs)
        .accounts({
          episodeAccount: episodeOnChainPdaString,
          parentTaleAccount: new PublicKey(props.parentTale.onChainPdaString),
          author: wallet.publicKey.value,
          systemProgram: SystemProgram.programId,
        }).rpc();
      showUiMessage("On-chain episode created!", "success", txSignature);
    }

    // (Optional) Update backend EpisodeImageSet with on-chain PDA link
    // ... (existing linking logic can remain) ...

    fetchAllEpisodeData();
    closeEpisodeModal();
  } catch (error) {
    console.error('Error saving episode:', error);
    let errorMsg = error.message || error.toString();
    if (error.logs) errorMsg += ` Logs: ${error.logs.join(', ')}`;
    showUiMessage(`Save episode error: ${errorMsg}`, "error", error.signature);
  } finally {
    isSavingEpisode.value = false;
    isUploadingEpisodeThumbnail.value = false; // Reset
    if (uiMessage.value.type === 'loading') showUiMessage("", "info");
  }
}

async function confirmDeleteCombinedEpisode(combinedEpisode) {
  if (!program || !wallet.publicKey.value || !isAuthorOfParentTale.value) {
    showUiMessage("Not authorized or program not ready.", "error"); return;
  }
  if (window.confirm(`Delete episode "${combinedEpisode.name}"? This will delete from on-chain and backend.`)) {
    isSavingEpisode.value = true;
    try {
      const imageSetIdToDelete = combinedEpisode.imageSetId;

      if (combinedEpisode.onChainPda) {
        showUiMessage("Deleting on-chain episode...", "info", 0);
        const txSig = await program.methods.deleteEpisode()
          .accounts({ episodeAccount: new PublicKey(combinedEpisode.onChainPda), author: wallet.publicKey.value })
          .rpc();
        showUiMessage("On-chain episode deleted.", "success", txSig);
      } else {
        showUiMessage("No on-chain PDA found for this episode. Skipping on-chain delete.", "warning");
      }

      if (imageSetIdToDelete) {
        showUiMessage("Deleting backend image set...", "info", 0);
        await backendApiClient.delete(`/episodes/image-set/${imageSetIdToDelete}`);
        showUiMessage("Backend image set deleted.", "success", null, 2000);
      } else {
        showUiMessage("No imageSetId found. Skipping backend image set delete.", "warning");
      }
      fetchAllEpisodeData();
    } catch (error) {
      console.error('Error deleting episode:', error);
      showUiMessage(`Delete error: ${error.message || error.toString()}`, "error", error.signature);
    } finally { isSavingEpisode.value = false; if (uiMessage.value.type === 'loading') showUiMessage("", "info"); }
  }
}

// New function to handle liking an episode
async function handleLikeEpisode(episodePdaString) {
  if (!program || !wallet.publicKey.value) {
    showUiMessage("Please connect your wallet to like an episode.", "warning");
    return;
  }
  isLikingEpisode.value = { ...isLikingEpisode.value, [episodePdaString]: true };
  showUiMessage("Liking episode...", "loading", null, 0);
  try {
    const txSignature = await program.methods.likeEpisode()
      .accounts({
        episodeAccount: new PublicKey(episodePdaString),
        user: wallet.publicKey.value,
      })
      .rpc();
    showUiMessage("Episode liked!", "success", txSignature);
    // Optimistically update or re-fetch
    const episodeIndex = fetchedOnChainEpisodes.value.findIndex(ep => ep.publicKey.toString() === episodePdaString);
    if (episodeIndex !== -1) {
      const currentLikes = fetchedOnChainEpisodes.value[episodeIndex].account.likeCount;
      // Ensure likeCount is treated as BN if it comes as such from chain, then convert for UI
      const newLikes = currentLikes instanceof BN ? currentLikes.add(new BN(1)) : new BN((Number(currentLikes) || 0) + 1);
      fetchedOnChainEpisodes.value[episodeIndex].account.likeCount = newLikes; // Update local state
    }
    // Or, for guaranteed consistency: await fetchAllEpisodeData();
  } catch (error) {
    console.error("Error liking episode:", error);
    let errorMsg = error.message || "Failed to like episode.";
    if (error.logs) errorMsg += ` Logs: ${error.logs.join(', ')}`;
    showUiMessage(errorMsg, "error", error.signature);
  } finally {
    isLikingEpisode.value = { ...isLikingEpisode.value, [episodePdaString]: false };
    if (uiMessage.value.type === 'loading') showUiMessage("", "info");
  }
}


// --- Lifecycle Hooks and Watchers ---
watch(() => props.parentTale?.onChainPdaString, (newParentPda) => {
  if (newParentPda && program && props.parentTale.onChainAccountData) {
    fetchAllEpisodeData();
  } else if (!newParentPda) {
    fetchedOnChainEpisodes.value = [];
    backendImageLinks.value.clear();
  }
}, { immediate: true, deep: true });

watch(() => props.appUser?.walletAddress, (newUserWalletAddr, oldUserWalletAddr) => {
  if (newUserWalletAddr && newUserWalletAddr !== oldUserWalletAddr && program) {
    fetchUserOnChainMintActivities(); // If needed for content locking
  } else if (!newUserWalletAddr) {
    userOnChainMintActivities.value = [];
  }
}, { immediate: true });


onMounted(() => {
  if (typeof window !== 'undefined' && !window.Buffer) { window.Buffer = Buffer; }
  if (!wallet.connected.value) {
    showUiMessage("Please connect wallet to manage or view episodes.", "info");
  }
  // fetchListedNftsWithMetadata();
  // Initial data fetch is primarily handled by the wallet watcher.
});

</script>

<style scoped>
.episode-manager-container {
  padding: 1.5rem;
  background-color: #f9fafb;
  /* Lighter background for the manager section */
  border-radius: 8px;
  margin-top: 2rem;
}

.main-section-title {
  font-size: 1.75rem;
  color: #1f2937;
  /* Darker grey */
  margin-bottom: 1.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e5e7eb;
  /* Lighter border */
}

.add-episode-button-container {
  margin-bottom: 1.5rem;
}

.ui-message {
  padding: 0.8rem 1.2rem;
  margin-bottom: 1rem;
  border-radius: 6px;
  font-size: 0.9rem;
  text-align: center;
}

.ui-message-error {
  background-color: #fee2e2;
  border: 1px solid #fca5a5;
  color: #b91c1c;
}

.ui-message-success {
  background-color: #d1fae5;
  border: 1px solid #6ee7b7;
  color: #047857;
}

.ui-message-info {
  background-color: #dbeafe;
  border: 1px solid #93c5fd;
  color: #1d4ed8;
}

.ui-message-loading {
  background-color: #fef3c7;
  border: 1px solid #fcd34d;
  color: #b45309;
}

.ui-message-warning {
  background-color: #ffedd5;
  border: 1px solid #fdba74;
  color: #c2410c;
}

.tx-link-container {
  margin-top: 0.3rem;
}

.transaction-link {
  font-size: 0.8rem;
  text-decoration: underline;
}


.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.65);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1050;
}

.modal-content-wrapper {
  background-color: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  width: 90%;
  max-width: 700px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
}

.modal-close-button {
  position: absolute;
  top: 10px;
  right: 15px;
  background: none;
  border: none;
  font-size: 2.2rem;
  cursor: pointer;
  color: #9ca3af;
  line-height: 1;
}

.modal-close-button:hover {
  color: #374151;
}

.modal-title {
  font-size: 1.6rem;
  color: #111827;
  margin-bottom: 1.5rem;
  text-align: left;
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-label {
  margin-bottom: 0.4rem;
  font-weight: 500;
  color: #374151;
  font-size: 0.9rem;
}

.form-input,
.form-select,
.form-textarea,
.form-file-input {
  padding: 0.65rem 0.9rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.95rem;
  width: 100%;
  box-sizing: border-box;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.form-input-readonly {
  background-color: #f3f4f6;
  cursor: not-allowed;
}

.form-textarea {
  min-height: 90px;
  resize: vertical;
}

.form-checkbox {
  margin-right: 0.5rem;
  width: auto;
  transform: scale(1.05);
}

.checkbox-label {
  flex-direction: row;
  align-items: center;
  font-weight: normal;
  font-size: 0.95rem;
}

.image-preview {
  max-width: 120px;
  max-height: 80px;
  margin-top: 0.5rem;
  border-radius: 4px;
  border: 1px solid #e5e7eb;
  object-fit: cover;
}

.mt-2 {
  margin-top: 0.5rem;
}

.nft-linking-section,
.nft-details-section,
.content-fields-wrapper,
.image-upload-section,
.scheduling-fields {
  border: 1px solid #e5e7eb;
  padding: 1rem;
  border-radius: 6px;
  margin-top: 0.5rem;
}

.nft-linking-section .form-label {
  margin-bottom: 0;
}

/* Adjust for checkbox */
.cm-id-display-wrapper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.edit-cm-button {
  margin-left: auto;
}

.cm-creator-wrapper {
  border: 1px dashed #9ca3af;
  padding: 1rem;
  border-radius: 4px;
  margin-top: 0.5rem;
}

.cm-creator-prompt {
  font-size: 0.9rem;
  color: #4b5563;
  margin-bottom: 0.8rem;
}

.cancel-cm-button {
  margin-top: 0.8rem;
}

.cm-setup-options {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.cm-options-divider {
  color: #6b7280;
  font-size: 0.9rem;
}

.manual-cm-input {
  flex-grow: 1;
}

.image-input-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.image-url-input {
  flex-grow: 1;
}

.remove-image-button,
.add-image-button {
  white-space: nowrap;
}

.file-upload-wrapper {
  margin-top: 0.75rem;
}

.upload-indicator {
  font-size: 0.85rem;
  color: #16a085;
  margin-top: 0.3rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.loading-indicator-list,
.no-episodes-message {
  text-align: center;
  padding: 1.5rem;
  color: #4b5563;
  font-size: 1rem;
}

.spinner {
  border: 3px solid rgba(0, 0, 0, 0.1);
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border-left-color: #3b82f6;
  animation: spin 0.8s ease infinite;
  margin: 0 auto 0.8rem;
}

.spinner-inline {
  width: 1em;
  height: 1em;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  display: inline-block;
  animation: spin 0.75s linear infinite;
  margin-right: 0.4em;
  vertical-align: text-bottom;
}

.spinner-inline-xs {
  width: 0.8em;
  height: 0.8em;
  border-width: 1.5px;
  margin-right: 0.3em;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.episodes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.episode-item {
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03);
  display: flex;
  flex-direction: column;
}

.episode-main-thumbnail {
  width: 100%;
  height: 160px;
  object-fit: cover;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
}

.episode-item-content {
  padding: 1rem;
  flex-grow: 1;
}

.episode-name {
  font-size: 1.2rem;
  color: #111827;
  margin: 0 0 0.6rem 0;
  font-weight: 600;
}

.episode-description {
  font-size: 0.9rem;
  color: #4b5563;
  margin-bottom: 0.8rem;
  line-height: 1.5;
}

.episode-locked-message {
  font-size: 0.9rem;
  color: #ef4444;
  padding: 0.8rem;
  background-color: #fee2e2;
  border-radius: 4px;
  margin-bottom: 0.8rem;
}

.mint-now-link {
  color: #dc2626;
  font-weight: 500;
  text-decoration: underline;
}

.episode-tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-bottom: 0.8rem;
}

.tag {
  background-color: #e5e7eb;
  color: #4b5563;
  padding: 0.2rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
}

.tag-nft {
  background-color: #ccfbf1;
  color: #0f766e;
}

/* Teal */
.tag-cm-ref {
  background-color: #ede9fe;
  color: #6d28d9;
}

/* Violet */
.tag-status {
  background-color: #dbeafe;
  color: #1e40af;
}

/* Blue */
.tag-warning {
  background-color: #fef3c7;
  color: #92400e;
}

/* Amber */
.tag-likes {
  background-color: #fee2e2;
  color: #b91c1c;
}

/* Red for likes */

.episode-schedule-info {
  font-size: 0.8rem;
  color: #52525b;
  /* zinc-600 */
  background-color: #f4f4f5;
  /* zinc-100 */
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  margin-top: 0.3rem;
  display: inline-block;
}


.episode-image-gallery {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.8rem;
}

.episode-thumbnail {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid #e5e7eb;
}

.episode-thumbnail-locked {
  opacity: 0.6;
}

.image-teaser-text {
  font-size: 0.8rem;
  color: #6b7280;
  margin-left: 0.5rem;
}

.episode-actions-footer {
  padding: 0.75rem 1rem;
  border-top: 1px solid #f3f4f6;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}

.author-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-like {
  background-color: #fce7f3;
  color: #be185d;
}

/* Pink for like */
.btn-like:hover:not(:disabled) {
  background-color: #fbcfe8;
}

.btn-like:disabled {
  background-color: #fce7f3 !important;
  color: #fda4af !important;
}


.btn {
  /* General button styling from TaleManager for consistency */
  padding: 0.6rem 1.2rem;
  border: none;
  border-radius: 6px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease, box-shadow 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
}

.btn:disabled {
  background-color: #ccc !important;
  color: #666 !important;
  cursor: not-allowed;
  box-shadow: none;
}

.btn-primary {
  background-color: #3498db;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #2980b9;
}

.btn-success {
  background-color: #2ecc71;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background-color: #27ae60;
}

.btn-warning {
  background-color: #f39c12;
  color: white;
}

.btn-warning:hover:not(:disabled) {
  background-color: #e67e22;
}

.btn-danger {
  background-color: #e74c3c;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background-color: #c0392b;
}

.btn-info {
  background-color: #1abc9c;
  color: white;
}

.btn-info:hover:not(:disabled) {
  background-color: #16a085;
}

.btn-secondary {
  background-color: #bdc3c7;
  color: #2c3e50;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #95a5a6;
}

.btn-xs {
  padding: 0.3rem 0.6rem;
  font-size: 0.8rem;
}
</style>
