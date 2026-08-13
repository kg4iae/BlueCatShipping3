import React, { useState, useEffect } from 'react';
import { ShippingOrder, PackageType, AppSetting, CarrierType } from './types';
import { Navbar } from './components/Navbar';
import { LoginModal } from './components/LoginModal';
import { Dashboard } from './components/Dashboard';
import { AddressFixModal } from './components/AddressFixModal';
import { CompareRatesModal } from './components/CompareRatesModal';
import { OrderDetailModal } from './components/OrderDetailModal';
import { ManualOrderModal } from './components/ManualOrderModal';
import { BatchPrintModal } from './components/BatchPrintModal';
import { LabelPrintDialog } from './components/LabelPrintDialog';
import { SearchShipped } from './components/SearchShipped';
import { ReshipModal } from './components/ReshipModal';
import { ScanFormModal } from './components/ScanFormModal';
import { Reports } from './components/Reports';
import { SettingsPage } from './components/SettingsPage';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'search' | 'reports' | 'settings'>('dashboard');

  const [orders, setOrders] = useState<ShippingOrder[]>([]);
  const [packages, setPackages] = useState<PackageType[]>([]);
  const [settings, setSettings] = useState<AppSetting | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [hasValidatedOnLoad, setHasValidatedOnLoad] = useState<boolean>(false);

  // Modals state
  const [addressFixOrder, setAddressFixOrder] = useState<ShippingOrder | null>(null);
  const [compareRatesOrder, setCompareRatesOrder] = useState<ShippingOrder | null>(null);
  const [orderDetailOrder, setOrderDetailOrder] = useState<ShippingOrder | null>(null);
  const [showManualOrderModal, setShowManualOrderModal] = useState<boolean>(false);
  const [showScanFormModal, setShowScanFormModal] = useState<boolean>(false);
  const [printOrders, setPrintOrders] = useState<ShippingOrder[] | null>(null);
  const [purchasedLabelOrder, setPurchasedLabelOrder] = useState<ShippingOrder | null>(null);
  const [reshipTargetOrder, setReshipTargetOrder] = useState<ShippingOrder | null>(null);

  // Notification Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Initial Data Fetch
  const refreshAllData = async () => {
    try {
      setLoading(true);
      const [ordersRes, pkgsRes, settingsRes] = await Promise.all([
        fetch('/api/orders'),
        fetch('/api/packages'),
        fetch('/api/settings'),
      ]);

      const ordersData = await ordersRes.json();
      const pkgsData = await pkgsRes.json();
      const settingsData = await settingsRes.json();

      setOrders(ordersData);
      setPackages(pkgsData);
      setSettings(settingsData);

      // Requirement: Once the dashboard is loaded, it should validate addresses with EasyPost and report any issues
      if (!hasValidatedOnLoad && Array.isArray(ordersData)) {
        setHasValidatedOnLoad(true);
        const pendingCheckOrders = ordersData.filter((o) => o.status === 'pending_validation');
        if (pendingCheckOrders.length > 0) {
          fetch('/api/orders/validate-addresses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
          })
            .then((r) => r.json())
            .then((valRes) => {
              if (valRes.orders) {
                setOrders(valRes.orders);
                showToast('EasyPost validated addresses on queue load.', 'info');
              }
            })
            .catch(() => {});
        }
      }
    } catch (err) {
      console.error('Data load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAllData();
  }, []);

  // Update Box Selection for an Order (Writes back to DB)
  const handleUpdateOrderBox = async (orderId: string, boxId: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boxId }),
      });
      const updatedOrder = await res.json();
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updatedOrder : o)));
      showToast(`Updated box selection for ${updatedOrder.orderNumber} in DB.`, 'success');
    } catch (err) {
      showToast('Failed to update box selection in database.', 'error');
    }
  };

  // Address Validation Request
  const handleValidateAddresses = async (orderIds?: string[]) => {
    try {
      const res = await fetch('/api/orders/validate-addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderIds }),
      });
      const data = await res.json();
      if (data.orders) {
        setOrders(data.orders);
        showToast(data.message, 'success');
      }
    } catch (err) {
      showToast('Failed to run address validation with EasyPost.', 'error');
    }
  };

  // Save Fixed Address
  const handleSaveFixedAddress = async (orderId: string, updatedFields: Partial<ShippingOrder>) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields),
      });
      const updated = await res.json();
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      showToast(`Address for ${updated.orderNumber} updated & re-validated!`, 'success');
    } catch (err) {
      showToast('Error updating address in database.', 'error');
    }
  };

  // Save Order Details (Address, Box, Weight, Carrier, etc.)
  const handleSaveOrderDetails = async (orderId: string, updates: Partial<ShippingOrder>) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const updated = await res.json();
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      showToast(`Order #${updated.orderNumber} updated & saved to database!`, 'success');
    } catch (err) {
      showToast('Error saving order updates to database.', 'error');
    }
  };

  // Rate Selection Handler
  const handleSelectRate = async (
    orderId: string,
    carrier: 'USPS' | 'UPS',
    serviceLevel: string,
    rate: number
  ) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          carrier,
          serviceLevel,
          shippingCost: rate,
        }),
      });
      const updated = await res.json();
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      showToast(
        `Selected ${carrier} ${serviceLevel} ($${rate.toFixed(2)}) for #${updated.orderNumber}`,
        'success'
      );
    } catch (err) {
      showToast('Failed to save selected carrier rate.', 'error');
    }
  };

  // Create Manual Order
  const handleCreateManualOrder = async (orderData: any) => {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create manual order');
    }
    const newOrder = await res.json();
    setOrders((prev) => [newOrder, ...prev]);
    showToast(`Created manual order ${newOrder.orderNumber}!`, 'success');
  };

  // Batch Label Generation
  const handleGenerateBatchLabels = async (selectedIds: string[]) => {
    try {
      const res = await fetch('/api/orders/create-labels-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderIds: selectedIds }),
      });
      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || 'Failed to generate labels.', 'error');
        return;
      }

      const updated = data.processedOrders || data.orders;
      if (data.success && updated && updated.length > 0) {
        // Update local orders state
        setOrders((prev) =>
          prev.map((o) => {
            const match = updated.find((p: ShippingOrder) => p.id === o.id || p.orderNumber === o.orderNumber);
            return match || o;
          })
        );

        // Open PDF batch printer modal
        setPrintOrders(updated);
        showToast(`Purchased ${updated.length} EasyPost label(s) & packing slip(s) ($${data.totalCost || 0} written to DB)!`, 'success');
      }
    } catch (err) {
      showToast('Failed to connect to EasyPost label creation service.', 'error');
    }
  };

  // Single EasyPost Label Purchase Handler
  const handlePurchaseSingleLabel = async (
    orderId: string,
    carrier?: CarrierType,
    serviceLevel?: string,
    rateCost?: number
  ) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/purchase-label`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ carrier, serviceLevel, rateCost }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to purchase EasyPost label.', 'error');
        return;
      }
      if (data.order) {
        setOrders((prev) => prev.map((o) => (o.id === orderId || o.orderNumber === orderId ? data.order : o)));
        if (orderDetailOrder?.id === orderId) {
          setOrderDetailOrder(data.order);
        }
        setPurchasedLabelOrder(data.order);
        showToast(data.message || `Purchased EasyPost label for Order #${data.order.orderNumber}!`, 'success');
      }
    } catch (err) {
      showToast('Failed to purchase label from EasyPost.', 'error');
    }
  };

  // Batch EasyPost Label Purchase Handler
  const handlePurchaseBatchLabels = async (orderIds: string[]) => {
    try {
      const res = await fetch('/api/orders/batch-purchase-labels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderIds }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to purchase batch labels.', 'error');
        return;
      }
      const updated = data.processedOrders || data.orders;
      if (updated && updated.length > 0) {
        setOrders((prev) =>
          prev.map((o) => {
            const match = updated.find((p: ShippingOrder) => p.id === o.id || p.orderNumber === o.orderNumber);
            return match || o;
          })
        );
        setPrintOrders(updated);
        showToast(data.message || `Purchased EasyPost labels for ${updated.length} order(s)!`, 'success');
      }
    } catch (err) {
      showToast('Failed to purchase batch labels from EasyPost.', 'error');
    }
  };

  // Re-Ship Request
  const handleConfirmReship = async (orderId: string, reason: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/reship`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (data.success && data.order) {
        setOrders((prev) => [data.order, ...prev]);
        setActiveTab('dashboard');
        showToast(data.message, 'success');
      }
    } catch (err) {
      showToast('Failed to create re-shipment order.', 'error');
    }
  };

  // Settings & Package Handlers
  const handleUpdateSettings = async (updated: Partial<AppSetting>) => {
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      const data = await res.json();
      if (data.settings) {
        setSettings(data.settings);
        showToast('Settings saved to database!', 'success');
      }
    } catch (err) {
      showToast('Failed to save settings to database.', 'error');
    }
  };

  const handleCreatePackage = async (pkgData: Partial<PackageType>) => {
    try {
      const res = await fetch('/api/packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pkgData),
      });
      const newPkg = await res.json();
      setPackages((prev) => [...prev, newPkg]);
      showToast(`Added box ${newPkg.name} to packages DB table!`, 'success');
    } catch (err) {
      showToast('Failed to add package box to database.', 'error');
    }
  };

  const handleDeletePackage = async (id: string) => {
    try {
      await fetch(`/api/packages/${id}`, { method: 'DELETE' });
      setPackages((prev) => prev.filter((p) => p.id !== id));
      showToast('Package box deleted from DB table.', 'info');
    } catch (err) {
      showToast('Failed to delete package.', 'error');
    }
  };

  // MS SQL Sync Handler
  const handleSyncMssql = async (action: 'pull' | 'push' = 'pull') => {
    try {
      const res = await fetch('/api/mssql/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.orders) {
          setOrders(data.orders);
        }
        showToast(data.message, 'success');
      } else {
        showToast(data.message || 'Sync with MS SQL failed', 'error');
      }
    } catch (err) {
      showToast('Error syncing with MS SQL database.', 'error');
    }
  };

  if (!isAuthenticated) {
    return <LoginModal onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  const pendingCount = orders.filter((o) => o.status === 'pending_validation').length;
  const errorCount = orders.filter((o) => o.status === 'address_error').length;
  const readyCount = orders.filter((o) => o.status === 'ready_to_ship').length;
  const shippedOrders = orders.filter((o) => o.status === 'shipped');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      {/* Toast Notification Banner */}
      {toast && (
        <div className="fixed top-20 right-6 z-50 animate-bounce">
          <div
            className={`px-4 py-3 rounded-xl shadow-xl text-xs font-semibold flex items-center space-x-2 border backdrop-blur-md ${
              toast.type === 'success'
                ? 'bg-emerald-900/90 text-emerald-100 border-emerald-500/40'
                : toast.type === 'error'
                ? 'bg-rose-900/90 text-rose-100 border-rose-500/40'
                : 'bg-indigo-900/90 text-indigo-100 border-indigo-500/40'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-300" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-300" />}
            {toast.type === 'info' && <Info className="w-4 h-4 text-indigo-300" />}
            <span>{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-2 hover:opacity-80 cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openManualOrderModal={() => setShowManualOrderModal(true)}
        openScanFormModal={() => setShowScanFormModal(true)}
        pendingValidationCount={pendingCount}
        addressErrorCount={errorCount}
        readyToShipCount={readyCount}
        mssqlConnected={settings?.mssqlConnected ?? true}
        easyPostMode={settings?.easyPostMode ?? 'test'}
        onLogout={() => setIsAuthenticated(false)}
        onSyncMssql={handleSyncMssql}
      />

      {/* Primary Workspace View Switcher */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <Dashboard
            orders={orders}
            packages={packages}
            settings={settings || ({} as AppSetting)}
            onUpdateOrderBox={handleUpdateOrderBox}
            onValidateAddresses={handleValidateAddresses}
            onOpenAddressFixModal={(order) => setAddressFixOrder(order)}
            onOpenCompareRatesModal={(order) => setCompareRatesOrder(order)}
            onOpenOrderDetailModal={(order) => setOrderDetailOrder(order)}
            onGenerateBatchLabels={handleGenerateBatchLabels}
            onPurchaseLabel={handlePurchaseSingleLabel}
            onRefreshData={refreshAllData}
            onSyncMssql={handleSyncMssql}
            onOpenScanFormModal={() => setShowScanFormModal(true)}
            loading={loading}
          />
        )}

        {activeTab === 'search' && (
          <SearchShipped
            shippedOrders={shippedOrders}
            settings={settings || ({} as AppSetting)}
            onReshipOrder={(order) => setReshipTargetOrder(order)}
            onOpenPrintModal={(ordersToPrint) => setPrintOrders(ordersToPrint)}
            onOpenScanFormModal={() => setShowScanFormModal(true)}
            onOpenOrderDetailModal={(order) => setOrderDetailOrder(order)}
          />
        )}

        {activeTab === 'reports' && <Reports />}

        {activeTab === 'settings' && settings && (
          <SettingsPage
            settings={settings}
            packages={packages}
            onUpdateSettings={handleUpdateSettings}
            onCreatePackage={handleCreatePackage}
            onDeletePackage={handleDeletePackage}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs font-medium text-slate-500">
        ShipStation Management Portal &bull; EasyPost API &amp; MSSQL Integration &bull; {new Date().getFullYear()}
      </footer>

      {/* MODALS */}
      {addressFixOrder && (
        <AddressFixModal
          order={addressFixOrder}
          onClose={() => setAddressFixOrder(null)}
          onSaveAddress={handleSaveFixedAddress}
        />
      )}

      {compareRatesOrder && (
        <CompareRatesModal
          order={compareRatesOrder}
          packages={packages}
          settings={settings || ({} as AppSetting)}
          onClose={() => setCompareRatesOrder(null)}
          onSelectRate={handleSelectRate}
          onPurchaseLabel={handlePurchaseSingleLabel}
        />
      )}

      {orderDetailOrder && (
        <OrderDetailModal
          order={orderDetailOrder}
          packages={packages}
          settings={settings || ({} as AppSetting)}
          onClose={() => setOrderDetailOrder(null)}
          onSaveOrder={handleSaveOrderDetails}
          onPurchaseLabel={handlePurchaseSingleLabel}
          onOpenCompareRatesModal={(order) => {
            setOrderDetailOrder(null);
            setCompareRatesOrder(order);
          }}
        />
      )}

      {showManualOrderModal && (
        <ManualOrderModal
          packages={packages}
          onClose={() => setShowManualOrderModal(false)}
          onCreateOrder={handleCreateManualOrder}
        />
      )}

      {showScanFormModal && settings && (
        <ScanFormModal
          shippedOrders={shippedOrders}
          settings={settings}
          onClose={() => setShowScanFormModal(false)}
          onScanFormCreated={(sf) => showToast(`USPS SCAN Form (${sf.id}) generated successfully!`, 'success')}
        />
      )}

      {printOrders && settings && (
        <BatchPrintModal
          orders={printOrders}
          settings={settings}
          onClose={() => setPrintOrders(null)}
          onPurchaseBatchLabels={handlePurchaseBatchLabels}
        />
      )}

      {purchasedLabelOrder && (
        <LabelPrintDialog
          order={purchasedLabelOrder}
          settings={settings}
          onClose={() => setPurchasedLabelOrder(null)}
        />
      )}

      {reshipTargetOrder && (
        <ReshipModal
          order={reshipTargetOrder}
          onClose={() => setReshipTargetOrder(null)}
          onConfirmReship={handleConfirmReship}
        />
      )}
    </div>
  );
}
