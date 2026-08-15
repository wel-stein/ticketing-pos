// ManjaLink Counter Inventory and Sales System — static option lists
// (SRS HISB/CR/00130: merchandise sales at ManjaLink counters)
//
// Products, counters, staff, transactions and stock movements now live in
// dbmanjapos and arrive through the API. Only the fixed enumerations below —
// the ones with no database table behind them — remain client-side.
//
// Categories and units of measure ARE stored in the database and come back
// from GET /api/lookups; these copies are the fallback used before that
// response lands.

export const CATEGORIES = [
  'Souvenirs',
  'Mini Bus Models',
  'Manja SIM',
  'Promotional Items',
  'Others',
]

export const UNITS_OF_MEASURE = ['Unit', 'Pack', 'Box', 'Set']

export const STOCK_OUT_REASONS = [
  'Damaged',
  'Expired',
  'Promotion Giveaway',
  'Internal Usage',
  'Lost Item',
  'Stock Adjustment',
  'Others',
]

// Transfer Out sends stock away from the counter (to HQ or another counter)
// and decreases the balance; the other two types bring stock back in.
export const RETURN_TYPES = ['Customer Return', 'Counter Return', 'Transfer Out']
