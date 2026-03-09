const nodemailer = require("nodemailer");
require('dotenv').config()

const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  
  port: 587,
  secure: false,
  auth: {
     type: "OAuth2",
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

exports.sendEmail = (email, otp, username) => {  // async hataya, promise return karo
  return new Promise((resolve, reject) => {
    transporter.sendMail({
      from: `"Your App" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your OTP for Account Verification',
      text: `Hello ${username},\nYour OTP is: ${otp}`,
      html: `<p>Hello ${username},</p><b>Your OTP is: ${otp}</b>`,
    }, (err, info) => {
      if (err) {
        console.error("Email error:", err);
        reject(err);  // Reject karo
      } else {
        console.log("Email sent:", info.messageId);
        resolve(info);
      }
    });
  });
};


