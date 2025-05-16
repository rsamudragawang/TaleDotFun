// import { createRouter, createWebHistory } from 'vue-router';
// import Home from './views/Home.vue';
// import Create from './views/Create.vue';
// import Marketplace from './views/Marketplace.vue';
// import NFTDetail from './views/NFTDetail.vue';

// const routes = [
//   {
//     path: '/',
//     name: 'Home',
//     component: Home,
//   },
//   {
//     path: '/create',
//     name: 'Create',
//     component: Create,
//   },
//   {
//     path: '/marketplace',
//     name: 'Marketplace',
//     component: Marketplace,
//   },
//   {
//     path: '/nft/:mint',
//     name: 'NFTDetail',
//     component: NFTDetail,
//     props: true,
//   },
// ];

// const router = createRouter({
//   history: createWebHistory(),
//   routes,
// });

// export default router;

import { createRouter, createWebHistory } from 'vue-router';
import Home from './views/Home.vue'; // Your new Home view
// import Create from './views/Create.vue'; // Keep if you have this separate NFT creation page
// import Marketplace from './views/Marketplace.vue'; // Keep if you have this
// import NFTDetail from './views/NFTDetail.vue'; // Keep if you have this

// Components that will also act as views/pages
import Auth from './components/auth.vue'; // Or './views/Auth.vue' if you move it
import TaleManager from './components/TaleManager.vue';
import CandyMachineCreator from './components/CandyMachineCreator.vue';
import MintComponent from './components/MintComponent.vue';
// import Governance from './components/Governance.vue';
import GovernanceDetail from './views/GovernanceDetail.vue';
import Governance from './views/Governance.vue';
import LaunchNFT from './views/LaunchNft.vue';
import PublishNFT from './views/PublishNft.vue';
import CreateSeries from './views/CreateSeries.vue';
import CreateProposal from './views/CreateProposal.vue';
import DetailSeries from './views/DetailSeries.vue';

// If you have a specific view for Tale Details that might use EpisodeManager
const TaleDetailView = () => import('./views/TaleDetailView.vue'); // Example for lazy loading

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
  },
  {
    path: '/profile',
    name: 'Auth',
    component: Auth,
  },
  {
    path: '/tales', // Main page to manage and view own/all tales
    name: 'Tales',
    component: TaleManager,
  },
  {
    path: '/cm', // Main page to manage and view own/all tales
    name: 'CM',
    component: CandyMachineCreator,
  },
  {
    path: '/tales/:id', // Detail page for a single tale, where EpisodeManager would be used
    name: 'TaleDetail',
    component: TaleDetailView, // Create this view to show tale details and embed EpisodeManager
    props: true,
  },
  {
    path: '/governance',
    name: 'Governance',
    component: Governance,
  },
  {
    path: '/governance/:id',
    name: 'GovernanceDetail',
    component: GovernanceDetail,
  },
  {
    path: '/create-series',
    name: 'CreateSeries',
    component: CreateSeries
  },
  {
    path: '/mint/:candyMachineAddress', // General mint page, or make it dynamic like /mint/:candyMachineAddress
    name: 'MintPage',
    component: MintComponent, // You might pass a CM ID as a prop here if dynamic
    props: true
  },
  {
    path: '/mint', // Fallback or general mint page
    name: 'MintGeneral',
    component: MintComponent, // This will require MintComponent to handle a missing prop
    // or you can redirect or show a CM selector here.
    // props: (route) => ({ candyMachineAddress: route.query.cmid }) // Example for query param
  },
  // Example of other routes you might have had:
  // {
  //   path: '/create-nft', // A general NFT creation page (if different from CM)
  //   name: 'Create',
  //   component: Create,
  // },
  // {
  //   path: '/marketplace',
  //   name: 'Marketplace',
  //   component: Marketplace,
  // },
  // {
  //   path: '/nft/:mint', // For viewing a specific NFT
  //   name: 'NFTDetail',
  //   component: NFTDetail,
  //   props: true,
  // },
  {
    path: '/launch-nft',
    name: 'LaunchNFT',
    component: LaunchNFT,
  },
  {
    path: '/publish-nft',
    name: 'PublishNFT',
    component: PublishNFT,
  },
  {
    path: '/create-proposal',
    name: 'CreateProposal',
    component: CreateProposal,
  },
  {
    path: '/detail-series/:id',
    name: 'DetailSeries',
    component: DetailSeries,
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL || '/'), // Ensure BASE_URL is correct for deployment
  routes,
});

export default router;