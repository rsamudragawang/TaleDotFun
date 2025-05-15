// readium-fun/backend/routes/ipfsRoutes.js
const express = require('express');
const multer = require('multer');
const { handleFileUpload, handleJsonUpload, handleTextUpload } = require('../controllers/ipfsController');
const { protect } = require('../middleware/authMiddleware'); // Assuming you want to protect these routes

const router = express.Router();

// Configure multer for memory storage (to get file buffer)
// You can also configure disk storage if preferred.
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // Example: 10MB file size limit
});

// Route for file uploads (e.g., images, PDFs)
// 'file' should match the field name used in the FormData on the client-side
router.post('/upload-file', protect, upload.single('file'), handleFileUpload);

// Route for JSON uploads
router.post('/upload-json', protect, handleJsonUpload);

// Route for plain text uploads (sent as JSON body with textData and fileName)
router.post('/upload-text', protect, handleTextUpload);

module.exports = router;
