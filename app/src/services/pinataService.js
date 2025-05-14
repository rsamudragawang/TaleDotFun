import axios from 'axios';
import FormData from 'form-data';

const PINATA_API_KEY = import.meta.env.VITE_PINATA_API_KEY;
const PINATA_SECRET_API_KEY = import.meta.env.VITE_PINATA_SECRET_API_KEY;
const PINATA_BASE_URL = 'https://api.pinata.cloud';

export const uploadFileToIPFS = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const metadata = JSON.stringify({
    name: file.name,
  });
  formData.append('pinataMetadata', metadata);

  try {
    const response = await axios.post(`${PINATA_BASE_URL}/pinning/pinFileToIPFS`, formData, {
      headers: {
        'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
        'pinata_api_key': PINATA_API_KEY,
        'pinata_secret_api_key': PINATA_SECRET_API_KEY,
      },
    });

    return {
      success: true,
      ipfsHash: response.data.IpfsHash,
      imageUrl: `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`,
    };
  } catch (error) {
    console.error('Error uploading file to IPFS:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

export const uploadJsonToIPFS = async (jsonData) => {
  try {
    const response = await axios.post(`${PINATA_BASE_URL}/pinning/pinJSONToIPFS`, jsonData, {
      headers: {
        'Content-Type': 'application/json',
        'pinata_api_key': PINATA_API_KEY,
        'pinata_secret_api_key': PINATA_SECRET_API_KEY,
      },
    });

    return {
      success: true,
      ipfsHash: response.data.IpfsHash,
      metadataUrl: `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`,
    };
  } catch (error) {
    console.error('Error uploading JSON to IPFS:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};


export const uploadTextToIPFS = async (textData, fileName) => {
  if (!PINATA_API_KEY || !PINATA_SECRET_API_KEY) {
    console.error('Pinata API Key or Secret not configured for text upload.');
    return { success: false, error: 'Pinata API Key or Secret not configured.' };
  }

  if (typeof textData !== 'string') {
    return { success: false, error: 'Invalid textData: Input must be a string.' };
  }
  if (!fileName || typeof fileName !== 'string') {
    return { success: false, error: 'Invalid fileName: A string filename is required.' };
  }

  try {
    // Determine content type based on filename extension, default to text/plain
    let contentType = 'text/plain';
    if (fileName.endsWith('.md')) {
      contentType = 'text/markdown';
    } else if (fileName.endsWith('.json')) {
      contentType = 'application/json';
    } else if (fileName.endsWith('.txt')) {
      contentType = 'text/plain';
    }
    // Add more types as needed

    // Create a Blob from the text data
    const textBlob = new Blob([textData], { type: contentType });

    // Prepare FormData
    const formData = new FormData();
    formData.append('file', textBlob, fileName); // Pass the Blob and desired filename

    const metadata = JSON.stringify({
      name: fileName, // Use the provided filename for Pinata metadata
      // keyvalues: { source: 'textUploadFunction' } // Optional custom keyvalues
    });
    formData.append('pinataMetadata', metadata);

    const options = JSON.stringify({
      cidVersion: 0, // Or 1, text files can often benefit from CIDv0 for wider compatibility
    });
    formData.append('pinataOptions', options);

    // Make the API call
    const response = await axios.post(`${PINATA_BASE_URL}/pinning/pinFileToIPFS`, formData, {
      maxBodyLength: Infinity,
      headers: {
        // Let Axios set the Content-Type with boundary for FormData
        'pinata_api_key': PINATA_API_KEY,
        'pinata_secret_api_key': PINATA_SECRET_API_KEY,
      },
    });

    return {
      success: true,
      ipfsHash: response.data.IpfsHash,
      fileUrl: `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`,
    };

  } catch (error) {
    console.error(`Error uploading text file "${fileName}" to IPFS:`, error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.error || error.message || `Failed to upload text file "${fileName}" to IPFS.`,
    };
  }
};