import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateOrderReceipt, generateOrderReceiptA4, generateGatepass, generateBagLabel } from '../../utils/pdfUtils'
import type { OrderReceiptData, GatepassData, BagLabelData } from '../../utils/pdfUtils'

// Mock jsPDF
vi.mock('jspdf', () => ({
  default: vi.fn().mockImplementation(() => ({
    addImage: vi.fn(),
    text: vi.fn(),
    setFontSize: vi.fn(),
    setTextColor: vi.fn(),
    setFont: vi.fn(),
    line: vi.fn(),
    rect: vi.fn(),
    save: vi.fn(),
    getPageWidth: vi.fn(() => 210),
    getPageHeight: vi.fn(() => 297),
    internal: {
      pageSize: {
        getWidth: vi.fn(() => 210),
        getHeight: vi.fn(() => 297)
      }
    }
  }))
}))

describe('pdfUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('generateOrderReceipt', () => {
    it('should generate order receipt with valid data', () => {
      const orderData: OrderReceiptData = {
        orderId: 'ORD001',
        customerName: 'Test Customer',
        orderDate: '2024-01-01',
        deliveryDate: '2024-01-15',
        totalQuantity: 100,
        records: [
          {
            itemName: 'Test Item',
            quantity: 50,
            washType: 'Wash Type 1',
            processTypes: ['Process 1', 'Process 2']
          }
        ]
      }

      expect(() => generateOrderReceipt(orderData)).not.toThrow()
    })

    it('should handle empty records array', () => {
      const orderData: OrderReceiptData = {
        orderId: 'ORD001',
        customerName: 'Test Customer',
        orderDate: '2024-01-01',
        deliveryDate: '2024-01-15',
        totalQuantity: 100,
        records: []
      }

      expect(() => generateOrderReceipt(orderData)).not.toThrow()
    })
  })

  describe('generateOrderReceiptA4', () => {
    it('should generate A4 order receipt with valid data', () => {
      const orderData: OrderReceiptData = {
        orderId: 'ORD001',
        customerName: 'Test Customer',
        orderDate: '2024-01-01',
        deliveryDate: '2024-01-15',
        totalQuantity: 100,
        records: [
          {
            itemName: 'Test Item',
            quantity: 50,
            washType: 'Wash Type 1',
            processTypes: ['Process 1', 'Process 2']
          }
        ]
      }

      expect(() => generateOrderReceiptA4(orderData)).not.toThrow()
    })
  })

  describe('generateGatepass', () => {
    it('should generate gatepass with valid data', () => {
      const gatepassData: GatepassData = {
        orderId: 'ORD001',
        customerName: 'Test Customer',
        orderDate: '2024-01-01',
        totalQuantity: 100,
        createdDate: '2024-01-01T10:00:00Z',
        records: [
          {
            itemName: 'Test Item',
            quantity: 50,
            washType: 'Wash Type 1',
            processTypes: ['Process 1', 'Process 2']
          }
        ]
      }

      expect(() => generateGatepass(gatepassData)).not.toThrow()
    })

    it('should handle multiple records', () => {
      const gatepassData: GatepassData = {
        orderId: 'ORD001',
        customerName: 'Test Customer',
        orderDate: '2024-01-01',
        totalQuantity: 150,
        createdDate: '2024-01-01T10:00:00Z',
        records: [
          {
            itemName: 'Test Item 1',
            quantity: 50,
            washType: 'Wash Type 1',
            processTypes: ['Process 1']
          },
          {
            itemName: 'Test Item 2',
            quantity: 100,
            washType: 'Wash Type 2',
            processTypes: ['Process 2', 'Process 3']
          }
        ]
      }

      expect(() => generateGatepass(gatepassData)).not.toThrow()
    })
  })

  describe('generateBagLabel', () => {
    it('should generate bag label with valid data', () => {
      const bagData: BagLabelData = {
        orderId: 'ORD001',
        customerName: 'Test Customer',
        bagNumber: 1,
        totalBags: 5
      }

      expect(() => generateBagLabel(bagData)).not.toThrow()
    })

    it('should handle different bag numbers', () => {
      const bagData: BagLabelData = {
        orderId: 'ORD001',
        customerName: 'Test Customer',
        bagNumber: 3,
        totalBags: 10
      }

      expect(() => generateBagLabel(bagData)).not.toThrow()
    })
  })
})
