/**
 * useLabelSettings Hook
 *
 * Single source of truth for label settings - fetched from API only.
 * No localStorage, no complex sync logic.
 *
 * SIMPLE CYCLE:
 * 1. API returns default preset for company
 * 2. React Query caches it
 * 3. Components read from this hook
 * 4. When user changes preset, update API → invalidate cache → UI updates
 */

import { useDefaultLabelPreset } from './api/useLabelPresets';
import { useCompany } from './useCompany';

// Default settings when no preset exists in API
// Optimized for 1.36" x 0.98" (35mm x 25mm) labels
//
// LABEL LAYOUT (25mm height):
// - Company name: ~3mm
// - Barcode: ~7.5mm (60px height @ 203 DPI)
// - HRI text: ~3mm
// - Margins: ~5mm total
// - Quiet zones: ~2mm total
//
// UPDATED: Increased barcode height from 40px to 60px for better scannability
// - 40px = 5mm (good at 6" range)
// - 60px = 7.5mm (good at 12" range) ✓ Recommended for retail POS
// - 80px = 10mm (good at 18" range) - use for larger labels
//
// These values produce scannable barcodes that work well at typical POS distances
const FALLBACK_SETTINGS = {
  labelWidth: 35,           // 1.36 inch = 35mm
  labelHeight: 25,          // 0.98 inch = 25mm
  barcodeHeight: 60,        // 60px - improved scannability at 12" distance
  barcodeWidth: 2,          // Width 2 = compact but scannable
  barcodeFormat: 'CODE128' as const,
  showBarcodeText: true,    // HRI text - essential for manual entry
  barcodeFontSize: 9,       // 9px - compact but readable
  headerFontSize: 7,        // Company name - small
  footerFontSize: 7,        // Price - small
};

export interface LabelSettings {
  labelWidth: number;
  labelHeight: number;
  barcodeHeight: number;
  barcodeWidth: number;
  barcodeFormat: string;
  showBarcodeText: boolean;
  barcodeFontSize: number;
  headerFontSize: number;
  footerFontSize: number;
}

export function useLabelSettings() {
  const { companyId } = useCompany();
  const { data: defaultPreset, isLoading, error } = useDefaultLabelPreset(companyId);

  // Convert API preset to settings format
  const settings: LabelSettings = defaultPreset ? {
    labelWidth: defaultPreset.labelWidth,
    labelHeight: defaultPreset.labelHeight,
    barcodeHeight: defaultPreset.barcodeHeight,
    barcodeWidth: defaultPreset.barcodeWidth,
    barcodeFormat: defaultPreset.barcodeFormat,
    showBarcodeText: defaultPreset.showBarcodeText,
    barcodeFontSize: defaultPreset.barcodeFontSize,
    headerFontSize: defaultPreset.headerFontSize,
    footerFontSize: defaultPreset.footerFontSize,
  } : FALLBACK_SETTINGS;

  return {
    settings,
    isLoading,
    error,
    hasPreset: !!defaultPreset,
    presetId: defaultPreset?.id || null,
    presetName: defaultPreset?.name || null,
  };
}
