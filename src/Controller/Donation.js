const jwt = require('jsonwebtoken')
const DonationSchema = require('../Schema/Donation')
const CampaignSchema = require('../Schema/Campagin')
const crypto = require("crypto"); 
const razorpay = require('../Payments/razorpay').razorpay
require('dotenv').config()

exports.createDonation = async (req, res) => {
  try {
    const { donorId, campaignId, amount } = req.body;

    if (!donorId || !campaignId || !amount) {
      return res.status(400).json({
        status: false,
        message: "Please provide donorId, campaignId and amount",
      });
    }

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
      status: true,
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
      status: false,
      message: error.message || "Internal server error",
    });
  }
};


exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body
    const body = razorpay_order_id + '|' + razorpay_payment_id

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex')

    if (expectedSignature === razorpay_signature) {
      // mark order as paid in DB
      return res.status(200).json({ status: true,message: 'Payment verified successfully' })
    } else {
      return res.status(400).json({ status: false,message: 'Invalid signature' })
    }
  } catch (error) {
    console.log(error)
    return res
      .status(500)
      .json({ message: 'Error verifying payment', error: error.message })
  }
}
