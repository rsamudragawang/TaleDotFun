// src/services/candyMachine.js

import { publicKey } from '@metaplex-foundation/umi';
import { 
  findCandyMachineByAddressOperation, 
  mintV2, 
  fetchCandyGuard
} from '@metaplex-foundation/mpl-candy-machine';

export class CandyMachineService {
  constructor(umi, candyMachineAddress) {
    this.umi = umi;
    this.candyMachineAddress = publicKey(candyMachineAddress);
    this.candyMachine = null;
    this.candyGuard = null;
  }

  async fetchCandyMachine() {
    try {
      // Fetch candy machine
      this.candyMachine = await findCandyMachineByAddressOperation(this.umi, {
        address: this.candyMachineAddress,
      }).sendAndConfirm();

      return {
        address: this.candyMachineAddress,
        name: this.candyMachine.data.name,
        symbol: this.candyMachine.data.symbol,
        sellerFeeBasisPoints: this.candyMachine.data.sellerFeeBasisPoints,
        isMutable: this.candyMachine.data.isMutable,
        price: this.candyMachine.data.price,
        itemsAvailable: Number(this.candyMachine.data.itemsAvailable),
        itemsMinted: Number(this.candyMachine.data.itemsMinted),
        itemsRemaining: Number(this.candyMachine.data.itemsAvailable) - Number(this.candyMachine.data.itemsMinted),
        creators: this.candyMachine.data.creators,
        collectionMint: this.candyMachine.collectionMint.toString()
      };
    } catch (error) {
      console.error("Error fetching candy machine:", error);
      throw error;
    }
  }

  async fetchCandyGuard() {
    try {
      if (!this.candyMachine) {
        await this.fetchCandyMachine();
      }

      if (this.candyMachine.mintAuthority) {
        this.candyGuard = await fetchCandyGuard(this.umi, {
          candyGuard: this.candyMachine.mintAuthority,
        });
        
        return this.candyGuard;
      }
      
      return null;
    } catch (error) {
      console.error("Error fetching candy guard:", error);
      throw error;
    }
  }

  async mintNft() {
    try {
      if (!this.candyMachine) {
        await this.fetchCandyMachine();
      }

      const mintResult = await mintV2(this.umi, {
        candyMachine: this.candyMachineAddress,
        collectionUpdateAuthority: this.candyMachine.collectionMint,
      }).sendAndConfirm();

      return {
        signature: mintResult.signature,
        nftMint: mintResult.nftMint?.toString(),
      };
    } catch (error) {
      console.error("Error minting NFT:", error);
      throw error;
    }
  }

  formatPrice(lamports) {
    return (lamports / 1000000000).toFixed(2);
  }
}

export default CandyMachineService;