import { bikesByZone, type Station } from "@/lib/velib";

// Dataviz 100 % serveur : du HTML + Tailwind, zéro JavaScript envoyé au navigateur.
export default function BikesChart({ stations }: { stations: Station[] }) {
  const data = bikesByZone(stations, 10);
  const max = Math.max(1, ...data.map((d) => d.bikes));

  return (
    <section className="rounded-lg bg-white p-4 shadow-sm">
      <h2 className="mb-1 font-semibold">Top 10 des zones (vélos disponibles)</h2>
      <p className="mb-3 text-xs text-slate-500">
        <span className="inline-block h-2 w-3 bg-emerald-600" /> mécaniques{" "}
        <span className="ml-2 inline-block h-2 w-3 bg-sky-500" /> électriques
      </p>
      <ul className="space-y-2">
        {data.map((d) => (
          <li key={d.zone} className="grid grid-cols-[8rem_1fr_3rem] items-center gap-2 text-sm">
            <span className="truncate">{d.zone}</span>
            <div className="flex h-4" style={{ width: `${(d.bikes / max) * 100}%` }}>
              <div className="bg-emerald-600" style={{ flexGrow: d.mechanical }} />
              <div className="bg-sky-500" style={{ flexGrow: d.ebikes }} />
            </div>
            <span className="text-right tabular-nums">{d.bikes}</span>
          </li>
        ))}
      </ul>
      {data.length === 0 && <p className="text-sm text-slate-500">Aucune station.</p>}
    </section>
  );
}
