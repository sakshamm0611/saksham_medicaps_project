import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Ticket, User, Film, Clock, Calendar, AlertTriangle, ExternalLink, XCircle } from 'lucide-react';
import { apiRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function UserDashboardPage() {
  const { user, refreshUser } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingRef, setCancellingRef] = useState<string | null>(null);
  const { success, error } = useToast();

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await apiRequest<{ success: boolean; data: any[] }>('/api/bookings/my-bookings');
      if (res.success) {
        setBookings(res.data);
      }
    } catch (err: any) {
      error(err.message || 'Failed to fetch user bookings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancelBooking = async (ref: string) => {
    const confirmCancel = window.confirm(
      `Are you sure you want to cancel booking ${ref}? Your seats will be released immediately and full refund initiated.`
    );
    if (!confirmCancel) return;

    setCancellingRef(ref);
    try {
      const res = await apiRequest<{ success: boolean; message: string }>(`/api/bookings/${ref}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason: 'Customer requested cancellation via dashboard' })
      });

      if (res.success) {
        success('Reservation cancelled and refund initiated.');
        fetchBookings();
      }
    } catch (err: any) {
      error(err.message || 'Cancellation rejected.');
    } finally {
      setCancellingRef(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Profile Overview Card */}
      <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-600/20 border border-rose-500/40 text-rose-500 flex items-center justify-center font-extrabold text-2xl">
            {user?.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white">{user?.name}</h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-slate-800 text-slate-300">
                {user?.role}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{user?.email}</p>
            {user?.phone && <p className="text-xs text-slate-400">{user.phone}</p>}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/movies"
            className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors shadow-sm"
          >
            Book New Tickets
          </Link>
        </div>
      </div>

      {/* Bookings Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-rose-500" />
            <h2 className="text-lg font-bold text-white tracking-tight">My Admission Passes</h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {bookings.length} Total Record(s)
          </span>
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs text-slate-400">Loading booking records...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="p-16 text-center bg-slate-900/30 border border-slate-800 rounded-2xl space-y-3">
            <Ticket className="w-10 h-10 text-slate-500 mx-auto" />
            <h3 className="text-sm font-semibold text-white">No active or past bookings</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              You haven't reserved any cinema tickets yet. Explore now-showing releases to grab seats.
            </p>
            <Link
              to="/movies"
              className="inline-block mt-3 px-4 py-2 text-xs font-semibold bg-rose-600 text-white rounded-lg hover:bg-rose-500 transition-colors"
            >
              Browse Movies Now
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {bookings.map((booking) => {
              const isCancelled = booking.bookingStatus === 'cancelled';
              const isConfirmed = booking.bookingStatus === 'confirmed';

              return (
                <div
                  key={booking.id}
                  className={`p-6 rounded-2xl border transition-all flex flex-col justify-between space-y-5 ${
                    isCancelled
                      ? 'bg-slate-950/40 border-slate-900 opacity-70'
                      : 'bg-slate-900/70 border-slate-800 hover:border-slate-700/80'
                  }`}
                >
                  <div className="space-y-4">
                    {/* Top Status & Code */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold font-mono tracking-wider text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded border border-rose-500/20">
                        {booking.bookingReference}
                      </span>
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded capitalize ${
                          isConfirmed
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : isCancelled
                            ? 'bg-slate-800 text-slate-400'
                            : 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {booking.bookingStatus}
                      </span>
                    </div>

                    {/* Movie & Cinema Info */}
                    <div>
                      <h3 className="text-base font-bold text-white mb-1">
                        {booking.show?.movie?.title}
                      </h3>
                      <p className="text-xs text-slate-400">
                        {booking.show?.theatre?.name} · {booking.show?.theatre?.city}
                      </p>
                      <p className="text-xs text-slate-300 mt-1">
                        {booking.show?.showDate} at {booking.show?.startTime}
                      </p>
                    </div>

                    {/* Seats & Amount */}
                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Reserved Seats:</span>
                        <span className="text-white font-mono font-bold">
                          {booking.seats?.map((s: any) => s.seatNumber).join(', ')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Payment Status:</span>
                        <span
                          className={`font-semibold capitalize ${
                            booking.paymentStatus === 'paid'
                              ? 'text-emerald-400'
                              : booking.paymentStatus === 'refunded'
                              ? 'text-amber-400'
                              : 'text-slate-400'
                          }`}
                        >
                          {booking.paymentStatus}
                        </span>
                      </div>
                      <div className="flex justify-between pt-1.5 border-t border-slate-800 text-slate-200">
                        <span className="font-medium">Total Paid:</span>
                        <span className="font-bold text-rose-400 tabular-nums font-mono">
                          ₹{booking.totalAmount}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
                    <Link
                      to={`/confirmation/${booking.bookingReference}`}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-400 hover:text-rose-300 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>View E-Ticket Pass</span>
                    </Link>

                    {isConfirmed && (
                      <button
                        disabled={cancellingRef === booking.bookingReference}
                        onClick={() => handleCancelBooking(booking.bookingReference)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors border border-slate-800"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Cancel Booking</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
