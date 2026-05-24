export const CATEGORIES = ['All Items', 'Apparel', 'Souvenirs', 'Media', 'Accessories']

export const PRODUCTS = [
  {
    id: 'p1', sku: 'TSH-004-WHT', name: 'Classic Tour Tee',
    price: 35.00, category: 'Apparel', stock: 142, maxStock: 200,
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop&q=80',
    status: 'In Stock',
  },
  {
    id: 'p2', sku: 'MUG-102-BLK', name: 'Matte Stealth Mug',
    price: 18.00, category: 'Souvenirs', stock: 89, maxStock: 150,
    image: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400&h=400&fit=crop&q=80',
    status: 'In Stock',
  },
  {
    id: 'p3', sku: 'PST-882-ART', name: 'Abstract Horizon Poster',
    price: 45.00, category: 'Media', stock: 34, maxStock: 100,
    image: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=400&h=400&fit=crop&q=80',
    status: 'In Stock',
  },
  {
    id: 'p4', sku: 'KEY-441-MET', name: 'Utility Nylon Keychain',
    price: 12.00, category: 'Accessories', stock: 210, maxStock: 300,
    image: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=400&h=400&fit=crop&q=80',
    status: 'In Stock',
  },
  {
    id: 'p5', sku: 'VIN-009-LTD', name: 'LTD Edition Soundtrack',
    price: 29.00, category: 'Media', stock: 8, maxStock: 50,
    image: 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=400&h=400&fit=crop&q=80',
    status: 'Low Stock',
  },
  {
    id: 'p6', sku: 'HUD-002-GRY', name: 'Signature Logo Hoodie',
    price: 65.00, category: 'Apparel', stock: 67, maxStock: 120,
    image: 'https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=400&h=400&fit=crop&q=80',
    status: 'In Stock',
  },
  {
    id: 'p7', sku: 'HAT-115-BLK', name: 'Structured Snapback',
    price: 28.00, category: 'Apparel', stock: 0, maxStock: 80,
    image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=400&h=400&fit=crop&q=80',
    status: 'Out of Stock',
  },
  {
    id: 'p8', sku: 'BOT-203-BLU', name: 'Insulated Water Bottle',
    price: 32.00, category: 'Accessories', stock: 53, maxStock: 100,
    image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400&h=400&fit=crop&q=80',
    status: 'In Stock',
  },
  {
    id: 'p9', sku: 'PIN-018-SET', name: 'Enamel Pin Set (5pk)',
    price: 22.00, category: 'Accessories', stock: 156, maxStock: 250,
    image: 'https://images.unsplash.com/photo-1531171673193-06cc9f0dd2b4?w=400&h=400&fit=crop&q=80',
    status: 'In Stock',
  },
  {
    id: 'p10', sku: 'SHT-007-BLK', name: 'Technical Running Shorts',
    price: 42.00, category: 'Apparel', stock: 19, maxStock: 100,
    image: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=400&h=400&fit=crop&q=80',
    status: 'Low Stock',
  },
  {
    id: 'p11', sku: 'BDG-003-EMB', name: 'Embroidered Patch Badge',
    price: 15.00, category: 'Souvenirs', stock: 312, maxStock: 500,
    image: 'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=400&h=400&fit=crop&q=80',
    status: 'In Stock',
  },
  {
    id: 'p12', sku: 'SCF-001-YEL', name: 'Knit Fan Scarf',
    price: 24.00, category: 'Apparel', stock: 0, maxStock: 60,
    image: 'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=400&h=400&fit=crop&q=80',
    status: 'Out of Stock',
  },
]

