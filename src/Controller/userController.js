const User = require('../Schema/User');
const mongoose = require('mongoose');
const DonationSchema   = require('../Schema/Donation');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { sendEmail} =require('../Mail/Mail')
const {redisClient}= require('../Redis/Redis')
const { getIO } = require("../Redis/Socket");



exports.getUsers = async (req, res) => {
  try {
    const users = await User.find();
    const count = await User.countDocuments();
    res.json({ users, count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/users/:userId/transactions/summary
exports.Transactionsummary = async (req, res) => {
  try {
    const io = getIO();
    const { id } = req.params;
    const cacheKey = `user:${id}:transactions`;

    const cachedData = await redisClient.get(cacheKey);
    
    if (cachedData) {
      return res.status(200).json(JSON.parse(cachedData));
    }
    
    const txs = await DonationSchema.find({ donorId: id }).sort({ createdAt: -1 });
    const totalTimes = txs.length;
    const totalAmount = txs.reduce((sum, t) => sum + t.amount, 0);

    
    const result = { totalTimes, totalAmount, history: txs };
    io.emit("transaction:summary", result)
    await redisClient.setEx(cacheKey, 60, JSON.stringify(result));

    res.json(result);

  } catch (err) {
    console.log(err)
    res.status(500).json({ message: 'Failed to get summary' });
  }
}


exports.updatedUser = async (req, res) => {
  try {
    const { id } = req.params;

    // body se fields lo
    let { username, email, password } = req.body;

    const updateData = {};

    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 12);
      updateData.password = hashedPassword;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "No fields to update" });
    }

    const updatedUser = await User.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    const io = getIO();
    io.emit("user:updated", updatedUser);

    res.json({ message: "User updated successfully", result: updatedUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// delete users
exports.DeleteAccount = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // optional: related data delete karo (donations, sessions, etc.)
    // await Donation.deleteMany({ donorId: id });

    // optional: socket event
    try {
      const io = getIO();
      io.emit("user:deleted", { userId: id });
    } catch (e) {
      // agar socket init nahi hai to ignore
    }

    res.json({ message: "Account deleted successfully", result: deletedUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete account" });
  }
};

// deactivate user
exports.DeactivateAccount = async (req, res) => {
  try {

    const { id } = req.params;

    const user = await User.findByIdAndUpdate(
      id,
      { isverify: false },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    res.status(200).json({
      message: "Account deactivated successfully",
      user
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};

exports.signup = async (req, res) => {
  const { username, email, password } = req.body;
  try {

    if (mongoose.connection.readyState !== 1) {
      return res.status(500).json({ message: 'Database not connected' });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const user = new User({
      username,
      email,
      password: hashedPassword,
      Otp: otp,
      isverify: false,
      isBlocked: false,
    });
    await sendEmail(email, otp, username)
    const newUser = await user.save();
    res.status(201).json({ result: newUser, message: 'Signup successful. OTP sent to your email.' });
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(500).json({ message: 'Database not connected' });
    }
    const existingUser = await User.findOne({ email });
    if (!existingUser) return res.status(404).json({ message: "User doesn't exist." });

    if (existingUser.isBlocked) {
      return res.status(403).json({ message: "Your account is blocked. Please contact support." });
    }
    if (!existingUser.isverify) {
      return res.status(403).json({ message: "Your account is not verified. Please verify your email." });
    }

    const isPasswordCorrect = await bcrypt.compare(password, existingUser.password);
    if (!isPasswordCorrect) return res.status(400).json({ message: "Invalid credentials." });

    const token = jwt.sign({ email: existingUser.email, id: existingUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(200).json({ message: 'Login Successful', result: existingUser, token });
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: 'Something went wrong.' });
  }
};


exports.verifyOtp = async (req, res) => {
  const { id } = req.params;
  const { Otp } = req.body;
  try {
   
    if (!req.body || !req.body.Otp) {
      return res.status(400).json({ message: 'OTP is required' });
    }


    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isverify) {
      return res.status(400).json({ message: 'User already verified' });
    }

    if (user.Otp !== Otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    user.isverify = true;
    user.Otp = '';

    const updatedUser = await user.save();

    return res.status(200).json({
      message: 'OTP verified successfully',
      result: updatedUser,
    });

  } catch (error) {
    console.log(error);
    return res.status(500).json({ message:error });
  }
};

//resend otp

exports.resendOtp = async (req, res) => {
  try {
    const { id } = req.params;
console.log(id)
    // 1️⃣ Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    // 2️⃣ Find user
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const email = user.email;
    console.log(email)
    const username = user.username || user.name || "User";

    // 3️⃣ Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 4️⃣ Send Email
    const emailSent = await sendEmail(email, otp, username);

    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: "Failed to send OTP email",
      });
    }

    // 5️⃣ Save OTP in DB
    user.Otp = otp;
    await user.save();

    // 6️⃣ Response
    return res.status(200).json({
      success: true,
      message: "OTP resent successfully",
      userId: user._id,
    });

  } catch (error) {
    console.error("Resend OTP Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while resending OTP",
    });
  }
};