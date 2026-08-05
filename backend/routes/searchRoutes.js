const express = require('express');
const { authenticateToken } = require('./authRoutes');
const {
  globalSearch,
  searchAudits,
  getFilterOptions,
} = require('../controllers/searchController');

const router = express.Router();

router.use(authenticateToken);

router.get('/', globalSearch);
router.get('/audits', searchAudits);
router.get('/filters', getFilterOptions);

module.exports = router;