<template>
    <div class="home-view">
        <Toast />
        <Stepper :value="step">
            <div
                class="h-[300px] bg-gradient-to-b from-[#6435E9] to-[#381E83] rounded-lg flex flex-col justify-center px-[40px]">
                <h1 class="text-white text-3xl font-bold text-center">Start Publishing<br> Your Series</h1>
                <StepList class="!mt-[30px]">
                    <Step :value="1">Set Your Series</Step>
                    <Step :value="2">Upload Your First Chapter</Step>
                </StepList>
            </div>
            <StepPanels>
                <StepPanel :value="1" class="rounded-lg" style="background: transparent !important">
                    <Form v-slot="$form" :resolver="resolver" :initialValues="initialValues" @submit="onFormSubmit">
                        <div class="mt-8 flex gap-6">
                            <div class="flex-1 bg-black/40 rounded-lg p-6">
                                <div class="flex flex-col gap-4">
                                    <div class="flex flex-col gap-1">
                                        <label class="text-white">Card Thumbnail (Square)</label>
                                        <p class="text-sm text-slate-400 mb-8">Image that will be shown as the main
                                            image for
                                            the this series. With resolution 1080x1080</p>
                                        <FileUpload class="mx-auto" name="squareThumbnail" accept="image/*"
                                            :maxFileSize="1000000" @select="handleSquareThumbnailSelect"
                                            @remove="removeSquareThumbnail" :customUpload="true" :auto="true"
                                            :showUploadButton="false" :showCancelButton="false"
                                            chooseLabel="Select Image"
                                            invalidFileSizeMessage="File size must be less than 1MB">
                                            <template #empty>
                                                <div class="flex flex-col items-center gap-2">
                                                    <i class="pi pi-upload text-2xl"></i>
                                                    <p>Drag & drop or click to upload</p>
                                                    <p class="text-sm text-gray-400">Recommended size: 1080x1080</p>
                                                </div>
                                            </template>
                                            <template #content="{ files }">
                                                <div v-if="squareThumbnailUrl" class="flex flex-col items-center gap-2">
                                                    <img :src="squareThumbnailUrl" alt="Square Thumbnail Preview"
                                                        class="w-[200px] h-[200px] object-cover rounded-lg" />
                                                </div>
                                            </template>
                                        </FileUpload>
                                        <Message v-if="$form.squareThumbnail?.invalid" severity="error" size="small"
                                            variant="simple">
                                            {{ $form.squareThumbnail.error?.message }}
                                        </Message>
                                    </div>

                                    <div class="flex flex-col gap-1 mt-10">
                                        <label class="text-white">Card Thumbnail (Landscape)</label>
                                        <p class="text-sm text-slate-400 mb-8">
                                            Image that will be shown as the main image for the this series. With
                                            resolution 2040x1080
                                        </p>
                                        <FileUpload class="mx-auto" name="landscapeThumbnail" accept="image/*"
                                            :maxFileSize="1000000" @select="handleLandscapeThumbnailSelect"
                                            @remove="removeLandscapeThumbnail" :customUpload="true" :auto="true"
                                            :showUploadButton="false" :showCancelButton="false"
                                            chooseLabel="Select Image"
                                            invalidFileSizeMessage="File size must be less than 1MB">
                                            <template #empty>
                                                <div class="flex flex-col items-center gap-2">
                                                    <i class="pi pi-upload text-2xl"></i>
                                                    <p>Drag & drop or click to upload</p>
                                                    <p class="text-sm text-gray-400">Recommended size: 2040x1080</p>
                                                </div>
                                            </template>
                                            <template #content="{ files }">
                                                <div v-if="landscapeThumbnailUrl"
                                                    class="flex flex-col items-center gap-2">
                                                    <img :src="landscapeThumbnailUrl" alt="Landscape Thumbnail Preview"
                                                        class="w-[300px] h-[157px] object-cover rounded-lg" />
                                                </div>
                                            </template>
                                        </FileUpload>
                                        <Message v-if="$form.landscapeThumbnail?.invalid" severity="error" size="small"
                                            variant="simple">
                                            {{ $form.landscapeThumbnail.error?.message }}
                                        </Message>
                                    </div>
                                </div>
                            </div>
                            <div class="flex-2 bg-black/40 rounded-lg p-6">
                                <div class="flex flex-col gap-6">
                                    <!-- Series Title -->
                                    <div class="flex flex-col gap-1">
                                        <label for="title" class="text-white">Series Title</label>
                                        <InputText name="title" type="text" placeholder="Enter your series title"
                                            class="w-full" />
                                        <Message v-if="$form.title?.invalid" severity="error" size="small"
                                            variant="simple">
                                            {{ $form.title.error?.message }}
                                        </Message>
                                    </div>

                                    <div class="flex gap-4">

                                        <!-- Theme/Category -->
                                        <div class="flex flex-1 flex-col gap-1">
                                            <label for="category" class="text-white">Theme/Category</label>
                                            <Dropdown name="category" :options="categories" optionLabel="name"
                                                placeholder="Select a category" class="w-full" />
                                            <Message v-if="$form.category?.invalid" severity="error" size="small"
                                                variant="simple">
                                                {{ $form.category.error?.message }}
                                            </Message>
                                        </div>

                                        <!-- Historical Period -->
                                        <!-- <div class="flex flex-1 flex-col gap-1">
                                            <label for="period" class="text-white">Historical Periodic Time</label>
                                            <div class="flex gap-4">
                                                <InputText name="period" type="text" placeholder="--"
                                                    class="w-full" />
                                            </div>
                                            <Message v-if="$form.period?.invalid || $form.periodEnd?.invalid"
                                                severity="error" size="small" variant="simple">
                                                {{ $form.period?.error?.message || $form.periodEnd?.error?.message
                                                }}
                                            </Message>
                                        </div> -->

                                    </div>
                                    <!-- Synopsis -->
                                    <div class="flex flex-col gap-1">
                                        <label for="synopsis" class="text-white">Synopsis</label>
                                        <Textarea name="synopsis" placeholder="Write a brief description of your series"
                                            class="w-full h-[200px]" />
                                        <Message v-if="$form.synopsis?.invalid" severity="error" size="small"
                                            variant="simple">
                                            {{ $form.synopsis.error?.message }}
                                        </Message>
                                    </div>

                                    <div class="">
                                        <label for="nft" class="text-white">Choose an NFT for This Series</label>
                                        <p class="text-sm text-slate-400 mb-4">
                                            Select a special NFT to unlock exclusive benefits for readers who own it.
                                        </p>
                                        <div v-if="listedNfts.length === 0"
                                            class="bg-[#322D3E] p-[28px] border border-dashed rounded-lg text-center flex flex-col gap-4 items-center">
                                            <img src="/public/icons/x.svg" alt="x" class="w-16" />
                                            <p class="font-bold">No NFT Selected</p>
                                            <p class="mt-2">You can create an NFT for this chapter to offer
                                                exclusive benefits<br>
                                                to readers who own it.</p>
                                            <Button severity="secondary" @click="handleCreateNFT">Create
                                                NFT</Button>
                                        </div>
                                        <div v-else>
                                            <div v-for="(nft, i) in listedNfts" :key="i"
                                                class="col-span-3 rounded-lg mt-5"
                                                style="background-color: rgba(0, 0, 0, 0.5);">
                                                <img :src="nft.image" alt="NFT Image"
                                                    style="height:400px;width:100%;height:auto;object-fit:cover;">
                                                <div class="relative p-4">
                                                    <div class="mt-5">
                                                        <h1 class="text-lg">{{ nft.name }}</h1>
                                                        <div class="flex gap-4 py-4 justify-between items-center">
                                                            <div class="flex gap-2 items-center">
                                                                <img src="/public/icons/solana.svg" alt="solana" w->
                                                                <p class="text-slate-400">{{ nft.price ?
                                                                    nft.price.toLocaleString(undefined, {
                                                                    maximumFractionDigits: 3 }) : '-' }} SOL</p>
                                                            </div>
                                                            <div class="flex gap-2 items-center">
                                                                <i class="pi pi-user"></i>
                                                                <p class="text-slate-400">{{ nft.itemsRemaining || 0
                                                                    }}/{{ nft.itemsAvailable || 0
                                                                    }}</p>
                                                            </div>
                                                        </div>
                                                        <div class="pt-4 mt-6 border-t border-white">
                                                            <div class="flex items-center justify-between">
                                                                <p class="text-slate-400">a story from</p>
                                                                <div class="flex gap-2 items-center">
                                                                    <img :src="nft.creatorAvatar" alt="avatar"
                                                                        class="w-6 h-6 rounded-full">
                                                                    <p class="text-slate-400">{{ nft.creatorName }}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <Button class="w-full mt-4" severity="secondary"
                                                            :loading="nft.isMinting"
                                                            :disabled="!nft.itemsRemaining || nft.isMinting || !wallet.connected.value"
                                                            @click="handleSelect(nft, i)">
                                                            {{ getMintButtonText(nft) }}
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="form-group checkbox-group">
                                        <label class="form-label checkbox-label">
                                            <input type="checkbox" v-model="OptionsNft.isGovernanceTokenGated"
                                                class="form-checkbox" />
                                            Gated by Governance Token
                                        </label>
                                        <label class="form-label checkbox-label">
                                            <input type="checkbox" v-model="OptionsNft.isEarlyAccessTokenGated"
                                                class="form-checkbox" />
                                            Gated by Early Access Token/NFT
                                        </label>
                                        <label class="form-label checkbox-label">
                                            <input type="checkbox" v-model="OptionsNft.isRealWorldAssetGated"
                                                class="form-checkbox" />
                                            Gated by Real World Asset (RWA)
                                        </label>
                                    </div>
                                    <Button type="submit" label="Continue" class="mt-4" />
                                </div>
                            </div>
                        </div>
                    </Form>
                </StepPanel>
                <StepPanel :value="2" class="rounded-lg" style="background: transparent !important">
                    <Form v-slot="$form" :resolver="resolverChapter" :initialValues="initialValuesChapter"
                        @submit="onFormSubmitChapter">
                        <div class="mt-8 flex gap-6">
                            <div class="flex-1 bg-black/40 rounded-lg p-6">
                                <div class="flex flex-col gap-4">
                                    <div class="flex flex-col gap-1">
                                        <label class="text-white">Card Thumbnail (Square)</label>
                                        <p class="text-sm text-slate-400 mb-8">Image that will be shown as the main
                                            image for
                                            the this series. With resolution 1080x1080</p>
                                        <FileUpload class="mx-auto" name="squareThumbnail" accept="image/*"
                                            :maxFileSize="1000000" @select="handleSquareThumbnailSelect"
                                            @remove="removeSquareThumbnail" :customUpload="true" :auto="true"
                                            :showUploadButton="false" :showCancelButton="false"
                                            chooseLabel="Select Image"
                                            invalidFileSizeMessage="File size must be less than 1MB">
                                            <template #empty>
                                                <div class="flex flex-col items-center gap-2">
                                                    <i class="pi pi-upload text-2xl"></i>
                                                    <p>Drag & drop or click to upload</p>
                                                    <p class="text-sm text-gray-400">Recommended size: 1080x1080</p>
                                                </div>
                                            </template>
                                            <template #content="{ files }">
                                                <div v-if="squareThumbnailUrl" class="flex flex-col items-center gap-2">
                                                    <img :src="squareThumbnailUrl" alt="Square Thumbnail Preview"
                                                        class="w-[200px] h-[200px] object-cover rounded-lg" />
                                                </div>
                                            </template>
                                        </FileUpload>
                                        <Message v-if="$form.squareThumbnail?.invalid" severity="error" size="small"
                                            variant="simple">
                                            {{ $form.squareThumbnail.error?.message }}
                                        </Message>
                                    </div>
                                </div>
                            </div>
                            <div class="flex-2">
                                <div class="bg-black/40 rounded-lg p-6">
                                    <div class="flex flex-col gap-6">
                                        <!-- Chapter Title -->
                                        <div class="flex flex-col gap-1">
                                            <label for="chapterTitle" class="text-white">Chapter Title</label>
                                            <InputText name="chapterTitle" type="text"
                                                placeholder="Enter your chapter title" class="w-full" />
                                            <Message v-if="$form.chapterTitle?.invalid" severity="error" size="small"
                                                variant="simple">
                                                {{ $form.chapterTitle.error?.message }}
                                            </Message>
                                        </div>

                                        <!-- Chapter Images -->
                                        <div class="flex flex-col gap-1">
                                            <label class="text-white">Chapter Images</label>
                                            <p class="text-sm text-slate-400 mb-4">
                                                Upload up to 24 images for your chapter. Images will be displayed in the
                                                order they are
                                                uploaded.
                                            </p>
                                            <FileUpload class="mx-auto" name="chapterImages" accept="image/*"
                                                :maxFileSize="1000000" :multiple="true" :maxFiles="24"
                                                @select="handleChapterImagesSelect" @remove="removeChapterImage"
                                                :customUpload="true" :auto="true" :showUploadButton="false"
                                                :showCancelButton="false" chooseLabel="Select Images"
                                                invalidFileSizeMessage="File size must be less than 1MB">
                                                <template #empty>
                                                    <div class="flex flex-col items-center gap-2">
                                                        <i class="pi pi-upload text-2xl"></i>
                                                        <p>Drag & drop or click to upload</p>
                                                        <p class="text-sm text-gray-400">Maximum 24 images</p>
                                                    </div>
                                                </template>
                                                <template #content="{ files }">
                                                    <div v-if="chapterImages.length > 0" class="grid grid-cols-4 gap-4">
                                                        <div v-for="(image, index) in chapterImages" :key="index"
                                                            class="relative">
                                                            <img :src="image.preview" alt="Chapter Image Preview"
                                                                class="w-full h-[150px] object-cover rounded-lg" />
                                                            <Button icon="pi pi-times" severity="danger"
                                                                class="absolute top-2 right-2 p-button-rounded p-button-sm"
                                                                @click="removeChapterImage(index)" />
                                                        </div>
                                                    </div>
                                                </template>
                                            </FileUpload>
                                            <Message v-if="$form.chapterImages?.invalid" severity="error" size="small"
                                                variant="simple">
                                                {{ $form.chapterImages.error?.message }}
                                            </Message>
                                        </div>

                                        <!-- Creator Notes -->
                                        <div class="flex flex-col gap-1">
                                            <label for="creatorNotes" class="text-white">Creator Notes</label>
                                            <Textarea name="creatorNotes"
                                                placeholder="Add any notes or comments about this chapter"
                                                class="w-full h-[150px]" />
                                            <Message v-if="$form.creatorNotes?.invalid" severity="error" size="small"
                                                variant="simple">
                                                {{ $form.creatorNotes.error?.message }}
                                            </Message>
                                        </div>

                                        <!-- NFT Selection -->
                                        <div class="flex flex-col gap-1">
                                            <label class="text-white">NFT Selection</label>
                                            <p class="text-sm text-slate-400 mb-4">
                                                Choose an NFT to associate with this chapter (optional)
                                            </p>
                                            <div v-if="listedNfts.length === 0"
                                                class="bg-[#322D3E] p-[28px] border border-dashed rounded-lg text-center flex flex-col gap-4 items-center">
                                                <img src="/public/icons/x.svg" alt="x" class="w-16" />
                                                <p class="font-bold">No NFT Selected</p>
                                                <p class="mt-2">You can create an NFT for this chapter to offer
                                                    exclusive benefits<br>
                                                    to readers who own it.</p>
                                                <Button severity="secondary" @click="handleCreateNFT">Create
                                                    NFT</Button>
                                            </div>
                                            <div v-else>
                                                <div v-for="(nft, i) in listedNfts" :key="i"
                                                    class="col-span-3 rounded-lg mt-5"
                                                    style="background-color: rgba(0, 0, 0, 0.5);">
                                                    <img :src="nft.image" alt="NFT Image"
                                                        style="height:400px;width:100%;height:auto;object-fit:cover;">
                                                    <div class="relative p-4">
                                                        <div class="mt-5">
                                                            <h1 class="text-lg">{{ nft.name }}</h1>
                                                            <div class="flex gap-4 py-4 justify-between items-center">
                                                                <div class="flex gap-2 items-center">
                                                                    <img src="/public/icons/solana.svg" alt="solana" w->
                                                                    <p class="text-slate-400">{{ nft.price ?
                                                                        nft.price.toLocaleString(undefined, {
                                                                        maximumFractionDigits: 3
                                                                        }) : '-' }} SOL</p>
                                                                </div>
                                                                <div class="flex gap-2 items-center">
                                                                    <i class="pi pi-user"></i>
                                                                    <p class="text-slate-400">{{ nft.itemsRemaining || 0
                                                                        }}/{{
                                                                        nft.itemsAvailable || 0 }}</p>
                                                                </div>
                                                            </div>
                                                            <div class="pt-4 mt-6 border-t border-white">
                                                                <div class="flex items-center justify-between">
                                                                    <p class="text-slate-400">a story from</p>
                                                                    <div class="flex gap-2 items-center">
                                                                        <img :src="nft.creatorAvatar" alt="avatar"
                                                                            class="w-6 h-6 rounded-full">
                                                                        <p class="text-slate-400">{{ nft.creatorName }}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <Button class="w-full mt-4" severity="secondary"
                                                                :loading="nft.isMinting"
                                                                :disabled="!nft.itemsRemaining || nft.isMinting || !wallet.connected.value"
                                                                @click="handleSelect(nft, i)">
                                                                {{ getMintButtonText(nft) }}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Publishing Options -->
                                        <div class="flex flex-col gap-4">
                                            <div class="flex gap-[50px]">
                                                <div class="flex-1">
                                                    <p class="text-white">Do You Want to Publish Now?</p>
                                                    <p class="text-slate-400">You can publish now or scheduled publish
                                                    </p>
                                                </div>
                                                <div class="flex-1">
                                                    <div class="flex flex-col gap-4">
                                                        <div class="flex items-center gap-2">
                                                            <RadioButton v-model="publishOption" name="publishOption"
                                                                value="now" />
                                                            <label class="text-white">Publish Now</label>
                                                        </div>
                                                        <div class="flex items-center gap-2">
                                                            <RadioButton v-model="publishOption" name="publishOption"
                                                                value="schedule" />
                                                            <label class="text-white">Schedule for Later</label>
                                                        </div>
                                                        <div v-if="publishOption === 'schedule'"
                                                            class="flex flex-col gap-2">
                                                            <DatePicker name="publishDate" v-model="publishDate"
                                                                :showTime="true" :showSeconds="false"
                                                                :minDate="new Date()"
                                                                placeholder="Select Schedule Date" />
                                                            <Message v-if="$form.publishDate?.invalid" severity="error"
                                                                size="small" variant="simple">
                                                                {{ $form.publishDate.error?.message }}
                                                            </Message>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <Button type="submit" label="Publish Chapter" class="mt-4" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Form>
                </StepPanel>
            </StepPanels>
        </Stepper>
    </div>

    <!-- Confirmation Modal -->
    <Dialog v-model:visible="showConfirmationModal" modal :style="{ width: '50vw', backgroundColor: '#100C18' }"
        :closable="false">
        <div class="flex flex-col items-center text-centergap-4 py-4">
            <img src="/public/icons/success.svg" alt="success" class="w-16">
            <h2 class="text-2xl font-bold text-center">Series Successfully Created!</h2>
            <p class="text-center text-gray-400 text-sm mt-4">After series, you must be upload your first chapter of
                your<br> series now to publish your series</p>
        </div>
        <template #footer>
            <div class="flex justify-end gap-2">
                <Button label="Later" severity="secondary" @click="handleLater" />
                <Button label="Create Chapter" severity="primary" @click="handleCreateChapter" />
            </div>
        </template>
    </Dialog>
