const express = require('express');
const MenuItem = require('../models/MenuItem');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const multer = require('multer');
const path = require('path');

const router = express.Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/menu-images/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Get all menu items
router.get('/', async (req, res) => {
  try {
    const { category, search, available } = req.query;
    
    let query = {};
    
    if (category) query.category = category;
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    if (available !== undefined) {
      query.isAvailable = available === 'true';
    }

    const menuItems = await MenuItem.find(query)
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 });

    res.json(menuItems);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single menu item
router.get('/:id', async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id)
      .populate('createdBy', 'username');
    
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    res.json(menuItem);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create menu item (Admin only)
router.post('/', auth, adminAuth, upload.single('image'), async (req, res) => {
  try {
    const { name, description, price, category, stock } = req.body;
    
    const menuItem = new MenuItem({
      name,
      description,
      price: parseFloat(price),
      category,
      stock: parseInt(stock) || 0,
      image: req.file ? `/uploads/menu-images/${req.file.filename}` : null,
      createdBy: req.user.userId
    });

    await menuItem.save();
    await menuItem.populate('createdBy', 'username');

    res.status(201).json({
      message: 'Menu item created successfully',
      menuItem
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update menu item (Admin only)
router.put('/:id', auth, adminAuth, upload.single('image'), async (req, res) => {
  try {
    const { name, description, price, category, stock, isAvailable } = req.body;
    
    const updateData = {
      name,
      description,
      price: parseFloat(price),
      category,
      stock: parseInt(stock),
      isAvailable: isAvailable === 'true'
    };

    if (req.file) {
      updateData.image = `/uploads/menu-images/${req.file.filename}`;
    }

    const menuItem = await MenuItem.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('createdBy', 'username');

    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    res.json({
      message: 'Menu item updated successfully',
      menuItem
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete menu item (Admin only)
router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    const menuItem = await MenuItem.findByIdAndDelete(req.params.id);
    
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    res.json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update stock
router.patch('/:id/stock', auth, async (req, res) => {
  try {
    const { stock } = req.body;
    
    const menuItem = await MenuItem.findByIdAndUpdate(
      req.params.id,
      { stock: parseInt(stock) },
      { new: true }
    );

    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    res.json({
      message: 'Stock updated successfully',
      menuItem
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
