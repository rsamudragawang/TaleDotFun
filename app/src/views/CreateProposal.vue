<template>
    <div class="home-view">
        <Toast />
        <div
            class="h-[300px] bg-gradient-to-b from-[#6435E9] to-[#381E83] rounded-lg flex flex-col justify-center px-[40px]">
            <h1 class="text-white text-3xl font-bold text-center">Make Incredible<br>Stories by Readers Choice</h1>
        </div>

        <Form v-slot="$form" :resolver="resolver" :initialValues="initialValues" @submit="onFormSubmit">
            <div class="mt-8 gap-6">
                <div class="bg-black/40 rounded-lg p-6">
                    <div class="flex flex-col gap-6">
                        <!-- Series Selection -->
                        <div class="flex flex-col gap-1">
                            <label class="text-white">Select Series</label>
                            <p class="text-sm text-slate-400 mb-4">Choose one or more series to include in this proposal</p>
                            <div v-if="isLoadingSeries" class="loading-state">
                                <ProgressSpinner />
                                <span>Loading your series...</span>
                            </div>
                            <div v-else-if="series.length === 0" class="empty-state">
                                <p>You don't have any published series yet.</p>
                                <Button label="Create Series" @click="$router.push('/tales')" />
                            </div>
                            <div v-else class="series-grid">
                                <div v-for="tale in series" :key="tale.publicKey.toString()" class="series-card" :class="{ 'selected': selectedSeries.includes(tale.publicKey.toString()) }" @click="toggleSeries(tale.publicKey.toString())">
                                    <input
                                        type="checkbox"
                                        class="series-native-checkbox"
                                        :checked="selectedSeries.includes(tale.publicKey.toString())"
                                        @change.stop="toggleSeries(tale.publicKey.toString())"
                                        @click.stop
                                    />
                                    <div class="series-content">
                                        <img 
                                            :src="tale.account.coverImage || '/default-cover.png'" 
                                            :alt="tale.account.title"
                                            class="series-cover"
                                        />
                                        <div class="series-info">
                                            <h3>{{ tale.account.title }}</h3>
                                            <p>{{ tale.account.description }}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <Message v-if="$form.selectedSeries?.invalid" severity="error" size="small" variant="simple">
                                {{ $form.selectedSeries.error?.message }}
                            </Message>
                        </div>

                        <!-- Questions -->
                        <div class="flex flex-col gap-1">
                            <label for="questions" class="text-white">Add Your Questions</label>
                            <Textarea name="questions" placeholder="Enter your questions" class="w-full h-[100px]" />
                            <Message v-if="$form.questions?.invalid" severity="error" size="small" variant="simple">
                                {{ $form.questions.error?.message }}
                            </Message>
                        </div>

                        <!-- Choices -->
                        <div class="flex flex-col gap-1">
                            <label class="text-white">Choices</label>
                            <div v-for="(choice, index) in choices" :key="index" class="flex gap-2 mb-2">
                                <InputText v-model="choices[index]" :name="'choices[' + index + ']'" class="flex-1" />
                                <Button icon="pi pi-times" severity="danger" @click="removeChoice(index)" 
                                    v-if="choices.length > 1" />
                            </div>
                            <Button icon="pi pi-plus" label="Add Choice" @click="addChoice" severity="secondary" />
                        </div>

                        <!-- Description -->
                        <div class="flex flex-col gap-1">
                            <label for="description" class="text-white">Description</label>
                            <Textarea name="description" placeholder="Enter description" class="w-full h-[150px]" />
                            <Message v-if="$form.description?.invalid" severity="error" size="small" variant="simple">
                                {{ $form.description.error?.message }}
                            </Message>
                        </div>

                        <div class="flex flex-col gap-6">
                            <!-- Category -->
                            <div class="flex flex-col gap-1">
                                <label for="category" class="text-white">Select Category</label>
                                <Dropdown
                                    v-model="selectedCategory"
                                    :options="categories"
                                    optionLabel="label"
                                    optionValue="value"
                                    placeholder="Select a category"
                                    class="w-full"
                                />
                                <Message v-if="!selectedCategory" severity="error" size="small" variant="simple">
                                    Category is required
                                </Message>
                            </div>

                            <!-- Tags -->
                            <div class="flex flex-col gap-1">
                                <label for="tags" class="text-white">Add Tags</label>
                                <InputText 
                                    name="tagsString" 
                                    v-model="tagsString" 
                                    class="w-full" 
                                    placeholder="Enter tags separated by commas (e.g., funding, community, feature)"
                                />
                                <p class="text-sm text-slate-400">Maximum 5 tags allowed, separated by commas</p>
                                <Message v-if="$form.tagsString?.invalid" severity="error" size="small" variant="simple">
                                    {{ $form.tagsString.error?.message }}
                                </Message>
                            </div>

                            <!-- Date & Time -->
                            <div class="flex flex-col gap-4">
                                <div class="flex flex-col gap-1">
                                    <label for="startDate" class="text-white">Start Date & Time</label>
                                    <DatePicker name="startDate" v-model="startDate" :showTime="true"
                                        :showSeconds="false" showIcon />
                                    <Message v-if="$form.startDate?.invalid" severity="error" size="small"
                                        variant="simple">
                                        {{ $form.startDate.error?.message }}
                                    </Message>
                                </div>

                                <div class="flex flex-col gap-1">
                                    <label for="endDate" class="text-white">End Date & Time</label>
                                    <DatePicker name="endDate" v-model="endDate" showIcon :showTime="true" :showSeconds="false" />
                                    <Message v-if="$form.endDate?.invalid" severity="error" size="small"
                                        variant="simple">
                                        {{ $form.endDate.error?.message }}
                                    </Message>
                                </div>
                            </div>

                            <!-- NFT Selection -->
                            <div class="flex flex-col gap-1">
                                <label class="text-white">Choose NFTs</label>
                                <p class="text-sm text-slate-400 mb-4">Select NFTs from your Candy Machines</p>
                                <div v-if="isLoadingNfts" class="loading-state">
                                    <ProgressSpinner />
                                    <span>Loading your NFTs...</span>
                                </div>
                                <div v-else-if="nfts.length === 0" class="empty-state">
                                    <p>You don't have any NFT collections yet.</p>
                                    <Button label="Create NFT Collection" @click="$router.push('/publish-nft')" />
                                </div>
                                <div v-else class="nft-grid">
                                    <div v-for="nft in nfts" :key="nft.candyMachineId" class="nft-card" :class="{ 'selected': selectedNfts.includes(nft.candyMachineId) }" @click="toggleNft(nft.candyMachineId)">
                                        <input
                                            type="checkbox"
                                            class="nft-native-checkbox"
                                            :checked="selectedNfts.includes(nft.candyMachineId)"
                                            @change.stop="toggleNft(nft.candyMachineId)"
                                            @click.stop
                                        />
                                        <div class="nft-content">
                                            <img 
                                                :src="nft.image || '/default-nft.png'" 
                                                :alt="nft.name"
                                                class="nft-image"
                                            />
                                            <div class="nft-info">
                                                <h3>{{ nft.name }}</h3>
                                                <p>Items: {{ nft.itemsRemaining }}/{{ nft.itemsAvailable }}</p>
                                                <p>Price: {{ nft.price }} SOL</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <Message v-if="$form.selectedNfts?.invalid" severity="error" size="small" variant="simple">
                                    {{ $form.selectedNfts.error?.message }}
                                </Message>
                            </div>

                            <!-- Voting Power -->
                            <div class="flex gap-4">
                                <div class="flex-1 flex flex-col gap-1">
                                    <label for="regularVotePower" class="text-white">Regular Vote Power</label>
                                    <InputNumber name="regularVotePower" v-model="regularVotePower" :min="0"
                                        class="w-full" />
                                    <Message v-if="$form.regularVotePower?.invalid" severity="error" size="small"
                                        variant="simple">
                                        {{ $form.regularVotePower.error?.message }}
                                    </Message>
                                </div>

                                <div class="flex-1 flex flex-col gap-1">
                                    <label for="nftVotePower" class="text-white">NFT Voting Power</label>
                                    <InputNumber name="nftVotePower" v-model="nftVotePower" :min="0" class="w-full" />
                                    <Message v-if="$form.nftVotePower?.invalid" severity="error" size="small"
                                        variant="simple">
                                        {{ $form.nftVotePower.error?.message }}
                                    </Message>
                                </div>
                            </div>

                            <Button type="submit" label="Create Proposal" class="mt-4" />
                        </div>
                    </div>
                </div>
            </div>
        </Form>
    </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { Form } from '@primevue/forms';
