/**
 * LoopOptimizer - Main Application Entry Point
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Import core modules
const analyzeController = require('./controllers/analyzeController');
const optimizeController = require('./controllers/optimizeController');
const exportController = require('./controllers/exportController');

// Initialize Express app
const app = express();
const port = process.env.PORT || 3000;

// Configure middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueId = uuidv4();
    const fileExt = path.extname(file.originalname);
    cb(null, `${uniqueId}${fileExt}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
  fileFilter: (req, file, cb) => {
    // Accept video and audio files
    const allowedTypes = [
      'video/mp4', 'video/webm', 'video/quicktime',
      'audio/mpeg', 'audio/wav', 'audio/ogg'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only video and audio files are allowed.'));
    }
  }
});

// API Routes
app.post('/api/v1/analyze', upload.single('media'), analyzeController.analyze);
app.post('/api/v1/optimize', upload.single('media'), optimizeController.optimize);
app.post('/api/v1/export', exportController.exportMedia);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: err.message || 'Something went wrong'
  });
});

// Start server
app.listen(port, () => {
  console.log(`LoopOptimizer server running on port ${port}`);
});
