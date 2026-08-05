const mongoose = require('mongoose');

const CompanySchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: function () {
        return !this.googleAuth;
      },
    },
    firebaseUid: {
      type: String,
      default: null,
    },
    googleAuth: {
      type: Boolean,
      default: false,
    },
    picture: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Company', CompanySchema);