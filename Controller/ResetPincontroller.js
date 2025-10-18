import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import resetpin from '../Model/ResetPinmodel.js';
import bcrypt from "bcrypt"
import usermodel from '../Model/Usermodel.js';
dotenv.config();

// export async function sendEmail(req,res) {
//   try {
//     const transporter = nodemailer.createTransport({
//       service: 'gmail',
//       auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASS,
//       },
//     });
//     const pin = Math.floor(1000 + Math.random() * 9000)
//     const expiresAt = new Date(Date.now() + 10 * 60 * 1000); 

//     // Mail options
//     const mailOptions = {
//       from: `"My App" <${process.env.EMAIL_USER}>`,
//       to: 'sric6618@gmail.com',
//       subject: 'Hello from Nodemailer 🚀',
//       text: 'This is a test email sent using Nodemailer.',
//       html: `Hello this is from nodemailer your otp is ${pin} it will expire in 10minutes`,
//     };

//     // Send
//     const info = await transporter.sendMail(mailOptions);
//     console.log('✅ Email sent:', info.messageId);
//   } catch (err) {
//     console.error('❌ Error sending email:', err);
//   }
// }

// sendEmail();
function generatePin(){
    return Math.floor(1000 + Math.random() * 9000);
}

export async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email required" });

    const pin = generatePin();
    const salt = await bcrypt.genSalt(10);
    const pinHash = await bcrypt.hash(pin.toString(), salt);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min
   

    await resetpin.create({ email, pinHash, expiresAt });
    const emailverify = await usermodel.findOne({email})
    if (!emailverify){
      return res.status(500).json({error:"user is not registered"})
    }
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });


    await transporter.sendMail({
      from: `"My App" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your OTP Code",
      html: `<p>Hello, your OTP is <b>${pin}</b>. It expires in 10 minutes.</p>`,
    });

    res.json({ message: "OTP sent to email" });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ error: "Failed to send OTP" });
  }
}

// Verify OTP
export async function verifyOtp(req, res) {
  try {
    const { email, pin } = req.body;
    if (!email || !pin) return res.status(400).json({ error: "Email and PIN required" });

    const record = await resetpin.findOne({ email }).sort({ createdAt: -1 });
    if (!record) return res.status(400).json({ error: "No OTP request found" });

    // Check expiry
    if (record.expiresAt < new Date()) {
      await ResetPin.deleteOne({ _id: record._id });
      return res.status(400).json({ error: "OTP expired" });
    }

    // Compare hash
    const isMatch = await bcrypt.compare(pin.toString(), record.pinHash);
    if (!isMatch) return res.status(400).json({ error: "Invalid OTP" });

    // ✅ Valid OTP → delete record
    await resetpin.deleteOne({ _id: record._id });

    res.json({ message: "OTP verified successfully" });
  } catch (err) {
    console.error("Verify OTP error:", err);
    res.status(500).json({ error: "Failed to verify OTP" });
  }
}