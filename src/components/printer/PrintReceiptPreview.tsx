import React, { useRef, useEffect, useState } from 'react';
import { X, Printer, Download, FileText } from 'lucide-react';
import { Modal, Button } from '../ui';
import { generateReceiptHTML, saleToReceiptData } from '../../services/receiptHtmlTemplate';
import { usePrinterConfigStore } from '../../stores/printerConfigStore';
import { exportReceiptAsImage } from '../../services/exportReceiptAsImage';
import { printReceipt } from '../../services/printService';
import { companyService } from '../../services/companyService';
import toast from 'react-hot-toast';

interface PrintReceiptPreviewProps {
  sale: any;
  companyId: number; // Changed: now accepts ID instead of full object
  cashier: any;
  isOpen: boolean;
  onClose: () => void;
  onPrint?: () => Promise<void>; // Optional custom print handler
  onCancel?: () => void; // Optional cancel handler
}

export const PrintReceiptPreview: React.FC<PrintReceiptPreviewProps> = ({
  sale,
  companyId,
  cashier,
  isOpen,
  onClose,
}) => {
  const previewRef = useRef<HTMLDivElement>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [company, setCompany] = useState<any>(null);
  const [isLoadingCompany, setIsLoadingCompany] = useState(true);

  // Fetch full company data with logo when component opens
  useEffect(() => {
    if (isOpen && companyId) {
      const fetchCompanyData = async () => {
        setIsLoadingCompany(true);
        try {
          const fullCompany = await companyService.getProfile(companyId);
          setCompany(fullCompany);
        } catch (error) {
          console.warn('Could not fetch company profile, using fallback');
          setCompany({ name: 'POS System' });
        } finally {
          setIsLoadingCompany(false);
        }
      };
      fetchCompanyData();
    }
  }, [isOpen, companyId]);

  // Handle thermal printer print
  const handleThermalPrint = async () => {
    setIsPrinting(true);
    try {
      await printReceipt({ sale, company, cashier });
      toast.success('تم الطباعة بنجاح');
      onClose();
    } catch (error: any) {
      console.error('Print error:', error);
      toast.error(error?.message || 'فشلت عملية الطباعة');
    } finally {
      setIsPrinting(false);
    }
  };

  // Handle PNG export
  const handleExportPNG = async () => {
    setIsExporting(true);
    try {
      const printerConfig = usePrinterConfigStore.getState();
      const receiptData = saleToReceiptData({
        sale,
        company,
        cashier,
        showQRCode: printerConfig.showQRCode,
        showLogo: printerConfig.showLogo,
        showOrderId: printerConfig.showOrderId,
        showTaxBreakdown: printerConfig.showTaxBreakdown,
        headerText: printerConfig.headerText,
        footerText: printerConfig.footerText,
        paperWidth: printerConfig.paperWidth,
      });
      const blob = await exportReceiptAsImage(receiptData);

      // Download the blob
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `receipt-${sale.id || Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('تم تصدير الفاتورة كصورة');
    } catch (error: any) {
      console.error('Export error:', error);
      toast.error('فشل تصدير الصورة');
    } finally {
      setIsExporting(false);
    }
  };

  // Handle browser print (for A4 printers / PDF)
  const handleBrowserPrint = async () => {
    const printWindow = window.open('', '_blank', 'width=800,height=600');

    if (!printWindow) {
      toast.error('يرجى السماح بالنوافذ المنبثقة للطباعة');
      return;
    }

    const printerConfig = usePrinterConfigStore.getState();
    const receiptData = saleToReceiptData({
      sale,
      company,
      cashier,
      paperWidth: printerConfig.paperWidth as '58mm' | '80mm',
      showLogo: printerConfig.showLogo,
      showOrderId: printerConfig.showOrderId,
      showTaxBreakdown: printerConfig.showTaxBreakdown,
      showQRCode: printerConfig.showQRCode,
      headerText: printerConfig.headerText,
      footerText: printerConfig.footerText,
    });

    const html = await generateReceiptHTML(receiptData);
    printWindow.document.write(html);
    printWindow.document.close();

    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
      setTimeout(() => printWindow.close(), 100);
    };

    toast.success('تم فتح نافذة الطباعة');
  };

  // Generate preview HTML
  const [previewHTML, setPreviewHTML] = useState<string>('');

  useEffect(() => {
    const generatePreview = async () => {
      if (!company || isLoadingCompany) return; // Wait for company data

      const printerConfig = usePrinterConfigStore.getState();
      const receiptData = saleToReceiptData({
        sale,
        company,
        cashier,
        paperWidth: printerConfig.paperWidth as '58mm' | '80mm',
        showLogo: printerConfig.showLogo,
        showOrderId: printerConfig.showOrderId,
        showTaxBreakdown: printerConfig.showTaxBreakdown,
        showQRCode: printerConfig.showQRCode,
        headerText: printerConfig.headerText,
        footerText: printerConfig.footerText,
      });
      const html = await generateReceiptHTML(receiptData);
      setPreviewHTML(html);
    };
    generatePreview();
  }, [sale, company, cashier, isLoadingCompany]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="معاينة الفاتورة"
      size="lg"
    >
      <div className="space-y-4">
        {/* Receipt Preview */}
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 max-h-96 overflow-y-auto">
          {isLoadingCompany ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-3"></div>
                <p className="text-gray-600">جاري تحميل بيانات الشركة...</p>
              </div>
            </div>
          ) : (
            <div
              ref={previewRef}
              className="bg-white mx-auto"
              style={{ maxWidth: '80mm' }}
              dangerouslySetInnerHTML={{ __html: previewHTML }}
            />
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-3">
          {/* Thermal Printer */}
          <Button
            onClick={handleThermalPrint}
            disabled={isPrinting || isLoadingCompany}
            className="bg-primary-600 hover:bg-primary-700 text-white flex flex-col items-center py-4"
          >
            <Printer className="w-6 h-6 mb-1" />
            <span className="text-sm">{isPrinting ? 'جاري الطباعة...' : 'طباعة حرارية'}</span>
          </Button>

          {/* Export PNG */}
          <Button
            onClick={handleExportPNG}
            disabled={isExporting || isLoadingCompany}
            className="bg-green-600 hover:bg-green-700 text-white flex flex-col items-center py-4"
          >
            <Download className="w-6 h-6 mb-1" />
            <span className="text-sm">{isExporting ? 'جاري التصدير...' : 'تصدير PNG'}</span>
          </Button>

          {/* Browser Print */}
          <Button
            onClick={handleBrowserPrint}
            className="bg-blue-600 hover:bg-blue-700 text-white flex flex-col items-center py-4"
          >
            <FileText className="w-6 h-6 mb-1" />
            <span className="text-sm">طباعة متصفح</span>
          </Button>
        </div>

        {/* Close Button */}
        <div className="flex justify-end pt-2 border-t">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            إغلاق
          </Button>
        </div>
      </div>
    </Modal>
  );
};
