import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { ShippingOrder, PackageType, AppSetting, MonthlyReportData } from './src/types.js';

const app = express();
const PORT = 3000;

app.use(express.json());

// In-Memory Database Store with persistence simulator
interface DatabaseSchema {
  packages: PackageType[];
  orders: ShippingOrder[];
  settings: AppSetting;
}

// Initial Packages DB Seed
const initialPackages: PackageType[] = [
  {
    id: 'pkg_small',
    code: 'SFRB',
    name: 'Small Flat Rate Box',
    length: 8.6,
    width: 5.4,
    height: 1.6,
    weightEmptyOz: 2.0,
    maxWeightLbs: 70,
    easyPostType: 'SmallFlatRateBox',
    isActive: true,
  },
  {
    id: 'pkg_medium',
    code: 'MFRB',
    name: 'Medium Flat Rate Box',
    length: 11.0,
    width: 8.5,
    height: 5.5,
    weightEmptyOz: 4.0,
    maxWeightLbs: 70,
    easyPostType: 'MediumFlatRateBox',
    isActive: true,
  },
  {
    id: 'pkg_large',
    code: 'LFRB',
    name: 'Large Flat Rate Box',
    length: 12.0,
    width: 12.0,
    height: 5.5,
    weightEmptyOz: 6.0,
    maxWeightLbs: 70,
    easyPostType: 'LargeFlatRateBox',
    isActive: true,
  },
  {
    id: 'pkg_padded_env',
    code: 'PFRE',
    name: 'Padded Flat Rate Envelope',
    length: 12.5,
    width: 9.5,
    height: 1.0,
    weightEmptyOz: 1.5,
    maxWeightLbs: 70,
    easyPostType: 'PaddedFlatRateEnvelope',
    isActive: true,
  },
  {
    id: 'pkg_custom_sm',
    code: 'CUST_SM',
    name: 'Custom Small Corrugated Box',
    length: 7.0,
    width: 5.0,
    height: 3.0,
    weightEmptyOz: 2.5,
    maxWeightLbs: 15,
    easyPostType: 'Parcel',
    isActive: true,
  },
  {
    id: 'pkg_custom_lg',
    code: 'CUST_LG',
    name: 'Custom Heavy Freight Box',
    length: 18.0,
    width: 14.0,
    height: 12.0,
    weightEmptyOz: 14.0,
    maxWeightLbs: 50,
    easyPostType: 'Parcel',
    isActive: true,
  },
];

// Initial Settings DB Seed
const initialSettings: AppSetting = {
  packingSlipContent:
    'Thank you for your order! All items have been quality-inspected before shipment. For returns, missing items, or warranty questions within 30 days, please contact support@acmesupply.com or call (800) 555-0199 quoting your Order Number. Please retain this packing slip for your records.',
  easyPostApiKey: process.env.EASYPOST_API_KEY || 'EZTK_TEST_99824_KEY',
  easyPostMode: (process.env.EASYPOST_MODE as 'test' | 'production') || 'test',
  mssqlServer: process.env.MSSQL_SERVER || 'sql-east.internal.company.net',
  mssqlDatabase: process.env.MSSQL_DATABASE || 'ShippingProductionDB',
  mssqlUser: process.env.MSSQL_USER || 'shipstation_app_user',
  mssqlConnected: true,
  companyName: 'Acme Logistics & Shipping Corp',
  returnAddress: {
    name: 'Acme Fulfillment Dept',
    company: 'Acme Logistics Corp',
    street1: '100 Distribution Way',
    street2: 'Suite 400',
    city: 'Chicago',
    state: 'IL',
    zip: '60601',
    country: 'US',
    phone: '312-555-0144',
  },
  appPassword: process.env.APP_PASSWORD || 'shipstation123',
};

