import snapshot from "@/data/velib-snapshot.json";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Une station telle que renvoyée par l'API Open Data Paris (format brut). */
export type RawStation = {
  stationcode: string;
  name: string;
  is_installed: string; // "OUI" | "NON"
  capacity: number;
  numdocksavailable: number;
  numbikesavailable: number;
  mechanical: number;
  ebike: number;
  duedate: string;
  coordonnees_geo: { lat: number; lon: number } | null;
  nom_arrondissement_communes: string;
};

/** Une station "propre", celle qu'on manipule dans l'app. */
export type Station = {
  id: string;
  name: string;
  zone: string; // "Paris 15e", "Boulogne-Billancourt"…
  lat: number;
  lon: number;
  capacity: number;
  bikes: number;
  mechanical: number;
  ebikes: number;
  docks: number;
  updatedAt: string;
};

// ---------------------------------------------------------------------------
// Normalisation (fournie)
// ---------------------------------------------------------------------------

export const API_URL =
  "https://opendata.paris.fr/api/explore/v2.1/catalog/datasets/velib-disponibilite-en-temps-reel/exports/json";

/** "16107" -> "Paris 16e" ; pour Paris, les 2 premiers chiffres du code = l'arrondissement. */
function zoneOf(raw: RawStation): string {
  if (raw.nom_arrondissement_communes !== "Paris") return raw.nom_arrondissement_communes;
  const arr = Number(raw.stationcode.padStart(5, "0").slice(0, 2));
  if (arr < 1 || arr > 20) return "Paris";
  return `Paris ${arr}${arr === 1 ? "er" : "e"}`;
}

export function toStation(raw: RawStation): Station {
  return {
    id: raw.stationcode,
    name: raw.name,
    zone: zoneOf(raw),
    lat: raw.coordonnees_geo?.lat ?? 0,
    lon: raw.coordonnees_geo?.lon ?? 0,
    capacity: raw.capacity,
    bikes: raw.numbikesavailable,
    mechanical: raw.mechanical,
    ebikes: raw.ebike,
    docks: raw.numdocksavailable,
    updatedAt: raw.duedate,
  };
}

function normalize(raws: RawStation[]): Station[] {
  return raws.filter((r) => r.is_installed === "OUI" && r.coordonnees_geo).map(toStation);
}

/** Copie figée des données (secours si pas de réseau). */
export function getSnapshot(): Station[] {
  return normalize(snapshot as RawStation[]);
}

// ---------------------------------------------------------------------------
// Récupération des données (étape 1)
// ---------------------------------------------------------------------------

export async function getStations(): Promise<Station[]> {
  // TODO étape 1 :
  //  - mettre en cache le résultat ("use cache" + cacheLife)
  //  - si process.env.VELIB_OFFLINE === "1" -> renvoyer getSnapshot()
  //  - fetch(API_URL), vérifier res.ok, lire le JSON (RawStation[])
  //  - renvoyer normalize(raws) ; en cas d'erreur -> getSnapshot()
  return [];
}

// ---------------------------------------------------------------------------
// Filtres (étape 3)
// ---------------------------------------------------------------------------

export type Filters = {
  q: string;
  zone: string;
  minBikes: number;
  ebikeOnly: boolean;
};

/** searchParams (valeurs string | string[] | undefined) -> Filters typés. */
export function parseFilters(params: Record<string, string | string[] | undefined>): Filters {
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  return {
    q: first(params.q).trim(),
    zone: first(params.zone),
    minBikes: Number(first(params.minBikes)) || 0,
    ebikeOnly: first(params.ebike) === "on",
  };
}

export function filterStations(stations: Station[], f: Filters): Station[] {
  // TODO étape 3 : ne garder que les stations qui respectent TOUS les filtres
  //  - q        : le nom contient q (insensible à la casse)
  //  - zone     : zone exacte (ignorer si vide)
  //  - minBikes : au moins minBikes vélos
  //  - ebikeOnly: au moins 1 vélo électrique (ignorer si false)
  console.log("[velib] filtres reçus :", f);
  return stations;
}

/** Liste triée des zones, pour le <select>. Paris d'abord (1er -> 20e), puis les communes. */
export function listZones(stations: Station[]): string[] {
  const zones = [...new Set(stations.map((s) => s.zone))];
  const paris = zones.filter((z) => z.startsWith("Paris")).sort((a, b) => parseInt(a.slice(6)) - parseInt(b.slice(6)));
  const others = zones.filter((z) => !z.startsWith("Paris")).sort((a, b) => a.localeCompare(b, "fr"));
  return [...paris, ...others];
}

// ---------------------------------------------------------------------------
// Statistiques pour la dataviz (étape 4)
// ---------------------------------------------------------------------------

export type ZoneStat = { zone: string; bikes: number; mechanical: number; ebikes: number };

/** Top N des zones par nombre de vélos disponibles. */
export function bikesByZone(stations: Station[], top = 10): ZoneStat[] {
  // TODO étape 4 : regrouper les stations par zone (une Map<string, ZoneStat> fait très bien l'affaire),
  //  additionner bikes / mechanical / ebikes, trier par bikes décroissant, garder les `top` premières.
  console.log("[velib] bikesByZone :", stations.length, top);
  return [];
}
