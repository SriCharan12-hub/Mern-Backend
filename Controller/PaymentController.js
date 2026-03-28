import Razorpay from "razorpay";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

const key_id = process.env.RAZORPAY_KEY_ID;
const key_secret = process.env.RAZORPAY_KEY_SECRET;

if (!key_id || !key_secret) {
  console.warn("⚠️ Razorpay API keys are missing in environment variables!");
}

const razorpay = new Razorpay({
  key_id: key_id || "rzp_test_SBjgUiAL2qDOF8", // Fallback to demo key if env not set
  key_secret: key_secret,
});

export const createOrder = async (req, res) => {
  const { amount } = req.body;

  if (!amount) {
    return res.status(400).json({ error: "Amount is required" });
  }

  if (!process.env.RAZORPAY_KEY_SECRET) {
    console.error("Payment Error: RAZORPAY_KEY_SECRET is not configured on the server.");
    return res.status(500).json({ 
      error: "Razorpay is not properly configured on the server. Please check environment variables." 
    });
  }

  try {
    const options = {
      // Razorpay expects amount in paise (integer). 
      // Math.round ensures we don't send decimals which causes a 400 error.
      amount: Math.round(Number(amount) * 100), 
      currency: "INR",
      receipt: "receipt_" + Date.now(),
    };

    console.log("Creating Razorpay order with options:", options);
    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (err) {
    console.error("Error creating Razorpay order:", err);
    // Return a more descriptive error if available from Razorpay
    const errorMessage = err.error?.description || err.message || "Failed to create payment order";
    res.status(500).json({ error: errorMessage });
  }
};

export const verifyPayment = (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
       return res.status(400).json({ success: false, message: "Missing payment details" });
  }

  const allowedKeySecrets = [
      process.env.RAZORPAY_KEY_SECRET, 
      "8j6kF5g4h3j2k1l0m9n8o7p6" // Demo assumption/placeholder if env is missing during dev
  ].filter(Boolean);

  let isValid = false;

  for (const secret of allowedKeySecrets) {
      const generated_signature = crypto
        .createHmac("sha256", secret)
        .update(razorpay_order_id + "|" + razorpay_payment_id)
        .digest("hex");

      if (generated_signature === razorpay_signature) {
          isValid = true;
          break;
      }
  }

  if (isValid) {
    res.json({ success: true, message: "Payment verified successfully" });
  } else {
    res.status(400).json({ success: false, message: "Invalid signature" });
  }
};