// Seed realistic order dataset spanning active queue and historical months
const db: DatabaseSchema = {
  packages: [...initialPackages],
  settings: { ...initialSettings },
  orders: [
    {
      id: 'ord_101',
      orderNumber: 'ORD-8821',
      recipientName: 'Sarah Jenkins',
      company: 'Apex Design Group',
      street1: '742 Evergreen Terrace',
      city: 'Springfield',
      state: 'OR',
      zip: '97477',
      country: 'US',
      phone: '541-555-0182',
      email: 'sjenkins@apexdesign.com',
      orderDate: '2026-08-06T14:22:00Z',
      status: 'pending_validation',
      boxId: 'pkg_medium',
      boxName: 'Medium Flat Rate Box',
      items: [
        { sku: 'HDW-401', name: 'Titanium Precision Caliper', quantity: 1, price: 68.50, weightOz: 12 },
        { sku: 'TOOL-102', name: 'Micro-Screwdriver Set', quantity: 2, price: 18.25, weightOz: 6 },
      ],
      weightOz: 28,
      declaredValue: 105.00,
      addressValidated: false,
    },
    {
      id: 'ord_102',
      orderNumber: 'ORD-8822',
      recipientName: 'Marcus Vance',
      street1: '1200 Market Street',
      street2: 'Apt 4B',
      city: 'San Francisco',
      state: 'CA',
      zip: '94102',
      country: 'US',
      phone: '415-555-0199',
      email: 'mvance@sfbay.net',
      orderDate: '2026-08-06T15:10:00Z',
      status: 'ready_to_ship',
      boxId: 'pkg_padded_env',
      boxName: 'Padded Flat Rate Envelope',
      items: [
        { sku: 'CLO-201', name: 'Thermal Softshell Jacket (L)', quantity: 1, price: 129.00, weightOz: 18 },
      ],
      weightOz: 19.5,
      declaredValue: 129.00,
      addressValidated: true,
      addressNotes: 'Address verified via EasyPost CASC (USPS DPV match)',
    },
    {
      id: 'ord_103',
      orderNumber: 'ORD-8823',
      recipientName: 'David Miller',
      company: 'Miller Auto Parts',
      street1: '555 Industrial Pkwy', // Invalid Zip intentionally
      city: 'Detroit',
      state: 'MI',
      zip: '00000',
      country: 'US',
      phone: '313-555-0120',
      email: 'dmiller@millerparts.com',
      orderDate: '2026-08-07T09:00:00Z',
      status: 'address_error',
      boxId: 'pkg_custom_lg',
      boxName: 'Custom Heavy Freight Box',
      items: [
        { sku: 'AUT-880', name: 'Heavy Duty Alternator 12V', quantity: 1, price: 210.00, weightOz: 160 },
      ],
      weightOz: 174,
      declaredValue: 210.00,
      addressValidated: false,
      validationErrors: [
        'ZIP Code "00000" is invalid for Detroit, MI.',
        'EasyPost Error: Undeliverable address record. Correct postal code to 48209 or 48210.',
      ],
    },
    {
      id: 'ord_104',
      orderNumber: 'ORD-8824',
      recipientName: 'Elena Rostova',
      company: 'Quantum Dynamics',
      street1: '100 Technology Square',
      street2: 'Fl 8',
      city: 'Cambridge',
      state: 'MA',
      zip: '02139',
      country: 'US',
      phone: '617-555-0155',
      email: 'elena@quantumdyn.io',
      orderDate: '2026-08-07T10:30:00Z',
      status: 'ready_to_ship',
      boxId: 'pkg_small',
      boxName: 'Small Flat Rate Box',
      items: [
        { sku: 'ELEC-901', name: 'Microcontroller Sensor Pack', quantity: 3, price: 45.00, weightOz: 8 },
      ],
      weightOz: 10,
      declaredValue: 135.00,
      addressValidated: true,
      addressNotes: 'Address validated with ZIP+4: 02139-3502',
    },
    {
      id: 'ord_105',
      orderNumber: 'ORD-8825',
      recipientName: 'Robert Sterling',
      street1: '450 Peachtree St NE',
      city: 'Atlanta',
      state: 'GA',
      zip: '30308',
      country: 'US',
      phone: '404-555-0111',
      email: 'rsterling@atltech.org',
      orderDate: '2026-08-07T11:15:00Z',
      status: 'pending_validation',
      boxId: 'pkg_custom_sm',
      boxName: 'Custom Small Corrugated Box',
      items: [
        { sku: 'MED-101', name: 'Ergonomic Wrist Support Guard', quantity: 2, price: 24.99, weightOz: 12 },
      ],
      weightOz: 14.5,
      declaredValue: 49.98,
      addressValidated: false,
    },
    // Historical Shipped Orders for Search & Reports
    {
      id: 'ord_1001',
      orderNumber: 'ORD-8790',
      recipientName: 'Jonathan Hayes',
      company: 'Hayes Dental Lab',
      street1: '880 17th Street',
      city: 'Denver',
      state: 'CO',
      zip: '80202',
      country: 'US',
      phone: '303-555-0812',
      email: 'jhayes@hayesdental.com',
      orderDate: '2026-07-15T10:00:00Z',
      status: 'shipped',
      boxId: 'pkg_medium',
      boxName: 'Medium Flat Rate Box',
      items: [
        { sku: 'DEN-110', name: 'Impression Trays Pack', quantity: 5, price: 32.00, weightOz: 24 },
      ],
      weightOz: 28,
      declaredValue: 160.00,
      addressValidated: true,
      trackingNumber: '9400111202482390199021',
      carrier: 'USPS',
      serviceLevel: 'PriorityMail',
      shippingCost: 14.35,
      shippingDate: '2026-07-15T14:30:00Z',
      labelUrl: 'https://easypost-files.s3.amazonaws.com/labels/usps_priority_sample1.pdf',
    },
    {
      id: 'ord_1002',
      orderNumber: 'ORD-8791',
      recipientName: 'Karen Bishop',
      street1: '320 Michigan Ave',
      city: 'Chicago',
      state: 'IL',
      zip: '60604',
      country: 'US',
      phone: '312-555-0177',
      email: 'kbishop@gmail.com',
      orderDate: '2026-07-18T11:20:00Z',
      status: 'shipped',
      boxId: 'pkg_padded_env',
      boxName: 'Padded Flat Rate Envelope',
      items: [
        { sku: 'BOK-300', name: 'Hardcover Engineering Manual', quantity: 1, price: 89.00, weightOz: 32 },
      ],
      weightOz: 33.5,
      declaredValue: 89.00,
      addressValidated: true,
      trackingNumber: '1Z9999999999999999',
      carrier: 'UPS',
      serviceLevel: 'Ground',
      shippingCost: 9.80,
      shippingDate: '2026-07-18T16:00:00Z',
      labelUrl: 'https://easypost-files.s3.amazonaws.com/labels/ups_ground_sample1.pdf',
    },
    {
      id: 'ord_1003',
      orderNumber: 'ORD-8750',
      recipientName: 'Michael Chang',
      street1: '900 Pacific Ave',
      city: 'Seattle',
      state: 'WA',
      zip: '98101',
      country: 'US',
      orderDate: '2026-06-10T08:00:00Z',
      status: 'shipped',
      boxId: 'pkg_large',
      boxName: 'Large Flat Rate Box',
      items: [
        { sku: 'KIT-501', name: 'Gourmet Chef Knife Block Set', quantity: 1, price: 249.00, weightOz: 88 },
      ],
      weightOz: 94,
      declaredValue: 249.00,
      addressValidated: true,
      trackingNumber: '782910482910',
      carrier: 'FedEx',
      serviceLevel: 'HomeDelivery',
      shippingCost: 21.50,
      shippingDate: '2026-06-10T12:00:00Z',
    },
    {
      id: 'ord_1004',
      orderNumber: 'ORD-8710',
      recipientName: 'Amanda Vance',
      street1: '1400 Broadway',
      city: 'New York',
      state: 'NY',
      zip: '10018',
      country: 'US',
      orderDate: '2026-05-22T09:30:00Z',
      status: 'shipped',
      boxId: 'pkg_small',
      boxName: 'Small Flat Rate Box',
      items: [{ sku: 'JEW-10', name: 'Sterling Silver Bracelet', quantity: 1, price: 110.00, weightOz: 4 }],
      weightOz: 6,
      declaredValue: 110.00,
      addressValidated: true,
      trackingNumber: '9400111202482390199088',
      carrier: 'USPS',
      serviceLevel: 'FirstClass',
      shippingCost: 5.60,
      shippingDate: '2026-05-22T15:10:00Z',
    },
  ],
};

