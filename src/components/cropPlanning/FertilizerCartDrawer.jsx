import React, { useState, useEffect } from 'react';
import { 
  X, ShoppingCart, Trash2, Plus, Minus, CheckCircle2, ShieldCheck, 
  MapPin, Phone, User, ArrowRight, Sparkles, AlertCircle, ExternalLink, Package 
} from 'lucide-react';
import { fertilizerStoreService } from '../../services/fertilizerStoreService';

export default function FertilizerCartDrawer({ isOpen, onClose, farmerProfile = {} }) {
  const [cart, setCart] = useState([]);
  const [totals, setTotals] = useState({
    itemCount: 0,
    totalBags: 0,
    subtotal: 0,
    totalSubsidySaved: 0,
    deliveryFee: 0,
    grandTotal: 0
  });

  const [checkoutStep, setCheckoutStep] = useState('cart'); // 'cart' | 'checkout' | 'success'
  const [confirmedOrder, setConfirmedOrder] = useState(null);

  const [shippingForm, setShippingForm] = useState({
    name: 'Sardar Gurpreet Singh',
    phone: '+91 98765 43210',
    village: farmerProfile.village || 'Ayali Kalan',
    mandal: farmerProfile.mandal || 'Ludhiana East',
    district: farmerProfile.district || 'Ludhiana',
    state: farmerProfile.state || 'Punjab',
    paymentMode: 'kisan_cod'
  });

  useEffect(() => {
    const update = () => {
      setCart(fertilizerStoreService.getCart());
      setTotals(fertilizerStoreService.getCartTotals());
    };
    update();
    const unsubscribe = fertilizerStoreService.subscribe(update);
    return () => unsubscribe();
  }, [isOpen]);

  useEffect(() => {
    if (farmerProfile) {
      setShippingForm((prev) => ({
        ...prev,
        village: farmerProfile.village || prev.village,
        mandal: farmerProfile.mandal || prev.mandal,
        district: farmerProfile.district || prev.district,
        state: farmerProfile.state || prev.state
      }));
    }
  }, [farmerProfile]);

  if (!isOpen) return null;

  const handleQtyChange = (itemId, currentQty, delta) => {
    const next = currentQty + delta;
    fertilizerStoreService.updateQuantity(itemId, next);
  };

  const handleRemove = (itemId) => {
    fertilizerStoreService.removeFromCart(itemId);
  };

  const handleConfirmOrder = (e) => {
    e.preventDefault();
    const order = fertilizerStoreService.createOrder({
      farmerName: shippingForm.name,
      phone: shippingForm.phone,
      village: shippingForm.village,
      mandal: shippingForm.mandal,
      district: shippingForm.district,
      state: shippingForm.state,
      paymentMode: shippingForm.paymentMode
    });
    if (order) {
      setConfirmedOrder(order);
      setCheckoutStep('success');
    }
  };

  const handleWhatsAppOrder = () => {
    if (!confirmedOrder) {
      const tempOrder = {
        orderId: `AGRI-DBT-DIRECT-${Date.now().toString(36).toUpperCase()}`,
        farmer: {
          name: shippingForm.name,
          phone: shippingForm.phone,
          location: `${shippingForm.village}, ${shippingForm.district}, ${shippingForm.state}`
        },
        items: cart,
        totals,
        paymentMode: shippingForm.paymentMode
      };
      const url = fertilizerStoreService.generateWhatsAppOrderUrl(tempOrder);
      window.open(url, '_blank');
    } else {
      const url = fertilizerStoreService.generateWhatsAppOrderUrl(confirmedOrder);
      window.open(url, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md sm:max-w-lg bg-slate-900 border-l border-emerald-500/30 text-white shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-250">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border-b border-emerald-800/40 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-md">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-black text-base sm:text-lg text-white tracking-tight">
                  Kisan Fertilizer Cart
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  DBT Subsidized
                </span>
              </div>
              <p className="text-xs text-emerald-300/80">
                {totals.totalBags} bags ready for direct farm delivery
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          
          {/* STEP 1: CART VIEW */}
          {checkoutStep === 'cart' && (
            <>
              {cart.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <Package className="w-12 h-12 text-slate-600 mx-auto" />
                  <h4 className="font-bold text-slate-300 text-sm">Your Fertilizer Cart is Empty</h4>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    View any recommended crop card and click &ldquo;Add to Cart&rdquo; to purchase predicted Urea, DAP, or MOP bags.
                  </p>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors cursor-pointer"
                  >
                    Browse Recommended Crops
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-emerald-500/30 transition-all space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <div className="flex items-center space-x-1.5">
                            <h5 className="font-bold text-white text-xs sm:text-sm">{item.name}</h5>
                            <span className="text-[10px] text-slate-400 font-mono">({item.bagWeightKg}kg)</span>
                          </div>
                          <p className="text-[11px] text-slate-400">{item.brand}</p>
                          {item.cropName && (
                            <span className="inline-block text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.2 rounded border border-emerald-500/20">
                              For {item.cropName}
                            </span>
                          )}
                        </div>

                        <button
                          onClick={() => handleRemove(item.id)}
                          className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-900 transition-colors cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Quantity and Price */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                        {/* Qty controller */}
                        <div className="flex items-center space-x-2 bg-slate-900 rounded-xl p-1 border border-slate-700">
                          <button
                            onClick={() => handleQtyChange(item.id, item.quantity, -1)}
                            className="p-1 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-8 text-center text-xs font-black text-emerald-400">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleQtyChange(item.id, item.quantity, 1)}
                            className="p-1 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Price */}
                        <div className="text-right">
                          <div className="text-sm font-black text-white font-mono">
                            ₹{(item.mrp * item.quantity).toLocaleString()}
                          </div>
                          <div className="text-[10px] text-emerald-400 font-medium">
                            Saved ₹{(item.subsidySaved * item.quantity).toLocaleString()} DBT
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Subsidy Highlight Banner */}
                  <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 flex items-start space-x-2.5">
                    <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div className="space-y-0.5 text-xs text-slate-300">
                      <strong className="text-emerald-300 block font-bold">Government Direct Benefit Transfer (DBT)</strong>
                      <p className="text-[11px] leading-relaxed">
                        You save <strong className="text-emerald-400 font-bold">₹{totals.totalSubsidySaved.toLocaleString()}</strong> through official central fertilizer subsidies on this booking.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* STEP 2: CHECKOUT & ADDRESS VERIFICATION */}
          {checkoutStep === 'checkout' && (
            <form onSubmit={handleConfirmOrder} className="space-y-4 animate-in fade-in">
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <MapPin className="w-4 h-4" />
                  <span>Farm Delivery & Farmer Verification</span>
                </h4>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-400">Farmer Name</label>
                    <input
                      type="text"
                      required
                      value={shippingForm.name}
                      onChange={(e) => setShippingForm({ ...shippingForm, name: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-400">Contact Number</label>
                    <input
                      type="tel"
                      required
                      value={shippingForm.phone}
                      onChange={(e) => setShippingForm({ ...shippingForm, phone: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-400">Village / Field Location</label>
                    <input
                      type="text"
                      required
                      value={shippingForm.village}
                      onChange={(e) => setShippingForm({ ...shippingForm, village: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-400">District & State</label>
                    <input
                      type="text"
                      required
                      value={`${shippingForm.district}, ${shippingForm.state}`}
                      onChange={(e) => setShippingForm({ ...shippingForm, district: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Payment Option */}
                <div className="space-y-1.5 pt-2">
                  <label className="text-[11px] text-slate-400 block">Payment Mode</label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setShippingForm({ ...shippingForm, paymentMode: 'kisan_cod' })}
                      className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                        shippingForm.paymentMode === 'kisan_cod'
                          ? 'bg-emerald-950/60 border-emerald-500 text-white font-bold'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      <span className="block text-xs text-white">Cash on Delivery</span>
                      <span className="text-[10px] text-slate-400">Pay at Kisan Kendra</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShippingForm({ ...shippingForm, paymentMode: 'kcc_upi' })}
                      className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                        shippingForm.paymentMode === 'kcc_upi'
                          ? 'bg-emerald-950/60 border-emerald-500 text-white font-bold'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      <span className="block text-xs text-white">KCC / UPI</span>
                      <span className="text-[10px] text-slate-400">Kisan Credit Card</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Order summary card */}
              <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Total Bags:</span>
                  <span className="font-bold text-white">{totals.totalBags} bags</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Subsidized Price:</span>
                  <span className="font-bold text-white">₹{totals.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-emerald-400">
                  <span>Govt DBT Subsidy Saved:</span>
                  <span className="font-bold">-₹{totals.totalSubsidySaved.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Kisan Delivery:</span>
                  <span className="font-bold text-emerald-400">{totals.deliveryFee === 0 ? 'FREE' : `₹${totals.deliveryFee}`}</span>
                </div>
                <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-sm font-black text-white">
                  <span>Payable Amount:</span>
                  <span className="text-emerald-400 font-mono text-base">₹{totals.grandTotal.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setCheckoutStep('cart')}
                  className="px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer transition-colors"
                >
                  Back
                </button>

                <button
                  type="submit"
                  className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm Fertilizer Booking</span>
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: ORDER SUCCESS */}
          {checkoutStep === 'success' && confirmedOrder && (
            <div className="py-6 text-center space-y-4 animate-in zoom-in-95">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h4 className="font-black text-lg text-white">Fertilizer Booking Confirmed!</h4>
                <p className="text-xs text-slate-400">
                  Booking ID: <strong className="font-mono text-emerald-400">{confirmedOrder.orderId}</strong>
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs text-left space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Farmer:</span>
                  <span className="font-bold text-white">{confirmedOrder.farmer.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Delivery To:</span>
                  <span className="font-bold text-slate-200">{confirmedOrder.farmer.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Bags:</span>
                  <span className="font-bold text-emerald-400">{confirmedOrder.totals.totalBags} bags</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Amount to Pay:</span>
                  <span className="font-black text-white font-mono">₹{confirmedOrder.totals.grandTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-emerald-400">
                  <span>DBT Subsidy Claimed:</span>
                  <span className="font-bold">₹{confirmedOrder.totals.totalSubsidySaved.toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-800/80">
                  <span className="text-slate-400">Expected Dispatch:</span>
                  <span className="font-bold text-teal-300">{confirmedOrder.estimatedDelivery}</span>
                </div>
              </div>

              {/* WhatsApp notification action */}
              <button
                type="button"
                onClick={handleWhatsAppOrder}
                className="w-full py-3 px-4 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] text-white font-black text-xs sm:text-sm shadow-lg shadow-green-950/40 transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>Notify Local Fertilizer Dealer via WhatsApp</span>
                <ExternalLink className="w-4 h-4 ml-1" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setCheckoutStep('cart');
                  onClose();
                }}
                className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
              >
                Return to Crop Planning
              </button>
            </div>
          )}

        </div>

        {/* Footer Checkout Bar */}
        {checkoutStep === 'cart' && cart.length > 0 && (
          <div className="p-4 bg-slate-950/90 border-t border-slate-800 shrink-0 space-y-3">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between items-center text-slate-400">
                <span>Subtotal ({totals.totalBags} bags):</span>
                <span className="font-mono text-white font-bold">₹{totals.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-emerald-400">
                <span>Govt Subsidy Saved:</span>
                <span className="font-mono font-bold">-₹{totals.totalSubsidySaved.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-black text-white pt-1 border-t border-slate-800/80">
                <span>Payable:</span>
                <span className="text-emerald-400 font-mono text-base">₹{totals.grandTotal.toLocaleString()}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleWhatsAppOrder}
                className="py-3 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 font-bold text-xs flex items-center justify-center space-x-1 transition-colors cursor-pointer"
              >
                <span>WhatsApp Order</span>
              </button>

              <button
                type="button"
                onClick={() => setCheckoutStep('checkout')}
                className="py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs flex items-center justify-center space-x-1.5 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
              >
                <span>Proceed to Buy</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
