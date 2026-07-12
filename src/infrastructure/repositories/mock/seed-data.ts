import type { Category, LiquorItem } from '@/domain/models';

/**
 * Seed catalog transcribed from the bar's physical register sheet (PS-3).
 * Row order mirrors the sheet so counting flows top-to-bottom like paper.
 * Replaced by backend data in v2.
 */
export const seedCategories: readonly Category[] = [
  { id: 'cat-whisky', name: 'Whisky' },
  { id: 'cat-vodka', name: 'Vodka' },
  { id: 'cat-rum', name: 'Rum' },
  { id: 'cat-other', name: 'Other' },
];

const whisky = (id: string, name: string): LiquorItem => ({ id, name, categoryId: 'cat-whisky' });
const vodka = (id: string, name: string): LiquorItem => ({ id, name, categoryId: 'cat-vodka' });
const rum = (id: string, name: string): LiquorItem => ({ id, name, categoryId: 'cat-rum' });

export const seedItems: readonly LiquorItem[] = [
  whisky('li-001', '100 Pipers'),
  whisky('li-002', '100 Pipers 8 Year'),
  whisky('li-003', 'Ballantine’s 7 Year'),
  whisky('li-004', 'Chivas Regal'),
  whisky('li-005', 'Black Dog Deluxe'),
  whisky('li-006', 'Black Dog Centenary'),
  whisky('li-007', 'Black & White'),
  whisky('li-008', 'Red Label'),
  whisky('li-009', 'Teacher’s 50'),
  whisky('li-010', 'Teacher’s Highland Cream'),
  whisky('li-011', 'William Lawson’s'),
  whisky('li-012', 'Dewar’s Label'),
  whisky('li-013', 'Vat 69'),
  whisky('li-014', 'Royal Ranthambore'),
  whisky('li-015', 'Antiquity Blue'),
  whisky('li-016', 'Jameson Whiskey'),
  whisky('li-017', 'Oaken Glow'),
  whisky('li-018', 'Blenders Pride'),
  whisky('li-019', 'Blenders Reserve'),
  whisky('li-020', 'Sterling Reserve B10'),
  whisky('li-021', 'Sterling Reserve B7'),
  whisky('li-022', 'B7 Happy'),
  whisky('li-023', 'B7 Cola'),
  whisky('li-024', 'Imperial Blue'),
  whisky('li-025', 'McDowell’s No.1'),
  whisky('li-026', 'Oaksmith Gold'),
  whisky('li-027', 'Oaksmith Whisky'),
  whisky('li-028', 'OC Blue'),
  whisky('li-029', 'Royal Stag Barrel Select'),
  whisky('li-030', 'Royal Stag'),
  whisky('li-031', 'Royal Green'),
  whisky('li-032', 'RC American Pride'),
  whisky('li-033', 'Royal Challenge'),
  whisky('li-034', 'Rockford Classic'),
  whisky('li-035', 'Rockford Reserve'),
  whisky('li-036', 'Signature'),
  whisky('li-037', 'Signature Premier'),
  whisky('li-038', 'White & Blue'),
  whisky('li-039', 'Iconiq White'),
  vodka('li-040', 'Absolut Vodka'),
  vodka('li-041', 'Absolut Flavour'),
  vodka('li-042', 'Grand Master'),
  vodka('li-043', 'Grand Master Flavour'),
  vodka('li-044', 'Magic Moments Vodka'),
  vodka('li-045', 'Magic Moments Flavour'),
  vodka('li-046', 'Romanov Vodka'),
  vodka('li-047', 'Smirnoff Vodka'),
  vodka('li-048', 'Smirnoff Flavour'),
  rum('li-049', 'Bacardi Black'),
  rum('li-050', 'Bacardi Rum'),
  rum('li-051', 'Bacardi Flavour'),
  rum('li-052', 'Old Monk Legend'),
  rum('li-053', 'Old Monk White Rum'),
  rum('li-054', 'Old Monk Lemon'),
  rum('li-055', 'RR Rum'),
];
