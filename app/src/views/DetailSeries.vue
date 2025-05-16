<template>
    <div class="circle-bg"></div>
    <div class="home-view mt-8">
        <div class="flex gap-8">
            <div class="flex-2 p-8 bg-[#BB3FDA] rounded-lg relative z-10 overflow-hidden">
                <img src="/public/icons/grid.svg" alt="grid"
                    class="absolute -top-10 -right-10 w-[319px] h-[319px] -z-1">
                <div class="flex gap-8 items-center">
                    <div class="flex-3">
                        <h1 class="text-white text-4xl font-bold">The Story of Timun Mas</h1>
                        <p class="text-white text-sm mt-2">
                            In a quiet village in ancient Java, a lonely old widow longs for a child. One day, she
                            receives a
                            magical cucumber seed from a mysterious hermit. From this golden cucumber, a baby girl is
                            born—Timun
                            Mas.
                        </p>
                    </div>
                    <div class="flex-2">
                        <img src="/public/images/comic_1.png" alt="timun-mas" class="rounded-lg">
                    </div>
                </div>
                <p class="text-white/60 text-sm mt-4">a series from</p>
                <div class="flex gap-2 mt-2">
                    <img src="/public/images/avatar_1.png" alt="profile" class="w-6 h-6 rounded-full">
                    <p class="text-white text-sm">Nisrinath</p>
                </div>
            </div>
            <div class="flex-1 py-6 px-4 bg-white/5 rounded-lg flex flex-col">
                <div class="flex items-center gap-2">
                    <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                    <p class="text-white text-base font-bold">Ongoing</p>
                </div>
                <div class="flex items-center gap-2 justify-between py-4">
                    <p class="text-white text-sm">Scheduled Upload</p>
                    <div class="flex items-center gap-2">
                        <i class="pi pi-calendar"></i>
                        <p class="text-white/40 text-sm">2025-05-17 <span class="text-white">01:00 AM</span></p>
                    </div>
                </div>
                <div class="rounded-lg border border-black/40 p-4 bg-black/40 flex-1 flex flex-col justify-between">
                    <div class="flex items-center gap-2 justify-between">
                        <div class="bg-black rounded-full py-1 px-2 text-white text-sm border border-white">98K Views
                        </div>
                        <div
                            class="bg-yellow-500 rounded-full font-medium py-1 px-2 text-black text-sm border border-white">
                            1.2K
                            Likes</div>
                    </div>
                    <Button label="Like This" class="w-full mt-4" />
                </div>
            </div>
        </div>
        <div class="mt-[50px]">
            <div class="flex gap-4">
                <div class="flex-3">
                    <div class="flex items-center gap-8">
                        <h1 class="text-white text-2xl font-bold">Chapter Lists</h1>
                        <div class="bg-[#BB3FDA]/20 py-1 px-2 text-white rounded-full text-sm border border-slate-400">7
                            Chapter
                        </div>
                    </div>
                    <div class="mt-6 rounded-lg bg-gradient-to-r from-[#372754] to-[#2a1d40/50] p-4 border border-white/5"
                        v-for="i in 7" :key="i">
                        <div class="flex items-center gap-2 justify-between">
                            <div class="flex items-center gap-4">
                                <img src="/public/images/comic_1.png" alt="comic"
                                    class="w-[64px] h-[64px] object-cover rounded-lg">
                                <div>
                                    <div class="flex items-center gap-8">
                                        <div
                                            class="bg-[#BB3FDA] py-1 px-2 text-white rounded-full text-sm border border-white">
                                            Chapter {{ (7 - i) + 1 }}</div>
                                        <div class="flex items-center gap-2">
                                            <i class="pi pi-calendar"></i>
                                            <p class="text-white/40 text-sm">13 May</p>
                                        </div>
                                    </div>
                                    <h1 class="text-white text-lg font-bold mt-2">Pertarungan Ajaib</h1>
                                </div>
                            </div>
                            <div class="flex items-center gap-4">
                                <div class="px-4 py-1 bg-white/5 rounded-full font-medium">150 Votes</div>
                                <img src="/public/icons/checklist.svg" alt="checklist" class="w-6 h-6">
                            </div>
                        </div>
                    </div>
                </div>
                <div class="flex-2">
                    <h1 class="text-white text-2xl font-bold">NFTs Collection</h1>
                    <div
                        class="mt-6 rounded-lg bg-gradient-to-r from-[#372754] to-[#2a1d40/20] p-4 flex items-center gap-8 justify-between border border-white/5">
                        <p class="text-slate-400 text-sm">Total</p>
                        <div class="w-[50%] h-[2px] bg-slate-400/5 rounded-full"></div>
                        <div class="flex items-center gap-2">
                            <img src="/public/icons/nft.svg" alt="nft" class="w-6 h-6">
                            <p class="text-white text-sm">3 NFTs</p>
                        </div>
                    </div>
                    <div class="bg-[#1F1F1F] rounded-lg p-4 mt-8">
                        <div class="relative">
                            <img src="/public/images/nft_chromatic.png" class="w-full">
                            <div class="absolute bottom-4 right-4 text-white text-lg p-4 bg-black/80 rounded-lg">
                                The Heroic With Timun
                            </div>
                        </div>
                        <Button label="Mint Now" class="w-full mt-4" />
                    </div>
                </div>
            </div>

        </div>
    </div>
</template>

<script setup>
import Button from 'primevue/button';
</script>