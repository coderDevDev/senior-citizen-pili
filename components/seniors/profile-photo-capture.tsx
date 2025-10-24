'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Camera, RotateCw, Check, X, Loader2, AlertCircle, User } from 'lucide-react';
import { toast } from 'sonner';

interface ProfilePhotoCaptureProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageData: string) => void;
  title?: string;
  description?: string;
}

interface CaptureQuality {
  brightness: number;
  sharpness: number;
  hasFace: boolean;
  faceSize: 'too_small' | 'too_large' | 'good' | 'none';
}

export function ProfilePhotoCapture({
  isOpen,
  onClose,
  onCapture,
  title = 'Capture Profile Photo',
  description = 'Position your face in the center of the frame'
}: ProfilePhotoCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number>();

  const [isCameraReady, setIsCameraReady] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user'); // Default to front camera
  const [countdown, setCountdown] = useState<number | null>(null);
  const [quality, setQuality] = useState<CaptureQuality>({
    brightness: 0,
    sharpness: 0,
    hasFace: false,
    faceSize: 'none'
  });

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

  // Analyze image quality
  const analyzeImageQuality = useCallback((): CaptureQuality => {
    if (!videoRef.current || !canvasRef.current) {
      return { brightness: 0, sharpness: 0, hasFace: false, faceSize: 'none' };
    }

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return { brightness: 0, sharpness: 0, hasFace: false, faceSize: 'none' };
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
      const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
      totalBrightness += avg;
    }
    const brightness = totalBrightness / (data.length / 4);

    // Calculate sharpness (simplified Laplacian)
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

    // Simple face detection (check for face-like features in center)
    const centerX = Math.floor(width / 2);
    const centerY = Math.floor(height / 2);
    const faceRegionSize = Math.min(width, height) * 0.3;
    
    let hasFace = false;
    let faceSize: 'too_small' | 'too_large' | 'good' | 'none' = 'none';

    // Check if there's significant contrast in the center (indicating a face)
    if (brightness > 80 && brightness < 200 && sharpness > 5) {
      hasFace = true;
      
      // Estimate face size based on edge density in center region
      if (faceRegionSize < width * 0.2) {
        faceSize = 'too_small';
      } else if (faceRegionSize > width * 0.6) {
        faceSize = 'too_large';
      } else {
        faceSize = 'good';
      }
    }

    return {
      brightness: Math.round(brightness),
      sharpness: Math.round(sharpness),
      hasFace,
      faceSize
    };
  }, []);

  // Start quality detection loop
  const startQualityDetection = useCallback(() => {
    const detectQuality = () => {
      if (!videoRef.current || !canvasRef.current) return;
      
      const newQuality = analyzeImageQuality();
      setQuality(newQuality);

      animationFrameRef.current = requestAnimationFrame(detectQuality);
    };

    detectQuality();
  }, [analyzeImageQuality]);

  // Handle capture
  const handleCapture = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || isCapturing) return;

    setIsCapturing(true);

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      setIsCapturing(false);
      return;
    }

    // Set canvas size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get image data
    const imageData = canvas.toDataURL('image/jpeg', 0.95);
    setCapturedImage(imageData);
    setIsCapturing(false);

    toast.success('📸 Photo captured!', {
      description: 'Review your photo and confirm or retake.'
    });
  }, [isCapturing]);

  // Handle confirm
  const handleConfirm = useCallback(() => {
    if (capturedImage) {
      onCapture(capturedImage);
      stopCamera();
      onClose();
      toast.success('✅ Profile photo saved!');
    }
  }, [capturedImage, onCapture, stopCamera, onClose]);

  // Handle retake
  const handleRetake = useCallback(() => {
    setCapturedImage(null);
    setIsCapturing(false);
    startQualityDetection();
  }, [startQualityDetection]);

  // Handle switch camera
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
      <DialogContent className="max-w-[100vw] sm:max-w-4xl max-h-[100vh] p-0 overflow-hidden m-0 sm:mx-auto flex flex-col">
        <DialogHeader className="p-3 sm:p-6 pb-2 sm:pb-4 flex-shrink-0">
          <DialogTitle className="text-base sm:text-xl font-bold">{title}</DialogTitle>
          <p className="text-[10px] sm:text-sm text-gray-600">{description}</p>
        </DialogHeader>

        <div className="relative bg-black w-full flex-1 min-h-0 overflow-hidden">
          {/* Video Preview */}
          {!capturedImage && (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ maxHeight: 'calc(100vh - 250px)' }}
              />

              {/* Face Oval Overlay */}
              {isCameraReady && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-4">
                  {/* Oval Face Guide */}
                  <div className="relative w-[60%] sm:w-[50%] max-w-sm aspect-[3/4]">
                    {/* Oval border */}
                    <div className={`absolute inset-0 border-4 rounded-[50%] transition-colors duration-300 ${
                      quality.hasFace && quality.faceSize === 'good'
                        ? 'border-green-500'
                        : quality.hasFace
                        ? 'border-yellow-500'
                        : 'border-white'
                    }`}>
                      {/* Corner guides for oval */}
                      <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-8 h-8 border-t-4 border-white rounded-t-full" />
                      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-8 h-8 border-b-4 border-white rounded-b-full" />
                      <div className="absolute top-1/2 -left-1 transform -translate-y-1/2 w-8 h-8 border-l-4 border-white rounded-l-full" />
                      <div className="absolute top-1/2 -right-1 transform -translate-y-1/2 w-8 h-8 border-r-4 border-white rounded-r-full" />
                    </div>

                    {/* Center instruction */}
                    <div className="absolute -bottom-10 sm:-bottom-16 left-1/2 transform -translate-x-1/2 text-center w-full px-2">
                      <p className="text-white text-[10px] sm:text-sm font-medium bg-black/80 px-2 sm:px-4 py-1 sm:py-2 rounded-full inline-block max-w-full whitespace-nowrap">
                        {!quality.hasFace && 'Position your face in the oval'}
                        {quality.hasFace && quality.faceSize === 'too_small' && 'Move closer'}
                        {quality.hasFace && quality.faceSize === 'too_large' && 'Move back'}
                        {quality.hasFace && quality.faceSize === 'good' && 'Perfect! Ready to capture'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Quality Indicators */}
              {isCameraReady && (
                <div className="absolute top-2 sm:top-4 left-2 sm:left-4 space-y-0.5 sm:space-y-2 max-w-[45%] sm:max-w-none z-10">
                  <div className={`flex items-center gap-1 sm:gap-2 px-1.5 sm:px-3 py-0.5 sm:py-1.5 rounded-full text-[9px] sm:text-xs font-medium ${
                    quality.brightness > 100 && quality.brightness < 180
                      ? 'bg-green-500/90 text-white'
                      : 'bg-red-500/90 text-white'
                  }`}>
                    <div className="w-1 h-1 sm:w-2 sm:h-2 rounded-full bg-white flex-shrink-0" />
                    <span className="hidden sm:inline">Brightness: {quality.brightness > 100 && quality.brightness < 180 ? 'Good' : 'Poor'}</span>
                    <span className="sm:hidden truncate">{quality.brightness > 100 && quality.brightness < 180 ? '✓ Light' : '✗ Light'}</span>
                  </div>
                  <div className={`flex items-center gap-1 sm:gap-2 px-1.5 sm:px-3 py-0.5 sm:py-1.5 rounded-full text-[9px] sm:text-xs font-medium ${
                    quality.sharpness > 10
                      ? 'bg-green-500/90 text-white'
                      : 'bg-red-500/90 text-white'
                  }`}>
                    <div className="w-1 h-1 sm:w-2 sm:h-2 rounded-full bg-white flex-shrink-0" />
                    <span className="hidden sm:inline">Focus: {quality.sharpness > 10 ? 'Sharp' : 'Blurry'}</span>
                    <span className="sm:hidden truncate">{quality.sharpness > 10 ? '✓ Focus' : '✗ Focus'}</span>
                  </div>
                  <div className={`flex items-center gap-1 sm:gap-2 px-1.5 sm:px-3 py-0.5 sm:py-1.5 rounded-full text-[9px] sm:text-xs font-medium ${
                    quality.hasFace && quality.faceSize === 'good'
                      ? 'bg-green-500/90 text-white'
                      : quality.hasFace
                      ? 'bg-yellow-500/90 text-white'
                      : 'bg-red-500/90 text-white'
                  }`}>
                    <User className="w-2 h-2 sm:w-3 sm:h-3 flex-shrink-0" />
                    <span className="hidden sm:inline">Face: {quality.hasFace ? (quality.faceSize === 'good' ? 'Perfect ✓' : 'Adjust') : 'Not Found'}</span>
                    <span className="sm:hidden truncate">{quality.hasFace ? (quality.faceSize === 'good' ? '✓ Face' : '⚠ Face') : '✗ Face'}</span>
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
              alt="Captured profile"
              className="w-full h-full object-contain"
            />
          )}

          {/* Hidden canvas for processing */}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Controls */}
        <div className="p-2 sm:p-6 space-y-2 sm:space-y-4 flex-shrink-0 max-h-[40vh] sm:max-h-none overflow-y-auto">
          {!capturedImage ? (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-4">
              <div className="flex gap-1.5 sm:gap-2 order-1 sm:order-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSwitchCamera}
                  disabled={!isCameraReady}
                  className="flex-1 sm:flex-none h-9 sm:h-10 text-xs sm:text-sm px-2 sm:px-4">
                  <RotateCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Switch Camera</span>
                  <span className="sm:hidden">Switch</span>
                </Button>

                <Button
                  type="button"
                  onClick={handleCapture}
                  disabled={!isCameraReady || isCapturing}
                  className="bg-[#ffd416] hover:bg-[#ffd417] text-white flex-1 sm:flex-none h-9 sm:h-10 text-xs sm:text-sm px-2 sm:px-4">
                  <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Capture</span>
                  <span className="sm:hidden">Take</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 sm:flex-none h-9 sm:h-10 text-xs sm:text-sm px-2 sm:px-4">
                  <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-2" />
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
                className="w-full sm:w-auto h-9 sm:h-10 text-xs sm:text-sm">
                <RotateCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2" />
                Retake
              </Button>

              <Button
                type="button"
                onClick={handleConfirm}
                className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto h-9 sm:h-10 text-xs sm:text-sm">
                <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2" />
                Use This Photo
              </Button>
            </div>
          )}

          {/* Tips - Collapsible on mobile */}
          <details className="bg-blue-50 border border-blue-200 rounded-lg group">
            <summary className="p-2 sm:p-4 cursor-pointer flex items-center gap-2 text-xs sm:text-sm font-medium text-blue-800">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
              <span>Tips for best results</span>
              <span className="ml-auto text-blue-600 group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="px-2 pb-2 sm:px-4 sm:pb-4">
              <ul className="text-[10px] sm:text-xs text-blue-800 space-y-0.5 sm:space-y-1 ml-6 sm:ml-8 list-disc">
                <li>Ensure good lighting on your face</li>
                <li>Remove glasses and face coverings</li>
                <li>Look directly at the camera</li>
                <li>Keep a neutral expression</li>
                <li>Position your face in the oval guide</li>
              </ul>
            </div>
          </details>
        </div>
      </DialogContent>
    </Dialog>
  );
}
