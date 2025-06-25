/**
 * Gemini API Service
 * Provides intelligent analysis of media content using Google's Gemini API
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

// Initialize Gemini API client
const API_KEY = process.env.GEMINI_API_KEY;
let genAI = null;

if (API_KEY) {
  genAI = new GoogleGenerativeAI(API_KEY);
}

/**
 * Analyze media using Gemini API
 */
async function analyzeWithGemini(mediaPath, frameAnalysis, audioAnalysis) {
  // Check if Gemini API is configured
  if (!genAI) {
    console.warn('Gemini API not configured. Skipping AI analysis.');
    return null;
  }
  
  try {
    // Extract image frames from video for analysis
    const thumbnailPath = await extractThumbnail(mediaPath);
    
    // Prepare image data for Gemini
    const imageData = fs.readFileSync(thumbnailPath);
    const base64Image = imageData.toString('base64');
    
    // Prepare analysis data
    const analysisData = {
      frameAnalysis: frameAnalysis ? {
        sceneChanges: frameAnalysis.sceneChanges,
        motionActivity: frameAnalysis.motionActivity,
        potentialLoopPoints: frameAnalysis.potentialLoopPoints
      } : null,
      audioAnalysis: audioAnalysis
    };
    
    // Create Gemini model instance
    const model = genAI.getGenerativeModel({ model: 'gemini-pro-vision' });
    
    // Prepare prompt for Gemini
    const prompt = `Analyze this video frame and the provided technical analysis to identify the best potential loop points for creating a seamless looping video. \n\n` +
                  `Technical Analysis: ${JSON.stringify(analysisData)}\n\n` +
                  `Provide recommendations for optimal loop points that would create a visually pleasing and natural-looking loop. ` +
                  `Consider visual coherence, motion continuity, and audio transitions if applicable.`;
    
    // Call Gemini API with image and prompt
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: base64Image
        }
      }
    ]);
    
    // Process the response
    const response = result.response;
    const text = response.text();
    
    // Extract recommended loop points from the response
    return {
      analysis: text,
      recommendedLoopPoints: extractLoopPointsFromGeminiResponse(text, frameAnalysis, audioAnalysis)
    };
  } catch (error) {
    console.error('Error analyzing with Gemini:', error);
    return null;
  }
}

/**
 * Extract a thumbnail image from the video for Gemini analysis
 */
async function extractThumbnail(mediaPath) {
  // Implementation depends on ffmpeg
  // For brevity, this is a placeholder
  // In a real implementation, this would extract a representative frame
  const thumbnailPath = path.join(
    path.dirname(mediaPath),
    `${path.basename(mediaPath, path.extname(mediaPath))}_thumb.jpg`
  );
  
  // Return the path to the extracted thumbnail
  return thumbnailPath;
}

/**
 * Parse the Gemini response to extract loop point recommendations
 */
function extractLoopPointsFromGeminiResponse(text, frameAnalysis, audioAnalysis) {
  // This is a simplistic parser for illustration
  // A real implementation would use more robust parsing
  
  // Look for time codes in the response
  const timeCodeRegex = /\b(\d+\.?\d*)\s*(?:s|sec|seconds)?\s*(?:to|-)\s*(\d+\.?\d*)\s*(?:s|sec|seconds)?\b/gi;
  const matches = [...text.matchAll(timeCodeRegex)];
  
  // Extract loop points from matches
  const loopPoints = matches.map((match, index) => {
    const startTime = parseFloat(match[1]);
    const endTime = parseFloat(match[2]);
    
    return {
      startTime,
      endTime,
      confidence: 0.9 - (index * 0.1), // Assign decreasing confidence to subsequent matches
      reason: 'Gemini AI recommendation'
    };
  });
  
  // If no loop points were found in the text, use fallback from frame analysis
  if (loopPoints.length === 0 && frameAnalysis && frameAnalysis.potentialLoopPoints) {
    return frameAnalysis.potentialLoopPoints.slice(0, 3); // Return top 3 from frame analysis
  }
  
  return loopPoints;
}

module.exports = {
  analyzeWithGemini
};
