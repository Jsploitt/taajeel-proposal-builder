import { PPTX_MIME } from './compile'

let currentUrl: string | null = null

/** Object URL for the compiled deck, revoking whatever the last compile made. */
export function makeDeckUrl(blob: Uint8Array): string {
  revokeDeckUrl()
  // Copy into a plain ArrayBuffer: the compiler's Uint8Array may be a view
  // over a larger buffer, and Blob would otherwise take the whole thing.
  const bytes = new Uint8Array(blob.byteLength)
  bytes.set(blob)
  currentUrl = URL.createObjectURL(new Blob([bytes], { type: PPTX_MIME }))
  return currentUrl
}

export function revokeDeckUrl() {
  if (currentUrl) {
    URL.revokeObjectURL(currentUrl)
    currentUrl = null
  }
}

export function triggerDownload(url: string, filename: string) {
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
}
