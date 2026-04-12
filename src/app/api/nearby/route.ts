import { NextRequest, NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface Photo {
  id: string;
  date: string;
  title: string;
  text: string;
  image_url: string;
  thumb_url: string;
  nypl_url: string;
  lat: number;
  lon: number;
}

// ---------------------------------------------------------------------------
// Photo index — loaded once and kept in module scope
// ---------------------------------------------------------------------------
let photoCache: Photo[] | null = null;

function loadPhotos(): Photo[] {
  if (photoCache) return photoCache;
  const path = join(process.cwd(), "public", "photo-index.json");
  photoCache = JSON.parse(readFileSync(path, "utf-8")) as Photo[];
  return photoCache;
}

// ---------------------------------------------------------------------------
// Haversine distance in metres
// ---------------------------------------------------------------------------
function haversineM(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6_371_000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const lat = parseFloat(searchParams.get("lat") ?? "");
  const lng = parseFloat(searchParams.get("lng") ?? "");
  const radius = Math.min(
    5000,
    Math.max(100, parseFloat(searchParams.get("radius") ?? "500"))
  );

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json({ error: "lat and lng are required" }, { status: 400 });
  }

  const photos = loadPhotos();

  const nearby = photos
    .filter((p) => haversineM(lat, lng, p.lat, p.lon) <= radius)
    .sort(
      (a, b) =>
        haversineM(lat, lng, a.lat, a.lon) - haversineM(lat, lng, b.lat, b.lon)
    )
    .slice(0, 200); // cap at 200 photos

  return NextResponse.json({ photos: nearby, count: nearby.length });
}
