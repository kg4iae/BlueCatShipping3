import React, { useState, useEffect } from 'react';
import { Lock, ShieldCheck, ArrowRight, KeyRound, User as UserIcon, Database, CheckCircle2, AlertCircle, RefreshCw, Loader2, Server } from 'lucide-react';

interface DatabaseStatus {
  connected: boolean;
  server?: string;
  database?: string;
  appEnv?: string;
  error?: string | null;
}

interface LoginModalProps {
  initialMssqlConnected?: boolean;
  onLoginSuccess: (token: string, user?: { username: string; fullName?: string; role?: string }) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ initialMssqlConnected, onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Database Connection Status state
  const [dbStatus, setDbStatus] = useState<DatabaseStatus | null>(
    initialMssqlConnected !== undefined ? { connected: initialMssqlConnected } : null
  );
  const [dbStatusLoading, setDbStatusLoading] = useState<boolean>(true);

  const fetchDatabaseStatus = async () => {
    try {
      setDbStatusLoading(true);
      const res = await fetch('/api/database/status');
      if (res.ok) {
        const data: DatabaseStatus = await res.json();
        setDbStatus(data);
      } else {
        setDbStatus({ connected: false, error: 'Could not contact status endpoint' });
      }
    } catch (err: any) {
      setDbStatus({ connected: false, error: err?.message || 'Network error' });
    } finally {
      setDbStatusLoading(false);
    }
  };

  useEffect(() => {
    fetchDatabaseStatus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (data.success) {
        onLoginSuccess(data.token, data.user);
      } else {
        setError(data.error || 'Incorrect username or password.');
      }
    } catch (err) {
      setError('Connection failed. Please check backend server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xl max-w-md w-full p-8 text-slate-800 relative overflow-hidden">
        {/* Top Decorative bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-indigo-600 to-sky-500" />

        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-center text-indigo-600 mb-3 shadow-sm">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">BlueCat Bobbins Shipping Login</h2>
          
          {/* SQL Database Connection Status Badge */}
          <div className="mt-3 w-full flex items-center justify-center">
            {dbStatusLoading && !dbStatus ? (
              <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200 animate-pulse">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500" />
                <span>Checking SQL Database...</span>
              </div>
            ) : dbStatus?.connected ? (
              <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-300 shadow-xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                </span>
                <Database className="w-3.5 h-3.5 text-emerald-600" />
                <span>SQL Database: Connected</span>
                <button
                  type="button"
                  onClick={fetchDatabaseStatus}
                  title="Refresh Database Status"
                  className="ml-1 text-emerald-600 hover:text-emerald-800 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${dbStatusLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            ) : (
              <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-300 shadow-xs">
                <span className="inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
                <Database className="w-3.5 h-3.5 text-rose-600" />
                <span>SQL Database: Disconnected</span>
                <button
                  type="button"
                  onClick={fetchDatabaseStatus}
                  title="Retry Database Connection Check"
                  className="ml-1 text-rose-600 hover:text-rose-800 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${dbStatusLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            )}
          </div>

          {/* Database server/details note */}
          {dbStatus && (
            <div className="mt-1 text-[11px] text-slate-500 flex items-center justify-center space-x-1.5">
              <Server className="w-3 h-3 text-slate-400" />
              <span>
                {dbStatus.server ? `${dbStatus.server} (${dbStatus.database || 'Default DB'})` : 'MS SQL Server'}
              </span>
              <span className="text-slate-300">•</span>
              <span className={`font-medium ${dbStatus.connected ? 'text-emerald-600' : 'text-amber-600'}`}>
                {dbStatus.connected ? 'Online' : 'Offline / Standalone Mode'}
              </span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Username
            </label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 pl-11 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm font-medium"
                required
                autoFocus
              />
              <UserIcon className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 pl-11 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm"
                required
              />
              <KeyRound className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 px-3.5 py-2.5 rounded-lg text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <div>
                <span className="font-semibold">Error: </span>
                <span>{error}</span>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition-all shadow-sm flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Sign In to Portal</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center space-x-1.5">
            <ShieldCheck className={`w-4 h-4 ${dbStatus?.connected ? 'text-emerald-600' : 'text-slate-400'}`} />
            <span>Database Auth {dbStatus?.connected ? 'Active' : 'Standby'}</span>
          </div>
          <span className="text-[11px] text-slate-400">
            {dbStatus?.appEnv === 'dev' ? 'Development Mode' : 'Production Mode'}
          </span>
        </div>
      </div>
    </div>
  );
};

