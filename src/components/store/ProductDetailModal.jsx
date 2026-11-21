import React, { useState } from 'react';
import { X, ShieldCheck, CheckCircle2, AlertTriangle, Truck, Tag, ShoppingCart, Sparkles, Scale, Info } from 'lucide-react';

export default function ProductDetailModal({ product, isOpen, onClose, onAddToCart }) {
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  if (!isOpen || !product) return null;

  const handleAdd = () => {
    if (onAddToCart) {
      onAddToCart(product.id, qty);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    }
  };

  const isLowStock = product.stock_quantity < 20;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-emerald-900/20 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0a4d33] via-emerald-900 to-emerald-950 text-white px-6 py-4.5 flex items-center justify-between border-b border-emerald-500/30">
          <div className="flex items-center space-x-2.5">
            <span className="p-2 rounded-xl bg-emerald-800/80 border border-emerald-500/40 text-emerald-200">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-600/60 border border-emerald-400/40 text-emerald-100">
                  {product.category_name}
                </span>
                {product.cibrc_reg_no && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/30 border border-amber-300/40 text-amber-200">
                    Reg: {product.cibrc_reg_no}
                  </span>
                )}
              </div>
              <h2 className="text-base sm:text-lg font-black text-white mt-0.5 leading-tight">
                {product.name}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Brand & Price Header Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50/80 to-teal-50/60 border border-emerald-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Manufacturer / Brand</p>
              <p className="text-base font-black text-slate-900 flex items-center gap-1.5 mt-0.5">
                {product.brand}
                <ShieldCheck className="w-4 h-4 text-emerald-600 inline" />
              </p>
              <p className="text-xs text-slate-600 mt-1 flex items-center gap-3">
                <span>Pack: <b>{product.pack_size} {product.pack_unit}</b></span>
                <span>•</span>
                <span>GST Rate: <b>{product.gst_rate}%</b> (HSN {product.hsn_code})</span>
              </p>
            </div>

            <div className="sm:text-right">
              <div className="flex items-baseline sm:justify-end gap-2">
                <span className="text-2xl sm:text-3xl font-black text-[#0a4d33]">₹{product.mrp.toFixed(2)}</span>
                {product.original_price > product.mrp && (
                  <span className="text-sm font-semibold text-slate-400 line-through">
                    ₹{product.original_price.toFixed(2)}
                  </span>
                )}
              </div>
              {product.subsidy_saved > 0 && (
                <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black border border-emerald-300">
                  Save ₹{product.subsidy_saved.toFixed(2)} via Govt DBT
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-xs font-black uppercase text-slate-700 tracking-wider mb-1.5 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-emerald-700" />
              Product Description & Agronomic Action
            </h3>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              {product.description}
            </p>
          </div>

          {/* Telugu Description if available */}
          {product.description_te && (
            <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 text-xs text-emerald-950 font-medium">
              <span className="font-bold text-emerald-800">తెలుగు వివరణ: </span>
              {product.description_te}
            </div>
          )}

          {/* Usage Instructions & Suitable Crops */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-emerald-700" />
                Dosage & Application Instructions
              </h4>
              <p className="text-xs text-slate-700 leading-normal">
                {product.usage_instructions}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                Recommended Crops
              </h4>
              <p className="text-xs text-slate-700 leading-normal font-semibold">
                {product.suitable_crops}
              </p>
            </div>
          </div>

          {/* Stock & Delivery Note */}
          <div className="flex items-center justify-between text-xs p-3 rounded-xl bg-slate-100/80 text-slate-600">
            <span className="flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-emerald-700" />
              Direct Farm Delivery: 1 - 2 Business Days via Kisan Express
            </span>
            <span className={`font-bold px-2 py-0.5 rounded-md ${isLowStock ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
              {product.stock_quantity > 0 ? `${product.stock_quantity} In Stock` : 'Out of Stock'}
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-600">Quantity:</span>
            <div className="flex items-center border border-slate-300 rounded-xl bg-white overflow-hidden shadow-2xs">
              <button
                type="button"
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="px-2.5 py-1 text-slate-700 font-black hover:bg-slate-100 transition-colors cursor-pointer"
              >
                -
              </button>
              <span className="px-3 py-1 text-xs font-black text-slate-800">{qty}</span>
              <button
                type="button"
                onClick={() => setQty(Math.min(product.stock_quantity, qty + 1))}
                className="px-2.5 py-1 text-slate-700 font-black hover:bg-slate-100 transition-colors cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleAdd}
              disabled={product.stock_quantity <= 0}
              className={`px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm flex items-center space-x-2 shadow-md transition-all cursor-pointer ${
                added
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gradient-to-r from-[#0a4d33] to-emerald-800 hover:from-emerald-900 hover:to-emerald-950 text-white'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>{added ? 'Added to Cart!' : `Add to Cart • ₹${(product.mrp * qty).toFixed(2)}`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
