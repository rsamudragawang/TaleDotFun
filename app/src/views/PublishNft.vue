<template>
    <div class="home-view">
        <div class="circle-bg"></div>
        <Toast />
        <Form v-slot="$form" :resolver="resolver" :initialValues="initialValues" @submit="onFormSubmit">
            <div class="max-w-[738px] mx-auto p-8" style="background-color: rgba(0, 0, 0, .1);">
                <div class="flex gap-4 h-[200px] items-center">
                    <div class="flex-1">
                        <div class="flex flex-col gap-1">
                            <label for="name">Name</label>
                            <InputText name="name" type="text" placeholder="Name" class="w-full" />
                            <Message v-if="$form.name?.invalid" severity="error" size="small" variant="simple">{{
                                $form.name.error?.message }}</Message>
                        </div>
                    </div>
                    <div class="flex-1">
                        <div class="flex flex-col gap-1">
                            <label for="symbol">Symbol</label>
                            <InputText name="symbol" type="text" placeholder="Symbol" class="w-full" />
                            <Message v-if="$form.symbol?.invalid" severity="error" size="small" variant="simple">{{
                                $form.symbol.error?.message }}</Message>
                        </div>
                    </div>
                </div>
                <div class="flex gap-4 items-center">
                    <div class="flex-1">
                        <h1 class="text-white text-2xl">Collection Image</h1>
                        <p class="text-slate-400 text-sm">Image that will be shown as the main image for the collection.
                            Recommended: 800×800px jpg</p>
                    </div>
                    <div class="flex-1">
                        <div class="h-[400px] rounded-lg p-5 flex items-center justify-center"
                            style="background-color: rgba(0, 0, 0, .1);">
                            <FileUpload @select="handleImageFileChange" name="image" mode="basic" accept="image/*"
                                 class="w-full h-full">
                                <template #empty>
                                    <span>Drag and drop files to here to upload.</span>
                                </template>
                            </FileUpload>
                        </div>
                    </div>
                </div>
                <div class="flex flex-col gap-1 mt-4">
                    <label for="description">Description</label>
                    <Textarea name="description" placeholder="e.g. The Pond is the greatest collection ever made"
                        class="w-full h-[100px]" />
                    <Message v-if="$form.description?.invalid" severity="error" size="small" variant="simple">{{
                        $form.description.error?.message }}</Message>
                </div>
            </div>
            <div class="max-w-[738px] mx-auto p-8" style="background-color: rgba(0, 0, 0, .1);">
                <div class="flex gap-4 mt-4">
                    <div class="flex-1 flex flex-col gap-1">
                        <label for="description">Mint Price</label>
                        <InputGroup>
                            <InputNumber mode="decimal" name="mintPrice" placeholder="0.000" :minFractionDigits="1"
                                :maxFractionDigits="3" class="w-full" />
                            <InputGroupAddon>SOL</InputGroupAddon>
                        </InputGroup>
                        <Message v-if="$form.mintPrice?.invalid" severity="error" size="small" variant="simple">{{
                            $form.mintPrice.error?.message }}</Message>
                    </div>
                </div>
                <div class="flex gap-4 mt-4">
                    <div class="flex-1 flex flex-col gap-1">
                        <label for="maxSupply">Max Supply</label>
                        <InputNumber name="maxSupply" type="number" placeholder="0.00" class="w-full" />
                        <Message v-if="$form.maxSupply?.invalid" severity="error" size="small" variant="simple">{{
                            $form.maxSupply.error?.message }}</Message>
                    </div>
                </div>
                <Button type="submit" label="Publish NFT" class="mt-[20px] w-full" />
            </div>
        </Form>
    </div>
    <Dialog v-model:visible="showProcessingModal" modal :style="{ width: '50vw', backgroundColor: '#100C18' }"
        :closable="false">
        <div class="flex flex-col items-center text-center gap-4 py-4">
            <div class="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
            <h2 class="text-2xl font-bold text-center">Processing your requests...</h2>
            <p class="text-center text-gray-400 text-sm mt-4">It takes about 30 - 60 seconds,o please wait until the process is completed.</p>
        </div>
    </Dialog>
</template>



