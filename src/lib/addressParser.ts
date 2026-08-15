// US State mappings
const STATE_MAP: Record<string, string> = {
  alabama: 'AL', alaska: 'AK', arizona: 'AZ', arkansas: 'AR', california: 'CA',
  colorado: 'CO', connecticut: 'CT', delaware: 'DE', florida: 'FL', georgia: 'GA',
  hawaii: 'HI', idaho: 'ID', illinois: 'IL', indiana: 'IN', iowa: 'IA',
  kansas: 'KS', kentucky: 'KY', louisiana: 'LA', maine: 'ME', maryland: 'MD',
  massachusetts: 'MA', michigan: 'MI', minnesota: 'MN', mississippi: 'MS', missouri: 'MO',
  montana: 'MT', nebraska: 'NE', nevada: 'NV', 'new hampshire': 'NH', 'new jersey': 'NJ',
  'new mexico': 'NM', 'new york': 'NY', 'north carolina': 'NC', 'north dakota': 'ND',
  ohio: 'OH', oklahoma: 'OK', oregon: 'OR', pennsylvania: 'PA', 'rhode island': 'RI',
  'south carolina': 'SC', 'south dakota': 'SD', tennessee: 'TN', texas: 'TX', utah: 'UT',
  vermont: 'VT', virginia: 'VA', washington: 'WA', 'west virginia': 'WV', wisconsin: 'WI',
  wyoming: 'WY', 'district of columbia': 'DC', 'puerto rico': 'PR', guam: 'GU',
  'virgin islands': 'VI',
};

// Canadian Province mappings
const CA_PROV_MAP: Record<string, string> = {
  ontario: 'ON', quebec: 'QC', 'british columbia': 'BC', alberta: 'AB',
  manitoba: 'MB', saskatchewan: 'SK', 'nova scotia': 'NS', 'new brunswick': 'NB',
  'newfoundland and labrador': 'NL', 'prince edward island': 'PE', 'northwest territories': 'NT',
  nunavut: 'NU', yukon: 'YT',
};

// Country normalization
const COUNTRY_MAP: Record<string, string> = {
  'united states': 'US', 'united states of america': 'US', usa: 'US', us: 'US', 'u.s.a.': 'US', 'u.s.': 'US',
  canada: 'CA', can: 'CA', ca: 'CA',
  'united kingdom': 'GB', uk: 'GB', gb: 'GB', 'great britain': 'GB', england: 'GB', scotland: 'GB', wales: 'GB',
  australia: 'AU', au: 'AU', aus: 'AU',
  mexico: 'MX', mx: 'MX',
  germany: 'DE', de: 'DE', deutschland: 'DE',
  france: 'FR', fr: 'FR',
  japan: 'JP', jp: 'JP',
};

export interface ParsedAddress {
  recipientName: string;
  company: string;
  street1: string;
  street2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
  email: string;
  orderNumber?: string;
}

