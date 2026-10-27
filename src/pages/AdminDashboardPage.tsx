import React, { useState, useEffect } from 'react';
import {
  Shield,
  BarChart3,
  Film,
  Tv,
  Users,
  Ticket,
  PlusCircle,
  Trash2,
  RefreshCw,
  Calendar,
  Clock,
  DollarSign,
  TrendingUp,
  RotateCcw
} from 'lucide-react';
import { apiRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const { success, error, info } = useToast();

  const [stats, setStats] = useState<any | null>(null);
  const [movies, setMovies] = useState<any[]>([]);
  const [theatres, setTheatres] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states for scheduling a new show
  const [selectedMovie, setSelectedMovie] = useState('');
  const [selectedTheatre, setSelectedTheatre] = useState('');
  const [selectedScreen, setSelectedScreen] = useState('');
  const [showDate, setShowDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('18:00');
  const [endTime, setEndTime] = useState('20:45');
  const [basePrice, setBasePrice] = useState('280');
  const [showFormat, setShowFormat] = useState('IMAX');
  const [scheduling, setScheduling] = useState(false);

  // Form states for creating a new movie
  const [movieModalOpen, setMovieModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDirector, setNewDirector] = useState('');
  const [newGenres, setNewGenres] = useState('Sci-Fi, Action');
  const [newDuration, setNewDuration] = useState('145');
  const [newRating, setNewRating] = useState('8.8');
  const [newStatus, setNewStatus] = useState('now-showing');
  const [newDesc, setNewDesc] = useState('');

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [dashRes, moviesRes, theatresRes, bookingsRes] = await Promise.all([
        apiRequest<{ success: boolean; data: any }>('/api/admin/dashboard'),
        apiRequest<{ success: boolean; data: any[] }>('/api/movies'),
        apiRequest<{ success: boolean; data: any[] }>('/api/theatres'),
        apiRequest<{ success: boolean; data: any[] }>('/api/admin/bookings')
      ]);

      if (dashRes.success) setStats(dashRes.data);
      if (moviesRes.success) {
        setMovies(moviesRes.data);
        if (moviesRes.data.length > 0) setSelectedMovie(moviesRes.data[0].id);
      }
      if (theatresRes.success) {
        setTheatres(theatresRes.data);
        if (theatresRes.data.length > 0) {
          setSelectedTheatre(theatresRes.data[0].id);
          const firstScreens = theatresRes.data[0].screensData || [];
          if (firstScreens.length > 0) setSelectedScreen(firstScreens[0].id);
        }
      }
      if (bookingsRes.success) setBookings(bookingsRes.data);
    } catch (err: any) {
      error(err.message || 'Failed to load administrative analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleTheatreChange = (theatreId: string) => {
    setSelectedTheatre(theatreId);
    const th = theatres.find((t) => t.id === theatreId);
    if (th && th.screensData && th.screensData.length > 0) {
      setSelectedScreen(th.screensData[0].id);
    }
  };

  const handleScheduleShow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMovie || !selectedTheatre || !selectedScreen || !showDate || !startTime) {
      error('Please complete all scheduling fields.');
      return;
    }

    setScheduling(true);
    try {
      const res = await apiRequest<{ success: boolean; message?: string }>('/api/shows', {
        method: 'POST',
        body: JSON.stringify({
          movieId: selectedMovie,
          theatreId: selectedTheatre,
          screenId: selectedScreen,
          showDate,
          startTime,
          endTime,
          format: showFormat,
          basePrice: Number(basePrice)
        })
      });

      if (res.success) {
        success('New show scheduled and auditorium seats generated!');
        fetchAdminData();
      }
    } catch (err: any) {
      error(err.message || 'Could not schedule show.');
    } finally {
      setScheduling(false);
    }
  };

  const handleAddMovie = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newDesc) return;

    try {
      const res = await apiRequest<{ success: boolean; data: any }>('/api/movies', {
        method: 'POST',
        body: JSON.stringify({
          title: newTitle,
          director: newDirector || 'Lead Director',
          description: newDesc,
          genres: newGenres.split(',').map((g) => g.trim()),
          languages: ['English', 'Hindi'],
          duration: Number(newDuration) || 135,
          rating: Number(newRating) || 8.5,
          status: newStatus,
          posterUrl: '/src/assets/images/hero_cinematic_banner_1793124934638.jpg',
          backdropUrl: '/src/assets/images/hero_cinematic_banner_1793124934638.jpg'
        })
      });

      if (res.success) {
        success(`Movie "${newTitle}" published successfully!`);
        setMovieModalOpen(false);
        setNewTitle('');
        setNewDesc('');
        fetchAdminData();
      }
    } catch (err: any) {
      error(err.message || 'Failed to publish movie.');
    }
  };

  const handleDeleteMovie = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      await apiRequest(`/api/movies/${id}`, { method: 'DELETE' });
      success(`Movie "${title}" removed.`);
      fetchAdminData();
    } catch (err: any) {
      error(err.message || 'Failed to delete movie.');
    }
  };

  const handleResetDemoData = async () => {
    if (!window.confirm('Reset database to clean initial state with 10 sample movies, theatres, and fresh showtimes?')) return;
    try {
      await apiRequest('/api/admin/reset-demo', { method: 'POST' });
      success('Database successfully reset to pristine demo state!');
      fetchAdminData();
    } catch (err: any) {
      error(err.message || 'Reset failed.');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-xs text-slate-400">Loading administrator console...</p>
      </div>
    );
  }

  const currentTheatreObj = theatres.find((t) => t.id === selectedTheatre);
  const currentScreens = currentTheatreObj?.screensData || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Shield className="w-4 h-4" />
            <span>Master Control</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Administrator Command Center
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchAdminData}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleResetDemoData}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-300 bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 rounded-lg transition-colors"
            title="Reset to default seed data"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo Data</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Gross Revenue
          </span>
          <span className="text-xl font-extrabold text-emerald-400 tabular-nums font-mono">
            ₹{stats?.totalRevenue?.toLocaleString()}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Confirmed Bookings
          </span>
          <span className="text-xl font-extrabold text-white tabular-nums font-mono">
            {stats?.totalBookings}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Active Movies
          </span>
          <span className="text-xl font-extrabold text-rose-500 tabular-nums font-mono">
            {stats?.totalMovies}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Auditoriums
          </span>
          <span className="text-xl font-extrabold text-white tabular-nums font-mono">
            {stats?.totalTheatres}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Scheduled Shows
          </span>
          <span className="text-xl font-extrabold text-amber-400 tabular-nums font-mono">
            {stats?.totalShows}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Seat Occupancy
          </span>
          <span className="text-xl font-extrabold text-cyan-400 tabular-nums font-mono">
            {stats?.occupancyRate || 0}%
          </span>
        </div>
      </div>

      {/* Show Scheduling Form */}
      <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-rose-500" />
            <h2 className="text-base font-bold text-white tracking-tight">Schedule New Cinema Show</h2>
          </div>
          <span className="text-xs text-slate-400">Generates full 80-seat auditorium inventory</span>
        </div>

        <form onSubmit={handleScheduleShow} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Select Movie</label>
            <select
              value={selectedMovie}
              onChange={(e) => setSelectedMovie(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-white focus:outline-none focus:border-rose-500"
            >
              {movies.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Select Theatre</label>
            <select
              value={selectedTheatre}
              onChange={(e) => handleTheatreChange(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-white focus:outline-none focus:border-rose-500"
            >
              {theatres.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.city})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Auditorium Screen</label>
            <select
              value={selectedScreen}
              onChange={(e) => setSelectedScreen(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-white focus:outline-none focus:border-rose-500"
            >
              {currentScreens.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.screenName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Format</label>
            <select
              value={showFormat}
              onChange={(e) => setShowFormat(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-white focus:outline-none focus:border-rose-500"
            >
              <option value="IMAX">IMAX Laser</option>
              <option value="2D">2D Digital</option>
              <option value="3D">3D RealD</option>
              <option value="4DX">4DX Motion</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Date</label>
            <input
              type="date"
              required
              value={showDate}
              onChange={(e) => setShowDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-white focus:outline-none focus:border-rose-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Start Time</label>
            <input
              type="time"
              required
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-white focus:outline-none focus:border-rose-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Base Price (₹)</label>
            <input
              type="number"
              required
              min="100"
              max="2000"
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-white focus:outline-none focus:border-rose-500 font-mono"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={scheduling}
              className="w-full py-2 px-4 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 h-[38px]"
            >
              {scheduling ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Publish Showtime</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Movie Management Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Film className="w-5 h-5 text-rose-500" />
            <h2 className="text-base font-bold text-white tracking-tight">Movie Titles Management</h2>
          </div>
          <button
            onClick={() => setMovieModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Add New Movie</span>
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-3">Title</th>
                <th className="p-3">Director</th>
                <th className="p-3">Genres</th>
                <th className="p-3">Rating</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {movies.map((m) => (
                <tr key={m.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-3 font-semibold text-white">{m.title}</td>
                  <td className="p-3 text-slate-400">{m.director}</td>
                  <td className="p-3">{m.genres?.slice(0, 2).join(', ')}</td>
                  <td className="p-3 font-mono text-amber-400 font-bold">{m.rating}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        m.status === 'now-showing'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                      }`}
                    >
                      {m.status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => handleDeleteMovie(m.id, m.title)}
                      className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                      title="Delete movie"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bookings Ledger */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-rose-500" />
            <h2 className="text-base font-bold text-white tracking-tight">Recent System Transactions</h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">{bookings.length} Total</span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-3">Reference</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Movie & Cinema</th>
                <th className="p-3">Seats</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {bookings.map((b) => (
                <tr key={b.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-3 font-mono font-bold text-rose-400">{b.bookingReference}</td>
                  <td className="p-3">
                    <div className="font-semibold text-white">{b.user?.name || 'Customer'}</div>
                    <div className="text-[11px] text-slate-400">{b.user?.email}</div>
                  </td>
                  <td className="p-3">
                    <div className="font-medium text-white">{b.show?.movie?.title}</div>
                    <div className="text-[11px] text-slate-400">{b.show?.theatre?.name}</div>
                  </td>
                  <td className="p-3 font-mono font-semibold text-slate-200">
                    {b.seats?.map((s: any) => s.seatNumber).join(', ')}
                  </td>
                  <td className="p-3 font-mono font-bold text-emerald-400 tabular-nums">
                    ₹{b.totalAmount}
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        b.bookingStatus === 'confirmed'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : b.bookingStatus === 'cancelled'
                          ? 'bg-slate-800 text-slate-400'
                          : 'bg-amber-500/10 text-amber-300'
                      }`}
                    >
                      {b.bookingStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Movie Modal */}
      {movieModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">Add New Movie Title</h3>
            <form onSubmit={handleAddMovie} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Movie Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-white"
                  placeholder="e.g. Inception 2"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Director</label>
                <input
                  type="text"
                  value={newDirector}
                  onChange={(e) => setNewDirector(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-white"
                  placeholder="e.g. Christopher Nolan"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Duration (mins)</label>
                  <input
                    type="number"
                    value={newDuration}
                    onChange={(e) => setNewDuration(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Rating</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newRating}
                    onChange={(e) => setNewRating(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Genres (comma-separated)</label>
                <input
                  type="text"
                  value={newGenres}
                  onChange={(e) => setNewGenres(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-white"
                >
                  <option value="now-showing">Now Showing</option>
                  <option value="coming-soon">Coming Soon</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Synopsis</label>
                <textarea
                  rows={3}
                  required
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-white"
                  placeholder="Synopsis and plot summary..."
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMovieModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition-colors"
                >
                  Save Movie
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
