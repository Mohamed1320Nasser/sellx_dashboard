import React, { forwardRef } from 'react'
import { formatCurrency, formatDate } from '@/utils'
import { InvoiceTemplateConfig, TemplateElement } from '@/features/settings/services'

export interface InvoiceItem {
  name: string
  quantity: number
  price: number
  discount?: number
  total: number
}

export interface InvoiceData {
  // Invoice details
  invoiceNumber: string
  invoiceType: 'sale' | 'purchase' | 'return_sale' | 'return_purchase'
  date: string | Date
  status?: string

  // Party details (customer or supplier)
  partyName?: string
  partyPhone?: string
  partyAddress?: string
  partyBalance?: number

  // Items
  items: InvoiceItem[]

  // Totals
  subtotal: number
  discountType?: 'fixed' | 'percentage' | null
  discountValue?: number
  discountAmount?: number
  total: number
  grandTotal?: number
  paid?: number
  remaining?: number

  // Additional
  notes?: string
}

export interface CompanyInfo {
  name: string
  nameEn?: string
  address?: string
  phone?: string
  phone2?: string
  email?: string
  taxNumber?: string
  logo?: string
}

interface InvoiceTemplateProps {
  invoice: InvoiceData
  company?: CompanyInfo
  showLogo?: boolean
  showFooter?: boolean
  templateConfig?: InvoiceTemplateConfig
}

const defaultCompany: CompanyInfo = {
  name: 'ترست للمستلزمات البيطرية',
  nameEn: 'Trust Veterinary Supplies',
  address: 'القاهرة، مصر',
  phone: '01000000000',
  phone2: '01111111111',
}

const getInvoiceTypeLabel = (type: InvoiceData['invoiceType']) => {
  const labels = {
    sale: 'فاتورة بيع',
    purchase: 'فاتورة شراء',
    return_sale: 'مرتجع بيع',
    return_purchase: 'مرتجع شراء',
  }
  return labels[type] || 'فاتورة'
}

const getPartyLabel = (type: InvoiceData['invoiceType']) => {
  if (type === 'sale' || type === 'return_sale') return 'العميل'
  return 'المورد'
}

// Helper to get element from template config
const getElement = (config: InvoiceTemplateConfig | undefined, id: string): TemplateElement | undefined => {
  return config?.elements.find(el => el.id === id)
}

// Helper to check if element is visible
const isElementVisible = (config: InvoiceTemplateConfig | undefined, id: string): boolean => {
  const element = getElement(config, id)
  return element ? element.visible : true
}

// Helper to get element style
const getElementStyle = (config: InvoiceTemplateConfig | undefined, id: string): React.CSSProperties => {
  const element = getElement(config, id)
  if (!element?.style) return {}

  return {
    fontSize: element.style.fontSize ? `${element.style.fontSize}px` : undefined,
    fontWeight: element.style.fontWeight,
    color: element.style.color,
    textAlign: element.style.textAlign,
  }
}

// Helper to get element value (for text elements)
const getElementValue = (config: InvoiceTemplateConfig | undefined, id: string, defaultValue: string): string => {
  const element = getElement(config, id)
  return element?.value || defaultValue
}

