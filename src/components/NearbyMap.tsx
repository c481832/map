"use client";

import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Circle,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import type { Photo } from "@/app/api/nearby/route";

// Fix Leaflet default icon paths broken by webpack
import "leaflet/dist/leaflet.css";

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const cameraIcon = new L.DivIcon({
  className: "",
  html: `<div style="
    background:#dc2626;
    border:2px solid white;
    border-radius:50% 50% 50% 0;
    width:24px;height:24px;
    display:flex;align-items:center;justify-content:center;
    transform:rotate(-45deg);
    box-shadow:0 2px 6px rgba(0,0,0,.4);
  ">
    <span style="transform:rotate(45deg);font-size:11px;">📷</span>
  </div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 24],
});

const userIcon = new L.DivIcon({
  className: "",
  html: `<div style="
    width:16px;height:16px;
    background:#2563eb;
    border:3px solid white;
    border-radius:50%;
    box-shadow:0 0 0 3px rgba(37,99,235,.3);
  "></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

// Groups photos by lat/lon cluster key
function groupByCoord(photos: Photo[]) {
  const map = new Map<string, Photo[]>();
  for (const p of photos) {
    const key = `${p.lat},${p.lon}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(p);
  }
  return map;
}

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng]);
  }, [lat, lng, map]);
  return null;
}

interface Props {
  userLat: number;
  userLng: number;
  radius: number;
  photos: Photo[];
  onClusterClick: (photos: Photo[]) => void;
}

export default function NearbyMap({
  userLat,
  userLng,
  radius,
  photos,
  onClusterClick,
}: Props) {
  const clusters = groupByCoord(photos);

  return (
    <MapContainer
      center={[userLat, userLng]}
      zoom={15}
      className="w-full h-full"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Recenter lat={userLat} lng={userLng} />

      {/* User location */}
      <Marker position={[userLat, userLng]} icon={userIcon}>
        <Popup>You are here</Popup>
      </Marker>

      {/* Search radius ring */}
      <Circle
        center={[userLat, userLng]}
        radius={radius}
        pathOptions={{ color: "#2563eb", fillColor: "#2563eb", fillOpacity: 0.05, weight: 1.5 }}
      />

      {/* Photo cluster markers */}
      {Array.from(clusters.entries()).map(([key, clusterPhotos]) => {
        const [lat, lon] = key.split(",").map(Number);
        return (
          <Marker
            key={key}
            position={[lat, lon]}
            icon={cameraIcon}
            eventHandlers={{ click: () => onClusterClick(clusterPhotos) }}
          >
            <Popup>
              <strong>{clusterPhotos.length} photo{clusterPhotos.length !== 1 ? "s" : ""}</strong>
              <br />
              <span style={{ fontSize: "11px", color: "#666" }}>Click to browse photos</span>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
