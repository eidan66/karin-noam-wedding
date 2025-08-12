"use client";
import { useState, useEffect, useRef } from "react";
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
  const [isReady, setIsReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const isIOS = typeof navigator !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent);

  useEffect(() => {
    setHasError(false);
    setIsLoading(!isMobile());
    setShowFallback(false);
    setPosterVisible(true);
    setIsReady(false);
  }, [mp4Url]);

  // Failsafe: if events never fire on iOS, hide overlay after a short delay
  useEffect(() => {
    if (isReady) return;
    const t = setTimeout(() => setIsReady(true), 3000);
    return () => clearTimeout(t);
  }, [isReady, mp4Url, posterUrl]);

  // Optional: log video element errors to help diagnose
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onErr = () => {
      const err = v.error;
      console.debug("video error", err?.code, err?.message, { readyState: v.readyState, networkState: v.networkState, src: v.currentSrc });
    };
    v.addEventListener("error", onErr);
    return () => v.removeEventListener("error", onErr);
  }, []);

  const handleVideoError = () => {
    setHasError(true);
    setIsLoading(false);
    setShowFallback(!posterUrl);
    onError?.();
  };

  const handleCanPlay = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    setIsLoading(false);
    setIsReady(true);
    const v = e.currentTarget;
    if (v.readyState >= 2) {
      try { v.currentTime = 0.001; } catch {}
    }
    // Once playable, we can hide the poster overlay
    setPosterVisible(false);
  };

  return (
    <div className={`relative aspect-video ${className}`}>
      {/* If video failed but we have a poster, show the poster explicitly */}
      {hasError && posterUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={posterUrl}
          alt="Video poster"
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {!showFallback && (
        <video
          ref={videoRef}
          playsInline
          {...({ 'webkit-playsinline': 'true' } as Record<string, string>)}
          muted
          loop
          autoPlay
          preload={isIOS ? "metadata" : "auto"}
          poster={posterUrl}
          crossOrigin="anonymous"
          disableRemotePlayback
          controls={false}
          className="absolute inset-0 h-full w-full object-cover"
          onLoadStart={() => !isMobile() && setIsLoading(true)}
          onCanPlay={handleCanPlay}
          onError={handleVideoError}
        >
          {/* Prefer MP4 first for iOS; keep generic type for broad compatibility */}
          <source src={mp4Url} type="video/mp4" />
          {!isIOS && webmUrl && <source src={webmUrl} type="video/webm" />}
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

      {/* Overlay (play circle) while loading / showing poster / not yet ready */}
      {(!showFallback && (isLoading || posterVisible || !isReady || (hasError && !!posterUrl))) && (
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
          <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
            <Play className="w-8 h-8 text-emerald-600 ml-1" />
          </div>
        </div>
      )}
    </div>
  );
}
