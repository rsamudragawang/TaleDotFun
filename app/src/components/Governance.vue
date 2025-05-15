<template>
  <div class="governance-container">
    <h1 class="page-title">DAO Governance</h1>

    <div v-if="!wallet.connected.value" class="wallet-prompt-section">
      <p class="info-text">Please connect your wallet to participate in governance.</p>
      <div class="wallet-button-wrapper">
        <WalletMultiButton />
      </div>
    </div>

    <div v-if="uiMessage.text"
         :class="['ui-message', uiMessage.type === 'error' ? 'error-box' : (uiMessage.type === 'success' ? 'success-box' : (uiMessage.type === 'loading' ? 'loading-box' : 'info-box'))]">
      <p class="ui-message-title">{{ uiMessage.type.toUpperCase() }}:</p>
      <p v-html="uiMessage.text"></p>
      <div v-if="uiMessage.transactionSignature" class="tx-link-container">
        <a :href="getExplorerUrl(uiMessage.transactionSignature)" target="_blank" class="link transaction-link">
          View Transaction
        </a>
      </div>
    </div>

    <div v-if="wallet.connected.value" class="governance-content">
      <section class="card create-proposal-section">
        <h2 class="section-title">Create New Proposal</h2>
        <form @submit.prevent="handleCreateProposal" class="form-grid">
          <div class="form-group">
            <label for="question" class="form-label">Question:</label>
            <input type="text" id="question" v-model="newProposal.question" required class="form-input" placeholder="e.g., Should we fund project X?">
          </div>
          <div class="form-group">
            <label for="description" class="form-label">Description:</label>
            <textarea id="description" v-model="newProposal.description" rows="3" class="form-input" placeholder="Detailed explanation of the proposal..."></textarea>
          </div>
          <div class="form-group">
            <label class="form-label">Choices (at least 2):</label>
            <div v-for="(choice, index) in newProposal.choices" :key="index" class="choice-input-group">
              <input type="text" v-model="newProposal.choices[index]" :placeholder="`Choice ${index + 1}`" class="form-input choice-input">
              <button type="button" @click="removeChoice(index)" v-if="newProposal.choices.length > 2" class="btn btn-danger btn-remove-choice">-</button>
            </div>
            <button type="button" @click="addChoice" class="btn btn-secondary btn-add-choice">+ Add Choice</button>
          </div>
           <div class="form-group two-col">
            <div>
              <label for="startTime" class="form-label">Start Time (UTC):</label>
              <input type="datetime-local" id="startTime" v-model="newProposal.startTime" required class="form-input">
            </div>
            <div>
              <label for="endTime" class="form-label">End Time (UTC):</label>
              <input type="datetime-local" id="endTime" v-model="newProposal.endTime" required class="form-input">
            </div>
          </div>
          <div class="form-group two-col">
            <div>
                <label for="category" class="form-label">Category:</label>
                <select id="category" v-model="newProposal.category" class="form-input">
                    <option v-for="cat in voteCategories" :key="cat.value" :value="cat.value">{{ cat.label }}</option>
                </select>
            </div>
            <div>
                <label for="tags" class="form-label">Tags (comma-separated, max 5):</label>
                <input type="text" id="tags" v-model="newProposal.tagsString" class="form-input" placeholder="e.g., funding,community,feature">
            </div>
          </div>

          <fieldset class="form-fieldset nft-gating-fieldset">
            <legend class="form-legend">NFT Gating (Optional)</legend>
            <div class="form-group">
              <label for="nftMint" class="form-label">Candy Machine ID for Gating:</label>
              <input type="text" id="nftMint" v-model="newProposal.nftMint" class="form-input" placeholder="Enter existing Candy Machine ID">
            </div>
             <div class="form-group">
                <label for="nftImageForGating" class="form-label">Image URL for NFTs in New CM (if creating):</label>
                <input type="url" id="nftImageForGating" v-model="newProposal.nftImageForGating" class="form-input" placeholder="https://example.com/image.png">
                <small class="form-text">Required if generating a new CM below. This image will be used for all NFTs minted by the new CM.</small>
            </div>
            <button type="button" @click="openCMCreatorModal" class="btn btn-info btn-sm" :disabled="!newProposal.nftImageForGating">
              Generate CM ID via New Candy Machine
            </button>
          </fieldset>

          <div class="form-group two-col">
            <div>
              <label for="regularVotePower" class="form-label">Regular Vote Power:</label>
              <input type="number" id="regularVotePower" v-model.number="newProposal.regularVotePower" min="1" required class="form-input">
            </div>
            <div>
              <label for="nftVotePower" class="form-label">NFT Vote Power (if gated):</label>
              <input type="number" id="nftVotePower" v-model.number="newProposal.nftVotePower" min="1" required class="form-input">
            </div>
          </div>
          <button type="submit" :disabled="isSubmittingProposal || !anchorProgram" class="btn btn-primary btn-submit-proposal">
            <span v-if="isSubmittingProposal" class="spinner-inline"></span>
            {{ isSubmittingProposal ? 'Submitting...' : 'Create Proposal' }}
          </button>
        </form>
      </section>

      <section class="card list-proposals-section">
        <h2 class="section-title">Proposals</h2>
        <div class="filters-container">
            <label for="filterStatus" class="form-label">Filter by Status:</label>
            <select id="filterStatus" v-model="filter.status" @change="fetchProposals" class="form-input filter-select">
                <option value="All">All</option>
                <option value="Upcoming">Upcoming</option>
                <option value="Active">Active</option>
                <option value="Completed">Completed</option>
            </select>
            <label for="filterCategory" class="form-label ml-4">Filter by Category:</label>
            <select id="filterCategory" v-model="filter.category" @change="fetchProposals" class="form-input filter-select">
                <option value="All">All</option>
                 <option v-for="cat in voteCategories" :key="cat.value" :value="cat.label">{{ cat.label }}</option>
            </select>
        </div>

        <div v-if="isLoadingProposals" class="loading-indicator">Loading proposals...</div>
        <div v-else-if="proposals.length === 0" class="info-text">No proposals found matching criteria.</div>
        <div v-else class="proposals-grid">
          <div v-for="proposal in filteredProposals" :key="proposal.publicKey.toBase58()" class="proposal-card card">
            <h3 class="proposal-question">{{ proposal.account.question }}</h3>
            <p class="proposal-description">{{ proposal.account.description }}</p>
            <p class="proposal-detail"><strong>ID:</strong> {{ shortenAddress(proposal.account.votingId, 8) }}</p>
            <p class="proposal-detail"><strong>Status:</strong> <span :class="getStatusClass(proposal.account.status)">{{ getStatusText(proposal.account.status) }}</span></p>
            <p class="proposal-detail"><strong>Category:</strong> {{ getCategoryText(proposal.account.category) }}</p>
            <p class="proposal-detail"><strong>Starts:</strong> {{ formatDateTime(proposal.account.startTime) }}</p>
            <p class="proposal-detail"><strong>Ends:</strong> {{ formatDateTime(proposal.account.endTime) }}</p>
            <p class="proposal-detail"><strong>Total Participants:</strong> {{ proposal.account.totalParticipants.toString() }}</p>
            <p v-if="proposal.account.nftMint" class="proposal-detail"><strong>Gated by NFT Mint:</strong> {{ shortenAddress(proposal.account.nftMint.toBase58(), 6) }}</p>

            <div v-if="canAttemptVote(proposal.account)" class="vote-section">
              <h4 class="vote-section-title">Cast Your Vote:</h4>
              <div v-for="(choice, index) in proposal.account.choices" :key="index" class="choice-item">
                 <button @click="handleCastVote(proposal.publicKey, index)" 
                        :disabled="isVoting || hasVoted(proposal.publicKey)" 
                        class="btn btn-vote">
                  {{ choice }}
                  <span v-if="getVoteRecord(proposal.publicKey)?.votedChoice === index" class="voted-indicator">(Voted)</span>
                </button>
              </div>
               <p v-if="hasVoted(proposal.publicKey)" class="info-text-sm">You have already voted on this proposal.</p>
               <p v-if="!canAttemptVote(proposal.account) && getStatusText(proposal.account.status).toLowerCase() === 'upcoming' && isTimeWithinVoteWindow(proposal.account)" class="info-text-sm">
                 Voting will be active soon. Try voting to activate.
               </p>
            </div>

            <div v-if="proposal.account.status.completed" class="results-section">
              <h4 class="results-title">Results:</h4>
              <ul class="results-list">
                <li v-for="(choice, index) in proposal.account.choices" :key="index" class="result-item"
                    :class="{ 'winning-choice': proposal.account.winningChoice === index }">
                  {{ choice }}: {{ proposal.account.totalVotes[index].toString() }} votes
                  ({{ calculatePercentage(proposal.account.totalVotes[index], proposal.account.totalVotePower) }}%)
                </li>
              </ul>
              <p v-if="proposal.account.winningChoice !== null" class="winning-choice-text">
                <strong>Winning Choice:</strong> {{ proposal.account.choices[proposal.account.winningChoice] }}
              </p>
               <p v-else class="winning-choice-text">No winning choice or tie.</p>
            </div>

            <div v-if="proposal.account.status.upcoming && proposal.account.creator.equals(wallet.publicKey.value)" class="admin-actions">
                </div>
             <div v-if="proposal.account.status.active && proposal.account.creator.equals(wallet.publicKey.value) && new Date(Number(proposal.account.endTime) * 1000) < new Date()" class="admin-actions">
                <button @click="handleFinalizeVote(proposal.publicKey)" :disabled="isFinalizingVote" class="btn btn-secondary">
                    <span v-if="isFinalizingVote" class="spinner-inline"></span>
                    Finalize Vote
                </button>
            </div>
          </div>
        </div>
      </section>
    </div>

    <div v-if="showCMCreatorModal" class="modal-overlay" @click.self="closeCMCreatorModal">
      <div class="modal-content-wrapper cm-creator-modal-content">
        <button @click="closeCMCreatorModal" class="modal-close-button">&times;</button>
        <CandyMachineCreator
          :parentTale="{ title: newProposal.question.substring(0, 30) || 'Proposal CM Collection' }"
          :currentEpisodeNameFromParent="newProposal.question.substring(0, 20) || 'Proposal Gating Pass'"
          :episodeImageForNft="newProposal.nftImageForGating"
          :episodeDescriptionForNft="newProposal.description || 'NFT for proposal participation.'"
          :isWalletManagedExternally="true"
          @candyMachineCreated="handleCandyMachineCreated"
          @cancelCandyMachineCreation="closeCMCreatorModal"
        />
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { useWallet, WalletMultiButton } from 'solana-wallets-vue';
import { Connection, PublicKey, SystemProgram } from '@solana/web3.js';
import { Program, AnchorProvider, web3, utils, BN } from '@coral-xyz/anchor';
import { Buffer } from 'buffer';
import { v4 as uuidv4 } from 'uuid';

