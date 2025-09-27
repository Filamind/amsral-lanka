/**
 * Universal Print Service
 * Provides multiple printing methods for different environments
 */

import printerService from './printerService';
import type { BagLabelData, AssignmentReceiptData } from '../utils/pdfUtils';
import type { OrderRecordReceiptData } from './printerService';

export interface PrintOptions {
  method: 'serial' | 'browser' | 'pdf';
  copies?: number;
  showDialog?: boolean;
}

export interface PrintResult {
  success: boolean;
  method: string;
  error?: string;
}

class PrintService {
  /**
   * Check if Web Serial API is supported
   */
  isSerialSupported(): boolean {
    return 'serial' in navigator;
  }

  /**
   * Check if we're on a mobile device
   */
  isMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  /**
   * Check if we're in a hosted environment (not localhost)
   */
  isHostedEnvironment(): boolean {
    const hostname = window.location.hostname;
    return hostname !== 'localhost' && hostname !== '127.0.0.1' && !hostname.includes('192.168');
  }

  /**
   * Get available printing methods for current environment
   */
  getAvailableMethods(): string[] {
    const methods: string[] = [];

    // Browser printing is always available
    methods.push('browser');

    // PDF generation is always available
    methods.push('pdf');

    // Serial printing only available on desktop Chrome/Edge
    if (this.isSerialSupported() && !this.isMobileDevice()) {
      methods.push('serial');
    }

    return methods;
  }

