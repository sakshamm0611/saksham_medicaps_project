import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Star, Clock, Calendar, MapPin, Tv, Play, ChevronLeft, ShieldCheck } from 'lucide-react';
import { apiRequest } from '../services/api';
import { MovieItem } from '../components/MovieCard';
import { useToast } from '../context/ToastContext';

export default function MovieDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [movie, setMovie] = useState<MovieItem & { cast: string[]; trailerUrl?: string } | null>(null);
  const [shows, setShows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [trailerModalOpen, setTrailerModalOpen] = useState(false);
  const { error } = useToast();

  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const dayAfterStr = new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0];

  const dates = [
    { label: 'Today', date: todayStr },
    { label: 'Tomorrow', date: tomorrowStr },
    { label: 'Day After', date: dayAfterStr }
  ];

  useEffect(() => {
    setSelectedDate(todayStr);
  }, [todayStr]);

  useEffect(() => {
    async function loadMovieAndShows() {
      try {
        setLoading(true);
        const movieRes = await apiRequest<{ success: boolean; data: any }>(`/api/movies/${id}`);
        if (movieRes.success) {
          setMovie(movieRes.data);
        }

        const showsRes = await apiRequest<{ success: boolean; data: any[] }>(`/api/shows?movieId=${id}`);
        if (showsRes.success) {
          setShows(showsRes.data);
        }
      } catch (err) {
        error('Failed to load movie details or showtimes.');
      } finally {
        setLoading(false);
      }
    }
    if (id) loadMovieAndShows();
  }, [id, error]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-xs text-slate-400">Loading cinema showtimes...</p>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-bold text-white mb-2">Movie Not Found</h2>
        <p className="text-xs text-slate-400 mb-4">The requested movie could not be located in our catalogue.</p>
        <Link to="/movies" className="px-4 py-2 text-xs font-semibold bg-rose-600 text-white rounded-lg">
          Back to Catalogue
        </Link>
      </div>
    );
  }

  // Filter shows by selected date
  const filteredShows = shows.filter((s) => s.showDate === selectedDate);

  // Group shows by Theatre
  const theatreGroups: { [theatreId: string]: { theatre: any; shows: any[] } } = {};
  filteredShows.forEach((s) => {
    if (s.theatre) {
      if (!theatreGroups[s.theatre.id]) {
        theatreGroups[s.theatre.id] = { theatre: s.theatre, shows: [] };
      }
      theatreGroups[s.theatre.id].shows.push(s);
    }
  });

  return (
    <div className="space-y-12 pb-20">
      {/* Backdrop Header */}
      <div className="relative bg-slate-950 border-b border-slate-800">
        <div className="absolute inset-0 overflow-hidden opacity-25 pointer-events-none">
          <img
            src={movie.backdropUrl || movie.posterUrl}
            alt={movie.title}
            className="w-full h-full object-cover object-center"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f19] via-[#0b0f19]/85 to-transparent"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors mb-6"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            {/* Poster column */}
            <div className="md:col-span-4 lg:col-span-3">
              <div className="relative rounded-xl overflow-hidden border border-slate-700 shadow-2xl aspect-[3/4] bg-slate-900 group">
                <img
                  src={movie.posterUrl}
                  alt={movie.title}
                  className="w-full h-full object-cover"
                />
                {movie.trailerUrl && (
                  <button
                    onClick={() => setTrailerModalOpen(true)}
                    className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-xs text-white"
                  >
                    <div className="w-12 h-12 rounded-full bg-rose-600 flex items-center justify-center shadow-lg">
                      <Play className="w-5 h-5 fill-white ml-0.5" />
                    </div>
                    <span className="text-xs font-semibold mt-2">Watch Trailer</span>
                  </button>
                )}
              </div>
            </div>

            {/* Info column */}
            <div className="md:col-span-8 lg:col-span-9 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">
                  {movie.status === 'now-showing' ? 'Now Showing' : 'Coming Soon'}
                </span>
                <span className="text-slate-600">·</span>
                <span className="text-xs text-slate-400">{movie.languages.join(', ')}</span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                {movie.title}
              </h1>

              {/* Unboxed metadata with · */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
                <span className="flex items-center gap-1 text-amber-400 font-bold tabular-nums">
                  <Star className="w-4 h-4 fill-amber-400" />
                  <span>{movie.rating.toFixed(1)}/10</span>
                </span>
                <span aria-hidden="true">·</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{movie.duration} mins</span>
                </span>
                <span aria-hidden="true">·</span>
                <span>{movie.genres.join(', ')}</span>
                <span aria-hidden="true">·</span>
                <span>Released {new Date(movie.releaseDate).toLocaleDateString()}</span>
              </div>

              <p className="text-sm text-slate-300 max-w-3xl leading-relaxed pt-2">
                {movie.description}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5 font-medium">Director</span>
                  <span className="text-white font-semibold">{movie.director}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5 font-medium">Starring Cast</span>
                  <span className="text-white font-semibold">{movie.cast?.join(', ')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Showtimes & Theatres Selection */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Tv className="w-5 h-5 text-rose-500" />
              <span>Available Theatres & Showtimes</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Select a showtime to proceed to interactive seat selection</p>
          </div>

          {/* Date Selector Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-lg">
            {dates.map((d) => (
              <button
                key={d.date}
                onClick={() => setSelectedDate(d.date)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  selectedDate === d.date
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {Object.keys(theatreGroups).length === 0 ? (
          <div className="p-12 text-center bg-slate-900/40 border border-slate-800 rounded-xl space-y-3">
            <Calendar className="w-8 h-8 text-slate-500 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-300">No shows scheduled for {selectedDate}</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Please check other available dates or explore other movies in the catalogue.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.values(theatreGroups).map(({ theatre, shows: tShows }) => (
              <div
                key={theatre.id}
                className="p-6 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700/80 transition-colors space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <span>{theatre.name}</span>
                    </h3>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span>{theatre.address}, {theatre.city}</span>
                    </p>
                  </div>

                  {/* Amenities tags */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
                    {theatre.facilities?.slice(0, 3).map((fac: string, i: number) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700/60">
                        {fac}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Showtimes Pills */}
                <div className="pt-2 flex flex-wrap gap-3">
                  {tShows.map((show: any) => (
                    <Link
                      key={show.id}
                      to={`/seat-selection/${show.id}`}
                      className="group flex flex-col p-3 rounded-lg bg-slate-950/80 border border-slate-800 hover:border-rose-500 hover:bg-slate-900 transition-all min-w-[140px]"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-sm font-bold text-white group-hover:text-rose-400 transition-colors tabular-nums">
                          {show.startTime}
                        </span>
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                          {show.format}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {show.screen?.screenName || 'Main Screen'}
                      </div>
                      <div className="mt-2 pt-1 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">From</span>
                        <span className="text-emerald-400 font-bold tabular-nums">₹{show.basePrice}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Trailer Modal */}
      {trailerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">{movie.title} — Official Trailer</h3>
              <button
                onClick={() => setTrailerModalOpen(false)}
                className="text-xs text-slate-400 hover:text-white px-2 py-1 bg-slate-800 rounded"
              >
                Close
              </button>
            </div>
            <div className="aspect-video bg-black rounded-lg overflow-hidden flex flex-col items-center justify-center text-center p-6 space-y-3">
              <Play className="w-12 h-12 text-rose-500" />
              <p className="text-xs text-slate-300">
                Opening trailer preview link for <strong>{movie.title}</strong>
              </p>
              <a
                href={movie.trailerUrl}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition-colors"
              >
                Watch on YouTube ↗
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
