const mongoose = require('mongoose');

const CandidateSchema = new mongoose.Schema(
  {
    candidateNumber: Number,
    name: String,
    email: String,
    decision: String,
    stage: String,
    resumeFilename: String,
    matched: Boolean,
    matchMethod: String,
    proxyRisk: String,
    skillScore: Number,
    skills: [String],
    experience: String,
    education: String,
    certifications: [String],
    projects: [String],
    collegeTier: String,
    genderProxy: String,
  },
  { _id: false }
);

const AuditSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    auditName: {
      type: String,
      required: true,
      trim: true,
    },
    jobRole: {
      type: String,
      required: true,
      trim: true,
    },
    department: {
      type: String,
      trim: true,
      default: '',
    },
    uploadedCsvData: {
      raw: {
        type: String,
        default: '',
      },
      headers: {
        type: [String],
        default: [],
      },
      rows: {
        type: [mongoose.Schema.Types.Mixed],
        default: [],
      },
      fileName: {
        type: String,
        default: '',
      },
    },
    fairnessMetrics: {
      disparateImpactRatio: Number,
      equalOpportunityDifference: Number,
      falsePositiveRateDifference: Number,
      proxyCorrelationScore: Number,
      fairnessHealthScore: Number,
      selectionRate: Number,
    },
    overallStatus: {
      type: String,
      required: true,
      default: 'pending',
    },
    biasDrivers: {
      type: [String],
      default: [],
    },
    stats: {
      total: { type: Number, default: 0 },
      hired: { type: Number, default: 0 },
      rejected: { type: Number, default: 0 },
      hireRate: { type: String, default: '0%' },
      rejectedAtScreening: { type: Number, default: 0 },
      rejectedAtTechnical: { type: Number, default: 0 },
      unmatchedResumes: { type: Number, default: 0 },
      hiredCandidates: { type: [mongoose.Schema.Types.Mixed], default: [] },
      rejectedCandidates: { type: [mongoose.Schema.Types.Mixed], default: [] },
      genderDistribution: { type: mongoose.Schema.Types.Mixed, default: {} },
      collegeTierDistribution: { type: mongoose.Schema.Types.Mixed, default: {} },
    },
    allCandidates: {
      type: [CandidateSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

AuditSchema.index({ company: 1, createdAt: -1 });

module.exports = mongoose.model('Audit', AuditSchema);