</template>

<script setup>
import Stepper from 'primevue/stepper';
import StepList from 'primevue/stepList';
import Step from 'primevue/step';
import StepPanels from 'primevue/stepPanels';
import StepPanel from 'primevue/stepPanel';
import { ref } from 'vue';
import { Form } from '@primevue/forms';
import { zodResolver } from '@primevue/forms/resolvers/zod';
import { z } from 'zod';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Dropdown from 'primevue/dropdown';
import Message from 'primevue/message';
import Button from 'primevue/button';
import FileUpload from 'primevue/fileupload';
import Dialog from 'primevue/dialog';
import DatePicker from 'primevue/datepicker';
import RadioButton from 'primevue/radiobutton';
import Toast from 'primevue/toast';
import { useToast } from 'primevue';
import { onMounted, computed, watch } from 'vue';
import { useWallet, WalletMultiButton } from 'solana-wallets-vue';
import { Connection, PublicKey, SystemProgram } from '@solana/web3.js';
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import { Buffer } from 'buffer';
import { v4 as uuidv4 } from 'uuid';
import { uploadFileToIPFS, uploadTextToIPFS } from '../services/pinataService';
import axios from 'axios'
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
import idlFromFile from '../anchor/tale_story.json';
import idlFromFileNft from '../anchor/tale_nft' // Adjust path as necessary
import taleNftIdl from '../anchor/tale_nft.json'; // Ensure this IDL is up-to-date
import { useRouter } from 'vue-router';

