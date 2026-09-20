import React from 'react';
import {
  Package,
  Search,
  PlusCircle,
  BarChart3,
  Settings,
  Database,
  LogOut,
  Truck,
  Sparkles,
  FileText,
  User,
  Layers,
  ShieldCheck,
  Code2,
  Wallet,
  RefreshCw,
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface NavbarProps {
  activeTab: 'dashboard' | 'search' | 'reports' | 'settings';
  setActiveTab: (tab: 'dashboard' | 'search' | 'reports' | 'settings') => void;
  openManualOrderModal: () => void;
  openScanFormModal?: () => void;
  pendingValidationCount: number;
  addressErrorCount: number;
  readyToShipCount: number;
  mssqlConnected: boolean;
  easyPostMode: string;
  appEnv?: 'dev' | 'prod';
  onToggleAppEnv?: (newEnv: 'dev' | 'prod') => void;
  onLogout: () => void;
  onSyncMssql?: () => Promise<void>;
  currentUser?: { username: string; fullName?: string; role?: string } | null;
  walletBalance?: number | null;
  walletLoading?: boolean;
  onRefreshWallet?: () => void;
  shippedHistoryCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  openManualOrderModal,
  openScanFormModal,
  pendingValidationCount,
  addressErrorCount,
  readyToShipCount,
  mssqlConnected,
  easyPostMode,
  appEnv = 'prod',
  onToggleAppEnv,
  onLogout,
  onSyncMssql,
  currentUser,
  walletBalance,
  walletLoading,
  onRefreshWallet,
  shippedHistoryCount,
}) => {
  const [isSyncing, setIsSyncing] = React.useState(false);

  const handleSyncClick = async () => {
    if (!onSyncMssql) return;
    setIsSyncing(true);
    await onSyncMssql();
    setIsSyncing(false);
  };
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-sm">
      {/* Top Banner with System Statuses & Dev/Prod Switch */}
      <div className="bg-slate-950 px-4 py-1.5 text-xs text-slate-400 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3 sm:space-x-4 flex-wrap">
          {/* Dev / Production Switch */}
          <div className="flex items-center space-x-1.5 bg-slate-900 border border-slate-700/80 rounded-lg p-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 pl-1.5 pr-1 hidden sm:inline">
              ENV:
            </span>
            <button
              type="button"
              onClick={() => onToggleAppEnv && onToggleAppEnv('dev')}
              className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                appEnv === 'dev'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Development Mode: Uses [dbo].[shippingdev] table & EasyPost Test API Key"
            >
              <Code2 className="w-3 h-3" />
              <span>DEV</span>
            </button>
            <button
              type="button"
              onClick={() => onToggleAppEnv && onToggleAppEnv('prod')}
              className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                appEnv === 'prod'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Production Mode: Uses [dbo].[Shipping] table & EasyPost Production API Key"
            >
              <ShieldCheck className="w-3 h-3" />
              <span>PROD</span>
            </button>
          </div>

          {/* Database Sync Badge */}
          <button
            type="button"
            onClick={handleSyncClick}
            disabled={isSyncing || !mssqlConnected}
            className={`flex items-center space-x-1.5 bg-slate-900/90 hover:bg-slate-800/90 px-2.5 py-0.5 rounded border border-slate-800 text-[11px] transition-colors cursor-pointer disabled:opacity-60 shadow-xs ${
              appEnv === 'prod' ? 'hover:border-emerald-700/50' : 'hover:border-amber-700/50'
            }`}
            title="Click to sync orders directly with MS SQL database"
          >
            <Database className={`w-3.5 h-3.5 ${appEnv === 'prod' ? 'text-emerald-400' : 'text-amber-400'} ${isSyncing ? 'animate-spin' : ''}`} />
            <span className="font-semibold text-slate-200">
              {isSyncing ? 'Syncing...' : 'Database Sync'}
            </span>
            {mssqlConnected && (
              <span
                className={`w-1.5 h-1.5 rounded-full ${appEnv === 'prod' ? 'bg-emerald-400' : 'bg-amber-400'} animate-pulse`}
                title={appEnv === 'prod' ? 'Connected to Production SQL' : 'Connected to Dev SQL'}
              />
            )}
          </button>

          <span className="text-slate-800 hidden md:inline">|</span>

          {/* EasyPost Key Badge */}
          <div className="flex items-center space-x-1.5 text-[11px]">
            <Truck className="w-3.5 h-3.5 text-indigo-400" />
            <span>
              EasyPost: <strong className={appEnv === 'prod' ? 'text-emerald-300 font-medium' : 'text-indigo-300 font-medium'}>
                {appEnv === 'prod' ? 'PRODUCTION KEY' : 'TEST KEY'}
              </strong>
            </span>
          </div>

          <span className="text-slate-800 hidden lg:inline">|</span>

          {/* Shipping Wallet Balance Badge */}
          <div
            className="flex items-center space-x-1.5 bg-slate-900/90 px-2.5 py-0.5 rounded-lg border border-slate-700/80 text-[11px] shadow-xs"
            title="EasyPost Shipping Wallet Balance"
          >
            <Wallet className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>
              Wallet:{' '}
              <strong className="text-emerald-300 font-mono font-bold">
                {walletLoading
                  ? '...'
                  : walletBalance !== null && walletBalance !== undefined
                  ? `$${walletBalance.toFixed(2)}`
                  : '$0.00'}
              </strong>
            </span>
            {onRefreshWallet && (
              <button
                type="button"
                onClick={onRefreshWallet}
                disabled={walletLoading}
                className="ml-1 text-slate-400 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
                title="Refresh EasyPost Wallet Balance"
              >
                <RefreshCw className={`w-3 h-3 ${walletLoading ? 'animate-spin' : ''}`} />
              </button>
            )}
          </div>

          {/* User Badge */}
          {currentUser && (
            <>
              <span className="text-slate-800 hidden sm:inline">|</span>
              <span className="inline-flex items-center space-x-1 bg-indigo-950/80 text-indigo-200 px-2 py-0.5 rounded text-[11px] font-medium border border-indigo-700/60">
                <User className="w-3 h-3 text-indigo-400" />
                <span>User: <strong className="text-white">{currentUser.username}</strong> ({currentUser.role || 'Admin'})</span>
              </span>
            </>
          )}

          {/* Smartphone & Web App Install Button */}
          <PWAInstallButton />

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="flex items-center space-x-1 text-slate-400 hover:text-rose-300 transition-colors pl-2 border-l border-slate-800 cursor-pointer"
            title="Logout of Portal Session"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Brand & Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm font-bold text-lg">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-white">BCB Shipping</span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">EasyPost Labeling &amp; Logistics Engine</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center space-x-1 sm:space-x-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Dashboard</span>
              {(pendingValidationCount > 0 || addressErrorCount > 0) && (
                <span className="ml-1 px-1.5 py-0.2 bg-indigo-950 text-indigo-200 text-xs font-bold rounded-full border border-indigo-700">
                  {pendingValidationCount + addressErrorCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('search')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'search'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>Shipped History</span>
              {shippedHistoryCount !== undefined && shippedHistoryCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-slate-800 text-slate-300 text-xs font-bold rounded-full border border-slate-700">
                  {shippedHistoryCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('reports')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'reports'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Analytics</span>
            </button>

            {currentUser?.role?.toLowerCase() === 'admin' && (
              <button
                onClick={() => setActiveTab('settings')}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === 'settings'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Configuration</span>
              </button>
            )}
          </nav>

          {/* Quick Actions Buttons */}
          <div className="flex items-center space-x-2">
            {openScanFormModal && (
              <button
                onClick={openScanFormModal}
                className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 font-semibold text-xs sm:text-sm px-3 py-2 rounded-lg transition-all shadow-sm active:scale-95 cursor-pointer"
                title="Create or print end-of-day USPS Form 5630 SCAN Form via EasyPost"
              >
                <FileText className="w-4 h-4 text-indigo-400" />
                <span className="hidden md:inline">SCAN Form</span>
              </button>
            )}
            <button
              onClick={openManualOrderModal}
              className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm px-4 py-2 rounded-lg transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Create Manual Order</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
