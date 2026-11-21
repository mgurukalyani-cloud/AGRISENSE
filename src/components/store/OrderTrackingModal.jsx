import React, { useState, useEffect } from 'react';
import {
  X,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  Package,
  User,
  Phone,
  FileText,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  AlertTriangle,
  Timer
} from 'lucide-react';
import { storeClient } from '../../services/storeClientService';

// The 8 Official Progressive Order Stages
const ORDER_STAGES = [
  { key: 'PENDING_PAYMENT', label: 'Payment Pending', desc: 'Order booked, awaiting UPI/QR authorization' },
  { key: 'PAYMENT_SUCCESS', label: 'Payment Successful', desc: 'Cryptographic payment verification confirmed' },
  { key: 'CONFIRMED', label: 'Order Confirmed', desc: 'Stock allocated at Dharmaram Central Mandi Hub' },
  { key: 'PREPARING', label: 'Preparing Order', desc: 'Batch preparation, quality inspection & DBT verification' },
  { key: 'PACKED', label: 'Packed & Weighed', desc: 'Tamper-proof agricultural packaging sealed' },
  { key: 'DISPATCHED', label: 'Dispatched from Hub', desc: 'Loaded into Kisan Express dispatch vehicle' },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Farm Delivery', desc: 'Delivery partner navigating to farm coordinates' },
  { key: 'DELIVERED', label: 'Delivered to Farm', desc: 'Successfully handed over with digital receipt' }
];

