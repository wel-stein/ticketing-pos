import { useState } from 'react'
import SideNav from '../components/SideNav'
import TopBar from '../components/TopBar'

const FAQ_CATEGORIES = [
  {
    id: 'sales',
    label: 'Sales & Checkout',
    icon: 'point_of_sale',
    items: [
      {
        q: 'How do I process a sale?',
        a: 'Add items to the cart by clicking the + button on any product card in the Terminal. When ready, click "Proceed to Checkout", select a payment method, and click "Complete Sale".',
      },
      {
        q: 'How do I apply a discount or promo code?',
        a: 'On the Checkout page, find the "Apply Discount" section on the right panel. Enter the promo code and click Apply. Valid codes will show a confirmation and deduct the discount automatically.',
      },
      {
        q: 'Can I split a payment across multiple methods?',
        a: 'Split payments are not yet supported in the current version. A single payment method must be selected per transaction. Contact support if this is a frequent need.',
      },
      {
        q: 'How do I void or cancel a transaction in progress?',
        a: 'Use the "Clear All" button in the cart panel on the Terminal page to remove all items, or navigate back from Checkout to return to the Terminal without completing the sale.',
      },
    ],
  },
  {
    id: 'refunds',
    label: 'Refunds & Returns',
    icon: 'assignment_return',
    items: [
      {
        q: 'How do I issue a refund?',
        a: 'Go to Sales History, locate the transaction, and click "Issue Refund" at the bottom of the receipt panel. Refunds are processed back to the original payment method.',
      },
      {
        q: 'Is there a time limit for processing refunds?',
        a: 'Refunds can be processed within 30 days of the original transaction date. Transactions older than 30 days require manager authorization.',
      },
      {
        q: 'How do I handle an exchange instead of a refund?',
        a: 'Process a refund for the original item first, then create a new transaction for the replacement item. Note both order IDs in the transaction comments for reconciliation.',
      },
    ],
  },
  {
    id: 'inventory',
    label: 'Inventory Management',
    icon: 'inventory_2',
    items: [
      {
        q: 'How do I add a new product?',
        a: 'Navigate to the Inventory page and click "Add Product" (top-right of the table). Fill in the product name, SKU, category, price, and initial stock, then click Save Product.',
      },
      {
        q: 'How do I update existing stock levels?',
        a: 'On the Inventory page, click the ⋮ menu on any product row and select "Edit Stock". Enter the new quantity and confirm. Changes are reflected immediately.',
      },
      {
        q: 'How do I configure low stock alert thresholds?',
        a: 'When adding or editing a product, set the "Low Stock Threshold" field. When stock falls below this number, the item will appear in the Low Stock Alerts count on the Inventory dashboard.',
      },
    ],
  },
  {
    id: 'account',
    label: 'Account & Security',
    icon: 'manage_accounts',
    items: [
      {
        q: 'How do I change my access PIN?',
        a: 'Click the profile icon (top-right of any page), then select "Change PIN". You will be prompted to enter your current PIN, then your new PIN twice to confirm.',
      },
      {
        q: 'How do I switch to a different counter?',
        a: 'Click the profile icon and select "Switch Counter". You will be shown a list of available terminals. Select your new counter and authenticate with your PIN.',
      },
      {
        q: 'How do I view my personal shift history?',
        a: 'Go to Sales History and use the Staff ID filter to select your name. The transaction table will filter to show only your transactions for the selected date range.',
      },
    ],
  },
]

const CONTACT_METHODS = [
  {
    icon: 'mail',
    label: 'Email Support',
    value: 'support@merchtrack.io',
    sub: 'Response within 2 business hours',
    color: 'text-primary',
    bg: 'bg-primary-fixed',
  },
  {
    icon: 'call',
    label: 'Phone Support',
    value: '1-800-MERCH-01',
    sub: 'Mon–Fri, 8 AM – 8 PM EST',
    color: 'text-secondary',
    bg: 'bg-secondary-container/40',
  },
  {
    icon: 'chat',
    label: 'Live Chat',
    value: 'Start a conversation',
    sub: 'Average wait time: ~3 minutes',
    color: 'text-tertiary',
    bg: 'bg-tertiary-fixed/30',
  },
]

