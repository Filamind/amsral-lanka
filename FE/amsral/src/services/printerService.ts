/**
 * Printer Service for Thermal Printer Integration
 * Supports MP80-04 and similar ESC/POS compatible printers
 */

import type { AssignmentReceiptData, BagLabelData } from '../utils/pdfUtils';

export interface OrderRecordReceiptData {
  orderId: number;
  customerName: string;
  itemName: string;
  quantity: number;
  washType: string;
  processTypes: string[];
  trackingNumber?: string;
  isRemaining?: boolean;
}

// Web Serial API type declarations
declare global {
  interface Navigator {
    serial: {
      getPorts(): Promise<SerialPort[]>;
      requestPort(): Promise<SerialPort>;
    };
  }
  
  interface SerialPort {
    open(options: SerialOptions): Promise<void>;
    close(): Promise<void>;
    readable: ReadableStream<Uint8Array> | null;
    writable: WritableStream<Uint8Array> | null;
    connected: boolean;
    onconnect: ((event: Event) => void) | null;
    ondisconnect: ((event: Event) => void) | null;
    getInfo(): SerialPortInfo;
  }
  
  interface SerialOptions {
    baudRate: number;
    dataBits?: number;
    stopBits?: number;
    parity?: 'none' | 'even' | 'odd';
    flowControl?: 'none' | 'hardware';
  }
  
  interface SerialPortInfo {
    usbVendorId?: number;
    usbProductId?: number;
  }
}

export interface PrinterStatus {
  connected: boolean;
  port?: SerialPort;
  error?: string;
}

export interface ReceiptData {
  companyName: string;
  address: string;
  phone: string;
  orderNumber: string;
  date: string;
  time: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  customerName: string;
  customerPhone: string;
}

class PrinterService {
  private port: SerialPort | null = null;
  private writer: WritableStreamDefaultWriter<Uint8Array> | null = null;
  private readonly STORAGE_KEY = 'printer_connection_state';
  private readonly PORT_INDEX_KEY = 'printer_port_index';

