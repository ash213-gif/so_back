const express = require('express');
const router = express.Router();
const { auth} = require('../Middleware/verify');
const {getUsers, signup, login, Transactionsummary,updatedUser ,verifyOtp } = require('../Controller/userController');
const {createDonation, verifyPayment} = require('../Controller/Donation');
const {createCampaign, getCampaigns} =require('../Controller/Campagin')


//  USERS ROUTES  
router.get('/get', getUsers);
router.get('/transactionsummary/:id', Transactionsummary);

router.post('/signup', signup);
router.post('/login', login);
router.post('/:id/verifyotp', verifyOtp);

router.put('/updatedUser/:id', updatedUser);


// Campaigns Routes  
router.post('/createCampaign',createCampaign);
router.get('/getCampaigns', getCampaigns);


// Donations Routes  AND PAYMENT
router.post('/auth/createdonation', createDonation);
router.post('/auth/verify',verifyPayment )

module.exports = router;        
