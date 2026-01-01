import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  Box,
  Button,
  IconButton,
  Dialog,
  DialogContent,
  Typography,
  CircularProgress,
  Stack,
  alpha,
  useTheme,
} from '@mui/material';
import {
  CameraAlt as CameraIcon,
  Cameraswitch as SwitchCameraIcon,
  Close as CloseIcon,
  Check as CheckIcon,
  Replay as RetakeIcon,
  PhotoLibrary as GalleryIcon,
  FlashOn as FlashOnIcon,
  FlashOff as FlashOffIcon,
} from '@mui/icons-material';

export interface CameraCaptureProps {
  open: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
  aspectRatio?: number;
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
}

type FacingMode = 'user' | 'environment';

const CameraCapture: React.FC<CameraCaptureProps> = ({
  open,
  onClose,
  onCapture,
  aspectRatio,
  quality = 0.9,
  maxWidth = 1920,
  maxHeight = 1080,
}) => {
  const theme = useTheme();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<FacingMode>('environment');
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);

  // Check for multiple cameras
  useEffect(() => {
    const checkCameras = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter((d) => d.kind === 'videoinput');
        setHasMultipleCameras(videoDevices.length > 1);
      } catch (err) {
        console.error('Error checking cameras:', err);
      }
    };
    checkCameras();
  }, []);

  // Start camera when dialog opens
  useEffect(() => {
    if (open && !capturedImage) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [open, facingMode]);

  const startCamera = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Stop existing stream first
      stopCamera();

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: maxWidth },
          height: { ideal: maxHeight },
        },
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }

      // Check torch support
      const track = mediaStream.getVideoTracks()[0];
      const capabilities = track.getCapabilities?.();
      if (capabilities && 'torch' in capabilities) {
        setTorchSupported(true);
      }
    } catch (err) {
      console.error('Error starting camera:', err);
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          setError('Camera access denied. Please enable camera permissions.');
        } else if (err.name === 'NotFoundError') {
          setError('No camera found on this device.');
        } else {
          setError('Failed to access camera. Please try again.');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const toggleFlash = async () => {
    if (!stream || !torchSupported) return;

    const track = stream.getVideoTracks()[0];
    const newFlashState = !flashEnabled;

    try {
      await track.applyConstraints({
        advanced: [{ torch: newFlashState } as MediaTrackConstraintSet],
      });
      setFlashEnabled(newFlashState);
    } catch (err) {
      console.error('Error toggling flash:', err);
    }
  };

  const switchCamera = useCallback(() => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Calculate dimensions
    let width = video.videoWidth;
    let height = video.videoHeight;

    if (aspectRatio) {
      const currentRatio = width / height;
      if (currentRatio > aspectRatio) {
        width = height * aspectRatio;
      } else {
        height = width / aspectRatio;
      }
    }

    // Scale down if needed
    if (width > maxWidth) {
      const scale = maxWidth / width;
      width = maxWidth;
      height = height * scale;
    }
    if (height > maxHeight) {
      const scale = maxHeight / height;
      height = maxHeight;
      width = width * scale;
    }

    canvas.width = width;
    canvas.height = height;

    // Draw image (flip horizontally if using front camera)
    if (facingMode === 'user') {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }

    // Center crop if aspect ratio is set
    const sx = aspectRatio ? (video.videoWidth - width) / 2 : 0;
    const sy = aspectRatio ? (video.videoHeight - height) / 2 : 0;

    ctx.drawImage(
      video,
      sx,
      sy,
      width,
      height,
      0,
      0,
      width,
      height
    );

    const dataUrl = canvas.toDataURL('image/jpeg', quality);
    setCapturedImage(dataUrl);
    stopCamera();
  }, [facingMode, aspectRatio, quality, maxWidth, maxHeight]);

  const retake = useCallback(() => {
    setCapturedImage(null);
    startCamera();
  }, []);

  const confirmCapture = useCallback(async () => {
    if (!capturedImage) return;

    // Convert data URL to blob/file
    const response = await fetch(capturedImage);
    const blob = await response.blob();
    const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });

    onCapture(file);
    handleClose();
  }, [capturedImage, onCapture]);

  const handleGallerySelect = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        onCapture(file);
        handleClose();
      }
    },
    [onCapture]
  );

  const handleClose = () => {
    stopCamera();
    setCapturedImage(null);
    setError(null);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullScreen
      PaperProps={{
        sx: {
          bgcolor: 'black',
        },
      }}
    >
      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Hidden canvas for capture */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        {/* Camera/Preview Area */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {isLoading && (
            <CircularProgress size={60} sx={{ color: 'white' }} />
          )}

          {error && (
            <Box sx={{ textAlign: 'center', p: 3 }}>
              <Typography color="error" variant="h6" gutterBottom>
                {error}
              </Typography>
              <Button
                variant="contained"
                onClick={startCamera}
                sx={{ mt: 2 }}
              >
                Retry
              </Button>
            </Box>
          )}

          {!capturedImage && !error && (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: facingMode === 'user' ? 'scaleX(-1)' : 'none',
              }}
            />
          )}

          {capturedImage && (
            <img
              src={capturedImage}
              alt="Captured"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
              }}
            />
          )}

          {/* Close Button */}
          <IconButton
            onClick={handleClose}
            sx={{
              position: 'absolute',
              top: 16,
              right: 16,
              color: 'white',
              bgcolor: alpha(theme.palette.common.black, 0.5),
              '&:hover': {
                bgcolor: alpha(theme.palette.common.black, 0.7),
              },
            }}
          >
            <CloseIcon />
          </IconButton>

          {/* Flash Toggle (only when camera is active) */}
          {!capturedImage && torchSupported && (
            <IconButton
              onClick={toggleFlash}
              sx={{
                position: 'absolute',
                top: 16,
                left: 16,
                color: flashEnabled ? theme.palette.warning.main : 'white',
                bgcolor: alpha(theme.palette.common.black, 0.5),
                '&:hover': {
                  bgcolor: alpha(theme.palette.common.black, 0.7),
                },
              }}
            >
              {flashEnabled ? <FlashOnIcon /> : <FlashOffIcon />}
            </IconButton>
          )}
        </Box>

        {/* Controls */}
        <Box
          sx={{
            bgcolor: 'black',
            px: 3,
            py: 4,
            pb: 6,
          }}
        >
          {!capturedImage ? (
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-around"
            >
              {/* Gallery Button */}
              <IconButton
                onClick={handleGallerySelect}
                sx={{
                  color: 'white',
                  width: 50,
                  height: 50,
                }}
              >
                <GalleryIcon fontSize="large" />
              </IconButton>

              {/* Capture Button */}
              <IconButton
                onClick={capturePhoto}
                disabled={isLoading || !!error}
                sx={{
                  width: 80,
                  height: 80,
                  bgcolor: 'white',
                  border: `4px solid ${alpha(theme.palette.common.white, 0.3)}`,
                  '&:hover': {
                    bgcolor: alpha(theme.palette.common.white, 0.9),
                  },
                  '&:disabled': {
                    bgcolor: alpha(theme.palette.common.white, 0.3),
                  },
                }}
              >
                <CameraIcon fontSize="large" sx={{ color: 'black' }} />
              </IconButton>

              {/* Switch Camera Button */}
              <IconButton
                onClick={switchCamera}
                disabled={!hasMultipleCameras}
                sx={{
                  color: 'white',
                  width: 50,
                  height: 50,
                  opacity: hasMultipleCameras ? 1 : 0.3,
                }}
              >
                <SwitchCameraIcon fontSize="large" />
              </IconButton>
            </Stack>
          ) : (
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="center"
              spacing={6}
            >
              {/* Retake Button */}
              <IconButton
                onClick={retake}
                sx={{
                  color: 'white',
                  width: 60,
                  height: 60,
                  bgcolor: alpha(theme.palette.error.main, 0.8),
                  '&:hover': {
                    bgcolor: theme.palette.error.main,
                  },
                }}
              >
                <RetakeIcon fontSize="large" />
              </IconButton>

              {/* Confirm Button */}
              <IconButton
                onClick={confirmCapture}
                sx={{
                  color: 'white',
                  width: 80,
                  height: 80,
                  bgcolor: theme.palette.success.main,
                  '&:hover': {
                    bgcolor: theme.palette.success.dark,
                  },
                }}
              >
                <CheckIcon sx={{ fontSize: 40 }} />
              </IconButton>
            </Stack>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default CameraCapture;
