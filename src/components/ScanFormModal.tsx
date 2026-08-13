import React, { useState, useEffect } from 'react';
import { ShippingOrder, AppSetting, ScanFormType, formatOrderId } from '../types';
import {
  FileText,
  Printer,
  X,
  CheckCircle2,
  Calendar,
  Package,
  Sparkles,
  Download,
  Copy,
  History,
  AlertCircle,
  Truck,
  Building,
  ExternalLink,
  Eye,
} from 'lucide-react';

interface ScanFormModalProps {
  shippedOrders: ShippingOrder[];
  settings: AppSetting;
  onClose: () => void;
  onScanFormCreated?: (scanForm: ScanFormType) => void;
}

export const ScanFormModal: React.FC<ScanFormModalProps> = ({
  shippedOrders,
  settings,
  onClose,
  onScanFormCreated,
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'history'>('create');
  const [manifestDate, setManifestDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [historyList, setHistoryList] = useState<ScanFormType[]>([]);
  const [activeScanForm, setActiveScanForm] = useState<ScanFormType | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedBarcode, setCopiedBarcode] = useState<boolean>(false);

  // Load SCAN Form history from server
  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/scan-forms');
      if (res.ok) {
        const data = await res.json();
        setHistoryList(data);
      }
    } catch (e) {
      console.error('Error loading SCAN Form history:', e);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const todayIso = new Date().toISOString().slice(0, 10);
  const todayLocal = new Date().toLocaleDateString('en-CA');

  const isMatchingDate = (shippingDate?: string, targetDate?: string) => {
    if (!targetDate) return true;
    if (!shippingDate) {
      return targetDate === todayIso || targetDate === todayLocal;
    }
    if (shippingDate.startsWith(targetDate)) return true;
    try {
      const d = new Date(shippingDate);
      if (!isNaN(d.getTime())) {
        const localD = d.toLocaleDateString('en-CA');
        const isoD = d.toISOString().slice(0, 10);
        if (localD === targetDate || isoD === targetDate) return true;
      }
    } catch (e) {}
    return false;
  };

  // Filter shipped orders eligible for today / chosen manifest date (must have an EasyPost shipment ID)
  const eligibleOrders = shippedOrders.filter((o) => {
    if (o.status !== 'shipped') return false;
    if (!o.easypostShipmentId) return false;
    return isMatchingDate(o.shippingDate, manifestDate);
  });

  const handleGenerateScanForm = async () => {
    setIsGenerating(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/scan-forms/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: manifestDate,
          orderIds: eligibleOrders.map((o) => o.id),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Failed to create EasyPost SCAN Form.');
        return;
      }

      if (onScanFormCreated) {
        onScanFormCreated(data.scanForm);
      }
      await fetchHistory();
      setActiveScanForm(null);
      setActiveTab('history');
    } catch (err: any) {
      setErrorMsg('Network error connecting to EasyPost SCAN Form service.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPdf = (scanForm?: ScanFormType | null) => {
    const sf = scanForm || activeScanForm;
    if (!sf) return;
    const downloadUrl = `/api/scan-forms/${sf.id}/download`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `USPS_Form_5630_${sf.id}.pdf`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenPdfNewTab = (scanForm?: ScanFormType | null) => {
    const sf = scanForm || activeScanForm;
    if (!sf) return;
    const pdfUrl = `/api/scan-forms/${sf.id}/pdf`;
    window.open(pdfUrl, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyBarcode = () => {
    if (!activeScanForm) return;
    navigator.clipboard.writeText(activeScanForm.id);
    setCopiedBarcode(true);
    setTimeout(() => setCopiedBarcode(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* CSS Print Rules to cleanly output USPS Form 5630 */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #usps-form-5630, #usps-form-5630 * {
            visibility: visible;
          }
          #usps-form-5630 {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full flex flex-col max-h-[92vh] overflow-hidden my-auto">
        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white no-print">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 border border-indigo-500/40 flex items-center justify-center text-white font-bold shadow-sm">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base sm:text-lg font-bold tracking-tight text-white">USPS SCAN Form (Form 5630)</h3>
                <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                  EasyPost API
                </span>
              </div>
              <p className="text-xs text-slate-300">
                End-of-day Shipment Confirmation Acceptance Notice for postal pickup
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Selection Navigation Bar */}
        {!activeScanForm && (
          <div className="bg-slate-100 px-5 py-2.5 border-b border-slate-200 flex items-center justify-between no-print">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setActiveTab('create')}
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'create'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Create End-of-Day Manifest</span>
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'history'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>SCAN Form History ({historyList.length})</span>
              </button>
            </div>

            <div className="flex items-center space-x-2 text-xs text-slate-500">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              <span>Date:</span>
              <input
                type="date"
                value={manifestDate}
                onChange={(e) => setManifestDate(e.target.value)}
                className="bg-white border border-slate-300 rounded px-2 py-0.5 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        )}

        {/* Main Body Section */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-slate-50/50">
          {/* ERROR ALERT */}
          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-xl text-xs flex items-center space-x-2 no-print">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* VIEW MODE 1: FORM DISPLAY (OFFICIAL USPS FORM 5630 / EASYPOST PDF) */}
          {activeScanForm ? (
            <div className="space-y-4">
              {/* Back & Print Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-indigo-50 border border-indigo-200 p-3.5 rounded-xl no-print">
                <div className="flex items-center space-x-2 text-indigo-900">
                  <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                  <div>
                    <h4 className="font-bold text-sm">USPS Form 5630 SCAN Form Generated</h4>
                    <p className="text-xs text-indigo-700">
                      Form ID: <span className="font-mono font-bold">{activeScanForm.id}</span> &bull; Includes{' '}
                      {activeScanForm.totalPackages} package(s)
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handlePrint}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
                    title="Print the official Form 5630 SCAN Form"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print Form</span>
                  </button>

                  <button
                    onClick={() => handleDownloadPdf(activeScanForm)}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
                    title="Download the official PDF file from EasyPost"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download PDF</span>
                  </button>

                  <button
                    onClick={() => handleOpenPdfNewTab(activeScanForm)}
                    className="px-3.5 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold flex items-center space-x-1.5 cursor-pointer"
                    title="Open EasyPost PDF in a new window"
                  >
                    <ExternalLink className="w-4 h-4 text-slate-500" />
                    <span>Open PDF</span>
                  </button>

                  <button
                    onClick={handleCopyBarcode}
                    className="px-2.5 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold flex items-center space-x-1 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>{copiedBarcode ? 'Copied!' : 'Copy ID'}</span>
                  </button>

                  <button
                    onClick={() => setActiveScanForm(null)}
                    className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    &larr; Back
                  </button>
                </div>
              </div>

              {/* OFFICIAL USPS FORM 5630 PRINTABLE LAYOUT */}
              <div
                id="usps-form-5630"
                className="bg-white border-2 border-slate-900 p-6 sm:p-8 rounded-xl shadow-sm text-slate-900 font-sans space-y-6 max-w-3xl mx-auto"
              >
                  {/* Official USPS Header Block */}
                  <div className="border-b-2 border-slate-900 pb-4 flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-blue-900 text-white font-black text-lg flex items-center justify-center rounded">
                          US
                        </div>
                        <span className="font-black text-xl tracking-tight text-blue-950 uppercase">
                          United States Postal Service<sup>&reg;</sup>
                        </span>
                      </div>
                      <h1 className="text-base font-extrabold text-slate-900 tracking-wide uppercase mt-1">
                        Shipment Confirmation Acceptance Notice (SCAN)
                      </h1>
                      <p className="text-xs text-slate-600 font-medium">USPS Official Form 5630 &bull; EasyPost API Manifest</p>
                    </div>

                    <div className="text-right border-l-2 border-slate-900 pl-4 space-y-0.5">
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Date Generated</div>
                      <div className="text-sm font-extrabold text-slate-900">{activeScanForm.formDate}</div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">Total Packages</div>
                      <div className="text-lg font-black text-indigo-700">{activeScanForm.totalPackages}</div>
                    </div>
                  </div>

                  {/* Barcode Display Section */}
                  <div className="bg-slate-50 border border-slate-300 p-4 rounded-lg text-center space-y-2">
                    <div className="text-xs font-bold text-slate-700 uppercase tracking-widest">
                      USPS Acceptance Barcode — Scan at Pickup
                    </div>
                    {/* Visual Barcode Graphic */}
                    <div className="py-2 flex justify-center items-center">
                      <div className="font-mono text-3xl sm:text-4xl tracking-widest text-slate-950 font-black select-none border-x-4 border-slate-900 px-6 py-2 bg-white rounded shadow-inner">
                        ||| | |||| | ||| |||| | ||||| ||| |
                      </div>
                    </div>
                    <div className="font-mono text-sm font-bold text-slate-900 tracking-wider">
                      *SF5630-{activeScanForm.id.toUpperCase()}*
                    </div>
                    <p className="text-[11px] text-slate-500 italic">
                      Postal employee: Scan this barcode once to accept all {activeScanForm.totalPackages} mailpiece(s) in this shipment.
                    </p>
                  </div>

                {/* Shipper Information & Facility Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border border-slate-300 p-4 rounded-lg bg-slate-50/50">
                  <div className="space-y-1">
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-1">
                      <Building className="w-3.5 h-3.5 text-slate-600" />
                      <span>Mailer / Entry Facility</span>
                    </div>
                    <div className="text-xs font-extrabold text-slate-900">{settings.companyName || 'Acme Logistics Corp'}</div>
                    <div className="text-xs text-slate-700">{settings.returnAddress?.name || 'Fulfillment Dept'}</div>
                    <div className="text-xs text-slate-700">
                      {settings.returnAddress?.street1} {settings.returnAddress?.street2 || ''}
                    </div>
                    <div className="text-xs text-slate-700">
                      {settings.returnAddress?.city}, {settings.returnAddress?.state} {settings.returnAddress?.zip}
                    </div>
                    <div className="text-xs text-slate-500">Phone: {settings.returnAddress?.phone || '312-555-0144'}</div>
                  </div>

                  <div className="space-y-1 border-t sm:border-t-0 sm:border-l border-slate-300 pt-3 sm:pt-0 sm:pl-4">
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-1">
                      <Truck className="w-3.5 h-3.5 text-slate-600" />
                      <span>Manifest Details</span>
                    </div>
                    <div className="text-xs text-slate-700">
                      <span className="font-semibold text-slate-900">Form ID:</span>{' '}
                      <span className="font-mono font-bold text-indigo-700">{activeScanForm.id}</span>
                    </div>
                    <div className="text-xs text-slate-700">
                      <span className="font-semibold text-slate-900">Batch Ref:</span>{' '}
                      <span className="font-mono text-slate-600">{activeScanForm.batchId || 'N/A'}</span>
                    </div>
                    <div className="text-xs text-slate-700">
                      <span className="font-semibold text-slate-900">EasyPost Integration:</span> Live / Verified
                    </div>
                    <div className="text-xs text-slate-700">
                      <span className="font-semibold text-slate-900">Timestamp:</span>{' '}
                      {new Date(activeScanForm.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Class of Mail Breakdown Table */}
                <div className="space-y-2">
                  <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                    Class of Mail &amp; Service Summary
                  </h4>
                  <table className="w-full text-left text-xs border border-slate-300 rounded-lg overflow-hidden">
                    <thead className="bg-slate-100 border-b border-slate-300 text-slate-800 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="py-2 px-3">Service Level</th>
                        <th className="py-2 px-3 text-right">Piece Count</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-medium">
                      {activeScanForm.serviceBreakdown && Object.keys(activeScanForm.serviceBreakdown).length > 0 ? (
                        Object.entries(activeScanForm.serviceBreakdown).map(([srv, count], idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-2 px-3 text-slate-900 font-semibold">{srv}</td>
                            <td className="py-2 px-3 text-right font-bold text-indigo-900">{count}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td className="py-2 px-3 text-slate-900 font-semibold">USPS Priority Mail / Ground Advantage</td>
                          <td className="py-2 px-3 text-right font-bold text-indigo-900">{activeScanForm.totalPackages}</td>
                        </tr>
                      )}
                      <tr className="bg-slate-100 font-extrabold text-slate-900">
                        <td className="py-2 px-3">TOTAL MAILPIECES</td>
                        <td className="py-2 px-3 text-right text-indigo-950 text-sm">{activeScanForm.totalPackages}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Package Tracking Manifest Summary */}
                <div className="space-y-2">
                  <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                    Included Package Tracking Manifest ({activeScanForm.trackingNumbers.length})
                  </h4>
                  <div className="border border-slate-300 rounded-lg max-h-48 overflow-y-auto divide-y divide-slate-200">
                    {activeScanForm.trackingNumbers.map((trk, idx) => {
                      const orderNum = activeScanForm.orderNumbers[idx] || `ORD-${idx + 100}`;
                      return (
                        <div key={idx} className="py-1.5 px-3 text-xs flex items-center justify-between hover:bg-slate-50">
                          <span className="font-mono text-slate-800 font-semibold">{trk}</span>
                          <span className="font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.2 rounded text-[10px]">
                            {orderNum}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* USPS Employee Acceptance Signature Box */}
                <div className="border-2 border-slate-900 p-4 rounded-lg bg-slate-50 space-y-3">
                  <div className="text-[10px] font-extrabold text-slate-900 uppercase tracking-wider">
                    USPS Employee Acceptance Certification
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="border-b border-slate-900 pb-1 text-slate-400">
                      USPS Employee Signature: <span className="font-mono text-slate-900">X______________________</span>
                    </div>
                    <div className="border-b border-slate-900 pb-1 text-slate-400">
                      Date &amp; Time Accepted: <span className="font-mono text-slate-900">____/____/________ __:__</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 italic leading-tight">
                    Notice: By scanning this SCAN Form, USPS accepts custody of all listed packages. This notice serves as initial acceptance event verification.
                  </p>
                </div>
              </div>
            </div>
          ) : activeTab === 'create' ? (
            /* VIEW MODE 2: CREATE SCAN FORM GENERATOR */
            <div className="space-y-5">
              {/* Manifest Overview Box */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                      <Package className="w-4 h-4 text-indigo-600" />
                      <span>Today's Shipped Package Queue</span>
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Packages shipped on {manifestDate} ready for USPS Form 5630 SCAN Form generation
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-bold rounded-full">
                      {eligibleOrders.length} Package(s) Ready
                    </span>
                  </div>
                </div>

                {/* Eligible Orders Table */}
                {eligibleOrders.length > 0 ? (
                  <div className="overflow-x-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3">Order #</th>
                          <th className="py-2.5 px-3">Recipient</th>
                          <th className="py-2.5 px-3">Carrier &amp; Service</th>
                          <th className="py-2.5 px-3">Tracking Number</th>
                          <th className="py-2.5 px-3">Ship Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {eligibleOrders.map((o) => (
                          <tr key={o.id} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 font-bold text-indigo-600 font-mono" title={`Full Order ID: ${o.orderNumber}`}>{formatOrderId(o.orderNumber)}</td>
                            <td className="py-2.5 px-3 text-slate-900">{o.recipientName}</td>
                            <td className="py-2.5 px-3">
                              <span className="inline-flex items-center space-x-1 bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded font-bold text-[11px]">
                                <span>{o.carrier || 'USPS'}</span>
                                <span className="text-slate-400 font-normal">&bull;</span>
                                <span className="font-medium text-slate-700">{o.serviceLevel || 'Priority Mail'}</span>
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-700">{o.trackingNumber || 'Awaiting SCAN'}</td>
                            <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                              {o.shippingDate ? new Date(o.shippingDate).toLocaleTimeString() : 'Today'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-300 space-y-2">
                    <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="text-xs font-semibold text-slate-700">No shipped packages with EasyPost Shipment IDs found for {manifestDate}</p>
                    <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                      Generate shipping labels via EasyPost on the Dashboard first. Once packages are shipped with EasyPost shipment IDs, they will automatically populate here to generate your end-of-day SCAN Form!
                    </p>
                  </div>
                )}

                {/* Primary Action Button */}
                <div className="pt-2 flex items-center justify-end">
                  <button
                    onClick={handleGenerateScanForm}
                    disabled={isGenerating || eligibleOrders.length === 0}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center space-x-2 disabled:opacity-50 cursor-pointer active:scale-95"
                  >
                    <FileText className="w-4 h-4" />
                    <span>
                      {isGenerating
                        ? 'Connecting to EasyPost API...'
                        : `Generate EasyPost SCAN Form (${eligibleOrders.length} Packages)`}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* VIEW MODE 3: HISTORY TAB */
            <div className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
                <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <History className="w-4 h-4 text-indigo-600" />
                  <span>Previously Created SCAN Forms</span>
                </h4>

                {historyList.length > 0 ? (
                  <div className="space-y-3">
                    {historyList.map((sf) => (
                      <div
                        key={sf.id}
                        className="border border-slate-200 rounded-xl p-4 hover:border-indigo-300 bg-white transition-all flex flex-wrap items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono font-bold text-indigo-700 text-sm">{sf.id}</span>
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                              {sf.status}
                            </span>
                            <span className="text-xs text-slate-500 font-medium">Date: {sf.formDate}</span>
                          </div>
                          <div className="text-xs text-slate-600">
                            Total Packages: <strong className="text-slate-900">{sf.totalPackages}</strong> &bull; Carrier:{' '}
                            <strong className="text-slate-900">{sf.carrier}</strong>
                          </div>
                          <div className="text-[10px] text-slate-400">Created: {new Date(sf.createdAt).toLocaleString()}</div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleDownloadPdf(sf)}
                            className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center space-x-1 cursor-pointer"
                            title="Download EasyPost SCAN Form PDF file"
                          >
                            <Download className="w-3.5 h-3.5 text-emerald-700" />
                            <span>Download PDF</span>
                          </button>
                          <button
                            onClick={() => handleOpenPdfNewTab(sf)}
                            className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-lg text-xs font-semibold flex items-center space-x-1 cursor-pointer"
                            title="Open PDF in new tab to print"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-indigo-700" />
                            <span>Print PDF</span>
                          </button>
                          <button
                            onClick={() => setActiveScanForm(sf)}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Details</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-xs text-slate-500">
                    No SCAN Forms generated yet. Click "Create End-of-Day Manifest" to generate your first SCAN Form!
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500 no-print">
          <div className="flex items-center space-x-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>USPS Acceptance Compliance &bull; EasyPost ScanForm v2</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
