"use client";

import dynamic from "next/dynamic";

// Leaflet manipule `window` dès son import => pas de rendu serveur (SSR) pour la carte.
// `ssr: false` n'est autorisé que dans un composant client, d'où ce petit "loader".
const StationMap = dynamic(() => import("./station-map"), {
  ssr: false,
  loading: () => <div className="h-[500px] w-full rounded-lg bg-slate-200 animate-pulse" />,
});

export default StationMap;
