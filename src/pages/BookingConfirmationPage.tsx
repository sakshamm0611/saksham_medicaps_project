import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, Printer, Ticket, ArrowLeft, Film, MapPin, Calendar, Clock, QrCode } from 'lucide-react';
import confetti from 'canvas-confetti';
import QRCode from 'qrcode';
import { apiRequest } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function BookingConfirmationPage() {
  const { ref } = useParams<{ ref: string }>();
  const [booking, setBooking] = useState<any | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const { error } = useToast();

  useEffect(() => {
    async function loadBooking() {
      if (!ref) return;
      try {
        setLoading(true);
        const res = await apiRequest<{ success: boolean; data: any }>(`/api/bookings/${ref}`);
        if (res.success && res.data) {
          setBooking(res.data);

          // Generate QR code pass
          const qrPayload = JSON.stringify({
            ref: res.data.bookingReference,
            movie: res.data.show?.movie?.title,
            seats: res.data.seats.map((s: any) => s.seatNumber),
            verified: true,
            auth: 'IMOVIES-VERIFIED-PASS'
          });

          const url = await QRCode.toDataURL(qrPayload, {
            width: 180,
            margin: 1,
            color: { dark: '#0b0f19', light: '#ffffff' }
          });
          setQrDataUrl(url);

          // Trigger celebration confetti
          try {
            confetti({
              particleCount: 80,
              spread: 60,
              origin: { y: 0.6 },
              colors: ['#e11d48', '#f59e0b', '#10b981', '#3b82f6']
            });
          } catch (e) {}
        }
      } catch (err: any) {
        error(err.message || 'Failed to fetch confirmed booking details.');
      } finally {
        setLoading(false);
      }
    }
    loadBooking();
  }, [ref, error]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-xs text-slate-400">Verifying booking confirmation...</p>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-lg font-bold text-white mb-2">Booking Not Found</h2>
        <Link to="/movies" className="text-xs text-rose-400 underline">
          Browse Movies
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Success banner */}
      <div className="text-center space-y-2 no-print">
        <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-950/40">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Booking Confirmed!</h1>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Your payment has been verified on the server. Your digital ticket pass is active below.
        </p>
      </div>

      {/* Printable Cinema Ticket Pass */}
      <div className="printable-ticket-area bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        {/* Pass Top Ribbon */}
        <div className="bg-gradient-to-r from-rose-600 to-rose-700 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Film className="w-5 h-5" />
            <span className="font-extrabold tracking-tight text-base">IMOVIES ADMISSION PASS</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-rose-200 block">Reference</span>
            <span className="font-mono font-bold text-sm tracking-wider">{booking.bookingReference}</span>
          </div>
        </div>

        {/* Pass Content */}
        <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          {/* Details (8 cols) */}
          <div className="md:col-span-8 space-y-6">
            <div>
              <span className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider block mb-1">
                Feature Film
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                {booking.show?.movie?.title}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {booking.show?.theatre?.name} · {booking.show?.screen?.screenName}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs pt-4 border-t border-slate-800">
              <div>
                <span className="text-slate-400 block font-medium mb-0.5">Date & Time</span>
                <span className="text-white font-semibold">
                  {booking.show?.showDate} at {booking.show?.startTime}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block font-medium mb-0.5">Cinema Format</span>
                <span className="text-white font-semibold">
                  {booking.show?.format || '2D Digital'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block font-medium mb-0.5">Confirmed Seats</span>
                <span className="text-rose-400 font-bold font-mono text-sm">
                  {booking.seats?.map((s: any) => s.seatNumber).join(', ')}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block font-medium mb-0.5">Amount Paid</span>
                <span className="text-emerald-400 font-bold font-mono text-sm">
                  ₹{booking.totalAmount}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>Customer: <strong className="text-slate-200">{booking.user?.name}</strong></span>
              <span className="capitalize text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Verified Paid</span>
              </span>
            </div>
          </div>

          {/* QR Code Container (4 cols) */}
          <div className="md:col-span-4 flex flex-col items-center justify-center p-4 bg-slate-950/80 rounded-xl border border-slate-800 text-center space-y-2">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="Ticket QR Code"
                className="w-36 h-36 rounded-lg bg-white p-2 shadow-md mx-auto"
              />
            ) : (
              <div className="w-36 h-36 bg-slate-800 flex items-center justify-center rounded-lg">
                <QrCode className="w-10 h-10 text-slate-500" />
              </div>
            )}
            <span className="text-[10px] text-slate-400 font-mono block">
              Scan at auditorium entrance
            </span>
          </div>
        </div>

        {/* Perforated ticket edge style */}
        <div className="px-6 py-3 bg-slate-950/80 border-t border-dashed border-slate-800 text-center text-[11px] text-slate-400">
          This digital pass is valid for single admission. Please arrive 15 minutes before showtime.
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 no-print">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-lg transition-colors w-full sm:w-auto justify-center"
        >
          <Ticket className="w-4 h-4" />
          <span>Go to My Bookings</span>
        </Link>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Link
            to="/movies"
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            Explore More Movies
          </Link>

          <button
            onClick={handlePrint}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors shadow-lg shadow-rose-950/40"
          >
            <Printer className="w-4 h-4" />
            <span>Print E-Ticket Pass</span>
          </button>
        </div>
      </div>
    </div>
  );
}
