const Audit = require('../models/Audit');
const Report = require('../models/Report');

exports.globalSearch = async (req, res, next) => {
  try {
    const { q, limit = 10 } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.json({ audits: [], reports: [], candidates: [] });
    }
    
    const searchRegex = new RegExp(q.trim(), 'i');
    const companyId = req.company.companyId;
    
    // Search audits
    const audits = await Audit.find({
      company: companyId,
      $or: [
        { auditName: searchRegex },
        { jobRole: searchRegex },
        { department: searchRegex },
        { 'stats.hiredCandidates.name': searchRegex },
        { 'stats.rejectedCandidates.name': searchRegex },
        { 'allCandidates.name': searchRegex },
        { 'allCandidates.email': searchRegex },
      ],
    })
      .select('auditName jobRole department processedAt stats overallStatus fairnessMetrics')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    
    // Search reports
    const reports = await Report.find({
      company: companyId,
      $or: [
        { title: searchRegex },
        { type: searchRegex },
      ],
    })
      .populate('audit', 'auditName jobRole')
      .select('title type complianceScore status createdAt')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    
    // Search candidates within audits
    let candidates = [];
    const candidateAudits = await Audit.find({
      company: companyId,
      $or: [
        { 'allCandidates.name': searchRegex },
        { 'allCandidates.email': searchRegex },
      ],
    })
      .select('auditName jobRole allCandidates')
      .limit(5);
    
    candidateAudits.forEach(audit => {
      const matched = audit.allCandidates.filter(c => 
        searchRegex.test(c.name) || searchRegex.test(c.email || '')
      );
      matched.forEach(c => {
        candidates.push({
          ...c,
          auditName: audit.auditName,
          jobRole: audit.jobRole,
        });
      });
    });
    
    // Deduplicate candidates
    const seen = new Set();
    candidates = candidates.filter(c => {
      const key = `${c.name}-${c.email}-${c.auditName}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, parseInt(limit));
    
    res.json({
      audits: audits.map(a => ({
        ...a.toObject(),
        _type: 'audit',
      })),
      reports: reports.map(r => ({
        ...r.toObject(),
        _type: 'report',
      })),
      candidates: candidates.map(c => ({
        ...c,
        _type: 'candidate',
      })),
    });
  } catch (error) {
    next(error);
  }
};

exports.searchAudits = async (req, res, next) => {
  try {
    const { q, status, jobRole, department, startDate, endDate, sort = 'createdAt', order = 'desc', page = 1, limit = 10 } = req.query;
    
    const query = { company: req.company.companyId };
    
    if (q) {
      const searchRegex = new RegExp(q, 'i');
      query.$or = [
        { auditName: searchRegex },
        { jobRole: searchRegex },
        { department: searchRegex },
      ];
    }
    
    if (status) query.overallStatus = status;
    if (jobRole) query.jobRole = new RegExp(jobRole, 'i');
    if (department) query.department = new RegExp(department, 'i');
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    const sortObj = {};
    sortObj[sort] = order === 'desc' ? -1 : 1;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [audits, total] = await Promise.all([
      Audit.find(query)
        .sort(sortObj)
        .skip(skip)
        .limit(parseInt(limit)),
      Audit.countDocuments(query),
    ]);
    
    res.json({
      audits,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getFilterOptions = async (req, res, next) => {
  try {
    const companyId = req.company.companyId;
    
    const [jobRoles, departments, statuses] = await Promise.all([
      Audit.distinct('jobRole', { company: companyId }),
      Audit.distinct('department', { company: companyId }),
      Audit.distinct('overallStatus', { company: companyId }),
    ]);
    
    res.json({
      jobRoles: jobRoles.filter(Boolean),
      departments: departments.filter(Boolean),
      statuses: statuses.filter(Boolean),
    });
  } catch (error) {
    next(error);
  }
};