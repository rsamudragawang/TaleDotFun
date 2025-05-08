import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import './assets/tailwind.css';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';
import { initWallet } from 'solana-wallets-vue'; // <<< IMPORT
import 'solana-wallets-vue/styles.css';

const network = WalletAdapterNetwork.Devnet;
const wallets = [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter({ network }),
];

// <<< CALL initWallet BEFORE createApp/mount >>>
initWallet({
    wallets,
    autoConnect: true, // Or false based on your preference
});
createApp(App).use(router).mount('#app');