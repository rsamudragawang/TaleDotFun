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
                            <FileUpload name="image" mode="basic" accept="image/*" :maxFileSize="1000000"
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
                            <InputNumber name="mintPrice" type="number" placeholder="0.00" class="w-full" />
                            <InputGroupAddon>SOL</InputGroupAddon>
                        </InputGroup>
                        <Message v-if="$form.mintPrice?.invalid" severity="error" size="small" variant="simple">{{
                            $form.mintPrice.error?.message }}</Message>
                    </div>
                    <div class="flex-1 flex flex-col gap-1">
                        <label for="royalty">Royalty Fee</label>
                        <InputGroup>
                            <InputNumber name="royalty" type="number" placeholder="0.00" class="w-full" />
                            <InputGroupAddon>%</InputGroupAddon>
                        </InputGroup>
                        <Message v-if="$form.royalty?.invalid" severity="error" size="small" variant="simple">{{
                            $form.royalty.error?.message }}</Message>
                    </div>
                </div>
                <div class="flex gap-4 mt-4">
                    <div class="flex-1 flex flex-col gap-1">
                        <label for="maxSupply">Max Supply</label>
                        <InputNumber name="maxSupply" type="number" placeholder="0.00" class="w-full" />
                        <Message v-if="$form.maxSupply?.invalid" severity="error" size="small" variant="simple">{{
                            $form.maxSupply.error?.message }}</Message>
                    </div>
                    <div class="flex-1 flex flex-col gap-1">
                        <label for="mintDate">Mint Date</label>
                        <DatePicker placeholder="Select date and time" show-icon icon-display="input" name="mintDate" type="date" class="w-full" showTime />
                        <Message v-if="$form.mintDate?.invalid" severity="error" size="small" variant="simple">{{
                            $form.mintDate.error?.message }}</Message>
                    </div>
                </div>
                <div class="flex gap-4 mt-4">
                    <div class="flex-1 flex flex-col gap-1">
                        <label for="whitelist">
                            Whitelist Stages
                        </label>
                        <div class="bg-[#15111D]">
                            <div v-for="(stage, index) in whitelistStages" :key="index"
                                class="p-4 border-b border-[#252030]">
                                <div class="flex justify-between items-center">
                                    <div>
                                        <h3 class="text-white">{{ stage.name }}</h3>
                                        <p class="text-sm text-[#857F94]">Mint Price: {{ stage.mintPrice }} SOL</p>
                                        <p class="text-sm text-[#857F94]">Mint Date: {{ formatDate(stage.mintDate) }}
                                        </p>
                                    </div>
                                    <Button icon="pi pi-trash" severity="danger" text
                                        @click="removeWhitelistStage(index)" />
                                </div>
                            </div>
                            <div class="flex gap-4 items-center text-sm text-[#857F94] text-center justify-center py-2 rounded-lg cursor-pointer border border-dashed border-[#252030]"
                                @click="openWhitelistModal">
                                <i class="pi pi-plus"></i>
                                <p>Add Allowlist Stage</p>
                            </div>
                        </div>
                    </div>
                </div>
                <Button type="submit" label="Publish NFT" class="mt-[20px] w-full" />
            </div>
        </Form>

        <!-- Whitelist Stage Modal -->
        <Dialog v-model:visible="showWhitelistModal" modal header="Add Whitelist Stage" :style="{ width: '50vw' }">
            <template #default>
                <Form v-slot="$whitelistForm" :resolver="whitelistResolver" :initialValues="whitelistInitialValues"
                    @submit="onWhitelistSubmit">
                    <div class="flex flex-col gap-4">
                        <div class="flex flex-col gap-1">
                            <label for="whitelistName">Whitelist Stage Name</label>
                            <InputText name="name" type="text" placeholder="e.g. Early Access" class="w-full" />
                            <Message v-if="$whitelistForm.name?.invalid" severity="error" size="small" variant="simple">
                                {{ $whitelistForm.name.error?.message }}
                            </Message>
                        </div>

                        <div class="flex flex-col gap-1 mt-4">
                            <label for="whitelistMintPrice">Mint Price</label>
                            <InputGroup>
                                <InputNumber name="mintPrice" type="number" placeholder="0.00" class="w-full" />
                                <InputGroupAddon>SOL</InputGroupAddon>
                            </InputGroup>
                            <Message v-if="$whitelistForm.mintPrice?.invalid" severity="error" size="small"
                                variant="simple">
                                {{ $whitelistForm.mintPrice.error?.message }}
                            </Message>
                        </div>

                        <div class="flex flex-col gap-1 mt-4">
                            <label for="allowlist">Allowlist</label>
                            <InputText name="allowlist" type="text" placeholder="e.g. 0x1234567890abcdef" class="w-full" />
                            <Message v-if="$whitelistForm.allowlist?.invalid" severity="error" size="small"
                                variant="simple">
                                {{ $whitelistForm.allowlist.error?.message }}
                            </Message>
                        </div>

                        <div class="flex flex-col gap-1 mt-4">
                            <label for="whitelistMintDate">Mint Date & Time</label>
                            <DatePicker placeholder="Select date and time" show-icon icon-display="input" name="mintDate" type="date" class="w-full" showTime />
                            <Message v-if="$whitelistForm.mintDate?.invalid" severity="error" size="small"
                                variant="simple">
                                {{ $whitelistForm.mintDate.error?.message }}
                            </Message>
                        </div>
                    </div>
                    <div class="flex gap-2 justify-end mt-8">
                        <Button severity="secondary" label="Cancel" icon="pi pi-times" @click="showWhitelistModal = false"
                            class="p-button-text" />
                        <Button label="Add Stage" icon="pi pi-check" type="submit" />
                    </div>
                </Form>
            </template>
        </Dialog>
    </div>
</template>


<script setup>
import { ref } from 'vue';
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

const toast = useToast();
const initialValues = ref({
    name: '',
    symbol: '',
    image: '',
    description: '',
    mintPrice: '',
    royalty: '',
    maxSupply: '',
    mintDate: '',
    whitelistStages: [],
});

const resolver = ref(zodResolver(
    z.object({
        name: z.string().min(1, { message: 'Name is required.' }),
        symbol: z.string().min(1, { message: 'Symbol is required.' }),
        image: z.array(z.string()).min(1, { message: 'Image is required.' }),
        description: z.string().min(1, { message: 'Description is required.' }),
        mintPrice: z.number().min(0, { message: 'Mint price is required.' }),
        royalty: z.number().min(0, { message: 'Royalty fee is required.' }),
        maxSupply: z.number().min(0, { message: 'Max supply is required.' }),
        mintDate: z.date().min(new Date(), { message: 'Mint date is required.' }),
        whitelistStages: z.array(z.object({
            name: z.string().min(1, { message: 'Stage name is required.' }),
            mintPrice: z.number().min(0, { message: 'Mint price is required.' }),
            mintDate: z.date().min(new Date(), { message: 'Mint date is required.' }),
        })).default([]),
    })
));

const onFormSubmit = ({ valid, states }) => {
    if (valid) {
        toast.add({ severity: 'success', summary: 'Form is submitted.', life: 3000 });
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
    console.log(states)
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
