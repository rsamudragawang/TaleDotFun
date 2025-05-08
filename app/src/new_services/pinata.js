import axios from 'axios';
import FormData from 'form-data';

// Replace with your actual Pinata API keys
const PINATA_API_KEY = import.meta.env.VITE_PINATA_API_KEY;
const PINATA_SECRET_API_KEY = import.meta.env.VITE_PINATA_SECRET_API_KEY;

export const uploadToIPFS = async (file) => {
  try {
    const formData = new FormData();
    
    // If file is a Blob or File object (for image uploads)
    if (file instanceof Blob || file instanceof File) {
      formData.append('file', file, file.name || 'file');
    } 
    // If file is JSON or other data that needs to be converted to a file
    else {
      const blob = new Blob([JSON.stringify(file)], { type: 'application/json' });
      formData.append('file', blob, 'metadata.json');
    }
    
    const response = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
      headers: {
        'Content-Type': `multipart/form-data;`,
        'pinata_api_key': PINATA_API_KEY,
        'pinata_secret_api_key': PINATA_SECRET_API_KEY
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error uploading to IPFS:', error);
    throw new Error(`Failed to upload to IPFS: ${error.message}`);
  }
};
