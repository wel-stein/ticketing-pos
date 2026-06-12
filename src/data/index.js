// ManjaLink Counter Inventory and Sales System — seed data
// (SRS HISB/CR/00130: merchandise sales at ManjaLink counters)

export const CURRENT_USER = { id: 'STF-004', name: 'John Doe', initials: 'JD', role: 'Counter Staff' }
export const CURRENT_COUNTER = 'KL Sentral (Counter 04)'

export const SEED_COUNTERS = [
  { id: 'c1', code: 'C04', name: 'KL Sentral (Counter 04)', location: 'KL Sentral Station, Kuala Lumpur', status: 'Active' },
  { id: 'c2', code: 'C09', name: 'TBS (Counter 09)', location: 'Terminal Bersepadu Selatan, Kuala Lumpur', status: 'Active' },
  { id: 'c3', code: 'C12', name: 'Penang Sentral (Counter 12)', location: 'Penang Sentral, Butterworth', status: 'Active' },
]

export const CATEGORIES = ['Souvenirs', 'Mini Bus Models', 'Manja SIM', 'Promotional Items', 'Others']

export const UNITS_OF_MEASURE = ['Unit', 'Pack', 'Box', 'Set']

export const STOCK_OUT_REASONS = [
  'Damaged', 'Expired', 'Promotion Giveaway', 'Internal Usage', 'Lost Item', 'Stock Adjustment', 'Others',
]

// Transfer Out sends stock away from the counter (to HQ or another counter)
// and decreases the balance; the other two types bring stock back in.
export const RETURN_TYPES = ['Customer Return', 'Counter Return', 'Transfer Out']

const daysAgo = n => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

