import { useState, useCallback } from 'react'
import { InvoiceData } from '@/components/print'

export const usePrintInvoice = () => {
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false)
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null)

  const openPrintPreview = useCallback((data: InvoiceData) => {
    setInvoiceData(data)
    setIsPrintPreviewOpen(true)
  }, [])

  const closePrintPreview = useCallback(() => {
    setIsPrintPreviewOpen(false)
    setInvoiceData(null)
  }, [])

  return {
    isPrintPreviewOpen,
    invoiceData,
    openPrintPreview,
    closePrintPreview,
  }
}

export default usePrintInvoice
