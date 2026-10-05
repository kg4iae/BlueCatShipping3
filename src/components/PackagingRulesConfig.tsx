import React, { useState, useEffect } from 'react';
import {
  Boxes,
  Plus,
  Edit2,
  Trash2,
  Search,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Zap,
  Info,
  Package,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Save,
  X,
  Play,
  HelpCircle,
} from 'lucide-react';
import { BobbinPackagingRule, PackageType, OrderItem, BoxDeterminationResult } from '../types';

interface PackagingRulesConfigProps {
  packages: PackageType[];
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
  onRefreshOrders?: () => void;
}

export const PackagingRulesConfig: React.FC<PackagingRulesConfigProps> = ({
  packages,
  showToast,
  onRefreshOrders,
}) => {
  const [rules, setRules] = useState<BobbinPackagingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClass, setFilterClass] = useState<string>('all');

  // Modal State for Add / Edit
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<BobbinPackagingRule | null>(null);
  const [formPattern, setFormPattern] = useState('');
  const [formClassification, setFormClassification] = useState<'Oversized' | 'Bulky' | 'Standard' | string>('Standard');
  const [formMaxCubeQty, setFormMaxCubeQty] = useState<number>(4);
  const [formMaxRateBoxQty, setFormMaxRateBoxQty] = useState<number>(10);
  const [formNotes, setFormNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Delete Confirm State
  const [deleteConfirmRule, setDeleteConfirmRule] = useState<BobbinPackagingRule | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Reapply Rules State
  const [reapplying, setReapplying] = useState(false);

  // Interactive Simulator State
  const [testItems, setTestItems] = useState<{ name: string; quantity: number }[]>([
    { name: 'Spinolution 8oz Bobbin', quantity: 1 },
  ]);
  const [testResult, setTestResult] = useState<BoxDeterminationResult | null>(null);
  const [testingSim, setTestingSim] = useState(false);

  // Fetch Rules from DB
  const fetchRules = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/packaging-rules');
      const data = await res.json();
      if (Array.isArray(data)) {
        setRules(data);
      }
    } catch (err: any) {
      showToast('Failed to load packaging rules from database.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const openAddModal = () => {
    setEditingRule(null);
    setFormPattern('');
    setFormClassification('Standard');
    setFormMaxCubeQty(4);
    setFormMaxRateBoxQty(10);
    setFormNotes('');
    setModalOpen(true);
  };

  const openEditModal = (rule: BobbinPackagingRule) => {
    setEditingRule(rule);
    setFormPattern(rule.pattern);
    setFormClassification(rule.classification);
    setFormMaxCubeQty(rule.maxCubeQty);
    setFormMaxRateBoxQty(rule.maxRateBoxQty);
    setFormNotes(rule.notes || '');
    setModalOpen(true);
  };

  const handleClassificationPreset = (cls: string) => {
    setFormClassification(cls);
    if (cls === 'Oversized') {
      setFormMaxCubeQty(0);
      setFormMaxRateBoxQty(0);
      if (!formNotes) setFormNotes('Oversized bobbin; only fits in Large Box.');
    } else if (cls === 'Bulky') {
      setFormMaxCubeQty(1);
      setFormMaxRateBoxQty(4);
      if (!formNotes) setFormNotes('Fits Cube if 1. Fits Rate Box for 2-4. More goes in Large Box.');
    } else if (cls === 'Standard') {
      setFormMaxCubeQty(4);
      setFormMaxRateBoxQty(10);
      if (!formNotes) setFormNotes('Fits Cube up to 4. Fits Rate Box for 5-10. 11+ goes in Large Box.');
    }
  };

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPattern.trim()) {
      showToast('Product Pattern / Keyword is required.', 'error');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        pattern: formPattern.trim(),
        classification: formClassification,
        maxCubeQty: Number(formMaxCubeQty) || 0,
        maxRateBoxQty: Number(formMaxRateBoxQty) || 0,
        notes: formNotes.trim(),
      };

      const url = editingRule ? `/api/packaging-rules/${editingRule.id}` : '/api/packaging-rules';
      const method = editingRule ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save packaging rule.');
      }

      showToast(
        editingRule
          ? `Updated rule for "${formPattern.trim()}" in MS SQL database!`
          : `Created packaging rule for "${formPattern.trim()}" in MS SQL database!`,
        'success'
      );
      setModalOpen(false);
      fetchRules();
    } catch (err: any) {
      showToast(err.message || 'Failed to save rule.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRule = async () => {
    if (!deleteConfirmRule) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/packaging-rules/${deleteConfirmRule.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete rule.');
      }
      showToast(`Deleted rule "${deleteConfirmRule.pattern}" from database.`, 'info');
      setDeleteConfirmRule(null);
      fetchRules();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete rule.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleReapplyRulesToOrders = async () => {
    setReapplying(true);
    try {
      const res = await fetch('/api/orders/reapply-packaging-rules', {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to reapply rules.');
      }
      showToast(
        `Packaging rules evaluated across all open orders (${data.updatedCount || 0} order(s) updated in DB).`,
        'success'
      );
      if (onRefreshOrders) {
        onRefreshOrders();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to reapply packaging rules.', 'error');
    } finally {
      setReapplying(false);
    }
  };

  // Run Simulator
  const handleRunSimulator = async () => {
    setTestingSim(true);
    try {
      const items: OrderItem[] = testItems
        .filter((t) => t.name.trim() && t.quantity > 0)
        .map((t, idx) => ({
          id: `sim-${idx}`,
          name: t.name.trim(),
          sku: t.name.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 8),
          quantity: t.quantity,
          price: 0,
        }));

      if (items.length === 0) {
        showToast('Please add at least one item to test.', 'error');
        setTestingSim(false);
        return;
      }

      const res = await fetch('/api/packaging-rules/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });
      const result: BoxDeterminationResult = await res.json();
      setTestResult(result);
    } catch (err: any) {
      showToast('Simulator error: ' + err.message, 'error');
    } finally {
      setTestingSim(false);
    }
  };

  const addTestItem = () => {
    setTestItems((prev) => [...prev, { name: '', quantity: 1 }]);
  };

  const removeTestItem = (index: number) => {
    setTestItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateTestItem = (index: number, field: 'name' | 'quantity', val: any) => {
    setTestItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: val } : item))
    );
  };

  // Filtered Rules
  const filteredRules = rules.filter((r) => {
    const matchSearch =
      r.pattern.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.classification.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.notes && r.notes.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchClass =
      filterClass === 'all' || r.classification.toLowerCase() === filterClass.toLowerCase();

    return matchSearch && matchClass;
  });

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl border border-indigo-900/50 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <span className="p-2.5 bg-indigo-600/40 border border-indigo-400/30 rounded-xl text-indigo-300">
                <Boxes className="w-6 h-6" />
              </span>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                Bobbin Packaging Rules
              </h1>
              <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold rounded-full">
                MS SQL: [dbo].[BobbinPackagingRules]
              </span>
            </div>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Define product-level box sizing rules for your bobbin catalog. The packaging engine automatically selects between{' '}
              <strong className="text-white">Cube</strong>, <strong className="text-white">Rate Box</strong>, and{' '}
              <strong className="text-white">Large Box</strong>, or alerts you if an order contains unclassified items.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleReapplyRulesToOrders}
              disabled={reapplying}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs shadow-md hover:shadow-indigo-500/25 flex items-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
              title="Re-run rules engine across all active orders in the database"
            >
              <RefreshCw className={`w-4 h-4 ${reapplying ? 'animate-spin' : ''}`} />
              <span>{reapplying ? 'Re-evaluating...' : 'Re-apply to Open Orders'}</span>
            </button>

            <button
              onClick={openAddModal}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-md hover:shadow-emerald-500/25 flex items-center space-x-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Bobbin Rule</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sizing Matrix Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Cube Box Card */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm relative overflow-hidden group hover:border-indigo-300 transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-700 font-black text-sm">
                1
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Cube Box</h3>
                <div className="text-[11px] text-slate-500 font-mono">7.25" × 7.25" × 6.5"</div>
              </div>
            </div>
            <span className="px-2 py-0.5 bg-sky-100 text-sky-800 text-[10px] font-bold rounded-md uppercase tracking-wider">
              Small / Cube
            </span>
          </div>
          <div className="space-y-1.5 text-xs text-slate-600">
            <div className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
              <span><strong>1 to 4</strong> Standard Bobbins (4oz, 12oz)</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span><strong>Exactly 1</strong> Bulky Bobbin (8oz, Louet S10)</span>
            </div>
            <div className="flex items-center space-x-2 text-rose-600 text-[11px]">
              <X className="w-3 h-3 text-rose-500" />
              <span>Never fits Oversized bobbins (16oz / Ashford)</span>
            </div>
          </div>
        </div>

        {/* Rate Box Card */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm relative overflow-hidden group hover:border-indigo-300 transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 font-black text-sm">
                2
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Rate Box</h3>
                <div className="text-[11px] text-slate-500 font-mono">11.25" × 8.75" × 6.0"</div>
              </div>
            </div>
            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-[10px] font-bold rounded-md uppercase tracking-wider">
              Medium / Flat Rate
            </span>
          </div>
          <div className="space-y-1.5 text-xs text-slate-600">
            <div className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              <span><strong>5 to 10</strong> Standard Bobbins (4oz, 12oz)</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span><strong>2 to 4</strong> Bulky Bobbins (8oz, Louet S10)</span>
            </div>
            <div className="flex items-center space-x-2 text-indigo-700 font-medium">
              <CheckCircle2 className="w-3 h-3 text-indigo-500" />
              <span>Mixed bulky + standard within capacity limit</span>
            </div>
          </div>
        </div>

        {/* Large Box Card */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm relative overflow-hidden group hover:border-indigo-300 transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700 font-black text-sm">
                3
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Large Box</h3>
                <div className="text-[11px] text-slate-500 font-mono">12.25" × 12.0" × 8.5"</div>
              </div>
            </div>
            <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-[10px] font-bold rounded-md uppercase tracking-wider">
              Large Package
            </span>
          </div>
          <div className="space-y-1.5 text-xs text-slate-600">
            <div className="flex items-center space-x-2 text-purple-900 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-600" />
              <span><strong>ANY</strong> Spinolution 16oz or Ashford Country Spinner</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              <span><strong>11+</strong> Standard Bobbins</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span><strong>5+</strong> Bulky Bobbins (8oz / Louet S10)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Rules Simulator Bench */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white border border-slate-800 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <span className="p-2 bg-indigo-600/30 border border-indigo-500/40 rounded-lg text-indigo-400">
              <Zap className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-white">Live Box Sizing Simulator &amp; Rule Tester</h2>
              <p className="text-xs text-slate-400">
                Test how your current database rules evaluate any order basket before customers purchase.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={addTestItem}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Item</span>
            </button>
            <button
              type="button"
              onClick={handleRunSimulator}
              disabled={testingSim}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold shadow flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{testingSim ? 'Testing...' : 'Calculate Box'}</span>
            </button>
          </div>
        </div>

        {/* Simulator Item Inputs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-2.5">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
              Order Items in Basket:
            </div>
            {testItems.map((item, index) => (
              <div key={index} className="flex items-center space-x-2 bg-slate-800/80 p-2 rounded-xl border border-slate-700">
                <input
                  type="text"
                  placeholder="e.g. Spinolution 8oz Bobbin, Spinolution 16oz..."
                  value={item.name}
                  onChange={(e) => updateTestItem(index, 'name', e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500"
                />
                <div className="flex items-center space-x-1.5">
                  <span className="text-xs text-slate-400 font-medium">Qty:</span>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={item.quantity}
                    onChange={(e) => updateTestItem(index, 'quantity', parseInt(e.target.value, 10) || 1)}
                    className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white text-center font-bold outline-none focus:border-indigo-500"
                  />
                </div>
                {testItems.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeTestItem(index)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}

            {/* Quick Preset Buttons */}
            <div className="flex flex-wrap items-center gap-1.5 pt-2">
              <span className="text-[11px] text-slate-400 font-medium">Quick Presets:</span>
              <button
                type="button"
                onClick={() => setTestItems([{ name: 'Spinolution 8oz Bobbin', quantity: 1 }])}
                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] rounded border border-slate-700 cursor-pointer"
              >
                1x 8oz (Cube)
              </button>
              <button
                type="button"
                onClick={() => setTestItems([{ name: 'Spinolution 8oz Bobbin', quantity: 3 }])}
                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] rounded border border-slate-700 cursor-pointer"
              >
                3x 8oz (Rate Box)
              </button>
              <button
                type="button"
                onClick={() => setTestItems([{ name: 'Spinolution 16oz Bobbin', quantity: 1 }])}
                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] rounded border border-slate-700 cursor-pointer"
              >
                1x 16oz (Large)
              </button>
              <button
                type="button"
                onClick={() =>
                  setTestItems([
                    { name: 'Spinolution 8oz Bobbin', quantity: 1 },
                    { name: 'Spinolution 4oz Bobbin', quantity: 3 },
                  ])
                }
                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] rounded border border-slate-700 cursor-pointer"
              >
                Mixed 1x 8oz + 3x 4oz
              </button>
              <button
                type="button"
                onClick={() => setTestItems([{ name: 'Unknown Mystery Bobbin', quantity: 1 }])}
                className="px-2 py-0.5 bg-slate-800 hover:bg-rose-950 text-rose-300 text-[10px] rounded border border-rose-800 cursor-pointer"
              >
                Unclassified (Error Test)
              </button>
            </div>
          </div>

          {/* Simulator Result Output */}
          <div className="bg-slate-950/70 rounded-xl p-4 border border-slate-800 flex flex-col justify-center">
            {testResult ? (
              <div>
                {testResult.error ? (
                  <div className="bg-rose-950/40 border border-rose-800/60 rounded-xl p-4 text-rose-200 space-y-2">
                    <div className="flex items-center space-x-2 text-rose-400 font-bold text-sm">
                      <AlertTriangle className="w-5 h-5 shrink-0" />
                      <span>Box Size Undetermined (Triggered Dashboard Alert)</span>
                    </div>
                    <p className="text-xs text-rose-200/90 leading-relaxed font-mono bg-rose-950/60 p-2.5 rounded-lg border border-rose-900/50">
                      {testResult.error}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      This order will be flagged on your dashboard with an amber/red warning badge requiring manual box selection.
                    </p>
                  </div>
                ) : (
                  <div className="bg-indigo-950/30 border border-indigo-800/50 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                        Recommended Package Box:
                      </span>
                      <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-black rounded-lg">
                        Selected: {testResult.boxName || 'Standard Package'}
                      </span>
                    </div>

                    <div className="text-xl font-black text-white flex items-center space-x-2">
                      <Package className="w-6 h-6 text-indigo-400" />
                      <span>{testResult.boxName}</span>
                    </div>

                    <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 text-xs text-slate-300 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Engine Reasoning &amp; Capacity Check:
                      </span>
                      <p className="leading-relaxed font-medium text-slate-200">
                        {testResult.reason}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500 space-y-2">
                <HelpCircle className="w-8 h-8 mx-auto opacity-40 text-slate-400" />
                <p className="text-xs">Click "Calculate Box" to simulate packaging rules on the test items above.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rules Table & CRUD Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Table Filter & Actions Bar */}
        <div className="p-4 sm:p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search rules by bobbin name, classification, or notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              />
            </div>

            {/* Classification Filter Tabs */}
            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
              {(['all', 'Oversized', 'Bulky', 'Standard'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setFilterClass(tab)}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    filterClass.toLowerCase() === tab.toLowerCase()
                      ? 'bg-white text-indigo-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab === 'all' ? 'All Rules' : tab}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-xs text-slate-500 font-medium">
              Showing <strong>{filteredRules.length}</strong> of <strong>{rules.length}</strong> rules
            </span>
            <button
              onClick={fetchRules}
              className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Refresh from MS SQL table"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Rules Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Pattern / Product Keyword</th>
                <th className="py-3 px-4">Classification</th>
                <th className="py-3 px-4 text-center">Max in Cube</th>
                <th className="py-3 px-4 text-center">Max in Rate Box</th>
                <th className="py-3 px-4">Box Determination Summary</th>
                <th className="py-3 px-4">Notes</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 mx-auto animate-spin mb-2 text-indigo-600" />
                    <span>Loading packaging rules from MS SQL Server...</span>
                  </td>
                </tr>
              ) : filteredRules.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <Boxes className="w-8 h-8 mx-auto text-slate-400 opacity-50 mb-2" />
                    <p className="font-semibold text-slate-700">No matching packaging rules found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {searchQuery ? 'Try clearing your search query.' : 'Click "Add Bobbin Rule" to create one.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRules.map((rule) => {
                  const isOversized = rule.classification.toLowerCase() === 'oversized' || (rule.maxCubeQty === 0 && rule.maxRateBoxQty === 0);
                  const isBulky = rule.classification.toLowerCase() === 'bulky';

                  return (
                    <tr key={rule.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        <div className="flex items-center space-x-2">
                          <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                            {rule.pattern}
                          </span>
                          {rule.pattern.includes('*') && (
                            <span className="text-[10px] text-slate-400 font-sans font-medium">
                              (Wildcard)
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {isOversized ? (
                          <span className="px-2.5 py-1 bg-purple-100 text-purple-800 font-black text-[10px] rounded-full uppercase tracking-wider border border-purple-200">
                            Oversized (Large Only)
                          </span>
                        ) : isBulky ? (
                          <span className="px-2.5 py-1 bg-amber-100 text-amber-800 font-black text-[10px] rounded-full uppercase tracking-wider border border-amber-200">
                            Bulky (1 Cube, 2-4 Rate)
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-sky-100 text-sky-800 font-black text-[10px] rounded-full uppercase tracking-wider border border-sky-200">
                            Standard
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center font-bold">
                        {rule.maxCubeQty > 0 ? (
                          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            ≤ {rule.maxCubeQty}
                          </span>
                        ) : (
                          <span className="text-rose-500 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                            0 (No)
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center font-bold">
                        {rule.maxRateBoxQty > 0 ? (
                          <span className="text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                            ≤ {rule.maxRateBoxQty}
                          </span>
                        ) : (
                          <span className="text-rose-500 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                            0 (No)
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-700">
                        {isOversized ? (
                          <span className="font-semibold text-purple-900">Always requires Large Box</span>
                        ) : isBulky ? (
                          <span>1 → Cube &bull; 2–4 → Rate Box &bull; 5+ → Large Box</span>
                        ) : (
                          <span>1–4 → Cube &bull; 5–10 → Rate Box &bull; 11+ → Large Box</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-500 text-[11px] max-w-xs truncate" title={rule.notes || ''}>
                        {rule.notes || '—'}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => openEditModal(rule)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit rule in database"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmRule(rule)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete rule from database"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-indigo-600 text-white rounded-lg">
                  <Boxes className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900">
                  {editingRule ? `Edit Rule: ${editingRule.pattern}` : 'Add New Bobbin Packaging Rule'}
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRule} className="p-6 space-y-4">
              {/* Product Keyword / Pattern */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Product Match Keyword / Pattern *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Spinolution 16oz, Louet S10, *Bobbin*..."
                  value={formPattern}
                  onChange={(e) => setFormPattern(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Matched case-insensitively against incoming order item names or SKUs.
                </p>
              </div>

              {/* Classification Preset Buttons */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Classification Category *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleClassificationPreset('Standard')}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      formClassification === 'Standard'
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 font-bold'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold">Standard</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">1-4 Cube, 5-10 Rate</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleClassificationPreset('Bulky')}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      formClassification === 'Bulky'
                        ? 'border-amber-600 bg-amber-50/70 text-amber-900 font-bold'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold">Bulky</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">1 Cube, 2-4 Rate</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleClassificationPreset('Oversized')}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      formClassification === 'Oversized'
                        ? 'border-purple-600 bg-purple-50/70 text-purple-900 font-bold'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold">Oversized</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Large Box Only</div>
                  </button>
                </div>
              </div>

              {/* Capacities */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Max Qty in Cube Box
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formMaxCubeQty}
                    onChange={(e) => setFormMaxCubeQty(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 font-bold text-center outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="text-[10px] text-slate-500 block mt-1">0 = Never fits in small Cube box</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Max Qty in Rate Box
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formMaxRateBoxQty}
                    onChange={(e) => setFormMaxRateBoxQty(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 font-bold text-center outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="text-[10px] text-slate-500 block mt-1">0 = Never fits in Rate Box</span>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Notes &amp; Packaging Guidance
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Needs extra bubble wrap, fits tight in Rate Box..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-indigo-500/25 flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Saving...' : editingRule ? 'Update Rule' : 'Save Rule'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirmRule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Delete Packaging Rule?</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to delete the rule for <strong className="text-slate-900 font-mono">"{deleteConfirmRule.pattern}"</strong>? This will remove the rule from MS SQL table <span className="font-mono text-indigo-700">[dbo].[BobbinPackagingRules]</span>.
            </p>
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmRule(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteRule}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow cursor-pointer disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
