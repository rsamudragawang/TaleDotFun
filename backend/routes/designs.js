// routes/designs.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator'); // Import validator
const { PublicKey, LAMPORTS_PER_SOL } = require('@solana/web3.js'); // Use for address validation
const { pinFileToIPFS, pinJSONToIPFS, unpinFromIPFS } = require('../services/pinataService');
const { hashDesignId } = require('../services/hashingService');
const NftDesignDefinition = require('../models/NftDesignDefinition');
const MintedEditionInfo = require('../models/MintedEditionInfo');

// --- Multer Setup ---
const storage = multer.memoryStorage();
const imageFileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('File upload error: Only image files are allowed!'), false);
    }
};
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: imageFileFilter
});

// --- Validation Rules ---
const designDefinitionValidationRules = () => {
    return [
        body('name').notEmpty().trim().isLength({ min: 1, max: 50 }).withMessage('Name is required (1-50 chars).'),
        body('description').optional().trim().isLength({ max: 500 }).withMessage('Description cannot exceed 500 chars.'),
        body('totalSlots').isInt({ min: 1, max: 10000 }).withMessage('Total Editions must be a number between 1 and 10000.'),
        body('priceSOL').isFloat({ min: 0 }).withMessage('Price must be a non-negative number.'),
        body('creatorWallet').isString().custom((value) => {
            try {
                new PublicKey(value); // Validate if it's a valid Solana public key format
                return true;
            } catch (e) {
                throw new Error('Invalid Creator Wallet address.');
            }
        }).withMessage('Valid Creator Wallet address is required.'),
        body('attributes').optional().isString().custom((value) => {
            if (!value) return true; // Optional is fine
            try {
                const parsed = JSON.parse(value);
                if (!Array.isArray(parsed)) throw new Error();
                // Could add more checks here, e.g., ensure items are objects with trait_type/value
                return true;
            } catch (e) {
                throw new Error('Attributes must be a valid JSON array string.');
            }
        }),
        body('sellerFeeBasisPoints').optional().isInt({ min: 0, max: 10000 }).withMessage('Royalty must be between 0 and 10000 (0% - 100%).'),
        // Check for image file separately using multer
    ];
};

// --- Route Definitions ---

