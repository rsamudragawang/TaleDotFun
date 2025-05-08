/**
 * Initializes and configures the Umi instance for Metaplex interactions.
 * Umi provides a modern, modular way to interact with Solana programs.
 *
 * @see https://github.com/metaplex-foundation/umi
 */
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { walletAdapterIdentity } from '@metaplex-foundation/umi-signer-wallet-adapters';
import { mplCore } from '@metaplex-foundation/mpl-core'; // Umi plugin for Metaplex Core interaction
// Optional: Import other Metaplex program plugins if needed
// import { mplTokenMetadata } from '@metaplex-foundation/mpl-token-metadata';
// import { mplCandyMachine } from '@metaplex-foundation/mpl-candy-machine-core'; // Example

// Get the Solana RPC endpoint from environment variables, default to Devnet
const SOLANA_RPC_URL = process.env.VUE_APP_SOLANA_RPC_URL || 'https://api.devnet.solana.com';

/**
 * The main Umi instance used throughout the application.
 * It's configured with default bundles (RPC, payer, etc.) and Metaplex Core.
 * The identity (signer) is set dynamically using `updateUmiWallet`.
 */
export const umi = createUmi(SOLANA_RPC_URL)
  .use(mplCore())
  // .use(mplTokenMetadata()) // Uncomment if needed
  // .use(mplCandyMachine()) // Uncomment if needed
  ;

// Store the current wallet adapter associated with the Umi instance
// This helps prevent unnecessary re-registrations if the adapter hasn't changed.
let currentUmiWalletAdapter = null;

/**
 * Updates the Umi instance's identity signer and default payer
 * based on the connected wallet adapter state from `solana-wallets-vue`.
 * This function should be called whenever the wallet's connection status or adapter changes.
 *
 * @param {object | null | undefined} walletAdapter - The Solana Wallet Adapter instance (e.g., from `useWallet().wallet.value?.adapter`).
 */
export function updateUmiWallet(walletAdapter) {
  // Avoid unnecessary updates if the adapter instance hasn't changed.
  // Note: This simple check might not catch all state changes within the adapter.
  // if (walletAdapter === currentUmiWalletAdapter) {
  //   // Optional: More robust check could compare publicKey or connected status if adapter reference is stable
  //   return;
  // }

  if (
    walletAdapter &&
    walletAdapter.publicKey &&
    walletAdapter.connected && // Ensure the adapter considers itself connected
    typeof walletAdapter.signTransaction === 'function' && // Ensure signing capability
    typeof walletAdapter.signAllTransactions === 'function'
  ) {
    // If the adapter looks valid and connected, set it as the Umi identity.
    // This allows Umi to sign transactions using the connected wallet.
    try {
      // Check if the identity needs changing (e.g., different public key)
      if (!umi.identity.publicKey || umi.identity.publicKey.toString() !== walletAdapter.publicKey.toBase58()) {
        console.log(`Umi: Setting identity to wallet ${walletAdapter.name} (${walletAdapter.publicKey.toBase58()})`);
        umi.use(walletAdapterIdentity(walletAdapter));
        currentUmiWalletAdapter = walletAdapter; // Store the currently used adapter
      }
      // else { console.log("Umi: Wallet adapter already set to the correct identity."); }
    } catch (error) {
      console.error("Umi: Error setting wallet adapter identity:", error);
      currentUmiWalletAdapter = null; // Reset on error
    }
  } else {
    // If no wallet is connected, or the adapter is invalid/disconnected.
    if (currentUmiWalletAdapter !== null) { // Only log/clear if an adapter *was* previously set
      console.log("Umi: Clearing identity (Wallet disconnected or unavailable).");
      // To truly "remove" the identity/signer, you might need to re-register
      // with a guest identity or handle it based on how Umi manages context.
      // For now, subsequent operations requiring `umi.identity` will fail if no wallet is set.
      // Resetting the payer to a default might also be needed depending on Umi setup.
      // umi.use(guestIdentity()); // Requires: import { guestIdentity } from '@metaplex-foundation/umi';
      currentUmiWalletAdapter = null;
    }
    // Log warning if called without a valid adapter when none was set previously
    // else { console.warn("Umi: updateUmiWallet called with no valid adapter."); }
  }
}

console.log(`Umi instance created for RPC: ${SOLANA_RPC_URL}`);

// Note: It's generally recommended that components import specific types
// (like PublicKey, BN, etc.) directly from their source libraries
// (@solana/web3.js, bn.js, @metaplex-foundation/umi) as needed,
// rather than re-exporting everything from this utility file.