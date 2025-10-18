import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user", 
        required: true,
    },

    
    items: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product", 
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
            min: 1,
        },
        
        priceAtOrder: {
            type: Number,
            required: true,
        }
    }],

    
    shippingDetails: {
        fullName: { type: String, required: true },
        Address: { type: String, required: true },
        City: { type: String, required: true },
        postalCode: { type: String, required: true },
        PhoneNumber: { type: String, required: true },
    },

    
    totalAmount: {
        type: Number,
        required: true,
    },
    paymentMethod: {
        type: String,
        enum: ["creditCard", "upi", "cod"], 
        required: true,
    },
    paymentStatus: {
        type: String,
        enum: ["Pending", "Paid", "Failed", "Refunded"],
        default: "Pending", 
    },

    
    orderStatus: {
        type: String,
        enum: ["Processing", "Shipped", "Delivered", "Cancelled"],
        default: "Processing",
    },

}, { 
    timestamps: true // Adds createdAt and updatedAt fields
});

const ordermodel = mongoose.model("Order", orderSchema, "Orders");
export default ordermodel;