"use client";

import { useState, useEffect, useCallback } from "react";
import type { Photo } from "@/app/api/nearby/route";

interface Props {
  photos: Photo[];
  locationKey: string;
  onClose: () => void;
}

export default function PhotoCarousel({ photos, locationKey, onClose }: Props) {
  const [index, setIndex] = useState(0);
  const [explored, setExplored] = useState(false);
  const [loadingExplored, setLoadingExplored] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const photo = photos[index];
  const isLast = index === photos.length - 1;

  // Check explored status on mount
  useEffect(() => {
    fetch(`/api/explored?key=${encodeURIComponent(locationKey)}`)
      .then((r) => r.json())
      .then((d) => setExplored(d.explored))
      .catch(() => {})
      .finally(() => setLoadingExplored(false));
  }, [locationKey]);

  const goNext = useCallback(() => {
    if (index < photos.length - 1) setIndex((i) => i + 1);
  }, [index, photos.length]);

  const goPrev = useCallback(() => {
    if (index > 0) setIndex((i) => i - 1);
  }, [index]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, goNext, goPrev]);

  async function toggleExplored() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/explored", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: locationKey, explored: !explored }),
      });
      if (res.ok) setExplored(!explored);
    } catch {
      // silently fail
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-zinc-900 rounded-xl overflow-hidden max-w-3xl w-full shadow-2xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          className="absolute top-3 right-3 z-10 text-white/70 hover:text-white bg-black/40 rounded-full w-8 h-8 flex items-center justify-center text-lg"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>

        {/* Counter */}
        <div className="absolute top-3 left-3 z-10 bg-black/50 text-white text-xs px-2 py-1 rounded-full font-mono">
          {index + 1} / {photos.length}
        </div>

        {/* Image area */}
        <div className="relative bg-black flex items-center justify-center min-h-[40vh] max-h-[55vh] overflow-hidden">
          <img
            src={photo.image_url}
            alt={photo.title}
            className="object-contain max-h-[55vh] w-full"
          />

          {/* Navigation arrows */}
          {index > 0 && (
            <button
              onClick={goPrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full w-10 h-10 flex items-center justify-center text-xl"
              aria-label="Previous photo"
            >
              ‹
            </button>
          )}
          {index < photos.length - 1 && (
            <button
              onClick={goNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full w-10 h-10 flex items-center justify-center text-xl"
              aria-label="Next photo"
            >
              ›
            </button>
          )}
        </div>

        {/* Meta */}
        <div className="p-5 space-y-2 overflow-auto">
          {photo.title && (
            <h2 className="text-white font-semibold text-lg leading-snug">
              {photo.title}
            </h2>
          )}
          {photo.date && (
            <p className="text-zinc-400 text-sm">{photo.date}</p>
          )}
          {photo.text && (
            <p className="text-zinc-300 text-sm leading-relaxed line-clamp-3">
              {photo.text}
            </p>
          )}
          {photo.nypl_url && (
            <a
              href={photo.nypl_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-blue-400 hover:text-blue-300 text-sm underline"
            >
              View on NYPL Digital Collections →
            </a>
          )}

          {/* Explored option — shown on last photo or always at bottom */}
          {isLast && (
            <div className="pt-4 mt-2 border-t border-zinc-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white text-sm font-medium">
                    {explored ? "Location marked as explored" : "Have you explored this location?"}
                  </p>
                  <p className="text-zinc-500 text-xs mt-0.5">
                    Mark this spot as explored to keep track of your visits
                  </p>
                </div>
                <button
                  onClick={toggleExplored}
                  disabled={submitting || loadingExplored}
                  className={`shrink-0 ml-4 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    explored
                      ? "bg-green-600/20 text-green-400 border border-green-600/40 hover:bg-red-600/20 hover:text-red-400 hover:border-red-600/40"
                      : "bg-blue-600 hover:bg-blue-500 text-white"
                  } disabled:opacity-50`}
                >
                  {submitting
                    ? "Saving..."
                    : explored
                    ? "Explored ✓"
                    : "Mark as Explored"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom dot indicators for small sets */}
        {photos.length > 1 && photos.length <= 20 && (
          <div className="flex justify-center gap-1.5 pb-3">
            {photos.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === index ? "bg-blue-400" : "bg-zinc-600 hover:bg-zinc-400"
                }`}
                aria-label={`Go to photo ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