export const SEED_PRODUCTS = [
  {
    id: 'p1', sku: 'MBM-001', name: 'Mini Bus Model (Classic Red)',
    description: 'Die-cast 1:64 scale model of the classic ManjaLink city bus.',
    category: 'Mini Bus Models', price: 35.00, stock: 142, minStock: 20, maxStock: 200,
    counter: 'KL Sentral (Counter 04)', status: 'Active', uom: 'Unit',
    createdDate: daysAgo(160), createdBy: 'Karen Khor',
    image: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=400&h=400&fit=crop&q=80',
  },
  {
    id: 'p2', sku: 'MBM-002', name: 'Mini Bus Model (Double Decker LTD)',
    description: 'Limited edition double-decker model with display case.',
    category: 'Mini Bus Models', price: 59.00, stock: 8, minStock: 10, maxStock: 50,
    counter: 'KL Sentral (Counter 04)', status: 'Active', uom: 'Unit',
    createdDate: daysAgo(120), createdBy: 'Karen Khor',
    image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400&h=400&fit=crop&q=80',
  },
  {
    id: 'p3', sku: 'SIM-001', name: 'Manja SIM Starter Pack',
    description: 'Prepaid starter pack with RM5 preloaded credit.',
    category: 'Manja SIM', price: 10.00, stock: 310, minStock: 50, maxStock: 500,
    counter: 'KL Sentral (Counter 04)', status: 'Active', uom: 'Pack',
    createdDate: daysAgo(140), createdBy: 'Karen Khor',
    image: 'https://images.unsplash.com/photo-1587749090881-1ff6c9cb3c6b?w=400&h=400&fit=crop&q=80',
  },
  {
    id: 'p4', sku: 'SIM-002', name: 'Manja SIM Tourist 15GB',
    description: '15GB / 30-day tourist data SIM with unlimited ManjaLink rides info.',
    category: 'Manja SIM', price: 30.00, stock: 96, minStock: 30, maxStock: 300,
    counter: 'TBS (Counter 09)', status: 'Active', uom: 'Pack',
    createdDate: daysAgo(140), createdBy: 'Karen Khor',
    image: 'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=400&h=400&fit=crop&q=80',
  },
  {
    id: 'p5', sku: 'SOU-001', name: 'ManjaLink Keychain',
    description: 'Metal keychain with embossed ManjaLink logo.',
    category: 'Souvenirs', price: 8.00, stock: 210, minStock: 40, maxStock: 300,
    counter: 'Penang Sentral (Counter 12)', status: 'Active', uom: 'Unit',
    createdDate: daysAgo(90), createdBy: 'Karen Khor',
    image: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=400&h=400&fit=crop&q=80',
  },
  {
    id: 'p6', sku: 'SOU-002', name: 'ManjaLink Ceramic Mug',
    description: 'Matte black 350ml ceramic mug with route map print.',
    category: 'Souvenirs', price: 18.00, stock: 89, minStock: 20, maxStock: 150,
    counter: 'KL Sentral (Counter 04)', status: 'Active', uom: 'Unit',
    createdDate: daysAgo(90), createdBy: 'Karen Khor',
    image: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400&h=400&fit=crop&q=80',
  },
  {
    id: 'p7', sku: 'SOU-003', name: 'Enamel Pin Set (5pk)',
    description: 'Set of five collectible enamel pins of ManjaLink landmarks.',
    category: 'Souvenirs', price: 22.00, stock: 0, minStock: 15, maxStock: 250,
    counter: 'KL Sentral (Counter 04)', status: 'Active', uom: 'Set',
    createdDate: daysAgo(75), createdBy: 'Karen Khor',
    image: 'https://images.unsplash.com/photo-1531171673193-06cc9f0dd2b4?w=400&h=400&fit=crop&q=80',
  },
  {
    id: 'p8', sku: 'PRM-001', name: 'ManjaLink Canvas Tote Bag',
    description: 'Promotional canvas tote bag — campaign giveaway item.',
    category: 'Promotional Items', price: 15.00, stock: 53, minStock: 20, maxStock: 100,
    counter: 'TBS (Counter 09)', status: 'Active', uom: 'Unit',
    createdDate: daysAgo(40), createdBy: 'Karen Khor',
    image: 'https://images.unsplash.com/photo-1597484662317-9bd7bdda2907?w=400&h=400&fit=crop&q=80',
  },
  {
    id: 'p9', sku: 'PRM-002', name: 'Lanyard + Card Holder',
    description: 'Lanyard with transparent ManjaLink travel card holder.',
    category: 'Promotional Items', price: 12.00, stock: 17, minStock: 20, maxStock: 200,
    counter: 'KL Sentral (Counter 04)', status: 'Active', uom: 'Unit',
    createdDate: daysAgo(40), createdBy: 'Karen Khor',
    image: 'https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=400&h=400&fit=crop&q=80',
  },
  {
    id: 'p10', sku: 'OTH-001', name: 'Travel Card Sticker Pack',
    description: 'Decorative sticker pack for ManjaLink travel cards.',
    category: 'Others', price: 5.00, stock: 0, minStock: 25, maxStock: 400,
    counter: 'KL Sentral (Counter 04)', status: 'Active', uom: 'Pack',
    createdDate: daysAgo(30), createdBy: 'Karen Khor',
    image: 'https://images.unsplash.com/photo-1572375992501-4b0892d50c69?w=400&h=400&fit=crop&q=80',
  },
  {
    id: 'p11', sku: 'OTH-002', name: 'ManjaLink Umbrella',
    description: 'Compact foldable umbrella in ManjaLink livery.',
    category: 'Others', price: 25.00, stock: 34, minStock: 10, maxStock: 100,
    counter: 'Penang Sentral (Counter 12)', status: 'Active', uom: 'Unit',
    createdDate: daysAgo(2), createdBy: 'Karen Khor',
    image: 'https://images.unsplash.com/photo-1530653333484-8e3c89cd2f45?w=400&h=400&fit=crop&q=80',
  },
  {
    id: 'p12', sku: 'SOU-004', name: 'Knit Fan Scarf (Retired)',
    description: 'Retired design — kept for record purposes only.',
    category: 'Souvenirs', price: 24.00, stock: 12, minStock: 10, maxStock: 60,
    counter: 'KL Sentral (Counter 04)', status: 'Inactive', uom: 'Unit',
    createdDate: daysAgo(200), createdBy: 'Karen Khor',
    image: 'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=400&h=400&fit=crop&q=80',
  },
]

export const SEED_MOVEMENTS = [
  {
    id: 'm1', no: 'SI-0001', type: 'IN', date: daysAgo(14), productId: 'p1',
    sku: 'MBM-001', productName: 'Mini Bus Model (Classic Red)', qty: 60, balanceAfter: 142,
    refNo: 'PO-2026-0412', remarks: 'Scheduled replenishment',
    createdBy: 'Karen Khor', counter: 'KL Sentral (Counter 04)',
  },
  {
    id: 'm2', no: 'SI-0002', type: 'IN', date: daysAgo(10), productId: 'p3',
    sku: 'SIM-001', productName: 'Manja SIM Starter Pack', qty: 150, balanceAfter: 310,
    refNo: 'PO-2026-0428', remarks: '',
    createdBy: 'John Doe', counter: 'KL Sentral (Counter 04)',
  },
  {
    id: 'm3', no: 'SO-0001', type: 'OUT', date: daysAgo(6), productId: 'p9',
    sku: 'PRM-002', productName: 'Lanyard + Card Holder', qty: 30, balanceAfter: 17,
    reason: 'Promotion Giveaway', remarks: 'Hari Raya campaign giveaway',
    createdBy: 'John Doe', counter: 'KL Sentral (Counter 04)',
  },
  {
    id: 'm4', no: 'RT-0001', type: 'RETURN', date: daysAgo(4), productId: 'p6',
    sku: 'SOU-002', productName: 'ManjaLink Ceramic Mug', qty: 2, balanceAfter: 89,
    returnType: 'Customer Return', reason: 'Wrong item purchased', remarks: '',
    createdBy: 'John Doe', counter: 'KL Sentral (Counter 04)',
  },
]

