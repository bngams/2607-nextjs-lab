# 🚲 Lab — Vélib' Explorer : une carte SIG avec Next.js

> **Scénario à réaliser en autonomie, guidé au début.** Vous construisez une petite application
> cartographique qui affiche les stations Vélib' de Paris en temps réel, avec des filtres, quelques
> indicateurs et des favoris. Vous complétez vous-même les blancs `// TODO`. Le dossier
> `solution/` sert de dernier recours (à ne regarder qu'en cas de blocage 😉).
>
> **Durée :** environ 2 h 30 (2 h sans l'étape 5 ni le second test E2E) · **Niveau :** intermédiaire.
> **Prérequis :** les bases de React, et le workshop officiel Next.js jusqu'au chapitre 11 au
> moins (Server Components, `searchParams`, `<Form>`, Server Actions).
> **Environnement :** Node.js ≥ 20.9 (testé avec Node 22.18), Next.js 16.4, React 19.3, Leaflet 1.9.

## ✨ Objectifs

- récupérer des données **côté serveur**, avec un cache, à partir d'une vraie API Open Data ;
- intégrer une bibliothèque **100 % navigateur** (Leaflet) et placer correctement la frontière
  serveur / client ;
- piloter la carte avec des **filtres stockés dans l'URL**, sans `useState` ;
- produire une **dataviz rendue côté serveur**, sans aucune bibliothèque ;
- modifier des données avec une **Server Action** (des favoris enregistrés dans un cookie) ;
- tester l'appli : **tests unitaires** avec Vitest, **test de bout en bout** avec Playwright.

## 📊 Pourquoi Next.js pour une appli carto ?

Vous avez sans doute déjà fait une carte React avec une poignée de POI écrits en dur (tour Eiffel,
Louvre…). Ce lab reprend la même idée, mais avec 1 500 stations réelles qui changent toutes les
minutes. Voici ce que Next.js change par rapport à React seul :

| Besoin | React seul (SPA) | Next.js (App Router) |
|---|---|---|
| Charger les données | `useEffect` + `fetch` dans le navigateur, états `loading` à gérer à la main | Un composant serveur `async` fait `await getStations()` |
| Clé d'API, CORS | La requête part du navigateur : la clé est visible et le CORS doit être autorisé | La requête part du serveur : rien n'est exposé |
| Cache | À faire soi-même (React Query, SWR…) | `"use cache"` + `cacheLife("minutes")` |
| Filtres | `useState` : perdus au rafraîchissement, impossibles à partager | Dans l'URL (`?zone=Paris+11e`) : partageables et filtrés **côté serveur** |
| Poids envoyé au navigateur | Les 1 500 stations brutes | Uniquement les stations filtrées |
| La carte | Tout le code tourne dans le navigateur | **Seule la carte** est un composant client |

Retenez la dernière ligne : dans une appli SIG, la carte reste du React « classique » côté client.
Next.js vous aide pour **tout ce qui l'entoure** (données, filtres, statistiques, mutations).

## 📁 Point de départ

On vous fournit un projet de départ dans `starter/`, pour ne pas perdre 20 minutes en
installation. Il a été créé avec `create-next-app` (options par défaut de Next 16.4), puis
préparé ainsi :

| Déjà fait dans le starter | Pourquoi |
|---|---|
| **Tailwind CSS 4** configuré (`app/globals.css`) | On écrit le style directement dans les `className`, sans fichier CSS à gérer. On pourrait aussi ajouter [shadcn/ui](https://ui.shadcn.com/docs/installation/next) (des composants prêts à l'emploi construits sur Tailwind) : c'est hors périmètre ici, mais c'est une bonne piste pour un vrai projet |
| `leaflet`, `react-leaflet` et `@types/leaflet` installés | La carte (étape 2) |
| `data/velib-snapshot.json` | Une copie figée de l'API : l'appli fonctionne même sans réseau |
| `lib/velib.ts` | Les types `RawStation` / `Station`, la normalisation et l'analyse des filtres sont **fournis**. Les fonctions à compléter sont marquées `// TODO` |
| `app/layout.tsx`, `app/loading.tsx` | Le bandeau vert, et le squelette de chargement affiché pendant le rendu de la page |
| `app/components/kpis.tsx` | Les 4 tuiles d'indicateurs (utilisées à l'étape 3) |
| `@types/node` passé en version 22 | Vitest 5 (étape 6) refuse la version 20 installée par défaut |

Voici l'arborescence que vous aurez **à la fin du lab**. Les fichiers marqués ✍️ sont ceux que
vous allez créer ou compléter :

```
starter/
├── app/
│   ├── layout.tsx
│   ├── loading.tsx
│   ├── page.tsx                    ✍️ étapes 1 à 5
│   ├── actions.ts                  ✍️ étape 5 (Server Action)
│   └── components/
│       ├── kpis.tsx                (fourni)
│       ├── station-map.tsx         ✍️ étape 2 (composant client Leaflet)
│       ├── station-map-loader.tsx  ✍️ étape 2 (chargement sans SSR)
│       ├── filters.tsx             ✍️ étape 3
│       ├── bikes-chart.tsx         ✍️ étape 4
│       ├── kpis.test.tsx           ✍️ étape 6
│       └── favorites-list.tsx      ✍️ étapes 5 et 7
├── e2e/stations.spec.ts            ✍️ étape 7
├── data/velib-snapshot.json        (fourni)
└── lib/
    ├── velib.ts                    ✍️ étapes 1, 3, 4 (TODO)
    ├── velib.test.ts               ✍️ étape 6
    └── favorites.ts                ✍️ étape 5
(+ vitest.config.mts et playwright.config.ts à la racine, étapes 6 et 7)
```

### Le déroulé

| # | Étape | Guidage | Durée |
|---|---|---|---|
| 0 | Lancer le starter | 🟢 pas à pas | 10' |
| 1 | Les données côté serveur | 🟢 pas à pas | 15' |
| 2 | La carte Leaflet (composant client) | 🟢 guidé | 20' |
| 3 | Les filtres dans l'URL | 🟡 semi-guidé | 20' |
| 4 | La dataviz côté serveur | 🟡 semi-guidé | 15' |
| 5 | Les favoris avec une Server Action | 🔴 en autonomie | 20' |
| 6 | Les tests unitaires (Vitest) | 🟡 semi-guidé | 20' |
| 7 | Le test de bout en bout (Playwright) | 🟡 semi-guidé | 20' |
| ✅ | Bonus | 🔴 en autonomie | le temps qui reste |

---

## 🚀 0 — Lancer le starter

Depuis le dossier du lab (celui qui contient `starter/` et `solution/`), copiez d'abord le
starter sous un nouveau nom, puis installez les dépendances et lancez le serveur de développement :

```bash
cp -r starter velib-explorer
cd velib-explorer
npm install
npm run dev
```

Ouvrez ensuite <http://localhost:3000>. Vous devez voir le bandeau vert « 🚲 Vélib' Explorer » et
le texte **« 0 stations chargées »**. C'est normal : la fonction `getStations()` renvoie pour
l'instant un tableau vide.

Prenez 5 minutes pour lire `lib/velib.ts`. Repérez en particulier les éléments suivants :

| Élément | Rôle |
|---|---|
| `RawStation` | Le format **brut** de l'API Open Data Paris (`numbikesavailable`, `coordonnees_geo`…) |
| `Station` | Notre format **propre** (`bikes`, `lat`, `lon`, `zone`…), le seul utilisé dans les composants |
| `toStation()` / `normalize()` | La conversion brut => propre. La `zone` est déduite du code station : pour Paris, les 2 premiers chiffres donnent l'arrondissement (`16107` => « Paris 16e ») |
| `getSnapshot()` | Les stations issues de la copie figée `data/velib-snapshot.json` |
| `API_URL` | L'export JSON complet du jeu de données [vélib' disponibilité en temps réel](https://opendata.paris.fr/explore/dataset/velib-disponibilite-en-temps-reel/) |

> ℹ️ Le starter active **Cache Components** (`cacheComponents: true` dans `next.config.ts`).
> C'est désormais la valeur par défaut de `create-next-app`. Ce mode remplace l'ancien modèle
> (`fetch(..., { next: { revalidate } })`, `export const dynamic`…) par une directive explicite,
> `"use cache"`, que vous utiliserez à l'étape 1.

---

## 📡 1 — Les données côté serveur

Dans une SPA React, vous auriez écrit un `useEffect` qui appelle l'API depuis le navigateur. Ici,
`page.tsx` est un **composant serveur** : il peut faire `await` directement, et la requête vers
l'API part du serveur Next.js. Il reste à écrire `getStations()`.

On veut aussi éviter d'appeler l'API Open Data à chaque visite. Les données Vélib' changent à peu
près toutes les minutes : on va donc **mettre le résultat en cache** pendant environ une minute.

| Instruction | Rôle |
|---|---|
| `"use cache"` | Première ligne de la fonction : son résultat est mis en cache par Next.js |
| `cacheLife("minutes")` | La durée de vie du cache. Le profil `minutes` régénère les données en arrière-plan environ toutes les 60 s |
| `fetch(API_URL)` | Un `fetch` classique, mais exécuté **sur le serveur** |
| `try / catch` + `getSnapshot()` | Si l'API ne répond pas (pas de réseau en salle, API en panne), on se rabat sur la copie figée |

🚧 **À compléter** dans `lib/velib.ts`. Ajoutez d'abord cet import tout en haut du fichier :

```ts
import { cacheLife } from "next/cache";
```

Remplacez ensuite **toute la fonction** `getStations()` (qui renvoie pour l'instant `[]`) par :

```ts
export async function getStations(): Promise<Station[]> {
  // TODO : la directive qui met le résultat en cache
  cacheLife(/* TODO : le profil adapté à des données qui changent chaque minute */);

  if (process.env.VELIB_OFFLINE === "1") return getSnapshot();

  try {
    const res = await fetch(/* TODO */);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const raws: RawStation[] = await res.json();
    console.log(`[velib] ${raws.length} stations reçues de l'API`);
    return normalize(raws);
  } catch (err) {
    console.warn("[velib] API indisponible, on utilise le snapshot :", err);
    return /* TODO */;
  }
}
```

> 📖 [`use cache`](https://nextjs.org/docs/app/api-reference/directives/use-cache) ·
> [`cacheLife`](https://nextjs.org/docs/app/api-reference/functions/cacheLife) ·
> [Caching (Next 16)](https://nextjs.org/docs/app/getting-started/caching)
>
> 💡 **Tester :** rechargez la page. Vous devez lire environ **« 1517 stations chargées »** (le
> nombre exact varie un peu selon le jour). Dans le **terminal** (pas dans la console du
> navigateur !), vous voyez `[velib] 1519 stations reçues de l'API`. L'écart vient de
> `normalize()`, qui écarte les stations non installées. Rechargez plusieurs fois : le log est
> préfixé par ` Cache `, ce qui signifie que l'API n'est pas rappelée à chaque requête.

> 🧪 **Manip — le mode hors ligne.** Arrêtez le serveur, puis relancez-le avec
> `VELIB_OFFLINE=1 npm run dev`. La page affiche toujours environ 1 500 stations : elles viennent
> maintenant de `data/velib-snapshot.json`. Relancez ensuite normalement avec `npm run dev`.

---

## 🗺️ 2 — La carte Leaflet (composant client)

On a les données, il faut maintenant les afficher sur une carte. Leaflet est une bibliothèque
**100 % navigateur** : elle manipule le DOM et l'objet `window`. Elle ne peut donc tourner que
dans un **composant client**.

### 2.a — Le composant carte

Créez le fichier `app/components/station-map.tsx`. Voici à quoi servent les composants
`react-leaflet` utilisés :

| Composant | Rôle |
|---|---|
| `MapContainer` | La carte elle-même. `center` et `zoom` ne sont lus **qu'au premier rendu** |
| `TileLayer` | Le fond de carte (les « tuiles » OpenStreetMap) |
| `CircleMarker` | Un cercle positionné en `[lat, lon]`, avec une taille en pixels (`radius`) et un style (`pathOptions`) |
| `Popup` | La bulle qui s'ouvre au clic sur le marqueur |

> 💡 Pourquoi `CircleMarker` et pas `Marker` ? Le `Marker` par défaut de Leaflet charge des images
> PNG par un chemin relatif que les bundlers (Webpack, Turbopack) cassent : on obtient des icônes
> invisibles. `CircleMarker` est dessiné en SVG et évite le problème. En plus, il est coloriable,
> ce qui nous sert pour l'état de la station.

🚧 **À compléter :** créez `app/components/station-map.tsx` avec ce contenu.

```tsx
"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import type { Station } from "@/lib/velib";

const PARIS: [number, number] = [48.8566, 2.3522];

function colorFor(s: Station) {
  if (s.bikes === 0) return "#dc2626"; // rouge : vide
  if (s.bikes < 5) return "#f59e0b"; // orange : presque vide
  return "#16a34a"; // vert : ok
}

type Props = { stations: Station[] };

export default function StationMap({ stations }: Props) {
  return (
    <MapContainer center={/* TODO */} zoom={12} className="h-[500px] w-full rounded-lg z-0">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {stations.map((s) => (
        <CircleMarker
          key={s.id}
          center={/* TODO : [latitude, longitude] de la station */}
          radius={6}
          pathOptions={{ color: colorFor(s), weight: 1, fillOpacity: 0.7 }}
        >
          <Popup>
            <strong>{s.name}</strong>
            <br />
            {s.zone}
            <br />
            {/* TODO : afficher le nombre de vélos mécaniques et électriques */}
            <br />
            🅿️ {s.docks} places libres / {s.capacity}
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
```

> ℹ️ Les tuiles viennent des serveurs d'OpenStreetMap. Ils sont gratuits, mais leur
> [politique d'usage](https://operations.osmfoundation.org/policies/tiles/) les réserve à un
> usage léger : parfait pour un TP, mais en production on passe par un fournisseur de tuiles (ou
> son propre serveur).
>
> 📖 [React Leaflet — Setup](https://react-leaflet.js.org/docs/start-setup/) ·
> [`CircleMarker`](https://react-leaflet.js.org/docs/api-components/#circlemarker)

### 2.b — Le piège du rendu serveur

Le réflexe naturel est d'importer la carte directement dans la page. Essayez-le : dans
`app/page.tsx`, ajoutez cet import en haut du fichier…

```tsx
import StationMap from "@/app/components/station-map";
```

…puis remplacez le commentaire `{/* Étape 2 : la carte */}` par :

```tsx
<StationMap stations={stations} />
```

⚠️ **Piège — la page plante.**
- *Symptôme :* une erreur s'affiche dans le terminal et dans l'overlay rouge :
  ```
  ⨯ ReferenceError: window is not defined
      at Module.eval (app/components/station-map.tsx:4:1)
  > 4 | import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
  ```
- *Cause :* `"use client"` ne veut **pas** dire « exécuté uniquement dans le navigateur ». Un
  composant client est **aussi pré-rendu en HTML sur le serveur** (le SSR), puis « hydraté » dans
  le navigateur. Or Leaflet accède à `window` dès son `import`, et `window` n'existe pas dans
  Node.js.
- *Correctif :* charger la carte **uniquement dans le navigateur**, grâce à
  `next/dynamic` et à l'option `ssr: false`. Pas d'inquiétude, c'est l'objet de la section
  suivante.

### 2.c — Charger la carte sans SSR

Vous pourriez être tenté d'écrire `dynamic(..., { ssr: false })` directement dans `page.tsx`.
Next.js le refuse, avec ce message : `` `ssr: false` is not allowed with `next/dynamic` in Server
Components. Please move it into a Client Component. `` La page est un composant serveur, et la
décision « ne pas rendre côté serveur » ne peut se prendre que côté client.

La solution est donc un petit composant client intermédiaire, dont le seul rôle est de charger la
carte.

🚧 **À compléter :** créez `app/components/station-map-loader.tsx`.

```tsx
"use client";

import dynamic from "next/dynamic";

// Leaflet manipule `window` dès son import => pas de rendu serveur (SSR) pour la carte.
// `ssr: false` n'est autorisé que dans un composant client, d'où ce petit "loader".
const StationMap = dynamic(() => import(/* TODO : le chemin du composant carte */), {
  ssr: /* TODO */,
  loading: () => <div className="h-[500px] w-full rounded-lg bg-slate-200 animate-pulse" />,
});

export default StationMap;
```

Dans `app/page.tsx`, changez ensuite l'import pour pointer vers le loader. Le JSX
`<StationMap stations={stations} />` ne change pas :

```tsx
import StationMap from "@/app/components/station-map-loader";
```

> 📖 [Lazy loading — Skipping SSR](https://nextjs.org/docs/app/guides/lazy-loading#skipping-ssr)
>
> 💡 **Tester :** rechargez la page. Un rectangle gris s'affiche brièvement, puis la carte de
> Paris apparaît avec environ 1 500 cercles verts, orange et rouges. Cliquez sur un cercle : la
> bulle affiche le nom, la zone, les vélos et les places libres.

Voici le schéma de ce qu'on vient de construire :

```
page.tsx  (serveur)        -> await getStations() : les données brutes ne quittent jamais le serveur
  └─ station-map-loader    (client) -> dynamic(..., { ssr: false })
       └─ station-map      (client, navigateur uniquement) -> Leaflet
```

> ℹ️ Les données passent du serveur au client par les **props** (`stations={stations}`). Elles
> doivent donc être sérialisables : des objets, tableaux, chaînes et nombres, mais pas de fonctions
> ni d'instances de classe. C'est pour cela que `Station` est un objet simple.

---

## 🔎 3 — Les filtres dans l'URL

> 🟡 **On change de rythme.** Jusqu'ici, vous avez été guidé pas à pas. À partir de cette étape,
> il y a moins de code fourni : vous retrouvez des schémas déjà vus dans le workshop (chapitre 10),
> et vous vous appuyez sur les liens de doc.

On veut pouvoir filtrer les stations par nom, par zone, par nombre minimum de vélos, et ne garder
que celles qui ont un vélo électrique. Dans une SPA, on aurait mis ces filtres dans un `useState`.
Ici, on les met **dans l'URL** :

```
/?q=bastille&zone=Paris+11e&minBikes=5&ebike=on
```

Ce choix a trois avantages :
- l'URL est **partageable** (envoyez-la à un collègue, il voit la même carte) ;
- le filtrage se fait **sur le serveur**, donc seules les stations filtrées partent vers le navigateur ;
- le formulaire n'a besoin d'**aucun JavaScript** : un `<Form>` en `GET` suffit.

Le flux complet est le suivant :

```
<Form> (GET) -> URL ?zone=…  -> page.tsx lit searchParams -> parseFilters() -> filterStations()
                                                          -> <StationMap stations={filtrées} />
```

### 3.a — Le formulaire

Le composant `<Form>` de `next/form` est celui que vous avez utilisé pour la recherche « à la
soumission » du dashboard (`search-form-submit.tsx`). C'est un `<form>` HTML classique, auquel Next.js
ajoute une navigation côté client (sans rechargement complet de la page). Avec `action="/"`, il soumet le formulaire en `GET` vers la page d'accueil : chaque champ devient un
paramètre d'URL, **d'après son attribut `name`**.

| Champ | `name` attendu par `parseFilters()` | Valeur initiale à afficher |
|---|---|---|
| Texte « Nom de station » | `q` | `filters.q` |
| `<select>` « Zone » | `zone` | `filters.zone` |
| Nombre « Vélos min. » | `minBikes` | `filters.minBikes` (ou vide si 0) |
| Case à cocher « Électriques dispo » | `ebike` | `filters.ebikeOnly` |

🚧 **À compléter :** créez `app/components/filters.tsx`. C'est un **composant serveur** : pas de
`"use client"`, pas de `useState`. On utilise `defaultValue` / `defaultChecked` pour réafficher
les valeurs reçues dans l'URL.

```tsx
import Form from "next/form";
import type { Filters } from "@/lib/velib";

type Props = { zones: string[]; filters: Filters };

export default function StationFilters({ zones, filters }: Props) {
  return (
    <Form action="/" className="flex flex-wrap items-end gap-3 rounded-lg bg-white p-4 shadow-sm">
      <label className="flex flex-col text-sm">
        Nom de station
        <input /* TODO : name + defaultValue */ placeholder="ex : Bastille" className="rounded border px-2 py-1" />
      </label>
      <label className="flex flex-col text-sm">
        Zone
        <select /* TODO : name + defaultValue */ className="rounded border px-2 py-1">
          <option value="">Toutes</option>
          {/* TODO : une <option> par zone de `zones` */}
        </select>
      </label>
      <label className="flex flex-col text-sm">
        Vélos min.
        <input type="number" min={0} /* TODO */ className="w-24 rounded border px-2 py-1" />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" /* TODO : name + defaultChecked */ />
        Électriques dispo
      </label>
      <button className="rounded bg-emerald-700 px-4 py-1.5 text-white">Filtrer</button>
    </Form>
  );
}
```

> 📖 [`<Form>` (next/form)](https://nextjs.org/docs/app/api-reference/components/form)

### 3.b — Lire l'URL dans la page et filtrer

Dans `app/page.tsx`, la page reçoit `searchParams` en prop. Depuis Next 15, c'est une
**Promise** : il faut l'attendre avec `await`. `parseFilters()` (fourni) transforme ensuite ces
valeurs brutes en un objet `Filters` typé.

🚧 **À compléter :**

1. Remplacez **tout le contenu** de `app/page.tsx` par cette version. Elle reprend la carte de
   l'étape 2, et ajoute la lecture de l'URL, le filtrage, le formulaire et les indicateurs
   (placés au-dessus de la carte) :

   ```tsx
   import { getStations, parseFilters, filterStations, listZones } from "@/lib/velib";
   import StationMap from "@/app/components/station-map-loader";
   import StationFilters from "@/app/components/filters";
   import Kpis from "@/app/components/kpis";

   export default async function Home({ searchParams }: PageProps<"/">) {
     const filters = parseFilters(/* TODO : attendre searchParams */);
     const allStations = await getStations();
     const stations = filterStations(allStations, filters);

     return (
       <div className="grid gap-4">
         {/* les zones viennent de TOUTES les stations, sinon la liste rétrécirait à chaque filtre */}
         <StationFilters zones={listZones(allStations)} filters={filters} />
         <Kpis stations={stations} />
         <StationMap stations={stations} />

         {/* Étape 4 : la dataviz */}

         {/* Étape 5 : les favoris */}
       </div>
     );
   }
   ```

   > ℹ️ `PageProps<"/">` est un type **généré automatiquement** par Next.js (au lancement de
   > `next dev`) : il connaît les paramètres de chaque route. Pas besoin de l'importer.

2. Dans `lib/velib.ts`, complétez `filterStations()` : la consigne est dans le `// TODO`.
   Une seule instruction `stations.filter(...)` qui combine les 4 conditions avec `&&` suffit.
   Supprimez au passage le `console.log` du starter, qui n'était là que pour éviter un
   avertissement « variable inutilisée ».

> 📖 [`page.js` — searchParams](https://nextjs.org/docs/app/api-reference/file-conventions/page#searchparams-optional) ·
> [Chapitre 10 du workshop](https://nextjs.org/learn/dashboard-app/adding-search-and-pagination)
>
> 💡 **Tester :** choisissez « Paris 11e », cliquez sur **Filtrer**. L'URL devient
> `/?q=&zone=Paris+11e&minBikes=`, la carte ne montre plus que le 11e (environ 57 stations), et
> les tuiles d'indicateurs se mettent à jour. Ajoutez « Vélos min. = 10 » et cochez
> « Électriques dispo » : le nombre de stations baisse encore. Copiez l'URL dans un nouvel
> onglet : vous retrouvez exactement la même vue.

> ⚠️ **Piège — tous les filtres semblent ignorés.**
> - *Symptôme :* l'URL change, mais la carte affiche toujours toutes les stations.
> - *Cause :* soit `filterStations()` renvoie encore `stations` sans filtrer (si le terminal
>   affiche toujours `[velib] filtres reçus : {...}`, c'est le code du starter qui tourne), soit un
>   champ du formulaire n'a pas le bon `name` (l'objet `filters` reçu reste vide).
> - *Correctif :* comparez les `name` des champs au tableau de la section 3.a.

> ⚖️ **Le choix « soumettre » vs « filtrer en tapant ».** On a choisi un bouton **Filtrer** parce
> que c'est le plus simple et que cela fonctionne même sans JavaScript. Dans le workshop, vous
> avez vu l'autre approche : un composant client qui appelle `useRouter().replace()` à chaque
> frappe, avec un délai (`useDebouncedCallback`). Les deux sont valables. La seconde donne une
> meilleure expérience mais demande un composant client (voir Bonus).

---

## 📊 4 — La dataviz côté serveur

On veut un graphique « Top 10 des zones par vélos disponibles », avec la répartition
mécaniques / électriques. Votre premier réflexe serait d'installer une bibliothèque de graphiques
(Recharts, Chart.js…). Mais ces bibliothèques sont des composants **clients** : elles envoient
leur JavaScript au navigateur.

Pour un graphique **non interactif**, un simple diagramme en barres se fait très bien en HTML +
Tailwind, dans un **composant serveur**. Le calcul se fait sur le serveur, et le navigateur ne
reçoit que du HTML : **zéro JavaScript**.

Voici le principe d'une barre : sa largeur est proportionnelle à la valeur, et elle est découpée
en deux parts avec `flex-grow`.

```tsx
// une barre = largeur proportionnelle à la valeur maximale
<div className="flex h-4" style={{ width: `${(d.bikes / max) * 100}%` }}>
  <div className="bg-emerald-600" style={{ flexGrow: d.mechanical }} /> {/* part mécanique */}
  <div className="bg-sky-500" style={{ flexGrow: d.ebikes }} />         {/* part électrique */}
</div>
```

🚧 **À compléter :**

1. Dans `lib/velib.ts`, complétez `bikesByZone()` (consigne dans le `// TODO`). Pour chaque
   station, récupérez l'entrée de sa zone dans une `Map` (ou créez-la avec des zéros), additionnez,
   puis triez et tronquez avec `.sort(...)` et `.slice(0, top)`. Supprimez aussi le `console.log`
   du starter.
2. Créez `app/components/bikes-chart.tsx` à partir de ce squelette :

   ```tsx
   import { bikesByZone, type Station } from "@/lib/velib";

   // Dataviz 100 % serveur : du HTML + Tailwind, zéro JavaScript envoyé au navigateur.
   export default function BikesChart({ stations }: { stations: Station[] }) {
     const data = bikesByZone(stations, 10);
     const max = Math.max(1, ...data.map((d) => d.bikes));

     return (
       <section className="rounded-lg bg-white p-4 shadow-sm">
         <h2 className="mb-3 font-semibold">Top 10 des zones (vélos disponibles)</h2>
         <ul className="space-y-2">
           {data.map((d) => (
             <li key={d.zone} className="grid grid-cols-[8rem_1fr_3rem] items-center gap-2 text-sm">
               <span className="truncate">{d.zone}</span>
               {/* TODO : la barre (voir l'exemple ci-dessus) */}
               <span className="text-right tabular-nums">{d.bikes}</span>
             </li>
           ))}
         </ul>
       </section>
     );
   }
   ```

3. Dans `app/page.tsx`, ajoutez l'import du graphique :

   ```tsx
   import BikesChart from "@/app/components/bikes-chart";
   ```

   Remplacez ensuite la ligne `<StationMap stations={stations} />` **et** le commentaire
   `{/* Étape 4 : la dataviz */}` par une grille à deux colonnes : la carte à gauche, le
   graphique à droite. La colonne de droite est un conteneur qui accueillera aussi le panneau des
   favoris à l'étape 5.

   ```tsx
   <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
     <StationMap stations={stations} />
     <div className="grid content-start gap-4">
       <BikesChart stations={stations} />
     </div>
   </div>
   ```

   Le graphique reçoit les stations **déjà filtrées** : il suit donc les filtres de l'étape 3
   automatiquement.

> 💡 **Tester :** sans filtre, le top 10 commence par des arrondissements parisiens (le 15e est
> souvent en tête, c'est le plus grand). Filtrez sur « Électriques dispo » : la part bleue
> augmente. Filtrez sur une seule zone : il ne reste qu'une barre, à 100 % de largeur.

> 🧪 **Manip — combien de JavaScript ?** Ouvrez les DevTools, onglet **Réseau** (Network),
> filtre **JS**, puis rechargez la page. Lancez ensuite la recherche globale des DevTools
> (`Cmd+Option+F` sur Mac, `Ctrl+Shift+F` sous Windows/Linux) et cherchez `bikesByZone` : aucun
> résultat, car ce code n'existe que sur le serveur. Cherchez maintenant `CircleMarker` : il est
> bien dans le JavaScript téléchargé, car la carte est un composant client.

---

## ⭐ 5 — Les favoris avec une Server Action

> 🔴 **En autonomie.** Vous avez maintenant les bases. Cette étape ne fournit **pas de code** :
> un cahier des charges, des indices et des liens de doc. Reportez-vous au chapitre 11 du
> workshop (Mutating Data). `solution/` contient un exemple si vous bloquez.

**Le besoin :** l'utilisateur peut mettre une station en favori depuis sa bulle sur la carte, et
retrouver ses favoris dans un panneau à côté de la carte, avec leur nombre de vélos à jour. On ne
veut **pas de base de données** : les favoris sont stockés dans un **cookie** (`favorites=16107,14014`).

**Critères d'acceptation :**

- [ ] chaque bulle de la carte contient un bouton « ☆ Ajouter aux favoris » ou « ★ Retirer des
      favoris », selon l'état de la station ;
- [ ] le clic appelle une **Server Action** `toggleFavorite(formData)` qui ajoute ou retire l'id
      de la station dans le cookie ;
- [ ] un panneau « ★ Mes stations favorites » (composant serveur `favorites-list.tsx`) liste les
      favoris avec leur nombre de vélos, et un bouton « retirer » sur chacun ;
- [ ] les stations favorites sont mises en évidence sur la carte (par exemple un cercle violet,
      plus gros) ;
- [ ] les favoris restent affichés après un rechargement de la page, et ne dépendent pas des
      filtres actifs ;
- [ ] la Server Action **valide** ce qu'elle reçoit : un id vide ou qui n'est pas un code station
      (uniquement des chiffres) est ignoré.

**Indices :**

| Besoin | Piste |
|---|---|
| Lire le cookie côté serveur | `(await cookies()).get("favorites")?.value`, dans une fonction `getFavorites()` placée dans `lib/favorites.ts` |
| Écrire le cookie | `(await cookies()).set(...)`, **uniquement** possible dans une Server Action ou un Route Handler |
| Envoyer l'id de la station | Un `<form action={toggleFavorite}>` avec un `<input type="hidden" name="id" value={s.id} />` |
| Rafraîchir l'affichage | Rien à faire : quand une Server Action modifie un cookie, Next.js re-rend la page |
| Bouton dans la bulle | La carte est un composant client, mais elle **peut importer** une Server Action et la passer à `action` |
| Passer les favoris à la carte | Une nouvelle prop `favorites: string[]` sur `StationMap` |
| Panneau indépendant des filtres | Le panneau doit chercher les favoris dans `allStations`, pas dans `stations` (déjà filtrées) |

> ⚠️ **Piège de sécurité — ne mettez pas `getFavorites()` dans `app/actions.ts`.** Toute fonction
> exportée d'un fichier `"use server"` devient une **Server Action**, c'est-à-dire un point
> d'entrée que n'importe qui peut appeler par une requête HTTP. Ce fichier ne doit contenir que des
> mutations prévues pour être appelées depuis le navigateur. Les simples lectures vont dans `lib/`.

> 📖 [Server Actions — Updating data](https://nextjs.org/docs/app/getting-started/updating-data) ·
> [`cookies()`](https://nextjs.org/docs/app/api-reference/functions/cookies) ·
> [Chapitre 11 du workshop](https://nextjs.org/learn/dashboard-app/mutating-data)
>
> 💡 **Tester :** ouvrez une bulle, cliquez sur « ☆ Ajouter aux favoris ». La station apparaît
> dans le panneau et son cercle devient violet. Dans les DevTools, onglet **Application** >
> **Cookies**, vous voyez `favorites=<id>`. Rechargez : le favori est toujours là. Cliquez sur
> « retirer » : le panneau affiche à nouveau « Aucun favori ».

> ⚖️ **Un cookie, vraiment ?** C'est un raccourci pédagogique : pas de base de données, pas
> d'authentification. Un cookie est limité à environ 4 Ko et reste attaché à un navigateur. Dans
> un vrai projet, les favoris iraient en base, rattachés à l'utilisateur connecté (chapitre 14 du
> workshop). La Server Action, elle, resterait **identique** : seule la ligne qui écrit le cookie
> deviendrait une requête SQL.

---

## 🧪 6 — Les tests unitaires avec Vitest

L'appli fonctionne : on veut maintenant s'assurer qu'elle **continue** de fonctionner quand on la
modifie. On commence par la base de la pyramide des tests, les **tests unitaires**. Ils sont
rapides, ne lancent ni serveur ni navigateur, et visent les fonctions **pures** de `lib/velib.ts` :
elles prennent des données en entrée et renvoient un résultat, sans effet de bord.

| Ce qu'on teste en unitaire | Ce qu'on teste en E2E (étape 7) |
|---|---|
| `toStation`, `parseFilters`, `filterStations`, `bikesByZone` | Le parcours complet dans un vrai navigateur |
| Les composants **synchrones**, comme `<Kpis />` | Les composants serveur **async** (la page), la carte Leaflet, la Server Action |
| Des millisecondes, des dizaines de cas limites | Quelques secondes, quelques parcours clés |

> ℹ️ Pourquoi pas la page en test unitaire ? La doc Next.js le dit explicitement : Vitest ne sait
> pas (encore) rendre un composant serveur `async`. On les couvre donc en E2E.

### 6.a — Installer et configurer Vitest

On suit le [guide Vitest de Next.js](https://nextjs.org/docs/app/guides/testing/vitest).
Installez les dépendances de développement :

```bash
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/dom vite-tsconfig-paths
```

| Paquet | Rôle |
|---|---|
| `vitest` | Le lanceur de tests (compatible avec l'API de Jest, mais basé sur Vite, donc plus rapide) |
| `@vitejs/plugin-react` | Compile le JSX des composants testés |
| `jsdom` | Un faux DOM en Node.js, pour rendre un composant sans navigateur |
| `@testing-library/react` (+ `dom`) | `render()` et `screen` : on cherche dans le rendu comme le ferait un utilisateur |
| `vite-tsconfig-paths` | Fait comprendre l'alias `@/…` (défini dans `tsconfig.json`) à Vitest |

> ⚠️ **Piège — `npm error ERESOLVE could not resolve`.**
> - *Symptôme :* l'installation échoue avec `peerOptional @types/node@"^22.0.0 || >=24.0.0" from vitest`.
> - *Cause :* `create-next-app` installe `@types/node` en version 20, alors que Vitest 5 demande la 22 ou plus.
> - *Correctif :* le starter est déjà en `@types/node@22`, vous ne devriez pas le voir. Sur un projet
>   neuf, lancez d'abord `npm install -D @types/node@22`, puis relancez l'installation.

Créez ensuite le fichier `vitest.config.mts` à la racine du projet :

```ts
import { defineConfig, configDefaults } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "jsdom",
    // les tests E2E (Playwright) ne sont pas des tests Vitest
    exclude: [...configDefaults.exclude, "e2e/**"],
  },
});
```

Enfin, ajoutez ces deux scripts dans le bloc `"scripts"` de `package.json` (le second servira à
l'étape 7) :

```json
"test": "vitest",
"test:e2e": "playwright test"
```

### 6.b — Écrire les tests de `lib/velib.ts`

Créez `lib/velib.test.ts`. Le début est fourni : une petite **fabrique** `station()` qui construit
une station valide, dont chaque test ne précise que ce qui l'intéresse. Les tests de `toStation`
et `parseFilters` sont écrits, pour vous montrer le style.

🚧 **À compléter :** remplacez chaque `it.todo` par un vrai test.

```ts
import { describe, it, expect } from "vitest";
import { toStation, parseFilters, filterStations, bikesByZone, type RawStation, type Station } from "@/lib/velib";

// Petite "fabrique" : une station valide, dont on ne précise que ce qui compte pour le test.
function station(overrides: Partial<Station>): Station {
  return {
    id: "11001",
    name: "Station test",
    zone: "Paris 11e",
    lat: 48.85,
    lon: 2.37,
    capacity: 20,
    bikes: 5,
    mechanical: 3,
    ebikes: 2,
    docks: 15,
    updatedAt: "2026-10-08T10:00:00+00:00",
    ...overrides,
  };
}

describe("toStation", () => {
  const raw: RawStation = {
    stationcode: "16107",
    name: "Benjamin Godard - Victor Hugo",
    is_installed: "OUI",
    capacity: 35,
    numdocksavailable: 19,
    numbikesavailable: 16,
    mechanical: 8,
    ebike: 8,
    duedate: "2026-10-08T10:31:51+00:00",
    coordonnees_geo: { lon: 2.275725, lat: 48.865983 },
    nom_arrondissement_communes: "Paris",
  };

  it("déduit l'arrondissement du code station", () => {
    expect(toStation(raw).zone).toBe("Paris 16e");
  });

  it("écrit « 1er » pour le premier arrondissement", () => {
    expect(toStation({ ...raw, stationcode: "1020" }).zone).toBe("Paris 1er");
  });

  it("garde le nom de la commune hors de Paris", () => {
    expect(toStation({ ...raw, nom_arrondissement_communes: "Montreuil" }).zone).toBe("Montreuil");
  });
});

describe("parseFilters", () => {
  it("renvoie des filtres vides quand l'URL n'a pas de paramètres", () => {
    expect(parseFilters({})).toEqual({ q: "", zone: "", minBikes: 0, ebikeOnly: false });
  });

  it("convertit les chaînes de l'URL en valeurs typées", () => {
    expect(parseFilters({ q: " bastille ", zone: "Paris 11e", minBikes: "5", ebike: "on" })).toEqual({
      q: "bastille",
      zone: "Paris 11e",
      minBikes: 5,
      ebikeOnly: true,
    });
  });
});

describe("filterStations", () => {
  // 3 stations choisies pour que chaque filtre en écarte au moins une
  const stations = [
    station({ id: "1", name: "Place de la Bastille", zone: "Paris 11e", bikes: 10, ebikes: 0 }),
    station({ id: "2", name: "Bastille - Biscornet", zone: "Paris 12e", bikes: 2, ebikes: 1 }),
    station({ id: "3", name: "République", zone: "Paris 11e", bikes: 0, ebikes: 0 }),
  ];
  const none = parseFilters({}); // aucun filtre

  it("renvoie tout sans filtre", () => {
    expect(filterStations(stations, none)).toHaveLength(3);
  });

  it.todo("filtre sur le nom sans tenir compte de la casse"); // q: "BASTILLE" -> ids ["1", "2"]
  it.todo("combine les filtres (nom + zone)"); // q: "bastille" + zone: "Paris 11e" -> ["1"]
  it.todo("applique le minimum de vélos et le filtre électrique"); // minBikes: 5 -> ["1"] ; ebikeOnly -> ["2"]
});

describe("bikesByZone", () => {
  const stations = [
    station({ zone: "Paris 11e", bikes: 5, mechanical: 3, ebikes: 2 }),
    station({ zone: "Paris 12e", bikes: 20, mechanical: 15, ebikes: 5 }),
    station({ zone: "Paris 11e", bikes: 4, mechanical: 4, ebikes: 0 }),
  ];

  it.todo("additionne les vélos par zone et trie par ordre décroissant"); // 12e (20) puis 11e (9)
  it.todo("ne garde que les `top` premières zones");
  it.todo("renvoie un tableau vide sans station");
});
```

| Matcher | Quand l'utiliser |
|---|---|
| `toBe(x)` | Une valeur simple (nombre, chaîne, booléen) |
| `toEqual(obj)` | Un objet ou un tableau, comparé **en profondeur** |
| `toHaveLength(n)` | La taille d'un tableau |

> 💡 Pour comparer des listes de stations, comparez plutôt leurs ids :
> `filterStations(...).map((s) => s.id)`. Le message d'erreur sera bien plus lisible.

### 6.c — Tester un composant : `<Kpis />`

`<Kpis />` est un composant serveur, mais **synchrone** : Testing Library sait donc le rendre.
Créez `app/components/kpis.test.tsx` :

```tsx
import { afterEach, describe, it, expect } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import Kpis from "@/app/components/kpis";
import type { Station } from "@/lib/velib";

afterEach(cleanup); // vide le DOM entre deux tests

const base: Station = {
  id: "1", name: "A", zone: "Paris 11e", lat: 0, lon: 0,
  capacity: 20, bikes: 0, mechanical: 0, ebikes: 0, docks: 20, updatedAt: "",
};

describe("<Kpis />", () => {
  it("affiche les totaux des stations reçues", () => {
    render(
      <Kpis
        stations={[
          { ...base, id: "1", bikes: 10, mechanical: 7, ebikes: 3 },
          { ...base, id: "2", bikes: 0 },
        ]}
      />,
    );

    // la valeur est dans la <div> qui suit le libellé
    expect(screen.getByText("Stations").nextSibling?.textContent).toBe("2");
    // TODO : vérifier « Vélos disponibles » (10), « dont électriques » (3) et « Stations vides » (1)
  });
});
```

> 📖 [Guide Vitest de Next.js](https://nextjs.org/docs/app/guides/testing/vitest) ·
> [API `expect` de Vitest](https://vitest.dev/api/expect.html) ·
> [Testing Library — Queries](https://testing-library.com/docs/queries/about)
>
> 💡 **Tester :** `npm test` lance Vitest en mode surveillance (il relance les tests à chaque
> sauvegarde, `q` pour quitter). Avec le squelette tel quel, vous lisez
> `Tests  7 passed | 6 todo (13)` : les `it.todo` sont listés mais pas exécutés. Une fois tous les
> `it.todo` remplacés, vous devez lire :
> ```
>  Test Files  2 passed (2)
>       Tests  13 passed (13)
> ```

> 🧪 **Manip — un test doit pouvoir échouer.** Dans `filterStations()`, supprimez temporairement le
> `.toLowerCase()` appliqué au nom de la station. Sauvegardez : le test « sans tenir compte de la
> casse » passe au rouge et Vitest affiche les ids attendus et reçus. Remettez le code en place.
> Un test qu'on n'a jamais vu échouer ne prouve pas grand-chose.

---

## 🎭 7 — Le test de bout en bout avec Playwright

> 🟡 **Semi-guidé.** La configuration est fournie. Le premier test est à compléter, le second est
> à écrire à partir d'indices.

Un test **E2E** (*end-to-end*, de bout en bout) pilote un **vrai navigateur**, comme le ferait un
utilisateur : il remplit le formulaire, clique sur la carte, vérifie ce qui s'affiche. C'est le
seul moyen de tester ensemble la page serveur, la carte Leaflet et la Server Action.

Voici le scénario qu'on va automatiser :

1. chercher « Bastille » dans la zone « Paris 11e » ;
2. vérifier les indicateurs : **1** station, **45** vélos, **8** électriques, **0** station vide ;
3. cliquer sur la station de la carte, l'ajouter aux favoris, puis la retirer.

> ⚠️ **Pourquoi 45 vélos, alors que vous voyez autre chose en ce moment ?** Avec les données en
> temps réel, la même recherche donne par exemple 50 vélos, puis 47 dix minutes plus tard. Un test
> qui dépend de données qui bougent échouera au hasard : on dit qu'il est **instable** (*flaky*).
> On lance donc l'appli en **mode hors ligne** (`VELIB_OFFLINE=1`) pendant les tests : les données
> viennent du snapshot et sont toujours les mêmes. C'est l'intérêt d'avoir prévu ce mode dès
> l'étape 1.

### 7.a — Installer et configurer Playwright

```bash
npm install -D @playwright/test
npx playwright install chromium
```

La seconde commande télécharge le navigateur Chromium utilisé par Playwright (environ 100 Mo, une
seule fois par machine).

Créez `playwright.config.ts` à la racine du projet :

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  use: {
    baseURL: "http://localhost:3100",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // Playwright construit et démarre lui-même l'appli (build de prod), en mode hors ligne :
  // les données viennent du snapshot, elles sont donc toujours les mêmes.
  webServer: {
    command: "npm run build && npm run start -- --port 3100",
    url: "http://localhost:3100",
    env: { VELIB_OFFLINE: "1" },
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
```

| Option | Rôle |
|---|---|
| `testDir` | Le dossier des tests E2E (séparé des tests Vitest) |
| `baseURL` | Permet d'écrire `page.goto("/")` au lieu de l'URL complète |
| `webServer.command` | Playwright lance l'appli lui-même avant les tests, puis l'arrête |
| `webServer.env` | Les variables d'environnement de l'appli lancée : ici le mode hors ligne |
| `reuseExistingServer` | En local, si le port 3100 répond déjà, Playwright réutilise ce serveur |

> ℹ️ **Pourquoi un build de prod sur le port 3100, et pas `npm run dev` ?** Next.js 16 refuse de
> lancer deux `next dev` dans le même projet (`⨯ Another next dev server is already running.`).
> Or votre `npm run dev` tourne sûrement déjà sur le port 3000, avec les données en temps réel. Un
> `build` + `start` cohabite sans problème avec lui. En plus, il teste l'appli telle qu'elle sera
> déployée, ce qui est aussi ce que fera une CI.

### 7.b — Rendre l'appli facile à tester

Playwright recommande de chercher les éléments **comme un utilisateur** : par leur rôle et leur
texte accessible (`getByRole`, `getByLabel`), plutôt que par une classe CSS. Notre appli s'y
prête déjà en grande partie :

| Élément | Comment le test le trouve | Pourquoi ça marche |
|---|---|---|
| Champ « Nom de station » | `page.getByLabel("Nom de station")` | Le `<input>` est **dans** son `<label>` |
| Bouton « Filtrer » | `page.getByRole("button", { name: "Filtrer" })` | Le texte du bouton est son nom accessible |
| Panneau des favoris | `page.getByRole("region", { name: /Mes stations favorites/ })` | ⚠️ seulement si la `<section>` a un nom accessible (voir ci-dessous) |
| Marqueur de la carte | `page.locator("path.leaflet-interactive")` | Exception : un cercle Leaflet est un `<path>` SVG sans rôle, on passe par sa classe |

🚧 **À compléter :** dans `app/components/favorites-list.tsx`, reliez la `<section>` à son titre.
Sans nom, une `<section>` n'a pas le rôle `region`, et ni un lecteur d'écran ni Playwright ne peut
la désigner (vous retrouvez ici le chapitre 13 sur l'accessibilité) :

```tsx
<section aria-labelledby="favorites-title" className="rounded-lg bg-white p-4 shadow-sm">
  <h2 id="favorites-title" className="mb-2 font-semibold">★ Mes stations favorites</h2>
```

> ℹ️ Le test s'appuie sur les textes de l'appli (« Ajouter aux favoris », « Retirer des favoris »,
> « Aucun favori »). Si vous avez choisi d'autres libellés à l'étape 5, adaptez le test.

### 7.c — Écrire le scénario

Créez le dossier `e2e/` et, dedans, le fichier `e2e/stations.spec.ts`. Le fichier contient deux
tests : le premier ne dépend que des étapes 1 à 4, le second a besoin des favoris de l'étape 5.

🚧 **À compléter :**

```ts
import { test, expect, type Page } from "@playwright/test";

const STATION = "Richard Lenoir - Place de la Bastille";

/** La valeur affichée dans la tuile d'indicateur qui porte ce libellé. */
function kpi(page: Page, label: string) {
  return page.getByText(label, { exact: true }).locator("xpath=following-sibling::div");
}

test("filtrer sur Bastille dans le 11e met à jour l'URL, les indicateurs et la carte", async ({ page }) => {
  await page.goto("/");

  // 1. Remplir et soumettre le formulaire
  await page.getByLabel("Nom de station").fill("Bastille");
  // TODO : choisir « Paris 11e » dans le champ « Zone » (selectOption)
  await page.getByRole("button", { name: "Filtrer" }).click();

  // 2. Les filtres sont dans l'URL
  await expect(page).toHaveURL(/q=Bastille/);
  // TODO : vérifier que l'URL contient aussi la zone (attention, l'espace devient un « + »)

  // 3. Les indicateurs (valeurs du snapshot)
  await expect(kpi(page, "Stations")).toHaveText("1");
  // TODO : « Vélos disponibles » = 45, « dont électriques » = 8, « Stations vides » = 0

  // 4. Une seule station sur la carte, et sa bulle
  await expect(page.locator("path.leaflet-interactive")).toHaveCount(1);
  await page.locator("path.leaflet-interactive").click();
  // TODO : vérifier que la bulle (".leaflet-popup") contient le nom de la station
});

test("ajouter puis retirer une station des favoris", async ({ page }) => {
  // On arrive directement sur la vue filtrée : l'URL suffit à reconstruire l'état
  await page.goto("/?q=Bastille&zone=Paris+11e");
  const favorites = page.getByRole("region", { name: /Mes stations favorites/ });
  await expect(favorites).toContainText("Aucun favori");

  // TODO 1 : ouvrir la bulle, cliquer sur « Ajouter aux favoris »,
  //          vérifier que le panneau contient STATION
  // TODO 2 : vérifier le cookie : page.context().cookies() doit contenir { name: "favorites", value: "11001" }
  // TODO 3 : recharger la page (page.reload()) et vérifier que le favori est toujours là
  // TODO 4 : rouvrir la bulle, cliquer sur « Retirer des favoris », vérifier « Aucun favori »
});
```

| API Playwright | Rôle |
|---|---|
| `page.goto(url)` | Ouvre une page (relative à `baseURL`) |
| `locator.fill(texte)` / `locator.selectOption(valeur)` / `locator.click()` | Les actions de l'utilisateur |
| `expect(locator).toHaveText(...)` / `.toContainText(...)` / `.toHaveCount(n)` | Des assertions qui **attendent** (jusqu'à 5 s) que la condition soit vraie |
| `expect(page).toHaveURL(regex)` | Vérifie l'URL courante |
| `popup.getByRole("button", { name: /Ajouter/ })` | Cherche **à l'intérieur** d'un autre locator |

> 💡 Les assertions `expect(locator)` **réessayent** automatiquement : pas besoin d'attendre à la
> main que la Server Action ait fini et que la page soit re-rendue. C'est pour cela qu'on n'écrit
> jamais de `waitForTimeout(2000)`.

> 📖 [Guide Playwright de Next.js](https://nextjs.org/docs/app/guides/testing/playwright) ·
> [Locators](https://playwright.dev/docs/locators) ·
> [Assertions](https://playwright.dev/docs/test-assertions) ·
> [`webServer`](https://playwright.dev/docs/test-webserver)
>
> 💡 **Tester :** `npm run test:e2e`. Playwright commence par le build (quelques secondes),
> puis lance les tests :
> ```
> Running 2 tests using 1 worker
>   ✓  1 [chromium] › e2e/stations.spec.ts:10:5 › filtrer sur Bastille dans le 11e met à jour l'URL, les indicateurs et la carte
>   ✓  2 [chromium] › e2e/stations.spec.ts:34:5 › ajouter puis retirer une station des favoris
>   2 passed
> ```
> Tant que le `TODO` du choix de la zone n'est pas fait, le premier test échoue sur
> `kpi(page, "Stations")` : il trouve 5 stations « Bastille » (dans les 4e, 11e et 12e) au lieu
> d'une seule. C'est normal, et c'est une bonne occasion de lire un rapport d'échec Playwright.
> Pour **voir** le navigateur travailler, lancez `npx playwright test --ui`.

> ℹ️ Chaque test s'exécute dans son **propre contexte de navigateur**, avec ses propres cookies,
> comme une fenêtre de navigation privée neuve. Un favori ajouté par un test ne pollue donc jamais
> un autre test : chacun repart d'un état vide.

---

## 🎉 Challenge final

- [ ] la page affiche les ~1 500 stations, venues de l'API (ou du snapshot hors ligne) ;
- [ ] la carte s'affiche sans erreur `window is not defined` ;
- [ ] les 4 filtres fonctionnent, sont dans l'URL, et une URL copiée redonne la même vue ;
- [ ] les indicateurs et le top 10 suivent les filtres ;
- [ ] les favoris s'ajoutent et se retirent depuis la carte, et survivent au rechargement ;
- [ ] `npm run build` passe sans erreur ;
- [ ] `npm test` : les 13 tests unitaires passent ;
- [ ] `npm run test:e2e` : les 2 scénarios Playwright passent.

## ✅ Bonus

Les bonus ne sont **pas** dans `solution/`. Choisissez selon votre envie.

1. **Recherche pendant la frappe :** remplacez le champ « Nom de station » par un composant client
   qui met à jour l'URL avec `useRouter().replace()` et un délai de 300 ms (comme `search.tsx` du
   workshop).
2. **Zoom automatique :** quand on filtre sur une zone, recentrez la carte sur ses stations. Le
   hook `useMap()` de react-leaflet donne accès à l'instance Leaflet, et `map.fitBounds(...)`
   cadre un ensemble de points.
3. **Une API GeoJSON :** exposez les stations au format GeoJSON dans un Route Handler
   `app/api/stations/route.ts`. N'importe quel outil SIG (QGIS, MapLibre, OpenLayers) pourra alors
   les consommer. 📖 [Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers)
4. **Un graphique interactif :** refaites le top 10 avec [Recharts](https://recharts.org/) (avec
   info-bulles au survol). C'est un composant client : comparez le poids du JavaScript chargé avec
   la version serveur.
5. **Une page détail :** une route `/stations/[id]`, accessible depuis la bulle, avec
   `notFound()` si l'id n'existe pas et un `error.tsx` (chapitre 12 du workshop).
6. **Des composants shadcn/ui :** remplacez le `<select>` et les boutons par ceux de
   [shadcn/ui](https://ui.shadcn.com/docs/installation/next).

## Récap

- **Le serveur prépare, le client affiche.** Les données, le cache, les filtres et les calculs
  restent sur le serveur. Seule la carte, qui a besoin du navigateur, est un composant client.
- **`"use client"` ne suffit pas pour une bibliothèque qui touche à `window` :** le composant est
  quand même pré-rendu côté serveur. Il faut `dynamic(..., { ssr: false })`, déclaré dans un
  composant client.
- **L'URL est un état :** des filtres dans `searchParams` sont partageables, survivent au
  rechargement et ne demandent aucun `useState`.
- **Une dataviz simple n'a pas besoin de bibliothèque :** calculée et rendue sur le serveur, elle
  n'envoie aucun JavaScript.
- **Une Server Action est un point d'entrée public :** elle sert aux mutations (ici le cookie des
  favoris), et rien d'autre ne doit être exporté depuis un fichier `"use server"`.
- **Chaque niveau de test a son rôle :** Vitest pour les fonctions pures et les composants
  synchrones (rapide, nombreux cas), Playwright pour les parcours qui traversent serveur, carte et
  Server Action. Un test E2E fiable a besoin de **données figées**.
