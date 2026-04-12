"use client";

import dynamic from "next/dynamic";
import { useState, useEffect, useCallback, useRef } from "react";
import PhotoGrid from "@/components/PhotoGrid";
import type { Photo } from "@/app/api/nearby/route";

// Leaflet must not render on the server
const NearbyMap = dynamic(() => import("@/components/NearbyMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-zinc-400 text-sm">
      Loading map…
    </div>
  ),
});

type GeoState =
  | { status: "idle" }
  | { status: "requesting" }
  | { status: "ok"; lat: number; lng: number }
  | { status: "denied" }
  | { status: "manual"; lat: number; lng: number };

export default function OldNYCPage() {
  const [geo, setGeo] = useState<GeoState>({ status: "idle" });
  const [radius, setRadius] = useState(500);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [highlightIds, setHighlightIds] = useState<Set<string>>(new Set());
  const [manualInput, setManualInput] = useState("");
  const fetchRef = useRef<AbortController | null>(null);

  // Request geolocation on mount
  useEffect(() => {
    setGeo({ status: "requesting" });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeo({ status: "ok", lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        setGeo({ status: "denied" });
      }
    );
  }, []);

  const activeLat = geo.status === "ok" || geo.status === "manual" ? geo.lat : null;
  const activeLng = geo.status === "ok" || geo.status === "manual" ? geo.lng : null;

  // Fetch nearby photos whenever location or radius changes
  useEffect(() => {
    if (activeLat === null || activeLng === null) return;

    fetchRef.current?.abort();
    fetchRef.current = new AbortController();

    setLoading(true);
    setError(null);

    fetch(
      `/api/nearby?lat=${activeLat}&lng=${activeLng}&radius=${radius}`,
      { signal: fetchRef.current.signal }
    )
      .then((r) => {
        if (!r.ok) throw new Error(`API error: ${r.status}`);
        return r.json() as Promise<{ photos: Photo[]; count: number }>;
      })
      .then(({ photos }) => {
        setPhotos(photos);
        setHighlightIds(new Set());
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      })
      .finally(() => setLoading(false));
  }, [activeLat, activeLng, radius]);

  const handleClusterClick = useCallback((clusterPhotos: Photo[]) => {
    setHighlightIds(new Set(clusterPhotos.map((p) => p.id)));
  }, []);

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parts = manualInput.split(",").map((s) => parseFloat(s.trim()));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      setGeo({ status: "manual", lat: parts[0], lng: parts[1] });
    }
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white flex flex-col">
      {/* Header */}
      <header className="px-5 py-4 border-b border-zinc-800 flex items-center gap-3">
        <span className="text-2xl">🗽</span>
        <div>
          <h1 className="font-bold text-lg leading-none">OldNYC Near Me</h1>
          <p className="text-zinc-400 text-xs mt-0.5">Historical photos from the NYPL collection</p>
        </div>
        {(activeLat !== null) && (
          <span className="ml-auto text-xs text-zinc-500 font-mono">
            {activeLat.toFixed(5)}, {activeLng?.toFixed(5)}
          </span>
        )}
      </header>

      {/* Geolocation denied — manual entry */}
      {geo.status === "denied" && (
        <div className="px-5 py-3 bg-yellow-900/40 border-b border-yellow-700/40">
          <p className="text-yellow-300 text-sm mb-2">
            Location access was denied. Enter coordinates manually:
          </p>
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              className="flex-1 bg-zinc-800 border border-zinc-600 rounded px-3 py-1.5 text-sm font-mono placeholder:text-zinc-500"
              placeholder="40.7580, -73.9855"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
            />
            <button
              type="submit"
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 rounded text-sm font-medium"
            >
              Go
            </button>
          </form>
        </div>
      )}

      {/* Requesting / idle states */}
      {geo.status === "requesting" && (
        <div className="px-5 py-3 bg-blue-900/30 border-b border-blue-700/30 text-blue-300 text-sm">
          Requesting your location…
        </div>
      )}

      {/* Controls */}
      <div className="px-5 py-3 border-b border-zinc-800 flex items-center gap-4 flex-wrap">
        <label className="flex items-center gap-3 text-sm">
          <span className="text-zinc-400 w-16 shrink-0">Radius</span>
          <input
            type="range"
            min={100}
            max={5000}
            step={100}
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            className="w-40 accent-blue-500"
          />
          <span className="text-zinc-300 font-mono w-16 shrink-0">
            {radius >= 1000 ? `${(radius / 1000).toFixed(1)} km` : `${radius} m`}
          </span>
        </label>

        {loading && (
          <span className="text-zinc-500 text-sm animate-pulse ml-auto">Searching…</span>
        )}
        {!loading && photos.length > 0 && (
          <span className="text-zinc-500 text-sm ml-auto">
            {photos.length} photo{photos.length !== 1 ? "s" : ""} found
          </span>
        )}
        {error && (
          <span className="text-red-400 text-sm ml-auto">{error}</span>
        )}
      </div>

      {/* Main content */}
      {activeLat !== null && activeLng !== null ? (
        <div className="flex-1 flex flex-col">
          {/* Map */}
          <div className="h-72 sm:h-80 w-full relative">
            <NearbyMap
              userLat={activeLat}
              userLng={activeLng}
              radius={radius}
              photos={photos}
              onClusterClick={handleClusterClick}
            />
          </div>

          {/* Photo grid */}
          <div className="flex-1 px-5 py-5 overflow-auto">
            {highlightIds.size > 0 && (
              <div className="mb-3 flex items-center gap-2">
                <span className="text-xs text-blue-400">
                  {highlightIds.size} photo{highlightIds.size !== 1 ? "s" : ""} at selected location
                </span>
                <button
                  className="text-xs text-zinc-500 hover:text-zinc-300 underline"
                  onClick={() => setHighlightIds(new Set())}
                >
                  Clear selection
                </button>
              </div>
            )}
            <PhotoGrid photos={photos} highlightIds={highlightIds} />
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-zinc-600">
          {geo.status === "idle" || geo.status === "requesting"
            ? "Waiting for location…"
            : "Enter coordinates above to get started."}
        </div>
      )}
    </div>
  );
}
