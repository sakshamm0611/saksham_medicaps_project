import React from 'react';
import { Link } from 'react-router-dom';
import { Film, ShieldCheck, Clock, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#070a10] border-t border-slate-800/80 py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 text-white font-extrabold text-lg tracking-tight">
              <div className="w-7 h-7 rounded-lg bg-rose-600/20 border border-rose-500/40 flex items-center justify-center text-rose-500">
                <Film className="w-3.5 h-3.5" />
              </div>
              <span>I<span className="text-rose-500">MOVIES</span></span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Premium cinema discovery and real-time seat reservation platform. Atomic concurrency locks, instant verified ticketing, and flagship multiplex experiences.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">Explore</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <Link to="/movies?status=now-showing" className="hover:text-white transition-colors">Now Showing</Link>
              </li>
              <li>
                <Link to="/movies?status=coming-soon" className="hover:text-white transition-colors">Upcoming Premieres</Link>
              </li>
              <li>
                <Link to="/theatres" className="hover:text-white transition-colors">Flagship Theatres</Link>
              </li>
              <li>
                <Link to="/movies" className="hover:text-white transition-colors">All Movies</Link>
              </li>
            </ul>
          </div>

          {/* Experiences */}
          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">Cinema Formats</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>IMAX 4K Laser with 12-Channel Sound</li>
              <li>Dolby Cinema & Atmos 7.1</li>
              <li>4DX Dynamic Motion & Environmental FX</li>
              <li>Insignia VIP Motorized Recliners</li>
            </ul>
          </div>

          {/* Trust & Guarantee */}
          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">Seat Guarantee</h4>
            <div className="space-y-2.5 text-xs text-slate-400">
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Zero double-booking guarantee via 5-minute atomic reservation locks</span>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>Instant QR ticket pass issuance with automated cancellation policy</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} IMovies Entertainment Inc. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span>Server: Active</span>
            <span>·</span>
            <span>Socket.IO Engine: Connected</span>
            <span>·</span>
            <span>Test Mode Simulator Ready</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
