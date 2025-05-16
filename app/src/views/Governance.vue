<template>
    <div class="home-view">
        <div class="circle-bg"></div>
        <div class="flex gap-4 items-center mt-[80px]">
            <div class="flex-2">
                <div class="flex flex-col gap-4">
                    <h1 class="text-white text-[64px] font-bold">Where Stories Evolve<br> Through Your Voice</h1>
                    <p class="text-slate-400 text-[20px]">Empower your readers. Launch community votes to decide<br>
                        your
                        story’s next direction, format, or evolution </p>
                </div>
            </div>
            <div class="flex-1">
                <div class="flex flex-col justify-between h-[317px] p-7"
                    style="background-image: url('/public/images/bg_governance.png'); background-size: cover; background-repeat: no-repeat;">
                    <div></div>
                    <p class="text-white text-2xl font-bold text-center">Make Incredible<br>
                        Stories by Readers Choice</p>
                    <Button>Create Proposal</Button>
                </div>
            </div>
        </div>
        <div class="mt-[100px] p-8 bg-[#191523] rounded-lg">
            <div class="flex flex-col gap-4">
                <div class="p-6 relative border z-10 rounded-lg" v-for="i in 3" :key="i">
                    <img src="/public/icons/circular.svg" alt="" class="absolute z-0 left-0 top-0 w-40 rounded-lg">
                    <div class="flex items-center divide-x divide-white gap-8">
                        <p class="text-slate-400 text-base pr-8 font-bold">#AB243</p>
                        <div class="flex items-center gap-2">
                            <img src="/public/images/avatar_1.png" alt="" class="w-8 h-8 rounded-full">
                            <p class="text-white text-sm">Nisrinath for <b>Lutung Kasarung Story</b></p>
                        </div>
                    </div>
                    <h1 class="text-white text-2xl font-bold mt-4">Timun Mas into Real Action Performance</h1>
                    <div class="flex items-center justify-between mt-4">
                        <p class="text-slate-400 text-sm">Voting Ends : May 20, 2025 17.00</p>
                        <Button severity="secondary" class="w-[100px]" @click="router.push('/governance/1')">Vote</Button>
                    </div>
                </div>
            </div>
        </div>
        <div class="mt-[100px]">
            <h1 class="text-white text-2xl font-bold">Closed Proposal</h1>
            <div class="mt-[50px]">
                <div class="p-6 relative border-b z-10 pb-[48px] mt-[48px] flex justify-between items-center" v-for="i in 3" :key="i">
                    <div>
                        <div class="flex items-center divide-x divide-white gap-8">
                            <p class="text-slate-400 text-base pr-8 font-bold">#AB243</p>
                            <div class="flex items-center gap-2">
                                <img src="/public/images/avatar_1.png" alt="" class="w-8 h-8 rounded-full">
                                <p class="text-white text-sm">Nisrinath for <b>Lutung Kasarung Story</b></p>
                            </div>
                        </div>
                        <h1 class="text-white text-2xl font-bold mt-4">Timun Mas into Real Action Performance</h1>
                        <div class="flex items-center justify-between mt-4">
                            <p class="text-slate-400 text-sm">Executed on : <span class="text-white">May 20, 2025
                                    17.00</span>
                            </p>
                        </div>
                    </div>
                    <div class="py-2 px-8 bg-[#191523] rounded-lg text-green-500">Executed</div>
                </div>
            </div>
        </div>

    </div>
</template>

<script setup>
import Button from 'primevue/button';
import { useRouter } from 'vue-router';

const router = useRouter();
</script>