import React, { useState } from 'react';
import { ShippingOrder, PackageType, AppSetting, formatOrderId } from '../types';
import { getCalculatedRatesForOrder } from './CompareRatesModal';
import {
  Package,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Truck,
  Printer,
  Sparkles,
  Search,
  Filter,
  CheckSquare,
  Square,
  Edit,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Info,
  Database,
  FileText,
  DollarSign,
  Tag,
  Download,
} from 'lucide-react';

export function getCountryFlag(country?: string): { flag: React.ReactNode; label: string; code: string } | null {
  if (!country) return null;
  const c = country.trim().toUpperCase();
  if (c === 'US' || c === 'USA' || c === 'UNITED STATES' || c === 'UNITED STATES OF AMERICA') return null;

  const codeMap: Record<string, string> = {
    'CA': 'ca', 'CANADA': 'ca',
    'MX': 'mx', 'MEXICO': 'mx',
    'GB': 'gb', 'UK': 'gb', 'GREAT BRITAIN': 'gb', 'UNITED KINGDOM': 'gb', 'ENG': 'gb', 'ENGLAND': 'gb', 'SCOTLAND': 'gb', 'WALES': 'gb',
    'DE': 'de', 'GERMANY': 'de',
    'FR': 'fr', 'FRANCE': 'fr',
    'AU': 'au', 'AUSTRALIA': 'au',
    'JP': 'jp', 'JAPAN': 'jp',
    'CN': 'cn', 'CHINA': 'cn',
    'BR': 'br', 'BRAZIL': 'br',
    'IT': 'it', 'ITALY': 'it',
    'ES': 'es', 'SPAIN': 'es',
    'NL': 'nl', 'NETHERLANDS': 'nl',
    'IN': 'in', 'INDIA': 'in',
    'KR': 'kr', 'SOUTH KOREA': 'kr',
    'PR': 'pr', 'PUERTO RICO': 'pr',
  };

  const isoCode = codeMap[c] || (c.length === 2 ? c.toLowerCase() : 'un');

  const flagNode = (
    <img
      src={`https://flagcdn.com/w40/${isoCode}.png`}
      srcSet={`https://flagcdn.com/w80/${isoCode}.png 2x`}
      alt={`${c} flag`}
      className="w-5 h-3.5 inline-block object-cover rounded-2xs border border-slate-200 shadow-2xs shrink-0"
      referrerPolicy="no-referrer"
    />
  );

  return { flag: flagNode, label: c, code: isoCode };
}

