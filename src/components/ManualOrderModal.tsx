import React, { useState } from 'react';
import { PackageType } from '../types';
import { PlusCircle, X, Box, User, MapPin, Truck, AlertCircle } from 'lucide-react';

interface ManualOrderModalProps {
  packages: PackageType[];
  onClose: () => void;
  onCreateOrder: (orderData: any) => Promise<void>;
}

export const ManualOrderModal: React.FC<ManualOrderModalProps> = ({ packages, onClose, onCreateOrder }) => {
  const [recipientName, setRecipientName] = useState('');
  const [company, setCompany] = useState('');
  const [street1, setStreet1] = useState('');
  const [street2, setStreet2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [country, setCountry] = useState('US');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [orderNumber, setOrderNumber] = useState(`ORD-${Math.floor(1000 + Math.random() * 9000)}`);
  const [boxId, setBoxId] = useState(packages[0]?.id || 'pkg_medium');
  const [weightOz, setWeightOz] = useState('16');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!recipientName.trim() || !street1.trim() || !city.trim() || !state.trim() || !zip.trim()) {
      setError('Please fill out Recipient Name, Street Address, City, State, and ZIP.');
      return;
    }

    setLoading(true);
    try {
      await onCreateOrder({
        recipientName,
        company,
        street1,
        street2,
        city,
        state,
        zip,
        country,
        phone,
        email,
        orderNumber,
        boxId,
        weightOz: parseFloat(weightOz) || 16,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create manual order.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-xl shadow-xl max-w-lg w-full p-6 text-slate-800 relative">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center space-x-2 text-indigo-600">
            <PlusCircle className="w-5 h-5" />
            <h3 className="text-lg font-bold text-slate-900">Create Manual Shipping Order</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-500 mt-2">
          Note: Product information is optional for manual shipments. Only name, address, and package box selection are required.
        </p>

        {error && (
          <div className="mt-3 bg-rose-50 border border-rose-200 text-rose-800 px-3 py-2 rounded-lg text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          {/* Order Ref & Box Selection */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Order # Reference</label>
              <input
                type="text"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Select Package / Box</label>
              <select
                value={boxId}
                onChange={(e) => setBoxId(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
              >
                {packages.map((pkg) => (
                  <option key={pkg.id} value={pkg.id}>
                    {pkg.name} ({pkg.length}"x{pkg.width}"x{pkg.height}")
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Recipient Details */}
          <div>
            <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-700 mb-1.5">
              <User className="w-3.5 h-3.5 text-indigo-600" />
              <span>Recipient Information</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Recipient Full Name *"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                required
              />
              <input
                type="text"
                placeholder="Company Name (Optional)"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Address Details */}
          <div>
            <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-700 mb-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span>Delivery Address</span>
            </div>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Street Address Line 1 *"
                value={street1}
                onChange={(e) => setStreet1(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                required
              />
              <input
                type="text"
                placeholder="Street Address Line 2 (Apt, Suite, Unit)"
                value={street2}
                onChange={(e) => setStreet2(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <div className="grid grid-cols-4 gap-2">
                <input
                  type="text"
                  placeholder="City *"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none col-span-1"
                  required
                />
                <input
                  type="text"
                  placeholder="State * (CA)"
                  value={state}
                  onChange={(e) => setState(e.target.value.toUpperCase())}
                  maxLength={4}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 uppercase focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none col-span-1"
                  required
                />
                <input
                  type="text"
                  placeholder="ZIP Code *"
                  value={zip}
                  onChange={(e) => setZip(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none col-span-1"
                  required
                />
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value.toUpperCase())}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-xs text-slate-800 font-semibold focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer col-span-1"
                >
                  <option value="US">🇺🇸 US</option>
                  <option value="CA">🇨🇦 CA (Canada)</option>
                  <option value="GB">🇬🇧 GB (UK)</option>
                  <option value="AU">🇦🇺 AU (Australia)</option>
                  <option value="MX">🇲🇽 MX (Mexico)</option>
                  <option value="DE">🇩🇪 DE (Germany)</option>
                  <option value="FR">🇫🇷 FR (France)</option>
                  <option value="JP">🇯🇵 JP (Japan)</option>
                </select>
              </div>

              {country !== 'US' && country !== 'USA' && (
                <div className="bg-blue-50 border border-blue-200 text-blue-900 rounded-lg p-2.5 text-xs flex items-center space-x-2">
                  <Truck className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>
                    <strong>USPS International Label Required:</strong> Destination is outside the US. Order will be automatically routed with <strong>USPS Priority Mail International</strong> and CN22 customs forms.
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Contact & Weight */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Weight (oz)</label>
              <input
                type="number"
                value={weightOz}
                onChange={(e) => setWeightOz(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Phone (Optional)</label>
              <input
                type="text"
                placeholder="555-0100"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Email (Optional)</label>
              <input
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

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
              disabled={loading}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg shadow-sm flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              <Truck className="w-4 h-4" />
              <span>{loading ? 'Validating & Adding...' : 'Add Order & Validate Address'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
