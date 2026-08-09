export type OrderStatus = 'pending_validation' | 'address_error' | 'ready_to_ship' | 'shipped' | 'cancelled';

export type CarrierType = 'USPS' | 'FedEx' | 'UPS' | 'DHL';

export interface OrderItem {
  id?: string;
  sku: string;
  name: string;
  quantity: number;
  price: number;
  weightOz?: number;
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
  labelPngData?: string;
  isReshipment?: boolean;
  reshippedFromOrderNumber?: string;
  reshipReason?: string;
  createdAt?: string;
  updatedAt?: string;
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
  easyPostMode: 'test' | 'production';
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

export interface UserSession {
  isAuthenticated: boolean;
  username: string;
  role: string;
  loginTime?: string;
}