export default function OrderTrackingModal({ orderId, isOpen, onClose, onOpenInvoice }) {
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(Date.now());

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

  // Live timer tick every 1000ms for dynamic minute & second countdown
  useEffect(() => {
    if (!isOpen) return;
    const ticker = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(ticker);
  }, [isOpen]);

  if (!isOpen) return null;

  const currentStatus = order?.order_status || 'PENDING_PAYMENT';
  const delivery = order?.delivery || {};
  const addr = order?.delivery_address || {};
  const history = order?.status_history || [];

  // Determine stage progression index (0 to 7)
  const stageKeys = ORDER_STAGES.map(s => s.key);
  let currentStageIdx = stageKeys.indexOf(currentStatus);
  if (currentStageIdx === -1) {
    if (currentStatus === 'PROCESSING') currentStageIdx = 3; // map processing to preparing
    else currentStageIdx = 2; // fallback to confirmed
  }

  const isDelivered = currentStatus === 'DELIVERED';
  const isCancelled = currentStatus === 'CANCELLED';

  // Dynamic remaining duration in minutes calculation: arrival_timestamp - Date.now()
  const arrivalTimestamp = order?.estimated_arrival_timestamp || delivery?.estimated_arrival_timestamp;
  let remainingTotalSeconds = 0;
  let remainingMinutes = 45;
  let remainingSeconds = 0;

  if (arrivalTimestamp) {
    const diffMs = arrivalTimestamp - currentTime;
    remainingTotalSeconds = Math.max(0, Math.floor(diffMs / 1000));
    remainingMinutes = Math.floor(remainingTotalSeconds / 60);
    remainingSeconds = remainingTotalSeconds % 60;
  }

  const estDuration = order?.estimated_duration_minutes || delivery?.estimated_duration_minutes || 50;
  const delayMinutes = order?.delay_minutes || 0;
  const delayReason = order?.delay_reason || '';
  const partnerName = order?.assigned_partner_name || delivery?.partner_name || 'Kisan Express Hub Delivery';
  const partnerPhone = order?.assigned_partner_phone || delivery?.partner_phone || '+91 98480 33445';

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
                Live Farm Logistics Telemetry
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
              <p className="text-xs text-slate-500 font-semibold">Loading real-time delivery telemetry...</p>
            </div>
          ) : !order ? (
            <div className="py-12 text-center text-rose-700 font-bold text-sm">
              Order not found or could not be loaded.
            </div>
          ) : (
            <>
              {/* PRIORITY 3: DYNAMIC DELIVERY ESTIMATION IN MINUTES BANNER */}
              <div className="p-4 rounded-3xl bg-gradient-to-br from-[#0a4d33] via-emerald-900 to-emerald-950 text-white shadow-lg border border-emerald-500/30 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none" />

                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-700/80 border border-emerald-400/30 text-emerald-200 inline-flex items-center gap-1">
                      <Timer className="w-3 h-3" />
                      Dynamic Minute-Based ETA
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                      <span>Estimated delivery:</span>
                      <span className="text-emerald-300 font-mono">
                        {Math.max(25, estDuration - 5)}–{estDuration + 10} minutes
                      </span>
                    </h3>
                    <p className="text-xs text-emerald-100/90 font-medium">
                      From Dharmaram Mandi Depot (~{order.delivery_distance_km || 14.5} km transit)
                    </p>
                  </div>

                  {/* Real-Time Live Countdown Dial */}
                  <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-center shrink-0">
                    <span className="text-[10px] uppercase font-black tracking-wider text-emerald-200 block">
                      Live Delivery Countdown
                    </span>
                    {isDelivered ? (
                      <div className="text-lg font-black text-emerald-300 font-mono mt-0.5">
                        Delivered
                      </div>
                    ) : isCancelled ? (
                      <div className="text-lg font-black text-rose-300 font-mono mt-0.5">
                        Cancelled
                      </div>
                    ) : remainingTotalSeconds > 0 ? (
                      <div className="text-2xl font-black font-mono text-emerald-300 tracking-tight flex items-baseline justify-center gap-1 mt-0.5">
                        <span>{remainingMinutes}m</span>
                        <span className="text-sm font-semibold text-emerald-200">
                          {String(remainingSeconds).padStart(2, '0')}s
                        </span>
                        <span className="text-xs font-bold text-emerald-100 ml-1">remaining</span>
                      </div>
                    ) : (
                      <div className="text-sm font-black text-amber-300 animate-pulse mt-0.5">
                        Arriving at Farm Now
                      </div>
                    )}
                  </div>
                </div>

                {/* Delay Notice Banner if Admin Adjusted ETA */}
                {delayMinutes > 0 && (
                  <div className="mt-3.5 p-3 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-100 flex items-center gap-2.5 text-xs font-medium animate-in fade-in">
                    <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0" />
                    <div>
                      <span className="font-bold text-amber-200">Traffic / Weather Delay (+{delayMinutes} mins):</span>{' '}
                      <span>{delayReason || 'Rural mandi road congestion. ETA adjusted.'}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* 8-Stage Progressive Order Timeline */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-emerald-700" />
                    <span>8-Stage Order Lifecycle Progression</span>
                  </h4>
                  <span className="text-[11px] font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                    Stage {currentStageIdx + 1} of 8
                  </span>
                </div>

                <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {ORDER_STAGES.map((stg, idx) => {
                    const isCompleted = idx < currentStageIdx;
                    const isCurrent = idx === currentStageIdx;

                    return (
                      <div key={stg.key} className="relative group">
                        <div className={`absolute -left-6 top-1 w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold ${
                          isCompleted ? 'bg-emerald-600 shadow-xs' :
                          isCurrent ? 'bg-[#0a4d33] ring-4 ring-emerald-200 shadow-md animate-pulse' :
                          'bg-slate-300'
                        }`}>
                          {isCompleted ? '✓' : idx + 1}
                        </div>

                        <div className="pl-2">
                          <p className={`text-xs font-black ${
                            isCurrent ? 'text-[#0a4d33] text-sm' :
                            isCompleted ? 'text-slate-800' :
                            'text-slate-400'
                          }`}>
                            {stg.label}
                          </p>
                          <p className={`text-[11px] mt-0.5 leading-snug ${
                            isCurrent ? 'text-slate-700 font-semibold' : 'text-slate-500'
                          }`}>
                            {stg.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Delivery Partner & Farm Destination Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Partner Card */}
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Assigned Delivery Partner
                  </span>
                  <div className="flex items-center space-x-2.5">
                    <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-900">{partnerName}</p>
                      <a
                        href={`tel:${partnerPhone}`}
                        className="text-[11px] text-emerald-700 hover:text-emerald-950 font-bold flex items-center gap-1 mt-0.5"
                      >
                        <Phone className="w-3 h-3" />
                        <span>{partnerPhone}</span>
                      </a>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium pt-1 border-t border-slate-100">
                    Carrier AWB: <span className="font-mono font-bold text-slate-800">{delivery.carrier_awb || 'AGRI-EXPR-STANDARD'}</span>
                  </div>
                </div>

                {/* Farm Location Card */}
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Farm Destination
                  </span>
                  <div className="flex items-start space-x-2">
                    <MapPin className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <p className="font-bold text-slate-900">{addr.full_name || 'Farmer'}</p>
                      <p className="text-slate-600 mt-0.5">
                        {addr.village}, {addr.mandal}, {addr.district}
                      </p>
                      {addr.farm_landmark && (
                        <p className="text-[11px] text-emerald-800 font-semibold mt-0.5">
                          Landmark: {addr.farm_landmark}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Items Summary */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                  Supplies in Delivery Consignment
                </span>
                <div className="divide-y divide-slate-200/70 text-xs">
                  {(order.items || []).map((it) => (
                    <div key={it.id} className="py-2 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-900">{it.product_name}</p>
                        <p className="text-[11px] text-slate-500">{it.brand} • Pack: {it.pack_size} {it.pack_unit} × {it.quantity}</p>
                      </div>
                      <span className="font-mono font-bold text-slate-800">
                        ₹{(it.unit_price * it.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between font-black text-xs text-slate-900">
                  <span>Grand Total Paid:</span>
                  <span className="font-mono text-emerald-800">₹{order.grand_total?.toFixed(2)}</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer with Invoice Action */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            Verified Kisan Supply Rail
          </span>
          <div className="flex items-center gap-2">
            {order && onOpenInvoice && (
              <button
                type="button"
                onClick={() => onOpenInvoice(order)}
                className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <FileText className="w-3.5 h-3.5 text-slate-600" />
                <span>Print GST Invoice</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-[#0a4d33] hover:bg-emerald-900 text-white font-bold cursor-pointer"
            >
              Close Tracking
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
