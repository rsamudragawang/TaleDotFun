<template>
  <div class="min-h-screen bg-gray-900 text-white font-sans p-4 sm:p-8">
    <header class="mb-8 text-center">
      <h1 class="text-4xl sm:text-5xl font-bold text-purple-400">Tale Governance</h1>
      <p class="text-gray-400 mt-2">Decentralized Voting on Solana</p>
    </header>

    <div class="mb-8 p-6 bg-gray-800 rounded-xl shadow-2xl flex flex-col sm:flex-row justify-between items-center">
      <div v.if="!wallet.connected" class="text-lg text-yellow-400 mb-4 sm:mb-0">
        Please connect your Solana wallet.
      </div>
      <div v.else class="text-lg text-green-400 mb-4 sm:mb-0">
        Connected: <span class="font-mono text-sm">{{ wallet.publicKey?.toBase58() }}</span>
      </div>
      <button
        @click="toggleWallet"
        :class="wallet.connected ? 'bg-red-500 hover:bg-red-600' : 'bg-purple-500 hover:bg-purple-600'"
        class="text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-all duration-300 ease-in-out transform hover:scale-105"
      >
        {{ wallet.connected ? 'Disconnect Wallet' : 'Connect Wallet (Mock)' }}
      </button>
    </div>

    <div v-if="wallet.connected" class="space-y-8">
      <div class="flex justify-center space-x-2 sm:space-x-4 mb-8">
        <button
          @click="currentView = 'create'"
          :class="currentView === 'create' ? 'bg-purple-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'"
          class="py-3 px-6 rounded-lg font-medium transition-colors duration-200"
        >
          Create Vote
        </button>
        <button
          @click="currentView = 'list'"
          :class="currentView === 'list' ? 'bg-purple-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'"
          class="py-3 px-6 rounded-lg font-medium transition-colors duration-200"
        >
          View Votes
        </button>
      </div>

      <div v-if="currentView === 'create'" class="p-6 sm:p-8 bg-gray-800 rounded-xl shadow-2xl">
        <h2 class="text-3xl font-semibold mb-6 text-purple-300">Create New Vote</h2>
        <form @submit.prevent="handleCreateVote" class="space-y-6">
          <div>
            <label for="votingId" class="block text-sm font-medium text-gray-300 mb-1">Voting ID (Unique)</label>
            <input type="text" v-model="newVote.votingId" id="votingId" required maxlength="64" class="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-purple-500 focus:border-purple-500 placeholder-gray-500">
          </div>
          <div>
            <label for="question" class="block text-sm font-medium text-gray-300 mb-1">Question</label>
            <input type="text" v-model="newVote.question" id="question" required maxlength="100" class="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-purple-500 focus:border-purple-500 placeholder-gray-500">
          </div>
          <div>
            <label for="description" class="block text-sm font-medium text-gray-300 mb-1">Description</label>
            <textarea v-model="newVote.description" id="description" rows="3" maxlength="500" class="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-purple-500 focus:border-purple-500 placeholder-gray-500"></textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Choices (min 2, max 10)</label>
            <div v-for="(choice, index) in newVote.choices" :key="index" class="flex items-center space-x-2 mb-2">
              <input type="text" v-model="newVote.choices[index]" :placeholder="`Choice ${index + 1}`" maxlength="50" class="flex-grow p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-purple-500 focus:border-purple-500 placeholder-gray-500">
              <button type="button" @click="removeChoice(index)" v-if="newVote.choices.length > 2" class="p-2 bg-red-500 hover:bg-red-600 rounded-md text-white text-xs sm:text-sm">Remove</button>
            </div>
            <button type="button" @click="addChoice" v-if="newVote.choices.length < 10" class="mt-1 p-2 bg-green-500 hover:bg-green-600 rounded-md text-white text-xs sm:text-sm">Add Choice</button>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label for="startTime" class="block text-sm font-medium text-gray-300 mb-1">Start Time (UTC)</label>
              <input type="datetime-local" v-model="newVote.startTime" id="startTime" required class="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-purple-500 focus:border-purple-500">
            </div>
            <div>
              <label for="endTime" class="block text-sm font-medium text-gray-300 mb-1">End Time (UTC)</label>
              <input type="datetime-local" v-model="newVote.endTime" id="endTime" required class="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-purple-500 focus:border-purple-500">
            </div>
          </div>
           <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label for="regularVotePower" class="block text-sm font-medium text-gray-300 mb-1">Regular Vote Power</label>
              <input type="number" v-model.number="newVote.regularVotePower" id="regularVotePower" min="1" required class="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-purple-500 focus:border-purple-500 placeholder-gray-500">
            </div>
            <div>
              <label for="nftVotePower" class="block text-sm font-medium text-gray-300 mb-1">NFT Vote Power</label>
              <input type="number" v-model.number="newVote.nftVotePower" id="nftVotePower" min="1" required class="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-purple-500 focus:border-purple-500 placeholder-gray-500">
            </div>
          </div>
          <div>
            <label for="nftMint" class="block text-sm font-medium text-gray-300 mb-1">NFT Mint Address (Optional)</label>
            <input type="text" v-model="newVote.nftMint" id="nftMint" placeholder="Enter NFT mint public key if applicable" class="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-purple-500 focus:border-purple-500 placeholder-gray-500">
          </div>
          <div>
            <label for="category" class="block text-sm font-medium text-gray-300 mb-1">Category</label>
            <select v-model="newVote.category" id="category" required class="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-purple-500 focus:border-purple-500">
              <option v-for="(label, value) in VoteCategory" :key="value" :value="value">{{ label }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Tags (max 5, comma-separated)</label>
            <input type="text" v-model="newVote.tagsInput" id="tags" placeholder="e.g., community, funding, urgent" class="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-purple-500 focus:border-purple-500 placeholder-gray-500">
            <p class="text-xs text-gray-400 mt-1">Tags will be split by comma. Max 20 chars per tag.</p>
          </div>

          <button type="submit" :disabled="isLoading" class="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50">
            {{ isLoading ? 'Creating...' : 'Create Vote' }}
          </button>
          <p v-if="error" class="text-red-400 mt-2 text-sm">{{ error }}</p>
          <p v-if="successMessage" class="text-green-400 mt-2 text-sm">{{ successMessage }}</p>
        </form>
      </div>

      <div v-if="currentView === 'list'" class="p-6 sm:p-8 bg-gray-800 rounded-xl shadow-2xl">
        <h2 class="text-3xl font-semibold mb-6 text-purple-300">Available Votes</h2>
        <div v-if="isLoadingVotes" class="text-center text-gray-400">Loading votes...</div>
        <div v-else-if="votes.length === 0" class="text-center text-gray-400">No votes found.</div>
        <div v-else class="space-y-6">
          <div v-for="vote in votes" :key="vote.publicKey.toBase58()" class="p-6 bg-gray-700 rounded-lg shadow-lg hover:shadow-purple-500/30 transition-shadow duration-300">
            <h3 class="text-xl font-semibold text-purple-300 mb-2">{{ vote.account.question }} (ID: {{ vote.account.votingId }})</h3>
            <p class="text-sm text-gray-400 mb-1">Status: <span :class="getStatusClass(vote.account.status)">{{ getStatusLabel(vote.account.status) }}</span></p>
            <p class="text-sm text-gray-400 mb-1">Category: {{ VoteCategory[vote.account.category] }}</p>
            <p class="text-sm text-gray-400 mb-3">Ends: {{ new Date(vote.account.endTime * 1000).toLocaleString() }}</p>
            <div class="flex flex-wrap gap-2 mb-3">
                <span v-for="tag in vote.account.tags" :key="tag" class="px-2 py-1 bg-gray-600 text-xs text-gray-300 rounded-full">{{ tag }}</span>
            </div>

            <div v-if="selectedVote && selectedVote.publicKey.equals(vote.publicKey)">
              <p class="text-gray-300 my-2 whitespace-pre-wrap">Description: {{ vote.account.description }}</p>
              <div class="my-4">
                <h4 class="text-md font-semibold text-gray-200 mb-2">Choices:</h4>
                <ul>
                  <li v-for="(choice, index) in vote.account.choices" :key="index" 
                      class="flex justify-between items-center p-3 mb-2 rounded-md"
                      :class="selectedChoice === index ? 'bg-purple-600' : 'bg-gray-600 hover:bg-gray-500'">
                    <span>{{ choice }}</span>
                    <button 
                        @click="selectChoice(index)"
                        v-if="canVote(vote.account)"
                        :disabled="isLoading"
                        class="ml-4 py-1 px-3 text-xs rounded-md transition-colors"
                        :class="selectedChoice === index ? 'bg-purple-200 text-purple-800' : 'bg-purple-500 hover:bg-purple-400 text-white'"
                        >
                        Select
                    </button>
                    <span v-if="vote.account.status === VoteStatus.Completed && vote.account.winningChoice === index" class="text-xs text-green-400 ml-2">(WINNER)</span>
                  </li>
                </ul>
              </div>
              <div v-if="vote.account.totalVotes && vote.account.status === VoteStatus.Completed" class="my-4 text-sm">
                <h4 class="text-md font-semibold text-gray-200 mb-2">Results:</h4>
                <ul>
                    <li v-for="(choiceVotes, index) in vote.account.totalVotes" :key="index" class="text-gray-300">
                        {{ vote.account.choices[index] }}: {{ choiceVotes.toString() }} votes
                    </li>
                </ul>
                <p class="mt-1 text-gray-400">Total Participants: {{ vote.account.totalParticipants?.toString() }}</p>
                <p class="text-gray-400">Total Vote Power Cast: {{ vote.account.totalVotePower?.toString() }}</p>
              </div>

              <div class="mt-4 space-x-3">
                <button 
                    v-if="canVote(vote.account)"
                    @click="handleCastVote(vote)" 
                    :disabled="isLoading || selectedChoice === null"
                    class="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50">
                  {{ isLoading ? 'Casting...' : 'Cast Vote' }}
                </button>
                <button 
                    v-if="canFinalize(vote.account)"
                    @click="handleFinalizeVote(vote)" 
                    :disabled="isLoading"
                    class="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50">
                  {{ isLoading ? 'Finalizing...' : 'Finalize Vote' }}
                </button>
                 <button @click="selectedVote = null; selectedChoice = null;" class="bg-gray-500 hover:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                    Close Details
                </button>
              </div>
              <p v-if="error" class="text-red-400 mt-2 text-sm">{{ error }}</p>
              <p v-if="successMessage" class="text-green-400 mt-2 text-sm">{{ successMessage }}</p>
            </div>
            <button v-else @click="selectVoteForDetails(vote)" class="mt-3 bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors w-full sm:w-auto">
                View Details & Vote
            </button>
          </div>
        </div>
      </div>

    </div>
    <div v-else class="text-center text-xl text-gray-500 mt-10">
      Connect your wallet to use the governance platform.
    </div>

    <div v-if="globalMessage" class="fixed bottom-4 right-4 p-4 rounded-lg shadow-lg text-white" :class="isGlobalError ? 'bg-red-600' : 'bg-green-600'">
        {{ globalMessage }}
    </div>

  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue';
// Mock PublicKey and SystemProgram for UI rendering. Replace with actual @solana/web3.js
class MockPublicKey {
  constructor(bs58) {
    this._bs58 = bs58 || `MockPk${Math.random().toString(36).substring(2, 15)}`;
  }
  toBase58() { return this._bs58; }
  toString() { return this._bs58; }
  equals(other) { return other && this._bs58 === other._bs58; }
  static get default() { return new MockPublicKey("11111111111111111111111111111111"); } // Placeholder
}
const SystemProgram = {
  programId: new MockPublicKey("11111111111111111111111111111111") // Placeholder
};
const TokenProgram = {
    programId: new MockPublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA") // Placeholder
}

// --- Constants (mirroring Rust enums) ---
const VoteStatus = {
  Upcoming: 0,
  Active: 1,
  Completed: 2,
};
const VoteCategory = {
  Content: 0,
  Feature: 1,
  Community: 2,
  Technical: 3,
  Other: 4,
};
// For display purposes
const VoteStatusLabels = {
  [VoteStatus.Upcoming]: "Upcoming",
  [VoteStatus.Active]: "Active",
  [VoteStatus.Completed]: "Completed",
};
const VoteCategoryLabels = { // Used in select dropdown directly now
  [VoteCategory.Content]: "Content",
  [VoteCategory.Feature]: "Feature",
  [VoteCategory.Community]: "Community",
  [VoteCategory.Technical]: "Technical",
  [VoteCategory.Other]: "Other",
};


// --- Solana Program & Connection (Mocks/Placeholders) ---
// TODO: Replace with your actual Anchor provider and program setup
const PROGRAM_ID = new MockPublicKey("6nuBQTgPEzfs8hnP31k7xoKft796PZvTBsbna3555wxf");
const provider = ref(null); // Should be an Anchor Provider instance
const program = ref(null);  // Should be an Anchor Program instance

// --- Reactive State ---
const wallet = reactive({
  connected: false,
  publicKey: null, // Should be a PublicKey instance
  // Mock wallet connection
  _balance: 100, // Mock SOL balance
});

const currentView = ref('list'); // 'create', 'list'
const isLoading = ref(false);
const isLoadingVotes = ref(false);
const error = ref('');
const successMessage = ref('');
const globalMessage = ref('');
const isGlobalError = ref(false);

const newVote = reactive({
  votingId: '',
  question: '',
  description: '',
  choices: ['', ''], // Min 2 choices
  startTime: '',
  endTime: '',
  nftMint: '', // Optional
  regularVotePower: 1,
  nftVotePower: 1,
  category: VoteCategory.Content,
  tagsInput: '', // Comma-separated string
});

const votes = ref([]); // Array of vote objects { publicKey: PublicKey, account: VoteAccountData }
const selectedVote = ref(null); // For displaying details
const selectedChoice = ref(null); // Index of the choice selected by the user

// --- Wallet Functions (Mocked) ---
const toggleWallet = () => {
  if (wallet.connected) {
    wallet.connected = false;
    wallet.publicKey = null;
    provider.value = null;
    program.value = null;
    setGlobalMessage("Wallet disconnected.", false);
  } else {
    // In a real app, this would trigger the wallet adapter
    wallet.connected = true;
    wallet.publicKey = new MockPublicKey(); // Mock a public key
    // TODO: Initialize actual Anchor provider and program here
    // provider.value = new anchor.AnchorProvider(connection, mockWallet, anchor.AnchorProvider.defaultOptions());
    // program.value = new anchor.Program(idl, PROGRAM_ID, provider.value);
    setGlobalMessage("Mock wallet connected successfully!", false);
    fetchVotes(); // Fetch votes on connect
  }
};

// --- Form Helper Functions ---
const addChoice = () => {
  if (newVote.choices.length < 10) {
    newVote.choices.push('');
  }
};
const removeChoice = (index) => {
  if (newVote.choices.length > 2) {
    newVote.choices.splice(index, 1);
  }
};

const resetForm = () => {
    newVote.votingId = `vote_${Date.now().toString().slice(-4)}`;
    newVote.question = '';
    newVote.description = '';
    newVote.choices = ['', ''];
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    const dayAfterTomorrow = new Date(now);
    dayAfterTomorrow.setDate(now.getDate() + 2);

    newVote.startTime = now.toISOString().slice(0, 16);
    newVote.endTime = tomorrow.toISOString().slice(0, 16);
    newVote.nftMint = '';
    newVote.regularVotePower = 1;
    newVote.nftVotePower = 1;
    newVote.category = VoteCategory.Content;
    newVote.tagsInput = '';
    error.value = '';
    successMessage.value = '';
};

// --- UI Helper Functions ---
const getStatusLabel = (statusValue) => VoteStatusLabels[statusValue] || "Unknown";
const getStatusClass = (statusValue) => {
  if (statusValue === VoteStatus.Active) return 'text-yellow-400 font-semibold';
  if (statusValue === VoteStatus.Completed) return 'text-green-400 font-semibold';
  if (statusValue === VoteStatus.Upcoming) return 'text-blue-400 font-semibold';
  return 'text-gray-400';
};

const setGlobalMessage = (message, isErr = false, duration = 3000) => {
    globalMessage.value = message;
    isGlobalError.value = isErr;
    setTimeout(() => {
        globalMessage.value = '';
    }, duration);
};


// --- Solana Interaction Functions (Mocks) ---

const handleCreateVote = async () => {
  isLoading.value = true;
  error.value = '';
  successMessage.value = '';

  if (newVote.choices.length < 2) {
    error.value = "At least two choices are required.";
    isLoading.value = false;
    return;
  }
  if (new Date(newVote.startTime) >= new Date(newVote.endTime)) {
    error.value = "Start time must be before end time.";
    isLoading.value = false;
    return;
  }
  const tags = newVote.tagsInput.split(',').map(t => t.trim()).filter(t => t.length > 0 && t.length <= 20);
  if (tags.length > 5) {
    error.value = "Maximum of 5 tags allowed.";
    isLoading.value = false;
    return;
  }

  try {
    // TODO: Replace with actual Anchor program call
    console.log("Attempting to create vote with params:", {
      votingId: newVote.votingId,
      question: newVote.question,
      description: newVote.description,
      choices: newVote.choices.filter(c => c.trim() !== ''),
      startTime: new Date(newVote.startTime).getTime() / 1000, // Convert to Unix timestamp (seconds)
      endTime: new Date(newVote.endTime).getTime() / 1000,   // Convert to Unix timestamp (seconds)
      nftMint: newVote.nftMint ? new MockPublicKey(newVote.nftMint) : null,
      // For u64, Anchor typically uses BN.js. Example: new anchor.BN(newVote.regularVotePower)
      regularVotePower: newVote.regularVotePower, // Mocking as number, use BN in real app
      nftVotePower: newVote.nftVotePower,       // Mocking as number, use BN in real app
      category: newVote.category, // This should be the enum value e.g. { content: {} } or just the number if that's how IDL defines it
      tags: tags,
    });

    // --- MOCK INTERACTION ---
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay
    const mockVoteAccountPk = new MockPublicKey();
    const createdVoteData = {
        publicKey: mockVoteAccountPk,
        account: {
            creator: wallet.publicKey,
            votingId: newVote.votingId,
            question: newVote.question,
            description: newVote.description,
            choices: newVote.choices.filter(c => c.trim() !== ''),
            startTime: Math.floor(new Date(newVote.startTime).getTime() / 1000),
            endTime: Math.floor(new Date(newVote.endTime).getTime() / 1000),
            nftMint: newVote.nftMint ? new MockPublicKey(newVote.nftMint) : null,
            regularVotePower: BigInt(newVote.regularVotePower), // Use BigInt for u64
            nftVotePower: BigInt(newVote.nftVotePower),       // Use BigInt for u64
            totalVotes: new Array(newVote.choices.filter(c => c.trim() !== '').length).fill(BigInt(0)),
            isActive: true,
            createdAt: Math.floor(Date.now() / 1000),
            totalParticipants: BigInt(0),
            regularVoters: BigInt(0),
            nftVoters: BigInt(0),
            category: newVote.category, // This might need to be an object like { content: {} }
            tags: tags,
            status: Date.now() < new Date(newVote.startTime).getTime() ? VoteStatus.Upcoming : VoteStatus.Active,
            winningChoice: null,
            totalVotePower: BigInt(0),
        }
    };
    votes.value.unshift(createdVoteData); // Add to top of list
    // --- END MOCK ---

    /*
    // ACTUAL ANCHOR CALL (Example structure)
    // const [votePda, voteBump] = await anchor.web3.PublicKey.findProgramAddress(
    //   [Buffer.from("vote"), provider.value.wallet.publicKey.toBuffer(), Buffer.from(newVote.votingId)],
    //   program.value.programId
    // );
    // const [voteRecordPda, voteRecordBump] = await anchor.web3.PublicKey.findProgramAddress(
    //   [Buffer.from("vote_record"), votePda.toBuffer(), provider.value.wallet.publicKey.toBuffer()],
    //   program.value.programId
    // );

    // await program.value.methods.createVote(
    //     newVote.votingId,
    //     newVote.question,
    //     newVote.description,
    //     newVote.choices.filter(c => c.trim() !== ''),
    //     new anchor.BN(new Date(newVote.startTime).getTime() / 1000),
    //     new anchor.BN(new Date(newVote.endTime).getTime() / 1000),
    //     newVote.nftMint ? new anchor.web3.PublicKey(newVote.nftMint) : null,
    //     new anchor.BN(newVote.regularVotePower),
    //     new anchor.BN(newVote.nftVotePower),
    //     { [Object.keys(VoteCategoryLabels)[newVote.category].toLowerCase()]: {} }, // Convert number to enum object
    //     tags
    //   )
    //   .accounts({
    //     creator: provider.value.wallet.publicKey,
    //     vote: votePda,
    //     voteRecord: voteRecordPda, // The creator's initial vote record
    //     systemProgram: anchor.web3.SystemProgram.programId,
    //   })
    //   .rpc();
    */
    successMessage.value = `Vote "${newVote.question}" created successfully!`;
    setGlobalMessage(`Vote "${newVote.question}" created!`, false);
    resetForm();
    currentView.value = 'list'; // Switch to list view
  } catch (e) {
    console.error("Error creating vote:", e);
    error.value = `Failed to create vote: ${e.message || e.toString()}`;
    setGlobalMessage(error.value, true);
  } finally {
    isLoading.value = false;
  }
};

const fetchVotes = async () => {
  if (!wallet.connected /* || !program.value */) return; // Ensure program is initialized
  isLoadingVotes.value = true;
  error.value = '';
  try {
    // TODO: Replace with actual Anchor program call to fetch all vote accounts
    // const fetchedVoteAccounts = await program.value.account.vote.all();
    // votes.value = fetchedVoteAccounts.sort((a, b) => b.account.createdAt - a.account.createdAt);

    // --- MOCK DATA ---
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay
    if (votes.value.length === 0) { // Only add mock data if list is empty
        const now = Math.floor(Date.now() / 1000);
        votes.value = [
          {
            publicKey: new MockPublicKey("VotePk1"),
            account: {
              creator: new MockPublicKey("Creator1"), votingId: "q1-general", question: "Should we increase marketing budget?", description: "Detailed proposal about increasing the marketing budget by 20% for Q3.",
              choices: ["Yes, increase by 20%", "No, keep as is", "Increase by 10%"],
              startTime: now - 3600 * 24 * 2, endTime: now + 3600 * 24 * 3, // Started 2 days ago, ends in 3 days
              nftMint: null, regularVotePower: BigInt(1), nftVotePower: BigInt(5),
              totalVotes: [BigInt(15), BigInt(5), BigInt(8)], isActive: true, createdAt: now - 3600 * 24 * 2,
              totalParticipants: BigInt(28), regularVoters: BigInt(20), nftVoters: BigInt(8),
              category: VoteCategory.Community, tags: ["budget", "marketing"], status: VoteStatus.Active, winningChoice: null, totalVotePower: BigInt(63)
            }
          },
          {
            publicKey: new MockPublicKey("VotePk2"),
            account: {
              creator: new MockPublicKey("Creator2"), votingId: "feat-xyz", question: "Integrate new XYZ feature?", description: "Proposal for integrating the new XYZ feature into our main product. See docs for details.",
              choices: ["Yes", "No"],
              startTime: now - 3600 * 24 * 10, endTime: now - 3600 * 24 * 5, // Ended 5 days ago
              nftMint: new MockPublicKey("NftMintAddrExmpl"), regularVotePower: BigInt(1), nftVotePower: BigInt(10),
              totalVotes: [BigInt(150), BigInt(30)], isActive: false, createdAt: now - 3600 * 24 * 10,
              totalParticipants: BigInt(45), regularVoters: BigInt(0), nftVoters: BigInt(45), // Assuming all NFT voters
              category: VoteCategory.Feature, tags: ["product", "new-feature"], status: VoteStatus.Completed, winningChoice: 0, totalVotePower: BigInt(450)
            }
          },
          {
            publicKey: new MockPublicKey("VotePk3"),
            account: {
              creator: new MockPublicKey("Creator1"), votingId: "upcoming-rule-change", question: "Upcoming rule change discussion", description: "Discussion for a potential rule change in community guidelines.",
              choices: ["Agree with change", "Disagree", "Need more info"],
              startTime: now + 3600 * 24 * 1, endTime: now + 3600 * 24 * 7, // Starts tomorrow
              nftMint: null, regularVotePower: BigInt(1), nftVotePower: BigInt(1),
              totalVotes: [BigInt(0), BigInt(0), BigInt(0)], isActive: true, createdAt: now - 3600,
              totalParticipants: BigInt(0), regularVoters: BigInt(0), nftVoters: BigInt(0),
              category: VoteCategory.Community, tags: ["rules", "discussion"], status: VoteStatus.Upcoming, winningChoice: null, totalVotePower: BigInt(0)
            }
          }
        ].sort((a,b) => b.account.createdAt - a.account.createdAt);
    }
    // --- END MOCK ---
    setGlobalMessage("Votes loaded.", false);
  } catch (e) {
    console.error("Error fetching votes:", e);
    error.value = `Failed to fetch votes: ${e.message || e.toString()}`;
    setGlobalMessage(error.value, true);
  } finally {
    isLoadingVotes.value = false;
  }
};

const selectVoteForDetails = (vote) => {
    selectedVote.value = vote;
    selectedChoice.value = null; // Reset choice selection
    error.value = ''; // Clear previous errors
    successMessage.value = '';
};

const selectChoice = (index) => {
    selectedChoice.value = index;
};

const canVote = (voteAccount) => {
    const now = Math.floor(Date.now() / 1000);
    // TODO: Also check if user has already voted using their voteRecord for this vote
    return voteAccount.status === VoteStatus.Active && now >= voteAccount.startTime && now <= voteAccount.endTime;
};

const canFinalize = (voteAccount) => {
    const now = Math.floor(Date.now() / 1000);
    return voteAccount.status === VoteStatus.Active && 
           now > voteAccount.endTime &&
           wallet.publicKey && voteAccount.creator.equals(wallet.publicKey);
};

const handleCastVote = async (voteToCastOn) => {
  if (selectedChoice.value === null || !voteToCastOn) {
    error.value = "Please select a choice.";
    return;
  }
  isLoading.value = true;
  error.value = '';
  successMessage.value = '';

  try {
    // TODO: Replace with actual Anchor program call
    console.log("Attempting to cast vote:", {
      voteAccount: voteToCastOn.publicKey.toBase58(),
      choiceIndex: selectedChoice.value,
      // nftTokenAccount: (if vote.account.nftMint is present, find user's token account for that mint)
    });

    // --- MOCK INTERACTION ---
    await new Promise(resolve => setTimeout(resolve, 1500));
    const voteIndex = votes.value.findIndex(v => v.publicKey.equals(voteToCastOn.publicKey));
    if (voteIndex !== -1) {
        // Simulate vote power calculation
        let power = voteToCastOn.account.nftMint ? voteToCastOn.account.nftVotePower : voteToCastOn.account.regularVotePower;
        // In a real scenario, you'd check if the user owns the NFT. For mock, assume they do if nftMint is present.
        
        votes.value[voteIndex].account.totalVotes[selectedChoice.value] = BigInt(votes.value[voteIndex].account.totalVotes[selectedChoice.value]) + BigInt(power);
        votes.value[voteIndex].account.totalParticipants = BigInt(votes.value[voteIndex].account.totalParticipants) + BigInt(1);
        votes.value[voteIndex].account.totalVotePower = BigInt(votes.value[voteIndex].account.totalVotePower) + BigInt(power);
        if (voteToCastOn.account.nftMint) {
            votes.value[voteIndex].account.nftVoters = BigInt(votes.value[voteIndex].account.nftVoters) + BigInt(1);
        } else {
            votes.value[voteIndex].account.regularVoters = BigInt(votes.value[voteIndex].account.regularVoters) + BigInt(1);
        }
        // Mock that the user has voted (in real app, this would be based on their VoteRecord)
        // For UI, we might disable voting button after successful vote.
    }
    // --- END MOCK ---

    /*
    // ACTUAL ANCHOR CALL (Example structure)
    // const [voteRecordPda, voteRecordBump] = await anchor.web3.PublicKey.findProgramAddress(
    //   [Buffer.from("vote_record"), voteToCastOn.publicKey.toBuffer(), provider.value.wallet.publicKey.toBuffer()],
    //   program.value.programId
    // );
    // let nftTokenAccountAddress = SystemProgram.programId; // Placeholder if no NFT
    // if (voteToCastOn.account.nftMint) {
    //    // You'd need to find the Associated Token Account (ATA) for the user and the vote's nftMint
    //    // nftTokenAccountAddress = await getAssociatedTokenAddress(voteToCastOn.account.nftMint, provider.value.wallet.publicKey);
    //    // For the instruction, it expects AccountInfo, so you pass the public key.
    //    // The smart contract deserializes and checks it.
    // }

    // await program.value.methods.castVote(selectedChoice.value)
    //   .accounts({
    //     voter: provider.value.wallet.publicKey,
    //     vote: voteToCastOn.publicKey,
    //     voteRecord: voteRecordPda,
    //     nftTokenAccount: nftTokenAccountAddress, // Pass the user's token account for the specific NFT
    //     tokenProgram: TokenProgram.programId, // anchor.utils.token.TOKEN_PROGRAM_ID,
    //     systemProgram: anchor.web3.SystemProgram.programId,
    //   })
    //   .rpc();
    */
    successMessage.value = `Successfully voted for "${voteToCastOn.account.choices[selectedChoice.value]}"!`;
    setGlobalMessage(successMessage.value, false);
    selectedChoice.value = null; // Reset selection
    // Optionally re-fetch vote data or update locally
    fetchVotes(); // Re-fetch to see updated counts
  } catch (e) {
    console.error("Error casting vote:", e);
    error.value = `Failed to cast vote: ${e.message || e.toString()}`;
    setGlobalMessage(error.value, true);
  } finally {
    isLoading.value = false;
  }
};

const handleFinalizeVote = async (voteToFinalize) => {
  isLoading.value = true;
  error.value = '';
  successMessage.value = '';
  try {
    // TODO: Replace with actual Anchor program call
    console.log("Attempting to finalize vote:", voteToFinalize.publicKey.toBase58());

    // --- MOCK INTERACTION ---
    await new Promise(resolve => setTimeout(resolve, 1500));
    const voteIndex = votes.value.findIndex(v => v.publicKey.equals(voteToFinalize.publicKey));
    if (voteIndex !== -1) {
        votes.value[voteIndex].account.isActive = false;
        votes.value[voteIndex].account.status = VoteStatus.Completed;
        // Mock determining winner
        let maxVotes = BigInt(-1);
        let winningIdx = null;
        votes.value[voteIndex].account.totalVotes.forEach((count, idx) => {
            if (BigInt(count) > maxVotes) {
                maxVotes = BigInt(count);
                winningIdx = idx;
            } else if (BigInt(count) === maxVotes) {
                // Handle ties if necessary, contract seems to pick first one with max
            }
        });
        votes.value[voteIndex].account.winningChoice = winningIdx;
    }
    // --- END MOCK ---

    /*
    // ACTUAL ANCHOR CALL (Example structure)
    // await program.value.methods.finalizeVote()
    //   .accounts({
    //     creator: provider.value.wallet.publicKey,
    //     vote: voteToFinalize.publicKey,
    //   })
    //   .rpc();
    */
    successMessage.value = `Vote "${voteToFinalize.account.question}" finalized successfully!`;
    setGlobalMessage(successMessage.value, false);
    fetchVotes(); // Re-fetch to see updated status and winner
  } catch (e) {
    console.error("Error finalizing vote:", e);
    error.value = `Failed to finalize vote: ${e.message || e.toString()}`;
    setGlobalMessage(error.value, true);
  } finally {
    isLoading.value = false;
  }
};


// --- Lifecycle Hooks ---
onMounted(() => {
  resetForm(); // Initialize form with some defaults
  if (wallet.connected) {
    fetchVotes();
  }
});

// Watch for view changes to clear messages
watch(currentView, () => {
    error.value = '';
    successMessage.value = '';
    selectedVote.value = null; // Clear selected vote when switching main views
});

// Watch for selected vote to clear specific messages
watch(selectedVote, () => {
    error.value = '';
    successMessage.value = '';
});

</script>

<style>
/* Ensure Tailwind is loaded in your project, e.g., via CDN in index.html or as part of your build process */
/* For example, if using CDN: <script src="https://cdn.tailwindcss.com"></script> */
body {
  font-family: 'Inter', sans-serif; /* A nice sans-serif font */
}
/* Custom scrollbar for better aesthetics in dark mode */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
::-webkit-scrollbar-track {
  background: #1f2937; /* gray-800 */
}
::-webkit-scrollbar-thumb {
  background: #4b5563; /* gray-600 */
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: #6b7280; /* gray-500 */
}
/* Style for datetime-local icon */
input[type="datetime-local"]::-webkit-calendar-picker-indicator {
    filter: invert(0.8) brightness(100%) sepia(0%) saturate(10000%) hue-rotate(180deg); /* Makes it white-ish */
}
</style>
