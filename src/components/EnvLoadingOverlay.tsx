import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  Code2,
  Database,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Server,
  KeyRound,
  Boxes,
} from 'lucide-react';

export interface EnvSwitchState {
  isSwitching: boolean;
  targetEnv: 'dev' | 'prod';
  fromEnv?: 'dev' | 'prod';
  status: 'switching' | 'success' | 'error';
  message?: string;
  orderCount?: number;
  tableName?: string;
}

interface EnvLoadingOverlayProps {
  state: EnvSwitchState | null;
  onDismiss?: () => void;
}

export const EnvLoadingOverlay: React.FC<EnvLoadingOverlayProps> = ({ state, onDismiss }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const isProd = state?.targetEnv === 'prod';
  const targetTableName = isProd ? '[dbo].[Shipping]' : '[dbo].[shippingdev]';
  const targetKeyType = isProd ? 'Live Production Key (EZAK_...)' : 'Test API Key (EZTK_...)';

  const steps = isProd
    ? [
        { label: 'Switching system configuration to Production mode', icon: Server },
        { label: 'Connecting to live database table [dbo].[Shipping]', icon: Database },
        { label: 'Initializing EasyPost Production API & live postage rates', icon: KeyRound },
        { label: 'Fetching production orders and shipments', icon: Boxes },
      ]
    : [
        { label: 'Switching system configuration to Development mode', icon: Server },
        { label: 'Connecting to isolated sandbox table [dbo].[shippingdev]', icon: Database },
        { label: 'Activating EasyPost Test Mode (zero billing charges)', icon: KeyRound },
        { label: 'Loading sandbox orders and test records', icon: Boxes },
      ];

  useEffect(() => {
    if (!state?.isSwitching) {
      setCurrentStepIndex(0);
      return;
    }

    if (state.status === 'switching') {
      setCurrentStepIndex(0);
      const t1 = setTimeout(() => setCurrentStepIndex(1), 220);
      const t2 = setTimeout(() => setCurrentStepIndex(2), 480);
      const t3 = setTimeout(() => setCurrentStepIndex(3), 720);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    } else if (state.status === 'success') {
      setCurrentStepIndex(steps.length);
    }
  }, [state?.isSwitching, state?.status, steps.length]);

  if (!state || !state.isSwitching) {
    return null;
  }

  return (
    <div
      id="env-loading-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md transition-all duration-300 animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-label="Switching Environment"
    >
      <div
        className={`w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden bg-white transition-all transform duration-300 scale-100 ${
          isProd
            ? 'border-emerald-200/80 shadow-emerald-950/20'
            : 'border-amber-200/80 shadow-amber-950/20'
        }`}
      >
        {/* Top Accent Header Bar */}
        <div
          className={`px-6 py-5 text-white flex items-center justify-between transition-colors ${
            isProd
              ? 'bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-700'
              : 'bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-600'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20">
              {isProd ? (
                <ShieldCheck className="w-6 h-6 text-white" />
              ) : (
                <Code2 className="w-6 h-6 text-white" />
              )}
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-white/80 flex items-center space-x-1.5">
                <span>Environment Migration</span>
                <span>•</span>
                <span className="bg-white/20 px-2 py-0.5 rounded-full font-mono text-[10px] text-white">
                  {state.fromEnv ? state.fromEnv.toUpperCase() : 'DEV'}
                  <ArrowRight className="w-2.5 h-2.5 inline mx-1" />
                  {state.targetEnv.toUpperCase()}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                {isProd ? 'Switching to Production (Live)' : 'Switching to Development (Sandbox)'}
              </h3>
            </div>
          </div>

          <div className="flex items-center">
            {state.status === 'switching' && (
              <Loader2 className="w-6 h-6 text-white/90 animate-spin" />
            )}
            {state.status === 'success' && (
              <div className="w-8 h-8 rounded-full bg-white/25 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
            )}
            {state.status === 'error' && (
              <div className="w-8 h-8 rounded-full bg-rose-500/80 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-white" />
              </div>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {/* Target details summary card */}
          <div
            className={`rounded-xl p-3.5 border text-xs grid grid-cols-2 gap-2.5 ${
              isProd
                ? 'bg-emerald-50/60 border-emerald-100 text-emerald-950'
                : 'bg-amber-50/60 border-amber-100 text-amber-950'
            }`}
          >
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Active SQL Table
              </span>
              <span className="font-mono font-bold text-slate-900 text-[12px] flex items-center space-x-1 mt-0.5">
                <Database className={`w-3.5 h-3.5 ${isProd ? 'text-emerald-600' : 'text-amber-600'}`} />
                <span>{targetTableName}</span>
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                EasyPost API Key
              </span>
              <span className="font-semibold text-slate-900 text-[11px] truncate block mt-0.5" title={targetKeyType}>
                {isProd ? 'Production (Live Billing)' : 'Test Mode (Sandbox)'}
              </span>
            </div>
          </div>

          {/* Sequential Step Progress Checklist */}
          <div className="space-y-2.5 pt-1">
            {steps.map((step, idx) => {
              const StepIcon = step.icon;
              const isCompleted = state.status === 'success' || currentStepIndex > idx;
              const isCurrent = state.status === 'switching' && currentStepIndex === idx;

              return (
                <div
                  key={idx}
                  className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-lg border text-xs transition-all duration-200 ${
                    isCompleted
                      ? isProd
                        ? 'bg-emerald-50/40 border-emerald-200/70 text-slate-900'
                        : 'bg-amber-50/40 border-amber-200/70 text-slate-900'
                      : isCurrent
                      ? isProd
                        ? 'bg-emerald-100/50 border-emerald-300 text-emerald-950 font-medium ring-1 ring-emerald-400/30'
                        : 'bg-amber-100/50 border-amber-300 text-amber-950 font-medium ring-1 ring-amber-400/30'
                      : 'bg-slate-50/60 border-slate-100 text-slate-400'
                  }`}
                >
                  <div className="shrink-0">
                    {isCompleted ? (
                      <CheckCircle2
                        className={`w-4 h-4 ${isProd ? 'text-emerald-600' : 'text-amber-600'}`}
                      />
                    ) : isCurrent ? (
                      <Loader2
                        className={`w-4 h-4 animate-spin ${isProd ? 'text-emerald-600' : 'text-amber-600'}`}
                      />
                    ) : (
                      <StepIcon className="w-4 h-4 text-slate-300" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate">{step.label}</p>
                  </div>
                  {isCompleted && (
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded font-mono ${
                        isProd ? 'text-emerald-700 bg-emerald-100' : 'text-amber-700 bg-amber-100'
                      }`}
                    >
                      OK
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Success / Error Message Banner */}
          {state.status === 'success' && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center space-x-2.5 animate-fadeIn ${
                isProd
                  ? 'bg-emerald-100 border-emerald-300 text-emerald-900'
                  : 'bg-amber-100 border-amber-300 text-amber-900'
              }`}
            >
              <CheckCircle2
                className={`w-4 h-4 shrink-0 ${isProd ? 'text-emerald-600' : 'text-amber-600'}`}
              />
              <div className="font-medium">
                {state.message ||
                  `Ready! Switched to ${state.targetEnv.toUpperCase()} mode. Active Table: ${targetTableName}`}
              </div>
            </div>
          )}

          {state.status === 'error' && (
            <div className="p-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-xs flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{state.message || 'An error occurred while switching environment.'}</span>
              </div>
              {onDismiss && (
                <button
                  onClick={onDismiss}
                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-semibold cursor-pointer"
                >
                  Dismiss
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer Note */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span>Target: {isProd ? 'Live Production Server' : 'Sandbox Development Database'}</span>
          <span className="font-mono text-[10px] text-slate-400">
            {state.status === 'switching' ? 'Configuring tables...' : 'Complete'}
          </span>
        </div>
      </div>
    </div>
  );
};
