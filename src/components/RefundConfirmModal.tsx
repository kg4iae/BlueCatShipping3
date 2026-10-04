import React, { useState } from 'react';
import { ShippingOrder, formatOrderId } from '../types';
import { X, Undo2, AlertTriangle, Truck, DollarSign, Loader2, CheckCircle2 } from 'lucide-react';

interface RefundConfirmModalProps {
  order: ShippingOrder;
  onClose: () => void;
  onConfirmRefund: (order: ShippingOrder) => Promise<void>;
}

export const RefundConfirmModal: React.FC<RefundConfirmModalProps> = ({
  order,
  onClose,
  onConfirmRefund,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    try {
      setLoading(true);
      setError(null);
      await onConfirmRefund(order);
    } catch (err: any) {
      setError(err?.message || 'Failed to submit refund request.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-linear-to-r from-rose-50 to-amber-50 border-b border-rose-100 p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-sm">
              <Undo2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Request Postage Label Refund</h3>
              <p className="text-xs text-slate-500">Void label with EasyPost before post office acceptance</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-white/80 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-2 text-rose-700">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Refund Request Failed</p>
                <p className="mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* Order Snapshot Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <span className="font-bold text-slate-700">Order Reference:</span>
              <span className="font-mono font-black text-indigo-700 text-sm">
                #{formatOrderId(order.orderNumber)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 text-slate-600">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Recipient</span>
                <span className="font-bold text-slate-800">{order.recipientName}</span>
                <span className="text-[11px] text-slate-500 block truncate">{order.city}, {order.state} {order.zip}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Marketplace</span>
                <span className="font-bold text-slate-800">{order.marketplace || 'Web Store'}</span>
              </div>
            </div>

            {/* Carrier & Tracking */}
            <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-1.5 mt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5 text-slate-700 font-bold">
                  <Truck className="w-4 h-4 text-indigo-600" />
                  <span>{order.carrier || 'USPS'} ({order.serviceLevel || 'Priority Mail'})</span>
                </div>
                {order.shippingCost !== undefined && order.shippingCost > 0 && (
                  <span className="font-black text-sm text-emerald-600">
                    ${order.shippingCost.toFixed(2)}
                  </span>
                )}
              </div>

              {order.trackingNumber && (
                <div className="text-[11px] font-mono text-slate-600 bg-slate-50 p-1.5 rounded border border-slate-200 break-all">
                  <span className="font-sans text-[10px] text-slate-400 block font-bold">Tracking Number</span>
                  {order.trackingNumber}
                </div>
              )}

              {order.easypostShipmentId && (
                <div className="text-[10px] text-slate-400 font-mono">
                  Shipment ID: {order.easypostShipmentId}
                </div>
              )}
            </div>
          </div>

          {/* Explanation Box */}
          <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-3.5 flex items-start space-x-2.5 text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">What happens next?</p>
              <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-amber-800">
                <li>A refund request will be submitted to the carrier via <strong>EasyPost API</strong>.</li>
                <li>The shipping data, tracking number, and label binary will be removed from your database.</li>
                <li>The order status will be reverted to <strong>Complete (Ready to Ship)</strong> on your dashboard so you can generate a new label if needed.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="flex items-center space-x-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-5 py-2.5 rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Submitting Refund...</span>
              </>
            ) : (
              <>
                <Undo2 className="w-4 h-4" />
                <span>Confirm &amp; Request Refund</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
