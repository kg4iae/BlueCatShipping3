import React, { useState } from 'react';
import { ShippingOrder, PackageType, CarrierType, AppSetting } from '../types';
import { getCountryFlag } from './Dashboard';
import { getCalculatedRatesForOrder } from './CompareRatesModal';
import {
  X,
  Package,
  MapPin,
  Truck,
  Weight,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  ShoppingBag,
  Info,
  Calendar,
  ExternalLink,
  ShieldCheck,
  Building,
  Phone,
  Mail,
  Save,
  ChevronRight,
  Scale,
  Tag,
  Download,
} from 'lucide-react';

interface OrderDetailModalProps {
  order: ShippingOrder;
  packages: PackageType[];
  settings?: AppSetting;
  onClose: () => void;
  onSaveOrder: (orderId: string, updates: Partial<ShippingOrder>) => Promise<void>;
  onOpenCompareRatesModal?: (order: ShippingOrder) => void;
  onPurchaseLabel?: (orderId: string, carrier?: CarrierType, serviceLevel?: string, rateCost?: number) => Promise<void>;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  order,
  packages,
  settings,
  onClose,
  onSaveOrder,
  onOpenCompareRatesModal,
  onPurchaseLabel,
}) => {
  // Address Form States
  const [recipientName, setRecipientName] = useState(order.recipientName || '');
  const [company, setCompany] = useState(order.company || '');
  const [street1, setStreet1] = useState(order.street1 || '');
  const [street2, setStreet2] = useState(order.street2 || '');
  const [city, setCity] = useState(order.city || '');
  const [state, setState] = useState(order.state || '');
  const [zip, setZip] = useState(order.zip || '');
  const [country, setCountry] = useState(order.country || 'US');
  const [phone, setPhone] = useState(order.phone || '');
  const [email, setEmail] = useState(order.email || '');

  // Package & Weight States
  const [boxId, setBoxId] = useState(order.boxId || (packages[0]?.id || ''));
  const [weightOz, setWeightOz] = useState<number>(order.weightOz || 16);

  // Carrier & Service States
  const rawCountry = (country || 'US').trim().toUpperCase();
  const isInternational =
    rawCountry !== 'US' &&
    rawCountry !== 'USA' &&
    rawCountry !== 'UNITED STATES' &&
    rawCountry !== 'UNITED STATES OF AMERICA';

  const defaultCarrierSetting = settings?.defaultDomesticCarrier || 'USPS';
  const defaultServiceSetting = settings?.defaultDomesticService || 'Priority';

  const [carrier, setCarrier] = useState<CarrierType>(
    order.carrier || (isInternational ? 'UPS' : defaultCarrierSetting)
  );
  const [serviceLevel, setServiceLevel] = useState<string>(
    order.serviceLevel || (isInternational ? 'UPS Worldwide Expedited' : defaultServiceSetting)
  );
  const [shippingCost, setShippingCost] = useState<number>(order.shippingCost || 7.85);

  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'address' | 'package' | 'carrier'>('details');

  const selectedBox = packages.find((p) => p.id === boxId);
  const countryFlag = getCountryFlag(country);

  // Live calculated rate preview
  const calculatedRates = getCalculatedRatesForOrder(
    {
      ...order,
      street1,
      city,
      state,
      zip,
      country,
      weightOz,
      boxId,
    },
    settings?.defaultDomesticCarrier,
    settings?.defaultDomesticService
  );

  const handleCarrierChange = (newCarrier: CarrierType) => {
    setCarrier(newCarrier);
    if (!isInternational && newCarrier === defaultCarrierSetting) {
      setServiceLevel(defaultServiceSetting);
      const match = calculatedRates.find((r) => r.carrier === newCarrier && r.isRecommended);
      if (match) setShippingCost(match.rate);
      return;
    }
    if (newCarrier === 'USPS') {
      const defaultService = isInternational ? 'Priority Mail International' : 'Priority Mail 2-Day';
      setServiceLevel(defaultService);
      const match = calculatedRates.find((r) => r.carrier === 'USPS');
      if (match) setShippingCost(match.rate);
    } else if (newCarrier === 'UPS') {
      const defaultService = isInternational ? 'UPS Worldwide Expedited' : 'UPS Ground';
      setServiceLevel(defaultService);
      const match = calculatedRates.find((r) => r.carrier === 'UPS');
      if (match) setShippingCost(match.rate);
    } else if (newCarrier === 'FedEx') {
      const defaultService = 'FedEx Ground';
      setServiceLevel(defaultService);
      const match = calculatedRates.find((r) => r.carrier === 'FedEx');
      if (match) setShippingCost(match.rate);
    }
  };

  const handleServiceChange = (newService: string) => {
    setServiceLevel(newService);
    const match = calculatedRates.find((r) => r.carrier === carrier && r.serviceLevel === newService);
    if (match) {
      setShippingCost(match.rate);
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);

    const updates: Partial<ShippingOrder> = {
      recipientName,
      company,
      street1,
      street2,
      city,
      state: state.toUpperCase(),
      zip,
      country: country.toUpperCase(),
      phone,
      email,
      boxId,
      boxName: selectedBox?.name || order.boxName,
      weightOz,
      carrier,
      serviceLevel,
      shippingCost,
    };

    await onSaveOrder(order.id, updates);
    setSaving(false);
    onClose();
  };

  const handlePurchase = async () => {
    if (!onPurchaseLabel) return;
    setSaving(true);
    await onPurchaseLabel(order.id, carrier, serviceLevel, shippingCost);
    setSaving(false);
    onClose();
  };

  // Convert weight Oz to Lbs & Oz display
  const lbs = Math.floor(weightOz / 16);
  const remainingOz = Math.round((weightOz % 16) * 10) / 10;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full p-5 sm:p-6 space-y-5 relative my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start space-x-3 border-b border-slate-100 pb-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-sm">
            <Package className="w-6 h-6" />
          </div>

          <div>
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <h2 className="text-xl font-extrabold text-slate-900">Order #{order.orderNumber}</h2>

              {order.status === 'ready_to_ship' && (
                <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Ready to Ship</span>
                </span>
              )}

              {order.status === 'address_error' && (
                <span className="bg-rose-100 text-rose-800 border border-rose-300 px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center space-x-1">
                  <AlertTriangle className="w-3 h-3 text-rose-600" />
                  <span>Address Action Needed</span>
                </span>
              )}

              {order.status === 'shipped' && (
                <span className="bg-indigo-100 text-indigo-800 border border-indigo-300 px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center space-x-1">
                  <Truck className="w-3 h-3 text-indigo-600" />
                  <span>Shipped</span>
                </span>
              )}

              {order.isReshipment && (
                <span className="bg-amber-100 text-amber-800 border border-amber-300 px-2.5 py-0.5 rounded-full text-xs font-bold">
                  Re-Shipment
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500 mt-1 flex items-center space-x-2">
              <span>Order Date: {new Date(order.orderDate).toLocaleDateString()}</span>
              <span>&bull;</span>
              <span>Declared Value: ${order.declaredValue.toFixed(2)}</span>
            </p>
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex border-b border-slate-200 overflow-x-auto space-x-1">
          <button
            onClick={() => setActiveTab('details')}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center space-x-1.5 ${
              activeTab === 'details'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Order Summary &amp; Items</span>
          </button>

          <button
            onClick={() => setActiveTab('address')}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center space-x-1.5 ${
              activeTab === 'address'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Shipping Address</span>
          </button>

          <button
            onClick={() => setActiveTab('package')}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center space-x-1.5 ${
              activeTab === 'package'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Weight className="w-3.5 h-3.5" />
            <span>Box Type &amp; Weight</span>
          </button>

          <button
            onClick={() => setActiveTab('carrier')}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center space-x-1.5 ${
              activeTab === 'carrier'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Carrier &amp; Shipping Rates</span>
          </button>
        </div>

        {/* TAB 1: ORDER DETAILS & ITEMS */}
        {activeTab === 'details' && (
          <div className="space-y-4">
            {((order.validationErrors && order.validationErrors.length > 0) || weightOz <= 0) && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 text-xs text-rose-900 space-y-1">
                <div className="font-bold flex items-center space-x-1.5 text-rose-700">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Order Issue Flagged — Requires Attention:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-rose-800 text-[11px] font-medium pl-1">
                  {weightOz <= 0 && <li>Total Weight is currently set to 0 oz — Please update to a valid weight.</li>}
                  {order.validationErrors?.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center space-x-1.5">
                <ShoppingBag className="w-4 h-4 text-indigo-600" />
                <span>Line Items in Order #{order.orderNumber}</span>
              </h3>

              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">SKU</th>
                      <th className="py-2.5 px-3">Item Description</th>
                      <th className="py-2.5 px-3 text-center">Qty</th>
                      <th className="py-2.5 px-3 text-right">Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {order.items.map((item, index) => (
                      <tr key={item.id || item.sku || `item-${index}`}>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{item.sku}</td>
                        <td className="py-2.5 px-3 font-medium">
                          <div className="text-slate-900 font-semibold">{item.name || (item as any).description || 'Item'}</div>
                          {(item.itemType || item.color) && (
                            <div className="text-[10px] text-slate-500 font-normal space-x-2 mt-0.5">
                              {item.itemType && (
                                <span className="bg-slate-100 border border-slate-200 text-slate-700 px-1.5 py-0.2 rounded">
                                  Type: <strong className="text-slate-900">{item.itemType}</strong>
                                </span>
                              )}
                              {item.color && (
                                <span className="bg-slate-100 border border-slate-200 text-slate-700 px-1.5 py-0.2 rounded">
                                  Color: <strong className="text-slate-900">{item.color}</strong>
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold">{item.quantity}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                          ${((item.price || (item as any).unitPrice || 0) * item.quantity).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Current Shipping Configuration Quick Card */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-3.5">
                <div className="text-[10px] font-bold uppercase text-indigo-600 tracking-wider">
                  Destination
                </div>
                <div className="font-extrabold text-sm text-slate-900 mt-0.5">{recipientName}</div>
                <div className="text-xs text-slate-600 truncate">{city}, {state} {zip}</div>
                {countryFlag && (
                  <div className="text-[10px] font-bold text-indigo-900 mt-1 flex items-center space-x-1">
                    <span>{countryFlag.flag}</span>
                    <span>{country}</span>
                  </div>
                )}
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                <div className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                  Assigned Packaging
                </div>
                <div className="font-extrabold text-sm text-slate-900 mt-0.5">
                  {selectedBox?.name || order.boxName}
                </div>
                <div className="text-xs text-slate-600 mt-0.5">
                  Weight: {weightOz} oz ({lbs} lb {remainingOz} oz)
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                <div className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                  Carrier &amp; Service
                </div>
                <div className="font-extrabold text-sm text-slate-900 mt-0.5">
                  {carrier} {serviceLevel}
                </div>
                <div className="text-xs font-bold text-emerald-700 mt-0.5">
                  Cost: ${shippingCost.toFixed(2)}
                </div>
              </div>
            </div>

            {order.trackingNumber && (
              <div className="bg-indigo-900 text-white rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase font-extrabold tracking-widest text-indigo-300">
                    Active Tracking Number
                  </div>
                  <div className="text-base font-mono font-bold tracking-wider mt-0.5">
                    {order.trackingNumber}
                  </div>
                </div>
                <span className="bg-indigo-800 text-indigo-100 text-xs font-bold px-3 py-1.5 rounded-lg border border-indigo-700">
                  {order.carrier} Shipped
                </span>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ADDRESS EDITING */}
        {activeTab === 'address' && (
          <div className="space-y-4">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                <MapPin className="w-4 h-4 text-indigo-600" />
                <span>Recipient Shipping Address</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Company / Attn</label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Street Address Line 1 *</label>
                  <input
                    type="text"
                    value={street1}
                    onChange={(e) => setStreet1(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Street Address Line 2</label>
                  <input
                    type="text"
                    value={street2}
                    onChange={(e) => setStreet2(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">City *</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">State *</label>
                    <input
                      type="text"
                      value={state}
                      onChange={(e) => setState(e.target.value.toUpperCase())}
                      maxLength={4}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2 py-2 text-slate-900 uppercase font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">ZIP *</label>
                    <input
                      type="text"
                      value={zip}
                      onChange={(e) => setZip(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2 py-2 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Country *</label>
                    <input
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value.toUpperCase())}
                      maxLength={3}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2 py-2 text-slate-900 font-extrabold uppercase focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: BOX TYPE & WEIGHT EDITING */}
        {activeTab === 'package' && (
          <div className="space-y-4">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                <Package className="w-4 h-4 text-indigo-600" />
                <span>Box Type &amp; Package Weight Configuration</span>
              </h3>

              {/* Box Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Select Packaging Box Type *
                </label>
                <select
                  value={boxId}
                  onChange={(e) => setBoxId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                >
                  {packages.map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.name} — Inner ({pkg.innerLength}" x {pkg.innerWidth}" x {pkg.innerHeight}") | Max {pkg.maxWeightOz / 16} lbs
                    </option>
                  ))}
                </select>

                {selectedBox && (
                  <div className="mt-3 bg-white border border-slate-200 rounded-lg p-3 text-xs flex justify-between items-center">
                    <div>
                      <div className="font-bold text-slate-900">{selectedBox.name}</div>
                      <div className="text-slate-500 text-[11px] mt-0.5">
                        Outer Dim: {selectedBox.outerLength}" x {selectedBox.outerWidth}" x {selectedBox.outerHeight}"
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-1 rounded text-[11px] font-bold">
                        Max Capacity: {selectedBox.maxWeightOz} oz
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Package Weight */}
              <div className="pt-2 border-t border-slate-200">
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center space-x-1">
                    <Scale className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Package Weight (in Ounces) *</span>
                  </span>
                  <span className="text-indigo-600 font-extrabold text-xs">
                    = {lbs} lbs {remainingOz} oz ({(weightOz / 16).toFixed(2)} lbs)
                  </span>
                </label>

                <div className="flex items-center space-x-3">
                  <input
                    type="number"
                    min={1}
                    max={1120}
                    step={1}
                    value={weightOz}
                    onChange={(e) => setWeightOz(Math.max(1, Number(e.target.value) || 1))}
                    className="w-32 bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-black text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    required
                  />

                  {/* Weight Quick Preset Buttons */}
                  <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                    <button
                      type="button"
                      onClick={() => setWeightOz(8)}
                      className="px-2.5 py-1.5 bg-white border border-slate-200 hover:border-indigo-400 rounded-lg text-xs font-bold text-slate-700 cursor-pointer"
                    >
                      8 oz
                    </button>
                    <button
                      type="button"
                      onClick={() => setWeightOz(16)}
                      className="px-2.5 py-1.5 bg-white border border-slate-200 hover:border-indigo-400 rounded-lg text-xs font-bold text-slate-700 cursor-pointer"
                    >
                      1 lb (16 oz)
                    </button>
                    <button
                      type="button"
                      onClick={() => setWeightOz(32)}
                      className="px-2.5 py-1.5 bg-white border border-slate-200 hover:border-indigo-400 rounded-lg text-xs font-bold text-slate-700 cursor-pointer"
                    >
                      2 lbs (32 oz)
                    </button>
                    <button
                      type="button"
                      onClick={() => setWeightOz(80)}
                      className="px-2.5 py-1.5 bg-white border border-slate-200 hover:border-indigo-400 rounded-lg text-xs font-bold text-slate-700 cursor-pointer"
                    >
                      5 lbs (80 oz)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: CARRIER & SHIPPING RATES */}
        {activeTab === 'carrier' && (
          <div className="space-y-4">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                  <Truck className="w-4 h-4 text-indigo-600" />
                  <span>Carrier &amp; Postage Rate Selection</span>
                </h3>

                {onOpenCompareRatesModal && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenCompareRatesModal({
                        ...order,
                        street1,
                        city,
                        state,
                        zip,
                        country,
                        weightOz,
                        boxId,
                      });
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow-sm flex items-center space-x-1 cursor-pointer transition-colors"
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>Compare Live Rates Modal</span>
                  </button>
                )}
              </div>

              {/* Policy Banner */}
              {!isInternational ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-900 flex items-center space-x-2">
                  <Info className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>
                    <strong>Domestic Order Default:</strong> Configured to default to <strong>{settings?.defaultDomesticCarrier || 'USPS'}</strong> ({settings?.defaultDomesticService || 'Priority'}). You can override the carrier below.
                  </span>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900 flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    <strong>International Order:</strong> Choose between <strong>USPS</strong> and <strong>UPS</strong> based on rates and customs brokerage speed.
                  </span>
                </div>
              )}

              {/* Carrier Choice Toggle Buttons */}
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => handleCarrierChange('USPS')}
                  className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer ${
                    carrier === 'USPS'
                      ? 'bg-blue-50 border-blue-600 text-blue-900 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className="font-black text-sm flex items-center space-x-2">
                    <span className="bg-blue-900 text-white text-xs px-1.5 py-0.5 rounded">USPS</span>
                    <span>Postal</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Standard domestic priority &amp; ground
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleCarrierChange('UPS')}
                  className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer ${
                    carrier === 'UPS'
                      ? 'bg-amber-50 border-amber-600 text-amber-900 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className="font-black text-sm flex items-center space-x-2">
                    <span className="bg-amber-800 text-amber-200 text-xs px-1.5 py-0.5 rounded">UPS</span>
                    <span>UPS Ground &amp; Express</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Reliable ground &amp; international courier
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleCarrierChange('FedEx')}
                  className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer ${
                    carrier === 'FedEx'
                      ? 'bg-purple-50 border-purple-600 text-purple-900 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className="font-black text-sm flex items-center space-x-2">
                    <span className="bg-purple-900 text-white text-xs px-1.5 py-0.5 rounded">FedEx</span>
                    <span>FedEx Ground &amp; Express</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Fast commercial courier services
                  </div>
                </button>
              </div>

              {/* Service Level & Rate List */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Available Service Levels for {carrier}
                </label>
                <div className="space-y-2">
                  {calculatedRates
                    .filter((r) => r.carrier === carrier)
                    .map((r, idx) => {
                      const isSelected = serviceLevel === r.serviceLevel;
                      return (
                        <div
                          key={`${r.carrier}-${r.serviceLevel}-${idx}`}
                          onClick={() => {
                            if (!r.disabled) {
                              setServiceLevel(r.serviceLevel);
                              setShippingCost(r.rate);
                            }
                          }}
                          className={`p-3 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition-all ${
                            r.disabled
                              ? 'opacity-50 cursor-not-allowed bg-slate-100 border-slate-200'
                              : isSelected
                              ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-500/20 font-bold'
                              : 'bg-white border-slate-200 hover:border-indigo-300'
                          }`}
                        >
                          <div>
                            <div className="text-slate-900 font-bold">{r.serviceLevel}</div>
                            <div className="text-[11px] text-slate-500 mt-0.5">{r.deliveryDays} &bull; {r.notes}</div>
                          </div>

                          <div className="text-right">
                            <div className="text-sm font-black text-slate-900">${r.rate.toFixed(2)}</div>
                            <div className="text-[10px] text-slate-400">EST COST</div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Actions Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 flex-wrap gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center space-x-2">
            {(order.status === 'shipped' || order.labelUrl) && (
              <a
                href={`/api/orders/${order.id}/label.pdf`}
                download={`EasyPost_Label_${order.orderNumber}.pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-xs px-4 py-2.5 rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer"
                title="Download thermal label PDF stored in database"
              >
                <Download className="w-4 h-4 text-indigo-600" />
                <span>Download Label PDF</span>
              </a>
            )}

            {order.status !== 'shipped' && onPurchaseLabel && (
              <button
                onClick={handlePurchase}
                disabled={saving || order.status === 'address_error' || weightOz <= 0}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-lg shadow-sm flex items-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
                title="Purchase shipping label from EasyPost and save label PDF to database"
              >
                <Tag className="w-4 h-4" />
                <span>{saving ? 'Purchasing...' : 'Purchase Label (EasyPost)'}</span>
              </button>
            )}

            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-5 py-2.5 rounded-lg shadow-sm flex items-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