  /**
   * Save connection state to localStorage
   */
  private saveConnectionState(connected: boolean, portInfo?: { 
    portId?: string; 
    portName?: string; 
    portSerialNumber?: string;
    portVendorId?: string;
    portProductId?: string;
  }, portIndex?: number): void {
    try {
      const state = {
        connected,
        portInfo: portInfo || {
          portId: 'unknown',
          portName: 'Connected Printer',
          portSerialNumber: 'unknown',
          portVendorId: 'unknown',
          portProductId: 'unknown'
        },
        portIndex: portIndex || -1,
        timestamp: Date.now()
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
      if (portIndex !== undefined && portIndex >= 0) {
        localStorage.setItem(this.PORT_INDEX_KEY, portIndex.toString());
      }
      console.log('✅ Printer connection state saved to localStorage:', state);
    } catch (error) {
      console.warn('Failed to save printer connection state:', error);
    }
  }

  /**
   * Save port index to localStorage
   */
  private savePortIndex(portIndex: number): void {
    try {
      localStorage.setItem(this.PORT_INDEX_KEY, portIndex.toString());
      console.log(`✅ Port index ${portIndex} saved to localStorage`);
    } catch (error) {
      console.error('❌ Failed to save port index:', error);
    }
  }

  /**
   * Load port index from localStorage
   */
  private loadPortIndex(): number {
    try {
      const index = localStorage.getItem(this.PORT_INDEX_KEY);
      return index ? parseInt(index, 10) : -1;
    } catch (error) {
      console.error('❌ Failed to load port index:', error);
      return -1;
    }
  }

  /**
   * Load connection state from localStorage
   */
  private loadConnectionState(): { 
    connected: boolean; 
    portInfo?: { 
      portId?: string; 
      portName?: string; 
      portSerialNumber?: string;
      portVendorId?: string;
      portProductId?: string;
    }; 
    timestamp?: number 
  } | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      console.log('🔍 Loading printer connection state from localStorage:', stored);
      if (stored) {
        const parsed = JSON.parse(stored);
        console.log('📦 Parsed connection state:', parsed);
        return parsed;
      }
    } catch (error) {
      console.warn('Failed to load printer connection state:', error);
    }
    return null;
  }

  /**
   * Clear connection state from localStorage
   */
  private clearConnectionState(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      console.log('🗑️ Printer connection state cleared from localStorage');
    } catch (error) {
      console.warn('Failed to clear printer connection state:', error);
    }
  }

  /**
   * Check if Web Serial API is supported
   */
  isSupported(): boolean {
    return 'serial' in navigator;
  }

  /**
   * Check if there's a persistent connection state
   */
  hasPersistentConnection(): boolean {
    const state = this.loadConnectionState();
    console.log('🔍 Checking persistent connection, state:', state);
    if (!state) {
      console.log('❌ No persistent connection state found');
      return false;
    }
    
    // Check if the state is recent (within last 24 hours)
    const isRecent = state.timestamp ? (Date.now() - state.timestamp) < 24 * 60 * 60 * 1000 : false;
    const hasConnection = state.connected && isRecent;
    console.log('📊 Connection check:', { 
      connected: state.connected, 
      isRecent, 
      hasConnection,
      timestamp: state.timestamp,
      age: state.timestamp ? Date.now() - state.timestamp : 'unknown'
    });
    return hasConnection;
  }

  /**
   * Get persistent connection info
   */
  getPersistentConnectionInfo(): { portName: string; connectedAt: string } | null {
    const state = this.loadConnectionState();
    if (!state || !state.connected) return null;
    
    return {
      portName: state.portInfo?.portName || 'Unknown Printer',
      connectedAt: state.timestamp ? new Date(state.timestamp).toLocaleString() : 'Unknown'
    };
  }

  /**
   * Quick reconnect using existing ports only (no user gesture required)
   */
  async quickReconnect(): Promise<PrinterStatus> {
    try {
      if (!this.isSupported()) {
        return {
          connected: false,
          error: 'Web Serial API not supported. Please use Chrome or Edge browser.'
        };
      }

      // Check if already connected
      if (this.isConnected()) {
        console.log('Printer already connected');
        return {
          connected: true,
          port: this.port!
        };
      }

      // Clean up any existing bad state
      if (this.port) {
        console.log('Cleaning up existing port...');
        try {
          await this.disconnect();
        } catch (e) {
          console.log('Error during cleanup:', e);
        }
        this.port = null;
        this.writer = null;
      }

      // Try to use existing ports only
      console.log('Quick reconnect: Checking for existing ports...');
      const existingPorts = await this.getAvailablePorts();
      
      if (existingPorts.length === 0) {
        return {
          connected: false,
          error: 'No existing ports found. Please use "Connect Printer" to select a printer.'
        };
      }

      // Get the previously used port index
      const savedPortIndex = this.loadPortIndex();
      console.log('Quick reconnect: Saved port index:', savedPortIndex);
      
      // Try the saved port index first (if valid)
      if (savedPortIndex >= 0 && savedPortIndex < existingPorts.length) {
        console.log(`Quick reconnect: Trying saved port index ${savedPortIndex} first...`);
        try {
          this.port = existingPorts[savedPortIndex];
          
          await this.port.open({ 
            baudRate: 9600,
            dataBits: 8,
            stopBits: 1,
            parity: 'none',
            flowControl: 'none'
          });
          
          this.writer = this.port.writable?.getWriter() || null;
          
          if (this.writer) {
            console.log(`Quick reconnect: Successfully connected to saved port ${savedPortIndex}!`);
            
            // Save connection state with the correct port index
            const portInfo = this.port.getInfo?.();
            this.saveConnectionState(true, {
              portId: String(portInfo?.usbVendorId || 'unknown'),
              portName: 'Connected Printer',
              portSerialNumber: 'unknown',
              portVendorId: String(portInfo?.usbVendorId || 'unknown'),
              portProductId: String(portInfo?.usbProductId || 'unknown')
            }, savedPortIndex);
            
            // Also save the port index separately
            this.savePortIndex(savedPortIndex);

            return {
              connected: true,
              port: this.port
            };
          }
        } catch (error) {
          console.log(`Quick reconnect: Saved port ${savedPortIndex} failed:`, error);
          this.port = null;
          this.writer = null;
        }
      }
      
      // If saved port didn't work, try all ports
      console.log('Quick reconnect: Saved port failed, trying all ports...');
      
      for (let i = 0; i < existingPorts.length; i++) {
        try {
          console.log(`Quick reconnect: Trying port ${i}...`);
          this.port = existingPorts[i];
          
          await this.port.open({ 
            baudRate: 9600,
            dataBits: 8,
            stopBits: 1,
            parity: 'none',
            flowControl: 'none'
          });
          
          this.writer = this.port.writable?.getWriter() || null;
          
          if (this.writer) {
            console.log(`Quick reconnect: Successfully connected to port ${i}!`);
            
            // Save connection state with the working port index
            const portInfo = this.port.getInfo?.();
            this.saveConnectionState(true, {
              portId: String(portInfo?.usbVendorId || 'unknown'),
              portName: 'Connected Printer',
              portSerialNumber: 'unknown',
              portVendorId: String(portInfo?.usbVendorId || 'unknown'),
              portProductId: String(portInfo?.usbProductId || 'unknown')
            }, i);
            
            // Also save the port index separately
            this.savePortIndex(i);

            return {
              connected: true,
              port: this.port
            };
          }
        } catch (error) {
          console.log(`Quick reconnect: Port ${i} failed:`, error);
          this.port = null;
          this.writer = null;
          continue;
        }
      }
      

      return {
        connected: false,
        error: 'All existing ports failed. Please use "Connect Printer" to select a printer manually.'
      };

    } catch (error) {
      console.error('Quick reconnect error:', error);
      return {
        connected: false,
        error: `Quick reconnect failed: ${error}`
      };
    }
  }

  /**
   * Get available serial ports
   */
  async getAvailablePorts(): Promise<SerialPort[]> {
    if (!this.isSupported()) {
      throw new Error('Web Serial API not supported in this browser');
    }
    
    try {
      const ports = await navigator.serial.getPorts();
      console.log('Available serial ports:', ports);
      console.log('Number of ports found:', ports.length);
      
      // Log port information for debugging
      ports.forEach((port: SerialPort, index: number) => {
        console.log(`Port ${index}:`, {
          readable: !!port.readable,
          writable: !!port.writable,
          // Note: getInfo() might not be available in all browsers
          info: port.getInfo ? port.getInfo() : 'getInfo not available'
        });
      });
      
      return ports;
    } catch (error) {
      console.error('Error getting serial ports:', error);
      throw error;
    }
  }

  /**
   * Connect to printer via USB
   */
  async connect(): Promise<PrinterStatus> {
    try {
      if (!this.isSupported()) {
        return {
          connected: false,
          error: 'Web Serial API not supported. Please use Chrome or Edge browser.'
        };
      }

      // Check if already properly connected
      if (this.isConnected()) {
        console.log('Printer already connected');
        return {
          connected: true,
          port: this.port!
        };
      }

      // Try to use existing ports first (browser remembers them)
      console.log('Checking for existing ports...');
      const existingPorts = await this.getAvailablePorts();
      
      if (existingPorts.length > 0) {
        console.log('Found existing ports, trying to use the first one...');
        this.port = existingPorts[0];
        
        try {
          console.log('Attempting to open existing port...');
          await this.port.open({ 
            baudRate: 9600,
            dataBits: 8,
            stopBits: 1,
            parity: 'none',
            flowControl: 'none'
          });
          
          this.writer = this.port.writable?.getWriter() || null;
          
          if (this.writer) {
            console.log('Successfully connected to existing port!');
            
            // Save connection state with port index
            const portInfo = this.port.getInfo?.();
            this.saveConnectionState(true, {
              portId: String(portInfo?.usbVendorId || 'unknown'),
              portName: 'Connected Printer',
              portSerialNumber: 'unknown',
              portVendorId: String(portInfo?.usbVendorId || 'unknown'),
              portProductId: String(portInfo?.usbProductId || 'unknown')
            }, 0); // Save index 0 for first existing port
            
            // Also save the port index separately
            this.savePortIndex(0);
            
            return {
              connected: true,
              port: this.port
            };
          }
        } catch (error) {
          console.log('Failed to use existing port, will request new one:', error);
          this.port = null;
          this.writer = null;
        }
      }

      // If no existing ports or they don't work, request a new one
      console.log('Requesting new port from browser...');
      this.port = await navigator.serial.requestPort();
      
      if (!this.port) {
        throw new Error('No port available for connection');
      }

      console.log('Using new port:', this.port);
      console.log('Port state:', {
        connected: this.port.connected,
        readable: this.port.readable,
        writable: this.port.writable
      });

      console.log('Attempting to open port with settings:', {
        baudRate: 9600,
        dataBits: 8,
        stopBits: 1,
        parity: 'none',
        flowControl: 'none'
      });

      // Open the port with common thermal printer settings
      await this.port.open({ 
        baudRate: 9600,
        dataBits: 8,
        stopBits: 1,
        parity: 'none',
        flowControl: 'none'
      });

      console.log('Port opened successfully');

      // Get writer for sending data
      this.writer = this.port.writable?.getWriter() || null;

      if (!this.writer) {
        throw new Error('Could not get writer for printer');
      }

      console.log('Writer obtained successfully');

      // Find the port index in the existing ports list
      const allPorts = await this.getAvailablePorts();
      let portIndex = -1;
      
      // Try to find which port index this corresponds to
      for (let i = 0; i < allPorts.length; i++) {
        try {
          if (allPorts[i] === this.port) {
            portIndex = i;
            console.log(`Found port index: ${i}`);
            break;
          }
        } catch {
          continue;
        }
      }
      
      // If we couldn't find the index, try to match by port info
      if (portIndex === -1) {
        const selectedPortInfo = this.port.getInfo?.();
        for (let i = 0; i < allPorts.length; i++) {
          try {
            const existingPortInfo = allPorts[i].getInfo?.();
            if (selectedPortInfo && existingPortInfo &&
                selectedPortInfo.usbVendorId === existingPortInfo.usbVendorId &&
                selectedPortInfo.usbProductId === existingPortInfo.usbProductId) {
              portIndex = i;
              console.log(`Found port index by matching info: ${i}`);
              break;
            }
          } catch {
            continue;
          }
        }
      }

      console.log(`Using port index: ${portIndex}`);

      // Save connection state with detailed port info
      const portInfo = this.port.getInfo?.();
      this.saveConnectionState(true, {
        portId: String(portInfo?.usbVendorId || 'unknown'),
        portName: 'Connected Printer',
        portSerialNumber: 'unknown',
        portVendorId: String(portInfo?.usbVendorId || 'unknown'),
        portProductId: String(portInfo?.usbProductId || 'unknown')
      }, portIndex);
      
      // Also save the port index separately
      if (portIndex >= 0) {
        this.savePortIndex(portIndex);
      }

      return {
        connected: true,
        port: this.port
      };
    } catch (error) {
      console.error('Connection error:', error);
      return {
        connected: false,
        error: `Failed to connect to printer: ${error}`
      };
    }
  }

  /**
   * Disconnect from printer
   */
  async disconnect(): Promise<void> {
    try {
      if (this.writer) {
        await this.writer.close();
        this.writer = null;
      }
      if (this.port) {
        await this.port.close();
        this.port = null;
      }

      // Clear connection state
      this.clearConnectionState();
    } catch (error) {
      console.error('Error disconnecting from printer:', error);
    }
  }

  /**
   * Force reset the printer service state
   */
  async forceReset(): Promise<void> {
    console.log('Force resetting printer service...');
    try {
      await this.disconnect();
    } catch (error) {
      console.log('Error during force reset disconnect:', error);
    }
    this.port = null;
    this.writer = null;
    console.log('Printer service reset complete');
  }

  /**
   * Clear all cached ports and reset state
   */
  async clearAllPorts(): Promise<void> {
    console.log('Clearing all cached ports...');
    try {
      // Force reset current state
      await this.forceReset();
      
      // Clear localStorage state
      this.clearConnectionState();
      
      // Try to get fresh ports (this might help clear browser cache)
      const ports = await this.getAvailablePorts();
      console.log(`Found ${ports.length} ports after reset`);
      
      // Close any open ports to clean up
      for (const port of ports) {
        try {
          if (port.readable || port.writable) {
            await port.close();
            console.log('Closed port:', port);
          }
        } catch (error) {
          console.log('Error closing port:', error);
        }
      }
      
      console.log('All ports cleared');
    } catch (error) {
      console.log('Error clearing ports:', error);
    }
  }

  /**
   * Try different communication protocols
   */
  async tryDifferentProtocols(): Promise<void> {
    if (!this.isConnected()) {
      throw new Error('Printer not connected');
    }

    try {
      console.log('Trying different communication protocols...');
      
      // Protocol 1: Standard ESC/POS
      console.log('Protocol 1: Standard ESC/POS');
      await this.sendCommand(new Uint8Array([0x1B, 0x40])); // ESC @
      await this.writer!.write(new TextEncoder().encode('ESC/POS Test\n'));
      
      // Protocol 2: Just raw text
      console.log('Protocol 2: Raw text only');
      await this.writer!.write(new TextEncoder().encode('Raw Text Test\n'));
      
      // Protocol 3: CPCL (Common Point Command Language)
      console.log('Protocol 3: CPCL');
      await this.writer!.write(new TextEncoder().encode('! 0 200 200 210 1\n'));
      await this.writer!.write(new TextEncoder().encode('TEXT 4 0 30 40 CPCL Test\n'));
      await this.writer!.write(new TextEncoder().encode('PRINT\n'));
      
      // Protocol 4: ZPL (Zebra Programming Language)
      console.log('Protocol 4: ZPL');
      await this.writer!.write(new TextEncoder().encode('^XA\n'));
      await this.writer!.write(new TextEncoder().encode('^FO50,50^A0N,50,50^FDZPL Test^FS\n'));
      await this.writer!.write(new TextEncoder().encode('^XZ\n'));
      
      // Protocol 5: Simple ASCII with different encodings
      console.log('Protocol 5: ASCII variations');
      await this.writer!.write(new Uint8Array([72, 101, 108, 108, 111, 10])); // "Hello" + LF
      await this.writer!.write(new Uint8Array([87, 111, 114, 108, 100, 13, 10])); // "World" + CRLF
      
      console.log('All protocols tested');
    } catch (error) {
      console.error('Protocol test error:', error);
      throw error;
    }
  }

  /**
   * Print assignment receipt to thermal printer
   */
  async printAssignmentReceipt(assignmentData: AssignmentReceiptData): Promise<void> {
    if (!this.isConnected()) {
      throw new Error('Printer not connected');
    }

    if (!this.writer) {
      throw new Error('Writer not available');
    }

    try {
      // Initialize printer
      await this.sendCommand(new Uint8Array([0x1B, 0x40])); // ESC @

      // Print header with LARGE text
      await this.printText('MACHINE ASSIGNMENT', { align: 'center', bold: true, doubleHeight: true, doubleWidth: true });
      await this.printSeparator('=', 24);
      await this.printText(''); // Empty line

      // Print assignment details with LARGE text and aligned colons
      await this.printText(`Tracking ID:      ${assignmentData.trackingNumber}`, { bold: true, doubleHeight: true, align: 'left' });
      await this.printText(`Item:             ${assignmentData.itemName}`, { bold: true, doubleHeight: true, align: 'left' });
      await this.printText(`Wash Type:        ${assignmentData.washType}`, { bold: true, doubleHeight: true, align: 'left' });
      await this.printText(`Process:          ${assignmentData.processTypes.join(', ')}`, { bold: true, doubleHeight: true, align: 'left' });
      await this.printText(`Assigned To:      ${assignmentData.assignedTo}`, { bold: true, doubleHeight: true, align: 'left' });
      await this.printText(`Quantity:         ${assignmentData.quantity}`, { bold: true, doubleHeight: true, align: 'left' });

      await this.printText(''); // Empty line

      // Print footer with smaller text
      await this.printSeparator('=', 24);
      await this.printText('Generated: ' + new Date().toLocaleString(), { align: 'center' });
      await this.printText(''); // Empty line

      // Feed paper and cut
      await this.printText(''); // Empty line
      await this.printText(''); // Empty line
      await this.sendCommand(new Uint8Array([0x1D, 0x56, 0x00])); // Paper cut

    } catch (error) {
      console.error('Error printing assignment receipt:', error);
      throw error;
    }
  }

  /**
   * Print bag label to thermal printer
   */
  async printBagLabel(bagData: BagLabelData): Promise<void> {
    if (!this.isConnected()) {
      throw new Error('Printer not connected');
    }

    if (!this.writer) {
      throw new Error('Writer not available');
    }

    try {
      // Initialize printer
      await this.sendCommand(new Uint8Array([0x1B, 0x40])); // ESC @
      
      // Print header with LARGE text
      await this.printText('BAG LABEL', { align: 'center', bold: true, doubleHeight: true, doubleWidth: true });
      await this.printSeparator('=', 24);
      await this.printText(''); // Empty line
      
       // Print bag details with LARGE text and aligned colons
       await this.printText(`Reference No:     ${bagData.orderId}`, { bold: true, doubleHeight: true, align: 'left' });
       await this.printText(`Customer:         ${bagData.customerName}`, { bold: true, doubleHeight: true, align: 'left' });
       
       // Always show Number of Bags and Quantity with LARGE text
       await this.printText(`Number of Bags:   ${bagData.numberOfBags || ''}`, { bold: true, doubleHeight: true, align: 'left' });
       await this.printText(`Quantity:         ${bagData.quantity || ''}`, { bold: true, doubleHeight: true, align: 'left' });
      
      await this.printText(''); // Empty line
      
      // Print footer with smaller text
      await this.printSeparator('=', 24);
      await this.printText('Generated: ' + new Date().toLocaleString(), { align: 'center' });
      await this.printText(''); // Empty line
      
      // Feed paper and cut
      await this.printText(''); // Empty line
      await this.printText(''); // Empty line
      await this.sendCommand(new Uint8Array([0x1D, 0x56, 0x00])); // Paper cut
      
    } catch (error) {
      console.error('Error printing bag label:', error);
      throw error;
    }
  }

  /**
   * Print order record receipt to thermal printer
   */
  async printOrderRecordReceipt(receiptData: OrderRecordReceiptData): Promise<void> {
    if (!this.isConnected()) {
      throw new Error('Printer not connected');
    }

    if (!this.writer) {
      throw new Error('Writer not available');
    }

    try {
      // Initialize printer
      await this.sendCommand(new Uint8Array([0x1B, 0x40])); // ESC @
      
      // Print header with LARGE text
      await this.printText('ORDER RECORD', { align: 'center', bold: true, doubleHeight: true, doubleWidth: true });
      await this.printSeparator('=', 24);
      await this.printText(''); // Empty line
      
      // Print order record details with LARGE text and aligned colons
      await this.printText(`Order ID:         ${receiptData.orderId}`, { bold: true, doubleHeight: true, align: 'left' });
      await this.printText(`Customer:         ${receiptData.customerName}`, { bold: true, doubleHeight: true, align: 'left' });
      await this.printText(`Item:             ${receiptData.itemName}`, { bold: true, doubleHeight: true, align: 'left' });
      await this.printText(`Quantity:         ${receiptData.quantity}`, { bold: true, doubleHeight: true, align: 'left' });
      
      if (receiptData.trackingNumber) {
        await this.printText(`Tracking:         ${receiptData.trackingNumber}`, { bold: true, doubleHeight: true, align: 'left' });
      }
      
      if (receiptData.isRemaining) {
        await this.printText(`Wash Type:        Unknown`, { bold: true, doubleHeight: true, align: 'left' });
        await this.printText(`Process:          Unknown`, { bold: true, doubleHeight: true, align: 'left' });
        await this.printText(`Status:           Remaining Quantity`, { bold: true, doubleHeight: true, align: 'left' });
      } else {
        await this.printText(`Wash Type:        ${receiptData.washType}`, { bold: true, doubleHeight: true, align: 'left' });
        await this.printText(`Process:          ${receiptData.processTypes.join(', ')}`, { bold: true, doubleHeight: true, align: 'left' });
      }
      
      await this.printText(''); // Empty line
      
      // Print footer with smaller text
      await this.printSeparator('=', 24);
      await this.printText('Generated: ' + new Date().toLocaleString(), { align: 'center' });
      await this.printText(''); // Empty line
      
      // Feed paper and cut
      await this.printText(''); // Empty line
      await this.printText(''); // Empty line
      await this.sendCommand(new Uint8Array([0x1D, 0x56, 0x00])); // Paper cut
      
    } catch (error) {
      console.error('Error printing order record receipt:', error);
      throw error;
    }
  }

  /**
   * MP80-04 specific testing - try different approaches for this printer
   */
  async testMP8004(): Promise<void> {
    if (!this.isConnected()) {
      throw new Error('Printer not connected');
    }

    console.log('Testing MP80-04 specific approaches...');
    
    try {
      // Test 1: Try different baud rates with current connection
      const baudRates = [9600, 115200, 38400, 19200, 57600, 4800, 2400];
      
      for (const baudRate of baudRates) {
        try {
          console.log(`Testing baud rate ${baudRate}...`);
          
          // Close and reopen with new baud rate
          if (this.writer) {
            await this.writer.close();
            this.writer = null;
          }
          if (this.port) {
            await this.port.close();
          }
          
          if (this.port) {
            await this.port.open({ 
              baudRate,
              dataBits: 8,
              stopBits: 1,
              parity: 'none',
              flowControl: 'none'
            });
            
            this.writer = this.port.writable?.getWriter() || null;
          }
          
          if (this.writer) {
            // Try multiple approaches for this baud rate
            console.log(`Testing baud rate ${baudRate} with multiple methods...`);
            
            // Method 1: Just raw text
            await this.writer.write(new TextEncoder().encode(`BAUD ${baudRate} TEST\n`));
            await this.writer.write(new TextEncoder().encode('Raw text test\n\n'));
            
            // Method 2: ESC/POS init + text
            await this.sendCommand(new Uint8Array([0x1B, 0x40])); // ESC @
            await this.writer.write(new TextEncoder().encode(`ESC/POS ${baudRate}\n`));
            
            // Method 3: Different line endings
            await this.writer.write(new TextEncoder().encode('Line test\r\n'));
            await this.writer.write(new TextEncoder().encode('Line test\n'));
            
            // Method 4: Paper feed
            await this.sendCommand(new Uint8Array([0x0A, 0x0A])); // Line feeds
            
            console.log(`Baud rate ${baudRate} test completed - check if anything printed`);
            await new Promise(resolve => setTimeout(resolve, 3000)); // Wait longer
            
            // If we get here, this baud rate worked, so break
            console.log(`SUCCESS: Baud rate ${baudRate} appears to work!`);
            break;
          }
          
        } catch (error) {
          console.log(`Baud rate ${baudRate} failed:`, error);
        }
      }
      
      console.log('MP80-04 testing completed - check if anything printed');
      
    } catch (error) {
      console.error('MP80-04 testing failed:', error);
      throw error;
    }
  }

  /**
   * Try different baud rates for Bluetooth connection
   */
  async tryDifferentBaudRates(): Promise<PrinterStatus> {
    if (!this.port) {
      return {
        connected: false,
        error: 'No port available. Please connect first.'
      };
    }

    const baudRates = [9600, 115200, 38400, 19200, 57600];
    
    for (const baudRate of baudRates) {
      try {
        console.log(`Trying baud rate: ${baudRate}`);
        
        // Close current port if open
        if (this.port.readable) {
          await this.port.close();
        }
        
        // Reopen with new baud rate
        await this.port.open({ 
          baudRate: baudRate,
          dataBits: 8,
          stopBits: 1,
          parity: 'none',
          flowControl: 'none'
        });
        
        console.log(`Port opened successfully with baud rate: ${baudRate}`);
        
        // Get writer
        this.writer = this.port.writable?.getWriter() || null;
        
        if (!this.writer) {
          throw new Error('Could not get writer for printer');
        }
        
        // Test with simple command
        await this.sendCommand(new Uint8Array([0x1B, 0x40])); // ESC @
        await this.writer.write(new TextEncoder().encode('Test\r\n'));
        
        console.log(`Success with baud rate: ${baudRate}`);
        return {
          connected: true,
          port: this.port
        };
        
      } catch (error) {
        console.log(`Failed with baud rate ${baudRate}:`, error);
        continue;
      }
    }
    
    return {
      connected: false,
      error: 'Failed to connect with any baud rate'
    };
  }

  /**
   * Clear browser's port cache and force fresh connection
   */
  async clearCacheAndConnect(): Promise<PrinterStatus> {
    console.log('Clearing browser port cache and forcing fresh connection...');
    
    // Force reset first
    await this.forceReset();
    
    // Wait a moment for cleanup
    await new Promise(resolve => setTimeout(resolve, 1000));
    
      // Request fresh port and connect directly (single user gesture)
      try {
        console.log('Requesting fresh port selection...');
        this.port = await navigator.serial.requestPort();
        console.log('Fresh port obtained:', this.port);
        
        if (!this.port) {
          throw new Error('No port available for connection');
        }

        console.log('Port state:', {
          connected: this.port.connected,
          readable: this.port.readable,
          writable: this.port.writable
        });

        console.log('Attempting to open port with settings:', {
          baudRate: 9600,
          dataBits: 8,
          stopBits: 1,
          parity: 'none',
          flowControl: 'none'
        });

        // Open the port with common thermal printer settings
        await this.port.open({ 
          baudRate: 9600,
          dataBits: 8,
          stopBits: 1,
          parity: 'none',
          flowControl: 'none'
        });

        console.log('Port opened successfully');

        // Get writer for sending data
        this.writer = this.port.writable?.getWriter() || null;

        if (!this.writer) {
          throw new Error('Could not get writer for printer');
        }

        console.log('Writer obtained successfully');

        // Find the port index in the existing ports list
        const allPorts = await this.getAvailablePorts();
        let portIndex = -1;
        
        // Try to find which port index this corresponds to
        for (let i = 0; i < allPorts.length; i++) {
          try {
            // Compare port objects or their properties
            if (allPorts[i] === this.port) {
              portIndex = i;
              console.log(`Found port index: ${i}`);
              break;
            }
          } catch {
            // Port comparison might fail, continue
            continue;
          }
        }
        
        // If we couldn't find the index, try to match by port info
        if (portIndex === -1) {
          const selectedPortInfo = this.port.getInfo?.();
          for (let i = 0; i < allPorts.length; i++) {
            try {
              const existingPortInfo = allPorts[i].getInfo?.();
              if (selectedPortInfo && existingPortInfo &&
                  selectedPortInfo.usbVendorId === existingPortInfo.usbVendorId &&
                  selectedPortInfo.usbProductId === existingPortInfo.usbProductId) {
                portIndex = i;
                console.log(`Found port index by matching info: ${i}`);
                break;
              }
            } catch {
              continue;
            }
          }
        }

        console.log(`Using port index: ${portIndex}`);

        // Save connection state with detailed port info and correct port index
        const portInfo = this.port.getInfo?.();
        this.saveConnectionState(true, {
          portId: String(portInfo?.usbVendorId || 'unknown'),
          portName: 'Connected Printer',
          portSerialNumber: 'unknown',
          portVendorId: String(portInfo?.usbVendorId || 'unknown'),
          portProductId: String(portInfo?.usbProductId || 'unknown')
        }, portIndex);
        
        // Also save the port index separately
        if (portIndex >= 0) {
          this.savePortIndex(portIndex);
        }

        return {
          connected: true,
          port: this.port
        };
      } catch (error) {
        console.error('Error in clearCacheAndConnect:', error);
        return {
          connected: false,
          error: `Failed to clear cache and connect: ${error}`
        };
      }
  }

  /**
   * Check if printer is connected
   */
  isConnected(): boolean {
    return this.port !== null && 
           this.writer !== null && 
           this.port.readable !== null && 
           this.port.writable !== null;
  }

  /**
   * Get detailed connection status
   */
  getConnectionStatus(): { connected: boolean; status: string; details: Record<string, boolean | null> } {
    if (!this.port) {
      return {
        connected: false,
        status: 'No port selected',
        details: { port: null, writer: null }
      };
    }

    const details: Record<string, boolean | null> = {
      port: !!this.port,
      writer: !!this.writer,
      readable: !!this.port.readable,
      writable: !!this.port.writable,
      connected: this.port.readable !== null && this.port.writable !== null
    };

    if (this.isConnected()) {
      return {
        connected: true,
        status: 'Connected and ready',
        details
      };
    } else if (this.port.readable && this.port.writable) {
      return {
        connected: true,
        status: 'Port open but writer not ready',
        details
      };
    } else {
      return {
        connected: false,
        status: 'Port not fully open',
        details
      };
    }
  }

  /**
   * Send raw ESC/POS commands to printer
   */
  async sendCommand(command: Uint8Array): Promise<void> {
    if (!this.isConnected()) {
      throw new Error('Printer not connected');
    }

    console.log('Sending command to printer:', command);
    await this.writer!.write(command);
    console.log('Command sent successfully');
  }

  /**
   * Print text with optional formatting
   */
  async printText(text: string, options: {
    align?: 'left' | 'center' | 'right';
    bold?: boolean;
    doubleHeight?: boolean;
    doubleWidth?: boolean;
  } = {}): Promise<void> {
    const commands: Uint8Array[] = [];

    // Set alignment
    if (options.align) {
      const alignCode = options.align === 'center' ? 0x01 : options.align === 'right' ? 0x02 : 0x00;
      commands.push(new Uint8Array([0x1B, 0x61, alignCode])); // ESC a
    }

    // Set text formatting
    let formatCode = 0x00;
    if (options.bold) formatCode |= 0x08;
    if (options.doubleHeight) formatCode |= 0x10;
    if (options.doubleWidth) formatCode |= 0x20;

    if (formatCode !== 0x00) {
      commands.push(new Uint8Array([0x1B, 0x21, formatCode])); // ESC !
    }

    // Add text
    commands.push(new TextEncoder().encode(text));

    // Reset formatting
    if (formatCode !== 0x00) {
      commands.push(new Uint8Array([0x1B, 0x21, 0x00])); // ESC ! (reset)
    }

    // Add line feed
    commands.push(new Uint8Array([0x0A]));

    // Send all commands
    for (const command of commands) {
      await this.sendCommand(command);
    }
  }

  /**
   * Print a line separator
   */
  async printSeparator(char: string = '-', length: number = 32): Promise<void> {
    const separator = char.repeat(length);
    await this.printText(separator);
  }

  /**
   * Print a receipt
   */
  async printReceipt(receipt: ReceiptData): Promise<void> {
    if (!this.isConnected()) {
      throw new Error('Printer not connected');
    }

    try {
      // Initialize printer
      await this.sendCommand(new Uint8Array([0x1B, 0x40])); // ESC @

      // Company header
      await this.printText(receipt.companyName, { align: 'center', bold: true, doubleHeight: true });
      await this.printText(receipt.address, { align: 'center' });
      await this.printText(receipt.phone, { align: 'center' });
      await this.printSeparator();
      await this.printText(''); // Empty line

      // Order details
      await this.printText(`Order #: ${receipt.orderNumber}`);
      await this.printText(`Date: ${receipt.date}`);
      await this.printText(`Time: ${receipt.time}`);
      await this.printText(''); // Empty line

      // Customer info
      await this.printText(`Customer: ${receipt.customerName}`);
      await this.printText(`Phone: ${receipt.customerPhone}`);
      await this.printText(''); // Empty line

      // Items
      await this.printText('Items:');
      await this.printSeparator();
      
      for (const item of receipt.items) {
        const itemLine = `${item.name} x${item.quantity} - $${item.price.toFixed(2)}`;
        await this.printText(itemLine);
      }

      await this.printSeparator();

      // Totals
      await this.printText(`Subtotal: $${receipt.subtotal.toFixed(2)}`);
      await this.printText(`Tax: $${receipt.tax.toFixed(2)}`);
      await this.printText(`Total: $${receipt.total.toFixed(2)}`, { bold: true });
      await this.printText(''); // Empty line

      // Thank you message
      await this.printText('Thank you for your business!', { align: 'center' });
      await this.printText(''); // Empty line
      await this.printText(''); // Empty line

      // Cut paper
      await this.sendCommand(new Uint8Array([0x1D, 0x56, 0x00])); // GS V 0 (Full cut)

    } catch (error) {
      throw new Error(`Print error: ${error}`);
    }
  }

  /**
   * Send a simple test command to verify printer is working
   */
  async sendSimpleTest(): Promise<void> {
    if (!this.isConnected()) {
      throw new Error('Printer not connected');
    }

    try {
      console.log('Sending simple test to printer...');
      
      // Try different initialization sequences
      console.log('Trying multiple initialization sequences...');
      
      // Method 1: Standard ESC/POS initialization
      await this.sendCommand(new Uint8Array([0x1B, 0x40])); // ESC @
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
      
      // Method 2: Alternative initialization
      await this.sendCommand(new Uint8Array([0x1B, 0x1D, 0x61, 0x00])); // ESC GS a 0
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Method 3: Just send raw text without commands
      console.log('Sending raw text without ESC/POS commands...');
      const testText = 'Hello World!\nThis is a test.\n\n';
      const testData = new TextEncoder().encode(testText);
      
      console.log('Sending test data:', testData);
      await this.writer!.write(testData);
      
      // Method 4: Try different line endings
      console.log('Trying different line endings...');
      await this.writer!.write(new TextEncoder().encode('Test 1\r\n'));
      await this.writer!.write(new TextEncoder().encode('Test 2\n'));
      await this.writer!.write(new TextEncoder().encode('Test 3\r'));
      
      // Method 5: Try paper feed
      console.log('Trying paper feed...');
      await this.sendCommand(new Uint8Array([0x0A, 0x0A, 0x0A])); // Multiple line feeds
      
      console.log('Simple test completed');
      
      // Additional debugging: Check if data was actually sent
      console.log('Checking if data was sent successfully...');
      console.log('Writer ready state:', this.writer ? 'Ready' : 'Not ready');
      console.log('Port state:', {
        connected: this.port?.connected,
        readable: this.port?.readable,
        writable: this.port?.writable
      });
      
    } catch (error) {
      console.error('Simple test error:', error);
      throw new Error(`Simple test error: ${error}`);
    }
  }

  /**
   * Print a test page
   */
  async printTestPage(): Promise<void> {
    if (!this.isConnected()) {
      throw new Error('Printer not connected');
    }

    try {
      console.log('Starting test page print...');
      
      // Initialize printer
      console.log('Sending printer initialization...');
      await this.sendCommand(new Uint8Array([0x1B, 0x40])); // ESC @

      console.log('Printing test content...');
      await this.printText('PRINTER TEST PAGE', { align: 'center', bold: true, doubleHeight: true });
      await this.printText(''); // Empty line
      await this.printText('This is a test of the thermal printer.');
      await this.printText('If you can read this, the printer is working correctly.');
      await this.printText(''); // Empty line
      await this.printText(`Date: ${new Date().toLocaleDateString()}`);
      await this.printText(`Time: ${new Date().toLocaleTimeString()}`);
      await this.printText(''); // Empty line
      await this.printText('AMSRAL Laundry Service', { align: 'center' });
      await this.printText(''); // Empty line
      await this.printText(''); // Empty line

      console.log('Sending paper cut command...');
      // Cut paper
      await this.sendCommand(new Uint8Array([0x1D, 0x56, 0x00])); // GS V 0 (Full cut)
      
      console.log('Test page print completed successfully');

    } catch (error) {
      console.error('Test print error:', error);
      throw new Error(`Test print error: ${error}`);
    }
  }
}

// Export singleton instance
export const printerService = new PrinterService();
export default printerService;
