import React, { useRef, useCallback } from 'react'
import { X, Printer, Download } from 'lucide-react'
import { InvoiceTemplate, InvoiceData, CompanyInfo } from './InvoiceTemplate'
import { InvoiceTemplateConfig } from '@/features/settings/services'

interface PrintPreviewProps {
  invoice: InvoiceData
  company?: CompanyInfo
  isOpen: boolean
  onClose: () => void
  templateConfig?: InvoiceTemplateConfig
}

export const PrintPreview: React.FC<PrintPreviewProps> = ({
  invoice,
  company,
  isOpen,
  onClose,
  templateConfig,
}) => {
  const printRef = useRef<HTMLDivElement>(null)

  const handlePrint = useCallback(() => {
    if (!printRef.current) return

    const printContent = printRef.current.innerHTML
    const printWindow = window.open('', '_blank')

    if (!printWindow) {
      alert('يرجى السماح بالنوافذ المنبثقة لطباعة الفاتورة')
      return
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>فاتورة ${invoice.invoiceNumber}</title>
          <style>
            @font-face {
              font-family: 'Madani';
              src: url('/fonts/Madani-Arabic-Regular.woff2') format('woff2');
              font-weight: 400;
              font-style: normal;
            }
            @font-face {
              font-family: 'Madani';
              src: url('/fonts/Madani-Arabic-Medium.woff2') format('woff2');
              font-weight: 500;
              font-style: normal;
            }
            @font-face {
              font-family: 'Madani';
              src: url('/fonts/Madani-Arabic-SemiBold.woff2') format('woff2');
              font-weight: 600;
              font-style: normal;
            }
            @font-face {
              font-family: 'Madani';
              src: url('/fonts/Madani-Arabic-Bold.woff2') format('woff2');
              font-weight: 700;
              font-style: normal;
            }
            @page {
              size: A4;
              margin: 0;
            }
            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body {
              margin: 0;
              padding: 0;
              font-family: 'Madani', Arial, sans-serif;
              direction: rtl;
            }
            @media print {
              body {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
            }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `)

    printWindow.document.close()

    // Wait for images to load
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print()
        printWindow.close()
      }, 250)
    }
  }, [invoice.invoiceNumber])

  const handleDownloadPDF = useCallback(async () => {
    // For PDF export, we'll use the browser's print-to-PDF functionality
    // A more advanced implementation could use libraries like html2pdf or jspdf
    handlePrint()
  }, [handlePrint])

  if (!isOpen) return null

  return (
    <div style={styles.overlay}>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <h2 style={styles.title}>معاينة الفاتورة</h2>
          <div style={styles.actions}>
            <button onClick={handlePrint} style={styles.printButton}>
              <Printer size={18} />
              <span>طباعة</span>
            </button>
            <button onClick={handleDownloadPDF} style={styles.downloadButton}>
              <Download size={18} />
              <span>تصدير PDF</span>
            </button>
            <button onClick={onClose} style={styles.closeButton}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Preview */}
        <div style={styles.previewContainer}>
          <div style={styles.previewWrapper}>
            <InvoiceTemplate
              ref={printRef}
              invoice={invoice}
              company={company}
              templateConfig={templateConfig}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

const styles: { [key: string]: React.CSSProperties } = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
    padding: '20px',
  },
  container: {
    backgroundColor: '#f3f4f6',
    borderRadius: '12px',
    width: '100%',
    maxWidth: '900px',
    maxHeight: '95vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e5e7eb',
    borderRadius: '12px 12px 0 0',
  },
  title: {
    fontSize: '18px',
    fontWeight: 600,
    margin: 0,
    color: '#1f2937',
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  printButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 16px',
    backgroundColor: '#7c2d12',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  downloadButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 16px',
    backgroundColor: '#ffffff',
    color: '#374151',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  closeButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    backgroundColor: '#ffffff',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    color: '#6b7280',
    cursor: 'pointer',
  },
  previewContainer: {
    flex: 1,
    overflow: 'auto',
    padding: '20px',
    display: 'flex',
    justifyContent: 'center',
  },
  previewWrapper: {
    backgroundColor: '#ffffff',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
    transform: 'scale(0.75)',
    transformOrigin: 'top center',
  },
}

export default PrintPreview
