<template>
    <div class="home-view">
        <div class="circle-bg"></div>
        <div v-if="isLoading" class="text-white p-8">Loading proposal...</div>
        <div v-else-if="error" class="text-red-400 p-8">{{ error }}</div>
        <template v-else>
        <div class="flex gap-8">
            <div class="flex-2">
                <div class="flex items-center gap-4 cursor-pointer" @click="router.push('/governance')">
                    <i class="pi pi-arrow-left"></i>
                    <p>Back</p>
                </div>
                <div class="mt-6">
                    <h1 class="text-white text-3xl font-bold">{{ proposal.question }}</h1>
                    <div class="flex items-center gap-4 mt-2">
                      <img :src="proposal._creatorUser?.avatar || '/public/images/avatar_1.png'" alt="" class="w-6 h-6 rounded-full">
                      <span class="text-white text-sm">{{ proposal._creatorUser?.name || shortenAddress(proposal.creator, 6) }}</span>
                      <span class="text-slate-400 text-xs">|</span>
                      <span class="text-slate-400 text-xs">{{ proposal._storyTitles && proposal._storyTitles.length > 0 ? proposal._storyTitles.map(s => s.title).join(', ') : 'Unknown Story' }}</span>
                    </div>
                    <p class="text-slate-400 text-sm mt-8">Description</p>
                    <p class="text-white text-base mt-2">{{ proposal.description }}</p>
                </div>
            </div>
            <div class="flex-1">
                <div class="rounded-lg w-full bg-white/10 p-6">
                    <p class="text-white text-sm">Result So Far</p>
                    <div class="flex flex-col gap-2 mt-8">
                      <div v-for="(result, idx) in voteResults" :key="result.choice" class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                          <span class="result-dot" :style="{ background: choiceColors[idx]?.border || '#a1a1aa' }"></span>
                          <span class="text-white text-sm">{{ result.choice }} <span class="text-slate-400">({{ result.votes }})</span></span>
                        </div>
                        <span class="result-percent" :style="{ color: choiceColors[idx]?.border || '#a1a1aa' }">{{ result.percent }}%</span>
                      </div>
                    </div>
                    <div class="w-full h-4 rounded-full mt-4 flex relative overflow-hidden result-bar-bg">
                      <template v-for="(result, idx) in voteResults" :key="result.choice">
                        <div
                          class="h-4 result-bar-segment"
                          :style="{
                            width: result.percent + '%',
                            background: choiceColors[idx]?.border || '#a1a1aa',
                            zIndex: voteResults.length - idx
                          }"
                        ></div>
                      </template>
                    </div>
                    <div class="py-6 px-4 rounded-lg mt-4" style="background-color: rgba(255, 255, 255, 0.1);">
                        <h1 class="text-base font-bold text-white">Own Your Vote</h1>
                        <div class="mt-4">
                            <div class="flex flex-col gap-4">
                                <div
                                    v-for="(result, idx) in voteResults"
                                    :key="result.choice"
                                    class="vote-choice-row"
                                    :style="{
                                        borderColor: choiceColors[idx]?.border || '#a1a1aa',
                                        background: choiceColors[idx]?.bg || 'rgba(255,255,255,0.04)'
                                    }"
                                    :class="{ 'disabled-choice': hasVoted }"
                                >
                                    <RadioButton v-model="vote" :inputId="result.choice" :name="result.choice" :value="result.choice" :disabled="hasVoted" />
                                    <p class="text-white ml-2">{{ result.choice }}</p>
                                </div>
                            </div>
                        </div>
                        <div class="mt-4 pt-4 border-t border-dashed border-white/20">
                            <Button 
                                class="w-full" 
                                :disabled="isVoting || !wallet.connected.value || !vote || hasVoted"
                                @click="handleVote"
                            >
                                <span v-if="isVoting" class="spinner-inline"></span>
                                {{ isVoting ? 'Voting...' : (hasVoted ? 'Already Voted' : 'Vote This') }}
                            </Button>
                            <div v-if="hasVoted" class="text-yellow-300 text-center mt-2">You have already voted on this proposal.</div>
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
                    v-for="voter in votersHistory" :key="voter.transaction">
                    <div class="flex-1">
                        <p>{{ shortenAddress(voter.voter, 10)}}</p>
                    </div>
                    <div class="flex-1">
                        <p>{{ voter.timestamp }}</p>
                    </div>
                    <div class="flex-1">
                        <p>{{ voter.votingPower }}</p>
                    </div>
                    <div class="flex-1 flex items-center gap-2">
                        <a :href="`https://solscan.io/account/${voter.transaction}?cluster=devnet`" target="_blank" class="text-blue-400 underline">
                          <i class="pi pi-external-link"></i>
                        </a>
                    </div>
                </div>
            </div>
            <div class="flex-1">
                <div class="w-full bg-white/10 rounded-lg py-6 px-4">
                    <div class="flex items-center justify-between pb-4 border-b border-white/20 border-dashed">
                        <p class="text-slate-400">A story from</p>
                        <div class="flex items-center gap-4">
                            <img :src="proposal._creatorUser?.avatar || '/public/images/avatar_1.png'" alt="" class="w-6 h-6 rounded-full">
                            <p>{{ proposal._creatorUser?.name || shortenAddress(proposal.creator, 6) }}</p>
                        </div>
                    </div>
                    <div v-if="proposal._storyTitles && proposal._storyTitles.length > 0">
                      <div v-for="story in proposal._storyTitles" :key="story.pubkey" class="flex items-center gap-2 mt-2">
                        <p class="text-lg">{{ story.title }}</p>
                        <Button size="small" class="ml-2" @click="router.push(`/tales/${story.pubkey}`)">Read Full Stories</Button>
                      </div>
                    </div>
                    <div v-else>
                      <p class="text-lg mt-4">Unknown Story</p>
                    </div>
                </div>
            </div>
        </div>
        </template>
    </div>
