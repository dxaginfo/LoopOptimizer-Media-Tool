/**
 * Audio Processing Service
 * Provides methods for processing audio at loop points
 */

const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');

/**
 * Process audio for smoother looping
 */
async function processAudio(inputPath, outputPath, fadeDuration) {
  try {
    // Get media information
    const mediaInfo = await getMediaInfo(inputPath);
    
    // Skip processing if no audio stream
    if (!mediaInfo.audio) {
      // Just copy the file
      await fs.promises.copyFile(inputPath, outputPath);
      return true;
    }
    
    // Process with ffmpeg filters for audio crossfade
    await applyAudioCrossfade(inputPath, outputPath, mediaInfo.duration, fadeDuration);
    
    return true;
  } catch (error) {
    console.error('Error processing audio:', error);
    throw error;
  }
}

/**
 * Get media information
 */
async function getMediaInfo(mediaPath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(mediaPath, (err, metadata) => {
      if (err) return reject(err);
      
      const videoStream = metadata.streams.find(stream => stream.codec_type === 'video');
      const audioStream = metadata.streams.find(stream => stream.codec_type === 'audio');
      
      resolve({
        duration: metadata.format.duration,
        video: videoStream ? {
          codec: videoStream.codec_name,
          frameRate: eval(videoStream.r_frame_rate),
          width: videoStream.width,
          height: videoStream.height
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
 * Apply audio crossfade at loop boundaries
 */
async function applyAudioCrossfade(inputPath, outputPath, duration, fadeDuration) {
  // Ensure fade duration is not too long
  fadeDuration = Math.min(fadeDuration, duration / 4);
  
  return new Promise((resolve, reject) => {
    // Extract the audio stream
    const tempDir = './temp/audio';
    fs.mkdirSync(tempDir, { recursive: true });
    
    const audioPath = path.join(tempDir, 'audio.wav');
    
    ffmpeg(inputPath)
      .output(audioPath)
      .noVideo()
      .audioCodec('pcm_s16le') // Uncompressed for processing
      .on('end', () => {
        // Process the audio with crossfade
        const processedAudioPath = path.join(tempDir, 'processed_audio.wav');
        
        ffmpeg(audioPath)
          .complexFilter([
            // Apply fade out at the end
            `afade=t=out:st=${duration-fadeDuration}:d=${fadeDuration}`,
            // Create a copy of the audio with fade in at the beginning
            `asplit=2[a][b]`,
            `[b]afade=t=in:st=0:d=${fadeDuration}[fadedin]`,
            // Mix the original with the faded version to create crossfade effect
            `[a][fadedin]amix=inputs=2:weights=1 1:duration=shortest`
          ])
          .output(processedAudioPath)
          .on('end', () => {
            // Combine processed audio with original video
            ffmpeg(inputPath)
              .input(processedAudioPath)
              .outputOptions([
                '-c:v copy',       // Copy video stream without re-encoding
                '-map 0:v:0',      // Use video from first input
                '-map 1:a:0',      // Use audio from second input
                '-shortest'        // End when shortest input ends
              ])
              .output(outputPath)
              .on('end', () => {
                // Clean up temp files
                fs.unlinkSync(audioPath);
                fs.unlinkSync(processedAudioPath);
                fs.rmdirSync(tempDir);
                resolve();
              })
              .on('error', (err) => {
                reject(err);
              })
              .run();
          })
          .on('error', (err) => {
            reject(err);
          })
          .run();
      })
      .on('error', (err) => {
        reject(err);
      })
      .run();
  });
}

module.exports = {
  processAudio
};
