import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { ArrowRight, Printer, Loader2, AlertTriangle, RotateCcw, X, CheckCircle2, Trash2, Download, Image as ImageIcon, Edit2, Save, XCircle } from 'lucide-react'
import { MainLayout } from '@/components/layout'
import { formatCurrency, formatDate } from '@/utils'
import { useEnterNavigation } from '@/hooks'
import { salesService, Sale, SaleItem, UpdateSaleInput } from '../services'
import { returnsService } from '@/features/returns/services'
import { PrintPreview, InvoiceData } from '@/components/print'
import { settingsService, InvoiceTemplateConfig } from '@/features/settings/services'

export default function SalesView() {
  const router = useRouter()
  const { id } = router.query

  const [sale, setSale] = useState<Sale | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // Return modal state
  const [showReturnModal, setShowReturnModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<SaleItem | null>(null)
  const [returnQuantity, setReturnQuantity] = useState(1)
  const [returnReason, setReturnReason] = useState('')
  const [refundPaid, setRefundPaid] = useState(true)
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false)
  const [showReturnSuccess, setShowReturnSuccess] = useState(false)

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [adjustBalance, setAdjustBalance] = useState(true)

  // Print preview state
  const [showPrintPreview, setShowPrintPreview] = useState(false)

  // Template config state
  const [templateConfig, setTemplateConfig] = useState<InvoiceTemplateConfig | null>(null)

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false)
  const [editItems, setEditItems] = useState<{ productId: number; productName: string; quantity: number; price: number; discountType?: 'percentage' | 'fixed'; discountValue?: number }[]>([])
  const [editDiscountType, setEditDiscountType] = useState<'percentage' | 'fixed' | undefined>(undefined)
  const [editDiscountValue, setEditDiscountValue] = useState<number>(0)
  const [editNotes, setEditNotes] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Return modal ref for Enter navigation
  const returnModalRef = useRef<HTMLDivElement>(null)
  useEnterNavigation(returnModalRef, showReturnModal)

  // ESC key to close modals
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showReturnModal) setShowReturnModal(false)
        if (showDeleteModal && !isDeleting) setShowDeleteModal(false)
        if (showReturnSuccess) setShowReturnSuccess(false)
        if (showPrintPreview) setShowPrintPreview(false)
      }
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [showReturnModal, showDeleteModal, isDeleting, showReturnSuccess, showPrintPreview])

  useEffect(() => {
    if (id) {
      fetchSale()
    }
    // Fetch template config
    settingsService.getInvoiceTemplate().then(setTemplateConfig).catch(console.error)
  }, [id])

  const fetchSale = async () => {
    setIsLoading(true)
    setError('')
    try {
      const data = await salesService.getById(Number(id))
      setSale(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ في تحميل البيانات')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePrint = () => {
    setShowPrintPreview(true)
  }

  const getInvoiceData = useCallback((): InvoiceData | null => {
    if (!sale) return null

    const invoiceRemaining = Math.max(0, (sale.total || 0) - (sale.paid || 0))
    const previousBalance = sale.customer?.balance ? sale.customer.balance - invoiceRemaining : 0

    return {
      invoiceNumber: sale.invoiceNumber || `${sale.id}`,
      invoiceType: 'sale',
      date: sale.date,
      status: getStatus().label,
      partyName: sale.customer?.name || sale.supplier?.name,
      partyPhone: sale.customer?.phone || sale.supplier?.phone,
      partyBalance: previousBalance,
      items: (sale.items || []).map(item => ({
        name: item.productName || item.product?.name || `منتج ${item.productId}`,
        quantity: item.quantity || 0,
        price: item.price || 0,
        discount: item.discountValue || 0,
        total: item.total || (item.quantity || 0) * (item.price || 0),
      })),
      subtotal: sale.subtotal || 0,
      discountType: sale.discountType,
      discountValue: sale.discountValue,
      discountAmount: sale.discountAmount || 0,
      total: sale.total || 0,
      paid: sale.paid || 0,
      remaining: invoiceRemaining,
      grandTotal: (sale.total || 0) + previousBalance,
      notes: sale.notes,
    }
  }, [sale])

  const handleExportImage = async () => {
    if (!sale) return

    // Create a temporary container for the invoice
    const container = document.createElement('div')
    container.style.position = 'absolute'
    container.style.left = '-9999px'
    container.style.top = '0'
    document.body.appendChild(container)

    // Import html2canvas dynamically
    try {
      const html2canvas = (await import('html2canvas')).default

      // Create the invoice HTML
      const invoiceData = getInvoiceData()
      if (!invoiceData) return

      // Get template config values
      const primaryColor = templateConfig?.primaryColor || '#7c2d12'
      const bgColor = templateConfig?.backgroundColor || '#ffffff'

      // Helper to check element visibility
      const isVisible = (id: string) => {
        const el = templateConfig?.elements.find(e => e.id === id)
        return el ? el.visible : true
      }

      // Helper to get element value
      const getValue = (id: string, defaultVal: string) => {
        const el = templateConfig?.elements.find(e => e.id === id)
        return el?.value || defaultVal
      }

      // Render a simplified version for image export with logo and watermark
      container.innerHTML = `
        <div id="invoice-export" style="
          width: 794px;
          min-height: 1123px;
          padding: 40px;
          background: ${bgColor};
          font-family: 'Madani', Arial, sans-serif;
          direction: rtl;
          position: relative;
          overflow: hidden;
        ">
          <!-- Watermark -->
          ${isVisible('logo') ? `
          <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); opacity: 0.06; pointer-events: none; z-index: 0;">
            <img src="/images/logo.png" alt="" style="width: 300px; height: auto;" />
          </div>
          ` : ''}

          <!-- Header with Logo -->
          <div style="display: flex; flex-direction: column; align-items: center; text-align: center; margin-bottom: 20px; position: relative; z-index: 1;">
            ${isVisible('logo') ? `
            <img src="/images/logo.png" alt="Trust Logo" style="width: 100px; height: 100px; object-fit: contain; margin-bottom: 10px;" />
            ` : ''}
            ${isVisible('companyNameAr') ? `
            <h1 style="margin: 0; font-size: 24px; color: ${primaryColor}; font-weight: 700;">${getValue('companyNameAr', 'ترست للمستلزمات البيطرية')}</h1>
            ` : ''}
            ${isVisible('companyNameEn') ? `
            <p style="margin: 5px 0 0; color: #6b7280; font-size: 14px; font-weight: 500;">${getValue('companyNameEn', 'Trust Veterinary Supplies')}</p>
            ` : ''}
            <div style="display: flex; gap: 15px; margin-top: 10px; font-size: 12px; color: #4b5563;">
              ${isVisible('companyAddress') ? `<span>${getValue('companyAddress', 'القاهرة، مصر')}</span>` : ''}
              ${isVisible('companyPhone1') ? `<span>هاتف: ${getValue('companyPhone1', '01000000000')}</span>` : ''}
            </div>
          </div>

          <!-- Divider -->
          <div style="height: 2px; background: ${primaryColor}; margin-bottom: 20px; position: relative; z-index: 1;"></div>

          <!-- Invoice Title -->
          ${isVisible('invoiceTitle') ? `
          <h2 style="text-align: center; font-size: 22px; margin: 0 0 20px; position: relative; z-index: 1;">
            <span style="padding: 8px 30px; border-bottom: 3px solid ${primaryColor}; display: inline-block;">فاتورة بيع</span>
          </h2>
          ` : ''}

          <!-- Invoice Info - Two Column Layout -->
          <div style="display: flex; justify-content: space-between; margin-bottom: 20px; padding: 12px 16px; background: #f9fafb; border-radius: 6px; border: 1px solid #e5e7eb; position: relative; z-index: 1; font-family: 'Madani', Arial, sans-serif;">
            <div style="display: flex; flex-direction: column; gap: 8px;">
              ${isVisible('invoiceNumber') ? `
              <div style="display: flex; align-items: center; gap: 8px; font-family: 'Madani', Arial, sans-serif;">
                <span style="font-size: 12px; color: #6b7280;">رقم الفاتورة:</span>
                <span style="font-size: 12px; font-weight: 600; color: #1f2937;">${invoiceData.invoiceNumber}</span>
              </div>
              ` : ''}
              ${isVisible('clientName') ? `
              <div style="display: flex; align-items: center; gap: 8px; font-family: 'Madani', Arial, sans-serif;">
                <span style="font-size: 12px; color: #6b7280;">العميل:</span>
                <span style="font-size: 12px; font-weight: 600; color: #1f2937;">${invoiceData.partyName || 'نقدي'}</span>
              </div>
              ` : ''}
            </div>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              ${isVisible('invoiceDate') ? `
              <div style="display: flex; align-items: center; gap: 8px; font-family: 'Madani', Arial, sans-serif;">
                <span style="font-size: 12px; color: #6b7280;">التاريخ:</span>
                <span style="font-size: 12px; font-weight: 600; color: #1f2937;">${formatDate(invoiceData.date)}</span>
              </div>
              ` : ''}
              ${isVisible('clientPhone') && invoiceData.partyPhone ? `
              <div style="display: flex; align-items: center; gap: 8px; font-family: 'Madani', Arial, sans-serif;">
                <span style="font-size: 12px; color: #6b7280;">الهاتف:</span>
                <span style="font-size: 12px; font-weight: 600; color: #1f2937;">${invoiceData.partyPhone}</span>
              </div>
              ` : ''}
              <div style="display: flex; align-items: center; gap: 8px; font-family: 'Madani', Arial, sans-serif;">
                <span style="font-size: 12px; color: #6b7280;">الحالة:</span>
                <span style="font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 12px; background: ${invoiceData.status === 'مكتمل' ? '#dcfce7' : invoiceData.status === 'جزئي' ? '#fef3c7' : '#fee2e2'}; color: ${invoiceData.status === 'مكتمل' ? '#166534' : invoiceData.status === 'جزئي' ? '#92400e' : '#991b1b'};">${invoiceData.status}</span>
              </div>
            </div>
          </div>

          <!-- Items Table -->
          ${isVisible('itemsTable') ? `
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; position: relative; z-index: 1;">
            <thead>
              <tr style="background: ${primaryColor}; color: white;">
                <th style="padding: 12px; text-align: center; border: 1px solid ${primaryColor}; font-weight: 600;">#</th>
                <th style="padding: 12px; text-align: right; border: 1px solid ${primaryColor}; font-weight: 600;">الصنف</th>
                <th style="padding: 12px; text-align: center; border: 1px solid ${primaryColor}; font-weight: 600;">الكمية</th>
                <th style="padding: 12px; text-align: center; border: 1px solid ${primaryColor}; font-weight: 600;">السعر</th>
                <th style="padding: 12px; text-align: center; border: 1px solid ${primaryColor}; font-weight: 600;">الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              ${invoiceData.items.map((item, i) => `
                <tr>
                  <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: center; background: white;">${i + 1}</td>
                  <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: right; background: white;">${item.name}</td>
                  <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: center; background: white;">${item.quantity}</td>
                  <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: center; background: white;">${formatCurrency(item.price)}</td>
                  <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: center; background: white;">${formatCurrency(item.total)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          ` : ''}

          <!-- Totals - Left aligned (matching InvoiceTemplate exactly) -->
          ${isVisible('totalsSection') ? `
          <div style="display: flex; justify-content: flex-end; margin-bottom: 20px; position: relative; z-index: 1;">
            <div style="width: 280px; padding: 12px 16px; background: #f9fafb; border-radius: 6px; border: 1px solid #e5e7eb; font-family: 'Madani', Arial, sans-serif;">
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px dashed #e5e7eb;">
                <span style="font-size: 12px; color: #6b7280;">الإجمالي الفرعي:</span>
                <span style="font-size: 13px; font-weight: 600; color: #1f2937;">${formatCurrency(invoiceData.subtotal)}</span>
              </div>
              ${invoiceData.discountAmount && invoiceData.discountAmount > 0 ? `
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px dashed #e5e7eb;">
                <span style="font-size: 12px; color: #6b7280;">الخصم:</span>
                <span style="font-size: 13px; font-weight: 600; color: #dc2626;">- ${formatCurrency(invoiceData.discountAmount)}</span>
              </div>
              ` : ''}
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px dashed #e5e7eb;">
                <span style="font-size: 12px; font-weight: 600; color: #6b7280;">المطلوب:</span>
                <span style="font-size: 13px; font-weight: 600; color: #1f2937;">${formatCurrency(invoiceData.total)}</span>
              </div>
              ${invoiceData.partyBalance && invoiceData.partyBalance !== 0 ? `
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px dashed #e5e7eb;">
                <span style="font-size: 12px; color: #6b7280;">حساب سابق:</span>
                <span style="font-size: 13px; font-weight: 600; color: ${invoiceData.partyBalance > 0 ? '#dc2626' : '#16a34a'};">${invoiceData.partyBalance > 0 ? formatCurrency(invoiceData.partyBalance) : '-' + formatCurrency(Math.abs(invoiceData.partyBalance))}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 2px solid ${primaryColor}; margin-top: 4px;">
                <span style="font-size: 14px; font-weight: 700; color: #1f2937;">الإجمالي:</span>
                <span style="font-size: 16px; font-weight: 700; color: ${primaryColor};">${formatCurrency(invoiceData.grandTotal || invoiceData.total)}</span>
              </div>
              ` : `
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 2px solid ${primaryColor}; margin-top: 4px;">
                <span style="font-size: 14px; font-weight: 700; color: #1f2937;">الإجمالي:</span>
                <span style="font-size: 16px; font-weight: 700; color: ${primaryColor};">${formatCurrency(invoiceData.total)}</span>
              </div>
              `}
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px dashed #e5e7eb;">
                <span style="font-size: 12px; color: #6b7280;">المدفوع:</span>
                <span style="font-size: 13px; font-weight: 600; color: #16a34a;">${formatCurrency(invoiceData.paid || 0)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; margin-top: 4px; border-top: 1px solid #e5e7eb; border-bottom: none;">
                <span style="font-size: 12px; font-weight: 700; color: #1f2937;">المتبقي:</span>
                <span style="font-size: 14px; font-weight: 700; color: ${((invoiceData.grandTotal || invoiceData.total) - (invoiceData.paid || 0)) > 0 ? '#dc2626' : '#16a34a'};">${formatCurrency(Math.max(0, (invoiceData.grandTotal || invoiceData.total) - (invoiceData.paid || 0)))}</span>
              </div>
            </div>
          </div>
          ` : ''}

          ${invoiceData.notes ? `
            <div style="margin-top: 20px; padding: 12px 16px; background: #fefce8; border-radius: 8px; border: 1px solid #fef08a; position: relative; z-index: 1;">
              <strong style="color: #854d0e; font-size: 12px;">ملاحظات:</strong>
              <p style="margin: 5px 0 0; color: #713f12; font-size: 12px;">${invoiceData.notes}</p>
            </div>
          ` : ''}

          <!-- Footer -->
          <div style="margin-top: 40px; text-align: center; color: #6b7280; font-size: 12px; position: relative; z-index: 1;">
            ${isVisible('footerText1') ? `
            <p style="margin: 0;">${getValue('footerText1', 'شكراً لتعاملكم معنا')}</p>
            ` : ''}
            ${isVisible('footerText2') ? `
            <p style="margin: 4px 0 0; font-size: 10px; color: #9ca3af;">${getValue('footerText2', 'تم الإنشاء بواسطة نظام ترست للإدارة')}</p>
            ` : ''}
          </div>
        </div>
      `

      const element = document.getElementById('invoice-export')
      if (!element) return

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: bgColor,
      })

      // Download as image
      const link = document.createElement('a')
      link.download = `فاتورة-${invoiceData.invoiceNumber}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()

    } catch (err) {
      console.error('Error exporting image:', err)
      alert('حدث خطأ في تصدير الصورة')
    } finally {
      document.body.removeChild(container)
    }
  }

  const openReturnModal = (item: SaleItem) => {
    setSelectedItem(item)
    setReturnQuantity(1)
    setReturnReason('')
    // Smart default: cash refund only if invoice is fully paid
    const invoicePaid = sale?.paid || 0
    const invoiceTotal = sale?.total || 0
    setRefundPaid(invoicePaid >= invoiceTotal && invoiceTotal > 0)
    setShowReturnModal(true)
  }

  const handleSubmitReturn = async () => {
    if (!selectedItem || !sale) return
    if (returnQuantity < 1 || returnQuantity > (selectedItem.quantity || 1)) {
      setError('الكمية غير صالحة')
      return
    }

    setIsSubmittingReturn(true)
    setError('')

    try {
      // Force balance credit if invoice is not paid at all
      const effectiveRefundPaid = (sale.paid || 0) === 0 ? false : refundPaid

      await returnsService.create({
        type: 'مرتجع بيع',
        customerId: sale.customerId || undefined,
        items: [{
          productId: selectedItem.productId,
          quantity: returnQuantity,
          price: selectedItem.price
        }],
        reason: returnReason || undefined,
        refundPaid: effectiveRefundPaid
      })

      setShowReturnModal(false)
      setShowReturnSuccess(true)

      // Refresh sale data
      await fetchSale()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ في إنشاء المرتجع')
    } finally {
      setIsSubmittingReturn(false)
    }
  }

  const handleDelete = async () => {
    if (!sale) return

    setIsDeleting(true)
    setError('')

    try {
      await salesService.delete(sale.id, adjustBalance)
      router.push('/sales')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ في حذف الفاتورة')
      setShowDeleteModal(false)
    } finally {
      setIsDeleting(false)
    }
  }

  const startEdit = () => {
    if (!sale) return
    setEditItems(
      (sale.items || []).map(item => ({
        productId: item.productId,
        productName: item.productName || item.product?.name || `منتج ${item.productId}`,
        quantity: item.quantity || 0,
        price: item.price || 0,
        discountType: item.discountType,
        discountValue: item.discountValue || 0,
      }))
    )
    setEditDiscountType(sale.discountType)
    setEditDiscountValue(sale.discountValue || 0)
    setEditNotes(sale.notes || '')
    setIsEditing(true)
  }

  const cancelEdit = () => {
    setIsEditing(false)
    setError('')
  }

  const handleSave = async () => {
    if (!sale) return

    // Validation
    if (editItems.length === 0) {
      setError('يجب إضافة صنف واحد على الأقل')
      return
    }

    for (const item of editItems) {
      if (item.quantity < 1) {
        setError('الكمية يجب أن تكون أكبر من صفر')
        return
      }
      if (item.price < 0) {
        setError('السعر لا يمكن أن يكون سالباً')
        return
      }
    }

    setIsSaving(true)
    setError('')

    try {
      const data: UpdateSaleInput = {
        items: editItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          discountType: item.discountType,
          discountValue: item.discountValue || 0,
        })),
        discountType: editDiscountType,
        discountValue: editDiscountValue || 0,
        notes: editNotes || undefined,
      }

      await salesService.update(sale.id, data)
      await fetchSale()
      setIsEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ في حفظ التعديلات')
    } finally {
      setIsSaving(false)
    }
  }

  const removeEditItem = (index: number) => {
    if (editItems.length <= 1) {
      setError('يجب إضافة صنف واحد على الأقل')
      return
    }
    setEditItems(editItems.filter((_, i) => i !== index))
  }

  const updateEditItem = (index: number, field: string, value: number | string) => {
    setEditItems(editItems.map((item, i) => i === index ? { ...item, [field]: value } : item))
  }

  const getEditSubtotal = () => {
    return editItems.reduce((sum, item) => {
      const lineTotal = item.quantity * item.price
      let lineDiscount = 0
      if (item.discountType && (item.discountValue || 0) > 0) {
        if (item.discountType === 'percentage') {
          lineDiscount = (lineTotal * (item.discountValue || 0)) / 100
        } else {
          lineDiscount = item.discountValue || 0
        }
      }
      return sum + lineTotal - lineDiscount
    }, 0)
  }

  const getEditTotal = () => {
    const subtotal = getEditSubtotal()
    let discount = 0
    if (editDiscountType && editDiscountValue > 0) {
      if (editDiscountType === 'percentage') {
        discount = (subtotal * editDiscountValue) / 100
      } else {
        discount = editDiscountValue
      }
    }
    return subtotal - discount
  }

  const getEditInvoiceDiscount = () => {
    const subtotal = getEditSubtotal()
    if (editDiscountType && editDiscountValue > 0) {
      if (editDiscountType === 'percentage') {
        return (subtotal * editDiscountValue) / 100
      } else {
        return editDiscountValue
      }
    }
    return 0
  }

  const getStatus = () => {
    if (!sale) return { label: '', color: '', bg: '' }
    const remaining = sale.total - sale.paid
    if (remaining <= 0) return { label: 'مكتمل', color: '#2e7d32', bg: '#e8f5e9' }
    if (sale.paid > 0) return { label: 'جزئي', color: '#ef6c00', bg: '#fff3e0' }
    return { label: 'معلق', color: '#c62828', bg: '#ffebee' }
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div style={styles.loadingContainer}>
          <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
          <span>جاري تحميل البيانات...</span>
        </div>
        <style jsx global>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </MainLayout>
    )
  }

  if (error && !sale) {
    return (
      <MainLayout>
        <div style={styles.errorContainer}>
          <AlertTriangle size={32} color="#c62828" />
          <span>{error}</span>
          <button onClick={fetchSale} style={styles.retryButton}>إعادة المحاولة</button>
        </div>
      </MainLayout>
    )
  }

  if (!sale) return null

  const status = getStatus()

  return (
    <MainLayout>
      <div style={styles.container}>
        <div className="detail-header" style={styles.header}>
          <div className="detail-header-right" style={styles.headerRight}>
            <Link href="/sales" style={styles.backButton}>
              <ArrowRight size={20} />
            </Link>
            <h1 style={styles.title}>فاتورة بيع #{sale.invoiceNumber || sale.id}</h1>
          </div>
          <div className="detail-actions" style={styles.actions}>
            {isEditing ? (
              <>
                <button onClick={handleSave} disabled={isSaving} style={{ ...styles.saveButton, opacity: isSaving ? 0.6 : 1 }}>
                  {isSaving ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={18} />}
                  <span>{isSaving ? 'جاري الحفظ...' : 'حفظ'}</span>
                </button>
                <button onClick={cancelEdit} disabled={isSaving} style={styles.actionButton}>
                  <XCircle size={18} />
                  <span>إلغاء</span>
                </button>
              </>
            ) : (
              <>
                <button onClick={startEdit} style={styles.editButton}>
                  <Edit2 size={18} />
                  <span>تعديل</span>
                </button>
                <button onClick={handlePrint} style={styles.actionButton}>
                  <Printer size={18} />
                  <span>طباعة</span>
                </button>
                <button onClick={handleExportImage} style={styles.actionButton}>
                  <ImageIcon size={18} />
                  <span>تصدير صورة</span>
                </button>
                <button onClick={() => setShowDeleteModal(true)} style={styles.deleteActionButton}>
                  <Trash2 size={18} />
                  <span>حذف</span>
                </button>
              </>
            )}
          </div>
        </div>

        {error && <div style={styles.errorBox}>{error}</div>}

        <div style={styles.content}>
          <div style={styles.infoCard}>
            <h3 style={styles.cardTitle}>معلومات الفاتورة</h3>
            <div style={styles.infoGrid}>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>{sale.supplier ? 'المورد' : 'العميل'}</span>
                {sale.customer ? (
                  <Link href={`/customers/${sale.customer.id}`} style={styles.entityLink}>
                    {sale.customer.name}
                  </Link>
                ) : sale.supplier ? (
                  <Link href={`/suppliers/${sale.supplier.id}`} style={styles.entityLink}>
                    {sale.supplier.name}
                  </Link>
                ) : (
                  <span style={styles.infoValue}>عميل نقدي</span>
                )}
              </div>
              {(sale.customer?.phone || sale.supplier?.phone) && (
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>الهاتف</span>
                  <span style={styles.infoValue}>{sale.customer?.phone || sale.supplier?.phone}</span>
                </div>
              )}
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>التاريخ</span>
                <span style={styles.infoValue}>{formatDate(sale.date)}</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>الحالة</span>
                <span style={{ ...styles.status, backgroundColor: status.bg, color: status.color }}>
                  {status.label}
                </span>
              </div>
              {isEditing ? (
                <div style={{ ...styles.infoItem, gridColumn: 'span 2' }}>
                  <span style={styles.infoLabel}>ملاحظات</span>
                  <input
                    type="text"
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="ملاحظات..."
                    style={styles.editInput}
                  />
                </div>
              ) : sale.notes ? (
                <div style={{ ...styles.infoItem, gridColumn: 'span 2' }}>
                  <span style={styles.infoLabel}>ملاحظات</span>
                  <span style={styles.infoValue}>{sale.notes}</span>
                </div>
              ) : null}
            </div>
          </div>

          <div className="items-card" style={styles.itemsCard}>
            <h3 style={styles.cardTitle}>المنتجات</h3>
            <div className="table-container" style={{ overflowX: 'auto' }}>
            {isEditing ? (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>المنتج</th>
                    <th style={{ ...styles.th, width: '100px' }}>الكمية</th>
                    <th style={{ ...styles.th, width: '120px' }}>السعر</th>
                    <th style={{ ...styles.th, width: '100px' }}>خصم</th>
                    <th style={styles.th}>الإجمالي</th>
                    <th style={{ ...styles.th, width: '50px', textAlign: 'center' }}>حذف</th>
                  </tr>
                </thead>
                <tbody>
                  {editItems.map((item, index) => {
                    const lineTotal = item.quantity * item.price
                    let lineDiscount = 0
                    if (item.discountType && (item.discountValue || 0) > 0) {
                      if (item.discountType === 'percentage') {
                        lineDiscount = (lineTotal * (item.discountValue || 0)) / 100
                      } else {
                        lineDiscount = item.discountValue || 0
                      }
                    }
                    const itemTotal = lineTotal - lineDiscount
                    return (
                      <tr key={index}>
                        <td style={styles.td}>{item.productName}</td>
                        <td style={styles.td}>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateEditItem(index, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                            style={styles.editInputSmall}
                          />
                        </td>
                        <td style={styles.td}>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.price}
                            onChange={(e) => updateEditItem(index, 'price', Math.max(0, parseFloat(e.target.value) || 0))}
                            style={styles.editInputSmall}
                          />
                        </td>
                        <td style={styles.td}>
                          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.discountValue || 0}
                              onChange={(e) => updateEditItem(index, 'discountValue', Math.max(0, parseFloat(e.target.value) || 0))}
                              style={{ ...styles.editInputSmall, width: '60px' }}
                            />
                            <select
                              value={item.discountType || 'fixed'}
                              onChange={(e) => updateEditItem(index, 'discountType', e.target.value)}
                              style={{ ...styles.editInputSmall, width: '40px', padding: '6px 2px', fontSize: '11px' }}
                            >
                              <option value="fixed">ج</option>
                              <option value="percentage">%</option>
                            </select>
                          </div>
                        </td>
                        <td style={styles.td}>{formatCurrency(itemTotal)}</td>
                        <td style={{ ...styles.td, textAlign: 'center' }}>
                          <button
                            onClick={() => removeEditItem(index)}
                            style={styles.returnButton}
                            title="حذف الصنف"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>المنتج</th>
                    <th style={styles.th}>الكمية</th>
                    <th style={styles.th}>السعر</th>
                    <th style={styles.th}>الإجمالي</th>
                    <th style={{ ...styles.th, width: '80px', textAlign: 'center' }}>مرتجع</th>
                  </tr>
                </thead>
                <tbody>
                  {(sale.items || []).map((item, index) => (
                    <tr key={index}>
                      <td style={styles.td}>{item.productName || item.product?.name || `منتج ${item.productId}`}</td>
                      <td style={styles.td}>{item.quantity || 0}</td>
                      <td style={styles.td}>{formatCurrency(item.price)}</td>
                      <td style={styles.td}>{formatCurrency(item.total || (item.quantity || 0) * (item.price || 0))}</td>
                      <td style={{ ...styles.td, textAlign: 'center' }}>
                        <button
                          onClick={() => openReturnModal(item)}
                          style={styles.returnButton}
                          title="إرجاع هذا المنتج"
                        >
                          <RotateCcw size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            </div>
            {isEditing ? (
              <div style={styles.totals}>
                <div style={styles.totalRow}>
                  <span>الإجمالي الفرعي</span>
                  <span>{formatCurrency(getEditSubtotal())}</span>
                </div>
                <div style={{ ...styles.totalRow, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>خصم الفاتورة</span>
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editDiscountValue}
                      onChange={(e) => setEditDiscountValue(Math.max(0, parseFloat(e.target.value) || 0))}
                      style={{ ...styles.editInputSmall, width: '80px' }}
                    />
                    <select
                      value={editDiscountType || 'fixed'}
                      onChange={(e) => setEditDiscountType(e.target.value as 'fixed' | 'percentage')}
                      style={{ ...styles.editInputSmall, width: '50px', padding: '6px 2px', fontSize: '12px' }}
                    >
                      <option value="fixed">ج.م</option>
                      <option value="percentage">%</option>
                    </select>
                  </div>
                  <span style={{ color: '#dc2626' }}>- {formatCurrency(getEditInvoiceDiscount())}</span>
                </div>
                <div style={{ ...styles.totalRow, ...styles.totalRowFinal }}>
                  <span>الإجمالي</span>
                  <span>{formatCurrency(getEditTotal())}</span>
                </div>
                <div style={styles.totalRow}>
                  <span>المدفوع</span>
                  <span style={{ color: '#2e7d32' }}>{formatCurrency(sale.paid)}</span>
                </div>
                <div style={{ ...styles.totalRow, fontWeight: 600, borderTop: '1px solid var(--color-border)', paddingTop: '12px', marginTop: '4px' }}>
                  <span>المتبقي (بعد التعديل)</span>
                  <span style={{ color: getEditTotal() - sale.paid > 0 ? '#c62828' : '#2e7d32', fontSize: '16px' }}>
                    {formatCurrency(Math.max(0, getEditTotal() - sale.paid))}
                  </span>
                </div>
              </div>
            ) : (
              <div style={styles.totals}>
                <div style={styles.totalRow}>
                  <span>الإجمالي الفرعي</span>
                  <span>{formatCurrency(sale.subtotal)}</span>
                </div>
                {sale.discountAmount > 0 && (
                  <div style={{ ...styles.totalRow, color: '#dc2626' }}>
                    <span>الخصم</span>
                    <span>- {formatCurrency(sale.discountAmount)}</span>
                  </div>
                )}
                <div style={{ ...styles.totalRow, fontWeight: 600 }}>
                  <span>المطلوب</span>
                  <span>{formatCurrency(sale.total)}</span>
                </div>
                {(sale.customer?.balance !== undefined && sale.customer.balance !== 0) && (() => {
                  const invoiceRemaining = Math.max(0, sale.total - sale.paid)
                  const previousBalance = sale.customer!.balance - invoiceRemaining
                  if (previousBalance === 0) return null
                  return (
                    <>
                      <div style={styles.totalRow}>
                        <span>حساب سابق</span>
                        <span style={{ color: previousBalance > 0 ? '#c62828' : '#2e7d32' }}>
                          {previousBalance > 0 ? '' : '-'}{formatCurrency(Math.abs(previousBalance))}
                        </span>
                      </div>
                      <div style={{ ...styles.totalRow, ...styles.totalRowFinal }}>
                        <span>الإجمالي</span>
                        <span>{formatCurrency(sale.total + previousBalance)}</span>
                      </div>
                    </>
                  )
                })()}
                {(!sale.customer?.balance || sale.customer.balance === 0 || (sale.customer.balance - Math.max(0, sale.total - sale.paid)) === 0) && (
                  <div style={{ ...styles.totalRow, ...styles.totalRowFinal }}>
                    <span>الإجمالي</span>
                    <span>{formatCurrency(sale.total)}</span>
                  </div>
                )}
                <div style={styles.totalRow}>
                  <span>المدفوع</span>
                  <span style={{ color: '#2e7d32' }}>{formatCurrency(sale.paid)}</span>
                </div>
                <div style={{ ...styles.totalRow, fontWeight: 600, borderTop: '1px solid var(--color-border)', paddingTop: '12px', marginTop: '4px' }}>
                  <span>المتبقي</span>
                  {(() => {
                    const invoiceRemaining = Math.max(0, sale.total - sale.paid)
                    const previousBalance = sale.customer?.balance ? sale.customer.balance - invoiceRemaining : 0
                    const totalRemaining = invoiceRemaining + previousBalance
                    return (
                      <span style={{ color: totalRemaining > 0 ? '#c62828' : '#2e7d32', fontSize: '16px' }}>
                        {formatCurrency(Math.max(0, totalRemaining))}
                      </span>
                    )
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Return Modal */}
      {showReturnModal && selectedItem && (
        <div style={styles.modalOverlay} onClick={() => setShowReturnModal(false)}>
          <div ref={returnModalRef} className="modal-content" style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>
                <RotateCcw size={20} />
                إرجاع منتج
              </h3>
              <button onClick={() => setShowReturnModal(false)} style={styles.modalClose}>
                <X size={20} />
              </button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.returnProductInfo}>
                <span style={styles.returnProductName}>
                  {selectedItem.productName || selectedItem.product?.name || `منتج ${selectedItem.productId}`}
                </span>
                <span style={styles.returnProductPrice}>
                  السعر: {formatCurrency(selectedItem.price)}
                </span>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>الكمية المراد إرجاعها *</label>
                <div style={styles.quantityInputWrapper}>
                  <input
                    type="number"
                    min="1"
                    max={selectedItem.quantity || 1}
                    value={returnQuantity}
                    onChange={(e) => setReturnQuantity(Math.min(selectedItem.quantity || 1, Math.max(1, parseInt(e.target.value) || 1)))}
                    style={styles.formInput}
                  />
                  <span style={styles.maxQuantity}>من أصل {selectedItem.quantity || 1}</span>
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>سبب الإرجاع (اختياري)</label>
                <input
                  type="text"
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  placeholder="مثال: منتج تالف، خطأ في الطلب..."
                  style={styles.formInput}
                />
              </div>

              {sale?.customerId && (() => {
                const invoicePaid = sale.paid || 0
                const invoiceTotal = sale.total || 0
                const isNotPaid = invoicePaid === 0
                const isPartiallyPaid = invoicePaid > 0 && invoicePaid < invoiceTotal
                const currentReturnTotal = returnQuantity * (selectedItem?.price || 0)

                return (
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>طريقة الاسترداد</label>
                    {isNotPaid ? (
                      <div style={{
                        padding: '12px 16px',
                        backgroundColor: '#eff6ff',
                        border: '1px solid #bfdbfe',
                        borderRadius: '8px',
                      }}>
                        <span style={{ fontSize: '13px', fontWeight: 500, color: '#1e40af' }}>
                          الفاتورة غير مدفوعة - سيتم خصم المبلغ من رصيد العميل
                        </span>
                      </div>
                    ) : (
                      <>
                        {isPartiallyPaid && (
                          <div style={{
                            padding: '8px 12px',
                            backgroundColor: '#fff7ed',
                            border: '1px solid #fed7aa',
                            borderRadius: '6px',
                            marginBottom: '8px',
                          }}>
                            <span style={{ fontSize: '12px', color: '#9a3412' }}>
                              الفاتورة مدفوعة جزئياً ({formatCurrency(invoicePaid)} من {formatCurrency(invoiceTotal)})
                            </span>
                          </div>
                        )}
                        <div style={styles.refundOptions}>
                          <label style={styles.radioLabel}>
                            <input
                              type="radio"
                              name="refundType"
                              checked={refundPaid}
                              onChange={() => setRefundPaid(true)}
                              style={styles.radio}
                            />
                            <span>استرداد نقدي للعميل</span>
                          </label>
                          <label style={styles.radioLabel}>
                            <input
                              type="radio"
                              name="refundType"
                              checked={!refundPaid}
                              onChange={() => setRefundPaid(false)}
                              style={styles.radio}
                            />
                            <span>خصم من رصيد العميل</span>
                          </label>
                        </div>
                        {isPartiallyPaid && refundPaid && currentReturnTotal > invoicePaid && (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 12px',
                            backgroundColor: '#fef3c7',
                            border: '1px solid #fde68a',
                            borderRadius: '6px',
                            marginTop: '8px',
                          }}>
                            <AlertTriangle size={14} color="#92400e" />
                            <span style={{ fontSize: '12px', color: '#92400e' }}>
                              مبلغ المرتجع ({formatCurrency(currentReturnTotal)}) أكبر من المدفوع ({formatCurrency(invoicePaid)}) - يُنصح بخصم من الرصيد
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )
              })()}

              <div style={styles.returnSummary}>
                <span>إجمالي المرتجع</span>
                <span style={styles.returnTotal}>{formatCurrency(returnQuantity * selectedItem.price)}</span>
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button
                onClick={() => setShowReturnModal(false)}
                style={styles.cancelButton}
                disabled={isSubmittingReturn}
              >
                إلغاء
              </button>
              <button
                onClick={handleSubmitReturn}
                disabled={isSubmittingReturn}
                style={{
                  ...styles.confirmButton,
                  opacity: isSubmittingReturn ? 0.6 : 1
                }}
              >
                {isSubmittingReturn ? (
                  <>
                    <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <RotateCcw size={16} />
                    تأكيد الإرجاع
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return Success Modal */}
      {showReturnSuccess && (
        <div style={styles.modalOverlay} onClick={() => setShowReturnSuccess(false)}>
          <div style={styles.successModal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.successIconWrapper}>
              <CheckCircle2 size={48} style={{ color: '#10b981' }} />
            </div>
            <h3 style={styles.successTitle}>تم إنشاء المرتجع بنجاح</h3>
            <p style={styles.successText}>
              تم تسجيل المرتجع وتحديث المخزون
              {(sale?.paid || 0) === 0
                ? ' وخصم المبلغ من رصيد العميل'
                : refundPaid
                  ? ' وسيتم خصم المبلغ من الخزينة'
                  : ' وخصم المبلغ من رصيد العميل'}
            </p>
            <button
              onClick={() => setShowReturnSuccess(false)}
              style={styles.successButton}
            >
              حسناً
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div style={styles.modalOverlay} onClick={() => !isDeleting && setShowDeleteModal(false)}>
          <div style={styles.deleteModal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.deleteIconWrapper}>
              <Trash2 size={48} style={{ color: '#dc2626' }} />
            </div>
            <h3 style={styles.deleteTitle}>حذف الفاتورة</h3>
            <p style={styles.deleteText}>
              هل أنت متأكد من حذف هذه الفاتورة؟
              <br />
              سيتم إرجاع المنتجات للمخزون.
            </p>

            {sale?.customerId && (
              <div style={styles.balanceOptionWrapper}>
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={adjustBalance}
                    onChange={(e) => setAdjustBalance(e.target.checked)}
                    style={styles.checkbox}
                  />
                  <span>تعديل رصيد العميل</span>
                </label>
                <p style={styles.balanceOptionNote}>
                  {adjustBalance
                    ? 'سيتم إضافة قيمة الفاتورة رصيد للعميل'
                    : 'لن يتم تعديل رصيد العميل'}
                </p>
              </div>
            )}

            <div style={styles.deleteActions}>
              <button
                onClick={() => setShowDeleteModal(false)}
                style={styles.deleteCancelButton}
                disabled={isDeleting}
              >
                إلغاء
              </button>
              <button
                onClick={handleDelete}
                style={styles.deleteConfirmButton}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                    جاري الحذف...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    تأكيد الحذف
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Preview Modal */}
      {showPrintPreview && getInvoiceData() && (
        <PrintPreview
          invoice={getInvoiceData()!}
          isOpen={showPrintPreview}
          onClose={() => setShowPrintPreview(false)}
          templateConfig={templateConfig || undefined}
        />
      )}

      <style jsx global>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

        @media (max-width: 768px) {
          .detail-header {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 16px !important;
          }

          .detail-header-right h1 {
            font-size: 16px !important;
          }

          .detail-actions {
            width: 100% !important;
          }

          .detail-actions button,
          .detail-actions a {
            flex: 1 !important;
            justify-content: center !important;
          }

          .table-container {
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch !important;
          }

          .table-container table {
            min-width: 500px !important;
          }

          .modal-content {
            margin: 16px !important;
            max-width: calc(100% - 32px) !important;
          }
        }
      `}</style>
    </MainLayout>
  )
}

const styles: { [key: string]: React.CSSProperties } = {
  container: { width: '100%' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  headerRight: { display: 'flex', alignItems: 'center', gap: '12px' },
  backButton: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' },
  title: { fontSize: '24px', fontWeight: 700 },
  actions: { display: 'flex', gap: '10px' },
  actionButton: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: '14px', color: 'var(--color-text)', cursor: 'pointer' },
  errorBox: { padding: '12px 16px', backgroundColor: '#ffebee', border: '1px solid #ef9a9a', borderRadius: '8px', color: '#c62828', fontSize: '14px', marginBottom: '20px' },
  content: { display: 'flex', flexDirection: 'column', gap: '20px' },
  infoCard: { backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '20px' },
  cardTitle: { fontSize: '16px', fontWeight: 600, marginBottom: '16px' },
  infoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' },
  infoItem: { display: 'flex', flexDirection: 'column', gap: '4px' },
  infoLabel: { fontSize: '12px', color: 'var(--color-text-secondary)' },
  infoValue: { fontSize: '14px', fontWeight: 500 },
  entityLink: { fontSize: '14px', fontWeight: 500, color: 'var(--color-primary)', textDecoration: 'none', cursor: 'pointer' },
  status: { display: 'inline-block', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 500, width: 'fit-content' },
  itemsCard: { backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '20px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '12px', textAlign: 'right', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', borderBottom: '1px solid var(--color-border)' },
  td: { padding: '12px', fontSize: '14px', borderBottom: '1px solid var(--color-border)' },
  totals: { marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--color-border)' },
  totalRow: { display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '14px' },
  totalRowFinal: { fontWeight: 700, fontSize: '16px', color: 'var(--color-primary)' },
  loadingContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', minHeight: '400px', color: 'var(--color-text-secondary)' },
  errorContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', minHeight: '400px', color: 'var(--color-text-secondary)' },
  retryButton: { padding: '10px 20px', backgroundColor: 'var(--color-primary)', color: '#ffffff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' },

  // Return button
  returnButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    border: '1px solid #fecaca',
    borderRadius: '6px',
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },

  // Modal styles
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    width: '100%',
    maxWidth: '420px',
    margin: '16px',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    borderBottom: '1px solid #e5e7eb',
  },
  modalTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '16px',
    fontWeight: 600,
    margin: 0,
    color: '#1f2937',
  },
  modalClose: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    border: 'none',
    borderRadius: '6px',
    backgroundColor: 'transparent',
    color: '#6b7280',
    cursor: 'pointer',
  },
  modalBody: {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  returnProductInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
  },
  returnProductName: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#1f2937',
  },
  returnProductPrice: {
    fontSize: '13px',
    color: '#6b7280',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  formLabel: {
    fontSize: '13px',
    fontWeight: 500,
    color: '#374151',
  },
  formInput: {
    padding: '10px 14px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
  },
  quantityInputWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  maxQuantity: {
    fontSize: '13px',
    color: '#6b7280',
  },
  refundOptions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  radioLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: '#374151',
    cursor: 'pointer',
  },
  radio: {
    width: '16px',
    height: '16px',
    accentColor: 'var(--color-primary)',
  },
  returnSummary: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    backgroundColor: '#fef2f2',
    borderRadius: '8px',
    border: '1px solid #fecaca',
    marginTop: '8px',
  },
  returnTotal: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#dc2626',
  },
  modalFooter: {
    display: 'flex',
    gap: '10px',
    padding: '16px 20px',
    borderTop: '1px solid #e5e7eb',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    padding: '10px 20px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    backgroundColor: '#fff',
    fontSize: '14px',
    color: '#6b7280',
    cursor: 'pointer',
  },
  confirmButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '8px',
    backgroundColor: '#dc2626',
    fontSize: '14px',
    fontWeight: 500,
    color: '#fff',
    cursor: 'pointer',
  },

  // Success modal
  successModal: {
    backgroundColor: '#fff',
    borderRadius: '16px',
    padding: '32px',
    width: '100%',
    maxWidth: '320px',
    margin: '16px',
    textAlign: 'center',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
  },
  successIconWrapper: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    backgroundColor: '#ecfdf5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px',
  },
  successTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#1f2937',
    margin: '0 0 8px',
  },
  successText: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '0 0 20px',
  },
  successButton: {
    width: '100%',
    padding: '12px 20px',
    border: 'none',
    borderRadius: '8px',
    backgroundColor: 'var(--color-primary)',
    fontSize: '14px',
    fontWeight: 500,
    color: '#fff',
    cursor: 'pointer',
  },

  // Delete action button
  deleteActionButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#dc2626',
    cursor: 'pointer',
  },

  // Delete modal
  deleteModal: {
    backgroundColor: '#fff',
    borderRadius: '16px',
    padding: '32px',
    width: '100%',
    maxWidth: '380px',
    margin: '16px',
    textAlign: 'center',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
  },
  deleteIconWrapper: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    backgroundColor: '#fef2f2',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px',
  },
  deleteTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#1f2937',
    margin: '0 0 8px',
  },
  deleteText: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '0 0 20px',
    lineHeight: 1.6,
  },
  deleteActions: {
    display: 'flex',
    gap: '10px',
  },
  deleteCancelButton: {
    flex: 1,
    padding: '12px 20px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    backgroundColor: '#fff',
    fontSize: '14px',
    color: '#6b7280',
    cursor: 'pointer',
  },
  deleteConfirmButton: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '12px 20px',
    border: 'none',
    borderRadius: '8px',
    backgroundColor: '#dc2626',
    fontSize: '14px',
    fontWeight: 500,
    color: '#fff',
    cursor: 'pointer',
  },

  // Balance option styles
  balanceOptionWrapper: {
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '12px 16px',
    marginBottom: '16px',
    textAlign: 'right',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    fontWeight: 500,
    color: '#1f2937',
    cursor: 'pointer',
  },
  checkbox: {
    width: '18px',
    height: '18px',
    accentColor: 'var(--color-primary)',
    cursor: 'pointer',
  },
  balanceOptionNote: {
    fontSize: '12px',
    color: '#6b7280',
    margin: '8px 0 0 26px',
  },

  // Edit mode styles
  editButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
    backgroundColor: '#eff6ff',
    border: '1px solid #bfdbfe',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#2563eb',
    cursor: 'pointer',
  },
  saveButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
    backgroundColor: '#10b981',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
    color: '#fff',
    cursor: 'pointer',
  },
  editInput: {
    padding: '8px 12px',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none',
    width: '100%',
  },
  editInputSmall: {
    padding: '6px 8px',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    fontSize: '13px',
    outline: 'none',
    width: '80px',
  },
}
