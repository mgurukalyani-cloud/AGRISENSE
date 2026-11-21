import React, { useState } from 'react';
import { X, ShieldCheck, MapPin, Tag, Truck, CheckCircle2, ArrowRight, AlertCircle, RefreshCw } from 'lucide-react';
import { storeClient } from '../../services/storeClientService';

export default function CheckoutBillingModal({ cart, isOpen, onClose, onOrderCreated }) {
  const [formData, setFormData] = useState({
    fullName: 'Rameshwar Rao',
    phone: '9848022338',
    village: 'Appannapet',
    mandal: 'Dharmaram',
    district: 'Peddapalli',
    state: 'Telangana',
    pincode: '505187',
    landmark: 'Near Gram Panchayat Borewell Shed',
    deliveryInstructions: 'Deliver directly to farm gate storage shed.'
  });

  const [couponCode, setCouponCode] = useState('KISAN100');
  const [appliedCoupon, setAppliedCoupon] = useState('KISAN100');
  const [discountAmount, setDiscountAmount] = useState(100.0);
  const [couponMsg, setCouponMsg] = useState({ type: 'success', text: 'Coupon KISAN100 applied: ₹100 Off!' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  if (!isOpen || !cart) return null;

  const subtotal = cart.subtotal || 0;
  const deliveryFee = cart.delivery_fee || 0;
  const subsidySaved = cart.subsidy_saved || 0;
  const grandTotal = Math.max(1, subtotal + deliveryFee - discountAmount);

  const handleApplyCoupon = () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) {
      setAppliedCoupon(null);
      setDiscountAmount(0);
      setCouponMsg(null);
      return;
    }

    if (code === 'KISAN100') {
      if (subtotal >= 1000) {
        setAppliedCoupon('KISAN100');
        setDiscountAmount(100.0);
        setCouponMsg({ type: 'success', text: 'Coupon KISAN100 applied: Flat ₹100 Off!' });
      } else {
        setCouponMsg({ type: 'error', text: 'Coupon KISAN100 requires minimum order of ₹1,000' });
      }
    } else if (code === 'AGRI50') {
      if (subtotal >= 500) {
        setAppliedCoupon('AGRI50');
        setDiscountAmount(50.0);
        setCouponMsg({ type: 'success', text: 'Coupon AGRI50 applied: Flat ₹50 Off!' });
      } else {
        setCouponMsg({ type: 'error', text: 'Coupon AGRI50 requires minimum order of ₹500' });
      }
    } else if (code === 'PMKISAN') {
      const disc = Math.min(300, subtotal * 0.05);
      setAppliedCoupon('PMKISAN');
      setDiscountAmount(disc);
      setCouponMsg({ type: 'success', text: `Coupon PMKISAN applied: 5% Subsidy Rebate (-₹${disc.toFixed(2)})` });
    } else {
      setCouponMsg({ type: 'error', text: 'Invalid coupon code. Try KISAN100, AGRI50, or PMKISAN.' });
    }
  };

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.phone || !formData.village || !formData.pincode) {
      setErrorMsg('Please fill in all mandatory delivery address fields.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const deliveryAddress = {
      full_name: formData.fullName,
      phone: formData.phone,
      village: formData.village,
      mandal: formData.mandal,
      district: formData.district,
      state: formData.state,
      pincode: formData.pincode,
      farm_landmark: formData.landmark
    };

    try {
      const result = await storeClient.checkout(deliveryAddress, appliedCoupon, formData.deliveryInstructions);
      if (result.success) {
        if (onOrderCreated) {
          onOrderCreated(result);
        }
      } else {
        setErrorMsg(result.message || 'Checkout failed. Please check inventory stock.');
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

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
              <MapPin className="w-5 h-5" />
            </span>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-600/70 border border-emerald-400/40 text-emerald-100">
                Direct Farm Delivery Checkout
              </span>
              <h2 className="text-base sm:text-lg font-black text-white mt-0.5">
                Farmer Billing & Shipping
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

        {/* Content Body Form */}
        <form onSubmit={handleCheckoutSubmit} className="overflow-y-auto p-5 sm:p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Delivery Address Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-700" />
              1. Farm Shipping Address (Primary Location)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Farmer / Recipient Name *</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">WhatsApp / Mobile Number *</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-mono font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Village / Gram Panchayat *</label>
                <input
                  type="text"
                  required
                  value={formData.village}
                  onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mandal / Tehsil *</label>
                <input
                  type="text"
                  required
                  value={formData.mandal}
                  onChange={(e) => setFormData({ ...formData, mandal: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">District & State *</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-900"
                  />
                  <input
                    type="text"
                    required
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Postal PIN Code *</label>
                <input
                  type="text"
                  required
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-mono font-semibold text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 text-xs">Farm Landmark / Storage Shed Notes</label>
              <input
                type="text"
                placeholder="e.g. Near village transformer, storage godown at Survey 42"
                value={formData.landmark}
                onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-xs font-medium text-slate-800"
              />
            </div>
          </div>

          {/* Coupon Code Strip */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <h3 className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-emerald-700" />
              2. Kisan Subsidy & Discount Coupons
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter coupon (KISAN100, AGRI50, PMKISAN)"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-mono font-bold uppercase tracking-wider text-slate-900"
              />
              <button
                type="button"
                onClick={handleApplyCoupon}
                className="px-4 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Apply
              </button>
            </div>
            {couponMsg && (
              <p className={`text-[11px] font-bold ${couponMsg.type === 'success' ? 'text-emerald-700' : 'text-rose-600'}`}>
                {couponMsg.text}
              </p>
            )}
          </div>

          {/* Pre-payment Invoice Summary */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-2.5 text-xs">
            <h3 className="font-black text-emerald-950 uppercase tracking-wider text-[11px]">
              3. Itemized Invoice Review ({cart.total_items} items)
            </h3>
            
            <div className="divide-y divide-emerald-200/60 text-slate-700 space-y-1.5 pt-1">
              <div className="flex justify-between pt-1">
                <span>Items Subtotal:</span>
                <span className="font-mono font-bold text-slate-900">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-1 text-slate-500">
                <span>Included GST (5% & 18%):</span>
                <span className="font-mono">₹{cart.gst_breakdown?.total_tax || '0.00'}</span>
              </div>
              <div className="flex justify-between pt-1">
                <span>Kisan Express Farm Delivery:</span>
                <span className="font-mono font-bold text-emerald-700">
                  {deliveryFee === 0 ? 'FREE (Orders > ₹1,000)' : `₹${deliveryFee.toFixed(2)}`}
                </span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between pt-1 text-emerald-700 font-bold">
                  <span>Coupon Discount ({appliedCoupon}):</span>
                  <span className="font-mono">-₹{discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 text-sm font-black text-[#0a4d33] border-t-2 border-emerald-300">
                <span>Total Amount Payable:</span>
                <span className="font-mono text-base">₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {subsidySaved > 0 && (
              <div className="mt-2 p-2 rounded-xl bg-emerald-100/80 border border-emerald-300 text-emerald-900 text-[11px] font-bold flex items-center justify-between">
                <span>Total DBT Subsidy Saved:</span>
                <span className="font-black font-mono">₹{subsidySaved.toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Action Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#0a4d33] to-emerald-800 hover:from-emerald-900 hover:to-emerald-950 text-white font-black text-sm shadow-lg shadow-emerald-950/20 flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Generating Official UPI QR Order...</span>
                </>
              ) : (
                <>
                  <span>Proceed to UPI QR Payment • ₹{grandTotal.toFixed(2)}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
