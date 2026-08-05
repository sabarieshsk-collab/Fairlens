const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    audit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Audit',
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['eeoc', 'ai_fairness', 'gdpr', 'ai_act', 'custom'],
    },
    title: {
      type: String,
      required: true,
    },
    complianceScore: {
      type: Number,
      default: 0,
    },
    passedRules: [{
      rule: String,
      description: String,
      evidence: String,
    }],
    failedRules: [{
      rule: String,
      description: String,
      evidence: String,
      recommendation: String,
    }],
    recommendations: [{
      issue: String,
      explanation: String,
      recommendation: String,
      expectedBiasReduction: String,
      priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium',
      },
    }],
    geminiExplanation: {
      type: String,
      default: '',
    },
    format: {
      type: String,
      enum: ['pdf', 'csv', 'json'],
      default: 'pdf',
    },
    fileUrl: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['generating', 'completed', 'failed'],
      default: 'generating',
    },
  },
  {
    timestamps: true,
  }
);

ReportSchema.index({ company: 1, createdAt: -1 });
ReportSchema.index({ company: 1, audit: 1 });

module.exports = mongoose.model('Report', ReportSchema);