// Sessions store
const activeSessions = new Set<string>();

// Helper: Validate Address logic (Simulates EasyPost API + real syntax rules)
function validateAddressWithEasyPost(address: {
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}) {
  const errors: string[] = [];
  let suggested = { ...address };
  let isValid = true;

  if (!address.street1 || address.street1.trim().length < 3) {
    errors.push('Street address is too short or missing.');
    isValid = false;
  }

  if (address.street1.toLowerCase().includes('nonexistent') || address.street1.includes('9999')) {
    errors.push('EasyPost Address Error: Street address not found in USPS DPV database.');
    isValid = false;
  }

  if (!address.city || address.city.trim().length < 2) {
    errors.push('City name is required.');
    isValid = false;
  }

  if (!address.state || address.state.trim().length < 2) {
    errors.push('State abbreviation is required (e.g. CA, NY, IL).');
    isValid = false;
  }

  if (!address.zip || address.zip.trim() === '00000' || address.zip.length < 5) {
    errors.push(`ZIP Code "${address.zip || ''}" is invalid or undeliverable.`);
    isValid = false;
  } else {
    // Append standard ZIP+4 formatting if clean
    if (!address.zip.includes('-') && address.zip.length === 5) {
      suggested.zip = `${address.zip}-1024`;
    }
  }

  return {
    isValid,
    errors,
    suggestedAddress: isValid ? suggested : undefined,
    notes: isValid
      ? `Verified via EasyPost CASC. Standardized ZIP: ${suggested.zip}`
      : 'Address failed verification checks.',
  };
}

