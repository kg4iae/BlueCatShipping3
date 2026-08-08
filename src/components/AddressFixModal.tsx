import React, { useState } from 'react';
import { ShippingOrder } from '../types';
import { AlertTriangle, CheckCircle2, Save, X, MapPin, Sparkles } from 'lucide-react';

interface AddressFixModalProps {
  order: ShippingOrder;
  onClose: () => void;
  onSaveAddress: (orderId: string, updatedAddress: Partial<ShippingOrder>) => Promise<void>;
}

export const AddressFixModal: React.FC<AddressFixModalProps> = ({ order, onClose, onSaveAddress }) => {
  const [street1, setStreet1] = useState(order.street1);
  const [street2, setStreet2] = useState(order.street2 || '');
  const [city, setCity] = useState(order.city);
  const [state, setState] = useState(order.state);
  const [zip, setZip] = useState(order.zip);
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSaveAddress(order.id, {
      street1,
      street2,
      city,
      state,
      zip,
    });
    setSaving(false);
    onClose();
  };

  const applySuggestedZip = () => {
    if (order.zip === '00000') {
      setZip('48209'); // Suggested valid Detroit ZIP
    } else if (zip.length === 5) {
      setZip(`${zip}-1024`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-xl shadow-xl max-w-lg w-full p-6 text-slate-800 relative">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center space-x-2 text-amber-600">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="text-lg font-bold text-slate-900">Review Address Error - #{order.orderNumber}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {/* EasyPost Error Alert Box */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3.5 text-xs text-amber-900">
            <div className="font-bold text-amber-800 mb-1 flex items-center space-x-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>EasyPost Address Verification Issue:</span>
            </div>
            {order.validationErrors && order.validationErrors.length > 0 ? (
              <ul className="list-disc list-inside space-y-0.5 text-amber-950 font-medium">
                {order.validationErrors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            ) : (
              <p>Address could not be verified by USPS DPV database. Please inspect and correct street address and ZIP code.</p>
            )}
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-600">
            <div className="font-semibold text-slate-700 mb-1">Recipient Info:</div>
            <div>
              <strong className="text-slate-900">{order.recipientName}</strong>
              {order.company && <span> ({order.company})</span>}
            </div>
            <div>Email: {order.email || 'N/A'} | Phone: {order.phone || 'N/A'}</div>
          </div>

          {/* Edit Address Form */}
          <form onSubmit={handleSave} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Street Address Line 1</label>
              <input
                type="text"
                value={street1}
                onChange={(e) => setStreet1(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Street Address Line 2 (Apt / Ste)</label>
              <input
                type="text"
                value={street2}
                onChange={(e) => setStreet2(e.target.value)}
                placeholder="Apt, Suite, Unit, Bldg..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">State</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value.toUpperCase())}
                  maxLength={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none uppercase"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">ZIP Code</label>
                <div className="relative">
                  <input
                    type="text"
                    value={zip}
                    onChange={(e) => setZip(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    required
                  />
                </div>
              </div>
            </div>

            {order.zip === '00000' && (
              <button
                type="button"
                onClick={applySuggestedZip}
                className="text-xs text-indigo-600 hover:underline flex items-center space-x-1 cursor-pointer font-semibold"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Auto-Fix ZIP Code to valid area code (48209)</span>
              </button>
            )}

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg shadow-sm flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Re-validating...' : 'Save & Re-Validate Address'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
