<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useWallet } from 'solana-wallets-vue';
import { Connection, PublicKey, SystemProgram } from '@solana/web3.js';
import { AnchorProvider, Program, web3 } from '@coral-xyz/anchor';
import { Buffer } from 'buffer';
import idl from './readium_fun.json'
// --- Configuration ---
// IMPORTANT: Replace with your Program ID and IDL
const PROGRAM_ID = new PublicKey("EZ1GQumWC4UwwQBGERwtnMNS6rJRprjP1HhGfhLC2utJ"); // From your lib.rs declare_id!
const programIdl = idl ; // Example: import idl from './my_idl.json';

const SOLANA_NETWORK = 'https://api.devnet.solana.com'; // Or 'devnet', 'mainnet-beta' via RPC provider

// --- Wallet and Connection ---
const { wallet, publicKey, connected, signTransaction, signAllTransactions, sendTransaction } = useWallet();
const provider = ref(null);
const program = ref(null);
const connection = ref(null);

// --- UI State ---
const isLoading = ref(false);
const errorLog = ref('');
const successLog = ref('');

// --- User Management ---
const newUserName = ref('');
const newUserType = ref('Member'); // Default, matches enum variant
const users = ref([]);
const userToUpdate = ref(null);
const updateUserForm = ref({ id: null, name: '', userType: 'Member' });

// --- Tale Management ---
const newTaleName = ref('');
const tales = ref([]);
const taleToUpdate = ref(null);
const updateTaleForm = ref({ id: null, name: '' }); // id here is the PublicKey of the tale

// --- Episode Management ---
const newEpisodeName = ref('');
const newEpisodeNumber = ref(1);
const newEpisodeCandyMachineId = ref('');
const selectedTaleForEpisode = ref(null); // PublicKey of the parent tale
const episodes = ref([]); // Will store episodes for the selectedTaleForEpisode
const episodeToUpdate = ref(null);
const updateEpisodeForm = ref({ id: null, name: '', candyMachineId: ''}); // id is PublicKey of episode


// --- Initialization ---
onMounted(async () => {
  connection.value = new Connection(SOLANA_NETWORK, 'confirmed');
  if (connected.value && publicKey.value && wallet.value) {
    await initializeProviderAndProgram();
  }
});

watch([connected, publicKey, wallet], async (newValues) => {
  const [newConnected, newPublicKey, newWallet] = newValues;
  if (newConnected && newPublicKey && newWallet) {
    await initializeProviderAndProgram();
    await fetchAllData(); // Fetch data once connected
  } else {
    provider.value = null;
    program.value = null;
    // Clear data if wallet disconnects
    users.value = [];
    tales.value = [];
    episodes.value = [];
  }
});

async function initializeProviderAndProgram() {
  if (!wallet.value || !publicKey.value || !connection.value) {
    errorLog.value = "Wallet not connected or connection not established.";
    return;
  }
  try {
    // The wallet object from useWallet() might not directly be an adapter.
    // It often has an 'adapter' property or you might need to construct the provider differently
    // depending on your wallet adapter setup.
    // This is a common way to set it up with AnchorProvider:
    const anchorWallet = {
      publicKey: publicKey.value,
      signTransaction: wallet.value.adapter.signTransaction, // Or just signTransaction if it's directly available and compatible
      signAllTransactions: wallet.value.adapter.signAllTransactions, // Or just signAllTransactions
    };

    provider.value = new AnchorProvider(connection.value, anchorWallet, AnchorProvider.defaultOptions());
    if (!programIdl || Object.keys(programIdl).length === 0) {
        errorLog.value = "Program IDL is not loaded. Please paste your IDL JSON.";
        return;
    }
    program.value = new Program(programIdl, PROGRAM_ID, provider.value);
    successLog.value = "Program initialized successfully.";
    errorLog.value = "";
  } catch (e) {
    console.error("Error initializing provider/program:", e);
    errorLog.value = `Initialization Error: ${e.message}`;
    program.value = null;
  }
}

async function fetchAllData() {
    if (!program.value) return;
    await fetchUsers();
    await fetchTales();
    // Episodes are fetched when a tale is selected
}

// --- Helper to format UserType for Anchor ---
function formatUserType(typeString) {
  if (typeString === 'Admin') return { admin: {} };
  if (typeString === 'Guest') return { guest: {} };
  return { member: {} }; // Default to Member
}

