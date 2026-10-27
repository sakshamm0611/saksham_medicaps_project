import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Film, Sparkles, MapPin, Tv, ChevronRight, ShieldCheck, Ticket } from 'lucide-react';
import { apiRequest } from '../services/api';
import MovieCard, { MovieItem } from '../components/MovieCard';
import { useToast } from '../context/ToastContext';

export default function HomePage({ selectedCity }: { selectedCity?: string }) {
  const [movies, setMovies] = useState<MovieItem[]>([]);
  const [theatres, setTheatres] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeGenre, setActiveGenre] = useState('All');
  const navigate = useNavigate();
  const { error } = useToast();

  const genres = ['All', 'Sci-Fi', 'Action', 'Drama', 'Adventure', 'Thriller', 'Animation'];

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [moviesRes, theatresRes] = await Promise.all([
          apiRequest<{ success: boolean; data: MovieItem[] }>('/api/movies'),
          apiRequest<{ success: boolean; data: any[] }>(
            selectedCity && selectedCity !== 'All' ? `/api/theatres?city=${selectedCity}` : '/api/theatres'
          )
        ]);

        if (moviesRes.success) setMovies(moviesRes.data);
        if (theatresRes.success) setTheatres(theatresRes.data);
      } catch (err) {
        error('Failed to load cinema data from server.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [selectedCity, error]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/movies?search=${encodeURIComponent(search.trim())}`);
    }
  };

  const nowShowing = movies
    .filter((m) => m.status === 'now-showing')
    .filter((m) => (activeGenre === 'All' ? true : m.genres.includes(activeGenre)))
    .filter((m) => (search ? m.title.toLowerCase().includes(search.toLowerCase()) : true));

  const comingSoon = movies.filter((m) => m.status === 'coming-soon');

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-slate-950 border-b border-slate-800/80">
        <div className="absolute inset-0 z-0 opacity-30 mix-blend-luminosity pointer-events-none">
          <img
            src="/src/assets/images/hero_cinematic_banner_1793124934638.jpg"
            alt="Cinema Auditorium"
            className="w-full h-full object-cover object-center"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f19] via-[#0b0f19]/70 to-transparent z-0"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 md:pt-24 md:pb-28">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/30 px-3 py-1.5 rounded-full">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Real-Time Atomic Seat Locks Active</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Experience Cinema In <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-rose-400 to-amber-300">
                True Laser Precision
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
              Book guaranteed seats with zero collision conflicts across top IMAX, 4DX, and Dolby Atmos screens. Real-time availability, instant digital passes, and contactless entry.
            </p>

            {/* Quick Search & Filter Bar */}
            <form onSubmit={handleSearchSubmit} className="pt-2 max-w-xl">
              <div className="flex items-center bg-slate-900/90 border border-slate-700/80 rounded-xl p-1.5 shadow-2xl focus-within:border-rose-500/80 transition-all">
                <Search className="w-5 h-5 text-slate-400 ml-3 shrink-0" />
                <input
                  type="text"
                  placeholder="Search movies, directors, or genres..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-transparent border-0 px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  Search
                </button>
              </div>
            </form>

            <div className="flex items-center gap-4 text-xs text-slate-400 pt-2">
              <span className="text-slate-400 font-medium">Popular:</span>
              <button onClick={() => setSearch('Dune')} className="hover:text-rose-400 transition-colors">
                Dune Odyssey
              </button>
              <span>·</span>
              <button onClick={() => setSearch('Cyber')} className="hover:text-rose-400 transition-colors">
                Cyber City
              </button>
              <span>·</span>
              <button onClick={() => setSearch('Quantum')} className="hover:text-rose-400 transition-colors">
                Quantum Horizon
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Now Showing Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-rose-500 text-xs font-bold uppercase tracking-wider mb-1">
              <Film className="w-4 h-4" />
              <span>In Theatres Today</span>
            </div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">Now Showing</h2>
          </div>

          <Link
            to="/movies?status=now-showing"
            className="inline-flex items-center gap-1 text-xs font-semibold text-rose-400 hover:text-rose-300 transition-colors"
          >
            <span>View all catalogue</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Interactive Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-6 scrollbar-none">
          {genres.map((genre) => (
            <button
              key={genre}
              onClick={() => setActiveGenre(genre)}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                activeGenre === genre
                  ? 'bg-rose-600 text-white font-semibold shadow-sm'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {genre}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-[3/4] rounded-xl bg-slate-900/60 animate-pulse border border-slate-800"></div>
            ))}
          </div>
        ) : nowShowing.length === 0 ? (
          <div className="py-16 text-center bg-slate-900/40 border border-slate-800/80 rounded-xl p-8">
            <Film className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-300">No movies match your criteria</h3>
            <p className="text-xs text-slate-400 mt-1">Try resetting the genre or search keyword.</p>
            <button
              onClick={() => {
                setActiveGenre('All');
                setSearch('');
              }}
              className="mt-4 px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {nowShowing.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        )}
      </section>

      {/* Featured Flagship Theatres */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 text-rose-500 text-xs font-bold uppercase tracking-wider mb-1">
              <MapPin className="w-4 h-4" />
              <span>Flagship Cinemas</span>
            </div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">
              Auditoriums {selectedCity && selectedCity !== 'All' ? `in ${selectedCity}` : 'Across India'}
            </h2>
          </div>

          <Link
            to="/theatres"
            className="inline-flex items-center gap-1 text-xs font-semibold text-rose-400 hover:text-rose-300 transition-colors"
          >
            <span>All Cinemas</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {theatres.map((theatre) => (
            <div
              key={theatre.id}
              className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-rose-400 font-semibold mb-2">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{theatre.city}</span>
                  </span>
                  <span className="text-slate-400 font-mono">
                    {theatre.screens?.length || 2} Screens
                  </span>
                </div>

                <h3 className="text-base font-bold text-white mb-1.5">{theatre.name}</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">{theatre.address}</p>

                {/* Facilities - Unboxed text metadata */}
                <div className="text-[11px] text-slate-400 leading-relaxed space-y-1">
                  {theatre.facilities?.slice(0, 3).map((f: string, i: number) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-rose-500"></span>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-800/80">
                <Link
                  to={`/theatres`}
                  className="w-full inline-block text-center px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700/80 rounded-lg transition-colors"
                >
                  View Showtimes
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Coming Soon Teasers */}
      {comingSoon.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
                <Sparkles className="w-4 h-4" />
                <span>Premiering Soon</span>
              </div>
              <h2 className="text-2xl font-extrabold text-white tracking-tight">Anticipated Releases</h2>
            </div>

            <Link
              to="/movies?status=coming-soon"
              className="inline-flex items-center gap-1 text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors"
            >
              <span>Explore all</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {comingSoon.slice(0, 4).map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        </section>
      )}

      {/* Trust & Guarantee Strip */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 rounded-2xl bg-gradient-to-r from-rose-950/40 via-slate-900 to-slate-950 border border-rose-900/30 grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-rose-600/20 text-rose-500 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">5-Minute Atomic Hold</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              When you select your seats, our server holds them exclusively for you. No race conditions, no double bookings.
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Tv className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Live Availability Sync</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Socket.IO push events broadcast seat reservations instantly to every viewer in the same auditorium room.
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <Ticket className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Instant QR Passes</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Printable contactless passes with cryptographic ticket codes, verified checkout, and automated cancellation refunds.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
