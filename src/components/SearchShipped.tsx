import React, { useState } from 'react';
import { ShippingOrder, AppSetting } from '../types';
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
} from 'lucide-react';

interface SearchShippedProps {
  shippedOrders: ShippingOrder[];
  settings: AppSetting;
  onReshipOrder: (order: ShippingOrder) => void;
  onOpenPrintModal: (orders: ShippingOrder[]) => void;
}

export const SearchShipped: React.FC<SearchShippedProps> = ({
  shippedOrders,
  settings,
  onReshipOrder,
  onOpenPrintModal,
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
                        <span>#{order.orderNumber}</span>
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
                      <div>
                        {order.recipientName}
                        {order.company && <span className="text-slate-500 font-normal"> ({order.company})</span>}
                      </div>
                      <div className="text-slate-500 text-[10px]">
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

                    {/* Re-Ship Action Button */}
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => onOpenPrintModal([order])}
                          className="p-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                          title="View & Print Label / Packing Slip"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>

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
