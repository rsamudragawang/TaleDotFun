import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { walletAdapterIdentity } from '@metaplex-foundation/umi-signer-wallet-adapters';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';

let phantomWallet = null;
let umi = null;

export const initWallet = async () => {
  if (!phantomWallet) {
    phantomWallet = new PhantomWalletAdapter();
  }
  
  if (!phantomWallet.connected) {
    try {
      await phantomWallet.connect();
      
      // Initialize UMI with the wallet
      const endpoint =  'https://api.devnet.solana.com';
      
      umi = createUmi(endpoint)
        .use(walletAdapterIdentity(phantomWallet));
      
      return { 
        wallet: phantomWallet,
        umi: umi,
        publicKey: phantomWallet.publicKey.toBase58() 
      };
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    }
  } else {
    return { 
      wallet: phantomWallet,
      umi: umi,
      publicKey: phantomWallet.publicKey.toBase58() 
    };
  }
};

export const disconnectWallet = async () => {
  if (phantomWallet && phantomWallet.connected) {
    await phantomWallet.disconnect();
    phantomWallet = null;
    umi = null;
    return true;
  }
  return false;
};

export const getWalletInfo = () => {
  if (phantomWallet && phantomWallet.connected) {
    return {
      connected: true,
      publicKey: phantomWallet.publicKey.toBase58(),
      umi: umi
    };
  }
  return { connected: false };
};

// Helper function to shorten public key for display
export const shortenAddress = (address, chars = 4) => {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
};

// Get network explorer URL (for transaction links)
export const getExplorerUrl = (signature, cluster = 'devnet') => {
  return `https://explorer.solana.com/tx/${signature}?cluster=${cluster}`;
};