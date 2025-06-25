/**
 * Frame Blending Service
 * Provides methods for blending frames at loop points to create smoother transitions
 */

const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');

/**
 * Blend frames at loop boundaries for smoother transition
 */
async function blendFrames(inputPath, outputPath, blendFrameCount) {
  try {
    // Get video information
    const videoInfo = await getVideoInfo(inputPath);
    
    // Calculate blend parameters
    const frameRate = videoInfo.frameRate;
    const totalFrames = videoInfo.frameCount;
    const blendDuration = blendFrameCount / frameRate;
    
    // Extract frames from beginning and end for blending
    const tempDir = './temp/blend';
    fs.mkdirSync(tempDir, { recursive: true });
    
    // Extract end frames
    const endFramesDir = path.join(tempDir, 'end_frames');
    fs.mkdirSync(endFramesDir, { recursive: true });
    await extractFrames(
      inputPath,
      endFramesDir,
      videoInfo.duration - blendDuration,
      blendDuration
    );
    
    // Extract start frames
    const startFramesDir = path.join(tempDir, 'start_frames');
    fs.mkdirSync(startFramesDir, { recursive: true });
    await extractFrames(
      inputPath,
      startFramesDir,
      0,
      blendDuration
    );
    
    // Create blended frames
    const blendedFramesDir = path.join(tempDir, 'blended_frames');
    fs.mkdirSync(blendedFramesDir, { recursive: true });
    await createBlendedFrames(
      startFramesDir,
      endFramesDir,
      blendedFramesDir,
      blendFrameCount
    );
    
    // Create intermediate video segments
    const mainSegmentPath = path.join(tempDir, 'main_segment.mp4');
    await extractMainSegment(
      inputPath,
      mainSegmentPath,
      blendDuration,
      videoInfo.duration - (2 * blendDuration)
    );
    
    const blendedSegmentPath = path.join(tempDir, 'blended_segment.mp4');
    await createVideoFromFrames(
      blendedFramesDir,
      blendedSegmentPath,
      frameRate
    );
    
    // Concatenate segments
    const segmentListPath = path.join(tempDir, 'segments.txt');
    fs.writeFileSync(segmentListPath, 
      `file '${blendedSegmentPath}'\n` +
      `file '${mainSegmentPath}'\n`
    );
    
    await concatenateSegments(segmentListPath, outputPath);
    
    // Clean up temporary files
    await cleanupTempFiles(tempDir);
    
    return true;
  } catch (error) {
    console.error('Error blending frames:', error);
    throw error;
  }
}

/**
 * Get video information using ffprobe
 */
async function getVideoInfo(videoPath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) return reject(err);
      
      const videoStream = metadata.streams.find(stream => stream.codec_type === 'video');
      if (!videoStream) {
        return reject(new Error('No video stream found'));
      }
      
      const frameRate = eval(videoStream.r_frame_rate);
      const duration = videoStream.duration || metadata.format.duration;
      const frameCount = Math.floor(duration * frameRate);
      
      resolve({
        duration,
        frameRate,
        frameCount,
        width: videoStream.width,
        height: videoStream.height
      });
    });
  });
}

/**
 * Extract frames from video segment
 */
async function extractFrames(videoPath, outputDir, startTime, duration) {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .setStartTime(startTime)
      .setDuration(duration)
      .output(`${outputDir}/frame-%04d.png`)
      .outputOptions([
        '-vsync 0', // Each frame is a separate image
        '-q:v 1'    // High quality
      ])
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
 * Create blended frames from start and end frames
 */
async function createBlendedFrames(startFramesDir, endFramesDir, blendedFramesDir, frameCount) {
  // Get list of frames
  const startFrames = fs.readdirSync(startFramesDir)
    .filter(f => f.startsWith('frame-') && f.endsWith('.png'))
    .sort();
  
  const endFrames = fs.readdirSync(endFramesDir)
    .filter(f => f.startsWith('frame-') && f.endsWith('.png'))
    .sort();
  
  // Make sure we have enough frames
  if (startFrames.length < frameCount || endFrames.length < frameCount) {
    throw new Error('Not enough frames for blending');
  }
  
  // Create blended frames using ffmpeg
  const blendPromises = [];
  
  for (let i = 0; i < frameCount; i++) {
    const alpha = i / (frameCount - 1); // Blend factor from 0 to 1
    const startFrame = path.join(startFramesDir, startFrames[i]);
    const endFrame = path.join(endFramesDir, endFrames[endFrames.length - frameCount + i]);
    const outputFrame = path.join(blendedFramesDir, `frame-${String(i+1).padStart(4, '0')}.png`);
    
    blendPromises.push(
      blendTwoFrames(startFrame, endFrame, outputFrame, alpha)
    );
  }
  
  await Promise.all(blendPromises);
  return true;
}

/**
 * Blend two frames with specified alpha
 */
async function blendTwoFrames(frame1Path, frame2Path, outputPath, alpha) {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(frame1Path)
      .input(frame2Path)
      .complexFilter([
        `[0:v][1:v]blend=all_expr='A*(1-${alpha})+B*${alpha}'[blended]`
      ])
      .outputOptions(['-map [blended]'])
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
 * Extract main segment from video (excluding blend regions)
 */
async function extractMainSegment(inputPath, outputPath, startOffset, duration) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .setStartTime(startOffset)
      .setDuration(duration)
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
 * Create video from sequence of frames
 */
async function createVideoFromFrames(framesDir, outputPath, frameRate) {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(`${framesDir}/frame-%04d.png`)
      .inputOptions([`-framerate ${frameRate}`])
      .output(outputPath)
      .outputOptions([
        '-c:v libx264',
        '-pix_fmt yuv420p',
        '-r ' + frameRate
      ])
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
 * Concatenate video segments
 */
async function concatenateSegments(listFile, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(listFile)
      .inputOptions(['-f concat', '-safe 0'])
      .output(outputPath)
      .outputOptions(['-c copy'])
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
 * Clean up temporary files
 */
async function cleanupTempFiles(tempDir) {
  try {
    // Recursive function to delete directory contents
    const deleteFolderRecursive = async function(folderPath) {
      if (fs.existsSync(folderPath)) {
        for (const file of fs.readdirSync(folderPath)) {
          const curPath = path.join(folderPath, file);
          if (fs.lstatSync(curPath).isDirectory()) {
            // Recurse
            await deleteFolderRecursive(curPath);
          } else {
            // Delete file
            await fs.promises.unlink(curPath);
          }
        }
        await fs.promises.rmdir(folderPath);
      }
    };
    
    await deleteFolderRecursive(tempDir);
  } catch (error) {
    console.warn('Error cleaning up temp files:', error);
    // Non-fatal error, continue execution
  }
}

module.exports = {
  blendFrames
};
