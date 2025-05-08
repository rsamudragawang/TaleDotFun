import { createRouter, createWebHistory } from 'vue-router';
import Home from './views/Home.vue';
import Create from './views/Create.vue';
import Marketplace from './views/Marketplace.vue';
import NFTDetail from './views/NFTDetail.vue';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
  },
  {
    path: '/create',
    name: 'Create',
    component: Create,
  },
  {
    path: '/marketplace',
    name: 'Marketplace',
    component: Marketplace,
  },
  {
    path: '/nft/:mint',
    name: 'NFTDetail',
    component: NFTDetail,
    props: true,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;