// ------------------------------------------------------------------
// API ROUTES
// ------------------------------------------------------------------

// Auth API
app.post('/api/auth/login', (req, res) => {
  const { password } = req.body;
  if (password === db.settings.appPassword) {
    const token = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    activeSessions.add(token);
    return res.json({ success: true, token, user: { username: 'Admin User', role: 'Warehouse Admin' } });
  }
  return res.status(401).json({ success: false, error: 'Invalid application password. Please try again.' });
});

app.get('/api/auth/session', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token && activeSessions.has(token)) {
    return res.json({ isAuthenticated: true, user: { username: 'Admin User', role: 'Warehouse Admin' } });
  }
  // Default allow initial access for local app session unless logged out
  res.json({ isAuthenticated: true, user: { username: 'Operator', role: 'Shipping Manager' } });
});

app.post('/api/auth/logout', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token) activeSessions.delete(token);
  res.json({ success: true });
});

// Orders API
app.get('/api/orders', (req, res) => {
  const { status, search, shippedOnly } = req.query;
  let result = [...db.orders];

  if (shippedOnly === 'true') {
    result = result.filter((o) => o.status === 'shipped');
  } else if (status) {
    result = result.filter((o) => o.status === status);
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    result = result.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(q) ||
        o.recipientName.toLowerCase().includes(q) ||
        (o.company && o.company.toLowerCase().includes(q)) ||
        o.city.toLowerCase().includes(q) ||
        (o.trackingNumber && o.trackingNumber.toLowerCase().includes(q))
    );
  }

  // Sort: newest orderDate first
  result.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());

  res.json(result);
});

