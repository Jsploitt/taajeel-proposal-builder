/**
 * Minimal intrinsic-size reader for the image formats a .pptx carries.
 *
 * Needed because swapping a picture's bytes without resizing its frame stretches
 * the new image to the old one's aspect ratio. Every agency logo has different
 * proportions, so a naive byte swap distorts and clips them.
 */

export interface ImageSize {
  w: number
  h: number
}

function u32(b: Uint8Array, i: number) {
  return ((b[i] << 24) | (b[i + 1] << 16) | (b[i + 2] << 8) | b[i + 3]) >>> 0
}

function u16(b: Uint8Array, i: number) {
  return (b[i] << 8) | b[i + 1]
}

export function imageSize(bytes: Uint8Array): ImageSize | null {
  // PNG: 8-byte signature, then an IHDR chunk whose data starts at offset 16
  if (
    bytes.length > 24 &&
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
  ) {
    return { w: u32(bytes, 16), h: u32(bytes, 20) }
  }

  // GIF
  if (bytes.length > 10 && bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
    return { w: bytes[6] | (bytes[7] << 8), h: bytes[8] | (bytes[9] << 8) }
  }

  // JPEG: walk the marker segments to a Start-Of-Frame
  if (bytes.length > 4 && bytes[0] === 0xff && bytes[1] === 0xd8) {
    let i = 2
    while (i + 9 < bytes.length) {
      if (bytes[i] !== 0xff) {
        i++
        continue
      }
      const marker = bytes[i + 1]
      // SOF0..SOF15, excluding DHT (c4), JPG (c8) and DAC (cc)
      if (
        marker >= 0xc0 && marker <= 0xcf &&
        marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc
      ) {
        return { h: u16(bytes, i + 5), w: u16(bytes, i + 7) }
      }
      i += 2 + u16(bytes, i + 2)
    }
  }

  return null
}

/**
 * Fit `src` inside `box` without distortion, centred (letterbox).
 * Returns the new offset and extent in the same units as the inputs.
 */
export function fitCentred(
  src: ImageSize,
  box: { x: number; y: number; cx: number; cy: number }
): { x: number; y: number; cx: number; cy: number } {
  if (!src.w || !src.h) return box
  const scale = Math.min(box.cx / src.w, box.cy / src.h)
  const cx = Math.round(src.w * scale)
  const cy = Math.round(src.h * scale)
  return {
    x: Math.round(box.x + (box.cx - cx) / 2),
    y: Math.round(box.y + (box.cy - cy) / 2),
    cx,
    cy,
  }
}
