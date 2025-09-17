import jsPDF from 'jspdf';

// Invoice data interfaces
export interface InvoiceRecord {
  id: number;
  orderId: number;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  washType: string;
  processTypes: string[];
}

export interface InvoiceData {
  invoiceNumber: string;
  customerName: string;
  customerAddress: string;
  customerPhone: string;
  invoiceDate: string;
  dueDate: string;
  orders: {
    id: number;
    referenceNo: string;
    orderDate: string;
    records: InvoiceRecord[];
  }[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
}

/**
 * Generate and print invoice PDF
 * This function is isolated for different printer configurations
 */
export const generateInvoice = (invoiceData: InvoiceData): void => {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;

    // Set font
    doc.setFont('helvetica');

    // Header
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', pageWidth - 60, yPosition);
    yPosition += 10;

    // Invoice number and date
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Invoice #: ${invoiceData.invoiceNumber}`, pageWidth - 60, yPosition);
    yPosition += 6;
    doc.text(`Date: ${invoiceData.invoiceDate ? new Date(invoiceData.invoiceDate).toLocaleDateString() : 'N/A'}`, pageWidth - 60, yPosition);
    yPosition += 6;
    doc.text(`Due: ${invoiceData.dueDate ? new Date(invoiceData.dueDate).toLocaleDateString() : 'N/A'}`, pageWidth - 60, yPosition);
    yPosition += 15;

    // Company info (you can customize this)
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('AMSRAL LAUNDRY SERVICES', 20, yPosition);
    yPosition += 6;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Professional Laundry & Dry Cleaning', 20, yPosition);
    yPosition += 6;
    doc.text('123 Business Street, City, State 12345', 20, yPosition);
    yPosition += 6;
    doc.text('Phone: (555) 123-4567 | Email: info@amsral.com', 20, yPosition);
    yPosition += 15;

    // Customer info
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Bill To:', 20, yPosition);
    yPosition += 6;
    doc.setFont('helvetica', 'normal');
    doc.text(invoiceData.customerName, 20, yPosition);
    yPosition += 6;
    if (invoiceData.customerAddress) {
      doc.text(invoiceData.customerAddress, 20, yPosition);
      yPosition += 6;
    }
    if (invoiceData.customerPhone) {
      doc.text(invoiceData.customerPhone, 20, yPosition);
      yPosition += 6;
    }
    yPosition += 10;

    // Line separator
    doc.setLineWidth(0.5);
    doc.line(20, yPosition, pageWidth - 20, yPosition);
    yPosition += 10;

    // Orders section
    invoiceData.orders.forEach((order, orderIndex) => {
      // Order header
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`Order #${order.referenceNo} - ${order.orderDate ? new Date(order.orderDate).toLocaleDateString() : 'N/A'}`, 20, yPosition);
      yPosition += 8;

      // Table header
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      const tableStartY = yPosition;
      
      // Table headers
      doc.text('Item', 20, yPosition);
      doc.text('Wash Type', 80, yPosition);
      doc.text('Process', 120, yPosition);
      doc.text('Qty', 160, yPosition);
      doc.text('Unit Price', 180, yPosition);
      doc.text('Total', pageWidth - 30, yPosition);
      yPosition += 6;

      // Table line
      doc.setLineWidth(0.3);
      doc.line(20, yPosition, pageWidth - 20, yPosition);
      yPosition += 4;

      // Table rows
      doc.setFont('helvetica', 'normal');
      order.records.forEach((record) => {
        // Check if we need a new page
        if (yPosition > pageHeight - 40) {
          doc.addPage();
          yPosition = 20;
        }

        doc.text(record.itemName, 20, yPosition);
        doc.text(record.washType, 80, yPosition);
        doc.text(record.processTypes.join(', '), 120, yPosition);
        doc.text(record.quantity.toString(), 160, yPosition);
        doc.text(`$${record.unitPrice.toFixed(2)}`, 180, yPosition);
        doc.text(`$${record.totalPrice.toFixed(2)}`, pageWidth - 30, yPosition);
        yPosition += 5;
      });

      // Order total line
      doc.setLineWidth(0.3);
      doc.line(20, yPosition, pageWidth - 20, yPosition);
      yPosition += 4;

      const orderTotal = order.records.reduce((sum, record) => sum + record.totalPrice, 0);
      doc.setFont('helvetica', 'bold');
      doc.text(`Order Total: $${orderTotal.toFixed(2)}`, pageWidth - 50, yPosition);
      yPosition += 8;

      // Add space between orders
      if (orderIndex < invoiceData.orders.length - 1) {
        yPosition += 5;
      }
    });

