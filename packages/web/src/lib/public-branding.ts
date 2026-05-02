type HslChannels = `${number} ${number}% ${number}%`;

interface BrandingColors {
  primaryColor: string | null;
  secondaryColor: string | null;
  accentColor: string | null;
}

const HEX_COLOR_REGEX = /^#[0-9A-F]{6}$/i;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function normalizeHexColor(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const normalized = value.trim().toUpperCase();
  return HEX_COLOR_REGEX.test(normalized) ? normalized : null;
}

function hexToRgb(hex: string) {
  const sanitizedHex = hex.replace('#', '');

  return {
    r: Number.parseInt(sanitizedHex.slice(0, 2), 16),
    g: Number.parseInt(sanitizedHex.slice(2, 4), 16),
    b: Number.parseInt(sanitizedHex.slice(4, 6), 16),
  };
}

function rgbToHslChannels({
  r,
  g,
  b,
}: {
  r: number;
  g: number;
  b: number;
}): HslChannels {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;

  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;

  let hue = 0;
  const lightness = (max + min) / 2;
  const saturation =
    delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1));

  if (delta !== 0) {
    switch (max) {
      case red:
        hue = ((green - blue) / delta) % 6;
        break;
      case green:
        hue = (blue - red) / delta + 2;
        break;
      default:
        hue = (red - green) / delta + 4;
        break;
    }
  }

  const normalizedHue = Math.round((hue * 60 + 360) % 360);
  const normalizedSaturation = Math.round(saturation * 100);
  const normalizedLightness = Math.round(lightness * 100);

  return `${normalizedHue} ${normalizedSaturation}% ${normalizedLightness}%`;
}

function getRelativeLuminance(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  const channels = [r, g, b].map((channel) => {
    const srgb = channel / 255;
    return srgb <= 0.03928
      ? srgb / 12.92
      : ((srgb + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function getContrastRatio(foregroundHex: string, backgroundHex: string) {
  const foreground = getRelativeLuminance(foregroundHex);
  const background = getRelativeLuminance(backgroundHex);
  const lighter = Math.max(foreground, background);
  const darker = Math.min(foreground, background);

  return (lighter + 0.05) / (darker + 0.05);
}

function pickReadableForeground(backgroundHex: string) {
  const white = '#FFFFFF';
  const slate = '#0F172A';

  return getContrastRatio(white, backgroundHex) >= 4.5 ? white : slate;
}

function mixWithWhite(hex: string, weight: number) {
  const { r, g, b } = hexToRgb(hex);
  const mix = (channel: number) =>
    Math.round(channel + (255 - channel) * clamp(weight, 0, 1));

  return `#${[mix(r), mix(g), mix(b)]
    .map((channel) => channel.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()}`;
}

export function isValidHexColor(value: string) {
  return HEX_COLOR_REGEX.test(value.trim());
}

export function normalizeBrandingColors(colors: BrandingColors) {
  return {
    primaryColor: normalizeHexColor(colors.primaryColor),
    secondaryColor: normalizeHexColor(colors.secondaryColor),
    accentColor: normalizeHexColor(colors.accentColor),
  };
}

export function getReadableTextColor(backgroundHex: string | null | undefined) {
  const normalized = normalizeHexColor(backgroundHex);

  if (!normalized) {
    return '#FFFFFF';
  }

  return pickReadableForeground(normalized);
}

export function buildPublicBrandingStyle(colors: BrandingColors) {
  const normalized = normalizeBrandingColors(colors);

  if (
    !normalized.primaryColor ||
    !normalized.secondaryColor ||
    !normalized.accentColor
  ) {
    return undefined;
  }

  const primaryForeground = pickReadableForeground(normalized.primaryColor);
  const accentForeground = pickReadableForeground(normalized.accentColor);
  const secondaryForeground = pickReadableForeground(normalized.secondaryColor);
  const softPrimary = mixWithWhite(normalized.primaryColor, 0.82);
  const softAccent = mixWithWhite(normalized.accentColor, 0.88);

  return {
    '--booking-primary': rgbToHslChannels(hexToRgb(normalized.primaryColor)),
    '--booking-primary-foreground': rgbToHslChannels(
      hexToRgb(primaryForeground),
    ),
    '--booking-secondary': rgbToHslChannels(hexToRgb(normalized.secondaryColor)),
    '--booking-secondary-foreground': rgbToHslChannels(
      hexToRgb(secondaryForeground),
    ),
    '--booking-accent': rgbToHslChannels(hexToRgb(normalized.accentColor)),
    '--booking-accent-foreground': rgbToHslChannels(
      hexToRgb(accentForeground),
    ),
    '--booking-primary-soft': rgbToHslChannels(hexToRgb(softPrimary)),
    '--booking-accent-soft': rgbToHslChannels(hexToRgb(softAccent)),
  } as CSSProperties;
}
import type { CSSProperties } from "react";
