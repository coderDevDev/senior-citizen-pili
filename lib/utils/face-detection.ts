/**
 * Face Detection Utility using face-api.js
 * Used for ID document validation and alignment detection
 */

import * as faceapi from 'face-api.js';

let modelsLoaded = false;

/**
 * Load face-api.js models
 * Models are loaded from CDN or local public folder
 */
export async function loadFaceDetectionModels(): Promise<boolean> {
  if (modelsLoaded) return true;

  try {
    const MODEL_URL = '/models'; // Models should be in public/models folder
    
    // Load required models
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
    ]);

    modelsLoaded = true;
    console.log('✅ Face detection models loaded');
    return true;
  } catch (error) {
    console.error('❌ Failed to load face detection models:', error);
    return false;
  }
}

/**
 * Detect faces in an image or video element
 */
export async function detectFaces(
  input: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
): Promise<faceapi.WithFaceLandmarks<{ detection: faceapi.FaceDetection }, faceapi.FaceLandmarks68>[]> {
  if (!modelsLoaded) {
    await loadFaceDetectionModels();
  }

  try {
    const detections = await faceapi
      .detectAllFaces(input, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks();

    return detections;
  } catch (error) {
    console.error('Face detection error:', error);
    return [];
  }
}

/**
 * Check if image contains a face (for ID validation)
 */
export async function hasFaceInImage(
  input: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
): Promise<boolean> {
  const detections = await detectFaces(input);
  return detections.length > 0;
}

/**
 * Get face bounding box
 */
export interface FaceBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

export async function getFaceBoundingBox(
  input: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
): Promise<FaceBoundingBox | null> {
  const detections = await detectFaces(input);
  
  if (detections.length === 0) return null;

  // Get the first (largest) face
  const detection = detections[0];
  const box = detection.detection.box;

  return {
    x: box.x,
    y: box.y,
    width: box.width,
    height: box.height,
    centerX: box.x + box.width / 2,
    centerY: box.y + box.height / 2
  };
}

/**
 * Check if ID is properly aligned based on face position
 * ID should have face in the left portion (typical ID layout)
 */
export async function checkIDAlignment(
  input: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
): Promise<{
  isAligned: boolean;
  hasFace: boolean;
  facePosition: 'left' | 'center' | 'right' | null;
  confidence: number;
}> {
  const detections = await detectFaces(input);

  if (detections.length === 0) {
    return {
      isAligned: false,
      hasFace: false,
      facePosition: null,
      confidence: 0
    };
  }

  const detection = detections[0];
  const box = detection.detection.box;
  const imageWidth = input instanceof HTMLVideoElement 
    ? input.videoWidth 
    : input.width;

  // Calculate face position relative to image
  const faceCenterX = box.x + box.width / 2;
  const relativePosition = faceCenterX / imageWidth;

  // Determine position
  let facePosition: 'left' | 'center' | 'right';
  if (relativePosition < 0.4) {
    facePosition = 'left';
  } else if (relativePosition > 0.6) {
    facePosition = 'right';
  } else {
    facePosition = 'center';
  }

  // ID cards typically have face on the left side
  const isAligned = facePosition === 'left' || facePosition === 'center';
  
  // Confidence based on detection score
  const confidence = detection.detection.score;

  return {
    isAligned,
    hasFace: true,
    facePosition,
    confidence
  };
}

/**
 * Validate ID document quality
 */
export interface IDValidationResult {
  isValid: boolean;
  hasFace: boolean;
  isAligned: boolean;
  faceSize: 'too_small' | 'good' | 'too_large' | null;
  confidence: number;
  issues: string[];
}

export async function validateIDDocument(
  input: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
): Promise<IDValidationResult> {
  const detections = await detectFaces(input);
  const issues: string[] = [];

  if (detections.length === 0) {
    return {
      isValid: false,
      hasFace: false,
      isAligned: false,
      faceSize: null,
      confidence: 0,
      issues: ['No face detected in image']
    };
  }

  const detection = detections[0];
  const box = detection.detection.box;
  const imageWidth = input instanceof HTMLVideoElement 
    ? input.videoWidth 
    : input.width;
  const imageHeight = input instanceof HTMLVideoElement 
    ? input.videoHeight 
    : input.height;

  // Check face size (should be 10-30% of image width for ID)
  const faceWidthRatio = box.width / imageWidth;
  let faceSize: 'too_small' | 'good' | 'too_large';
  
  if (faceWidthRatio < 0.1) {
    faceSize = 'too_small';
    issues.push('Face too small - move closer');
  } else if (faceWidthRatio > 0.4) {
    faceSize = 'too_large';
    issues.push('Face too large - move back');
  } else {
    faceSize = 'good';
  }

  // Check alignment
  const faceCenterX = box.x + box.width / 2;
  const relativePosition = faceCenterX / imageWidth;
  const isAligned = relativePosition >= 0.2 && relativePosition <= 0.6;

  if (!isAligned) {
    issues.push('ID not properly aligned');
  }

  // Check if face is cut off
  if (box.y < 10 || box.y + box.height > imageHeight - 10) {
    issues.push('Face is cut off - adjust position');
  }

  const isValid = issues.length === 0;
  const confidence = detection.detection.score;

  return {
    isValid,
    hasFace: true,
    isAligned,
    faceSize,
    confidence,
    issues
  };
}

/**
 * Draw face detection overlay on canvas
 */
export function drawFaceDetections(
  canvas: HTMLCanvasElement,
  detections: faceapi.WithFaceLandmarks<{ detection: faceapi.FaceDetection }, faceapi.FaceLandmarks68>[]
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  detections.forEach(detection => {
    const box = detection.detection.box;
    
    // Draw bounding box
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 3;
    ctx.strokeRect(box.x, box.y, box.width, box.height);

    // Draw confidence score
    ctx.fillStyle = '#00ff00';
    ctx.font = '16px Arial';
    ctx.fillText(
      `${Math.round(detection.detection.score * 100)}%`,
      box.x,
      box.y - 5
    );

    // Draw landmarks (optional)
    const landmarks = detection.landmarks.positions;
    ctx.fillStyle = '#ff0000';
    landmarks.forEach(point => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI);
      ctx.fill();
    });
  });
}