const router = useRouter();
// --- Configuration ---
const READIUM_FUN_PROGRAM_ID_NFT = new PublicKey(idlFromFileNft.address); // Your Program ID from IDL
const MAX_ONCHAIN_EPISODE_ID_SEED_LENGTH = 32;
const AUTH_API_BASE_URL = import.meta.env.VITE_APP_AUTH_API_URL || 'http://localhost:3000/api';
const JWT_TOKEN_KEY = 'readium_fun_jwt_token';
const SOLANA_RPC_URL = import.meta.env.VITE_RPC_ENDPOINT || 'https://api.devnet.solana.com';

const PROGRAM_ID = new PublicKey(idlFromFile.address);
const idl = idlFromFile;

const MAX_ONCHAIN_TALE_ID_LENGTH = 32;

// --- Wallet and Program ---
const wallet = useWallet();
const connection = new Connection(SOLANA_RPC_URL, "confirmed");
let provider;
let program;
let programNft;
const step = ref(1);
const squareThumbnailUrl = ref(null);
const landscapeThumbnailUrl = ref(null);
const squareThumbnail = ref(null);
const landscapeThumbnail = ref(null);
const showConfirmationModal = ref(false);
const publishOption = ref('now');
const toast = useToast();
const listedNfts = ref([]);
const appUser = ref(null);
const selectedNft = ref(null)
const taleId = ref(null)
const imageSet = ref(null)

