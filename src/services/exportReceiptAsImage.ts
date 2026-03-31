

import QRCode from 'qrcode';

interface ReceiptItem {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface ReceiptData {
  orderId: string | number;
  orderDate: Date | string;
  companyName: string;
  companyAddress?: string;
  companyPhone?: string;
  companyTaxId?: string;
  companyLogo?: string;
  cashierName?: string;
  items: ReceiptItem[];
  subtotal: number;
  discount?: number;
  taxRate?: number;
  taxAmount?: number;
  additionalFee?: number;
  additionalFeeLabel?: string;
  total: number;
  paid?: number;
  change?: number;
  paperWidth: '58mm' | '80mm';
  showLogo?: boolean;
  showOrderId?: boolean;
  showTaxBreakdown?: boolean;
  showQRCode?: boolean;
  headerText?: string;
  footerText?: string;
}

/**
 * Format currency
 */
function formatCurrency(amount: number): string {
  return amount.toFixed(2);
}

/**
 * Format date
 */
function formatDate(date: Date | string): string {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format time
 */
function formatTime(date: Date | string): string {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleTimeString('ar-EG', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Export receipt as image using html2canvas
 */
export async function exportReceiptAsImage(
  receiptData: ReceiptData
): Promise<Blob> {
  // Dynamic import html2canvas
  const html2canvas = (await import('html2canvas')).default;

  // Create off-screen container
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  document.body.appendChild(container);

  try {
    const pixelWidth = receiptData.paperWidth === '58mm' ? 80 : 120;
    const fontSize = receiptData.paperWidth === '58mm' ? '5px' : '6px';
    const headerSize = receiptData.paperWidth === '58mm' ? '8px' : '9px';

    let qrCodeDataUrl = '';
    if (receiptData.showQRCode) {
      try {
        const qrData = [
          receiptData.companyName,
          receiptData.companyTaxId || '',
          new Date(receiptData.orderDate).toISOString(),
          receiptData.total.toFixed(2),
          (receiptData.taxAmount || 0).toFixed(2),
        ].join('|');

        qrCodeDataUrl = await QRCode.toDataURL(qrData, {
          width: 150,
          margin: 1,
          errorCorrectionLevel: 'M',
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
        });
        console.log('✓ QR Code generated');
      } catch (error) {
        console.error('QR Code generation error:', error);
      }
    }

    const itemsTableHtml = `
      <div style="border-top: 1px dotted #333; border-bottom: 1px dotted #333; margin: 3px 0; padding: 2px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <!-- Header -->
          <thead>
            <tr style="border-bottom: 1px dotted #333;">
              <th style="text-align: right; padding: 3px 1px 5px 1px; font-size: 8px; font-weight: 700; width: 50%;">الصنف</th>
              <th style="text-align: center; padding: 3px 1px 5px 1px; font-size: 8px; font-weight: 700; width: 20%;">الكمية</th>
              <th style="text-align: left; padding: 3px 1px 5px 1px; font-size: 8px; font-weight: 700; width: 30%;">المبلغ</th>
            </tr>
          </thead>

          <!-- Items -->
          <tbody>
            ${receiptData.items.map((item, index) => {
              // Only show border-bottom for items that are NOT the last one
              const isLastItem = index === receiptData.items.length - 1;
              return `
            <tr ${!isLastItem ? 'style="border-bottom: 1px dotted #ddd;"' : ''}>
              <td style="text-align: right; padding: 3px 1px; font-size: 8px; font-weight: 400; color: #000; width: 50%; vertical-align: top; word-wrap: break-word; overflow-wrap: break-word;">
                <div style="font-weight: 400; margin-bottom: 1px;">${item.name}</div>
                <div style="font-size: 6px; color: #666; font-weight: 400; white-space: nowrap;">${item.quantity} × ${formatCurrency(item.unitPrice)} ج.م</div>
              </td>
              <td style="text-align: center; padding: 3px 1px; font-size: 8px; font-weight: 600; color: #000; width: 20%; vertical-align: middle;">
                ${item.quantity}
              </td>
              <td style="text-align: left; padding: 3px 1px; font-size: 7px; font-weight: 700; color: #000; font-family: 'Courier New', monospace; width: 30%; vertical-align: middle; white-space: nowrap;">
                ${formatCurrency(item.totalPrice)} ج.م
              </td>
            </tr>
            `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;

    // Build totals section HTML - Only one dotted line between subtotal and total
    const totalsSectionHtml = `
      <div style="margin-top: 3px; padding-top: 0;">
        ${receiptData.subtotal ? `
        <div style="display: flex; justify-content: space-between; padding: 3px 0; font-size: 8px;">
          <span style="color: #666;">المجموع الفرعي:</span>
          <span style="font-weight: 600; color: #333; font-family: 'Courier New', monospace; white-space: nowrap;">${formatCurrency(receiptData.subtotal)} ج.م</span>
        </div>` : ''}
        ${receiptData.discount && receiptData.discount > 0 ? `
        <div style="display: flex; justify-content: space-between; padding: 3px 0; font-size: 8px;">
          <span style="color: #666;">الخصم:</span>
          <span style="font-weight: 600; color: #dc2626; font-family: 'Courier New', monospace; white-space: nowrap;">- ${formatCurrency(receiptData.discount)} ج.م</span>
        </div>` : ''}
        ${receiptData.showTaxBreakdown && receiptData.taxAmount && receiptData.taxAmount > 0 ? `
        <div style="display: flex; justify-content: space-between; padding: 3px 0; font-size: 8px;">
          <span style="color: #666;">الضريبة (${receiptData.taxRate}%):</span>
          <span style="font-weight: 600; color: #666; font-family: 'Courier New', monospace; white-space: nowrap;">${formatCurrency(receiptData.taxAmount)} ج.م</span>
        </div>` : ''}
        ${receiptData.additionalFee && receiptData.additionalFee > 0 ? `
        <div style="display: flex; justify-content: space-between; padding: 3px 0; font-size: 8px;">
          <span style="color: #666;">${receiptData.additionalFeeLabel || 'رسوم إضافية'}:</span>
          <span style="font-weight: 600; color: #666; font-family: 'Courier New', monospace; white-space: nowrap;">+${formatCurrency(receiptData.additionalFee)} ج.م</span>
        </div>` : ''}

        <!-- Dotted line between subtotal and total -->
        <div style="border-top: 1px dotted #333; margin: 3px 0;"></div>

        <div style="display: flex; justify-content: space-between; padding: 4px 0; font-size: 9px;">
          <span style="font-weight: 700; color: #000;">الإجمالي:</span>
          <span style="font-weight: 700; color: #000; font-family: 'Courier New', monospace; white-space: nowrap;">${formatCurrency(receiptData.total)} ج.م</span>
        </div>
      </div>`;

    // Build complete HTML
    container.innerHTML = `
      <div id="receipt-export" style="
        width: ${pixelWidth}px;
        min-height: 300px;
        background: #ffffff;
        font-family: 'Segoe UI', 'Tahoma', 'Arial', 'Helvetica Neue', sans-serif;
        direction: rtl;
        position: relative;
        padding: 2px 1px;
        box-sizing: border-box;
      ">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 3px; padding-bottom: 3px;">
          ${receiptData.showLogo && receiptData.companyLogo ? `
          <div style="margin-bottom: 2px;">
            <img src="${receiptData.companyLogo}" alt="Company Logo" style="max-width: 100px; max-height: 60px; width: auto; height: auto; object-fit: contain; display: block; margin: 0 auto;" crossorigin="anonymous" />
          </div>` : ''}
          <h1 style="font-size: ${headerSize}; font-weight: 700; margin: 0 0 2px 0; color: #1f2937;">${receiptData.companyName}</h1>
          ${receiptData.companyAddress ? `<p style="margin: 1px 0; font-size: 7px; color: #6b7280;">${receiptData.companyAddress}</p>` : ''}
          ${receiptData.companyPhone ? `<p style="margin: 1px 0; font-size: 7px; color: #6b7280;">هاتف: ${receiptData.companyPhone}</p>` : ''}
          ${receiptData.companyTaxId ? `<p style="margin: 1px 0; font-size: 7px; color: #6b7280;">الرقم الضريبي: ${receiptData.companyTaxId}</p>` : ''}
          ${receiptData.headerText ? `<p style="margin: 2px 0 0 0; font-size: 8px; font-weight: 600; color: #374151;">${receiptData.headerText}</p>` : ''}
        </div>

        <!-- Order Info -->
        <div style="margin: 3px 0; padding: 3px 0; font-size: 8px;">
          ${receiptData.showOrderId ? `
          <div style="display: flex; justify-content: space-between; margin: 2px 0;">
            <span style="color: #6b7280;">رقم الطلب:</span>
            <span style="font-weight: 600; color: #1f2937;">#${receiptData.orderId}</span>
          </div>` : ''}
          <div style="display: flex; justify-content: space-between; margin: 2px 0;">
            <span style="color: #6b7280;">التاريخ:</span>
            <span style="color: #1f2937;">${formatDate(receiptData.orderDate)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin: 2px 0;">
            <span style="color: #6b7280;">الوقت:</span>
            <span style="color: #1f2937;">${formatTime(receiptData.orderDate)}</span>
          </div>
          ${receiptData.cashierName ? `
          <div style="display: flex; justify-content: space-between; margin: 2px 0;">
            <span style="color: #6b7280;">الكاشير:</span>
            <span style="color: #1f2937;">${receiptData.cashierName}</span>
          </div>` : ''}
        </div>

        <!-- Items Table -->
        ${itemsTableHtml}

        <!-- Totals -->
        ${totalsSectionHtml}

        <!-- Footer -->
        <div style="text-align: center; margin-top: 3px; padding-top: 3px; border-top: 1px dashed #e5e7eb;">
          ${receiptData.footerText ? `<p style="font-size: 8px; font-weight: 600; color: #374151; margin: 0 0 2px 0;">${receiptData.footerText}</p>` : ''}
          <p style="font-size: 7px; color: #9ca3af; margin: 1px 0;">شكراً لزيارتكم</p>

          ${qrCodeDataUrl ? `
          <div style="text-align: center; margin: 3px 0;">
            <img src="${qrCodeDataUrl}" alt="QR Code" style="width: 70px; height: 70px; margin: 0 auto; display: block;" />
            <p style="font-size: 6px; color: #9ca3af; margin: 1px 0;">امسح رمز QR للتحقق من الفاتورة</p>
          </div>` : ''}

          <p style="font-size: 6px; color: #d1d5db; margin: 2px 0;">تم الطباعة: ${formatDate(new Date())} ${formatTime(new Date())}</p>
        </div>
      </div>
    `;

    const element = document.getElementById('receipt-export');
    if (!element) {
      throw new Error('Failed to create receipt element');
    }

    console.log('📐 Element height:', element.scrollHeight, 'px');
    console.log('📄 Generated HTML preview:', element.innerHTML.substring(0, 500));
    console.log('📊 Items HTML:', itemsTableHtml);

    // Wait for images to load (especially logo)
    const images = element.querySelectorAll('img');
    if (images.length > 0) {
      console.log(`⏳ Waiting for ${images.length} image(s) to load...`);
      await Promise.all(
        Array.from(images).map(img => {
          if (img.complete) {
            console.log('✓ Image already loaded:', img.src);
            return Promise.resolve();
          }
          return new Promise((resolve, reject) => {
            img.onload = () => {
              console.log('✓ Image loaded:', img.src);
              resolve(null);
            };
            img.onerror = (err) => {
              console.warn('⚠️ Image failed to load:', img.src, err);
              resolve(null); // Continue even if image fails
            };
            // Set a timeout to avoid hanging forever
            setTimeout(() => {
              console.warn('⏱️ Image load timeout:', img.src);
              resolve(null);
            }, 3000);
          });
        })
      );
      console.log('✅ All images loaded or timed out');
    }

    // Adjust container height if content is taller - compact for thermal printing
    const actualHeight = element.scrollHeight;
    const minHeight = 300; // Minimum receipt height (reduced for compact printing)
    if (actualHeight > minHeight) {
      element.style.minHeight = `${actualHeight + 20}px`;
      console.log('📏 Adjusted container height to:', actualHeight + 20, 'px');
    }

    // Convert HTML to canvas using html2canvas
    console.log('🖼️ Converting HTML to canvas...');
    // Use scale: 2 for better text quality on thermal printers
    const canvas = await html2canvas(element, {
      scale: 2,  // Higher resolution for better text quality
      useCORS: true,
      allowTaint: true, // Allow cross-origin images
      backgroundColor: '#ffffff',
      width: pixelWidth,
      height: Math.max(minHeight, element.scrollHeight),
      logging: false,
    });

    console.log('✅ Canvas created:', canvas.width, 'x', canvas.height);

    // Convert canvas to blob
    console.log('🔄 Converting canvas to blob...');
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob from canvas'));
        }
      }, 'image/png', 1.0);
    });


    return blob;

  } catch (error: any) {
    console.error('❌ Failed to export receipt:', error);
    throw new Error(`فشل تصدير الإيصال: ${error.message}`);
  } finally {
    if (container.parentNode) {
      document.body.removeChild(container);
  
    }
  }
}
