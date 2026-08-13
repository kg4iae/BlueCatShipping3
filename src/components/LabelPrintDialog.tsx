import React, { useState, useEffect } from 'react';
import { ShippingOrder, AppSetting, formatOrderId } from '../types';
import { X, Printer, FileText, CheckCircle2, Download, ExternalLink, Package, Zap, AlertCircle } from 'lucide-react';
import { printPdfToQZ, getDefaultQZPrinter } from '../lib/qzTray';

interface LabelPrintDialogProps {
  order: ShippingOrder;
  settings?: AppSetting;
  onClose: () => void;
}

export const LabelPrintDialog: React.FC<LabelPrintDialogProps> = ({ order, settings, onClose }) => {
  const [qzPrinting, setQzPrinting] = useState(false);
  const [qzStatus, setQzStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const handlePrintLabel = () => {
    window.open(`/api/orders/${order.id}/label.pdf`, '_blank');
  };

  const handlePrintPackingSlip = () => {
    window.open(`/api/orders/${order.id}/packing-slip.pdf`, '_blank');
  };

  const handlePrintBoth = () => {
    window.open(`/api/orders/${order.id}/label.pdf`, '_blank');
    window.open(`/api/orders/${order.id}/packing-slip.pdf`, '_blank');
  };

  const handleDirectQZPrint = async () => {
    setQzPrinting(true);
    setQzStatus(null);
    try {
      const printer = settings?.qzPrinterLabel || (await getDefaultQZPrinter()) || '';
      if (!printer) {
        setQzStatus({
          type: 'error',
          msg: 'No thermal printer configured. Please pick a printer in Settings > QZ Tray Hardware Printing.',
        });
        return;
      }
      const pdfRes = await fetch(`/api/orders/${order.id}/label.pdf`);
      if (!pdfRes.ok) throw new Error(`HTTP ${pdfRes.status}`);
      const buffer = await pdfRes.arrayBuffer();
      let binary = '';
      const bytes = new Uint8Array(buffer);
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64Pdf = window.btoa(binary);

      const res = await printPdfToQZ(printer, base64Pdf, { scaleContent: true, rasterize: true });
      if (res.success) {
        setQzStatus({ type: 'success', msg: `Printed label directly to thermal printer "${printer}" via QZ Tray!` });
      } else {
        setQzStatus({ type: 'error', msg: res.message });
      }
    } catch (err: any) {
      setQzStatus({ type: 'error', msg: err?.message || 'QZ Tray label print error' });
    } finally {
      setQzPrinting(false);
    }
  };

  const handleDirectQZPrintPackingSlip = async () => {
    setQzPrinting(true);
    setQzStatus(null);
    try {
      const printer = settings?.qzPrinterPackingSlip || (await getDefaultQZPrinter()) || '';
      if (!printer) {
        setQzStatus({
          type: 'error',
          msg: 'No packing slip printer configured. Please pick a printer in Settings > QZ Tray Hardware Printing.',
        });
        return;
      }
      const pdfRes = await fetch(`/api/orders/${order.id}/packing-slip.pdf`);
      if (!pdfRes.ok) throw new Error(`HTTP ${pdfRes.status}`);
      const buffer = await pdfRes.arrayBuffer();
      let binary = '';
      const bytes = new Uint8Array(buffer);
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64Pdf = window.btoa(binary);

      const res = await printPdfToQZ(printer, base64Pdf, { scaleContent: true, rasterize: false });
      if (res.success) {
        setQzStatus({ type: 'success', msg: `Printed packing slip directly to document printer "${printer}" via QZ Tray!` });
      } else {
        setQzStatus({ type: 'error', msg: res.message });
      }
    } catch (err: any) {
      setQzStatus({ type: 'error', msg: err?.message || 'QZ Tray packing slip print error' });
    } finally {
      setQzPrinting(false);
    }
  };

  const handleDirectQZPrintBoth = async () => {
    setQzPrinting(true);
    setQzStatus(null);
    try {
      const labelPrinter = settings?.qzPrinterLabel || (await getDefaultQZPrinter()) || '';
      const slipPrinter = settings?.qzPrinterPackingSlip || labelPrinter;

      if (!labelPrinter && !slipPrinter) {
        setQzStatus({
          type: 'error',
          msg: 'No printers configured. Please set up your printers in Settings > QZ Tray Hardware Printing.',
        });
        return;
      }

      // Fetch both PDFs
      const [labelRes, slipRes] = await Promise.all([
        fetch(`/api/orders/${order.id}/label.pdf`),
        fetch(`/api/orders/${order.id}/packing-slip.pdf`),
      ]);

      if (!labelRes.ok || !slipRes.ok) throw new Error('Failed to fetch order PDF documents');

      const [labelBuf, slipBuf] = await Promise.all([labelRes.arrayBuffer(), slipRes.arrayBuffer()]);

      let labelBin = '';
      const labelBytes = new Uint8Array(labelBuf);
      for (let i = 0; i < labelBytes.byteLength; i++) labelBin += String.fromCharCode(labelBytes[i]);

      let slipBin = '';
      const slipBytes = new Uint8Array(slipBuf);
      for (let i = 0; i < slipBytes.byteLength; i++) slipBin += String.fromCharCode(slipBytes[i]);

      const resLabel = await printPdfToQZ(labelPrinter, window.btoa(labelBin), { scaleContent: true, rasterize: true });
      const resSlip = await printPdfToQZ(slipPrinter, window.btoa(slipBin), { scaleContent: true, rasterize: false });

      if (resLabel.success && resSlip.success) {
        setQzStatus({
          type: 'success',
          msg: `Successfully printed both Label (to "${labelPrinter}") and Packing Slip (to "${slipPrinter}") via QZ Tray!`,
        });
      } else {
        setQzStatus({
          type: 'error',
          msg: `Label: ${resLabel.message} | Slip: ${resSlip.message}`,
        });
      }
    } catch (err: any) {
      setQzStatus({ type: 'error', msg: err?.message || 'QZ Tray print error' });
    } finally {
      setQzPrinting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden text-slate-800 relative animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="p-5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Label Purchased Successfully!</h3>
              <p className="text-xs text-emerald-100">Saved binary PDF label to database</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-emerald-100 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-5">
          {qzStatus && (
            <div
              className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center space-x-2 ${
                qzStatus.type === 'success'
                  ? 'bg-emerald-100 border-emerald-300 text-emerald-950'
                  : 'bg-rose-100 border-rose-300 text-rose-950'
              }`}
            >
              {qzStatus.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              )}
              <span className="flex-1">{qzStatus.msg}</span>
            </div>
          )}

          {/* Order Summary Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-500 pb-2 border-b border-slate-200">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Order Details</span>
              <span className="font-mono font-bold text-slate-900">Order #{formatOrderId(order.orderNumber)}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <span className="text-slate-500 block text-[10px]">Recipient</span>
                <span className="font-bold text-slate-900">{order.recipientName}</span>
                {order.company && <div className="text-slate-600 text-[10px]">{order.company}</div>}
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Carrier &amp; Service</span>
                <span className="font-bold text-indigo-700">{order.carrier || 'USPS'} {order.serviceLevel || ''}</span>
              </div>
            </div>

            {/* Tracking Number */}
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
              <span className="text-slate-500 text-[10px]">Tracking Number:</span>
              <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-300 font-bold text-slate-900">
                {order.trackingNumber || 'Pending'}
              </span>
            </div>
          </div>

          {/* EasyPost & Database Binary Storage Badge */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-xs text-emerald-900 flex items-start space-x-2.5">
            <Package className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="block text-emerald-950 font-semibold mb-0.5">EasyPost Label Download Complete</strong>
              Downloaded PDF file directly from <code className="bg-emerald-100 px-1 py-0.5 rounded font-mono text-[10px]">Label_URL</code> and saved into MS SQL Server <code className="bg-emerald-100 px-1 py-0.5 rounded font-mono text-[10px]">[dbo].[Shipping].[LabelData]</code> as a binary stream.
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            {/* QZ Tray Direct Hardware Printing Header */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-900">
                <Zap className="w-4 h-4 text-emerald-600" />
                <span>QZ Tray Direct Web Hardware Printing</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  onClick={handleDirectQZPrint}
                  disabled={qzPrinting}
                  className="flex items-center justify-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
                  title={`Print label to ${settings?.qzPrinterLabel || 'default thermal printer'}`}
                >
                  <Printer className="w-3.5 h-3.5 text-amber-300" />
                  <span>{qzPrinting ? 'Printing...' : 'Direct Print Label'}</span>
                </button>

                <button
                  onClick={handleDirectQZPrintPackingSlip}
                  disabled={qzPrinting}
                  className="flex items-center justify-center space-x-1.5 bg-teal-600 hover:bg-teal-700 text-white px-3 py-2 rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
                  title={`Print packing slip to ${settings?.qzPrinterPackingSlip || 'default document printer'}`}
                >
                  <FileText className="w-3.5 h-3.5 text-amber-300" />
                  <span>{qzPrinting ? 'Printing...' : 'Direct Print Slip'}</span>
                </button>
              </div>

              <button
                onClick={handleDirectQZPrintBoth}
                disabled={qzPrinting}
                className="w-full flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                <Zap className="w-3.5 h-3.5 text-amber-300" />
                <span>{qzPrinting ? 'Sending Jobs...' : 'Direct Print Both (Label & Slip)'}</span>
              </button>
            </div>

            {/* Standard Browser PDF Preview / Download fallback */}
            <div className="pt-1 space-y-2">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Standard Browser PDF Open</div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handlePrintLabel}
                  className="flex items-center justify-center space-x-1.5 bg-slate-100 border border-slate-300 text-slate-700 hover:bg-slate-200 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-500" />
                  <span>PDF Label</span>
                </button>

                <button
                  onClick={handlePrintPackingSlip}
                  className="flex items-center justify-center space-x-1.5 bg-slate-100 border border-slate-300 text-slate-700 hover:bg-slate-200 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span>PDF Slip</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 px-5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
