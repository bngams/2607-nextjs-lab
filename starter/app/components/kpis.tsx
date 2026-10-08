import type { Station } from "@/lib/velib";

export default function Kpis({ stations }: { stations: Station[] }) {
  const bikes = stations.reduce((sum, s) => sum + s.bikes, 0);
  const ebikes = stations.reduce((sum, s) => sum + s.ebikes, 0);
  const empty = stations.filter((s) => s.bikes === 0).length;

  const tiles = [
    { label: "Stations", value: stations.length },
    { label: "Vélos disponibles", value: bikes },
    { label: "dont électriques", value: ebikes },
    { label: "Stations vides", value: empty },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {tiles.map((t) => (
        <div key={t.label} className="rounded-lg bg-white p-4 shadow-sm">
          <div className="text-sm text-slate-500">{t.label}</div>
          <div className="text-2xl font-semibold">{t.value.toLocaleString("fr-FR")}</div>
        </div>
      ))}
    </div>
  );
}
