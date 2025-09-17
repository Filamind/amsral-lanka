import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Divider,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Close as CloseIcon,
  Print as PrintIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { orderService } from '../../services/orderService';
import { BillingService } from '../../services/billingService';
import PrimaryButton from '../common/PrimaryButton';
import { generateInvoice } from '../../utils/invoiceUtils';
import toast from 'react-hot-toast';

interface InvoiceRecord {
  id: number;
  orderId: number;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  washType: string;
  processTypes: string[];
}

interface InvoiceData {
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

interface InvoiceOrder {
  id: number;
  referenceNo: string;
  customerName: string;
  date: string;
  quantity: number;
  status: string;
}

interface InvoiceCreationModalProps {
  open: boolean;
  onClose: () => void;
  selectedOrderIds: number[];
  orders: InvoiceOrder[];
  onInvoiceCreated: () => void;
}

const InvoiceCreationModal: React.FC<InvoiceCreationModalProps> = ({
  open,
  onClose,
  selectedOrderIds,
  orders,
  onInvoiceCreated,
}) => {
  const [loading, setLoading] = useState(false);
  const [orderDetails, setOrderDetails] = useState<any[]>([]);
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [unitPrices, setUnitPrices] = useState<{ [key: string]: number }>({});
  const [paymentTerms, setPaymentTerms] = useState(30); // 30 days default

  // Fetch detailed order information
  useEffect(() => {
    if (open && selectedOrderIds.length > 0) {
      fetchOrderDetails();
    }
  }, [open, selectedOrderIds]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const orderPromises = selectedOrderIds.map(orderId =>
        orderService.getOrderSummary(orderId)
      );

      const responses = await Promise.all(orderPromises);
      const validOrders = responses
        .filter(response => response.success)
        .map(response => response.data);

      setOrderDetails(validOrders);

      // Initialize unit prices
      const initialPrices: { [key: string]: number } = {};
      validOrders.forEach(order => {
        order.records.forEach((record: any) => {
          const key = `${order.id}-${record.id}`;
          initialPrices[key] = 0; // Default to 0, user must enter
        });
      });
      setUnitPrices(initialPrices);

      // Create initial invoice data
      if (validOrders.length > 0) {
        const firstOrder = validOrders[0];
        const invoiceData: InvoiceData = {
          invoiceNumber: `INV-${Date.now()}`,
          customerName: firstOrder.customerName,
          customerAddress: '', // Will be fetched from customer data
          customerPhone: '', // Will be fetched from customer data
          invoiceDate: new Date().toISOString().split('T')[0],
          dueDate: new Date(Date.now() + paymentTerms * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          orders: validOrders.map(order => ({
            id: order.id,
            referenceNo: order.referenceNo,
            orderDate: order.orderDate,
            records: order.records.map((record: any) => ({
              id: record.id,
              orderId: order.id,
              itemName: record.itemName,
              quantity: record.quantity,
              unitPrice: 0,
              totalPrice: 0,
              washType: record.washType,
              processTypes: record.processTypes,
            })),
          })),
          subtotal: 0,
          taxRate: 0,
          taxAmount: 0,
          total: 0,
        };
        setInvoiceData(invoiceData);
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      toast.error('Error fetching order details');
    } finally {
      setLoading(false);
    }
  };

  // Update unit price
  const handleUnitPriceChange = (orderId: number, recordId: number, price: number) => {
    const key = `${orderId}-${recordId}`;
    setUnitPrices(prev => ({
      ...prev,
      [key]: price,
    }));

    // Update invoice data
    if (invoiceData) {
      const updatedInvoiceData = { ...invoiceData };
      updatedInvoiceData.orders.forEach(order => {
        if (order.id === orderId) {
          order.records.forEach(record => {
            if (record.id === recordId) {
              record.unitPrice = price;
              record.totalPrice = record.quantity * price;
            }
          });
        }
      });

      // Recalculate totals
      const subtotal = updatedInvoiceData.orders.reduce((sum, order) =>
        sum + order.records.reduce((orderSum, record) => orderSum + record.totalPrice, 0), 0
      );
      const taxAmount = 0;
      const total = subtotal;

      updatedInvoiceData.subtotal = subtotal;
      updatedInvoiceData.taxAmount = taxAmount;
      updatedInvoiceData.total = total;

      setInvoiceData(updatedInvoiceData);
    }
  };

  // Create invoice
  const handleCreateInvoice = async () => {
    if (!invoiceData) return;

    // Validate unit prices
    const hasZeroPrices = invoiceData.orders.some(order =>
      order.records.some(record => record.unitPrice <= 0)
    );

    if (hasZeroPrices) {
      toast.error('Please enter unit prices for all items');
      return;
    }

    try {
      setLoading(true);

      // First, save the pricing data
      const pricingData = {
        orderPricing: invoiceData.orders.map(order => ({
          orderId: order.id,
          totalPrice: order.records.reduce((sum, record) => sum + record.totalPrice, 0),
          records: order.records.map(record => ({
            recordId: record.id,
            unitPrice: record.unitPrice,
            totalPrice: record.totalPrice,
          })),
        })),
      };

      await BillingService.saveOrderPricing(pricingData);

      // Then create invoice via API
      const response = await BillingService.createInvoice({
        invoiceNumber: invoiceData.invoiceNumber,
        customerName: invoiceData.customerName,
        orderIds: selectedOrderIds,
        records: invoiceData.orders.flatMap(order =>
          order.records.map(record => ({
            orderId: order.id,
            recordId: record.id,
            unitPrice: record.unitPrice,
            totalPrice: record.totalPrice,
          }))
        ),
        orderTotals: invoiceData.orders.map(order => ({
          orderId: order.id,
          totalPrice: order.records.reduce((sum, record) => sum + record.totalPrice, 0),
        })),
        taxRate: 0,
        paymentTerms: paymentTerms,
      });

      if (response.success) {
        toast.success('Invoice created successfully');

        // Download the invoice PDF
        try {
          const pdfBlob = await BillingService.generateInvoicePDF(response.data.id);
          const url = window.URL.createObjectURL(pdfBlob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `invoice-${invoiceData.invoiceNumber}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        } catch (error) {
          console.error('Error downloading invoice:', error);
          toast.error('Invoice created but failed to download PDF');
        }

        onInvoiceCreated();
      } else {
        toast.error(response.message || 'Failed to create invoice');
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast.error('Error creating invoice');
    } finally {
      setLoading(false);
    }
  };

  // Print invoice
  const handlePrintInvoice = () => {
    if (!invoiceData) return;
    generateInvoice(invoiceData);
  };

  const handleClose = () => {
    setOrderDetails([]);
    setInvoiceData(null);
    setUnitPrices({});
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { minHeight: '80vh' }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Create Invoice
        <IconButton onClick={handleClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box>
            {/* Invoice Header */}
            {invoiceData && (
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Box>
                    <Typography variant="h6">Invoice #{invoiceData.invoiceNumber}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Date: {invoiceData.invoiceDate ? new Date(invoiceData.invoiceDate).toLocaleDateString() : 'N/A'}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="h6">{invoiceData.customerName}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Due: {invoiceData.dueDate ? new Date(invoiceData.dueDate).toLocaleDateString() : 'N/A'}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <TextField
                    label="Payment Terms (days)"
                    type="number"
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(parseInt(e.target.value))}
                    size="small"
                    sx={{ width: 150 }}
                  />
                </Box>
              </Box>
            )}

            {/* Orders and Records */}
            {orderDetails.map((order, orderIndex) => (
              <Box key={order.id} sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Order #{order.referenceNo} - {order.orderDate ? new Date(order.orderDate).toLocaleDateString() : 'N/A'}
                </Typography>

                <TableContainer component={Paper} sx={{ mb: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Item</TableCell>
                        <TableCell>Wash Type</TableCell>
                        <TableCell>Process Types</TableCell>
                        <TableCell align="right">Quantity</TableCell>
                        <TableCell align="right">Unit Price</TableCell>
                        <TableCell align="right">Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {order.records.map((record: any) => {
                        const key = `${order.id}-${record.id}`;
                        const unitPrice = unitPrices[key] || 0;
                        const total = record.quantity * unitPrice;

                        return (
                          <TableRow key={record.id}>
                            <TableCell>{record.itemName}</TableCell>
                            <TableCell>{record.washType}</TableCell>
                            <TableCell>{record.processTypes.join(', ')}</TableCell>
                            <TableCell align="right">{record.quantity}</TableCell>
                            <TableCell align="right">
                              <TextField
                                type="number"
                                value={unitPrice}
                                onChange={(e) => handleUnitPriceChange(order.id, record.id, parseFloat(e.target.value) || 0)}
                                size="small"
                                sx={{ width: 100 }}
                                inputProps={{ min: 0, step: 0.01 }}
                              />
                            </TableCell>
                            <TableCell align="right">
                              ${total.toFixed(2)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            ))}

            {/* Invoice Summary */}
            {invoiceData && (
              <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>Subtotal:</Typography>
                  <Typography>${invoiceData.subtotal.toFixed(2)}</Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="h6">Total:</Typography>
                  <Typography variant="h6">${invoiceData.total.toFixed(2)}</Typography>
                </Box>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="outlined"
          startIcon={<PrintIcon />}
          onClick={handlePrintInvoice}
          disabled={loading || !invoiceData}
        >
          Print Preview
        </Button>
        <PrimaryButton
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleCreateInvoice}
          loading={loading}
          disabled={!invoiceData || invoiceData.total === 0}
        >
          Create Invoice
        </PrimaryButton>
      </DialogActions>
    </Dialog>
  );
};

export default InvoiceCreationModal;