import { zodResolver } from '@primevue/forms/resolvers/zod';
import { z } from 'zod';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Dropdown from 'primevue/dropdown';
import Message from 'primevue/message';
import Button from 'primevue/button';
import FileUpload from 'primevue/fileupload';
import DatePicker from 'primevue/datepicker';
import InputNumber from 'primevue/inputnumber';
import Toast from 'primevue/toast';
import Checkbox from 'primevue/checkbox';
import { useToast } from 'primevue';
import { useWallet } from 'solana-wallets-vue';
import { Connection, PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import { Buffer } from 'buffer';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { mplCandyMachine, fetchCandyMachine } from '@metaplex-foundation/mpl-candy-machine';
import { publicKey as umiPublicKey } from '@metaplex-foundation/umi';
import { v4 as uuidv4 } from 'uuid';
import { BN } from '@coral-xyz/anchor';
import { SystemProgram } from '@solana/web3.js';
import ProgressSpinner from 'primevue/progressspinner';

// Import your IDLs
import idlFromFile from '../anchor/tale_story.json';
import idlGovernance from '../anchor/tale_governance.json';
import taleNftIdl from '../anchor/tale_nft.json';

// Configuration
const SOLANA_RPC_URL = import.meta.env.VITE_RPC_ENDPOINT || 'https://api.devnet.solana.com';
const PROGRAM_ID = new PublicKey(idlFromFile.address);
const GOVERNANCE_PROGRAM_ID = new PublicKey(idlGovernance.address);

// Wallet and Program setup
const wallet = useWallet();
const connection = new Connection(SOLANA_RPC_URL, "confirmed");
let provider;
let program;
let governanceProgram;

// State
const toast = useToast();
const seriesThumbnailUrl = ref(null);
const choices = ref(['']);
const tagsString = ref('');
const startDate = ref(null);
const endDate = ref(null);
const regularVotePower = ref(0);
const nftVotePower = ref(0);
const series = ref([]);
const nfts = ref([]);
const selectedSeries = ref([]);
const selectedNfts = ref([]);
const isLoadingSeries = ref(false);
const isLoadingNfts = ref(false);
const selectedCategory = ref(null);

const categories = [
    { value: 0, label: 'Content' },
    { value: 1, label: 'Feature' },
    { value: 2, label: 'Community' },
    { value: 3, label: 'Technical' },
    { value: 4, label: 'Other' },
];

const initialValues = ref({
    seriesThumbnail: null,
    questions: '',
    description: '',
    category: null,
    tagsString: '',
    startDate: null,
    endDate: null,
    regularVotePower: 1,
    nftVotePower: 1,
    choices: ['']
});

const resolver = ref(zodResolver(
    z.object({
        seriesThumbnail: z.any().optional(),
        questions: z.string().min(1, { message: 'Questions are required.' }),
        description: z.string().min(10, { message: 'Description must be at least 10 characters long.' }),
        category: z.number().min(0).max(4, { message: 'Please select a valid category.' }),
        tagsString: z.string().min(1, { message: 'At least one tag is required.' }),
        startDate: z.date({ required_error: 'Start date is required.' }),
        endDate: z.date({ required_error: 'End date is required.' }),
        regularVotePower: z.number().min(0, { message: 'Regular vote power must be 0 or greater.' }),
        nftVotePower: z.number().min(0, { message: 'NFT vote power must be 0 or greater.' }),
        choices: z.array(z.string()).min(1, { message: 'At least one choice is required.' }),
        selectedSeries: z.array(z.string()).min(1, { message: 'Please select at least one series.' }),
        selectedNfts: z.array(z.string()).optional()
    })
));

const handleSeriesThumbnailSelect = (event) => {
    const file = event.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            seriesThumbnailUrl.value = e.target.result;
        };
        reader.readAsDataURL(file);
    }
};