<script setup>
import { ref, computed, watch, } from 'vue';
import { zodResolver } from '@primevue/forms/resolvers/zod';
import { useToast } from "primevue/usetoast";
import { z } from 'zod';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Message from 'primevue/message';
import { Form } from '@primevue/forms';
import FileUpload from 'primevue/fileupload';
import Textarea from 'primevue/textarea';
import { InputGroup, InputGroupAddon, InputNumber, DatePicker } from 'primevue';
import Dialog from 'primevue/dialog';
import Toast from 'primevue/toast';
import { useWallet, WalletMultiButton } from 'solana-wallets-vue';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { walletAdapterIdentity } from '@metaplex-foundation/umi-signer-wallet-adapters';
import {
    mplCandyMachine,
    create,
    addConfigLines,
    CandyMachine,
    CandyGuard,
    ConfigLine,
    // TokenStandard as UmiTokenStandard, // This is UMI's enum/type
} from '@metaplex-foundation/mpl-candy-machine';
import { createNft, TokenStandard } from '@metaplex-foundation/mpl-token-metadata'; // For collection
import {
    generateSigner,
    percentAmount,
    sol,
    dateTime,
    some,
    // PublicKey as UmiPublicKey, // UMI's PublicKey type
    publicKey as umiPublicKeyUtil, // UMI's utility to create a PublicKey
    // Signer,
    none,
    // publicKey,
} from '@metaplex-foundation/umi';
import { setComputeUnitLimit, setComputeUnitPrice } from '@metaplex-foundation/mpl-toolbox';
import { base58 } from '@metaplex-foundation/umi/serializers';
import { createCollection } from '@metaplex-foundation/mpl-core'
import { initWallet } from '../services/walletService';
import { uploadFileToIPFS, uploadJsonToIPFS } from '../services/pinataService';
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import axios from 'axios'
import { PublicKey, PublicKey as SolanaWeb3JsPublicKey, Connection, SystemProgram } from '@solana/web3.js';
import { useRouter } from 'vue-router';

const toast = useToast();
const router = useRouter();
const initialValues = ref({
    name: '',
    symbol: '',
    image: '',
    description: '',
    mintPrice: '',
    maxSupply: '',
});

const resolver = ref(zodResolver(
    z.object({
        name: z.string().min(1, { message: 'Name is required.' }),
        symbol: z.string().min(1, { message: 'Symbol is required.' }),
        image: z.array(z.string()).min(1, { message: 'Image is required.' }),
        description: z.string().min(1, { message: 'Description is required.' }),
        mintPrice: z.number().min(0, { message: 'Mint price is required.' }),
        maxSupply: z.number().min(0, { message: 'Max supply is required.' }),
    })
));


const AUTH_API_BASE_URL = import.meta.env.VITE_APP_AUTH_API_URL || 'http://localhost:3000/api';
const RPC_ENDPOINT = 'https://api.devnet.solana.com';
const WALLET_PLACEHOLDER = "YOUR_WALLET_ADDRESS_PLACEHOLDER";
const JWT_TOKEN_KEY = 'readium_fun_jwt_token';

const wallet = useWallet(); // wallet.publicKey.value is a SolanaWeb3JsPublicKey | null
const connection = new Connection(RPC_ENDPOINT, "confirmed");
const emit = defineEmits(['candyMachineCreated']);
const isLoading = ref(false);
const appUser = ref(null);
const isLoadingUser = ref(false);
const nftList = ref(null);
const successMessage = ref('');
const errorMessage = ref('');
const createdCandyMachineId = ref('');
const createdCollectionId = ref('');
const transactionSignature = ref('');
import idlFromFile from '../anchor/tale_nft.json';
const PROGRAM_ID = new SolanaWeb3JsPublicKey(idlFromFile.address);
const idl = idlFromFile;
let provider;
let program;
const imageAll = ref({ imagePreviewUrl: null, imageUrl: '', imageFile: null })
const cmConfig = ref({
    itemsAvailable: 1,
    sellerFeeBasisPoints: 500,
    namePrefix: 'Sequential NFT #', // NEW: For configLineSettings.prefixName
    symbol: 'MACNFT',
    isMutable: true,
    tokenStandard: TokenStandard.ProgrammableNonFungible, // Default to pNFT (UMI's enum value)
    maxEditionSupply: 0,
    creatorsJson: `[{"address": "${WALLET_PLACEHOLDER}", "verified": false, "share": 100}]`
});
const guardConfig = ref({
    solPayment: {
        amount: 0.1,
        destination: '', // Will be populated by watcher or user input (as base58 string)
    },
    startDate: new Date().toISOString().slice(0, 16),
    endDate: '',
});
// --- Watcher for wallet connection ---
watch(() => wallet.connected.value, (isConnected) => {
    if (isConnected && wallet.publicKey.value) {
        if (!program || provider?.wallet?.publicKey?.toBase58() !== wallet.publicKey.value.toBase58()) {
            if (wallet.wallet.value && wallet.wallet.value.adapter) {
                provider = new AnchorProvider(connection, wallet.wallet.value.adapter, AnchorProvider.defaultOptions());
                try {
                    program = new Program(idl, provider);
                    console.log("TaleManager: Anchor Program Initialized.");
                } catch (e) {
                    console.error("TaleManager: Error initializing Anchor Program:", e);
                    showUiMessage(`Failed to initialize on-chain program: ${e.message}`, "error");
                    program = null; provider = null; return;
                }
            } else {
                console.error("TaleManager: Wallet adapter not available.");
                program = null; provider = null; return;
            }
        }
        fetchAppUser();
    } else {
        program = null; provider = null; appUser.value = null; nftList.value = [];
    }
}, { immediate: true });

