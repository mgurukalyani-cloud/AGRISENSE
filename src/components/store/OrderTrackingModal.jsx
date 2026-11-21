import React, { useState, useEffect } from 'react';
import { X, Truck, CheckCircle2, Clock, MapPin, Package, User, Phone, FileText, ArrowRight, ShieldCheck, RefreshCw } from 'lucide-react';
import { storeClient } from '../../services/storeClientService';

const ORDER_STAGES = [
  { key: 'CONFIRMED', label: 'Order Confirmed', desc: 'Payment verified & order allocated at nearest Kisan Hub' },
  { key: 'PROCESSING', label: 'Processing', desc: 'Batch verification & inventory allocation' },
  { key: 'PACKED', label: 'Packed & Weighed', desc: 'Sealed with government DBT verification stamps' },
  { key: 'DISPATCHED', label: 'Dispatched from Hub', desc: 'Loaded into Kisan Express refrigerated/moisture-safe vehicle' },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Farm Delivery', desc: 'Delivery partner en route to registered farm address' },
  { key: 'DELIVERED', label: 'Delivered', desc: 'Successfully handed over to farmer with OTP confirmation' }
];

export default function OrderTrackingModal({ orderId, isOpen, onClose, onOpenInvoice }) {
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadOrder = async () => {
    if (!orderId) return;
    setIsLoading(true);
    try {
      const data = await storeClient.getOrderDetails(orderId);
      setOrder(data);
    } catch (e) {
      console.error('Failed to load order:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && orderId) {
      loadOrder();
    }
  }, [isOpen, orderId]);

  if (!isOpen) return null;

  const currentStatus = order?.order_status || 'PENDING_PAYMENT';
  const delivery = order?.delivery || {};
  const addr = order?.delivery_address || {};
  const history = order?.status_history || [];

  // Determine stage progression index
  const stageKeys = ORDER_STAGES.map(s => s.key);
  const currentStageIdx = stageKeys.indexOf(currentStatus);

  const isDelivered = currentStatus === 'DELIVERED';
  const isCancelled = currentStatus === 'CANCELLED';

  const estDeliveryFormatted = order?.estimated_delivery
    ? new Date(order.estimated_delivery).toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    : '2 Business Days';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-emerald-900/20 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0a4d33] via-emerald-900 to-emerald-950 text-white px-5 sm:px-6 py-4 flex items-center justify-between border-b border-emerald-500/30">
          <div className="flex items-center space-x-2.5">
            <span className="p-2 rounded-xl bg-emerald-800/80 border border-emerald-500/40 text-emerald-200">
              <Truck className="w-5 h-5" />
            </span>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-600/70 border border-emerald-400/40 text-emerald-100">
                Live Farm Logistics Tracking
              </span>
              <h2 className="text-base sm:text-lg font-black text-white mt-0.5">
                Order: {order?.order_number || orderId}
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

        {/* Content Body */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-5">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin text-emerald-700" />
              <p className="text-xs text-slate-500 font-semibold">Loading real-time logistics telemetry...</p>
            </div>
          ) : !order ? (
            <div className="py-12 text-center text-rose-700 font-bold text-sm">
              Order not found or could not be loaded.
            </div>
          ) : (
            <>
              {/* ETA & Status Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                    Estimated Delivery Arrival
                  </span>
                  <p className="text-lg font-black text-slate-900 mt-0.5 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-emerald-700" />
                    {estDeliveryFormatted}
                  </p>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Carrier AWB: <span className="font-mono font-bold text-slate-900">{delivery.carrier_awb || 'AGRI-EXPR-STANDARD'}</span>
                  </p>
                </div>

                <div className="sm:text-right">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-black border ${
                    isDelivered ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                    isCancelled ? 'bg-rose-100 text-rose-800 border-rose-300' :
                    'bg-amber-100 text-amber-900 border-amber-300'
                  }`}>
                    {currentStatus.replace(/_/g, ' ')}
                  </span>
                  <p className="text-xs font-bold text-slate-700 mt-1">
                    {order.items?.length || 0} Item(s) • Total: ₹{order.grand_total?.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Delivery Progress Timeline */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <h3 className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-emerald-700" />
                  Order Delivery Milestones
                </h3>

                <div className="space-y-4 pl-2">
                  {ORDER_STAGES.map((stage, idx) => {
                    const isPassed = currentStageIdx >= idx;
                    const isCurrent = currentStageIdx === idx;

                    // Match audit log entry
                    const historyEntry = history.find(h => h.status === stage.key);
                    const timestampStr = historyEntry
                      ? new Date(historyEntry.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })
                      : null;

                    return (
                      <div key={stage.key} className="flex items-start space-x-3 relative">
                        {/* Connecting Line */}
                        {idx < ORDER_STAGES.length - 1 && (
                          <div className={`absolute left-3.5 top-6 bottom-0 w-0.5 -ml-px ${
                            currentStageIdx > idx ? 'bg-emerald-600' : 'bg-slate-300'
                          }`} />
                        )}

                        {/* Node Bullet */}
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 ${
                          isCurrent
                            ? 'bg-emerald-600 text-white ring-4 ring-emerald-200 shadow-md'
                            : isPassed
                            ? 'bg-emerald-800 text-white'
                            : 'bg-slate-200 text-slate-400'
                        }`}>
                          {isPassed ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            <span className="text-[11px] font-black">{idx + 1}</span>
                          )}
                        </div>

                        {/* Stage Text */}
                        <div className="flex-1 pb-3">
                          <div className="flex items-center justify-between">
                            <p className={`text-xs font-black ${isPassed ? 'text-slate-900' : 'text-slate-400'}`}>
                              {stage.label}
                            </p>
                            {timestampStr && (
                              <span className="text-[10px] font-mono text-emerald-800 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-sm">
                                {timestampStr}
                              </span>
                            )}
                          </div>
                          <p className={`text-[11px] mt-0.5 ${isPassed ? 'text-slate-600' : 'text-slate-400'}`}>
                            {stage.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Delivery Address & Hub Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[10px] flex items-center gap-1 mb-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                    Farm Destination
                  </h4>
                  <p className="font-black text-slate-900">{addr.full_name || 'Farmer'}</p>
                  <p className="text-slate-600 mt-0.5">
                    {addr.village}, {addr.mandal}, {addr.district}, {addr.state} - {addr.pincode}
                  </p>
                  <p className="text-slate-700 font-semibold mt-1">
                    Phone: {addr.phone}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[10px] flex items-center gap-1 mb-1">
                    <Phone className="w-3.5 h-3.5 text-emerald-700" />
                    Delivery Personnel / Hub
                  </h4>
                  <p className="font-black text-slate-900">{delivery.partner_name || 'Kisan Seva Kendra Logistics'}</p>
                  <p className="text-slate-600 mt-0.5">
                    Dispatch Hub: {delivery.hub_location || 'Central Mandi Depot'}
                  </p>
                  <p className="text-emerald-700 font-bold mt-1">
                    Contact: {delivery.partner_phone || '+91 98480 33445'}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            onClick={() => onOpenInvoice && onOpenInvoice(order)}
            className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-700" />
            <span>View / Print Invoice</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#0a4d33] to-emerald-800 hover:from-emerald-900 hover:to-emerald-950 text-white text-xs font-black shadow-md transition-all cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