    // Final totals
    yPosition += 10;
    doc.setLineWidth(0.5);
    doc.line(20, yPosition, pageWidth - 20, yPosition);
    yPosition += 10;

    // Totals section
    const totalsX = pageWidth - 80;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Subtotal:', totalsX, yPosition);
    doc.text(`$${invoiceData.subtotal.toFixed(2)}`, pageWidth - 30, yPosition);
    yPosition += 6;

    doc.text(`Tax (${(invoiceData.taxRate * 100).toFixed(1)}%):`, totalsX, yPosition);
    doc.text(`$${invoiceData.taxAmount.toFixed(2)}`, pageWidth - 30, yPosition);
    yPosition += 6;

    doc.setLineWidth(0.3);
    doc.line(totalsX, yPosition, pageWidth - 20, yPosition);
    yPosition += 6;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Total:', totalsX, yPosition);
    doc.text(`$${invoiceData.total.toFixed(2)}`, pageWidth - 30, yPosition);
    yPosition += 15;

    // Payment terms
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Payment Terms:', 20, yPosition);
    yPosition += 6;
    doc.text(`Payment is due within ${Math.round((new Date(invoiceData.dueDate).getTime() - new Date(invoiceData.invoiceDate).getTime()) / (1000 * 60 * 60 * 24))} days of invoice date.`, 20, yPosition);
    yPosition += 6;
    doc.text('Thank you for your business!', 20, yPosition);

    // Footer
    const footerY = pageHeight - 20;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Generated by AMSRAL Billing System', pageWidth / 2, footerY, { align: 'center' });

    // Save the PDF
    doc.save(`Invoice_${invoiceData.invoiceNumber}.pdf`);

    // Also open in new window for printing
    const pdfOutput = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfOutput);
    window.open(pdfUrl, '_blank');

    // Clean up
    setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);

  } catch (error) {
    console.error('Error generating invoice:', error);
    throw new Error('Failed to generate invoice PDF');
  }
};

/**
 * Generate invoice for thermal printer (80mm width)
 * This function is specifically designed for thermal printers
 */
