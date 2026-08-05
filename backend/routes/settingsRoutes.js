const express = require('express');
const { authenticateToken } = require('./authRoutes');
const {
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
  getNotificationPreferences,
  updateNotificationPreferences,
  forgotPassword,
  resetPassword,
} = require('../controllers/settingsController');

const router = express.Router();

router.use(authenticateToken);

router.get('/profile', getProfile);
router.patch('/profile', updateProfile);
router.patch('/password', changePassword);
router.delete('/account', deleteAccount);
router.get('/notifications/preferences', getNotificationPreferences);
router.patch('/notifications/preferences', updateNotificationPreferences);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;