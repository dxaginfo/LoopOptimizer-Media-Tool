/**
 * Media Analysis Controller
 * Handles media file analysis to identify potential loop points
 */

const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const { analyzeWithGemini } = require('../services/geminiService');
const { analyzeFrames } = require('../services/frameAnalysisService');
const { analyzeAudio } = require('../services/audioAnalysisService');

/**
 * Analyze media file for potential loop points
 */
async function analyze(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No media file provided' });
    }
    
    const mediaPath = req.file.path;
    const options = req.body;
    
    // Get basic media information using ffmpeg
    const mediaInfo = await getMediaInfo(mediaPath);
    
    // Analyze visual content for potential loop points
    const frameAnalysis = await analyzeFrames(mediaPath, {
      sampleRate: options.frameSampleRate || 1, // Frames per second to analyze
      motionThreshold: options.motionThreshold || 0.1,
      sceneChangeThreshold: options.sceneChangeThreshold || 0.3
    });
    
    // Analyze audio for potential loop points (if audio stream exists)
    let audioAnalysis = null;
    if (mediaInfo.audio) {
      audioAnalysis = await analyzeAudio(mediaPath, {
        silenceThreshold: options.silenceThreshold || -30, // dB
        minimumSilenceDuration: options.minimumSilenceDuration || 0.1 // seconds
      });
    }
    
    // Use Gemini API to provide intelligent analysis if enabled
    let geminiAnalysis = null;
    if (options.useAI !== 'false') {
      geminiAnalysis = await analyzeWithGemini(mediaPath, frameAnalysis, audioAnalysis);
    }
    
    // Combine all analysis results
    const analysis = {
      mediaInfo,
      frameAnalysis,
      audioAnalysis,
      geminiAnalysis,
      recommendedLoopPoints: determineRecommendedLoopPoints(frameAnalysis, audioAnalysis, geminiAnalysis)
    };
    
    res.json({
      success: true,
      analysis
    });
  } catch (error) {
    console.error('Error analyzing media:', error);
    res.status(500).json({
      success: false,
      message: 'Error analyzing media',
      error: error.message
    });
  }
}

/**
 * Get basic media information using ffmpeg
 */
async function getMediaInfo(mediaPath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(mediaPath, (err, metadata) => {
      if (err) return reject(err);
      
      const videoStream = metadata.streams.find(stream => stream.codec_type === 'video');
      const audioStream = metadata.streams.find(stream => stream.codec_type === 'audio');
      
      resolve({
        duration: metadata.format.duration,
        format: metadata.format.format_name,
        size: metadata.format.size,
        video: videoStream ? {
          codec: videoStream.codec_name,
          width: videoStream.width,
          height: videoStream.height,
          frameRate: eval(videoStream.r_frame_rate),
          bitRate: videoStream.bit_rate
        } : null,
        audio: audioStream ? {
          codec: audioStream.codec_name,
          channels: audioStream.channels,
          sampleRate: audioStream.sample_rate,
          bitRate: audioStream.bit_rate
        } : null
      });
    });
  });
}

/**
 * Determine recommended loop points based on all analysis data
 */
function determineRecommendedLoopPoints(frameAnalysis, audioAnalysis, geminiAnalysis) {
  // Start with Gemini's recommendations if available
  if (geminiAnalysis && geminiAnalysis.recommendedLoopPoints) {
    return geminiAnalysis.recommendedLoopPoints;
  }
  
  // Otherwise use a combination of frame and audio analysis
  const points = [];
  
  // Add potential loop points from frame analysis
  if (frameAnalysis && frameAnalysis.potentialLoopPoints) {
    for (const point of frameAnalysis.potentialLoopPoints) {
      points.push({
        startTime: point.startTime,
        endTime: point.endTime,
        confidence: point.confidence,
        reason: point.reason
      });
    }
  }
  
  // Add potential loop points from audio analysis
  if (audioAnalysis && audioAnalysis.silencePoints) {
    for (const silence of audioAnalysis.silencePoints) {
      points.push({
        startTime: silence.start,
        endTime: silence.end,
        confidence: silence.confidence,
        reason: 'Audio silence'
      });
    }
  }
  
  // Sort by confidence
  points.sort((a, b) => b.confidence - a.confidence);
  
  return points.slice(0, 5); // Return top 5 recommendations
}

module.exports = {
  analyze
};
