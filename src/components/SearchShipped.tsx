import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ShippingOrder, AppSetting, formatOrderId, PaginatedShippedOrders } from '../types';
import { getCountryFlag } from './Dashboard';
import { downloadOrOpenPdf } from '../lib/pdfDownloader';
import {
  Search,
  RotateCcw,
  PackageCheck,
  Calendar,
  Truck,
  Box,
  CheckCircle2,
  FileText,
  Copy,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  RefreshCw,
} from 'lucide-react';

interface SearchShippedProps {
  shippedOrders: ShippingOrder[];
  settings: AppSetting;
  onReshipOrder: (order: ShippingOrder) => void;
  onOpenPrintModal: (orders: ShippingOrder[]) => void;
  onOpenScanFormModal?: () => void;
  onOpenOrderDetailModal?: (order: ShippingOrder) => void;
  totalShippedCount?: number;
}

export const SearchShipped: React.FC<SearchShippedProps> = ({
  shippedOrders,
  settings,
  onReshipOrder,
  onOpenPrintModal,
  onOpenScanFormModal,
  onOpenOrderDetailModal,
  totalShippedCount: initialTotalCount,
}) => {
  // Pagination State: Default 20 records per page, support 20, 50, 100
  const [pageSize, setPageSize] = useState<number>(20);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(
    initialTotalCount !== undefined && initialTotalCount > 0
      ? initialTotalCount
      : shippedOrders.length
  );
  const [displayedOrders, setDisplayedOrders] = useState<ShippingOrder[]>(
    shippedOrders.slice(0, 20)
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [carrierFilter, setCarrierFilter] = useState('all');
  const [copiedTracking, setCopiedTracking] = useState<string | null>(null);
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());

  // Track whether initial mount has happened to avoid redundant fetch if already preloaded
  const isInitialMount = useRef(true);
  const searchTimeoutRef = useRef<any>(null);

  // Sync when initialTotalCount or shippedOrders updates from parent
  useEffect(() => {
    if (initialTotalCount !== undefined && initialTotalCount > 0) {
      setTotalCount(initialTotalCount);
    }
  }, [initialTotalCount]);

  // Fetch paginated data from server
  const fetchPage = useCallback(
    async (page: number, limit: number, carrier: string, query: string) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(limit),
          carrier: carrier || 'all',
          search: query.trim(),
        });
        const res = await fetch(`/api/orders/shipped?${params.toString()}`);
        if (res.ok) {
          const data: PaginatedShippedOrders = await res.json();
          setDisplayedOrders(data.orders || []);
          setTotalCount(data.totalCount || 0);
          setCurrentPage(data.page || 1);
        }
      } catch (err) {
        console.error('[SearchShipped] Failed to fetch paginated shipped orders:', err);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Trigger fetch when pagination or filters change
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      // If we already have preloaded shippedOrders and default settings, we use them
      if (shippedOrders.length > 0 && currentPage === 1 && pageSize === 20 && carrierFilter === 'all' && !searchQuery) {
        setDisplayedOrders(shippedOrders.slice(0, 20));
        return;
      }
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      fetchPage(currentPage, pageSize, carrierFilter, searchQuery);
    }, 250);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [currentPage, pageSize, carrierFilter, searchQuery, fetchPage]);

  // Handle Page Size Change (20, 50, 100)
  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
    setSelectedOrderIds(new Set());
  };

  // Handle Carrier Filter Change
  const handleCarrierChange = (newCarrier: string) => {
    setCarrierFilter(newCarrier);
    setCurrentPage(1);
    setSelectedOrderIds(new Set());
  };

  // Handle Search Input Change
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
    setSelectedOrderIds(new Set());
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const startRecord = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, totalCount);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTracking(text);
    setTimeout(() => setCopiedTracking(null), 2000);
  };

  const toggleSelection = (id: string) => {
    const next = new Set(selectedOrderIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedOrderIds(next);
  };

  const toggleAllOnPage = () => {
    if (selectedOrderIds.size === displayedOrders.length && displayedOrders.length > 0) {
      setSelectedOrderIds(new Set());
    } else {
      setSelectedOrderIds(new Set(displayedOrders.map((o) => o.id)));
    }
  };

  const selectedOrders = displayedOrders.filter((o) => selectedOrderIds.has(o.id));

  // Generate page numbers for smart pagination bar
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) {
        pages.push('...');
      }
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }
      if (currentPage < totalPages - 2) {
        pages.push('...');
      }
      if (!pages.includes(totalPages)) pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-slate-900">Shipped Packages &amp; Historical Archive</h2>
            <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs px-2.5 py-0.5 rounded-full font-bold">
              {totalCount} Total Shipped
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Historical records archive. Displaying {displayedOrders.length} records on current page (Page {currentPage} of {totalPages}).
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => fetchPage(currentPage, pageSize, carrierFilter, searchQuery)}
            disabled={loading}
            className="flex items-center space-x-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 px-3 py-2 rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-50"
            title="Refresh current page from database"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          {onOpenScanFormModal && (
            <button
              onClick={onOpenScanFormModal}
              className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer"
            >
              <FileText className="w-4 h-4 text-indigo-400" />
              <span>USPS SCAN Form</span>
            </button>
          )}

          {selectedOrders.length > 0 && (
            <button
              onClick={() => onOpenPrintModal(selectedOrders)}
              className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer"
            >
              <FileText className="w-4 h-4 text-white" />
              <span>Print Selected ({selectedOrders.length})</span>
            </button>
          )}

          {displayedOrders.length > 0 && (
            <button
              onClick={() => onOpenPrintModal(displayedOrders)}
              className="flex items-center space-x-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 px-3 py-2 rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer"
              title="Print all records visible on current page"
            >
              <FileText className="w-4 h-4 text-indigo-600" />
              <span>Print Page Batch</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter, Search & Page Size Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[280px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by Order #, Recipient, Tracking #, City, or Box Name..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-8 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
            {searchQuery && (
              <button
                onClick={() => handleSearchChange('')}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs font-bold px-1"
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center space-x-3 flex-wrap gap-y-2">
            {/* Carrier Filter */}
            <div className="flex items-center space-x-1.5">
              <span className="text-xs text-slate-500 font-semibold">Carrier:</span>
              <select
                value={carrierFilter}
                onChange={(e) => handleCarrierChange(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
              >
                <option value="all">All Carriers</option>
                <option value="USPS">USPS</option>
                <option value="UPS">UPS</option>
                <option value="FedEx">FedEx</option>
              </select>
            </div>

            {/* Page Size Selector: 20, 50, 100 */}
            <div className="flex items-center space-x-1.5 border-l border-slate-200 pl-3">
              <span className="text-xs text-slate-500 font-semibold">Show:</span>
              <select
                id="pagination-pagesize-select"
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-bold text-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
              >
                <option value={20}>20 records</option>
                <option value={50}>50 records</option>
                <option value={100}>100 records</option>
              </select>
            </div>
          </div>
        </div>

        {/* Status Line: Records range and loading spinner */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
          <div className="flex items-center space-x-2">
            <span>
              Showing <strong className="text-slate-800">{startRecord}</strong> to{' '}
              <strong className="text-slate-800">{endRecord}</strong> of{' '}
              <strong className="text-indigo-600">{totalCount}</strong> records
            </span>
            {searchQuery && (
              <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded text-[11px]">
                Filtered by &quot;{searchQuery}&quot;
              </span>
            )}
          </div>
          {loading && (
            <div className="flex items-center space-x-1.5 text-indigo-600 text-xs font-medium">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Loading records...</span>
            </div>
          )}
        </div>
      </div>

      {/* Table of Shipped Orders */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm relative">
        {loading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
            <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg shadow-md border border-slate-200 text-slate-700 text-xs font-semibold">
              <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
              <span>Fetching {pageSize} records...</span>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-widest border-b border-slate-200">
              <tr>
                <th className="py-3 px-3 w-10">
                  <input
                    type="checkbox"
                    checked={selectedOrderIds.size === displayedOrders.length && displayedOrders.length > 0}
                    onChange={toggleAllOnPage}
                    className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                    title="Select all on this page"
                  />
                </th>
                <th className="py-3 px-3">Order ID &amp; Date</th>
                <th className="py-3 px-3">Recipient &amp; Address</th>
                <th className="py-3 px-3">Tracking Number &amp; Carrier</th>
                <th className="py-3 px-3">Box Type Used</th>
                <th className="py-3 px-3">Shipping Cost</th>
                <th className="py-3 px-3 text-right">Re-Ship / Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-800">
              {displayedOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <Search className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
                    <p className="font-medium">No shipped records match your query.</p>
                    {(searchQuery || carrierFilter !== 'all') && (
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setCarrierFilter('all');
                          setCurrentPage(1);
                        }}
                        className="mt-2 text-indigo-600 hover:text-indigo-800 text-xs font-semibold underline cursor-pointer"
                      >
                        Reset filters
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                displayedOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-indigo-50/40 transition-colors">
                    <td className="py-3 px-3">
                      <input
                        type="checkbox"
                        checked={selectedOrderIds.has(order.id)}
                        onChange={() => toggleSelection(order.id)}
                        className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                      />
                    </td>
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
                        <button
                          type="button"
                          onClick={() => downloadOrOpenPdf(`/api/orders/${order.id}/label.pdf`, `EasyPost_Label_${order.orderNumber}.pdf`, { mode: 'download' })}
                          className="flex items-center space-x-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
                          title="Download EasyPost shipping label PDF stored in database"
                        >
                          <Download className="w-3.5 h-3.5 text-indigo-600" />
                          <span>PDF Label</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => downloadOrOpenPdf(`/api/orders/${order.id}/packing-slip.pdf`, `PackingSlip_${order.orderNumber}.pdf`, { mode: 'download' })}
                          className="flex items-center space-x-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
                          title="Download or view Packing Slip PDF"
                        >
                          <FileText className="w-3.5 h-3.5 text-slate-600" />
                          <span>Packing Slip</span>
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

        {/* Pagination Control Bar at Bottom of Table */}
        <div className="bg-slate-50 border-t border-slate-200 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Left: Summary and Page Size */}
          <div className="flex items-center space-x-3">
            <span className="text-slate-600">
              Showing <strong className="text-slate-900">{startRecord}</strong> - <strong className="text-slate-900">{endRecord}</strong> of <strong className="text-indigo-600">{totalCount}</strong> records
            </span>
            <div className="flex items-center space-x-1.5">
              <span className="text-slate-400">|</span>
              <span className="text-slate-500">Per page:</span>
              <div className="inline-flex rounded-md shadow-xs" role="group">
                {[20, 50, 100].map((size) => (
                  <button
                    key={size}
                    onClick={() => handlePageSizeChange(size)}
                    className={`px-2.5 py-1 text-xs font-semibold border transition-all cursor-pointer ${
                      pageSize === size
                        ? 'bg-indigo-600 text-white border-indigo-600 z-10'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    } ${size === 20 ? 'rounded-l-md' : ''} ${size === 100 ? 'rounded-r-md' : ''} -ml-px first:ml-0`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Page Navigation Buttons */}
          <div className="flex items-center space-x-1">
            {/* First Page */}
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage <= 1 || loading}
              className="p-1.5 rounded-md border border-slate-300 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
              title="First Page"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>

            {/* Prev Page */}
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1 || loading}
              className="p-1.5 rounded-md border border-slate-300 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Page Numbers */}
            <div className="flex items-center space-x-1 px-1">
              {getPageNumbers().map((p, idx) =>
                typeof p === 'number' ? (
                  <button
                    key={idx}
                    onClick={() => setCurrentPage(p)}
                    disabled={loading}
                    className={`min-w-[32px] h-8 px-2 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                      currentPage === p
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {p}
                  </button>
                ) : (
                  <span key={idx} className="px-1 text-slate-400 font-bold select-none">
                    {p}
                  </span>
                )
              )}
            </div>

            {/* Next Page */}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages || loading}
              className="p-1.5 rounded-md border border-slate-300 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Last Page */}
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage >= totalPages || loading}
              className="p-1.5 rounded-md border border-slate-300 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
              title="Last Page"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