// Watch for wallet connection changes to update default creator and SOL destination
watch(wallet.publicKey, (solanaWeb3jsPk) => {
    if (solanaWeb3jsPk) {
        const userAddressBase58 = solanaWeb3jsPk.toBase58(); // Correct for SolanaWeb3JsPublicKey
        // Update creatorsJson only if it's still the placeholder
        if (cmConfig.value.creatorsJson.includes(WALLET_PLACEHOLDER)) {
            cmConfig.value.creatorsJson = `[{"address": "${userAddressBase58}", "verified": false, "share": 100}]`;
        }
        // Update SOL payment destination only if it's empty or was the placeholder
        if (!guardConfig.value.solPayment.destination || guardConfig.value.solPayment.destination === WALLET_PLACEHOLDER) {
            guardConfig.value.solPayment.destination = userAddressBase58;
        }
    } else {
        // Wallet disconnected - optionally revert to placeholder if user hasn't changed them
        if (cmConfig.value.creatorsJson.includes(wallet.publicKey.value?.toBase58() || 'random_never_match_string')) { // Check if current wallet was in there
            cmConfig.value.creatorsJson = `[{"address": "${WALLET_PLACEHOLDER}", "verified": false, "share": 100}]`;
        }
        if (guardConfig.value.solPayment.destination === (wallet.publicKey.value?.toBase58() || 'random_never_match_string')) {
            guardConfig.value.solPayment.destination = ''; // Or WALLET_PLACEHOLDER
        }
    }
}, { immediate: true }); // Run on mount to set initial values if wallet already connected

