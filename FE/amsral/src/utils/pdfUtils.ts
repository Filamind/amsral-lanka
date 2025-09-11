/* eslint-disable @typescript-eslint/no-unused-vars */
import jsPDF from 'jspdf';
import AL2Logo from '../assets/Images/AL2.jpg';

export interface OrderReceiptData {
  orderId: number;
  customerName: string;
  totalQuantity: number;
  orderDate: string;
  notes?: string;
}

export interface AssignmentReceiptData {
  assignmentId: number;
  orderId: number;
  recordId: string;
  itemName: string;
  washType: string;
  processTypes: string[];
  assignedTo: string;
  quantity: number;
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
    { label: 'Reference Number', value: orderData.referenceNo },
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
  const filename = `Order_${orderData.referenceNo}_Receipt_A4.pdf`;

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
  addDetailRow('Assignment ID', assignmentData.assignmentId);
  addDetailRow('Order ID', assignmentData.orderId);
  addDetailRow('Record ID', assignmentData.recordId);
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
