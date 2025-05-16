require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const bodyParser = require('body-parser');

const nftRoutes = require('./routes/nftRoutes');
const designRoutes = require('./routes/designs');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const taleRoutes = require('./routes/taleRoutes');
const { taleNestedEpisodeRouter, individualEpisodeRouter } = require('./routes/episodeRoutes'); // <--- ADD THIS
const mintActivityRoutes = require('./routes/mintActivityRoutes'); // <-- IMPORT NEW ROUTES
const ipfsRoutes = require('./routes/ipfsRoutes'); // Add this

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
// CORS Configuration (adjust origin for production)
const allowedOrigins = [
    process.env.FRONTEND_URL, // Your deployed frontend URL (e.g., https://your-frontend.vercel.app)
    'http://localhost:5173',  // Your local Vue development URL (if you use Vite's default)
    'http://localhost:3000',  // If your frontend runs on 3000 sometimes
    // Add any other origins you need to allow (e.g., preview deployment URLs)
  ].filter(Boolean); // Filter out undefined values if FRONTEND_URL is not set
  
  console.log("Allowed CORS origins:", allowedOrigins); // For debugging
  
  const corsOptions = {
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
        console.error(msg); // Log denied origins
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true, // Important if your frontend needs to send cookies or Authorization headers
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'], // Specify allowed methods
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'], // Specify allowed headers
  };
  
app.use(cors(corsOptions));
app.use(bodyParser.json());

// // Rate Limiter (apply to all requests, or specific routes)
// const limiter = rateLimit({
// 	windowMs: 15 * 60 * 1000, // 15 minutes
// 	max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
// 	standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
// 	legacyHeaders: false, // Disable the `X-RateLimit-*` headers
//     message: 'Too many requests from this IP, please try again after 15 minutes',
// });
// app.use(limiter); // Apply the rate limiting middleware to all requests

// Body Parsers
app.use(express.json({ limit: '1mb' })); // Limit JSON payload size
app.use(express.urlencoded({ extended: true }));

// --- Database Connection ---
if (!process.env.MONGODB_URI) {
    console.error("FATAL ERROR: MONGODB_URI environment variable is not set.");
    process.exit(1);
}
// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('MongoDB connected successfully.');
        // --- Optional: Start Event Listener/Poller Here (If not using webhooks) ---
        // const { startEventListener } = require('./services/eventListenerService');
        // if (process.env.NODE_ENV !== 'test' && process.env.ENABLE_EVENT_LISTENER === 'true') {
        //    console.log("Starting event listener...");
        //    startEventListener();
        // }
    })
    .catch(err => {
        console.error('MongoDB initial connection error:', err.message);
        process.exit(1);
    });

// Handle connection errors after initial connection was established
mongoose.connection.on('error', err => {
  console.error('MongoDB runtime error:', err.message);
});
mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected.');
});

// Routes
app.use('/api/nfts', nftRoutes);
app.use('/api/designs', designRoutes); 
app.use('/api/auth', authRoutes);     // <--- ADD THIS: Mount auth routes
app.use('/api/users', userRoutes);   // <--- ADD THIS: Mount user routes
app.use('/api/tales', taleRoutes);   // <--- ADD THIS: Mount tale routes
app.use('/api/episodes', individualEpisodeRouter); // <--- ADD THIS for /api/episodes/:episodeId routes
app.use('/api/mint-activities', mintActivityRoutes); // <-- USE NEW ROUTES
app.use('/api/ipfs', ipfsRoutes); // Add this line

// Basic root route for health checks
app.get('/', (req, res) => {
    res.status(200).send(`Numbered Edition NFT Backend Running - Status: OK - Timestamp: ${new Date().toISOString()}`);
});

// --- Global 404 Handler ---
app.use((req, res, next) => {
    res.status(404).json({ message: 'Not Found' });
});

// --- Global Error Handler ---
// Needs to have 4 arguments to be recognized by Express as an error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    console.error("Unhandled Server Error:", err.stack || err.message || err);
    // Avoid sending stack trace in production
    const isProduction = process.env.NODE_ENV === 'production';
    res.status(err.status || 500).json({
         message: err.message || 'Internal Server Error',
         error: isProduction ? {} : err, // Only include detailed error in non-production
    });
});
// --- Start Server ---
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
    console.log(`MongoDB URI: ${process.env.MONGODB_URI ? 'Loaded' : 'MISSING!'}`);
    console.log(`Pinata API Key: ${process.env.PINATA_API_KEY ? 'Loaded' : 'MISSING!'}`);
    console.log(`Pinata Secret Key: ${process.env.PINATA_SECRET_API_KEY ? 'Loaded' : 'MISSING!'}`);
});

module.exports = app;