import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Film, User, Shield, LogOut, Ticket, MapPin, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Navbar({
  selectedCity,
  onCityChange
}: {
  selectedCity?: string;
  onCityChange?: (city: string) => void;
}) {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { info } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [cityMenuOpen, setCityMenuOpen] = useState(false);

  const cities = ['All', 'Mumbai', 'Delhi NCR', 'Bengaluru', 'Hyderabad'];

  const handleSignOut = () => {
    logout();
    setDropdownOpen(false);
    info('Signed out successfully.');
    navigate('/');
  };

  const currentCity = selectedCity || 'All';

  return (
    <header className="sticky top-0 z-40 bg-[#0b0f19]/95 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        
        {/* Zone 1: Single-element Brand wordmark */}
        <Link to="/" className="flex items-center gap-2.5 text-white font-extrabold text-xl tracking-tight whitespace-nowrap shrink-0 group">
          <div className="w-8 h-8 rounded-lg bg-rose-600/20 border border-rose-500/40 flex items-center justify-center text-rose-500 group-hover:bg-rose-600 group-hover:text-white transition-colors duration-200">
            <Film className="w-4 h-4" />
          </div>
          <span>I<span className="text-rose-500">MOVIES</span></span>
        </Link>

        {/* Zone 2: 4-5 concise single-line nav links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
          <Link
            to="/movies"
            className={`whitespace-nowrap shrink-0 transition-colors ${
              location.pathname === '/movies' ? 'text-rose-500 font-semibold' : 'hover:text-white'
            }`}
          >
            Movies
          </Link>
          <Link
            to="/theatres"
            className={`whitespace-nowrap shrink-0 transition-colors ${
              location.pathname === '/theatres' ? 'text-rose-500 font-semibold' : 'hover:text-white'
            }`}
          >
            Theatres
          </Link>
          <Link
            to="/movies?status=now-showing"
            className="whitespace-nowrap shrink-0 hover:text-white transition-colors"
          >
            Now Showing
          </Link>
          <Link
            to="/movies?status=coming-soon"
            className="whitespace-nowrap shrink-0 hover:text-white transition-colors"
          >
            Coming Soon
          </Link>
        </nav>

        {/* Zone 3: Primary action / City Selector & User Session */}
        <div className="flex items-center gap-3 shrink-0">
          {/* City Selector */}
          {onCityChange && (
            <div className="relative">
              <button
                onClick={() => setCityMenuOpen(!cityMenuOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-lg transition-colors whitespace-nowrap"
              >
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                <span>{currentCity === 'All' ? 'Select City' : currentCity}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {cityMenuOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-slate-900 border border-slate-800 rounded-lg shadow-2xl py-1 z-50">
                  <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Location
                  </div>
                  {cities.map((city) => (
                    <button
                      key={city}
                      onClick={() => {
                        onCityChange(city);
                        setCityMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between ${
                        currentCity === city
                          ? 'text-rose-400 bg-rose-500/10 font-medium'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span>{city}</span>
                      {currentCity === city && <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* User Account or Sign In */}
          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 rounded-lg transition-colors whitespace-nowrap"
              >
                <div className="w-5 h-5 rounded-full bg-rose-600/30 text-rose-400 flex items-center justify-center font-bold text-[10px]">
                  {user?.name.charAt(0).toUpperCase()}
                </div>
                <span className="max-w-[100px] truncate">{user?.name}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-lg shadow-2xl py-1 z-50">
                  <div className="px-3 py-2 border-b border-slate-800">
                    <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                  </div>

                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs text-amber-300 hover:bg-slate-800/80 transition-colors"
                    >
                      <Shield className="w-3.5 h-3.5 text-amber-400" />
                      <span>Admin Console</span>
                    </Link>
                  )}

                  <Link
                    to="/dashboard"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800/80 transition-colors"
                  >
                    <Ticket className="w-3.5 h-3.5 text-rose-400" />
                    <span>My Bookings</span>
                  </Link>

                  <div className="border-t border-slate-800 mt-1 pt-1">
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10 transition-colors text-left"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white transition-colors whitespace-nowrap shrink-0"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-3.5 py-1.5 text-xs font-medium text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors shadow-sm whitespace-nowrap shrink-0"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
