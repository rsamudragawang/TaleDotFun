<template>
  <div class="tale-card">
    <img
      v-if="nft.image"
      :src="nft.image"
      :alt="nft.name"
      class="tale-cover-image"
      @error="handleImageError"
    />
    <img
      v-else
      src="https://placehold.co/600x400/gray/white?text=No+Image"
      alt="Default NFT Cover"
      class="tale-cover-image"
    />
    <div class="tale-card-content">
      <h3 class="tale-title">{{ nft.name || 'Unnamed NFT' }}</h3>
      <p class="tale-meta">Creator: {{ shortenAddress(nft.creator) }}</p>
      <p class="tale-meta">Price: {{ nft.price != null ? nft.price.toFixed(3) : '--' }} SOL</p>
      <p class="cm-detail-item">
        Remaining: <span class="cm-detail-value">{{ nft.itemsAvailable != null ? nft.itemsRemaining : '--' }} / {{ nft.itemsAvailable != null ? nft.itemsAvailable : '??' }}</span>
      </p>
      <p class="tale-meta">Minted: <span class="cm-detail-value">{{ nft.itemsMinted != null ? nft.itemsMinted : '--' }}</span></p>
      <button class="btn btn-info read-more-button">Mint & Get Special Access</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'NFTCard',
  props: {
    nft: {
      type: Object,
      required: true
    },
    showBuyButton: {
      type: Boolean,
      default: false
    }
  },
  setup() {
    const handleImageError = (event) => {
      event.target.src = 'https://placehold.co/600x400/gray/white?text=No+Image';
    };
    const shortenAddress = (address, chars = 6) => address ? `${address.slice(0, chars)}...${address.slice(-chars)}` : '';
    return {
      handleImageError,
      shortenAddress
    };
  },
  emits: ['buy']
};
</script>

<!-- No extra style needed, uses global .tale-card etc. from Home.vue -->