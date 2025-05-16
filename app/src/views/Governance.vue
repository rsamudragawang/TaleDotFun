<template>
    <div class="home-view">
        <div class="circle-bg"></div>
        <div class="flex gap-4 items-center mt-[80px]">
            <div class="flex-2">
                <div class="flex flex-col gap-4">
                    <h1 class="text-white text-[64px] font-bold">Where Stories Evolve<br> Through Your Voice</h1>
                    <p class="text-slate-400 text-[20px]">Empower your readers. Launch community votes to decide<br>
                        your
                        story's next direction, format, or evolution </p>
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
                <div v-if="isLoading" class="text-white">Loading proposals...</div>
                <div v-else-if="proposals.filter(p => getStatusKey(p.account.status) !== 'completed').length === 0" class="text-slate-400">No active proposals found.</div>
                <div v-else>
                  <div class="p-6 relative border z-10 rounded-lg" v-for="proposal in proposals.filter(p => getStatusKey(p.account.status) !== 'completed')" :key="proposal.publicKey.toBase58()">
                      <img src="/public/icons/circular.svg" alt="" class="absolute z-0 left-0 top-0 w-40 rounded-lg">
                      <div class="flex items-center divide-x divide-white gap-8">
                          <p class="text-slate-400 text-base pr-8 font-bold">{{ '#' + shortenAddress(proposal.account.votingId || proposal.publicKey.toBase58(), 6) }}</p>
                          <div class="flex items-center gap-2">
                              <img :src="proposal._creatorUser?.avatar || '/public/images/avatar_1.png'" alt="" class="w-8 h-8 rounded-full">
                              <p class="text-white text-sm">
                                {{ proposal._creatorUser?.name || shortenAddress(proposal.account.creator?.toBase58?.() || proposal.account.creator, 6) }}
                                for
                                <span v-if="proposal._storyTitles && proposal._storyTitles.length > 0">
                                  <span v-if="proposal._storyTitles.length === 1">
                                    <b>{{ proposal._storyTitles[0] }}</b>
                                  </span>
                                  <span v-else>
                                    <b>{{ proposal._storyTitles[0] }}</b>
                                    <span
                                      class="ml-2 cursor-pointer text-blue-400 underline"
                                      :title="proposal._storyTitles.join(', ')"
                                    >+{{ proposal._storyTitles.length - 1 }} more</span>
                                  </span>
                                </span>
                                <span v-else><b>Unknown Story</b></span>
                              </p>
                          </div>
                      </div>
                      <h1 class="text-white text-2xl font-bold mt-4">{{ proposal.account.question }}</h1>
                      <div class="flex items-center justify-between mt-4">
                          <p class="text-slate-400 text-sm">Voting Ends : {{ formatDateTime(proposal.account.endTime) }}</p>
                          <Button severity="secondary" class="w-[100px]" @click="router.push(`/governance/${proposal.publicKey.toBase58()}`)">Vote</Button>
                      </div>
                  </div>
                </div>
            </div>
        </div>
        <div class="mt-[100px]">
            <h1 class="text-white text-2xl font-bold">Closed Proposal</h1>
            <div class="mt-[50px]">
                <div v-if="isLoading" class="text-white">Loading proposals...</div>
                <div v-else-if="proposals.filter(p => getStatusKey(p.account.status) === 'completed').length === 0" class="text-slate-400">No closed proposals found.</div>
                <div v-else>
                  <div class="p-6 relative border-b z-10 pb-[48px] mt-[48px] flex justify-between items-center" v-for="proposal in proposals.filter(p => getStatusKey(p.account.status) === 'completed')" :key="proposal.publicKey.toBase58()">
                      <div>
                          <div class="flex items-center divide-x divide-white gap-8">
                              <p class="text-slate-400 text-base pr-8 font-bold">{{ '#' + shortenAddress(proposal.account.votingId || proposal.publicKey.toBase58(), 6) }}</p>
                              <div class="flex items-center gap-2">
                                  <img :src="proposal._creatorUser?.avatar || '/public/images/avatar_1.png'" alt="" class="w-8 h-8 rounded-full">
                                  <p class="text-white text-sm">
                                    {{ proposal._creatorUser?.name || shortenAddress(proposal.account.creator?.toBase58?.() || proposal.account.creator, 6) }}
                                    for
                                    <span v-if="proposal._storyTitles && proposal._storyTitles.length > 0">
                                      <span v-if="proposal._storyTitles.length === 1">
                                        <b>{{ proposal._storyTitles[0] }}</b>
                                      </span>
                                      <span v-else>
                                        <b>{{ proposal._storyTitles[0] }}</b>
                                        <span
                                          class="ml-2 cursor-pointer text-blue-400 underline"
                                          :title="proposal._storyTitles.join(', ')"
                                        >+{{ proposal._storyTitles.length - 1 }} more</span>
                                      </span>
                                    </span>
                                    <span v-else><b>Unknown Story</b></span>
                                  </p>
                              </div>
                          </div>
                          <h1 class="text-white text-2xl font-bold mt-4">{{ proposal.account.question }}</h1>
                          <div class="flex items-center justify-between mt-4">
                              <p class="text-slate-400 text-sm">Executed on : <span class="text-white">{{ formatDateTime(proposal.account.endTime) }}</span></p>
                          </div>
                      </div>
                      <div class="py-2 px-8 bg-[#191523] rounded-lg text-green-500">Executed</div>
                  </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import Button from 'primevue/button';
