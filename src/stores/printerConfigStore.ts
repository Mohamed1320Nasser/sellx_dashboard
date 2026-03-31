import { create } from 'zustand';
import { apiClient } from '../services/apiClient';

interface PrinterConfig {
  // Connection
  printerName: string;
  connectionType: 'USB' | 'LAN';
  ipAddress: string;
  port: number;

  // Paper
  paperWidth: '58mm' | '80mm';
  marginTop: number;
  marginBottom: number;

  // Label Settings
  labelWidth: number;   // 35, 40, 50
  labelHeight: number;  // 25, 30, 30
  labelFontSize: number; // 8-20
  barcodeFormat: 'CODE128' | 'EAN13' | 'EAN8' | 'CODE39';
  barcodeHeight: number; // 40-100px - controls scan range
  barcodeWidth: number;  // 1-3 - controls bar thickness
  showBarcodeText: boolean; // Show HRI (Human Readable Interpretation)

  // Content
  showLogo: boolean;
  showOrderId: boolean;
  showTaxBreakdown: boolean;
  showQRCode: boolean;

  // Text
  headerText: string;
  footerText: string;

  // Automation
  autoPrintOnPayment: boolean;
  cutPaper: boolean;
  printCopies: number; // NEW: number of copies to print (1-5)
}

interface PrinterConfigStore extends PrinterConfig {
  isLoading: boolean;
  error: string | null;

  // Actions
  loadConfig: (companyId: number) => Promise<void>;
  saveConfig: (companyId: number) => Promise<void>;
  updateConfig: (partial: Partial<PrinterConfig>) => void;
  resetToDefaults: () => void;
}

const DEFAULT_CONFIG: PrinterConfig = {
  // Connection
  printerName: '',
  connectionType: 'LAN',
  ipAddress: '192.168.1.50',
  port: 9100,

  // Paper
  paperWidth: '80mm',
  marginTop: 5,
  marginBottom: 5,

  // Label
  labelWidth: 40,
  labelHeight: 30,
  labelFontSize: 12,
  barcodeFormat: 'CODE128',
  barcodeHeight: 60,  // Improved from 40px for better scan range (12")
  barcodeWidth: 2,    // Standard width (scannable and compact)
  showBarcodeText: true,  // Show text below barcode (HRI)

  // Content
  showLogo: true,
  showOrderId: true,
  showTaxBreakdown: true,
  showQRCode: false,

  // Text
  headerText: '',
  footerText: 'شكراً لزيارتكم',

  // Automation
  autoPrintOnPayment: false,
  cutPaper: true,
  printCopies: 1, // Default: print 1 copy
};

export const usePrinterConfigStore = create<PrinterConfigStore>((set, get) => ({
  ...DEFAULT_CONFIG,
  isLoading: false,
  error: null,

  loadConfig: async (companyId: number) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get(`/printer-config?companyId=${companyId}`);

      if (response.data.success && response.data.data) {
        const config = response.data.data;
        set({
          printerName: config.printerName || '',
          connectionType: config.connectionType || 'LAN',
          ipAddress: config.ipAddress || '192.168.1.50',
          port: config.port || 9100,
          paperWidth: config.paperWidth === 'MM_58' ? '58mm' : '80mm',
          marginTop: config.marginTop || 5,
          marginBottom: config.marginBottom || 5,
          labelWidth: config.labelWidth || 40,
          labelHeight: config.labelHeight || 30,
          labelFontSize: config.labelFontSize || 12,
          barcodeFormat: config.barcodeFormat || 'CODE128',
          barcodeHeight: config.barcodeHeight || 60,
          barcodeWidth: config.barcodeWidth || 2,
          showBarcodeText: config.showBarcodeText ?? true,
          showLogo: config.showLogo ?? true,
          showOrderId: config.showOrderId ?? true,
          showTaxBreakdown: config.showTaxBreakdown ?? true,
          showQRCode: config.showQRCode ?? false,
          headerText: config.headerText || '',
          footerText: config.footerText || 'شكراً لزيارتكم',
          autoPrintOnPayment: config.autoPrintOnPayment ?? false,
          cutPaper: config.cutPaper ?? true,
          printCopies: config.printCopies || 1,
          isLoading: false,
        });
      } else {
        // No config found, use defaults
        set({ ...DEFAULT_CONFIG, isLoading: false });
      }
    } catch (error) {
      console.error('Failed to load printer config:', error);
      set({ isLoading: false, error: 'فشل تحميل الإعدادات' });
      // Use defaults on error
      set({ ...DEFAULT_CONFIG });
    }
  },

  saveConfig: async (companyId: number) => {
    set({ isLoading: true, error: null });
    try {
      const state = get();

      const payload = {
        companyId,
        printerName: state.printerName,
        connectionType: state.connectionType,
        ipAddress: state.ipAddress,
        port: state.port,
        paperWidth: state.paperWidth === '58mm' ? 'MM_58' : 'MM_80',
        marginTop: state.marginTop,
        marginBottom: state.marginBottom,
        labelWidth: state.labelWidth,
        labelHeight: state.labelHeight,
        labelFontSize: state.labelFontSize,
        barcodeFormat: state.barcodeFormat,
        barcodeHeight: state.barcodeHeight,
        barcodeWidth: state.barcodeWidth,
        showBarcodeText: state.showBarcodeText,
        showLogo: state.showLogo,
        showOrderId: state.showOrderId,
        showTaxBreakdown: state.showTaxBreakdown,
        showQRCode: state.showQRCode,
        headerText: state.headerText,
        footerText: state.footerText,
        autoPrintOnPayment: state.autoPrintOnPayment,
        cutPaper: state.cutPaper,
        printCopies: state.printCopies,
      };

      const response = await apiClient.post('/printer-config', payload);

      if (!response.data.success) {
        throw new Error(response.data.message || 'فشل حفظ الإعدادات');
      }
      set({ isLoading: false });
    } catch (error: any) {
      console.error('Failed to save printer config:', error);
      set({
        isLoading: false,
        error: error.response?.data?.message || 'فشل حفظ الإعدادات'
      });
      throw error;
    }
  },

  updateConfig: (partial) => {
    set((state) => ({ ...state, ...partial }));
  },

  resetToDefaults: () => {
    set({ ...DEFAULT_CONFIG });
  },
}));
