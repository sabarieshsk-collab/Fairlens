const express = require('express');
const { register, login, googleLogin, verifyToken } = require('../controllers/authController');
const { JWT_SECRET } = require('../controllers/authController');
const jwt = require('jsonwebtoken');

const router = express.Router();

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.company = decoded;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    next(error);
  }
};

router.post('/register', register);
router.post('/signup', register);
router.post('/login', login);
router.post('/google', googleLogin);
router.get('/verify', authenticateToken, verifyToken);


module.exports = { router, authenticateToken };