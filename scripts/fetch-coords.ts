#!/usr/bin/env tsx
/**
 * One-time script: downloads OldNYC data.json and extracts a lightweight
 * photo index saved to public/photo-index.json.
 *
 * Only keeps the fields needed for the app (drops geocode, nypl_fields, etc.)
 * Typical output: ~3-5 MB instead of 71 MB.
 *
 * Run: npx tsx scripts/fetch-coords.ts
 */

import { writeFileSync } from "fs";
import { join } from "path";

const DATA_URL =
  "https://raw.githubusercontent.com/oldnyc/oldnyc.github.io/master/data.json";

interface RawPhoto {
  photo_id: string;
  date: string;
  title: string;
  text: string | null;
  image_url: string;
  thumb_url: string;
  nypl_url: string;
  location: { lat: number; lon: number } | null;
  years: string[];
}

interface IndexPhoto {
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

async function main() {
  console.log("Downloading OldNYC data.json (~71 MB) …");

  const res = await fetch(DATA_URL);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const text = await res.text();
  console.log(`Downloaded ${(text.length / 1024 / 1024).toFixed(1)} MB`);

  const data = JSON.parse(text) as { photos: RawPhoto[] };
  console.log(`Total photos: ${data.photos.length}`);

  // Strip to essentials; skip photos without valid location
  const index: IndexPhoto[] = data.photos
    .filter((p) => p.location && !isNaN(p.location.lat) && !isNaN(p.location.lon))
    .map((p) => ({
      id: p.photo_id,
      date: p.date ?? p.years?.[0] ?? "",
      title: p.title ?? "",
      text: p.text ?? "",
      image_url: p.image_url,
      thumb_url: p.thumb_url,
      nypl_url: p.nypl_url,
      lat: p.location!.lat,
      lon: p.location!.lon,
    }));

  console.log(`Photos with valid location: ${index.length}`);

  const outPath = join(process.cwd(), "public", "photo-index.json");
  const json = JSON.stringify(index);
  writeFileSync(outPath, json);
  console.log(`Wrote ${(json.length / 1024 / 1024).toFixed(2)} MB → ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
