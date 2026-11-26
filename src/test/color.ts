// Colour maths for tests: OKLCH → linear sRGB, WCAG relative luminance and
// contrast ratio, and source-over compositing the way a browser paints a
// translucent colour. No colour value lives here — callers pass token values.

/** An OKLCH colour as the token source stores it: lightness 0–1, chroma, hue in degrees. */
export type Oklch = readonly [lightness: number, chroma: number, hue: number]
/** Linear-light sRGB, each channel 0–1. */
export type LinearRgb = readonly [red: number, green: number, blue: number]

const clamp = (channel: number) => Math.min(1, Math.max(0, channel))

/** OKLCH → linear sRGB (Björn Ottosson's OKLab matrices), clamped to the gamut. */
export function oklchToLinearRgb([lightness, chroma, hue]: Oklch): LinearRgb {
  const angle = (hue * Math.PI) / 180
  const a = chroma * Math.cos(angle)
  const b = chroma * Math.sin(angle)
  const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3
  return [
    clamp(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    clamp(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    clamp(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  ]
}

/** The sRGB transfer function: linear light → encoded channel. */
export function encodeSrgb(channel: number): number {
  return channel <= 0.0031308 ? channel * 12.92 : 1.055 * channel ** (1 / 2.4) - 0.055
}

/** The inverse transfer function: encoded channel → linear light. */
export function decodeSrgb(channel: number): number {
  return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
}

/** WCAG 2.x relative luminance of a linear sRGB colour. */
export function relativeLuminance([red, green, blue]: LinearRgb): number {
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue
}

/** WCAG 2.x contrast ratio of two colours, 1–21. */
export function contrastRatio(first: LinearRgb, second: LinearRgb): number {
  const [lighter, darker] = [relativeLuminance(first), relativeLuminance(second)].sort((x, y) => y - x)
  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * `foreground` at `alpha` painted over an opaque `background`. Browsers blend
 * in encoded sRGB, not in linear light, so this does too — use it to measure
 * a translucent ring or tint as it is actually composited.
 */
export function compositeOver(foreground: LinearRgb, alpha: number, background: LinearRgb): LinearRgb {
  const blend = (index: 0 | 1 | 2) =>
    decodeSrgb(alpha * encodeSrgb(foreground[index]) + (1 - alpha) * encodeSrgb(background[index]))
  return [blend(0), blend(1), blend(2)]
}