// --- Endpoint for Creator A to register the *intent* for a new design ---
router.post(
    '/register-intent',
    upload.single('image'), // Multer middleware for image upload
    designDefinitionValidationRules(), // Validation middleware
    async (req, res) => {
        // 1. Handle Validation Results
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            // Also check if multer added an error due to file type
             if (req.fileValidationError) {
                return res.status(400).json({ message: req.fileValidationError.message });
             }
            return res.status(400).json({ errors: errors.array() });
        }
        if (!req.file) { // Check if file was uploaded after validation passes
            return res.status(400).json({ errors: [{ msg: 'Image file is required.' }] });
        }

        // Keep track of created resources for potential cleanup on error
        let createdDesign = null;
        const pinnedMetadataURIs = [];
        let imageIpfsUri = null;

        try {
            const {
                name, description, totalSlots, priceSOL, creatorWallet, attributes, sellerFeeBasisPoints
            } = req.body;
            const imageFile = req.file;
            const numTotalSlots = parseInt(totalSlots);
            const numPriceSOL = parseFloat(priceSOL);

            // 2. Generate unique ID and hash it
            const designId = uuidv4();
            const { hashBytes, hashHex } = hashDesignId(designId);
            console.log(`Processing design definition for ID: ${designId}`);

            // 3. Pin Image to IPFS
            const uniqueImageName = `${name.replace(/[^a-zA-Z0-9]/g, '_')}_${designId}.${imageFile.originalname.split('.').pop()}`;
            imageIpfsUri = await pinFileToIPFS(imageFile.buffer, uniqueImageName);
            console.log(`Image pinned for ${designId}: ${imageIpfsUri}`);

            // 4. Prepare Base Metadata & Save Initial Design Definition
            const parsedAttributes = attributes ? JSON.parse(attributes) : [];
            const feeBps = sellerFeeBasisPoints !== undefined ? parseInt(sellerFeeBasisPoints) : 500;

            const baseMetadata = {
                name: name, // Base name
                symbol: "NUMEDNFT", // Your symbol
                description: description || "",
                seller_fee_basis_points: feeBps,
                image: imageIpfsUri,
                attributes: parsedAttributes,
                properties: {
                    files: [{ uri: imageIpfsUri, type: imageFile.mimetype }],
                    category: "image",
                    creators: [{ address: creatorWallet, share: 100 }],
                },
            };

            createdDesign = new NftDesignDefinition({
                designId,
                designIdHashHex: hashHex,
                creatorWallet,
                baseName: name,
                description,
                publicImageIpfsUri: imageIpfsUri,
                totalEditions: numTotalSlots,
                pricePerEditionLamports: Math.round(numPriceSOL * LAMPORTS_PER_SOL),
                baseMetadata: baseMetadata,
                status: 'processing_metadata',
             });
             await createdDesign.save();
             console.log(`Saved initial DesignDefinition for ${designId}`);

            // --- 5. Loop to generate and pin metadata for EACH edition ---
            const editionInfosToSave = [];
            console.log(`Generating and pinning metadata for ${numTotalSlots} editions...`);

            for (let i = 1; i <= numTotalSlots; i++) {
                // Add a small delay to be polite to Pinata API
                if (i > 1) await new Promise(resolve => setTimeout(resolve, 150)); // 150ms delay

                const editionMetadata = {
                    ...baseMetadata,
                    name: `${baseMetadata.name} #${i}`,
                    attributes: [
                         ...baseMetadata.attributes,
                         { trait_type: "Edition", value: `${i}/${numTotalSlots}` }
                    ],
                };

                const metadataJsonName = `metadata_${designId}_edition_${i}.json`;
                const editionMetadataUri = await pinJSONToIPFS(editionMetadata, metadataJsonName);
                pinnedMetadataURIs.push(editionMetadataUri); // Track for potential cleanup

                editionInfosToSave.push({
                    designId: designId,
                    editionNumber: i,
                    metadataIpfsUri: editionMetadataUri,
                    status: 'unminted',
                });
                 console.log(`Pinned metadata for Edition #${i}: ${editionMetadataUri}`);
            }

            // Batch insert all edition info records
            await MintedEditionInfo.insertMany(editionInfosToSave);
            console.log(`Inserted ${editionInfosToSave.length} MintedEditionInfo records for ${designId}`);

            // --- 6. Update final status and respond ---
            createdDesign.status = 'metadata_ready';
            await createdDesign.save();

            // Respond with necessary info for frontend's next step (on-chain registration)
            res.status(201).json({
                message: `Successfully generated metadata for ${numTotalSlots} editions.`,
                designId: designId,
                // Include data needed for the 'register_design' on-chain call
                onChainCallParams: {
                    designIdHash: Array.from(hashBytes), // Byte array
                    sharedMetadataUri: createdDesign.publicImageIpfsUri, // NOTE: On-chain might store base image or base metadata? Revisit program logic if needed. Our program uses sharedMetadataUri for the IPFS JSON link.
                    priceLamports: createdDesign.pricePerEditionLamports,
                    totalSlots: createdDesign.totalEditions,
                 },
                // designData: createdDesign, // Optionally return full design doc
            });

        } catch (error) {
            console.error('Error in /register-intent route:', error);

            // --- Cleanup Attempt on Error ---
            // If something failed partway, try to unpin assets and mark DB record as error
            if (pinnedMetadataURIs.length > 0) {
                console.warn(`Attempting cleanup: Unpinning ${pinnedMetadataURIs.length} metadata files for failed design ${createdDesign?.designId || 'unknown'}...`);
                // Unpin metadata JSONs (fire and forget, don't block response)
                pinnedMetadataURIs.forEach(uri => unpinFromIPFS(uri).catch(e => console.error("Cleanup Error (Metadata Unpin):", e.message)));
            }
            if (imageIpfsUri) {
                // Also unpin image if metadata pinning failed
                 console.warn(`Attempting cleanup: Unpinning image ${imageIpfsUri}...`);
                 unpinFromIPFS(imageIpfsUri).catch(e => console.error("Cleanup Error (Image Unpin):", e.message));
            }
             // Mark design as error in DB if it was created
             if (createdDesign && createdDesign._id && createdDesign.status !== 'metadata_ready') {
                try {
                   await NftDesignDefinition.findByIdAndUpdate(createdDesign._id, { status: 'error', errorMessage: error.message });
                   console.log(`Marked design ${createdDesign.designId} as error in DB.`);
                } catch (updateError) {
                    console.error("Cleanup Error (DB Update): Failed to mark design as error status:", updateError);
                }
             }
             // Delete already inserted edition info if needed
             if (createdDesign?.designId) {
                MintedEditionInfo.deleteMany({ designId: createdDesign.designId }).catch(e => console.error("Cleanup Error (EditionInfo Delete):", e.message));
             }

            res.status(500).json({ message: error.message || 'Server error during design definition' });
        }
    }
);

// --- Other routes remain largely the same ---

