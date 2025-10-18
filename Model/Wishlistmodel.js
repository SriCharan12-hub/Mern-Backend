import mongoose from "mongoose";

const wishlistSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to your User model
        required: true,
        unique: true // A user should only have one wishlist
    },
    items: [
        {
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product', // Reference to your Product model
                required: true
            },
            addedAt: {
                type: Date,
                default: Date.now
            }
        }
    ]
});

const Wishlist= mongoose.model('Wishlist', wishlistSchema,"wishlist");
export default Wishlist