const removeSeriesThumbnail = () => {
    seriesThumbnailUrl.value = null;
};

const addChoice = () => {
    choices.value.push('');
};

const removeChoice = (index) => {
    choices.value.splice(index, 1);
};

// Helper function to shorten addresses
const shortenAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
};

// Fetch series from on-chain
async function fetchSeries() {
    if (!program) {
        if (wallet.connected.value) {
            toast.add({ severity: 'warn', summary: 'Warning', detail: 'On-chain program not ready. Try reconnecting wallet or refreshing.', life: 3000 });
        }
        series.value = [];
        return;
    }
    isLoadingSeries.value = true;
    try {
        const accounts = await program.account.tale.all();
        // Filter tales owned by the current user and are published
        series.value = accounts
            .filter(tale => 
                tale.account.author.equals(wallet.publicKey.value) && 
                tale.account.status === 1
            )
            .map(tale => ({
                ...tale,
                account: {
                    ...tale.account,
                    coverImage: tale.account.thumbnailCid 
                        ? `https://gateway.pinata.cloud/ipfs/${tale.account.thumbnailCid}`
                        : '/public/images/comic_1.png'
                }
            }))
            .sort((a, b) => Number(b.account.timestamp) - Number(a.account.timestamp));
    } catch (error) {
        console.error('Error fetching series:', error);
        toast.add({ severity: 'error', summary: 'Error', detail: `Error fetching series: ${error.message}`, life: 3000 });
        series.value = [];
    } finally {
        isLoadingSeries.value = false;
    }
}

