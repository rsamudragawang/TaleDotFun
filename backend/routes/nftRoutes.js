const express = require('express');
const router = express.Router();
const NFT = require('../models/NftModels');

// Get all listed NFTs
router.get('/', async (req, res) => {
  try {
    const nfts = await NFT.find({ status: 'listed' }).sort({ createdAt: -1 });
    res.json(nfts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get an NFT by mintAddress
router.get('/:mintAddress', async (req, res) => {
  try {
    const nft = await NFT.findOne({ mintAddress: req.params.mintAddress });
    if (!nft) {
      return res.status(404).json({ message: 'NFT not found' });
    }
    res.json(nft);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new NFT listing
router.post('/', async (req, res) => {
  try {
    // Check if NFT already exists
    const existingNFT = await NFT.findOne({ mintAddress: req.body.mintAddress });
    if (existingNFT) {
      return res.status(400).json({ message: 'This NFT is already listed' });
    }
    
    const newNFT = new NFT(req.body);
    const savedNFT = await newNFT.save();
    res.status(201).json(savedNFT);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update an NFT listing (e.g., change price)
router.patch('/:mintAddress', async (req, res) => {
  try {
    const updatedNFT = await NFT.findOneAndUpdate(
      { mintAddress: req.params.mintAddress },
      { $set: req.body },
      { new: true }
    );
    
    if (!updatedNFT) {
      return res.status(404).json({ message: 'NFT not found' });
    }
    
    res.json(updatedNFT);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Mark an NFT as sold
router.patch('/:mintAddress/sold', async (req, res) => {
  try {
    const { buyerWallet, transactionId } = req.body;
    
    if (!buyerWallet || !transactionId) {
      return res.status(400).json({ message: 'Buyer wallet and transaction ID are required' });
    }
    
    const updatedNFT = await NFT.findOneAndUpdate(
      { mintAddress: req.params.mintAddress },
      { 
        $set: { 
          status: 'sold',
          buyerWallet,
          transactionId,
          soldAt: Date.now()
        } 
      },
      { new: true }
    );
    
    if (!updatedNFT) {
      return res.status(404).json({ message: 'NFT not found' });
    }
    
    res.json(updatedNFT);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Unlist an NFT
router.patch('/:mintAddress/unlist', async (req, res) => {
  try {
    const updatedNFT = await NFT.findOneAndUpdate(
      { mintAddress: req.params.mintAddress },
      { $set: { status: 'unlisted' } },
      { new: true }
    );
    
    if (!updatedNFT) {
      return res.status(404).json({ message: 'NFT not found' });
    }
    
    res.json(updatedNFT);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get NFTs by seller wallet
router.get('/seller/:walletAddress', async (req, res) => {
  try {
    const nfts = await NFT.find({ sellerWallet: req.params.walletAddress })
      .sort({ createdAt: -1 });
    res.json(nfts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;