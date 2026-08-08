import React, { useState, useEffect } from 'react';
import { AppSetting, PackageType } from '../types';
import {
  FileText,
  Save,
  Check,
  Database,
  Truck,
  Box,
  Plus,
  Trash2,
  Copy,
  Lock,
  Sparkles,
  Key,
  Server,
  ShieldCheck,
  AlertCircle,
  Eye,
} from 'lucide-react';

interface SettingsPageProps {
  settings: AppSetting;
  packages: PackageType[];
  onUpdateSettings: (updated: Partial<AppSetting>) => Promise<void>;
  onCreatePackage: (pkgData: Partial<PackageType>) => Promise<void>;
  onDeletePackage: (id: string) => Promise<void>;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  settings,
  packages,
  onUpdateSettings,
  onCreatePackage,
  onDeletePackage,
}) => {
  const [activeSection, setActiveSection] = useState<'packingslip' | 'easypost' | 'packages' | 'mssql' | 'security'>('packingslip');

  // Form states
  const [packingSlipContent, setPackingSlipContent] = useState(settings.packingSlipContent || '');
  const [easyPostApiKey, setEasyPostApiKey] = useState(settings.easyPostApiKey || '');
  const [easyPostMode, setEasyPostMode] = useState<'test' | 'production'>(settings.easyPostMode || 'test');
  const [mssqlServer, setMssqlServer] = useState(settings.mssqlServer || '');
  const [mssqlDatabase, setMssqlDatabase] = useState(settings.mssqlDatabase || '');
  const [mssqlUser, setMssqlUser] = useState(settings.mssqlUser || '');
  const [appPassword, setAppPassword] = useState('');

  // Package Form state
  const [newPkgName, setNewPkgName] = useState('');
  const [newPkgLength, setNewPkgLength] = useState('10');
  const [newPkgWidth, setNewPkgWidth] = useState('8');
  const [newPkgHeight, setNewPkgHeight] = useState('4');
  const [newPkgTare, setNewPkgTare] = useState('3');
  const [newPkgEasyPostType, setNewPkgEasyPostType] = useState('Parcel');

  // MSSQL Schema state
  const [ddlScript, setDdlScript] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedDdl, setCopiedDdl] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/mssql/schema')
      .then((res) => res.json())
      .then((res) => setDdlScript(res.ddlScript || ''))
      .catch((err) => console.error('Failed to load MSSQL schema:', err));
  }, []);

  const handleSavePackingSlip = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onUpdateSettings({ packingSlipContent });
    setSaving(false);
    triggerSuccess();
  };

  const handleSaveEasyPost = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onUpdateSettings({ easyPostApiKey, easyPostMode });
    setSaving(false);
    triggerSuccess();
  };

  const handleSaveMssql = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onUpdateSettings({ mssqlServer, mssqlDatabase, mssqlUser });
    setSaving(false);
    triggerSuccess();
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appPassword.trim()) return;
    setSaving(true);
    await onUpdateSettings({ appPassword });
    setSaving(false);
    setAppPassword('');
    triggerSuccess();
  };

  const handleAddPackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPkgName.trim()) return;
    await onCreatePackage({
      name: newPkgName,
      length: parseFloat(newPkgLength) || 10,
      width: parseFloat(newPkgWidth) || 8,
      height: parseFloat(newPkgHeight) || 4,
      weightEmptyOz: parseFloat(newPkgTare) || 3,
      easyPostType: newPkgEasyPostType,
    });
    setNewPkgName('');
    triggerSuccess();
  };

  const triggerSuccess = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const copyDdlToClipboard = () => {
    navigator.clipboard.writeText(ddlScript);
    setCopiedDdl(true);
    setTimeout(() => setCopiedDdl(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Settings Top Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-slate-900">System Configuration &amp; DB Settings</h2>
            <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs px-2.5 py-0.5 rounded-full font-bold">
              MS SQL Synced
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage customizable packing slip content, package box table, EasyPost API credentials, and SQL schema.
          </p>
        </div>

        {savedSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-3.5 py-2 rounded-lg text-xs font-bold flex items-center space-x-1.5 animate-bounce">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Settings successfully saved &amp; written to DB!</span>
          </div>
        )}
      </div>

      {/* Settings Layout with Side Sub-Nav */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Navigation Sidebar */}
        <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-sm h-fit space-y-1">
          <button
            onClick={() => setActiveSection('packingslip')}
            className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeSection === 'packingslip'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Packing Slip Content</span>
          </button>

          <button
            onClick={() => setActiveSection('packages')}
            className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeSection === 'packages'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Box className="w-4 h-4" />
            <span>Package Box Table</span>
          </button>

          <button
            onClick={() => setActiveSection('easypost')}
            className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeSection === 'easypost'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>EasyPost API Key</span>
          </button>

          <button
            onClick={() => setActiveSection('mssql')}
            className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeSection === 'mssql'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>MS SQL Database &amp; DDL</span>
          </button>

          <button
            onClick={() => setActiveSection('security')}
            className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeSection === 'security'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Portal Password Security</span>
          </button>
        </div>

        {/* Content Section Panels */}
        <div className="lg:col-span-3 space-y-6">
          {/* SECTION 1: PACKING SLIP CUSTOM CONTENT */}
          {activeSection === 'packingslip' && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  <span>Custom Packing Slip Notice Content</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  This custom content appears on all batch-printed PDF packing slips. It changes periodically and is automatically saved to the MS SQL <code className="text-indigo-700 font-mono font-bold">settings</code> database table.
                </p>
              </div>

              <form onSubmit={handleSavePackingSlip} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                    Packing Slip Text / Return Policy / Special Notice:
                  </label>
                  <textarea
                    rows={6}
                    value={packingSlipContent}
                    onChange={(e) => setPackingSlipContent(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white font-mono leading-relaxed"
                    placeholder="Enter return policies, customer support details, seasonal thank you notes, care instructions..."
                  />
                </div>

                {/* Live Preview Box */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 flex items-center space-x-1.5">
                    <Eye className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Live Packing Slip Preview Rendering:</span>
                  </label>
                  <div className="bg-slate-50 border border-slate-200 text-slate-800 p-4 rounded-lg text-xs font-sans">
                    <div className="font-bold text-indigo-900 mb-1 flex items-center space-x-1">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      <span>IMPORTANT CUSTOMER INFORMATION:</span>
                    </div>
                    <p className="whitespace-pre-wrap leading-relaxed">{packingSlipContent || 'No custom notice defined.'}</p>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-5 py-2.5 rounded-lg shadow-sm flex items-center space-x-2 cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saving ? 'Saving to DB...' : 'Save & Write to MS SQL Table'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* SECTION 2: PACKAGE BOX TABLE MANAGER */}
          {activeSection === 'packages' && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <Box className="w-5 h-5 text-indigo-600" />
                  <span>Package Box Table Management</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Populates the selectable "Box" dropdown list on the shipping dashboard. Sourced directly from the <code className="text-indigo-700 font-mono font-bold">packages</code> table.
                </p>
              </div>

              {/* Add New Package Form */}
              <form onSubmit={handleAddPackage} className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
                <div className="font-bold text-xs text-slate-800 flex items-center space-x-1.5">
                  <Plus className="w-4 h-4 text-emerald-600" />
                  <span>Add New Custom Box Type</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                  <div className="col-span-2">
                    <input
                      type="text"
                      placeholder="Box Name (e.g. Medium Box)"
                      value={newPkgName}
                      onChange={(e) => setNewPkgName(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      placeholder="Len (in)"
                      value={newPkgLength}
                      onChange={(e) => setNewPkgLength(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      placeholder="Wid (in)"
                      value={newPkgWidth}
                      onChange={(e) => setNewPkgWidth(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      placeholder="Hgt (in)"
                      value={newPkgHeight}
                      onChange={(e) => setNewPkgHeight(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <button
                      type="submit"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs py-1.5 rounded-lg shadow-sm transition-colors cursor-pointer"
                    >
                      Add Box
                    </button>
                  </div>
                </div>
              </form>

              {/* List of Current Packages */}
              <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-widest border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Code</th>
                      <th className="py-2.5 px-3">Box Name</th>
                      <th className="py-2.5 px-3">Dimensions (L x W x H)</th>
                      <th className="py-2.5 px-3">Tare Wt</th>
                      <th className="py-2.5 px-3">EasyPost Type</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-800">
                    {packages.map((pkg) => (
                      <tr key={pkg.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-mono text-indigo-600 font-bold">{pkg.code}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{pkg.name}</td>
                        <td className="py-2.5 px-3 text-slate-600">
                          {pkg.length}" x {pkg.width}" x {pkg.height}"
                        </td>
                        <td className="py-2.5 px-3 text-slate-500">{pkg.weightEmptyOz} oz</td>
                        <td className="py-2.5 px-3">
                          <span className="bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded font-mono text-[10px]">
                            {pkg.easyPostType}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => onDeletePackage(pkg.id)}
                            className="text-slate-400 hover:text-rose-600 p-1 transition-colors cursor-pointer"
                            title="Delete Box"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SECTION 3: EASYPOST API CONFIGURATION */}
          {activeSection === 'easypost' && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <Truck className="w-5 h-5 text-indigo-600" />
                  <span>EasyPost API Integration</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Powers address validation, USPS/UPS/FedEx rate lookups, and postage label creation.
                </p>
              </div>

              <form onSubmit={handleSaveEasyPost} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">EasyPost API Secret Key</label>
                  <input
                    type="password"
                    value={easyPostApiKey}
                    onChange={(e) => setEasyPostApiKey(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-800 font-mono focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    API Key starts with <code className="text-indigo-600 font-mono">EZTK_</code> or <code className="text-indigo-600 font-mono">EZAK_</code>. Automatically provided in test demo mode.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Environment Mode</label>
                  <select
                    value={easyPostMode}
                    onChange={(e) => setEasyPostMode(e.target.value as 'test' | 'production')}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                  >
                    <option value="test">Test Mode (Safe Sandbox Labels &amp; Addresses)</option>
                    <option value="production">Production Mode (Live Carrier Postage Purchase)</option>
                  </select>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-5 py-2.5 rounded-lg shadow-sm flex items-center space-x-2 cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saving ? 'Updating...' : 'Update EasyPost Config'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* SECTION 4: MSSQL DATABASE CONFIG & DDL */}
          {activeSection === 'mssql' && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <Database className="w-5 h-5 text-indigo-600" />
                  <span>Microsoft SQL Server (MS SQL) Connection &amp; Schema DDL</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure your external MS SQL connection settings and copy the SQL DDL statements to run on your SQL Server.
                </p>
              </div>

              <form onSubmit={handleSaveMssql} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">MS SQL Server Host</label>
                    <input
                      type="text"
                      value={mssqlServer}
                      onChange={(e) => setMssqlServer(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Database Name</label>
                    <input
                      type="text"
                      value={mssqlDatabase}
                      onChange={(e) => setMssqlDatabase(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Database User</label>
                    <input
                      type="text"
                      value={mssqlUser}
                      onChange={(e) => setMssqlUser(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2 rounded-lg shadow-sm cursor-pointer"
                  >
                    Save MS SQL Connection Config
                  </button>
                </div>
              </form>

              {/* SQL DDL Code Snippet Box */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-slate-600 tracking-wider">
                    MS SQL Table Creation DDL Script:
                  </span>
                  <button
                    onClick={copyDdlToClipboard}
                    className="flex items-center space-x-1 text-xs text-indigo-600 hover:underline cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedDdl ? 'Copied to Clipboard!' : 'Copy SQL Script'}</span>
                  </button>
                </div>

                <pre className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-[11px] text-emerald-400 font-mono overflow-x-auto max-h-72 leading-relaxed">
                  {ddlScript}
                </pre>
              </div>
            </div>
          )}

          {/* SECTION 5: APP PASSWORD SECURITY */}
          {activeSection === 'security' && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <Lock className="w-5 h-5 text-amber-600" />
                  <span>Portal Password Security</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Update the password required to access this web application session.
                </p>
              </div>

              <form onSubmit={handleSavePassword} className="space-y-4 max-w-md">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">New Portal Password</label>
                  <input
                    type="password"
                    value={appPassword}
                    onChange={(e) => setAppPassword(e.target.value)}
                    placeholder="Enter new password..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs px-5 py-2.5 rounded-lg shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