// Fetch NFTs from Candy Machines
async function fetchNfts() {
    if (!wallet.connected.value || !wallet.publicKey.value) {
        nfts.value = [];
        return;
    }
    isLoadingNfts.value = true;
    try {
        const provider = new AnchorProvider(connection, wallet.wallet.value.adapter, AnchorProvider.defaultOptions());
        const program = new Program(taleNftIdl, provider);
        const allListed = await program.account.listedNft.all();
        const userAddress = wallet.publicKey.value.toBase58();
        const umi = createUmi(SOLANA_RPC_URL).use(mplCandyMachine());
        
        // Filter NFTs owned by the user
        const filtered = allListed.filter(item => item.account.creatorWallet.toBase58() === userAddress);
        
        // Process each NFT
        nfts.value = await Promise.all(
            filtered.map(async (item) => {
                let cmData = null;
                let name = '';
                let image = 'https://placehold.co/326x327';
                let price = null;
                let itemsAvailable = null;
                let itemsMinted = null;
                let itemsRemaining = null;
                let metadata = null;
                
                try {
                    cmData = await fetchCandyMachine(umi, umiPublicKey(item.account.candyMachineAddress.toString()));
                    
                    // Get name from various possible sources
                    if (cmData.items && cmData.items.length > 0 && cmData.items[0].name) {
                        name = cmData.items[0].name;
                    } else if (cmData.data.name) {
                        name = cmData.data.name;
                    }
                    
                    // Get price
                    if (cmData.header.lamports.basisPoints) {
                        price = Number(cmData.header.lamports.basisPoints) / 1_000_000_000;
                    } else if (cmData.configLineSettings && cmData.configLineSettings.prefixName) {
                        name = cmData.configLineSettings.prefixName;
                    }
                    
                    // Get supply information
                    itemsAvailable = Number(cmData.data.itemsAvailable);
                    itemsMinted = Number(cmData.itemsRedeemed);
                    itemsRemaining = itemsAvailable - itemsMinted;
                    
                    // Get image from metadata
                    if (cmData.items && cmData.items.length > 0 && cmData.items[0].uri) {
                        try {
                            const response = await fetch(cmData.items[0].uri);
                            if (response.ok) {
                                metadata = await response.json();
                                if (metadata.image) {
                                    image = metadata.image;
                                }
                            }
                        } catch (err) {
                            console.error('Error fetching NFT metadata:', err);
                        }
                    }
                } catch (err) {
                    console.error('Error fetching Candy Machine data:', err);
                }
                
                return {
                    publicKey: item.publicKey.toString(),
                    candyMachineId: item.account.candyMachineAddress.toString(),
                    name: name || 'Untitled NFT Collection',
                    image,
                    price,
                    itemsAvailable,
                    itemsMinted,
                    itemsRemaining,
                };
            })
        );
    } catch (error) {
        console.error('Error fetching NFTs:', error);
        toast.add({ severity: 'error', summary: 'Error', detail: `Error fetching NFTs: ${error.message}`, life: 3000 });
        nfts.value = [];
    } finally {
        isLoadingNfts.value = false;
    }
}

