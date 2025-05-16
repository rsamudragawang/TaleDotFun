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
                            <label class="text-white">Select Your Series</label>
                            <p class="text-sm text-slate-400 mb-4">Choose a series and its thumbnail</p>
                            <FileUpload class="mx-auto" name="seriesThumbnail" accept="image/*" :maxFileSize="1000000"
                                @select="handleSeriesThumbnailSelect" @remove="removeSeriesThumbnail"
                                :customUpload="true" :auto="true" :showUploadButton="false" :showCancelButton="false"
                                chooseLabel="Select Image" invalidFileSizeMessage="File size must be less than 1MB">
                                <template #empty>
                                    <div class="flex flex-col items-center gap-2">
                                        <i class="pi pi-upload text-2xl"></i>
                                        <p>Drag & drop or click to upload</p>
                                        <p class="text-sm text-gray-400">Recommended size: 1080x1080</p>
                                    </div>
                                </template>
                                <template #content="{ files }">
                                    <div v-if="seriesThumbnailUrl" class="flex flex-col items-center gap-2">
                                        <img :src="seriesThumbnailUrl" alt="Series Thumbnail Preview"
                                            class="w-[200px] h-[200px] object-cover rounded-lg" />
                                    </div>
                                </template>
                            </FileUpload>
                            <Message v-if="$form.seriesThumbnail?.invalid" severity="error" size="small"
                                variant="simple">
                                {{ $form.seriesThumbnail.error?.message }}
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
                                <Dropdown name="category" :options="categories" optionLabel="name"
                                    placeholder="Select a category" class="w-full" />
                                <Message v-if="$form.category?.invalid" severity="error" size="small" variant="simple">
                                    {{ $form.category.error?.message }}
                                </Message>
                            </div>

                            <!-- Tags -->
                            <div class="flex flex-col gap-1">
                                <label for="tags" class="text-white">Add Tags</label>
                                <Chips name="tags" v-model="tags" class="w-full" />
                                <Message v-if="$form.tags?.invalid" severity="error" size="small" variant="simple">
                                    {{ $form.tags.error?.message }}
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
                                <label class="text-white">Choose NFT</label>
                                <div
                                    class="bg-[#322D3E] p-[28px] border border-dashed rounded-lg text-center flex flex-col gap-4 items-center">
                                    <img src="/public/icons/x.svg" alt="x" class="w-16" />
                                    <p class="font-bold">No NFT Selected</p>
                                    <p class="mt-2">Select an NFT for this proposal</p>
                                    <Button severity="secondary">Select NFT</Button>
                                </div>
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
import DatePicker from 'primevue/datepicker';
import Chips from 'primevue/chips';
import InputNumber from 'primevue/inputnumber';
import Toast from 'primevue/toast';
import { useToast } from 'primevue';

const toast = useToast();
const seriesThumbnailUrl = ref(null);
const choices = ref(['']);
const tags = ref([]);
const startDate = ref(null);
const endDate = ref(null);
const regularVotePower = ref(0);
const nftVotePower = ref(0);

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
    seriesThumbnail: null,
    questions: '',
    description: '',
    category: null,
    tags: [],
    startDate: null,
    endDate: null,
    regularVotePower: 0,
    nftVotePower: 0,
    choices: ['']
});

const resolver = ref(zodResolver(
    z.object({
        seriesThumbnail: z.any().optional(),
        questions: z.string().min(1, { message: 'Questions are required.' }),
        description: z.string().min(10, { message: 'Description must be at least 10 characters long.' }),
        category: z.object({
            name: z.string(),
            value: z.string()
        }, { required_error: 'Please select a category.' }),
        tags: z.array(z.string()).min(1, { message: 'At least one tag is required.' }),
        startDate: z.date({ required_error: 'Start date is required.' }),
        endDate: z.date({ required_error: 'End date is required.' }),
        regularVotePower: z.number().min(0, { message: 'Regular vote power must be 0 or greater.' }),
        nftVotePower: z.number().min(0, { message: 'NFT vote power must be 0 or greater.' }),
        choices: z.array(z.string()).min(1, { message: 'At least one choice is required.' })
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

const onFormSubmit = ({ valid, states }) => {
    console.log(states);
    if (valid) {
        toast.add({ severity: 'success', summary: 'Success', detail: 'Proposal created successfully', life: 3000 });
    }
};
</script>