const categories = [
    { name: 'Fantasy', value: 'fantasy' },
    { name: 'Science Fiction', value: 'sci-fi' },
    { name: 'Historical Fiction', value: 'historical' },
    { name: 'Mystery', value: 'mystery' },
    { name: 'Romance', value: 'romance' },
    { name: 'Adventure', value: 'adventure' },
    { name: 'Horror', value: 'horror' },
    { name: 'Thriller', value: 'thriller' },
];

const OptionsNft = ({
    isGovernanceTokenGated: false,
    isEarlyAccessTokenGated: false,
    isRealWorldAssetGated: false,
})

function getMintButtonText(nft) {
    if (!wallet.connected.value) return 'Connect Wallet to Mint';
    if (!nft.itemsRemaining) return 'Sold Out';
    if (nft.isMinting) return 'Minting...';
    return 'Select';
}

const initialValues = ref({
    title: '',
    category: null,
    // period: '',
    synopsis: '',
    squareThumbnail: null,
    landscapeThumbnail: null,
    isGovernanceTokenGated: false,
    isEarlyAccessTokenGated: false,
    isRealWorldAssetGated: false,
});

const resolver = ref(zodResolver(
    z.object({
        title: z.string().min(1, { message: 'Series title is required.' }),
        category: z.object({
            name: z.string(),
            value: z.string()
        }, { required_error: 'Please select a category.' }),
        // period: z.string().min(1, { message: 'Period is required.' }),
        synopsis: z.string().min(10, { message: 'Synopsis must be at least 10 characters long.' }),
        squareThumbnail: z.any().optional(),
        landscapeThumbnail: z.any().optional(),
        isGovernanceTokenGated: z.any().optional(),
        isEarlyAccessTokenGated: z.any().optional(),
        isRealWorldAssetGated: z.any().optional(),

    })
));