const authApiClient = axios.create({ baseURL: AUTH_API_BASE_URL });
authApiClient.interceptors.request.use(config => {
    const token = localStorage.getItem(JWT_TOKEN_KEY);
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

authApiClient.interceptors.response.use(
    response => response.data,
    error => {
        const msg = error.response?.data?.message || error.message || 'An API error occurred.';
        showUiMessage(msg, 'error');
        if (error.response?.status === 401 && error.response?.data?.message?.includes("token failed")) {
            localStorage.removeItem(JWT_TOKEN_KEY);
            appUser.value = null;
        }
        return Promise.reject(error.response?.data || { message: msg, error });
    }
);

async function fetchAppUser() {
    const token = localStorage.getItem(JWT_TOKEN_KEY);
    if (!token || !wallet.connected.value) { appUser.value = null; return; }
    isLoadingUser.value = true;
    try {
        const response = await authApiClient.get('/auth/me');
        appUser.value = response.success ? response.data : null;
        if (!response.success) localStorage.removeItem(JWT_TOKEN_KEY);
    } catch (error) {
        console.error("TaleManager: Failed to fetch app user:", error);
        appUser.value = null;
    } finally {
        isLoadingUser.value = false;
    }
}

async function handleImageFileChange(event) {
    const file = event.files[0];

    if (file) {
        imageAll.value.imageFile = file;
        imageAll.value.imageUrl = '';
        const reader = new FileReader();
        reader.onload = (e) => {
            imageAll.value.imagePreviewUrl = e.target?.result;
        };
        reader.readAsDataURL(file);
        // const url = await uploadFileToIPFS(file);
        // console.log(url)
        // initialValues.value.image = url.imageUrl
    } else {
        imageAll.value.imageFile = null;
        imageAll.value.imagePreviewUrl = null;

    }
}
// const items = ref([{ name: 'NFT #1', uri: 'https://arweave.net/your-collection-metadata.json' }]);

// function addItem() {
//   items.value.push({ name: `NFT #${items.value.length + 1}`, uri: '' });
// }
// function removeItem(index) {
//   items.value.splice(index, 1);
// }
const showProcessingModal = ref(false);
const onFormSubmit = async ({ valid, states }) => {
    if (valid) {
        showProcessingModal.value = true;
        try {
            console.log(states)
            const { umi } = await initWallet();
            umi.use(mplCandyMachine());
            let finalImageUrl = imageAll.value.imageUrl;
            if (imageAll.value.imageFile) {
                const url = await uploadFileToIPFS(imageAll.value.imageFile);
                finalImageUrl = url.imageUrl
            }
            if (!finalImageUrl) throw new Error(`Image missing for shared NFT metadata.`);

            const collectionConfig = {
                name: states.name.value,
                symbol: states.symbol.value,
                uri: states.symbol.image,
                sellerFeeBasisPoints: 500
            }
            if (!umi || !wallet.publicKey.value) {
                throw new Error('Wallet not connected or UMI not initialized.');
            }
            // for (let i = 0; i < items.value.length; i++) {
            //     if (!items.value[i].name || !items.value[i].uri) {
            //         errorMessage.value = `Item #${i + 1} is missing a name or URI.`;
            //         return; // Stop execution
            //     }
            // }
            // console.log(items)
            const metadata = {
                name: collectionConfig.name,
                symbol: collectionConfig.symbol,
                description: states.description.value,
                image: finalImageUrl,
                seller_fee_basis_points: collectionConfig.sellerFeeBasisPoints,
                properties: {
                    files: [{ uri: finalImageUrl, type: "image/png" }], // Assuming PNG
                    category: "image",
                    creators: JSON.parse(cmConfig.value.creatorsJson).map((c) => ({ address: c.address, share: c.share })),
                }
            };
            console.log(metadata)
            const metadataUploadResult = await uploadJsonToIPFS(metadata);
            const resultMetadata = metadataUploadResult.metadataUrl
            if (!metadataUploadResult.success) {
                throw new Error(`Failed to upload metadata: ${metadataUploadResult.error}`);
            }
            const u = umi.value; // UMI instance
            // 0. Prepare Creators from JSON input
            let parsedUmiCreators
            try {
                try {
                    parsedUmiCreators = JSON.parse(cmConfig.value.creatorsJson).map((c) => ({
                        address: umiPublicKeyUtil(c.address), // Convert base58 string to UMI PublicKey
                        verified: c.verified !== undefined ? c.verified : false,
                        share: c.share,
                    }));
                    if (!parsedUmiCreators || parsedUmiCreators.length === 0) {
                        throw new Error("Creators array cannot be empty.");
                    }
                } catch (e) {
                    throw new Error(`Invalid JSON format or content for creators: ${e.message}`);
                }
                let collectionImageFinalUrl = finalImageUrl;
                let parsedCollectionCreators
                try {
                    // Use the same creators from cmConfig for the collection metadata for simplicity
                    parsedCollectionCreators = JSON.parse(cmConfig.value.creatorsJson).map((c) => ({
                        address: c.address, // Keep as string for JSON
                        share: c.share,
                    }));
                } catch (e) {
                    console.warn("Could not parse creators for collection metadata, skipping in JSON.");
                }
                const collectionJsonToUpload = {
                    name: collectionConfig.name,
                    symbol: collectionConfig.symbol || undefined, // Optional
                    description: states.description.value,
                    image: collectionImageFinalUrl,
                    seller_fee_basis_points: collectionConfig.sellerFeeBasisPoints,
                    external_url: undefined, // Optional
                    properties: {
                        files: [{ uri: collectionImageFinalUrl, type: imageAll.value.imageFile?.type || "image/png" }],
                        category: "image",
                        creators: parsedCollectionCreators.length > 0 ? parsedCollectionCreators : undefined,
                    }
                };
                const collectionMetadata = await uploadJsonToIPFS(collectionJsonToUpload);
                const metaDataUri = collectionMetadata.metadataUrl
                const collectionUpdateAuthority = generateSigner(umi)
                const collectionMint = generateSigner(umi)
                const createCollectionBuilder = await createNft(umi, {
                    mint: collectionMint,
                    authority: umi.identity,
                    name: collectionConfig.name,
                    uri: metaDataUri,
                    sellerFeeBasisPoints: percentAmount(collectionConfig.sellerFeeBasisPoints / 100, 2), // 9.99%
                    isCollection: true,
                    collectionDetails: {
                        __kind: 'V1',
                        size: 0,
                    }
                }).sendAndConfirm(umi)
                const candyMachineSettings = {
                    collectionMint: collectionMint.publicKey,
                    collectionUpdateAuthority,
                    itemsAvailable: states.maxSupply.value,
                }

                // 2. Prepare Candy Guard settings
                const candyGuardSigner = generateSigner(umi);
                const guardsToSet = {
                    // Default Bot Tax: Good practice to include, even if 0.
                    botTax: some({ lamports: sol(0.01), lastInstruction: true, destination: umiPublicKeyUtil(umi.identity) }), // Example: 0.01 SOL bot tax
                };
                if (states.mintPrice.value > 0) {
                    const solPaymentDestinationString = guardConfig.value.solPayment.destination || u.identity.publicKey.toString();
                    guardsToSet.solPayment = some({
                        lamports: sol(guardConfig.value.solPayment.amount),
                        destination: umiPublicKeyUtil(solPaymentDestinationString), // Convert base58 string to UMI PublicKey
                    });
                }
                if (guardConfig.value.startDate) {
                    try {
                        guardsToSet.startDate = some({ date: dateTime(new Date(guardConfig.value.startDate).getTime() / 1000) });
                    } catch (e) { console.warn("Invalid start date format, skipping.") }
                }
                if (guardConfig.value.endDate) {
                    try {
                        guardsToSet.endDate = some({ date: dateTime(new Date(guardConfig.value.endDate).getTime() / 1000) });
                    } catch (e) { console.warn("Invalid end date format, skipping.") }
                }
                // 3. Create Candy Machine (and its Candy Guard)
                await new Promise(resolve => setTimeout(resolve, 10000)); // Add this to make sure the createNft was completed.
                console.log("Creating Candy Machine with guard...");
                // console.log(JSON.stringify(guardsToSet, null, 2));
                const candyMachine = generateSigner(umi)
                const createCandyMachine = await create(umi, {
                    candyMachine,
                    collectionMint: collectionMint.publicKey,
                    collectionUpdateAuthority: umi.identity,
                    tokenStandard: TokenStandard.NonFungible,
                    sellerFeeBasisPoints: percentAmount(cmConfig.value.sellerFeeBasisPoints / 100, 2),
                    itemsAvailable: states.maxSupply.value,
                    isMutable: cmConfig.value.isMutable,
                    symbol: states.symbol.value,
                    maxEditionSupply: states.maxSupply.value,
                    creators: [
                        {
                            address: umi.identity.publicKey,
                            verified: true,
                            percentageShare: 100,
                        },
                    ],
                    guards: guardsToSet,
                    configLineSettings: some({
                        prefixName: states.symbol.value.trim(), // This is the key for sequential names
                        nameLength: 0, // With prefixName and isSequential, nameLength is often 0 as CM calculates. Max name is 32.
                        prefixUri: '', // Full URI provided in config lines
                        uriLength: resultMetadata?.length || 80,
                        isSequential: true, // Enable sequential numbering
                    }),
                }).then(tx => tx.sendAndConfirm(umi, { confirm: { commitment: 'processed' } }));
                await new Promise(resolve => setTimeout(resolve, 10000)); // Add this to make sure the createNft was completed.
                const configLines = [];
                for (let i = 0; i < states.maxSupply.value; i++) {
                    // When isSequential is true, the `name` in ConfigLine is often the `prefixName` itself,
                    // or can sometimes be an empty string. CM appends the number.
                    // Let's use the prefixName here for clarity, CM will add "+index".
                    configLines.push({
                        name: states.symbol.value.trim(), // This name will have sequence number appended by CM
                        uri: resultMetadata,
                    });
                }

                const CHUNK_SIZE = 5;
                for (let i = 0; i < configLines.length; i += CHUNK_SIZE) {
                    const chunk = configLines.slice(i, i + CHUNK_SIZE);
                    const insertBuilder = addConfigLines(umi, {
                        candyMachine: candyMachine.publicKey,
                        authority: umi.identity,
                        configLines: chunk,
                        index: Number(i),
                    }).add(
                        setComputeUnitLimit(umi, { units: 200_000 + (300_000 * chunk.length) }) // Rough estimate
                    );
                    const insertResult = await insertBuilder.sendAndConfirm(umi, { confirm: { commitment: 'processed' } });
                    transactionSignature.value = base58.deserialize(insertResult.signature)[0];
                    console.log(`Inserted items ${i + 1}-${i + chunk.length}. TX: ${transactionSignature.value}`);
                }
                // --- 7. Call list_nft from tale_nft program ---
                console.log("Listing Collection NFT with Candy Machine on-chain via tale_nft program...");
                if (!program) { // Ensure taleNftProgram is initialized
                    // Attempt to re-initialize if it wasn't set up earlier
                    // This is a fallback, ideally it's initialized once wallet connects
                    // @ts-ignore
                    const provider = new AnchorProvider(umi.rpc.connection, wallet.value, AnchorProvider.defaultOptions());
                    anchorProvider = provider; // Not strictly needed again if already set, but for completeness
                    // taleNftProgram = new Program(YOUR_IDL_NAME as Idl, TALE_NFT_PROGRAM_ID, provider); // REPLACE YOUR_IDL_NAME
                    if (!program) { // If still not initialized (e.g. IDL missing)
                        throw new Error("Tale NFT Anchor program could not be initialized. Make sure YOUR_IDL_NAME is set.");
                    }
                }
                const collectionMintPkForListing = new SolanaWeb3JsPublicKey(collectionMint.publicKey.toString()); // From collectionMintSigner.publicKey
                const candyMachinePkForListing = new SolanaWeb3JsPublicKey(candyMachine.publicKey.toString()); // From candyMachineSigner.publicKey

                // @ts-ignore
                const listNftTx = await program.methods
                    .listNft(collectionMintPkForListing, candyMachinePkForListing)
                    .accounts({
                        // listedNftAccount: PDA will be derived by Anchor
                        creatorWallet: wallet.publicKey.value, // Signer (SolanaWeb3JsPublicKey)
                        systemProgram: SystemProgram.programId,
                    })
                    .rpc({ commitment: 'processed' });

                console.log(`list_nft transaction successful. Signature: ${listNftTx}`);
                toast.add({ severity: 'success', summary: 'Form is submitted.', life: 3000 });
            } catch (err) {
                console.log(err)
            }
            showProcessingModal.value = false;
            toast.add({ severity: 'success', summary: 'Success', detail: 'NFT published successfully', life: 3000 });
            router.push('/profile')
        } catch (err) {
            console.log(err);
            showProcessingModal.value = false;
            toast.add({ severity: 'error', summary: 'Error', detail: err.message || 'Failed to publish NFT', life: 3000 });
        }
    }
};

const showWhitelistModal = ref(false);
const whitelistStages = ref([]);

const whitelistInitialValues = ref({
    name: '',
    mintPrice: '',
    mintDate: '',
});

const whitelistResolver = ref(zodResolver(
    z.object({
        name: z.string().min(1, { message: 'Stage name is required.' }),
        mintPrice: z.number().min(0, { message: 'Mint price is required.' }),
        mintDate: z.date().min(new Date(), { message: 'Mint date is required.' }),
    })
));

const openWhitelistModal = () => {
    showWhitelistModal.value = true;
};

const onWhitelistSubmit = ({ valid, states }) => {
    console.log(states.description.value)
    if (valid) {
        const newStage = {
            name: states.name.value,
            mintPrice: states.mintPrice.value,
            mintDate: states.mintDate.value,
        };
        toast.add({ severity: 'success', summary: 'Whitelist stage added successfully.', life: 3000 });
        whitelistStages.value.push(newStage);
        initialValues.value.whitelistStages.push(newStage);
        showWhitelistModal.value = false;
        whitelistInitialValues.value = {
            name: '',
            mintPrice: '',
            mintDate: '',
        };
    }
};

const removeWhitelistStage = (index) => {
    whitelistStages.value.splice(index, 1);
    initialValues.value.whitelistStages.splice(index, 1);
    toast.add({ severity: 'info', summary: 'Whitelist stage removed.', life: 3000 });
};

const formatDate = (date) => {
    return new Date(date).toLocaleString();
};
</script>
