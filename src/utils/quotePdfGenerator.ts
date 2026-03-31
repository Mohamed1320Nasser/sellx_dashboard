import type { Quote } from "../types";

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("ar-EG", {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return dateString;
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ar-EG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

function getStatusLabel(status: string | undefined): string {
  switch (status) {
    case 'DRAFT': return 'مسودة';
    case 'SENT': return 'مرسل';
    case 'ACCEPTED': return 'مقبول';
    case 'REJECTED': return 'مرفوض';
    case 'EXPIRED': return 'منتهي';
    default: return 'مسودة';
  }
}

function getStatusColor(status: string | undefined): string {
  switch (status) {
    case 'DRAFT': return '#64748b';
    case 'SENT': return '#3b82f6';
    case 'ACCEPTED': return '#10b981';
    case 'REJECTED': return '#ef4444';
    case 'EXPIRED': return '#f59e0b';
    default: return '#64748b';
  }
}

function generateQuoteHTML(quote: Quote, company?: any): string {
  const subtotal = quote.subtotal || quote.items?.reduce((sum, item) => sum + (item.lineTotal || 0), 0) || 0;
  const discount = quote.totalDiscount || 0;
  const tax = quote.taxAmount || 0;

  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>عرض سعري - ${quote.quoteNumber}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Cairo', 'Arial', sans-serif;
          direction: rtl;
          text-align: right;
          background: #f8fafc;
          color: #1e293b;
          line-height: 1.6;
          padding: 20px;
        }

        .quote {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
        }

        /* Header Section */
        .header {
          background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);
          color: white;
          padding: 30px 40px;
          position: relative;
          overflow: hidden;
        }

        .header::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -50%;
          width: 100%;
          height: 200%;
          background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 60%);
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          position: relative;
          z-index: 1;
        }

        .company-info {
          flex: 1;
        }

        .company-name {
          font-size: 28px;
          font-weight: 800;
          margin-bottom: 8px;
          letter-spacing: -0.5px;
        }

        .company-details {
          font-size: 13px;
          opacity: 0.9;
          line-height: 1.8;
        }

        .quote-badge {
          background: rgba(255,255,255,0.2);
          backdrop-filter: blur(10px);
          padding: 20px 25px;
          border-radius: 12px;
          text-align: center;
          min-width: 180px;
        }

        .quote-label {
          font-size: 12px;
          opacity: 0.9;
          margin-bottom: 5px;
        }

        .quote-number {
          font-size: 22px;
          font-weight: 700;
        }

        .quote-type-badge {
          background: rgba(255,255,255,0.3);
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          margin-top: 10px;
          display: inline-block;
        }

        /* Info Cards Section */
        .info-section {
          padding: 30px 40px;
          background: #f8fafc;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
        }

        .info-card {
          background: white;
          padding: 18px 20px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
          border: 1px solid #e2e8f0;
        }

        .info-card-label {
          font-size: 11px;
          color: #64748b;
          margin-bottom: 6px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .info-card-value {
          font-size: 15px;
          font-weight: 700;
          color: #1e293b;
        }

        .status-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 600;
          color: white;
        }

        /* Client Section */
        .client-section {
          padding: 0 40px 30px;
        }

        .client-box {
          background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%);
          padding: 24px;
          border-radius: 12px;
          border-right: 4px solid #8b5cf6;
        }

        .client-box-title {
          font-size: 12px;
          color: #8b5cf6;
          font-weight: 700;
          margin-bottom: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .client-name {
          font-size: 20px;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 8px;
        }

        .client-details {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-top: 16px;
        }

        .client-detail-item {
          font-size: 13px;
          color: #64748b;
        }

        .client-detail-item strong {
          color: #1e293b;
        }

        /* Items Table */
        .items-section {
          padding: 0 40px 30px;
        }

        .section-title {
          font-size: 16px;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .section-title::before {
          content: '';
          width: 4px;
          height: 20px;
          background: #8b5cf6;
          border-radius: 2px;
        }

        .items-table {
          width: 100%;
          border-collapse: collapse;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }

        .items-table th {
          background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
          color: white;
          padding: 16px 20px;
          font-size: 13px;
          font-weight: 600;
          text-align: right;
        }

        .items-table td {
          padding: 16px 20px;
          border-bottom: 1px solid #f1f5f9;
          font-size: 14px;
        }

        .items-table tr:last-child td {
          border-bottom: none;
        }

        .items-table tr:nth-child(even) {
          background: #f8fafc;
        }

        .product-name {
          font-weight: 600;
          color: #1e293b;
        }

        .product-sku {
          font-size: 12px;
          color: #94a3b8;
          margin-top: 2px;
        }

        .quantity-badge {
          background: #f3e8ff;
          color: #7c3aed;
          padding: 4px 12px;
          border-radius: 20px;
          font-weight: 600;
          font-size: 13px;
          display: inline-block;
        }

        .price {
          font-weight: 600;
          color: #1e293b;
        }

        .total-price {
          font-weight: 700;
          color: #8b5cf6;
        }

        /* Summary Section */
        .summary-section {
          padding: 30px 40px;
          background: #f8fafc;
          display: grid;
          grid-template-columns: 1fr 350px;
          gap: 30px;
          align-items: start;
        }

        .validity-info {
          background: white;
          padding: 24px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }

        .validity-title {
          font-size: 14px;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 12px;
        }

        .validity-date {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          background: #fef3c7;
          border-radius: 8px;
          color: #92400e;
          font-weight: 600;
        }

        .totals-box {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }

        .totals-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 24px;
          border-bottom: 1px solid #f1f5f9;
        }

        .totals-row:last-child {
          border-bottom: none;
        }

        .totals-label {
          color: #64748b;
          font-size: 14px;
        }

        .totals-value {
          font-weight: 600;
          font-size: 15px;
          color: #1e293b;
        }

        .discount-row {
          background: #fef2f2;
        }

        .discount-row .totals-value {
          color: #dc2626;
        }

        .tax-row {
          background: #fffbeb;
        }

        .tax-row .totals-value {
          color: #d97706;
        }

        .grand-total-row {
          background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);
          padding: 20px 24px;
        }

        .grand-total-row .totals-label {
          color: rgba(255,255,255,0.9);
          font-size: 16px;
          font-weight: 600;
        }

        .grand-total-row .totals-value {
          color: white;
          font-size: 24px;
          font-weight: 800;
        }

        /* Notes Section */
        .notes-section {
          padding: 0 40px 30px;
        }

        .notes-box {
          background: #f0fdf4;
          border: 1px dashed #22c55e;
          border-radius: 12px;
          padding: 16px 20px;
        }

        .notes-title {
          font-size: 13px;
          font-weight: 700;
          color: #16a34a;
          margin-bottom: 8px;
        }

        .notes-content {
          font-size: 14px;
          color: #166534;
        }

        /* Terms Section */
        .terms-section {
          padding: 0 40px 30px;
        }

        .terms-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 20px;
        }

        .terms-title {
          font-size: 14px;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 12px;
        }

        .terms-list {
          list-style: none;
          padding: 0;
        }

        .terms-list li {
          font-size: 13px;
          color: #64748b;
          padding: 6px 0;
          padding-right: 20px;
          position: relative;
        }

        .terms-list li::before {
          content: '✓';
          position: absolute;
          right: 0;
          color: #8b5cf6;
          font-weight: bold;
        }

        /* Footer */
        .footer {
          background: #1e293b;
          color: white;
          padding: 30px 40px;
          text-align: center;
        }

        .footer-message {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .footer-submessage {
          font-size: 14px;
          opacity: 0.8;
        }

        .footer-brand {
          font-size: 12px;
          opacity: 0.7;
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid rgba(255,255,255,0.1);
        }

        @media print {
          body {
            padding: 0;
            background: white;
          }

          .quote {
            box-shadow: none;
            border-radius: 0;
          }
        }
      </style>
    </head>
    <body>
      <div class="quote">
        <!-- Header -->
        <div class="header">
          <div class="header-content">
            <div class="company-info">
              <div class="company-name">${company?.name || quote.company?.name || "الشركة"}</div>
              <div class="company-details">
                ${company?.address || quote.company?.address ? `${company?.address || quote.company?.address}<br>` : ""}
                ${company?.phone || quote.company?.phone ? `هاتف: ${company?.phone || quote.company?.phone}<br>` : ""}
                ${company?.email || quote.company?.email ? `${company?.email || quote.company?.email}` : ""}
              </div>
            </div>
            <div class="quote-badge">
              <div class="quote-label">رقم العرض السعري</div>
              <div class="quote-number">${quote.quoteNumber}</div>
              <div class="quote-type-badge">عرض سعري</div>
            </div>
          </div>
        </div>

        <!-- Info Cards -->
        <div class="info-section">
          <div class="info-card">
            <div class="info-card-label">تاريخ الإنشاء</div>
            <div class="info-card-value">${formatDate(quote.createdAt)}</div>
          </div>
          <div class="info-card">
            <div class="info-card-label">صالح حتى</div>
            <div class="info-card-value">${quote.validUntil ? formatDate(quote.validUntil) : 'غير محدد'}</div>
          </div>
          <div class="info-card">
            <div class="info-card-label">عدد الأصناف</div>
            <div class="info-card-value">${quote.items?.length || 0} صنف</div>
          </div>
          <div class="info-card">
            <div class="info-card-label">الحالة</div>
            <div class="info-card-value">
              <span class="status-badge" style="background: ${getStatusColor(quote.status)}">${getStatusLabel(quote.status)}</span>
            </div>
          </div>
        </div>

        <!-- Client Section -->
        <div class="client-section">
          <div class="client-box">
            <div class="client-box-title">بيانات العميل</div>
            <div class="client-name">${quote.customerName || "عميل"}</div>
            <div class="client-details">
              ${quote.customerContact ? `<div class="client-detail-item">📞 <strong>الهاتف:</strong> ${quote.customerContact}</div>` : ""}
              ${quote.customerEmail ? `<div class="client-detail-item">✉️ <strong>البريد:</strong> ${quote.customerEmail}</div>` : ""}
              ${quote.currency ? `<div class="client-detail-item">💰 <strong>العملة:</strong> ${quote.currency}</div>` : ""}
            </div>
          </div>
        </div>

        <!-- Items Table -->
        ${quote.items && quote.items.length > 0 ? `
          <div class="items-section">
            <div class="section-title">تفاصيل المنتجات</div>
            <table class="items-table">
              <thead>
                <tr>
                  <th style="width: 40%">المنتج</th>
                  <th style="width: 15%; text-align: center">الكمية</th>
                  <th style="width: 20%; text-align: center">سعر الوحدة</th>
                  <th style="width: 25%; text-align: center">الإجمالي</th>
                </tr>
              </thead>
              <tbody>
                ${quote.items.map(item => `
                  <tr>
                    <td>
                      <div class="product-name">${item.productName || item.product?.name || "منتج"}</div>
                    </td>
                    <td style="text-align: center">
                      <span class="quantity-badge">${item.quantity}</span>
                    </td>
                    <td style="text-align: center">
                      <span class="price">${formatCurrency(item.unitPrice)} ${quote.currency || 'ج.م'}</span>
                    </td>
                    <td style="text-align: center">
                      <span class="total-price">${formatCurrency(item.lineTotal || item.quantity * item.unitPrice)} ${quote.currency || 'ج.م'}</span>
                    </td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        ` : ""}

        <!-- Summary -->
        <div class="summary-section">
          <div class="validity-info">
            <div class="validity-title">معلومات الصلاحية</div>
            ${quote.validUntil ? `
              <div class="validity-date">
                📅 هذا العرض صالح حتى ${formatDate(quote.validUntil)}
              </div>
            ` : `
              <div class="validity-date" style="background: #f1f5f9; color: #64748b;">
                📅 لم يتم تحديد تاريخ انتهاء الصلاحية
              </div>
            `}
          </div>

          <div class="totals-box">
            <div class="totals-row">
              <span class="totals-label">المجموع الفرعي</span>
              <span class="totals-value">${formatCurrency(subtotal)} ${quote.currency || 'ج.م'}</span>
            </div>
            ${discount > 0 ? `
              <div class="totals-row discount-row">
                <span class="totals-label">الخصم ${quote.discountPercent ? `(${quote.discountPercent}%)` : ""}</span>
                <span class="totals-value">- ${formatCurrency(discount)} ${quote.currency || 'ج.م'}</span>
              </div>
            ` : ""}
            ${tax > 0 ? `
              <div class="totals-row tax-row">
                <span class="totals-label">الضريبة ${quote.taxPercent ? `(${quote.taxPercent}%)` : ""}</span>
                <span class="totals-value">+ ${formatCurrency(tax)} ${quote.currency || 'ج.م'}</span>
              </div>
            ` : ""}
            <div class="totals-row grand-total-row">
              <span class="totals-label">المجموع الكلي</span>
              <span class="totals-value">${formatCurrency(quote.total || 0)} ${quote.currency || 'ج.م'}</span>
            </div>
          </div>
        </div>

        ${quote.notes ? `
          <div class="notes-section">
            <div class="notes-box">
              <div class="notes-title">📝 ملاحظات</div>
              <div class="notes-content">${quote.notes}</div>
            </div>
          </div>
        ` : ""}

        <!-- Terms -->
        <div class="terms-section">
          <div class="terms-box">
            <div class="terms-title">الشروط والأحكام</div>
            <ul class="terms-list">
              <li>الأسعار المذكورة صالحة خلال فترة العرض فقط</li>
              <li>قد تتغير الأسعار حسب توفر المنتجات</li>
              <li>الكميات المذكورة حسب التوفر في المخزون</li>
              <li>هذا العرض لا يمثل فاتورة بيع نهائية</li>
            </ul>
          </div>
        </div>

        <!-- Footer -->
        <div class="footer">
          <div class="footer-message">شكراً لاهتمامكم 🙏</div>
          <div class="footer-submessage">نتطلع للتعامل معكم</div>
          <div class="footer-brand">
            تم إنشاء هذا العرض بواسطة نظام SellX
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return html;
}

export const generateQuotePdf = async (quote: Quote, company?: any): Promise<void> => {
  try {
    if (!quote) {
      throw new Error("Quote data is missing");
    }

    if (!quote.quoteNumber) {
      throw new Error("Quote number is missing");
    }

    // Generate HTML content
    const htmlContent = generateQuoteHTML(quote, company);

    // Dynamically import html2canvas and jsPDF
    const [html2canvasModule, jsPDFModule] = await Promise.all([
      import('html2canvas'),
      import('jspdf')
    ]);
    const html2canvas = html2canvasModule.default;
    const { jsPDF } = jsPDFModule;

    // Create a hidden container to render the HTML
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '800px';
    container.style.backgroundColor = 'white';
    container.style.pointerEvents = 'none';
    container.innerHTML = htmlContent;
    document.body.appendChild(container);

    // Get the quote element inside the container
    const quoteElement = container.querySelector('.quote') as HTMLElement;
    if (!quoteElement) {
      document.body.removeChild(container);
      throw new Error("Could not find quote element");
    }

    // Wait for fonts to load
    await document.fonts.ready;

    // Convert to canvas
    const canvas = await html2canvas(quoteElement, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      x: 0,
      y: 0,
      scrollX: 0,
      scrollY: 0,
      windowWidth: quoteElement.scrollWidth,
      windowHeight: quoteElement.scrollHeight,
    });

    // Create PDF
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    const pdf = new jsPDF('p', 'mm', 'a4');
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(
      canvas.toDataURL('image/png'),
      'PNG',
      0,
      position,
      imgWidth,
      imgHeight
    );
    heightLeft -= pageHeight;

    // Handle multi-page if content is longer than one page
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(
        canvas.toDataURL('image/png'),
        'PNG',
        0,
        position,
        imgWidth,
        imgHeight
      );
      heightLeft -= pageHeight;
    }

    // Download the PDF
    pdf.save(`عرض-سعري-${quote.quoteNumber}.pdf`);

    // Clean up
    document.body.removeChild(container);
  } catch (error) {
    throw new Error(
      `Failed to generate quote PDF: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
};
