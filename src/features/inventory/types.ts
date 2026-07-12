import type { EditableStockField } from '@/domain/models';

/** The six ledger tabs on the register screen, in sheet order. */
export type RegisterTab = EditableStockField | 'total' | 'balance' | 'amount';

export const REGISTER_TABS: readonly { key: RegisterTab; label: string; editable: boolean }[] = [
  { key: 'opening', label: 'Opening', editable: true },
  { key: 'received', label: 'Received', editable: true },
  { key: 'total', label: 'Total', editable: false },
  { key: 'sale', label: 'Sale', editable: true },
  { key: 'balance', label: 'Balance', editable: false },
  { key: 'amount', label: 'Amount ₹', editable: true },
];
