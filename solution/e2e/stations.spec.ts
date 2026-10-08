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
  await page.getByLabel("Zone").selectOption("Paris 11e");
  await page.getByRole("button", { name: "Filtrer" }).click();

  // 2. Les filtres sont dans l'URL
  await expect(page).toHaveURL(/q=Bastille/);
  await expect(page).toHaveURL(/zone=Paris\+11e/);

  // 3. Les indicateurs (valeurs du snapshot)
  await expect(kpi(page, "Stations")).toHaveText("1");
  await expect(kpi(page, "Vélos disponibles")).toHaveText("45");
  await expect(kpi(page, "dont électriques")).toHaveText("8");
  await expect(kpi(page, "Stations vides")).toHaveText("0");

  // 4. Une seule station sur la carte, et sa bulle
  await expect(page.locator("path.leaflet-interactive")).toHaveCount(1);
  await page.locator("path.leaflet-interactive").click();
  await expect(page.locator(".leaflet-popup")).toContainText(STATION);
});

test("ajouter puis retirer une station des favoris", async ({ page }) => {
  // On arrive directement sur la vue filtrée : l'URL suffit à reconstruire l'état
  await page.goto("/?q=Bastille&zone=Paris+11e");
  const favorites = page.getByRole("region", { name: /Mes stations favorites/ });
  await expect(favorites).toContainText("Aucun favori");

  // 1. Ajouter depuis la bulle
  await page.locator("path.leaflet-interactive").click();
  await page.locator(".leaflet-popup").getByRole("button", { name: /Ajouter aux favoris/ }).click();
  await expect(favorites).toContainText(STATION);
  expect(await page.context().cookies()).toContainEqual(
    expect.objectContaining({ name: "favorites", value: "11001" }),
  );

  // 2. Le favori survit au rechargement
  await page.reload();
  await expect(favorites).toContainText(STATION);

  // 3. Retirer depuis la bulle
  await page.locator("path.leaflet-interactive").click();
  await page.locator(".leaflet-popup").getByRole("button", { name: /Retirer des favoris/ }).click();
  await expect(favorites).toContainText("Aucun favori");
});
