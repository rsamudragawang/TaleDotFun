<template>
  <div class="create-design-form">
    <!-- Form for defining the NFT series -->
    <form @submit.prevent="handleRegisterIntent" v-if="!intentResponse || isError">
      <!-- Name Section -->
      <div class="form-group">
        <label for="design-name">Base Name:</label>
        <input id="design-name" type="text" v-model="form.name" required placeholder="e.g., Cosmic Voyager" />
        <small>The name for the series. Edition numbers (#1, #2...) will be added automatically to each NFT.</small>
      </div>

      <!-- Description Section -->
      <div class="form-group">
        <label for="design-description">Description:</label>
        <textarea id="design-description" v-model="form.description" rows="3" placeholder="Describe your artwork or collection..."></textarea>
      </div>

      <!-- Image Upload Section -->
      <div class="form-group">
        <label for="design-image">Image File:</label>
        <input id="design-image" type="file" @change="handleImageSelect" accept="image/png, image/jpeg, image/gif, image/webp" required />
        <img v-if="imagePreviewUrl" :src="imagePreviewUrl" alt="Image Preview" class="image-preview" />
        <small>Upload the single image file that will be shared by all editions in this series.</small>
      </div>

      <!-- Attributes Section (Optional - Simple JSON input) -->
      <div class="form-group">
        <label for="design-attributes">Attributes (JSON format):</label>
        <textarea id="design-attributes" v-model="form.attributes" rows="4" placeholder='[{"trait_type": "Background", "value": "Blue"}, {"trait_type": "Eyes", "value": "Laser"}]'></textarea>
        <small>Optional. Enter as a valid JSON array of objects, like `[{"trait_type": "Color", "value": "Red"}]`.</small>
      </div>

      <!-- Edition Details Section -->
      <div class="form-group">
        <label for="design-totalSlots">Number of Editions:</label>
        <input id="design-totalSlots" type="number" v-model.number="form.totalSlots" min="1" max="10000" required placeholder="e.g., 100" />
        <small>Total number of copies that can be minted (1 - 10000).</small>
      </div>
      <div class="form-group">
        <label for="design-priceSOL">Price per Edition (SOL):</label>
        <input id="design-priceSOL" type="number" v-model.number="form.priceSOL" step="0.001" min="0" required placeholder="e.g., 0.1" />
        <small>The price buyers will pay to mint one edition (use 0 for free mints).</small>
      </div>
      <div class="form-group">
        <label for="design-sellerFee">Secondary Royalty (%):</label>
        <input id="design-sellerFee" type="number" v-model.number="form.sellerFeeBasisPoints" step="1" min="0" max="10000" required placeholder="e.g., 500" />
        <small>Royalty percentage (0-10000, where 500 = 5.00%) for future secondary market sales.</small>
      </div>

      <!-- Submission Section -->
      <div class="form-actions">
        <button type="submit" :disabled="isSubmitting || !canSubmit">
          <span v-if="isSubmitting">
            <span class="spinner"></span> Uploading & Processing...
          </span>
          <span v-else>Define Edition Series & Prepare Metadata</span>
        </button>
      </div>
    </form>

    <!-- Feedback Section -->
    <div v-if="message" class="message" :class="{'error': isError, 'success': !isError && !!intentResponse}">
      <p>{{ message }}</p>
      <!-- Provide hint for next step on success -->
      <p v-if="!isError && intentResponse">
          Metadata prepared successfully! Proceed to the next step to register this design on the blockchain.
      </p>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, defineEmits } from 'vue';
import { useWallet } from 'solana-wallets-vue';
import apiService from '../../services/apiService'; // Your backend API service

// --- Wallet State ---
const { connected, publicKey: creatorWallet } = useWallet();

// --- Component State ---
const form = ref({
  name: '',
  description: '',
  imageFile: null,
  totalSlots: 10,
  priceSOL: 0.1,
  attributes: '', // Store as JSON string initially
  sellerFeeBasisPoints: 500, // 5% default royalty
});
const imagePreviewUrl = ref(null);
const isSubmitting = ref(false);
const message = ref('');
const isError = ref(false);
const intentResponse = ref(null); // Stores successful response from backend { designId, onChainCallParams: {designIdHash, ...} }

// --- Define Emits ---
// This component emits 'intent-registered' when the backend successfully prepares metadata.
// The payload contains the data needed for the next on-chain step.
const emit = defineEmits(['intent-registered']);

// --- Computed Property for Submit Button ---
const canSubmit = computed(() => {
    // Basic checks - add more as needed
    return connected.value &&
           creatorWallet.value &&
           form.value.name.trim() &&
           form.value.imageFile &&
           form.value.totalSlots >= 1 && form.value.totalSlots <= 10000 &&
           form.value.priceSOL >= 0 &&
           form.value.sellerFeeBasisPoints >= 0 && form.value.sellerFeeBasisPoints <= 10000;
});

// --- Handle Image Selection and Preview ---
const handleImageSelect = (e) => {
  const file = e.target.files?.[0]; // Use optional chaining
  if (file && file.type.startsWith('image/')) {
    form.value.imageFile = file;
    // Create image preview URL
    const reader = new FileReader();
    reader.onload = (event) => {
      imagePreviewUrl.value = event.target.result;
    };
    reader.onerror = (error) => {
        console.error("FileReader error:", error);
        imagePreviewUrl.value = null; // Clear preview on error
    };
    reader.readAsDataURL(file);
  } else {
    form.value.imageFile = null;
    imagePreviewUrl.value = null;
    if (file) { // If a file was selected but wasn't an image
        message.value = "Please select a valid image file (PNG, JPG, GIF, WEBP).";
        isError.value = true;
    }
  }
};

