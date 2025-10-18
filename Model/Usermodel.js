import mongoose from "mongoose";

const data = new mongoose.Schema({
    username:{
        type:String,
        required: [true, "Username is required"],
        trim: true,
        minlength: [3, "Username must be at least 3 characters long"],
        maxlength: [30, "Username cannot exceed 30 characters"]
    },
    email:{
        type:String,
         required: [true, "Email is required"],
         unique: true,
    },
    password:{
        type:String,
        required: [true, "Password is required"]
    },
    addresses: [{
        fullName: { type: String, required: true },
        phoneNumber: { type: Number,min:10,max:10, required: true },
        streetAddress: { type: String, required: true },
        city: { type: String, required: true },
        postalCode: { type: Number, required: true },
        country: { type: String, required: true },
    }],

})
const usermodel= mongoose.model("user",data,"Userlist")
export default usermodel