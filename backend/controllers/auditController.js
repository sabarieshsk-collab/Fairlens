const Audit = require('../models/Audit');
const { calculateAuditPackage } = require('../services/fairnessService');
const Notification = require('../models/Notification');

function serializeAudit(audit) {
  const plain = audit.toObject ? audit.toObject() : audit;

  return {
    ...plain,
    auditId: String(plain._id),
    cycleName: plain.auditName,
    processedAt: plain.createdAt,
    status: plain.overallStatus,
  };
}

exports.createAudit = async (req, res, next) => {
  try {
    const {
      auditName,
      jobRole,
      department = '',
      csvText = '',
      csvFileName = '',
      resumeFileNames = [],
      candidateDetails = [],
    } = req.body;

    if (!auditName || !jobRole) {
      return res.status(400).json({ message: 'auditName and jobRole are required' });
    }

    if (!csvText && resumeFileNames.length === 0 && candidateDetails.length === 0) {
      return res.status(400).json({ message: 'Either CSV data or Resume files are required' });
    }

    const packageData = calculateAuditPackage({
      auditName,
      jobRole,
      department,
      csvText,
      resumeFileNames,
      candidateDetails,
      fileName: csvFileName,
    });

    const audit = await Audit.create({
      ...packageData,
      company: req.company.companyId,
    });

    // Create notification for audit completion
    await Notification.create({
      company: req.company.companyId,
      type: 'audit_completed',
      title: 'Audit Completed',
      message: `Your audit "${audit.auditName}" has been processed successfully.`,
      data: { auditId: audit._id },
      priority: 'medium',
    });

    return res.status(201).json(serializeAudit(audit));
  } catch (error) {
    if (error.message && (error.message.toLowerCase().includes('csv') || error.message.toLowerCase().includes('upload'))) {
      return res.status(400).json({ message: error.message });
    }

    next(error);
  }
};

exports.duplicateAudit = async (req, res, next) => {
  try {
    const { auditId } = req.params;
    
    const originalAudit = await Audit.findOne({ 
      _id: auditId, 
      company: req.company.companyId 
    });
    
    if (!originalAudit) {
      return res.status(404).json({ message: 'Audit not found' });
    }
    
    // Create new audit with same data but new name
    const newAuditName = `${originalAudit.auditName} (Copy)`;
    
    const packageData = {
      auditName: newAuditName,
      jobRole: originalAudit.jobRole,
      department: originalAudit.department,
      uploadedCsvData: {
        raw: originalAudit.uploadedCsvData.raw,
        headers: originalAudit.uploadedCsvData.headers,
        rows: originalAudit.uploadedCsvData.rows,
        fileName: originalAudit.uploadedCsvData.fileName,
      },
      fairnessMetrics: originalAudit.fairnessMetrics,
      overallStatus: originalAudit.overallStatus,
      biasDrivers: originalAudit.biasDrivers,
      stats: originalAudit.stats,
      allCandidates: originalAudit.allCandidates,
    };
    
    const audit = await Audit.create({
      ...packageData,
      company: req.company.companyId,
    });
    
    res.status(201).json(serializeAudit(audit));
  } catch (error) {
    next(error);
  }
};

exports.getAudits = async (req, res, next) => {
  try {
    const audits = await Audit.find({ company: req.company.companyId }).sort({ createdAt: -1 });
    res.json(audits.map(serializeAudit));
  } catch (error) {
    next(error);
  }
};

exports.getLatestAudit = async (req, res, next) => {
  try {
    const audit = await Audit.findOne({ company: req.company.companyId }).sort({ createdAt: -1 });

    if (!audit) {
      return res.status(404).json({ message: 'No audits found' });
    }

    res.json(serializeAudit(audit));
  } catch (error) {
    next(error);
  }
};

exports.getAuditById = async (req, res, next) => {
  try {
    const audit = await Audit.findOne({ _id: req.params.id, company: req.company.companyId });

    if (!audit) {
      return res.status(404).json({ message: 'Audit not found' });
    }

    res.json(serializeAudit(audit));
  } catch (error) {
    next(error);
  }
};

exports.deleteAudit = async (req, res, next) => {
  try {
    const audit = await Audit.findOneAndDelete({ _id: req.params.id, company: req.company.companyId });

    if (!audit) {
      return res.status(404).json({ message: 'Audit not found' });
    }

    res.json({ message: 'Audit deleted successfully' });
  } catch (error) {
    next(error);
  }
};

exports.deleteAllAudits = async (req, res, next) => {
  try {
    const result = await Audit.deleteMany({ company: req.company.companyId });
    res.json({ message: `${result.deletedCount} audits deleted successfully`, deletedCount: result.deletedCount });
  } catch (error) {
    next(error);
  }
};