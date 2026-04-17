/**
 * Browser-only file helpers used by upload/export flows.
 * Wrapping them keeps SSR-sensitive DOM APIs out of page logic and makes the
 * eventual platform migration less risky.
 */
export function createObjectUrl(file: Blob): string {
  return URL.createObjectURL(file)
}

export function revokeObjectUrl(url: string): void {
  URL.revokeObjectURL(url)
}

export function downloadBlob(filename: string, blob: Blob): void {
  const url = createObjectUrl(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  // Delay revocation so download has time to start in Safari/Firefox.
  window.setTimeout(() => revokeObjectUrl(url), 1000)
}
