"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { Photo } from "@/app/api/nearby/route";

interface Props {
  photos: Photo[];
  clusterKey: string;
  isExplored: boolean;
  onMarkExplored: () => void;
  onClose: () => void;
}

export default function PhotoCarousel({
  photos,
  isExplored,
  onMarkExplored,
  onClose,
}: Props) {
  const [index, setIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const total = photos.length;
  // index === total means the end "mark as explored" slide
  const isEndSlide = index === total;

  const goNext = useCallback(() => {
    setIndex((i) => Math.min(i + 1, total));
  }, [total]);

  const goPrev = useCallback(() => {
    setIndex((i) => Math.max(i - 1, 0));
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goNext();
      else if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goNext, goPrev, onClose]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (dx < -50) goNext();
    else if (dx > 50) goPrev();
    touchStartX.current = null;
  };

  const photo = isEndSlide ? null : photos[index];

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-zinc-900/90 shrink-0">
        <span className="text-zinc-400 text-sm font-mono">
          {isEndSlide ? `${total} / ${total}` : `${index + 1} / ${total}`}
        </span>
        <div className="flex items-center gap-2">
          {isExplored && (
            <span className="text-green-400 text-xs font-medium">Explored ✓</span>
          )}
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white w-8 h-8 flex items-center justify-center text-2xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {isEndSlide ? (
          /* End slide */
          <div className="flex flex-col items-center gap-6 px-8 text-center">
            <span className="text-6xl">{isExplored ? "✅" : "🏁"}</span>
            <p className="text-white text-xl font-semibold">
              {isExplored
                ? "This location is marked as explored!"
                : `You've seen all ${total} photo${total !== 1 ? "s" : ""} at this location`}
            </p>
            {isExplored ? (
              <span className="text-green-400 text-base">Explored ✓</span>
            ) : (
              <button
                onClick={onMarkExplored}
                className="px-7 py-3 bg-green-600 hover:bg-green-500 active:bg-green-700 text-white rounded-2xl font-semibold text-lg transition-colors shadow-lg"
              >
                Mark as Explored
              </button>
            )}
          </div>
        ) : photo ? (
          /* Photo slide */
          <img
            key={photo.id}
            src={photo.image_url}
            alt={photo.title || "Historical photo"}
            className="max-h-full max-w-full object-contain"
            draggable={false}
          />
        ) : null}

        {/* Prev button */}
        {index > 0 && (
          <button
            onClick={goPrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full w-11 h-11 flex items-center justify-center text-2xl shadow-lg"
            aria-label="Previous"
          >
            ‹
          </button>
        )}

        {/* Next button — hidden on end slide */}
        {!isEndSlide && (
          <button
            onClick={goNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full w-11 h-11 flex items-center justify-center text-2xl shadow-lg"
            aria-label="Next"
          >
            ›
          </button>
        )}
      </div>

      {/* Photo metadata footer */}
      {!isEndSlide && photo && (
        <div className="shrink-0 px-5 py-3 bg-zinc-900 space-y-1">
          {photo.title && (
            <p className="text-white font-medium text-sm leading-snug">{photo.title}</p>
          )}
          {photo.date && (
            <p className="text-zinc-400 text-xs">{photo.date}</p>
          )}
          {photo.text && (
            <p className="text-zinc-400 text-xs leading-relaxed line-clamp-2">{photo.text}</p>
          )}
          {photo.nypl_url && (
            <a
              href={photo.nypl_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 text-xs underline"
            >
              View on NYPL →
            </a>
          )}
        </div>
      )}

      {/* Dot progress indicator */}
      <div className="shrink-0 flex justify-center items-center gap-1.5 py-3 bg-zinc-950">
        {photos.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`rounded-full transition-all ${
              i === index
                ? "w-4 h-2 bg-white"
                : "w-2 h-2 bg-zinc-600 hover:bg-zinc-400"
            }`}
            aria-label={`Go to photo ${i + 1}`}
          />
        ))}
        {/* End dot */}
        <button
          onClick={() => setIndex(total)}
          className={`rounded-full transition-all ${
            isEndSlide
              ? "w-4 h-2 bg-green-400"
              : "w-2 h-2 bg-zinc-600 hover:bg-zinc-400"
          }`}
          aria-label="Mark as explored"
        />
      </div>
    </div>
  );
}
