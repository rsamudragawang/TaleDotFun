<template>
  <div class="bg-white shadow sm:rounded-lg">
    <div class="px-4 py-5 sm:p-6">
      <h3 class="text-lg leading-6 font-medium text-gray-900">Create a New NFT</h3>
      <div class="mt-5">
        <form @submit.prevent="handleSubmit" class="space-y-6">
          <div>
            <label for="name" class="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              id="name"
              v-model="form.name"
              class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              required
            />
          </div>
          
          <div>
            <label for="description" class="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              id="description"
              v-model="form.description"
              rows="3"
              class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              required
            ></textarea>
          </div>
          
          <div>
            <label for="price" class="block text-sm font-medium text-gray-700">Price (SOL)</label>
            <div class="mt-1 relative rounded-md shadow-sm">
              <input
                type="number"
                id="price"
                v-model="form.price"
                min="0"
                step="0.01"
                class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                required
              />
              <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span class="text-gray-500 sm:text-sm">SOL</span>
              </div>
            </div>
          </div>
          
          <div>
            <label for="maxSupply" class="block text-sm font-medium text-gray-700">Max Supply</label>
            <div class="mt-1 relative rounded-md shadow-sm">
              <input
                type="number"
                id="maxSupply"
                v-model="form.maxSupply"
                min="1"
                step="1"
                class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                required
              />
              <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span class="text-gray-500 sm:text-sm">copies</span>
              </div>
            </div>
            <p class="mt-1 text-xs text-gray-500">Set to 1 for a unique NFT or higher for multiple editions</p>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700">Image</label>
            <div class="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div class="space-y-1 text-center">
                <div v-if="imagePreview" class="mb-4">
                  <img :src="imagePreview" alt="Preview" class="h-40 mx-auto" />
                </div>
                <div v-else class="flex text-sm text-gray-600">
                  <label
                    for="image-upload"
                    class="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                  >
                    <span>Upload a file</span>
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      @change="handleImageChange"
                      class="sr-only"
                      required
                    />
                  </label>
                  <p class="pl-1">or drag and drop</p>
                </div>
                <p class="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
              </div>
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700">Attributes</label>
            <div v-for="(attr, index) in form.attributes" :key="index" class="flex mt-2 space-x-2">
              <input
                type="text"
                v-model="attr.trait_type"
                placeholder="Trait"
                class="block w-1/2 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
              <input
                type="text"
                v-model="attr.value"
                placeholder="Value"
                class="block w-1/2 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
              <button
                type="button"
                @click="removeAttribute(index)"
                class="inline-flex items-center p-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Remove
              </button>
            </div>
            <button
              type="button"
              @click="addAttribute"
              class="mt-2 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Add Attribute
            </button>
          </div>
          
          <div v-if="error" class="text-red-500 text-sm">{{ error }}</div>
          
          <div class="flex justify-end">
            <button
              type="submit"
              :disabled="loading"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <span v-if="loading">Creating...</span>
              <span v-else>Create NFT</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { createNFTWithMetaplex } from '../services/solanaService';
import { getWalletInfo } from '../services/walletService';
import axios from 'axios';
export default {
  name: 'CreateNFT',
  setup() {
    const router = useRouter();
    const form = reactive({
      name: '',
      description: '',
      image: null,
      price: '',
      maxSupply: 1,
      attributes: [{ trait_type: '', value: '' }]
    });
    
    const loading = ref(false);
    const error = ref('');
    const imagePreview = ref('');
    
    const handleImageChange = (event) => {
      const file = event.target.files[0];
      if (file) {
        form.image = file;
        imagePreview.value = URL.createObjectURL(file);
      }
    };
    
    const addAttribute = () => {
      form.attributes.push({ trait_type: '', value: '' });
    };
    
    const removeAttribute = (index) => {
      form.attributes.splice(index, 1);
    };
    const saveNFTToDatabase = async (nftData) => {
      try {
        // Replace with your actual API endpoint
        const response = await axios.post('http://localhost:3000/api/nfts', nftData);
        return response.data;
      } catch (error) {
        console.error('Error saving NFT to database:', error);
        throw new Error('Failed to save NFT listing to database');
      }
    };
    
    const handleSubmit = async () => {
      // Validate wallet connection
      const walletInfo = getWalletInfo();
      if (!walletInfo.connected) {
        error.value = 'Please connect your wallet first';
        return;
      }
      
      // Validate form
      if (!form.name.trim()) {
        error.value = 'Name is required';
        return;
      }
      
      if (!form.description.trim()) {
        error.value = 'Description is required';
        return;
      }
      
      if (!form.image) {
        error.value = 'Image is required';
        return;
      }
      
      if (form.price === '' || isNaN(parseFloat(form.price)) || parseFloat(form.price) < 0) {
        error.value = 'Please enter a valid price';
        return;
      }
      
      if (!form.maxSupply || isNaN(parseInt(form.maxSupply)) || parseInt(form.maxSupply) < 1) {
        error.value = 'Max supply must be at least 1';
        return;
      }
      
      // Filter out empty attributes
      const filteredAttributes = form.attributes.filter(
        attr => attr.trait_type.trim() && attr.value.trim()
      );
      
      loading.value = true;
      error.value = '';
      
      try {
        // Create NFT
        const result = await createNFTWithMetaplex(
          form.name,
          form.description,
          form.image,
          filteredAttributes,
          parseInt(form.maxSupply)
        );
        
        if (result.success) {
          // Navigate to NFT detail page
          console.log(result)
          const nftListingData = {
            mintAddress: result.mint,
            name: form.name,
            description: form.description,
            image: result.imageUrl,
            metadata: result.metadataUrl,
            price: parseFloat(form.price),
            maxSupply: parseInt(form.maxSupply),
            sellerWallet: walletInfo.publicKey.toString(),
            attributes: filteredAttributes,
            createdAt: new Date().toISOString()
          };
          
          // // Save to backend
          await saveNFTToDatabase(nftListingData);
          router.push({ name: 'NFTDetail', params: { mint: result.mint } });
        } else {
          error.value = result.error || 'Failed to create NFT';
        }
      } catch (err) {
        error.value = err.message || 'An unexpected error occurred';
      } finally {
        loading.value = false;
      }
    };
    
    return {
      form,
      loading,
      error,
      imagePreview,
      handleImageChange,
      addAttribute,
      removeAttribute,
      handleSubmit
    };
  }
};
</script>