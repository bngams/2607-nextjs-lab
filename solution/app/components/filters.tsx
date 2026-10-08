import Form from "next/form";
import type { Filters } from "@/lib/velib";

type Props = { zones: string[]; filters: Filters };

// Composant serveur : pas de "use client", pas de useState.
// <Form> soumet en GET => les champs deviennent des searchParams (?zone=...&minBikes=...).
export default function StationFilters({ zones, filters }: Props) {
  return (
    <Form action="/" className="flex flex-wrap items-end gap-3 rounded-lg bg-white p-4 shadow-sm">
      <label className="flex flex-col text-sm">
        Nom de station
        <input name="q" defaultValue={filters.q} placeholder="ex : Bastille" className="rounded border px-2 py-1" />
      </label>
      <label className="flex flex-col text-sm">
        Zone
        <select name="zone" defaultValue={filters.zone} className="rounded border px-2 py-1">
          <option value="">Toutes</option>
          {zones.map((z) => (
            <option key={z} value={z}>
              {z}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col text-sm">
        Vélos min.
        <input name="minBikes" type="number" min={0} defaultValue={filters.minBikes || ""} className="w-24 rounded border px-2 py-1" />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input name="ebike" type="checkbox" defaultChecked={filters.ebikeOnly} />
        Électriques dispo
      </label>
      <button className="rounded bg-emerald-700 px-4 py-1.5 text-white">Filtrer</button>
    </Form>
  );
}
