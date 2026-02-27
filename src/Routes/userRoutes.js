const express = require('express');
const router = express.Router();
const { auth} = require('../Middleware/verify');
const {getUsers, signup, login,  verifyOtp } = require('../Controller/userController');
const {createDonation, verifyPayment} = require('../Controller/Donation');
const {createCampaign, getCampaigns} =require('../Controller/Campagin')

router.get('/get', getUsers);
router.post('/signup', signup);
router.post('/login', login);
router.post('/:id/verifyotp', verifyOtp);


router.post('/auth/createdonation', createDonation);
router.post('/auth/verify',verifyPayment )
router.post('/createCampaign',createCampaign);
router.get('/getCampaigns', getCampaigns);


module.exports = router;        
