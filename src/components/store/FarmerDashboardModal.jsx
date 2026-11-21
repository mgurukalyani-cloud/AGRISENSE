import React, { useState, useEffect } from 'react';
import { X, User, Package, CreditCard, Clock, FileText, Truck, ArrowRight, ShieldCheck, RefreshCw, CheckCircle2 } from 'lucide-react';
import { storeClient } from '../../services/storeClientService';

export default function FarmerDashboardModal({ isOpen, onClose, onTrackOrder, onOpenInvoice }) {
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'payments'
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const data = await storeClient.getUserOrders();
      setOrders(data);
    } catch (e) {
      console.error('Failed to load user orders:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadOrders();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-emerald-900/20 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0a4d33] via-emerald-900 to-emerald-950 text-white px-5 sm:px-6 py-4 flex items-center justify-between border-b border-emerald-500/30">
          <div className="flex items-center space-x-2.5">
            <span className="p-2 rounded-xl bg-emerald-800/80 border border-emerald-500/40 text-emerald-200">
              <User className="w-5 h-5" />
            </span>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-600/70 border border-emerald-400/40 text-emerald-100">
                Verified Farmer Account
              </span>
              <h2 className="text-base sm:text-lg font-black text-white mt-0.5">
                Rameshwar Rao • My Farm Hub
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Farmer Info Strip */}
        <div className="px-5 py-3 bg-emerald-50/70 border-b border-emerald-200/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-700">
          <div>
            <span className="text-slate-500">Farm Location:</span>{' '}
            <b className="text-slate-900">Appannapet, Dharmaram, Peddapalli (Telangana)</b>
          </div>
          <div className="flex items-center gap-3">
            <span>Registered Phone: <b className="font-mono text-slate-900">+91 98480 22338</b></span>
            <span>•</span>
            <span className="flex items-center gap-1 text-emerald-800 font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              PM-KISAN DBT Linked
            </span>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 px-5 pt-3 gap-3 bg-slate-50/50">
          <button
            onClick={() => setActiveTab('orders')}
            className={`pb-3 text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer border-b-2 transition-all ${
              activeTab === 'orders'
                ? 'border-emerald-700 text-emerald-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>My Orders ({orders.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`pb-3 text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer border-b-2 transition-all ${
              activeTab === 'payments'
                ? 'border-emerald-700 text-emerald-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>UPI Payments & Transactions</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-4">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin text-emerald-700" />
              <p className="text-xs text-slate-500 font-semibold">Loading orders from database...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="py-16 text-center space-y-3 text-slate-400">
              <Package className="w-12 h-12 mx-auto text-slate-300" />
              <p className="text-sm font-bold text-slate-600">No Orders Placed Yet</p>
              <p className="text-xs text-slate-400">Your agricultural purchases and order trackings will appear here.</p>
            </div>
          ) : activeTab === 'orders' ? (
            <div className="space-y-3.5">
              {orders.map((ord) => {
                const dateStr = new Date(ord.created_at).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                });

                return (
                  <div
                    key={ord.id}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-emerald-300 transition-all space-y-3 shadow-2xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-2.5">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-slate-900 text-sm">
                            {ord.order_number}
                          </span>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase border ${
                            ord.order_status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                            ord.order_status === 'CANCELLED' ? 'bg-rose-100 text-rose-800 border-rose-300' :
                            'bg-amber-100 text-amber-900 border-amber-300'
                          }`}>
                            {ord.order_status.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Placed on {dateStr} • {ord.item_count || 1} product type(s)
                        </p>
                      </div>

                      <div className="text-left sm:text-right">
                        <span className="text-base font-black text-[#0a4d33] font-mono">
                          ₹{ord.grand_total?.toFixed(2)}
                        </span>
                        {ord.subsidy_saved_total > 0 && (
                          <p className="text-[10px] font-bold text-emerald-700">
                            Saved ₹{ord.subsidy_saved_total?.toFixed(2)} DBT
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between gap-2 pt-0.5">
                      <div className="text-xs text-slate-600 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Payment: <b>{ord.payment_status}</b></span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onOpenInvoice && onOpenInvoice(ord)}
                          className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Invoice</span>
                        </button>
                        <button
                          onClick={() => onTrackOrder && onTrackOrder(ord.id)}
                          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-700 to-[#0a4d33] hover:from-emerald-800 hover:to-emerald-950 text-white text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          <span>Track Delivery</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Payments & Transactions Tab */
            <div className="space-y-3">
              {orders.map((ord) => (
                <div
                  key={ord.id}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-slate-900">{ord.order_number}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        ord.payment_status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {ord.payment_status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Payment Method: <b>UPI 2.0 Dynamic Rail (Razorpay Gateway)</b>
                    </p>
                    <p className="text-[10px] font-mono text-slate-400">
                      Txn Ref: {ord.id}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="font-mono font-black text-sm text-[#0a4d33]">
                      ₹{ord.grand_total?.toFixed(2)}
                    </span>
                    <p className="text-[10px] text-slate-500">
                      {new Date(ord.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>AgriSense Unified Farmer Account</span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
