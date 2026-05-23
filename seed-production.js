const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI not found in .env file');
  process.exit(1);
}

mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => {
    console.error('Connection error:', err);
    process.exit(1);
  });

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true, lowercase: true },
  password: String,
  role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
  image: { type: String, default: 'default-avatar.png' },
  createdAt: { type: Date, default: Date.now }
});

const categorySchema = new mongoose.Schema({
  name: { type: String, unique: true },
  description: String,
  image: { type: String, default: 'default-category.png' },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const productSchema = new mongoose.Schema({
  name: String,
  description: String,
  price: Number,
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  stock: { type: Number, default: 0 },
  mainImage: { type: String, default: 'default-product.png' },
  images: [String],
  isActive: { type: Boolean, default: true },
  featured: { type: Boolean, default: false },
  ratings: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rating: { type: Number, min: 1, max: 5 },
    review: String,
    createdAt: { type: Date, default: Date.now }
  }],
  averageRating: { type: Number, default: 0 },
  specifications: { type: Map, of: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Category = mongoose.model('Category', categorySchema);
const Product = mongoose.model('Product', productSchema);

async function seed() {
  try {
    console.log('Starting seed...');

    // Clear existing data
    await User.deleteMany({});
    await Product.deleteMany({});
    await Category.deleteMany({});
    console.log('Cleared existing data');

    // Create admin user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Admin@123', salt);
    
    const admin = await User.create({
      name: 'Admin',
      email: 'admin@noonclone.com',
      password: hashedPassword,
      role: 'admin'
    });
    console.log('Admin created:', admin.email);

    // Create demo customer
    const customer = await User.create({
      name: 'demo user',
      email: 'customer@noonclone.com',
      password: hashedPassword,
      role: 'customer'
    });
    console.log('Customer created:', customer.email);

    // Create categories
    const categories = await Category.insertMany([
      { 
        name: 'Electronics', 
        description: 'Electronic devices and gadgets',
        image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=500'
      },
      { 
        name: 'Clothing', 
        description: 'Fashion and apparel',
        image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=500'
      },
      { 
        name: 'Books', 
        description: 'Books and literature',
        image: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=500'
      },
      { 
        name: 'Home & Garden', 
        description: 'Home and garden products',
        image: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=500'
      },
      { 
        name: 'Sports', 
        description: 'Sports equipment and gear',
        image: 'https://images.unsplash.com/photo-1461896836934-c2bsb72675e?w=500'
      }
    ]);
    console.log('Categories created:', categories.length);

    // Create products with real images
    const products = await Product.insertMany([
      {
        name: 'Wireless Bluetooth Headphones',
        description: 'Premium wireless Bluetooth headphones with active noise cancellation, 30-hour battery life, and ultra-comfortable ear cushions. Perfect for music lovers and professionals.',
        price: 79.99,
        category: categories[0]._id,
        stock: 50,
        featured: true,
        mainImage: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
        images: [
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
          'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=500'
        ],
        specifications: new Map([['Brand', 'SoundMax'], ['Battery', '30 hours'], ['Connectivity', 'Bluetooth 5.0']])
      },
      {
        name: 'Smartphone Protective Case',
        description: 'Durable shock-absorbent protective case compatible with latest smartphones. Military-grade drop protection with slim design.',
        price: 19.99,
        category: categories[0]._id,
        stock: 100,
        featured: false,
        mainImage: 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=500',
        images: [
          'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=500'
        ],
        specifications: new Map([['Material', 'TPU + PC'], ['Protection', 'Military Grade']])
      },
      {
        name: 'USB-C Fast Charger 65W',
        description: 'Universal 65W USB-C fast charger compatible with laptops, tablets, and smartphones. Compact design with foldable plug.',
        price: 34.99,
        category: categories[0]._id,
        stock: 75,
        featured: true,
        mainImage: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=500',
        images: [
          'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=500'
        ],
        specifications: new Map([['Power', '65W'], ['Ports', 'USB-C'], ['Compatible', 'Universal']])
      },
      {
        name: 'Wireless Earbuds Pro',
        description: 'True wireless earbuds with crystal clear sound, touch controls, and IPX5 water resistance. Includes wireless charging case.',
        price: 59.99,
        category: categories[0]._id,
        stock: 60,
        featured: true,
   mainImage: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSXZzB4E5w656mOG7Revrs6c13msYVi_iUgUA&s',

images: [
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSXZzB4E5w656mOG7Revrs6c13msYVi_iUgUA&s'
],
        specifications: new Map([['Battery', '24 hours'], ['Water Resistance', 'IPX5'], ['Bluetooth', '5.2']])
      },
      {
        name: 'Men\'s Classic Cotton T-Shirt',
        description: 'Premium 100% organic cotton t-shirt. Pre-shrunk, machine washable, and available in multiple colors. Comfortable regular fit.',
        price: 24.99,
        category: categories[1]._id,
        stock: 200,
        featured: true,
        mainImage: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500',
        images: [
          'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500',
          'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=500'
        ],
        specifications: new Map([['Material', '100% Cotton'], ['Fit', 'Regular'], ['Care', 'Machine Wash']])
      },
      {
        name: 'Women\'s Slim Fit Jeans',
        description: 'Stylish high-waist slim fit jeans made from premium stretch denim. Comfortable all-day wear with a flattering silhouette.',
        price: 49.99,
        category: categories[1]._id,
        stock: 150,
        featured: false,
        mainImage: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=500',
        images: [
          'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=500'
        ],
        specifications: new Map([['Material', 'Cotton Spandex Blend'], ['Fit', 'Slim'], ['Rise', 'High']])
      },
      {
        name: 'Casual Denim Jacket',
        description: 'Classic denim jacket with modern fit. Features button closure, chest pockets, and adjustable waist tabs. Perfect for layering.',
        price: 69.99,
        category: categories[1]._id,
        stock: 80,
        featured: true,
        mainImage: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=500',
        images: [
          'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=500'
        ],
        specifications: new Map([['Material', 'Denim'], ['Style', 'Classic'], ['Season', 'All Season']])
      },
      {
        name: 'Winter Wool Sweater',
        description: 'Warm and cozy wool blend sweater. Features ribbed cuffs and hem, crew neck design. Available in multiple colors.',
        price: 44.99,
        category: categories[1]._id,
        stock: 90,
        featured: false,
        mainImage: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=500',
        images: [
          'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=500'
        ],
        specifications: new Map([['Material', 'Wool Blend'], ['Style', 'Crew Neck'], ['Care', 'Hand Wash']])
      },
      {
        name: 'JavaScript: The Definitive Guide',
        description: 'Comprehensive JavaScript book covering ES2023, async programming, Node.js, and modern web development. Perfect for beginners to advanced developers.',
        price: 39.99,
        category: categories[2]._id,
        stock: 30,
        featured: true,
        mainImage: 'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=500',
        images: [
          'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=500'
        ],
        specifications: new Map([['Pages', '704'], ['Edition', '7th'], ['Publisher', 'O\'Reilly']])
      },
      {
        name: 'Complete Garden Tool Set',
        description: 'Professional 7-piece garden tool set with ergonomic soft-grip handles. Includes trowel, pruner, cultivator, weeder, transplanter, fork, and storage tote.',
        price: 89.99,
        category: categories[3]._id,
        stock: 25,
        featured: false,
        mainImage: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=500',
        images: [
          'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=500'
        ],
        specifications: new Map([['Pieces', '7'], ['Material', 'Stainless Steel'], ['Handle', 'Ergonomic']])
      },
      {
        name: 'Indoor Plant Collection',
        description: 'Set of 3 easy-care indoor plants in decorative pots. Includes Snake Plant, Pothos, and Peace Lily. Perfect for home or office.',
        price: 54.99,
        category: categories[3]._id,
        stock: 20,
        featured: true,
        mainImage: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=500',
        images: [
          'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=500'
        ],
        specifications: new Map([['Plants', '3'], ['Pot Size', '6 inch'], ['Care Level', 'Easy']])
      },
      {
        name: 'Premium Yoga Mat',
        description: 'Extra thick 6mm non-slip yoga mat with carrying strap. Eco-friendly TPE material, perfect for yoga, pilates, and stretching exercises.',
        price: 34.99,
        category: categories[4]._id,
        stock: 60,
        featured: true,
        mainImage: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=500',
        images: [
          'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=500'
        ],
        specifications: new Map([['Thickness', '6mm'], ['Material', 'TPE'], ['Size', '72" x 24"']])
      },
      {
        name: 'Professional Running Shoes',
        description: 'Lightweight performance running shoes with responsive cushioning and breathable mesh upper. Designed for comfort and speed.',
        price: 99.99,
        category: categories[4]._id,
        stock: 40,
        featured: true,
        mainImage: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500',
        images: [
          'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500',
          'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=500'
        ],
        specifications: new Map([['Type', 'Running'], ['Cushioning', 'Responsive'], ['Upper', 'Mesh']])
      },
      {
        name: 'Resistance Bands Set',
        description: 'Complete set of 5 resistance bands with different tension levels. Includes door anchor, ankle straps, and carrying bag.',
        price: 24.99,
        category: categories[4]._id,
        stock: 85,
        featured: false,
        mainImage: 'https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=500',
        images: [
          'https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=500'
        ],
        specifications: new Map([['Bands', '5'], ['Levels', 'Light to Heavy'], ['Accessories', 'Included']])
      }
    ]);
    console.log('Products created:', products.length);

    console.log('\n✅ Seed completed successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Admin Login:');
    console.log('  Email: admin@noonclone.com');
    console.log('  Password: Admin@123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Customer Login:');
    console.log('  Email: customer@noonclone.com');
    console.log('  Password: user@123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Products: ' + products.length);
    console.log('Categories: ' + categories.length);
    
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

seed();