import CandyMachineCreator from './CandyMachineCreator.vue';

if (typeof window !== 'undefined' && !window.Buffer) {
  window.Buffer = Buffer;
}

import idlFromFile from '../anchor/tale_governance.json';
const TALE_GOVERNANCE_PROGRAM_ID = new PublicKey(idlFromFile.address);
const idl = idlFromFile;

const RPC_ENDPOINT = import.meta.env.VITE_RPC_ENDPOINT || 'https://api.devnet.solana.com';
const SOLANA_NETWORK = RPC_ENDPOINT.includes('mainnet') ? 'mainnet-beta' : (RPC_ENDPOINT.includes('testnet') ? 'testnet' : 'devnet');

const wallet = useWallet();
let anchorProvider = null;
let anchorProgram = null;

const uiMessage = ref({ text: '', type: 'info', transactionSignature: null });
const isLoadingProposals = ref(false);
const isSubmittingProposal = ref(false);
const isVoting = ref(false);
const isFinalizingVote = ref(false);

const defaultNewProposal = () => ({
  question: '',
  description: '',
  choices: ['', ''],
  startTime: '',
  endTime: '',
  nftMint: '',
  nftImageForGating: '',
  regularVotePower: 1,
  nftVotePower: 1,
  category: 0,
  tagsString: '',
});
const newProposal = ref(defaultNewProposal());