</template>

<script setup>
import RadioButton from 'primevue/radiobutton';
import Button from 'primevue/button';
import { useRouter, useRoute } from 'vue-router';
import { ref, onMounted, computed } from 'vue';
import { Connection, PublicKey, SystemProgram } from '@solana/web3.js';
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import idl from '../anchor/tale_governance.json';
import taleStoryIdl from '../anchor/tale_story.json';
import { useWallet } from 'solana-wallets-vue';
import { utils } from '@coral-xyz/anchor';
import { Metaplex } from '@metaplex-foundation/js';
import { clusterApiUrl } from '@solana/web3.js';

const AUTH_API_BASE_URL = import.meta.env.VITE_APP_AUTH_API_URL || 'http://localhost:3000/api';
const RPC_ENDPOINT = import.meta.env.VITE_RPC_ENDPOINT || 'https://api.devnet.solana.com';
const TALE_GOVERNANCE_PROGRAM_ID = new PublicKey(idl.address);
const TALE_STORY_PROGRAM_ID = new PublicKey(taleStoryIdl.address);
const connection = new Connection(RPC_ENDPOINT, 'confirmed');

const router = useRouter();
const route = useRoute();
const proposalId = route.params.id;

const wallet = useWallet();
const proposal = ref(null);
const isLoading = ref(true);
const error = ref(null);
const userCache = ref({});
const storyCache = ref({});
const vote = ref(null);
const isVoting = ref(false);
const uiMessage = ref({ text: '', type: 'info' });

const SOLANA_CLUSTER = import.meta.env.VITE_SOLANA_CLUSTER || 'devnet';
const metaplexConnection = new Connection(
  SOLANA_CLUSTER === 'mainnet-beta' ? clusterApiUrl('mainnet-beta') : clusterApiUrl('devnet'),
  'confirmed'
);
const metaplex = Metaplex.make(metaplexConnection);

// Voting choice colors (up to 5)
const choiceColors = [
  { border: '#22c55e', bg: 'rgba(34,197,94,0.08)' },   // Green
  { border: '#3b82f6', bg: 'rgba(59,130,246,0.08)' },  // Blue
  { border: '#eab308', bg: 'rgba(234,179,8,0.08)' },   // Yellow
  { border: '#f97316', bg: 'rgba(249,115,22,0.08)' },  // Orange
  { border: '#ef4444', bg: 'rgba(239,68,68,0.08)' },   // Red
];

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

async function fetchProposalDetail() {
  isLoading.value = true;
  error.value = null;
  try {
    const provider = new AnchorProvider(connection, {}, AnchorProvider.defaultOptions());
    const program = new Program(idl, provider);
    const proposalAccount = await program.account.vote.fetch(proposalId);
    // Fetch creator
    let creatorAddress = proposalAccount.creator?.toBase58?.() || proposalAccount.creator;
    const creatorUser = await fetchUserByAddress(creatorAddress);
    // Fetch all story titles
    let storyTitles = [];
    if (Array.isArray(proposalAccount.stories)) {
      storyTitles = await Promise.all(
        proposalAccount.stories.map(async (storyPubkey) => {
          const key = storyPubkey?.toBase58?.() || storyPubkey;
          const story = await fetchStoryByPubkey(key);
          return { title: story?.title || shortenAddress(key, 6), pubkey: key };
        })
      );
    }
    proposal.value = { ...proposalAccount, _creatorUser: creatorUser, _storyTitles: storyTitles };
  } catch (e) {
    error.value = e.message || 'Failed to load proposal.';
  } finally {
    isLoading.value = false;
  }
}

onMounted(fetchProposalDetail);

const totalVotes = computed(() => {
  if (!proposal.value || !proposal.value.totalVotes) return 0;
  return proposal.value.totalVotes.reduce((a, b) => Number(a) + Number(b), 0);
});

const voteResults = computed(() => {
  if (!proposal.value || !proposal.value.choices) return [];
  return proposal.value.choices.map((choice, idx) => {
    const votes = Number(proposal.value.totalVotes?.[idx] || 0);
    const percent = totalVotes.value > 0 ? ((votes / totalVotes.value) * 100).toFixed(2) : '0.00';
    return { choice, votes, percent };
  });
});