export const INVENTORY_ITEMS = [
  {
    id: 'i1', sku: 'MT-APP-001', name: 'Premium Cotton T-Shirt', category: 'Apparel',
    stock: 142, maxStock: 200, price: 24.99,
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=80&h=80&fit=crop&q=80',
  },
  {
    id: 'i2', sku: 'MT-ACC-042', name: 'Leather Tote Bag', category: 'Accessories',
    stock: 12, maxStock: 80, price: 89.00,
    image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=80&h=80&fit=crop&q=80',
  },
  {
    id: 'i3', sku: 'MT-TEC-019', name: 'Wireless Headphones', category: 'Electronics',
    stock: 0, maxStock: 50, price: 149.95,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=80&h=80&fit=crop&q=80',
  },
  {
    id: 'i4', sku: 'MT-STA-088', name: 'Hardcover Planner', category: 'Stationery',
    stock: 64, maxStock: 160, price: 18.50,
    image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=80&h=80&fit=crop&q=80',
  },
  {
    id: 'i5', sku: 'MT-APP-023', name: 'Signature Logo Hoodie', category: 'Apparel',
    stock: 56, maxStock: 120, price: 65.00,
    image: 'https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=80&h=80&fit=crop&q=80',
  },
  {
    id: 'i6', sku: 'MT-ACC-067', name: 'Canvas Backpack', category: 'Accessories',
    stock: 23, maxStock: 60, price: 52.00,
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=80&h=80&fit=crop&q=80',
  },
  {
    id: 'i7', sku: 'MT-STA-091', name: 'Desk Organizer Set', category: 'Stationery',
    stock: 0, maxStock: 40, price: 35.99,
    image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=80&h=80&fit=crop&q=80',
  },
  {
    id: 'i8', sku: 'MT-TEC-033', name: 'USB-C Hub 7-Port', category: 'Electronics',
    stock: 18, maxStock: 100, price: 44.99,
    image: 'https://images.unsplash.com/photo-1625723044792-44de16ccb4e9?w=80&h=80&fit=crop&q=80',
  },
]

export const TRANSACTIONS = [
  {
    id: 'TX-88291', time: '14:23 PM', date: 'Today', itemCount: 4,
    total: 124.50, subtotal: 114.50, tax: 10.00,
    payment: { type: 'card', label: 'Visa •• 4242', icon: 'credit_card' },
    status: 'Completed', staff: 'John Doe', counter: '04',
    items: [
      { name: 'Premium Cotton Tee', sku: '002-1192-M', price: 45.00 },
      { name: 'Limited Edition Cap', sku: '045-8821-OS', price: 32.00 },
      { name: 'Heavyweight Hoodie', sku: '009-2101-L', price: 47.50 },
    ],
  },
  {
    id: 'TX-88290', time: '13:45 PM', date: 'Today', itemCount: 1,
    total: 28.00, subtotal: 25.93, tax: 2.07,
    payment: { type: 'cash', label: 'Cash', icon: 'payments' },
    status: 'Refunded', staff: 'M. Smith', counter: '09',
    items: [
      { name: 'Classic Tour Tee', sku: 'TSH-004-WHT', price: 28.00 },
    ],
  },
  {
    id: 'TX-88289', time: '12:12 PM', date: 'Today', itemCount: 12,
    total: 456.20, subtotal: 422.41, tax: 33.79,
    payment: { type: 'wallet', label: 'Apple Pay', icon: 'contactless' },
    status: 'Completed', staff: 'K. Johnson', counter: '12',
    items: [
      { name: 'Signature Logo Hoodie x3', sku: 'HUD-002-GRY', price: 195.00 },
      { name: 'Matte Stealth Mug x4', sku: 'MUG-102-BLK', price: 72.00 },
      { name: 'Enamel Pin Set x5', sku: 'PIN-018-SET', price: 110.00 },
    ],
  },
  {
    id: 'TX-88288', time: '10:55 AM', date: 'Today', itemCount: 2,
    total: 55.00, subtotal: 50.93, tax: 4.07,
    payment: { type: 'card', label: 'Mastercard •• 8812', icon: 'credit_card' },
    status: 'Completed', staff: 'J. Doe', counter: '04',
    items: [
      { name: 'Abstract Horizon Poster', sku: 'PST-882-ART', price: 45.00 },
      { name: 'Utility Nylon Keychain', sku: 'KEY-441-MET', price: 12.00 },
    ],
  },
  {
    id: 'TX-88287', time: '09:30 AM', date: 'Today', itemCount: 3,
    total: 87.50, subtotal: 81.02, tax: 6.48,
    payment: { type: 'cash', label: 'Cash', icon: 'payments' },
    status: 'Completed', staff: 'J. Doe', counter: '04',
    items: [
      { name: 'LTD Edition Soundtrack', sku: 'VIN-009-LTD', price: 29.00 },
      { name: 'Embroidered Patch Badge x3', sku: 'BDG-003-EMB', price: 45.00 },
    ],
  },
]