const proposals = ref([]);
const voteRecords = ref(new Map());

const voteCategories = [
  { value: 0, label: 'Content' },
  { value: 1, label: 'Feature' },
  { value: 2, label: 'Community' },
  { value: 3, label: 'Technical' },
  { value: 4, label: 'Other' },
];

const filter = ref({ status: 'All', category: 'All' });
const showCMCreatorModal = ref(false);

const showUiMessage = (msg, type = 'info', txSig = null, duration = 7000) => {
  uiMessage.value = { text: msg, type, transactionSignature: txSig };
  if (duration > 0 && type !== 'loading') {
    setTimeout(() => { uiMessage.value = { text: '', type: 'info', transactionSignature: null }; }, duration);
  }
};
const shortenAddress = (address, chars = 4) => address ? `${address.slice(0, chars)}...${address.slice(-chars)}` : '';
const getExplorerUrl = (signature) => `https://explorer.solana.com/tx/${signature}?cluster=${SOLANA_NETWORK}`;

const formatDateTime = (unixTimestamp) => {
    try {
      // console.log("formatDateTime input raw:", unixTimestamp);
      if (unixTimestamp && typeof unixTimestamp === 'object' && typeof unixTimestamp.toString === 'function') {
        // const logValue = unixTimestamp instanceof BN ? `BN(${unixTimestamp.toString(10)})` : JSON.stringify(unixTimestamp);
        // console.log("formatDateTime input (processed for log):", logValue);
      }
    } catch (e) {
      // console.warn("formatDateTime: Could not stringify input for logging", e);
    }

    if (unixTimestamp instanceof BN) {
        // console.log("Input is BN instance. Value:", unixTimestamp.toString(10));
        if (unixTimestamp.isZero()) {
            // console.log("BN isZero.");
            return 'N/A';
        }
        if (unixTimestamp.isNeg()) {
            // console.log("BN isNeg.");
            return 'N/A';
        }
    } else {
        // console.log("Input is NOT BN instance. Type:", typeof unixTimestamp, "Value:", unixTimestamp);
        if (unixTimestamp === null || unixTimestamp === undefined) {
            // console.log("Input is null or undefined.");
            return 'N/A';
        }
        const numVal = Number(unixTimestamp);
        if (!isNaN(numVal) && numVal === 0) {
            // console.log("Input (non-BN) converted to numeric zero.");
            return 'N/A';
        }
    }

    try {
        const tsNumber = typeof unixTimestamp === 'object' && typeof unixTimestamp.toNumber === 'function'
            ? unixTimestamp.toNumber()
            : Number(unixTimestamp);

        // console.log("formatDateTime converted tsNumber:", tsNumber);

        if (isNaN(tsNumber) || tsNumber <= 0) {
            //  console.warn(`formatDateTime: tsNumber is invalid or non-positive (${tsNumber}), returning 'N/A'. Original input type: ${typeof unixTimestamp}`);
             return 'N/A';
        }
        
        const date = new Date(tsNumber * 1000);
        if (isNaN(date.getTime())) {
            // console.error("formatDateTime: Resulting Date object is invalid. tsNumber was:", tsNumber);
            return "Invalid Date Obj";
        }
        return date.toLocaleString();
    } catch (e) {
        // console.error("Error in formatDateTime's try-catch block:", e, "Input was:", unixTimestamp);
        return "Conversion Error";
    }
};


