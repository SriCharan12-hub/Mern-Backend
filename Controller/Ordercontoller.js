import ordermodel from '../Model/Ordermodel.js';
import mongoose from 'mongoose';
import Product from '../Model/Productmodel.js';
import Cartmodel from '../Model/Cartmodel.js';
import User from '../Model/Usermodel.js';


export const placeOrder = async (req, res) => {
    const userId = req.user.id;
    const {
        shippingDetails,
        paymentMethod,
        totalAmount
    } = req.body;
    
    if (!shippingDetails || !paymentMethod || !totalAmount) {
        return res.status(400).json({ 
            success: false, 
            message: "Missing required order details (shipping, payment, or items)."
        });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Fetch the user's server-side cart and populate productId
        const cartDoc = await Cartmodel.findOne({ userId })
            .populate('items.productId')
            .session(session);
        
        const cartItems = (cartDoc && Array.isArray(cartDoc.items)) ? cartDoc.items : [];

        if (!cartItems || cartItems.length === 0) {
            throw new Error('Cart is empty. Cannot place an order without items.');
        }

        // Filter out invalid items (where productId doesn't exist or is null)
        const validCartItems = cartItems.filter(item => {
            if (!item.productId || !item.productId._id) {
                console.warn('Skipping invalid cart item:', item);
                return false;
            }
            return true;
        });

        if (validCartItems.length === 0) {
            throw new Error('Cart contains no valid products. Please refresh your cart.');
        }

        // Extract product IDs (they're already populated)
        const itemIds = validCartItems.map(ci => ci.productId._id);
        const productsInDB = await Product.find({ _id: { $in: itemIds } }).session(session);

        let calculatedSubtotal = 0;
        const orderItems = [];

        for (const cartItem of validCartItems) {
            const productFromCart = cartItem.productId; // Already populated
            const productIdStr = productFromCart._id.toString();
            
            // Double-check product exists in DB
            const productDB = productsInDB.find(p => p._id.toString() === productIdStr);

            if (!productDB) {
                throw new Error(`Product not found in database: ${productFromCart.title || productIdStr}`);
            }

            const quantity = Number(cartItem.quantity || 0);
            if (productDB.count < quantity) {
                throw new Error(`Insufficient stock for product: ${productDB.title}. Available: ${productDB.count}, Requested: ${quantity}`);
            }

            calculatedSubtotal += productDB.price * quantity;

            orderItems.push({
                productId: productDB._id,
                quantity,
                priceAtOrder: productDB.price,
            });
        }
        
        const shippingCost = 5.0;
        const taxes = calculatedSubtotal * 0.10;
        const calculatedTotal = calculatedSubtotal + shippingCost + taxes;

        if (Math.abs(calculatedTotal - totalAmount) > 0.1) {
            throw new Error(`Price mismatch. Calculated total: ${calculatedTotal.toFixed(2)}, Received: ${totalAmount.toFixed(2)}`);
        }

        const paymentStatus = paymentMethod === 'cod' ? 'Pending' : 'Paid';

        const newOrder = new ordermodel({
            userId,
            items: orderItems,
            shippingDetails,
            totalAmount: calculatedTotal,
            paymentMethod,
            paymentStatus,
            orderStatus: "Processing",
        });

        const savedOrder = await newOrder.save({ session });

        // Update Product Stock (Decrement Inventory)
        const updateStockPromises = orderItems.map(item => 
            Product.updateOne(
                { _id: item.productId },
                { $inc: { count: -item.quantity } },
                { session }
            )
        );
        await Promise.all(updateStockPromises);

        // Clear the user's cart as part of the same transaction
        await Cartmodel.updateOne({ userId }, { $set: { items: [] } }, { session });

        await session.commitTransaction();
        session.endSession();

        res.status(201).json({
            success: true,
            message: "Order placed successfully!",
            order: savedOrder,
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();

        console.error("Order placement failed:", error);
        res.status(500).json({ 
            success: false, 
            message: error.message || "Failed to place order due to an internal error."
        });
    }
};

// Clear cart after order confirmation
export const clearCart = async (req, res) => {
    try {
        const userId = req.user.id;
        
        await Cartmodel.deleteOne({ userId });
        
        res.status(200).json({
            success: true,
            message: "Cart cleared successfully"
        });
    } catch (error) {
        console.error("Failed to clear cart:", error);
        res.status(500).json({
            success: false,
            message: "Failed to clear cart"
        });
    }
};

// Get all orders for a user
export const getUserOrders = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Fetch orders and populate product details
        const orders = await ordermodel
            .find({ userId })
            .populate('items.productId', 'title image price')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            orders: orders,
            count: orders.length
        });
    } catch (error) {
        console.error("Failed to fetch orders:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch orders"
        });
    }
};

// Get single order details
export const getOrderById = async (req, res) => {
    try {
        const userId = req.user.id;
        const { orderId } = req.params;

        const order = await ordermodel
            .findOne({ _id: orderId, userId })
            .populate('items.productId', 'title image price description');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        res.status(200).json({
            success: true,
            order: order
        });
    } catch (error) {
        console.error("Failed to fetch order:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch order details"
        });
    }
};

