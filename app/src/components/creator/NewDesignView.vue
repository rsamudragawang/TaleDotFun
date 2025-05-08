<template>
  <div class="creator-view">
    <h1>Create New NFT Edition Series</h1>
    <p>
      Define the details for your new collection. The backend will prepare the
      necessary metadata for each edition on IPFS.
    </p>
    <hr />

    <CreateDesignForm @intent-registered="handleIntentRegistered" />

    <!-- Display results after intent registration -->
    <div v-if="registrationIntentData" class="post-intent-section">
      <hr />
      <h3>Step 2: Register Design On-Chain</h3>
      <p>
        Your design details and metadata have been prepared and pinned to IPFS.
        Now, you need to register this design with the on-chain program. This
        will create a 'Design State' account on Solana that tracks your edition
        series.
      </p>
      <RegisterOnChain
        :design-intent-data="registrationIntentData"
        @registration-confirmed="handleRegistrationConfirmed"
      />
    </div>

    <div v-if="onChainRegisteredData" class="post-registration-section">
       <hr />
      <h3>Step 3: Mint Editions</h3>
       <p>✅ Design successfully registered on-chain!</p>
       <p>On-Chain State PDA: {{ onChainRegisteredData.onChainDesignStatePda }}</p>
       <p>You can now proceed to mint the individual NFT editions into your wallet. Go to the 'Manage Designs' page or use the component below if implemented.</p>
       <!-- You could embed MintEditions here, but typically it's better on a separate management page -->
       <!-- <MintEditions :designId="onChainRegisteredData.designId" :baseDesign="onChainRegisteredData.designData" /> -->
        <router-link :to="{ name: 'ManageDesign', params: { designId: onChainRegisteredData.designId } }">
            Go to Manage Design & Mint Editions
        </router-link>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router'; // If using Vue Router
import CreateDesignForm from './CreateDesignForm.vue'; // The form component
import RegisterOnChain from './RegisterOnChain.vue'; // The new component for step 2
// import MintEditions from '@/components/creator/MintEditions.vue'; // Might embed later

const registrationIntentData = ref(null);
const onChainRegisteredData = ref(null);
const router = useRouter(); // If using router

// This function is called when the CreateDesignForm successfully emits the event
function handleIntentRegistered(intentData) {
  console.log('Intent registered event received in parent:', intentData);
  registrationIntentData.value = intentData;
  onChainRegisteredData.value = null; // Reset step 3 if user re-registers intent
}

// This function is called when RegisterOnChain successfully emits the event
function handleRegistrationConfirmed(registrationData) {
    console.log('On-chain registration confirmed event received in parent:', registrationData);
    onChainRegisteredData.value = registrationData;
    // Optionally navigate away or just show the next step info
     // Example navigation:
     // router.push({ name: 'ManageDesign', params: { designId: registrationData.designId } });
}
</script>

<style scoped>
.creator-view {
  max-width: 700px;
  margin: 20px auto;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 8px;
}
hr {
    margin: 20px 0;
    border: 0;
    border-top: 1px solid #eee;
}
.post-intent-section, .post-registration-section {
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px dashed #eee;
}
</style>