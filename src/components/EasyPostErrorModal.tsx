import React from 'react';
import { AlertTriangle, X, ShieldAlert, Truck, ExternalLink, HelpCircle } from 'lucide-react';

export interface EasyPostErrorInfo {
  title?: string;
  message: string;
  details?: string | string[];
  problemOrders?: string[];
  statusCode?: number;
}

interface EasyPostErrorModalProps {
  error: EasyPostErrorInfo;
  onClose: () => void;
}

export const EasyPostErrorModal: React.FC<EasyPostErrorModalProps> = ({ error, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-rose-200 max-w-xl w-full overflow-hidden my-auto animate-in fade-in zoom-in duration-150">
        {/* Header Bar */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-rose-900 via-rose-800 to-rose-950 text-white flex items-start justify-between border-b border-rose-700/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600/80 border border-rose-400/40 flex items-center justify-center text-white shrink-0 shadow-sm">
              <ShieldAlert className="w-5 h-5 text-rose-100" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="bg-rose-500 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded tracking-wide">
                  EasyPost API Alert
                </span>
                {error.statusCode && (
                  <span className="bg-rose-950 text-rose-200 border border-rose-700 font-mono text-[10px] px-1.5 py-0.5 rounded">
                    HTTP {error.statusCode}
                  </span>
                )}
              </div>
              <h3 className="text-base sm:text-lg font-bold tracking-tight text-white mt-0.5">
                {error.title || 'EasyPost Service Error'}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-rose-200 hover:text-white hover:bg-rose-700/60 transition-colors cursor-pointer"
            title="Dismiss Error (This modal will stay open until manually dismissed)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4 max-h-[70vh] overflow-y-auto bg-slate-50/50">
          {/* Main Error Message Box */}
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 space-y-2">
            <div className="flex items-start space-x-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1 flex-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-rose-900">
                  EasyPost Response Details
                </h4>
                <div className="text-xs text-rose-950 font-medium whitespace-pre-wrap leading-relaxed">
                  {error.message}
                </div>
              </div>
            </div>
          </div>

          {/* Details Section */}
          {error.details && (
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2 text-xs">
              <h5 className="font-bold text-slate-800 flex items-center space-x-1.5">
                <HelpCircle className="w-4 h-4 text-indigo-600" />
                <span>Diagnostic Context:</span>
              </h5>
              {Array.isArray(error.details) ? (
                <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1 font-mono text-[11px]">
                  {error.details.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              ) : (
                <pre className="bg-slate-900 text-slate-100 p-3 rounded-lg font-mono text-[11px] overflow-x-auto whitespace-pre-wrap">
                  {error.details}
                </pre>
              )}
            </div>
          )}

          {/* Affected Orders List */}
          {error.problemOrders && error.problemOrders.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 space-y-2 text-xs">
              <h5 className="font-bold text-amber-900">
                Flagged Orders ({error.problemOrders.length}):
              </h5>
              <div className="flex flex-wrap gap-1.5">
                {error.problemOrders.map((ordNum, idx) => (
                  <span
                    key={idx}
                    className="bg-white border border-amber-300 text-amber-950 px-2 py-0.5 rounded font-mono font-bold text-[11px]"
                  >
                    #{ordNum}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Recommended Resolution Steps */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 text-xs space-y-2 text-slate-700">
            <h5 className="font-bold text-slate-900 flex items-center space-x-1.5">
              <Truck className="w-4 h-4 text-indigo-600" />
              <span>Recommended Next Steps:</span>
            </h5>
            <ul className="space-y-1.5 text-slate-600 list-disc list-inside pl-1">
              <li>
                <strong className="text-slate-800">API Key &amp; Environment:</strong> Verify your EasyPost Secret API Key in <em>Settings &gt; EasyPost API Integration</em>. Ensure Dev mode uses an <code className="bg-slate-100 px-1 py-0.2 rounded font-mono text-[10px]">EZTK_</code> test key and Prod mode uses an <code className="bg-slate-100 px-1 py-0.2 rounded font-mono text-[10px]">EZAK_</code> production key.
              </li>
              <li>
                <strong className="text-slate-800">Shipping Wallet:</strong> Check your EasyPost account balance to ensure sufficient postage funds or an active billing payment method.
              </li>
              <li>
                <strong className="text-slate-800">Address &amp; Weight:</strong> If an address is incomplete or package weight is 0 oz, use the <em>Address Fix</em> or <em>Weight Correction</em> tools on the Dashboard before buying postage.
              </li>
            </ul>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-100 flex items-center justify-between">
          <p className="text-[11px] text-slate-500">
            This alert will remain visible until you dismiss it.
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer"
          >
            Dismiss Alert
          </button>
        </div>
      </div>
    </div>
  );
};
