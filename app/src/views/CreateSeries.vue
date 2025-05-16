<template>
    <Form v-slot="$form" :resolver="resolver" :initialValues="initialValues" @submit="onFormSubmit">
        <div class="home-view">
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
                                        <div class="flex flex-1 flex-col gap-1">
                                            <label for="period" class="text-white">Historical Period</label>
                                            <div class="flex gap-4">
                                                <InputText name="period" type="text" placeholder="--"
                                                    class="w-full" />
                                            </div>
                                            <Message v-if="$form.period?.invalid || $form.periodEnd?.invalid"
                                                severity="error" size="small" variant="simple">
                                                {{ $form.period?.error?.message || $form.periodEnd?.error?.message
                                                }}
                                            </Message>
                                        </div>

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
                                            <p class="mt-2">You haven’t created any NFTs yet. To offer readers exclusive
                                                access<br>
                                                or special benefits, start by creating an NFT first.</p>
                                            <Button severity="secondary">Create NFT</Button>
                                        </div>
                                    </div>

                                    <Button type="submit" label="Continue" class="mt-4" />
                                </div>
                            </div>
                        </div>
                    </StepPanel>
                    <StepPanel :value="2"></StepPanel>
                </StepPanels>
            </Stepper>

            <!-- Step 1: Series Details Form -->

        </div>

    </Form>
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

const step = ref(1);
const squareThumbnailUrl = ref(null);
const landscapeThumbnailUrl = ref(null);

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
    period: '',
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
        period: z.string().min(1, { message: 'Period is required.' }),
        synopsis: z.string().min(10, { message: 'Synopsis must be at least 10 characters long.' }),
        squareThumbnail: z.any().optional(),
        landscapeThumbnail: z.any().optional(),
    })
));

const onFormSubmit = ({ valid, values }) => {
    if (valid) {
        console.log('Form submitted:', values);
        step.value = 2; // Move to next step
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
</script>
