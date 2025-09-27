import React, { useState, useEffect, useCallback } from 'react';
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
  CircularProgress,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import {
  Close as CloseIcon,
  Print as PrintIcon,
} from '@mui/icons-material';
import { orderService } from '../../services/orderService';
import { BillingService } from '../../services/billingService';
import PrimaryButton from '../common/PrimaryButton';
import { generateAmsralInvoice } from '../../utils/invoiceUtils';
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
  styleNo?: string; // Optional style number
}

interface InvoiceData {
  invoiceNumber: string;
  customerName: string;
  customerAddress: string;
  customerPhone: string;
  invoiceDate: string;
  dueDate: string;
  poNumber?: string; // Purchase Order Number
  includeStyleNo: boolean; // Whether to include Style No column
  customerBalance?: number; // Customer balance amount
  orders: {
    id: number;
    referenceNo: string;
    orderDate: string;
    gpNumber?: string; // Gate Pass Number
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
  customerId: number; // Customer ID for invoice number generation
  date: string;
  orderDate: string;
  quantity: number;
  status: string;
  gpNo?: string; // Gate Pass Number from backend
  balance?: number; // Customer balance amount
  records: InvoiceRecord[];
}

interface InvoiceCreationModalProps {
  open: boolean;
  onClose: () => void;
  selectedOrderIds: number[];
  onInvoiceCreated: () => void;
}

const InvoiceCreationModal: React.FC<InvoiceCreationModalProps> = ({
  open,
  onClose,
  selectedOrderIds,
  onInvoiceCreated,
}) => {
  const [loading, setLoading] = useState(false);
  const [orderDetails, setOrderDetails] = useState<InvoiceOrder[]>([]);
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [unitPrices, setUnitPrices] = useState<{ [key: string]: number }>({});
  const [includeStyleNo, setIncludeStyleNo] = useState(false);
  const [styleNumbers, setStyleNumbers] = useState<{ [key: string]: string }>({});
  const [poNumber, setPoNumber] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');

  const fetchOrderDetails = useCallback(async () => {
    try {
      setLoading(true);
      const orderPromises = selectedOrderIds.map(orderId =>
        orderService.getOrderSummary(orderId)
      );

      const responses = await Promise.all(orderPromises);
      const validOrders = responses
        .filter(response => response.success)
        .map(response => response.data);

      setOrderDetails(validOrders as unknown as InvoiceOrder[]);

      // Initialize unit prices
      const initialPrices: { [key: string]: number } = {};
      validOrders.forEach(order => {
        order.records.forEach((record: unknown) => {
          const recordData = record as { id: number };
          const key = `${order.id}-${recordData.id}`;
          initialPrices[key] = 0; // Default to 0, user must enter
        });
      });
      setUnitPrices(initialPrices);

      // Create initial invoice data
      if (validOrders.length > 0) {
        const firstOrder = validOrders[0];

        // Check if all orders have the same customer
        const uniqueCustomers = new Set(validOrders.map(order => order.customerId || order.customerName));
        if (uniqueCustomers.size > 1) {
          toast.error('Cannot create invoice for multiple customers. Please select orders from the same customer.');
          setLoading(false);
          return;
        }

        // Check if customerId is available
        if (!firstOrder.customerId) {
          console.warn('Customer ID not available in order summary. Using fallback invoice number.');
          // Continue with fallback invoice number instead of stopping
        }

        // Fetch invoice number for the customer
        let nextInvoiceNo = `INV-${Date.now()}`; // Fallback
        if (firstOrder.customerId) {
          try {
            const invoicePreview = await orderService.getInvoicePreview(firstOrder.customerId);
            if (invoicePreview.success) {
              nextInvoiceNo = invoicePreview.data.nextInvoiceNo;
              setInvoiceNumber(nextInvoiceNo);
            }
          } catch (error) {
            console.warn('Failed to fetch invoice number, using fallback:', error);
          }
        }

        const invoiceData: InvoiceData = {
          invoiceNumber: nextInvoiceNo,
          customerName: firstOrder.customerName,
          customerAddress: '', // Will be fetched from customer data
          customerPhone: '', // Will be fetched from customer data
          invoiceDate: new Date().toISOString().split('T')[0],
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days default
          poNumber: poNumber,
          includeStyleNo: includeStyleNo,
          customerBalance: firstOrder.balance, // Include customer balance
          orders: validOrders.map(order => ({
            id: order.id,
            referenceNo: order.referenceNo,
            orderDate: order.orderDate,
            gpNumber: (order as { gpNo?: string }).gpNo || '', // Use gpNo from fetched data
            records: order.records.map((record: unknown) => {
              const recordData = record as { id: number; itemName: string; quantity: number; washType: string; processTypes: string[] };
              return {
                id: recordData.id,
                orderId: order.id,
                itemName: recordData.itemName,
                quantity: recordData.quantity,
                unitPrice: 0,
                totalPrice: 0,
                washType: recordData.washType,
                processTypes: recordData.processTypes,
                styleNo: '', // Will be filled if includeStyleNo is true
              };
            }),
          })),
          subtotal: 0,
          taxRate: 0,
          taxAmount: 0,
          total: firstOrder.balance || 0, // Include customer balance in initial total
        };
        setInvoiceData(invoiceData);
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      toast.error('Error fetching order details');
    } finally {
      setLoading(false);
    }
  }, [selectedOrderIds, poNumber, includeStyleNo]);

  // Fetch detailed order information
  useEffect(() => {
    if (open && selectedOrderIds.length > 0) {
      fetchOrderDetails();
    }
  }, [open, selectedOrderIds, fetchOrderDetails]);

  // Update invoice data when invoice number changes
  useEffect(() => {
    if (invoiceNumber) {
      setInvoiceData(prev => prev ? { ...prev, invoiceNumber } : null);
    }
  }, [invoiceNumber]);

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
      const customerBalance = orderDetails.length > 0 ? (orderDetails[0].balance || 0) : 0;
      const total = subtotal + customerBalance;

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
        paymentTerms: 30,
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

  // Print invoice preview (does NOT mark billing status as Invoiced)
  const handlePrintInvoice = () => {
    if (!invoiceData) return;

    // Update invoice data with current form values
    const updatedInvoiceData = {
      ...invoiceData,
      poNumber: poNumber,
      includeStyleNo: includeStyleNo,
      customerBalance: orderDetails.length > 0 ? orderDetails[0].balance : undefined, // Include current balance
      orders: invoiceData.orders.map(order => ({
        ...order,
        records: order.records.map(record => ({
          ...record,
          styleNo: includeStyleNo ? styleNumbers[`${order.id}-${record.id}`] || '' : undefined,
        })),
      })),
    };

    // Always use AMSRAL format - this is just a preview, no status update
    generateAmsralInvoice(updatedInvoiceData);
  };

  // Create and print invoice (marks billing status as Invoiced)
  const handleCreateAndPrintInvoice = async () => {
    if (!invoiceData) return;

    try {
      setLoading(true);

      // First create the invoice (this marks billing status as Invoiced)
      await handleCreateInvoice();

      // Then print it
      handlePrintInvoice();

      // Close modal after successful creation and printing
      handleClose();
    } catch (error) {
      console.error('Error creating and printing invoice:', error);
      toast.error('Failed to create and print invoice');
    } finally {
      setLoading(false);
    }
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
        sx: {
          minHeight: '80vh',
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        }
      }}
    >
      <DialogTitle sx={{
        bgcolor: 'primary.main',
        color: 'white',
        py: 2,
        px: 3,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Create Invoice
        </Typography>
        <IconButton
          onClick={handleClose}
          sx={{
            color: 'white',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ '& > *': { mb: 3 } }}>
            {/* Invoice Header */}
            {invoiceData && (
              <Box sx={{
                p: 3,
                bgcolor: 'grey.50',
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'grey.200'
              }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                      Invoice No : {invoiceData.invoiceNumber}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Date: {invoiceData.invoiceDate ? new Date(invoiceData.invoiceDate).toLocaleDateString() : 'N/A'}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {invoiceData.customerName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Due: {invoiceData.dueDate ? new Date(invoiceData.dueDate).toLocaleDateString() : 'N/A'}
                    </Typography>
                    {/* Display customer balance if available */}
                    {orderDetails.length > 0 && orderDetails[0].balance !== undefined && (
                      <Typography variant="body2" sx={{
                        color: orderDetails[0].balance > 0 ? '#f57c00' : 'text.secondary',
                        fontWeight: 500,
                        mt: 0.5
                      }}>
                        Customer Balance: ${orderDetails[0].balance || 0}
                      </Typography>
                    )}
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                  <TextField
                    label="P/O Number"
                    value={poNumber}
                    onChange={(e) => setPoNumber(e.target.value)}
                    size="small"
                    sx={{ width: 200 }}
                    variant="outlined"
                  />
                </Box>

                {/* Style Number Options */}
                <Box sx={{
                  p: 2,
                  border: '1px solid',
                  borderColor: 'grey.300',
                  borderRadius: 2,
                  bgcolor: 'white'
                }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={includeStyleNo}
                        onChange={(e) => setIncludeStyleNo(e.target.checked)}
                        color="primary"
                      />
                    }
                    label="Include Style Number (St No) in invoice"
                    sx={{ fontWeight: 500 }}
                  />
                  {includeStyleNo && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Style numbers will be added to each record in the invoice table
                    </Typography>
                  )}
                </Box>
              </Box>
            )}

            {/* Orders and Records */}
            {orderDetails.map((order) => (
              <Box key={order.id} sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Ref No :- {order.id} - ({order.orderDate ? new Date(order.orderDate).toLocaleDateString() : 'N/A'})
                </Typography>

                <TableContainer
                  component={Paper}
                  sx={{
                    mb: 2,
                    borderRadius: 2,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                >
                  <Table size="small">
                    <TableHead sx={{ bgcolor: 'primary.main' }}>
                      <TableRow>
                        <TableCell sx={{ color: 'white', fontWeight: 600 }}>Item</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 600 }}>Wash Type</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 600 }}>Process Types</TableCell>
                        <TableCell align="right" sx={{ color: 'white', fontWeight: 600 }}>Quantity</TableCell>
                        <TableCell align="right" sx={{ color: 'white', fontWeight: 600 }}>Unit Price (Rs)</TableCell>
                        <TableCell align="right" sx={{ color: 'white', fontWeight: 600 }}>Total (Rs)</TableCell>
                        {includeStyleNo && <TableCell sx={{ color: 'white', fontWeight: 600 }}>Style No</TableCell>}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {order.records.map((record: InvoiceRecord) => {
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
                              Rs. {total.toFixed(2)}
                            </TableCell>
                            {includeStyleNo && (
                              <TableCell>
                                <TextField
                                  value={styleNumbers[key] || ''}
                                  onChange={(e) => setStyleNumbers(prev => ({
                                    ...prev,
                                    [key]: e.target.value
                                  }))}
                                  size="small"
                                  sx={{ width: 120 }}
                                  placeholder="Style No"
                                />
                              </TableCell>
                            )}
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
              <Box sx={{
                mt: 3,
                p: 3,
                bgcolor: 'primary.50',
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'primary.200'
              }}>
                <Typography variant="h6" sx={{ mb: 2, color: 'primary.main', fontWeight: 600 }}>
                  Invoice Summary
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography sx={{ fontWeight: 500 }}>Subtotal:</Typography>
                  <Typography sx={{ fontWeight: 500 }}>Rs. {invoiceData.subtotal.toFixed(2)}</Typography>
                </Box>
                <Divider sx={{ my: 2 }} />
                {/* Customer Balance Addition */}
                {orderDetails.length > 0 && orderDetails[0].balance !== undefined && orderDetails[0].balance > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography sx={{ fontWeight: 500 }}>Customer Balance:</Typography>
                    <Typography sx={{ fontWeight: 500 }}>
                      Rs. {(orderDetails[0].balance || 0).toFixed(2)}
                    </Typography>
                  </Box>
                )}
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Total:
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Rs. {(invoiceData.subtotal + (orderDetails.length > 0 && orderDetails[0].balance ? orderDetails[0].balance : 0)).toFixed(2)}
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 2 }}>
        <Button
          onClick={handleClose}
          disabled={loading}
          variant="outlined"
          sx={{ minWidth: 100 }}
        >
          Cancel
        </Button>
        <Button
          variant="outlined"
          startIcon={<PrintIcon />}
          onClick={handlePrintInvoice}
          disabled={loading || !invoiceData}
          sx={{ minWidth: 140 }}
        >
          Print Preview
        </Button>
        <PrimaryButton
          startIcon={<PrintIcon />}
          onClick={handleCreateAndPrintInvoice}
          loading={loading}
          disabled={!invoiceData || invoiceData.total === 0}
        >
          Create & Print Invoice
        </PrimaryButton>
      </DialogActions>
    </Dialog>
  );
};

export default InvoiceCreationModal;
