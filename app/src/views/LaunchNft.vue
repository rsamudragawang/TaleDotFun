<template>
    <div class="home-view">
        <div class="circle-bg"></div>
        <div class="flex flex-col gap-4 items-center text-center mt-[80px]">
            <h1 class="text-white text-[64px]">Stories You Can Own<br>
                NFTs You Can Create</h1>
            <p class="text-slate-400 text-[20px]">Whether you're a creator looking to publish, or a fan ready to collect
                <br> TaleDotFun makes cultural storytelling collectible, tradable, and community-powered
            </p>
        </div>
        <div class="mt-[56px] flex gap-[24px] justify-center">
            <Button @click="router.push('/publish-nft')">
                <img src="/public/icons/number.svg" alt="publish">
                Publish Your Own NFTs</Button>
            <Button severity="secondary">
                <img src="/public/icons/id_card.svg" alt="collect">
                Collect Cultural NFTs</Button>
        </div>
        <div class="mt-[120px] pt-[48px]">
            <div class="flex items-center justify-between">
                <h1 class="text-white text-2xl">Get Inspired by Others Creator</h1>
            </div>
            <div class="grid grid-cols-12 gap-[24px]">
                {{ lis }}
                <div v-for="(nft, i) in listedNfts" :key="i" class="col-span-3 rounded-lg mt-5" style="background-color: rgba(0, 0, 0, 0.5);">
                    <img :src="nft.image" alt="NFT Image" style="height:400px;width:100%;height:auto;object-fit:cover;">
                    <div class="relative p-4">
                        <div class="mt-5">
                            <h1 class="text-lg">{{ nft.name }}</h1>
                            <div class="flex gap-4 py-4 justify-between items-center">
                                <div class="flex gap-2 items-center">
                                    <img src="/public/icons/solana.svg" alt="solana" w->
                                    <p class="text-slate-400">{{ nft.price ? nft.price.toLocaleString(undefined, { maximumFractionDigits: 3 }) : '-' }} SOL</p>
                                </div>
                                <div class="flex gap-2 items-center">
                                    <i class="pi pi-user"></i>
                                    <p class="text-slate-400">{{ nft.itemsRemaining || 0 }}/{{ nft.itemsAvailable || 0 }}</p>
                                </div>
                            </div>
                            <div class="pt-4 mt-6 border-t border-white">
                                <div class="flex items-center justify-between">
                                    <p class="text-slate-400">a story from</p>
                                    <div class="flex gap-2 items-center">
                                        <img :src="nft.creatorAvatar" alt="avatar" class="w-6 h-6 rounded-full">
                                        <p class="text-slate-400">{{ nft.creatorName }}</p>
                                    </div>
                                </div>
                            </div>
                            <Button 
                                class="w-full mt-4" 
                                severity="secondary"
                                :loading="nft.isMinting"
                                :disabled="!nft.itemsRemaining || nft.isMinting || !wallet.connected.value"
                                @click="handleMint(nft, i)"
                            >
                                {{ getMintButtonText(nft) }}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import Button from 'primevue/button';
import { useRouter } from 'vue-router';
import { ref, onMounted } from 'vue';
import { Connection, PublicKey, SystemProgram } from '@solana/web3.js';
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import taleNftIdl from '../anchor/tale_nft.json'; // Ensure this IDL is up-to-date
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { 
    mplCandyMachine, 
    fetchCandyMachine,
    mintV2,
    fetchCandyGuard
} from '@metaplex-foundation/mpl-candy-machine';
import { 
    generateSigner,
    transactionBuilder,
    publicKey as umiPublicKey,
    some as umiSome,
    // sol as umiSol // Not directly used for solPayment value construction here
} from '@metaplex-foundation/umi';
import { setComputeUnitLimit } from '@metaplex-foundation/mpl-toolbox';
import { walletAdapterIdentity } from '@metaplex-foundation/umi-signer-wallet-adapters';
import { useWallet } from 'solana-wallets-vue';
import axios from 'axios';

const router = useRouter();
const wallet = useWallet();
const SOLANA_RPC_URL = import.meta.env.VITE_RPC_ENDPOINT || 'https://api.devnet.solana.com';
const AUTH_API_BASE_URL = import.meta.env.VITE_APP_AUTH_API_URL || 'http://localhost:3000/api';
const TALE_NFT_PROGRAM_ID = new PublicKey(taleNftIdl.address); // Ensure taleNftIdl.address is correct
const connection = new Connection(SOLANA_RPC_URL, 'confirmed');
const listedNfts = ref([]);

