<template>
  <div class="bg-white shadow rounded-lg p-6">
    <h2 class="text-lg font-medium text-gray-900">Create NFT</h2>
    
    <form @submit.prevent="createNFT" class="mt-4 space-y-4">
      <div>
        <label for="name" class="block text-sm font-medium text-gray-700">NFT Name</label>
        <input 
          type="text" 
          id="name" 
          v-model="nftData.name" 
          class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" 
          required
        />
      </div>
      
      <div>
        <label for="description" class="block text-sm font-medium text-gray-700">Description</label>
        <textarea 
          id="description" 
          v-model="nftData.description" 
          rows="3" 
          class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" 
          required
        ></textarea>
      </div>
      
      <div>
        <label for="image" class="block text-sm font-medium text-gray-700">Image File</label>
        <input 
          type="file" 
          id="image" 
          ref="imageFile"
          @change="handleImageChange" 
          accept="image/*" 
          class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" 
          required
        />
      </div>
      
      <div>
        <label for="attributes" class="block text-sm font-medium text-gray-700">Attributes (JSON format)</label>
        <textarea 
          id="attributes" 
          v-model="attributesJson" 
          rows="3" 
          placeholder='[{"trait_type": "Background", "value": "Blue"}, {"trait_type": "Eyes", "value": "Green"}]'
          class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        ></textarea>
      </div>

      <div>
        <label for="price" class="block text-sm font-medium text-gray-700">Price (SOL)</label>
        <input 
          type="number" 
          id="price" 
          v-model="nftData.price" 
          min="0" 
          step="0.01" 
          class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" 
          required
        />
      </div>
      
      <div class="flex items-center justify-between">
        <button 
          type="submit" 
          class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          :disabled="isCreating"
        >
          {{ isCreating ? 'Creating...' : 'Create NFT' }}
        </button>
        
        <div v-if="isCreating" class="text-sm text-gray-500">
          {{ creationStatus }}
        </div>
      </div>
    </form>
    
    <div v-if="error" class="mt-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
      {{ error }}
    </div>
    
    <div v-if="success" class="mt-4 p-2 bg-green-100 border border-green-400 text-green-700 rounded">
      NFT created successfully! <a :href="explorerLink" target="_blank" class="underline">View on Solana Explorer</a>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue';
import { uploadToIPFS } from '../new_services/pinata';
import { createAndMintNFT } from '../new_services/metaplex';

export default {
  name: 'CreateNFT',
  props: {
    walletPublicKey: {
      type: Object,
      required: true
    }
  },
  setup(props) {
    const nftData = ref({
      name: '',
      description: '',
      price: 0.1,
      image: null
    });
    
    const attributesJson = ref('[]');
    const imageFile = ref(null);
    const isCreating = ref(false);
    const creationStatus = ref('');
    const error = ref('');
    const success = ref(false);
    const mintAddress = ref('');
    
    const explorerLink = computed(() => {
      if (!mintAddress.value) return '';
      // Using devnet for testing
      return `https://explorer.solana.com/address/${mintAddress.value}?cluster=devnet`;
    });
    
    const handleImageChange = (event) => {
      if (event.target.files && event.target.files.length > 0) {
        nftData.value.image = event.target.files[0];
      }
    };
    
    const createNFT = async () => {
      error.value = '';
      success.value = false;
      
      if (!props.walletPublicKey) {
        error.value = 'Wallet not connected';
        return;
      }
      
      try {
        // Parse attributes
        let attributes = [];
        try {
          attributes = JSON.parse(attributesJson.value);
        } catch (e) {
          error.value = 'Invalid attributes JSON format';
          return;
        }
        
        isCreating.value = true;
        
        // Upload image to IPFS using Pinata
        creationStatus.value = 'Uploading image to IPFS...';
        const imageUploadResponse = await uploadToIPFS(nftData.value.image);
        const imageUrl = `ipfs://${imageUploadResponse.IpfsHash}`;
        
        // Create metadata
        const metadata = {
          name: nftData.value.name,
          description: nftData.value.description,
          image: imageUrl,
          attributes: attributes,
          properties: {
            files: [
              {
                uri: imageUrl,
                type: nftData.value.image.type
              }
            ],
            category: 'image'
          }
        };
        
        // Upload metadata to IPFS
        creationStatus.value = 'Uploading metadata to IPFS...';
        const metadataUploadResponse = await uploadToIPFS(
          new Blob([JSON.stringify(metadata)], { type: 'application/json' })
        );
        
        const metadataUrl = `ipfs://${metadataUploadResponse.IpfsHash}`;
        
        // Create NFT using Metaplex
        creationStatus.value = 'Creating NFT on Solana...';
        const { mintAddress: newMintAddress } = await createAndMintNFT(
          props.walletPublicKey,
          metadataUrl,
          nftData.value.name,
          parseFloat(nftData.value.price)
        );
        
        mintAddress.value = newMintAddress;
        success.value = true;
        
        // Reset form
        nftData.value = {
          name: '',
          description: '',
          price: 0.1,
          image: null
        };
        attributesJson.value = '[]';
        
        // Reset file input
        const fileInput = document.getElementById('image');
        if (fileInput) fileInput.value = '';
        
      } catch (err) {
        console.error('Error creating NFT:', err);
        error.value = err.message || 'Failed to create NFT';
      } finally {
        isCreating.value = false;
        creationStatus.value = '';
      }
    };
    
    return {
      nftData,
      attributesJson,
      imageFile,
      isCreating,
      creationStatus,
      error,
      success,
      explorerLink,
      handleImageChange,
      createNFT
    };
  }
};
</script>