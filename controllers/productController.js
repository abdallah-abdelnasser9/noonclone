const Product = require('../models/Product');
const Category = require('../models/category');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = 'public/uploads/products';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5000000 }, // 5MB limit
  fileFilter: function(req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Error: Images Only!'), false);
    }
  }
}).array('images', 5);

// ============================================
// PUBLIC ROUTES
// ============================================

// Public: Get all products (for shop page)
const getAllProducts = async (req, res) => {
  console.log('>>> getAllProducts CALLED');
  console.log('>>> req.path:', req.path);
  console.log('>>> req.originalUrl:', req.originalUrl);
  
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 12;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const category = req.query.category || '';
    const sort = req.query.sort || 'newest';
    
    let query = { isActive: true };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (category) {
      query.category = category;
    }
    
    let sortOption = {};
    switch(sort) {
      case 'price-low': sortOption = { price: 1 }; break;
      case 'price-high': sortOption = { price: -1 }; break;
      case 'name': sortOption = { name: 1 }; break;
      case 'rating': sortOption = { averageRating: -1 }; break;
      default: sortOption = { createdAt: -1 };
    }
    
    const products = await Product.find(query)
      .populate('category', 'name')
      .sort(sortOption)
      .skip(skip)
      .limit(limit);
    
    const total = await Product.countDocuments(query);
    const totalPages = Math.ceil(total / limit);
    const categories = await Category.find({ isActive: true });
    
    console.log('>>> Products found:', products.length);
    console.log('>>> Rendering customer/shop');
    
    // Render with error handling
    res.render('customer/shop', {
      title: 'Shop',
      products: products || [],
      categories: categories || [],
      currentPage: page,
      totalPages: totalPages || 1,
      search: search || '',
      category: category || '',
      sort: sort || 'newest',
      currentCategory: category || 'All',
      sortBy: sort || 'newest',
      searchQuery: search || '',
      error: req.session.error || null,
      success: req.session.success || null
    }, (err, html) => {
      if (err) {
        console.error('>>> Render error:', err.message);
        req.session.error = 'Failed to load shop page';
        return res.redirect('/');
      }
      res.send(html);
    });
    
    req.session.error = null;
    req.session.success = null;
  } catch (error) {
    console.error('>>> Error in getAllProducts:', error.message);
    console.error('>>> Full error:', error);
    req.session.error = 'Failed to load products: ' + error.message;
    res.redirect('/');
  }
};

// Public: Get single product details
const getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category')
      .populate('ratings.user', 'name image');
    
    if (!product) {
      req.session.error = 'Product not found';
      return res.redirect('/shop');
    }
    
    // Get related products (same category, excluding current)
    const relatedProducts = await Product.find({
      category: product.category._id,
      _id: { $ne: product._id },
      isActive: true
    })
      .limit(4)
      .populate('category', 'name');
    
    res.render('products/view', {
      title: product.name,
      product,
      relatedProducts,
      error: req.session.error,
      success: req.session.success
    });
    
    req.session.error = null;
    req.session.success = null;
  } catch (error) {
    console.error('Error fetching product:', error);
    req.session.error = 'Product not found';
    res.redirect('/shop');
  }
};

// Public: Add review to product
const addReview = async (req, res) => {
  try {
    const { rating, review } = req.body;
    const productId = req.params.id;
    const userId = req.session.user._id;
    
    if (!rating) {
      req.session.error = 'Please provide a rating';
      return res.redirect(`/products/${productId}`);
    }
    
    const product = await Product.findById(productId);
    
    if (!product) {
      req.session.error = 'Product not found';
      return res.redirect('/shop');
    }
    
    // Check if user already reviewed
    const existingReview = product.ratings.find(
      r => r.user.toString() === userId.toString()
    );
    
    if (existingReview) {
      // Update existing review
      existingReview.rating = parseInt(rating);
      existingReview.review = review || '';
    } else {
      // Add new review
      product.ratings.push({
        user: userId,
        rating: parseInt(rating),
        review: review || ''
      });
    }
    
    // Calculate average rating
    const totalRatings = product.ratings.reduce((sum, r) => sum + r.rating, 0);
    product.averageRating = totalRatings / product.ratings.length;
    
    await product.save();
    
    req.session.success = 'Review added successfully';
    res.redirect(`/products/${productId}`);
  } catch (error) {
    console.error('Error adding review:', error);
    req.session.error = 'Failed to add review';
    res.redirect(`/products/${req.params.id}`);
  }
};

