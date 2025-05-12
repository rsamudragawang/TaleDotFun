// readium-fun/backend/controllers/taleController.js
const Tale = require('../models/Tale');
const User = require('../models/User'); // To verify author details if needed

// @desc    Create a new tale
// @route   POST /api/tales
// @access  Private (Creator only - enforced by middleware)
exports.createTale = async (req, res, next) => {
  try {
    // req.user is populated by the 'protect' middleware
    // The 'authorize('creator')' middleware ensures req.user.type is 'creator'

    const { title, content, genre, status, coverImage, tags } = req.body;

    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Title and content are required.' });
    }

    const tale = await Tale.create({
      title,
      content,
      genre,
      status,
      coverImage,
      tags,
      author: req.user.id, // Set author to the logged-in user's ID
      authorWalletAddress: req.user.walletAddress, // Store wallet address
    });

    res.status(201).json({
      success: true,
      data: tale,
    });
  } catch (error) {
    console.error('Error creating tale:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    next(error); // Pass to global error handler
  }
};

// @desc    Get all tales (e.g., for public listing, can be paginated)
// @route   GET /api/tales
// @access  Public (or Private depending on your app's needs)
exports.getAllTales = async (req, res, next) => {
  try {
    // Basic query for published tales, can be expanded with pagination, filtering, sorting
    // Example: only fetch 'published' tales for public view
    let query = Tale.find({ status: 'published' }).populate({
        path: 'author',
        select: 'name walletAddress type' // Select fields from User to populate
    }).sort({ createdAt: -1 }); // Sort by newest first

    // Pagination (example)
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Tale.countDocuments({ status: 'published' });

    query = query.skip(startIndex).limit(limit);

    const tales = await query;

    // Pagination result
    const pagination = {};
    if (endIndex < total) {
      pagination.next = { page: page + 1, limit };
    }
    if (startIndex > 0) {
      pagination.prev = { page: page - 1, limit };
    }

    res.status(200).json({
      success: true,
      count: tales.length,
      pagination,
      data: tales,
    });
  } catch (error) {
    console.error('Error getting all tales:', error);
    next(error);
  }
};

// @desc    Get a single tale by its ID
// @route   GET /api/tales/:id
// @access  Public (or Private)
exports.getTaleById = async (req, res, next) => {
  try {
    const tale = await Tale.findById(req.params.id).populate({
        path: 'author',
        select: 'name walletAddress type'
    });

    if (!tale) {
      return res.status(404).json({ success: false, message: `Tale not found with id of ${req.params.id}` });
    }

    // Optional: If only published tales are public, add a check here if not handled by query
    // if (tale.status !== 'published' && (!req.user || req.user.id.toString() !== tale.author.toString())) {
    //    return res.status(404).json({ success: false, message: `Tale not found or not published` });
    // }

    res.status(200).json({
      success: true,
      data: tale,
    });
  } catch (error) {
    console.error(`Error getting tale ${req.params.id}:`, error);
    if (error.name === 'CastError') { // Invalid ObjectId format
        return res.status(400).json({ success: false, message: 'Invalid Tale ID format.' });
    }
    next(error);
  }
};

// @desc    Update a tale
// @route   PUT /api/tales/:id
// @access  Private (Author of the tale or Admin)
exports.updateTale = async (req, res, next) => {
  try {
    let tale = await Tale.findById(req.params.id);

    if (!tale) {
      return res.status(404).json({ success: false, message: `Tale not found with id of ${req.params.id}` });
    }

    // Check ownership: User must be the author or an admin
    if (tale.author.toString() !== req.user.id && req.user.type !== 'admin') {
      return res.status(403).json({ success: false, message: 'User not authorized to update this tale' });
    }

    // Fields that can be updated
    const { title, content, genre, status, coverImage, tags } = req.body;
    const updateFields = {};
    if (title) updateFields.title = title;
    if (content) updateFields.content = content;
    if (genre) updateFields.genre = genre;
    if (status) updateFields.status = status;
    if (coverImage !== undefined) updateFields.coverImage = coverImage; // Allow setting empty string
    if (tags) updateFields.tags = tags;

    if (Object.keys(updateFields).length === 0) {
        return res.status(400).json({ success: false, message: 'No fields provided for update.' });
    }

    tale = await Tale.findByIdAndUpdate(req.params.id, updateFields, {
      new: true, // Return the modified document
      runValidators: true, // Run schema validators on update
    }).populate({ path: 'author', select: 'name walletAddress type'});

    res.status(200).json({
      success: true,
      data: tale,
    });
  } catch (error) {
    console.error(`Error updating tale ${req.params.id}:`, error);
    if (error.name === 'CastError') {
        return res.status(400).json({ success: false, message: 'Invalid Tale ID format.' });
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    next(error);
  }
};

// @desc    Delete a tale
// @route   DELETE /api/tales/:id
// @access  Private (Author of the tale or Admin)
exports.deleteTale = async (req, res, next) => {
  try {
    const tale = await Tale.findById(req.params.id);

    if (!tale) {
      return res.status(404).json({ success: false, message: `Tale not found with id of ${req.params.id}` });
    }

    // Check ownership: User must be the author or an admin
    if (tale.author.toString() !== req.user.id && req.user.type !== 'admin') {
      return res.status(403).json({ success: false, message: 'User not authorized to delete this tale' });
    }

    await tale.deleteOne(); // Mongoose v6+ uses deleteOne() on the document

    res.status(200).json({
      success: true,
      data: {}, // Or a message: { message: 'Tale deleted successfully' }
    });
  } catch (error) {
    console.error(`Error deleting tale ${req.params.id}:`, error);
     if (error.name === 'CastError') {
        return res.status(400).json({ success: false, message: 'Invalid Tale ID format.' });
    }
    next(error);
  }
};

// @desc    Get all tales by a specific author (walletAddress)
// @route   GET /api/tales/author/:walletAddress
// @access  Public (or Private)
exports.getTalesByAuthor = async (req, res, next) => {
  try {
    const authorWalletAddress = req.params.walletAddress;
    if (!authorWalletAddress) {
        return res.status(400).json({ success: false, message: 'Author wallet address is required.' });
    }

    // Find user by wallet address to confirm author exists (optional, but good practice)
    // const authorUser = await User.findOne({ walletAddress: authorWalletAddress });
    // if (!authorUser) {
    //     return res.status(404).json({ success: false, message: `Author with wallet ${authorWalletAddress} not found.` });
    // }

    let queryOptions = { authorWalletAddress };
    // If the request is made by the author themself, they might see their drafts too
    // Otherwise, only published tales.
    if (req.user && req.user.walletAddress === authorWalletAddress) {
        // Author is viewing their own tales, can see drafts
    } else {
        queryOptions.status = 'published'; // Public view only sees published
    }


    const tales = await Tale.find(queryOptions)
        .populate({ path: 'author', select: 'name walletAddress type' })
        .sort({ createdAt: -1 });

    if (!tales || tales.length === 0) {
      return res.status(200).json({ success: true, count: 0, data: [], message: `No tales found for author ${authorWalletAddress} matching criteria.` });
    }

    res.status(200).json({
      success: true,
      count: tales.length,
      data: tales,
    });
  } catch (error) {
    console.error(`Error getting tales by author ${req.params.walletAddress}:`, error);
    next(error);
  }
};
