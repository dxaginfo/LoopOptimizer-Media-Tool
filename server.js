/**
 * LoopOptimizer - Server implementation
 *
 * Express server that provides API endpoints for the LoopOptimizer tool.
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

const LoopOptimizer = require('./src/loop-optimizer');

// Configure environment variables
require('dotenv').config();

// Initialize Express app
const app = express();
const port = process.env.PORT || 3000;

// Configure multer for handling file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(__dirname, 'uploads');
      fs.mkdirSync(uploadDir, { recursive: true });
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueName = `${uuidv4()}-${file.originalname}`;
      cb(null, uniqueName);
    }
  }),
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
});

// Serve static files from 'public' directory
app.use(express.static('public'));
app.use(express.json());

// Initialize LoopOptimizer
const optimizer = new LoopOptimizer({
  gemini: {
    apiKey: process.env.GEMINI_API_KEY
  },
  firebase: {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET
  }
});

// API endpoints

// Process media for loop optimization
app.post('/api/optimize', upload.single('media'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No media file provided' });
    }

    // Parse parameters
    const parameters = JSON.parse(req.body.parameters || '{}');
    
    // Process the media file
    const mediaPath = path.join(__dirname, req.file.path);
    const mediaBuffer = fs.readFileSync(mediaPath);
    
    // Create a File-like object
    const mediaFile = {
      name: req.file.originalname,
      type: req.file.mimetype,
      size: req.file.size,
      buffer: mediaBuffer
    };
    
    // Process with LoopOptimizer
    const result = await optimizer.processMedia(mediaFile, parameters);
    
    // Clean up the uploaded file
    fs.unlinkSync(mediaPath);
    
    // Return the result
    res.json({
      success: true,
      result
    });
  } catch (error) {
    console.error('Error processing media:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get processing status
app.get('/api/status/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    
    // Implementation for checking job status
    // This would typically query a database or in-memory store
    
    res.json({
      success: true,
      status: 'completed', // or 'processing', 'failed'
      jobId
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`LoopOptimizer server running on port ${port}`);
});
