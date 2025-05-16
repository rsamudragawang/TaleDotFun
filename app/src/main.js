import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';
import { initWallet } from 'solana-wallets-vue'; // <<< IMPORT
import 'solana-wallets-vue/styles.css';

import PrimeVue from 'primevue/config';
import Aura from '@primeuix/themes/aura';
import ToastService from 'primevue/toastservice';
import 'primeicons/primeicons.css'
import './style.css';

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
createApp(App).use(router).use(PrimeVue, {
    theme: {
        preset: Aura,
        options: {
            prefix: 'p',
            darkModeSelector: '.app',
            cssLayer: false,
            cssVariables: {
                '--primary-color': '#3A6BD5'
            }
        }
    }
}).use(ToastService).mount('#app');