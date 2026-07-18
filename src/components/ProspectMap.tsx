"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import type { Prospect } from "@/lib/db";
import "leaflet/dist/leaflet.css";

const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const selectedIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function MapController({
  center,
  zoom,
}: {
  center: [number, number];
  zoom: number;
}) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);
  return null;
}

interface ProspectMapProps {
  prospects: Prospect[];
  selected: Prospect | null;
  onSelect: (p: Prospect) => void;
  userLocation: [number, number] | null;
  radiusKm: number;
}

export default function ProspectMap({
  prospects,
  selected,
  onSelect,
  userLocation,
  radiusKm,
}: ProspectMapProps) {
  const withCoords = prospects.filter((p) => p.latitude != null && p.longitude != null);

  const center = useMemo((): [number, number] => {
    if (selected?.latitude && selected?.longitude) {
      return [selected.latitude, selected.longitude];
    }
    if (userLocation) return userLocation;
    if (withCoords.length) {
      const avgLat = withCoords.reduce((s, p) => s + p.latitude!, 0) / withCoords.length;
      const avgLng = withCoords.reduce((s, p) => s + p.longitude!, 0) / withCoords.length;
      return [avgLat, avgLng];
    }
    return [-23.5505, -46.6333]; // São Paulo default
  }, [selected, userLocation, withCoords]);

  const zoom = selected ? 14 : withCoords.length > 1 ? 11 : 12;

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      scrollWheelZoom
      className="h-full w-full"
    >
      <MapController center={center} zoom={zoom} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {userLocation && (
        <>
          <Marker
            position={userLocation}
            icon={L.divIcon({
              className: "",
              html: '<div style="width:14px;height:14px;background:#3b82f6;border:2px solid white;border-radius:50%;box-shadow:0 0 4px rgba(0,0,0,.4)"></div>',
              iconSize: [14, 14],
              iconAnchor: [7, 7],
            })}
          >
            <Popup>Sua localização</Popup>
          </Marker>
          <Circle
            center={userLocation}
            radius={radiusKm * 1000}
            pathOptions={{ color: "#3b82f6", fillColor: "#3b82f6", fillOpacity: 0.08 }}
          />
        </>
      )}

      {withCoords.map((p) => {
        const dist =
          userLocation && p.latitude && p.longitude
            ? haversineKm(userLocation[0], userLocation[1], p.latitude, p.longitude)
            : null;

        return (
          <Marker
            key={p.id}
            position={[p.latitude!, p.longitude!]}
            icon={selected?.id === p.id ? selectedIcon : defaultIcon}
            eventHandlers={{ click: () => onSelect(p) }}
          >
            <Popup>
              <strong>{p.empresa}</strong>
              <br />
              {p.nome}
              <br />
              {p.cidade}, {p.estado}
              {dist != null && (
                <>
                  <br />
                  <em>{dist.toFixed(1)} km de você</em>
                </>
              )}
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
