"use client";
import { useState, useEffect } from "react";
import { Play } from "lucide-react";
import VideoPlaceholder from "./VideoPlaceholder";
import { isMobile } from "@/utils";

interface VideoPreviewProps {
  mp4Url: string;
  webmUrl?: string;
  posterUrl: string;
  className?: string;
  onError?: () => void;
}

export default function VideoPreview({ 
  mp4Url, 
  webmUrl, 
  posterUrl, 
  className = "", 
  onError 
}: VideoPreviewProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(!isMobile());
  const [showFallback, setShowFallback] = useState(false);
  const [posterVisible, setPosterVisible] = useState(true);

  const isIOS = typeof navigator !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent);

  useEffect(() => {
    setHasError(false);
    setIsLoading(!isMobile());
    setShowFallback(false);
    setPosterVisible(true);
  }, [mp4Url]);

  const handleVideoLoad = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    setIsLoading(false);
    if (video.readyState >= 2) {
      video.currentTime = 0;
    }
  };

  const handleVideoError = () => {
    setHasError(true);
    setIsLoading(false);
    // If we have a poster, keep showing it; otherwise show generic fallback
    setShowFallback(!posterUrl);
    onError?.();
  };

  const handleVideoCanPlay = () => {
    setIsLoading(false);
    setPosterVisible(false);
  };

  return (
    <div className={`relative ${className}`}>
      {/* If video failed but we have a poster, show the poster explicitly */}
      {hasError && posterUrl && (
        <img
          src={posterUrl}
          alt="Video poster"
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {!showFallback && (
        <video
          playsInline
          muted
          loop
          autoPlay
          preload="auto"
          poster={posterUrl}
          onLoadedMetadata={(e) => {
            try {
              e.currentTarget.currentTime = 0.01;
            } catch {}
            setPosterVisible(false);
          }}
          className="w-full h-full object-cover"
          onLoadStart={() => !isMobile() && setIsLoading(true)}
          onLoadedData={handleVideoLoad}
          onCanPlay={handleVideoCanPlay}
          onError={handleVideoError}
        >
          {!isIOS && webmUrl && <source src={webmUrl} type="video/webm" />}
          <source src={mp4Url} type="video/mp4" />
        </video>
      )}

      {isLoading && !showFallback && !isMobile() && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {showFallback && (
        <VideoPlaceholder className="w-full h-full" />
      )}

      {/* Overlay (play circle) while loading or while we explicitly show poster */}
      {(!showFallback && (isLoading || posterVisible || (hasError && !!posterUrl))) && (
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
          <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
            <Play className="w-8 h-8 text-emerald-600 ml-1" />
          </div>
        </div>
      )}
    </div>
  );
}
