import React, { useState } from 'react';
import { ShippingOrder, AppSetting, formatOrderId } from '../types';
import { jsPDF } from 'jspdf';
import { Printer, Download, X, FileText, PackageCheck, Sparkles, Tag, ExternalLink, RefreshCw, Zap, CheckCircle2, AlertCircle } from 'lucide-react';
import { printPdfToQZ, getDefaultQZPrinter } from '../lib/qzTray';

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
  const [qzPrinting, setQzPrinting] = useState(false);
  const [qzStatus, setQzStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const orderIdsStr = orders.map((o) => o.id).join(',');

  const handleDirectQZPrintLabels = async () => {
    setQzPrinting(true);
    setQzStatus(null);
    try {
      const printer = settings.qzPrinterLabel || (await getDefaultQZPrinter()) || '';
      if (!printer) {
        setQzStatus({
          type: 'error',
          msg: 'No printer specified. Please configure your 4x6 Thermal Printer in Settings > QZ Tray Hardware Printing.',
        });
        return;
      }

      // Fetch combined batch PDF labels binary
      const pdfRes = await fetch(`/api/orders/batch-labels.pdf?orderIds=${orderIdsStr}`);
      if (!pdfRes.ok) {
        throw new Error(`Failed to generate batch PDF labels: HTTP ${pdfRes.status}`);
      }
      const buffer = await pdfRes.arrayBuffer();
      let binary = '';
      const bytes = new Uint8Array(buffer);
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64Pdf = window.btoa(binary);

      const res = await printPdfToQZ(printer, base64Pdf, { scaleContent: true, rasterize: true });
      if (res.success) {
        setQzStatus({
          type: 'success',
          msg: `Successfully sent ${orders.length} label(s) directly to printer "${printer}" via QZ Tray!`,
        });
      } else {
        setQzStatus({
          type: 'error',
          msg: res.message,
        });
      }
    } catch (err: any) {
      setQzStatus({
        type: 'error',
        msg: err?.message || 'Failed to direct print via QZ Tray.',
      });
    } finally {
      setQzPrinting(false);
    }
  };

  const handleDirectQZPrintSlips = async () => {
    setQzPrinting(true);
    setQzStatus(null);
    try {
      const printer = settings.qzPrinterPackingSlip || (await getDefaultQZPrinter()) || '';
      if (!printer) {
        setQzStatus({
          type: 'error',
          msg: 'No packing slip printer specified. Please configure your Document Printer in Settings > QZ Tray Hardware Printing.',
        });
        return;
      }

      // Fetch combined batch PDF packing slips binary
      const pdfRes = await fetch(`/api/orders/batch-packing-slips.pdf?orderIds=${orderIdsStr}`);
      if (!pdfRes.ok) {
        throw new Error(`Failed to generate batch PDF packing slips: HTTP ${pdfRes.status}`);
      }
      const buffer = await pdfRes.arrayBuffer();
      let binary = '';
      const bytes = new Uint8Array(buffer);
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64Pdf = window.btoa(binary);

      const res = await printPdfToQZ(printer, base64Pdf, { scaleContent: true, rasterize: false });
      if (res.success) {
        setQzStatus({
          type: 'success',
          msg: `Successfully sent ${orders.length} packing slip(s) directly to printer "${printer}" via QZ Tray!`,
        });
      } else {
        setQzStatus({
          type: 'error',
          msg: res.message,
        });
      }
    } catch (err: any) {
      setQzStatus({
        type: 'error',
        msg: err?.message || 'Failed to direct print packing slips via QZ Tray.',
      });
    } finally {
      setQzPrinting(false);
    }
  };

  const handleDirectQZPrintBoth = async () => {
    setQzPrinting(true);
    setQzStatus(null);
    try {
      const labelPrinter = settings.qzPrinterLabel || (await getDefaultQZPrinter()) || '';
      const slipPrinter = settings.qzPrinterPackingSlip || labelPrinter;

      if (!labelPrinter && !slipPrinter) {
        setQzStatus({
          type: 'error',
          msg: 'No printers specified. Please configure your printers in Settings > QZ Tray Hardware Printing.',
        });
        return;
      }

      const [labelRes, slipRes] = await Promise.all([
        fetch(`/api/orders/batch-labels.pdf?orderIds=${orderIdsStr}`),
        fetch(`/api/orders/batch-packing-slips.pdf?orderIds=${orderIdsStr}`),
      ]);

      if (!labelRes.ok || !slipRes.ok) {
        throw new Error('Failed to generate batch PDF documents.');
      }

      const [labelBuf, slipBuf] = await Promise.all([labelRes.arrayBuffer(), slipRes.arrayBuffer()]);

      let labelBin = '';
      const labelBytes = new Uint8Array(labelBuf);
      for (let i = 0; i < labelBytes.byteLength; i++) {
        labelBin += String.fromCharCode(labelBytes[i]);
      }

      let slipBin = '';
      const slipBytes = new Uint8Array(slipBuf);
      for (let i = 0; i < slipBytes.byteLength; i++) {
        slipBin += String.fromCharCode(slipBytes[i]);
      }

      const resLabel = await printPdfToQZ(labelPrinter, window.btoa(labelBin), { scaleContent: true, rasterize: true });
      const resSlip = await printPdfToQZ(slipPrinter, window.btoa(slipBin), { scaleContent: true, rasterize: false });

      if (resLabel.success && resSlip.success) {
        setQzStatus({
          type: 'success',
          msg: `Successfully sent ${orders.length} label(s) (to "${labelPrinter}") and ${orders.length} packing slip(s) (to "${slipPrinter}") via QZ Tray!`,
        });
      } else {
        setQzStatus({
          type: 'error',
          msg: `Label: ${resLabel.message} | Slip: ${resSlip.message}`,
        });
      }
    } catch (err: any) {
      setQzStatus({
        type: 'error',
        msg: err?.message || 'Failed to direct print labels and packing slips via QZ Tray.',
      });
    } finally {
      setQzPrinting(false);
    }
  };

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
      const doc = new jsPDF({
        unit: 'in',
        format: [4, 6],
        orientation: 'portrait',
      });

      const retAddr = typeof settings?.returnAddress === 'string'
        ? JSON.parse(settings.returnAddress)
        : (settings?.returnAddress || {});
      const returnAddress = {
        name: retAddr.name || settings?.companyName || 'BlueCat Shipping Dept',
        company: retAddr.company || settings?.companyName || 'BlueCat Bobbins Shipping',
        street1: retAddr.street1 || '100 Bobbin Way',
        street2: retAddr.street2 || '',
        city: retAddr.city || 'Chicago',
        state: retAddr.state || 'IL',
        zip: retAddr.zip || '60601',
        country: retAddr.country || 'US',
      };

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

        // Outer Frame Border
        doc.setLineWidth(0.015);
        doc.setDrawColor(0, 0, 0);
        doc.rect(0.1, 0.1, 3.8, 5.8);

        // Header Box
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'bold');
        doc.text(`${displayCarrier}`, 0.2, 0.38);
        if (isIntl) {
          doc.setFontSize(8);
          doc.text('INTL', 2.1, 0.38);
        }
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text(displayService, 0.2, 0.54);

        // Postage Paid Box
        doc.setLineWidth(0.01);
        doc.rect(2.6, 0.2, 1.2, 0.38);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        const postageText = order.carrier === 'UPS' ? 'UPS POSTAGE PAID' : isIntl ? 'USPS INTL PAID' : 'US POSTAGE PAID';
        doc.text(postageText, 2.65, 0.42);

        doc.line(0.1, 0.65, 3.9, 0.65);

        // Return Address
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.text('SHIP FROM:', 0.2, 0.78);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.text(returnAddress.name, 0.2, 0.9);
        doc.setFont('helvetica', 'normal');
        let retY = 1.01;
        if (returnAddress.company) { doc.text(returnAddress.company, 0.2, retY); retY += 0.11; }
        doc.text(returnAddress.street1, 0.2, retY); retY += 0.11;
        if (returnAddress.street2) { doc.text(returnAddress.street2, 0.2, retY); retY += 0.11; }
        doc.text(`${returnAddress.city}, ${returnAddress.state} ${returnAddress.zip} ${returnAddress.country || 'UNITED STATES'}`, 0.2, retY);

        doc.line(0.1, 1.4, 3.9, 1.4);

        // Ship To Block with thick left border
        doc.setFillColor(0, 0, 0);
        doc.rect(0.2, 1.5, 0.04, 1.3, 'F');

        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.text('SHIP TO:', 0.3, 1.62);
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.text(order.recipientName, 0.3, 1.82);

        doc.setFontSize(9);
        let shipY = 1.98;
        if (order.company) {
          doc.setFont('helvetica', 'bold');
          doc.text(order.company, 0.3, shipY);
          shipY += 0.16;
        }
        doc.setFont('helvetica', 'normal');
        doc.text(order.street1, 0.3, shipY);
        shipY += 0.16;
        if (order.street2) {
          doc.text(order.street2, 0.3, shipY);
          shipY += 0.16;
        }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text(`${order.city.toUpperCase()}, ${order.state} ${order.zip}`, 0.3, shipY);
        shipY += 0.2;

        if (isIntl) {
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          doc.text(`DESTINATION: ${order.country.toUpperCase()}`, 0.3, shipY);
          shipY += 0.2;

          // Customs Box
          doc.rect(0.2, shipY, 3.6, 0.55);
          doc.setFontSize(7);
          doc.text('USPS CUSTOMS DECLARATION (CN22 / CP72)', 0.25, shipY + 0.16);
          doc.setFont('helvetica', 'normal');
          doc.text(`Decl. Value: $${order.declaredValue || 100.0} USD | Merchandise`, 0.25, shipY + 0.34);
          doc.text(`Weight: ${order.weightOz || 16} oz | Verified`, 0.25, shipY + 0.48);
          shipY += 0.65;
        }

        // Barcode section
        const barcodeY = Math.max(shipY, 3.5);
        doc.line(0.1, barcodeY, 3.9, barcodeY);

        if (order.trackingNumber) {
          doc.setFillColor(0, 0, 0);
          doc.rect(0.2, barcodeY + 0.12, 3.6, 0.8, 'F');
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(0, 0, 0);
          doc.text(`TRACKING #: ${order.trackingNumber}`, 0.2, barcodeY + 1.12);
        } else {
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(180, 0, 0);
          doc.text('POSTAGE NOT PURCHASED YET', 0.2, barcodeY + 0.5);
        }

        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        doc.text(`Order #: ${formatOrderId(order.orderNumber)}  |  Weight: ${order.weightOz || 16} oz  |  Box: ${order.boxName || 'Standard'}`, 0.2, barcodeY + 1.32);
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
      const doc = new jsPDF({
        unit: 'pt',
        format: 'letter',
      });

      const retAddr = typeof settings?.returnAddress === 'string'
        ? JSON.parse(settings.returnAddress)
        : (settings?.returnAddress || {});
      const returnAddress = {
        name: retAddr.name || settings?.companyName || 'BlueCat Shipping Dept',
        street1: retAddr.street1 || '100 Bobbin Way',
        street2: retAddr.street2 || '',
        city: retAddr.city || 'Chicago',
        state: retAddr.state || 'IL',
        zip: retAddr.zip || '60601',
        phone: retAddr.phone || '312-555-0144',
      };

      orders.forEach((order, index) => {
        if (index > 0) {
          doc.addPage('letter', 'portrait');
        }

        // Header Left: Company Info
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(20);
        doc.text(settings.companyName || 'BlueCat Bobbins Shipping', 36, 56);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.text(returnAddress.street1, 36, 74);
        doc.text(`${returnAddress.city}, ${returnAddress.state} ${returnAddress.zip}`, 36, 90);
        doc.text(`Phone: ${returnAddress.phone}`, 36, 106);

        // Header Right: PACKING SLIP Badge & Order Metadata
        doc.setFillColor(0, 0, 0);
        doc.rect(436, 36, 140, 28, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.text('PACKING SLIP', 506, 54, { align: 'center' });

        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        let rightY = 80;

        const platformName = (order.marketplace || order.company || '').trim();
        const platformLabel = platformName
          ? (platformName.toLowerCase().includes('order') ? platformName : `${platformName} Order #`)
          : 'Order #';
        doc.text(`${platformLabel}: ${formatOrderId(order.orderNumber)}`, 576, rightY, { align: 'right' });

        rightY += 15;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.text(`Date: ${new Date(order.orderDate).toLocaleDateString()}`, 576, rightY, { align: 'right' });
        rightY += 15;
        doc.text(`Box Used: ${order.boxName || 'Standard Package'}`, 576, rightY, { align: 'right' });

        // Divider Line
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(1);
        doc.line(36, 128, 576, 128);

        // Recipient & Shipping Details Grid Box (Blue background)
        doc.setFillColor(219, 234, 254); // blue-100
        doc.setDrawColor(147, 197, 253); // blue-300
        doc.rect(36, 138, 540, 118, 'FD');

        // Left Column: SHIP TO
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42);
        doc.text('SHIP TO:', 50, 156);
        doc.setFontSize(14);
        doc.text(order.recipientName, 50, 174);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
        let yLeft = 192;
        doc.text(order.street1, 50, yLeft); yLeft += 16;
        if (order.street2) { doc.text(order.street2, 50, yLeft); yLeft += 16; }
        doc.text(`${order.city}, ${order.state} ${order.zip}`, 50, yLeft); yLeft += 16;
        doc.text(`Phone: ${order.phone || 'N/A'}`, 50, yLeft);

        // Right Column: SHIPPING DETAILS
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text('SHIPPING DETAILS:', 320, 156);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
        doc.text(`Carrier: ${order.carrier || 'USPS'} (${order.serviceLevel || 'Priority'})`, 320, 176);
        doc.text('Tracking Number:', 320, 196);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.text(order.trackingNumber || 'Not Purchased Yet (Postage Needed)', 320, 214);

        // Line Items Table Header
        const tableY = 270;
        doc.setFillColor(191, 219, 254); // blue-200
        doc.setDrawColor(147, 197, 253); // blue-300
        doc.rect(36, tableY, 540, 26, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(15, 23, 42);
        doc.text('QTY', 48, tableY + 18);
        doc.text('ITEM NAME', 95, tableY + 18);
        doc.text('TYPE', 325, tableY + 18);
        doc.text('COLOR', 420, tableY + 18);
        doc.text('WEIGHT', 510, tableY + 18);

        let itemY = tableY + 42;
        const itemFontSize = 13;
        const itemLineSpacing = itemFontSize * 1.35;
        doc.setFontSize(itemFontSize);
        doc.setTextColor(0, 0, 0);

        (order.items || []).forEach((item) => {
          const qtyLines = doc.splitTextToSize(String(item.quantity || 1), 35);
          const nameLines = doc.splitTextToSize(item.name || 'Order Item', 220);
          const typeLines = doc.splitTextToSize(item.itemType || '—', 85);
          const colorLines = doc.splitTextToSize(item.color || '—', 80);
          const weightLines = doc.splitTextToSize(`${item.weightOz || 12} oz`, 55);

          const maxLines = Math.max(qtyLines.length, nameLines.length, typeLines.length, colorLines.length, weightLines.length);

          doc.setFont('helvetica', 'bold');
          qtyLines.forEach((line, i) => doc.text(line, 48, itemY + i * itemLineSpacing));

          doc.setFont('helvetica', 'normal');
          nameLines.forEach((line, i) => doc.text(line, 95, itemY + i * itemLineSpacing));
          typeLines.forEach((line, i) => doc.text(line, 325, itemY + i * itemLineSpacing));
          colorLines.forEach((line, i) => doc.text(line, 420, itemY + i * itemLineSpacing));
          weightLines.forEach((line, i) => doc.text(line, 510, itemY + i * itemLineSpacing));

          itemY += maxLines * itemLineSpacing + 8;
        });

        // Custom Notice Box
        itemY += 15;
        const rawNotice = settings.packingSlipContent || 'Thank you for your order! Please inspect items upon arrival and contact us if you have any questions.';

        const noticeFontSize = 13;
        doc.setFontSize(noticeFontSize);

        const splitNotice = doc.splitTextToSize(rawNotice, 480);
        const noticeLineSpacing = noticeFontSize * 1.35;
        const textBlockHeight = splitNotice.length * noticeLineSpacing;
        const titlePadding = 32;
        const bottomPadding = 20;
        const noticeBoxHeight = Math.max(70, titlePadding + textBlockHeight + bottomPadding);

        doc.setFillColor(219, 234, 254); // blue-100
        doc.setDrawColor(147, 197, 253); // blue-300
        doc.roundedRect(36, itemY, 540, noticeBoxHeight, 6, 6, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.setTextColor(15, 23, 42);
        doc.text('Important Notice & Customer Service Policy', 52, itemY + 22);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(noticeFontSize);
        doc.setTextColor(15, 23, 42);

        let noticeTextY = itemY + 40;
        splitNotice.forEach((line) => {
          doc.text(line, 52, noticeTextY);
          noticeTextY += noticeLineSpacing;
        });
      });

      doc.save(`Packing_Slips_Letter_${Date.now()}.pdf`);
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
              onClick={handleDirectQZPrintLabels}
              disabled={qzPrinting}
              className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50"
              title="Send thermal labels directly to your printer via QZ Tray"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>{qzPrinting ? 'Printing...' : 'Direct Print Labels'}</span>
            </button>

            <button
              onClick={handleDirectQZPrintSlips}
              disabled={qzPrinting}
              className="flex items-center space-x-1.5 bg-teal-600 hover:bg-teal-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50"
              title="Send packing slips directly to your document printer via QZ Tray"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>{qzPrinting ? 'Printing...' : 'Direct Print Slips'}</span>
            </button>

            <button
              onClick={handleDirectQZPrintBoth}
              disabled={qzPrinting}
              className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50"
              title="Send both thermal labels and packing slips directly to your hardware printers via QZ Tray"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300 animate-bounce" />
              <span>{qzPrinting ? 'Printing Both...' : 'Direct Print Both (Labels & Slips)'}</span>
            </button>

            <button
              onClick={handlePrintServerLabels}
              className="flex items-center space-x-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 px-3 py-1.5 rounded-lg text-xs font-bold shadow-2xs transition-all cursor-pointer"
              title="Print/Download combined PDF labels for selected batch"
            >
              <Printer className="w-3.5 h-3.5 text-indigo-600" />
              <span>PDF Labels</span>
            </button>

            <button
              onClick={handlePrintServerPackingSlips}
              className="flex items-center space-x-1.5 bg-slate-100 border border-slate-300 text-slate-800 hover:bg-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold shadow-2xs transition-all cursor-pointer"
              title="Print/Download combined PDF packing slips for selected batch"
            >
              <FileText className="w-3.5 h-3.5 text-slate-600" />
              <span>PDF Slips</span>
            </button>

            <button
              onClick={handlePrintBothServer}
              className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer"
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
          {qzStatus && (
            <div
              className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center space-x-2 max-w-3xl mx-auto shadow-xs ${
                qzStatus.type === 'success'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  : 'bg-rose-50 border-rose-300 text-rose-950'
              }`}
            >
              {qzStatus.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              )}
              <span className="flex-1">{qzStatus.msg}</span>
              <button
                type="button"
                onClick={() => setQzStatus(null)}
                className="text-slate-400 hover:text-slate-700 text-xs px-1.5 py-0.5 rounded"
              >
                ✕
              </button>
            </div>
          )}

          {orders.map((order, index) => (
            <div key={order.id} className="space-y-6 print:space-y-0">
              {/* --- 1. PACKING SLIP --- */}
              {(viewMode === 'both' || viewMode === 'slips') && (
                <div className="bg-white text-slate-900 rounded-xl p-8 shadow-xl max-w-3xl mx-auto border border-slate-200 print:shadow-none print:border-none print:rounded-none print:max-w-none print:p-8 page-break-after">
                  {/* Header */}
                  <div className="flex items-start justify-between border-b border-slate-200 pb-6 mb-6">
                    {(() => {
                      const retAddr = typeof settings?.returnAddress === 'string'
                        ? JSON.parse(settings.returnAddress)
                        : (settings?.returnAddress || {});
                      return (
                        <div>
                          <h1 className="text-2xl font-bold text-slate-900">{settings.companyName || 'Acme Shipping Corp'}</h1>
                          <p className="text-xs text-slate-500 mt-0.5">{retAddr.street1 || '100 Bobbin Way'}, {retAddr.city || 'Chicago'}, {retAddr.state || 'IL'} {retAddr.zip || '60601'}</p>
                          <p className="text-xs text-slate-500">Phone: {retAddr.phone || '312-555-0144'}</p>
                        </div>
                      );
                    })()}
                    <div className="text-right">
                      <span className="inline-block bg-slate-900 text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded">
                        Packing Slip
                      </span>
                      <div className="text-sm font-bold text-slate-800 mt-2">
                        {(order.marketplace || order.company)
                          ? ((order.marketplace || order.company)!.toLowerCase().includes('order')
                              ? (order.marketplace || order.company)
                              : `${order.marketplace || order.company} Order #`)
                          : 'Order #'}: {formatOrderId(order.orderNumber)}
                      </div>
                      <div className="text-xs text-slate-500">Date: {new Date(order.orderDate).toLocaleDateString()}</div>
                      <div className="text-xs text-slate-600 font-medium">Box Used: {order.boxName || 'Standard Package'}</div>
                    </div>
                  </div>

                  {/* Recipient & Address Box */}
                  <div className="grid grid-cols-2 gap-6 bg-blue-100 p-5 rounded-xl border border-blue-300 mb-6 text-[13pt] text-slate-900">
                    <div>
                      <span className="font-bold text-slate-900 uppercase tracking-wider block mb-1 text-[12pt]">Ship To:</span>
                      <p className="font-bold text-slate-900 text-[15pt]">{order.recipientName}</p>
                      <p>{order.street1}</p>
                      {order.street2 && <p>{order.street2}</p>}
                      <p>{order.city}, {order.state} {order.zip}</p>
                      <p className="text-slate-900 mt-1">Phone: {order.phone || 'N/A'}</p>
                    </div>

                    <div>
                      <span className="font-bold text-slate-900 uppercase tracking-wider block mb-1 text-[12pt]">Shipping Details:</span>
                      <p>Carrier: <strong className="text-slate-900 font-bold">{order.carrier || 'USPS'}</strong> ({order.serviceLevel || 'Priority'})</p>
                      <p className="mt-1">Tracking Number:</p>
                      {order.trackingNumber ? (
                        <p className="font-mono bg-white px-2.5 py-1 rounded border border-blue-300 font-bold text-slate-900 inline-block mt-1 text-[13pt]">
                          {order.trackingNumber}
                        </p>
                      ) : (
                        <span className="inline-block bg-white text-slate-900 border border-blue-300 px-2.5 py-1 rounded text-[11pt] font-semibold mt-1">
                          Not Purchased Yet (Postage Needed)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Line Items Table */}
                  <div className="mb-6 overflow-hidden rounded-xl border border-blue-300">
                    <table className="w-full text-[13pt] text-left border-collapse text-slate-900 table-fixed">
                      <thead>
                        <tr className="bg-blue-200 text-slate-900 border-b border-blue-300 font-bold uppercase tracking-wider text-[12pt]">
                          <th className="py-3 px-3 text-center w-[10%] break-words">Qty</th>
                          <th className="py-3 px-3 w-[40%] break-words">Item Name</th>
                          <th className="py-3 px-3 w-[20%] break-words">Type</th>
                          <th className="py-3 px-3 w-[18%] break-words">Color</th>
                          <th className="py-3 px-3 text-right w-[12%] break-words">Weight</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-blue-200 bg-white">
                        {order.items.map((item, idx) => (
                          <tr key={idx} className="hover:bg-blue-50/50">
                            <td className="py-3 px-3 text-center font-bold text-slate-900 bg-blue-100/60 break-words align-top">{item.quantity}</td>
                            <td className="py-3 px-3 text-slate-900 font-semibold break-words align-top">{item.name}</td>
                            <td className="py-3 px-3 text-slate-900 break-words align-top">{item.itemType || '—'}</td>
                            <td className="py-3 px-3 text-slate-900 break-words align-top">{item.color || '—'}</td>
                            <td className="py-3 px-3 text-right text-slate-900 break-words align-top">{item.weightOz || 12} oz</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* CUSTOM PACKING SLIP CONTENT AREA (From Settings Table) */}
                  <div className="bg-blue-100 border border-blue-300 rounded-xl p-5 text-[13pt] text-slate-900 overflow-hidden break-words">
                    <div className="flex items-center space-x-2 font-bold text-slate-900 uppercase tracking-wide mb-2 text-[13pt]">
                      <Sparkles className="w-5 h-5 text-blue-800 shrink-0" />
                      <span>Important Notice &amp; Customer Service Policy</span>
                    </div>
                    <p className="leading-relaxed whitespace-pre-wrap break-words text-slate-900 text-[13pt]">
                      {settings.packingSlipContent || 'Thank you for your business! Please keep this packing slip for your records.'}
                    </p>
                  </div>
                </div>
              )}

              {/* --- 2. 4x6 SHIPPING LABEL --- */}
              {(viewMode === 'both' || viewMode === 'labels') && (() => {
                const realLabelSrc =
                  order.labelPngData ||
                  (order.labelPngBase64 ? `data:image/png;base64,${order.labelPngBase64}` : null) ||
                  (order.id ? `/api/orders/${order.id}/label.png` : null) ||
                  order.easyPostLabelUrl;

                if (realLabelSrc) {
                  return (
                    <div className="bg-white rounded-xl p-4 shadow-xl max-w-md mx-auto border-2 border-slate-900 overflow-hidden print:shadow-none print:max-w-none print:w-[4in] print:h-[6in] print:p-0 page-break-after">
                      <div className="text-[10px] font-bold text-slate-500 uppercase mb-2 flex justify-between items-center print:hidden">
                        <span>Official EasyPost Postage Label - Order #{formatOrderId(order.orderNumber)}</span>
                        <span className="font-mono text-emerald-700 font-bold">{order.trackingNumber}</span>
                      </div>
                      <img
                        src={realLabelSrc}
                        alt={`Official EasyPost Postage Label for Order #${formatOrderId(order.orderNumber)}`}
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
                    {(() => {
                      const retAddr = typeof settings?.returnAddress === 'string'
                        ? JSON.parse(settings.returnAddress)
                        : (settings?.returnAddress || {});
                      return (
                        <div className="text-[10px] text-slate-700 border-b border-slate-300 pb-2 mb-3">
                          <div className="font-bold text-slate-900">{retAddr.name || settings?.companyName || 'BlueCat Shipping Dept'}</div>
                          <div>{retAddr.street1 || '100 Bobbin Way'}</div>
                          {retAddr.street2 && <div>{retAddr.street2}</div>}
                          <div>{retAddr.city || 'Chicago'}, {retAddr.state || 'IL'} {retAddr.zip || '60601'} {retAddr.country || 'UNITED STATES'}</div>
                        </div>
                      );
                    })()}

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
