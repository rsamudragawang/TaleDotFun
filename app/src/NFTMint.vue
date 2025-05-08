// NFTMint.vue
<template>
  <div class="nft-mint-container">
    <h2>Create an NFT</h2>
    
    <div v-if="!walletConnected" class="connect-wallet">
      <button @click="connectWallet" class="connect-btn">Connect Phantom Wallet</button>
    </div>
    
    <div v-else class="mint-form">
      <div class="form-group">
        <label for="nftName">NFT Name</label>
        <input type="text" id="nftName" v-model="nftData.name" placeholder="Enter NFT name" />
      </div>
      
      <div class="form-group">
        <label for="nftDescription">Description</label>
        <textarea id="nftDescription" v-model="nftData.description" placeholder="Enter NFT description"></textarea>
      </div>
      
      <div class="form-group">
        <label for="nftImage">Upload Image</label>
        <input type="file" id="nftImage" @change="handleImageUpload" accept="image/*" />
        <div v-if="imagePreview" class="image-preview">
          <img :src="imagePreview" alt="NFT Preview" />
        </div>
      </div>
      
      <div class="form-group">
        <label for="nftAttributes">Attributes (optional)</label>
        <div v-for="(attr, index) in nftData.attributes" :key="index" class="attribute-row">
          <input type="text" v-model="attr.trait_type" placeholder="Trait name" />
          <input type="text" v-model="attr.value" placeholder="Value" />
          <button @click="removeAttribute(index)" class="remove-btn">✕</button>
        </div>
        <button @click="addAttribute" class="add-btn">Add Attribute</button>
      </div>
      
      <div class="form-group">
        <label for="nftPrice">Listing Price (SOL)</label>
        <input type="number" id="nftPrice" v-model="nftData.price" placeholder="Enter price in SOL" step="0.01" />
      </div>
      
      <div class="mint-actions">
        <button @click="mintNFT" :disabled="minting" class="mint-btn">
          {{ minting ? 'Minting...' : 'Mint NFT' }}
        </button>
      </div>
      
      <div v-if="mintStatus" class="mint-status" :class="{ error: mintStatus.isError }">
        {{ mintStatus.message }}
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { walletAdapterIdentity } from '@metaplex-foundation/umi-signer-wallet-adapters';
import { createNft, mplTokenMetadata } from '@metaplex-foundation/mpl-token-metadata';
import { publicKey } from '@metaplex-foundation/umi';
import axios from 'axios';
import FormData from 'form-data';

