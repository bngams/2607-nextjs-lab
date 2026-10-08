import { cookies } from "next/headers";

export const FAVORITES_COOKIE = "favorites";

/** Lit les ids des stations favorites depuis le cookie ("16107,14014"). */
export async function getFavorites(): Promise<string[]> {
  const value = (await cookies()).get(FAVORITES_COOKIE)?.value;
  return value ? value.split(",") : [];
}
