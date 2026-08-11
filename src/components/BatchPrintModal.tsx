import React, { useState } from 'react';
import { ShippingOrder, AppSetting } from '../types';
import { jsPDF } from 'jspdf';
import { Printer, Download, X, FileText, PackageCheck, Sparkles, Tag, ExternalLink, RefreshCw } from 'lucide-react';

interface BatchPrintModalProps {
  orders: ShippingOrder[];
  settings: AppSetting;
  onClose: () => void;
  onPurchaseBatchLabels?: (orderIds: string[]) => Promise<void>;
}

export const BatchPrintModal: React.FC<BatchPrintModalProps> = ({
  orders,
  settings,
  onClose,
  onPurchaseBatchLabels,
}) => {
  const [viewMode, setViewMode] = useState<'both' | 'labels' | 'slips'>('both');
  const [isExporting, setIsExporting] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);

  const orderIdsStr = orders.map((o) => o.id).join(',');

  const handlePurchaseBatch = async () => {
    if (onPurchaseBatchLabels) {
      setIsPurchasing(true);
      await onPurchaseBatchLabels(orders.map((o) => o.id));
      setIsPurchasing(false);
    } else {
      try {
        setIsPurchasing(true);
        const res = await fetch('/api/orders/batch-purchase-labels', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderIds: orders.map((o) => o.id) }),
        });
        if (res.ok) {
          window.location.reload();
        }
      } catch (e) {
        console.error('Batch purchase error:', e);
      } finally {
        setIsPurchasing(false);
      }
    }
  };

  const handlePrintServerLabels = () => {
    window.open(`/api/orders/batch-labels.pdf?orderIds=${orderIdsStr}`, '_blank');
  };

  const handlePrintServerPackingSlips = () => {
    window.open(`/api/orders/batch-packing-slips.pdf?orderIds=${orderIdsStr}`, '_blank');
  };

  const handlePrintBothServer = () => {
    window.open(`/api/orders/batch-labels.pdf?orderIds=${orderIdsStr}`, '_blank');
    window.open(`/api/orders/batch-packing-slips.pdf?orderIds=${orderIdsStr}`, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportLabelsOnlyPDF = () => {
    setIsExporting(true);
    try {
      // Create 4x6 thermal label printer PDF format
      const doc = new jsPDF({
        unit: 'in',
        format: [4, 6],
        orientation: 'portrait',
      });

      orders.forEach((order, index) => {
        if (index > 0) {
          doc.addPage([4, 6], 'portrait');
        }

        const isIntl =
          order.country &&
          order.country.trim().toUpperCase() !== 'US' &&
          order.country.trim().toUpperCase() !== 'USA' &&
          order.country.trim().toUpperCase() !== 'UNITED STATES';
        const displayCarrier = isIntl ? 'USPS INTERNATIONAL' : order.carrier || 'USPS';
        const displayService = isIntl ? 'PRIORITY MAIL INTERNATIONAL' : order.serviceLevel || 'PRIORITY MAIL 2-DAY';

        // Border frame
        doc.setLineWidth(0.01);
        doc.rect(0.1, 0.1, 3.8, 5.8);

        // Header
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text(`${displayCarrier} POSTAGE PAID`, 0.2, 0.4);
        doc.setFontSize(10);
        doc.text(displayService, 0.2, 0.6);

        // Ship From
        doc.setFontSize(7);
        doc.text('SHIP FROM:', 0.2, 0.9);
        doc.text(settings.returnAddress.name, 0.2, 1.02);
        doc.text(settings.returnAddress.street1, 0.2, 1.14);
        doc.text(
          `${settings.returnAddress.city}, ${settings.returnAddress.state} ${settings.returnAddress.zip} ${
            settings.returnAddress.country || 'US'
          }`,
          0.2,
          1.26
        );

        // Ship To
        doc.setFontSize(9);
        doc.text('SHIP TO:', 0.2, 1.6);
        doc.setFontSize(12);
        doc.text(order.recipientName, 0.2, 1.8);
        if (order.company) doc.text(order.company, 0.2, 2.0);
        doc.text(order.street1, 0.2, 2.2);
        if (order.street2) doc.text(order.street2, 0.2, 2.4);
        doc.text(`${order.city}, ${order.state} ${order.zip}`, 0.2, 2.6);
        if (isIntl) {
          doc.setFontSize(11);
          doc.text(`DESTINATION: ${order.country.toUpperCase()}`, 0.2, 2.85);

          // Customs Box
          doc.rect(0.2, 3.0, 3.6, 0.5);
          doc.setFontSize(7);
          doc.text('USPS CUSTOMS DECLARATION (CN22 / CP72)', 0.25, 3.15);
          doc.text(`Decl. Value: $${order.declaredValue || 100.0} USD | Merch`, 0.25, 3.32);
        }

        // Barcode section
        const barcodeY = isIntl ? 3.7 : 3.2;
        doc.setFillColor(0, 0, 0);
        doc.rect(0.2, barcodeY, 3.6, 0.9, 'F');

        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
        doc.text(
          `TRACKING #: ${order.trackingNumber || 'NOT PURCHASED YET'}`,
          0.2,
          barcodeY + 1.1
        );
      });

      doc.save(`EasyPost_Labels_4x6_LabelPrinter_${Date.now()}.pdf`);
    } catch (err) {
      console.error('Labels PDF export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPackingSlipsOnlyPDF = () => {
    setIsExporting(true);
    try {
      // Create Letter-sized Packing Slip PDF for Color Laser Printer
      const doc = new jsPDF({
        unit: 'in',
        format: 'letter',
      });

      orders.forEach((order, index) => {
        if (index > 0) {
          doc.addPage();
        }

        doc.setFontSize(20);
        doc.setTextColor(30, 41, 59);
        doc.text(settings.companyName || 'Acme Shipping Corp', 0.5, 0.75);

        doc.setFontSize(14);
        doc.setTextColor(71, 85, 105);
        doc.text('PACKING SLIP / INVOICE', 6.0, 0.75);

        doc.setFontSize(10);
        doc.text(`Order #: ${order.orderNumber}`, 6.0, 1.0);
        doc.text(`Ship Date: ${new Date().toLocaleDateString()}`, 6.0, 1.2);
        doc.text(`Package Box: ${order.boxName || 'Standard Package'}`, 6.0, 1.4);

        // Return Address
        doc.setFontSize(9);
        doc.text('FROM:', 0.5, 1.2);
        doc.text(settings.returnAddress.name, 0.5, 1.35);
        doc.text(settings.returnAddress.street1, 0.5, 1.5);
        doc.text(`${settings.returnAddress.city}, ${settings.returnAddress.state} ${settings.returnAddress.zip}`, 0.5, 1.65);

        // Ship To Address
        doc.text('SHIP TO:', 3.0, 1.2);
        doc.text(order.recipientName, 3.0, 1.35);
        if (order.company) doc.text(order.company, 3.0, 1.5);
        doc.text(order.street1, 3.0, 1.65);
        if (order.street2) doc.text(order.street2, 3.0, 1.8);
        doc.text(`${order.city}, ${order.state} ${order.zip}`, 3.0, 1.95);

        // Line Items Table Header
        let y = 2.4;
        doc.setFillColor(241, 245, 249);
        doc.rect(0.5, y, 7.5, 0.3, 'F');
        doc.setFontSize(10);
        doc.setTextColor(15, 23, 42);
        doc.text('SKU / ITEM CODE', 0.6, y + 0.2);
        doc.text('DESCRIPTION / TYPE / COLOR', 2.2, y + 0.2);
        doc.text('QTY', 6.2, y + 0.2);
        doc.text('WEIGHT', 7.0, y + 0.2);

        y += 0.4;

        order.items.forEach((item) => {
          doc.setFontSize(9);
          doc.text(item.sku || 'ITEM', 0.6, y);
          let desc = item.name;
          if (item.itemType || item.color) {
            desc += ` (${item.itemType ? item.itemType : ''}${item.itemType && item.color ? ' - ' : ''}${item.color ? item.color : ''})`;
          }
          doc.text(desc, 2.2, y);
          doc.text(String(item.quantity), 6.3, y);
          doc.text(`${item.weightOz || 4 * item.quantity} oz`, 7.0, y);
          y += 0.25;
        });

        // Custom Packing Slip Content Box (From DB Settings Table)
        y += 0.4;
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(203, 213, 225);
        doc.roundedRect(0.5, y, 7.5, 1.2, 0.1, 0.1, 'FD');

        doc.setFontSize(10);
        doc.setTextColor(30, 58, 138);
        doc.text('IMPORTANT CUSTOMER INFORMATION & RETURN POLICY:', 0.7, y + 0.25);

        doc.setFontSize(8.5);
        doc.setTextColor(51, 65, 85);
        const splitContent = doc.splitTextToSize(settings.packingSlipContent || 'Thank you for your order!', 7.1);
        doc.text(splitContent, 0.7, y + 0.45);
      });

      doc.save(`Packing_Slips_Letter_ColorLaser_${Date.now()}.pdf`);
    } catch (err) {
      console.error('Packing slips PDF export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-100 border border-slate-200 rounded-xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col text-slate-800 relative my-auto">
        {/* Modal Top Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 bg-white rounded-t-xl">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <span>Batch Label &amp; Packing Slip Generator</span>
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold px-2 py-0.5 rounded-full">
                  {orders.length} Order{orders.length > 1 ? 's' : ''} Ready
                </span>
              </h3>
              <p className="text-xs text-slate-500">Generated EasyPost Postage Labels and DB Packing Slips</p>
            </div>
          </div>

          {/* View Filter Switch */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setViewMode('both')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'both' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Documents
            </button>
            <button
              onClick={() => setViewMode('labels')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'labels' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Shipping Labels
            </button>
            <button
              onClick={() => setViewMode('slips')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'slips' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Packing Slips
            </button>
          </div>

          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
            <button
              onClick={handlePrintServerLabels}
              className="flex items-center space-x-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 px-3 py-1.5 rounded-lg text-xs font-bold shadow-2xs transition-all cursor-pointer"
              title="Print/Download combined PDF labels for selected batch"
            >
              <Printer className="w-3.5 h-3.5 text-indigo-600" />
              <span>Print Labels (PDF)</span>
            </button>

            <button
              onClick={handlePrintServerPackingSlips}
              className="flex items-center space-x-1.5 bg-slate-100 border border-slate-300 text-slate-800 hover:bg-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold shadow-2xs transition-all cursor-pointer"
              title="Print/Download combined PDF packing slips for selected batch"
            >
              <FileText className="w-3.5 h-3.5 text-slate-600" />
              <span>Print Packing Slips (PDF)</span>
            </button>

            <button
              onClick={handlePrintBothServer}
              className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer"
              title="Print both Labels and Packing Slips for selected batch"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Print Both</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Documents Preview Area */}
        <div className="p-6 overflow-y-auto space-y-8 flex-1 bg-slate-50 print:bg-white print:p-0">
          {orders.map((order, index) => (
            <div key={order.id} className="space-y-6 print:space-y-0">
              {/* --- 1. PACKING SLIP --- */}
              {(viewMode === 'both' || viewMode === 'slips') && (
                <div className="bg-white text-slate-900 rounded-xl p-8 shadow-xl max-w-3xl mx-auto border border-slate-200 print:shadow-none print:border-none print:rounded-none print:max-w-none print:p-8 page-break-after">
                  {/* Header */}
                  <div className="flex items-start justify-between border-b border-slate-200 pb-6 mb-6">
                    <div>
                      <h1 className="text-2xl font-bold text-slate-900">{settings.companyName || 'Acme Shipping Corp'}</h1>
                      <p className="text-xs text-slate-500 mt-0.5">{settings.returnAddress.street1}, {settings.returnAddress.city}, {settings.returnAddress.state} {settings.returnAddress.zip}</p>
                      <p className="text-xs text-slate-500">Phone: {settings.returnAddress.phone}</p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block bg-slate-900 text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded">
                        Packing Slip
                      </span>
                      <div className="text-sm font-bold text-slate-800 mt-2">Order #: {order.orderNumber}</div>
                      <div className="text-xs text-slate-500">Date: {new Date(order.orderDate).toLocaleDateString()}</div>
                      <div className="text-xs text-slate-600 font-medium">Box Used: {order.boxName || 'Standard Package'}</div>
                    </div>
                  </div>

                  {/* Recipient & Address Box */}
                  <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6 text-xs">
                    <div>
                      <span className="font-bold text-slate-700 uppercase tracking-wider block mb-1">Ship To:</span>
                      <p className="font-bold text-slate-900 text-sm">{order.recipientName}</p>
                      {order.company && <p className="font-medium text-slate-700">{order.company}</p>}
                      <p>{order.street1}</p>
                      {order.street2 && <p>{order.street2}</p>}
                      <p>{order.city}, {order.state} {order.zip}</p>
                      <p className="text-slate-500 mt-1">Phone: {order.phone || 'N/A'}</p>
                    </div>

                    <div>
                      <span className="font-bold text-slate-700 uppercase tracking-wider block mb-1">Shipping Details:</span>
                      <p>Carrier: <strong className="text-blue-700">{order.carrier || 'USPS'}</strong> ({order.serviceLevel || 'Priority'})</p>
                      <p className="mt-1">Tracking Number:</p>
                      {order.trackingNumber ? (
                        <p className="font-mono bg-white px-2 py-1 rounded border border-slate-300 font-bold text-slate-800 inline-block mt-0.5">
                          {order.trackingNumber}
                        </p>
                      ) : (
                        <span className="inline-block bg-amber-50 text-amber-800 border border-amber-300 px-2 py-0.5 rounded text-xs font-semibold mt-0.5">
                          Not Purchased Yet (Postage Needed)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Line Items Table */}
                  <div className="mb-6">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 border-b border-slate-300 font-bold uppercase tracking-wider">
                          <th className="py-2.5 px-3">SKU</th>
                          <th className="py-2.5 px-3">Item Description</th>
                          <th className="py-2.5 px-3 text-center">Qty</th>
                          <th className="py-2.5 px-3 text-right">Weight</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {order.items.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 font-mono font-semibold text-slate-800">{item.sku}</td>
                            <td className="py-2.5 px-3 text-slate-800 font-medium">{item.name}</td>
                            <td className="py-2.5 px-3 text-center font-bold text-slate-900">{item.quantity}</td>
                            <td className="py-2.5 px-3 text-right text-slate-600">{item.weightOz || 12} oz</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* CUSTOM PACKING SLIP CONTENT AREA (From Settings Table) */}
                  <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-4 text-xs text-slate-700">
                    <div className="flex items-center space-x-1.5 font-bold text-blue-900 uppercase tracking-wide mb-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      <span>Important Notice &amp; Customer Service Policy</span>
                    </div>
                    <p className="leading-relaxed whitespace-pre-wrap text-slate-800">
                      {settings.packingSlipContent || 'Thank you for your business! Please keep this packing slip for your records.'}
                    </p>
                  </div>
                </div>
              )}

              {/* --- 2. 4x6 SHIPPING LABEL --- */}
              {(viewMode === 'both' || viewMode === 'labels') && (() => {
                const realLabelSrc =
                  order.easyPostLabelUrl ||
                  order.labelPngData ||
                  (order.labelPngBase64 ? `data:image/png;base64,${order.labelPngBase64}` : null);

                if (realLabelSrc) {
                  return (
                    <div className="bg-white rounded-xl p-4 shadow-xl max-w-md mx-auto border-2 border-slate-900 overflow-hidden print:shadow-none print:max-w-none print:w-[4in] print:h-[6in] print:p-0 page-break-after">
                      <div className="text-[10px] font-bold text-slate-500 uppercase mb-2 flex justify-between items-center print:hidden">
                        <span>Official EasyPost Postage Label - Order #{order.orderNumber}</span>
                        <span className="font-mono text-emerald-700 font-bold">{order.trackingNumber}</span>
                      </div>
                      <img
                        src={realLabelSrc}
                        alt={`Official EasyPost Postage Label for Order #${order.orderNumber}`}
                        className="w-full h-auto object-contain rounded border border-slate-200"
                      />
                    </div>
                  );
                }

                const isIntl = order.country && order.country.trim().toUpperCase() !== 'US' && order.country.trim().toUpperCase() !== 'USA' && order.country.trim().toUpperCase() !== 'UNITED STATES';
                const carrierName = order.carrier || 'USPS';
                const displayCarrier = carrierName === 'UPS' ? 'UPS WORLDWIDE' : isIntl ? 'USPS INTERNATIONAL' : carrierName;
                const displayService = order.serviceLevel ? order.serviceLevel.toUpperCase() : (isIntl ? 'PRIORITY MAIL INTERNATIONAL' : 'PRIORITY MAIL 2-DAY');

                return (
                  <div className="bg-white text-slate-900 rounded-xl p-6 shadow-xl max-w-md mx-auto border-2 border-slate-900 print:shadow-none print:max-w-none print:w-[4in] print:h-[6in] print:p-4 print:mx-0 page-break-after">
                    {/* Label Header */}
                    <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3 mb-3">
                      <div>
                        <div className="font-extrabold text-2xl tracking-tight text-slate-900 flex items-center space-x-1.5">
                          <span>{displayCarrier}</span>
                          {isIntl && (
                            <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded tracking-normal">
                              INTL
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-bold text-slate-700 uppercase">
                          {displayService}
                        </div>
                      </div>
                      <div className="text-right border-2 border-slate-900 px-2 py-1 font-bold text-xs uppercase">
                        {carrierName === 'UPS' ? 'UPS POSTAGE PAID' : isIntl ? 'USPS INTL POSTAGE PAID' : 'US POSTAGE PAID'}
                      </div>
                    </div>

                    {/* Return Address */}
                    <div className="text-[10px] text-slate-700 border-b border-slate-300 pb-2 mb-3">
                      <div className="font-bold text-slate-900">{settings.returnAddress.name}</div>
                      <div>{settings.returnAddress.street1}</div>
                      <div>{settings.returnAddress.city}, {settings.returnAddress.state} {settings.returnAddress.zip} {settings.returnAddress.country || 'UNITED STATES'}</div>
                    </div>

                    {/* Recipient Ship-To Block */}
                    <div className="my-3 pl-3 border-l-4 border-slate-900">
                      <div className="text-[10px] font-bold text-slate-500 uppercase">SHIP TO:</div>
                      <div className="text-base font-extrabold text-slate-900">{order.recipientName}</div>
                      {order.company && <div className="text-xs font-bold text-slate-800">{order.company}</div>}
                      <div className="text-sm font-semibold text-slate-900 mt-1">{order.street1}</div>
                      {order.street2 && <div className="text-sm text-slate-800">{order.street2}</div>}
                      <div className="text-base font-extrabold text-slate-900 mt-1">
                        {order.city.toUpperCase()}, {order.state} {order.zip}
                      </div>
                      {isIntl && (
                        <div className="mt-1.5 inline-block bg-slate-900 text-white text-xs font-extrabold px-2 py-0.5 rounded uppercase tracking-wider">
                          DESTINATION: {order.country.toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* Customs Declaration Box for International Orders */}
                    {isIntl && (
                      <div className="bg-slate-50 border border-slate-300 rounded p-2 my-2.5 text-[10px] text-slate-800">
                        <div className="font-bold flex justify-between uppercase text-[9px] text-slate-900 border-b border-slate-200 pb-1 mb-1">
                          <span>USPS Customs Form CN22 / CP72</span>
                          <span>NOEEI 30.37(a)</span>
                        </div>
                        <div className="flex justify-between text-[10px]">
                          <span>Contents: <strong>Merchandise</strong></span>
                          <span>Decl. Value: <strong>${order.declaredValue || 100.00} USD</strong></span>
                        </div>
                      </div>
                    )}

                    {/* Barcode & Tracking Block */}
                    <div className="pt-2 border-t-2 border-slate-900 text-center">
                      {order.trackingNumber ? (
                        <>
                          <div className="bg-slate-900 text-white font-mono text-center py-4 text-sm tracking-widest font-extrabold mb-1.5 rounded">
                            ||| | ||||| ||| |||| |||||| ||||| |||
                          </div>
                          <div className="text-[11px] font-mono font-bold text-slate-900">
                            TRACKING #: {order.trackingNumber}
                          </div>
                        </>
                      ) : (
                        <div className="bg-amber-50 border-2 border-dashed border-amber-400 text-amber-900 font-bold p-3 text-xs rounded my-2">
                          <div>POSTAGE NOT PURCHASED</div>
                          <div className="text-[10px] font-normal text-amber-800 mt-0.5">
                            Postage must be purchased before printing.
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