// --- Watcher for wallet connection ---
watch(() => wallet.connected.value, (isConnected) => {
    if (isConnected && wallet.publicKey.value) {
        if (!program || provider?.wallet?.publicKey?.toBase58() !== wallet.publicKey.value.toBase58()) {
            if (wallet.wallet.value && wallet.wallet.value.adapter) {
                provider = new AnchorProvider(connection, wallet.wallet.value.adapter, AnchorProvider.defaultOptions());
                try {
                    program = new Program(idl, provider);
                    programNft = new Program(idlFromFileNft, provider)
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
        fetchListedNftsWithMetadata()
        // fetchAppUser().then(() => {
        //     if (appUser.value && appUser.value.type === 'creator' && program) {
        //         fetchAuthorOnChainTales();
        //     }
        // });
    } else {
        program = null; provider = null; appUser.value = null;
    }
}, { immediate: true });

const shortenAddress = (address, chars = 6) => address ? `${address.slice(0, chars)}...${address.slice(-chars)}` : '';
const setDefaultImage = (event) => { event.target.src = 'https://placehold.co/300x200/gray/white?text=No+Img'; };
const getStatusString = (statusNum) => (['Draft', 'Published', 'Archived'][statusNum] || 'Unknown');
const getExplorerUrl = (signature) => `https://explorer.solana.com/tx/${signature}?cluster=${SOLANA_RPC_URL.includes('mainnet') ? 'mainnet-beta' : 'devnet'}`;


// / --- API Client for Auth ---
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
            // localStorage.removeItem(JWT_TOKEN_KEY);
            appUser.value = null;
        }
        return Promise.reject(error.response?.data || { message: msg, error });
    }
);
async function handleSelect(nft, index) {
    selectedNft.value = nft.candyMachineAddress

}

