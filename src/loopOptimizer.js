/**
 * LoopOptimizer - Main entry point for the media loop optimization tool
 * 
 * This class coordinates the loop optimization process, integrating the analysis,
 * optimization, and output generation components into a unified workflow.
 */

import LoopAnalyzer from './core/loopAnalyzer.js';
import TransitionOptimizer from './core/transitionOptimizer.js';
import OutputGenerator from './core/outputGenerator.js';
import FirebaseIntegration from './integrations/firebaseIntegration.js';
import GeminiIntegration from './integrations/geminiIntegration.js';

class LoopOptimizer {
  /**
   * Initialize the loop optimizer
   * @param {Object} config - Configuration object
   * @param {Object} config.firebase - Firebase configuration
   * @param {Object} config.gemini - Gemini API configuration
   * @param {Object} config.storage - Storage configuration
   * @param {Object} config.processing - Processing configuration
   */
  constructor(config = {}) {
    this.config = this._normalizeConfig(config);
    this.analyzer = new LoopAnalyzer(this.config);
    this.transitionOptimizer = null; // Lazy loaded
    this.outputGenerator = null; // Lazy loaded
    this.firebase = null;
    
    // Initialize integrations if configured
    if (this.config.firebase && this.config.firebase.apiKey) {
      this.firebase = new FirebaseIntegration(this.config.firebase);
    }
    
    this.ready = this._initialize();
  }
  
  /**
   * Normalize configuration with defaults
   * @private
   * @param {Object} config - User-provided configuration
   * @returns {Object} - Normalized configuration
   */
  _normalizeConfig(config) {
    return {
      firebase: config.firebase || {},
      gemini: config.gemini || { apiKey: null },
      storage: config.storage || { 
        type: 'local',
        path: './output'
      },
      processing: config.processing || {
        quality: 'high',
        parallelJobs: 2,
        timeout: 300000 // 5 minutes
      },
      // Default optimization preferences
      optimizationDefaults: config.optimizationDefaults || {
        quality: 'high',
        preserveAspectRatio: true,
        minLoopDuration: 3,
        maxLoopDuration: 10,
        preferredTransition: 'crossfade',
        audioFade: true
      }
    };
  }
  
  /**
   * Initialize the optimizer
   * @private
   * @returns {Promise<boolean>} - Success indicator
   */
  async _initialize() {
    try {
      // Initialize any required services
      if (this.firebase) {
        await this.firebase.initialize();
      }
      
      // Pre-load required resources
      // This could include model loading, etc.
      
      return true;
    } catch (error) {
      console.error('Failed to initialize LoopOptimizer:', error);
      return false;
    }
  }
  
  /**
   * Process media to create an optimized loop
   * @param {Blob|File|ArrayBuffer} mediaInput - Media content to process
   * @param {Object} parameters - Processing parameters
   * @returns {Promise<Object>} - Processing results
   */
  async processMedia(mediaInput, parameters = {}) {
    // Ensure initialization is complete
    await this.ready;
    
    // Normalize parameters with defaults
    const params = {
      ...this.config.optimizationDefaults,
      ...parameters
    };
    
    try {
      // Determine media type
      const mediaType = await this._detectMediaType(mediaInput);
      
      // Step 1: Load and analyze media
      await this.analyzer.loadMedia(mediaInput, mediaType);
      const analysisResults = await this.analyzer.analyzeMedia({
        minLoopDuration: params.minLoopDuration,
        maxLoopDuration: params.maxLoopDuration,
        quality: params.quality
      });
      
      // Step 2: Optimize transitions
      this.transitionOptimizer = this.transitionOptimizer || 
        new TransitionOptimizer(this.config);
      
      const optimizedLoop = await this.transitionOptimizer.optimizeTransition(
        mediaInput,
        analysisResults.bestLoopPoint,
        {
          transitionType: params.preferredTransition,
          quality: params.quality,
          audioFade: params.audioFade
        }
      );
      
      // Step 3: Generate output
      this.outputGenerator = this.outputGenerator || 
        new OutputGenerator(this.config);
        
      const outputResult = await this.outputGenerator.generateOutput(
        optimizedLoop,
        {
          format: params.outputFormat,
          quality: params.quality,
          preserveAspectRatio: params.preserveAspectRatio
        }
      );
      
      // Step 4: Save results if requested
      let savedResults = null;
      if (params.saveResults && this.firebase) {
        savedResults = await this.firebase.saveResults({
          analysis: analysisResults,
          output: outputResult
        });
      }
      
      // Return comprehensive results
      return {
        timestamp: new Date().toISOString(),
        inputParameters: params,
        mediaInfo: {
          type: mediaType,
          originalSize: mediaInput.size || null,
          duration: analysisResults.mediaInfo.duration
        },
        optimizedLoop: {
          url: outputResult.url,
          format: outputResult.format,
          duration: outputResult.duration,
          fileSize: outputResult.fileSize,
          data: params.includeData ? outputResult.data : null
        },
        loopMetadata: {
          loopPoints: {
            start: analysisResults.bestLoopPoint.startTime,
            end: analysisResults.bestLoopPoint.endTime
          },
          transitionPoints: optimizedLoop.transitions,
          qualityMetrics: {
            seamlessScore: analysisResults.bestLoopPoint.score * 100,
            compressionRatio: outputResult.compressionRatio,
            artifactRating: outputResult.artifactRating
          }
        },
        storage: savedResults,
        processingTime: outputResult.processingTime
      };
    } catch (error) {
      console.error('Error processing media:', error);
      throw new Error(`Media processing failed: ${error.message}`);
    }
  }
  
