import React, { useState, useEffect } from 'react';
import { X, QrCode, CheckCircle2, AlertTriangle, ShieldCheck, Clock, Smartphone, RefreshCw, ArrowRight } from 'lucide-react';
import { storeClient } from '../../services/storeClientService';

export default function QRPaymentModal({ orderData, isOpen, onClose, onPaymentConfirmed }) {
  const [timeLeft, setTimeLeft] = useState(900); // 15 mins
  const [isVerifying, setIsVerifying] = useState(false);
  const [status, setStatus] = useState('PENDING'); // 'PENDING' | 'SUCCESS' | 'FAILED'
  const [confirmedData, setConfirmedData] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    if (!isOpen || !orderData) return;
    setStatus('PENDING');
    setErrorMsg(null);
    setTimeLeft(900);

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setStatus('FAILED');
          setErrorMsg('QR code has expired. Please retry payment.');
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, orderData]);

  if (!isOpen || !orderData) return null;

  const payment = orderData.payment || {};
  const orderNumber = orderData.order_number;
  const grandTotal = orderData.grand_total;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  // Simulate or process sandbox payment
  const handleSimulatePayment = async (outcome = 'SUCCESS') => {
    setIsVerifying(true);
    setErrorMsg(null);
    try {
      const res = await storeClient.simulateSandboxPayment(orderData.order_id, outcome);
      if (res.success && outcome === 'SUCCESS') {
        setStatus('SUCCESS');
        setConfirmedData(res);
        if (onPaymentConfirmed) {
          setTimeout(() => onPaymentConfirmed(res), 1500);
        }
      } else {
        setStatus('FAILED');
        setErrorMsg(res.message || 'Payment simulation failed.');
      }
    } catch (e) {
      setErrorMsg(e.message);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-emerald-900/20 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0a4d33] via-emerald-900 to-emerald-950 text-white px-5 sm:px-6 py-4 flex items-center justify-between border-b border-emerald-500/30">
          <div className="flex items-center space-x-2.5">
            <span className="p-2 rounded-xl bg-emerald-800/80 border border-emerald-500/40 text-emerald-200">
              <QrCode className="w-5 h-5" />
            </span>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-600/70 border border-emerald-400/40 text-emerald-100">
                Official Indian UPI Dynamic Payment
              </span>
              <h2 className="text-base sm:text-lg font-black text-white mt-0.5">
                Scan & Pay ₹{grandTotal?.toFixed(2)}
              </h2>
            </div>
          </div>
          {status !== 'SUCCESS' && (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-4 text-center">
          {status === 'SUCCESS' ? (
            <div className="py-6 space-y-3 animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center shadow-md">
                <CheckCircle2 className="w-10 h-10 animate-bounce" />
              </div>
              <h3 className="text-lg font-black text-slate-900">Payment Successfully Verified!</h3>
              <p className="text-xs text-slate-600 max-w-xs mx-auto">
                Cryptographic HMAC signature verified. Your order has been confirmed for dispatch.
              </p>
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs font-mono text-emerald-950 text-left space-y-1">
                <div><b>Order Ref:</b> {orderNumber}</div>
                <div><b>Amount Paid:</b> ₹{grandTotal?.toFixed(2)}</div>
                <div><b>Carrier AWB:</b> {confirmedData?.tracking_awb || 'AGRI-EXPR-PENDING'}</div>
                <div><b>Status:</b> CONFIRMED & ALLOCATED</div>
              </div>
            </div>
          ) : (
            <>
              {/* Order Info Strip */}
              <div className="flex items-center justify-between text-xs p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/80">
                <div className="text-left">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Order Ref</span>
                  <p className="font-mono font-bold text-slate-800">{orderNumber}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Expiring in</span>
                  <p className="font-mono font-bold text-rose-700 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                  </p>
                </div>
              </div>

              {/* Dynamic QR Code Box */}
              <div className="inline-block p-4 bg-white rounded-3xl border-2 border-dashed border-emerald-600/40 shadow-inner my-1">
                {payment.qr_svg ? (
                  <div
                    dangerouslySetInnerHTML={{ __html: payment.qr_svg }}
                    className="mx-auto flex items-center justify-center"
                  />
                ) : (
                  <div className="w-60 h-60 flex items-center justify-center bg-slate-100 rounded-2xl">
                    <QrCode className="w-20 h-20 text-slate-400 animate-pulse" />
                  </div>
                )}
                <p className="text-[11px] font-bold text-slate-600 mt-2">
                  UPI VPA: <span className="font-mono text-emerald-900 font-extrabold">agrisense.payments@icici</span>
                </p>
              </div>

              {/* Supported UPI Apps */}
              <div>
                <p className="text-[11px] font-black uppercase text-slate-500 tracking-wider mb-2">
                  Scan with any supported UPI App
                </p>
                <div className="flex items-center justify-center gap-2">
                  <span className="px-2.5 py-1 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold">
                    Google Pay
                  </span>
                  <span className="px-2.5 py-1 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold">
                    PhonePe
                  </span>
                  <span className="px-2.5 py-1 rounded-xl bg-sky-50 text-sky-700 border border-sky-200 text-xs font-bold">
                    Paytm
                  </span>
                  <span className="px-2.5 py-1 rounded-xl bg-teal-50 text-teal-700 border border-teal-200 text-xs font-bold">
                    BHIM
                  </span>
                </div>
              </div>

              {/* Error Alert */}
              {errorMsg && (
                <div className="p-3 bg-rose-50 text-rose-800 rounded-xl border border-rose-200 text-xs font-bold">
                  {errorMsg}
                </div>
              )}

              {/* Test Sandbox Verification Trigger */}
              <div className="p-3.5 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200/80 text-left space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-700" />
                    Gateway Test Sandbox
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-200 text-amber-900">
                    Test Mode
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-tight">
                  Simulate official bank payment callback. Backend will compute real HMAC-SHA256 signature to verify transaction authenticity.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => handleSimulatePayment('SUCCESS')}
                    disabled={isVerifying}
                    className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-700 to-[#0a4d33] hover:from-emerald-800 hover:to-emerald-950 text-white font-black text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isVerifying ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Verifying HMAC...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Simulate Payment Success (Verify & Confirm)</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleSimulatePayment('FAILED')}
                    disabled={isVerifying}
                    className="py-2 px-2.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
                    title="Simulate Declined Payment"
                  >
                    Fail Test
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
            256-bit Encrypted NPCI UPI Rail
          </span>
          {status === 'SUCCESS' && (
            <button
              onClick={() => onPaymentConfirmed && onPaymentConfirmed(confirmedData)}
              className="px-4 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold transition-colors cursor-pointer"
            >
              Continue to Tracking
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