  /**
   * Print bag label using the best available method
   */
  async printBagLabel(bagData: BagLabelData, options: PrintOptions = { method: 'browser' }): Promise<PrintResult> {
    try {
      switch (options.method) {
        case 'serial':
          if (!this.isSerialSupported()) {
            throw new Error('Web Serial API not supported. Use Chrome or Edge browser.');
          }
          if (this.isMobileDevice()) {
            throw new Error('Serial printing not available on mobile devices.');
          }
          await printerService.printBagLabel(bagData);
          return { success: true, method: 'serial' };

        case 'browser':
          await this.printBagLabelBrowser(bagData, options);
          return { success: true, method: 'browser' };

        case 'pdf':
          await this.printBagLabelPDF(bagData, options);
          return { success: true, method: 'pdf' };

        default:
          throw new Error(`Unknown print method: ${options.method}`);
      }
    } catch (error) {
      console.error('Print error:', error);
      return {
        success: false,
        method: options.method,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Print assignment receipt using the best available method
   */
  async printAssignmentReceipt(assignmentData: AssignmentReceiptData, options: PrintOptions = { method: 'browser' }): Promise<PrintResult> {
    try {
      switch (options.method) {
        case 'serial':
          if (!this.isSerialSupported()) {
            throw new Error('Web Serial API not supported. Use Chrome or Edge browser.');
          }
          if (this.isMobileDevice()) {
            throw new Error('Serial printing not available on mobile devices.');
          }
          await printerService.printAssignmentReceipt(assignmentData);
          return { success: true, method: 'serial' };

        case 'browser':
          await this.printAssignmentReceiptBrowser(assignmentData, options);
          return { success: true, method: 'browser' };

        case 'pdf':
          await this.printAssignmentReceiptPDF(assignmentData, options);
          return { success: true, method: 'pdf' };

        default:
          throw new Error(`Unknown print method: ${options.method}`);
      }
    } catch (error) {
      console.error('Print error:', error);
      return {
        success: false,
        method: options.method,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Print order record receipt using the best available method
   */
  async printOrderRecordReceipt(receiptData: OrderRecordReceiptData, options: PrintOptions = { method: 'browser' }): Promise<PrintResult> {
    try {
      switch (options.method) {
        case 'serial':
          if (!this.isSerialSupported()) {
            throw new Error('Web Serial API not supported. Use Chrome or Edge browser.');
          }
          if (this.isMobileDevice()) {
            throw new Error('Serial printing not available on mobile devices.');
          }
          await printerService.printOrderRecordReceipt(receiptData);
          return { success: true, method: 'serial' };

        case 'browser':
          await this.printOrderRecordReceiptBrowser(receiptData, options);
          return { success: true, method: 'browser' };

        case 'pdf':
          await this.printOrderRecordReceiptPDF(receiptData, options);
          return { success: true, method: 'pdf' };

        default:
          throw new Error(`Unknown print method: ${options.method}`);
      }
    } catch (error) {
      console.error('Print error:', error);
      return {
        success: false,
        method: options.method,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Print bag label using browser print dialog
   */
  private async printBagLabelBrowser(bagData: BagLabelData, options: PrintOptions): Promise<void> {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('Unable to open print window. Please allow popups.');
    }

    const printContent = this.generateBagLabelHTML(bagData);
    printWindow.document.write(printContent);
    printWindow.document.close();

    // Wait for content to load
    await new Promise(resolve => setTimeout(resolve, 500));

    // Print
    printWindow.print();

    // Close window after printing
    if (!options.showDialog) {
      setTimeout(() => printWindow.close(), 1000);
    }
  }

  /**
   * Print assignment receipt using browser print dialog
   */
  private async printAssignmentReceiptBrowser(assignmentData: AssignmentReceiptData, options: PrintOptions): Promise<void> {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('Unable to open print window. Please allow popups.');
    }

    const printContent = this.generateAssignmentReceiptHTML(assignmentData);
    printWindow.document.write(printContent);
    printWindow.document.close();

    // Wait for content to load
    await new Promise(resolve => setTimeout(resolve, 500));

    // Print
    printWindow.print();

    // Close window after printing
    if (!options.showDialog) {
      setTimeout(() => printWindow.close(), 1000);
    }
  }

  /**
   * Print order record receipt using browser print dialog
   */
  private async printOrderRecordReceiptBrowser(receiptData: OrderRecordReceiptData, options: PrintOptions): Promise<void> {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('Unable to open print window. Please allow popups.');
    }

    const printContent = this.generateOrderRecordReceiptHTML(receiptData);
    printWindow.document.write(printContent);
    printWindow.document.close();

    // Wait for content to load
    await new Promise(resolve => setTimeout(resolve, 500));

    // Print
    printWindow.print();

    // Close window after printing
    if (!options.showDialog) {
      setTimeout(() => printWindow.close(), 1000);
    }
  }

  /**
   * Generate HTML for bag label printing
   */
  private generateBagLabelHTML(bagData: BagLabelData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Bag Label</title>
        <style>
          @media print {
            body { margin: 0; padding: 10px; font-family: monospace; }
            .label { width: 80mm; height: 50mm; border: 1px solid #000; padding: 5px; }
            .header { text-align: center; font-weight: bold; font-size: 14px; margin-bottom: 10px; }
            .content { font-size: 12px; line-height: 1.2; }
            .field { margin-bottom: 3px; }
            .field-label { font-weight: bold; }
          }
        </style>
      </head>
      <body>
        <div class="label">
          <div class="header">BAG LABEL</div>
          <div class="content">
            <div class="field"><span class="field-label">Reference No:</span> ${bagData.orderId}</div>
            <div class="field"><span class="field-label">Customer:</span> ${bagData.customerName}</div>
            <div class="field"><span class="field-label">Number of Bags:</span> ${bagData.numberOfBags || ''}</div>
            <div class="field"><span class="field-label">Quantity:</span> ${bagData.quantity || ''}</div>
            <div class="field" style="margin-top: 10px; font-size: 10px; text-align: center;">
              Generated: ${new Date().toLocaleString()}
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate HTML for assignment receipt printing
   */
  private generateAssignmentReceiptHTML(assignmentData: AssignmentReceiptData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Assignment Receipt</title>
        <style>
          @media print {
            body { margin: 0; padding: 10px; font-family: monospace; }
            .receipt { width: 80mm; border: 1px solid #000; padding: 5px; }
            .header { text-align: center; font-weight: bold; font-size: 16px; margin-bottom: 10px; }
            .content { font-size: 12px; line-height: 1.3; }
            .field { margin-bottom: 5px; }
            .field-label { font-weight: bold; }
            .separator { border-top: 1px solid #000; margin: 10px 0; }
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">MACHINE ASSIGNMENT</div>
          <div class="separator"></div>
          <div class="content">
            <div class="field"><span class="field-label">Tracking ID:</span> ${assignmentData.trackingNumber}</div>
            <div class="field"><span class="field-label">Item:</span> ${assignmentData.itemName}</div>
            <div class="field"><span class="field-label">Wash Type:</span> ${assignmentData.washType}</div>
            <div class="field"><span class="field-label">Process:</span> ${assignmentData.processTypes.join(', ')}</div>
            <div class="field"><span class="field-label">Assigned To:</span> ${assignmentData.assignedTo}</div>
            <div class="field"><span class="field-label">Quantity:</span> ${assignmentData.quantity}</div>
            <div class="separator"></div>
            <div class="field" style="text-align: center; font-size: 10px;">
              Generated: ${new Date().toLocaleString()}
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate HTML for order record receipt printing
   */
  private generateOrderRecordReceiptHTML(receiptData: OrderRecordReceiptData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Order Record Receipt</title>
        <style>
          @media print {
            body { margin: 0; padding: 10px; font-family: monospace; }
            .receipt { width: 80mm; border: 1px solid #000; padding: 5px; }
            .header { text-align: center; font-weight: bold; font-size: 16px; margin-bottom: 10px; }
            .content { font-size: 12px; line-height: 1.3; }
            .field { margin-bottom: 5px; }
            .field-label { font-weight: bold; }
            .separator { border-top: 1px solid #000; margin: 10px 0; }
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">ORDER RECORD</div>
          <div class="separator"></div>
          <div class="content">
            <div class="field"><span class="field-label">Order ID:</span> ${receiptData.orderId}</div>
            <div class="field"><span class="field-label">Customer:</span> ${receiptData.customerName}</div>
            <div class="field"><span class="field-label">Item:</span> ${receiptData.itemName}</div>
            <div class="field"><span class="field-label">Quantity:</span> ${receiptData.quantity}</div>
            ${receiptData.trackingNumber ? `<div class="field"><span class="field-label">Tracking:</span> ${receiptData.trackingNumber}</div>` : ''}
            ${receiptData.isRemaining ? 
              `<div class="field"><span class="field-label">Status:</span> Remaining Quantity</div>` :
              `<div class="field"><span class="field-label">Wash Type:</span> ${receiptData.washType}</div>
               <div class="field"><span class="field-label">Process:</span> ${receiptData.processTypes.join(', ')}</div>`
            }
            <div class="separator"></div>
            <div class="field" style="text-align: center; font-size: 10px;">
              Generated: ${new Date().toLocaleString()}
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Print bag label as PDF (placeholder for PDF generation)
   */
  private async printBagLabelPDF(bagData: BagLabelData, options: PrintOptions): Promise<void> {
    // This would integrate with a PDF generation library like jsPDF
    // For now, fall back to browser printing
    console.log('PDF generation not implemented yet, falling back to browser printing');
    await this.printBagLabelBrowser(bagData, options);
  }

  /**
   * Print assignment receipt as PDF (placeholder for PDF generation)
   */
  private async printAssignmentReceiptPDF(assignmentData: AssignmentReceiptData, options: PrintOptions): Promise<void> {
    // This would integrate with a PDF generation library like jsPDF
    // For now, fall back to browser printing
    console.log('PDF generation not implemented yet, falling back to browser printing');
    await this.printAssignmentReceiptBrowser(assignmentData, options);
  }

  /**
   * Print order record receipt as PDF (placeholder for PDF generation)
   */
  private async printOrderRecordReceiptPDF(receiptData: OrderRecordReceiptData, options: PrintOptions): Promise<void> {
    // This would integrate with a PDF generation library like jsPDF
    // For now, fall back to browser printing
    console.log('PDF generation not implemented yet, falling back to browser printing');
    await this.printOrderRecordReceiptBrowser(receiptData, options);
  }

  /**
   * Get the best printing method for current environment
   */
  getBestPrintMethod(): string {
    const availableMethods = this.getAvailableMethods();
    
    // Prefer serial printing if available
    if (availableMethods.includes('serial') && printerService.isConnected()) {
      return 'serial';
    }
    
    // Fall back to browser printing
    return 'browser';
  }

  /**
   * Auto-detect and use the best printing method
   */
  async printBagLabelAuto(bagData: BagLabelData, options: Omit<PrintOptions, 'method'> = {}): Promise<PrintResult> {
    const method = this.getBestPrintMethod();
    return this.printBagLabel(bagData, { ...options, method: method as any });
  }

  async printAssignmentReceiptAuto(assignmentData: AssignmentReceiptData, options: Omit<PrintOptions, 'method'> = {}): Promise<PrintResult> {
    const method = this.getBestPrintMethod();
    return this.printAssignmentReceipt(assignmentData, { ...options, method: method as any });
  }

  async printOrderRecordReceiptAuto(receiptData: OrderRecordReceiptData, options: Omit<PrintOptions, 'method'> = {}): Promise<PrintResult> {
    const method = this.getBestPrintMethod();
    return this.printOrderRecordReceipt(receiptData, { ...options, method: method as any });
  }
}

// Export singleton instance
export const printService = new PrintService();
export default printService;
