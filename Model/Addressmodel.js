import mongoose from "mongoose";
const addressSchema = new mongoose.Schema({ 
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true,
    },
    fullName:{
        type:String,
        required:true
    },
    Address:{
        type:String,
        required:true
    },
    City:{
        type:String,
        required:true
    },
    postalCode:{
        type:String,
        required:true,
        minLength:5,
        maxLength:6
    },
    PhoneNumber:{
        type:String,
        required:true,
        minLength:10,
        maxLength:10
    }

})
const addressmodel = mongoose.model("Address",addressSchema,"Address")
export default addressmodel