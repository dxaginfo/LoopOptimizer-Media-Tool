/**
 * Loop Optimization Service
 * Core service for optimizing media loops
 */

const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const { blendFrames } = require('./frameBlendingService');
const { processAudio } = require('./audioProcessingService');

/**
 * Optimize media loop using specified parameters
 */
async function optimizeLoop(mediaPath, outputPath, params) {
  try {
    // Create intermediate files directory
    const tempDir = './temp/optimize';
    fs.mkdirSync(tempDir, { recursive: true });
    
    // Extract the loop segment
    const loopPath = path.join(tempDir, `loop_${path.basename(outputPath)}`);
    await extractLoopSegment(mediaPath, loopPath, params.startTime, params.endTime);
    
    // Optimize video frames if needed
    let optimizedVideoPath = loopPath;
    if (params.blendFrames > 0) {
      optimizedVideoPath = path.join(tempDir, `blended_${path.basename(outputPath)}`);
      await blendFrames(loopPath, optimizedVideoPath, params.blendFrames);
    }
    
    // Process audio if needed
    let finalPath = optimizedVideoPath;
    if (params.audioFade) {
      finalPath = path.join(tempDir, `audio_${path.basename(outputPath)}`);
      await processAudio(optimizedVideoPath, finalPath, params.audioFadeDuration);
    }
    
    // Copy the final optimized loop to the output path
    await fs.promises.copyFile(finalPath, outputPath);
    
    // Clean up temporary files
    await cleanupTempFiles(tempDir);
    
    // Get information about the optimized loop
    const loopInfo = await getLoopInfo(outputPath);
    
    return {
      ...loopInfo,
      optimizationApplied: {
        videoBlending: params.blendFrames > 0,
        audioFade: params.audioFade
      }
    };
  } catch (error) {
    console.error('Error optimizing loop:', error);
    throw error;
  }
}

/**
 * Extract the specified segment from the media file
 */
async function extractLoopSegment(mediaPath, outputPath, startTime, endTime) {
  return new Promise((resolve, reject) => {
    ffmpeg(mediaPath)
      .setStartTime(startTime)
      .setDuration(endTime - startTime)
      .output(outputPath)
      .on('end', () => {
        resolve();
      })
      .on('error', (err) => {
        reject(err);
      })
      .run();
  });
}

/**
 * Get information about the loop file
 */
async function getLoopInfo(filePath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(err);
      
      const videoStream = metadata.streams.find(stream => stream.codec_type === 'video');
      
      resolve({
        duration: metadata.format.duration,
        frameCount: videoStream ? Math.floor(videoStream.duration * eval(videoStream.r_frame_rate)) : 0,
        fileSize: metadata.format.size
      });
    });
  });
}

/**
 * Clean up temporary files
 */
async function cleanupTempFiles(tempDir) {
  try {
    // List all files in the temp directory
    const files = await fs.promises.readdir(tempDir);
    
    // Delete each file
    for (const file of files) {
      await fs.promises.unlink(path.join(tempDir, file));
    }
    
    // Try to remove the directory
    await fs.promises.rmdir(tempDir);
  } catch (error) {
    console.warn('Error cleaning up temp files:', error);
    // Non-fatal error, continue execution
  }
}

module.exports = {
  optimizeLoop
};
