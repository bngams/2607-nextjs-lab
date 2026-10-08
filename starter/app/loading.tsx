// Affiché pendant que la page (server component async) se charge.
// C'est aussi la frontière <Suspense> qui permet à la page de lire searchParams / cookies.
export default function Loading() {
  return (
    <div className="grid gap-4 animate-pulse">
      <div className="h-16 rounded-lg bg-slate-200" />
      <div className="h-[500px] rounded-lg bg-slate-200" />
    </div>
  );
}
