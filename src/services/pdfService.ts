import jsPDF from 'jspdf';
import type { Invoice, Quotation, LineItem, FinancialSummary, BusinessDetails, ClientDetails } from '../types';
import { formatDate, formatCurrency } from '../utils';

interface PDFGeneratorOptions {
  type: 'invoice' | 'quotation';
  primaryColor?: string;
  showLogo?: boolean;
}

const DEFAULT_PRIMARY_COLOR = '#1976D2';

class PDFService {
  private doc: jsPDF;
  private primaryColor: string;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number;
  private currentY: number;

  constructor() {
    this.doc = new jsPDF();
    this.primaryColor = DEFAULT_PRIMARY_COLOR;
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.margin = 20;
    this.currentY = this.margin;
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 0, g: 0, b: 0 };
  }

  private setColor(color: string) {
    const rgb = this.hexToRgb(color);
    this.doc.setTextColor(rgb.r, rgb.g, rgb.b);
  }

  private resetColor() {
    this.doc.setTextColor(0, 0, 0);
  }

  private addHeader(
    businessDetails: BusinessDetails,
    documentType: 'INVOICE' | 'QUOTATION',
    documentNumber: string,
    _status: string
  ) {
    // Company Name
    this.setColor(this.primaryColor);
    this.doc.setFontSize(20);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(businessDetails.companyName, this.margin, this.currentY);

    // Document Type (right aligned)
    this.doc.setFontSize(24);
    this.doc.text(documentType, this.pageWidth - this.margin, this.currentY, { align: 'right' });

    this.currentY += 8;
    this.resetColor();
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');

    // Company Address
    const addressLines = businessDetails.address.split(',').map((line) => line.trim());
    addressLines.forEach((line) => {
      this.doc.text(line, this.margin, this.currentY);
      this.currentY += 5;
    });

    // Company Contact
    this.doc.text(`Phone: ${businessDetails.phone}`, this.margin, this.currentY);
    this.currentY += 5;
    this.doc.text(`Email: ${businessDetails.email}`, this.margin, this.currentY);

    if (businessDetails.gstNumber) {
      this.currentY += 5;
      this.doc.text(`GST: ${businessDetails.gstNumber}`, this.margin, this.currentY);
    }

    // Document Number (right aligned)
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(documentNumber, this.pageWidth - this.margin, this.currentY - 10, { align: 'right' });

    this.currentY += 15;

    // Divider line
    this.setColor(this.primaryColor);
    this.doc.setLineWidth(0.5);
    const rgb = this.hexToRgb(this.primaryColor);
    this.doc.setDrawColor(rgb.r, rgb.g, rgb.b);
    this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
    this.resetColor();
    this.doc.setDrawColor(0, 0, 0);

    this.currentY += 10;
  }

  private addClientAndDates(
    clientDetails: ClientDetails,
    dates: { issueDate: Date; dueDate?: Date; expiryDate?: Date }
  ) {
    const startY = this.currentY;

    // Bill To section
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'bold');
    this.setColor('#666666');
    this.doc.text('Bill To:', this.margin, this.currentY);
    this.resetColor();

    this.currentY += 6;
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(12);
    this.doc.text(clientDetails.name, this.margin, this.currentY);

    this.currentY += 6;
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(10);

    const clientAddressLines = clientDetails.address.split(',').map((line) => line.trim());
    clientAddressLines.forEach((line) => {
      this.doc.text(line, this.margin, this.currentY);
      this.currentY += 5;
    });

    if (clientDetails.phone) {
      this.doc.text(`Phone: ${clientDetails.phone}`, this.margin, this.currentY);
      this.currentY += 5;
    }

    if (clientDetails.email) {
      this.doc.text(`Email: ${clientDetails.email}`, this.margin, this.currentY);
      this.currentY += 5;
    }

    // Dates section (right aligned)
    let dateY = startY;
    const dateX = this.pageWidth - this.margin - 60;

    this.doc.setFontSize(10);
    this.setColor('#666666');
    this.doc.text('Issue Date:', dateX, dateY);
    this.resetColor();
    this.doc.text(formatDate(dates.issueDate), this.pageWidth - this.margin, dateY, { align: 'right' });

    dateY += 6;

    if (dates.dueDate) {
      this.setColor('#666666');
      this.doc.text('Due Date:', dateX, dateY);
      this.resetColor();
      this.doc.text(formatDate(dates.dueDate), this.pageWidth - this.margin, dateY, { align: 'right' });
    } else if (dates.expiryDate) {
      this.setColor('#666666');
      this.doc.text('Valid Until:', dateX, dateY);
      this.resetColor();
      this.doc.text(formatDate(dates.expiryDate), this.pageWidth - this.margin, dateY, { align: 'right' });
    }

    this.currentY = Math.max(this.currentY, dateY) + 15;
  }

  private addLineItemsTable(lineItems: LineItem[]) {
    // Store start position for reference
    this.currentY;
    const colWidths = {
      no: 10,
      item: 70,
      qty: 25,
      rate: 35,
      total: 35,
    };

    // Table Header
    const rgb = this.hexToRgb(this.primaryColor);
    this.doc.setFillColor(rgb.r, rgb.g, rgb.b);
    this.doc.rect(this.margin, this.currentY - 5, this.pageWidth - 2 * this.margin, 10, 'F');

    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'bold');

    let currentX = this.margin + 2;
    this.doc.text('#', currentX, this.currentY);
    currentX += colWidths.no;
    this.doc.text('Item & Description', currentX, this.currentY);
    currentX += colWidths.item;
    this.doc.text('Qty', currentX + 10, this.currentY, { align: 'center' });
    currentX += colWidths.qty;
    this.doc.text('Rate', currentX + 15, this.currentY, { align: 'right' });
    currentX += colWidths.rate;
    this.doc.text('Amount', this.pageWidth - this.margin - 2, this.currentY, { align: 'right' });

    this.currentY += 8;
    this.resetColor();
    this.doc.setFont('helvetica', 'normal');

    // Table Rows
    lineItems.forEach((item, index) => {
      // Check for page break
      if (this.currentY > this.pageHeight - 60) {
        this.doc.addPage();
        this.currentY = this.margin;
      }

      currentX = this.margin + 2;

      this.doc.text((index + 1).toString(), currentX, this.currentY);
      currentX += colWidths.no;

      // Item name (with possible description)
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(item.name, currentX, this.currentY);
      this.doc.setFont('helvetica', 'normal');

      if (item.description) {
        this.currentY += 4;
        this.doc.setFontSize(9);
        this.setColor('#666666');
        this.doc.text(item.description, currentX, this.currentY);
        this.resetColor();
        this.doc.setFontSize(10);
        this.currentY -= 4;
      }

      currentX += colWidths.item;
      const qtyText = item.unit ? `${item.quantity} ${item.unit}` : item.quantity.toString();
      this.doc.text(qtyText, currentX + 10, this.currentY, { align: 'center' });

      currentX += colWidths.qty;
      this.doc.text(formatCurrency(item.unitPrice), currentX + 15, this.currentY, { align: 'right' });

      this.doc.text(formatCurrency(item.total), this.pageWidth - this.margin - 2, this.currentY, {
        align: 'right',
      });

      this.currentY += item.description ? 12 : 8;

      // Row divider
      this.doc.setDrawColor(230, 230, 230);
      this.doc.line(this.margin, this.currentY - 2, this.pageWidth - this.margin, this.currentY - 2);
      this.doc.setDrawColor(0, 0, 0);
    });

    this.currentY += 5;
  }

  private addFinancialSummary(summary: FinancialSummary) {
    const summaryX = this.pageWidth - this.margin - 80;
    const valueX = this.pageWidth - this.margin;

    this.doc.setFontSize(10);

    // Subtotal
    this.doc.text('Subtotal:', summaryX, this.currentY);
    this.doc.text(formatCurrency(summary.subtotal), valueX, this.currentY, { align: 'right' });
    this.currentY += 6;

    // Discount
    if (summary.discountAmount && summary.discountAmount > 0) {
      this.doc.text(`Discount (${summary.discountPercent}%):`, summaryX, this.currentY);
      this.doc.setTextColor(220, 53, 69);
      this.doc.text(`-${formatCurrency(summary.discountAmount)}`, valueX, this.currentY, { align: 'right' });
      this.resetColor();
      this.currentY += 6;
    }

    // Tax
    if (summary.taxAmount && summary.taxAmount > 0) {
      this.doc.text(`Tax (${summary.taxPercent}%):`, summaryX, this.currentY);
      this.doc.text(formatCurrency(summary.taxAmount), valueX, this.currentY, { align: 'right' });
      this.currentY += 6;
    }

    // Additional Charges
    if (summary.additionalCharges && summary.additionalCharges > 0) {
      const label = summary.additionalChargesDescription || 'Additional Charges';
      this.doc.text(`${label}:`, summaryX, this.currentY);
      this.doc.text(formatCurrency(summary.additionalCharges), valueX, this.currentY, { align: 'right' });
      this.currentY += 6;
    }

    // Grand Total
    this.currentY += 2;
    this.doc.setDrawColor(200, 200, 200);
    this.doc.line(summaryX - 5, this.currentY - 2, valueX, this.currentY - 2);

    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(12);
    this.setColor(this.primaryColor);
    this.doc.text('Grand Total:', summaryX, this.currentY + 4);
    this.doc.text(formatCurrency(summary.grandTotal), valueX, this.currentY + 4, { align: 'right' });
    this.resetColor();

    this.currentY += 15;
  }

  private addNotesAndTerms(notes?: string, termsAndConditions?: string) {
    if (!notes && !termsAndConditions) return;

    // Check for page break
    if (this.currentY > this.pageHeight - 80) {
      this.doc.addPage();
      this.currentY = this.margin;
    }

    this.doc.setFontSize(10);

    if (notes) {
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('Notes:', this.margin, this.currentY);
      this.currentY += 5;
      this.doc.setFont('helvetica', 'normal');
      this.setColor('#666666');

      const noteLines = this.doc.splitTextToSize(notes, this.pageWidth - 2 * this.margin);
      noteLines.forEach((line: string) => {
        this.doc.text(line, this.margin, this.currentY);
        this.currentY += 5;
      });
      this.resetColor();
      this.currentY += 5;
    }

    if (termsAndConditions) {
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('Terms & Conditions:', this.margin, this.currentY);
      this.currentY += 5;
      this.doc.setFont('helvetica', 'normal');
      this.setColor('#666666');

      const termLines = termsAndConditions.split('\n');
      termLines.forEach((line) => {
        const wrappedLines = this.doc.splitTextToSize(line, this.pageWidth - 2 * this.margin);
        wrappedLines.forEach((wLine: string) => {
          this.doc.text(wLine, this.margin, this.currentY);
          this.currentY += 5;
        });
      });
      this.resetColor();
    }
  }

  private addFooter() {
    const footerY = this.pageHeight - 15;
    this.doc.setFontSize(8);
    this.setColor('#999999');
    this.doc.text('Thank you for your business!', this.pageWidth / 2, footerY, { align: 'center' });
    this.doc.text(
      `Generated on ${formatDate(new Date())}`,
      this.pageWidth / 2,
      footerY + 4,
      { align: 'center' }
    );
    this.resetColor();
  }

  generateInvoicePDF(invoice: Invoice, options?: PDFGeneratorOptions): Blob {
    this.doc = new jsPDF();
    this.primaryColor = options?.primaryColor || DEFAULT_PRIMARY_COLOR;
    this.currentY = this.margin;

    this.addHeader(invoice.businessDetails, 'INVOICE', invoice.invoiceNumber, invoice.status);
    this.addClientAndDates(invoice.clientDetails, {
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
    });
    this.addLineItemsTable(invoice.lineItems);
    this.addFinancialSummary(invoice.financialSummary);
    this.addNotesAndTerms(invoice.notes, invoice.termsAndConditions);
    this.addFooter();

    return this.doc.output('blob');
  }

  generateQuotationPDF(quotation: Quotation, options?: PDFGeneratorOptions): Blob {
    this.doc = new jsPDF();
    this.primaryColor = options?.primaryColor || DEFAULT_PRIMARY_COLOR;
    this.currentY = this.margin;

    this.addHeader(quotation.businessDetails, 'QUOTATION', quotation.quotationNumber, quotation.status);
    this.addClientAndDates(quotation.clientDetails, {
      issueDate: quotation.issueDate,
      expiryDate: quotation.expiryDate,
    });
    this.addLineItemsTable(quotation.lineItems);
    this.addFinancialSummary(quotation.financialSummary);
    this.addNotesAndTerms(quotation.notes, quotation.termsAndConditions);
    this.addFooter();

    return this.doc.output('blob');
  }

  downloadInvoicePDF(invoice: Invoice, options?: PDFGeneratorOptions) {
    const blob = this.generateInvoicePDF(invoice, options);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${invoice.invoiceNumber}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  downloadQuotationPDF(quotation: Quotation, options?: PDFGeneratorOptions) {
    const blob = this.generateQuotationPDF(quotation, options);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${quotation.quotationNumber}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export const pdfService = new PDFService();
export default pdfService;
