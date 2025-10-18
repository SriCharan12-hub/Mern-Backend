
import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
     id: {
        type: Number,
        required: true, 
        unique: true  
    },
    image: {
        type: String,
        // required: true,
        trim: true 
    },
    images:{
        type: [String]
    },
    
    title: {
        type: String,
        required: true,
        trim: true,
        minlength: 3, 
        maxlength: 100 
    },

    description: {
        type: String,
        required: true,
        trim: true,
        minlength: 10,
        maxlength: 1500 
    },

  
    price: {
        type: Number,
        required: true,
        min: 0 
    },

  
    category: {
        type: String,
        required: true,
        trim: true,
    },
    count: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },

});

const Product = mongoose.model('Product', productSchema,"Products");

export default Product;