// ============================================
// ADMIN ROUTES
// ============================================

// Admin: List all products
const adminProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    
    let query = {};
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ]
      };
    }
    
    const products = await Product.find(query)
      .populate('category', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Product.countDocuments(query);
    const totalPages = Math.ceil(total / limit);
    
    res.render('admin/products/list', {
      title: 'Manage Products',
      products,
      currentPage: page,
      totalPages,
      search,
      activePage: 'products',
      error: req.session.error,
      success: req.session.success
    });
    
    req.session.error = null;
    req.session.success = null;
  } catch (error) {
    console.error('Error fetching products:', error);
    req.session.error = 'Failed to load products';
    res.redirect('/admin/dashboard');
  }
};

// Admin: Show create product form
const createProductForm = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true });
    res.render('admin/products/create', {
      title: 'Create Product',
      categories,
      activePage: 'products',
      error: req.session.error,
      formData: req.session.formData
    });
    req.session.error = null;
    req.session.formData = null;
  } catch (error) {
    console.error('Error loading create form:', error);
    req.session.error = 'Failed to load form';
    res.redirect('/admin/products');
  }
};

// Admin: Create product
const createProduct = async (req, res) => {
  upload(req, res, async function(err) {
    if (err) {
      console.error('Upload error:', err);
      req.session.error = err.message || 'Error uploading files';
      req.session.formData = req.body;
      return res.redirect('/admin/products/create');
    }
    
    try {
      const { name, description, price, category, stock, specifications } = req.body;
      
      // Basic validation
      if (!name || !description || !price || !category) {
        req.session.error = 'Please fill in all required fields';
        req.session.formData = req.body;
        return res.redirect('/admin/products/create');
      }
      
      // Validate price is a number
      if (isNaN(parseFloat(price)) || parseFloat(price) < 0) {
        req.session.error = 'Please enter a valid price';
        req.session.formData = req.body;
        return res.redirect('/admin/products/create');
      }
      
      let images = [];
      if (req.files && req.files.length > 0) {
        images = req.files.map(file => file.filename);
      }
      
      // Parse specifications safely
      let parsedSpecs = new Map();
      if (specifications && specifications.trim() !== '') {
        try {
          const specsObj = JSON.parse(specifications);
          Object.keys(specsObj).forEach(key => {
            parsedSpecs.set(key, specsObj[key]);
          });
        } catch (e) {
          // If JSON parsing fails, ignore specifications
          console.warn('Failed to parse specifications:', e.message);
        }
      }
      
      const product = new Product({
        name,
        description,
        price: parseFloat(price),
        category,
        stock: parseInt(stock) || 0,
        mainImage: images[0] || 'default-product.png',
        images: images,
        specifications: parsedSpecs,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      await product.save();
      console.log('Product created successfully:', product._id);
      
      req.session.success = 'Product created successfully!';
      res.redirect('/admin/products');
      
    } catch (error) {
      console.error('Error creating product:', error);
      
      // Handle specific error types
      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(e => e.message);
        req.session.error = 'Validation error: ' + messages.join(', ');
      } else if (error.code === 11000) {
        req.session.error = 'A product with this name already exists';
      } else if (error.name === 'CastError') {
        req.session.error = 'Invalid data format. Please check your inputs.';
      } else {
        req.session.error = 'Failed to create product: ' + error.message;
      }
      
      req.session.formData = req.body;
      res.redirect('/admin/products/create');
    }
  });
};

// Admin: Show edit product form
const editProductForm = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('category');
    if (!product) {
      req.session.error = 'Product not found';
      return res.redirect('/admin/products');
    }
    
    const categories = await Category.find({ isActive: true });
    res.render('admin/products/edit', {
      title: 'Edit Product',
      product,
      categories,
      activePage: 'products',
      error: req.session.error,
      formData: req.session.formData || product
    });
    req.session.error = null;
    req.session.formData = null;
  } catch (error) {
    console.error('Error loading product:', error);
    req.session.error = 'Failed to load product';
    res.redirect('/admin/products');
  }
};

