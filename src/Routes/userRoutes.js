const express = require('express');
const router = express.Router();
const { auth} = require('../Middleware/verify');
const {getUsers, signup, resendOtp ,DeleteAccount,DeactivateAccount ,  login, Transactionsummary,updatedUser ,verifyOtp } = require('../Controller/userController');
const {createDonation, verifyPayment} = require('../Controller/Donation');
const {createCampaign, Adminsummary,getCampaigns , analytics,recentactivity} =require('../Controller/Campagin')


//  USERS ROUTES  
router.get('/get', getUsers);
router.get('/transactionsummary/:id', Transactionsummary);

router.post('/signup', signup);
router.post('/login', login);
router.post('/:id/verifyotp', verifyOtp);

router.put('/updatedUser/:id', updatedUser);
router.put('/deactivate/:id', DeactivateAccount);
router.put('/resendotp/:id',resendOtp); 
router.delete('/delete/:id', DeleteAccount);

// Campaigns Routes  ADmin
router.post('/createCampaign',createCampaign);
router.get('/adminsummary', Adminsummary);
router.get('/getCampaigns', getCampaigns);
router.get('/analytics', analytics);
router.get('/recentactivity', recentactivity);



// Donations Routes  AND PAYMENT
router.post('/auth/createdonation', createDonation);
router.post('/auth/verify',verifyPayment )

module.exports = router;        
