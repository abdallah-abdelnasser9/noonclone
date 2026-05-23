const Product = require('../models/Product');

// Get cart
const getCart = async (req, res) => {
  try {
    const cart = req.session.cart || [];
    let total = 0;
    
    // Populate product details for each item
    const cartWithDetails = await Promise.all(cart.map(async (item) => {
      const product = await Product.findById(item.productId).select('name price mainImage images category');
      if (product) {
        item.product = product;
        item.price = product.price; // Update price in case it changed
        total += product.price * item.quantity;
      } else {
        total += item.price * item.quantity;
      }
      return item;
    }));
    
    // Recalculate total
    total = cartWithDetails.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    res.render('customer/cart', {
      title: 'Shopping Cart',
      cart: cartWithDetails,
      total: total.toFixed(2)
    });
  } catch (error) {
    console.error('Cart error:', error);
    res.render('customer/cart', {
      title: 'Shopping Cart',
      cart: [],
      total: 0,
      error: 'Failed to load cart'
    });
  }
};

// Add to cart
const addToCart = async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await Product.findById(productId);
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    if (!req.session.cart) {
      req.session.cart = [];
    }
    
    const existingItem = req.session.cart.find(item => 
      (item.productId && item.productId.toString() === productId) ||
      (item.product && item.product.toString() === productId)
    );
    
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      req.session.cart.push({
        productId: product._id,
        product: product._id,
        name: product.name,
        price: product.price,
        image: product.mainImage || (product.images && product.images[0]) || 'default-product.png',
        quantity: 1
      });
    }
    
    res.json({ 
      success: true, 
      message: product.name + ' added to cart!',
      cartCount: req.session.cart.length
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ success: false, message: 'Error adding to cart' });
  }
};

// Update cart quantity
const updateCart = (req, res) => {
  const { productId, quantity } = req.body;
  
  if (!req.session.cart) {
    return res.status(400).json({ success: false, message: 'Cart is empty' });
  }
  
  const item = req.session.cart.find(item => 
    (item.productId && item.productId.toString() === productId) ||
    (item.product && item.product.toString() === productId)
  );
  
  if (item) {
    if (quantity <= 0) {
      req.session.cart = req.session.cart.filter(i => 
        (i.productId && i.productId.toString() !== productId) &&
        (i.product && i.product.toString() !== productId)
      );
    } else {
      item.quantity = parseInt(quantity);
    }
    res.json({ success: true, message: 'Cart updated' });
  } else {
    res.status(404).json({ success: false, message: 'Item not found in cart' });
  }
};

// Remove from cart
const removeFromCart = (req, res) => {
  const productId = req.params.id;
  
  if (req.session.cart) {
    const before = req.session.cart.length;
    req.session.cart = req.session.cart.filter(item => 
      (item.productId && item.productId.toString() !== productId) &&
      (item.product && item.product.toString() !== productId)
    );
    
    if (req.session.cart.length < before) {
      res.json({ success: true, message: 'Item removed from cart' });
    } else {
      res.status(404).json({ success: false, message: 'Item not found in cart' });
    }
  } else {
    res.status(404).json({ success: false, message: 'Cart is empty' });
  }
};

module.exports = { getCart, addToCart, updateCart, removeFromCart };