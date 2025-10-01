
const express = require('express');
const router = express.Router();
const {
  register,
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  updateDetails,
  updatePassword,
  verifyEmail,
  verifyPhone,
  resendVerification,
  resendPhoneVerification
} = require('../controllers/auth');

const { protect } = require('../middleware/auth');


router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);
router.get('/verify-email/:token', verifyEmail);


router.get('/logout', protect, logout);
router.get('/me', protect, getMe);
router.put('/update-details', protect, updateDetails);
router.put('/update-password', protect, updatePassword);
router.post('/verify-phone', protect, verifyPhone);
router.post('/resend-verification', protect, resendVerification);
router.post('/resend-phone-verification', protect, resendPhoneVerification);

module.exports = router;