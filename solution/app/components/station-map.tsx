"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import type { Station } from "@/lib/velib";
import { toggleFavorite } from "@/app/actions";

const PARIS: [number, number] = [48.8566, 2.3522];

function colorFor(s: Station) {
  if (s.bikes === 0) return "#dc2626"; // rouge : vide
  if (s.bikes < 5) return "#f59e0b"; // orange : presque vide
  return "#16a34a"; // vert : ok
}

type Props = { stations: Station[]; favorites: string[] };

export default function StationMap({ stations, favorites }: Props) {
  return (
    <MapContainer center={PARIS} zoom={12} className="h-[500px] w-full rounded-lg z-0">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {stations.map((s) => {
        const isFav = favorites.includes(s.id);
        return (
          <CircleMarker
            key={s.id}
            center={[s.lat, s.lon]}
            radius={isFav ? 9 : 6}
            pathOptions={{ color: isFav ? "#7c3aed" : colorFor(s), weight: isFav ? 3 : 1, fillOpacity: 0.7 }}
          >
            <Popup>
              <strong>{s.name}</strong>
              <br />
              {s.zone}
              <br />
              🚲 {s.mechanical} mécaniques · ⚡ {s.ebikes} électriques
              <br />
              🅿️ {s.docks} places libres / {s.capacity}
              <form action={toggleFavorite} className="mt-2">
                <input type="hidden" name="id" value={s.id} />
                <button className="rounded bg-violet-600 px-2 py-1 text-white">
                  {isFav ? "★ Retirer des favoris" : "☆ Ajouter aux favoris"}
                </button>
              </form>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