function getMintButtonText(nft) {
    if (!wallet.connected.value) return 'Connect Wallet to Mint';
    if (!nft.itemsRemaining) return 'Sold Out';
    if (nft.isMinting) return 'Minting...';
    return 'Mint & Get Special Access';
}

async function handleMint(nft, index) {
    if (!wallet.connected.value || !wallet.publicKey.value) {
        alert('Please connect your wallet to mint');
        return;
    }

    if (!nft.itemsRemaining) {
        alert('This NFT collection is sold out');
        return;
    }

    listedNfts.value[index].isMinting = true;

    try {
        const umi = createUmi(SOLANA_RPC_URL)
            .use(walletAdapterIdentity(wallet.wallet.value.adapter))
            .use(mplCandyMachine());

        const candyMachine = await fetchCandyMachine(
            umi,
            umiPublicKey(nft.candyMachineAddress)
        );

        const candyGuard = await fetchCandyGuard(
            umi,
            candyMachine.mintAuthority
        );

        const nftMintSigner = generateSigner(umi);

        const builder = transactionBuilder()
            .add(setComputeUnitLimit(umi, { units: 800_000 }))
            .add(
                mintV2(umi, {
                    candyMachine: candyMachine.publicKey,
                    nftMint: nftMintSigner,
                    collectionMint: candyMachine.collectionMint,
                    collectionUpdateAuthority: candyMachine.authority,
                    candyGuard: candyGuard.publicKey, // candyGuard should always exist for v2 mint
                    mintArgs: {
                        solPayment: umiSome({ destination: candyGuard.guards.solPayment.value.destination }),
                        // Add other guard arguments if needed, e.g., for tokenPayment, allowList, etc.
                    },
                })
            );

        const result = await builder.sendAndConfirm(umi, {
            confirm: { commitment: 'confirmed' }
        });

        const nftMintWeb3 = new PublicKey(nftMintSigner.publicKey.toString());
        const userWalletWeb3 = new PublicKey(wallet.publicKey.value.toString());
        const candyMachineIdWeb3 = new PublicKey(candyMachine.publicKey.toString());


        // Correct PDA derivation for mint_activity_account
        const [mintActivityPDA, _mintActivityBump] = await PublicKey.findProgramAddress(
        [
            Buffer.from("mint_activity"),
            userWalletWeb3.toBuffer(),
            nftMintWeb3.toBuffer() // <--- Use the unique NFT mint address here
        ],
        TALE_NFT_PROGRAM_ID
    );
        
        console.log("Derived mintActivityPDA:", mintActivityPDA.toString());
        console.log("Using candyMachineId for PDA seed:", candyMachineIdWeb3.toString());
        console.log("Calling logMintActivity with arguments:");
        console.log("  candy_machine_id_arg:", candyMachineIdWeb3.toString());
        console.log("  transaction_signature_str:", result.signature.toString()); // Ensure it's a string
        console.log("  episode_on_chain_pda_option:", undefined);
        console.log("Accounts for logMintActivity:");
        console.log("  mintActivityAccount:", mintActivityPDA.toString());
        console.log("  nftMintAddress:", nftMintWeb3.toString());
        console.log("  userWallet:", userWalletWeb3.toString());


        const provider = new AnchorProvider(connection, wallet.wallet.value.adapter, AnchorProvider.defaultOptions());
        const program = new Program(taleNftIdl,  provider);


        await program.methods
            .logMintActivity(
                candyMachineIdWeb3, // candy_machine_id_arg (Pubkey)
                Buffer.from(result.signature).toString('base64'), // transaction_signature_str (String) - ensure it's correctly formatted if not already a string
                null // episode_on_chain_pda_option (Option<Pubkey>) - null or undefined for None
            )
            .accounts({
                mintActivityAccount: mintActivityPDA,
                nftMintAddress: nftMintWeb3,
                userWallet: userWalletWeb3,
                systemProgram: SystemProgram.programId,
            })
            .rpc();

        alert(`Successfully minted NFT! Transaction: ${Buffer.from(result.signature).toString('base64')}`);
        await fetchListedNftsWithMetadata();

    } catch (error) {
        console.error('Minting error:', error);
        let errorMessage = error.message;
        if (error.logs) {
            errorMessage += "\nProgram Logs:\n" + error.logs.join("\n");
        }
        alert(`Minting failed: ${errorMessage}`);
    } finally {
        listedNfts.value[index].isMinting = false;
    }
}

