 // services/pinataService.js
 const axios = require('axios');
 const FormData = require('form-data');

 const PINATA_API_KEY = process.env.PINATA_API_KEY;
 const PINATA_API_SECRET = process.env.PINATA_API_SECRET;
 const PINATA_BASE_URL = 'https://api.pinata.cloud';

 async function pinFileToIPFS(fileBuffer, fileName, pinataMetadataOptions = {}) {
      if (!PINATA_API_KEY || !PINATA_API_SECRET) {
         throw new Error('Pinata API Key or Secret not configured in .env');
      }
     const formData = new FormData();
     formData.append('file', fileBuffer, { filename: fileName });

     const metadata = JSON.stringify({
         name: fileName,
         keyvalues: pinataMetadataOptions.keyvalues || {},
     });
     formData.append('pinataMetadata', metadata);

      const options = JSON.stringify({
         cidVersion: pinataMetadataOptions.cidVersion || 0, // cid v0 is often better for file compatibility in some viewers
      });
     formData.append('pinataOptions', options);

     try {
         const res = await axios.post(`${PINATA_BASE_URL}/pinning/pinFileToIPFS`, formData, {
             maxBodyLength: Infinity, // Required for large files
             headers: {
                 'Content-Type': `multipart/form-data; boundary=${formData.getBoundary()}`,
                 'pinata_api_key': PINATA_API_KEY,
                 'pinata_secret_api_key': PINATA_API_SECRET,
             },
         });
         return `ipfs://${res.data.IpfsHash}`; // Returns the IPFS URI
     } catch (error) {
         console.error('Error pinning file to IPFS:', error.response ? error.response.data : error.message);
         throw new Error(`Failed to pin file "${fileName}" to IPFS. ${error.response?.data?.error || error.message}`);
     }
 }

 async function pinJSONToIPFS(jsonContent, name) {
      if (!PINATA_API_KEY || !PINATA_API_SECRET) {
         throw new Error('Pinata API Key or Secret not configured in .env');
     }
     try {
         const res = await axios.post(`${PINATA_BASE_URL}/pinning/pinJSONToIPFS`, {
             pinataOptions: { cidVersion: 1 }, // CID v1 is better for JSON/metadata
             pinataMetadata: { name: name || `metadata_${Date.now()}` },
             pinataContent: jsonContent
         }, {
             headers: {
                 'pinata_api_key': PINATA_API_KEY,
                 'pinata_secret_api_key': PINATA_API_SECRET,
             },
         });
         return `ipfs://${res.data.IpfsHash}`;
     } catch (error) {
         console.error('Error pinning JSON to IPFS:', error.response ? error.response.data : error.message);
         throw new Error(`Failed to pin JSON to IPFS. ${error.response?.data?.error || error.message}`);
     }
 }
 async function unpinFromIPFS(ipfsHash) {
    if (!PINATA_API_KEY || !PINATA_API_SECRET) {
        console.warn('Pinata API Key or Secret not configured. Cannot unpin.');
        return; // Or throw error if unpinning is critical
    }
    if (!ipfsHash) {
        console.warn('No IPFS hash provided for unpinning.');
        return;
    }

    // Ensure we strip the 'ipfs://' prefix if present
    const cid = ipfsHash.startsWith('ipfs://') ? ipfsHash.substring(7) : ipfsHash;

    console.log(`Attempting to unpin CID: ${cid}`);
    try {
        await axios.delete(`${PINATA_BASE_URL}/pinning/unpin/${cid}`, {
            headers: {
                'pinata_api_key': PINATA_API_KEY,
                'pinata_secret_api_key': PINATA_API_SECRET,
            }
        });
        console.log(`Successfully unpinned CID: ${cid}`);
    } catch (error) {
        // Handle errors, e.g., 404 if already unpinned or invalid CID
        if (error.response && error.response.status === 404) {
             console.warn(`CID ${cid} not found or already unpinned.`);
        } else {
             console.error(`Error unpinning CID ${cid}:`, error.response ? error.response.data : error.message);
        }
        // Decide if you need to throw the error or just log it
        // throw new Error(`Failed to unpin CID ${cid}. ${error.response?.data?.error || error.message}`);
    }
}

 module.exports = { pinFileToIPFS, pinJSONToIPFS, unpinFromIPFS };