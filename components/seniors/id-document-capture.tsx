'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Camera, X, Check, RotateCw, AlertCircle, Loader2, User } from 'lucide-react';
import { toast } from 'sonner';
import { loadFaceDetectionModels, validateIDDocument, getFaceBoundingBox, type IDValidationResult } from '@/lib/utils/face-detection';

interface IDDocumentCaptureProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageData: string) => void;
  title?: string;
  description?: string;
}

interface CaptureQuality {
  brightness: number;
  sharpness: number;
  hasDocument: boolean;
  isAligned: boolean;
  hasFace: boolean;
  faceDetected: boolean;
  faceValidation: IDValidationResult | null;
}

export function IDDocumentCapture({
  isOpen,
  onClose,
  onCapture,
  title = 'Capture Valid ID',
  description = 'Position your ID within the frame'
}: IDDocumentCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);

  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [quality, setQuality] = useState<CaptureQuality>({
    brightness: 0,
    sharpness: 0,
    hasDocument: false,
    isAligned: false,
    hasFace: false,
    faceDetected: false,
    faceValidation: null
  });
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [faceBoundingBox, setFaceBoundingBox] = useState<{x: number, y: number, width: number, height: number} | null>(null);
  const [autoCapture, setAutoCapture] = useState(true);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

  // Load face detection models
  useEffect(() => {
    const loadModels = async () => {
      const loaded = await loadFaceDetectionModels();
      setModelsLoaded(loaded);
      if (loaded) {
        toast.success('✅ Face detection ready', {
          description: 'AI-powered ID validation enabled'
        });
      }
    };
    loadModels();
  }, []);

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      // Check if mediaDevices is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error('❌ Camera not supported', {
          description: 'Your browser does not support camera access.'
        });
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setIsCameraReady(true);
          startQualityDetection();
        };
      }
    } catch (error) {
      console.error('Camera access error:', error);
      toast.error('❌ Unable to access camera', {
        description: 'Please allow camera permissions and try again.'
      });
    }
  }, [facingMode]);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setIsCameraReady(false);
  }, []);

  // Analyze image quality with face detection
  const analyzeImageQuality = useCallback(async (): Promise<CaptureQuality> => {
    if (!videoRef.current || !canvasRef.current) {
      return { 
        brightness: 0, 
        sharpness: 0, 
        hasDocument: false, 
        isAligned: false,
        hasFace: false,
        faceDetected: false,
        faceValidation: null
      };
    }

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return { 
        brightness: 0, 
        sharpness: 0, 
        hasDocument: false, 
        isAligned: false,
        hasFace: false,
        faceDetected: false,
        faceValidation: null
      };
    }

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get image data for analysis
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Calculate brightness
    let totalBrightness = 0;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      totalBrightness += (r + g + b) / 3;
    }
    const brightness = totalBrightness / (data.length / 4);

    // Simple edge detection for sharpness (Laplacian)
    let edgeSum = 0;
    const width = canvas.width;
    const height = canvas.height;
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        const center = data[idx];
        const top = data[((y - 1) * width + x) * 4];
        const bottom = data[((y + 1) * width + x) * 4];
        const left = data[(y * width + (x - 1)) * 4];
        const right = data[(y * width + (x + 1)) * 4];
        
        const laplacian = Math.abs(4 * center - top - bottom - left - right);
        edgeSum += laplacian;
      }
    }
    const sharpness = edgeSum / (width * height);

    // Simple document detection (check for rectangular shape in center)
    const centerX = Math.floor(width / 2);
    const centerY = Math.floor(height / 2);
    const sampleSize = 50;
    
    let hasDocument = false;
    let isAligned = false;

    // Check if there's significant contrast in the center (indicating a document)
    if (brightness > 80 && brightness < 200 && sharpness > 5) {
      hasDocument = true;
      
      // Check alignment (simplified - check if document is roughly centered)
      const centerBrightness = data[(centerY * width + centerX) * 4];
      const edgeBrightness = data[(10 * width + 10) * 4];
      isAligned = Math.abs(centerBrightness - edgeBrightness) > 30;
    }

    // Face detection (if models are loaded)
    let hasFace = false;
    let faceDetected = false;
    let faceValidation: IDValidationResult | null = null;

    if (modelsLoaded && video.videoWidth > 0) {
      try {
        const validation = await validateIDDocument(video);
        faceValidation = validation;
        hasFace = validation.hasFace;
        faceDetected = validation.hasFace;
        
        // Update alignment based on face detection
        if (validation.hasFace && validation.isAligned) {
          isAligned = true;
          hasDocument = true;
        }

        // Get face bounding box for overlay
        if (validation.hasFace) {
          const faceBox = await getFaceBoundingBox(video);
          if (faceBox) {
            setFaceBoundingBox({
              x: faceBox.x,
              y: faceBox.y,
              width: faceBox.width,
              height: faceBox.height
            });
          }
        } else {
          setFaceBoundingBox(null);
        }
      } catch (error) {
        console.error('Face detection error:', error);
      }
    }

    return {
      brightness: Math.round(brightness),
      sharpness: Math.round(sharpness),
      hasDocument,
      isAligned,
      hasFace,
      faceDetected,
      faceValidation
    };
  }, [modelsLoaded]);

  // Start quality detection loop
  const startQualityDetection = useCallback(() => {
    const detectQuality = async () => {
      if (!videoRef.current || !canvasRef.current) return;
      
      const newQuality = await analyzeImageQuality();
      setQuality(newQuality);

      // Auto-capture if quality is good
      if (
        autoCapture &&
        !capturedImage &&
        !isCapturing &&
        newQuality.hasDocument &&
        newQuality.isAligned &&
        newQuality.hasFace &&  // Must have face detected
        newQuality.brightness > 100 &&
        newQuality.brightness < 180 &&
        newQuality.sharpness > 10
      ) {
        // Start countdown
        if (countdown === null) {
          setCountdown(3);
        }
      } else {
        setCountdown(null);
      }

      animationFrameRef.current = requestAnimationFrame(detectQuality);
    };

    detectQuality();
  }, [analyzeImageQuality, autoCapture, capturedImage, isCapturing, countdown]);

  // Countdown effect
  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      handleCapture();
      setCountdown(null);
    }
  }, [countdown]);

  // Capture image
  const handleCapture = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || isCapturing) return;

    setIsCapturing(true);

    try {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Canvas context not available');
      }

      // Set canvas size
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Get image data as base64
      const imageData = canvas.toDataURL('image/jpeg', 0.95);
      setCapturedImage(imageData);

      toast.success('✅ ID captured successfully!');
    } catch (error) {
      console.error('Capture error:', error);
      toast.error('❌ Failed to capture image');
    } finally {
      setIsCapturing(false);
    }
  }, [isCapturing]);

  // Retake photo
  const handleRetake = useCallback(() => {
    setCapturedImage(null);
    setCountdown(null);
  }, []);

  // Confirm and use captured image
  const handleConfirm = useCallback(() => {
    if (capturedImage) {
      onCapture(capturedImage);
      stopCamera();
      onClose();
    }
  }, [capturedImage, onCapture, stopCamera, onClose]);

  // Switch camera
  const handleSwitchCamera = useCallback(() => {
    stopCamera();
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  }, [stopCamera]);

  // Initialize camera when modal opens
  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
      setCapturedImage(null);
      setCountdown(null);
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera]);

  // Re-start camera when facing mode changes
  useEffect(() => {
    if (isOpen && !capturedImage) {
      startCamera();
    }
  }, [facingMode, isOpen, capturedImage, startCamera]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-4xl p-0 overflow-hidden mx-2 sm:mx-auto">
        <DialogHeader className="p-4 sm:p-6 pb-3 sm:pb-4">
          <DialogTitle className="text-lg sm:text-xl font-bold">{title}</DialogTitle>
          <p className="text-xs sm:text-sm text-gray-600">{description}</p>
        </DialogHeader>

        <div className="relative bg-black aspect-video min-h-[300px] sm:min-h-[400px]">
          {/* Video Preview */}
          {!capturedImage && (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* Frame Overlay */}
              {isCameraReady && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  {/* ID Card Frame */}
                  <div className="relative w-[80%] max-w-md aspect-[1.586/1]">
                    {/* Corner Guides */}
                    <div className={`absolute inset-0 border-4 rounded-2xl transition-colors duration-300 ${
                      quality.hasDocument && quality.isAligned
                        ? 'border-green-500'
                        : quality.hasDocument
                        ? 'border-yellow-500'
                        : 'border-white'
                    }`}>
                      {/* Top-left corner */}
                      <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-2xl" />
                      {/* Top-right corner */}
                      <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-2xl" />
                      {/* Bottom-left corner */}
                      <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-2xl" />
                      {/* Bottom-right corner */}
                      <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-2xl" />
                    </div>

                    {/* Center instruction */}
                    <div className="absolute -bottom-12 sm:-bottom-16 left-1/2 transform -translate-x-1/2 text-center w-full px-2">
                      <p className="text-white text-xs sm:text-sm font-medium bg-black/70 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full inline-block max-w-full">
                        {!quality.hasDocument && 'Position ID within frame'}
                        {quality.hasDocument && !quality.isAligned && 'Align ID properly'}
                        {quality.hasDocument && quality.isAligned && countdown === null && 'Hold steady...'}
                        {countdown !== null && `Capturing in ${countdown}...`}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Quality Indicators */}
              {isCameraReady && (
                <div className="absolute top-2 sm:top-4 left-2 sm:left-4 space-y-1 sm:space-y-2 max-w-[90%] sm:max-w-none">
                  <div className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-medium ${
                    quality.brightness > 100 && quality.brightness < 180
                      ? 'bg-green-500/90 text-white'
                      : 'bg-red-500/90 text-white'
                  }`}>
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white" />
                    <span className="hidden sm:inline">Brightness: {quality.brightness > 100 && quality.brightness < 180 ? 'Good' : 'Poor'}</span>
                    <span className="sm:hidden">{quality.brightness > 100 && quality.brightness < 180 ? '✓ Light' : '✗ Light'}</span>
                  </div>
                  <div className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-medium ${
                    quality.sharpness > 10
                      ? 'bg-green-500/90 text-white'
                      : 'bg-red-500/90 text-white'
                  }`}>
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white" />
                    <span className="hidden sm:inline">Focus: {quality.sharpness > 10 ? 'Sharp' : 'Blurry'}</span>
                    <span className="sm:hidden">{quality.sharpness > 10 ? '✓ Focus' : '✗ Focus'}</span>
                  </div>
                  <div className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-medium ${
                    quality.hasDocument
                      ? 'bg-green-500/90 text-white'
                      : 'bg-yellow-500/90 text-white'
                  }`}>
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white" />
                    <span className="hidden sm:inline">Document: {quality.hasDocument ? 'Detected' : 'Not Found'}</span>
                    <span className="sm:hidden">{quality.hasDocument ? '✓ ID' : '✗ ID'}</span>
                  </div>
                  {/* Face Detection Indicator */}
                  {modelsLoaded && (
                    <div className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-medium ${
                      quality.hasFace
                        ? 'bg-green-500/90 text-white'
                        : 'bg-red-500/90 text-white'
                    }`}>
                      <User className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      <span className="hidden sm:inline">Face: {quality.hasFace ? 'Detected ✓' : 'Not Found'}</span>
                      <span className="sm:hidden">{quality.hasFace ? '✓ Face' : '✗ Face'}</span>
                    </div>
                  )}
                  {/* Face Validation Issues */}
                  {quality.faceValidation && quality.faceValidation.issues.length > 0 && (
                    <div className="bg-yellow-500/90 text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-medium max-w-[180px] sm:max-w-[200px] truncate">
                      {quality.faceValidation.issues[0]}
                    </div>
                  )}
                </div>
              )}

              {/* Face Bounding Box Overlay */}
              {isCameraReady && faceBoundingBox && videoRef.current && (
                <div 
                  className="absolute border-2 border-green-400 rounded-lg pointer-events-none"
                  style={{
                    left: `${(faceBoundingBox.x / videoRef.current.videoWidth) * 100}%`,
                    top: `${(faceBoundingBox.y / videoRef.current.videoHeight) * 100}%`,
                    width: `${(faceBoundingBox.width / videoRef.current.videoWidth) * 100}%`,
                    height: `${(faceBoundingBox.height / videoRef.current.videoHeight) * 100}%`,
                  }}>
                  <div className="absolute -top-6 left-0 bg-green-500 text-white px-2 py-0.5 rounded text-xs font-medium">
                    Face {quality.faceValidation?.confidence ? `${Math.round(quality.faceValidation.confidence * 100)}%` : ''}
                  </div>
                </div>
              )}

              {/* Loading Overlay */}
              {!isCameraReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                  <div className="text-center">
                    <Loader2 className="w-12 h-12 text-white animate-spin mx-auto mb-4" />
                    <p className="text-white text-sm">Initializing camera...</p>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Captured Image Preview */}
          {capturedImage && (
            <img
              src={capturedImage}
              alt="Captured ID"
              className="w-full h-full object-contain"
            />
          )}

          {/* Hidden canvas for processing */}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Controls */}
        <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
          {!capturedImage ? (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-2 order-2 sm:order-1">
                <label className="flex items-center gap-2 text-xs sm:text-sm">
                  <input
                    type="checkbox"
                    checked={autoCapture}
                    onChange={(e) => setAutoCapture(e.target.checked)}
                    className="rounded"
                  />
                  Auto-capture
                </label>
              </div>

              <div className="flex gap-2 order-1 sm:order-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSwitchCamera}
                  disabled={!isCameraReady}
                  className="flex-1 sm:flex-none">
                  <RotateCw className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Switch Camera</span>
                  <span className="sm:hidden">Switch</span>
                </Button>

                <Button
                  type="button"
                  onClick={handleCapture}
                  disabled={!isCameraReady || isCapturing}
                  className="bg-[#ffd416] hover:bg-[#ffd417] text-white flex-1 sm:flex-none">
                  <Camera className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Capture</span>
                  <span className="sm:hidden">Take Photo</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 sm:flex-none">
                  <X className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Cancel</span>
                  <span className="sm:hidden">Close</span>
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleRetake}
                className="w-full sm:w-auto">
                <RotateCw className="w-4 h-4 mr-2" />
                Retake
              </Button>

              <Button
                type="button"
                onClick={handleConfirm}
                className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto">
                <Check className="w-4 h-4 mr-2" />
                Use This Photo
              </Button>
            </div>
          )}

          {/* Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
            <div className="flex gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-blue-800 space-y-1">
                <p className="font-medium">Tips for best results:</p>
                <ul className="list-disc list-inside space-y-0.5 ml-2">
                  <li>Ensure good lighting (avoid shadows)</li>
                  <li>Place ID on a dark, plain background</li>
                  <li>Keep ID flat and fully visible</li>
                  <li>Avoid glare and reflections</li>
                  <li>Hold camera steady for sharp focus</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
