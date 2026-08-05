const express = require('express');
const { authenticateToken } = require('./authRoutes');
const {
  getMonitoringData,
  getMonitoringTrends,
} = require('../controllers/monitoringController');

const router = express.Router();

router.use(authenticateToken);

router.get('/', getMonitoringData);
router.get('/trends', getMonitoringTrends);

module.exports = router;