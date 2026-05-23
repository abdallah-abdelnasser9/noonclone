const Wishlist = require('../models/Wishlist');

// Get wishlist page
const getWishlist = async (req, res) => {
    try {
        let wishlist = await Wishlist.findOne({
            user: req.session.user._id
        }).populate('products.product');

        if (!wishlist) {
            wishlist = { products: [] };
        }

        res.render('user/wishlist', {
            title: 'My Wishlist',
            wishlist: wishlist.products
        });

    } catch (error) {
        console.log(error);
        res.status(500).send('Server Error');
    }
};

// Add to wishlist
const addToWishlist = async (req, res) => {
    try {
        const userId = req.session.user._id;
        const productId = req.params.productId;

        let wishlist = await Wishlist.findOne({ user: userId });

        if (!wishlist) {
            wishlist = new Wishlist({
                user: userId,
                products: []
            });
        }

        // Check if already exists
        const exists = wishlist.products.find(
            item => item.product.toString() === productId
        );

        if (exists) {
            return res.json({
                success: false,
                message: 'Product already in wishlist'
            });
        }

        wishlist.products.push({
            product: productId
        });

        await wishlist.save();

        res.json({
            success: true,
            message: 'Added to wishlist'
        });

    } catch (error) {
        console.log(error);

        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

// Remove from wishlist
const removeFromWishlist = async (req, res) => {
    try {
        const userId = req.session.user._id;
        const productId = req.params.productId;

        const wishlist = await Wishlist.findOne({
            user: userId
        });

        if (!wishlist) {
            return res.status(404).json({
                success: false
            });
        }

        wishlist.products = wishlist.products.filter(
            item => item.product.toString() !== productId
        );

        await wishlist.save();

        res.json({
            success: true
        });

    } catch (error) {
        console.log(error);

        res.status(500).json({
            success: false
        });
    }
};

module.exports = {
    getWishlist,
    addToWishlist,
    removeFromWishlist
};