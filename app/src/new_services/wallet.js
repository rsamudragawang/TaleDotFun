export const initWallet = async () => {
  // Check if Phantom is installed
  const isPhantomInstalled = window.solana && window.solana.isPhantom;
  
  if (!isPhantomInstalled) {
    throw new Error('Phantom wallet is not installed. Please install it from https://phantom.app/');
  }
  
  return window.solana;
};

export const connectWallet = async () => {
  try {
    const wallet = await initWallet();
    
    if (!wallet.isConnected) {
      const { publicKey } = await wallet.connect();
      return publicKey;
    } else {
      return wallet.publicKey;
    }
  } catch (error) {
    console.error('Error connecting to wallet:', error);
    throw error;
  }
};

export const disconnectWallet = async () => {
  try {
    const wallet = await initWallet();
    if (wallet.isConnected) {
      await wallet.disconnect();
    }
  } catch (error) {
    console.error('Error disconnecting wallet:', error);
    throw error;
  }
};