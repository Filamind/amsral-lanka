/* eslint-disable @typescript-eslint/no-unused-vars */
import jsPDF from 'jspdf';
import AL2Logo from '../assets/Images/AL2.jpg';

export interface OrderReceiptData {
  orderId: number;
  customerName: string;
  totalQuantity: number;
  orderDate: string;
  notes?: string;
  referenceNo?: string;
  deliveryDate?: string;
}

export interface AssignmentReceiptData {
  trackingNumber: string;
  itemName: string;
  washType: string;
  processTypes: string[];
  assignedTo: string;
  quantity: number;
}

export interface GatepassData {
  id: number;
  customerName: string;
  orderDate: string;
  totalQuantity: number;
  createdDate: string;
  referenceNo: string;
  deliveryDate: string;
  status: string;
  notes: string | null;
  records: {
    id: number;
    quantity: number;
    washType: string;
    processTypes: string[];
    itemName: string;
    itemId: string;
    status: string;
    trackingNumber: string;
    createdAt: string;
    updatedAt: string;
  }[];
}

export interface BagLabelData {
  orderId: number;
  customerName: string;
  bagNumber: number;
}

export const generateOrderReceipt = (orderData: OrderReceiptData): void => {
  // Create a new PDF document
  // A4 size: 210 x 297 mm, 1/4 size: 105 x 148.5 mm
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [105, 148.5] // 1/4 A4 size
  });

  // Set font
  doc.setFont('helvetica');

  // Colors
  const primaryColor = '#1e293b'; 
  const textColor = '#64748b';
  const lightGray = '#94a3b8'; 

  // Header (no logo for internal use)
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor);
  doc.text('ORDER RECEIPT', 52.5, 20, { align: 'center' });

  // Line separator
  doc.setDrawColor(lightGray);
  doc.line(10, 25, 95, 25);

  // Order details with better spacing
  let yPosition = 35;

  // Helper function to add a detail row with proper spacing
  const addDetailRow = (label: string, value: string, isBold = false) => {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(textColor);
    doc.text(`${label}:`, 10, yPosition);
    
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.text(value, 40, yPosition);
    yPosition += 8; // Increased spacing between rows
  };

  // Order details
  addDetailRow('Order ID', orderData.orderId.toString());
  addDetailRow('Customer', orderData.customerName);
  addDetailRow('Quantity', orderData.totalQuantity.toString());
  
  // Order Date
  const orderDate = new Date(orderData.orderDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
  addDetailRow('Order Date', orderDate);

  // Notes (if provided)
  if (orderData.notes && orderData.notes.trim()) {
    yPosition += 3; // Extra space before notes
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(textColor);
    doc.text('Notes:', 10, yPosition);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    
    // Split notes into multiple lines if too long
    const maxWidth = 80; // Maximum width for text
    const notesLines = doc.splitTextToSize(orderData.notes, maxWidth);
    doc.text(notesLines, 10, yPosition + 6);
    yPosition += 6 + (notesLines.length * 4); // Adjust position based on number of lines
  }

  // Footer (no thank you message for internal use)
  const footerY = Math.max(120, yPosition + 15); // Dynamic footer position
  doc.setDrawColor(lightGray);
  doc.line(10, footerY, 95, footerY);
  
  // Print date and time
  const now = new Date();
  const printTime = now.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  doc.setFontSize(10);
  doc.setTextColor(lightGray);
  doc.text(`Printed: ${printTime}`, 52.5, footerY + 8, { align: 'center' });

  // Generate filename
  const filename = `Order_${orderData.orderId}_Receipt.pdf`;

  // Save the PDF
  doc.save(filename);
};

