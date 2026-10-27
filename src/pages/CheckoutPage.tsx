import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CreditCard, ShieldCheck, ArrowLeft, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { apiRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useBooking } from '../context/BookingContext';
import { useToast } from '../context/ToastContext';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentShow, selectedSeats, holdExpiresAt, setHoldData, resetBooking } = useBooking();
  const { toast, success, error, warning } = useToast();

  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [isProcessing, setIsProcessing] = useState(false);
  const [useSimulator, setUseSimulator] = useState(true);
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!currentShow || selectedSeats.length === 0) {
      navigate('/movies');
      return;
    }
    if (user) {
      if (!customerName) setCustomerName(user.name);
      if (!customerEmail) setCustomerEmail(user.email);
      if (!customerPhone && user.phone) setCustomerPhone(user.phone);
    }
  }, [currentShow, selectedSeats, user, navigate]);

  // Hold countdown watcher
  useEffect(() => {
    if (!holdExpiresAt) return;
    const interval = setInterval(() => {
      const diff = Math.floor((new Date(holdExpiresAt).getTime() - Date.now()) / 1000);
      if (diff <= 0) {
        clearInterval(interval);
        setSecondsRemaining(0);
        warning('Seat hold expired. Please reselect your seats.');
        resetBooking();
        navigate(`/seat-selection/${currentShow?.id}`);
      } else {
        setSecondsRemaining(diff);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [holdExpiresAt, currentShow, navigate, resetBooking, warning]);

  const subtotal = selectedSeats.reduce((sum, s) => sum + s.price, 0);
  const convenienceFee = Math.round(subtotal * 0.05);
  const totalAmount = subtotal + convenienceFee;

  const handleCompletePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerEmail || !customerName) {
      error('Name and email are required for the booking confirmation pass.');
      return;
    }

    setIsProcessing(true);
    try {
      // 1. Create order on the backend with trusted prices
      const orderRes = await apiRequest<{
        success: boolean;
        bookingReference: string;
        bookingId: string;
        paymentOrder: { provider: string; orderId: string; amount: number; keyId: string };
      }>('/api/bookings/create-order', {
        method: 'POST',
        body: JSON.stringify({
          showId: currentShow?.id,
          seatNumbers: selectedSeats.map((s) => s.seatNumber)
        })
      });

      if (!orderRes.success) {
        throw new Error('Failed to initialize booking order.');
      }

      const { bookingReference, paymentOrder } = orderRes;

      // 2. Process Simulated Test Payment or Gateway
      if (useSimulator || paymentOrder.provider === 'mock_simulator') {
        // Deterministic simulated signature for testing
        const mockSignature = `mock_sig_${Date.now()}_verified`;
        const mockPaymentId = `pay_mock_${Date.now()}`;

        // Verify on server
        const verifyRes = await apiRequest<{ success: boolean; message: string; booking: any }>(
          '/api/payments/verify',
          {
            method: 'POST',
            body: JSON.stringify({
              bookingReference,
              razorpay_order_id: paymentOrder.orderId,
              razorpay_payment_id: mockPaymentId,
              razorpay_signature: mockSignature,
              isMock: true
            })
          }
        );

        if (verifyRes.success) {
          success('Payment confirmed and verified on server!');
          resetBooking();
          navigate(`/confirmation/${bookingReference}`);
        }
      } else {
        // If external Razorpay window is loaded
        if (typeof (window as any).Razorpay !== 'undefined') {
          const rzp = new (window as any).Razorpay({
            key: paymentOrder.keyId,
            amount: paymentOrder.amount * 100,
            currency: 'INR',
            name: 'IMovies Cinema Pass',
            description: `Tickets for ${currentShow?.movie?.title}`,
            order_id: paymentOrder.orderId,
            handler: async (resp: any) => {
              try {
                const verifyRes = await apiRequest('/api/payments/verify', {
                  method: 'POST',
                  body: JSON.stringify({
                    bookingReference,
                    razorpay_order_id: resp.razorpay_order_id,
                    razorpay_payment_id: resp.razorpay_payment_id,
                    razorpay_signature: resp.razorpay_signature,
                    isMock: false
                  })
                });
                if (verifyRes.success) {
                  success('Payment verified! Booking confirmed.');
                  resetBooking();
                  navigate(`/confirmation/${bookingReference}`);
                }
              } catch (err: any) {
                error(err.message || 'Payment signature verification failed.');
              }
            },
            prefill: {
              name: customerName,
              email: customerEmail,
              contact: customerPhone
            },
            theme: { color: '#e11d48' }
          });
          rzp.open();
        } else {
          throw new Error('Payment gateway SDK unavailable. Please switch to Simulator mode.');
        }
      }
    } catch (err: any) {
      error(err.message || 'Payment processing failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Seat Map</span>
          </button>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Checkout & Payment</h1>
        </div>

        {secondsRemaining !== null && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold tabular-nums">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Hold Expires: {formatTimer(secondsRemaining)}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Customer Form & Payment Mode */}
        <div className="md:col-span-7 space-y-6">
          <form onSubmit={handleCompletePayment} className="space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                1. Contact & Ticket Delivery
              </h2>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-white focus:outline-none focus:border-rose-500"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-white focus:outline-none focus:border-rose-500"
                    placeholder="e.g. user@example.com"
                  />
                  <span className="text-[11px] text-slate-400 mt-0.5 block">
                    Your QR digital cinema pass will be issued to this email.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Phone Number (Optional)</label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-white focus:outline-none focus:border-rose-500"
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                2. Payment Authorization
              </h2>

              {/* Mode Toggle Banner */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-rose-500" />
                    <span className="text-xs font-bold text-white">Payment Method</span>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                    Test Mode Active
                  </span>
                </div>

                <div className="space-y-2">
                  <label className="flex items-start gap-3 p-3 rounded-lg border border-rose-500/40 bg-rose-950/20 cursor-pointer">
                    <input
                      type="radio"
                      name="payment_choice"
                      checked={useSimulator}
                      onChange={() => setUseSimulator(true)}
                      className="mt-0.5 text-rose-600 focus:ring-0"
                    />
                    <div>
                      <span className="text-xs font-bold text-rose-300 block">
                        Direct Test Payment Simulator (Recommended)
                      </span>
                      <span className="text-[11px] text-slate-400 leading-relaxed block mt-0.5">
                        Simulates instantaneous verified transaction with server-side signature validation and atomic ticket confirmation.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-900/60 cursor-pointer">
                    <input
                      type="radio"
                      name="payment_choice"
                      checked={!useSimulator}
                      onChange={() => setUseSimulator(false)}
                      className="mt-0.5 text-rose-600 focus:ring-0"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-300 block">
                        Razorpay Gateway Window
                      </span>
                      <span className="text-[11px] text-slate-400 leading-relaxed block mt-0.5">
                        Uses Razorpay test mode popup with test card credentials.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-3.5 px-4 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition-all shadow-xl shadow-rose-950/50 flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Confirm & Pay ₹{totalAmount}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Order Summary Card */}
        <div className="md:col-span-5 space-y-4">
          <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-5">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider pb-3 border-b border-slate-800">
              Reservation Summary
            </h3>

            {/* Movie Info */}
            <div className="space-y-1">
              <h4 className="text-base font-bold text-white">{currentShow?.movie?.title}</h4>
              <p className="text-xs text-slate-400">
                {currentShow?.theatre?.name} · {currentShow?.screen?.screenName}
              </p>
              <p className="text-xs text-rose-400 font-medium">
                {currentShow?.showDate} at {currentShow?.startTime} ({currentShow?.format})
              </p>
            </div>

            {/* Seats */}
            <div className="pt-3 border-t border-slate-800 space-y-2">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Reserved Seats:</span>
                <span className="text-white font-semibold font-mono">
                  {selectedSeats.map((s) => s.seatNumber).join(', ')}
                </span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>Category:</span>
                <span className="text-white font-medium">
                  {selectedSeats[0]?.category} Class
                </span>
              </div>
            </div>

            {/* Price breakdown */}
            <div className="pt-3 border-t border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Tickets Subtotal</span>
                <span className="text-slate-200 font-semibold tabular-nums font-mono">₹{subtotal}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Convenience Fee (5%)</span>
                <span className="text-slate-200 font-semibold tabular-nums font-mono">₹{convenienceFee}</span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-slate-800 text-sm font-bold text-white">
                <span>Total Amount</span>
                <span className="text-rose-500 font-mono text-base tabular-nums">₹{totalAmount}</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-slate-300">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Cancellation Policy</span>
              </div>
              <p>Tickets can be cancelled up to 2 hours prior to showtime from your User Dashboard.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
