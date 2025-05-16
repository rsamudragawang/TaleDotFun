// readium-fun/backend/services/pinataService.js
const axios = require('axios');
const FormData = require('form-data'); // Ensure this is the Node.js 'form-data'
const stream = require('stream');

const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET_API_KEY = process.env.PINATA_SECRET_API_KEY;
// const PINATA_JWT = process.env.PINATA_JWT; // Use JWT if you prefer, otherwise API keys

const PINATA_BASE_URL = 'https://api.pinata.cloud';

/**
 * Pins a file buffer to IPFS via Pinata.
 * @param {Buffer} fileBuffer - The buffer of the file to upload.
 * @param {string} fileName - The original name of the file.
 * @param {string} [contentType] - Optional MIME type of the file.
 * @returns {Promise<object>} Pinata API response (includes IpfsHash).
 * @throws {Error} If pinning fails.
 */
async function pinFileBufferToIPFS(fileBuffer, fileName, contentType) {
  if (!PINATA_API_KEY || !PINATA_SECRET_API_KEY) {
    console.error('Pinata API Key or Secret not configured for backend service.');
    throw new Error('Pinata API Key or Secret not configured.');
  }

  const formData = new FormData();
  
  // Convert buffer to a readable stream for Pinata
  const bufferStream = new stream.PassThrough();
  bufferStream.end(fileBuffer);

  formData.append('file', bufferStream, {
    filename: fileName,
    contentType: contentType, // Pass contentType if available
  });

  const metadata = JSON.stringify({
    name: fileName || `UploadedFile-${Date.now()}`,
    // keyvalues: { app: 'readium-fun' } // Optional
  });
  formData.append('pinataMetadata', metadata);

  const options = JSON.stringify({
    cidVersion: 0, // Or 1
  });
  formData.append('pinataOptions', options);

  try {
    console.log(`Attempting to pin file buffer "${fileName}" to Pinata...`);
    const response = await axios.post(`${PINATA_BASE_URL}/pinning/pinFileToIPFS`, formData, {
      maxBodyLength: Infinity, // Important for large files
      headers: {
        ...formData.getHeaders(), // This gets the Content-Type with boundary for multipart/form-data
        'pinata_api_key': PINATA_API_KEY,
        'pinata_secret_api_key': PINATA_SECRET_API_KEY,
        // If using JWT: 'Authorization': `Bearer ${PINATA_JWT}`
      },
    });
    console.log(`File buffer "${fileName}" pinned successfully:`, response.data);
    return response.data; // Contains IpfsHash, PinSize, Timestamp
  } catch (error) {
    console.error('Error pinning file buffer to IPFS via Pinata:', error.response?.data || error.message);
    const errorMsg = error.response?.data?.error || error.message || 'Pinata API file buffer pinning failed.';
    throw new Error(errorMsg);
  }
}

/**
 * Pins JSON data to IPFS via Pinata.
 * @param {object} jsonData - The JSON object to pin.
 * @param {string} [pinataName='json-data.json'] - Name for the pin on Pinata.
 * @returns {Promise<object>} Pinata API response.
 * @throws {Error} If pinning fails.
 */
async function pinJSONToIPFS(jsonData, pinataName = `json-data-${Date.now()}.json`) {
  if (!PINATA_API_KEY || !PINATA_SECRET_API_KEY) {
    console.error('Pinata API Key or Secret not configured for backend service.');
    throw new Error('Pinata API Key or Secret not configured.');
  }
  try {
    console.log(`Attempting to pin JSON "${pinataName}" to Pinata...`);
    const response = await axios.post(`${PINATA_BASE_URL}/pinning/pinJSONToIPFS`, {
      pinataOptions: { cidVersion: 1 },
      pinataMetadata: { name: pinataName },
      pinataContent: jsonData,
    }, {
      headers: {
        'Content-Type': 'application/json',
        'pinata_api_key': PINATA_API_KEY,
        'pinata_secret_api_key': PINATA_SECRET_API_KEY,
        // If using JWT: 'Authorization': `Bearer ${PINATA_JWT}`
      },
    });
    console.log(`JSON "${pinataName}" pinned successfully:`, response.data);
    return response.data;
  } catch (error) {
    console.error('Error pinning JSON to IPFS via Pinata:', error.response?.data || error.message);
    const errorMsg = error.response?.data?.error || error.message || 'Pinata API JSON pinning failed.';
    throw new Error(errorMsg);
  }
}

/**
 * Pins text data (as a file) to IPFS via Pinata.
 * @param {string} textData - The string of text to upload.
 * @param {string} fileName - The desired filename for the content on IPFS (e.g., "my_story.md").
 * @returns {Promise<object>} Pinata API response.
 * @throws {Error} If pinning fails.
 */
async function pinTextAsFileToIPFS(textData, fileName) {
  if (typeof textData !== 'string') {
    throw new Error('Invalid textData: Input must be a string.');
  }
  if (!fileName || typeof fileName !== 'string') {
    throw new Error('Invalid fileName: A string filename is required.');
  }
  const textBuffer = Buffer.from(textData, 'utf-8');
  
  let contentType = 'text/plain';
  if (fileName.endsWith('.md')) {
    contentType = 'text/markdown';
  } else if (fileName.endsWith('.json')) {
    contentType = 'application/json';
  }
  // Add more content types as needed

  return pinFileBufferToIPFS(textBuffer, fileName, contentType);
}


// You might have other functions like unpin, etc.
// async function unpin(hashToUnpin) { ... }

module.exports = {
  pinFileBufferToIPFS,
  pinJSONToIPFS,
  pinTextAsFileToIPFS,
  // unpin, // if you have it
};