// Alternative function for regular A4 size (if needed)
export const generateOrderReceiptA4 = (orderData: OrderReceiptData): void => {
  const doc = new jsPDF();
  
  // Set font
  doc.setFont('helvetica');

  // Colors
  const primaryColor = '#2563eb';
  const textColor = '#374151';
  const lightGray = '#9ca3af';

  // Add company logo
  try {
    // Add logo at the top (80mm width, 60mm height) - increased size
    doc.addImage(AL2Logo, 'JPEG', 65, 10, 80, 60); // Center the logo with larger size
  } catch (error) {
    console.warn('Could not load logo, using text fallback');
    // Fallback to text if logo fails to load
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor);
    doc.text('Amsral Laundry Service', 105, 30, { align: 'center' });
  }

  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor);
  doc.text('ORDER RECEIPT', 105, 80, { align: 'center' });

  // Line separator
  doc.setDrawColor(lightGray);
  doc.line(20, 90, 190, 90);

  // Order details with better spacing
  const yPosition = 110;

  // Order details in a more spacious layout
  const details = [
    { label: 'Order ID', value: orderData.orderId.toString() },
    { label: 'Reference Number', value: orderData.referenceNo || 'N/A' },
    { label: 'Customer Name', value: orderData.customerName },
    { label: 'Total Quantity', value: orderData.totalQuantity.toString() },
    { label: 'Order Date', value: new Date(orderData.orderDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }) },
  ];

  if (orderData.deliveryDate) {
    details.push({
      label: 'Delivery Date',
      value: new Date(orderData.deliveryDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    });
  }

  details.forEach((detail, index) => {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(textColor);
    doc.text(`${detail.label}:`, 30, yPosition + (index * 18));
    
    doc.setFont('helvetica', 'normal');
    doc.text(detail.value, 80, yPosition + (index * 18));
  });

  // Notes section
  if (orderData.notes && orderData.notes.trim()) {
    const notesY = yPosition + (details.length * 18) + 20;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Notes:', 30, notesY);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const notesLines = doc.splitTextToSize(orderData.notes, 150);
    doc.text(notesLines, 30, notesY + 10);
  }

  // Footer
  const footerY = 250;
  doc.setDrawColor(lightGray);
  doc.line(20, footerY, 190, footerY);
  
  doc.setFontSize(10);
  doc.setTextColor(lightGray);
  doc.text('Thank you!', 105, footerY + 10, { align: 'center' });
  
  const now = new Date();
  const printTime = now.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  doc.text(`Printed: ${printTime}`, 105, footerY + 20, { align: 'center' });

  // Generate filename
  const filename = `Order_${orderData.referenceNo || orderData.orderId}_Receipt_A4.pdf`;

  // Save the PDF
  doc.save(filename);
};

export const generateAssignmentReceipt = (assignmentData: AssignmentReceiptData): void => {
  // Create a new PDF document
  // A4 size: 210 x 297 mm, 1/4 size: 105 x 148.5 mm
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [105, 148.5] // 1/4 A4 size
  });

  // Set font
  doc.setFont('helvetica');

  // Colors
  const primaryColor = '#1e293b'; 
  const textColor = '#64748b';
  const lightGray = '#94a3b8'; 

  // Header (no logo for internal use)
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor);
  doc.text('MACHINE ASSIGNMENT', 52.5, 20, { align: 'center' });

  // Line separator
  doc.setDrawColor(lightGray);
  doc.line(10, 25, 95, 25);

  // Order details with better spacing
  let yPosition = 35;

  // Helper function to add a detail row with proper spacing
  const addDetailRow = (label: string, value: string | number | undefined | null, isBold = false) => {
    // Ensure value is a valid string
    const safeValue = value !== null && value !== undefined ? String(value) : 'N/A';
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(textColor);
    doc.text(`${label}:`, 10, yPosition);
    
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.text(safeValue, 45, yPosition); // Increased spacing from 40 to 45
    yPosition += 7; // Reduced spacing between rows to fit better
  };

  // Assignment details with safe data handling
  addDetailRow('Tracking ID', assignmentData.trackingNumber);
  addDetailRow('Item Name', assignmentData.itemName);
  addDetailRow('Wash Type', assignmentData.washType);
  
  // Process Types (handle array safely)
  const processTypesText = Array.isArray(assignmentData.processTypes) 
    ? assignmentData.processTypes.join(', ') 
    : 'N/A';
  addDetailRow('Process Types', processTypesText);
  
  addDetailRow('Assigned To', assignmentData.assignedTo);
  addDetailRow('Quantity', assignmentData.quantity);

  // Footer (no thank you message for internal use)
  const footerY = Math.max(120, yPosition + 15); // Dynamic footer position
  doc.setDrawColor(lightGray);
  doc.line(10, footerY, 95, footerY);
  
  // Print date and time
  const now = new Date();
  const printTime = now.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  doc.setFontSize(10);
  doc.setTextColor(lightGray);
  doc.text(`Printed: ${printTime}`, 52.5, footerY + 8, { align: 'center' });

  // Generate filename
  const filename = `Assignment_${assignmentData.assignmentId}_Receipt.pdf`;

  // Save the PDF
  doc.save(filename);
};

