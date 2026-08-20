import React, { useState, useEffect } from 'react';
import { ShippingOrder, formatOrderId } from '../types';
import { Scale, AlertTriangle, CheckCircle2, Save, X, Package } from 'lucide-react';

interface WeightCorrectionModalProps {
  order: ShippingOrder;
  onClose: () => void;
  onSaveWeight: (orderId: string, weightOz: number) => Promise<void>;
}

export const WeightCorrectionModal: React.FC<WeightCorrectionModalProps> = ({
  order,
  onClose,
  onSaveWeight,
}) => {
  // Initialize weight state (default to existing weight or 16 oz if 0)
  const [weightOz, setWeightOz] = useState<number>(order.weightOz > 0 ? order.weightOz : 16);
  const [lbsInput, setLbsInput] = useState<number>(Math.floor((order.weightOz > 0 ? order.weightOz : 16) / 16));
  const [ozInput, setOzInput] = useState<number>(
    Math.round(((order.weightOz > 0 ? order.weightOz : 16) % 16) * 10) / 10
  );
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync lbs/oz inputs when total weightOz changes
  const handleTotalOzChange = (val: number) => {
    const safeOz = Math.max(0, val);
    setWeightOz(safeOz);
    setLbsInput(Math.floor(safeOz / 16));
    setOzInput(Math.round((safeOz % 16) * 10) / 10);
    setErrorMsg(null);
  };

  const handleLbsChange = (lbs: number) => {
    const safeLbs = Math.max(0, lbs);
    setLbsInput(safeLbs);
    const newTotal = safeLbs * 16 + ozInput;
    setWeightOz(Math.round(newTotal * 10) / 10);
    setErrorMsg(null);
  };

  const handleOzChange = (oz: number) => {
    const safeOz = Math.max(0, oz);
    setOzInput(safeOz);
    const newTotal = lbsInput * 16 + safeOz;
    setWeightOz(Math.round(newTotal * 10) / 10);
    setErrorMsg(null);
  };

  const handleApplyPreset = (presetOz: number) => {
    handleTotalOzChange(presetOz);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (weightOz <= 0) {
      setErrorMsg('Weight must be greater than 0 oz to generate a shipping label.');
      return;
    }
    setSaving(true);
    try {
      await onSaveWeight(order.id, weightOz);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to update weight.');
    } finally {
      setSaving(false);
    }
  };

  const calculatedLbs = Math.floor(weightOz / 16);
  const calculatedRemainingOz = Math.round((weightOz % 16) * 10) / 10;
  const decimalLbs = (weightOz / 16).toFixed(2);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-xl shadow-xl max-w-lg w-full p-6 text-slate-800 relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center space-x-2 text-rose-600">
            <Scale className="w-5 h-5" />
            <h3 className="text-lg font-bold text-slate-900">
              Update Package Weight - #{formatOrderId(order.orderNumber)}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {/* Issue Notice */}
          <div className="bg-rose-50 border border-rose-200 rounded-lg p-3.5 text-xs text-rose-900">
            <div className="font-bold text-rose-800 mb-1 flex items-center space-x-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Weight Correction Required</span>
            </div>
            <p>
              This order currently has a recorded weight of <strong>{order.weightOz} oz</strong>. Shipping carriers and rate calculators require a valid weight greater than 0 oz.
            </p>
          </div>

          {/* Recipient & Order Brief */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-600 flex justify-between items-center">
            <div>
              <div className="font-semibold text-slate-800">{order.recipientName}</div>
              <div className="text-slate-500">
                {order.city}, {order.state} {order.zip} &bull; {order.marketplace || 'Etsy'}
              </div>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-bold text-slate-700 bg-white border border-slate-200 px-2 py-1 rounded">
                Box: {order.boxName || 'Standard'}
              </span>
            </div>
          </div>

          {/* Items Summary */}
          {order.items && order.items.length > 0 && (
            <div className="border border-slate-200 rounded-lg p-2.5 bg-slate-50/50">
              <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center space-x-1">
                <Package className="w-3.5 h-3.5 text-slate-400" />
                <span>Package Contents ({order.items.length} item{order.items.length > 1 ? 's' : ''}):</span>
              </div>
              <div className="max-h-24 overflow-y-auto space-y-1 text-xs">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-slate-700">
                    <span className="truncate max-w-[280px]">
                      {item.quantity}x {item.name}
                    </span>
                    <span className="font-mono text-slate-500 text-[11px]">
                      {item.weightOz ? `${item.weightOz * item.quantity} oz` : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pounds (lbs)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={lbsInput}
                  onChange={(e) => handleLbsChange(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ounces (oz)
                </label>
                <input
                  type="number"
                  min="0"
                  max="15.9"
                  step="0.1"
                  value={ozInput}
                  onChange={(e) => handleOzChange(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Total Weight Live Display */}
            <div className="bg-indigo-50/70 border border-indigo-100 rounded-lg p-3 flex items-center justify-between">
              <div>
                <span className="text-xs text-indigo-700 font-semibold block">Total Package Weight:</span>
                <span className="text-base font-bold text-indigo-950 font-mono">
                  {weightOz} oz <span className="text-xs font-normal text-indigo-600">({calculatedLbs} lb {calculatedRemainingOz} oz &bull; {decimalLbs} lbs)</span>
                </span>
              </div>
              <div className="w-24">
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={weightOz}
                  onChange={(e) => handleTotalOzChange(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white border border-indigo-300 rounded px-2 py-1 text-xs font-mono font-bold text-right text-indigo-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  title="Direct total weight in ounces"
                />
                <span className="text-[10px] text-indigo-400 block text-right">direct oz</span>
              </div>
            </div>

            {/* Quick Weight Presets */}
            <div>
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1.5">
                Quick Presets:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: '4 oz (Pouch)', oz: 4 },
                  { label: '8 oz (Small)', oz: 8 },
                  { label: '12 oz (Medium)', oz: 12 },
                  { label: '16 oz (1 lb)', oz: 16 },
                  { label: '24 oz (1.5 lb)', oz: 24 },
                  { label: '32 oz (2 lb)', oz: 32 },
                  { label: '48 oz (3 lb)', oz: 48 },
                  { label: '64 oz (4 lb)', oz: 64 },
                ].map((p) => (
                  <button
                    key={p.oz}
                    type="button"
                    onClick={() => handleApplyPreset(p.oz)}
                    className={`text-xs px-2.5 py-1 rounded-md border font-medium transition-colors cursor-pointer ${
                      weightOz === p.oz
                        ? 'bg-indigo-600 text-white border-indigo-600 font-bold'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {errorMsg && (
              <div className="text-xs text-rose-600 font-semibold bg-rose-50 p-2 rounded border border-rose-200">
                {errorMsg}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || weightOz <= 0}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors flex items-center space-x-1.5 cursor-pointer shadow-sm"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'Saving...' : 'Save & Update Weight'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
