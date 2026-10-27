import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Film, User, Shield, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { apiRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const { success, error } = useToast();

  const redirectUrl = searchParams.get('redirect') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    try {
      const res = await apiRequest<{ success: boolean; token: string; user: any }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      if (res.success) {
        login(res.token, res.user);
        success(`Welcome back, ${res.user.name}!`);
        if (res.user.role === 'admin' && redirectUrl === '/') {
          navigate('/admin');
        } else {
          navigate(redirectUrl);
        }
      }
    } catch (err: any) {
      error(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-10 h-10 rounded-xl bg-rose-600/20 text-rose-500 border border-rose-500/40 flex items-center justify-center mx-auto">
          <Film className="w-5 h-5" />
        </div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Sign In to IMovies</h1>
        <p className="text-xs text-slate-400">Access your cinema passes and rapid seat checkout</p>
      </div>

      {/* Demo Account Quick-Fill Buttons */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2.5">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
          One-Click Demo Credentials:
        </span>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => fillDemoAccount('john@example.com', 'UserSecure@2026!')}
            className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-xs text-slate-300 transition-colors border border-slate-700/60"
          >
            <User className="w-3.5 h-3.5 text-rose-400" />
            <span>Demo Customer</span>
          </button>
          <button
            type="button"
            onClick={() => fillDemoAccount('admin@imovies.com', 'AdminSecure@2026!')}
            className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-xs text-amber-300 transition-colors border border-amber-500/30"
          >
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span>Super Admin</span>
          </button>
        </div>
      </div>

      <div className="p-6 sm:p-8 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-xl space-y-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-white focus:outline-none focus:border-rose-500"
              placeholder="e.g. user@example.com"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-slate-300">Password</label>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 pr-9 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-white focus:outline-none focus:border-rose-500"
                placeholder="Enter password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-bold rounded-lg transition-colors shadow-lg shadow-rose-950/40 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
          Don't have an account yet?{' '}
          <Link to="/register" className="text-rose-400 hover:underline font-semibold">
            Create an Account
          </Link>
        </div>
      </div>
    </div>
  );
}
