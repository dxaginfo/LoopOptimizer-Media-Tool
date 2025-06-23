// firebase-manager.js - Firebase integration module

import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

/**
 * Manages Firebase integration for the LoopOptimizer
 * Handles authentication, storage, and database operations
 */
export class FirebaseManager {
  /**
   * Create a new FirebaseManager instance
   * @param {Object} config - Firebase configuration object
   */
  constructor(config) {
    this.config = config;
  }
  
  /**
   * Initialize Firebase services
   * @returns {Promise<void>}
   */
  async initialize() {
    this.app = initializeApp(this.config);
    this.auth = getAuth(this.app);
    this.db = getFirestore(this.app);
    this.storage = getStorage(this.app);
    
    // Use anonymous auth by default
    await signInAnonymously(this.auth);
  }
  
  /**
   * Store loop results in Firebase
   * @param {Object} media - Media file and metadata
   * @param {Object} metadata - Quality metrics and loop information
   * @returns {Promise<Object>} Storage reference information
   */
  async storeResults(media, metadata) {
    // Create a reference to the media file
    const storageRef = ref(this.storage, `loops/${Date.now()}_${media.name}`);
    
    // Upload the media file
    const snapshot = await uploadBytes(storageRef, media.data);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    // Store metadata in Firestore
    const docRef = await addDoc(collection(this.db, 'loops'), {
      url: downloadURL,
      metadata: metadata,
      createdAt: new Date(),
      userId: this.auth.currentUser?.uid || 'anonymous'
    });
    
    return {
      id: docRef.id,
      url: downloadURL
    };
  }
  
  /**
   * Retrieve stored loops, optionally filtered by userId
   * @param {string|null} userId - Optional user ID to filter by
   * @returns {Promise<Array>} Array of loop records
   */
  async getStoredLoops(userId = null) {
    const loopsRef = collection(this.db, 'loops');
    const q = userId 
      ? query(loopsRef, where('userId', '==', userId))
      : loopsRef;
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }
}