  /**
   * Detect media type from input
   * @private
   * @param {Blob|File|ArrayBuffer} mediaInput - Media input
   * @returns {Promise<string>} - Media MIME type
   */
  async _detectMediaType(mediaInput) {
    if (mediaInput instanceof Blob || mediaInput instanceof File) {
      return mediaInput.type || 'application/octet-stream';
    }
    
    // For ArrayBuffer, try to detect by examining the header bytes
    if (mediaInput instanceof ArrayBuffer) {
      const header = new Uint8Array(mediaInput.slice(0, 12));
      
      // Check for common video/audio signatures
      // MP4/QuickTime
      if (
        (header[4] === 0x66 && header[5] === 0x74 && header[6] === 0x79 && header[7] === 0x70) ||
        (header[4] === 0x6D && header[5] === 0x6F && header[6] === 0x6F && header[7] === 0x76)
      ) {
        return 'video/mp4';
      }
      
      // WebM
      if (header[0] === 0x1A && header[1] === 0x45 && header[2] === 0xDF && header[3] === 0xA3) {
        return 'video/webm';
      }
      
      // MP3
      if (
        (header[0] === 0x49 && header[1] === 0x44 && header[2] === 0x33) || // ID3v2
        (header[0] === 0xFF && (header[1] & 0xE0) === 0xE0) // MPEG sync
      ) {
        return 'audio/mpeg';
      }
      
      // WAV
      if (
        header[0] === 0x52 && header[1] === 0x49 && header[2] === 0x46 && header[3] === 0x46 &&
        header[8] === 0x57 && header[9] === 0x41 && header[10] === 0x56 && header[11] === 0x45
      ) {
        return 'audio/wav';
      }
      
      // Default to binary
      return 'application/octet-stream';
    }
    
    throw new Error('Unsupported media input type');
  }
  
  /**
   * Retrieve previously processed loops (requires Firebase)
   * @param {string} userId - User ID to retrieve loops for
   * @param {Object} options - Retrieval options
   * @returns {Promise<Array<Object>>} - List of processed loops
   */
  async retrieveProcessedLoops(userId, options = {}) {
    if (!this.firebase) {
      throw new Error('Firebase integration not configured');
    }
    
    try {
      return await this.firebase.getProcessedLoops(userId, options);
    } catch (error) {
      console.error('Error retrieving processed loops:', error);
      throw new Error(`Failed to retrieve loops: ${error.message}`);
    }
  }
  
  /**
   * Get preview frames from media
   * @param {Blob|File|ArrayBuffer} mediaInput - Media to preview
   * @param {Object} options - Preview options
   * @returns {Promise<Array<Object>>} - Preview frames
   */
  async getPreviewFrames(mediaInput, options = {}) {
    const mediaType = await this._detectMediaType(mediaInput);
    
    if (!mediaType.startsWith('video')) {
      throw new Error('Preview frames are only available for video media');
    }
    
    const frameCount = options.frameCount || 6;
    const quality = options.quality || 'medium';
    
    // Implementation would extract frames at regular intervals
    // This is a placeholder
    return Array(frameCount).fill().map((_, i) => ({
      index: i,
      timestamp: i * (10 / frameCount),
      dataUrl: `data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAEBAQEBAQEB...`, // Placeholder
      width: 320,
      height: 180
    }));
  }
  
  /**
   * Clean up resources
   */
  dispose() {
    if (this.analyzer) {
      this.analyzer.reset();
    }
    
    if (this.firebase) {
      this.firebase.disconnect();
    }
  }
}

// Placeholder for TransitionOptimizer class (to be implemented in separate file)
class TransitionOptimizer {
  constructor(config) {
    this.config = config;
  }
  
  async optimizeTransition(mediaInput, loopPoint, options) {
    // Placeholder implementation
    return {
      mediaData: mediaInput,
      loopStart: loopPoint.startTime,
      loopEnd: loopPoint.endTime,
      transitions: [
        {
          timestamp: loopPoint.endTime,
          duration: options.transitionType === 'crossfade' ? 0.5 : 0,
          type: options.transitionType
        }
      ]
    };
  }
}

// Placeholder for OutputGenerator class (to be implemented in separate file)
class OutputGenerator {
  constructor(config) {
    this.config = config;
  }
  
  async generateOutput(optimizedLoop, options) {
    // Placeholder implementation
    return {
      url: 'blob:https://example.com/12345-67890',
      format: options.format || 'mp4',
      duration: optimizedLoop.loopEnd - optimizedLoop.loopStart,
      fileSize: 1024 * 1024 * 2, // 2MB placeholder
      data: null, // Would contain actual data if includeData is true
      compressionRatio: 0.7,
      artifactRating: 92,
      processingTime: 2.5
    };
  }
}

export default LoopOptimizer;