const getCategoryText = (categoryEnum) => {
    if (categoryEnum === null || typeof categoryEnum !== 'object') return 'Unknown';
    const key = Object.keys(categoryEnum)[0];
    return voteCategories.find(c => c.label.toLowerCase() === key.toLowerCase())?.label || key;
};
const getStatusText = (statusEnum) => {
    if (statusEnum === null || typeof statusEnum !== 'object') return 'Unknown';
    return Object.keys(statusEnum)[0];
};
const getStatusClass = (statusEnum) => {
    if (statusEnum === null || typeof statusEnum !== 'object') return 'status-unknown';
    const statusKey = Object.keys(statusEnum)[0].toLowerCase();
    return `status-${statusKey}`;
};
const calculatePercentage = (votes, totalPower) => {
    const numVotes = typeof votes === 'object' && votes.toNumber ? votes.toNumber() : Number(votes);
    const numTotalPower = typeof totalPower === 'object' && totalPower.toNumber ? totalPower.toNumber() : Number(totalPower);

    if (numTotalPower === 0 || isNaN(numVotes) || isNaN(numTotalPower)) return '0.00';
    return ((numVotes / numTotalPower) * 100).toFixed(2);
};

const initializeAnchor = () => {
  if (wallet.connected.value && wallet.wallet.value?.adapter) {
    try {
      const connection = new Connection(RPC_ENDPOINT, 'confirmed');
      anchorProvider = new AnchorProvider(connection, wallet.wallet.value.adapter, AnchorProvider.defaultOptions());
      anchorProgram = new Program(idl, anchorProvider);
      console.log("Governance: Anchor Program Initialized.");
      showUiMessage("Program ready.", "success", null, 2000);
      return true;
    } catch (e) {
      console.error("Governance: Anchor Program Init failed", e);
      showUiMessage(`Anchor Init Error: ${e.message}`, "error");
      anchorProgram = null;
      return false;
    }
  }
  anchorProgram = null;
  return false;
};

const fetchProposals = async () => {
  if (!anchorProgram) {
    showUiMessage("Anchor program not initialized. Connect wallet.", "error");
    return;
  }
  isLoadingProposals.value = true;
  showUiMessage("Fetching proposals...", "loading", null, 0);
  try {
    const fetchedProposals = await anchorProgram.account.vote.all();
    proposals.value = fetchedProposals.sort((a, b) => Number(b.account.createdAt) - Number(a.account.createdAt));
    showUiMessage(`Fetched ${proposals.value.length} proposals.`, "success", null, 3000);
    await fetchUserVoteRecords(proposals.value.filter(p => getStatusText(p.account.status).toLowerCase() === 'active'));
  } catch (error) {
    console.error("Error fetching proposals:", error);
    showUiMessage(`Error fetching proposals: ${error.message}`, "error");
    proposals.value = [];
  } finally {
    isLoadingProposals.value = false;
    if (uiMessage.value.type === 'loading') showUiMessage("","info");
  }
};

const fetchUserVoteRecords = async (proposalsToFetchFor) => {
    if (!anchorProgram || !wallet.publicKey.value) return;
    for (const proposal of proposalsToFetchFor) {
        try {
            const [voteRecordPda, _] = await PublicKey.findProgramAddressSync(
                [
                    Buffer.from(utils.bytes.utf8.encode("vote_record")),
                    proposal.publicKey.toBuffer(),
                    wallet.publicKey.value.toBuffer()
                ],
                anchorProgram.programId
            );
            const record = await anchorProgram.account.voteRecord.fetchNullable(voteRecordPda);
            if (record) {
                voteRecords.value.set(proposal.publicKey.toBase58(), record);
            }
        } catch (e) {
            // Non-critical
        }
    }
};
const getVoteRecord = (proposalPublicKey) => voteRecords.value.get(proposalPublicKey.toBase58());
const hasVoted = (proposalPublicKey) => {
    const record = getVoteRecord(proposalPublicKey);
    return record && record.hasVoted;
};