// Initialize programs when wallet is connected
watch(() => wallet.connected.value, async (isConnected) => {
    if (isConnected) {
        provider = new AnchorProvider(connection, wallet.wallet.value.adapter, AnchorProvider.defaultOptions());
        program = new Program(idlFromFile, provider);
        governanceProgram = new Program(idlGovernance, provider);
        await fetchSeries();
        await fetchNfts();
    }
});

onMounted(() => {
    if (wallet.connected.value) {
        provider = new AnchorProvider(connection, wallet.wallet.value.adapter, AnchorProvider.defaultOptions());
        program = new Program(idlFromFile, provider);
        governanceProgram = new Program(idlGovernance, provider);
        fetchSeries();
        fetchNfts();
    }
});

const onFormSubmit = async ({ valid, states }) => {
    if (valid) {
        try {
            // Convert dates to Unix timestamps (seconds)
            const startTime = Math.floor(startDate.value.getTime() / 1000);
            const endTime = Math.floor(endDate.value.getTime() / 1000);

            // Validate times
            if (startTime >= endTime) {
                toast.add({ severity: 'error', summary: 'Error', detail: 'Start time must be before end time.', life: 3000 });
                return;
            }

            // stories: Vec<Pubkey>
            const selectedSeriesPubkeys = selectedSeries.value.map(pubkey => new PublicKey(pubkey));
            // nfts: Vec<String>
            const selectedNftsArr = Array.isArray(selectedNfts.value)
                ? selectedNfts.value.map(nft => typeof nft === 'string' ? nft : nft.toString())
                : [];
            const votingId = uuidv4().slice(0, 32);

            // choices: Vec<String>
            const validChoices = choices.value.filter(c => typeof c === 'string' && c.trim());

            // tags: Vec<String> (split if string, or use array of strings)
            const validTags = tagsString.value
                .split(',')
                .map(t => t.trim())
                .filter(Boolean);

            if (validTags.length > 5) {
                toast.add({ severity: 'error', summary: 'Error', detail: 'Maximum of 5 tags allowed.', life: 3000 });
                return;
            }

            const [votePda] = await PublicKey.findProgramAddress(
                [
                    Buffer.from("vote"),
                    wallet.publicKey.value.toBuffer(),
                    Buffer.from(votingId, 'utf8')
                ],
                GOVERNANCE_PROGRAM_ID
            );
            const [voteRecordPda] = await PublicKey.findProgramAddress(
                [
                    Buffer.from("vote_record"),
                    votePda.toBuffer(),
                    wallet.publicKey.value.toBuffer()
                ],
                GOVERNANCE_PROGRAM_ID
            );

            // Get category object matching Governance.vue
            const categoryObj = { [categories[selectedCategory.value].label.toLowerCase()]: {} };

            // Extract plain strings from possible Proxy objects
            const questionStr = states.questions?.value ?? states.questions;
            const descriptionStr = states.description?.value ?? states.description;

            // Debug log all arguments
            console.log('createVote arguments:', {
                votingId,
                questions: questionStr,
                description: descriptionStr,
                validChoices,
                startTime,
                endTime,
                regularVotePower: new BN(regularVotePower.value),
                nftVotePower: new BN(nftVotePower.value),
                categoryObj,
                validTags,
                selectedSeriesPubkeys,
                selectedNfts: selectedNftsArr
            });

            await governanceProgram.methods
                .createVote(
                    votingId,
                    questionStr,
                    descriptionStr,
                    validChoices,
                    new BN(startTime),
                    new BN(endTime),
                    new BN(regularVotePower.value),
                    new BN(nftVotePower.value),
                    categoryObj,
                    validTags,
                    selectedSeriesPubkeys,
                    selectedNftsArr
                )
                .accounts({
                    creator: wallet.publicKey.value,
                    vote: votePda,
                    voteRecord: voteRecordPda,
                    systemProgram: SystemProgram.programId,
                })
                .rpc();
            toast.add({ severity: 'success', summary: 'Success', detail: 'Proposal created successfully', life: 3000 });
        } catch (error) {
            console.error('Error creating proposal:', error);
            toast.add({ severity: 'error', summary: 'Error', detail: `Error creating proposal: ${error.message}`, life: 3000 });
        }
    }
};

