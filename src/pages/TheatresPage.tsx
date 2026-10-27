import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Film, Tv, Sparkles, ChevronRight } from 'lucide-react';
import { apiRequest } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function TheatresPage() {
  const [theatres, setTheatres] = useState<any[]>([]);
  const [shows, setShows] = useState<any[]>([]);
  const [selectedCity, setSelectedCity] = useState('All');
  const [loading, setLoading] = useState(true);
  const { error } = useToast();

  const cities = ['All', 'Mumbai', 'Delhi NCR', 'Bengaluru', 'Hyderabad'];

  useEffect(() => {
    async function loadTheatres() {
      try {
        setLoading(true);
        const url = selectedCity === 'All' ? '/api/theatres' : `/api/theatres?city=${selectedCity}`;
        const [tRes, sRes] = await Promise.all([
          apiRequest<{ success: boolean; data: any[] }>(url),
          apiRequest<{ success: boolean; data: any[] }>('/api/shows')
        ]);

        if (tRes.success) setTheatres(tRes.data);
        if (sRes.success) setShows(sRes.data);
      } catch (err) {
        error('Failed to load theatres.');
      } finally {
        setLoading(false);
      }
    }
    loadTheatres();
  }, [selectedCity, error]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Flagship Theatres & Multiplexes</h1>
        <p className="text-xs text-slate-400 mt-1">
          Explore world-class laser IMAX, Dolby Atmos, and 4DX dynamic auditoriums across major metropolitan hubs.
        </p>
      </div>

      {/* City Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
        {cities.map((city) => (
          <button
            key={city}
            onClick={() => setSelectedCity(city)}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              selectedCity === city
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
            }`}
          >
            {city}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 rounded-xl bg-slate-900/60 animate-pulse border border-slate-800"></div>
          ))}
        </div>
      ) : theatres.length === 0 ? (
        <div className="p-16 text-center bg-slate-900/40 border border-slate-800 rounded-xl">
          <MapPin className="w-10 h-10 text-slate-500 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-white">No theatres found</h3>
          <p className="text-xs text-slate-400 mt-1">Try selecting another city.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {theatres.map((theatre) => {
            const theatreShows = shows.filter((s) => s.theatreId === theatre.id);
            const uniqueMoviesMap = new Map();
            theatreShows.forEach((s) => {
              if (s.movie) uniqueMoviesMap.set(s.movie.id, s.movie);
            });
            const playingMovies = Array.from(uniqueMoviesMap.values());

            return (
              <div
                key={theatre.id}
                className="p-6 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between space-y-4 hover:border-slate-700/80 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-rose-400 font-semibold mb-2">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{theatre.city}</span>
                    </span>
                    <span className="text-slate-400 font-mono text-[11px]">
                      {theatre.screensData?.length || theatre.screens?.length || 1} Auditorium(s)
                    </span>
                  </div>

                  <h2 className="text-lg font-bold text-white mb-1.5">{theatre.name}</h2>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">{theatre.address}</p>

                  <div className="mb-4">
                    <h4 className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-2">
                      Auditorium Facilities
                    </h4>
                    <div className="flex flex-wrap gap-1.5 text-xs text-slate-300">
                      {theatre.facilities?.map((f: string, i: number) => (
                        <span key={i} className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-[11px]">
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>

                  {playingMovies.length > 0 && (
                    <div className="pt-3 border-t border-slate-800/80">
                      <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        Currently Playing Here
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {playingMovies.map((movie: any) => (
                          <Link
                            key={movie.id}
                            to={`/movie/${movie.id}`}
                            className="text-xs text-slate-200 hover:text-rose-400 bg-slate-800/60 hover:bg-slate-800 px-2.5 py-1 rounded-md border border-slate-700/50 transition-colors"
                          >
                            {movie.title}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    {theatreShows.length} showtimes scheduled today
                  </span>
                  {playingMovies.length > 0 && (
                    <Link
                      to={`/movie/${playingMovies[0].id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-rose-500 hover:text-rose-400 transition-colors"
                    >
                      <span>Book at this cinema</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
