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
