/**
 * Bag Label Printer Service
 * Separate service for bag label printing to avoid interfering with main printer service
 */

import printerService from './printerService';
import type { BagLabelData } from '../utils/pdfUtils';

class BagLabelPrinterService {
  /**
   * Print bag label to thermal printer
   */
  async printBagLabel(bagData: BagLabelData): Promise<void> {
    if (!printerService.isConnected()) {
      throw new Error('Printer not connected');
    }

    try {
      // Use the existing printer service's printBagLabel method
      await printerService.printBagLabel(bagData);
    } catch (error) {
      console.error('Error printing bag label:', error);
      throw error;
    }
  }

  /**
   * Print multiple bag labels with delay between prints
   */
  async printMultipleBagLabels(bagDataArray: BagLabelData[], onProgress?: (current: number, total: number) => void): Promise<void> {
    if (!printerService.isConnected()) {
      throw new Error('Printer not connected');
    }

    try {
      for (let i = 0; i < bagDataArray.length; i++) {
        // Notify progress
        if (onProgress) {
          onProgress(i + 1, bagDataArray.length);
        }
        
        console.log(`Printing bag ${i + 1} of ${bagDataArray.length}...`);
        await this.printBagLabel(bagDataArray[i]);
        
        // Delay between prints to allow easy removal of each bill
        if (i < bagDataArray.length - 1) {
          console.log(`Waiting 2 seconds before printing next bag...`);
          await new Promise(resolve => setTimeout(resolve, 5000)); // 2 seconds delay
        }
      }
      
      console.log(`All ${bagDataArray.length} bag labels printed successfully!`);
    } catch (error) {
      console.error('Error printing multiple bag labels:', error);
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
const bagLabelPrinterService = new BagLabelPrinterService();
export default bagLabelPrinterService;