const filteredProposals = computed(() => {
    return proposals.value.filter(p => {
        const statusMatch = filter.value.status === 'All' || getStatusText(p.account.status) === filter.value.status;
        const categoryMatch = filter.value.category === 'All' || getCategoryText(p.account.category) === filter.value.category;
        return statusMatch && categoryMatch;
    });
});

// Helper to check if current time is within proposal's voting window
const isTimeWithinVoteWindow = (proposalAccount) => {
  if (!proposalAccount) return false;
  const now = Math.floor(Date.now() / 1000);
  const startTime = proposalAccount.startTime?.toNumber ? proposalAccount.startTime.toNumber() : Number(proposalAccount.startTime);
  const endTime = proposalAccount.endTime?.toNumber ? proposalAccount.endTime.toNumber() : Number(proposalAccount.endTime);
  
  if (isNaN(startTime) || isNaN(endTime) || startTime <=0 || endTime <=0) return false; // Ensure valid numbers

  return now >= startTime && now <= endTime;
};


// Updated helper function to determine if voting is possible
const canAttemptVote = (proposalAccount) => {
  console.log(`canAttemptVote for proposal: ${proposalAccount?.question?.substring(0,20)}...`);
  if (!proposalAccount) {
    console.log("  -> No proposal account");
    return false;
  }
  // Check the on-chain isActive flag first. This is critical.
  if (!proposalAccount.isActive) {
    console.log(`  -> proposal.account.isActive is false for ${proposalAccount.question?.substring(0,20)}`);
    return false;
  }

  const now = Math.floor(Date.now() / 1000);
  const startTime = proposalAccount.startTime?.toNumber ? proposalAccount.startTime.toNumber() : Number(proposalAccount.startTime);
  const endTime = proposalAccount.endTime?.toNumber ? proposalAccount.endTime.toNumber() : Number(proposalAccount.endTime);
  const statusKey = getStatusText(proposalAccount.status).toLowerCase();

  console.log(`  Proposal: ${proposalAccount.question?.substring(0,20)}`);
  console.log(`  isActive (on-chain boolean): ${proposalAccount.isActive}`);
  console.log(`  now: ${now} (${new Date(now*1000).toLocaleString()})`);
  console.log(`  startTime (BN.toNumber): ${startTime} (${startTime > 0 ? new Date(startTime*1000).toLocaleString() : 'Invalid/Zero'})`);
  console.log(`  endTime (BN.toNumber): ${endTime} (${endTime > 0 ? new Date(endTime*1000).toLocaleString() : 'Invalid/Zero'})`);
  console.log(`  statusKey (enum): ${statusKey}`);

  // Condition 1: Current time must be within the start and end times
  const withinTimeWindow = now >= startTime && now <= endTime && startTime > 0 && endTime > 0;
  console.log(`  withinTimeWindow (now >= startTime && now <= endTime && valid times): ${withinTimeWindow}`);

  // Condition 2: Status must be 'active', OR 'upcoming' if the start time has passed
  // (because the first vote will transition 'upcoming' to 'active')
  const correctStatusForVoting = (statusKey === 'active') || (statusKey === 'upcoming' && now >= startTime && startTime > 0);
  console.log(`  correctStatusForVoting (status is 'active' OR ('upcoming' AND now >= startTime)): ${correctStatusForVoting}`);
  
  const result = proposalAccount.isActive && withinTimeWindow && correctStatusForVoting;
  console.log(`  Final canAttemptVote result for ${proposalAccount.question?.substring(0,20)}: ${result}`);
  
  return result;
};


const addChoice = () => {
  if (newProposal.value.choices.length < 10) {
    newProposal.value.choices.push('');
  } else {
    showUiMessage("Maximum of 10 choices allowed.", "warning");
  }
};
const removeChoice = (index) => {
  if (newProposal.value.choices.length > 2) {
    newProposal.value.choices.splice(index, 1);
  }
};

const openCMCreatorModal = () => {
  if (!newProposal.value.nftImageForGating) {
    showUiMessage("Please provide an Image URL for the Gating NFT first.", "warning");
    return;
  }
  showCMCreatorModal.value = true;
};

const closeCMCreatorModal = () => {
  showCMCreatorModal.value = false;
};

const handleCandyMachineCreated = (candyMachineId) => {
  newProposal.value.nftMint = candyMachineId;
  showUiMessage(`Candy Machine created and ID populated: ${shortenAddress(candyMachineId)}`, "success");
  closeCMCreatorModal();
};

