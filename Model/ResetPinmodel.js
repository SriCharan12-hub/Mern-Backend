
import mongoose from "mongoose";
const resetSchema = new mongoose.Schema({
  email: { type: String, required: true },
  pinHash: { type: String, required: true },
  expiresAt: { type: Date, required: true },
}, { timestamps: true });

resetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });


const resetpin =  mongoose.model("ResetPin", resetSchema,"resetpin");
export default resetpin
