import React, { useState } from 'react';
import { PackageType } from '../types';
import { PlusCircle, X, Box, User, MapPin, Truck, AlertCircle, Sparkles, ClipboardPaste, CheckCheck, RotateCcw } from 'lucide-react';
import { parseAddressText } from '../lib/addressParser';

interface ManualOrderModalProps {
  packages: PackageType[];
  onClose: () => void;
  onCreateOrder: (orderData: any) => Promise<void>;
}

export const ManualOrderModal: React.FC<ManualOrderModalProps> = ({ packages, onClose, onCreateOrder }) => {
  const [pasteAddressText, setPasteAddressText] = useState('');
  const [parseStatus, setParseStatus] = useState<{ type: 'success' | 'info' | 'error'; message: string } | null>(null);

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

  const handleParseAddress = (rawTextToParse?: string) => {
    const textToProcess = rawTextToParse !== undefined ? rawTextToParse : pasteAddressText;
    if (!textToProcess.trim()) {
      setParseStatus({ type: 'error', message: 'Please paste or type an address into the box first.' });
      return;
    }

    const parsed = parseAddressText(textToProcess);
    const populatedFields: string[] = [];

    if (parsed.recipientName) {
      setRecipientName(parsed.recipientName);
      populatedFields.push('Recipient Name');
    }
    if (parsed.company) {
      setCompany(parsed.company);
      populatedFields.push('Company');
    }
    if (parsed.street1) {
      setStreet1(parsed.street1);
      populatedFields.push('Street 1');
    }
    if (parsed.street2) {
      setStreet2(parsed.street2);
      populatedFields.push('Street 2');
    }
    if (parsed.city) {
      setCity(parsed.city);
      populatedFields.push('City');
    }
    if (parsed.state) {
      setState(parsed.state);
      populatedFields.push('State');
    }
    if (parsed.zip) {
      setZip(parsed.zip);
      populatedFields.push('ZIP');
    }
    if (parsed.country) {
      setCountry(parsed.country);
      if (parsed.country !== 'US') populatedFields.push(`Country (${parsed.country})`);
    }
    if (parsed.phone) {
      setPhone(parsed.phone);
      populatedFields.push('Phone');
    }
    if (parsed.email) {
      setEmail(parsed.email);
      populatedFields.push('Email');
    }
    if (parsed.orderNumber) {
      setOrderNumber(parsed.orderNumber);
      populatedFields.push('Order #');
    }

    if (populatedFields.length > 0) {
      setParseStatus({
        type: 'success',
        message: `Successfully parsed & populated ${populatedFields.length} field(s): ${populatedFields.join(', ')}.`,
      });
      setError(null);
    } else {
      setParseStatus({
        type: 'info',
        message: 'Could not detect structured address parts. Please check format or fill fields manually.',
      });
    }
  };

  const handlePasteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setPasteAddressText(val);
    if (val.trim().length > 10) {
      // Auto-parse on paste/type when substantial text is present
      handleParseAddress(val);
    } else if (!val.trim()) {
      setParseStatus(null);
    }
  };

  const handleClearPaste = () => {
    setPasteAddressText('');
    setParseStatus(null);
  };

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
      <div className="bg-white border border-slate-200 rounded-xl shadow-xl max-w-xl w-full max-h-[92vh] flex flex-col text-slate-800 relative">
        {/* Header */}
        <div className="flex items-center justify-between p-5 pb-4 border-b border-slate-200 shrink-0">
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

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          <p className="text-xs text-slate-500">
            Create an ad-hoc shipping order and generate postage labels through EasyPost.
          </p>

          {/* Quick Cut & Paste Address Box */}
          <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs font-bold text-indigo-900">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Paste & Auto-Parse Address from Email</span>
              </div>
              <div className="flex items-center space-x-2">
                {pasteAddressText && (
                  <button
                    type="button"
                    onClick={handleClearPaste}
                    className="text-[11px] font-medium text-slate-500 hover:text-slate-700 flex items-center space-x-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Clear</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleParseAddress()}
                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-semibold flex items-center space-x-1.5 shadow-xs cursor-pointer transition-colors"
                >
                  <ClipboardPaste className="w-3.5 h-3.5" />
                  <span>Parse & Fill Fields</span>
                </button>
              </div>
            </div>

            <textarea
              rows={3}
              value={pasteAddressText}
              onChange={handlePasteChange}
              placeholder={`Paste unformatted address from email here, e.g.:\nJane Doe\nAcme Corp\n123 Main St, Suite 400\nSeattle, WA 98101\n555-123-4567`}
              className="w-full bg-white border border-indigo-200 rounded-lg p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono leading-relaxed"
            />

            {parseStatus && (
              <div
                className={`text-xs px-3 py-1.5 rounded-lg flex items-center space-x-1.5 ${
                  parseStatus.type === 'success'
                    ? 'bg-emerald-100/80 text-emerald-900 border border-emerald-200'
                    : parseStatus.type === 'error'
                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                    : 'bg-indigo-100 text-indigo-900 border border-indigo-200'
                }`}
              >
                {parseStatus.type === 'success' ? (
                  <CheckCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span className="font-medium text-[11px]">{parseStatus.message}</span>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 px-3 py-2 rounded-lg text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form id="manualOrderForm" onSubmit={handleSubmit} className="space-y-3.5">
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
                <div>
                  <input
                    type="text"
                    placeholder="Recipient Full Name *"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium"
                    required
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Company Name (Optional)"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
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
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium"
                  required
                />
                <input
                  type="text"
                  placeholder="Street Address Line 2 (Apt, Suite, Unit, Bldg)"
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none col-span-1 font-medium"
                    required
                  />
                  <input
                    type="text"
                    placeholder="State * (e.g. WA)"
                    value={state}
                    onChange={(e) => setState(e.target.value.toUpperCase())}
                    maxLength={4}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 uppercase focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none col-span-1 font-medium"
                    required
                  />
                  <input
                    type="text"
                    placeholder="ZIP Code *"
                    value={zip}
                    onChange={(e) => setZip(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none col-span-1 font-medium"
                    required
                  />
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value.toUpperCase())}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-xs text-slate-800 font-semibold focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer col-span-1"
                  >
                    <option value="US">United States (US)</option>
                    <option value="CA">Canada (CA)</option>
                    <option value="GB">United Kingdom (GB)</option>
                    <option value="AU">Australia (AU)</option>
                    <option value="MX">Mexico (MX)</option>
                    <option value="DE">Germany (DE)</option>
                    <option value="FR">France (FR)</option>
                    <option value="JP">Japan (JP)</option>
                  </select>
                </div>

                {country !== 'US' && country !== 'USA' && (
                  <div className="bg-blue-50 border border-blue-200 text-blue-900 rounded-lg p-2.5 text-xs flex items-center space-x-2">
                    <Truck className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>
                      <strong>USPS International Label Required:</strong> Destination is outside the US. Order will be automatically routed with <strong>USPS Priority Mail International</strong> and customs documentation.
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
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-4 border-t border-slate-200 bg-slate-50/50 rounded-b-xl shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="manualOrderForm"
            disabled={loading}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg shadow-sm flex items-center space-x-1.5 cursor-pointer disabled:opacity-50 transition-colors"
          >
            <Truck className="w-4 h-4" />
            <span>{loading ? 'Validating & Adding...' : 'Add Order & Validate Address'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

