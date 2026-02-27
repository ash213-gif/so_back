const nodemailer = require("nodemailer");
require('dotenv').config()

const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

exports.sendEmail = async (email, otp, username) => {
  try {
    const info = await transporter.sendMail({
      from: `"Your App" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your OTP for Account Verification',
      text: `Hello ${username},\nYour OTP is: ${otp}`,
      html: `<p>Hello ${username},</p><b>Your OTP is: ${otp}</b>`,
    });

    console.log("Message sent:", info.messageId);
  } catch (err) {
    console.error("Email failed:", err.message);
  }
};