// Endpoint for Creator A to confirm successful on-chain registration
router.post(
    '/:designId/confirm-registered',
    [ // Validation for this endpoint
        body('onChainDesignStatePda').isString().custom((value) => {
             try { new PublicKey(value); return true; } catch (e) { throw new Error('Invalid On-Chain PDA address.'); }
        }),
        // body('transactionSignature').optional().isString().isLength({ min: 80, max: 90 }) // Basic check
    ],
    async (req, res) => {
         const errors = validationResult(req);
        if (!errors.isEmpty()) {
             return res.status(400).json({ errors: errors.array() });
        }
        // ... (rest of the logic as provided before) ...
         try {
             const { designId } = req.params;
             const { onChainDesignStatePda /*, transactionSignature */ } = req.body;

             const design = await NftDesignDefinition.findOne({ designId });
             if (!design) return res.status(404).json({ message: 'Design not found.' });
             if (design.status !== 'pending_registration') {
                 return res.status(400).json({ message: `Design status is already ${design.status}.` });
             }

             design.onChainDesignStatePda = onChainDesignStatePda;
             design.status = 'active'; // Now ready for buyers
             await design.save();

             console.log(`Design ${designId} marked as active. On-chain PDA: ${onChainDesignStatePda}`);
             res.json({ message: 'Design registration confirmed and active.', design });

         } catch (error) {
             console.error('Error confirming design registration:', error);
             res.status(500).json({ message: error.message || 'Server error confirming registration' });
         }
    }
);


// Get available designs for buyers
router.get('/active', async (req, res) => {
     // ... (logic as provided before) ...
     try {
            const designs = await NftDesignDefinition.find({ status: 'active' })
                .sort({ createdAt: -1 })
                .limit(parseInt(req.query.limit) || 50);

            const responseData = designs.map(d => ({
                designId: d.designId,
                creatorWallet: d.creatorWallet,
                name: d.baseName, // Return base name
                description: d.description,
                imageUrl: d.publicImageIpfsUri,
                priceLamports: d.pricePerEditionLamports,
                totalSlots: d.totalEditions,
                slotsRemaining: d.totalEditions - d.slotsPurchasedCount,
                onChainDesignStatePda: d.onChainDesignStatePda,
                designIdHashHex: d.designIdHashHex,
            }));
            res.json(responseData);
        } catch (error) {
            console.error('Error fetching active designs:', error);
            res.status(500).json({ message: 'Error fetching active designs' });
        }
});

// Get unminted editions for creator
router.get('/:designId/unminted-editions', async (req, res) => {
    // ... (logic as provided before) ...
    try {
            const { designId } = req.params;
             const unminted = await MintedEditionInfo.find({
                designId: designId,
                status: 'unminted'
             }).sort({ editionNumber: 1 });
             res.json(unminted);
        } catch (error) {
             console.error(`Error fetching unminted editions for ${req.params.designId}:`, error);
             res.status(500).json({ message: 'Error fetching unminted editions' });
        }
});

// Confirm edition minted
router.post(
    '/editions/:editionDbId/confirm-minted',
     [ // Validation
        body('onChainNftMint').isString().custom((value) => {
             try { new PublicKey(value); return true; } catch (e) { throw new Error('Invalid On-Chain NFT Mint address.'); }
        }),
         body('ownerWallet').isString().custom((value) => {
             try { new PublicKey(value); return true; } catch (e) { throw new Error('Invalid Owner Wallet address.'); }
        }),
        // body('transactionSignature').optional().isString(),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
             return res.status(400).json({ errors: errors.array() });
        }
         // ... (rest of the logic as provided before) ...
        try {
             const { editionDbId } = req.params;
             const { onChainNftMint, transactionSignature, ownerWallet } = req.body;

             const updatedEdition = await MintedEditionInfo.findByIdAndUpdate(editionDbId, {
                onChainNftMint: onChainNftMint,
                status: 'minted',
                currentOwnerWallet: ownerWallet,
             }, { new: true });

             if (!updatedEdition) {
                return res.status(404).json({ message: "Edition info not found."});
             }
              res.json({ message: "Edition marked as minted.", editionInfo: updatedEdition });

        } catch (error) {
              console.error(`Error confirming mint for edition ${req.params.editionId}:`, error);
             res.status(500).json({ message: 'Error confirming mint' });
        }
    }
);


// Get purchased slots
router.get('/:designId/purchased-slots', async (req, res) => {
     // ... (logic as provided before) ...
     try {
        const { designId } = req.params;
        const purchases = await PurchasedSlotNft.find({ designId })
            .sort({ purchaseNumber: 1 });
        res.json(purchases);
    } catch (error) {
        console.error(`Error fetching purchased slots for design ${req.params.designId}:`, error);
        res.status(500).json({ message: 'Error fetching purchased slots' });
    }
});


module.exports = router;