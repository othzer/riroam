"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Custom pin (avoids the classic broken-default-marker-icon issue under
// bundlers) in the brand's Pangong blue.
const pin = L.divIcon({
  className: "",
  html: `<div style="width:16px;height:16px;border-radius:50% 50% 50% 0;background:#0D6E8F;border:2px solid white;transform:rotate(-45deg);box-shadow:0 1px 3px rgba(0,0,0,0.3)"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 16],
});

export default function LeafletMapInner({
  lat,
  lng,
  label,
}: {
  lat: number;
  lng: number;
  label: string;
}) {
  return (
    <MapContainer
      center={[lat, lng]}
      zoom={13}
      scrollWheelZoom={false}
      className="h-64 w-full rounded-card"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[lat, lng]} icon={pin}>
        <Popup>{label}</Popup>
      </Marker>
    </MapContainer>
  );
}
