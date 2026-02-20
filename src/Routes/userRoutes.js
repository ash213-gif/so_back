const express = require('express');
const router = express.Router();
const {getUsers, signup, login, test} = require('../Controller/userController');
const {createDonation, verifyPayment} = require('../Controller/Donation');
const {createCampaign, getCampaigns} =require('../Controller/Campagin')

router.get('/get', getUsers);
router.post('/signup', signup);
router.post('/login', login);


router.post('/createdonation', createDonation);
router.post('/verify',verifyPayment )
router.post('/createCampaign',createCampaign);


module.exports = router;        
