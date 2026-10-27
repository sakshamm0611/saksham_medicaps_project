import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Film, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { apiRequest } from '../services/api';
import MovieCard, { MovieItem } from '../components/MovieCard';
import { useToast } from '../context/ToastContext';

export default function MoviesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [movies, setMovies] = useState<MovieItem[]>([]);
  const [loading, setLoading] = useState(true);

  const initialSearch = searchParams.get('search') || '';
  const initialStatus = searchParams.get('status') || 'all';

  const [search, setSearch] = useState(initialSearch);
  const [genre, setGenre] = useState('All');
  const [language, setLanguage] = useState('All');
  const [status, setStatus] = useState(initialStatus);
  const [sort, setSort] = useState('rating');
  const { error } = useToast();

  const genres = ['All', 'Sci-Fi', 'Action', 'Drama', 'Adventure', 'Thriller', 'Animation', 'Biography'];
  const languages = ['All', 'English', 'Hindi', 'Tamil', 'Telugu'];

  useEffect(() => {
    async function fetchMovies() {
      try {
        setLoading(true);
        let query = `/api/movies?sort=${sort}`;
        if (genre !== 'All') query += `&genre=${genre}`;
        if (language !== 'All') query += `&language=${language}`;
        if (status !== 'all') query += `&status=${status}`;

        const res = await apiRequest<{ success: boolean; data: MovieItem[] }>(query);
        if (res.success) setMovies(res.data);
      } catch (err) {
        error('Failed to load movies.');
      } finally {
        setLoading(false);
      }
    }
    fetchMovies();
  }, [genre, language, status, sort, error]);

  const filteredMovies = movies.filter((m) =>
    search ? m.title.toLowerCase().includes(search.toLowerCase()) || m.director.toLowerCase().includes(search.toLowerCase()) : true
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Title & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Movie Catalogue</h1>
          <p className="text-xs text-slate-400 mt-1">Browse now-showing blockbusters and upcoming premieres</p>
        </div>

        <div className="w-full md:w-80 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search catalogue..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:border-rose-500"
          />
        </div>
      </div>

      {/* Filter and Sorting Toolbar */}
      <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Status Segmented Control */}
          <div className="flex items-center gap-1 p-1 bg-slate-950/80 rounded-lg border border-slate-800">
            <button
              onClick={() => {
                setStatus('all');
                setSearchParams({});
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                status === 'all' ? 'bg-rose-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              All Releases
            </button>
            <button
              onClick={() => {
                setStatus('now-showing');
                setSearchParams({ status: 'now-showing' });
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                status === 'now-showing' ? 'bg-rose-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Now Showing
            </button>
            <button
              onClick={() => {
                setStatus('coming-soon');
                setSearchParams({ status: 'coming-soon' });
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                status === 'coming-soon' ? 'bg-rose-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Coming Soon
            </button>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>Sort:</span>
            </span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-rose-500"
            >
              <option value="rating">Top Rated</option>
              <option value="popularity">Popularity</option>
              <option value="newest">Release Date</option>
            </select>
          </div>
        </div>

        {/* Genres and Languages Tags */}
        <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-xs text-slate-400 font-medium mr-1 shrink-0">Genre:</span>
            {genres.map((g) => (
              <button
                key={g}
                onClick={() => setGenre(g)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  genre === g
                    ? 'bg-slate-200 text-slate-950 font-semibold'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {g}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-xs text-slate-400 font-medium mr-1 shrink-0">Language:</span>
            {languages.map((l) => (
              <button
                key={l}
                onClick={() => setLanguage(l)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  language === l
                    ? 'bg-slate-200 text-slate-950 font-semibold'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid Results */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="aspect-[3/4] rounded-xl bg-slate-900/60 animate-pulse border border-slate-800"></div>
          ))}
        </div>
      ) : filteredMovies.length === 0 ? (
        <div className="py-20 text-center bg-slate-900/30 border border-slate-800 rounded-xl p-8">
          <Film className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white">No movies found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            No titles matched your current search filters. Try clearing your filters or searching another keyword.
          </p>
          <button
            onClick={() => {
              setSearch('');
              setGenre('All');
              setLanguage('All');
              setStatus('all');
            }}
            className="mt-4 px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredMovies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      )}
    </div>
  );
}
