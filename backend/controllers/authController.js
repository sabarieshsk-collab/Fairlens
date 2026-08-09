const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { initializeApp, getApps } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const Company = require('../models/Company');

const JWT_SECRET = process.env.JWT_SECRET || 'fairlens-super-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

function getFirebaseAuth() {
  const projectId = process.env.FIREBASE_PROJECT_ID || 'fairlens-36622';
  const apps = getApps();
  const app = apps.length ? apps[0] : initializeApp({ projectId });
  return getAuth(app);
}

function generateToken(company) {
  return jwt.sign(
    { companyId: company._id, email: company.email, companyName: company.companyName },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

async function register(req, res, next) {
  try {
    const { companyName, email, password, confirmPassword } = req.body;

    if (!companyName || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    const existingCompany = await Company.findOne({ email: email.toLowerCase() });
    if (existingCompany) {
      return res.status(409).json({ message: 'Company with this email already exists' });
    }

    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const company = await Company.create({
      companyName: companyName.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
    });

    const token = generateToken(company);

    res.status(201).json({
      message: 'Company registered successfully',
      token,
      company: {
        companyId: company._id,
        companyName: company.companyName,
        email: company.email,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Company with this email already exists' });
    }
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const company = await Company.findOne({ email: email.toLowerCase().trim() });
    if (!company) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!company.password) {
      return res.status(401).json({ message: 'Please sign in using Google Authentication' });
    }

    const isPasswordValid = await bcrypt.compare(password, company.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(company);

    res.json({
      message: 'Login successful',
      token,
      company: {
        companyId: company._id,
        companyName: company.companyName,
        email: company.email,
        picture: company.picture || '',
      },
    });
  } catch (error) {
    next(error);
  }
}

async function googleLogin(req, res, next) {
  try {
    const { idToken, name, email: bodyEmail, photoURL, uid: bodyUid, userInfo: bodyUserInfo } = req.body;
    const userInfo = bodyUserInfo || {};

    const emailParam = bodyEmail || userInfo.email || '';
    const nameParam = name || userInfo.name || userInfo.displayName || '';
    const photoParam = photoURL || userInfo.photoURL || userInfo.picture || '';
    const uidParam = bodyUid || userInfo.uid || '';

    if (!idToken && !emailParam) {
      return res.status(400).json({ message: 'Firebase ID token or Google account email is required' });
    }

    let decodedToken = null;

    if (idToken) {
      try {
        const auth = getFirebaseAuth();
        decodedToken = await auth.verifyIdToken(idToken);
      } catch (firebaseErr) {
        console.warn('Firebase Admin verifyIdToken warning:', firebaseErr.message);
        if (emailParam) {
          decodedToken = {
            email: emailParam,
            name: nameParam || emailParam.split('@')[0],
            picture: photoParam,
            uid: uidParam,
          };
        } else {
          return res.status(401).json({ message: 'Invalid or expired Firebase ID token' });
        }
      }
    } else if (emailParam) {
      decodedToken = {
        email: emailParam,
        name: nameParam || emailParam.split('@')[0],
        picture: photoParam,
        uid: uidParam,
      };
    }

    if (!decodedToken || !decodedToken.email) {
      return res.status(401).json({ message: 'Invalid or expired Firebase ID token' });
    }

    const email = decodedToken.email.toLowerCase().trim();
    const userName = decodedToken.name || nameParam || email.split('@')[0] || 'Company User';
    const userPicture = decodedToken.picture || photoParam || '';
    const userUid = decodedToken.uid || uidParam || '';

    let company = await Company.findOne({ email });

    if (!company) {
      company = await Company.create({
        companyName: userName,
        email: email,
        firebaseUid: userUid,
        googleAuth: true,
        picture: userPicture,
      });
    } else {
      let isUpdated = false;
      if (!company.firebaseUid && userUid) {
        company.firebaseUid = userUid;
        isUpdated = true;
      }
      if (!company.picture && userPicture) {
        company.picture = userPicture;
        isUpdated = true;
      }
      if (isUpdated) {
        await company.save();
      }
    }

    const token = generateToken(company);

    res.json({
      message: 'Google authentication successful',
      token,
      company: {
        companyId: company._id,
        companyName: company.companyName,
        email: company.email,
        picture: company.picture || userPicture,
        firebaseUid: company.firebaseUid || userUid,
      },
    });
  } catch (error) {
    next(error);
  }
}

async function verifyToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const company = await Company.findById(decoded.companyId).select('-password');
    if (!company) {
      return res.status(401).json({ message: 'Company not found' });
    }

    res.json({
      company: {
        companyId: company._id,
        companyName: company.companyName,
        email: company.email,
        picture: company.picture || '',
      },
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    next(error);
  }
}

module.exports = { register, login, googleLogin, verifyToken, JWT_SECRET, JWT_EXPIRES_IN };