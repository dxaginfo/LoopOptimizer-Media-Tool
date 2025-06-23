// loop-optimizer.js - Main application entry point

import { FirebaseManager } from './firebase/firebase-manager.js';
import { MediaAnalyzer } from './core/media-analyzer.js';
import { LoopProcessor } from './core/loop-processor.js';
import { GeminiService } from './services/gemini-service.js';
import { OutputRenderer } from './output/output-renderer.js';

/**
 * LoopOptimizer - A tool for analyzing and optimizing looping media sequences
 * Identifies optimal loop points, transitions, and transformation parameters
 * to create seamless, efficient media loops for various applications.
 */
class LoopOptimizer {
  /**
   * Create a new LoopOptimizer instance
   * @param {Object} config - Configuration options
   * @param {Object} config.firebase - Firebase configuration
   * @param {Object} config.gemini - Gemini API configuration
   */
  constructor(config) {
    this.config = config;
    this.firebase = new FirebaseManager(config.firebase);
    this.analyzer = new MediaAnalyzer();
    this.processor = new LoopProcessor();
    this.geminiService = new GeminiService(config.gemini.apiKey);
    this.renderer = new OutputRenderer();
    
    this.initialize();
  }
  
  /**
   * Initialize the LoopOptimizer
   * @returns {Promise<void>}
   */
  async initialize() {
    await this.firebase.initialize();
    console.log('LoopOptimizer initialized and ready');
  }
  
  /**
   * Process a media file to create an optimized loop
   * @param {Blob|File|ArrayBuffer} mediaInput - Media content to process
   * @param {Object} parameters - Processing parameters
   * @param {Object} parameters.loopParameters - Loop-specific parameters
   * @param {string} parameters.outputFormat - Desired output format
   * @param {string} parameters.optimizationPreset - Optimization preset
   * @param {boolean} parameters.saveResults - Whether to save results
   * @returns {Promise<Object>} The processed loop result
   */
  async processMedia(mediaInput, parameters) {
    try {
      // Load and validate media
      const mediaSource = await this.analyzer.loadMedia(mediaInput);
      
      // Analyze media for patterns and loop candidates
      const analysisResults = await this.analyzer.analyzeContent(mediaSource);
      
      // Get AI suggestions for loop points
      const loopSuggestions = await this.geminiService.suggestLoopPoints(analysisResults);
      
      // Process the media to create optimized loop
      const processedLoop = await this.processor.createLoop(
        mediaSource, 
        loopSuggestions, 
        parameters
      );
      
      // Evaluate loop quality
      const qualityScore = await this.geminiService.evaluateLoopQuality(processedLoop);
      
      // Render final output
      const outputMedia = await this.renderer.renderOutput(
        processedLoop, 
        parameters.outputFormat
      );
      
      // Store results if needed
      if (parameters.saveResults) {
        await this.firebase.storeResults(outputMedia, qualityScore);
      }
      
      return {
        optimizedLoop: outputMedia,
        loopMetadata: {
          loopPoints: loopSuggestions.points,
          transitionPoints: processedLoop.transitions,
          qualityMetrics: qualityScore
        }
      };
    } catch (error) {
      console.error('Error processing media:', error);
      throw new Error(`Media processing failed: ${error.message}`);
    }
  }
}

export default LoopOptimizer;