import React, { useState } from 'react';
import { ShippingOrder, PackageType, AppSetting } from '../types';
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
} from 'lucide-react';

export function getCountryFlag(country?: string): { flag: string; label: string } | null {
  if (!country) return null;
  const c = country.trim().toUpperCase();
  if (c === 'US' || c === 'USA' || c === 'UNITED STATES' || c === 'UNITED STATES OF AMERICA') return null;

  const flagMap: Record<string, string> = {
    'CA': '🇨🇦', 'CANADA': '🇨🇦',
    'MX': '🇲🇽', 'MEXICO': '🇲🇽',
    'GB': '🇬🇧', 'UK': '🇬🇧', 'GREAT BRITAIN': '🇬🇧', 'UNITED KINGDOM': '🇬🇧',
    'DE': '🇩🇪', 'GERMANY': '🇩🇪',
    'FR': '🇫🇷', 'FRANCE': '🇫🇷',
    'AU': '🇦🇺', 'AUSTRALIA': '🇦🇺',
    'JP': '🇯🇵', 'JAPAN': '🇯🇵',
    'CN': '🇨🇳', 'CHINA': '🇨🇳',
    'BR': '🇧🇷', 'BRAZIL': '🇧🇷',
    'IT': '🇮🇹', 'ITALY': '🇮🇹',
    'ES': '🇪🇸', 'SPAIN': '🇪🇸',
    'NL': '🇳🇱', 'NETHERLANDS': '🇳🇱',
    'IN': '🇮🇳', 'INDIA': '🇮🇳',
    'KR': '🇰🇷', 'SOUTH KOREA': '🇰🇷',
    'PR': '🇵🇷', 'PUERTO RICO': '🇵🇷',
  };

  if (flagMap[c]) return { flag: flagMap[c], label: c };

  if (c.length === 2) {
    const codePoints = c.split('').map((char) => 127397 + char.charCodeAt(0));
    return { flag: String.fromCodePoint(...codePoints), label: c };
  }

  return { flag: '🌐', label: country };
}

interface DashboardProps {
  orders: ShippingOrder[];
  packages: PackageType[];
  settings: AppSetting;
  onUpdateOrderBox: (orderId: string, boxId: string) => Promise<void>;
  onValidateAddresses: (orderIds?: string[]) => Promise<void>;
  onOpenAddressFixModal: (order: ShippingOrder) => void;
  onOpenCompareRatesModal?: (order: ShippingOrder) => void;
  onGenerateBatchLabels: (selectedOrderIds: string[]) => Promise<void>;
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
  onGenerateBatchLabels,
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

