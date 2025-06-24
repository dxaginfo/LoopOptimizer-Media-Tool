/**
 * LoopOptimizer Web UI
 * 
 * Main JavaScript file for the LoopOptimizer web interface.
 * Handles UI interactions, media processing, and integration with the core optimizer.
 */

import LoopOptimizer from '../loopOptimizer.js';

class LoopOptimizerUI {
  constructor() {
    // Initialize core optimizer
    this.optimizer = null;
    
    // State
    this.currentFile = null;
    this.currentResult = null;
    this.currentView = 'optimizer';
    this.isLoggedIn = false;
    this.userProfile = null;
    
    // DOM Elements - Header & Navigation
    this.navLinks = document.querySelectorAll('.header-nav a');
    this.views = document.querySelectorAll('.view');
    this.loginBtn = document.getElementById('loginBtn');
    this.userProfileElem = document.getElementById('userProfile');
    this.usernameElem = document.querySelector('.username');
    this.avatarElem = document.querySelector('.avatar');
    
    // DOM Elements - Optimizer View
    this.uploadArea = document.getElementById('uploadArea');
    this.mediaFileInput = document.getElementById('mediaFileInput');
    this.uploadProgress = document.getElementById('uploadProgress');
    this.progressFill = document.querySelector('.progress-fill');
    this.progressPercentage = document.querySelector('.progress-percentage');
    this.optimizeBtn = document.getElementById('optimizeBtn');
    this.resultCard = document.getElementById('resultCard');
    
    // DOM Elements - Quality Settings
    this.qualityInputs = document.querySelectorAll('input[name="quality"]');
    this.loopDurationInput = document.getElementById('loopDuration');
    this.loopDurationValue = document.getElementById('loopDurationValue');
    this.transitionTypeSelect = document.getElementById('transitionType');
    this.preserveAspectRatio = document.getElementById('preserveAspectRatio');
    this.audioFade = document.getElementById('audioFade');
    this.autoOptimizeCompression = document.getElementById('autoOptimizeCompression');
    this.outputFormat = document.getElementById('outputFormat');
    
    // DOM Elements - Result View
    this.previewContainer = document.getElementById('previewContainer');
    this.playPauseBtn = document.getElementById('playPauseBtn');
    this.muteBtn = document.getElementById('muteBtn');
    this.loopDurationResult = document.getElementById('loopDurationResult');
    this.fileSizeResult = document.getElementById('fileSizeResult');
    this.seamlessScoreResult = document.getElementById('seamlessScoreResult');
    this.loopPointsResult = document.getElementById('loopPointsResult');
    this.transitionResult = document.getElementById('transitionResult');
    this.originalSizeResult = document.getElementById('originalSizeResult');
    this.compressionRatioResult = document.getElementById('compressionRatioResult');
    this.downloadBtn = document.getElementById('downloadBtn');
    this.saveToAccountBtn = document.getElementById('saveToAccountBtn');
    this.createNewBtn = document.getElementById('createNewBtn');
    
    // DOM Elements - Gallery View
    this.loginPrompt = document.getElementById('loginPrompt');
    this.loopsGrid = document.getElementById('loopsGrid');
    this.galleryLoginBtn = document.getElementById('galleryLoginBtn');
    this.searchLoops = document.getElementById('searchLoops');
    this.sortLoops = document.getElementById('sortLoops');
    
    // DOM Elements - Settings View
    this.accountLoginPrompt = document.getElementById('accountLoginPrompt');
    this.accountSettings = document.getElementById('accountSettings');
    this.settingsLoginBtn = document.getElementById('settingsLoginBtn');
    this.displayNameInput = document.getElementById('displayName');
    this.emailInput = document.getElementById('email');
    this.changePasswordBtn = document.getElementById('changePasswordBtn');
    this.logoutBtn = document.getElementById('logoutBtn');
    this.defaultQuality = document.getElementById('defaultQuality');
    this.defaultFormat = document.getElementById('defaultFormat');
    this.defaultPreserveAspectRatio = document.getElementById('defaultPreserveAspectRatio');
    this.defaultAudioFade = document.getElementById('defaultAudioFade');
    this.saveOriginals = document.getElementById('saveOriginals');
    this.geminiApiKey = document.getElementById('geminiApiKey');
    this.googleCloudStorageConfig = document.getElementById('googleCloudStorageConfig');
    this.saveSettingsBtn = document.getElementById('saveSettingsBtn');
    this.saveApiSettingsBtn = document.getElementById('saveApiSettingsBtn');
    this.showHideApiKeyBtn = document.getElementById('showHideApiKeyBtn');
    
    // DOM Elements - Modals
    this.loginModal = document.getElementById('loginModal');
    this.processingModal = document.getElementById('processingModal');
    this.processingStatus = document.getElementById('processingStatus');
    this.modalOverlays = document.querySelectorAll('.modal-overlay');
    this.modalCloseButtons = document.querySelectorAll('.modal-close');
    this.authTabs = document.querySelectorAll('.auth-tab');
    this.authForms = document.querySelectorAll('.auth-form');
    this.loginForm = document.getElementById('loginTab');
    this.signupForm = document.getElementById('signupTab');
    this.submitLoginBtn = document.getElementById('submitLoginBtn');
    this.submitSignupBtn = document.getElementById('submitSignupBtn');
    this.loginEmail = document.getElementById('loginEmail');
    this.loginPassword = document.getElementById('loginPassword');
    this.signupName = document.getElementById('signupName');
    this.signupEmail = document.getElementById('signupEmail');
    this.signupPassword = document.getElementById('signupPassword');
    this.forgotPasswordLink = document.getElementById('forgotPasswordLink');
    
    // Initialize the UI
    this.init();
  }
  
