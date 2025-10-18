import usermodel from "../Model/Usermodel.js";
import jsonwebtoken from "jsonwebtoken"
import bcrypt from "bcrypt"
import { OAuth2Client } from 'google-auth-library'

export const useradd = async (req, res) => {
  try {
    const { email, username, password,confirmPassword } = req.body;
    if (!email || !username || !password || !confirmPassword ) {
      return res.status(400).json({ message: "Fill all the details" });
    }

    // check email format
    if (!email.endsWith("@gmail.com")) {
      return res.status(400).json({ message: "Email must end with @gmail.com" });
    }


    if (username.length<3 || username.length>20){
      res.status(400).json({
        message:"length of username should be btw 3-20"
      })
      return 
    }



    if (password.length<3 || password.length>20){
      res.status(400).json({
        message:"length of password should be btw 3-20"
      })
      return 
    }



    // check for duplicates separately
    const emailExists = await usermodel.findOne({ email });
    if (emailExists) {
      return res.status(400).json({ message: "Email is already registered" });
    }

    const usernameExists = await usermodel.findOne({ username });
    if (usernameExists) {
      return res.status(400).json({ message: "Username is already taken" });
    }

    // confirm password must match the plain text passwords before hashing
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Password and Confirm Password aren't matching" });
    }


    const hashedpassword = await bcrypt.hash(password,10)
    const data = new usermodel({ email, username, password:hashedpassword });
    const savedData = await data.save();

    res.status(201).json({
      message: "Registered successfully",
      result: savedData,
    });
  } catch (err) {
    console.error("Enter valid Credentials", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const userlogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    // check empty fields
    if (!email || !password) {
      return res.status(400).json({ message: "Fill all the details" });
    }
    if (!email.endsWith("@gmail.com")) {
      return res.status(400).json({ message: "Email must end with @gmail.com" });
    }

    // find user by email
    const user = await usermodel.findOne({ email });
     if (user==null){
      return res.status(400).json({ message: "Email not registered" });

    }
    if (!user ) {
      return res.status(400).json({ message: "Email not registered" });
    }

   

    //length of username and password 



    if (password.length<3 || password.length>20){
      res.status(400).json({
        message:"length of password should be btw 3-20"
      })
      return 
    }
   

    // compare password
    const isMatch = await bcrypt.compare(password,user.password)
    if (!isMatch) {
      return res.status(400).json({ message: "Password doesn't match" });
    }
    // const accesstoken = jsonwebtoken.sign({id:user._id.toString(),email:user.email},process.env.secret_key,{expiresIn:"7d"})
   const jwttoken = jsonwebtoken.sign({ id: user._id, email: user.email }, process.env.secret_key, { expiresIn: "7d" });

  res.status(200).json({
  message: "Login successfully",
  result: user,
  jwttoken
});
  } catch (err) {
    console.error("Enter valid Credentials", err);
    res.status(500).json({ message: "server error" });
  }
};

export const updateuser = async (req,res)=>{
  const userId = req.user.id
  const {password,confirmPassword} = req.body 
  try{
    if (!confirmPassword || !password) {
      return res.status(400).json({ message: "Fill all the details" });
    }
    if (password.length<3 || password.length>20){
       return  res.status(400).json({
         message:"length of password should be btw 3-20"
      })
     
    }
    if (password!==confirmPassword){
       return res.status(400).json({message:"Password doesn't match"})
       
    }
    const allUsers = await usermodel.find({});
    for (let u of allUsers) {
      const isSame = await bcrypt.compare(password, u.password);
      if (isSame) {
        return res.status(400).json({ message: "Password is already used" });
      }
    }

    const hashedpassword = await bcrypt.hash(password,10)
    const updateuser = await usermodel.findByIdAndUpdate(userId,{password:hashedpassword},{new:true})
    res.status(200).json({message:"user updated successfully",updateuser})

  }
  catch(err){
    res.status(500).json({message:"error in updating user",error:err.message})

  }
}

export const getdetails = async(req,res)=>{
  const userId = req.user.id
  const gettingdetails = await usermodel.findById(userId)
  if (!gettingdetails){
    res.status(400).json({message:"user ledu"})
    return 
  }
  const {email,username,password} = gettingdetails
  res.status(200).json({message:"getting details of user",result:{email,password,username}})
}

export const googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ message: 'idToken is required' });

    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT_ID });

    const payload = ticket.getPayload();
    console.log(payload)
    const email = payload.email;
    const name = payload.name || (email && email.split('@')[0]);

    if (!email) return res.status(400).json({ message: 'Google token did not contain email' });

    let user = await usermodel.findOne({ email });
    if (!user) {
      // create new user with a random password (hashed)
      const randomPass = Math.random().toString(36).slice(-8);
      const hashedpassword = await bcrypt.hash(randomPass, 10);
      const newUser = new usermodel({ email, username: name || email, password: hashedpassword });
      user = await newUser.save();
    }

    const jwttoken = jsonwebtoken.sign({ id: user._id, email: user.email }, process.env.secret_key, { expiresIn: '7d' });
    res.status(200).json({ message: 'Login successful', result: user, jwttoken });
  } catch (err) {
    console.error('Google login error', err);
    res.status(500).json({ message: 'Google authentication failed', error: err.message });
  }
}

export const resetpassword = async (req, res) => {
    try {
       
        const { email, password, confirmpassword } = req.body; 

        
        if (!confirmpassword || !password || !email) { 
            return res.status(400).json({ message: "Fill all the details" });
        }
        
        if (password.length < 3 || password.length > 20) {
            return res.status(400).json({
                message: "Length of password should be between 3-20"
            });
        }
        
        if (password !== confirmpassword) {
            return res.status(400).json({ message: "Password doesn't match" });
        }
        
        const user = await usermodel.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "User not found with this email." });
        }

        // Check if the new password is the same as the current one
        const isSame = await bcrypt.compare(password, user.password);
        if (isSame) {
            return res.status(400).json({ message: "Password is already used" });
        }
        
        const hashedpassword = await bcrypt.hash(password, 10);
        
      
        const updateuser = await usermodel.findByIdAndUpdate(
            user._id, // <-- THIS IS THE FIX
            { password: hashedpassword },
            { new: true }
        );

        res.status(200).json({ message: "Password updated successfully", updateuser });

    } catch (err) {
        console.log("err", err);
        res.status(500).json({ message: "Error in updating user", error: err.message });
    }
}

