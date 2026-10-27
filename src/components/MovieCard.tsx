import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Clock, Film } from 'lucide-react';

export interface MovieItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  posterUrl: string;
  backdropUrl: string;
  genres: string[];
  languages: string[];
  duration: number;
  rating: number;
  releaseDate: string;
  status: 'now-showing' | 'coming-soon';
  director: string;
}

export default function MovieCard({ movie }: { movie: MovieItem }) {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="group flex flex-col bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700/80 transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl hover:shadow-rose-950/20">
      {/* Poster Media Box */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-slate-950">
        {!imgError ? (
          <img
            src={movie.posterUrl}
            alt={movie.title}
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-slate-900 to-slate-950 text-slate-500">
            <Film className="w-10 h-10 mb-2 text-rose-500/60" />
            <span className="text-xs font-semibold text-center text-slate-300">{movie.title}</span>
          </div>
        )}

        {/* Rating overlay badge at bottom of poster */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-950/85 backdrop-blur-md border border-slate-800 text-xs text-amber-400 font-bold tabular-nums">
            <Star className="w-3.5 h-3.5 fill-amber-400" />
            <span>{movie.rating.toFixed(1)}</span>
          </div>

          <div className="px-2 py-1 rounded bg-slate-950/85 backdrop-blur-md border border-slate-800 text-[11px] font-medium text-slate-300">
            {movie.languages.slice(0, 2).join(', ')}
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="text-sm font-bold text-white tracking-tight line-clamp-1 group-hover:text-rose-400 transition-colors">
          {movie.title}
        </h3>

        {/* Clean Unboxed Metadata with · separator */}
        <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1.5 mb-3">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>{movie.duration}m</span>
          </span>
          <span aria-hidden="true">·</span>
          <span className="truncate">{movie.genres.slice(0, 2).join(', ')}</span>
        </div>

        <div className="mt-auto pt-2 border-t border-slate-800/60 flex items-center justify-between gap-2">
          <span className="text-[11px] text-slate-400 capitalize">
            {movie.status === 'now-showing' ? 'In Cinemas' : 'Coming Soon'}
          </span>
          <Link
            to={`/movie/${movie.id}`}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors whitespace-nowrap"
          >
            {movie.status === 'now-showing' ? 'Book Tickets' : 'View Details'}
          </Link>
        </div>
      </div>
    </div>
  );
}
