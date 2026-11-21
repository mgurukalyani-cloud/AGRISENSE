import React, { useState, useEffect } from 'react';
import {
  X,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Clock,
  Smartphone,
  RefreshCw,
  ArrowRight,
  Info,
  KeyRound,
  FileCheck
} from 'lucide-react';
import { storeClient } from '../../services/storeClientService';

export default function QRPaymentModal({ orderData, isOpen, onClose, onPaymentConfirmed }) {
  const [paymentMode, setPaymentMode] = useState('DYNAMIC'); // 'DYNAMIC' | 'STATIC_UTR'
  const [timeLeft, setTimeLeft] = useState(900); // 15 mins (900s)
  const [isVerifying, setIsVerifying] = useState(false);
  const [status, setStatus] = useState('PENDING'); // 'PENDING' | 'SUCCESS' | 'FAILED'
  const [confirmedData, setConfirmedData] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Static UTR Reconciliation Input
  const [utrNumber, setUtrNumber] = useState('');
  const [utrError, setUtrError] = useState(null);

  useEffect(() => {
    if (!isOpen || !orderData) return;
    setStatus('PENDING');
    setErrorMsg(null);
    setUtrNumber('');
    setUtrError(null);
    setTimeLeft(900);

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setStatus('FAILED');
          setErrorMsg('Payment QR code has expired (15-minute window). Please retry or refresh.');
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
  const grandTotal = Number(orderData.grand_total || 0);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  // Simulate or process dynamic payment
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

  // Submit manual 12-digit UTR from Static Merchant Counter QR
  const handleVerifyUTR = async (e) => {
    e.preventDefault();
    setUtrError(null);
    const clean = utrNumber.trim().replace(/\s+/g, '');

    if (!/^\d{12}$/.test(clean)) {
      setUtrError('Please enter a valid 12-digit UPI Reference / UTR Number (e.g. 432198765432).');
      return;
    }

    setIsVerifying(true);
    try {
      const res = await storeClient.confirmStaticUTRPayment(orderData.order_id, clean);
      if (res.success) {
        setStatus('SUCCESS');
        setConfirmedData(res);
        if (onPaymentConfirmed) {
          setTimeout(() => onPaymentConfirmed(res), 1500);
        }
      } else {
        setUtrError(res.message || 'UTR verification failed.');
      }
    } catch (e) {
      setUtrError(e.message || 'Error reconciling UTR.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResetTimer = () => {
    setTimeLeft(900);
    setStatus('PENDING');
    setErrorMsg(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-emerald-900/20 overflow-hidden flex flex-col max-h-[94vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Amount & Expiry */}
        <div className="bg-gradient-to-r from-[#0a4d33] via-emerald-900 to-emerald-950 text-white px-5 sm:px-6 py-4 flex items-center justify-between border-b border-emerald-500/30">
          <div className="flex items-center space-x-2.5">
            <span className="p-2 rounded-xl bg-emerald-800/80 border border-emerald-500/40 text-emerald-200">
              <QrCode className="w-5 h-5" />
            </span>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-600/70 border border-emerald-400/40 text-emerald-100">
                Official NPCI UPI Payment Rail
              </span>
              <h2 className="text-base sm:text-lg font-black text-white mt-0.5">
                Pay ₹{grandTotal.toFixed(2)}
              </h2>
            </div>
          </div>
          {status !== 'SUCCESS' && (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Close payment window"
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
                {confirmedData?.utr_number
                  ? `Bank UTR ${confirmedData.utr_number} matched and reconciled.`
                  : 'HMAC-SHA256 cryptographic signature verified with payment gateway.'}
              </p>
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs font-mono text-emerald-950 text-left space-y-1">
                <div><b>Order Ref:</b> {orderNumber}</div>
                <div><b>Amount Paid:</b> ₹{grandTotal.toFixed(2)}</div>
                <div><b>Carrier AWB:</b> {confirmedData?.tracking_awb || 'AGRI-EXPR-STANDARD'}</div>
                <div><b>Status:</b> ORDER CONFIRMED & ALLOCATED</div>
              </div>
            </div>
          ) : (
            <>
              {/* Order Info & Countdown Strip */}
              <div className="flex items-center justify-between text-xs p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200/90">
                <div className="text-left">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Order ID</span>
                  <p className="font-mono font-black text-slate-900">{orderNumber}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-500">QR Expiry</span>
                  <p className={`font-mono font-black flex items-center gap-1 ${
                    timeLeft < 180 ? 'text-rose-600 animate-pulse' : 'text-emerald-900'
                  }`}>
                    <Clock className="w-3.5 h-3.5" />
                    {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                  </p>
                </div>
              </div>

              {/* Mode Toggle: Dynamic vs Static Merchant Counter QR */}
              <div className="bg-slate-100 p-1 rounded-2xl flex items-center text-xs font-bold border border-slate-200">
                <button
                  type="button"
                  onClick={() => setPaymentMode('DYNAMIC')}
                  className={`flex-1 py-2 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    paymentMode === 'DYNAMIC'
                      ? 'bg-white text-emerald-950 shadow-sm font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Dynamic QR (Auto-Amount)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMode('STATIC_UTR')}
                  className={`flex-1 py-2 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    paymentMode === 'STATIC_UTR'
                      ? 'bg-white text-emerald-950 shadow-sm font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <KeyRound className="w-3.5 h-3.5 text-indigo-700" />
                  <span>Store Counter QR (Enter UTR)</span>
                </button>
              </div>

              {/* TAB 1: Dynamic UPI 2.0 QR */}
              {paymentMode === 'DYNAMIC' && (
                <div className="space-y-3">
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

                  <p className="text-[11px] text-slate-500 font-medium">
                    This dynamic QR securely locks the payable amount to <span className="font-black text-emerald-900">₹{grandTotal.toFixed(2)}</span> with transaction note <span className="font-mono text-slate-700 font-bold">{orderNumber}</span>.
                  </p>
                </div>
              )}

              {/* TAB 2: Static Counter QR with Manual UTR Reconciliation */}
              {paymentMode === 'STATIC_UTR' && (
                <div className="space-y-3 text-left">
                  {/* Educational Warning on Static QR Limitation */}
                  <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/80 text-[11px] text-amber-900 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-amber-950">
                      <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                      <span>Static Counter QR Notice</span>
                    </div>
                    <p className="leading-relaxed">
                      A physical shop counter QR does <b>not</b> automatically pass your order amount to your phone.
                      You must manually type <b>₹{grandTotal.toFixed(2)}</b> in your UPI app and enter the 12-digit UTR below for order confirmation.
                    </p>
                  </div>

                  {/* Static VPA Card */}
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-bold">Store VPA:</span>
                      <span className="font-mono font-black text-slate-900">agrisense.payments@icici</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-bold">Exact Amount to Pay:</span>
                      <span className="font-mono font-black text-emerald-800 text-sm">₹{grandTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* 12-Digit UTR Form */}
                  <form onSubmit={handleVerifyUTR} className="space-y-2.5">
                    <div>
                      <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1">
                        12-Digit UPI Reference / UTR Number
                      </label>
                      <input
                        type="text"
                        maxLength={12}
                        value={utrNumber}
                        onChange={(e) => setUtrNumber(e.target.value.replace(/\D/g, ''))}
                        placeholder="e.g. 432198765432"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-sm tracking-wider focus:outline-emerald-600 focus:border-emerald-600 bg-white"
                      />
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Found in Google Pay / PhonePe transaction details (12 digits)
                      </span>
                    </div>

                    {utrError && (
                      <div className="p-2.5 bg-rose-50 text-rose-800 rounded-xl text-xs font-bold border border-rose-200">
                        {utrError}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isVerifying || utrNumber.length !== 12}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-700 to-indigo-900 hover:from-indigo-800 hover:to-indigo-950 text-white font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isVerifying ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Reconciling Bank UTR...</span>
                        </>
                      ) : (
                        <>
                          <FileCheck className="w-4 h-4" />
                          <span>Submit 12-Digit UTR & Confirm Order</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}

              {/* Supported UPI Apps Strip */}
              <div className="pt-1">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5">
                  Supported UPI Applications
                </p>
                <div className="flex flex-wrap items-center justify-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-bold">
                    Google Pay
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 text-[11px] font-bold">
                    PhonePe
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-sky-50 text-sky-700 border border-sky-200 text-[11px] font-bold">
                    Paytm
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-teal-50 text-teal-700 border border-teal-200 text-[11px] font-bold">
                    BHIM
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-800 border border-slate-200 text-[11px] font-bold">
                    Cred
                  </span>
                </div>
              </div>

              {/* Error Message */}
              {errorMsg && (
                <div className="p-3 bg-rose-50 text-rose-800 rounded-xl border border-rose-200 text-xs font-bold">
                  {errorMsg}
                </div>
              )}

              {/* Developer Test Sandbox (HMAC Signature Simulator) */}
              <div className="p-3.5 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200/80 text-left space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-700" />
                    Gateway Test Mode (HMAC-SHA256)
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-200 text-amber-900">
                    Test Mode
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-tight">
                  Simulate bank payment confirmation with cryptographic verification.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
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
                        <span>Simulate Payment Success</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
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

        {/* Footer with Actions & Security Stamp */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
            256-bit Encrypted NPCI Rail
          </span>

          <div className="flex items-center gap-2">
            {status !== 'SUCCESS' && (
              <>
                <button
                  type="button"
                  onClick={handleResetTimer}
                  className="text-xs text-slate-600 hover:text-slate-900 font-bold px-2.5 py-1 rounded-lg hover:bg-slate-200/70 transition-colors cursor-pointer"
                >
                  Refresh Timer
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-xs text-rose-700 hover:text-rose-900 font-bold px-2.5 py-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </>
            )}
            {status === 'SUCCESS' && (
              <button
                type="button"
                onClick={() => onPaymentConfirmed && onPaymentConfirmed(confirmedData)}
                className="px-4 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold transition-colors cursor-pointer"
              >
                Track Delivery Order
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
