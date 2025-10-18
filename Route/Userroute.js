import { useradd, userlogin, updateuser, getdetails, googleLogin, resetpassword } from "../Controller/Usercontroller.js";
import { addProduct, getProducts, updateProduct, deleteProduct } from "../Controller/Productcontroller.js";
import { getCart, removeFromCart, addToCart, updateQuantity } from "../Controller/Cartcontroller.js";
import { placeOrder, clearCart, getUserOrders, getOrderById, cancelOrder } from "../Controller/Ordercontoller.js";
import { addItemToWishlist, getWishlist, removeItemFromWishlist } from "../Controller/Wishlistcontroller.js"
import { forgotPassword, verifyOtp } from "../Controller/ResetPincontroller.js";
import { Router } from "express";
import authMiddleware from "../Connection/middleware.js";
import { addAddress, deleteAddress, getAddressesByUserId, updateAddress } from "../Controller/AddressController.js";
import { getAllUserOrders, getFilteredOrders, getOrderStatistics, updateOrderStatus, getOrderByIdAdmin } from "../Controller/Ordercontoller.js";
import { submitFeedback, getAllFeedback, getFeedbackStats, getFeedbackById, updateFeedbackStatus, deleteFeedback } from "../Controller/FeedBackcontroller.js";

const route = Router()

// ============================================
// USER ROUTES
// ============================================
route.post('/register', useradd)
route.post('/login', userlogin)
route.post('/login/google', googleLogin)
route.put('/user/update', authMiddleware, updateuser)
route.get('/user/get', authMiddleware, getdetails)
route.put('/user/resetpassword', resetpassword)

// ============================================
// RESET PASSWORD ROUTES
// ============================================
route.post("/forgot-password", forgotPassword);
route.post("/verify-otp", verifyOtp);

// ============================================
// CART ROUTES
// ============================================
route.get('/cart', authMiddleware, getCart);
route.post('/cart/add', authMiddleware, addToCart);
route.put('/cart/item', authMiddleware, updateQuantity);
route.delete('/cart/item', authMiddleware, removeFromCart);
route.delete('/clear-cart', authMiddleware, clearCart);

// ============================================
// PRODUCT ROUTES
// ============================================
route.post('/products/add', authMiddleware, addProduct)
route.get('/products/get', authMiddleware, getProducts)
route.put('/products/:id', authMiddleware, updateProduct);
route.delete('/products/:id', authMiddleware, deleteProduct);

// ============================================
// WISHLIST ROUTES
// ============================================
route.get('/wishlist/get', authMiddleware, getWishlist);
route.post('/wishlist/add', authMiddleware, addItemToWishlist);
route.delete('/wishlist/remove', authMiddleware, removeItemFromWishlist);

// ============================================
// ADDRESS ROUTES
// ============================================
route.post('/addaddress', authMiddleware, addAddress)
route.get('/getaddress', authMiddleware, getAddressesByUserId)
route.put('/updateaddress/:id', authMiddleware, updateAddress)
route.delete('/deleteaddress/:id', authMiddleware, deleteAddress)

// ============================================
// FEEDBACK ROUTES - MUST COME BEFORE ORDER ROUTES
// ============================================
route.post('/feedback/submit', authMiddleware, submitFeedback);
route.get('/feedback/stats', authMiddleware, getFeedbackStats);
route.get('/feedback', authMiddleware, getAllFeedback);
route.get('/feedback/:id', authMiddleware, getFeedbackById);
route.put('/feedback/:id/status', authMiddleware, updateFeedbackStatus);
route.delete('/feedback/:id', authMiddleware, deleteFeedback);

// ============================================
// ADMIN ORDER ROUTES
// ============================================
route.get('/admin/orders/statistics', authMiddleware, getOrderStatistics);
route.get('/admin/orders/filter', authMiddleware, getFilteredOrders);
route.get('/admin/all-orders', authMiddleware, getAllUserOrders);
route.get('/admin/orders/:orderId', authMiddleware, getOrderByIdAdmin);
route.put('/admin/orders/:orderId/status', authMiddleware, updateOrderStatus);

// ============================================
// ORDER ROUTES - THESE MUST BE LAST
// ============================================


//order
route.post('/place', authMiddleware, placeOrder);

// Clear cart after order confirmation
route.delete('/clear-cart', authMiddleware, clearCart);

// Get all orders for logged-in user
route.get('/my-orders', authMiddleware, getUserOrders);

// Get specific order details
route.get('/:orderId', authMiddleware, getOrderById);

// Cancel an order
route.put('/:orderId/cancel', authMiddleware, cancelOrder);

export default route;