const votersHistory = computed(() => {
  if (!proposal.value || !proposal.value.history) return [];
  return proposal.value.history.map(h => ({
    voter: h.voter?.toBase58?.() || h.voter,
    timestamp: formatDateTime(h.timestamp),
    votingPower: h.votingPower,
    transaction: h.transaction,
  }));
});

const hasVoted = computed(() => {
  if (!proposal.value || !proposal.value.history || !wallet.publicKey.value) return false;
  return proposal.value.history.some(h => {
    const voterKey = h.voter?.toBase58?.() || h.voter;
    return voterKey === wallet.publicKey.value.toBase58();
  });
});

async function checkNftOwnershipByCandyMachineMetaplex(owner, candyMachineIds) {
  try {
    const nfts = await metaplex.nfts().findAllByOwner({ owner: new PublicKey(owner) });
    for (const nft of nfts) {
      if (!nft.creators || nft.creators.length === 0) continue;
      // The first creator is usually the Candy Machine
      const firstCreator = nft.creators[0].address.toBase58();
      if (candyMachineIds.includes(firstCreator)) {
        return true;
      }
    }
    return false;
  } catch (e) {
    console.error('Metaplex NFT check error:', e);
    return false;
  }
}

const handleVote = async () => {
  if (!wallet.connected.value || !wallet.publicKey.value) {
    showUiMessage("Please connect your wallet to vote.", "error");
    return;
  }

  if (!vote.value) {
    showUiMessage("Please select a choice to vote for.", "error");
    return;
  }

  isVoting.value = true;
  showUiMessage("Casting vote...", "loading", null, 0);

  try {
    const provider = new AnchorProvider(connection, wallet.wallet.value.adapter, AnchorProvider.defaultOptions());
    const program = new Program(idl, provider);
    const proposalAccount = await program.account.vote.fetch(proposalId);

    const [voteRecordPda, _recordBump] = await PublicKey.findProgramAddressSync(
      [Buffer.from(utils.bytes.utf8.encode("vote_record")), new PublicKey(proposalId).toBuffer(), wallet.publicKey.value.toBuffer()],
      program.programId
    );

    // Check NFT ownership by Candy Machine using Metaplex
    let isNftHolder = false;
    if (proposalAccount.nfts && proposalAccount.nfts.length > 0) {
      isNftHolder = await checkNftOwnershipByCandyMachineMetaplex(wallet.publicKey.value.toBase58(), proposalAccount.nfts);
    }

    const choiceIndex = proposalAccount.choices.findIndex(c => c === vote.value);
    if (choiceIndex === -1) {
      showUiMessage("Invalid choice selected.", "error");
      isVoting.value = false;
      return;
    }

    const txSignature = await program.methods
      .castVote(choiceIndex, isNftHolder)
      .accounts({
        voter: wallet.publicKey.value,
        vote: new PublicKey(proposalId),
        voteRecord: voteRecordPda,
        nftTokenAccount: SystemProgram.programId, // Not used for this logic
        tokenProgram: utils.token.TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    showUiMessage("Vote cast successfully!", "success", txSignature);
    await fetchProposalDetail(); // Refresh proposal data
  } catch (error) {
    console.error("Error casting vote:", error);
    const errorMsg = error.message || "Failed to cast vote.";
    showUiMessage(errorMsg, "error", error.signature);
  } finally {
    isVoting.value = false;
    if (uiMessage.value.type === 'loading') showUiMessage("", "info");
  }
};

function showUiMessage(msg, type = 'info', txSignature = null, duration = 4000) {
  uiMessage.value = { text: msg, type, txSignature };
  if (duration > 0) setTimeout(() => { uiMessage.value = { text: '', type: 'info' }; }, duration);
}
</script>

<style scoped>
.spinner-inline {
  display: inline-block;
  width: 1rem;
  height: 1rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #fff;
  animation: spin 1s ease-in-out infinite;
  margin-right: 0.5rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.vote-choice-row {
  display: flex;
  align-items: center;
  border: 2px solid #a1a1aa;
  border-radius: 12px;
  padding: 1rem;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
  background: rgba(255,255,255,0.04);
}
.vote-choice-row:not(.disabled-choice):hover {
  filter: brightness(1.08);
  border-width: 2.5px;
}
.vote-choice-row.disabled-choice {
  opacity: 0.7;
  cursor: not-allowed;
}
.result-dot {
  display: inline-block;
  width: 0.9em;
  height: 0.9em;
  border-radius: 50%;
  margin-right: 0.3em;
}
.result-percent {
  font-weight: bold;
  min-width: 3.5em;
  text-align: right;
}
.result-bar-bg {
  background: #23232b;
}
.result-bar-segment {
  border-radius: 0;
  transition: width 0.4s;
}
.result-bar-segment:first-child {
  border-top-left-radius: 9999px;
  border-bottom-left-radius: 9999px;
}
.result-bar-segment:last-child {
  border-top-right-radius: 9999px;
  border-bottom-right-radius: 9999px;
}
</style>