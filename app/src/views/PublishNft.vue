<template>
    <div class="home-view">
        <div class="circle-bg"></div>
        <div class="max-w-[738px] mx-auto p-8" style="background-color: rgba(0, 0, 0, .1);">
            <Form v-slot="$form" :resolver="resolver" :initialValues="initialValues" @submit="onFormSubmit">
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
                    <Textarea name="description" placeholder="e.g. The Pond is the greatest collection ever made" class="w-full" />
                    <Message v-if="$form.description?.invalid" severity="error" size="small" variant="simple">{{
                        $form.description.error?.message }}</Message>
                </div>
                <Button type="submit" label="Publish NFT" class="mt-[20px] w-full" />
            </Form>
        </div>
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
const toast = useToast();
const initialValues = ref({
    name: '',
    symbol: '',
    image: '',
    description: '',
});

const resolver = ref(zodResolver(
    z.object({
        name: z.string().min(1, { message: 'Name is required.' }),
        symbol: z.string().min(1, { message: 'Symbol is required.' }),
        image: z.array(z.string()).min(1, { message: 'Image is required.' }),
        description: z.string().min(1, { message: 'Description is required.' }),
    })
));

const onFormSubmit = ({ valid }) => {
    if (valid) {
        toast.add({ severity: 'success', summary: 'Form is submitted.', life: 3000 });
    }
};
</script>
