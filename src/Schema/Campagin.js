const mongoose = require('mongoose');

const CampaignSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  targetAmount: { type: Number, required: true },
  raisedAmount: { type: Number, default: 0 },
  donorCount: { type: Number, default: 0 },
  category: { type: String,  enum: ['Education', 'Medical', 'Disaster', 'Environment'],index: true },
  deadline: { type: Date },
  location :{ type: String , required: true , trim:true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Campaign', CampaignSchema);