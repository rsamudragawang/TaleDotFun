/**
 * Centralized service for making API calls to the backend.
 * Uses Axios for HTTP requests.
 */
import axios from 'axios';

// Get the base URL for the backend API from environment variables
// Fallback to localhost for development if not set.
const API_BASE_URL = process.env.VUE_APP_BACKEND_API_URL || 'http://localhost:3001/api';

// Create an Axios instance with default configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    // You could add other default headers here if needed, e.g., for authentication tokens
  },
});

// --- Optional: Add interceptors for global error handling or request modification ---
// apiClient.interceptors.request.use(config => {
//   // Maybe add an auth token?
//   // const token = localStorage.getItem('authToken');
//   // if (token) {
//   //   config.headers.Authorization = `Bearer ${token}`;
//   // }
//   return config;
// });

apiClient.interceptors.response.use(
  (response) => {
    // Any status code that lie within the range of 2xx cause this function to trigger
    // Return the response data directly for convenience
    return response.data;
  },
  (error) => {
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    console.error('API Error:', error.response || error.message || error);
    // Optionally: Add global error handling logic here (e.g., show a toast notification)

    // Reject the promise with the error object or a more specific error message
    // This allows individual components to catch and handle errors too.
    return Promise.reject(error.response?.data || error.message || error);
  }
);


// Define the API methods
export default {

  // === NFT Design & Edition Management (Method 2 - Pre-Mint) ===

  /**
   * Sends the creator's design intent (metadata, image) to the backend.
   * Expects formData containing the design details and the image file.
   * @param {FormData} formData - Form data including name, desc, image file, totalSlots, priceSOL, creatorWallet, attributes.
   * @returns {Promise<object>} Backend response, likely including designId, designIdHash (bytes array), sharedMetadataUri, etc.
   */
  registerDesignIntent(formData) {
    return apiClient.post('/designs/register-intent', formData, {
      // Axios automatically sets Content-Type to multipart/form-data for FormData
      // But explicitly setting it can sometimes avoid issues.
      // headers: { 'Content-Type': 'multipart/form-data' }, // Usually not needed with Axios + FormData
    });
  },

  /**
   * Confirms with the backend that a design has been successfully registered on-chain by the creator.
   * @param {string} designId - The unique ID of the design.
   * @param {object} data - { onChainDesignStatePda: string, transactionSignature?: string }
   * @returns {Promise<object>} Backend confirmation response.
   */
  confirmDesignRegistered(designId, data) {
    return apiClient.post(`/designs/${designId}/confirm-registered`, data);
  },

  /**
   * Fetches designs that are ready for buyers to browse and purchase slots/editions from.
   * @param {object} params - Optional query parameters like { limit, skip }.
   * @returns {Promise<Array<object>>} Array of active design objects.
   */
  getActiveDesigns(params = { limit: 20, skip: 0 }) {
    return apiClient.get('/designs/active', { params });
  },

   /**
   * Fetches the details of editions for a specific design that are yet to be minted.
   * Called by the creator frontend before minting.
   * @param {string} designId - The unique ID of the design.
   * @returns {Promise<Array<object>>} Array of MintedEditionInfo objects (unminted).
   */
   getUnmintedEditions(designId) {
    if (!designId) throw new Error("designId is required to fetch unminted editions.");
    return apiClient.get(`/designs/${designId}/unminted-editions`);
  },

  /**
   * Confirms with the backend that a specific edition has been successfully minted on-chain.
   * Called by the creator frontend after each successful mint.
   * @param {string} editionDbId - The MongoDB _id of the MintedEditionInfo document.
   * @param {object} data - { onChainNftMint: string, ownerWallet: string, transactionSignature?: string }
   * @returns {Promise<object>} Backend confirmation response.
   */
  confirmEditionMinted(editionDbId, data) {
     if (!editionDbId) throw new Error("editionDbId is required to confirm mint.");
    return apiClient.post(`/editions/${editionDbId}/confirm-minted`, data);
  },

  /**
   * Fetches details of already purchased/minted slots/NFTs for a given design.
   * @param {string} designId - The unique ID of the design.
   * @returns {Promise<Array<object>>} Array of PurchasedSlotNft objects.
   */
  getPurchasedSlots(designId) {
    if (!designId) throw new Error("designId is required to fetch purchased slots.");
    return apiClient.get(`/designs/${designId}/purchased-slots`);
  },

  // === (Placeholders for Minimal Marketplace Program Interaction - if needed) ===
  // These would be used if your frontend needs to interact with your *other* set of backend
  // routes that manage the listings created by your separate minimal marketplace program.

  /**
   * Records a listing created via the minimal marketplace program.
   * Called by frontend after successful on-chain list via minimal program.
   * @param {object} listingData - { sellerWallet, nftMint, priceLamports, listingStatePda, nftName?, nftImageUrl? }
   */
  // recordMinimalMarketplaceListing(listingData) {
  //   // Assuming a different endpoint prefix, e.g., /api/simple-listings
  //   return apiClient.post('/simple-listings', listingData);
  // },

  /**
   * Fetches active listings from the minimal marketplace program's index.
   * @param {object} params - Optional query parameters like { limit, skip }.
   */
  // getMinimalMarketplaceListings(params = { limit: 20, skip: 0 }) {
  //   return apiClient.get('/simple-listings/active', { params });
  // },

  /**
   * Updates the status of a listing in the minimal marketplace index.
   * Called by frontend after successful on-chain buy/cancel via minimal program.
   * @param {string} listingStatePda - The PDA address of the listing state.
   * @param {'sold' | 'cancelled'} status - The new status.
   * @param {object} details - Optional details like { transactionSignature, buyerWallet }.
   */
  // updateMinimalMarketplaceListingStatus(listingStatePda, status, details = {}) {
  //   return apiClient.patch(`/simple-listings/${listingStatePda}/status`, { status, ...details });
  // }

};