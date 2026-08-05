const express = require('express');
const { authenticateToken } = require('./authRoutes');
const {
  createAudit,
  getAudits,
  getLatestAudit,
  getAuditById,
  deleteAudit,
  deleteAllAudits,
  duplicateAudit,
} = require('../controllers/auditController');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

router.post('/', createAudit);
router.get('/', getAudits);
router.get('/latest', getLatestAudit);
router.delete('/all', deleteAllAudits);
router.get('/:id', getAuditById);
router.delete('/:id', deleteAudit);
router.post('/:id/duplicate', duplicateAudit);

module.exports = router;