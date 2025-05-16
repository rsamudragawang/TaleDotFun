<template>
    <div class="home-view">
        <div class="circle-bg"></div>
        <div class="flex flex-col gap-4 items-center text-center mt-[80px]">
            <h1 class="text-white text-[64px]">Stories You Can Own<br>
                NFTs You Can Create</h1>
            <p class="text-slate-400 text-[20px]">Whether you're a creator looking to publish, or a fan ready to collect
                <br> TaleDotFun makes cultural storytelling collectible, tradable, and community-powered
            </p>
        </div>
        <div class="mt-[56px] flex gap-[24px] justify-center">
            <Button>
                <img src="/public/icons/number.svg" alt="publish">
                Publish Your Own NFTs</Button>
            <Button severity="secondary">
                <img src="/public/icons/id_card.svg" alt="collect">
                Collect Cultural NFTs</Button>
        </div>
        <div class="mt-[120px] pt-[48px]">
            <div class="flex items-center justify-between">
                <h1 class="text-white text-2xl">Get Inspired by Others Creator</h1>
            </div>
            <div class="grid grid-cols-12 gap-[24px]">
                <div class="col-span-3 rounded-lg mt-5" style="background-color: rgba(0, 0, 0, 0.5);" v-for="i in 8">
                    <img src="/public/images/nft_chromatic.png" alt="test">
                    <div class="relative p-4">
                        <div class="mt-5">
                            <h1 class="text-lg">Chromatic Soul</h1>
                            <div class="flex gap-4 py-4 justify-between items-center">
                                <div class="flex gap-2 items-center">
                                    <img src="/public/icons/solana.svg" alt="solana">
                                    <p class="text-slate-400">0,876 SOL</p>
                                </div>
                                <div class="flex gap-2 items-center">
                                    <i class="pi pi-user"></i>
                                    <p class="text-slate-400">6.4K/10K</p>
                                </div>
                            </div>
                            <div class="pt-4 mt-6 border-t border-white">
                                <div class="flex items-center justify-between">
                                    <p class="text-slate-400">a story from</p>
                                    <div class="flex gap-2">
                                        <img src="/public/icons/odesy.svg" alt="">
                                        <p class="text-slate-400">Odesy AI</p>
                                    </div>
                                </div>
                            </div>
                            <Button class="w-full mt-4" severity="secondary">Mint & Get Special Access</Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import Button from 'primevue/button';
</script>

<style scoped></style>