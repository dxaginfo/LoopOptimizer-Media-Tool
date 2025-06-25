/**
 * Export Controller
 * Handles exporting optimized loops in various formats
 */

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const ffmpeg = require('fluent-ffmpeg');

/**
 * Export media in specified format
 */
async function exportMedia(req, res) {
  try {
    const { fileId, format, quality, loopCount } = req.body;
    
    // Validate required parameters
    if (!fileId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameter: fileId'
      });
    }
    
    // Check if source file exists
    const sourceFile = path.join('./public/output', `${fileId}.mp4`);
    if (!fs.existsSync(sourceFile)) {
      return res.status(404).json({
        success: false,
        message: 'Source file not found'
      });
    }
    
    // Determine export format and settings
    const exportFormat = format || 'mp4';
    const exportQuality = quality || 'medium';
    const loops = parseInt(loopCount) || 1;
    
    // Generate output filename
    const outputId = uuidv4();
    const outputDir = './public/exports';
    const outputFile = path.join(outputDir, `${outputId}.${exportFormat}`);
    
    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Configure quality settings based on format and quality parameter
    const settings = getExportSettings(exportFormat, exportQuality);
    
    // Perform the export with loop count
    await exportWithLoops(sourceFile, outputFile, exportFormat, settings, loops);
    
    // Return response with output information
    res.json({
      success: true,
      message: 'Export completed successfully',
      output: {
        id: outputId,
        url: `/exports/${outputId}.${exportFormat}`,
        format: exportFormat,
        quality: exportQuality,
        loopCount: loops
      }
    });
    
  } catch (error) {
    console.error('Error exporting media:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting media',
      error: error.message
    });
  }
}

/**
 * Get export settings based on format and quality
 */
function getExportSettings(format, quality) {
  const settings = {};
  
  // Base settings by quality
  switch (quality) {
    case 'low':
      settings.videoBitrate = '1000k';
      settings.audioBitrate = '96k';
      settings.scale = 480;
      break;
    case 'high':
      settings.videoBitrate = '5000k';
      settings.audioBitrate = '192k';
      settings.scale = 1080;
      break;
    case 'medium':
    default:
      settings.videoBitrate = '2500k';
      settings.audioBitrate = '128k';
      settings.scale = 720;
      break;
  }
  
  // Format-specific settings
  switch (format) {
    case 'webm':
      settings.videoCodec = 'libvpx-vp9';
      settings.audioCodec = 'libopus';
      break;
    case 'gif':
      settings.videoCodec = 'gif';
      settings.audioCodec = null; // GIFs don't have audio
      settings.fps = 15;
      break;
    case 'mov':
      settings.videoCodec = 'prores';
      settings.audioCodec = 'pcm_s16le';
      settings.videoBitrate = quality === 'high' ? '30000k' : '15000k';
      break;
    case 'mp4':
    default:
      settings.videoCodec = 'libx264';
      settings.audioCodec = 'aac';
      settings.preset = quality === 'high' ? 'slow' : 'medium';
      break;
  }
  
  return settings;
}

/**
 * Export media with specified number of loops
 */
async function exportWithLoops(sourceFile, outputFile, format, settings, loops) {
  return new Promise((resolve, reject) => {
    // For GIF format, use specialized approach
    if (format === 'gif') {
      return exportGif(sourceFile, outputFile, settings, loops)
        .then(resolve)
        .catch(reject);
    }
    
    // For other formats, use concatenation approach
    // Create a temporary file list
    const listFile = `${outputFile}.txt`;
    const listContent = Array(loops).fill(`file '${sourceFile}'`).join('\n');
    fs.writeFileSync(listFile, listContent);
    
    // Setup ffmpeg command
    const command = ffmpeg();
    
    // Input using concat demuxer
    command.input(listFile)
      .inputOptions(['-f', 'concat', '-safe', '0'])
      .output(outputFile);
    
    // Apply format-specific settings
    if (settings.videoCodec) {
      command.videoCodec(settings.videoCodec);
    }
    
    if (settings.audioCodec) {
      command.audioCodec(settings.audioCodec);
    } else {
      command.noAudio();
    }
    
    // Apply quality settings
    if (settings.videoBitrate) {
      command.videoBitrate(settings.videoBitrate);
    }
    
    if (settings.audioBitrate) {
      command.audioBitrate(settings.audioBitrate);
    }
    
    if (settings.preset) {
      command.outputOptions(['-preset', settings.preset]);
    }
    
    if (settings.scale) {
      command.size(`?x${settings.scale}`);
    }
    
    // Execute the command
    command
      .on('end', () => {
        // Clean up list file
        fs.unlinkSync(listFile);
        resolve();
      })
      .on('error', (err) => {
        // Clean up list file if it exists
        if (fs.existsSync(listFile)) {
          fs.unlinkSync(listFile);
        }
        reject(err);
      })
      .run();
  });
}

/**
 * Export as GIF with specified number of loops
 */
async function exportGif(sourceFile, outputFile, settings, loops) {
  return new Promise((resolve, reject) => {
    const command = ffmpeg(sourceFile);
    
    // GIF-specific settings
    command
      .outputOptions([
        `-loop ${loops === 0 ? 0 : loops}`, // 0 means infinite loop in GIF
        `-vf scale=${settings.scale}:-1:flags=lanczos,fps=${settings.fps || 15}`
      ])
      .noAudio()
      .output(outputFile)
      .on('end', resolve)
      .on('error', reject)
      .run();
  });
}

module.exports = {
  exportMedia
};
