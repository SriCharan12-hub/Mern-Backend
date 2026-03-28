import usermodel from "../Model/Usermodel.js";
import jsonwebtoken from "jsonwebtoken";
import bcrypt from "bcrypt";
import { OAuth2Client } from "google-auth-library";

/* ===========================
   ✅ VALIDATION FUNCTIONS
=========================== */

// ✅ Email validation (normal + company)
const validateEmail = (email) => {
  if (!email) {
    return { isValid: false, message: "Email is required" };
  }

  const trimmedEmail = email.trim().toLowerCase();

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  if (!emailRegex.test(trimmedEmail)) {
    return { isValid: false, message: "Please enter a valid email address" };
  }

  return { isValid: true, message: "Email is valid ✅", value: trimmedEmail };
};

// ✅ Username validation
const validateUsername = (username) => {
  if (!username) {
    return { isValid: false, message: "Username is required" };
  }

  const trimmedUsername = username.trim();

  if (trimmedUsername.length < 3 || trimmedUsername.length > 20) {
    return {
      isValid: false,
      message: "Username length should be between 3-20 characters",
    };
  }

  // ✅ Must start with letter, allowed: letters, numbers, underscore
  const usernameRegex = /^[A-Za-z][A-Za-z0-9_]*$/;

  if (!usernameRegex.test(trimmedUsername)) {
    return {
      isValid: false,
      message:
        "Username must start with a letter and contain only letters, numbers, and underscore (_)",
    };
  }

  // ✅ At least 1 capital letter
  if (!/[A-Z]/.test(trimmedUsername)) {
    return {
      isValid: false,
      message: "Username must contain at least 1 capital letter (A-Z)",
    };
  }

  // ✅ At least 1 small letter
  if (!/[a-z]/.test(trimmedUsername)) {
    return {
      isValid: false,
      message: "Username must contain at least 1 small letter (a-z)",
    };
  }

  return { isValid: true, message: "Username is valid ✅", value: trimmedUsername };
};

// ✅ Password validation
const validatePassword = (password) => {
  if (!password) {
    return { isValid: false, message: "Password is required" };
  }

  if (password.includes(" ")) {
    return { isValid: false, message: "Password should not contain spaces" };
  }

  if (password.length < 8 || password.length > 20) {
    return {
      isValid: false,
      message: "Password length should be between 8-20 characters",
    };
  }

  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: "Password must contain at least 1 capital letter (A-Z)" };
  }

  if (!/[a-z]/.test(password)) {
    return { isValid: false, message: "Password must contain at least 1 small letter (a-z)" };
  }

  if (!/[0-9]/.test(password)) {
    return { isValid: false, message: "Password must contain at least 1 number (0-9)" };
  }

  if (!/[@$!%*?&]/.test(password)) {
    return {
      isValid: false,
      message: "Password must contain at least 1 special character (@ $ ! % * ? &)",
    };
  }

  return { isValid: true, message: "Password is strong ✅" };
};

/* ===========================
   ✅ REGISTER USER
=========================== */
export const useradd = async (req, res) => {
  try {
    const { email, username, password, confirmPassword } = req.body;

    // ✅ empty fields
    if (!email || !username || !password || !confirmPassword) {
      return res.status(400).json({ message: "Fill all the details" });
    }

    // ✅ validate email
    const emailCheck = validateEmail(email);
    if (!emailCheck.isValid) {
      return res.status(400).json({ message: emailCheck.message });
    }

    // ✅ validate username
    const usernameCheck = validateUsername(username);
    if (!usernameCheck.isValid) {
      return res.status(400).json({ message: usernameCheck.message });
    }

    // ✅ validate password
    const passCheck = validatePassword(password);
    if (!passCheck.isValid) {
      return res.status(400).json({ message: passCheck.message });
    }

    // ✅ confirm password match
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Password and Confirm Password aren't matching" });
    }

    // ✅ check email duplicate
    const emailExists = await usermodel.findOne({ email: emailCheck.value });
    if (emailExists) {
      return res.status(400).json({ message: "Email is already registered" });
    }

    // ✅ check username duplicate
    const usernameExists = await usermodel.findOne({ username: usernameCheck.value });
    if (usernameExists) {
      return res.status(400).json({ message: "Username is already taken" });
    }

    // ✅ hash password
    const hashedpassword = await bcrypt.hash(password, 10);

    // ✅ save user
    const data = new usermodel({
      email: emailCheck.value,
      username: usernameCheck.value,
      password: hashedpassword,
    });

    const savedData = await data.save();

    return res.status(201).json({
      message: "Registered successfully ✅",
      result: savedData,
    });
  } catch (err) {
    console.error("Register Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/* ===========================
   ✅ LOGIN USER
=========================== */
export const userlogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // ✅ empty fields
    if (!email || !password) {
      return res.status(400).json({ message: "Fill all the details" });
    }

    // ✅ validate email format
    const emailCheck = validateEmail(email);
    if (!emailCheck.isValid) {
      return res.status(400).json({ message: emailCheck.message });
    }

    // ✅ find user
    const user = await usermodel.findOne({ email: emailCheck.value });
    if (!user) {
      return res.status(400).json({ message: "Email not registered" });
    }

    // ✅ compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Password doesn't match" });
    }

    // ✅ create token
    const jwttoken = jsonwebtoken.sign(
      { id: user._id, email: user.email },
      process.env.secret_key,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      message: "Login successfully ✅",
      result: user,
      jwttoken,
    });
  } catch (err) {
    console.error("Login Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/* ===========================
   ✅ UPDATE USER PASSWORD
=========================== */
export const updateuser = async (req, res) => {
  try {
    const userId = req.user.id;
    const { password, confirmPassword } = req.body;

    // ✅ 1) Empty fields
    if (!password || !confirmPassword) {
      return res.status(400).json({ message: "Fill all the details" });
    }

    // ✅ 2) Validate Password (strong rules)
    const passCheck = validatePassword(password);
    if (!passCheck.isValid) {
      return res.status(400).json({ message: passCheck.message });
    }

    // ✅ 3) Confirm password matching
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Password and Confirm Password aren't matching" });
    }

    // ✅ 4) Get current user data
    const user = await usermodel.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ 5) Don't allow same old password for that user
    const isSameOldPassword = await bcrypt.compare(password, user.password);
    if (isSameOldPassword) {
      return res.status(400).json({ message: "New password cannot be the same as old password" });
    }

    // ✅ 6) (Optional) Prevent password already used by any other user (your logic)
    const allUsers = await usermodel.find({});
    for (let u of allUsers) {
      const isSame = await bcrypt.compare(password, u.password);
      if (isSame) {
        return res.status(400).json({ message: "Password is already used by another user" });
      }
    }

    // ✅ 7) Hash & update
    const hashedpassword = await bcrypt.hash(password, 10);

    const updatedUser = await usermodel.findByIdAndUpdate(
      userId,
      { password: hashedpassword },
      { new: true }
    );

    return res.status(200).json({
      message: "User updated successfully ✅",
      updatedUser,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Error in updating user",
      error: err.message,
    });
  }
};


