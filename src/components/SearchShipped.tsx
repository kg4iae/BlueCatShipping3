import React, { useState } from 'react';
import { ShippingOrder, AppSetting, formatOrderId } from '../types';
import { getCountryFlag } from './Dashboard';
import {
  Search,
  RotateCcw,
  ExternalLink,
  PackageCheck,
  Calendar,
  Truck,
  Box,
  DollarSign,
  Filter,
  CheckCircle2,
  FileText,
  Copy,
  Sparkles,
  Download,
} from 'lucide-react';

interface SearchShippedProps {
  shippedOrders: ShippingOrder[];
  settings: AppSetting;
  onReshipOrder: (order: ShippingOrder) => void;
  onOpenPrintModal: (orders: ShippingOrder[]) => void;
  onOpenScanFormModal?: () => void;
  onOpenOrderDetailModal?: (order: ShippingOrder) => void;
}

export const SearchShipped: React.FC<SearchShippedProps> = ({
  shippedOrders,
  settings,
  onReshipOrder,
  onOpenPrintModal,
  onOpenScanFormModal,
  onOpenOrderDetailModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [carrierFilter, setCarrierFilter] = useState('all');
  const [copiedTracking, setCopiedTracking] = useState<string | null>(null);

  const filteredOrders = shippedOrders.filter((order) => {
    if (carrierFilter !== 'all' && order.carrier !== carrierFilter) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      order.orderNumber.toLowerCase().includes(q) ||
      order.recipientName.toLowerCase().includes(q) ||
      (order.company && order.company.toLowerCase().includes(q)) ||
      (order.trackingNumber && order.trackingNumber.toLowerCase().includes(q)) ||
      (order.city && order.city.toLowerCase().includes(q)) ||
      (order.boxName && order.boxName.toLowerCase().includes(q))
    );
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTracking(text);
    setTimeout(() => setCopiedTracking(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-slate-900">Shipped Packages &amp; Historical Archive</h2>
            <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs px-2.5 py-0.5 rounded-full font-bold">
              {shippedOrders.length} Shipped Records
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Search historical shipping database records, print reprint receipts/labels, or launch replacement Re-Ships.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {onOpenScanFormModal && (
            <button
              onClick={onOpenScanFormModal}
              className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer"
            >
              <FileText className="w-4 h-4 text-indigo-400" />
              <span>USPS SCAN Form</span>
            </button>
          )}
          {shippedOrders.length > 0 && (
            <button
              onClick={() => onOpenPrintModal(filteredOrders)}
              className="flex items-center space-x-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer"
            >
              <FileText className="w-4 h-4 text-indigo-600" />
              <span>Reprint Filtered Batch</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[280px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by Order #, Recipient, Tracking #, City, or Box Name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-500 font-semibold">Carrier Filter:</span>
            <select
              value={carrierFilter}
              onChange={(e) => setCarrierFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
            >
              <option value="all">All Carriers</option>
              <option value="USPS">USPS</option>
              <option value="UPS">UPS</option>
              <option value="FedEx">FedEx</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table of Shipped Orders */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-widest border-b border-slate-200">
              <tr>
                <th className="py-3 px-3">Order ID &amp; Date</th>
                <th className="py-3 px-3">Recipient &amp; Address</th>
                <th className="py-3 px-3">Tracking Number &amp; Carrier</th>
                <th className="py-3 px-3">Box Type Used</th>
                <th className="py-3 px-3">Shipping Cost</th>
                <th className="py-3 px-3 text-right">Re-Ship / Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-800">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <Search className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
                    <p className="font-medium">No shipped records match your query.</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-indigo-50/40 transition-colors">
                    {/* Order # & Ship Date */}
                    <td className="py-3 px-3">
                      <div className="font-bold text-indigo-600 font-mono flex items-center space-x-1.5">
                        <button
                          onClick={() => onOpenOrderDetailModal && onOpenOrderDetailModal(order)}
                          className="text-indigo-600 hover:text-indigo-800 font-bold hover:underline cursor-pointer text-left"
                          title="Click to view order details & settings"
                        >
                          <span title={`Full Order ID: ${order.orderNumber}`}>#{formatOrderId(order.orderNumber)}</span>
                        </button>
                        {order.isReshipment && (
                          <span className="bg-amber-100 text-amber-800 text-[9px] px-1.5 py-0.2 rounded font-bold uppercase">
                            Re-Shipment
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 flex items-center space-x-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{new Date(order.shippingDate || order.orderDate).toLocaleDateString()}</span>
                      </div>
                    </td>

                    {/* Recipient Address */}
                    <td className="py-3 px-3 font-medium text-slate-900">
                      <div className="text-xs font-bold text-slate-900 truncate max-w-[220px]" title={order.recipientName}>
                        <span>{order.recipientName}</span>
                      </div>
                      <div className="flex items-center space-x-1.5 text-xs mt-0.5">
                        {(() => {
                          const countryInfo = getCountryFlag(order.country);
                          if (!countryInfo) return null;
                          return (
                            <span
                              className="inline-flex items-center justify-center shrink-0"
                              title={`Country: ${order.country || countryInfo.label}`}
                            >
                              {countryInfo.flag}
                            </span>
                          );
                        })()}
                        <span className="font-semibold text-slate-600 text-[11px]">{order.marketplace || 'Etsy'}</span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                            order.marketplacenotified === 'Yes'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : order.marketplacenotified === 'Pending'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                          title={`Marketplace Notified: ${order.marketplacenotified || 'No'}`}
                        >
                          Notified: {order.marketplacenotified || 'No'}
                        </span>
                      </div>
                      <div className="text-slate-500 text-[10px] mt-0.5">
                        {order.street1}, {order.city}, {order.state} {order.zip}
                      </div>
                    </td>

                    {/* Tracking Number */}
                    <td className="py-3 px-3">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-indigo-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {order.trackingNumber || 'N/A'}
                        </span>
                        {order.trackingNumber && (
                          <button
                            onClick={() => copyToClipboard(order.trackingNumber!)}
                            className="text-slate-400 hover:text-slate-700 p-1 rounded transition-colors cursor-pointer"
                            title="Copy Tracking Number"
                          >
                            {copiedTracking === order.trackingNumber ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1 flex items-center space-x-1">
                        <Truck className="w-3 h-3 text-indigo-600" />
                        <span>{order.carrier || 'USPS'} ({order.serviceLevel || 'Priority'})</span>
                      </div>
                    </td>

                    {/* Box Used */}
                    <td className="py-3 px-3">
                      <div className="font-medium text-slate-800 flex items-center space-x-1">
                        <Box className="w-3.5 h-3.5 text-indigo-600" />
                        <span>{order.boxName || 'Standard Box'}</span>
                      </div>
                      <div className="text-[10px] text-slate-500">{order.weightOz} oz total weight</div>
                    </td>

                    {/* Cost */}
                    <td className="py-3 px-3 font-bold text-emerald-600">
                      ${(order.shippingCost || 12.50).toFixed(2)}
                    </td>

                    {/* Action Buttons */}
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <a
                          href={`/api/orders/${order.id}/label.pdf`}
                          download={`EasyPost_Label_${order.orderNumber}.pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
                          title="Download EasyPost shipping label PDF stored in database"
                        >
                          <Download className="w-3.5 h-3.5 text-indigo-600" />
                          <span>PDF Label</span>
                        </a>

                        <a
                          href={`/api/orders/${order.id}/packing-slip.pdf`}
                          download={`PackingSlip_${order.orderNumber}.pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
                          title="Download or view Packing Slip PDF"
                        >
                          <FileText className="w-3.5 h-3.5 text-slate-600" />
                          <span>Packing Slip</span>
                        </a>

                        <button
                          onClick={() => onReshipOrder(order)}
                          className="flex items-center space-x-1.5 bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm cursor-pointer"
                          title="Creates a new replacement shipping label with same recipient information"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Re-Ship</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
