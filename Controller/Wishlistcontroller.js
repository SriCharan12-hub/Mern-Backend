import Wishlist from "../Model/Wishlistmodel.js";
import Product from "../Model/Productmodel.js";

// @desc    Get user's wishlist
// @route   GET /api/wishlist/get
export const getWishlist = async (req, res) => {
    try {
        const wishlist = await Wishlist.findOne({ userId: req.user.id }).populate('items.productId');
        
        // Correctly format the response to match the frontend's needs
        res.json({ wishlist: wishlist ? wishlist.items.map(item => ({
            productId: item.productId._id, // Keep the product ID for removal
            product: item.productId, // This contains the populated product details
            addedAt: item.addedAt
        })) : [] });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Add item to wishlist
// @route   POST /api/wishlist/add
export const addItemToWishlist = async (req, res) => {
    const { productId } = req.body;
    try {
        let wishlist = await Wishlist.findOne({ userId: req.user.id });
        if (!wishlist) {
            wishlist = new Wishlist({ userId: req.user.id, items: [] });
        }
        if (wishlist.items.some(item => item.productId.toString() === productId)) {
            return res.status(400).json({ msg: 'Product already in wishlist' });
        }
        wishlist.items.push({ productId });
        await wishlist.save();
        res.json({ msg: 'Product added to wishlist' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Remove item from wishlist
// @route   DELETE /api/wishlist/remove
export const removeItemFromWishlist = async (req, res) => {
    const { productId } = req.body;
    try {
        const wishlist = await Wishlist.findOne({ userId: req.user.id });
        if (!wishlist) {
            return res.status(404).json({ msg: 'Wishlist not found' });
        }
        wishlist.items = wishlist.items.filter(item => item.productId.toString() !== productId);
        await wishlist.save();
        res.json({ msg: 'Product removed from wishlist' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};