const handleCreateProposal = async () => {
  if (!anchorProgram || !wallet.publicKey.value) {
    showUiMessage("Wallet not connected or program not initialized.", "error"); return;
  }
  if (newProposal.value.choices.some(c => !c.trim()) || newProposal.value.choices.length < 2) {
    showUiMessage("At least two non-empty choices are required.", "error"); return;
  }
   if (!newProposal.value.startTime || !newProposal.value.endTime) {
    showUiMessage("Start and End times are required.", "error");
    return;
  }
  const startDate = new Date(newProposal.value.startTime);
  const endDate = new Date(newProposal.value.endTime);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      showUiMessage("Invalid date format for Start or End time.", "error");
      return;
  }

  const startTime = Math.floor(startDate.getTime() / 1000);
  const endTime = Math.floor(endDate.getTime() / 1000);

  if (startTime >= endTime) {
      showUiMessage("Start time must be before end time.", "error");
      return;
  }


  isSubmittingProposal.value = true;
  showUiMessage("Submitting proposal...", "loading", null, 0);

  try {
    const votingId = uuidv4().slice(0, 32);
    const creator = wallet.publicKey.value;

    const [votePda, voteBump] = await PublicKey.findProgramAddressSync(
      [Buffer.from(utils.bytes.utf8.encode("vote")), creator.toBuffer(), Buffer.from(utils.bytes.utf8.encode(votingId))],
      anchorProgram.programId
    );
    const [voteRecordPda, recordBump] = await PublicKey.findProgramAddressSync(
        [Buffer.from(utils.bytes.utf8.encode("vote_record")), votePda.toBuffer(), creator.toBuffer()],
        anchorProgram.programId
    );

    let nftMintPk = null;
    if (newProposal.value.nftMint && newProposal.value.nftMint.trim() !== '') {
        try {
            nftMintPk = new PublicKey(newProposal.value.nftMint.trim());
        } catch (e) {
            showUiMessage("Invalid NFT Mint Address (Candy Machine ID) format.", "error"); isSubmittingProposal.value = false; return;
        }
    }
    const tagsArray = newProposal.value.tagsString.split(',').map(t => t.trim()).filter(t => t).slice(0,5);

    const txSignature = await anchorProgram.methods
      .createVote(
        votingId,
        newProposal.value.question,
        newProposal.value.description,
        newProposal.value.choices.filter(c => c.trim()),
        new BN(startTime),
        new BN(endTime),
        nftMintPk,
        new BN(newProposal.value.regularVotePower),
        new BN(newProposal.value.nftVotePower),
        { [voteCategories[newProposal.value.category].label.toLowerCase()]: {} },
        tagsArray
      )
      .accounts({ creator: creator, vote: votePda, voteRecord: voteRecordPda, systemProgram: SystemProgram.programId })
      .rpc();

    showUiMessage("Proposal created successfully!", "success", txSignature);
    await fetchProposals();
    newProposal.value = defaultNewProposal();

  } catch (error) {
    console.error("Error creating proposal:", error);
    const errorMsg = error.message || "Failed to create proposal.";
    showUiMessage(errorMsg, "error", error.signature);
  } finally {
    isSubmittingProposal.value = false;
    if (uiMessage.value.type === 'loading') showUiMessage("","info");
  }
};