async function fetchListedNftsWithMetadata() {
    try {
        // Use a generic provider for read-only operations if wallet not needed
        const provider = new AnchorProvider(connection, wallet.wallet?.value?.adapter || { publicKey: PublicKey.default, signTransaction: async () => { }, signAllTransactions: async () => { } }, AnchorProvider.defaultOptions());
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
                    } else if (cmData.configLineSettings && cmData.configLineSettings.prefixName) { //legacy
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

                let creatorName = item.account.creatorWallet.toString().substring(0, 6) + "...";
                let creatorAvatar = `https://ui-avatars.com/api/?rounded=true&bold=true&name=${encodeURIComponent(item.account.creatorWallet.toString().substring(0, 2))}`;
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


// --- Data Fetching ---
async function fetchAppUser() {
    const token = localStorage.getItem(JWT_TOKEN_KEY);
    if (!token || !wallet.connected.value) { appUser.value = null; return; }
    isLoadingUser.value = true;
    try {
        const response = await authApiClient.get('/auth/me');
        appUser.value = response.success ? response.data : null;
        // if (!response.success) localStorage.removeItem(JWT_TOKEN_KEY);
    } catch (error) {
        console.error("TaleManager: Failed to fetch app user:", error);
        appUser.value = null;
    } finally {
        isLoadingUser.value = false;
    }
}

async function handleSaveTale(states) {
    if (!program || !wallet.publicKey.value) {
        showUiMessage("Wallet not connected or program not initialized.", "error"); return;
    }
    console.log(states, squareThumbnailUrl.value, OptionsNft)
    // isSavingTale.value = true;
    let finalCoverImageCid = squareThumbnail.value;
    let finalThumbnailCid = landscapeThumbnail.value;
    let finalContentCid = '';

    try {
        // 1. Upload Cover Image
        if (squareThumbnailUrl.value) {
            // isUploadingCover.value = true;
            // showUiMessage("Uploading cover image...", "loading", null, 0);
            const coverUploadResult = await uploadFileToIPFS(squareThumbnail.value);
            // isUploadingCover.value = false;
            if (coverUploadResult.success) {
                finalCoverImageCid = coverUploadResult.ipfsHash;
                squareThumbnailUrl.value = finalCoverImageCid;
                // showUiMessage("Cover image uploaded.", "info", null, 2000);
            } else {
                throw new Error(coverUploadResult.error || "Cover image IPFS upload failed");
            }
        }
        // 2. Upload Thumbnail Image
        if (landscapeThumbnailUrl.value) {
            // isUploadingThumbnail.value = true;
            // showUiMessage("Uploading thumbnail image...", "loading", null, 0);
            const thumbUploadResult = await uploadFileToIPFS(landscapeThumbnail.value);
            // isUploadingThumbnail.value = false;
            if (thumbUploadResult.success) {
                finalThumbnailCid = thumbUploadResult.ipfsHash;
                landscapeThumbnailUrl.value = finalThumbnailCid;
                // showUiMessage("Thumbnail image uploaded.", "info", null, 2000);
            } else {
                throw new Error(thumbUploadResult.error || "Thumbnail image IPFS upload failed");
            }
        }
        // 3. Upload Content Markdown
        if (states.synopsis.value) {
            // showUiMessage("Uploading content to IPFS...", "loading", null, 0);
            const textFileName = `${(states.title.value || 'tale').replace(/\s+/g, '_')}_${Date.now()}.md`;
            const textUploadResult = await uploadTextToIPFS(currentTaleForm.value.contentMarkdown, textFileName);
            if (textUploadResult.success) {
                finalContentCid = textUploadResult.ipfsHash;
                // showUiMessage("Content uploaded to IPFS.", "info", null, 2000);
            } else {
                throw new Error(textUploadResult.error || "Content IPFS upload failed");
            }
        }
        // else if (currentTaleForm.value.editingExistingOnChainTale) {
        //     const existingTale = authorTales.value.find(t => t.account.taleId === currentTaleForm.value.onChainTaleIdSeedToEdit);
        //     finalContentCid = existingTale?.account?.contentCid || '';
        // }
        console.log(`Final Content CID for on-chain: "${finalContentCid}" (Length: ${finalContentCid?.length || 0})`);
        const taleIdSeed =
            uuidv4().substring(0, MAX_ONCHAIN_TALE_ID_LENGTH);

        let candyMachineAddressPk = null;
        if (selectedNft.value && selectedNft.value.trim() !== '') {
            try {
                candyMachineAddressPk = new PublicKey(selectedNft.value);
            } catch (e) {
                throw new Error("Invalid Candy Machine Address format.");
            }
        }

        const commonArgs = [
            states.title,
            finalContentCid,
            states.category.value,
            finalCoverImageCid,
            finalThumbnailCid,
            1, // This is the initial_status for create_tale
            candyMachineAddressPk,
            OptionsNft.isGovernanceTokenGated,
            OptionsNft.isEarlyAccessTokenGated,
            OptionsNft.isRealWorldAssetGated,
        ];
        console.log(commonArgs)

        let txSignature = '';
        const taleIdSeedBuffer = Buffer.from(taleIdSeed, 'utf-8');
        // showUiMessage("Creating on-chain tale...", "loading", null, 0);
        const createArgs = [taleIdSeed, ...commonArgs];

        // ***** DIAGNOSTIC LOG for create_tale *****
        console.log("Calling createTale with args:", ...createArgs);
        // console.log("Status value for create:", currentTaleForm.value.status, "Type:", typeof currentTaleForm.value.status);


        const taleAccountPda = (await PublicKey.findProgramAddress(
            [Buffer.from("tale", 'utf-8'), taleIdSeedBuffer], PROGRAM_ID
        ))[0];

        txSignature = await program.methods.createTale(...createArgs)
            .accounts({
                taleAccount: taleAccountPda,
                author: wallet.publicKey.value,
                systemProgram: SystemProgram.programId,
            })
            .rpc();
        // showUiMessage("On-chain tale created!", "success", txSignature);
        taleId.value = taleAccountPda
        // if (currentTaleForm.value.editingExistingOnChainTale) {
        //   // showUiMessage("Updating on-chain tale...", "loading", null, 0);
        //   const taleAccountPda = (await PublicKey.findProgramAddress(
        //       [Buffer.from("tale", 'utf-8'), taleIdSeedBuffer], PROGRAM_ID
        //   ))[0];

        //   // ***** DIAGNOSTIC LOG for update_tale *****
        //   console.log("Calling updateTale with args:", ...commonArgs);
        //   console.log("Status value for update:", currentTaleForm.value.status, "Type:", typeof currentTaleForm.value.status);


        //   txSignature = await program.methods.updateTale(...commonArgs)
        //     .accounts({
        //       taleAccount: taleAccountPda,
        //       author: wallet.publicKey.value,
        //     })
        //     .rpc();
        //   showUiMessage("On-chain tale updated!", "success", txSignature);
        // } else {
        //   showUiMessage("Creating on-chain tale...", "loading", null, 0);
        //   const createArgs = [taleIdSeed, ...commonArgs];

        //   // ***** DIAGNOSTIC LOG for create_tale *****
        //   console.log("Calling createTale with args:", ...createArgs);
        //   console.log("Status value for create:", currentTaleForm.value.status, "Type:", typeof currentTaleForm.value.status);


        //   const taleAccountPda = (await PublicKey.findProgramAddress(
        //       [Buffer.from("tale", 'utf-8'), taleIdSeedBuffer], PROGRAM_ID
        //   ))[0];

        //   txSignature = await program.methods.createTale(...createArgs)
        //     .accounts({
        //       taleAccount: taleAccountPda,
        //       author: wallet.publicKey.value,
        //       systemProgram: SystemProgram.programId,
        //     })
        //     .rpc();
        //   showUiMessage("On-chain tale created!", "success", txSignature);
        // }
        // await fetchAuthorOnChainTales();
        // closeTaleModal();

    } catch (error) {
        console.error('TaleManager: Error saving tale:', error);
        let errorMsg = error.message || error.toString();
        if (error.logs) errorMsg += ` Logs: ${error.logs.join(', ')}`;
        // showUiMessage(`Save tale error: ${errorMsg}`, "error", error.signature);
    } finally {
        // isSavingTale.value = false;
        // isUploadingCover.value = false;
        // isUploadingThumbnail.value = false;
        // if (uiMessage.value.type === 'loading') showUiMessage("","info");
    }
}


const onFormSubmit = ({ valid, values }) => {
    if (valid) {
        showConfirmationModal.value = true;
        handleSaveTale(values)
    }
};

const handleSquareThumbnailSelect = (event) => {
    const file = event.files[0];
    if (file) {
        const reader = new FileReader();
        squareThumbnail.value = file;

        reader.onload = (e) => {
            squareThumbnailUrl.value = e.target.result;
        };
        reader.readAsDataURL(file);
    }
};

const removeSquareThumbnail = () => {
    squareThumbnailUrl.value = null;
};

const handleLandscapeThumbnailSelect = (event) => {
    const file = event.files[0];
    if (file) {
        const reader = new FileReader();
        landscapeThumbnail.value = file;
        reader.onload = (e) => {
            landscapeThumbnailUrl.value = e.target.result;
        };
        reader.readAsDataURL(file);
    }
};

const removeLandscapeThumbnail = () => {
    landscapeThumbnailUrl.value = null;
};

const handleLater = () => {
    showConfirmationModal.value = false;
    // Add any additional logic for "Later" action
};

const handleCreateChapter = () => {
    showConfirmationModal.value = false;
    step.value = 2;
    // Add any additional logic for "Create Chapter" action
};

const chapterImages = ref([]);
const publishDate = ref(null);

const handleChapterImagesSelect = (event) => {
    const files = event.files;
    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            chapterImages.value.push({
                file,
                preview: e.target.result
            });
        };
        reader.readAsDataURL(file);
    });
    imageSet.value = files
};