async function fetchListedNftsWithMetadata() {
    try {
        // Use a generic provider for read-only operations if wallet not needed
        const provider = new AnchorProvider(connection, wallet.wallet?.value?.adapter || {publicKey: PublicKey.default, signTransaction: async () => {}, signAllTransactions: async () => {}}, AnchorProvider.defaultOptions());
        const program = new Program(taleNftIdl, provider);
        
        const allListed = await program.account.listedNft.all();
        const umi = createUmi(SOLANA_RPC_URL).use(mplCandyMachine());

        listedNfts.value = await Promise.all(
            allListed.map(async (item) => {
                let cmData = null;
                let name = '';
                let image = 'https://placehold.co/326x327'; // Default placeholder
                let price = null;
                let itemsAvailable = null;
                let itemsMinted = null;
                let itemsRemaining = null;
                let metadata = null;

                try {
                    cmData = await fetchCandyMachine(umi, umiPublicKey(item.account.candyMachineAddress.toString()));
                    
                    if (cmData.items && cmData.items.length > 0 && cmData.items[0].name) {
                        name = cmData.items[0].name;
                    } else if (cmData.data.name) { // Fallback to candy machine name if item name not found
                        name = cmData.data.name;
                    }

                    console.log("pricez", Number(cmData.header.lamports.basisPoints) / 1_000_000_000);
                    

                    // Assuming solPayment guard is present for price
                    if (cmData.header.lamports.basisPoints) {
                        price = Number(cmData.header.lamports.basisPoints) / 1_000_000_000;
                    } else if (cmData.configLineSettings && cmData.configLineSettings.prefixName){ //legacy
                        name = cmData.configLineSettings.prefixName;
                    }


                    itemsAvailable = Number(cmData.data.itemsAvailable);
                    itemsMinted = Number(cmData.itemsRedeemed);
                    itemsRemaining = itemsAvailable - itemsMinted;

                    if (cmData.items && cmData.items.length > 0 && cmData.items[0].uri) {
                        try {
                            const response = await fetch(cmData.items[0].uri.replace(/^https?:\/\/arweave.net\//, 'https://ar-io.dev/'));
                            if (response.ok) {
                                metadata = await response.json();
                                if (metadata.image) {
                                    image = metadata.image.replace(/^https?:\/\/arweave.net\//, 'https://ar-io.dev/');
                                }
                            }
                        } catch (fetchErr) {
                            console.warn(`Failed to fetch metadata from ${cmData.items[0].uri}`, fetchErr);
                        }
                    }
                } catch (cmErr) {
                    console.warn(`Failed to fetch candy machine ${item.account.candyMachineAddress.toString()}`, cmErr);
                }

                let creatorName = item.account.creatorWallet.toString().substring(0,6) + "...";
                let creatorAvatar = `https://ui-avatars.com/api/?rounded=true&bold=true&name=${encodeURIComponent(item.account.creatorWallet.toString().substring(0,2))}`;
                try {
                    const res = await axios.get(`${AUTH_API_BASE_URL}/users/address/${item.account.creatorWallet.toString()}`);
                    if (res.data && res.data.data) {
                        creatorName = res.data.data.name || item.account.creatorWallet.toString();
                        creatorAvatar = res.data.data.avatar || `https://ui-avatars.com/api/?rounded=true&bold=true&name=${encodeURIComponent(creatorName)}`;
                    }
                } catch (axiosErr) {
                    // Use default if fetching creator profile fails
                }

                return {
                    name: name || 'Untitled NFT Collection',
                    image,
                    price,
                    itemsAvailable,
                    itemsMinted,
                    itemsRemaining,
                    creatorName,
                    creatorAvatar,
                    candyMachineAddress: item.account.candyMachineAddress.toString(),
                    isMinting: false
                };
            })
        );
    } catch (e) {
        console.error("Failed to fetch listed NFTs:", e);
        listedNfts.value = [];
    }
}

onMounted(() => {
    fetchListedNftsWithMetadata();
});
</script>

<style scoped>
.home-view {
    position: relative;
    /* Ensure other content is above the circle */
    z-index: 1;
}

/* Ensure content is above the background */
.flex, .grid {
    position: relative;
    z-index: 1;
}
</style>