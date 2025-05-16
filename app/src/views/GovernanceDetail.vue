<template>
    <div class="home-view">
        <div class="circle-bg"></div>
        <div class="flex gap-8">
            <div class="flex-2">
                <div class="flex items-center gap-4 cursor-pointer" @click="router.push('/governance')">
                    <i class="pi pi-arrow-left"></i>
                    <p>Back</p>
                </div>
                <div class="mt-6">
                    <h1 class="text-white text-3xl font-bold">Timun Mas into Real Action Performance</h1>
                    <p class="text-slate-400 text-sm mt-8">Description</p>
                    <p class="text-white text-base mt-2">
                        Let’s bring the legendary Indonesian folktale Timun Mas to life — not just on screens, but on
                        stage and set. <br>This proposal aims to adapt the beloved story of Timun Mas vs. the Giant
                        (Buto
                        Ijo) into a live-action short film or performance, combining traditional art, local
                        storytelling, and cinematic visuals. The project will also offer Web3 engagement through:<br>
                        🎟️ NFT-based access to exclusive behind-the-scenes content<br>
                        🎬 Early digital screening for holders<br>
                        🎁 Collectible NFTs (costume concept art, iconic scenes, etc.)<br>
                        🗳️ Fan-based decisions for casting, location, or storyline emphasis
                    </p>
                </div>
            </div>
            <div class="flex-1">
                <div class="rounded-lg w-full bg-white/10 p-6">
                    <p class="text-white text-sm">Result So Far</p>
                    <div class="flex items-center justify-between mt-8">
                        <p class="text-white text-sm">75%(765)</p>
                        <p class="text-white text-sm">25% (150)</p>
                    </div>
                    <div class="w-full bg-red-500 h-4 rounded-full mt-4 flex">
                        <div class="bg-green-500 h-4 rounded-full" style="width: 75%;"></div>
                    </div>
                    <div class="py-6 px-4 rounded-lg mt-4" style="background-color: rgba(255, 255, 255, 0.1);">
                        <h1 class="text-base font-bold text-white">Own Your Vote</h1>
                        <div class="mt-4">
                            <div class="flex flex-col gap-4">
                                <div
                                    class="p-4 border-2 flex items-center gap-4 cursor-pointer rounded-lg border-green-200">
                                    <RadioButton v-model="vote" inputId="yes" name="yes" value="yes" />
                                    <p class="text-white">Vote YES</p>
                                </div>
                                <div
                                    class="p-4 rounded-lg border-2 flex items-center gap-4 cursor-pointer border-red-200">
                                    <RadioButton v-model="vote" inputId="no" name="no" value="no" />
                                    <p class="text-white">Vote NO</p>
                                </div>
                            </div>
                        </div>
                        <div class="mt-4 pt-4 border-t border-dashed border-white/20">
                            <Button class="w-full">Vote This</Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="flex gap-8 mt-8">
            <div class="flex-2">
                <div
                    class="flex text-sm gap-4 w-full bg-[#312A3F] p-4 rounded-t-lg border-t border-l border-r border-white/20">
                    <div class="flex-1">Voters</div>
                    <div class="flex-1">Timestamp</div>
                    <div class="flex-1">Voting Powers</div>
                    <div class="flex-1">Transaction</div>
                </div>
                <div class="flex p-4 gap-4 text-sm w-full rounded-b-lg border-l border-r border-b border-white/20"
                    v-for="voter in 10" :key="voter">
                    <div class="flex-1">
                        <p>0x1234567890</p>
                    </div>
                    <div class="flex-1">
                        <p>2025-05-16 T05:47:47+00:00</p>
                    </div>
                    <div class="flex-1">
                        <p>100</p>
                    </div>
                    <div class="flex-1 flex items-center gap-2">
                        <i class="pi pi-external-link"></i>
                    </div>
                </div>
            </div>
            <div class="flex-1">
                <div class="w-full bg-white/10 rounded-lg py-6 px-4">
                    <div class="flex items-center justify-between pb-4 border-b border-white/20 border-dashed">
                        <p class="text-slate-400">A story from</p>
                        <div class="flex items-center gap-4">
                            <img src="/public/images/avatar_2.png" alt="" class="w-6 h-6 rounded-full">
                            <p>Nisrinath</p>
                        </div>
                    </div>
                    <p class="text-lg mt-4">The Story of Timun Mas</p>
                    <img src="/public/images/comic_1.png" alt="" class="w-full mt-4 rounded-lg">
                    <Button severity="contrast" class="w-full mt-4">Read Full Stories</Button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import RadioButton from 'primevue/radiobutton';
import Button from 'primevue/button';
import { useRouter } from 'vue-router';
import { ref } from 'vue';

const vote = ref('yes');
const router = useRouter();
</script>