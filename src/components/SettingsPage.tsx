import React, { useState, useEffect } from 'react';
import { AppSetting, PackageType, CarrierType } from '../types';
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
  AlertTriangle,
  Eye,
  Building,
  MapPin,
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
  const [activeSection, setActiveSection] = useState<'returnAddress' | 'carrierDefaults' | 'packingslip' | 'easypost' | 'packages' | 'mssql' | 'security'>('returnAddress');

  // Business / FROM Address Form states
  const [companyName, setCompanyName] = useState(settings.companyName || 'BlueCat Bobbins Shipping');
  const [returnName, setReturnName] = useState(settings.returnAddress?.name || 'BlueCat Shipping Dept');
  const [returnCompany, setReturnCompany] = useState(settings.returnAddress?.company || settings.companyName || 'BlueCat Bobbins Shipping');
  const [returnStreet1, setReturnStreet1] = useState(settings.returnAddress?.street1 || '100 Bobbin Way');
  const [returnStreet2, setReturnStreet2] = useState(settings.returnAddress?.street2 || 'Suite 100');
  const [returnCity, setReturnCity] = useState(settings.returnAddress?.city || 'Chicago');
  const [returnState, setReturnState] = useState(settings.returnAddress?.state || 'IL');
  const [returnZip, setReturnZip] = useState(settings.returnAddress?.zip || '60601');
  const [returnCountry, setReturnCountry] = useState(settings.returnAddress?.country || 'US');
  const [returnPhone, setReturnPhone] = useState(settings.returnAddress?.phone || '312-555-0144');

  // Carrier & Rates defaults state
  const [defaultDomesticCarrier, setDefaultDomesticCarrier] = useState<CarrierType>(settings.defaultDomesticCarrier || 'USPS');
  const [defaultDomesticService, setDefaultDomesticService] = useState<string>(settings.defaultDomesticService || 'Priority');

  // Form states
  const [packingSlipContent, setPackingSlipContent] = useState(settings.packingSlipContent || '');
  const [easyPostApiKey, setEasyPostApiKey] = useState(settings.easyPostApiKey || '');
  const [easyPostMode, setEasyPostMode] = useState<'test' | 'production'>(settings.easyPostMode || 'test');
  const [mssqlServer, setMssqlServer] = useState(settings.mssqlServer || '');
  const [mssqlPort, setMssqlPort] = useState<string>(String(settings.mssqlPort || 1433));
  const [mssqlDatabase, setMssqlDatabase] = useState(settings.mssqlDatabase || '');
  const [mssqlUser, setMssqlUser] = useState(settings.mssqlUser || '');
  const [mssqlPassword, setMssqlPassword] = useState(settings.mssqlPassword || '');
  const [mssqlEncrypt, setMssqlEncrypt] = useState<boolean>(settings.mssqlEncrypt || false);
  const [appPassword, setAppPassword] = useState('');

  // Package Form state
  const [newPkgName, setNewPkgName] = useState('');
  const [newPkgLength, setNewPkgLength] = useState('10');
  const [newPkgWidth, setNewPkgWidth] = useState('8');
  const [newPkgHeight, setNewPkgHeight] = useState('4');
  const [newPkgTare, setNewPkgTare] = useState('3');
  const [newPkgEasyPostType, setNewPkgEasyPostType] = useState('Parcel');

  // MSSQL Schema & Connection test state
  const [ddlScript, setDdlScript] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedDdl, setCopiedDdl] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testingMssql, setTestingMssql] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; version?: string } | null>(null);

  // EasyPost Connection test state
  const [testingEasyPost, setTestingEasyPost] = useState(false);
  const [easyPostTestResult, setEasyPostTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleTestEasyPost = async () => {
    setTestingEasyPost(true);
    setEasyPostTestResult(null);
    try {
      const res = await fetch('/api/easypost/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: easyPostApiKey }),
      });
      const data = await res.json();
      setEasyPostTestResult({
        success: res.ok && data.success,
        message: data.message || (res.ok ? 'EasyPost API Key is valid!' : 'EasyPost connection failed.'),
      });
    } catch (err: any) {
      setEasyPostTestResult({
        success: false,
        message: `Network error testing EasyPost API: ${err?.message || err}`,
      });
    } finally {
      setTestingEasyPost(false);
    }
  };

  useEffect(() => {
    fetch('/api/mssql/schema')
      .then((res) => res.json())
      .then((res) => setDdlScript(res.ddlScript || ''))
      .catch((err) => console.error('Failed to load MSSQL schema:', err));
  }, []);

  const handleSaveReturnAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onUpdateSettings({
      companyName,
      returnAddress: {
        name: returnName,
        company: returnCompany || companyName,
        street1: returnStreet1,
        street2: returnStreet2,
        city: returnCity,
        state: returnState,
        zip: returnZip,
        country: returnCountry,
        phone: returnPhone,
      },
    });
    setSaving(false);
    triggerSuccess();
  };

  const handleSaveCarrierDefaults = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onUpdateSettings({
      defaultDomesticCarrier,
      defaultDomesticService,
    });
    setSaving(false);
    triggerSuccess();
  };

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

  const handleTestMssqlConnection = async () => {
    setTestingMssql(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/mssql/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          server: mssqlServer,
          port: parseInt(mssqlPort, 10) || 1433,
          database: mssqlDatabase,
          user: mssqlUser,
          password: mssqlPassword,
          encrypt: mssqlEncrypt,
        }),
      });
      const data = await res.json();
      setTestResult(data);
      // Refresh parent settings
      await onUpdateSettings({
        mssqlServer,
        mssqlPort: parseInt(mssqlPort, 10) || 1433,
        mssqlDatabase,
        mssqlUser,
        mssqlPassword,
        mssqlEncrypt,
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        message: `Network error reaching app server test endpoint: ${err.message}`,
      });
    } finally {
      setTestingMssql(false);
    }
  };

  const handleSaveMssql = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onUpdateSettings({
      mssqlServer,
      mssqlPort: parseInt(mssqlPort, 10) || 1433,
      mssqlDatabase,
      mssqlUser,
      mssqlPassword,
      mssqlEncrypt,
    });
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
            onClick={() => setActiveSection('returnAddress')}
            className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeSection === 'returnAddress'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Business &amp; Return Address (FROM Labels)</span>
          </button>

          <button
            onClick={() => setActiveSection('carrierDefaults')}
            className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeSection === 'carrierDefaults'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>Domestic Carrier &amp; Rates</span>
          </button>

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
          {/* SECTION 0: BUSINESS NAME & RETURN ADDRESS (FROM LABELS) */}
          {activeSection === 'returnAddress' && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <Building className="w-5 h-5 text-indigo-600" />
                  <span>Business Name &amp; Return Address (FROM Section on Labels)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure your business name and ship-from address. This information prints in the <strong>FROM / RETURN ADDRESS</strong> block on all generated shipping labels and packing slips.
                </p>
              </div>

              <form onSubmit={handleSaveReturnAddress} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Business / Company Name *
                    </label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => {
                        setCompanyName(e.target.value);
                        setReturnCompany(e.target.value);
                      }}
                      placeholder="e.g. BlueCat Bobbins Shipping"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-800 font-bold focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Contact Person / Department
                    </label>
                    <input
                      type="text"
                      value={returnName}
                      onChange={(e) => setReturnName(e.target.value)}
                      placeholder="e.g. Shipping Dept or Jane Doe"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={returnPhone}
                      onChange={(e) => setReturnPhone(e.target.value)}
                      placeholder="e.g. (312) 555-0144"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Street Address Line 1 *
                    </label>
                    <input
                      type="text"
                      value={returnStreet1}
                      onChange={(e) => setReturnStreet1(e.target.value)}
                      placeholder="e.g. 100 Bobbin Way"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                      required
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Street Address Line 2 (Suite, Apt, Bldg)
                    </label>
                    <input
                      type="text"
                      value={returnStreet2}
                      onChange={(e) => setReturnStreet2(e.target.value)}
                      placeholder="e.g. Suite 100"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      value={returnCity}
                      onChange={(e) => setReturnCity(e.target.value)}
                      placeholder="e.g. Chicago"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      State / Province *
                    </label>
                    <input
                      type="text"
                      value={returnState}
                      onChange={(e) => setReturnState(e.target.value.toUpperCase())}
                      placeholder="e.g. IL"
                      maxLength={4}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-800 uppercase focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      ZIP / Postal Code *
                    </label>
                    <input
                      type="text"
                      value={returnZip}
                      onChange={(e) => setReturnZip(e.target.value)}
                      placeholder="e.g. 60601"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Country *
                    </label>
                    <input
                      type="text"
                      value={returnCountry}
                      onChange={(e) => setReturnCountry(e.target.value.toUpperCase())}
                      placeholder="e.g. US"
                      maxLength={3}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-800 uppercase font-bold focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                      required
                    />
                  </div>
                </div>

                {/* Live Preview Box */}
                <div className="pt-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 flex items-center space-x-1.5">
                    <Eye className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Live 4x6 Label "SHIP FROM" Block Preview:</span>
                  </label>
                  <div className="bg-slate-50 border-2 border-slate-900 p-4 rounded-xl max-w-sm">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 border-b border-slate-200 pb-1">
                      SHIP FROM (ORIGIN):
                    </div>
                    <div className="font-extrabold text-sm text-slate-900">{companyName || 'Business Name'}</div>
                    {returnName && <div className="text-xs font-semibold text-slate-700">{returnName}</div>}
                    <div className="text-xs text-slate-800 mt-1">{returnStreet1} {returnStreet2}</div>
                    <div className="text-xs font-bold text-slate-900">
                      {returnCity.toUpperCase()}, {returnState} {returnZip} {returnCountry.toUpperCase()}
                    </div>
                    {returnPhone && <div className="text-[11px] text-slate-500 mt-0.5">Ph: {returnPhone}</div>}
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-5 py-2.5 rounded-lg shadow-sm flex items-center space-x-2 cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saving ? 'Saving...' : 'Save & Update Label Sender Address'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* SECTION: DOMESTIC CARRIER & RATES DEFAULTS */}
          {activeSection === 'carrierDefaults' && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <Truck className="w-5 h-5 text-indigo-600" />
                  <span>Domestic Carrier &amp; Rates Configuration</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Configure your default domestic carrier and rate/service tier for US shipments. International orders continue to compare USPS vs. UPS dynamically.
                </p>
              </div>

              <form onSubmit={handleSaveCarrierDefaults} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Default Domestic Carrier
                    </label>
                    <select
                      value={defaultDomesticCarrier}
                      onChange={(e) => {
                        const val = e.target.value as CarrierType;
                        setDefaultDomesticCarrier(val);
                        if (val === 'USPS') setDefaultDomesticService('Priority');
                        else if (val === 'UPS') setDefaultDomesticService('Ground');
                        else if (val === 'FedEx') setDefaultDomesticService('Ground');
                      }}
                      className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    >
                      <option value="USPS">USPS (United States Postal Service)</option>
                      <option value="UPS">UPS (United Parcel Service)</option>
                      <option value="FedEx">FedEx (Federal Express)</option>
                      <option value="DHL">DHL Express</option>
                    </select>
                    <p className="text-[11px] text-slate-500 mt-1.5">
                      Primary carrier assigned to new domestic US orders automatically.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Default Service Tier / Rate Level
                    </label>
                    <select
                      value={defaultDomesticService}
                      onChange={(e) => setDefaultDomesticService(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    >
                      {defaultDomesticCarrier === 'USPS' && (
                        <>
                          <option value="Priority">USPS Priority Mail (2-Day)</option>
                          <option value="Ground Advantage">USPS Ground Advantage (3-5 Days)</option>
                          <option value="Express">USPS Priority Mail Express (Overnight)</option>
                        </>
                      )}
                      {defaultDomesticCarrier === 'UPS' && (
                        <>
                          <option value="Ground">UPS Ground (1-5 Days)</option>
                          <option value="2Day">UPS 2nd Day Air</option>
                          <option value="NextDay">UPS Next Day Air</option>
                        </>
                      )}
                      {defaultDomesticCarrier === 'FedEx' && (
                        <>
                          <option value="Ground">FedEx Ground (1-5 Days)</option>
                          <option value="2Day">FedEx 2Day</option>
                          <option value="Priority Overnight">FedEx Priority Overnight</option>
                        </>
                      )}
                      {defaultDomesticCarrier === 'DHL' && (
                        <>
                          <option value="Express">DHL Express Domestic</option>
                        </>
                      )}
                    </select>
                    <p className="text-[11px] text-slate-500 mt-1.5">
                      Default service rate level applied to batch print and rate calculations.
                    </p>
                  </div>
                </div>

                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex items-start space-x-3 text-xs text-indigo-900">
                  <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold">Scope &amp; Custom Overrides</div>
                    <p className="text-indigo-800 text-[11px] mt-0.5">
                      This setting updates default rates and label purchasing for domestic orders. You can still compare live rates or manually pick a different carrier on any order at any time.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-sm flex items-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saving ? 'Saving...' : 'Save Carrier & Rate Defaults'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

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

                {easyPostTestResult && (
                  <div
                    className={`p-3.5 rounded-lg text-xs font-semibold flex items-start space-x-2.5 ${
                      easyPostTestResult.success
                        ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                        : 'bg-rose-50 text-rose-900 border border-rose-200'
                    }`}
                  >
                    <div className="shrink-0 mt-0.5">
                      {easyPostTestResult.success ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-rose-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-bold">{easyPostTestResult.success ? 'EasyPost Connected Successfully!' : 'EasyPost Connection Failed'}</p>
                      <p className="font-normal text-[11px] mt-0.5 whitespace-pre-wrap">{easyPostTestResult.message}</p>
                    </div>
                  </div>
                )}

                <div className="pt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleTestEasyPost}
                    disabled={testingEasyPost}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs px-4 py-2.5 rounded-lg border border-slate-300 flex items-center space-x-2 cursor-pointer disabled:opacity-50"
                  >
                    <Truck className="w-4 h-4 text-indigo-600" />
                    <span>{testingEasyPost ? 'Testing API Key...' : 'Test EasyPost Connection'}</span>
                  </button>

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
                  Configure real MS SQL Server connection credentials, test database accessibility, and view table creation DDL scripts.
                </p>
              </div>

              {/* Status Banner */}
              <div
                className={`p-4 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  settings.mssqlConnected
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}
              >
                <div className="flex items-start space-x-2.5">
                  {settings.mssqlConnected ? (
                    <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-bold block">
                      {settings.mssqlConnected
                        ? `Connected to MS SQL Database (${settings.mssqlServer})`
                        : 'MS SQL Server Disconnected or Unreachable'}
                    </span>
                    <p className="mt-0.5 text-[11px] opacity-90">
                      {settings.mssqlConnected
                        ? 'The node backend is successfully connected to your external MS SQL instance.'
                        : settings.mssqlError ||
                          'Could not establish socket connection to MS SQL Server. The app is falling back to local operational memory state.'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleTestMssqlConnection}
                  disabled={testingMssql}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-3.5 py-1.5 rounded-lg shrink-0 flex items-center justify-center space-x-1.5 transition-colors cursor-pointer disabled:opacity-50 text-xs"
                >
                  <Server className="w-3.5 h-3.5" />
                  <span>{testingMssql ? 'Testing...' : 'Test Connection'}</span>
                </button>
              </div>

              {/* Form Controls */}
              <form onSubmit={handleSaveMssql} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      MS SQL Server Host / IP
                    </label>
                    <input
                      type="text"
                      value={mssqlServer}
                      onChange={(e) => setMssqlServer(e.target.value)}
                      placeholder="e.g. sql.example.com or 192.168.1.50"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Port (Default: 1433)</label>
                    <input
                      type="number"
                      value={mssqlPort}
                      onChange={(e) => setMssqlPort(e.target.value)}
                      placeholder="1433"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Database Name</label>
                    <input
                      type="text"
                      value={mssqlDatabase}
                      onChange={(e) => setMssqlDatabase(e.target.value)}
                      placeholder="e.g. ShippingProductionDB"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">SQL User Account</label>
                    <input
                      type="text"
                      value={mssqlUser}
                      onChange={(e) => setMssqlUser(e.target.value)}
                      placeholder="e.g. sa or app_user"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">SQL User Password</label>
                    <input
                      type="password"
                      value={mssqlPassword}
                      onChange={(e) => setMssqlPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center space-x-2 pt-6">
                    <input
                      type="checkbox"
                      id="mssqlEncrypt"
                      checked={mssqlEncrypt}
                      onChange={(e) => setMssqlEncrypt(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                    />
                    <label htmlFor="mssqlEncrypt" className="text-xs font-medium text-slate-700 cursor-pointer">
                      Require Encrypted SSL Connection
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={handleTestMssqlConnection}
                    disabled={testingMssql}
                    className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs px-4 py-2 rounded-lg border border-indigo-200 cursor-pointer transition-colors disabled:opacity-50"
                  >
                    {testingMssql ? 'Testing connection...' : 'Test Connection Now'}
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-5 py-2 rounded-lg shadow-sm cursor-pointer transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save MS SQL Connection Config'}
                  </button>
                </div>
              </form>

              {/* Test Diagnostics Result Box */}
              {testResult && (
                <div
                  className={`p-4 rounded-xl border text-xs font-mono overflow-x-auto ${
                    testResult.success
                      ? 'bg-emerald-950 border-emerald-800 text-emerald-300'
                      : 'bg-rose-950 border-rose-800 text-rose-300'
                  }`}
                >
                  <span className="font-bold block mb-1">
                    {testResult.success ? '✅ CONNECTION SUCCESSFUL:' : '❌ CONNECTION FAILED:'}
                  </span>
                  <p>{testResult.message}</p>
                  {testResult.version && (
                    <p className="mt-1 text-[11px] text-emerald-400 opacity-80">
                      Server Version: {testResult.version}
                    </p>
                  )}
                </div>
              )}

              {/* Guide box for local / personal web server setup */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs text-slate-600">
                <h4 className="font-bold text-slate-800 flex items-center space-x-1.5">
                  <Server className="w-4 h-4 text-indigo-600" />
                  <span>Connecting Your Personal or Remote MS SQL Database</span>
                </h4>
                <p>
                  To connect this cloud-hosted app to an MS SQL Server database on your local network or web server:
                </p>
                <ul className="list-disc list-inside space-y-1 pl-1 text-[11px] text-slate-600">
                  <li>
                    <strong>Network Accessibility:</strong> Ensure your SQL Server host domain or public IP is reachable over the Internet. (Internal hostnames like <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">sql-east.internal.company.net</code> or <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">localhost</code> cannot be resolved from Cloud Run).
                  </li>
                  <li>
                    <strong>Firewall &amp; Port:</strong> Open TCP Port <strong>1433</strong> in your firewall / router port forwarding settings for SQL Server.
                  </li>
                  <li>
                    <strong>SQL Authentication:</strong> Enable <em>SQL Server and Windows Authentication mode</em> in SQL Server Management Studio (SSMS) and create a SQL user account.
                  </li>
                  <li>
                    <strong>Environment Variables:</strong> You can also set <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">MSSQL_SERVER</code>, <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">MSSQL_DATABASE</code>, <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">MSSQL_USER</code>, and <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">MSSQL_PASSWORD</code> in your environment.
                  </li>
                </ul>
              </div>

              {/* SQL DDL Code Snippet Box */}
              <div className="space-y-2 pt-2">
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