// --- User CRUD Functions ---
async function createUser() {
  if (!program.value || !publicKey.value) {
    errorLog.value = "Program not initialized or wallet not connected.";
    return;
  }
  if (!newUserName.value.trim()) {
    errorLog.value = "User name cannot be empty.";
    return;
  }
  isLoading.value = true;
  errorLog.value = '';
  successLog.value = '';
  try {
    // For User accounts that are not PDAs and are init by keypair,
    // the keypair needs to be generated and passed as a signer.
    // The current Rust code for CreateUser doesn't use PDA for user_account itself.
    // It expects user_account to be a new account being initialized.
    const newUserAccount = web3.Keypair.generate();

    await program.value.methods
      .createUser(newUserName.value, formatUserType(newUserType.value))
      .accounts({
        userAccount: newUserAccount.publicKey,
        authority: publicKey.value,
        systemProgram: SystemProgram.programId,
      })
      .signers([newUserAccount]) // The new account keypair must sign
      .rpc();
    successLog.value = `User '${newUserName.value}' created successfully. Address: ${newUserAccount.publicKey.toBase58()}`;
    newUserName.value = '';
    await fetchUsers();
  } catch (e) {
    console.error("Error creating user:", e);
    errorLog.value = `Error creating user: ${e.message}`;
  } finally {
    isLoading.value = false;
  }
}

async function fetchUsers() {
  if (!program.value) return;
  isLoading.value = true;
  try {
    const fetchedUsers = await program.value.account.user.all();
    users.value = fetchedUsers.map(u => ({ publicKey: u.publicKey.toBase58(), ...u.account }));
    successLog.value = "Users fetched successfully.";
  } catch (e) {
    console.error("Error fetching users:", e);
    errorLog.value = `Error fetching users: ${e.message}`;
  } finally {
    isLoading.value = false;
  }
}

function openUpdateUserModal(user) {
  userToUpdate.value = user; // Store the full user object including its original publicKey
  updateUserForm.value.id = user.publicKey; // This is the string representation of the PublicKey
  updateUserForm.value.name = user.name;
  // Convert userType back to string for select; Anchor stores it as an object
  if (user.userType.admin) updateUserForm.value.userType = 'Admin';
  else if (user.userType.guest) updateUserForm.value.userType = 'Guest';
  else updateUserForm.value.userType = 'Member';
}

async function submitUpdateUser() {
  if (!program.value || !publicKey.value || !userToUpdate.value) {
    errorLog.value = "Program/wallet issue or no user selected for update.";
    return;
  }
  isLoading.value = true;
  errorLog.value = '';
  successLog.value = '';
  try {
    await program.value.methods
      .updateUser(updateUserForm.value.name, formatUserType(updateUserForm.value.userType))
      .accounts({
        userAccount: new PublicKey(userToUpdate.value.publicKey), // Use the original PublicKey
        authority: publicKey.value,
      })
      .rpc();
    successLog.value = `User '${updateUserForm.value.name}' updated.`;
    userToUpdate.value = null; // Close modal / reset form
    await fetchUsers();
  } catch (e) {
    console.error("Error updating user:", e);
    errorLog.value = `Error updating user: ${e.message}`;
  } finally {
    isLoading.value = false;
  }
}

async function deleteUser(userPublicKeyStr) {
  if (!program.value || !publicKey.value) return;
  if (!confirm(`Are you sure you want to delete user ${userPublicKeyStr}?`)) return;
  isLoading.value = true;
  errorLog.value = '';
  successLog.value = '';
  try {
    await program.value.methods
      .deleteUser()
      .accounts({
        userAccount: new PublicKey(userPublicKeyStr),
        authority: publicKey.value,
      })
      .rpc();
    successLog.value = `User ${userPublicKeyStr} deleted.`;
    await fetchUsers();
  } catch (e) {
    console.error("Error deleting user:", e);
    errorLog.value = `Error deleting user: ${e.message}`;
  } finally {
    isLoading.value = false;
  }
}


