"use client";
import type { WeddingMediaItem } from "@/Entities/WeddingMedia";
import MediaItemWithSkeleton from "./MediaItemWithSkeleton";

interface MediaGridProps {
  media: WeddingMediaItem[];
  onMediaClick: (item: WeddingMediaItem) => void;
}

export default function MediaGrid({ media, onMediaClick }: MediaGridProps) {
  return (
    <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
      {media.map((item, index) => (
        <MediaItemWithSkeleton
          key={`${item.id}-${index}`}
          item={item}
          index={index}
          onMediaClick={onMediaClick}
        />
      ))}
    </div>
  );
}