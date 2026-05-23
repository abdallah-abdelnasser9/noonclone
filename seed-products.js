const mongoose = require('mongoose');
require('dotenv').config();
const Product = require('./models/Product');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/noon_clone';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('Connection error:', err));

const sampleProducts = [
  {
    title: "iPhone 15 Pro Max",
    description: "Latest smartphone with A17 Pro chip, 48MP camera, and titanium design",
    price: 1199,
    discountPrice: 1099,
    category: "Electronics",
    stock: 50,
    images: ["iphone15.jpg"],
    featured: true
  },
  {
    title: "Samsung 4K Smart TV",
    description: "65-inch 4K Ultra HD Smart TV with HDR",
    price: 799,
    discountPrice: 699,
    category: "Electronics",
    stock: 30,
    images: ["samsung-tv.jpg"],
    featured: true
  },
  {
    title: "Men's Casual Shirt",
    description: "Comfortable cotton shirt for everyday wear",
    price: 49,
    discountPrice: 39,
    category: "Fashion",
    stock: 100,
    images: ["shirt.jpg"],
    featured: false
  },
  {
    title: "Women's Running Shoes",
    description: "Lightweight and breathable running shoes",
    price: 89,
    discountPrice: 69,
    category: "Fashion",
    stock: 75,
    images: ["shoes.jpg"],
    featured: true
  },
  {
    title: "Coffee Maker",
    description: "Programmable coffee maker with thermal carafe",
    price: 129,
    discountPrice: 99,
    category: "Home",
    stock: 40,
    images: ["coffee-maker.jpg"],
    featured: false
  },
  {
    title: "Wireless Headphones",
    description: "Noise-cancelling over-ear headphones",
    price: 199,
    discountPrice: 149,
    category: "Electronics",
    stock: 60,
    images: ["headphones.jpg"],
    featured: true
  }
];

const seedProducts = async () => {
  try {
    await Product.deleteMany({});
    await Product.insertMany(sampleProducts);
    console.log('✅ Sample products added successfully!');
    process.exit();
  } catch (error) {
    console.error('Error seeding products:', error);
    process.exit(1);
  }
};

seedProducts();