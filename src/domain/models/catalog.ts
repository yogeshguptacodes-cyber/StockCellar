/**
 * Catalog entities. Each item is one ROW on the register sheet — sizes are
 * columns of the row, not separate SKUs.
 */
export interface Category {
  readonly id: string;
  readonly name: string;
}

export interface LiquorItem {
  readonly id: string;
  /** Display name exactly as written on the register, e.g. "Blenders Pride". */
  readonly name: string;
  readonly categoryId: string;
}
