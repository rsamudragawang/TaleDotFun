// readium-fun/backend/controllers/ipfsController.js
const { pinFileBufferToIPFS, pinJSONToIPFS, pinTextAsFileToIPFS } = require('../services/pinataServiceBE'); // Assuming you rename or use this path

// @desc    Upload a file to IPFS via Pinata
// @route   POST /api/ipfs/upload-file
// @access  Private (requires auth, handled by middleware in routes)
exports.handleFileUpload = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    // req.file is populated by multer. It contains:
    // req.file.buffer: The file data as a Buffer
    // req.file.originalname: The original name of the file
    // req.file.mimetype: The MIME type of the file

    const pinataResponse = await pinFileBufferToIPFS(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    res.status(200).json({
      success: true,
      message: 'File uploaded to IPFS successfully via Pinata.',
      ipfsHash: pinataResponse.IpfsHash,
      pinSize: pinataResponse.PinSize,
      timestamp: pinataResponse.Timestamp,
      imageUrl: `https://gateway.pinata.cloud/ipfs/${pinataResponse.IpfsHash}`, // Convenience URL
    });
  } catch (error) {
    console.error('IPFS File Upload Controller Error:', error);
    // next(error) will pass it to your global error handler
    // or you can send a specific response:
    res.status(500).json({ success: false, message: error.message || 'Server error during file upload.' });
  }
};

// @desc    Upload JSON data to IPFS via Pinata
// @route   POST /api/ipfs/upload-json
// @access  Private
exports.handleJsonUpload = async (req, res, next) => {
  try {
    const jsonData = req.body.jsonData; // Expecting { "jsonData": { ... } } in request body
    const pinataName = req.body.name || `json-data-${Date.now()}.json`;

    if (!jsonData || typeof jsonData !== 'object') {
      return res.status(400).json({ success: false, message: 'jsonData (object) is required in the request body.' });
    }

    const pinataResponse = await pinJSONToIPFS(jsonData, pinataName);

    res.status(200).json({
      success: true,
      message: 'JSON data uploaded to IPFS successfully via Pinata.',
      ipfsHash: pinataResponse.IpfsHash,
      pinSize: pinataResponse.PinSize,
      timestamp: pinataResponse.Timestamp,
      metadataUrl: `https://gateway.pinata.cloud/ipfs/${pinataResponse.IpfsHash}`,
    });
  } catch (error) {
    console.error('IPFS JSON Upload Controller Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error during JSON upload.' });
  }
};

// @desc    Upload plain text (as a file) to IPFS via Pinata
// @route   POST /api/ipfs/upload-text
// @access  Private
exports.handleTextUpload = async (req, res, next) => {
  try {
    const { textData, fileName } = req.body;

    if (!textData || typeof textData !== 'string') {
      return res.status(400).json({ success: false, message: 'textData (string) is required.' });
    }
    if (!fileName || typeof fileName !== 'string') {
      return res.status(400).json({ success: false, message: 'fileName (string) is required.' });
    }

    const pinataResponse = await pinTextAsFileToIPFS(textData, fileName);

    res.status(200).json({
      success: true,
      message: 'Text data uploaded as file to IPFS successfully via Pinata.',
      ipfsHash: pinataResponse.IpfsHash,
      pinSize: pinataResponse.PinSize,
      timestamp: pinataResponse.Timestamp,
      fileUrl: `https://gateway.pinata.cloud/ipfs/${pinataResponse.IpfsHash}`,
    });
  } catch (error) {
    console.error('IPFS Text Upload Controller Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error during text upload.' });
  }
};
