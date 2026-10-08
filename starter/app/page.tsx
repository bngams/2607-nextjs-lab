import { getStations } from "@/lib/velib";

export default async function Home() {
  // Étape 1 : les données arrivent côté serveur
  const stations = await getStations();

  return (
    <div className="grid gap-4">
      <p className="rounded-lg bg-white p-4 shadow-sm">
        <strong>{stations.length}</strong> stations chargées
      </p>

      {/* Étape 2 : la carte */}

      {/* Étape 3 : les filtres + les indicateurs (<Kpis />) */}

      {/* Étape 4 : la dataviz */}

      {/* Étape 5 : les favoris */}
    </div>
  );
}