export const InvoiceTemplate = forwardRef<HTMLDivElement, InvoiceTemplateProps>(
  ({ invoice, company = defaultCompany, showLogo = true, showFooter = true, templateConfig }, ref) => {
    const invoiceDate = invoice.date instanceof Date ? invoice.date : new Date(invoice.date)
    const logoSrc = company.logo || '/images/logo.png'

    // Get primary color from template config or default
    const primaryColor = templateConfig?.primaryColor || '#7c2d12'

    return (
      <div ref={ref} style={{ ...styles.page, backgroundColor: templateConfig?.backgroundColor || '#ffffff' }}>
        {/* Watermark */}
        {isElementVisible(templateConfig, 'logo') && (
          <div style={styles.watermark}>
            <img
              src={logoSrc}
              alt=""
              style={styles.watermarkImage}
            />
          </div>
        )}

        {/* Header / Letterhead */}
        <div style={styles.header}>
          {showLogo && isElementVisible(templateConfig, 'logo') && (
            <div style={styles.logoContainer}>
              <img
                src={logoSrc}
                alt={company.name}
                style={styles.logo}
              />
            </div>
          )}
          <div style={styles.companyInfo}>
            {isElementVisible(templateConfig, 'companyNameAr') && (
              <h1 style={{ ...styles.companyName, color: primaryColor, ...getElementStyle(templateConfig, 'companyNameAr') }}>
                {getElementValue(templateConfig, 'companyNameAr', company.name)}
              </h1>
            )}
            {isElementVisible(templateConfig, 'companyNameEn') && company.nameEn && (
              <p style={{ ...styles.companyNameEn, ...getElementStyle(templateConfig, 'companyNameEn') }}>
                {getElementValue(templateConfig, 'companyNameEn', company.nameEn)}
              </p>
            )}
            <div style={styles.contactInfo}>
              {isElementVisible(templateConfig, 'companyAddress') && company.address && (
                <span style={{ ...styles.contactItem, ...getElementStyle(templateConfig, 'companyAddress') }}>
                  {getElementValue(templateConfig, 'companyAddress', '') || company.address}
                </span>
              )}
              {isElementVisible(templateConfig, 'companyPhone1') && company.phone && (
                <span style={{ ...styles.contactItem, ...getElementStyle(templateConfig, 'companyPhone1') }}>
                  هاتف: {getElementValue(templateConfig, 'companyPhone1', '') || company.phone}
                </span>
              )}
              {isElementVisible(templateConfig, 'companyPhone2') && company.phone2 && (
                <span style={{ ...styles.contactItem, ...getElementStyle(templateConfig, 'companyPhone2') }}>
                  هاتف 2: {getElementValue(templateConfig, 'companyPhone2', '') || company.phone2}
                </span>
              )}
              {company.taxNumber && (
                <span style={styles.contactItem}>الرقم الضريبي: {company.taxNumber}</span>
              )}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ ...styles.divider, backgroundColor: primaryColor }} />

        {/* Invoice Title */}
        {isElementVisible(templateConfig, 'invoiceTitle') && (
          <div style={styles.invoiceTitle}>
            <h2 style={{ ...styles.titleText, borderBottomColor: primaryColor, ...getElementStyle(templateConfig, 'invoiceTitle') }}>
              {getInvoiceTypeLabel(invoice.invoiceType)}
            </h2>
          </div>
        )}

        {/* Invoice Info - Right Aligned Column Layout */}
        <div style={styles.infoSection}>
          <div style={styles.infoColumn}>
            {isElementVisible(templateConfig, 'invoiceNumber') && (
              <div style={styles.infoItem}>
                <span style={{ ...styles.infoLabel, ...getElementStyle(templateConfig, 'invoiceNumber') }}>رقم الفاتورة:</span>
                <span style={styles.infoValue}>{invoice.invoiceNumber}</span>
              </div>
            )}
            {isElementVisible(templateConfig, 'clientName') && (
              <div style={styles.infoItem}>
                <span style={{ ...styles.infoLabel, ...getElementStyle(templateConfig, 'clientName') }}>{getPartyLabel(invoice.invoiceType)}:</span>
                <span style={styles.infoValue}>{invoice.partyName || 'نقدي'}</span>
              </div>
            )}
          </div>
          <div style={styles.infoColumn}>
            {isElementVisible(templateConfig, 'invoiceDate') && (
              <div style={styles.infoItem}>
                <span style={{ ...styles.infoLabel, ...getElementStyle(templateConfig, 'invoiceDate') }}>التاريخ:</span>
                <span style={styles.infoValue}>{formatDate(invoiceDate)}</span>
              </div>
            )}
            {isElementVisible(templateConfig, 'clientPhone') && invoice.partyPhone && (
              <div style={styles.infoItem}>
                <span style={{ ...styles.infoLabel, ...getElementStyle(templateConfig, 'clientPhone') }}>الهاتف:</span>
                <span style={styles.infoValue}>{invoice.partyPhone}</span>
              </div>
            )}
            {invoice.status && (
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>الحالة:</span>
                <span style={{
                  ...styles.statusBadge,
                  backgroundColor: invoice.status === 'مكتمل' ? '#dcfce7' : invoice.status === 'جزئي' ? '#fef3c7' : '#fee2e2',
                  color: invoice.status === 'مكتمل' ? '#166534' : invoice.status === 'جزئي' ? '#92400e' : '#991b1b',
                }}>{invoice.status}</span>
              </div>
            )}
          </div>
        </div>

        {/* Items Table */}
        {isElementVisible(templateConfig, 'itemsTable') && (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={{ ...styles.th, width: '8%', backgroundColor: primaryColor, borderColor: primaryColor }}>#</th>
                <th style={{ ...styles.th, width: '40%', backgroundColor: primaryColor, borderColor: primaryColor }}>الصنف</th>
                <th style={{ ...styles.th, width: '12%', backgroundColor: primaryColor, borderColor: primaryColor }}>الكمية</th>
                <th style={{ ...styles.th, width: '15%', backgroundColor: primaryColor, borderColor: primaryColor }}>السعر</th>
                {invoice.items.some(item => item.discount && item.discount > 0) && (
                  <th style={{ ...styles.th, width: '10%', backgroundColor: primaryColor, borderColor: primaryColor }}>الخصم</th>
                )}
                <th style={{ ...styles.th, width: '15%', backgroundColor: primaryColor, borderColor: primaryColor }}>الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, index) => (
                <tr key={index}>
                  <td style={styles.td}>{index + 1}</td>
                  <td style={{ ...styles.td, textAlign: 'right' }}>{item.name}</td>
                  <td style={styles.td}>{item.quantity}</td>
                  <td style={styles.td}>{formatCurrency(item.price)}</td>
                  {invoice.items.some(i => i.discount && i.discount > 0) && (
                    <td style={styles.td}>{item.discount ? formatCurrency(item.discount) : '-'}</td>
                  )}
                  <td style={styles.td}>{formatCurrency(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Totals Section - Left aligned */}
        {isElementVisible(templateConfig, 'totalsSection') && (
          <div style={styles.totalsSection}>
            <div style={styles.totalsBox}>
              {/* الإجمالي الفرعي */}
              <div style={styles.totalRow}>
                <span style={styles.totalLabel}>الإجمالي الفرعي:</span>
                <span style={styles.totalValue}>{formatCurrency(invoice.subtotal)}</span>
              </div>

              {/* الخصم */}
              {invoice.discountAmount && invoice.discountAmount > 0 ? (
                <div style={styles.totalRow}>
                  <span style={styles.totalLabel}>
                    الخصم
                    {invoice.discountType === 'percentage' && invoice.discountValue
                      ? ` (${invoice.discountValue}%)`
                      : ''
                    }:
                  </span>
                  <span style={{ ...styles.totalValue, color: '#dc2626' }}>
                    - {formatCurrency(invoice.discountAmount)}
                  </span>
                </div>
              ) : null}

              {/* المطلوب */}
              <div style={styles.totalRow}>
                <span style={{ ...styles.totalLabel, fontWeight: 600 }}>المطلوب:</span>
                <span style={{ ...styles.totalValue, fontWeight: 600 }}>{formatCurrency(invoice.total)}</span>
              </div>

              {/* حساب سابق */}
              {invoice.partyBalance !== undefined && invoice.partyBalance !== 0 ? (
                <>
                  <div style={styles.totalRow}>
                    <span style={styles.totalLabel}>حساب سابق:</span>
                    <span style={{ ...styles.totalValue, color: invoice.partyBalance > 0 ? '#dc2626' : '#16a34a' }}>
                      {invoice.partyBalance > 0 ? formatCurrency(invoice.partyBalance) : '-' + formatCurrency(Math.abs(invoice.partyBalance))}
                    </span>
                  </div>

                  {/* الإجمالي (Grand Total) */}
                  <div style={{ ...styles.totalRowFinal, borderBottomColor: primaryColor }}>
                    <span style={styles.totalLabelFinal}>الإجمالي:</span>
                    <span style={{ ...styles.totalValueFinal, color: primaryColor }}>{formatCurrency(invoice.grandTotal || invoice.total)}</span>
                  </div>
                </>
              ) : (
                <div style={{ ...styles.totalRowFinal, borderBottomColor: primaryColor }}>
                  <span style={styles.totalLabelFinal}>الإجمالي:</span>
                  <span style={{ ...styles.totalValueFinal, color: primaryColor }}>{formatCurrency(invoice.total)}</span>
                </div>
              )}

              {/* المدفوع */}
              <div style={styles.totalRow}>
                <span style={styles.totalLabel}>المدفوع:</span>
                <span style={{ ...styles.totalValue, color: '#16a34a' }}>
                  {formatCurrency(invoice.paid || 0)}
                </span>
              </div>

              {/* المتبقي */}
              {(() => {
                const grandTotal = invoice.grandTotal || invoice.total
                const totalRemaining = Math.max(0, grandTotal - (invoice.paid || 0))
                return (
                  <div style={{ ...styles.totalRow, borderTop: '1px solid #e5e7eb', marginTop: '4px', paddingTop: '8px', borderBottom: 'none' }}>
                    <span style={{ ...styles.totalLabel, fontWeight: 700 }}>المتبقي:</span>
                    <span style={{ ...styles.totalValue, color: totalRemaining > 0 ? '#dc2626' : '#16a34a', fontWeight: 700, fontSize: '14px' }}>
                      {formatCurrency(totalRemaining)}
                    </span>
                  </div>
                )
              })()}
            </div>
          </div>
        )}

        {/* Notes */}
        {invoice.notes && (
          <div style={styles.notesSection}>
            <span style={styles.notesLabel}>ملاحظات:</span>
            <p style={styles.notesText}>{invoice.notes}</p>
          </div>
        )}

        {/* Footer */}
        {showFooter && (
          <div style={styles.footer}>
            <div style={styles.footerText}>
              {isElementVisible(templateConfig, 'footerText1') && (
                <p style={getElementStyle(templateConfig, 'footerText1')}>
                  {getElementValue(templateConfig, 'footerText1', 'شكراً لتعاملكم معنا')}
                </p>
              )}
              {isElementVisible(templateConfig, 'footerText2') && (
                <p style={{ ...styles.footerSmall, ...getElementStyle(templateConfig, 'footerText2') }}>
                  {getElementValue(templateConfig, 'footerText2', 'تم الإنشاء بواسطة نظام ترست للإدارة')}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }
)

InvoiceTemplate.displayName = 'InvoiceTemplate'

// A4 page styles (210mm x 297mm)
const styles: { [key: string]: React.CSSProperties } = {
  page: {
    width: '210mm',
    minHeight: '297mm',
    padding: '15mm 20mm',
    backgroundColor: '#ffffff',
    fontFamily: "'Madani', Arial, sans-serif",
    fontSize: '12px',
    color: '#1f2937',
    boxSizing: 'border-box',
    direction: 'rtl',
    position: 'relative',
    overflow: 'hidden',
  },

  // Watermark
  watermark: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    opacity: 0.06,
    pointerEvents: 'none',
    zIndex: 0,
  },
  watermarkImage: {
    width: '300px',
    height: 'auto',
  },

  // Header
  header: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    marginBottom: '8mm',
    position: 'relative',
    zIndex: 1,
  },
  logoContainer: {
    width: '100px',
    height: '100px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '8px',
  },
  logo: {
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain',
  },
  companyInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  companyName: {
    fontSize: '22px',
    fontWeight: 700,
    margin: 0,
    color: '#7c2d12',
  },
  companyNameEn: {
    fontSize: '13px',
    color: '#6b7280',
    margin: '4px 0 0 0',
    fontWeight: 500,
  },
  contactInfo: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: '12px',
    marginTop: '8px',
  },
  contactItem: {
    fontSize: '11px',
    color: '#4b5563',
  },

  // Divider
  divider: {
    height: '2px',
    backgroundColor: '#7c2d12',
    marginBottom: '8mm',
    position: 'relative',
    zIndex: 1,
  },

  // Invoice Title
  invoiceTitle: {
    textAlign: 'center',
    marginBottom: '8mm',
    position: 'relative',
    zIndex: 1,
  },
  titleText: {
    fontSize: '22px',
    fontWeight: 700,
    margin: 0,
    color: '#1f2937',
    padding: '8px 30px',
    display: 'inline-block',
    borderBottom: '3px solid #7c2d12',
  },

  // Info Section - Two columns layout
  infoSection: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8mm',
    padding: '12px 16px',
    backgroundColor: '#f9fafb',
    borderRadius: '6px',
    border: '1px solid #e5e7eb',
    position: 'relative',
    zIndex: 1,
    fontFamily: "'Madani', Arial, sans-serif",
  },
  infoColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  infoItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontFamily: "'Madani', Arial, sans-serif",
  },
  infoLabel: {
    fontSize: '12px',
    color: '#6b7280',
    fontFamily: "'Madani', Arial, sans-serif",
  },
  infoValue: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#1f2937',
    fontFamily: "'Madani', Arial, sans-serif",
  },
  statusBadge: {
    fontSize: '11px',
    fontWeight: 600,
    padding: '3px 10px',
    borderRadius: '12px',
  },

  // Table
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginBottom: '8mm',
    position: 'relative',
    zIndex: 1,
  },
  th: {
    backgroundColor: '#7c2d12',
    color: '#ffffff',
    padding: '10px 8px',
    fontSize: '12px',
    fontWeight: 600,
    textAlign: 'center',
    border: '1px solid #7c2d12',
  },
  td: {
    padding: '10px 8px',
    fontSize: '12px',
    textAlign: 'center',
    border: '1px solid #e5e7eb',
    backgroundColor: '#ffffff',
  },

  // Totals Section - Left aligned (flex-end in RTL)
  totalsSection: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginBottom: '8mm',
    position: 'relative',
    zIndex: 1,
  },
  totalsBox: {
    width: '280px',
    padding: '12px 16px',
    backgroundColor: '#f9fafb',
    borderRadius: '6px',
    border: '1px solid #e5e7eb',
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 0',
    borderBottom: '1px dashed #e5e7eb',
  },
  totalLabel: {
    fontSize: '12px',
    color: '#6b7280',
  },
  totalValue: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#1f2937',
  },
  totalRowFinal: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 0',
    borderBottom: '2px solid #7c2d12',
    marginTop: '4px',
  },
  totalLabelFinal: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#1f2937',
  },
  totalValueFinal: {
    fontSize: '16px',
    fontWeight: 700,
    color: '#7c2d12',
  },

  // Notes
  notesSection: {
    padding: '12px 16px',
    backgroundColor: '#fefce8',
    borderRadius: '6px',
    border: '1px solid #fef08a',
    marginBottom: '8mm',
    position: 'relative',
    zIndex: 1,
  },
  notesLabel: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#854d0e',
    display: 'block',
    marginBottom: '4px',
  },
  notesText: {
    margin: 0,
    fontSize: '12px',
    color: '#713f12',
    lineHeight: 1.5,
  },

  // Footer
  footer: {
    marginTop: 'auto',
    paddingTop: '10mm',
    borderTop: '1px solid #e5e7eb',
    position: 'relative',
    zIndex: 1,
  },
  footerText: {
    textAlign: 'center',
  },
  footerSmall: {
    fontSize: '10px',
    color: '#9ca3af',
    marginTop: '4px',
  },
}

export default InvoiceTemplate