// --- Tale CRUD Functions ---
async function createTale() {
  if (!program.value || !publicKey.value) return;
  if (!newTaleName.value.trim()) {
    errorLog.value = "Tale name cannot be empty.";
    return;
  }
  isLoading.value = true;
  errorLog.value = '';
  successLog.value = '';
  try {
    // Tale account is a PDA, its address is derived by the program.
    // We need to find the PDA on the client if we want to know its address beforehand,
    // but for creation, the program handles it.
    // The seeds are: "tale", creator.key(), tale_name.as_bytes()
    // We don't need to generate a keypair for tale_account.

    const [talePda] = PublicKey.findProgramAddressSync(
        [
            Buffer.from("tale"),
            publicKey.value.toBuffer(),
            Buffer.from(newTaleName.value)
        ],
        PROGRAM_ID
    );

    await program.value.methods
      .createTale(newTaleName.value)
      .accounts({
        taleAccount: talePda,
        creator: publicKey.value,
        systemProgram: SystemProgram.programId,
      })
      // No signers array needed if only the provider's wallet is signing (and it's the creator)
      .rpc();
    successLog.value = `Tale '${newTaleName.value}' created successfully. Address: ${talePda.toBase58()}`;
    newTaleName.value = '';
    await fetchTales();
  } catch (e) {
    console.error("Error creating tale:", e);
    errorLog.value = `Error creating tale: ${e.message}`;
  } finally {
    isLoading.value = false;
  }
}

async function fetchTales() {
  if (!program.value) return;
  isLoading.value = true;
  try {
    const fetchedTales = await program.value.account.tale.all();
    tales.value = fetchedTales.map(t => ({ publicKey: t.publicKey.toBase58(), ...t.account }));
    successLog.value = "Tales fetched successfully.";
    if (tales.value.length > 0 && !selectedTaleForEpisode.value) {
        // Auto-select first tale for episodes if none selected
        // selectedTaleForEpisode.value = tales.value[0].publicKey; 
    }
  } catch (e) {
    console.error("Error fetching tales:", e);
    errorLog.value = `Error fetching tales: ${e.message}`;
  } finally {
    isLoading.value = false;
  }
}

function openUpdateTaleModal(tale) {
  taleToUpdate.value = tale;
  updateTaleForm.value.id = tale.publicKey;
  updateTaleForm.value.name = tale.name;
}

async function submitUpdateTaleName() {
  if (!program.value || !publicKey.value || !taleToUpdate.value) return;
  isLoading.value = true;
  errorLog.value = '';
  successLog.value = '';
  try {
    // The PDA address depends on the original name if name is a seed.
    // The Rust code's update_tale_name seeds constraint uses `tale_account.name.as_bytes()`,
    // which refers to the name *before* update. This is correct for finding the account.
    // The new_name is an argument to the method.

    await program.value.methods
      .updateTaleName(updateTaleForm.value.name)
      .accounts({
        taleAccount: new PublicKey(taleToUpdate.value.publicKey),
        creator: publicKey.value, // Assuming current user is the creator
      })
      .rpc();
    successLog.value = `Tale '${taleToUpdate.value.publicKey}' name updated to '${updateTaleForm.value.name}'.`;
    taleToUpdate.value = null;
    await fetchTales();
  } catch (e) {
    console.error("Error updating tale name:", e);
    errorLog.value = `Error updating tale name: ${e.message}`;
  } finally {
    isLoading.value = false;
  }
}

async function deleteTale(talePublicKeyStr) {
  if (!program.value || !publicKey.value) return;
  if (!confirm(`Are you sure you want to delete tale ${talePublicKeyStr}? This will NOT delete its episodes.`)) return;
  isLoading.value = true;
  errorLog.value = '';
  successLog.value = '';
  try {
    await program.value.methods
      .deleteTale()
      .accounts({
        taleAccount: new PublicKey(talePublicKeyStr),
        creator: publicKey.value, // Assuming current user is the creator
      })
      .rpc();
    successLog.value = `Tale ${talePublicKeyStr} deleted.`;
    await fetchTales();
    if (selectedTaleForEpisode.value === talePublicKeyStr) {
        selectedTaleForEpisode.value = null;
        episodes.value = [];
    }
  } catch (e) {
    console.error("Error deleting tale:", e);
    errorLog.value = `Error deleting tale: ${e.message}`;
  } finally {
    isLoading.value = false;
  }
}


// --- Episode CRUD Functions ---
watch(selectedTaleForEpisode, async (newSelectedTale) => {
    if (newSelectedTale) {
        await fetchEpisodesForTale(newSelectedTale);
    } else {
        episodes.value = [];
    }
});

