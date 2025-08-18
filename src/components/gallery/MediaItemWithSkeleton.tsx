"use client";
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { User } from 'lucide-react';
import type { WeddingMediaItem } from '@/Entities/WeddingMedia';
import VideoPreview from './VideoPreview';

interface MediaItemWithSkeletonProps {
  item: WeddingMediaItem;
  index: number;
  onMediaClick: (item: WeddingMediaItem) => void;
}

export default function MediaItemWithSkeleton({ item, index, onMediaClick }: MediaItemWithSkeletonProps) {
  const [showSkeleton, setShowSkeleton] = useState(true);

  // Simple approach: show skeleton for a short time, then show media
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSkeleton(false);
    }, 500); // Show skeleton for 500ms then show media
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      key={`${item.id}-${index}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="break-inside-avoid group cursor-pointer"
      onClick={() => onMediaClick(item)}
    >
      <div className="relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 glass-effect border border-gold-200 group-hover:border-emerald-300">
        {/* Media Content */}
        <div className="relative">
          <AnimatePresence mode="wait">
            {showSkeleton ? (
              // Skeleton
              <motion.div
                key="skeleton"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full bg-gradient-to-br from-gold-100 to-cream-100 animate-pulse"
                style={{ height: `${200 + (index % 3) * 50}px` }}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-gold-300 border-t-transparent rounded-full animate-spin" />
                </div>
              </motion.div>
            ) : (
              // Actual Media
              <motion.div
                key="media"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {item.media_type === 'photo' ? (
                  <Image
                    src={item.media_url}
                    alt={item.title || "Wedding memory"}
                    width={500}
                    height={500}
                    className="w-full h-auto object-cover group-hover:scale-110 transition-transform duration-700"
                    loading="eager"
                    decoding="async"
                  />
                ) : (
                  <VideoPreview
                    mp4Url={item.media_url}
                    posterUrl={item.thumbnail_url || ""}
                    className="w-full h-auto object-cover group-hover:scale-110 transition-transform duration-700"
                    onError={() => {
                      console.warn('Video failed to load in MediaGrid');
                    }}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        {/* Content Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          {item.title && (
            <p className="font-medium mb-2 text-sm leading-relaxed">
              {item.title}
            </p>
          )}
          {item.uploader_name && (
            <div className="flex items-center gap-2 text-xs opacity-90">
              <User className="w-3 h-3" />
              <span>על ידי {item.uploader_name}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
