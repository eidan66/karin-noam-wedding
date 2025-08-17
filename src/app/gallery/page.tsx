"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { WeddingMedia } from "@/Entities/WeddingMedia";
import type { WeddingMediaItem } from "@/Entities/WeddingMedia";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, Heart, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { createPageUrl } from "@/utils";
import MediaGrid from "@/components/gallery/MediaGrid";
import MediaViewer from "@/components/gallery/MediaViewer";
import FilterTabs from "@/components/gallery/FilterTabs";
import GalleryHeader from "@/components/gallery/GalleryHeader";
import MediaSkeleton from "@/components/gallery/MediaSkeleton";

const ITEMS_PER_PAGE = 20;

export default function GalleryPage() {
  const [media, setMedia] = useState<WeddingMediaItem[]>([]);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState<WeddingMediaItem | null>(null);
  const [activeFilter, setActiveFilter] = useState<"all" | "photo" | "video">("all");
  const [viewerIndex, setViewerIndex] = useState(0);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [totals, setTotals] = useState<{ all?: number; photos?: number; videos?: number }>({});

  const loader = useRef<HTMLDivElement | null>(null);

  const fetchMedia = useCallback(async (pageToLoad: number) => {
    if (pageToLoad === 1) {
      setIsLoadingInitial(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const data = await WeddingMedia.list("-created_date", pageToLoad, ITEMS_PER_PAGE);

      const mappedMedia: WeddingMediaItem[] = data.items.map(item => ({
        id: item.id,
        media_url: item.url,
        media_type: (item.type === 'image' ? 'photo' : 'video') as 'photo' | 'video',
        title: item.title || '',
        uploader_name: item.uploader_name || 'אורח אנונימי',
        created_date: item.created_date || new Date().toISOString(),
        thumbnail_url: item.thumbnail_url,
      }));

      if (pageToLoad === 1) {
        setMedia(mappedMedia);
      } else {
        setMedia(prevMedia => [...prevMedia, ...mappedMedia]);
      }

      // Prefer server hasMore; fallback: if page returned a full page, assume more
      const anyData = data as unknown as { hasMore?: boolean };
      const more = typeof anyData.hasMore === 'boolean' ? anyData.hasMore : (mappedMedia.length === ITEMS_PER_PAGE);
      setHasMore(more);
      setPage(pageToLoad);

    } catch (error) {
      console.error("Error loading media:", error);
      setHasMore(false);
    }

    setIsLoadingInitial(false);
    setIsLoadingMore(false);
  }, []);

  useEffect(() => {
    fetchMedia(1);
    // Fetch total counts independently
    Promise.all([
      fetch('/api/media/count').then(r=>r.json()).catch(()=>({})),
      fetch('/api/media/count?type=photo').then(r=>r.json()).catch(()=>({})),
      fetch('/api/media/count?type=video').then(r=>r.json()).catch(()=>({})),
    ]).then(([all, photos, videos]) => {
      if (typeof all.total === 'number') setTotalCount(all.total);
      setTotals({
        all: typeof all.total === 'number' ? all.total : undefined,
        photos: typeof photos.total === 'number' ? photos.total : undefined,
        videos: typeof videos.total === 'number' ? videos.total : undefined,
      });
    });
  }, [fetchMedia]);



  useEffect(() => {
    const options = { root: null, rootMargin: "20px", threshold: 1.0 };
    const observer = new IntersectionObserver((entries) => {
      const target = entries[0];
      if (target && target.isIntersecting && hasMore && !isLoadingInitial && !isLoadingMore) {
        fetchMedia(page + 1);
      }
    }, options);

    if (loader.current) observer.observe(loader.current);
    return () => observer.disconnect();
  }, [hasMore, isLoadingInitial, isLoadingMore, page, fetchMedia]);

  const openViewer = (mediaItem: WeddingMediaItem) => {
    setSelectedMedia(mediaItem);
    setViewerIndex(media.findIndex(item => item.id === mediaItem.id));
  };

  const closeViewer = () => {
    setSelectedMedia(null);
    setViewerIndex(0);
  };

  const navigateViewer = (direction: "next" | "prev") => {
    if (!selectedMedia) return;
    const currentIndex = media.findIndex(item => item.id === selectedMedia.id);
    const newIndex = direction === "next" ? (currentIndex === media.length - 1 ? 0 : currentIndex + 1) : (currentIndex === 0 ? media.length - 1 : currentIndex - 1);
    setSelectedMedia(media[newIndex]);
    setViewerIndex(newIndex);
  };

  const filteredMedia = activeFilter === "all" 
    ? media 
    : media.filter(item => item.media_type === activeFilter);

  return (
    <div className="min-h-screen wedding-gradient">
      <div className="max-w-7xl mx-auto px-4 py-8 pb-24 md:pb-8">
        <GalleryHeader 
          mediaCount={totalCount ?? media.length} 
        />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <FilterTabs 
            activeFilter={activeFilter} 
            onFilterChange={setActiveFilter}
            media={media}
            totalAll={totals.all}
            totalPhotos={totals.photos}
            totalVideos={totals.videos}
          />
          
          <Link href={createPageUrl("Upload")}>
            <Button className="hidden sm:inline-flex bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 group">
              <Plus className="w-4 h-4 ml-2 group-hover:rotate-90 transition-transform duration-300" />
              שתפו את הזיכרון שלכם
            </Button>
          </Link>
        </div>



        <AnimatePresence mode="wait">
          {isLoadingInitial ? (
            <MediaSkeleton />
          ) : filteredMedia.length > 0 ? (
            <MediaGrid 
              media={filteredMedia} 
              onMediaClick={openViewer}
            />
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-0"
            >
              <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-gold-100 to-cream-100 rounded-full flex items-center justify-center">
                <Heart className="w-16 h-16 text-gold-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">
                {activeFilter === "all" ? "אין זכרונות עדיין" : `אין ${activeFilter === "photo" ? "תמונות" : "סרטונים"} עדיין`}
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                היו הראשונים לשתף זיכרון יפה מהיום המיוחד הזה!
              </p>
              <Link href={createPageUrl("Upload")}>
                <Button className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white">
                  שתפו את הזיכרון הראשון
                </Button>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        {isLoadingMore && (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          </div>
        )}

        {hasMore && !isLoadingInitial && !isLoadingMore && filteredMedia.length > 0 && (
          <div ref={loader} className="h-1"></div>
        )}
      </div>

      <MediaViewer
        isOpen={!!selectedMedia}
        onClose={closeViewer}
        media={selectedMedia}
        onNavigate={navigateViewer}
        currentIndex={viewerIndex}
        totalCount={media.length}
      />
    </div>
  );
}