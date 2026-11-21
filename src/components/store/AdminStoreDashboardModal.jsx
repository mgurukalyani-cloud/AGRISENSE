import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, DollarSign, Package, AlertTriangle, Truck, RefreshCw, Search, CheckCircle2, Filter, Layers, UserCheck } from 'lucide-react';
import { storeClient } from '../../services/storeClientService';

export default function AdminStoreDashboardModal({ isOpen, onClose, onTrackOrder }) {
  const [role, setRole] = useState('ADMIN'); // 'ADMIN' | 'SUPPLIER' | 'DELIVERY'
  const [analytics, setAnalytics] = useState(null);
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [paymentFilter, setPaymentFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState(null);

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
    setActionMsg(`Updating order ${orderId} to ${newStatus}...`);
    try {
      const res = await storeClient.updateOrderStatus(orderId, newStatus, `Stage updated to ${newStatus} by ${role}`, role);
      if (res.success) {
        setActionMsg(`Success: Order updated to ${newStatus}!`);
        loadData();
        setTimeout(() => setActionMsg(null), 3000);
      } else {
        setActionMsg(`Error: ${res.message}`);
      }
    } catch (e) {
      setActionMsg(`Failed: ${e.message}`);
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
                  Store Operations Command
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
                  Role: {role}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white mt-0.5">
                AgriSense Admin, Inventory & Order Management
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Role Switcher Pill */}
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
                Supplier Hub
              </button>
              <button
                onClick={() => setRole('DELIVERY')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  role === 'DELIVERY' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Delivery Staff
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

        {/* Action / Notification Banner */}
        {actionMsg && (
          <div className="bg-emerald-100 text-emerald-900 px-4 py-2 text-xs font-bold border-b border-emerald-300 flex items-center justify-between">
            <span>{actionMsg}</span>
            <button onClick={() => setActionMsg(null)} className="text-emerald-700 hover:text-emerald-950 font-black">✕</button>
          </div>
        )}

        {/* Content Body */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Analytics Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500">Total Verified Collections</span>
              <p className="text-lg sm:text-xl font-black text-slate-900 font-mono">
                ₹{summary.total_revenue?.toFixed(2) || '0.00'}
              </p>
              <span className="text-[10px] text-emerald-700 font-bold block">
                {summary.paid_orders || 0} Paid Orders
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-1">
              <span className="text-[10px] uppercase font-bold text-emerald-800">Govt DBT Subsidy Disbursed</span>
              <p className="text-lg sm:text-xl font-black text-[#0a4d33] font-mono">
                ₹{summary.total_subsidy_saved?.toFixed(2) || '0.00'}
              </p>
              <span className="text-[10px] text-emerald-700 font-bold block">
                PM-PRANAM Verified
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500">Active Orders</span>
              <p className="text-lg sm:text-xl font-black text-slate-900 font-mono">
                {summary.total_orders || 0}
              </p>
              <span className="text-[10px] text-slate-500 font-semibold block">
                {summary.delivered_orders || 0} Delivered • {summary.cancelled_orders || 0} Cancelled
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-1">
              <span className="text-[10px] uppercase font-bold text-amber-900">Low Stock Warnings</span>
              <p className="text-lg sm:text-xl font-black text-amber-800 font-mono">
                {lowStock.length} Product(s)
              </p>
              <span className="text-[10px] text-amber-700 font-bold block">
                Threshold: &lt; 50 units
              </span>
            </div>
          </div>

          {/* Low Stock Alerts Strip */}
          {lowStock.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertTriangle className="w-4 h-4 text-amber-700" />
                <span>Inventory Low-Stock Warning:</span>
              </div>
              <div className="flex flex-wrap gap-2 pt-0.5">
                {lowStock.map(p => (
                  <span key={p.id} className="px-2.5 py-1 rounded-xl bg-white border border-amber-300 text-[11px] font-semibold text-slate-800">
                    {p.name} ({p.brand}): <b>{p.stock_quantity} left</b>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search orders by Order Number, Farmer Name or Village..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadData()}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-slate-500">Stage:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-2 py-1 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-800"
                >
                  <option value="ALL">All Stages</option>
                  <option value="PENDING_PAYMENT">Pending Payment</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="PROCESSING">Processing</option>
                  <option value="PACKED">Packed</option>
                  <option value="DISPATCHED">Dispatched</option>
                  <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                  <option value="DELIVERED">Delivered</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              <button
                onClick={loadData}
                className="p-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors cursor-pointer"
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
                  <th className="p-3">Date</th>
                  <th className="p-3 text-right">Amount</th>
                  <th className="p-3 text-center">Payment</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                {isLoading ? (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-700 mb-2" />
                      Loading operational records...
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

                    return (
                      <tr key={ord.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3 font-mono font-bold text-slate-900">
                          {ord.order_number}
                        </td>
                        <td className="p-3">
                          <p className="font-bold text-slate-900">{addr.full_name || 'Farmer'}</p>
                          <p className="text-[10px] text-slate-500">{addr.village}, {addr.mandal}</p>
                        </td>
                        <td className="p-3 text-slate-500 whitespace-nowrap">
                          {new Date(ord.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
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
                            'bg-blue-100 text-blue-800 border-blue-300'
                          }`}>
                            {ord.order_status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Stage advancement actions based on role */}
                            {ord.order_status === 'CONFIRMED' && (
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
                                title="Cancel Order & Restore Inventory"
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
          <span>AgriSense Multi-Role Supply & Logistics Controller</span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-colors cursor-pointer"
          >
            Close Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
