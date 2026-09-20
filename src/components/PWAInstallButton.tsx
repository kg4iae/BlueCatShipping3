import React, { useState } from 'react';
import { Smartphone, Download, Share, PlusSquare, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  // If already running as an installed PWA app, hide the button
  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (!success) {
        setShowGuide(true);
      }
    } else {
      setShowGuide(true);
    }
  };

  return (
    <>
      <button
        id="btn-install-pwa"
        type="button"
        onClick={handleClick}
        className="flex items-center space-x-1.5 bg-indigo-600/90 hover:bg-indigo-500 text-white px-2.5 py-0.5 rounded text-[11px] font-semibold transition-all shadow-xs hover:shadow-indigo-500/20 cursor-pointer"
        title="Install BCB Shipping App on Smartphone or Desktop"
      >
        <Smartphone className="w-3.5 h-3.5 text-indigo-200 shrink-0" />
        <span>Install App</span>
      </button>

      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 p-5 shadow-2xl text-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Install BCB Shipping</h3>
                  <p className="text-[11px] text-slate-400">Smartphone &amp; Desktop App</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isIOS ? (
              <div className="space-y-2.5 text-xs text-slate-300">
                <p className="font-medium text-slate-200">To install on iPhone or iPad:</p>
                <ol className="list-decimal list-inside space-y-2 text-slate-300 pl-1">
                  <li className="flex items-start gap-2">
                    <Share className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                    <span>Tap the <strong>Share</strong> button in the Safari toolbar</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <PlusSquare className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Scroll down and tap <strong>Add to Home Screen</strong></span>
                  </li>
                  <li className="text-slate-400">
                    Confirm by tapping <strong>Add</strong> in the top-right corner.
                  </li>
                </ol>
              </div>
            ) : isInstallable ? (
              <div className="space-y-3 text-xs text-slate-300">
                <p>Click below to install BCB Shipping as a standalone smartphone or desktop application:</p>
                <button
                  type="button"
                  onClick={async () => {
                    await install();
                    setShowGuide(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Launch Install Prompt</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2.5 text-xs text-slate-300">
                <p className="font-medium text-slate-200">To install on Android or Chrome:</p>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-300 pl-1">
                  <li>Open the browser menu (<strong>⋮</strong> or three dots) in the top-right corner.</li>
                  <li>Tap <strong>Install App</strong> or <strong>Add to Home screen</strong>.</li>
                  <li>Follow the on-screen prompt to complete installation.</li>
                </ol>
                <p className="text-[11px] text-slate-400 pt-1">
                  Once installed, launch BCB Shipping directly from your home screen just like a native mobile app!
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};