export const generateGatepass = (gatepassData: GatepassData): void => {
  // Create a new PDF document
  // A4 size: 210 x 297 mm
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Set font
  doc.setFont('helvetica');

  // Colors
  const primaryColor = '#1e293b'; 
  const textColor = '#64748b';
  const lightGray = '#94a3b8'; 
  const borderColor = '#e2e8f0';

  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor);
  doc.text('GATEPASS', 105, 30, { align: 'center' });

  // Line separator
  doc.setDrawColor(lightGray);
  doc.line(20, 40, 190, 40);

  // Order details section
  let yPosition = 60;

  // Helper function to add a detail row
  const addDetailRow = (label: string, value: string, isBold = false) => {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(textColor);
    doc.text(`${label}:`, 30, yPosition);
    
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.text(value, 80, yPosition);
    yPosition += 8;
  };

  // Order basic details
  addDetailRow('Reference No', gatepassData.id.toString(), true);
  addDetailRow('Customer Name', gatepassData.customerName, true);
  addDetailRow('Order Date', new Date(gatepassData.createdDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }));
  addDetailRow('Total Quantity', gatepassData.totalQuantity.toString(), true);

  // Add some space before records section
  yPosition += 15;

  // Records section header
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor);
  doc.text('ORDER RECORDS', 30, yPosition);
  yPosition += 10;

  // Table headers
  const tableStartY = yPosition;
  const tableWidth = 160;
  const colWidths = [20, 30, 25, 35, 25, 25]; // Quantity, Wash Type, Process Types, Item Name, Item ID, Tracking
  let currentX = 30;

  // Draw table header background
  doc.setFillColor(240, 240, 240);
  doc.rect(30, tableStartY - 5, tableWidth, 10, 'F');

  // Table headers
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor);
  
  const headers = ['Qty', 'Wash Type', 'Process Types', 'Item', 'Item ID', 'Tracking'];
  headers.forEach((header, index) => {
    doc.text(header, currentX + 2, tableStartY + 2);
    currentX += colWidths[index];
  });

  // Draw header border
  doc.setDrawColor(borderColor);
  doc.rect(30, tableStartY - 5, tableWidth, 10);

  yPosition = tableStartY + 10;

  // Records data
  gatepassData.records.forEach((record, index) => {
    const rowY = yPosition + (index * 12);
    
    // Alternate row background
    if (index % 2 === 0) {
      doc.setFillColor(250, 250, 250);
      doc.rect(30, rowY - 2, tableWidth, 12, 'F');
    }

    // Draw row border
    doc.setDrawColor(borderColor);
    doc.rect(30, rowY - 2, tableWidth, 12);

    // Record data
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textColor);

    currentX = 30;
    const rowData = [
      record.quantity.toString(),
      record.washType,
      record.processTypes.join(', '),
      record.itemName,
      record.itemId,
      record.trackingNumber
    ];

    rowData.forEach((data, colIndex) => {
      // Truncate long text
      const maxWidth = colWidths[colIndex] - 4;
      const truncatedData = doc.splitTextToSize(data, maxWidth)[0];
      doc.text(truncatedData, currentX + 2, rowY + 6);
      currentX += colWidths[colIndex];
    });
  });

  // Add space after table
  yPosition += (gatepassData.records.length * 12) + 20;

  // Notes section (if provided)
  if (gatepassData.notes && gatepassData.notes.trim()) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(textColor);
    doc.text('Notes:', 30, yPosition);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const notesLines = doc.splitTextToSize(gatepassData.notes, 150);
    doc.text(notesLines, 30, yPosition + 8);
    yPosition += 8 + (notesLines.length * 4);
  }

  // Footer
  const footerY = Math.max(250, yPosition + 30);
  doc.setDrawColor(lightGray);
  doc.line(20, footerY, 190, footerY);
  
  // Print date and time
  const now = new Date();
  const printTime = now.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  doc.setFontSize(10);
  doc.setTextColor(lightGray);
  doc.text(`Printed: ${printTime}`, 105, footerY + 10, { align: 'center' });

  // Generate filename
  const filename = `Gatepass_${gatepassData.referenceNo}.pdf`;

  // Save the PDF
  doc.save(filename);
};

export const generateBagLabel = (bagData: BagLabelData): void => {
  // Create a new PDF document - A4 size like other receipts
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Set font
  doc.setFont('helvetica');

  // Colors
  const primaryColor = '#1e293b'; 
  const textColor = '#64748b';
  const lightGray = '#94a3b8';

  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor);
  doc.text('BAG LABEL', 105, 30, { align: 'center' });

  // Line separator
  doc.setDrawColor(lightGray);
  doc.line(20, 40, 190, 40);

  // Bag details with better spacing
  let yPosition = 60;

  // Helper function to add a detail row with proper spacing
  const addDetailRow = (label: string, value: string, isBold = false) => {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(textColor);
    doc.text(`${label}:`, 30, yPosition);
    
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.text(value, 80, yPosition);
    yPosition += 12;
  };

  // Bag details
  addDetailRow('Reference No', bagData.orderId.toString(), true);
  addDetailRow('Customer Name', bagData.customerName, true);
  addDetailRow('Bag Number', bagData.bagNumber.toString(), true);

  // Footer
  const footerY = 250;
  doc.setDrawColor(lightGray);
  doc.line(20, footerY, 190, footerY);
  
  // Print date and time
  const now = new Date();
  const printTime = now.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  doc.setFontSize(10);
  doc.setTextColor(lightGray);
  doc.text(`Printed: ${printTime}`, 105, footerY + 10, { align: 'center' });

  // Generate filename
  const filename = `Bag_Label_${bagData.orderId}_${bagData.bagNumber}.pdf`;

  // Save the PDF
  doc.save(filename);
};
