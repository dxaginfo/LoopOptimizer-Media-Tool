/**
 * Loop Optimization Controller
 * Handles media loop optimization using specified parameters
 */

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { optimizeLoop } = require('../services/optimizationService');
const { blendFrames } = require('../services/frameBlendingService');
const { processAudio } = require('../services/audioProcessingService');

/**
 * Optimize media loop based on specified parameters
 */
async function optimize(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No media file provided' });
    }
    
    const mediaPath = req.file.path;
    const options = req.body;
    
    // Validate required parameters
    if (!options.startTime || !options.endTime) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: startTime and endTime'
      });
    }
    
    // Convert string parameters to numbers
    const params = {
      startTime: parseFloat(options.startTime),
      endTime: parseFloat(options.endTime),
      blendFrames: parseInt(options.blendFrames || 5),
      audioFade: options.audioFade === 'true',
      audioFadeDuration: parseFloat(options.audioFadeDuration || 0.5),
      optimizationLevel: options.optimizationLevel || 'medium' // low, medium, high
    };
    
    // Generate output filename
    const outputId = uuidv4();
    const outputDir = './public/output';
    const outputFile = path.join(outputDir, `${outputId}.mp4`);
    
    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Perform the optimization
    const result = await optimizeLoop(mediaPath, outputFile, params);
    
    // Return response with output information
    res.json({
      success: true,
      message: 'Loop optimization completed successfully',
      output: {
        id: outputId,
        url: `/output/${outputId}.mp4`,
        duration: result.duration,
        frameCount: result.frameCount,
        startTime: params.startTime,
        endTime: params.endTime,
        optimizationApplied: result.optimizationApplied
      }
    });
    
  } catch (error) {
    console.error('Error optimizing loop:', error);
    res.status(500).json({
      success: false,
      message: 'Error optimizing loop',
      error: error.message
    });
  }
}

module.exports = {
  optimize
};
