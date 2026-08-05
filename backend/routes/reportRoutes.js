const express = require('express');
const { authenticateToken } = require('./authRoutes');
const {
  generateReport,
  getReports,
  getReportById,
  downloadReport,
  deleteReport,
  downloadPdfByAuditId,
  downloadCsvByAuditId,
  downloadJsonByAuditId,
} = require('../controllers/reportController');

const router = express.Router();

router.use(authenticateToken);

router.post('/generate', generateReport);
router.get('/', getReports);
router.get('/pdf/:auditId', downloadPdfByAuditId);
router.get('/csv/:auditId', downloadCsvByAuditId);
router.get('/json/:auditId', downloadJsonByAuditId);
router.get('/:id', getReportById);
router.get('/:id/download', downloadReport);
router.delete('/:id', deleteReport);

module.exports = router;