/* ===========================
   ✅ GET USER DETAILS
=========================== */
export const getdetails = async (req, res) => {
  try {
    const userId = req.user.id;

    const gettingdetails = await usermodel.findById(userId);

    if (!gettingdetails) {
      return res.status(400).json({ message: "User not found" });
    }

    const { email, username } = gettingdetails;

    return res.status(200).json({
      message: "Getting details of user ✅",
      result: { email, username },
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};


/* ===========================
   ✅ GOOGLE LOGIN
=========================== */
export const googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ message: "idToken is required" });
    }

    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    const email = payload?.email;
    const name = payload?.name || (email && email.split("@")[0]);

    if (!email) {
      return res.status(400).json({ message: "Google token did not contain email" });
    }

    let user = await usermodel.findOne({ email });

    // ✅ create user if not exists
    if (!user) {
      const randomPass = Math.random().toString(36).slice(-8);
      const hashedpassword = await bcrypt.hash(randomPass, 10);

      const newUser = new usermodel({
        email,
        username: name,
        password: hashedpassword,
      });

      user = await newUser.save();
    }

    const jwttoken = jsonwebtoken.sign(
      { id: user._id, email: user.email },
      process.env.secret_key,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      message: "Login successful ✅",
      result: user,
      jwttoken,
    });
  } catch (err) {
    console.error("Google login error", err);
    return res.status(500).json({
      message: "Google authentication failed",
      error: err.message,
    });
  }
};

/* ===========================
   ✅ RESET PASSWORD
=========================== */
export const resetpassword = async (req, res) => {
  try {
    const { email, password, confirmpassword } = req.body;

    if (!email || !password || !confirmpassword) {
      return res.status(400).json({ message: "Fill all the details" });
    }

    // ✅ validate email format
    const emailCheck = validateEmail(email);
    if (!emailCheck.isValid) {
      return res.status(400).json({ message: emailCheck.message });
    }

    // ✅ validate password
    const passCheck = validatePassword(password);
    if (!passCheck.isValid) {
      return res.status(400).json({ message: passCheck.message });
    }

    if (password !== confirmpassword) {
      return res.status(400).json({ message: "Password doesn't match" });
    }

    const user = await usermodel.findOne({ email: emailCheck.value });

    if (!user) {
      return res.status(404).json({ message: "User not found with this email." });
    }

    // ✅ prevent same old password
    const isSame = await bcrypt.compare(password, user.password);
    if (isSame) {
      return res.status(400).json({ message: "Password is already used" });
    }

    const hashedpassword = await bcrypt.hash(password, 10);

    const updatedUser = await usermodel.findByIdAndUpdate(
      user._id,
      { password: hashedpassword },
      { new: true }
    );

    return res.status(200).json({
      message: "Password updated successfully ✅",
      updatedUser,
    });
  } catch (err) {
    console.log("Reset Password Error:", err);
    return res.status(500).json({ message: "Error in updating user", error: err.message });
  }
};
