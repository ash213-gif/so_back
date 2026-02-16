const Campaign = require('../Schema/Campagin');

// 1. CREATE A CAMPAIGN (Admin only logic)
exports.createCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.create(req.body);
    res.status(201).json({ success: true, data: campaign });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};


// 2. GET ALL CAMPAIGNS (With Pagination for high traffic)
exports.getCampaigns = async (req, res) => {
  try {
    // Default to page 1, 10 items per page
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const campaigns = await Campaign.find({ isActive: true })
      .sort({ createdAt: -1 }) // Newest first
      .skip(skip)
      .limit(limit);

    const total = await Campaign.countDocuments({ isActive: true });

    res.status(200).json({
      success: true,
      count: campaigns.length,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: campaigns
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 3. GET SINGLE CAMPAIGN DETAILS
exports.getCampaignById = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ message: "Not found" });
    
    res.status(200).json({ success: true, data: campaign });
  } catch (err) {
    res.status(400).json({ success: false, message: "Invalid ID format" });
  }
};