/**
 * Order Record Printer Service
 * Separate service for order record printing to avoid interfering with main printer service
 */

import printerService, { type OrderRecordReceiptData } from './printerService';

class OrderRecordPrinterService {
  /**
   * Print order record receipt to thermal printer
   */
  async printOrderRecordReceipt(receiptData: OrderRecordReceiptData): Promise<void> {
    if (!printerService.isConnected()) {
      throw new Error('Printer not connected');
    }

    try {
      // Use the existing printer service's printOrderRecordReceipt method
      await printerService.printOrderRecordReceipt(receiptData);
    } catch (error) {
      console.error('Error printing order record receipt:', error);
      throw error;
    }
  }

  /**
   * Print multiple order record receipts with delay between prints
   */
  async printMultipleOrderRecords(receiptDataArray: OrderRecordReceiptData[], onProgress?: (current: number, total: number) => void): Promise<void> {
    if (!printerService.isConnected()) {
      throw new Error('Printer not connected');
    }

    try {
      for (let i = 0; i < receiptDataArray.length; i++) {
        // Notify progress
        if (onProgress) {
          onProgress(i + 1, receiptDataArray.length);
        }
        
        console.log(`Printing order record ${i + 1} of ${receiptDataArray.length}...`);
        await this.printOrderRecordReceipt(receiptDataArray[i]);
        
        // Delay between prints to allow easy removal of each receipt
        if (i < receiptDataArray.length - 1) {
          console.log(`Waiting 5 seconds before printing next receipt...`);
          await new Promise(resolve => setTimeout(resolve, 5000)); // 5 seconds delay
        }
      }
      
      console.log(`All ${receiptDataArray.length} order record receipts printed successfully!`);
    } catch (error) {
      console.error('Error printing multiple order record receipts:', error);
      throw error;
    }
  }

  /**
   * Check if printer is connected
   */
  isConnected(): boolean {
    return printerService.isConnected();
  }
}

// Export singleton instance
const orderRecordPrinterService = new OrderRecordPrinterService();
export default orderRecordPrinterService;
