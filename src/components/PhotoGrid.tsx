"use client";

import { useState, useEffect, useRef } from "react";
import type { Photo } from "@/app/api/nearby/route";

interface LightboxProps {
  photo: Photo;
  onClose: () => void;
}

function Lightbox({ photo, onClose }: LightboxProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-zinc-900 rounded-xl overflow-hidden max-w-3xl w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-3 right-3 z-10 text-white/70 hover:text-white bg-black/40 rounded-full w-8 h-8 flex items-center justify-center text-lg"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>

        {/* Photo */}
        <div className="bg-black flex items-center justify-center max-h-[60vh] overflow-hidden">
          <img
            src={photo.image_url}
            alt={photo.title}
            className="object-contain max-h-[60vh] w-full"
          />
        </div>

        {/* Meta */}
        <div className="p-5 space-y-2">
          {(photo.title) && (
            <h2 className="text-white font-semibold text-lg leading-snug">
              {photo.title}
            </h2>
          )}
          {photo.date && (
            <p className="text-zinc-400 text-sm">{photo.date}</p>
          )}
          {photo.text && (
            <p className="text-zinc-300 text-sm leading-relaxed line-clamp-4">
              {photo.text}
            </p>
          )}
          {photo.nypl_url && (
            <a
              href={photo.nypl_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-2 text-blue-400 hover:text-blue-300 text-sm underline"
            >
              View on NYPL Digital Collections →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

interface Props {
  photos: Photo[];
  highlightIds?: Set<string>;
}

export default function PhotoGrid({ photos, highlightIds }: Props) {
  const [lightbox, setLightbox] = useState<Photo | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Scroll to first highlighted photo when set changes
  useEffect(() => {
    if (!highlightIds?.size) return;
    const el = gridRef.current?.querySelector("[data-highlighted='true']");
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [highlightIds]);

  if (!photos.length) {
    return (
      <div className="text-center text-zinc-500 py-10">
        No historical photos found in this area.
        <br />
        <span className="text-sm">Try increasing the radius or moving to a different location.</span>
      </div>
    );
  }

  return (
    <>
      {lightbox && <Lightbox photo={lightbox} onClose={() => setLightbox(null)} />}

      <div
        ref={gridRef}
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3"
      >
        {photos.map((photo) => {
          const highlighted = highlightIds?.has(photo.id);
          return (
            <button
              key={photo.id}
              data-highlighted={highlighted ? "true" : undefined}
              onClick={() => setLightbox(photo)}
              className={`group relative rounded-lg overflow-hidden bg-zinc-800 text-left focus:outline-none transition-all ${
                highlighted ? "ring-2 ring-blue-400 ring-offset-2 ring-offset-zinc-900" : "hover:ring-1 hover:ring-zinc-500"
              }`}
            >
              <div className="aspect-square bg-zinc-700">
                <img
                  src={photo.thumb_url}
                  alt={photo.title || "Historical photo"}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  loading="lazy"
                />
              </div>
              <div className="p-2">
                <p className="text-xs text-zinc-300 leading-snug line-clamp-2">
                  {photo.title || "Untitled"}
                </p>
                {photo.date && (
                  <p className="text-xs text-zinc-500 mt-0.5">{photo.date}</p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}
