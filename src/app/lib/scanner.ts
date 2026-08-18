// src/lib/scanner.ts

export async function pobierzProduktPoKodzie(barcode: string) {
  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
    const data = await res.json();

    if (data.status !== 1 || !data.product) {
      throw new Error("Nie znaleziono produktu o takim kodzie w bazie.");
    }

    const p = data.product;
    const nutriments = p.nutriments || {};

    // Zwracamy czyste, przefiltrowane dane na 100g produktu
    return {
      nazwa: p.product_name || p.product_name_pl || "Produkt bez nazwy",
      marka: p.brands || "",
      kodKreskowy: barcode,
      // Wartości na 100g (zabezpieczenie przed brakami w bazie za pomocą || 0)
      kalorieNa100g: nutriments['energy-kcal_100g'] || nutriments['energy-kcal'] || 0,
      bialkoNa100g: nutriments['proteins_100g'] || 0,
      weglowodanyNa100g: nutriments['carbohydrates_100g'] || 0,
      tluszczeNa100g: nutriments['fat_100g'] || 0,
      zdjecieUrl: p.image_front_url || "",
    };
  } catch (error: any) {
    throw new Error(error.message || "Błąd podczas pobierania danych produktu.");
  }
}