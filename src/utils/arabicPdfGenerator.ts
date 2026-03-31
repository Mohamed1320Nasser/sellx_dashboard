import jsPDF from "jspdf";

export interface ArabicReceiptData {
  sale: {
    id: number;
    receiptNumber: string;
    saleDate: string;
    totalAmount: number;
    paymentMethod?: string;
    client?: {
      name: string;
      phone?: string;
      email?: string;
    };
    user?: {
      fullname: string;
    };
    company?: {
      name: string;
      address?: string;
      phone?: string;
      email?: string;
    };
    items?: Array<{
      product?: {
        name: string;
        sku: string;
      };
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }>;
  };
}

// Arabic to Latin transliteration for better PDF compatibility
const arabicToLatin: { [key: string]: string } = {
  "فاتورة البيع": "FATURA AL-BAYA",
  "رقم الفاتورة": "RAQM AL-FATURA",
  التاريخ: "AL-TARIKH",
  الموظف: "AL-MUWAZZAF",
  العميل: "AL-AMIL",
  الهاتف: "AL-HATIF",
  "البريد الإلكتروني": "AL-BARID AL-ILIKTRUNI",
  المنتجات: "AL-MUNTAJAT",
  "اسم المنتج": "ISM AL-MUNTAJ",
  الكمية: "AL-KAMIYYA",
  السعر: "AL-SIAR",
  المجموع: "AL-MAJMUA",
  "المجموع الإجمالي": "AL-MAJMUA AL-IJMALI",
  "طريقة الدفع": "TARIQAT AL-DAF",
  نقدي: "NAQDI",
  بطاقة: "BITAQAT",
  ائتمان: "ITIMAN",
  "شكراً لاختياركم خدماتنا": "SHUKRAN LI-IKHTIARIKUM KHIDAMATINA",
  الشركة: "AL-SHARIKA",
  "عميل نقدي": "AMIL NAQDI",
  "منتج غير محدد": "MUNTAJ GHAIR MUHAYYAD",
  "غير محدد": "GHAIR MUHAYYAD",
  جنيه: "GUINEA",
  "ج.م": "E.G.P",
};

function transliterateArabic(text: string): string {
  return arabicToLatin[text] || text;
}

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB"); // Use English format for better compatibility
  } catch {
    return dateString;
  }
}

export const generateArabicReceiptPDF = (data: ArabicReceiptData): void => {
  try {
    const { sale } = data;

    // Validate required data
    if (!sale) {
      throw new Error("Sale data is missing");
    }

    if (!sale.receiptNumber) {
      throw new Error(
        `Receipt number is missing. Sale data: ${JSON.stringify(sale)}`
      );
    }

    // Create new PDF document
    const doc = new jsPDF();

    // Set font (using default font for better compatibility)
    doc.setFont("helvetica");

    // SellX Header
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("SellX", 105, 12, { align: "center" });

    // Company Header
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(transliterateArabic(sale.company?.name || "الشركة"), 105, 22, {
      align: "center",
    });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    if (sale.company?.address) {
      doc.text(sale.company.address, 105, 30, { align: "center" });
    }
    if (sale.company?.phone) {
      doc.text(
        `${transliterateArabic("الهاتف")}: ${sale.company.phone}`,
        105,
        35,
        { align: "center" }
      );
    }

    // Receipt Title
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(transliterateArabic("فاتورة البيع"), 105, 50, { align: "center" });

    // Receipt Details
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    let yPos = 70;

    // Receipt Number
    doc.text(
      `${transliterateArabic("رقم الفاتورة")}: ${sale.receiptNumber}`,
      20,
      yPos
    );
    yPos += 8;

    // Date
    const saleDate = formatDate(sale.saleDate);
    doc.text(`${transliterateArabic("التاريخ")}: ${saleDate}`, 20, yPos);
    yPos += 8;

    // Employee
    doc.text(
      `${transliterateArabic("الموظف")}: ${sale.user?.fullname || transliterateArabic("غير محدد")}`,
      20,
      yPos
    );
    yPos += 8;

    // Client Information
    if (sale.client) {
      doc.text(
        `${transliterateArabic("العميل")}: ${sale.client.name}`,
        20,
        yPos
      );
      yPos += 8;
      if (sale.client.phone) {
        doc.text(
          `${transliterateArabic("الهاتف")}: ${sale.client.phone}`,
          20,
          yPos
        );
        yPos += 8;
      }
    } else {
      doc.text(
        `${transliterateArabic("العميل")}: ${transliterateArabic("عميل نقدي")}`,
        20,
        yPos
      );
      yPos += 8;
    }

    yPos += 10;

    // Items Section
    if (sale.items && sale.items.length > 0) {
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(transliterateArabic("المنتجات"), 20, yPos);
      yPos += 10;

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");

      // Table headers
      doc.text(transliterateArabic("اسم المنتج"), 20, yPos);
      doc.text(transliterateArabic("الكمية"), 100, yPos);
      doc.text(transliterateArabic("السعر"), 130, yPos);
      doc.text(transliterateArabic("المجموع"), 160, yPos);
      yPos += 8;

      // Draw line under headers
      doc.line(20, yPos - 2, 190, yPos - 2);
      yPos += 5;

      // Items
      sale.items.forEach((item) => {
        const productName =
          item.product?.name || transliterateArabic("منتج غير محدد");
        const quantity = item.quantity.toString();
        const unitPrice = `${item.unitPrice} ${transliterateArabic("ج.م")}`;
        const total = `${item.totalPrice} ${transliterateArabic("ج.م")}`;

        doc.text(productName, 20, yPos);
        doc.text(quantity, 100, yPos);
        doc.text(unitPrice, 130, yPos);
        doc.text(total, 160, yPos);
        yPos += 8;
      });
    }

    yPos += 10;

    // Total Amount
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(
      `${transliterateArabic("المجموع الإجمالي")}: ${sale.totalAmount} ${transliterateArabic("جنيه")}`,
      20,
      yPos
    );
    yPos += 8;

    // Payment Method
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const paymentMethod =
      sale.paymentMethod === "CASH"
        ? transliterateArabic("نقدي")
        : sale.paymentMethod === "CARD"
          ? transliterateArabic("بطاقة")
          : sale.paymentMethod === "CREDIT"
            ? transliterateArabic("ائتمان")
            : transliterateArabic("نقدي");
    doc.text(
      `${transliterateArabic("طريقة الدفع")}: ${paymentMethod}`,
      20,
      yPos
    );
    yPos += 15;

    // Footer
    doc.setFontSize(8);
    doc.text(transliterateArabic("شكراً لاختياركم خدماتنا"), 105, yPos, {
      align: "center",
    });
    doc.text("--------------------------------", 105, yPos + 5, { align: "center" });
    doc.text("SellX POS System", 105, yPos + 10, { align: "center" });

    // Save the PDF
    doc.save(`receipt-${sale.receiptNumber}.pdf`);
  } catch (error) {
    throw new Error(
      `Failed to generate PDF: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
};



