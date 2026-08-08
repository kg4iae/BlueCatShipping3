import React, { useState } from 'react';
import { ShippingOrder } from '../types';
import { RotateCcw, X, AlertCircle, ArrowRight, Package, Truck, CheckCircle2 } from 'lucide-react';

interface ReshipModalProps {
  order: ShippingOrder;
  onClose: () => void;
  onConfirmReship: (orderId: string, reason: string) => Promise<void>;
}

export const ReshipModal: React.FC<ReshipModalProps> = ({ order, onClose, onConfirmReship }) => {
  const [reason, setReason] = useState('Item damaged in transit / replacement requested');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onConfirmReship(order.id, reason);
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-xl shadow-xl max-w-md w-full p-6 text-slate-800 relative">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center space-x-2 text-amber-600">
            <RotateCcw className="w-5 h-5" />
            <h3 className="text-lg font-bold text-slate-900">Re-Ship Order: #{order.orderNumber}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-500 mt-3">
          This action will clone recipient address and package settings into a new replacement shipping record (e.g.{' '}
          <code className="text-amber-700 bg-amber-50 px-1 py-0.5 rounded border border-amber-200 font-mono">{order.orderNumber}-RS</code>) in the active queue.
        </p>

        {/* Original Shipment Card */}
        <div className="mt-4 bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs space-y-1">
          <div className="text-slate-500 font-medium">Original Recipient:</div>
          <div className="font-bold text-slate-900 text-sm">{order.recipientName}</div>
          <div className="text-slate-700">
            {order.street1}, {order.city}, {order.state} {order.zip}
          </div>
          <div className="text-slate-500 pt-1 flex items-center justify-between border-t border-slate-200 mt-1">
            <span>Box Used: {order.boxName || 'Standard Package'}</span>
            <span>Tracking: {order.trackingNumber || 'N/A'}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Reason for Replacement / Re-Shipment
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none cursor-pointer"
            >
              <option value="Item damaged in transit / replacement requested">
                Item damaged in transit / replacement requested
              </option>
              <option value="Package lost or stolen by carrier">Package lost or stolen by carrier</option>
              <option value="Incomplete initial order shipment">Incomplete initial order shipment</option>
              <option value="Customer size / product exchange">Customer size / product exchange</option>
              <option value="Undeliverable returned to sender">Undeliverable returned to sender</option>
            </select>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-lg shadow-sm flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{loading ? 'Creating Order...' : 'Generate Re-Shipment Order'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
