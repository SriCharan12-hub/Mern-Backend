import Cart from "../Model/Cartmodel.js";
import Product from "../Model/Productmodel.js";

// Add or update an item in the cart
export const addToCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId, quantity } = req.body;

        let cart = await Cart.findOne({ userId });

        if (!cart) {
            // Create a new cart if it doesn't exist
            cart = new Cart({
                userId,
                items: [{ productId, quantity }],
            });
        } else {
            // Check if product already in cart
            const itemIndex = cart.items.findIndex(
                (item) => item.productId.toString() === productId
            );

            if (itemIndex > -1) {
                // Update quantity
                cart.items[itemIndex].quantity += 1;
            } else {
                // Add new product
                cart.items.push({ productId, quantity });
            }
        }

        await cart.save();
        res.status(200).json({ message: 'Cart updated successfully' }); // Use a simple message for optimistic updates
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// get cart with populated data
export const getCart = async (req, res) => {
    try {
        const userId = req.user.id;

        // Use findOne() instead of find()
        const cart = await Cart.findOne({ userId })
            .populate({
                path: 'items.productId',
                model: Product
            });

        if (!cart) {
            return res.json({ message: "Cart is empty", cart: [] });
        }

        res.json({ cart: cart.items });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Remove an item from the cart
export const removeFromCart = async (req, res) => {
    const userId = req.user.id;
    // Correctly destructure productId from the request body
    const { productId } = req.body; 

    try {
        const cart = await Cart.findOne({ userId });

        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        const itemIndex = cart.items.findIndex(
            (item) => item.productId.toString() === productId
        );

        if (itemIndex > -1) {
            cart.items.splice(itemIndex, 1);
            await cart.save();
            res.status(200).json({ message: 'Item removed from cart successfully', cart: cart.items });
        } else {
            res.status(404).json({ message: 'Item not found in cart' });
        }
    } catch (error) {
        console.error('Error removing from cart:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Clear the entire cart for a user
// export const clearCart = async (req, res) => {
//     try {
//         const userId = req.user.id;
//         await Cart.findOneAndDelete({ userId });
//         res.status(200).json({ message: 'Cart cleared' });
//     } catch (err) {
//         res.status(500).json({ message: 'Failed to clear cart', error: err.message });
//     }
// };

// Update item quantity
export const updateQuantity = async (req, res) => {
    const userId = req.user.id;
    const { productId, quantity } = req.body;

    try {
        const cart = await Cart.findOne({ userId });

        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        const item = cart.items.find(
            (item) => item.productId.toString() === productId
        );

        if (!item) {
            return res.status(404).json({ message: 'Item not found in cart' });
        }

        // If quantity is zero or less, remove the item
        if (quantity <= 0) {
            const itemIndex = cart.items.findIndex(i => i.productId.toString() === productId);
            if(itemIndex > -1) {
                cart.items.splice(itemIndex, 1);
            }
        } else {
            item.quantity = quantity;
        }

        await cart.save();
        res.status(200).json({ message: 'Cart updated successfully', cart: cart.items });
    } catch (error) {
        console.error('Error updating quantity:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};