export function formatOrderId(id: string | undefined | null): string {
  if (!id) return '';
  const str = String(id).trim();
  return str.length > 10 ? str.slice(-10) : str;
}

export type OrderStatus = 'pending_validation' | 'address_error' | 'ready_to_ship' | 'shipped' | 'cancelled';

export type CarrierType = 'USPS' | 'FedEx' | 'UPS' | 'DHL';

export interface OrderItem {
  id?: string;
  sku: string;
  name: string;
  itemType?: string;
  color?: string;
  quantity: number;
  price: number;
  weightOz?: number;
  hsTariffNumber?: string;
  hs_tariff_number?: string;
}

export interface ShippingOrder {
  id: string;
  orderNumber: string;
  recipientName: string;
  company?: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string;
  email?: string;
  orderDate: string;
  status: OrderStatus;
  boxId: string;
  boxName?: string;
  items: OrderItem[];
  weightOz: number;
  declaredValue: number;
  addressValidated: boolean;
  addressNotes?: string;
  validationErrors?: string[];
  trackingNumber?: string;
  carrier?: CarrierType;
  serviceLevel?: string;
  shippingCost?: number;
  shippingDate?: string;
  labelUrl?: string;
  easyPostLabelUrl?: string;
  easypostShipmentId?: string;
  labelPngData?: string;
  labelPngBase64?: string;
  labelBinary?: any;
  hasLabelData?: boolean;
  LabelData?: any;
  isReshipment?: boolean;
  reshippedFromOrderNumber?: string;
  reshipReason?: string;
  marketplace?: string;
  marketplacenotified?: 'Pending' | 'Yes' | 'No' | string;
  createdAt?: string;
  updatedAt?: string;
  sourceTable?: string;
  env?: 'dev' | 'prod';
}

export interface PackageType {
  id: string;
  code: string;
  name: string;
  length: number;
  width: number;
  height: number;
  weightEmptyOz: number;
  maxWeightLbs: number;
  easyPostType: string;
  isActive: boolean;
}

export interface ReturnAddress {
  name: string;
  company: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
}

export interface AppSetting {
  packingSlipContent: string;
  easyPostApiKey: string;
  easyPostTestApiKey?: string;
  easyPostProdApiKey?: string;
  easyPostMode: 'test' | 'production';
  appEnv?: 'dev' | 'prod';
  mssqlServer: string;
  mssqlPort?: number;
  mssqlDatabase: string;
  mssqlUser: string;
  mssqlPassword?: string;
  mssqlEncrypt?: boolean;
  mssqlConnected: boolean;
  mssqlError?: string | null;
  companyName: string;
  returnAddress: ReturnAddress;
  appPassword?: string;
  defaultDomesticCarrier?: CarrierType;
  defaultDomesticService?: string;
  defaultInternationalCarrier?: CarrierType;
  defaultInternationalService?: string;
  defaultHsTariffCode?: string;
  qzPrinterLabel?: string;
  qzPrinterPackingSlip?: string;
  qzAutoPrintOnPurchase?: boolean;
  qzSilentPrinting?: boolean;
}

export interface BatchLabelResult {
  success: boolean;
  processedOrders: ShippingOrder[];
  totalCost: number;
  batchId: string;
  createdAt: string;
  errors?: string[];
}

export interface AddressValidationResult {
  isValid: boolean;
  orderId: string;
  originalAddress: {
    street1: string;
    street2?: string;
    city: string;
    state: string;
    zip: string;
  };
  suggestedAddress?: {
    street1: string;
    street2?: string;
    city: string;
    state: string;
    zip: string;
  };
  messages: string[];
}

export interface MonthlyReportData {
  month: string;
  monthName: string;
  year: number;
  itemCount: number;
  shipmentCount: number;
  totalCost: number;
  avgCostPerPackage: number;
  carrierBreakdown: Record<string, number>;
  boxBreakdown: Record<string, number>;
}

export interface ScanFormType {
  id: string;
  status: 'created' | 'submitted';
  formUrl?: string;
  createdAt: string;
  formDate: string;
  totalPackages: number;
  trackingNumbers: string[];
  orderNumbers: string[];
  carrier: string;
  batchId?: string;
  easypostId?: string;
  serviceBreakdown?: Record<string, number>;
  senderAddress?: {
    name?: string;
    company?: string;
    street1?: string;
    street2?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
    phone?: string;
  };
}

export interface UserSession {
  isAuthenticated: boolean;
  username: string;
  fullName?: string;
  role: string;
  loginTime?: string;
}

export interface User {
  id?: number | string;
  username: string;
  passwordHash?: string;
  fullName?: string;
  role: string;
  createdAt?: string;
  lastLoginAt?: string;
}
