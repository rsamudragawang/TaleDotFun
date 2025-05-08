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
      const endpoint = process.env.VUE_APP_SOLANA_NETWORK === 'mainnet' 
        ? 'https://api.mainnet-beta.solana.com'
        : 'https://api.devnet.solana.com';
      
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