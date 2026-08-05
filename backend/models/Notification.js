const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['audit_completed', 'bias_alert', 'report_ready', 'recommendation', 'system'],
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    read: {
      type: Boolean,
      default: false,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
  },
  {
    timestamps: true,
  }
);

NotificationSchema.index({ company: 1, createdAt: -1 });
NotificationSchema.index({ company: 1, read: 1 });

module.exports = mongoose.model('Notification', NotificationSchema);