export function parseAddressText(rawText: string): ParsedAddress {
  const result: ParsedAddress = {
    recipientName: '',
    company: '',
    street1: '',
    street2: '',
    city: '',
    state: '',
    zip: '',
    country: 'US',
    phone: '',
    email: '',
  };

  if (!rawText || !rawText.trim()) {
    return result;
  }

  let text = rawText.trim();

  // 1. Extract Email
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/;
  const emailMatch = text.match(emailRegex);
  if (emailMatch) {
    result.email = emailMatch[0];
    text = text.replace(emailMatch[0], '');
  }

  // 2. Extract Phone Number (e.g. (555) 123-4567, 555-123-4567, +1 555 123 4567, Phone: 555-123-4567)
  const phonePrefixRegex = /(?:phone|tel|mobile|cell|ph|p)[:\s]*(\+?1?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/i;
  const phoneMatch = text.match(phonePrefixRegex) || text.match(/(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}/);
  if (phoneMatch) {
    result.phone = (phoneMatch[1] || phoneMatch[0]).trim();
    text = text.replace(phoneMatch[0], '');
  }

  // 3. Extract Order Number if present (e.g. Order #1234, Order ID: ORD-9921, Etsy Order #4829)
  const orderMatch = text.match(/(?:order\s*#?|order\s*id:?|receipt\s*#?)\s*([A-Za-z0-9_-]+)/i);
  if (orderMatch && orderMatch[1]) {
    result.orderNumber = orderMatch[1].trim();
    text = text.replace(orderMatch[0], '');
  }

  // 4. Clean prefix noise like "Ship To:", "Shipping Address:", "Deliver To:", "Attention:", "Attn:"
  text = text.replace(/^(?:ship\s+to|shipping\s+address|deliver\s+to|send\s+to|to|attn|attention)[:\s-]*/gim, '');

  // 5. Split into lines or comma chunks
  let lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  // If pasted as a single long line with commas, split by comma
  if (lines.length === 1 && lines[0].includes(',')) {
    lines = lines[0]
      .split(',')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
  }

  if (lines.length === 0) {
    return result;
  }

  // 6. Detect & Extract Country from the last line
  const lastLine = lines[lines.length - 1].toLowerCase().replace(/[.,]/g, '').trim();
  if (COUNTRY_MAP[lastLine]) {
    result.country = COUNTRY_MAP[lastLine];
    lines.pop();
  }

  // 7. Find City, State, ZIP line
  // Typical patterns:
  // "Springfield, OR 97477"
  // "San Francisco CA 94102-1234"
  // "Detroit, Michigan 48201"
  // "Montreal, QC H3B 1A7"
  let cityStateZipIndex = -1;

  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i];

    // Pattern A: City, State (2 letters or full name) + 5-digit / ZIP+4 (US)
    // e.g., "Austin, TX 78701", "Austin TX 78701-1234", "Austin, Texas 78701"
    const usMatch = line.match(/^([^,]+?),?\s+([A-Za-z\s.]+?)\s+([0-9]{5}(?:-[0-9]{4})?)$/);
    if (usMatch) {
      const parsedCity = usMatch[1].trim();
      const rawState = usMatch[2].trim().toLowerCase().replace(/\./g, '');
      const parsedZip = usMatch[3].trim();

      const stateCode = STATE_MAP[rawState] || (rawState.length === 2 ? rawState.toUpperCase() : rawState.toUpperCase());
      result.city = parsedCity;
      result.state = stateCode;
      result.zip = parsedZip;
      cityStateZipIndex = i;
      break;
    }

    // Pattern B: Canadian Postal Code "Montreal, QC H3B 1A7" or "Toronto ON M5V 2T6"
    const caMatch = line.match(/^([^,]+?),?\s+([A-Za-z]{2}|[A-Za-z\s]+?)\s+([A-Za-z]\d[A-Za-z]\s?\d[A-Za-z]\d)$/i);
    if (caMatch) {
      const parsedCity = caMatch[1].trim();
      const rawProv = caMatch[2].trim().toLowerCase();
      const parsedZip = caMatch[3].trim().toUpperCase();

      result.city = parsedCity;
      result.state = CA_PROV_MAP[rawProv] || rawProv.toUpperCase();
      result.zip = parsedZip;
      result.country = 'CA';
      cityStateZipIndex = i;
      break;
    }

    // Pattern C: Line ending with a 5-digit zip or UK postal code
    const zipMatch = line.match(/\b([0-9]{5}(?:-[0-9]{4})?)\b$/);
    if (zipMatch) {
      result.zip = zipMatch[1];
      const remainder = line.substring(0, line.lastIndexOf(zipMatch[1])).trim().replace(/,\s*$/, '');
      // Try extracting City, State from remainder
      const csMatch = remainder.match(/^([^,]+?)(?:,\s*|\s+)([A-Za-z]{2}|[A-Za-z\s]+)$/);
      if (csMatch) {
        result.city = csMatch[1].trim();
        const rawState = csMatch[2].trim().toLowerCase();
        result.state = STATE_MAP[rawState] || csMatch[2].trim().toUpperCase();
      } else {
        result.city = remainder;
      }
      cityStateZipIndex = i;
      break;
    }
  }

  // Filter out the city/state/zip line from address lines pool
  let addressLines = lines.filter((_, idx) => idx !== cityStateZipIndex);

  // 8. Identify Street Address vs Recipient Name vs Company
  // Common secondary street keywords
  const unitRegex = /\b(?:apt|apartment|suite|ste|unit|fl|floor|bldg|building|rm|room|dept|#)\s*([A-Za-z0-9_-]+)?/i;

  if (addressLines.length === 1) {
    // Only 1 line left -> Could be street address
    result.street1 = addressLines[0];
  } else if (addressLines.length === 2) {
    // 2 lines left:
    // Check if line 1 starts with digits or PO box (then it's street1 + street2)
    const isLine1Street = /^\d+\s+|^(?:po|p\.o\.)\s*box/i.test(addressLines[0]);
    if (isLine1Street) {
      result.street1 = addressLines[0];
      result.street2 = addressLines[1];
    } else {
      // Line 1 is name, Line 2 is street
      result.recipientName = addressLines[0];
      result.street1 = addressLines[1];
    }
  } else if (addressLines.length === 3) {
    // 3 lines left:
    // Typical: Name, (Company or Street1), (Street1 or Street2)
    const isLine2Street = /^\d+\s+|^(?:po|p\.o\.)\s*box/i.test(addressLines[1]);
    const isLine3StreetOrUnit = /^\d+\s+|^(?:po|p\.o\.)\s*box/i.test(addressLines[2]) || unitRegex.test(addressLines[2]);

    if (isLine2Street && !isLine3StreetOrUnit) {
      // Name, Street 1, Company ? or Name, Street 1, Street 2
      result.recipientName = addressLines[0];
      result.street1 = addressLines[1];
      result.street2 = addressLines[2];
    } else if (!isLine2Street && isLine3StreetOrUnit) {
      // Name, Company, Street 1
      result.recipientName = addressLines[0];
      result.company = addressLines[1];
      result.street1 = addressLines[2];
    } else {
      // Default: Name, Street 1, Street 2
      result.recipientName = addressLines[0];
      result.street1 = addressLines[1];
      result.street2 = addressLines[2];
    }
  } else if (addressLines.length >= 4) {
    // 4+ lines left: Name, Company, Street1, Street2
    result.recipientName = addressLines[0];
    result.company = addressLines[1];
    result.street1 = addressLines[2];
    result.street2 = addressLines.slice(3).join(', ');
  }

  // 9. If street1 contains Apt/Suite/Unit inline, split to street2 if street2 is empty
  if (result.street1 && !result.street2) {
    const inlineUnitMatch = result.street1.match(/^(.*?)[,\s]+((?:apt|apartment|suite|ste|unit|fl|floor|bldg|building|rm|room|#)\s*[A-Za-z0-9_-]+.*)$/i);
    if (inlineUnitMatch) {
      result.street1 = inlineUnitMatch[1].trim();
      result.street2 = inlineUnitMatch[2].trim();
    }
  }

  // Clean up any remaining quotes or extra punctuation
  result.recipientName = result.recipientName.replace(/^[",']|[",']$/g, '').trim();
  result.company = result.company.replace(/^[",']|[",']$/g, '').trim();
  result.street1 = result.street1.replace(/^[",']|[",']$/g, '').trim();
  result.street2 = result.street2.replace(/^[",']|[",']$/g, '').trim();
  result.city = result.city.replace(/^[",']|[",']$/g, '').trim();
  result.state = result.state.replace(/^[",']|[",']$/g, '').trim();
  result.zip = result.zip.replace(/^[",']|[",']$/g, '').trim();

  return result;
}
