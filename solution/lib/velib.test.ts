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
  const stations = [
    station({ id: "1", name: "Place de la Bastille", zone: "Paris 11e", bikes: 10, ebikes: 0 }),
    station({ id: "2", name: "Bastille - Biscornet", zone: "Paris 12e", bikes: 2, ebikes: 1 }),
    station({ id: "3", name: "République", zone: "Paris 11e", bikes: 0, ebikes: 0 }),
  ];
  const none = parseFilters({});

  it("renvoie tout sans filtre", () => {
    expect(filterStations(stations, none)).toHaveLength(3);
  });

  it("filtre sur le nom sans tenir compte de la casse", () => {
    const ids = filterStations(stations, { ...none, q: "BASTILLE" }).map((s) => s.id);
    expect(ids).toEqual(["1", "2"]);
  });

  it("combine les filtres (nom + zone)", () => {
    const ids = filterStations(stations, { ...none, q: "bastille", zone: "Paris 11e" }).map((s) => s.id);
    expect(ids).toEqual(["1"]);
  });

  it("applique le minimum de vélos et le filtre électrique", () => {
    expect(filterStations(stations, { ...none, minBikes: 5 }).map((s) => s.id)).toEqual(["1"]);
    expect(filterStations(stations, { ...none, ebikeOnly: true }).map((s) => s.id)).toEqual(["2"]);
  });
});

describe("bikesByZone", () => {
  const stations = [
    station({ zone: "Paris 11e", bikes: 5, mechanical: 3, ebikes: 2 }),
    station({ zone: "Paris 12e", bikes: 20, mechanical: 15, ebikes: 5 }),
    station({ zone: "Paris 11e", bikes: 4, mechanical: 4, ebikes: 0 }),
  ];

  it("additionne les vélos par zone et trie par ordre décroissant", () => {
    expect(bikesByZone(stations)).toEqual([
      { zone: "Paris 12e", bikes: 20, mechanical: 15, ebikes: 5 },
      { zone: "Paris 11e", bikes: 9, mechanical: 7, ebikes: 2 },
    ]);
  });

  it("ne garde que les `top` premières zones", () => {
    expect(bikesByZone(stations, 1).map((z) => z.zone)).toEqual(["Paris 12e"]);
  });

  it("renvoie un tableau vide sans station", () => {
    expect(bikesByZone([])).toEqual([]);
  });
});
