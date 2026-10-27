import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Clock, ShieldCheck, AlertCircle, ArrowLeft, Info, Check, RefreshCw } from 'lucide-react';
import { apiRequest } from '../services/api';
import { getSocket } from '../services/socket';
import { useAuth } from '../context/AuthContext';
import { useBooking, SelectedSeat } from '../context/BookingContext';
import { useToast } from '../context/ToastContext';

interface SeatData {
  seatNumber: string;
  row: string;
  col: number;
  category: 'Silver' | 'Gold' | 'Premium';
  price: number;
  status: 'available' | 'held' | 'booked';
  heldBy?: string | null;
  heldUntil?: string | null;
}

export default function SeatSelectionPage() {
  const { showId } = useParams<{ showId: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { selectedSeats, toggleSeat, clearSelection, setHoldData, setCurrentShow } = useBooking();
  const { toast, error, success, warning } = useToast();

  const [show, setShow] = useState<any | null>(null);
  const [seats, setSeats] = useState<SeatData[]>([]);
  const [loading, setLoading] = useState(true);
  const [holding, setHolding] = useState(false);
  const [localHoldUntil, setLocalHoldUntil] = useState<string | null>(null);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number | null>(null);

  // 1. Fetch Show Seats
  const fetchSeats = async () => {
    if (!showId) return;
    try {
      const res = await apiRequest<{ success: boolean; data: any }>(`/api/shows/${showId}/seats`);
      if (res.success && res.data) {
        setShow(res.data);
        setSeats(res.data.seats);
        setCurrentShow(res.data);
      }
    } catch (err: any) {
      error(err.message || 'Failed to load auditorium seating.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    clearSelection();
    fetchSeats();
  }, [showId]);

  // 2. Real-time Socket.IO synchronization
  useEffect(() => {
    if (!showId) return;
    const socket = getSocket();
    socket.connect();

    socket.emit('join_show', showId);

    const onSeatsHeld = ({ seatNumbers, expiresAt }: { seatNumbers: string[]; expiresAt: string }) => {
      setSeats((prev) =>
        prev.map((s) => (seatNumbers.includes(s.seatNumber) ? { ...s, status: 'held', heldUntil: expiresAt } : s))
      );
    };

    const onSeatsReleased = ({ seatNumbers }: { seatNumbers: string[] }) => {
      setSeats((prev) =>
        prev.map((s) => (seatNumbers.includes(s.seatNumber) ? { ...s, status: 'available', heldBy: null, heldUntil: null } : s))
      );
    };

    const onSeatsConfirmed = ({ seatNumbers }: { seatNumbers: string[] }) => {
      setSeats((prev) =>
        prev.map((s) => (seatNumbers.includes(s.seatNumber) ? { ...s, status: 'booked', heldBy: null, heldUntil: null } : s))
      );
    };

    socket.on('seats_held', onSeatsHeld);
    socket.on('seats_released', onSeatsReleased);
    socket.on('seats_confirmed', onSeatsConfirmed);

    return () => {
      socket.emit('leave_show', showId);
      socket.off('seats_held', onSeatsHeld);
      socket.off('seats_released', onSeatsReleased);
      socket.off('seats_confirmed', onSeatsConfirmed);
    };
  }, [showId]);

  // 3. Countdown timer when hold is active
  useEffect(() => {
    if (!localHoldUntil) {
      setTimeLeftSeconds(null);
      return;
    }

    const interval = setInterval(() => {
      const diff = Math.floor((new Date(localHoldUntil).getTime() - Date.now()) / 1000);
      if (diff <= 0) {
        clearInterval(interval);
        setTimeLeftSeconds(0);
        setLocalHoldUntil(null);
        clearSelection();
        warning('Your 5-minute reservation hold has expired. Please reselect your seats.');
        fetchSeats();
      } else {
        setTimeLeftSeconds(diff);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [localHoldUntil]);

  const handleSeatClick = (seat: SeatData) => {
    if (seat.status === 'booked') return;
    if (seat.status === 'held' && seat.heldBy && user && seat.heldBy !== user.id) {
      warning(`Seat ${seat.seatNumber} is temporarily held by another customer.`);
      return;
    }

    toggleSeat({
      seatNumber: seat.seatNumber,
      row: seat.row,
      col: seat.col,
      category: seat.category,
      price: seat.price
    });
  };

  const handleHoldAndProceed = async () => {
    if (!isAuthenticated) {
      toast('Please sign in or register to hold your seats.', 'info');
      navigate('/login?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }

    if (selectedSeats.length === 0) {
      warning('Please select at least 1 seat to continue.');
      return;
    }

    setHolding(true);
    try {
      const seatNumbers = selectedSeats.map((s) => s.seatNumber);
      const res = await apiRequest<{ success: boolean; heldUntil: string; message: string }>('/api/bookings/hold-seats', {
        method: 'POST',
        body: JSON.stringify({ showId, seatNumbers })
      });

      if (res.success) {
        setLocalHoldUntil(res.heldUntil);
        setHoldData(res.heldUntil);
        success('Seats locked for 5 minutes! Proceeding to checkout.');
        navigate('/checkout');
      }
    } catch (err: any) {
      error(err.message || 'Seat conflict detected. Reselect available seats.');
      fetchSeats();
    } finally {
      setHolding(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-xs text-slate-400">Loading auditorium layout...</p>
      </div>
    );
  }

  if (!show) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-lg font-bold text-white mb-2">Showtime Not Found</h2>
        <Link to="/movies" className="text-xs text-rose-400 underline">
          Browse Available Movies
        </Link>
      </div>
    );
  }

  // Group seats by category & row
  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const premiumRows = ['G', 'H'];
  const goldRows = ['D', 'E', 'F'];
  const silverRows = ['A', 'B', 'C'];

  const subtotal = selectedSeats.reduce((sum, s) => sum + s.price, 0);
  const convenienceFee = Math.round(subtotal * 0.05);
  const totalAmount = subtotal + convenienceFee;

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <button
            onClick={() => navigate(`/movie/${show.movie?.id}`)}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Change Showtime</span>
          </button>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            {show.movie?.title}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {show.theatre?.name} · {show.screen?.screenName} · {show.showDate} at {show.startTime} ({show.format})
          </p>
        </div>

        {/* Real-time Timer or Status */}
        <div className="flex items-center gap-3">
          {timeLeftSeconds !== null && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold tabular-nums animate-pulse">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Seats Locked: {formatTimer(timeLeftSeconds)}</span>
            </div>
          )}
          <button
            onClick={fetchSeats}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-900 border border-slate-700/80 hover:bg-slate-800 text-slate-300 rounded-lg transition-colors"
            title="Refresh availability"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Seating Map Container */}
        <div className="lg:col-span-8 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-8 overflow-x-auto">
          {/* Cinema Curved Screen */}
          <div className="max-w-md mx-auto space-y-2">
            <div className="h-2 w-full bg-gradient-to-r from-transparent via-rose-500 to-transparent rounded-full shadow-[0_0_20px_rgba(244,63,94,0.6)]"></div>
            <p className="text-[11px] text-center tracking-[0.3em] font-semibold text-slate-400 uppercase">
              Curved 4K Laser Projection Screen
            </p>
          </div>

          {/* Interactive Seat Grid */}
          <div className="min-w-[500px] flex flex-col items-center space-y-6 pt-4">
            {/* Premium Section */}
            <div className="w-full space-y-2">
              <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider text-center border-b border-slate-800 pb-1">
                Premium Recliners (₹{Math.round(show.basePrice * 1.75)})
              </div>
              <div className="flex flex-col items-center gap-2 pt-2">
                {premiumRows.map((row) => (
                  <div key={row} className="flex items-center gap-3">
                    <span className="w-4 text-xs font-bold text-slate-400 text-center font-mono">{row}</span>
                    <div className="flex items-center gap-1.5">
                      {seats
                        .filter((s) => s.row === row)
                        .map((seat) => {
                          const isSelected = selectedSeats.some((s) => s.seatNumber === seat.seatNumber);
                          const isHeld = seat.status === 'held';
                          const isBooked = seat.status === 'booked';

                          let colorClass = 'bg-slate-800/90 text-slate-300 hover:bg-slate-700 hover:text-white border-slate-700';
                          if (isBooked) {
                            colorClass = 'bg-slate-950 text-slate-700 border-slate-900 cursor-not-allowed opacity-50';
                          } else if (isHeld) {
                            colorClass = 'bg-amber-500/20 text-amber-300 border-amber-500/40 cursor-not-allowed';
                          } else if (isSelected) {
                            colorClass = 'bg-rose-600 text-white font-bold border-rose-500 shadow-md shadow-rose-900/40';
                          }

                          return (
                            <button
                              key={seat.seatNumber}
                              disabled={isBooked}
                              onClick={() => handleSeatClick(seat)}
                              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-md text-[11px] font-semibold border transition-all flex items-center justify-center font-mono ${colorClass}`}
                              title={`${seat.seatNumber} · ${seat.category} · ₹${seat.price}`}
                            >
                              {seat.col}
                            </button>
                          );
                        })}
                    </div>
                    <span className="w-4 text-xs font-bold text-slate-400 text-center font-mono">{row}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Gold Section */}
            <div className="w-full space-y-2">
              <div className="text-[11px] font-bold text-rose-400 uppercase tracking-wider text-center border-b border-slate-800 pb-1">
                Gold Club (₹{Math.round(show.basePrice * 1.35)})
              </div>
              <div className="flex flex-col items-center gap-2 pt-2">
                {goldRows.map((row) => (
                  <div key={row} className="flex items-center gap-3">
                    <span className="w-4 text-xs font-bold text-slate-400 text-center font-mono">{row}</span>
                    <div className="flex items-center gap-1.5">
                      {seats
                        .filter((s) => s.row === row)
                        .map((seat) => {
                          const isSelected = selectedSeats.some((s) => s.seatNumber === seat.seatNumber);
                          const isHeld = seat.status === 'held';
                          const isBooked = seat.status === 'booked';

                          let colorClass = 'bg-slate-800/90 text-slate-300 hover:bg-slate-700 hover:text-white border-slate-700';
                          if (isBooked) {
                            colorClass = 'bg-slate-950 text-slate-700 border-slate-900 cursor-not-allowed opacity-50';
                          } else if (isHeld) {
                            colorClass = 'bg-amber-500/20 text-amber-300 border-amber-500/40 cursor-not-allowed';
                          } else if (isSelected) {
                            colorClass = 'bg-rose-600 text-white font-bold border-rose-500 shadow-md shadow-rose-900/40';
                          }

                          return (
                            <button
                              key={seat.seatNumber}
                              disabled={isBooked}
                              onClick={() => handleSeatClick(seat)}
                              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-md text-[11px] font-semibold border transition-all flex items-center justify-center font-mono ${colorClass}`}
                              title={`${seat.seatNumber} · ${seat.category} · ₹${seat.price}`}
                            >
                              {seat.col}
                            </button>
                          );
                        })}
                    </div>
                    <span className="w-4 text-xs font-bold text-slate-400 text-center font-mono">{row}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Silver Section */}
            <div className="w-full space-y-2">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center border-b border-slate-800 pb-1">
                Silver Standard (₹{show.basePrice})
              </div>
              <div className="flex flex-col items-center gap-2 pt-2">
                {silverRows.map((row) => (
                  <div key={row} className="flex items-center gap-3">
                    <span className="w-4 text-xs font-bold text-slate-400 text-center font-mono">{row}</span>
                    <div className="flex items-center gap-1.5">
                      {seats
                        .filter((s) => s.row === row)
                        .map((seat) => {
                          const isSelected = selectedSeats.some((s) => s.seatNumber === seat.seatNumber);
                          const isHeld = seat.status === 'held';
                          const isBooked = seat.status === 'booked';

                          let colorClass = 'bg-slate-800/90 text-slate-300 hover:bg-slate-700 hover:text-white border-slate-700';
                          if (isBooked) {
                            colorClass = 'bg-slate-950 text-slate-700 border-slate-900 cursor-not-allowed opacity-50';
                          } else if (isHeld) {
                            colorClass = 'bg-amber-500/20 text-amber-300 border-amber-500/40 cursor-not-allowed';
                          } else if (isSelected) {
                            colorClass = 'bg-rose-600 text-white font-bold border-rose-500 shadow-md shadow-rose-900/40';
                          }

                          return (
                            <button
                              key={seat.seatNumber}
                              disabled={isBooked}
                              onClick={() => handleSeatClick(seat)}
                              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-md text-[11px] font-semibold border transition-all flex items-center justify-center font-mono ${colorClass}`}
                              title={`${seat.seatNumber} · ${seat.category} · ₹${seat.price}`}
                            >
                              {seat.col}
                            </button>
                          );
                        })}
                    </div>
                    <span className="w-4 text-xs font-bold text-slate-400 text-center font-mono">{row}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Seat Legend */}
          <div className="pt-6 border-t border-slate-800 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-slate-800 border border-slate-700"></span>
              <span>Available</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-rose-600 border border-rose-500"></span>
              <span>Selected</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-amber-500/20 border border-amber-500/40"></span>
              <span>Temporarily Held</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-slate-950 border border-slate-900 opacity-50"></span>
              <span>Booked</span>
            </div>
          </div>
        </div>

        {/* Pricing & Checkout Summary Sidebar */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-5">
            <h3 className="text-base font-bold text-white tracking-tight pb-3 border-b border-slate-800">
              Booking Summary
            </h3>

            {/* Selected Seats List */}
            <div className="space-y-2">
              <span className="text-xs font-medium text-slate-400">Selected Seats ({selectedSeats.length}/8):</span>
              {selectedSeats.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No seats selected yet. Click any seat on the visual map.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {selectedSeats.map((s) => (
                    <span
                      key={s.seatNumber}
                      className="px-2.5 py-1 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold font-mono"
                    >
                      {s.seatNumber} (₹{s.price})
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Itemized Price Calculation */}
            <div className="space-y-2.5 pt-3 border-t border-slate-800 text-xs text-slate-300">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Tickets Subtotal</span>
                <span className="font-semibold tabular-nums font-mono">₹{subtotal}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Convenience Fee (5%)</span>
                <span className="font-semibold tabular-nums font-mono">₹{convenienceFee}</span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-slate-800 text-sm font-bold text-white">
                <span>Total Payable</span>
                <span className="text-rose-500 tabular-nums font-mono text-base">₹{totalAmount}</span>
              </div>
            </div>

            {/* Hold & Checkout CTA */}
            <button
              disabled={selectedSeats.length === 0 || holding}
              onClick={handleHoldAndProceed}
              className="w-full py-3 px-4 bg-rose-600 hover:bg-rose-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-rose-950/40 flex items-center justify-center gap-2"
            >
              {holding ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Lock Seats & Checkout (₹{totalAmount})</span>
                </>
              )}
            </button>

            <div className="flex items-start gap-2 text-[11px] text-slate-400 bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
              <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
              <span>Clicking locks your selected seats for 5 minutes. No other user can select them during checkout.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