async function createEpisode() {
  if (!program.value || !publicKey.value || !selectedTaleForEpisode.value) {
    errorLog.value = "Program/wallet issue or no parent tale selected.";
    return;
  }
  if (!newEpisodeName.value.trim() || newEpisodeNumber.value <= 0 || !newEpisodeCandyMachineId.value.trim()) {
    errorLog.value = "Episode name, positive number, and Candy Machine ID are required.";
    return;
  }
  isLoading.value = true;
  errorLog.value = '';
  successLog.value = '';

  try {
    const parentTaleKey = new PublicKey(selectedTaleForEpisode.value);
    let candyMachineKey;
    try {
        candyMachineKey = new PublicKey(newEpisodeCandyMachineId.value);
    } catch (keyError) {
        errorLog.value = "Invalid Candy Machine Public Key format.";
        isLoading.value = false;
        return;
    }

    const episodeNumberBuffer = Buffer.alloc(4); // u32 takes 4 bytes
    episodeNumberBuffer.writeUInt32LE(newEpisodeNumber.value, 0);

    const [episodePda] = PublicKey.findProgramAddressSync(
        [
            Buffer.from("episode"),
            parentTaleKey.toBuffer(),
            episodeNumberBuffer // Use the buffer for u32
        ],
        PROGRAM_ID
    );

    await program.value.methods
      .createEpisode(newEpisodeName.value, newEpisodeNumber.value, candyMachineKey)
      .accounts({
        episodeAccount: episodePda,
        tale: parentTaleKey,
        creator: publicKey.value, // This is the signer_authority in Rust, which is tale.creator
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    successLog.value = `Episode '${newEpisodeName.value}' (No. ${newEpisodeNumber.value}) created for tale ${selectedTaleForEpisode.value}. Addr: ${episodePda.toBase58()}`;
    newEpisodeName.value = '';
    newEpisodeNumber.value++; // Auto-increment for next episode
    newEpisodeCandyMachineId.value = '';
    await fetchEpisodesForTale(selectedTaleForEpisode.value);
  } catch (e) {
    console.error("Error creating episode:", e);
    errorLog.value = `Error creating episode: ${e.message}`;
  } finally {
    isLoading.value = false;
  }
}

async function fetchEpisodesForTale(talePublicKeyStr) {
  if (!program.value || !talePublicKeyStr) {
    episodes.value = [];
    return;
  }
  isLoading.value = true;
  errorLog.value = '';
  try {
    const parentTaleKey = new PublicKey(talePublicKeyStr);
    // Fetching all episodes and then filtering can be inefficient for many episodes.
    // A more optimized way would be to use getProgramAccounts with filters if possible,
    // or have an on-chain index. For simplicity, fetching all and filtering.
    const allEpisodes = await program.value.account.episode.all();
    episodes.value = allEpisodes
      .filter(ep => ep.account.tale.equals(parentTaleKey))
      .map(ep => ({ publicKey: ep.publicKey.toBase58(), ...ep.account }))
      .sort((a,b) => a.episodeNumber - b.episodeNumber);
    successLog.value = `Episodes for tale ${talePublicKeyStr} fetched.`;
  } catch (e) {
    console.error("Error fetching episodes:", e);
    errorLog.value = `Error fetching episodes for tale ${talePublicKeyStr}: ${e.message}`;
    episodes.value = [];
  } finally {
    isLoading.value = false;
  }
}

function openUpdateEpisodeModal(episode) {
  episodeToUpdate.value = episode;
  updateEpisodeForm.value.id = episode.publicKey;
  updateEpisodeForm.value.name = episode.name;
  updateEpisodeForm.value.candyMachineId = episode.candyMachineId.toBase58();
}

async function submitUpdateEpisode() {
  if (!program.value || !publicKey.value || !episodeToUpdate.value) return;
  isLoading.value = true;
  errorLog.value = '';
  successLog.value = '';

  try {
    let newCandyKey = null;
    if (updateEpisodeForm.value.candyMachineId.trim()) {
        try {
            newCandyKey = new PublicKey(updateEpisodeForm.value.candyMachineId);
        } catch (keyError) {
            errorLog.value = "Invalid new Candy Machine Public Key format for update.";
            isLoading.value = false;
            return;
        }
    }
    
    const nameOpt = updateEpisodeForm.value.name !== episodeToUpdate.value.name ? updateEpisodeForm.value.name : null;
    const cmOpt = newCandyKey && !newCandyKey.equals(episodeToUpdate.value.candyMachineId) ? newCandyKey : null;


    if (!nameOpt && !cmOpt) {
        errorLog.value = "No changes to update for episode.";
        isLoading.value = false;
        return;
    }

    await program.value.methods
      .updateEpisode(nameOpt, cmOpt)
      .accounts({
        episodeAccount: new PublicKey(episodeToUpdate.value.publicKey),
        authority: publicKey.value, // This is the Episode's authority (Tale's creator)
      })
      .rpc();
    successLog.value = `Episode '${episodeToUpdate.value.publicKey}' updated.`;
    episodeToUpdate.value = null;
    if (selectedTaleForEpisode.value) {
      await fetchEpisodesForTale(selectedTaleForEpisode.value);
    }
  } catch (e) {
    console.error("Error updating episode:", e);
    errorLog.value = `Error updating episode: ${e.message}`;
  } finally {
    isLoading.value = false;
  }
}

async function deleteEpisode(episodePublicKeyStr) {
  if (!program.value || !publicKey.value) return;
  if (!confirm(`Are you sure you want to delete episode ${episodePublicKeyStr}?`)) return;
  isLoading.value = true;
  errorLog.value = '';
  successLog.value = '';
  try {
    await program.value.methods
      .deleteEpisode()
      .accounts({
        episodeAccount: new PublicKey(episodePublicKeyStr),
        authority: publicKey.value, // This is the Episode's authority (Tale's creator)
      })
      .rpc();
    successLog.value = `Episode ${episodePublicKeyStr} deleted.`;
    if (selectedTaleForEpisode.value) {
      await fetchEpisodesForTale(selectedTaleForEpisode.value);
    }
  } catch (e) {
    console.error("Error deleting episode:", e);
    errorLog.value = `Error deleting episode: ${e.message}`;
  } finally {
    isLoading.value = false;
  }
}

</script>

<template>
  <div class="p-4 md:p-8 bg-gray-900 min-h-screen text-gray-100 font-sans">
    <header class="mb-8">
      <h1 class="text-4xl font-bold text-purple-400 mb-2">Solana CRUD Client</h1>
      <div v-if="!connected" class="text-yellow-400">
        Please connect your wallet. (Ensure @solana/wallet-adapter-vue-ui is set up in your app's entry point)
      </div>
      <div v-if="connected && publicKey" class="text-sm text-green-400">
        Connected: {{ publicKey.toBase58() }}
      </div>
      <div vif="connected && !program" class="text-orange-500">
        Program not initialized. Check console and IDL.
      </div>
    </header>

    <div v-if="errorLog" class="my-4 p-3 bg-red-700 text-white rounded-md shadow-lg">{{ errorLog }}</div>
    <div v-if="successLog" class="my-4 p-3 bg-green-700 text-white rounded-md shadow-lg">{{ successLog }}</div>
    <div v-if="isLoading" class="my-4 p-3 bg-blue-700 text-white rounded-md shadow-lg">Loading...</div>

    <section class="mb-12 p-6 bg-gray-800 rounded-xl shadow-2xl">
      <h2 class="text-3xl font-semibold text-purple-300 mb-6">User Management</h2>
      <div class="grid md:grid-cols-2 gap-6 mb-6">
        <div>
          <h3 class="text-xl text-purple-200 mb-2">Create User</h3>
          <input v-model="newUserName" placeholder="User Name" class="input-field mb-2"/>
          <select v-model="newUserType" class="input-field mb-3">
            <option value="Member">Member</option>
            <option value="Admin">Admin</option>
            <option value="Guest">Guest</option>
          </select>
          <button @click="createUser" :disabled="isLoading || !connected || !program" class="btn btn-primary w-full">Create User</button>
        </div>
      </div>

      <h3 class="text-xl text-purple-200 mb-3">Existing Users ({{ users.length }})</h3>
       <button @click="fetchUsers" :disabled="isLoading || !connected || !program" class="btn btn-secondary mb-4">Refresh Users</button>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div v-for="user in users" :key="user.publicKey" class="p-4 bg-gray-700 rounded-lg shadow-md">
          <p class="font-bold text-purple-100 break-all">Name: {{ user.name }}</p>
          <p class="text-sm text-gray-300">Type: {{ Object.keys(user.userType)[0] }}</p>
          <p class="text-xs text-gray-400 break-all">Address: {{ user.publicKey }}</p>
          <p class="text-xs text-gray-400 break-all">Authority: {{ user.authority.toBase58() }}</p>
          <div class="mt-3 flex space-x-2">
            <button @click="openUpdateUserModal(user)" class="btn btn-warning btn-sm">Edit</button>
            <button @click="deleteUser(user.publicKey)" class="btn btn-danger btn-sm">Delete</button>
          </div>
        </div>
      </div>
    </section>

    <section class="mb-12 p-6 bg-gray-800 rounded-xl shadow-2xl">
      <h2 class="text-3xl font-semibold text-teal-300 mb-6">Tale Management</h2>
      <div class="grid md:grid-cols-2 gap-6 mb-6">
        <div>
          <h3 class="text-xl text-teal-200 mb-2">Create Tale</h3>
          <input v-model="newTaleName" placeholder="Tale Name" class="input-field mb-3"/>
          <button @click="createTale" :disabled="isLoading || !connected || !program" class="btn btn-primary w-full">Create Tale</button>
        </div>
      </div>
      <h3 class="text-xl text-teal-200 mb-3">Existing Tales ({{ tales.length }})</h3>
      <button @click="fetchTales" :disabled="isLoading || !connected || !program" class="btn btn-secondary mb-4">Refresh Tales</button>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div v-for="tale in tales" :key="tale.publicKey" class="p-4 bg-gray-700 rounded-lg shadow-md">
          <p class="font-bold text-teal-100 break-all">Name: {{ tale.name }}</p>
          <p class="text-xs text-gray-400 break-all">Address: {{ tale.publicKey }}</p>
          <p class="text-xs text-gray-400 break-all">Creator: {{ tale.creator.toBase58() }}</p>
          <div class="mt-3 flex space-x-2">
             <button @click="openUpdateTaleModal(tale)" class="btn btn-warning btn-sm">Edit Name</button>
            <button @click="deleteTale(tale.publicKey)" class="btn btn-danger btn-sm">Delete</button>
            <button @click="selectedTaleForEpisode = tale.publicKey" class="btn btn-info btn-sm mt-1 w-full">Manage Episodes</button>
          </div>
        </div>
      </div>
    </section>

    <section v-if="selectedTaleForEpisode" class="mb-12 p-6 bg-gray-800 rounded-xl shadow-2xl">
      <h2 class="text-3xl font-semibold text-indigo-300 mb-6">Episode Management for Tale: <span class="text-sm text-indigo-100 break-all">{{ selectedTaleForEpisode }}</span></h2>
      <button @click="selectedTaleForEpisode = null" class="btn btn-outline mb-4">Back to Tales List</button>
      <div class="grid md:grid-cols-2 gap-6 mb-6">
        <div>
            <h3 class="text-xl text-indigo-200 mb-2">Create Episode</h3>
            <input v-model="newEpisodeName" placeholder="Episode Name" class="input-field mb-2"/>
            <input type="number" v-model.number="newEpisodeNumber" placeholder="Episode Number" min="1" class="input-field mb-2"/>
            <input v-model="newEpisodeCandyMachineId" placeholder="Candy Machine ID (PublicKey)" class="input-field mb-3"/>
            <button @click="createEpisode" :disabled="isLoading || !connected || !program" class="btn btn-primary w-full">Create Episode</button>
        </div>
      </div>

      <h3 class="text-xl text-indigo-200 mb-3">Existing Episodes ({{ episodes.length }}) for selected tale</h3>
      <button @click="fetchEpisodesForTale(selectedTaleForEpisode)" :disabled="isLoading || !connected || !program" class="btn btn-secondary mb-4">Refresh Episodes</button>
       <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div v-for="episode in episodes" :key="episode.publicKey" class="p-4 bg-gray-700 rounded-lg shadow-md">
          <p class="font-bold text-indigo-100 break-all">Name: {{ episode.name }} (Ep. {{ episode.episodeNumber }})</p>
          <p class="text-xs text-gray-400 break-all">Address: {{ episode.publicKey }}</p>
          <p class="text-xs text-gray-400 break-all">Candy Machine: {{ episode.candyMachineId.toBase58() }}</p>
          <p class="text-xs text-gray-400 break-all">Authority (Tale Creator): {{ episode.authority.toBase58() }}</p>
          <div class="mt-3 flex space-x-2">
            <button @click="openUpdateEpisodeModal(episode)" class="btn btn-warning btn-sm">Edit</button>
            <button @click="deleteEpisode(episode.publicKey)" class="btn btn-danger btn-sm">Delete</button>
          </div>
        </div>
      </div>
    </section>

    <div v-if="userToUpdate" class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div class="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
        <h3 class="text-2xl text-purple-300 mb-4">Update User: <span class="text-sm text-purple-100 break-all">{{ userToUpdate.publicKey }}</span></h3>
        <input v-model="updateUserForm.name" placeholder="User Name" class="input-field mb-2"/>
        <select v-model="updateUserForm.userType" class="input-field mb-4">
          <option value="Member">Member</option>
          <option value="Admin">Admin</option>
          <option value="Guest">Guest</option>
        </select>
        <div class="flex justify-end space-x-3">
          <button @click="userToUpdate = null" class="btn btn-outline">Cancel</button>
          <button @click="submitUpdateUser" :disabled="isLoading" class="btn btn-primary">Save Changes</button>
        </div>
      </div>
    </div>

    <div v-if="taleToUpdate" class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div class="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
        <h3 class="text-2xl text-teal-300 mb-4">Update Tale Name: <span class="text-sm text-teal-100 break-all">{{ taleToUpdate.publicKey }}</span></h3>
        <input v-model="updateTaleForm.name" placeholder="New Tale Name" class="input-field mb-4"/>
        <div class="flex justify-end space-x-3">
          <button @click="taleToUpdate = null" class="btn btn-outline">Cancel</button>
          <button @click="submitUpdateTaleName" :disabled="isLoading" class="btn btn-primary">Save Changes</button>
        </div>
      </div>
    </div>

     <div v-if="episodeToUpdate" class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div class="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
        <h3 class="text-2xl text-indigo-300 mb-4">Update Episode: <span class="text-sm text-indigo-100 break-all">{{ episodeToUpdate.publicKey }}</span></h3>
        <input v-model="updateEpisodeForm.name" placeholder="Episode Name" class="input-field mb-2"/>
        <input v-model="updateEpisodeForm.candyMachineId" placeholder="New Candy Machine ID" class="input-field mb-4"/>
        <div class="flex justify-end space-x-3">
          <button @click="episodeToUpdate = null" class="btn btn-outline">Cancel</button>
          <button @click="submitUpdateEpisode" :disabled="isLoading" class="btn btn-primary">Save Changes</button>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
/* Basic Tailwind-like styling for inputs and buttons */
.input-field {
  @apply w-full p-3 bg-gray-700 border border-gray-600 rounded-md text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-shadow duration-150 ease-in-out;
}

.btn {
  @apply px-6 py-3 rounded-md font-semibold shadow-md transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed;
}
.btn-sm {
    @apply px-3 py-1.5 text-sm;
}

.btn-primary {
  @apply bg-purple-600 hover:bg-purple-700 text-white focus:ring-purple-500;
}
.btn-secondary {
  @apply bg-gray-600 hover:bg-gray-500 text-gray-100 focus:ring-gray-400;
}
.btn-danger {
  @apply bg-red-600 hover:bg-red-700 text-white focus:ring-red-500;
}
.btn-warning {
  @apply bg-yellow-500 hover:bg-yellow-600 text-gray-900 focus:ring-yellow-400;
}
.btn-info {
  @apply bg-sky-500 hover:bg-sky-600 text-white focus:ring-sky-400;
}
.btn-outline {
  @apply bg-transparent border border-gray-500 hover:bg-gray-700 text-gray-300 focus:ring-gray-400;
}

/* Add some subtle animations/transitions for a more modern feel */
input:focus, button:focus {
    transform: translateY(-1px);
}
button:hover {
    transform: translateY(-1px);
    filter: brightness(1.1);
}
.shadow-2xl {
    box-shadow: 0 25px 50px -12px rgba(0,0,0, 0.35);
}
.rounded-xl {
    border-radius: 0.75rem; /* 12px */
}
</style>