import React, { useEffect, useState, useRef } from 'react';
import { VideoOff, AlertCircle, RefreshCw } from 'lucide-react';

interface VideoFeedProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  isCamOn: boolean;
}

const VideoFeed: React.FC<VideoFeedProps> = ({ videoRef, isCamOn }) => {
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    setError(null);
    
    // Cleanup any existing stream first
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError("Camera access is not supported in this browser.");
      return;
    }

    try {
      let stream: MediaStream;
      
      // Try HD first
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 1280 }, 
            height: { ideal: 720 },
            aspectRatio: 16 / 9
          } 
        });
      } catch (err) {
        console.warn("HD constraints failed, retrying with default settings", err);
        // Fallback to basic video
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }

      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Ensure playback starts
        await videoRef.current.play().catch(e => console.error("Video play error:", e));
      }
    } catch (err: any) {
      console.error("Error accessing camera:", err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError("Permission denied. Please allow camera access in your browser settings.");
      } else if (err.name === 'NotReadableError') {
        setError("Camera is in use by another application.");
      } else if (err.name === 'OverconstrainedError') {
        setError("No camera found matching the requirements.");
      } else {
        setError("Could not access camera. " + (err.message || ""));
      }
    }
  };

  useEffect(() => {
    if (isCamOn) {
      startCamera();
    } else {
      // Cleanup when toggled off
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setError(null);
    }

    return () => {
      // Cleanup on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCamOn]); 

  return (
    <div className="w-full h-full bg-black relative flex items-center justify-center">
      {isCamOn && !error ? (
        <video 
          ref={videoRef}
          autoPlay 
          playsInline 
          muted 
          className="w-full h-full object-cover transform -scale-x-100" 
        />
      ) : (
        <div className="flex flex-col items-center gap-4 text-slate-500 p-6 text-center">
          {error ? (
            <>
              <AlertCircle size={48} className="text-red-500" />
              <p className="text-red-400 max-w-xs">{error}</p>
              <button 
                onClick={startCamera}
                className="mt-2 flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors"
              >
                <RefreshCw size={16} />
                Try Again
              </button>
            </>
          ) : (
            <>
              <VideoOff size={48} />
              <p>Camera is turned off</p>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default VideoFeed;