const removeChapterImage = (index) => {
    chapterImages.value.splice(index, 1);
};

const handleCreateNFT = () => {
    // Implement NFT creation logic
    console.log('Create NFT clicked');
    // href to launch nft
    router.push({ name: 'PublishNFT' })
};

const resolverChapter = ref(zodResolver(
    z.object({
        chapterTitle: z.string().min(1, { message: 'Chapter title is required.' }),
        chapterImages: z.array(z.any()).min(1, { message: 'At least one image is required.' })
            .max(24, { message: 'Maximum 24 images allowed.' }),
        creatorNotes: z.string().min(1, { message: 'Creator notes are required.' }),
        publishNow: z.boolean(),
        schedule: z.boolean(),
        publishDate: z.date().optional().refine(
            (date) => !date || date > new Date(),
            { message: 'Publish date must be in the future.' }
        ),
    })
));

const initialValuesChapter = ref({
    chapterTitle: '',
    chapterImages: [],
    creatorNotes: '',
    publishNow: true,
    schedule: false,
    publishDate: null,
});

const onFormSubmitChapter = ({ valid, states }) => {
    if (valid) {
        // Implement chapter submission logic
        handleSaveEpisode(states)
        console.log('here', states)
        toast.add({ severity: 'success', summary: 'Success', detail: 'Chapter created successfully', life: 3000 });
    }
};

