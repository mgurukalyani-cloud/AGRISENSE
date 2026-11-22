import React from 'react';
import { X, Printer, Download, CheckCircle2, ShieldCheck, Sprout } from 'lucide-react';
import agrisenseLogo from '../../assets/agrisense-logo-circle.png';

export default function InvoicePrintModal({ order, isOpen, onClose }) {
  if (!isOpen || !order) return null;

  const addr = order.delivery_address || {};
  const items = order.items || [];
  const payment = order.payment || {};
  const dateFormatted = new Date(order.created_at).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200 print:p-0 print:bg-white">
      <div 
        className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:rounded-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Action Bar (Hidden in Print) */}
        <div className="bg-slate-900 text-white px-6 py-3 flex items-center justify-between border-b border-slate-700 print:hidden">
          <div className="flex items-center space-x-2">
            <Printer className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-slate-200">GST Tax Invoice Preview</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Download PDF</span>
            </button>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Container */}
        <div className="overflow-y-auto p-6 sm:p-8 space-y-6 text-slate-900 font-sans print:p-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-300 pb-5 gap-4">
            <div>
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-xl overflow-hidden shadow-xs ring-1 ring-emerald-800/30 shrink-0 bg-emerald-950 p-0.5">
                  <img src={agrisenseLogo} alt="AgriSense Logo" className="w-full h-full object-contain rounded-lg" />
                </div>
                <div>
                  <h1 className="text-xl font-black text-[#0a4d33] tracking-tight">AgriSense Kisan Store</h1>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                    Smart Agriculture • Government Certified DBT & Supply Services
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-600 mt-2">
                Central Kisan Mandi Hub, Hitec City, Hyderabad, Telangana 500081<br />
                GSTIN: <b>36AAACA0000A1Z5</b> • CIN: U01400TG2026PTC109988
              </p>
            </div>

            <div className="sm:text-right">
              <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-black border border-emerald-300">
                TAX INVOICE
              </span>
              <p className="text-xs font-mono font-bold text-slate-900 mt-2">
                Invoice No: <b>{order.order_number}</b>
              </p>
              <p className="text-xs text-slate-600">
                Date: {dateFormatted}
              </p>
            </div>
          </div>

          {/* Billed To & Shipped To */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
            <div>
              <h2 className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
                Billed To (Farmer):
              </h2>
              <p className="font-bold text-slate-900 text-sm">{addr.full_name || 'Farmer Customer'}</p>
              <p className="text-slate-600 mt-0.5">
                Phone: {addr.phone || '9848022338'}<br />
                Village: {addr.village || 'Appannapet'}, Mandal: {addr.mandal || 'Dharmaram'}<br />
                District: {addr.district || 'Peddapalli'}, State: {addr.state || 'Telangana'} - {addr.pincode || '505187'}
              </p>
            </div>

            <div>
              <h2 className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
                Payment & Fulfillment Details:
              </h2>
              <p className="text-slate-700">
                Payment Status: <b className="text-emerald-700">{order.payment_status}</b><br />
                Payment Method: <b>UPI 2.0 Dynamic Rail</b><br />
                Gateway Ref: <span className="font-mono text-[11px]">{payment.gateway_payment_id || 'RZP-DIRECT-UPI'}</span><br />
                Logistics Hub: <b>Dharmaram Primary Agricultural Co-op (PACS)</b>
              </p>
            </div>
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-slate-100 text-slate-700 uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">Agricultural Item</th>
                  <th className="p-3">Brand</th>
                  <th className="p-3 text-right">Pack Size</th>
                  <th className="p-3 text-right">Rate</th>
                  <th className="p-3 text-right">Qty</th>
                  <th className="p-3 text-right">GST</th>
                  <th className="p-3 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                {items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="p-3 text-slate-400 font-mono">{idx + 1}</td>
                    <td className="p-3 font-bold text-slate-900">
                      {item.product_name}
                    </td>
                    <td className="p-3 text-slate-600">{item.brand}</td>
                    <td className="p-3 text-right font-mono">{item.pack_size} {item.pack_unit}</td>
                    <td className="p-3 text-right font-mono">₹{item.unit_price?.toFixed(2)}</td>
                    <td className="p-3 text-right font-bold font-mono">{item.quantity}</td>
                    <td className="p-3 text-right font-mono">{item.gst_rate}%</td>
                    <td className="p-3 text-right font-bold font-mono">₹{item.line_subtotal?.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Summary */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-2">
            <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-950 max-w-sm space-y-1">
              <p className="font-bold flex items-center gap-1.5 text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                Government Direct Benefit Transfer (DBT) Benefit
              </p>
              <p className="text-[11px] leading-relaxed text-slate-700">
                You saved a total of <b>₹{order.subsidy_saved_total?.toFixed(2)}</b> under official Central Government PM-PRANAM and Department of Fertilizers price protection subsidy schemes.
              </p>
            </div>

            <div className="w-full sm:w-72 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-mono font-bold">₹{order.subtotal?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Applicable GST (Included):</span>
                <span className="font-mono">₹{order.tax_total?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Agricultural Freight / Delivery:</span>
                <span className="font-mono font-bold text-emerald-700">
                  {order.delivery_fee === 0 ? 'FREE' : `₹${order.delivery_fee?.toFixed(2)}`}
                </span>
              </div>
              {order.discount_total > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Coupon Discount:</span>
                  <span className="font-mono">-₹{order.discount_total?.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-black text-[#0a4d33] border-t-2 border-slate-300 pt-2">
                <span>Grand Total:</span>
                <span className="font-mono">₹{order.grand_total?.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Footer Declaration */}
          <div className="border-t border-slate-200 pt-4 text-[10px] text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-2">
            <p>This is a computer-generated GST tax invoice. No physical signature required.</p>
            <div className="flex items-center space-x-1 font-bold text-[#0a4d33]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>AgriSense Kisan Trust & Authentication Verified</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