function toggleSeries(pubkey) {
    const idx = selectedSeries.value.indexOf(pubkey);
    if (idx === -1) selectedSeries.value.push(pubkey);
    else selectedSeries.value.splice(idx, 1);
}

function toggleNft(candyMachineId) {
    const idx = selectedNfts.value.indexOf(candyMachineId);
    if (idx === -1) selectedNfts.value.push(candyMachineId);
    else selectedNfts.value.splice(idx, 1);
}
</script>

<style scoped>
.series-checkbox, .nft-checkbox {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    z-index: 10;
    background: white;
    border-radius: 8px;
    padding: 2px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    opacity: 1;
    transition: none;
}

.series-checkbox :deep(.p-checkbox-box),
.nft-checkbox :deep(.p-checkbox-box) {
    background-color: #322D3E;
    border-color: #6B7280;
}

.series-checkbox :deep(.p-checkbox-box.p-highlight),
.nft-checkbox :deep(.p-checkbox-box.p-highlight) {
    background-color: #8B5CF6;
    border-color: #8B5CF6;
}

.create-proposal {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
}

.form-section {
    margin-bottom: 2rem;
    padding: 1rem;
    border: 1px solid #ddd;
    border-radius: 8px;
}

.loading-state,
.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 2rem;
    text-align: center;
}

.series-grid,
.nft-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1rem;
    margin-top: 1rem;
}

.series-card,
.nft-card {
    position: relative;
    border: 1px solid #ddd;
    border-radius: 8px;
    overflow: hidden;
}

.series-content,
.nft-content {
    display: flex;
    flex-direction: column;
}

.series-cover,
.nft-image {
    width: 100%;
    height: 150px;
    object-fit: cover;
}

.series-info,
.nft-info {
    padding: 1rem;
}

.series-info h3,
.nft-info h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1.1rem;
}

.series-info p,
.nft-info p {
    margin: 0;
    font-size: 0.9rem;
    color: #666;
}

.series-native-checkbox {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    z-index: 9999;
    width: 24px;
    height: 24px;
    accent-color: #8B5CF6;
}

.series-card.selected {
    border: 2px solid #8B5CF6;
}

.nft-native-checkbox {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    z-index: 9999;
    width: 24px;
    height: 24px;
    accent-color: #8B5CF6;
}

.nft-card.selected {
    border: 2px solid #8B5CF6;
}
</style>