async function handleSaveEpisode(states) {
    // if (!program || !wallet.publicKey.value || !props.parentTale?.onChainPdaString) {
    //   showUiMessage("Wallet, program, or parent tale info missing.", "error"); return;
    // }
    // if (!isAuthorOfParentTale.value) { showUiMessage("Not authorized.", "error"); return; }

    // isSavingEpisode.value = true;
    let contentCidForOnChain = '';
    let finalImageSetId = chapterImages.value;
    let finalThumbnailCid = squareThumbnail.value; // New
    console.log(states)
    try {
        // 1. Upload Episode Thumbnail if new file is selected
        if (squareThumbnail.value) {
            // isUploadingEpisodeThumbnail.value = true;
            // showUiMessage("Uploading episode thumbnail...", "loading", null, 0);
            const thumbUploadResult = await uploadFileToIPFS(squareThumbnail.value);
            // isUploadingEpisodeThumbnail.value = false;
            if (thumbUploadResult.success) {
                finalThumbnailCid = thumbUploadResult.ipfsHash;
                squareThumbnailUrl.value = finalThumbnailCid;
                // showUiMessage("Episode thumbnail uploaded.", "info", null, 1500);
            } else {
                throw new Error(thumbUploadResult.error || "Episode thumbnail IPFS upload failed");
            }
        }


        // 2. Upload content markdown to IPFS
        if (states.creatorNotes.value) {
            // showUiMessage("Uploading content to IPFS...", "info", 0);
            const textFileName = `${(states.chapterTitle.value || 'ep').replace(/\s+/g, '_')}_${Date.now()}.md`;
            const textUploadResult = await uploadTextToIPFS(states.creatorNotes.value, textFileName);
            if (textUploadResult.success) {
                contentCidForOnChain = textUploadResult.ipfsHash;
                // showUiMessage("Content uploaded to IPFS.", "info", 1000);
            } else {
                throw new Error(textUploadResult.error || "Content IPFS upload failed");
            }
        }
        let imagesChapter = []
        for (const file of imageSet.value) {
            const uploadResult = await uploadFileToIPFS(file);
            if (uploadResult.success && uploadResult.imageUrl) {
                imagesChapter.push(uploadResult.imageUrl);
            } else { throw new Error(uploadResult.error || `Failed to upload ${file.name}`); }
        }
        // else if (currentEpisodeForm.value.editingExistingOnChainEpisode) {
        //     const existingOcEpisode = fetchedOnChainEpisodes.value.find(ep => ep.publicKey.toString() === currentEpisodeForm.value.episodeOnChainPdaToEdit);
        //     contentCidForOnChain = existingOcEpisode?.account?.contentCid || '';
        // }

        // 3. Create/Update ImageSet in Backend
        // showUiMessage("Syncing images with backend...", "info", 0);
        const imageSetPayload = {
            images: imagesChapter.filter(img => img && img.trim() !== ''),
            existingImageSetId: [],
        };
        const imageSetResponse = await authApiClient.post('/episodes/image-set', imageSetPayload);
        if (!imageSetResponse.success || !imageSetResponse.imageSetId) {
            throw new Error(imageSetResponse.message || "Failed to create/update image set in backend.");
        }
        finalImageSetId = imageSetResponse.imageSetId;
        // showUiMessage("Image set synced with backend.", "info", 1500);

        // 4. Prepare On-Chain Data & Perform Transaction
        const publishAtTimestamp = states.publishDate
            ? new BN(Math.floor(new Date(states.publishDate).getTime() / 1000))
            : null;
        const unpublishAtTimestamp = null

        if (publishAtTimestamp && unpublishAtTimestamp && publishAtTimestamp.gte(unpublishAtTimestamp)) {
            throw new Error("Publish time must be before unpublish time.");
        }
        if (states.publishOption.value !== undefined && !publishAtTimestamp) { // Status 'Scheduled'
            throw new Error("Publish time is required for 'Scheduled' status.");
        }


        const onChainMethodArgs = [ // For update_episode
            states.chapterTitle.value,
            contentCidForOnChain,
            finalThumbnailCid, // New argument
            finalImageSetId,
            0,
            states.publishOption.value !== undefined ? 2 : 1,
            selectedNft.value !== null,
            selectedNft.value !== null ? selectedNft.value : "",
            publishAtTimestamp, // Option<i64>
            unpublishAtTimestamp, // Option<i64>
        ];
        console.log(onChainMethodArgs)
        let episodeOnChainPdaString;
        // let usedEpisodeIdSeed = currentEpisodeForm.value.onChainEpisodeIdSeed;

        let txSignature = '';
        let usedEpisodeIdSeed = uuidv4().substring(0, MAX_ONCHAIN_EPISODE_ID_SEED_LENGTH);
        // showUiMessage("Creating on-chain episode...", "info", 0);
        const [pda, _bump] = PublicKey.findProgramAddressSync(
            [Buffer.from("episode"), new PublicKey(taleId.value).toBuffer(), Buffer.from(usedEpisodeIdSeed)],
            PROGRAM_ID
        );
        episodeOnChainPdaString = pda.toString();

        const createArgs = [usedEpisodeIdSeed, ...onChainMethodArgs];
        txSignature = await program.methods.createEpisode(...createArgs)
            .accounts({
                episodeAccount: episodeOnChainPdaString,
                parentTaleAccount: new PublicKey(taleId.value),
                author: wallet.publicKey.value,
                systemProgram: SystemProgram.programId,
            }).rpc();
        // showUiMessage("On-chain episode created!", "success", txSignature);
        // if (currentEpisodeForm.value.editingExistingOnChainEpisode && currentEpisodeForm.value.episodeOnChainPdaToEdit) {
        //   // showUiMessage("Updating on-chain episode...", "info", 0);
        //   episodeOnChainPdaString = currentEpisodeForm.value.episodeOnChainPdaToEdit;
        //   txSignature = await program.methods.updateEpisode(...onChainMethodArgs)
        //   .accounts({ episodeAccount: new PublicKey(episodeOnChainPdaString), author: wallet.publicKey.value })
        //   .rpc();
        //   // showUiMessage("On-chain episode updated!", "success", txSignature);
        // } else {
        //   usedEpisodeIdSeed = uuidv4().substring(0, MAX_ONCHAIN_EPISODE_ID_SEED_LENGTH);
        //   // showUiMessage("Creating on-chain episode...", "info", 0);
        //   const [pda, _bump] = PublicKey.findProgramAddressSync(
        //     [Buffer.from("episode"), new PublicKey(props.parentTale.onChainPdaString).toBuffer(), Buffer.from(usedEpisodeIdSeed)],
        //     PROGRAM_ID
        //   );
        //   episodeOnChainPdaString = pda.toString();

        //   const createArgs = [usedEpisodeIdSeed, ...onChainMethodArgs];
        //   txSignature = await program.methods.createEpisode(...createArgs)
        //   .accounts({
        //     episodeAccount: episodeOnChainPdaString,
        //     parentTaleAccount: new PublicKey(props.parentTale.onChainPdaString),
        //     author: wallet.publicKey.value,
        //     systemProgram: SystemProgram.programId,
        //   }).rpc();
        //   // showUiMessage("On-chain episode created!", "success", txSignature);
        // }

        // (Optional) Update backend EpisodeImageSet with on-chain PDA link
        // ... (existing linking logic can remain) ...

        // fetchAllEpisodeData();
        // closeEpisodeModal();
    } catch (error) {
        console.error('Error saving episode:', error);
        let errorMsg = error.message || error.toString();
        if (error.logs) errorMsg += ` Logs: ${error.logs.join(', ')}`;
        // showUiMessage(`Save episode error: ${errorMsg}`, "error", error.signature);
    } finally {
        // isSavingEpisode.value = false;
        // isUploadingEpisodeThumbnail.value = false; // Reset
        // if (uiMessage.value.type === 'loading') showUiMessage("","info");
    }
}
</script>