  const selectableOrders = filteredOrders.filter((o) => o.status === 'ready_to_ship');

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
              className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>
                {isGenerating ? 'Generating Labels...' : `Bulk Label & Slips (${selectedOrderIds.length})`}
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
                <th className="py-3 px-3">Carrier &amp; Rates</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-800">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <Package className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
                    <p className="font-medium">No shipping orders found in this view.</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Try clearing filter or add a manual order.</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const isChecked = selectedOrderIds.includes(order.id);
                  const isSelectable = order.status === 'ready_to_ship';
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
                          disabled={!isSelectable}
                          onClick={() => toggleSelectOrder(order.id)}
                          className={`cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed ${
                            isChecked ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          {isChecked ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                        </button>
                      </td>

                      {/* Order Ref & Date */}
                      <td className="py-3 px-3 font-mono text-xs text-indigo-600 font-semibold">
                        <div className="flex items-center space-x-1.5">
                          <span>#{order.orderNumber}</span>
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
                        <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                          <span>{order.recipientName}</span>
                          {countryInfo && (
                            <span
                              className="inline-flex items-center space-x-1 bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.5 rounded text-[10px] font-bold"
                              title={`Destination: ${order.country} - Compare USPS & UPS International Rates`}
                            >
                              <span className="text-xs">{countryInfo.flag}</span>
                              <span className="uppercase text-[9px] font-extrabold">{order.country || countryInfo.label}</span>
                              <span className="bg-amber-600 text-white text-[8px] px-1 py-0.2 rounded uppercase font-bold tracking-tight">USPS / UPS</span>
                            </span>
                          )}
                        </div>
                        {order.company && <div className="text-[10px] text-slate-500">{order.company}</div>}
                      </td>

                      {/* Order Details */}
                      <td className="py-3 px-3 text-slate-700 max-w-xs">
                        {order.items && order.items.length > 0 ? (
                          <div className="space-y-0.5">
                            {order.items.slice(0, 2).map((item, idx) => (
                              <div key={idx} className="text-xs truncate flex items-center space-x-1">
                                <span className="font-semibold text-slate-900">{item.quantity}x</span>
                                <span className="text-slate-700 truncate">{item.name}</span>
                                {item.sku && <span className="text-[10px] text-slate-400 font-mono">({item.sku})</span>}
                              </div>
                            ))}
                            {order.items.length > 2 && (
                              <div className="text-[10px] text-indigo-600 font-semibold">
                                +{order.items.length - 2} more item{order.items.length - 2 > 1 ? 's' : ''}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-slate-400 text-[11px] italic">Standard Order Item</div>
                        )}
                        <div className="text-[10px] text-slate-400 mt-0.5">Weight: {order.weightOz || 16} oz</div>
                      </td>

                      {/* Box Dropdown */}
                      <td className="py-3 px-3">
                        <select
                          value={order.boxId}
                          onChange={(e) => onUpdateOrderBox(order.id, e.target.value)}
                          className="bg-slate-100 border border-slate-300 text-[11px] rounded px-2 py-1 outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 w-36 cursor-pointer"
                        >
                          {packages.map((pkg) => (
                            <option key={pkg.id} value={pkg.id}>
                              {pkg.name} ({pkg.code})
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Carrier & Rates */}
                      <td className="py-3 px-3">
                        {countryInfo ? (
                          <button
                            onClick={() => onOpenCompareRatesModal && onOpenCompareRatesModal(order)}
                            className="inline-flex items-center space-x-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 px-2 py-1 rounded-lg text-[11px] font-extrabold cursor-pointer transition-colors shadow-2xs"
                            title="Compare live shipping rates between USPS and UPS for this international order"
                          >
                            <DollarSign className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>{order.carrier ? `${order.carrier} ${order.serviceLevel || ''}` : 'Compare Rates'}</span>
                          </button>
                        ) : (
                          <div className="flex items-center space-x-1">
                            <span
                              className="inline-flex items-center space-x-1 bg-blue-50 text-blue-900 border border-blue-200 px-2 py-1 rounded text-[10px] font-bold"
                              title="Domestic US Order: Locked to USPS per business policy"
                            >
                              <Truck className="w-3 h-3 text-blue-600" />
                              <span>{order.carrier || 'USPS'} {order.serviceLevel || 'Priority'}</span>
                            </span>
                            {onOpenCompareRatesModal && (
                              <button
                                onClick={() => onOpenCompareRatesModal(order)}
                                className="text-[10px] text-slate-400 hover:text-indigo-600 font-semibold underline cursor-pointer ml-1"
                                title="View USPS domestic service rates"
                              >
                                Rates
                              </button>
                            )}
                          </div>
                        )}
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
                        ) : order.status === 'ready_to_ship' ? (
                          <button
                            onClick={() => onGenerateBatchLabels([order.id])}
                            className="text-indigo-600 font-semibold text-xs hover:underline cursor-pointer"
                          >
                            Print Label
                          </button>
                        ) : (
                          <button
                            onClick={() => onValidateAddresses([order.id])}
                            className="text-slate-600 font-semibold text-xs hover:underline cursor-pointer"
                          >
                            Validate
                          </button>
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
