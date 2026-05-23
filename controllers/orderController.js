const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');


// Show checkout page
const showCheckout = async (req, res) => {
  try {
    const cart = req.session.cart || [];
    
    if (cart.length === 0) {
      req.session.error = 'Your cart is empty';
      return res.redirect('/cart');
    }
    
    // Get full product details for cart items
    const cartItems = [];
    let totalAmount = 0;
    
    for (const item of cart) {
      const product = await Product.findById(item.productId || item.product);
      if (product) {
        const itemTotal = product.price * item.quantity;
        totalAmount += itemTotal;
        cartItems.push({
          product: product,
          quantity: item.quantity,
          price: product.price,
          subtotal: itemTotal
        });
      }
    }
    
    const user = await User.findById(req.session.user._id).select('-password');
    
    res.render('orders/checkout', {
      title: 'Checkout',
      cartItems,
      totalAmount,
      user: user || req.session.user,
      error: req.session.error,
      success: req.session.success
    });
    
    req.session.error = null;
    req.session.success = null;
  } catch (error) {
    console.error('Error loading checkout:', error);
    req.session.error = 'Failed to load checkout';
    res.redirect('/cart');
  }
};

// Place order
const placeOrder = async (req, res) => {
  try {
    const { shippingAddress, paymentMethod } = req.body;
    const cart = req.session.cart || [];
    
    if (cart.length === 0) {
      req.session.error = 'Your cart is empty';
      return res.redirect('/cart');
    }
    
    // Calculate total and prepare order items
    let totalAmount = 0;
    const orderItems = [];
    
    for (const item of cart) {
      const product = await Product.findById(item.productId || item.product);
      
      if (!product) {
        req.session.error = 'Some products are no longer available';
        return res.redirect('/cart');
      }
      
      if (product.stock < item.quantity) {
        req.session.error = 'Insufficient stock for ' + product.name;
        return res.redirect('/cart');
      }
      
      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;
      
      orderItems.push({
        product: product._id,
        quantity: item.quantity,
        price: product.price
      });
      
      // Update stock
      product.stock -= item.quantity;
      await product.save();
    }
    
    // Create order
    const order = new Order({
      user: req.session.user._id,
      items: orderItems,
      totalAmount,
      shippingAddress: {
        street: shippingAddress?.street || '',
        city: shippingAddress?.city || '',
        state: shippingAddress?.state || '',
        zipCode: shippingAddress?.zipCode || '',
        country: shippingAddress?.country || ''
      },
      paymentMethod: paymentMethod || 'cash_on_delivery',
      status: 'pending',
      paymentStatus: 'pending'
    });
    
    await order.save();
    
    // Clear cart
    req.session.cart = [];
    
    req.session.success = 'Order placed successfully!';
    res.redirect('/orders/' + order._id);
  } catch (error) {
    console.error('Error placing order:', error);
    req.session.error = 'Failed to place order. Please try again.';
    res.redirect('/checkout');
  }
};

// Get user's orders
const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.session.user._id })
      .populate('items.product', 'name price mainImage')
      .sort({ createdAt: -1 });
    
    res.render('orders/list', {
      title: 'My Orders',
      orders,
      error: req.session.error,
      success: req.session.success
    });
    
    req.session.error = null;
    req.session.success = null;
  } catch (error) {
    console.error('Error fetching orders:', error);
    req.session.error = 'Failed to load orders';
    res.redirect('/');
  }
};

// Get single order details
const getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email')
      .populate('items.product', 'name price mainImage description');
    
    if (!order) {
      req.session.error = 'Order not found';
      return res.redirect('/orders');
    }
    
    // Check if order belongs to user or user is admin
    if (order.user._id.toString() !== req.session.user._id.toString() && 
        req.session.user.role !== 'admin') {
      req.session.error = 'Access denied';
      return res.redirect('/orders');
    }
    
    res.render('orders/view', {
      title: `Order #${order._id.toString().slice(-8)}`,
      order,
      error: req.session.error,
      success: req.session.success
    });
    
    req.session.error = null;
    req.session.success = null;
  } catch (error) {
    console.error('Error fetching order:', error);
    req.session.error = 'Order not found';
    res.redirect('/orders');
  }
};

// ========== ADMIN FUNCTIONS (YOUR EXISTING CODE) ==========

// Admin: List all orders
const adminOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;
    const status = req.query.status || '';
    const search = req.query.search || '';
    
    let query = {};
    if (status) {
      query.status = status;
    }
    
    if (search) {
      const users = await User.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      
      query.$or = [
        { _id: search.match(/^[0-9a-fA-F]{24}$/) ? search : null },
        { user: { $in: users.map(u => u._id) } }
      ];
    }
    
    const orders = await Order.find(query)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Order.countDocuments(query);
    const totalPages = Math.ceil(total / limit);
    
    res.render('admin/orders/list', {
      title: 'Manage Orders',
      orders,
      currentPage: page,
      totalPages,
      status,
      search,
      error: req.session.error,
      success: req.session.success
    });
    
    req.session.error = null;
    req.session.success = null;
  } catch (error) {
    console.error('Error fetching orders:', error);
    req.session.error = 'Failed to load orders';
    res.redirect('/admin/dashboard');
  }
};

// Admin: View single order
const viewOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('items.product', 'name price mainImage');
    
    if (!order) {
      req.session.error = 'Order not found';
      return res.redirect('/admin/orders');
    }
    
    res.render('admin/orders/view', {
      title: `Order #${order._id}`,
      order,
      error: req.session.error,
      success: req.session.success
    });
    
    req.session.error = null;
    req.session.success = null;
  } catch (error) {
    console.error('Error viewing order:', error);
    req.session.error = 'Failed to load order';
    res.redirect('/admin/orders');
  }
};

// Admin: Update order status
const updateOrderStatus = async (req, res) => {
  try {
    const { status, trackingNumber, notes } = req.body;
    
    const updateData = { status };
    if (trackingNumber) updateData.trackingNumber = trackingNumber;
    if (notes) updateData.notes = notes;
    
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    
    if (!order) {
      req.session.error = 'Order not found';
      return res.redirect('/admin/orders');
    }
    
    // If order is delivered, update payment status
    if (status === 'delivered') {
      order.paymentStatus = 'completed';
      await order.save();
    }
    
    req.session.success = `Order status updated to ${status}`;
    res.redirect(`/admin/orders/${req.params.id}`);
  } catch (error) {
    console.error('Error updating order:', error);
    req.session.error = 'Failed to update order';
    res.redirect(`/admin/orders/${req.params.id}`);
  }
};

// ========== EXPORT ALL FUNCTIONS ==========
module.exports = {
  // Customer functions
  showCheckout,
  placeOrder,
  getOrders,
  getOrder,
  
  // Admin functions
  adminOrders,
  viewOrder,
  updateOrderStatus
};