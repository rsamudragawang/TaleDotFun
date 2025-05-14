// readium-fun/backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Adjust path if User.js is elsewhere

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }

  try {
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not defined. Ensure it is set in the .env file.');
      return res.status(500).json({ success: false, message: 'Server configuration error: JWT_SECRET missing.' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id); // Exclude password if it were present

    if (!req.user) {
        return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
    }
    next();
  } catch (err) {
    console.error('Token verification error:', err.message);
    return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
  }
};

const authorize = (...types) => {
  return (req, res, next) => {
    if (!req.user || !types.includes(req.user.type)) {
      return res.status(403).json({
        success: false,
        message: `User type '${req.user ? req.user.type : 'unknown'}' is not authorized to access this route`
      });
    }
    next();
  };
};

module.exports = { protect, authorize };