const Campaign = require('../Schema/Campagin')
const { redisClient } = require('../Redis/Redis')

// 1. CREATE A CAMPAIGN (Admin only logic)
exports.createCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.create(req.body)
    res.status(201).json({ success: true, data: campaign })
  } catch (err) {
    res.status(400).json({ success: false, message: err.message })
  }
}

// 2. GET ALL CAMPAIGNS (With Pagination for high traffic)
exports.getCampaigns = async (req, res) => {
  try {
    // Pagination params
    const page  = parseInt(req.query.page, 10)  || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip  = (page - 1) * limit;

    // Use a deterministic cache key based on page + limit
    const cacheKey = `campaigns:page=${page}:limit=${limit}`;

    // 1) Try Redis cache
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      console.log('⚡From Redis Cloud');
      return res.status(200).json(JSON.parse(cachedData));
    }

    // 2) Query Mongo with pagination
    const [campaigns, total] = await Promise.all([
      Campaign.find({ isActive: true })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit), 
      Campaign.countDocuments({ isActive: true })
    ]);

    const responsePayload = {
      success: true,
      count: campaigns.length,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: campaigns
    };

    // 3) Store in Redis with TTL 60 seconds
    await redisClient.setEx(cacheKey, 60, JSON.stringify(responsePayload)); 

    return res.status(200).json(responsePayload);
  } catch (err) {
    console.error('getCampaigns error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// 3. GET SINGLE CAMPAIGN DETAILS
exports.getCampaignById = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id)
    if (!campaign) return res.status(404).json({ message: 'Not found' })

    res.status(200).json({ success: true, data: campaign })
  } catch (err) {
    res.status(400).json({ success: false, message: 'Invalid ID format' })
  }
}
