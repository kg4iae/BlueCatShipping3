import React, { useState, useEffect } from 'react';
import { MonthlyReportData } from '../types';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { BarChart3, TrendingUp, DollarSign, Package, Truck, Calendar, Download } from 'lucide-react';

export const Reports: React.FC = () => {
  const [data, setData] = useState<MonthlyReportData[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/reports/monthly')
      .then((res) => res.json())
      .then((res) => {
        setData(res.monthly || []);
        setSummary(res.summary || null);
        setLoading(false);
      })
      .catch((err) => console.error('Failed to load reports:', err));
  }, []);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-slate-900">Shipping Volume &amp; Cost Analytics</h2>
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs px-2.5 py-0.5 rounded-full font-bold">
              v1.0 Monthly Report
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Tracking monthly shipment item volumes, postage expenditure, and carrier performance metrics.
          </p>
        </div>
      </div>

      {/* Summary Stat Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2 text-xs font-semibold">
              <span>Total Shipped Volume</span>
              <Package className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{summary.totalItemsAllTime.toLocaleString()} Items</div>
            <div className="text-[11px] text-slate-500 mt-1">{summary.totalShippedAllTime} Total Packages</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2 text-xs font-semibold">
              <span>Total Postage Expenditure</span>
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-emerald-600">${summary.totalSpendAllTime.toLocaleString()}</div>
            <div className="text-[11px] text-slate-500 mt-1">Written to MS SQL DB</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2 text-xs font-semibold">
              <span>Avg Cost / Package</span>
              <TrendingUp className="w-4 h-4 text-sky-600" />
            </div>
            <div className="text-2xl font-bold text-sky-700">${summary.avgPackageCost}</div>
            <div className="text-[11px] text-slate-500 mt-1">Blended rate across carriers</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2 text-xs font-semibold">
              <span>Primary Carrier</span>
              <Truck className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-bold text-amber-700">USPS (55%)</div>
            <div className="text-[11px] text-slate-500 mt-1">UPS Ground: 30% | FedEx: 15%</div>
          </div>
        </div>
      )}

      {/* Main Monthly Volume & Cost Chart */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              <span>Monthly Items Shipped vs. Total Shipping Spend ($)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Dual-axis overview comparing item counts and postage costs</p>
          </div>
        </div>

        {loading ? (
          <div className="h-72 flex items-center justify-center text-slate-500 text-sm">
            Loading monthly report dataset...
          </div>
        ) : (
          <div className="h-80 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="monthName" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis
                  yAxisId="left"
                  stroke="#4f46e5"
                  fontSize={11}
                  tickLine={false}
                  unit=" items"
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#059669"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(v) => `$${v}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderColor: '#334155',
                    borderRadius: '0.5rem',
                    color: '#f8fafc',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar yAxisId="left" dataKey="itemCount" name="Items Shipped" fill="#4f46e5" radius={[6, 6, 0, 0]} barSize={28} />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="totalCost"
                  name="Total Shipping Spend ($)"
                  stroke="#059669"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#059669' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};
