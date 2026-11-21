import React from 'react';
import { X, ShoppingBag, Trash2, Plus, Minus, ArrowRight, ShieldCheck, Tag, Sparkles } from 'lucide-react';
import { storeClient } from '../../services/storeClientService';

export default function ShoppingCartDrawer({ cart, isOpen, onClose, onProceedToCheckout }) {
  if (!isOpen) return null;

  const items = cart?.items || [];
  const subtotal = cart?.subtotal || 0;
  const deliveryFee = cart?.delivery_fee || 0;
  const subsidySaved = cart?.subsidy_saved || 0;
  const grandTotal = cart?.grand_total || 0;

  const freeDeliveryThreshold = 1000;
  const amountToFreeDelivery = Math.max(0, freeDeliveryThreshold - subtotal);
  const freeDeliveryPct = Math.min(100, (subtotal / freeDeliveryThreshold) * 100);

  const handleUpdateQty = (productId, newQty) => {
    storeClient.updateQuantity(productId, newQty);
  };

  const handleRemove = (productId) => {
    storeClient.removeFromCart(productId);
  };

  const handleClear = () => {
    if (window.confirm('Are you sure you want to empty your agricultural cart?')) {
      storeClient.clearCart();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-l border-emerald-900/10">
          {/* Header */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-[#0a4d33] via-emerald-900 to-emerald-950 text-white flex items-center justify-between border-b border-emerald-500/30">
            <div className="flex items-center space-x-2.5">
              <span className="p-2 rounded-xl bg-emerald-800/80 border border-emerald-500/40 text-emerald-200">
                <ShoppingBag className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-base font-black text-white leading-tight">
                  Kisan Shopping Cart
                </h2>
                <p className="text-[10px] text-emerald-200 font-bold uppercase tracking-wider">
                  {cart?.total_items || 0} Agricultural Item(s)
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {items.length > 0 && (
                <button
                  onClick={handleClear}
                  className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-rose-600/80 text-white text-[11px] font-bold transition-colors cursor-pointer"
                  title="Empty Cart"
                >
                  Clear
                </button>
              )}
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Free Delivery Tracker */}
          <div className="px-5 py-2.5 bg-emerald-50 border-b border-emerald-200/80 text-xs">
            {amountToFreeDelivery > 0 ? (
              <div>
                <div className="flex justify-between text-[11px] font-bold text-emerald-950 mb-1">
                  <span>Add ₹{amountToFreeDelivery.toFixed(2)} for FREE farm delivery</span>
                  <span>{Math.round(freeDeliveryPct)}%</span>
                </div>
                <div className="w-full h-1.5 bg-emerald-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 transition-all duration-300 rounded-full"
                    style={{ width: `${freeDeliveryPct}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="text-[11px] font-bold text-emerald-800 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>You unlocked <b>FREE Farm Delivery</b> on this order!</span>
              </div>
            )}
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
            {items.length === 0 ? (
              <div className="py-20 text-center space-y-3 text-slate-400">
                <div className="w-16 h-16 rounded-full bg-slate-100 mx-auto flex items-center justify-center text-slate-300">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="text-sm font-bold text-slate-600">Your Agricultural Cart is Empty</h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Browse fertilizers, organic manures, seeds, and farm protection products from the AgriSense Store.
                </p>
                <button
                  onClick={onClose}
                  className="mt-2 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              items.map((item) => {
                const lineTotal = item.mrp * item.quantity;
                const isMax = item.quantity >= item.stock_quantity;

                return (
                  <div
                    key={item.id}
                    className="p-3 sm:p-3.5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-emerald-300 transition-all space-y-2 shadow-2xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-800">
                          {item.category_name}
                        </span>
                        <h4 className="text-xs font-black text-slate-900 mt-1 leading-tight">
                          {item.name}
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          {item.brand} • {item.pack_size} {item.pack_unit}
                        </p>
                      </div>

                      <button
                        onClick={() => handleRemove(item.id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/80">
                      <div>
                        <span className="text-xs font-black text-[#0a4d33]">₹{lineTotal.toFixed(2)}</span>
                        <span className="text-[10px] text-slate-400 ml-1">
                          (₹{item.mrp}/unit)
                        </span>
                      </div>

                      {/* Quantity Stepper */}
                      <div className="flex items-center border border-slate-300 rounded-xl bg-white shadow-2xs overflow-hidden">
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(item.id, item.quantity - 1)}
                          className="px-2 py-0.5 text-slate-700 hover:bg-slate-100 font-black text-xs cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2.5 py-0.5 text-xs font-black text-slate-900">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          disabled={isMax}
                          onClick={() => handleUpdateQty(item.id, item.quantity + 1)}
                          className="px-2 py-0.5 text-slate-700 hover:bg-slate-100 font-black text-xs cursor-pointer disabled:opacity-40"
                          title={isMax ? 'Maximum available stock reached' : 'Add one'}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Cart Summary & Checkout Footer */}
          {items.length > 0 && (
            <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 space-y-3">
              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-mono font-bold text-slate-900">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Farm Delivery Freight:</span>
                  <span className="font-mono font-bold text-emerald-700">
                    {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee.toFixed(2)}`}
                  </span>
                </div>
                {subsidySaved > 0 && (
                  <div className="flex justify-between text-emerald-800 font-bold">
                    <span>Govt DBT Subsidy Saved:</span>
                    <span className="font-mono">₹{subsidySaved.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black text-[#0a4d33] border-t border-slate-300 pt-2">
                  <span>Payable Amount:</span>
                  <span className="font-mono text-base">₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={onProceedToCheckout}
                className="w-full py-3 px-5 rounded-2xl bg-gradient-to-r from-[#0a4d33] to-emerald-800 hover:from-emerald-900 hover:to-emerald-950 text-white font-black text-xs sm:text-sm shadow-lg shadow-emerald-950/20 flex items-center justify-center space-x-2 transition-all cursor-pointer"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