interface DashboardProps {
  orders: ShippingOrder[];
  packages: PackageType[];
  settings: AppSetting;
  onUpdateOrderBox: (orderId: string, boxId: string) => Promise<void>;
  onValidateAddresses: (orderIds?: string[]) => Promise<void>;
  onOpenAddressFixModal: (order: ShippingOrder) => void;
  onOpenCompareRatesModal?: (order: ShippingOrder) => void;
  onOpenOrderDetailModal?: (order: ShippingOrder) => void;
  onGenerateBatchLabels: (selectedOrderIds: string[]) => Promise<void>;
  onPurchaseLabel?: (orderId: string, carrier?: any, serviceLevel?: string, rateCost?: number) => Promise<void>;
  onRefreshData: () => Promise<void>;
  onSyncMssql?: (action?: 'pull' | 'push') => Promise<void>;
  onOpenScanFormModal?: () => void;
  loading: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({
  orders,
  packages,
  settings,
  onUpdateOrderBox,
  onValidateAddresses,
  onOpenAddressFixModal,
  onOpenCompareRatesModal,
  onOpenOrderDetailModal,
  onGenerateBatchLabels,
  onPurchaseLabel,
  onRefreshData,
  onSyncMssql,
  onOpenScanFormModal,
  loading,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [purchasingOrderId, setPurchasingOrderId] = useState<string | null>(null);

  const handleSinglePurchaseLabel = async (order: ShippingOrder) => {
    setPurchasingOrderId(order.id);
    try {
      if (onPurchaseLabel) {
        await onPurchaseLabel(order.id, order.carrier, order.serviceLevel, order.shippingCost);
      } else {
        await onGenerateBatchLabels([order.id]);
      }
    } finally {
      setPurchasingOrderId(null);
    }
  };

  const handleSyncMssql = async (action: 'pull' | 'push' = 'pull') => {
    if (!onSyncMssql) return;
    setIsSyncing(true);
    await onSyncMssql(action);
    setIsSyncing(false);
  };

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    if (order.status === 'shipped') return false; // Shipped orders moved to Search & History view

    if (statusFilter !== 'all' && order.status !== statusFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        order.orderNumber.toLowerCase().includes(q) ||
        order.recipientName.toLowerCase().includes(q) ||
        (order.company && order.company.toLowerCase().includes(q)) ||
        order.city.toLowerCase().includes(q) ||
        order.state.toLowerCase().includes(q) ||
        order.zip.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Selection toggle logic
  const toggleSelectOrder = (id: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectableOrders = filteredOrders;

  const toggleSelectAll = () => {
    if (selectedOrderIds.length === selectableOrders.length) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(selectableOrders.map((o) => o.id));
    }
  };

  const handleValidateClick = async () => {
    setIsValidating(true);
    await onValidateAddresses();
    setIsValidating(false);
  };

  const handleGenerateLabelsClick = async () => {
    if (selectedOrderIds.length === 0) return;
    setIsGenerating(true);
    await onGenerateBatchLabels(selectedOrderIds);
    setSelectedOrderIds([]);
    setIsGenerating(false);
  };

  // Status Counts
  const pendingCount = orders.filter((o) => o.status === 'pending_validation').length;
  const errorCount = orders.filter((o) => o.status === 'address_error').length;
  const readyCount = orders.filter((o) => o.status === 'ready_to_ship').length;

  return (
    <div className="space-y-6">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Orders in Queue</p>
            <h3 className="text-2xl font-bold text-slate-900">{orders.filter((o) => o.status !== 'shipped').length} Active</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Synced from MS SQL database</p>
          </div>
          <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Pending Address Check</p>
            <h3 className="text-2xl font-bold text-amber-600">{pendingCount}</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Awaiting EasyPost API verify</p>
          </div>
          <div className="w-10 h-10 bg-amber-50 border border-amber-100 rounded-lg flex items-center justify-center text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Validation Errors</p>
            <h3 className="text-2xl font-bold text-rose-600">{errorCount} Issues</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Requires address correction</p>
          </div>
          <div className="w-10 h-10 bg-rose-50 border border-rose-100 rounded-lg flex items-center justify-center text-rose-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Validated &amp; Ready</p>
            <h3 className="text-2xl font-bold text-emerald-600">{readyCount} Verified</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Ready for postage labels</p>
          </div>
          <div className="w-10 h-10 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Table Action Toolbar & Workspace */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Status Filter Tabs */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg border border-slate-200 overflow-x-auto">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === 'all' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Queue
            </button>

            <button
              onClick={() => setStatusFilter('pending_validation')}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center space-x-1.5 ${
                statusFilter === 'pending_validation' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Pending Check</span>
              {pendingCount > 0 && <span className="bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded-full text-[10px] font-bold">{pendingCount}</span>}
            </button>

            <button
              onClick={() => setStatusFilter('address_error')}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center space-x-1.5 ${
                statusFilter === 'address_error' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Address Errors</span>
              {errorCount > 0 && <span className="bg-rose-100 text-rose-800 px-1.5 py-0.2 rounded-full text-[10px] font-bold">{errorCount}</span>}
            </button>

            <button
              onClick={() => setStatusFilter('ready_to_ship')}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center space-x-1.5 ${
                statusFilter === 'ready_to_ship' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Ready to Ship</span>
              {readyCount > 0 && <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full text-[10px] font-bold">{readyCount}</span>}
            </button>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center space-x-2.5">
            <button
              onClick={handleValidateClick}
              disabled={isValidating || loading}
              className="flex items-center space-x-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 px-3.5 py-2 rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-50"
              title="Runs EasyPost Address Verification API across pending orders"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${isValidating ? 'animate-spin' : ''}`} />
              <span>{isValidating ? 'Validating...' : 'Validate Addresses'}</span>
            </button>

            {onOpenScanFormModal && (
              <button
                onClick={onOpenScanFormModal}
                className="flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer"
                title="Generate End-of-Day USPS Form 5630 SCAN Form via EasyPost"
              >
                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                <span>USPS SCAN Form</span>
              </button>
            )}

            <button
              onClick={handleGenerateLabelsClick}
              disabled={selectedOrderIds.length === 0 || isGenerating}
              className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              title="Bulk purchase EasyPost shipping labels for selected orders and open print view"
            >
              {isGenerating ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
              ) : (
                <Printer className="w-3.5 h-3.5" />
              )}
              <span>
                {isGenerating ? 'Purchasing Bulk Labels...' : `Bulk Purchase Labels (${selectedOrderIds.length})`}
              </span>
            </button>
          </div>
        </div>

        {/* Search Bar & Multiselect Counter */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by Order #, Recipient Name, Company, City, or ZIP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          <div className="text-xs text-slate-500 flex items-center space-x-2">
            <span>
              Showing <strong className="text-slate-800">{filteredOrders.length}</strong> records synced from MS SQL
            </span>
            {selectedOrderIds.length > 0 && (
              <span className="bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded text-[11px]">
                {selectedOrderIds.length} Selected
              </span>
            )}
          </div>
        </div>

        {/* Table of Shipping Queue */}
        <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-widest border-b border-slate-200">
              <tr>
                <th className="py-3 px-3 w-10 text-center">
                  <button
                    onClick={toggleSelectAll}
                    className="text-slate-500 hover:text-slate-800 cursor-pointer"
                    title="Select All Ready Orders"
                  >
                    {selectedOrderIds.length > 0 && selectedOrderIds.length === selectableOrders.length ? (
                      <CheckSquare className="w-4 h-4 text-indigo-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                </th>
                <th className="py-3 px-3">Order ID</th>
                <th className="py-3 px-3">Recipient</th>
                <th className="py-3 px-3">Order Details</th>
                <th className="py-3 px-3">Package Box</th>
                <th className="py-3 px-3">Carrier Rates</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-800">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <Package className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
                    <p className="font-medium">No shipping orders found in this view.</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Try clearing filter or add a manual order.</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const isChecked = selectedOrderIds.includes(order.id);
                  const isError = order.status === 'address_error';
                  const countryInfo = getCountryFlag(order.country);

                  return (
                    <tr
                      key={order.id}
                      className={`transition-colors ${
                        isError
                          ? 'bg-rose-50/50 hover:bg-rose-100/50'
                          : isChecked
                          ? 'bg-indigo-50/80'
                          : 'hover:bg-indigo-50/40'
                      }`}
                    >
                      {/* Selection Checkbox */}
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => toggleSelectOrder(order.id)}
                          className={`cursor-pointer ${
                            isChecked ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          {isChecked ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                        </button>
                      </td>

                      {/* Order Ref & Date */}
                      <td className="py-3 px-3 font-mono text-xs text-indigo-600 font-semibold">
                        <div className="flex items-center space-x-1.5">
                          <button
                            onClick={() => onOpenOrderDetailModal && onOpenOrderDetailModal(order)}
                            className="text-indigo-600 hover:text-indigo-800 font-bold hover:underline cursor-pointer flex items-center space-x-1 text-left"
                            title="Click to view full order details, update address, box type, weight or carrier"
                          >
                            <span title={`Full Order ID: ${order.orderNumber}`}>#{formatOrderId(order.orderNumber)}</span>
                          </button>
                          {order.isReshipment && (
                            <span className="bg-amber-100 text-amber-800 text-[9px] px-1.5 py-0.2 rounded font-bold uppercase">
                              Re-Ship
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 font-sans mt-0.5">
                          {new Date(order.orderDate).toLocaleDateString()}
                        </div>
                      </td>

                      {/* Recipient */}
                      <td className="py-3 px-3 font-medium text-slate-900">
                        {/* Line 1: Name */}
                        <div className="text-xs font-bold text-slate-900 truncate max-w-[220px]" title={order.recipientName}>
                          <span>{order.recipientName}</span>
                        </div>

                        {/* Line 2: Flag + Marketplace */}
                        <div className="flex items-center space-x-1.5 text-xs mt-0.5">
                          {countryInfo && (
                            <span
                              className="inline-flex items-center justify-center shrink-0"
                              title={`Destination: ${order.country || countryInfo.label} (International)`}
                            >
                              {countryInfo.flag}
                            </span>
                          )}
                          <span className="font-semibold text-slate-600 text-[11px]">{order.marketplace || 'Etsy'}</span>
                        </div>
                      </td>

                      {/* Order Details */}
                      <td className="py-3 px-3 text-slate-700 max-w-xs text-xs">
                        {order.items && order.items.length > 0 ? (
                          <div className="space-y-1 text-xs">
                            {order.items.slice(0, 2).map((item, idx) => (
                              <div key={idx} className="text-xs flex items-center flex-wrap gap-x-1.5 gap-y-0.5">
                                <span className="font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded text-xs">{item.quantity}x</span>
                                <span className="text-slate-800 font-semibold text-xs">{item.name}</span>
                                {item.itemType && (
                                  <span className="text-xs bg-indigo-50 border border-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded">
                                    Type: {item.itemType}
                                  </span>
                                )}
                                {item.color && (
                                  <span className="text-xs bg-slate-100 border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded">
                                    Color: {item.color}
                                  </span>
                                )}
                              </div>
                            ))}
                            {order.items.length > 2 && (
                              <div className="text-xs text-indigo-600 font-semibold">
                                +{order.items.length - 2} more item{order.items.length - 2 > 1 ? 's' : ''}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-slate-400 text-xs italic">Standard Order Item</div>
                        )}
                        {order.weightOz === 0 ? (
                          <div className="text-xs text-rose-600 font-bold flex items-center space-x-1 mt-1 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded w-max">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            <span>Weight: 0 oz (Needs Correction)</span>
                          </div>
                        ) : (
                          <div className="text-xs text-slate-500 font-medium mt-1">Weight: <strong className="text-slate-900">{order.weightOz} oz</strong></div>
                        )}
                      </td>

                      {/* Box Dropdown */}
                      <td className="py-3 px-3">
                        <select
                          value={order.boxId}
                          onChange={(e) => onUpdateOrderBox(order.id, e.target.value)}
                          className="bg-slate-100 border border-slate-300 text-xs rounded px-2 py-1 outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 w-36 cursor-pointer"
                        >
                          {packages.map((pkg) => (
                            <option key={pkg.id} value={pkg.id}>
                              {pkg.name} ({pkg.code})
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Carrier Rates / Shipping Cost */}
                      <td className="py-3 px-3">
                        {(() => {
                          const rates = getCalculatedRatesForOrder(order, settings?.defaultDomesticCarrier, settings?.defaultDomesticService);
                          const matchedRate = rates.find(
                            (r) =>
                              r.carrier === order.carrier &&
                              order.serviceLevel &&
                              r.serviceLevel.toLowerCase().includes(order.serviceLevel.toLowerCase())
                          ) || rates.find((r) => r.isRecommended) || rates[0];

                          const cost = order.shippingCost !== undefined && order.shippingCost > 0
                            ? order.shippingCost
                            : matchedRate?.rate ?? 0;

                          const carrierDisplay = order.carrier || (countryInfo ? (settings?.defaultInternationalCarrier || 'UPS') : (settings?.defaultDomesticCarrier || 'USPS'));
                          const serviceDisplay = order.serviceLevel || (countryInfo ? (settings?.defaultInternationalService || 'UPS Worldwide Expedited') : (settings?.defaultDomesticService || 'Priority'));

                          return countryInfo ? (
                            <div className="flex items-center space-x-1.5">
                              <button
                                onClick={() => onOpenCompareRatesModal && onOpenCompareRatesModal(order)}
                                className="inline-flex items-center space-x-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 px-2 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-2xs"
                                title="Click to compare and change carrier rates for this international order"
                              >
                                <DollarSign className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                <span>{carrierDisplay} {serviceDisplay}</span>
                                <span className="bg-amber-200 text-amber-950 px-1.5 py-0.5 rounded font-black text-xs">${cost.toFixed(2)}</span>
                              </button>
                              {onOpenCompareRatesModal && (
                                <button
                                  onClick={() => onOpenCompareRatesModal(order)}
                                  className="text-xs text-amber-700 hover:text-amber-900 font-semibold underline cursor-pointer"
                                  title="Change carrier rate"
                                >
                                  Change
                                </button>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center space-x-1.5">
                              <button
                                onClick={() => onOpenCompareRatesModal && onOpenCompareRatesModal(order)}
                                className="inline-flex items-center space-x-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 px-2 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-2xs text-left"
                                title="Click to change carrier, service, or price"
                              >
                                <Truck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                <span>{carrierDisplay} {serviceDisplay}</span>
                                <span className="bg-blue-100 text-blue-950 px-1.5 py-0.5 rounded font-black text-xs">${cost.toFixed(2)}</span>
                              </button>
                              {onOpenCompareRatesModal && (
                                <button
                                  onClick={() => onOpenCompareRatesModal(order)}
                                  className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold underline cursor-pointer ml-0.5"
                                  title="Change carrier rate"
                                >
                                  Change
                                </button>
                              )}
                            </div>
                          );
                        })()}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        {order.status === 'ready_to_ship' && (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[10px] uppercase tracking-wide bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Valid</span>
                          </span>
                        )}

                        {order.status === 'pending_validation' && (
                          <span className="inline-flex items-center gap-1 text-amber-700 font-bold text-[10px] uppercase tracking-wide bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Pending</span>
                          </span>
                        )}

                        {order.status === 'address_error' && (
                          <span className="inline-flex items-center gap-1 text-rose-700 font-bold text-[10px] uppercase tracking-wide bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            <span>Issue</span>
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-3 text-right">
                        {order.status === 'address_error' ? (
                          <button
                            onClick={() => onOpenAddressFixModal(order)}
                            className="text-rose-600 font-semibold text-xs hover:underline cursor-pointer"
                          >
                            Fix Address
                          </button>
                        ) : Boolean(order.hasLabelData || (order.LabelData !== null && order.LabelData !== undefined && order.LabelData !== false) || order.labelBinary) ? (
                          <a
                            href={`/api/orders/${order.id}/label.pdf`}
                            download={`EasyPost_Label_${order.orderNumber}.pdf`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-1 text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-2 py-1 rounded text-xs font-bold transition-colors cursor-pointer"
                            title="Print PDF label stored in database"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Print Label</span>
                          </a>
                        ) : (
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleSinglePurchaseLabel(order)}
                              disabled={purchasingOrderId === order.id}
                              className="inline-flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded text-xs font-bold shadow-2xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Purchase postage label from EasyPost and save PDF label to database"
                            >
                              {purchasingOrderId === order.id ? (
                                <>
                                  <RefreshCw className="w-3 h-3 animate-spin text-white shrink-0" />
                                  <span>Purchasing...</span>
                                </>
                              ) : (
                                <>
                                  <Tag className="w-3 h-3 shrink-0" />
                                  <span>Purchase Label</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