export const generateThermalInvoice = (invoiceData: InvoiceData): void => {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [80, 200] // 80mm width, variable height
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    let yPosition = 10;

    // Set font
    doc.setFont('helvetica');

    // Header
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 8;

    // Invoice details
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`#${invoiceData.invoiceNumber}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 5;
    doc.text(invoiceData.invoiceDate ? new Date(invoiceData.invoiceDate).toLocaleDateString() : 'N/A', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 8;

    // Company info
    doc.setFontSize(8);
    doc.text('AMSRAL LAUNDRY', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 4;
    doc.text('Professional Services', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 6;

    // Customer info
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Bill To:', 5, yPosition);
    yPosition += 4;
    doc.setFont('helvetica', 'normal');
    doc.text(invoiceData.customerName, 5, yPosition);
    yPosition += 6;

    // Line separator
    doc.setLineWidth(0.3);
    doc.line(5, yPosition, pageWidth - 5, yPosition);
    yPosition += 5;

    // Orders
    invoiceData.orders.forEach((order) => {
      // Order header
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text(`Order: ${order.referenceNo}`, 5, yPosition);
      yPosition += 4;

      // Records
      doc.setFont('helvetica', 'normal');
      order.records.forEach((record) => {
        doc.text(`${record.itemName}`, 5, yPosition);
        yPosition += 3;
        doc.text(`${record.quantity}x $${record.unitPrice.toFixed(2)} = $${record.totalPrice.toFixed(2)}`, 5, yPosition);
        yPosition += 4;
      });
      yPosition += 2;
    });

    // Totals
    doc.setLineWidth(0.3);
    doc.line(5, yPosition, pageWidth - 5, yPosition);
    yPosition += 4;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total: $${invoiceData.total.toFixed(2)}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 8;

    // Footer
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('Thank you!', pageWidth / 2, yPosition, { align: 'center' });

    // Save for thermal printer
    doc.save(`Thermal_Invoice_${invoiceData.invoiceNumber}.pdf`);

  } catch (error) {
    console.error('Error generating thermal invoice:', error);
    throw new Error('Failed to generate thermal invoice');
  }
};

/**
 * Generate invoice for A4 printer with detailed layout
 */
export const generateA4Invoice = (invoiceData: InvoiceData): void => {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;

    // Header with logo area
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('AMSRAL LAUNDRY SERVICES', 20, yPosition);
    yPosition += 8;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Professional Laundry & Dry Cleaning Solutions', 20, yPosition);
    yPosition += 15;

    // Invoice header box
    doc.setFillColor(240, 240, 240);
    doc.rect(pageWidth - 80, 20, 60, 40, 'F');
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', pageWidth - 50, 35, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`#${invoiceData.invoiceNumber}`, pageWidth - 50, 45, { align: 'center' });
    doc.text(`Date: ${invoiceData.invoiceDate ? new Date(invoiceData.invoiceDate).toLocaleDateString() : 'N/A'}`, pageWidth - 50, 50, { align: 'center' });
    doc.text(`Due: ${invoiceData.dueDate ? new Date(invoiceData.dueDate).toLocaleDateString() : 'N/A'}`, pageWidth - 50, 55, { align: 'center' });

    yPosition = 70;

    // Customer information
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Bill To:', 20, yPosition);
    yPosition += 8;
    
    doc.setFont('helvetica', 'normal');
    doc.text(invoiceData.customerName, 20, yPosition);
    yPosition += 6;
    if (invoiceData.customerAddress) {
      doc.text(invoiceData.customerAddress, 20, yPosition);
      yPosition += 6;
    }
    if (invoiceData.customerPhone) {
      doc.text(invoiceData.customerPhone, 20, yPosition);
      yPosition += 6;
    }
    yPosition += 10;

    // Detailed table
    const tableTop = yPosition;
    const colWidths = [60, 30, 40, 20, 25, 25];
    const colPositions = [20, 80, 110, 150, 170, 195];

    // Table header
    doc.setFillColor(200, 200, 200);
    doc.rect(20, tableTop, pageWidth - 40, 8, 'F');
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    const headers = ['Item Description', 'Wash Type', 'Process', 'Qty', 'Unit Price', 'Total'];
    headers.forEach((header, index) => {
      doc.text(header, colPositions[index], tableTop + 6);
    });

    yPosition = tableTop + 8;

    // Table rows
    doc.setFont('helvetica', 'normal');
    invoiceData.orders.forEach((order) => {
      // Order separator
      if (yPosition > tableTop + 8) {
        doc.setLineWidth(0.5);
        doc.line(20, yPosition, pageWidth - 20, yPosition);
        yPosition += 3;
      }

      // Order header row
      doc.setFont('helvetica', 'bold');
      doc.text(`Order: ${order.referenceNo} (${order.orderDate ? new Date(order.orderDate).toLocaleDateString() : 'N/A'})`, 20, yPosition);
      yPosition += 6;

      // Records
      doc.setFont('helvetica', 'normal');
      order.records.forEach((record) => {
        doc.text(record.itemName, colPositions[0], yPosition);
        doc.text(record.washType, colPositions[1], yPosition);
        doc.text(record.processTypes.join(', '), colPositions[2], yPosition);
        doc.text(record.quantity.toString(), colPositions[3], yPosition);
        doc.text(`$${record.unitPrice.toFixed(2)}`, colPositions[4], yPosition);
        doc.text(`$${record.totalPrice.toFixed(2)}`, colPositions[5], yPosition);
        yPosition += 5;
      });
    });

    // Totals section
    yPosition += 10;
    const totalsStartY = yPosition;
    
    doc.setLineWidth(0.5);
    doc.line(pageWidth - 60, totalsStartY, pageWidth - 20, totalsStartY);
    yPosition += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Subtotal:', pageWidth - 50, yPosition);
    doc.text(`$${invoiceData.subtotal.toFixed(2)}`, pageWidth - 30, yPosition);
    yPosition += 6;

    doc.text(`Tax (${(invoiceData.taxRate * 100).toFixed(1)}%):`, pageWidth - 50, yPosition);
    doc.text(`$${invoiceData.taxAmount.toFixed(2)}`, pageWidth - 30, yPosition);
    yPosition += 6;

    doc.setLineWidth(0.5);
    doc.line(pageWidth - 60, yPosition, pageWidth - 20, yPosition);
    yPosition += 6;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Total:', pageWidth - 50, yPosition);
    doc.text(`$${invoiceData.total.toFixed(2)}`, pageWidth - 30, yPosition);
    yPosition += 15;

    // Payment terms
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Payment Terms:', 20, yPosition);
    yPosition += 6;
    doc.text(`Payment is due within ${Math.round((new Date(invoiceData.dueDate).getTime() - new Date(invoiceData.invoiceDate).getTime()) / (1000 * 60 * 60 * 24))} days of invoice date.`, 20, yPosition);
    yPosition += 6;
    doc.text('Thank you for choosing AMSRAL for your laundry needs!', 20, yPosition);

    // Save A4 invoice
    doc.save(`A4_Invoice_${invoiceData.invoiceNumber}.pdf`);

    // Open for printing
    const pdfOutput = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfOutput);
    window.open(pdfUrl, '_blank');

    setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);

  } catch (error) {
    console.error('Error generating A4 invoice:', error);
    throw new Error('Failed to generate A4 invoice');
  }
};
