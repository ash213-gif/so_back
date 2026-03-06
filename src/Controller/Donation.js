const jwt = require('jsonwebtoken')
const DonationSchema = require('../Schema/Donation')
const CampaignSchema = require('../Schema/Campagin')
const userSchema = require('../Schema/User')
const crypto = require("crypto"); 
const razorpay = require('../Payments/razorpay').razorpay
require('dotenv').config()

exports.createDonation = async (req, res, next) => {
  try {
    const { donorId, campaignId, amount } = req.body;

    if (!donorId || !campaignId || !amount) {
      return res.status(400).json({
        status: false,
        message: "Please provide donorId, campaignId and amount",
      });
    }
    await userSchema.findByIdAndUpdate(
      donorId,
      { $inc: { amount: amount } }, // total badhao
      { new: true }
    );

    // Prepare Razorpay order options
    const options = {
      amount: amount * 100,          // amount in paise, required
      currency: "INR",               // required by Razorpay
      receipt: "receipt_" + Date.now(),
      notes: {
        donorId,
        campaignId,                  // optional metadata stored with the order
      },
    };

    const order = await razorpay.orders.create(options); // returns id, amount, etc.

    return res.status(200).json({
      message: "Order created successfully",
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      donorId,
      campaignId,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      
      message: error.message || "Internal server error",
    });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        status: false,
        message: "Missing payment details",
      });
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        status: false,
        message: "Invalid signature",
      });
    }

    // ✅ Fetch Order from Razorpay to get notes
    const order = await razorpay.orders.fetch(razorpay_order_id);

    const { donorId, campaignId } = order.notes;
    const amount = order.amount / 100;

    // ✅ Save Donation in DB
    await DonationSchema.create({
      donorId,
      campaignId,
      amount,
       transactionId: razorpay_payment_id, 
      orderId: razorpay_order_id,
    });

    // ✅ Update Campaign Raised Amount
    await CampaignSchema.findByIdAndUpdate(
      campaignId,
      { $inc: { raisedAmount: amount } },
      { new: true }
    );

    return res.status(200).json({
      status: true,
      message: "Payment verified & donation saved successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: false,
      message: "Payment verification failed",
    });
  }
};