// --- Handle Form Submission to Backend ---
const handleRegisterIntent = async () => {
  if (!canSubmit.value) {
    message.value = 'Please connect wallet and fill all required fields correctly.';
    isError.value = true;
    return;
  }

  // Validate Attributes JSON if provided
  let attributesToSend = null;
  if (form.value.attributes.trim()) {
      try {
          // Simple validation: Ensure it parses as an array
          const parsed = JSON.parse(form.value.attributes);
          if (!Array.isArray(parsed)) throw new Error('Attributes must be an array.');
          // Could add deeper validation here if needed
          attributesToSend = form.value.attributes; // Send the valid JSON string
      } catch (e) {
          message.value = `Attributes field contains invalid JSON: ${e.message}`;
          isError.value = true;
          return;
      }
  }

  isSubmitting.value = true;
  isError.value = false;
  message.value = '1/3 Validating...';
  intentResponse.value = null;

  // Use FormData to send file and other data
  const formData = new FormData();
  formData.append('name', form.value.name.trim());
  formData.append('description', form.value.description.trim());
  formData.append('image', form.value.imageFile); // The File object
  formData.append('totalSlots', form.value.totalSlots.toString());
  formData.append('priceSOL', form.value.priceSOL.toString());
  formData.append('creatorWallet', creatorWallet.value.toBase58());
  if (attributesToSend) {
      formData.append('attributes', attributesToSend); // Send JSON string
  }
  formData.append('sellerFeeBasisPoints', form.value.sellerFeeBasisPoints.toString());

  try {
    message.value = '2/3 Uploading image and pinning metadata via backend... This can take some time, especially for many editions.';
    // Call the backend API endpoint
    const responseData = await apiService.registerDesignIntent(formData);

    intentResponse.value = responseData; // Store response locally
    message.value = `3/3 Metadata prepared! Design ID: ${responseData.designId}. Ready for on-chain registration.`;
    isError.value = false;

    // --- EMIT SUCCESS EVENT ---
    // Pass up the necessary data for the next step (on-chain registration)
    emit('intent-registered', {
        designId: responseData.designId,
        // Include the parameters needed for the on-chain call
        onChainCallParams: responseData.onChainCallParams
    });

  } catch (err) {
    console.error("Error during register intent API call:", err);
    message.value = `Failed to register intent: ${err.response?.data?.message || err.message || 'Network or server error'}`;
    isError.value = true;
    intentResponse.value = null; // Clear response on error
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<style scoped>
.create-design-form {
    background-color: #f9f9f9;
    padding: 20px;
    border-radius: 8px;
    border: 1px solid #e0e0e0;
}
.form-group {
  margin-bottom: 18px; /* Slightly more spacing */
}
.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 600; /* Slightly bolder */
  color: #333;
}
.form-group input[type="text"],
.form-group input[type="number"],
.form-group textarea,
.form-group input[type="file"] {
  width: 100%;
  padding: 10px; /* Slightly larger padding */
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
  font-size: 1rem;
}
.form-group input[type="file"] {
    padding: 4px; /* Adjust file input padding */
}
.form-group textarea {
    resize: vertical; /* Allow vertical resize */
}
.form-group small {
    display: block;
    font-size: 0.85em; /* Slightly larger help text */
    color: #555;
    margin-top: 5px;
}
.image-preview {
    display: block;
    max-width: 200px; /* Larger preview */
    max-height: 200px;
    margin-top: 10px;
    border: 1px solid #eee;
    border-radius: 4px;
}
.form-actions {
  margin-top: 25px;
  text-align: center;
}
.message {
    margin-top: 20px;
    padding: 12px 15px;
    border-radius: 5px;
    font-weight: 500;
    text-align: center;
}
.error {
  color: #D8000C;
  background-color: #FFD2D2;
  border: 1px solid #D8000C;
}
.success {
   color: #270;
   background-color: #DFF2BF;
   border: 1px solid #270;
}
.intent-details {
    margin-top: 20px;
    padding: 15px;
    border: 1px dashed #aaa;
    background-color: #f0f0f0;
    border-radius: 5px;
}
.intent-details h4 { margin-top: 0; color: #333; }
.intent-details code {
    display: block;
    background-color: #e0e0e0;
    padding: 5px;
    border-radius: 3px;
    word-break: break-all;
    font-size: 0.8em;
    margin-top: 5px;
}
button {
    padding: 10px 20px;
    font-size: 1rem;
    border-radius: 5px;
    cursor: pointer;
    border: none;
    background-color: #007bff;
    color: white;
    transition: background-color 0.2s ease;
}
button:hover:not(:disabled) {
    background-color: #0056b3;
}
button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    background-color: #aaa;
}
.spinner {
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top: 2px solid #fff;
    width: 1em;
    height: 1em;
    -webkit-animation: spin 1s linear infinite; /* Safari */
    animation: spin 1s linear infinite;
    display: inline-block;
    margin-right: 5px;
    vertical-align: middle;
}
/* Safari */
@-webkit-keyframes spin {
  0% { -webkit-transform: rotate(0deg); }
  100% { -webkit-transform: rotate(360deg); }
}
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>