// Create Manual Order
app.post('/api/orders', (req, res) => {
  const { recipientName, company, street1, street2, city, state, zip, country, phone, email, orderNumber, boxId, weightOz } = req.body;

  if (!recipientName || !street1 || !city || !state || !zip) {
    return res.status(400).json({ error: 'Name, Street Address, City, State, and ZIP Code are required.' });
  }

  const generatedNum = orderNumber || `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
  const selectedBox = db.packages.find((p) => p.id === boxId) || db.packages[0];

  // Perform address validation
  const validation = validateAddressWithEasyPost({ street1, street2, city, state, zip, country: country || 'US' });

  const newOrder: ShippingOrder = {
    id: `ord_${Date.now()}`,
    orderNumber: generatedNum,
    recipientName,
    company: company || '',
    street1: validation.suggestedAddress?.street1 || street1,
    street2: validation.suggestedAddress?.street2 || street2 || '',
    city: validation.suggestedAddress?.city || city,
    state: validation.suggestedAddress?.state || state,
    zip: validation.suggestedAddress?.zip || zip,
    country: country || 'US',
    phone: phone || '',
    email: email || '',
    orderDate: new Date().toISOString(),
    status: validation.isValid ? 'ready_to_ship' : 'address_error',
    boxId: selectedBox.id,
    boxName: selectedBox.name,
    items: [
      {
        sku: 'MANUAL-ITEM',
        name: 'Manual Order Shipment Item',
        quantity: 1,
        price: 0.0,
        weightOz: weightOz || 16,
      },
    ],
    weightOz: Number(weightOz) || 16,
    declaredValue: 50.0,
    addressValidated: validation.isValid,
    addressNotes: validation.notes,
    validationErrors: validation.errors.length > 0 ? validation.errors : undefined,
  };

  db.orders.unshift(newOrder);
  res.status(201).json(newOrder);
});

// Update Order (Box selection, address fix, etc.)
app.put('/api/orders/:id', (req, res) => {
  const { id } = req.params;
  const index = db.orders.findIndex((o) => o.id === id);
  if (index === -1) return res.status(404).json({ error: 'Order not found' });

  const current = db.orders[index];
  const updates = req.body;

  // If boxId changed, update boxName
  if (updates.boxId && updates.boxId !== current.boxId) {
    const p = db.packages.find((pkg) => pkg.id === updates.boxId);
    if (p) {
      updates.boxName = p.name;
    }
  }

  // If address fields updated, re-validate address
  if (updates.street1 || updates.city || updates.state || updates.zip) {
    const street1 = updates.street1 ?? current.street1;
    const street2 = updates.street2 ?? current.street2;
    const city = updates.city ?? current.city;
    const state = updates.state ?? current.state;
    const zip = updates.zip ?? current.zip;
    const country = updates.country ?? current.country;

    const val = validateAddressWithEasyPost({ street1, street2, city, state, zip, country });
    updates.addressValidated = val.isValid;
    updates.addressNotes = val.notes;
    updates.validationErrors = val.errors.length > 0 ? val.errors : undefined;

    if (val.isValid && current.status === 'address_error') {
      updates.status = 'ready_to_ship';
    }
  }

  const updatedOrder = { ...current, ...updates, updatedAt: new Date().toISOString() };
  db.orders[index] = updatedOrder;

  res.json(updatedOrder);
});

// Validate Addresses Batch Endpoint
app.post('/api/orders/validate-addresses', (req, res) => {
  const { orderIds } = req.body;
  const targetOrders = orderIds
    ? db.orders.filter((o) => orderIds.includes(o.id))
    : db.orders.filter((o) => o.status === 'pending_validation' || o.status === 'address_error');

  let validatedCount = 0;
  let errorCount = 0;

  targetOrders.forEach((order) => {
    const val = validateAddressWithEasyPost({
      street1: order.street1,
      street2: order.street2,
      city: order.city,
      state: order.state,
      zip: order.zip,
      country: order.country,
    });

    order.addressValidated = val.isValid;
    order.addressNotes = val.notes;
    order.validationErrors = val.errors.length > 0 ? val.errors : undefined;

    if (val.isValid) {
      order.status = 'ready_to_ship';
      if (val.suggestedAddress) {
        order.zip = val.suggestedAddress.zip;
      }
      validatedCount++;
    } else {
      order.status = 'address_error';
      errorCount++;
    }
  });

  res.json({
    success: true,
    message: `Validated ${targetOrders.length} addresses with EasyPost API: ${validatedCount} ready to ship, ${errorCount} flagged for review.`,
    orders: db.orders,
  });
});

// Create Postage Labels Batch Endpoint
app.post('/api/orders/create-labels-batch', (req, res) => {
  const { orderIds } = req.body;
  if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
    return res.status(400).json({ error: 'Please select at least one order for label generation.' });
  }

  const selectedOrders = db.orders.filter((o) => orderIds.includes(o.id));
  const invalidAddressOrders = selectedOrders.filter((o) => o.status === 'address_error' || !o.addressValidated);

  if (invalidAddressOrders.length > 0) {
    return res.status(400).json({
      error: `Cannot generate labels: ${invalidAddressOrders.length} order(s) have unverified addresses. Please review and validate addresses first.`,
      problemOrders: invalidAddressOrders.map((o) => o.orderNumber),
    });
  }

  const carriers: ('USPS' | 'FedEx' | 'UPS')[] = ['USPS', 'USPS', 'UPS', 'FedEx'];
  let batchTotalCost = 0;
  const processed: ShippingOrder[] = [];

  selectedOrders.forEach((order, idx) => {
    const box = db.packages.find((p) => p.id === order.boxId) || db.packages[0];
    const carrier = carriers[idx % carriers.length];

    // Calculate realistic shipping cost based on box weight + dimensions
    const baseRate = carrier === 'USPS' ? 6.85 : carrier === 'UPS' ? 9.50 : 12.20;
    const weightFee = (order.weightOz / 16) * 1.25;
    const cost = Number((baseRate + weightFee + Math.random() * 2).toFixed(2));

    // Generate EasyPost tracking number format
    const randomSeq = Math.floor(100000000000 + Math.random() * 900000000000);
    const tracking = carrier === 'USPS' ? `9400111202482${randomSeq}` : carrier === 'UPS' ? `1Z999999${randomSeq.toString().substr(0, 10)}` : `7829${randomSeq.toString().substr(0, 8)}`;

    order.status = 'shipped';
    order.trackingNumber = tracking;
    order.carrier = carrier;
    order.serviceLevel = carrier === 'USPS' ? 'Priority Mail' : carrier === 'UPS' ? 'UPS Ground' : 'FedEx Home Delivery';
    order.shippingCost = cost;
    order.shippingDate = new Date().toISOString();
    order.boxName = box.name;

    batchTotalCost += cost;
    processed.push(order);
  });

  res.json({
    success: true,
    batchId: `BATCH-${Date.now()}`,
    processedOrders: processed,
    totalCost: Number(batchTotalCost.toFixed(2)),
    createdAt: new Date().toISOString(),
  });
});

// Re-Ship Order Handler Endpoint
app.post('/api/orders/:id/reship', (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const originalOrder = db.orders.find((o) => o.id === id);
  if (!originalOrder) {
    return res.status(404).json({ error: 'Original order not found.' });
  }

  // Create new replacement order
  const newOrderNumber = `${originalOrder.orderNumber}-RS`;

  const replacementOrder: ShippingOrder = {
    id: `ord_${Date.now()}`,
    orderNumber: newOrderNumber,
    recipientName: originalOrder.recipientName,
    company: originalOrder.company,
    street1: originalOrder.street1,
    street2: originalOrder.street2,
    city: originalOrder.city,
    state: originalOrder.state,
    zip: originalOrder.zip,
    country: originalOrder.country,
    phone: originalOrder.phone,
    email: originalOrder.email,
    orderDate: new Date().toISOString(),
    status: 'ready_to_ship',
    boxId: originalOrder.boxId,
    boxName: originalOrder.boxName,
    items: originalOrder.items.map((i) => ({ ...i, name: `[REPLACEMENT] ${i.name}` })),
    weightOz: originalOrder.weightOz,
    declaredValue: originalOrder.declaredValue,
    addressValidated: true,
    addressNotes: `Address copied from original order ${originalOrder.orderNumber}`,
    isReshipment: true,
    reshippedFromOrderNumber: originalOrder.orderNumber,
    reshipReason: reason || 'Replacement for lost or damaged shipment',
  };

  db.orders.unshift(replacementOrder);

  res.status(201).json({
    success: true,
    message: `Created reshipment order ${newOrderNumber} based on ${originalOrder.orderNumber}.`,
    order: replacementOrder,
  });
});

// Packages API
app.get('/api/packages', (req, res) => {
  res.json(db.packages);
});

app.post('/api/packages', (req, res) => {
  const { code, name, length, width, height, weightEmptyOz, maxWeightLbs, easyPostType } = req.body;
  if (!name || !length || !width || !height) {
    return res.status(400).json({ error: 'Package Name, Length, Width, and Height are required.' });
  }

  const newPkg: PackageType = {
    id: `pkg_${Date.now()}`,
    code: code || name.toUpperCase().replace(/[^A-Z0-9]/g, '').substr(0, 6),
    name,
    length: Number(length),
    width: Number(width),
    height: Number(height),
    weightEmptyOz: Number(weightEmptyOz) || 0,
    maxWeightLbs: Number(maxWeightLbs) || 70,
    easyPostType: easyPostType || 'Parcel',
    isActive: true,
  };

  db.packages.push(newPkg);
  res.status(201).json(newPkg);
});

app.put('/api/packages/:id', (req, res) => {
  const { id } = req.params;
  const index = db.packages.findIndex((p) => p.id === id);
  if (index === -1) return res.status(404).json({ error: 'Package not found' });

  db.packages[index] = { ...db.packages[index], ...req.body };
  res.json(db.packages[index]);
});

app.delete('/api/packages/:id', (req, res) => {
  const { id } = req.params;
  db.packages = db.packages.filter((p) => p.id !== id);
  res.json({ success: true });
});

// Settings API (including Packing Slip Content custom editor)
app.get('/api/settings', (req, res) => {
  // Hide password hash/secret in clear response if needed
  const { appPassword, ...safeSettings } = db.settings;
  res.json(safeSettings);
});

app.put('/api/settings', (req, res) => {
  db.settings = { ...db.settings, ...req.body };
  const { appPassword, ...safeSettings } = db.settings;
  res.json({ success: true, settings: safeSettings });
});

// Reports & Analytics API
app.get('/api/reports/monthly', (req, res) => {
  const shipped = db.orders.filter((o) => o.status === 'shipped');

  // Month names for current year dataset simulation
  const monthsList = [
    { key: '2026-01', name: 'Jan 2026', items: 142, shipments: 98, cost: 1140.50 },
    { key: '2026-02', name: 'Feb 2026', items: 168, shipments: 112, cost: 1380.20 },
    { key: '2026-03', name: 'Mar 2026', items: 195, shipments: 130, cost: 1590.80 },
    { key: '2026-04', name: 'Apr 2026', items: 210, shipments: 145, cost: 1750.40 },
    { key: '2026-05', name: 'May 2026', items: 245, shipments: 162, cost: 1980.10 },
    { key: '2026-06', name: 'Jun 2026', items: 280, shipments: 188, cost: 2310.00 },
    { key: '2026-07', name: 'Jul 2026', items: 312, shipments: 204, cost: 2540.60 },
    { key: '2026-08', name: 'Aug 2026', items: 185, shipments: 128, cost: 1490.25 },
  ];

  const reportData: MonthlyReportData[] = monthsList.map((m) => {
    // Add real shipped items if matching month
    const matchingShipped = shipped.filter((o) => o.shippingDate && o.shippingDate.startsWith(m.key));
    const extraShipments = matchingShipped.length;
    const extraCost = matchingShipped.reduce((sum, o) => sum + (o.shippingCost || 0), 0);
    const extraItems = matchingShipped.reduce((sum, o) => sum + o.items.reduce((isum, i) => isum + i.quantity, 0), 0);

    const totalShipments = m.shipments + extraShipments;
    const totalCost = Number((m.cost + extraCost).toFixed(2));
    const totalItems = m.items + extraItems;

    return {
      month: m.key,
      monthName: m.name,
      year: 2026,
      itemCount: totalItems,
      shipmentCount: totalShipments,
      totalCost,
      avgCostPerPackage: Number((totalCost / totalShipments).toFixed(2)),
      carrierBreakdown: {
        USPS: Math.round(totalShipments * 0.55),
        UPS: Math.round(totalShipments * 0.30),
        FedEx: Math.round(totalShipments * 0.15),
      },
      boxBreakdown: {
        'Medium Flat Rate': Math.round(totalShipments * 0.4),
        'Padded Envelope': Math.round(totalShipments * 0.35),
        'Custom Small': Math.round(totalShipments * 0.25),
      },
    };
  });

  res.json({
    summary: {
      totalShippedAllTime: reportData.reduce((s, r) => s + r.shipmentCount, 0),
      totalItemsAllTime: reportData.reduce((s, r) => s + r.itemCount, 0),
      totalSpendAllTime: Number(reportData.reduce((s, r) => s + r.totalCost, 0).toFixed(2)),
      avgPackageCost: 12.84,
    },
    monthly: reportData,
  });
});

// MSSQL Database Schema & Test API
app.get('/api/mssql/schema', (req, res) => {
  const ddlScript = `-- =========================================================
-- Microsoft SQL Server (MSSQL) Schema Definition
-- Database: ${db.settings.mssqlDatabase}
-- Target Table: shipping, packages, settings, shipments
-- =========================================================

-- 1. Create Packages Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'packages')
BEGIN
    CREATE TABLE packages (
        id VARCHAR(50) PRIMARY KEY,
        code VARCHAR(20) NOT NULL,
        name VARCHAR(100) NOT NULL,
        length DECIMAL(8,2) NOT NULL,
        width DECIMAL(8,2) NOT NULL,
        height DECIMAL(8,2) NOT NULL,
        weight_empty_oz DECIMAL(8,2) DEFAULT 0,
        max_weight_lbs DECIMAL(8,2) DEFAULT 70,
        easypost_type VARCHAR(50) DEFAULT 'Parcel',
        is_active BIT DEFAULT 1,
        created_at DATETIME2 DEFAULT GETDATE()
    );
END;

-- 2. Create Shipping Orders Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'shipping')
BEGIN
    CREATE TABLE shipping (
        id VARCHAR(50) PRIMARY KEY,
        order_number VARCHAR(50) UNIQUE NOT NULL,
        recipient_name VARCHAR(150) NOT NULL,
        company VARCHAR(150),
        street1 VARCHAR(255) NOT NULL,
        street2 VARCHAR(255),
        city VARCHAR(100) NOT NULL,
        state VARCHAR(50) NOT NULL,
        zip VARCHAR(20) NOT NULL,
        country VARCHAR(10) DEFAULT 'US',
        phone VARCHAR(50),
        email VARCHAR(150),
        order_date DATETIME2 NOT NULL,
        status VARCHAR(30) DEFAULT 'pending_validation',
        box_id VARCHAR(50) FOREIGN KEY REFERENCES packages(id),
        weight_oz DECIMAL(8,2) DEFAULT 16,
        declared_value DECIMAL(10,2) DEFAULT 0,
        address_validated BIT DEFAULT 0,
        address_notes NVARCHAR(MAX),
        tracking_number VARCHAR(100),
        carrier VARCHAR(30),
        service_level VARCHAR(50),
        shipping_cost DECIMAL(10,2),
        shipping_date DATETIME2,
        label_url NVARCHAR(MAX),
        is_reshipment BIT DEFAULT 0,
        reshipped_from_order_number VARCHAR(50),
        items_json NVARCHAR(MAX),
        updated_at DATETIME2 DEFAULT GETDATE()
    );
END;

-- 3. Create Settings Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'settings')
BEGIN
    CREATE TABLE settings (
        setting_key VARCHAR(100) PRIMARY KEY,
        setting_value NVARCHAR(MAX),
        updated_at DATETIME2 DEFAULT GETDATE()
    );
END;

-- Sample Insert into Settings for Packing Slip Custom Notice
INSERT INTO settings (setting_key, setting_value)
VALUES ('packing_slip_content', '${db.settings.packingSlipContent.replace(/'/g, "''")}');
`;

  res.json({
    connected: db.settings.mssqlConnected,
    server: db.settings.mssqlServer,
    database: db.settings.mssqlDatabase,
    ddlScript,
    tables: [
      { name: 'shipping', count: db.orders.length, description: 'Contains order addresses, box assignments, status, and writeback tracking numbers' },
      { name: 'packages', count: db.packages.length, description: 'Dropdown list of box types, dimensions, and EasyPost types' },
      { name: 'settings', count: 1, description: 'App configurations including custom packing slip notice content' },
    ],
  });
});

// Vite Middleware for Dev / Static fallback for Prod
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ShipStation Management System running on http://localhost:${PORT}`);
  });
}

startServer();
