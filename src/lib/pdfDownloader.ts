/**
 * Safely fetches a PDF from an API endpoint within the authenticated session,
 * triggers an immediate browser file download, and opens a Blob URL in a new
 * tab/window without triggering Cloud Run proxy cookie-check redirects.
 */
export async function downloadOrOpenPdf(
  url: string,
  filename: string,
  options: { openInNewTab?: boolean } = { openInNewTab: true }
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

  // 1. Trigger instantaneous browser file download
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

  // 2. Open in new tab via Blob URL (no network request / no proxy redirect)
  let opened = false;
  if (options.openInNewTab !== false) {
    try {
      const popup = window.open(blobUrl, '_blank');
      if (popup) {
        opened = true;
      } else {
        console.warn('[PDF Downloader] Popup was blocked by browser. File was downloaded directly.');
      }
    } catch (e) {
      console.warn('[PDF Downloader] window.open failed:', e);
    }
  }

  // Revoke Blob URL after 3 minutes to free memory
  setTimeout(() => {
    URL.revokeObjectURL(blobUrl);
  }, 180000);

  return { blobUrl, opened };
}