function FaqCategory({ category, searchQuery }) {
  const [openIndex, setOpenIndex] = useState(null)

  const filteredItems = category.items.filter(item => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q)
  })

  if (filteredItems.length === 0) return null

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 bg-surface border-b border-outline-variant">
        <span className="material-symbols-outlined text-primary text-[22px]">{category.icon}</span>
        <h3 className="text-title-lg font-semibold text-on-surface">{category.label}</h3>
        <span className="ml-auto font-mono text-label-sm text-outline">{filteredItems.length} articles</span>
      </div>
      <div className="divide-y divide-outline-variant">
        {filteredItems.map((item, idx) => (
          <div key={idx}>
            <button
              onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
              className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left hover:bg-surface-container-low transition-colors"
            >
              <span className={`text-body-md font-medium ${openIndex === idx ? 'text-primary' : 'text-on-surface'}`}>
                {item.q}
              </span>
              <span
                className={`material-symbols-outlined text-[20px] flex-shrink-0 transition-transform duration-200 ${
                  openIndex === idx ? 'text-primary rotate-180' : 'text-outline'
                }`}
              >
                expand_more
              </span>
            </button>
            {openIndex === idx && (
              <div className="px-6 pb-5">
                <p className="text-body-md text-on-surface-variant leading-relaxed border-l-2 border-primary pl-4">
                  {item.a}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Support() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('faq')

  const totalResults = FAQ_CATEGORIES.reduce((acc, cat) => {
    return acc + cat.items.filter(item => {
      if (!searchQuery) return true
      const q = searchQuery.toLowerCase()
      return item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q)
    }).length
  }, 0)

  return (
    <div className="bg-background text-on-background h-screen flex flex-col overflow-hidden">
      <TopBar brand />

      <div className="flex flex-1 overflow-hidden">
        <SideNav />

        <main className="flex-1 overflow-y-auto">
          {/* Hero */}
          <div className="bg-surface border-b border-outline-variant px-8 py-10 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-primary-fixed rounded-2xl flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-primary text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                support_agent
              </span>
            </div>
            <h1 className="text-headline-lg font-semibold text-on-surface mb-2">How can we help?</h1>
            <p className="text-body-lg text-on-surface-variant mb-6 max-w-md">
              Search our knowledge base or browse by category below.
            </p>
            <div className="relative w-full max-w-lg">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-[22px]">search</span>
              <input
                className="w-full pl-12 pr-4 py-3.5 bg-surface-container-low border border-outline-variant rounded-2xl text-body-md focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                placeholder="Search help articles..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              )}
            </div>
            {searchQuery && (
              <p className="mt-3 font-mono text-label-md text-on-surface-variant">
                {totalResults > 0
                  ? `${totalResults} result${totalResults !== 1 ? 's' : ''} for "${searchQuery}"`
                  : `No results for "${searchQuery}"`}
              </p>
            )}
          </div>

          {/* Tab bar */}
          <div className="sticky top-0 z-10 bg-surface border-b border-outline-variant px-8 flex gap-1">
            {[
              { id: 'faq', icon: 'help', label: 'FAQ' },
              { id: 'contact', icon: 'contact_support', label: 'Contact Us' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3.5 font-mono text-label-md border-b-2 transition-colors -mb-px ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          <div className="px-8 py-6">
            {activeTab === 'faq' && (
              <div className="flex flex-col gap-4">
                {FAQ_CATEGORIES.map(cat => (
                  <FaqCategory key={cat.id} category={cat} searchQuery={searchQuery} />
                ))}
                {searchQuery && totalResults === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-on-surface-variant opacity-50">
                    <span className="material-symbols-outlined text-5xl mb-3">search_off</span>
                    <p className="text-body-md">No articles match your search.</p>
                    <button
                      onClick={() => setSearchQuery('')}
                      className="mt-3 font-mono text-label-md text-primary hover:underline"
                    >
                      Clear search
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'contact' && (
              <div className="flex flex-col gap-6">
                {/* Contact method cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {CONTACT_METHODS.map(method => (
                    <div
                      key={method.label}
                      className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 flex flex-col items-center text-center gap-3 hover:border-primary transition-colors cursor-pointer card-shadow"
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${method.bg}`}>
                        <span className={`material-symbols-outlined text-[24px] ${method.color}`}>{method.icon}</span>
                      </div>
                      <div>
                        <p className="text-label-md font-mono text-on-surface-variant uppercase tracking-wider mb-1">{method.label}</p>
                        <p className="text-title-lg font-semibold text-on-surface">{method.value}</p>
                        <p className="text-label-sm font-mono text-outline mt-1">{method.sub}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Ticket form */}
                <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-outline-variant bg-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[22px]">confirmation_number</span>
                    <h3 className="text-title-lg font-semibold text-on-surface">Submit a Support Ticket</h3>
                  </div>
                  <form className="p-6 space-y-4" onSubmit={e => e.preventDefault()}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="font-mono text-label-md text-on-surface-variant">Your Name</label>
                        <input
                          className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg text-body-md focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                          defaultValue="John Doe"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="font-mono text-label-md text-on-surface-variant">Email Address</label>
                        <input
                          type="email"
                          className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg text-body-md focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                          defaultValue="jdoe@store-402.com"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="font-mono text-label-md text-on-surface-variant">Issue Category</label>
                      <select className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg text-body-md focus:ring-2 focus:ring-primary outline-none">
                        <option>Sales & Checkout</option>
                        <option>Refunds & Returns</option>
                        <option>Inventory Management</option>
                        <option>Account & Security</option>
                        <option>Hardware / Printer</option>
                        <option>Other</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="font-mono text-label-md text-on-surface-variant">Subject</label>
                      <input
                        className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg text-body-md focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                        placeholder="Brief description of the issue"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="font-mono text-label-md text-on-surface-variant">Description</label>
                      <textarea
                        rows={4}
                        className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg text-body-md focus:ring-2 focus:ring-primary focus:border-primary outline-none resize-none"
                        placeholder="Please describe the issue in detail, including any error messages or steps to reproduce..."
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="px-8 py-3 bg-primary text-on-primary rounded-xl font-mono text-label-md hover:opacity-90 transition-opacity flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-[18px]">send</span>
                        Submit Ticket
                      </button>
                    </div>
                  </form>
                </div>

                {/* System info */}
                <div className="bg-surface-container-low border border-outline-variant rounded-xl px-6 py-4 flex flex-wrap gap-x-8 gap-y-2">
                  {[
                    { label: 'Store', value: 'Store #402 — New York, NY' },
                    { label: 'Counter', value: 'Terminal 04' },
                    { label: 'Session', value: 'SESS-8A24F' },
                    { label: 'App Version', value: 'v2.4.1' },
                  ].map(info => (
                    <div key={info.label} className="flex items-center gap-2">
                      <span className="font-mono text-label-sm text-outline uppercase tracking-wider">{info.label}:</span>
                      <span className="font-mono text-label-sm text-on-surface font-semibold">{info.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
