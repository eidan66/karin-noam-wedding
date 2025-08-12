"use client";
import { useState, useEffect } from "react";
import { Video, Play } from "lucide-react";
import VideoPlaceholder from "./VideoPlaceholder";

interface VideoPreviewProps {
  src: string;
  thumbnailUrl?: string;
  className?: string;
  onError?: () => void;
}

export default function VideoPreview({ 
  src, 
  thumbnailUrl, 
  className = "", 
  onError 
}: VideoPreviewProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    // Reset states when src changes
    setHasError(false);
    setIsLoading(true);
    setShowFallback(false);
  }, [src]);

  const handleVideoLoad = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    setIsLoading(false);
    
    // Try to show first frame
    if (video.readyState >= 2) {
      video.currentTime = 0.1;
    }
  };

  const handleVideoError = () => {
    setHasError(true);
    setIsLoading(false);
    setShowFallback(true);
    // Don't call onError to avoid console spam - just show fallback
  };

  const handleVideoCanPlay = () => {
    setIsLoading(false);
  };

  // If we have a thumbnail, show it with a play button overlay
  if (thumbnailUrl && !hasError) {
    return (
      <div className={`relative ${className}`}>
        <img
          src={thumbnailUrl}
          alt="Video thumbnail"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
          <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
            <Play className="w-8 h-8 text-emerald-600 ml-1" />
          </div>
        </div>
      </div>
    );
  }

  // If no thumbnail or error, show video with fallback
  return (
    <div className={`relative ${className}`}>
      {!showFallback && (
        <video
          src={src}
          preload="metadata"
          playsInline
          autoPlay
          muted
          loop
          className="w-full h-full object-cover"
          onLoadStart={() => setIsLoading(true)}
          onLoadedData={handleVideoLoad}
          onCanPlay={handleVideoCanPlay}
          onError={handleVideoError}
        />
      )}
      
      {/* Loading state */}
      {isLoading && !showFallback && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      
      {/* Fallback when video fails to load */}
      {showFallback && (
        <VideoPlaceholder className="w-full h-full" />
      )}
      
      {/* Play button overlay */}
      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
        <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
          <Play className="w-8 h-8 text-emerald-600 ml-1" />
        </div>
      </div>
    </div>
  );
}