// Cancel order (only if status is "Processing")
export const cancelOrder = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const userId = req.user.id;
        const { orderId } = req.params;

        const order = await ordermodel
            .findOne({ _id: orderId, userId })
            .session(session);

        if (!order) {
            throw new Error("Order not found");
        }

        if (order.orderStatus !== "Processing") {
            throw new Error("Only processing orders can be cancelled");
        }

        // Restore product stock
        const restoreStockPromises = order.items.map(item => 
            Product.updateOne(
                { _id: item.productId },
                { $inc: { count: item.quantity } },
                { session }
            )
        );
        await Promise.all(restoreStockPromises);

        // Update order status
        order.orderStatus = "Cancelled";
        order.paymentStatus = order.paymentStatus === "Paid" ? "Refunded" : "Pending";
        await order.save({ session });

        await session.commitTransaction();
        session.endSession();

        res.status(200).json({
            success: true,
            message: "Order cancelled successfully",
            order: order
        });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();

        console.error("Failed to cancel order:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to cancel order"
        });
    }
};

// ==================== ADMIN ORDER ROUTES ====================

// GET all orders for admin (all users)
export const getAllUserOrders = async (req, res) => {
    try {
        const orders = await ordermodel.find()
            .populate('userId', 'username email phone')
            .populate('items.productId', 'title price image')
            .sort({ createdAt: -1 });

        if (!orders || orders.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'No orders found' 
            });
        }

        res.status(200).json({
            success: true,
            count: orders.length,
            orders: orders
        });

    } catch (error) {
        console.error('Error fetching all user orders:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch orders',
            error: error.message
        });
    }
};

// GET orders with filters (status, date range, user)
export const getFilteredOrders = async (req, res) => {
    try {
        const { status, startDate, endDate, userId, searchTerm } = req.query;
        
        let filter = {};

        if (status && status !== 'all') {
            filter.orderStatus = status;
        }

        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) filter.createdAt.$lte = new Date(endDate);
        }

        if (userId) {
            filter.userId = userId;
        }

        const orders = await ordermodel.find(filter)
            .populate('userId', 'username email phone')
            .populate('items.productId', 'title price image')
            .sort({ createdAt: -1 });

        let filteredOrders = orders;
        if (searchTerm) {
            filteredOrders = orders.filter(order => 
                order._id.toString().includes(searchTerm) ||
                order.userId?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                order.userId?.email?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        res.status(200).json({
            success: true,
            count: filteredOrders.length,
            orders: filteredOrders
        });

    } catch (error) {
        console.error('Error fetching filtered orders:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch filtered orders',
            error: error.message
        });
    }
};

// UPDATE order status (Admin only)
export const updateOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;

        const validStatuses = ['Processing', 'Shipped', 'Delivered', 'Cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status value. Must be: Processing, Shipped, Delivered, or Cancelled'
            });
        }

        const order = await ordermodel.findByIdAndUpdate(
            orderId,
            { 
                orderStatus: status, 
                updatedAt: Date.now() 
            },
            { new: true }
        )
            .populate('userId', 'username email phone')
            .populate('items.productId', 'title price image');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Order status updated successfully',
            order: order
        });

    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update order status',
            error: error.message
        });
    }
};

// GET single order details (Admin)
export const getOrderByIdAdmin = async (req, res) => {
    try {
        const { orderId } = req.params;

        const order = await ordermodel.findById(orderId)
            .populate('userId', 'username email phone')
            .populate('items.productId', 'title price image description');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        res.status(200).json({
            success: true,
            order: order
        });

    } catch (error) {
        console.error('Error fetching order details:', error);
        res.status(500).json({
            success: false,
            message: 'Failped to fetch order details',
            error: error.message
        });
    }
};

export const getOrderStatistics = async (req, res) => {
    try {
        const totalOrders = await ordermodel.countDocuments();
        const processingOrders = await ordermodel.countDocuments({ orderStatus: 'Processing' });
        const shippedOrders = await ordermodel.countDocuments({ orderStatus: 'Shipped' });
        const deliveredOrders = await ordermodel.countDocuments({ orderStatus: 'Delivered' });
        const cancelledOrders = await ordermodel.countDocuments({ orderStatus: 'Cancelled' });

        const orders = await ordermodel.find({ 
            orderStatus: { $in: ['Delivered', 'Shipped'] },
            paymentStatus: 'Paid'
        });
        const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

        const pendingOrders = await ordermodel.countDocuments({ 
            orderStatus: 'Processing',
            paymentStatus: 'Pending'
        });

        res.status(200).json({
            success: true,
            statistics: {
                totalOrders,
                pendingOrders,
                processingOrders,
                shippedOrders,
                deliveredOrders,
                cancelledOrders,
                totalRevenue: totalRevenue.toFixed(2)
            }
        });

    } catch (error) {
        console.error('Error fetching order statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch statistics',
            error: error.message
        });
    }
};