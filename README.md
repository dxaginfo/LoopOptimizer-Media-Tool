# LoopOptimizer - Media Automation Tool

LoopOptimizer is a specialized JavaScript tool for analyzing and optimizing looping media sequences. It identifies optimal loop points, transitions, and transformation parameters to create seamless, efficient media loops for various applications including video, audio, and animation sequences.

## Features

- **Loop Point Detection**: Automatically identifies optimal start and end points for looping content
- **Transition Optimization**: Smooths transitions between loop iterations
- **Frame Analysis**: Analyzes frame-by-frame content to identify minimal differences
- **Audio Seamless Bridging**: Creates crossfades and waveform matching for audio loops
- **Compression Optimization**: Optimizes compression parameters specifically for looping content

## Technology Stack

- **Language**: JavaScript
- **Runtime Environment**: Node.js, Browser
- **Cloud Integration**: Firebase (Authentication, Storage, Functions)
- **AI Integration**: Gemini API for intelligent loop point suggestion
- **Supporting Libraries**: 
  - FFmpeg.js for media processing
  - Web Audio API for audio analysis
  - TensorFlow.js for pattern recognition

## Installation

```bash
# Clone the repository
git clone https://github.com/dxaginfo/LoopOptimizer-Media-Tool.git

# Navigate to the project directory
cd LoopOptimizer-Media-Tool

# Install dependencies
npm install
```

## Configuration

Create a configuration file with your API keys:

```javascript
// config.js
export default {
  firebase: {
    apiKey: "YOUR_FIREBASE_API_KEY",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project",
    storageBucket: "your-project.appspot.com"
  },
  gemini: {
    apiKey: "YOUR_GEMINI_API_KEY"
  }
};
```

## Usage

### Basic Usage

```javascript
import LoopOptimizer from './src/loop-optimizer.js';
import config from './config.js';

// Initialize with configuration
const optimizer = new LoopOptimizer(config);

// Process a media file
const mediaFile = document.getElementById('mediaFile').files[0];
const result = await optimizer.processMedia(mediaFile, {
  loopParameters: {
    quality: "high",
    crossfadeDuration: 0.5,
    preserveAudioSync: true
  },
  outputFormat: "mp4",
  optimizationPreset: "web",
  saveResults: true
});

// Use the optimized loop
console.log(result.optimizedLoop.url);
console.log(result.loopMetadata);
```

### Node.js Usage

```javascript
const LoopOptimizer = require('./src/loop-optimizer.js');
const fs = require('fs');
const config = require('./config.js');

async function optimizeVideoLoop(inputPath, outputPath) {
  const optimizer = new LoopOptimizer(config);
  
  // Read input file
  const inputBuffer = fs.readFileSync(inputPath);
  
  // Process the media
  const result = await optimizer.processMedia(inputBuffer, {
    loopParameters: {
      targetDuration: 10, // 10 second loop
      quality: "high",
      crossfadeDuration: 0.75
    },
    outputFormat: "mp4",
    optimizationPreset: "broadcast",
    saveResults: false
  });
  
  // Save the result
  fs.writeFileSync(outputPath, result.optimizedLoop.data);
  
  console.log(`Loop created successfully!`);
  return result;
}

optimizeVideoLoop('input-video.mp4', 'optimized-loop.mp4')
  .then(result => console.log('Process complete!'))
  .catch(error => console.error('Error:', error));
```

## API Reference

### LoopOptimizer

The main class that orchestrates the loop optimization process.

```javascript
const optimizer = new LoopOptimizer(config);
```

#### Methods

- `async processMedia(mediaInput, parameters)`: Process a media file to create an optimized loop.

#### Parameters

- `mediaInput`: Media content to process (Blob, File, or ArrayBuffer)
- `parameters`: Processing parameters
  - `loopParameters`: Loop-specific parameters
    - `targetDuration`: Optional desired loop duration (in seconds)
    - `crossfadeDuration`: Duration of crossfade in seconds
    - `quality`: "low", "medium", or "high"
    - `preserveAudioSync`: Boolean
  - `outputFormat`: Desired output format (e.g., "mp4", "gif")
  - `optimizationPreset`: "web", "mobile", or "broadcast"
  - `saveResults`: Whether to save results to Firebase

#### Return Value

```javascript
{
  optimizedLoop: {
    url: "string", // URL to the optimized loop
    format: "string", // Output format
    duration: number, // Loop duration in seconds
    fileSize: number // Size in bytes
  },
  loopMetadata: {
    loopPoints: {
      start: number, // Start timestamp in seconds
      end: number // End timestamp in seconds
    },
    transitionPoints: [
      {
        timestamp: number,
        duration: number,
        type: "string" // "crossfade", "cut", "morph"
      }
    ],
    qualityMetrics: {
      seamlessScore: number, // 0-100
      compressionRatio: number,
      artifactRating: number // 0-100
    }
  }
}
```

## Integration with Other Tools

LoopOptimizer is designed to work seamlessly with other media automation tools:

- **SceneValidator**: For validating scenes before creating loops
- **TimelineAssembler**: For incorporating optimized loops into media timelines
- **FormatNormalizer**: For ensuring compatibility across different platforms

## License

MIT

## Contact

For support or inquiries, please open an issue on this repository.