  /**
   * Initialize the UI and event listeners
   */
  async init() {
    // Initialize Firebase config from localStorage if available
    const savedConfig = localStorage.getItem('loopOptimizer.config');
    const config = savedConfig ? JSON.parse(savedConfig) : {};
    
    // Initialize the optimizer
    this.optimizer = new LoopOptimizer(config);
    await this.optimizer.ready;
    
    // Setup event listeners
    this.setupNavigationListeners();
    this.setupOptimizerListeners();
    this.setupResultListeners();
    this.setupGalleryListeners();
    this.setupSettingsListeners();
    this.setupModalListeners();
    this.setupAuthListeners();
    
    // Check authentication state
    this.checkAuthState();
    
    // Load user preferences if available
    this.loadUserPreferences();
    
    console.log('LoopOptimizer UI initialized');
  }
  
  /**
   * Setup navigation listeners
   */
  setupNavigationListeners() {
    // Navigation between views
    this.navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const view = link.getAttribute('data-view');
        this.switchView(view);
      });
    });
    
    // Login button
    this.loginBtn.addEventListener('click', () => {
      this.openLoginModal();
    });
  }
  
  /**
   * Setup optimizer view listeners
   */
  setupOptimizerListeners() {
    // Upload area click
    this.uploadArea.addEventListener('click', () => {
      this.mediaFileInput.click();
    });
    
    // File drop
    this.uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      this.uploadArea.classList.add('dragging');
    });
    
    this.uploadArea.addEventListener('dragleave', () => {
      this.uploadArea.classList.remove('dragging');
    });
    
    this.uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      this.uploadArea.classList.remove('dragging');
      
      if (e.dataTransfer.files.length > 0) {
        this.handleFileSelect(e.dataTransfer.files[0]);
      }
    });
    
    // File input change
    this.mediaFileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        this.handleFileSelect(e.target.files[0]);
      }
    });
    
    // Loop duration slider
    this.loopDurationInput.addEventListener('input', (e) => {
      const value = parseFloat(e.target.value);
      this.loopDurationValue.textContent = `${value}s`;
    });
    
    // Optimize button
    this.optimizeBtn.addEventListener('click', () => {
      this.startOptimization();
    });
  }
  
  /**
   * Setup result view listeners
   */
  setupResultListeners() {
    // Play/pause button
    this.playPauseBtn.addEventListener('click', () => {
      const mediaElement = this.previewContainer.querySelector('video, audio');
      if (mediaElement) {
        if (mediaElement.paused) {
          mediaElement.play();
          this.playPauseBtn.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 4H6V20H10V4Z" fill="currentColor"/>
              <path d="M18 4H14V20H18V4Z" fill="currentColor"/>
            </svg>
          `;
        } else {
          mediaElement.pause();
          this.playPauseBtn.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 5V19L19 12L8 5Z" fill="currentColor"/>
            </svg>
          `;
        }
      }
    });
    
    // Mute button
    this.muteBtn.addEventListener('click', () => {
      const mediaElement = this.previewContainer.querySelector('video, audio');
      if (mediaElement) {
        mediaElement.muted = !mediaElement.muted;
        if (mediaElement.muted) {
          this.muteBtn.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11 5L6 9H2V15H6L11 19V5Z" fill="currentColor"/>
              <path d="M23 9L17 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              <path d="M17 9L23 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          `;
        } else {
          this.muteBtn.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15.5 8.5C15.5 8.5 17 10 17 12C17 14 15.5 15.5 15.5 15.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M11 5L6 9H2V15H6L11 19V5Z" fill="currentColor"/>
            </svg>
          `;
        }
      }
    });
    
    // Download button
    this.downloadBtn.addEventListener('click', () => {
      if (this.currentResult && this.currentResult.optimizedLoop.url) {
        const a = document.createElement('a');
        a.href = this.currentResult.optimizedLoop.url;
        a.download = `optimized-loop.${this.currentResult.optimizedLoop.format || 'mp4'}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    });
    
    // Save to account button
    this.saveToAccountBtn.addEventListener('click', () => {
      if (!this.isLoggedIn) {
        this.openLoginModal();
        return;
      }
      
      if (this.currentResult) {
        this.saveResultToAccount(this.currentResult);
      }
    });
    
    // Create new button
    this.createNewBtn.addEventListener('click', () => {
      this.resetUI();
    });
  }
  
  /**
   * Setup gallery view listeners
   */
  setupGalleryListeners() {
    // Gallery login button
    this.galleryLoginBtn.addEventListener('click', () => {
      this.openLoginModal();
    });
    
    // Search input
    this.searchLoops.addEventListener('input', (e) => {
      this.filterLoops(e.target.value);
    });
    
    // Sort select
    this.sortLoops.addEventListener('change', (e) => {
      this.sortLoopsBy(e.target.value);
    });
  }
  
  /**
   * Setup settings view listeners
   */
  setupSettingsListeners() {
    // Settings login button
    this.settingsLoginBtn.addEventListener('click', () => {
      this.openLoginModal();
    });
    
    // Change password button
    this.changePasswordBtn.addEventListener('click', () => {
      // Implement password change functionality
      alert('Password change functionality would be implemented here');
    });
    
    // Logout button
    this.logoutBtn.addEventListener('click', () => {
      this.logout();
    });
    
    // Save settings button
    this.saveSettingsBtn.addEventListener('click', () => {
      this.saveUserPreferences();
    });
    
    // Save API settings button
    this.saveApiSettingsBtn.addEventListener('click', () => {
      this.saveApiSettings();
    });
    
    // Show/hide API key
    this.showHideApiKeyBtn.addEventListener('click', () => {
      if (this.geminiApiKey.type === 'password') {
        this.geminiApiKey.type = 'text';
        this.showHideApiKeyBtn.textContent = 'Hide';
      } else {
        this.geminiApiKey.type = 'password';
        this.showHideApiKeyBtn.textContent = 'Show';
      }
    });
  }
  
  /**
   * Setup modal listeners
   */
  setupModalListeners() {
    // Close modals on overlay click
    this.modalOverlays.forEach(overlay => {
      overlay.addEventListener('click', () => {
        this.closeAllModals();
      });
    });
    
    // Close modals on close button click
    this.modalCloseButtons.forEach(button => {
      button.addEventListener('click', () => {
        this.closeAllModals();
      });
    });
    
    // Auth tabs
    this.authTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const tabName = tab.getAttribute('data-tab');
        this.switchAuthTab(tabName);
      });
    });
  }
  
  /**
   * Setup authentication listeners
   */
  setupAuthListeners() {
    // Login form submit
    this.submitLoginBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this.loginUser(this.loginEmail.value, this.loginPassword.value);
    });
    
    // Signup form submit
    this.submitSignupBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this.signupUser(this.signupName.value, this.signupEmail.value, this.signupPassword.value);
    });
    
    // Forgot password
    this.forgotPasswordLink.addEventListener('click', (e) => {
      e.preventDefault();
      const email = prompt('Please enter your email address:');
      if (email) {
        // Implement password reset functionality
        alert(`Password reset link would be sent to ${email}`);
      }
    });
  }
  
  /**
   * Switch between views
   * @param {string} view - View name to switch to
   */
  switchView(view) {
    // Update active nav link
    this.navLinks.forEach(link => {
      link.classList.toggle('active', link.getAttribute('data-view') === view);
    });
    
    // Update active view
    this.views.forEach(viewElem => {
      viewElem.classList.toggle('active', viewElem.id === `${view}View`);
    });
    
    this.currentView = view;
    
    // Perform view-specific actions
    if (view === 'gallery' && this.isLoggedIn) {
      this.loadGallery();
    }
  }
  
  /**
   * Handle file selection
   * @param {File} file - Selected file
   */
  handleFileSelect(file) {
    // Validate file
    if (!this.validateFile(file)) {
      return;
    }
    
    // Store the file
    this.currentFile = file;
    
    // Update UI
    this.uploadArea.innerHTML = `
      <div class="upload-icon">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 4V16M12 4L8 8M12 4L16 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M4 20H20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <p>${file.name} (${this.formatFileSize(file.size)})</p>
      <p class="upload-hint">Click to select a different file</p>
    `;
    
    // Enable optimize button
    this.optimizeBtn.disabled = false;
  }
  
  /**
   * Validate file type and size
   * @param {File} file - File to validate
   * @returns {boolean} - Validation result
   */
  validateFile(file) {
    // Check file type
    if (!file.type.startsWith('video/') && 
        !file.type.startsWith('audio/') && 
        file.type !== 'image/gif') {
      alert('Please select a valid media file (video, audio, or GIF)');
      return false;
    }
    
    // Check file size (100MB max)
    if (file.size > 100 * 1024 * 1024) {
      alert('File size exceeds 100MB limit');
      return false;
    }
    
    return true;
  }
  
  /**
   * Start the optimization process
   */
  async startOptimization() {
    if (!this.currentFile) {
      alert('Please select a media file first');
      return;
    }
    
    // Show processing modal
    this.showProcessingModal();
    
    // Get optimization parameters
    const params = {
      quality: this.getSelectedQuality(),
      minLoopDuration: parseFloat(this.loopDurationInput.value) - 2,
      maxLoopDuration: parseFloat(this.loopDurationInput.value) + 2,
      preferredTransition: this.transitionTypeSelect.value,
      preserveAspectRatio: this.preserveAspectRatio.checked,
      audioFade: this.audioFade.checked,
      autoOptimizeCompression: this.autoOptimizeCompression.checked,
      outputFormat: this.outputFormat.value,
      saveResults: this.isLoggedIn
    };
    
    try {
      // Process media with the optimizer
      this.updateProcessingStatus('Analyzing media for optimal loop points...');
      
      // Simulated delay for demonstration
      await new Promise(resolve => setTimeout(resolve, 2000));
      this.updateProcessingStatus('Optimizing transitions...');
      
      // Simulated delay for demonstration
      await new Promise(resolve => setTimeout(resolve, 1500));
      this.updateProcessingStatus('Generating optimized output...');
      
      // In a real implementation, this would use the actual optimizer
      // const result = await this.optimizer.processMedia(this.currentFile, params);
      
      // Simulate optimization result
      const result = this.simulateOptimizationResult(this.currentFile, params);
      
      // Store the result
      this.currentResult = result;
      
      // Close processing modal
      this.closeAllModals();
      
      // Display result
      this.displayResult(result);
    } catch (error) {
      console.error('Optimization error:', error);
      alert('An error occurred during optimization: ' + error.message);
      this.closeAllModals();
    }
  }
  
  /**
   * Simulate optimization result for demonstration
   * @param {File} file - Input file
   * @param {Object} params - Optimization parameters
   * @returns {Object} - Simulated result
   */
  simulateOptimizationResult(file, params) {
    // Create object URL for preview
    const objectUrl = URL.createObjectURL(file);
    
    // Calculate simulated loop points
    const duration = 12; // Simulated duration in seconds
    const loopStart = Math.max(0, (duration / 2) - (params.maxLoopDuration / 2));
    const loopEnd = Math.min(duration, loopStart + params.maxLoopDuration);
    const actualDuration = loopEnd - loopStart;
    
    // Simulated file size reduction
    const compressionRatio = params.quality === 'low' ? 0.3 : 
                            params.quality === 'medium' ? 0.5 : 0.7;
    const optimizedSize = Math.round(file.size * compressionRatio);
    
    // Simulated quality score (higher for higher quality setting)
    const qualityScoreBase = params.quality === 'low' ? 75 : 
                            params.quality === 'medium' ? 85 : 92;
    const seamlessScore = qualityScoreBase + Math.floor(Math.random() * 8);
    
    return {
      timestamp: new Date().toISOString(),
      inputParameters: params,
      mediaInfo: {
        type: file.type,
        originalSize: file.size,
        duration: duration
      },
      optimizedLoop: {
        url: objectUrl,
        format: params.outputFormat,
        duration: actualDuration,
        fileSize: optimizedSize
      },
      loopMetadata: {
        loopPoints: {
          start: loopStart,
          end: loopEnd
        },
        transitionPoints: [
          {
            timestamp: loopEnd,
            duration: params.preferredTransition === 'crossfade' ? 0.5 : 0,
            type: params.preferredTransition === 'auto' ? 'crossfade' : params.preferredTransition
          }
        ],
        qualityMetrics: {
          seamlessScore: seamlessScore,
          compressionRatio: 1 - compressionRatio,
          artifactRating: seamlessScore - 5
        }
      },
      processingTime: 3.7
    };
  }
  
  /**
   * Display optimization result
   * @param {Object} result - Optimization result
   */
  displayResult(result) {
    // Create media element based on type
    let mediaElement;
    if (result.mediaInfo.type.startsWith('video/') || result.mediaInfo.type === 'image/gif') {
      mediaElement = document.createElement('video');
      mediaElement.controls = false;
      mediaElement.loop = true;
      mediaElement.autoplay = true;
      mediaElement.muted = true;
    } else if (result.mediaInfo.type.startsWith('audio/')) {
      mediaElement = document.createElement('audio');
      mediaElement.controls = false;
      mediaElement.loop = true;
      mediaElement.autoplay = true;
    }
    
    // Set media source
    mediaElement.src = result.optimizedLoop.url;
    
    // Clear previous content and add new media
    this.previewContainer.innerHTML = '';
    this.previewContainer.appendChild(mediaElement);
    
    // Update result info
    this.loopDurationResult.textContent = `${result.optimizedLoop.duration.toFixed(1)}s`;
    this.fileSizeResult.textContent = this.formatFileSize(result.optimizedLoop.fileSize);
    this.seamlessScoreResult.textContent = `${Math.round(result.loopMetadata.qualityMetrics.seamlessScore)}%`;
    
    // Update details
    this.loopPointsResult.textContent = `${this.formatTime(result.loopMetadata.loopPoints.start)} - ${this.formatTime(result.loopMetadata.loopPoints.end)}`;
    
    const transitionType = result.loopMetadata.transitionPoints[0].type;
    const transitionDuration = result.loopMetadata.transitionPoints[0].duration;
    this.transitionResult.textContent = `${this.capitalizeFirst(transitionType)}${transitionDuration > 0 ? ` (${transitionDuration.toFixed(1)}s)` : ''}`;
    
    this.originalSizeResult.textContent = this.formatFileSize(result.mediaInfo.originalSize);
    this.compressionRatioResult.textContent = `${Math.round(result.loopMetadata.qualityMetrics.compressionRatio * 100)}%`;
    
    // Show result card
    this.resultCard.classList.remove('hidden');
    
    // Adjust save button based on login state
    this.saveToAccountBtn.textContent = this.isLoggedIn ? 'Save to Account' : 'Log In to Save';
  }
  
  /**
   * Update processing status text
   * @param {string} status - Status text
   */
  updateProcessingStatus(status) {
    this.processingStatus.textContent = status;
  }
  
  /**
   * Save result to user account
   * @param {Object} result - Result to save
   */
  async saveResultToAccount(result) {
    try {
      // In a real implementation, this would call the optimizer's save method
      // await this.optimizer.saveToAccount(result);
      
      // Simulate saving
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert('Loop saved to your account');
    } catch (error) {
      console.error('Error saving result:', error);
      alert('Failed to save: ' + error.message);
    }
  }
  
  /**
   * Load user's saved loops for gallery
   */
  async loadGallery() {
    if (!this.isLoggedIn) {
      this.loginPrompt.classList.remove('hidden');
      this.loopsGrid.classList.add('hidden');
      return;
    }
    
    this.loginPrompt.classList.add('hidden');
    this.loopsGrid.classList.remove('hidden');
    
    try {
      // Show loading state
      this.loopsGrid.innerHTML = '<div class="loading-spinner"></div>';
      
      // In a real implementation, this would fetch from the optimizer
      // const loops = await this.optimizer.retrieveProcessedLoops(this.userProfile.uid);
      
      // Simulate fetching loops
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate mock data
      const loops = this.generateMockGalleryData();
      
      // Render loops
      this.renderGallery(loops);
    } catch (error) {
      console.error('Error loading gallery:', error);
      this.loopsGrid.innerHTML = `<p>Error loading your loops: ${error.message}</p>`;
    }
  }
  
  /**
   * Generate mock gallery data for demonstration
   * @returns {Array} - Mock loop data
   */
  generateMockGalleryData() {
    const types = ['video/mp4', 'video/webm', 'audio/mp3', 'image/gif'];
    const names = ['Beach Sunset', 'Mountain View', 'City Lights', 'Ocean Waves', 
                   'Forest Ambient', 'Rain Sound', 'Fireplace', 'Waterfall'];
    
    return Array(8).fill().map((_, i) => {
      const type = types[Math.floor(Math.random() * types.length)];
      const name = names[i % names.length];
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 30));
      
      return {
        id: `loop-${i}`,
        name: `${name} Loop`,
        url: 'assets/sample-loop.mp4', // Placeholder URL
        type: type,
        duration: 2 + Math.random() * 8,
        fileSize: Math.floor(100000 + Math.random() * 5000000),
        date: date.toISOString(),
        score: 75 + Math.floor(Math.random() * 25)
      };
    });
  }
  
  /**
   * Render gallery with loop data
   * @param {Array} loops - Loop data to render
   */
  renderGallery(loops) {
    if (loops.length === 0) {
      this.loopsGrid.innerHTML = `
        <div class="empty-state">
          <p>You haven't created any loops yet.</p>
          <button class="btn btn-primary" id="createFirstLoopBtn">Create Your First Loop</button>
        </div>
      `;
      
      document.getElementById('createFirstLoopBtn').addEventListener('click', () => {
        this.switchView('optimizer');
      });
      
      return;
    }
    
    const loopItems = loops.map(loop => {
      const dateFormatted = new Date(loop.date).toLocaleDateString();
      const durationFormatted = `${loop.duration.toFixed(1)}s`;
      const fileSizeFormatted = this.formatFileSize(loop.fileSize);
      
      return `
        <div class="loop-item" data-id="${loop.id}">
          <div class="loop-preview">
            ${loop.type.startsWith('video') || loop.type === 'image/gif' ? 
              `<video src="${loop.url}" loop muted autoplay></video>` : 
              `<audio src="${loop.url}"></audio>`
            }
          </div>
          <div class="loop-info">
            <h4>${loop.name}</h4>
            <span class="loop-meta">${durationFormatted} • ${fileSizeFormatted} • ${dateFormatted}</span>
          </div>
          <div class="loop-actions">
            <button class="btn btn-icon loop-download-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 16V17C3 18.1046 3.89543 19 5 19H19C20.1046 19 21 18.1046 21 17V16M16 12L12 16M12 16L8 12M12 16V4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <button class="btn btn-icon loop-delete-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 7L18.1327 19.1425C18.0579 20.1891 17.187 21 16.1378 21H7.86224C6.81296 21 5.94208 20.1891 5.86732 19.1425L5 7M10 11V17M14 11V17M15 7V4C15 3.44772 14.5523 3 14 3H10C9.44772 3 9 3.44772 9 4V7M4 7H20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      `;
    }).join('');
    
    this.loopsGrid.innerHTML = loopItems;
    
    // Add event listeners to gallery items
    const downloadButtons = document.querySelectorAll('.loop-download-btn');
    const deleteButtons = document.querySelectorAll('.loop-delete-btn');
    
    downloadButtons.forEach((btn, i) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.downloadLoop(loops[i]);
      });
    });
    
    deleteButtons.forEach((btn, i) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.deleteLoop(loops[i]);
      });
    });
    
    // Loop item click opens the loop
    document.querySelectorAll('.loop-item').forEach((item, i) => {
      item.addEventListener('click', () => {
        this.openLoop(loops[i]);
      });
    });
  }
  
  /**
   * Filter loops in gallery
   * @param {string} query - Search query
   */
  filterLoops(query) {
    const loopItems = document.querySelectorAll('.loop-item');
    
    loopItems.forEach(item => {
      const name = item.querySelector('h4').textContent.toLowerCase();
      const meta = item.querySelector('.loop-meta').textContent.toLowerCase();
      const matchesQuery = name.includes(query.toLowerCase()) || meta.includes(query.toLowerCase());
      
      item.style.display = matchesQuery ? 'block' : 'none';
    });
  }
  
  /**
   * Sort loops in gallery
   * @param {string} sortBy - Sort criteria
   */
  sortLoopsBy(sortBy) {
    // In a real implementation, this would re-fetch loops with new sort criteria
    alert(`Sorting by: ${sortBy} would be implemented here`);
  }
  
  /**
   * Download a loop from gallery
   * @param {Object} loop - Loop to download
   */
  downloadLoop(loop) {
    const a = document.createElement('a');
    a.href = loop.url;
    a.download = `${loop.name}.${loop.type.split('/')[1]}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
  
  /**
   * Delete a loop from gallery
   * @param {Object} loop - Loop to delete
   */
  deleteLoop(loop) {
    if (confirm(`Are you sure you want to delete "${loop.name}"?`)) {
      // In a real implementation, this would call the optimizer to delete the loop
      // Simulate deletion
      const loopItem = document.querySelector(`.loop-item[data-id="${loop.id}"]`);
      if (loopItem) {
        loopItem.remove();
      }
    }
  }
  
  /**
   * Open a loop from gallery
   * @param {Object} loop - Loop to open
   */
  openLoop(loop) {
    // In a real implementation, this would load the loop into the optimizer view
    // for further editing or visualization
    this.switchView('optimizer');
    
    // Simulate loading the loop
    setTimeout(() => {
      alert(`Opening loop: ${loop.name} for viewing/editing would be implemented here`);
    }, 500);
  }
  
  /**
   * Save user preferences
   */
  saveUserPreferences() {
    const preferences = {
      defaultQuality: this.defaultQuality.value,
      defaultFormat: this.defaultFormat.value,
      defaultPreserveAspectRatio: this.defaultPreserveAspectRatio.checked,
      defaultAudioFade: this.defaultAudioFade.checked,
      saveOriginals: this.saveOriginals.checked
    };
    
    // Save to localStorage
    localStorage.setItem('loopOptimizer.preferences', JSON.stringify(preferences));
    
    // If logged in, save to user account
    if (this.isLoggedIn) {
      // In a real implementation, this would save to the user's account
    }
    
    alert('Settings saved successfully');
  }
  
  /**
   * Load user preferences
   */
  loadUserPreferences() {
    const savedPreferences = localStorage.getItem('loopOptimizer.preferences');
    if (savedPreferences) {
      const preferences = JSON.parse(savedPreferences);
      
      // Apply preferences to settings form
      this.defaultQuality.value = preferences.defaultQuality || 'medium';
      this.defaultFormat.value = preferences.defaultFormat || 'mp4';
      this.defaultPreserveAspectRatio.checked = preferences.defaultPreserveAspectRatio !== false;
      this.defaultAudioFade.checked = preferences.defaultAudioFade !== false;
      this.saveOriginals.checked = preferences.saveOriginals === true;
      
      // Also apply to optimizer form
      const qualityInput = document.querySelector(`input[name="quality"][value="${preferences.defaultQuality || 'medium'}"]`);
      if (qualityInput) {
        qualityInput.checked = true;
      }
      
      this.outputFormat.value = preferences.defaultFormat || 'mp4';
      this.preserveAspectRatio.checked = preferences.defaultPreserveAspectRatio !== false;
      this.audioFade.checked = preferences.defaultAudioFade !== false;
    }
    
    // Load API settings
    const savedConfig = localStorage.getItem('loopOptimizer.config');
    if (savedConfig) {
      const config = JSON.parse(savedConfig);
      
      if (config.gemini && config.gemini.apiKey) {
        this.geminiApiKey.value = config.gemini.apiKey;
      }
      
      if (config.storage && config.storage.google) {
        this.googleCloudStorageConfig.value = JSON.stringify(config.storage.google, null, 2);
      }
    }
  }
  
  /**
   * Save API settings
   */
  saveApiSettings() {
    // Get current config
    const savedConfig = localStorage.getItem('loopOptimizer.config');
    const config = savedConfig ? JSON.parse(savedConfig) : {};
    
    // Update Gemini API key
    if (!config.gemini) {
      config.gemini = {};
    }
    config.gemini.apiKey = this.geminiApiKey.value;
    
    // Update Google Cloud Storage config
    try {
      if (this.googleCloudStorageConfig.value) {
        const storageConfig = JSON.parse(this.googleCloudStorageConfig.value);
        if (!config.storage) {
          config.storage = {};
        }
        config.storage.google = storageConfig;
      }
    } catch (error) {
      alert('Invalid JSON format for Google Cloud Storage configuration');
      return;
    }
    
    // Save to localStorage
    localStorage.setItem('loopOptimizer.config', JSON.stringify(config));
    
    // Reinitialize optimizer with new config
    this.optimizer = new LoopOptimizer(config);
    
    alert('API settings saved successfully');
  }
  
  /**
   * Check authentication state
   */
  checkAuthState() {
    // In a real implementation, this would check Firebase auth state
    // For now, check localStorage
    const savedUser = localStorage.getItem('loopOptimizer.user');
    
    if (savedUser) {
      this.userProfile = JSON.parse(savedUser);
      this.handleAuthStateChange(true);
    } else {
      this.handleAuthStateChange(false);
    }
  }
  
  /**
   * Log in user
   * @param {string} email - User email
   * @param {string} password - User password
   */
  async loginUser(email, password) {
    if (!email || !password) {
      alert('Please enter both email and password');
      return;
    }
    
    try {
      // In a real implementation, this would call Firebase auth
      // const user = await this.optimizer.firebase.signIn(email, password);
      
      // Simulate authentication
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock user data
      const user = {
        uid: 'user123',
        email: email,
        displayName: email.split('@')[0]
      };
      
      // Store user info
      this.userProfile = user;
      localStorage.setItem('loopOptimizer.user', JSON.stringify(user));
      
      // Update UI
      this.handleAuthStateChange(true);
      
      // Close login modal
      this.closeAllModals();
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed: ' + (error.message || 'Invalid credentials'));
    }
  }
  
  /**
   * Sign up user
   * @param {string} name - User name
   * @param {string} email - User email
   * @param {string} password - User password
   */
  async signupUser(name, email, password) {
    if (!name || !email || !password) {
      alert('Please fill in all fields');
      return;
    }
    
    try {
      // In a real implementation, this would call Firebase auth
      // const user = await firebase.auth().createUserWithEmailAndPassword(email, password);
      // await user.updateProfile({ displayName: name });
      
      // Simulate signup
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock user data
      const user = {
        uid: 'user123',
        email: email,
        displayName: name
      };
      
      // Store user info
      this.userProfile = user;
      localStorage.setItem('loopOptimizer.user', JSON.stringify(user));
      
      // Update UI
      this.handleAuthStateChange(true);
      
      // Close login modal
      this.closeAllModals();
    } catch (error) {
      console.error('Signup error:', error);
      alert('Signup failed: ' + (error.message || 'An error occurred'));
    }
  }
  
  /**
   * Log out user
   */
  async logout() {
    try {
      // In a real implementation, this would call Firebase auth
      // await this.optimizer.firebase.signOut();
      
      // Clear user data
      this.userProfile = null;
      localStorage.removeItem('loopOptimizer.user');
      
      // Update UI
      this.handleAuthStateChange(false);
    } catch (error) {
      console.error('Logout error:', error);
      alert('Logout failed: ' + error.message);
    }
  }
  
  /**
   * Handle authentication state change
   * @param {boolean} isLoggedIn - Whether user is logged in
   */
  handleAuthStateChange(isLoggedIn) {
    this.isLoggedIn = isLoggedIn;
    
    if (isLoggedIn && this.userProfile) {
      // Update header
      this.loginBtn.classList.add('hidden');
      this.userProfileElem.classList.remove('hidden');
      this.usernameElem.textContent = this.userProfile.displayName || 'User';
      
      // Update gallery view
      if (this.currentView === 'gallery') {
        this.loadGallery();
      }
      
      // Update settings view
      this.accountLoginPrompt.classList.add('hidden');
      this.accountSettings.classList.remove('hidden');
      this.displayNameInput.value = this.userProfile.displayName || '';
      this.emailInput.value = this.userProfile.email || '';
      
      // Update save button in result view
      if (this.saveToAccountBtn) {
        this.saveToAccountBtn.textContent = 'Save to Account';
      }
    } else {
      // Update header
      this.loginBtn.classList.remove('hidden');
      this.userProfileElem.classList.add('hidden');
      
      // Update gallery view
      if (this.currentView === 'gallery') {
        this.loginPrompt.classList.remove('hidden');
        this.loopsGrid.classList.add('hidden');
      }
      
      // Update settings view
      this.accountLoginPrompt.classList.remove('hidden');
      this.accountSettings.classList.add('hidden');
      
      // Update save button in result view
      if (this.saveToAccountBtn) {
        this.saveToAccountBtn.textContent = 'Log In to Save';
      }
    }
  }
  
  /**
   * Open login modal
   */
  openLoginModal() {
    this.loginModal.classList.remove('hidden');
  }
  
  /**
   * Show processing modal
   */
  showProcessingModal() {
    this.processingModal.classList.remove('hidden');
  }
  
  /**
   * Close all modals
   */
  closeAllModals() {
    this.loginModal.classList.add('hidden');
    this.processingModal.classList.add('hidden');
  }
  
  /**
   * Switch between login and signup tabs
   * @param {string} tab - Tab name
   */
  switchAuthTab(tab) {
    this.authTabs.forEach(t => {
      t.classList.toggle('active', t.getAttribute('data-tab') === tab);
    });
    
    this.authForms.forEach(form => {
      form.classList.toggle('active', form.id === `${tab}Tab`);
    });
  }
  
  /**
   * Reset UI to initial state
   */
  resetUI() {
    // Clear file selection
    this.currentFile = null;
    this.uploadArea.innerHTML = `
      <div class="upload-icon">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 4V16M12 4L8 8M12 4L16 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M4 20H20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <p>Drag and drop your media file here<br>or <span class="link">browse files</span></p>
      <p class="upload-hint">Supports MP4, WebM, MOV, GIF, MP3, WAV up to 100MB</p>
    `;
    
    // Reset file input
    this.mediaFileInput.value = '';
    
    // Hide result card
    this.resultCard.classList.add('hidden');
    
    // Clean up any object URLs
    if (this.currentResult && this.currentResult.optimizedLoop.url) {
      URL.revokeObjectURL(this.currentResult.optimizedLoop.url);
    }
    
    this.currentResult = null;
  }
  
  /**
   * Get selected quality from radio buttons
   * @returns {string} - Selected quality
   */
  getSelectedQuality() {
    for (const input of this.qualityInputs) {
      if (input.checked) {
        return input.value;
      }
    }
    return 'medium'; // Default
  }
  
  /**
   * Format file size for display
   * @param {number} bytes - Size in bytes
   * @returns {string} - Formatted size
   */
  formatFileSize(bytes) {
    if (bytes < 1024) {
      return bytes + ' B';
    } else if (bytes < 1024 * 1024) {
      return (bytes / 1024).toFixed(1) + ' KB';
    } else if (bytes < 1024 * 1024 * 1024) {
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    } else {
      return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
    }
  }
  
  /**
   * Format time in seconds to MM:SS.ms format
   * @param {number} seconds - Time in seconds
   * @returns {string} - Formatted time
   */
  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toFixed(2).padStart(5, '0')}`;
  }
  
  /**
   * Capitalize first letter of a string
   * @param {string} str - Input string
   * @returns {string} - Capitalized string
   */
  capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new LoopOptimizerUI();
});