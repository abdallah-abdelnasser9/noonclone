const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/noon_clone';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => {
    console.error('❌ MongoDB error:', err);
    process.exit(1);
  });

const Product = require('./models/Product');
const Category = require('./models/category');
const User = require('./models/User');

async function seed() {
  try {
    // Clear existing data
    await Product.deleteMany({});
    await Category.deleteMany({});
    console.log('Cleared existing data');

    // Create categories
    const categories = await Category.insertMany([
      { name: 'Electronics', description: 'Electronic devices and gadgets', isActive: true },
      { name: 'Clothing', description: 'Fashion and apparel', isActive: true },
      { name: 'Books', description: 'Books and literature', isActive: true },
      { name: 'Home & Garden', description: 'Home improvement and garden supplies', isActive: true },
      { name: 'Sports', description: 'Sports equipment and gear', isActive: true }
    ]);
    console.log('Created categories:', categories.length);

    // Create products
    const products = await Product.insertMany([
      {
        name: 'Wireless Headphones',
        description: 'High-quality Bluetooth wireless headphones with noise cancellation',
        price: 79.99,
        category: categories[0]._id,
        stock: 50,
        isActive: true,
        featured: true,
        mainImage: 'default-product.png'
      },
      {
        name: 'Smartphone Case',
        description: 'Durable protective case for smartphones',
        price: 19.99,
        category: categories[0]._id,
        stock: 100,
        isActive: true,
        mainImage: 'default-product.png'
      },
      {
        name: 'Men\'s T-Shirt',
        description: 'Comfortable cotton t-shirt for men',
        price: 24.99,
        category: categories[1]._id,
        stock: 75,
        isActive: true,
        featured: true,
        mainImage: 'default-product.png'
      },
      {
        name: 'Women\'s Jeans',
        description: 'Stylish skinny fit jeans for women',
        price: 49.99,
        category: categories[1]._id,
        stock: 60,
        isActive: true,
        mainImage: 'default-product.png'
      },
      {
        name: 'JavaScript Programming Book',
        description: 'Complete guide to JavaScript programming',
        price: 39.99,
        category: categories[2]._id,
        stock: 30,
        isActive: true,
        featured: true,
        mainImage: 'default-product.png'
      },
      {
        name: 'Garden Tools Set',
        description: 'Complete set of essential garden tools',
        price: 89.99,
        category: categories[3]._id,
        stock: 20,
        isActive: true,
        mainImage: 'default-product.png'
      },
      {
        name: 'Yoga Mat',
        description: 'Premium non-slip yoga mat for exercise',
        price: 34.99,
        category: categories[4]._id,
        stock: 45,
        isActive: true,
        mainImage: 'default-product.png'
      },
      {
        name: 'Running Shoes',
        description: 'Lightweight running shoes for men and women',
        price: 99.99,
        category: categories[4]._id,
        stock: 40,
        isActive: true,
        featured: true,
        mainImage: 'default-product.png'
      }
    ]);
    console.log('Created products:', products.length);

    // Create admin user
    const User = require('./models/User');
    
    // Check if admin exists first
    const existingAdmin = await User.findOne({ email: 'admin@noon.com' });
    if (!existingAdmin) {
      const admin = new User({
        name: 'Admin',
        email: 'admin@noon.com',
        password: 'admin123',
        role: 'admin'
      });
      // Hash password manually
      const bcrypt = require('bcryptjs');
      const salt = await bcrypt.genSalt(10);
      admin.password = await bcrypt.hash('admin123', salt);
      await admin.save();
      console.log('Created admin user: admin@noon.com / admin123');
    } else {
      console.log('Admin user already exists');
    }

    console.log('✅ Seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

seed();