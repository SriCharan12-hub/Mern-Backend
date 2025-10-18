import mongoose from "mongoose"
export default function connect(uri){
    try{
        mongoose.connect(uri)
        console.log('Connected Suuessfull to Db')
    }
    catch(err){
        console.log("error in connecting MongoDb")
    }
    


}