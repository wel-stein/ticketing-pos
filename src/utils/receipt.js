import QRCode from 'qrcode'
import { fmtDate, fmtTime } from './format'

// Builds the 80mm thermal receipt for a completed transaction.
// Per SRS #F001 the receipt carries: receipt number, date & time, counter
// location, item details (qty / unit price), total amount, payment method,
// cashier name and an E-Invoice QR code.
export async function buildReceiptHTML(tx) {
  const eInvoiceUrl = `https://einvoice.manjalink.com.my/validate/${encodeURIComponent(tx.id)}`
  const qrDataUrl = await QRCode.toDataURL(eInvoiceUrl, { margin: 0, width: 160 })

  const itemLines = tx.items.map(item => {
    const name = item.name.length > 24 ? item.name.slice(0, 24) : item.name
    return `
      <tr>
        <td style="text-align:left;padding:2px 0;">${name}</td>
        <td style="text-align:center;padding:2px 4px;">${item.qty}</td>
        <td style="text-align:right;padding:2px 0;">${item.unitPrice.toFixed(2)}</td>
        <td style="text-align:right;padding:2px 0;">${(item.unitPrice * item.qty).toFixed(2)}</td>
      </tr>`
  }).join('')

  const itemCount = tx.items.reduce((a, i) => a + i.qty, 0)

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Receipt</title>
<style>
  @page {
    margin: 0;
    size: 80mm auto;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Courier New', 'Lucida Console', monospace;
    font-size: 12px;
    line-height: 1.4;
    width: 80mm;
    padding: 4mm;
    color: #000;
    background: #fff;
  }
  .center { text-align: center; }
  .bold { font-weight: bold; }
  .divider {
    border: none;
    border-top: 1px dashed #000;
    margin: 6px 0;
  }
  .double-divider {
    border: none;
    border-top: 2px solid #000;
    margin: 6px 0;
  }
  table { width: 100%; border-collapse: collapse; }
  .total-row td {
    font-weight: bold;
    font-size: 14px;
    padding-top: 4px;
  }
  .store-name {
    font-size: 18px;
    font-weight: bold;
    letter-spacing: 2px;
  }
  .receipt-footer {
    font-size: 11px;
    color: #333;
  }
  @media print {
    html, body { height: auto; }
    body { page-break-inside: avoid; break-inside: avoid; }
    table, tr { page-break-inside: avoid; break-inside: avoid; }
  }
</style>
</head>
<body>
  <div class="center">
    <div class="store-name">MANJALINK POS</div>
    <div style="font-size:11px;margin-top:2px;">${tx.counter}</div>
    <div style="font-size:11px;">Cashier: ${tx.staff}</div>
  </div>

  <hr class="double-divider">

  <div style="display:flex;justify-content:space-between;font-size:11px;">
    <span>Date: ${fmtDate(tx.dateTime)}</span>
    <span>Time: ${fmtTime(tx.dateTime)}</span>
  </div>
  <div style="font-size:11px;">Receipt No: ${tx.id}</div>

  <hr class="divider">

  <table>
    <thead>
      <tr style="font-size:11px;border-bottom:1px solid #000;">
        <th style="text-align:left;padding-bottom:3px;">Item</th>
        <th style="text-align:center;padding-bottom:3px;">Qty</th>
        <th style="text-align:right;padding-bottom:3px;">Price</th>
        <th style="text-align:right;padding-bottom:3px;">Total</th>
      </tr>
    </thead>
    <tbody>
      ${itemLines}
    </tbody>
  </table>

  <hr class="divider">

  <table>
    <tr>
      <td style="text-align:left;">Subtotal</td>
      <td style="text-align:right;">RM${tx.subtotal.toFixed(2)}</td>
    </tr>
    ${tx.discount > 0 ? `<tr>
      <td style="text-align:left;">Discount</td>
      <td style="text-align:right;">-RM${tx.discount.toFixed(2)}</td>
    </tr>` : ''}
    <tr>
      <td style="text-align:left;">Tax (8%)</td>
      <td style="text-align:right;">RM${tx.tax.toFixed(2)}</td>
    </tr>
  </table>

  <hr class="double-divider">

  <table>
    <tr class="total-row">
      <td style="text-align:left;">TOTAL</td>
      <td style="text-align:right;">RM${tx.total.toFixed(2)}</td>
    </tr>
  </table>

  <hr class="divider">

  <table style="font-size:12px;">
    <tr>
      <td style="text-align:left;">Payment: ${tx.payment.toUpperCase()}</td>
      <td></td>
    </tr>
    ${tx.payment === 'Cash' ? `
    <tr>
      <td style="text-align:left;">Cash Received</td>
      <td style="text-align:right;">RM${(tx.cashReceived ?? 0).toFixed(2)}</td>
    </tr>
    <tr class="bold">
      <td style="text-align:left;">Change Due</td>
      <td style="text-align:right;">RM${(tx.changeDue ?? 0).toFixed(2)}</td>
    </tr>` : ''}
  </table>

  <hr class="divider">

  <div class="center" style="margin-top:8px;">
    <img src="${qrDataUrl}" alt="E-Invoice QR" style="width:30mm;height:30mm;" />
    <div style="font-size:10px;margin-top:3px;">Scan for E-Invoice</div>
  </div>

  <div class="center receipt-footer" style="margin-top:8px;">
    <div>Items: ${itemCount}</div>
    <div style="margin-top:8px;">Thank you for your purchase!</div>
    <div style="margin-top:2px;">Please retain this receipt</div>
    <div style="margin-top:2px;">for returns or exchanges.</div>
    <div style="margin-top:8px;">* * *</div>
  </div>
</body>
</html>`
}

export function printReceipt(html) {
  const printWindow = window.open('', '_blank', 'width=320,height=600')
  if (!printWindow) return
  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.focus()
  printWindow.onafterprint = () => printWindow.close()
  setTimeout(() => {
    // The Star TSP100 raster driver ignores "size: 80mm auto" and paginates
    // against its fixed default page length, auto-cutting at every page break.
    // Pin the page height to the rendered content so the job is one page and
    // the printer only cuts once, at the end of the receipt.
    const doc = printWindow.document
    const contentHeightMm = Math.ceil((doc.body.scrollHeight * 25.4) / 96) + 2
    const pageStyle = doc.createElement('style')
    pageStyle.textContent = `@page { size: 80mm ${contentHeightMm}mm; margin: 0; }`
    doc.head.appendChild(pageStyle)
    printWindow.print()
  }, 250)
}