const handleCastVote = async (proposalPubkey, choiceIndex) => {
  if (!anchorProgram || !wallet.publicKey.value) {
    showUiMessage("Wallet not connected or program not initialized.", "error"); return;
  }
  isVoting.value = true;
  showUiMessage(`Casting vote for choice ${choiceIndex + 1}...`, "loading", null, 0);

  try {
    const voter = wallet.publicKey.value;
    const proposalAccount = await anchorProgram.account.vote.fetch(proposalPubkey);

    const [voteRecordPda, _recordBump] = await PublicKey.findProgramAddressSync(
        [Buffer.from(utils.bytes.utf8.encode("vote_record")), proposalPubkey.toBuffer(), voter.toBuffer()],
        anchorProgram.programId
    );

    let nftTokenAccountAssociated = SystemProgram.programId;
    if (proposalAccount.nftMint) {
        const tokenAccounts = await anchorProvider.connection.getParsedTokenAccountsByOwner(
            voter, { mint: proposalAccount.nftMint }
        );
        if (tokenAccounts.value.length > 0 && tokenAccounts.value.some(acc => acc.account.data.parsed.info.tokenAmount.uiAmount > 0)) {
            const validTokenAccount = tokenAccounts.value.find(acc => acc.account.data.parsed.info.tokenAmount.uiAmount > 0);
            if (validTokenAccount) {
                nftTokenAccountAssociated = validTokenAccount.pubkey;
            } else {
                 showUiMessage("You hold the required NFT, but your token account(s) have zero balance.", "error");
                 isVoting.value = false; return;
            }
        } else {
            showUiMessage("You do not hold the required NFT (or it has zero balance) to vote on this proposal.", "error");
            isVoting.value = false; return;
        }
    }

    const txSignature = await anchorProgram.methods
      .castVote(choiceIndex)
      .accounts({
        voter: voter,
        vote: proposalPubkey,
        voteRecord: voteRecordPda,
        nftTokenAccount: nftTokenAccountAssociated,
        tokenProgram: utils.token.TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    showUiMessage("Vote cast successfully!", "success", txSignature);
    await fetchProposals();
  } catch (error) {
    console.error("Error casting vote:", error);
    const errorMsg = error.message || "Failed to cast vote.";
    showUiMessage(errorMsg, "error", error.signature);
  } finally {
    isVoting.value = false;
    if (uiMessage.value.type === 'loading') showUiMessage("","info");
  }
};

const handleFinalizeVote = async (proposalPubkey) => {
    if (!anchorProgram || !wallet.publicKey.value) {
        showUiMessage("Wallet not connected or program not initialized.", "error"); return;
    }
    isFinalizingVote.value = true;
    showUiMessage("Finalizing vote...", "loading", null, 0);
    try {
        const txSignature = await anchorProgram.methods
            .finalizeVote()
            .accounts({ creator: wallet.publicKey.value, vote: proposalPubkey })
            .rpc();
        showUiMessage("Vote finalized successfully!", "success", txSignature);
        await fetchProposals();
    } catch (error) {
        console.error("Error finalizing vote:", error);
        const errorMsg = error.message || "Failed to finalize vote.";
        showUiMessage(errorMsg, "error", error.signature);
    } finally {
        isFinalizingVote.value = false;
        if (uiMessage.value.type === 'loading') showUiMessage("","info");
    }
};

watch(() => wallet.connected.value, (isConnected) => {
    if (isConnected) {
      if (initializeAnchor()) fetchProposals();
    } else {
      anchorProgram = null; proposals.value = []; voteRecords.value.clear();
      showUiMessage("Wallet disconnected.", "info");
    }
  }, { immediate: true }
);

onMounted(() => {
  if (wallet.connected.value) {
    if(initializeAnchor()) fetchProposals();
  }
});

</script>

<style scoped>
/* Styles remain largely the same, adding modal styles */
.governance-container {
  max-width: 1000px;
  margin: 2rem auto;
  padding: 1rem;
  font-family: 'Arial', sans-serif;
  color: #333;
}

.page-title {
  text-align: center;
  color: #2c3e50;
  margin-bottom: 2rem;
  font-size: 2.5rem;
}

.wallet-prompt-section {
  text-align: center;
  padding: 2rem;
  background-color: #f9f9f9;
  border-radius: 8px;
  margin-bottom: 2rem;
}

.wallet-button-wrapper {
  margin-top: 1rem;
  display: flex;
  justify-content: center;
}
.wallet-button-wrapper > :deep(.wallet-adapter-button-trigger) {
  background-color: #5c6bc0 !important; /* Example: Indigo */
  color: white !important;
  font-weight: bold !important;
  border-radius: 6px !important;
  padding: 0.75rem 1.5rem !important;
}
.wallet-button-wrapper > :deep(.wallet-adapter-button-trigger:hover) {
  background-color: #3949ab !important;
}


.governance-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.card {
  background-color: #fff;
  padding: 1.5rem 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.section-title {
  font-size: 1.8rem;
  color: #34495e;
  margin-bottom: 1.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #eee;
}

.form-grid {
  display: grid;
  gap: 1.5rem;
}
.form-fieldset {
    border: 1px solid #e0e0e0;
    padding: 1rem;
    border-radius: 6px;
    margin-top: 1rem;
}
.form-legend {
    font-weight: bold;
    color: #3f51b5;
    padding: 0 0.5rem;
    margin-left: 0.5rem;
    font-size: 1.1rem;
}
.nft-gating-fieldset .form-group {
    margin-bottom: 0.75rem; /* Smaller margin within fieldset */
}
.nft-gating-fieldset .btn-info {
    margin-top: 0.5rem;
}


.form-group {
  display: flex;
  flex-direction: column;
}
.form-group.two-col {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
}

.form-label {
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #555;
}
.form-text {
    font-size: 0.85rem;
    color: #777;
    margin-top: 0.25rem;
}

.form-input, .filter-select {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.2s ease-in-out;
}
.form-input:focus, .filter-select:focus {
  outline: none;
  border-color: #5c6bc0; /* Indigo */
  box-shadow: 0 0 0 2px rgba(92, 107, 192, 0.2);
}
textarea.form-input {
    min-height: 80px;
    resize: vertical;
}

.choice-input-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}
.choice-input {
  flex-grow: 1;
}

.btn {
  padding: 0.75rem 1.25rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease, transform 0.1s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.btn:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
}
.btn:disabled {
  background-color: #ccc !important;
  color: #666 !important;
  cursor: not-allowed;
  transform: none;
}

.btn-primary {
  background-color: #5c6bc0; /* Indigo */
  color: white;
}
.btn-primary:hover:not(:disabled) {
  background-color: #3949ab;
}

.btn-secondary {
  background-color: #e0e0e0;
  color: #333;
}
.btn-secondary:hover:not(:disabled) {
  background-color: #bdbdbd;
}
.btn-danger {
    background-color: #ef5350; /* Red */
    color: white;
    padding: 0.5rem 0.75rem;
}
.btn-danger:hover:not(:disabled) {
    background-color: #d32f2f;
}
.btn-info {
    background-color: #29b6f6; /* Light Blue */
    color: white;
}
.btn-info:hover:not(:disabled) {
    background-color: #0288d1;
}
.btn-sm {
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
}
.btn-xs {
    padding: 0.25rem 0.5rem;
    font-size: 0.8rem;
}

.btn-add-choice, .btn-remove-choice {
    margin-top: 0.25rem;
    align-self: flex-start;
}


.filters-container {
    display: flex;
    gap: 1rem;
    align-items: center;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
}
.filter-select {
    min-width: 150px;
}


.proposals-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 1.5rem;
}

.proposal-card {
  border: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
}
.proposal-question {
  font-size: 1.25rem;
  color: #3f51b5; /* Indigo darker */
  margin-bottom: 0.75rem;
}
.proposal-description {
  font-size: 0.95rem;
  color: #555;
  margin-bottom: 1rem;
  white-space: pre-wrap; /* Preserve line breaks */
  flex-grow: 1;
}
.proposal-detail {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 0.3rem;
}
.proposal-detail strong {
    color: #444;
}

.status-upcoming { color: #ffa726; /* Orange */ font-weight: bold; }
.status-active { color: #66bb6a; /* Green */ font-weight: bold; }
.status-completed { color: #78909c; /* Blue Grey */ font-weight: bold; }
.status-unknown { color: #bdbdbd; }


.vote-section, .results-section, .admin-actions {
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px dashed #eee;
}
.vote-section-title, .results-title {
  font-size: 1.1rem;
  color: #455a64; /* Blue Grey darker */
  margin-bottom: 0.75rem;
}
.choice-item {
  margin-bottom: 0.5rem;
}
.btn-vote {
  background-color: #7e57c2; /* Deep Purple */
  color: white;
  width: 100%;
  text-align: left;
  justify-content: flex-start;
}
.btn-vote:hover:not(:disabled) {
  background-color: #5e35b1;
}
.voted-indicator {
    margin-left: auto;
    font-size: 0.8em;
    background-color: rgba(255,255,255,0.2);
    padding: 0.1em 0.4em;
    border-radius: 3px;
}

.results-list {
  list-style: none;
  padding: 0;
}
.result-item {
  padding: 0.3rem 0;
  font-size: 0.95rem;
}
.winning-choice {
  font-weight: bold;
  color: #4caf50; /* Green */
}
.winning-choice-text {
    margin-top: 0.75rem;
    font-size: 1rem;
}

.loading-indicator, .info-text {
  text-align: center;
  padding: 1rem;
  color: #777;
}
.info-text-sm {
    font-size: 0.85rem;
    color: #666;
}

.ui-message {
  padding: 1rem 1.5rem;
  margin-bottom: 1.5rem;
  border-radius: 6px;
  border: 1px solid transparent;
}
.ui-message-title {
    font-weight: bold;
    margin-bottom: 0.25rem;
}
.error-box {
  background-color: #ffebee; /* Light Red */
  border-color: #ef9a9a; /* Red */
  color: #c62828; /* Dark Red */
}
.success-box {
  background-color: #e8f5e9; /* Light Green */
  border-color: #a5d6a7; /* Green */
  color: #2e7d32; /* Dark Green */
}
.info-box {
  background-color: #e3f2fd; /* Light Blue */
  border-color: #90caf9; /* Blue */
  color: #1565c0; /* Dark Blue */
}
.loading-box {
  background-color: #fffde7; /* Light Yellow */
  border-color: #fff59d;    /* Yellow */
  color: #f57f17;           /* Dark Yellow */
}
.warning-box {
    background-color: #fff3e0; /* Light Orange */
    border-color: #ffcc80;    /* Orange */
    color: #e65100;           /* Dark Orange */
}
.tx-link-container {
    margin-top: 0.5rem;
}
.transaction-link {
    font-size: 0.9rem;
    text-decoration: underline;
}
.transaction-link:hover {
    color: #0d47a1; /* Darker blue for hover */
}

.spinner-inline {
  width: 1em;
  height: 1em;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  display: inline-block;
  animation: spinner-spin 0.75s linear infinite;
  margin-right: 0.5em;
  vertical-align: text-bottom;
}

@keyframes spinner-spin {
  to { transform: rotate(360deg); }
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content-wrapper {
  background-color: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.3);
  width: 90%;
  max-width: 700px; /* Max width for CM creator */
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
}
.cm-creator-modal-content { /* Specific styles for CM creator modal if needed */
    /* Example: make it wider */
    /* max-width: 800px; */
}


.modal-close-button {
  position: absolute;
  top: 10px;
  right: 15px;
  background: none;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  color: #888;
}
.modal-close-button:hover {
    color: #333;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .form-group.two-col {
    grid-template-columns: 1fr; /* Stack on smaller screens */
  }
  .filters-container {
      flex-direction: column;
      align-items: stretch;
  }
  .filter-select {
      width: 100%;
  }
  .modal-content-wrapper {
    width: 95%;
    padding: 1.5rem;
  }
}
</style>
