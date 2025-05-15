// readium-fun/app/src/services/pinataService.js
import axios from 'axios';

// The base URL for your backend API, which will proxy to Pinata
const BACKEND_API_BASE_URL = import.meta.env.VITE_APP_AUTH_API_URL || 'http://localhost:3000/api';
const JWT_TOKEN_KEY = 'readium_fun_jwt_token'; // If your backend IPFS routes are protected

// Configure an Axios instance for calls to your backend IPFS routes
const backendIpfsClient = axios.create({
  baseURL: `${BACKEND_API_BASE_URL}/ipfs`, // Assuming your routes are mounted at /api/ipfs
});

backendIpfsClient.interceptors.request.use(config => {
  const token = localStorage.getItem(JWT_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Uploads a file to IPFS by sending it to the backend.
 * @param {File} file - The file object to upload.
 * @returns {Promise<object>} Backend response, expected to include { success, ipfsHash, imageUrl, ... }.
 */
export const uploadFileToIPFS = async (file) => {
  if (!file) {
    return { success: false, error: 'No file provided for upload.' };
  }

  const formData = new FormData(); // Native browser FormData
  formData.append('file', file, file.name); // 'file' must match multer field name in backend

  try {
    const response = await backendIpfsClient.post('/upload-file', formData, {
      headers: {
        'Content-Type': 'multipart/form-data', // Important for file uploads
      },
    });
    // Assuming backend returns: { success: true, ipfsHash: '...', imageUrl: '...' }
    return response.data; 
  } catch (error) {
    console.error('Error uploading file via backend:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to upload file via backend.',
    };
  }
};

/**
 * Uploads JSON data to IPFS by sending it to the backend.
 * @param {object} jsonData - The JSON data to upload.
 * @param {string} [name] - Optional name for the pinned JSON (backend can handle default).
 * @returns {Promise<object>} Backend response.
 */
export const uploadJsonToIPFS = async (jsonData, name) => {
  if (!jsonData || typeof jsonData !== 'object') {
    return { success: false, error: 'jsonData (object) is required.' };
  }
  try {
    const payload = { jsonData, name };
    const response = await backendIpfsClient.post('/upload-json', payload);
    // Assuming backend returns: { success: true, ipfsHash: '...', metadataUrl: '...' }
    return response.data;
  } catch (error) {
    console.error('Error uploading JSON via backend:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to upload JSON via backend.',
    };
  }
};

/**
 * Uploads a string of text (as a file) to IPFS by sending it to the backend.
 * @param {string} textData - The text content to upload.
 * @param {string} fileName - The desired filename for the content on IPFS.
 * @returns {Promise<object>} Backend response.
 */
export const uploadTextToIPFS = async (textData, fileName) => {
  if (typeof textData !== 'string' || !fileName) {
    return { success: false, error: 'textData (string) and fileName are required.' };
  }
  try {
    const payload = { textData, fileName };
    const response = await backendIpfsClient.post('/upload-text', payload);
    // Assuming backend returns: { success: true, ipfsHash: '...', fileUrl: '...' }
    return response.data;
  } catch (error) {
    console.error('Error uploading text via backend:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to upload text via backend.',
    };
  }
};
