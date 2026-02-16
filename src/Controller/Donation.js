const jwt =require('jsonwebtoken');
const DonationSchema = require('../Schema/Donation');
const CampaignSchema = require('../Schema/Donation');

exports.createDonation = async (req, res) => {
  try {
    const { donorId, campaignId, amount, transactionId } = req.body;

    // 1. Create the donation record
    const newDonation = new DonationSchema({
      donorId,
      campaignId,
      amount,
      transactionId,
      status: 'completed' // In a real app, set this after payment success
    });

    await newDonation.save();

    // 2. ATOMIC UPDATE: Increase campaign total and donor count
    // This is crucial for handling 100k users simultaneously
    const updatedCampaign = await CampaignSchema.findByIdAndUpdate(
      campaignId,
      { 
        $inc: { raisedAmount: amount, donorCount: 1 } 
      },
      { new: true } // Returns the updated document
    );

    res.status(201).json({
      success: true,
      message: "Donation successful!",
      data: newDonation,
      campaignProgress: updatedCampaign.raisedAmount
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};