export default {
  name: 'NFTMint',
  setup() {
    const walletConnected = ref(false);
    const minting = ref(false);
    const imagePreview = ref(null);
    const imageFile = ref(null);
    const mintStatus = ref(null);
    const umi = ref(null);
    
    const nftData = reactive({
      name: '',
      description: '',
      attributes: [],
      price: 0.1,
      royalties: 5 // 5% royalties by default
    });
    
    onMounted(() => {
      checkWalletConnection();
    });
    
    const checkWalletConnection = async () => {
      try {
        // Check if Phantom wallet is available
        if (window.phantom?.solana?.isPhantom) {
          // Check if already connected
          const resp = await window.phantom.solana.connect({ onlyIfTrusted: true });
          if (resp.publicKey) {
            walletConnected.value = true;
            initializeUmi();
          }
        }
      } catch (error) {
        console.log('Not connected to wallet:', error);
      }
    };
    
    const connectWallet = async () => {
      try {
        if (!window.phantom?.solana?.isPhantom) {
          mintStatus.value = {
            message: 'Phantom wallet extension not found! Please install it first.',
            isError: true
          };
          return;
        }
        
        const resp = await window.phantom.solana.connect();
        walletConnected.value = true;
        initializeUmi();
      } catch (error) {
        mintStatus.value = {
          message: 'Failed to connect wallet: ' + error.message,
          isError: true
        };
      }
    };
    
    const initializeUmi = () => {
      const endpoint = 'https://api.devnet.solana.com'; // Using Devnet for development
      
      umi.value = createUmi(endpoint)
        .use(walletAdapterIdentity(window.phantom.solana))
        .use(mplTokenMetadata());
    };
    
    const handleImageUpload = (event) => {
      const file = event.target.files[0];
      if (!file) return;
      
      imageFile.value = file;
      
      // Create a preview
      const reader = new FileReader();
      reader.onload = (e) => {
        imagePreview.value = e.target.result;
      };
      reader.readAsDataURL(file);
    };
    
    const addAttribute = () => {
      nftData.attributes.push({ trait_type: '', value: '' });
    };
    
    const removeAttribute = (index) => {
      nftData.attributes.splice(index, 1);
    };
    
    const mintNFT = async () => {
      if (!walletConnected.value) {
        mintStatus.value = {
          message: 'Please connect your wallet first',
          isError: true
        };
        return;
      }
      
      if (!nftData.name || !imageFile.value) {
        mintStatus.value = {
          message: 'Please provide a name and upload an image',
          isError: true
        };
        return;
      }
      
      try {
        minting.value = true;
        mintStatus.value = {
          message: 'Uploading image to Pinata...',
          isError: false
        };
        
        // Check if wallet is properly connected
        if (!window.phantom?.solana?.publicKey) {
          throw new Error('Wallet connection not found. Please reconnect your wallet.');
        }
        
        // Validate wallet public key
        if (!window.phantom.solana.publicKey.toString()) {
          throw new Error('Could not get public key from wallet.');
        }
        
        // 1. Upload image to Pinata
        const imageUploadResponse = await uploadFileToPinata(imageFile.value);
        
        if (!imageUploadResponse.success) {
          throw new Error('Failed to upload image: ' + imageUploadResponse.message);
        }
        
        const imageIpfsUrl = `https://gateway.pinata.cloud/ipfs/${imageUploadResponse.IpfsHash}`;
        
        // 2. Create metadata JSON
        const metadataJson = {
          name: nftData.name,
          description: nftData.description,
          image: imageIpfsUrl,
          attributes: nftData.attributes.filter(attr => attr.trait_type && attr.value),
          properties: {
            files: [
              {
                uri: imageIpfsUrl,
                type: imageFile.value.type
              }
            ]
          }
        };
        
        mintStatus.value = {
          message: 'Uploading metadata to Pinata...',
          isError: false
        };
        
        // 3. Upload metadata to Pinata
        const metadataUploadResponse = await uploadJsonToPinata(metadataJson, `${nftData.name.replace(/\s+/g, '-')}-metadata`);
        
        mintStatus.value = {
          message: 'Creating NFT on Solana...',
          isError: false
        };
        
        // 4. Calculate royalty percentage (basis points - 100 = 1%)
        const sellerFeeBasisPoints = nftData.royalties * 100;
        
        // // Calculate royalty percentage (basis points - 100 = 1%)
        // const sellerFeeBasisPoints = nftData.royalties * 100;
        
        // Get owner's wallet public key in Umi format
const ownerPublicKey = publicKey(window.phantom.solana.publicKey.toBase58());
        
        // Create NFT using Metaplex
        const metadataUri = `https://gateway.pinata.cloud/ipfs/${metadataUploadResponse.IpfsHash}`;
        
        mintStatus.value = {
          message: 'Creating NFT on Solana...',
          isError: false
        };
        
        const mintResult = await createNft(umi.value, {
          name: nftData.name,
          uri: metadataUri,
          sellerFeeBasisPoints,
          tokenOwner: ownerPublicKey,
          updateAuthority: ownerPublicKey
          // Set collection if you have one
          // collection: {
          //   key: publicKey(collectionPublicKeyString),
          //   verified: false
          // }
        }).sendAndConfirm(umi.value);
        
        const mintAddress = mintResult.signature.signatures[0];
        
        mintStatus.value = {
          message: 'NFT minted successfully! Now saving to database...',
          isError: false
        };
        
        // 6. Save NFT data to your MongoDB database via Express API
        const nftListingData = {
          mintAddress,
          name: nftData.name,
          description: nftData.description,
          image: `https://gateway.pinata.cloud/ipfs/${imageUploadResponse.IpfsHash}`,
          metadata: `https://gateway.pinata.cloud/ipfs/${metadataUploadResponse.IpfsHash}`,
          price: nftData.price,
          sellerWallet: window.phantom.solana.publicKey.toString(),
          attributes: nftData.attributes.filter(attr => attr.trait_type && attr.value),
          createdAt: new Date().toISOString()
        };
        
        // Save to backend
        await saveNFTToDatabase(nftListingData);
        
        mintStatus.value = {
          message: 'NFT created and listed successfully!',
          isError: false
        };
        
        // Reset form
        nftData.name = '';
        nftData.description = '';
        nftData.attributes = [];
        nftData.price = 0.1;
        imageFile.value = null;
        imagePreview.value = null;
        
      } catch (error) {
        console.error('Error minting NFT:', error);
        mintStatus.value = {
          message: 'Error minting NFT: ' + error.message,
          isError: true
        };
      } finally {
        minting.value = false;
      }
    };
    
    const uploadFileToPinata = async (file) => {
      try {
        // Create form data
        const formData = new FormData();
        formData.append('file', file);
        
        // Add pinata metadata
        const metadata = JSON.stringify({
          name: `${nftData.name.replace(/\s+/g, '-')}-image`,
        });
        formData.append('pinataMetadata', metadata);
        
        // Add pinata options
        const options = JSON.stringify({
          cidVersion: 0,
        });
        formData.append('pinataOptions', options);
        
        // Make request to Pinata API
        const response = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
          maxBodyLength: 'Infinity',
          headers: {
            'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
            'pinata_api_key': import.meta.env.VITE_PINATA_API_KEY,
            'pinata_secret_api_key': import.meta.env.VITE_PINATA_SECRET_API_KEY
          }
        });
        
        return {
          success: true,
          IpfsHash: response.data.IpfsHash
        };
      } catch (error) {
        console.error('Error uploading file to Pinata:', error);
        return {
          success: false,
          message: error.message
        };
      }
    };
    
    const uploadJsonToPinata = async (jsonData, name) => {
      try {
        const response = await axios.post('https://api.pinata.cloud/pinning/pinJSONToIPFS', jsonData, {
          headers: {
            'Content-Type': 'application/json',
           'pinata_api_key': import.meta.env.VITE_PINATA_API_KEY,
            'pinata_secret_api_key': import.meta.env.VITE_PINATA_SECRET_API_KEY
          }
        });
        
        return {
          success: true,
          IpfsHash: response.data.IpfsHash
        };
      } catch (error) {
        console.error('Error uploading JSON to Pinata:', error);
        return {
          success: false,
          message: error.message
        };
      }
    };
    
    const saveNFTToDatabase = async (nftData) => {
      try {
        // Replace with your actual API endpoint
        const response = await axios.post('/api/nfts', nftData);
        return response.data;
      } catch (error) {
        console.error('Error saving NFT to database:', error);
        throw new Error('Failed to save NFT listing to database');
      }
    };
    
    return {
      walletConnected,
      nftData,
      minting,
      imagePreview,
      mintStatus,
      connectWallet,
      handleImageUpload,
      addAttribute,
      removeAttribute,
      mintNFT
    };
  }
}
</script>

<style scoped>
.nft-mint-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.form-group {
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

input, textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

textarea {
  min-height: 100px;
}

.image-preview {
  margin-top: 10px;
  max-width: 200px;
}

.image-preview img {
  width: 100%;
  border-radius: 4px;
}

.attribute-row {
  display: flex;
  gap: 10px;
  margin-bottom: 8px;
}

.remove-btn {
  background: #ff6b6b;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 5px 10px;
  cursor: pointer;
}

.add-btn {
  background: #4dabf7;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 15px;
  cursor: pointer;
}

.mint-btn {
  background: #33b249;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 12px 20px;
  font-size: 16px;
  cursor: pointer;
}

.mint-btn:disabled {
  background: #a5d8af;
  cursor: not-allowed;
}

.connect-btn {
  background: #814cff;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 12px 20px;
  font-size: 16px;
  cursor: pointer;
}

.mint-status {
  margin-top: 15px;
  padding: 10px;
  border-radius: 4px;
  background: #e3f2fd;
  color: #0d47a1;
}

.mint-status.error {
  background: #ffebee;
  color: #c62828;
}
</style>