import { useRouter } from 'vue-router';
import { ref, onMounted } from 'vue';
import { Connection, PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import idl from '../anchor/tale_governance.json';
import taleStoryIdl from '../anchor/tale_story.json';

const AUTH_API_BASE_URL = import.meta.env.VITE_APP_AUTH_API_URL || 'http://localhost:3000/api';
const router = useRouter();

// Solana/Anchor setup
const RPC_ENDPOINT = import.meta.env.VITE_RPC_ENDPOINT || 'https://api.devnet.solana.com';
const TALE_GOVERNANCE_PROGRAM_ID = new PublicKey(idl.address);
const TALE_STORY_PROGRAM_ID = new PublicKey(taleStoryIdl.address);
const connection = new Connection(RPC_ENDPOINT, 'confirmed');

const proposals = ref([]);
const isLoading = ref(false);
const userCache = ref({}); // { [address]: { name, avatar } }
const storyCache = ref({}); // { [pubkey]: { title } }

function formatDateTime(unixTimestamp) {
  if (!unixTimestamp) return 'N/A';
  const ts = typeof unixTimestamp === 'object' && typeof unixTimestamp.toNumber === 'function'
    ? unixTimestamp.toNumber() : Number(unixTimestamp);
  if (!ts || isNaN(ts)) return 'N/A';
  const date = new Date(ts * 1000);
  return date.toLocaleString();
}

function shortenAddress(address, chars = 4) {
  if (!address) return '';
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

function getStatusKey(statusEnum) {
  if (!statusEnum || typeof statusEnum !== 'object') return 'unknown';
  return Object.keys(statusEnum)[0].toLowerCase();
}

async function fetchUserByAddress(address) {
  if (!address) return null;
  if (userCache.value[address]) return userCache.value[address];
  try {
    const res = await fetch(`${AUTH_API_BASE_URL}/users/address/${address}`);
    if (!res.ok) throw new Error('Not found');
    const { data } = await res.json();
    userCache.value[address] = { name: data.name, avatar: data.avatar };
    return userCache.value[address];
  } catch {
    userCache.value[address] = { name: shortenAddress(address, 6), avatar: '/public/images/avatar_1.png' };
    return userCache.value[address];
  }
}

async function fetchStoryByPubkey(pubkey) {
  if (!pubkey) return null;
  if (storyCache.value[pubkey]) return storyCache.value[pubkey];
  try {
    const provider = new AnchorProvider(connection, {}, AnchorProvider.defaultOptions());
    const program = new Program(taleStoryIdl, provider);
    const tale = await program.account.tale.fetch(pubkey);
    storyCache.value[pubkey] = { title: tale.title };
    return storyCache.value[pubkey];
  } catch {
    storyCache.value[pubkey] = { title: shortenAddress(pubkey, 6) };
    return storyCache.value[pubkey];
  }
}

async function enrichProposalsWithUserAndStories(proposalsRaw) {
  // For each proposal, fetch creator user data and all story titles
  const enriched = await Promise.all(proposalsRaw.map(async (p) => {
    let creatorAddress = p.account.creator?.toBase58?.() || p.account.creator;
    const user = await fetchUserByAddress(creatorAddress);
    // Fetch all story titles
    let storyTitles = [];
    if (Array.isArray(p.account.stories)) {
      storyTitles = await Promise.all(
        p.account.stories.map(async (storyPubkey) => {
          const key = storyPubkey?.toBase58?.() || storyPubkey;
          const story = await fetchStoryByPubkey(key);
          return story?.title || shortenAddress(key, 6);
        })
      );
    }
    return { ...p, _creatorUser: user, _storyTitles: storyTitles };
  }));
  return enriched;
}

async function fetchProposals() {
  isLoading.value = true;
  try {
    const provider = new AnchorProvider(connection, {}, AnchorProvider.defaultOptions());
    const program = new Program(idl, provider);
    const all = await program.account.vote.all();
    proposals.value = await enrichProposalsWithUserAndStories(all.sort((a, b) => Number(b.account.createdAt) - Number(a.account.createdAt)));
  } catch (e) {
    proposals.value = [];
  } finally {
    isLoading.value = false;
  }
}

onMounted(fetchProposals);
</script>