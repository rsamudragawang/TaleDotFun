import { 
  createSignerFromKeypair,
  generateSigner,
  publicKey,
} from '@metaplex-foundation/umi';
import { 
  createNft,
  mplTokenMetadata,
  findMetadataPda,
  TokenStandard,
  printSupply,
  mintV1
} from '@metaplex-foundation/mpl-token-metadata';
import { initWallet } from './walletService';
import { uploadFileToIPFS, uploadJsonToIPFS } from './pinataService';
import { Base64 } from 'js-base64';

export const createNFTWithMetaplex = async (name, description, image, attributes, maxSupply = 1) => {
  try {
    // 1. Connect to wallet
    const { umi } = await initWallet();
    umi.use(mplTokenMetadata());
    
    // 2. Upload image to IPFS via Pinata
    const fileUploadResult = await uploadFileToIPFS(image);
    if (!fileUploadResult.success) {
      throw new Error(`Failed to upload image: ${fileUploadResult.error}`);
    }
    
    // 3. Create metadata JSON
    const metadata = {
      name,
      description,
      image: fileUploadResult.imageUrl,
      attributes,
      properties: {
        files: [
          {
            uri: fileUploadResult.imageUrl,
            type: image.type,
          },
        ],
        maxSupply,
      },
    };
    
    // 4. Upload metadata to IPFS
    const metadataUploadResult = await uploadJsonToIPFS(metadata);
    if (!metadataUploadResult.success) {
      throw new Error(`Failed to upload metadata: ${metadataUploadResult.error}`);
    }
    
    // 5. Create a new mint signer
    
    const mint = generateSigner(umi);
    console.log('DEBUG: maxSupply for createNft:', maxSupply);
    console.log('DEBUG: TokenStandard:', TokenStandard.Fungible);
    // 6. Create NFT using Metaplex
    const { signature } = await createNft(umi, {
      mint,
      name,
      uri: metadataUploadResult.metadataUrl,
      sellerFeeBasisPoints: 500, // 5%
      tokenStandard: TokenStandard.Fungible,
      printSupply: printSupply('Limited',[100]), // Set maxSupply if greater than 1
    }).sendAndConfirm(umi);
    
    // 7. Return the result
    return {
      success: true,
      mint: mint.publicKey,
      metadataPda: findMetadataPda(umi, { mint: mint.publicKey })[0],
      signature,
      imageUrl: fileUploadResult.imageUrl,
      metadataUrl: metadataUploadResult.metadataUrl,
      maxSupply,
    };
  } catch (error) {
    console.error('Error creating NFT:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// export const mintNft = async (name, description, image, attributes, maxSupply = 1) => {
//   try {
//     // 1. Connect to wallet
//     const { umi } = await initWallet();
//     umi.use(mplTokenMetadata());
//     const mint = await mintV1(umi, {
//   mint: '8ZxnxJNEtPncrSeWCPreEULpnCMBcy2dD2QmozbFUbQs',
//   authority,
//   amount: 1,
//   tokenOwner,
//   tokenStandard: TokenStandard.NonFungible,
// }).sendAndConfirm(umi)
// };

export const fetchNFTsForWallet = async (walletAddress) => {
  try {
    const { umi } = await initWallet();

    console.log('wallet')

    
    // For simplicity, we'll use the Solana devnet API to fetch NFTs
    const endpoint = process.env.VUE_APP_SOLANA_NETWORK === 'mainnet' 
      ? 'https://api.mainnet-beta.solana.com'
      : 'https://api.devnet.solana.com';
    
    // Use proper JSON-RPC POST request format
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getProgramAccounts',
        params: [
          'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s', // Metaplex Token Metadata Program
          {
            encoding: 'base64',
          }
        ],
      }),
    });
    
    const { result, error } = await response.json();
    
    if (error) {
      throw new Error(`RPC Error: ${error.message}`);
    }
    
    // Filter metadata accounts by owner (creator)
    const nfts = [];
    
    for (const item of result) {
      try {
        const data = Buffer.from(item.account.data[0], 'base64');
        
        // Parse the metadata - simplified version
        // In a production app, use proper deserialization with Metaplex SDK
        
        // Check if this token belongs to the wallet
        if (data.includes(walletAddress)) {
          // Try to extract URI
          const uriStartIndex = data.indexOf('https://');
          if (uriStartIndex !== -1) {
            let uriEndIndex = data.indexOf(0, uriStartIndex);
            if (uriEndIndex === -1) uriEndIndex = data.length;
            
            const uri = data.slice(uriStartIndex, uriEndIndex).toString();
            
            // Fetch metadata from URI
            try {
              const metadataResponse = await fetch(uri);
              const metadata = await metadataResponse.json();
              
              nfts.push({
                mint: item.pubkey,
                metadata,
                uri
              });
            } catch (e) {
              console.error('Error fetching metadata:', e);
            }
          }
        }
      } catch (e) {
        console.error('Error parsing metadata account:', e);
      }
    }
    
    return { success: true, nfts };
  } catch (error) {
    console.error('Error fetching NFTs:', error);
    return { success: false, error: error.message };
  }
};

export const getAllNFTs = async (walletAddress = 'BVqNsYSgStaNX1GqWxEoCFPPzzEqAGEj71XAjC47XpWy') => {
  const apiKey = '22e6bec9-fb29-4b91-a2b4-6122b40203f6'; // Replace with your actual Helius key
  const endpoint = `http://localhost:3000/api/nfts`;

  try {
    const response = await fetch(endpoint);
    const data = await response.json();

    const nfts = data.map((nft) => ({
      mint: nft.mintAddress,
      metadata: nft.metadata,
      uri: nft.content?.json_uri,
      name: nft.name,
      symbol: nft.name,
      image: nft.image
    }));

    return { success: true, nfts };
  } catch (error) {
    console.error('Error fetching NFTs from Helius:', error);
    return { success: false, error: error.message };
  }
};