export const SEED_TRANSACTIONS = [
  {
    id: 'TX-88291', dateTime: daysAgo(0.2), status: 'Completed',
    staff: 'John Doe', staffId: 'STF-004', counter: 'KL Sentral (Counter 04)',
    payment: 'Credit Card', subtotal: 114.50, tax: 9.16, discount: 0, total: 123.66,
    items: [
      { id: 'p1', sku: 'MBM-001', name: 'Mini Bus Model (Classic Red)', qty: 2, unitPrice: 35.00 },
      { id: 'p4', sku: 'SIM-002', name: 'Manja SIM Tourist 15GB', qty: 1, unitPrice: 30.00 },
      { id: 'p9', sku: 'PRM-002', name: 'Lanyard + Card Holder', qty: 1, unitPrice: 12.00 },
      { id: 'p6', sku: 'SOU-002', name: 'ManjaLink Ceramic Mug', qty: 1, unitPrice: 2.50 },
    ],
  },
  {
    id: 'TX-88290', dateTime: daysAgo(0.3), status: 'Refunded',
    staff: 'M. Smith', staffId: 'STF-009', counter: 'TBS (Counter 09)',
    payment: 'Cash', subtotal: 18.00, tax: 1.44, discount: 0, total: 19.44,
    cashReceived: 20.00, changeDue: 0.56,
    refund: { reason: 'Defective item', date: daysAgo(0.1), by: 'M. Smith' },
    items: [
      { id: 'p6', sku: 'SOU-002', name: 'ManjaLink Ceramic Mug', qty: 1, unitPrice: 18.00 },
    ],
  },
  {
    id: 'TX-88289', dateTime: daysAgo(1.1), status: 'Completed',
    staff: 'K. Johnson', staffId: 'STF-012', counter: 'Penang Sentral (Counter 12)',
    payment: 'E-Wallet', subtotal: 130.00, tax: 10.40, discount: 0, total: 140.40,
    items: [
      { id: 'p3', sku: 'SIM-001', name: 'Manja SIM Starter Pack', qty: 4, unitPrice: 10.00 },
      { id: 'p5', sku: 'SOU-001', name: 'ManjaLink Keychain', qty: 5, unitPrice: 8.00 },
      { id: 'p8', sku: 'PRM-001', name: 'ManjaLink Canvas Tote Bag', qty: 2, unitPrice: 15.00 },
      { id: 'p9', sku: 'PRM-002', name: 'Lanyard + Card Holder', qty: 1, unitPrice: 20.00 },
    ],
  },
  {
    id: 'TX-88288', dateTime: daysAgo(1.4), status: 'Cancelled',
    staff: 'John Doe', staffId: 'STF-004', counter: 'KL Sentral (Counter 04)',
    payment: 'Debit Card', subtotal: 59.00, tax: 4.72, discount: 0, total: 63.72,
    items: [
      { id: 'p2', sku: 'MBM-002', name: 'Mini Bus Model (Double Decker LTD)', qty: 1, unitPrice: 59.00 },
    ],
  },
  {
    id: 'TX-88287', dateTime: daysAgo(2.2), status: 'Completed',
    staff: 'John Doe', staffId: 'STF-004', counter: 'KL Sentral (Counter 04)',
    payment: 'Cash', subtotal: 81.00, tax: 6.48, discount: 0, total: 87.48,
    cashReceived: 100.00, changeDue: 12.52,
    items: [
      { id: 'p11', sku: 'OTH-002', name: 'ManjaLink Umbrella', qty: 1, unitPrice: 25.00 },
      { id: 'p1', sku: 'MBM-001', name: 'Mini Bus Model (Classic Red)', qty: 1, unitPrice: 35.00 },
      { id: 'p6', sku: 'SOU-002', name: 'ManjaLink Ceramic Mug', qty: 1, unitPrice: 18.00 },
      { id: 'p5', sku: 'SOU-001', name: 'ManjaLink Keychain', qty: 1, unitPrice: 3.00 },
    ],
  },
]

export const STAFF_LIST = [
  { id: 'STF-004', name: 'John Doe' },
  { id: 'STF-009', name: 'M. Smith' },
  { id: 'STF-012', name: 'K. Johnson' },
]
