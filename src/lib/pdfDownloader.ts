/**
 * Safely fetches a PDF from an API endpoint within the authenticated session,
 * triggers an immediate browser file download, and opens a Blob URL in a new
 * tab/window without triggering Cloud Run proxy cookie-check redirects.
 */
export interface PdfDownloadOptions {
  /**
   * 'download': Clean file download to user's device (does not navigate or open new window)
   * 'open': Opens PDF in new tab via window.open (no forced file download)
   * Defaults to 'download'.
   */
  mode?: 'download' | 'open';
}

export async function downloadOrOpenPdf(
  url: string,
  filename: string,
  options: PdfDownloadOptions = { mode: 'download' }
): Promise<{ blobUrl: string; opened: boolean }> {
  const token = localStorage.getItem('shipping_auth_token');
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, { headers });
  if (!response.ok) {
    let errorMsg = `Server returned HTTP ${response.status}`;
    try {
      const errorText = await response.text();
      if (errorText) errorMsg = errorText;
    } catch {}
    throw new Error(errorMsg);
  }

  const blob = await response.blob();
  const pdfBlob = new Blob([blob], { type: 'application/pdf' });
  const blobUrl = URL.createObjectURL(pdfBlob);

  let opened = false;

  if (options.mode === 'open') {
    try {
      const popup = window.open(blobUrl, '_blank');
      if (popup) {
        opened = true;
      } else {
        // If popup was blocked by browser, fall back to downloading file
        triggerFileDownload(blobUrl, filename);
      }
    } catch (e) {
      triggerFileDownload(blobUrl, filename);
    }
  } else {
    // Mode 'download': Download the file without opening or navigating the window
    triggerFileDownload(blobUrl, filename);
  }

  // Revoke Blob URL after 3 minutes to free memory
  setTimeout(() => {
    URL.revokeObjectURL(blobUrl);
  }, 180000);

  return { blobUrl, opened };
}

function triggerFileDownload(blobUrl: string, filename: string) {
  try {
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (e) {
    console.warn('[PDF Downloader] Direct download link click failed:', e);
  }
}
