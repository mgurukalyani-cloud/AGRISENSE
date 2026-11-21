import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  DollarSign,
  Package,
  AlertTriangle,
  Truck,
  RefreshCw,
  Search,
  CheckCircle2,
  Filter,
  Layers,
  UserCheck,
  Clock,
  UserPlus,
  Phone,
  Timer,
  FileText
} from 'lucide-react';
import { storeClient } from '../../services/storeClientService';

const AVAILABLE_PARTNERS = [
  { name: 'Ramesh Kumar', phone: '+91 98480 33445', vehicle: 'Mahindra Bolero Maxi Truck (TS02-AB-4012)' },
  { name: 'Suresh Goud', phone: '+91 98480 11223', vehicle: 'Ape Piaggio Rural Auto (TS02-CD-8819)' },
  { name: 'Kisan Express Hub Fleet', phone: '+91 98480 77889', vehicle: 'Tata Ace Gold EV (TS02-EE-1102)' }
];

export default function AdminStoreDashboardModal({ isOpen, onClose, onTrackOrder }) {
  const [role, setRole] = useState('ADMIN'); // 'ADMIN' | 'SUPPLIER' | 'DELIVERY'
  const [analytics, setAnalytics] = useState(null);
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [paymentFilter, setPaymentFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState(null);

  // Sub-modal state for ETA Adjuster
  const [etaOrder, setEtaOrder] = useState(null);
  const [extraMinutes, setExtraMinutes] = useState(15);
  const [delayReason, setDelayReason] = useState('Rural road monsoon waterlogging');
  const [isSavingEta, setIsSavingEta] = useState(false);

  // Sub-modal state for Partner Assignment
  const [partnerOrder, setPartnerOrder] = useState(null);
  const [selectedPartnerIndex, setSelectedPartnerIndex] = useState(0);
  const [isSavingPartner, setIsSavingPartner] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [stats, ords] = await Promise.all([
        storeClient.getAdminAnalytics(),
        storeClient.getAdminOrders(statusFilter, paymentFilter, search)
      ]);
      setAnalytics(stats);
      setOrders(ords);
    } catch (e) {
      console.error('Failed to load admin data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, statusFilter, paymentFilter]);

  if (!isOpen) return null;

  const handleUpdateStage = async (orderId, newStatus) => {
    setActionMsg(`Updating order to ${newStatus}...`);
    try {
      const res = await storeClient.updateOrderStatus(orderId, newStatus, `Stage updated to ${newStatus} by ${role}`, role);
      if (res.success) {
        setActionMsg(`Success: Order updated to ${newStatus}!`);
        await loadData();
        setTimeout(() => setActionMsg(null), 3000);
      } else {
        setActionMsg(`Error: ${res.message}`);
      }
    } catch (e) {
      setActionMsg(`Failed: ${e.message}`);
    }
  };

  const handleSaveEta = async (e) => {
    e.preventDefault();
    if (!etaOrder) return;
    setIsSavingEta(true);
    try {
      const res = await storeClient.updateDeliveryETA(etaOrder.id, Number(extraMinutes), delayReason, role);
      if (res.success) {
        setActionMsg(`ETA adjusted: +${extraMinutes} mins successfully recorded.`);
        setEtaOrder(null);
        await loadData();
        setTimeout(() => setActionMsg(null), 3500);
      } else {
        alert(res.message || 'Could not update ETA');
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSavingEta(false);
    }
  };

  const handleSavePartner = async (e) => {
    e.preventDefault();
    if (!partnerOrder) return;
    setIsSavingPartner(true);
    try {
      const p = AVAILABLE_PARTNERS[selectedPartnerIndex];
      const res = await storeClient.assignDeliveryPartner(partnerOrder.id, p.name, p.phone, p.vehicle, role);
      if (res.success) {
        setActionMsg(`Delivery partner assigned: ${p.name} (${p.phone})`);
        setPartnerOrder(null);
        await loadData();
        setTimeout(() => setActionMsg(null), 3500);
      } else {
        alert(res.message || 'Could not assign partner');
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSavingPartner(false);
    }
  };

  const summary = analytics?.summary || {};
  const lowStock = analytics?.low_stock_warnings || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-300 overflow-hidden flex flex-col max-h-[94vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-950 text-white px-5 sm:px-6 py-4 flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center space-x-2.5">
            <span className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-600/60 border border-emerald-400/40 text-emerald-100">
                  Logistics & Store Operations Command
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
                  Role: {role}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white mt-0.5">
                AgriSense Store & Delivery Fleet Controller
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Role Switcher */}
            <div className="hidden sm:flex items-center bg-slate-800 p-0.5 rounded-xl border border-slate-700 text-[11px] font-bold">
              <button
                onClick={() => setRole('ADMIN')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  role === 'ADMIN' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Admin
              </button>
              <button
                onClick={() => setRole('SUPPLIER')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  role === 'SUPPLIER' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Mandi Hub
              </button>
              <button
                onClick={() => setRole('DELIVERY')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  role === 'DELIVERY' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Dispatch Fleet
              </button>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Action Notification Message */}
          {actionMsg && (
            <div className="p-3 bg-emerald-50 text-emerald-900 border border-emerald-300 rounded-2xl text-xs font-bold flex items-center justify-between animate-in fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{actionMsg}</span>
              </div>
              <button onClick={() => setActionMsg(null)} className="text-emerald-700 hover:text-emerald-950">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Orders</span>
              <p className="text-xl font-black text-slate-900 mt-0.5">{summary.total_orders || 0}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200">
              <span className="text-[10px] uppercase font-bold text-emerald-800 block">Verified Revenue</span>
              <p className="text-xl font-black text-emerald-900 mt-0.5">₹{Number(summary.total_revenue || 0).toFixed(2)}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-teal-50 border border-teal-200">
              <span className="text-[10px] uppercase font-bold text-teal-800 block">DBT Subsidy Passed</span>
              <p className="text-xl font-black text-teal-900 mt-0.5">₹{Number(summary.total_subsidy_saved || 0).toFixed(2)}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200">
              <span className="text-[10px] uppercase font-bold text-blue-800 block">Paid Orders</span>
              <p className="text-xl font-black text-blue-900 mt-0.5">{summary.paid_orders || 0}</p>
            </div>
          </div>

          {/* Controls Bar: Filters & Search */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              {/* Status Filter */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-500 font-bold">Stage:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white font-semibold text-slate-800 text-xs focus:outline-emerald-600"
                >
                  <option value="ALL">All Stages</option>
                  <option value="PENDING_PAYMENT">Pending Payment</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="PREPARING">Preparing</option>
                  <option value="PACKED">Packed</option>
                  <option value="DISPATCHED">Dispatched</option>
                  <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                  <option value="DELIVERED">Delivered</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              {/* Payment Filter */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-500 font-bold">Payment:</span>
                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white font-semibold text-slate-800 text-xs focus:outline-emerald-600"
                >
                  <option value="ALL">All Payments</option>
                  <option value="SUCCESS">Verified (SUCCESS)</option>
                  <option value="PENDING">Pending (PENDING)</option>
                </select>
              </div>
            </div>

            {/* Search Input */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Order #, Farmer, Village..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadData()}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-800 placeholder:text-slate-400 focus:outline-emerald-600"
                />
              </div>
              <button
                onClick={loadData}
                className="p-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                title="Refresh Table"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Orders Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 uppercase tracking-wider text-[10px] border-b border-slate-200 font-bold">
                <tr>
                  <th className="p-3">Order Ref</th>
                  <th className="p-3">Farmer & Location</th>
                  <th className="p-3">ETA in Mins</th>
                  <th className="p-3 text-right">Amount</th>
                  <th className="p-3 text-center">Payment</th>
                  <th className="p-3 text-center">Current Stage</th>
                  <th className="p-3 text-right">Logistics & Stage Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                {isLoading ? (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-700 mb-2" />
                      Loading operational logistics records...
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-slate-400">
                      No matching orders found.
                    </td>
                  </tr>
                ) : (
                  orders.map((ord) => {
                    const addr = ord.delivery_address || {};
                    const isDelivered = ord.order_status === 'DELIVERED';
                    const isCancelled = ord.order_status === 'CANCELLED';
                    const estDuration = ord.estimated_duration_minutes || 50;
                    const delayMins = ord.delay_minutes || 0;

                    return (
                      <tr key={ord.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3 font-mono font-bold text-slate-900">
                          {ord.order_number}
                        </td>
                        <td className="p-3">
                          <p className="font-bold text-slate-900">{addr.full_name || 'Farmer'}</p>
                          <p className="text-[10px] text-slate-500">{addr.village}, {addr.mandal}</p>
                          {ord.assigned_partner_name && (
                            <p className="text-[10px] text-emerald-800 font-medium flex items-center gap-1 mt-0.5">
                              <UserCheck className="w-3 h-3 text-emerald-600" />
                              <span>{ord.assigned_partner_name}</span>
                            </p>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1 font-mono font-bold text-slate-900">
                            <Clock className="w-3.5 h-3.5 text-emerald-700" />
                            <span>{estDuration} mins</span>
                          </div>
                          {delayMins > 0 && (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-md inline-block mt-0.5">
                              +{delayMins}m delay
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right font-mono font-black text-slate-900">
                          ₹{ord.grand_total?.toFixed(2)}
                        </td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            ord.payment_status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {ord.payment_status}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                            isDelivered ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                            isCancelled ? 'bg-rose-100 text-rose-800 border-rose-300' :
                            ord.order_status === 'DISPATCHED' ? 'bg-indigo-100 text-indigo-800 border-indigo-300' :
                            ord.order_status === 'OUT_FOR_DELIVERY' ? 'bg-purple-100 text-purple-800 border-purple-300' :
                            'bg-blue-100 text-blue-800 border-blue-300'
                          }`}>
                            {ord.order_status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end flex-wrap gap-1">
                            {/* PRIORITY 4: ETA Adjuster Button */}
                            {!isDelivered && !isCancelled && (
                              <button
                                onClick={() => {
                                  setEtaOrder(ord);
                                  setExtraMinutes(15);
                                }}
                                className="px-2 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 text-[10px] font-black flex items-center gap-1 cursor-pointer"
                                title="Adjust Delivery ETA (+Minutes)"
                              >
                                <Timer className="w-3 h-3 text-amber-700" />
                                <span>+ETA Mins</span>
                              </button>
                            )}

                            {/* PRIORITY 4: Assign Partner Button */}
                            {!isDelivered && !isCancelled && (
                              <button
                                onClick={() => setPartnerOrder(ord)}
                                className="px-2 py-1 rounded-lg bg-teal-100 hover:bg-teal-200 text-teal-900 text-[10px] font-black flex items-center gap-1 cursor-pointer"
                                title="Assign Delivery Partner"
                              >
                                <UserPlus className="w-3 h-3 text-teal-700" />
                                <span>Assign Partner</span>
                              </button>
                            )}

                            {/* 8-Stage Progressive Actions */}
                            {ord.order_status === 'CONFIRMED' && (
                              <button
                                onClick={() => handleUpdateStage(ord.id, 'PREPARING')}
                                className="px-2 py-1 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-[10px] font-bold cursor-pointer"
                              >
                                Start Preparing
                              </button>
                            )}
                            {ord.order_status === 'PREPARING' && (
                              <button
                                onClick={() => handleUpdateStage(ord.id, 'PACKED')}
                                className="px-2 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-[10px] font-bold cursor-pointer"
                              >
                                Mark Packed
                              </button>
                            )}
                            {ord.order_status === 'PACKED' && (
                              <button
                                onClick={() => handleUpdateStage(ord.id, 'DISPATCHED')}
                                className="px-2 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold cursor-pointer"
                              >
                                Mark Dispatched
                              </button>
                            )}
                            {ord.order_status === 'DISPATCHED' && (
                              <button
                                onClick={() => handleUpdateStage(ord.id, 'OUT_FOR_DELIVERY')}
                                className="px-2 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-bold cursor-pointer"
                              >
                                Out for Delivery
                              </button>
                            )}
                            {ord.order_status === 'OUT_FOR_DELIVERY' && (
                              <button
                                onClick={() => handleUpdateStage(ord.id, 'DELIVERED')}
                                className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold cursor-pointer"
                              >
                                Confirm Delivered
                              </button>
                            )}
                            {!isDelivered && !isCancelled && (
                              <button
                                onClick={() => handleUpdateStage(ord.id, 'CANCELLED')}
                                className="px-2 py-1 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 text-[10px] font-bold cursor-pointer"
                                title="Cancel Order & Restore Stock"
                              >
                                Cancel
                              </button>
                            )}
                            <button
                              onClick={() => onTrackOrder && onTrackOrder(ord.id)}
                              className="px-2 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 text-[10px] font-bold cursor-pointer"
                            >
                              Details
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>AgriSense Multi-Role Supply & Delivery Controller</span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-colors cursor-pointer"
          >
            Close Dashboard
          </button>
        </div>
      </div>

      {/* SUB-MODAL 1: ETA Adjuster Modal */}
      {etaOrder && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-md shadow-2xl border border-slate-300 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Timer className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-black text-slate-900">Adjust Delivery ETA in Minutes</h3>
              </div>
              <button onClick={() => setEtaOrder(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Order: <span className="font-mono font-bold text-slate-900">{etaOrder.order_number}</span>
              <br />
              Current Duration: <b>{etaOrder.estimated_duration_minutes || 50} mins</b> (from Dharmaram Mandi Hub)
            </p>

            <form onSubmit={handleSaveEta} className="space-y-3.5">
              {/* Extra Minutes Pills */}
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1.5">
                  Additional Minutes to Add:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[10, 15, 30, 45].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setExtraMinutes(mins)}
                      className={`py-2 rounded-xl font-mono text-xs font-black transition-all cursor-pointer ${
                        extraMinutes === mins
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                      }`}
                    >
                      +{mins}m
                    </button>
                  ))}
                </div>
              </div>

              {/* Delay Reason Input */}
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1">
                  Reason for Delivery Delay:
                </label>
                <select
                  value={delayReason}
                  onChange={(e) => setDelayReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 bg-white focus:outline-amber-600 mb-2"
                >
                  <option value="Rural road monsoon waterlogging">Rural road monsoon waterlogging</option>
                  <option value="Traffic congestion at Mandi Hub checkpoint">Traffic congestion at Mandi Hub checkpoint</option>
                  <option value="Heavy rain / reduced vehicle speed">Heavy rain / reduced vehicle speed</option>
                  <option value="Tractor crossing delay on rural panchayat road">Tractor crossing delay on rural panchayat road</option>
                  <option value="Fertilizer batch quality check delay">Fertilizer batch quality check delay</option>
                </select>
                <input
                  type="text"
                  placeholder="Or enter custom reason..."
                  value={delayReason}
                  onChange={(e) => setDelayReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 bg-white focus:outline-amber-600"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl text-xs text-amber-900 border border-amber-200">
                New estimated arrival duration will be: <b>{(etaOrder.estimated_duration_minutes || 50) + Number(extraMinutes)} minutes</b>.
                Farmer tracking countdown will automatically update.
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setEtaOrder(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEta}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSavingEta ? 'Updating...' : 'Save & Adjust ETA'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUB-MODAL 2: Assign Partner Modal */}
      {partnerOrder && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-md shadow-2xl border border-slate-300 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-teal-600" />
                <h3 className="text-base font-black text-slate-900">Assign Delivery Partner</h3>
              </div>
              <button onClick={() => setPartnerOrder(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Order: <span className="font-mono font-bold text-slate-900">{partnerOrder.order_number}</span>
              <br />
              Destination: {partnerOrder.delivery_address?.village}, {partnerOrder.delivery_address?.mandal}
            </p>

            <form onSubmit={handleSavePartner} className="space-y-3">
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700">
                Select Fleet Driver & Vehicle:
              </label>

              <div className="space-y-2">
                {AVAILABLE_PARTNERS.map((p, idx) => (
                  <div
                    key={p.name}
                    onClick={() => setSelectedPartnerIndex(idx)}
                    className={`p-3 rounded-2xl border text-xs cursor-pointer transition-all ${
                      selectedPartnerIndex === idx
                        ? 'border-teal-600 bg-teal-50/80 ring-2 ring-teal-200'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex justify-between items-center font-bold text-slate-900">
                      <span>{p.name}</span>
                      <span className="text-teal-700">{p.phone}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">{p.vehicle}</p>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPartnerOrder(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingPartner}
                  className="px-5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-black text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSavingPartner ? 'Assigning...' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
