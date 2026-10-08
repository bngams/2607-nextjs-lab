import { afterEach, describe, it, expect } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import Kpis from "@/app/components/kpis";
import type { Station } from "@/lib/velib";

afterEach(cleanup);

const base: Station = {
  id: "1",
  name: "A",
  zone: "Paris 11e",
  lat: 0,
  lon: 0,
  capacity: 20,
  bikes: 0,
  mechanical: 0,
  ebikes: 0,
  docks: 20,
  updatedAt: "",
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

    expect(screen.getByText("Stations").nextSibling?.textContent).toBe("2");
    expect(screen.getByText("Vélos disponibles").nextSibling?.textContent).toBe("10");
    expect(screen.getByText("dont électriques").nextSibling?.textContent).toBe("3");
    expect(screen.getByText("Stations vides").nextSibling?.textContent).toBe("1");
  });
});