// Admin: Update product
const updateProduct = async (req, res) => {
  upload(req, res, async function(err) {
    if (err) {
      console.error('Upload error:', err);
      req.session.error = err.message || 'Error uploading files';
      return res.redirect(`/admin/products/edit/${req.params.id}`);
    }
    
    try {
      const { name, description, price, category, stock, isActive, specifications } = req.body;
      
      const updateData = {
        name,
        description,
        price: parseFloat(price),
        category,
        stock: parseInt(stock) || 0,
        isActive: isActive === 'on',
        updatedAt: new Date()
      };
      
      // Parse specifications safely
      if (specifications && specifications.trim() !== '') {
        try {
          const specsObj = JSON.parse(specifications);
          const parsedSpecs = new Map();
          Object.keys(specsObj).forEach(key => {
            parsedSpecs.set(key, specsObj[key]);
          });
          updateData.specifications = parsedSpecs;
        } catch (e) {
          console.warn('Failed to parse specifications:', e.message);
        }
      }
      
      // Handle image updates
      if (req.files && req.files.length > 0) {
        const newImages = req.files.map(file => file.filename);
        updateData.mainImage = newImages[0];
        updateData.images = newImages;
      }
      
      const updatedProduct = await Product.findByIdAndUpdate(
        req.params.id, 
        updateData, 
        { new: true, runValidators: true }
      );
      
      if (!updatedProduct) {
        req.session.error = 'Product not found';
        return res.redirect('/admin/products');
      }
      
      console.log('Product updated successfully:', updatedProduct._id);
      req.session.success = 'Product updated successfully!';
      res.redirect('/admin/products');
      
    } catch (error) {
      console.error('Error updating product:', error);
      
      // Handle specific error types
      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(e => e.message);
        req.session.error = 'Validation error: ' + messages.join(', ');
      } else if (error.name === 'CastError') {
        req.session.error = 'Invalid data format. Please check your inputs.';
      } else {
        req.session.error = 'Failed to update product: ' + error.message;
      }
      
      res.redirect(`/admin/products/edit/${req.params.id}`);
    }
  });
};

// Admin: Delete product
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    
    if (!product) {
      req.session.error = 'Product not found';
    } else {
      console.log('Product deleted successfully:', req.params.id);
      req.session.success = 'Product deleted successfully!';
    }
  } catch (error) {
    console.error('Error deleting product:', error);
    req.session.error = 'Failed to delete product: ' + error.message;
  }
  res.redirect('/admin/products');
};

// Admin: View single product
const viewProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category')
      .populate('ratings.user', 'name');
    
    if (!product) {
      req.session.error = 'Product not found';
      return res.redirect('/admin/products');
    }
    
    res.render('admin/products/view', {
      title: product.name,
      product,
      activePage: 'products',
      error: req.session.error,
      success: req.session.success
    });
    
    req.session.error = null;
    req.session.success = null;
  } catch (error) {
    console.error('Error viewing product:', error);
    req.session.error = 'Failed to load product';
    res.redirect('/admin/products');
  }
};

// ============================================
// EXPORT ALL FUNCTIONS
// ============================================
module.exports = {
  // Public functions
  getAllProducts,
  getProduct,
  addReview,
  
  // Admin functions
  adminProducts,
  createProductForm,
  createProduct,
  editProductForm,
  updateProduct,
  deleteProduct,
  viewProduct
};