import { getStations, parseFilters, filterStations, listZones } from "@/lib/velib";
import { getFavorites } from "@/lib/favorites";
import StationFilters from "@/app/components/filters";
import StationMap from "@/app/components/station-map-loader";
import Kpis from "@/app/components/kpis";
import BikesChart from "@/app/components/bikes-chart";
import FavoritesList from "@/app/components/favorites-list";

export default async function Home({ searchParams }: PageProps<"/">) {
  const filters = parseFilters(await searchParams);
  const allStations = await getStations();
  const stations = filterStations(allStations, filters);
  const favorites = await getFavorites();

  return (
    <div className="grid gap-4">
      <StationFilters zones={listZones(allStations)} filters={filters} />
      <Kpis stations={stations} />
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <StationMap stations={stations} favorites={favorites} />
        <div className="grid content-start gap-4">
          <FavoritesList stations={allStations.filter((s) => favorites.includes(s.id))} />
          <BikesChart stations={stations} />
        </div>
      </div>
    </div>
  );
}
