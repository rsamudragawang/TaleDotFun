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
                                        <div
                                            class="bg-[#322D3E] p-[28px] border border-dashed rounded-lg text-center flex flex-col gap-4 items-center">
                                            <img src="/public/icons/x.svg" alt="x" class="w-16" />
                                            <p class="font-bold">No NFT Available Yet</p>
                                            <p class="mt-2">You haven't created any NFTs yet. To offer readers exclusive
                                                access<br>
                                                or special benefits, start by creating an NFT first.</p>
                                            <Button severity="secondary">Create NFT</Button>
                                        </div>
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
                                            <div
                                                class="bg-[#322D3E] p-[28px] border border-dashed rounded-lg text-center flex flex-col gap-4 items-center">
                                                <img src="/public/icons/x.svg" alt="x" class="w-16" />
                                                <p class="font-bold">No NFT Selected</p>
                                                <p class="mt-2">You can create an NFT for this chapter to offer
                                                    exclusive benefits<br>
                                                    to readers who own it.</p>
                                                <Button severity="secondary" @click="handleCreateNFT">Create
                                                    NFT</Button>
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

const step = ref(1);
const squareThumbnailUrl = ref(null);
const landscapeThumbnailUrl = ref(null);
const showConfirmationModal = ref(false);
const publishOption = ref('now');
const toast = useToast();

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

const initialValues = ref({
    title: '',
    category: null,
    // period: '',
    synopsis: '',
    squareThumbnail: null,
    landscapeThumbnail: null,
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
    })
));

const onFormSubmit = ({ valid, values }) => {
    if (valid) {
        showConfirmationModal.value = true;
    }
};

const handleSquareThumbnailSelect = (event) => {
    const file = event.files[0];
    if (file) {
        const reader = new FileReader();
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
};

const removeChapterImage = (index) => {
    chapterImages.value.splice(index, 1);
};

const handleCreateNFT = () => {
    // Implement NFT creation logic
    console.log('Create NFT clicked');
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

const onFormSubmitChapter = ({ valid, values }) => {
    if (valid) {
        // Implement chapter submission logic
        toast.add({ severity: 'success', summary: 'Success', detail: 'Chapter created successfully', life: 3000 });
    }
};
</script>
