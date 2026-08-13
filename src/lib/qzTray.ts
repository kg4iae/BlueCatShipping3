import qz from 'qz-tray';

export interface QZPrinterInfo {
  name: string;
  isDefault?: boolean;
}

export interface QZPrintResult {
  success: boolean;
  message: string;
}

let qzInitAttempted = false;

// Setup optional SHA-256 certificate / signature promises or default to unsigned mode
export function setupQZCertificates() {
  if (qzInitAttempted) return;
  qzInitAttempted = true;

  // Unsigned mode for local QZ Tray usage without custom certificate authority.
  // QZ Tray desktop app will present a confirmation dialog to allow connection.
  qz.security.setCertificatePromise((resolve: any) => {
    resolve();
  });
  qz.security.setSignaturePromise(() => {
    return (resolve: any) => {
      resolve();
    };
  });
}

/**
 * Connect to QZ Tray background WebSocket
 */
export async function connectQZ(): Promise<boolean> {
  try {
    setupQZCertificates();
    if (qz.websocket.isActive()) {
      return true;
    }
    await qz.websocket.connect({
      retries: 3,
      delay: 1,
      host: ['localhost', '127.0.0.1', 'localhost.qz.io'],
      port: { secure: [8181, 8281, 8381, 8481], insecure: [8182, 8282, 8382, 8482] },
      usingSecure: window.location.protocol === 'https:'
    });
    return qz.websocket.isActive();
  } catch (err: any) {
    console.warn('[QZ Tray] Could not connect to QZ Tray:', err?.message || err);
    return false;
  }
}

/**
 * Check if active WebSocket connection to QZ Tray exists
 */
export function isQZConnected(): boolean {
  try {
    return qz.websocket.isActive();
  } catch {
    return false;
  }
}

/**
 * Disconnect from QZ Tray
 */
export async function disconnectQZ(): Promise<void> {
  try {
    if (qz.websocket.isActive()) {
      await qz.websocket.disconnect();
    }
  } catch (err) {
    console.error('[QZ Tray] Error disconnecting:', err);
  }
}

/**
 * Find all available system printers connected to QZ Tray
 */
export async function getQZPrinters(): Promise<string[]> {
  const connected = await connectQZ();
  if (!connected) {
    throw new Error('QZ Tray is not running or accessible. Please start QZ Tray on your computer.');
  }
  try {
    const list = await qz.printers.find();
    return Array.isArray(list) ? list : [list];
  } catch (err: any) {
    console.error('[QZ Tray] Error getting printers:', err);
    throw new Error(err?.message || 'Failed to list printers from QZ Tray');
  }
}

/**
 * Get default printer name from QZ Tray
 */
export async function getDefaultQZPrinter(): Promise<string | null> {
  const connected = await connectQZ();
  if (!connected) return null;
  try {
    const defaultPrinter = await qz.printers.getDefault();
    return typeof defaultPrinter === 'string' ? defaultPrinter : defaultPrinter?.name || null;
  } catch {
    return null;
  }
}

/**
 * Print PDF directly to printer via QZ Tray
 * @param printerName - Name of printer as recognized by QZ Tray
 * @param pdfData - Base64 encoded string, Data URL ("data:application/pdf;base64,..."), or HTTPS URL
 * @param options - Custom print options like copies, density, orientation
 */
export async function printPdfToQZ(
  printerName: string,
  pdfData: string,
  options?: { copies?: number; scaleContent?: boolean; rasterize?: boolean }
): Promise<QZPrintResult> {
  const connected = await connectQZ();
  if (!connected) {
    return {
      success: false,
      message: 'QZ Tray software is not connected. Please make sure QZ Tray is running on your computer.'
    };
  }

  try {
    // Configure target printer
    const config = qz.configs.create(printerName, {
      copies: options?.copies || 1,
      density: 300, // standard 300 dpi for 4x6 thermal printers
      rasterize: options?.rasterize ?? true, // rasterize PDFs for maximum thermal printer compatibility (Zebra, Rollo, Dymo)
      scaleContent: options?.scaleContent ?? true,
    });

    let formattedPdfData = pdfData;
    // Ensure base64 format clean without prefix if required or raw PDF format
    if (pdfData.startsWith('data:application/pdf;base64,')) {
      formattedPdfData = pdfData.replace(/^data:application\/pdf;base64,/, '');
    }

    const data = [
      {
        type: 'pixel',
        format: 'pdf',
        flavor: formattedPdfData.startsWith('http') ? 'file' : 'base64',
        data: formattedPdfData,
      }
    ];

    await qz.print(config, data);
    return {
      success: true,
      message: `Successfully sent print job to "${printerName}" via QZ Tray.`
    };
  } catch (err: any) {
    console.error('[QZ Tray] Print error:', err);
    return {
      success: false,
      message: err?.message || `Failed to print to "${printerName}".`
    };
  }
}

/**
 * Print raw ZPL string to Zebra / Thermal printer via QZ Tray
 */
export async function printZplToQZ(printerName: string, zplData: string): Promise<QZPrintResult> {
  const connected = await connectQZ();
  if (!connected) {
    return {
      success: false,
      message: 'QZ Tray is not running or connected.'
    };
  }

  try {
    const config = qz.configs.create(printerName);
    const data = [{ type: 'raw', format: 'command', flavor: 'plain', data: zplData }];
    await qz.print(config, data);
    return {
      success: true,
      message: `Sent ZPL raw command to "${printerName}".`
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Failed to print ZPL via QZ Tray'
    };
  }
}

/**
 * Send a 4x6 sample thermal test label to QZ Tray
 */
export async function printTestThermalLabel(printerName: string): Promise<QZPrintResult> {
  const sampleZpl = `
^XA
^FO50,50^GB700,1100,3^FS
^FO100,100^A0N,50,50^FDQZ TRAY TEST PRINT^FS
^FO100,180^A0N,30,30^FDBlueCat Shipping Direct Web Printing^FS
^FO100,240^GB600,2,2^FS
^FO100,270^A0N,35,35^FDPrinter: ${printerName}^FS
^FO100,320^A0N,28,28^FDDate: ${new Date().toLocaleString()}^FS
^FO100,380^BY3,3,100^BCN,100,Y,N,N^FD420902109205590123456789^FS
^FO100,530^A0N,30,30^FDSTATUS: SUCCESSFUL DIRECT PRINT!^FS
^XZ
  `;
  return printZplToQZ(printerName, sampleZpl);
}
