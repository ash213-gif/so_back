const Campaign = require('../Schema/Campagin')
const User =require('../Schema/User')
const Donation = require('../Schema/Donation')
const { redisClient } = require('../Redis/Redis')
const { getIO  }= require('../Redis/Socket')


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

//  get total numer of summary of users, campaigns and total donation amount for admin dashboard

exports.Adminsummary = async (req, res) => {
  try {
    const io = getIO();

    // Single cache key for admin summary
    const cacheKey = 'admin:summary';

    // 1) Try to read from Redis
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);

      // Optionally also emit cached summary to all admins
      io.emit('admin:summary', parsed);

      return res.status(200).json(parsed);
    }

    // 2) If no cache, run DB queries in parallel
    const [totalUsers, totalCampaigns, donationAgg] = await Promise.all([
      User.countDocuments({}),      // total number of users
      Campaign.countDocuments({}),  // total number of campaigns
      Donation.aggregate([
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$amount' }
          }
        }
      ])
    ]);

    const totalDonationAmount =
      donationAgg.length > 0 ? donationAgg[0].totalAmount : 0;

    // Build result object (no extra success wrapper, easier to reuse on client)
    const result = {
      success: true,
      totalUsers,
      totalCampaigns,
      totalDonationAmount
    };

    // 3) Save in Redis with TTL (e.g. 60 seconds)
    await redisClient.setEx(cacheKey, 60, JSON.stringify(result));

    // 4) Emit over Socket.IO to connected admin clients
    io.emit('admin:summary', result);

    // 5) Respond to the HTTP request
    return res.status(200).json(result);
  } catch (error) {
    console.error('Admin summary error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};


exports.analytics = async (req, res) => {
  try {
    const io = getIO();

    const cacheKey = 'admin:analytics';
    const cached = await redisClient.get(cacheKey);

    if (cached) {
      const parsed = JSON.parse(cached);
      io.emit('admin:analytics', parsed);
      return res.status(200).json(parsed);
    }

    // Example: compute analytics in parallel
    const [
      monthlyDonations,
      yearlyDonations,
      totalDonations,
      userGrowth
    ] = await Promise.all([
      // last 30 days grouped by day
      Donation.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            }
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            amount: { $sum: '$amount' }
          }
        },
        { $sort: { _id: 1 } }
      ]),

      // year-to-date grouped by month
      Donation.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(new Date().getFullYear(), 0, 1)
            }
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
            amount: { $sum: '$amount' }
          }
        },
        { $sort: { _id: 1 } }
      ]),

      // total donation amount
      Donation.aggregate([
        {
          $group: {
            _id: null,
            amount: { $sum: '$amount' }
          }
        }
      ]),

      // user growth: new users per month this year
      User.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(new Date().getFullYear(), 0, 1)
            }
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    const payload = {
      monthlyDonations,
      yearlyDonations,
      totalDonations: totalDonations[0]?.amount || 0,
      userGrowth
    };

    // cache for 5 minutes
    await redisClient.set(cacheKey, JSON.stringify(payload), {
      EX: 300
    });

    // Emit to admin dashboard in real time
    io.emit('admin:analytics', payload);

    return res.status(200).json(payload);
  } catch (err) {
    console.error('Analytics error:', err);
    return res.status(500).json({ message: 'Failed to load analytics' });
  }
};
