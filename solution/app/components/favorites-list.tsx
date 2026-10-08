import type { Station } from "@/lib/velib";
import { toggleFavorite } from "@/app/actions";

export default function FavoritesList({ stations }: { stations: Station[] }) {
  return (
    <section className="rounded-lg bg-white p-4 shadow-sm">
      <h2 className="mb-2 font-semibold">★ Mes stations favorites</h2>
      {stations.length === 0 ? (
        <p className="text-sm text-slate-500">Aucun favori : cliquez sur une station de la carte.</p>
      ) : (
        <ul className="space-y-1 text-sm">
          {stations.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-2">
              <span>
                {s.name} — <strong>{s.bikes}</strong> 🚲
              </span>
              <form action={toggleFavorite}>
                <input type="hidden" name="id" value={s.id} />
                <button className="text-xs text-red-600 hover:underline">retirer</button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
