import type { Bottle, Category } from '@/domain/models';

/**
 * Seed catalog for v1. Replaced by backend data in v2 — the repository
 * interface hides the difference from the rest of the app.
 */
export const seedCategories: readonly Category[] = [
  { id: 'cat-red-wine', name: 'Red Wine' },
  { id: 'cat-white-wine', name: 'White Wine' },
  { id: 'cat-sparkling', name: 'Sparkling' },
  { id: 'cat-whiskey', name: 'Whiskey' },
  { id: 'cat-vodka', name: 'Vodka' },
  { id: 'cat-gin', name: 'Gin' },
  { id: 'cat-rum', name: 'Rum' },
  { id: 'cat-tequila', name: 'Tequila' },
  { id: 'cat-liqueur', name: 'Liqueur' },
  { id: 'cat-beer', name: 'Beer' },
];

export const seedBottles: readonly Bottle[] = [
  // Red wine
  { id: 'b-001', name: 'Cabernet Sauvignon Reserve', brand: 'Sula', categoryId: 'cat-red-wine', sizeMl: 750 },
  { id: 'b-002', name: 'Shiraz', brand: 'Jacob’s Creek', categoryId: 'cat-red-wine', sizeMl: 750 },
  { id: 'b-003', name: 'Malbec', brand: 'Trapiche', categoryId: 'cat-red-wine', sizeMl: 750 },
  { id: 'b-004', name: 'Pinot Noir', brand: 'Fratelli', categoryId: 'cat-red-wine', sizeMl: 750 },
  // White wine
  { id: 'b-005', name: 'Sauvignon Blanc', brand: 'Sula', categoryId: 'cat-white-wine', sizeMl: 750 },
  { id: 'b-006', name: 'Chardonnay', brand: 'Grover Zampa', categoryId: 'cat-white-wine', sizeMl: 750 },
  { id: 'b-007', name: 'Riesling', brand: 'Jacob’s Creek', categoryId: 'cat-white-wine', sizeMl: 750 },
  // Sparkling
  { id: 'b-008', name: 'Brut', brand: 'Chandon', categoryId: 'cat-sparkling', sizeMl: 750 },
  { id: 'b-009', name: 'Prosecco', brand: 'Zonin', categoryId: 'cat-sparkling', sizeMl: 750 },
  { id: 'b-010', name: 'Brut Rosé', brand: 'Sula', categoryId: 'cat-sparkling', sizeMl: 750 },
  // Whiskey
  { id: 'b-011', name: 'Black Label', brand: 'Johnnie Walker', categoryId: 'cat-whiskey', sizeMl: 750 },
  { id: 'b-012', name: 'Single Malt 12Y', brand: 'Glenfiddich', categoryId: 'cat-whiskey', sizeMl: 700 },
  { id: 'b-013', name: 'Bourbon', brand: 'Jim Beam', categoryId: 'cat-whiskey', sizeMl: 750 },
  { id: 'b-014', name: 'Tennessee Whiskey', brand: 'Jack Daniel’s', categoryId: 'cat-whiskey', sizeMl: 1000 },
  { id: 'b-015', name: 'Blended Scotch', brand: 'Chivas Regal', categoryId: 'cat-whiskey', sizeMl: 750 },
  { id: 'b-016', name: 'Indian Single Malt', brand: 'Amrut', categoryId: 'cat-whiskey', sizeMl: 700 },
  // Vodka
  { id: 'b-017', name: 'Classic', brand: 'Absolut', categoryId: 'cat-vodka', sizeMl: 750 },
  { id: 'b-018', name: 'Gold', brand: 'Smirnoff', categoryId: 'cat-vodka', sizeMl: 750 },
  { id: 'b-019', name: 'Premium', brand: 'Grey Goose', categoryId: 'cat-vodka', sizeMl: 750 },
  { id: 'b-020', name: 'Citron', brand: 'Absolut', categoryId: 'cat-vodka', sizeMl: 1000 },
  // Gin
  { id: 'b-021', name: 'London Dry', brand: 'Bombay Sapphire', categoryId: 'cat-gin', sizeMl: 750 },
  { id: 'b-022', name: 'Pink Gin', brand: 'Gordon’s', categoryId: 'cat-gin', sizeMl: 750 },
  { id: 'b-023', name: 'Craft Gin', brand: 'Greater Than', categoryId: 'cat-gin', sizeMl: 750 },
  // Rum
  { id: 'b-024', name: 'Dark Rum', brand: 'Old Monk', categoryId: 'cat-rum', sizeMl: 750 },
  { id: 'b-025', name: 'White Rum', brand: 'Bacardi', categoryId: 'cat-rum', sizeMl: 750 },
  { id: 'b-026', name: 'Spiced Rum', brand: 'Captain Morgan', categoryId: 'cat-rum', sizeMl: 750 },
  // Tequila
  { id: 'b-027', name: 'Silver', brand: 'Jose Cuervo', categoryId: 'cat-tequila', sizeMl: 750 },
  { id: 'b-028', name: 'Reposado', brand: 'Don Julio', categoryId: 'cat-tequila', sizeMl: 750 },
  // Liqueur
  { id: 'b-029', name: 'Irish Cream', brand: 'Baileys', categoryId: 'cat-liqueur', sizeMl: 750 },
  { id: 'b-030', name: 'Coffee Liqueur', brand: 'Kahlúa', categoryId: 'cat-liqueur', sizeMl: 750 },
  { id: 'b-031', name: 'Orange Liqueur', brand: 'Cointreau', categoryId: 'cat-liqueur', sizeMl: 700 },
  { id: 'b-032', name: 'Herbal Liqueur', brand: 'Jägermeister', categoryId: 'cat-liqueur', sizeMl: 700 },
  // Beer
  { id: 'b-033', name: 'Premium Lager', brand: 'Kingfisher', categoryId: 'cat-beer', sizeMl: 650 },
  { id: 'b-034', name: 'Wheat Beer', brand: 'Hoegaarden', categoryId: 'cat-beer', sizeMl: 330 },
  { id: 'b-035', name: 'Strong Lager', brand: 'Carlsberg Elephant', categoryId: 'cat-beer', sizeMl: 500 },
  { id: 'b-036', name: 'IPA', brand: 'Bira 91', categoryId: 'cat-beer', sizeMl: 330 },
];
