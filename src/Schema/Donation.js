const mongoose = require('mongoose');
    

const DonationSchema = new mongoose.Schema({
  donorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Links to your User model
    required: true,
    index: true  // INDEX: Speeds up "My Donations" page for 100k users
  },
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: true,
    min: [1, 'Donation must be at least 1 unit']
  },
  currency: {
    type: String,
    default: 'INR'
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  transactionId: { 
    type: String, 
    unique: true // Prevents duplicate donation entries
  },
  isAnonymous: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('Donation', DonationSchema);