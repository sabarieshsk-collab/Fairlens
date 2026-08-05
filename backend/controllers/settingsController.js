const Company = require('../models/Company');
const Audit = require('../models/Audit');
const Report = require('../models/Report');
const Notification = require('../models/Notification');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'fairlens-super-secret-key-change-in-production';

exports.getProfile = async (req, res, next) => {
  try {
    const company = await Company.findById(req.company.companyId).select('-password');
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }
    res.json(company);
  } catch (error) {
    next(error);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { companyName, email } = req.body;
    const updates = {};
    
    if (companyName) updates.companyName = companyName.trim();
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Invalid email format' });
      }
      
      // Check if email is already taken by another company
      const existing = await Company.findOne({ 
        email: email.toLowerCase().trim(), 
        _id: { $ne: req.company.companyId } 
      });
      if (existing) {
        return res.status(409).json({ message: 'Email already in use' });
      }
      updates.email = email.toLowerCase().trim();
    }
    
    const company = await Company.findByIdAndUpdate(
      req.company.companyId,
      updates,
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }
    
    res.json({ message: 'Profile updated successfully', company });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Email already in use' });
    }
    next(error);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'New passwords do not match' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }
    
    const company = await Company.findById(req.company.companyId);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }
    
    const isValid = await bcrypt.compare(currentPassword, company.password);
    if (!isValid) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
    
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    company.password = hashedPassword;
    await company.save();
    
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};

exports.deleteAccount = async (req, res, next) => {
  try {
    const { password, confirmation } = req.body;
    
    if (!password || !confirmation) {
      return res.status(400).json({ message: 'Password and confirmation required' });
    }
    
    if (confirmation !== 'DELETE') {
      return res.status(400).json({ message: 'Please type DELETE to confirm' });
    }
    
    const company = await Company.findById(req.company.companyId);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }
    
    const isValid = await bcrypt.compare(password, company.password);
    if (!isValid) {
      return res.status(401).json({ message: 'Incorrect password' });
    }
    
    // Delete all associated data
    await Promise.all([
      Company.findByIdAndDelete(req.company.companyId),
      Audit.deleteMany({ company: req.company.companyId }),
      Report.deleteMany({ company: req.company.companyId }),
      Notification.deleteMany({ company: req.company.companyId }),
    ]);
    
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    next(error);
  }
};

exports.getNotificationPreferences = async (req, res, next) => {
  try {
    // In a full implementation, this would be stored in a preferences collection
    // For now, return defaults
    res.json({
      emailNotifications: true,
      auditComplete: true,
      biasAlerts: true,
      reportReady: true,
      weeklyDigest: false,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateNotificationPreferences = async (req, res, next) => {
  try {
    // In a full implementation, save to preferences collection
    res.json({ message: 'Preferences updated successfully', preferences: req.body });
  } catch (error) {
    next(error);
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    
    const company = await Company.findOne({ email: email.toLowerCase().trim() });
    
    // Always return success for security (don't reveal if email exists)
    if (!company) {
      return res.json({ 
        message: 'If an account exists with this email, a password reset link has been sent.' 
      });
    }
    
    // In production, generate reset token, send email
    // For now, just return success
    res.json({ 
      message: 'If an account exists with this email, a password reset link has been sent.' 
    });
  } catch (error) {
    next(error);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;
    
    if (!token || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    
    // In production, verify token, find company, update password
    // For now, return not implemented
    res.status(501).json({ message: 'Password reset not fully implemented' });
  } catch (error) {
    next(error);
  }
};