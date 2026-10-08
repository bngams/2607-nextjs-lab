"use server";

import { cookies } from "next/headers";
import { FAVORITES_COOKIE, getFavorites } from "@/lib/favorites";

/** Server Action : ajoute ou retire une station des favoris (stockés dans un cookie). */
export async function toggleFavorite(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  // Une Server Action est un point d'entrée public : on ne fait pas confiance à ce qu'on reçoit.
  if (!/^\d{1,6}$/.test(id)) return;

  const favorites = await getFavorites();
  const next = favorites.includes(id) ? favorites.filter((f) => f !== id) : [...favorites, id];

  (await cookies()).set(FAVORITES_COOKIE, next.join(","), { maxAge: 60 * 60 * 24 * 365, path: "/" });
  // Modifier un cookie dans une Server Action suffit : Next re-rend la page avec les nouvelles valeurs.
}
