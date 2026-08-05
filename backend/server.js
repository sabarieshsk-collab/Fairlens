const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const util = require('util');

const connectDB = require('./config/db');
const { errorMiddleware, notFound } = require('./middleware/errorMiddleware');

const auditRoutes = require('./routes/auditRoutes');
const { router: authRoutes, authenticateToken } = require('./routes/authRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const reportRoutes = require('./routes/reportRoutes');
const monitoringRoutes = require('./routes/monitoringRoutes');
const searchRoutes = require('./routes/searchRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const geminiRoutes = require('./routes/geminiRoutes');

dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Security & Logging Middlewares
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);
app.use(morgan('dev'));
app.use(cookieParser());

// CORS & Body Parsers
app.use(
  cors({
    origin: ['http://localhost:3000', 'http://localhost:5000', 'http://localhost:5173', 'http://127.0.0.1:3000', 'http://127.0.0.1:5000', '*'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Static Uploads & React Build Folder
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

const buildPath = path.join(__dirname, '../frontend/build');
if (fs.existsSync(buildPath)) {
  app.use(express.static(buildPath));
}

// API Health Check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', database: 'connected' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/audits', authenticateToken, auditRoutes);
app.use('/api/audit', authenticateToken, auditRoutes);
app.use('/api/notifications', authenticateToken, notificationRoutes);
app.use('/api/reports', authenticateToken, reportRoutes);
app.use('/api/report', authenticateToken, reportRoutes);
app.use('/api/monitoring', authenticateToken, monitoringRoutes);
app.use('/api/search', authenticateToken, searchRoutes);
app.use('/api/settings', authenticateToken, settingsRoutes);
app.use('/api/gemini', authenticateToken, geminiRoutes);

// Catch-all route for SPA React frontend
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  const indexPath = path.join(buildPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.json({ name: 'FairLens API Server', status: 'ok', message: 'FairLens Backend Operational' });
  }
});

// Error handling
app.use(notFound);
app.use(errorMiddleware);

const startServer = async () => {
  try {
    await connectDB();
    app.listen(port, () => {
      console.log(`🚀 FairLens Backend running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    if (error.name || error.code || error.reason) {
      console.error('MongoDB details:', {
        name: error.name,
        code: error.code,
        reason: error.reason ? util.inspect(error.reason, { depth: 5, breakLength: 120 }) : undefined,
      });
    }
    process.exit(1);
  }
};

startServer();