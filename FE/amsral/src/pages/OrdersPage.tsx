import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, Box, Menu, MenuItem, IconButton } from '@mui/material';
import { MoreVert, Print, Inventory } from '@mui/icons-material';
import type { GridColDef, GridRowParams } from '@mui/x-data-grid';
import PrimaryButton from '../components/common/PrimaryButton';
import PrimaryTable from '../components/common/PrimaryTable';
import SimpleOrderForm from '../components/orders/SimpleOrderForm';
import ConfirmationDialog from '../components/common/ConfirmationDialog';
import colors from '../styles/colors';
import { orderService, type CreateOrderRequest, type ErrorResponse } from '../services/orderService';
import CustomerService from '../services/customerService';
import { generateOrderReceipt, generateBagLabel, type OrderReceiptData, type BagLabelData } from '../utils/pdfUtils';
import { usePrinter } from '../context/PrinterContext';
import bagLabelPrinterService from '../services/bagLabelPrinterService';
import orderRecordPrinterService from '../services/orderRecordPrinterService';
import orderRecordsService, { type OrderRecordsDetails, type OrderRecord } from '../services/orderRecordsService';
import type { OrderRecordReceiptData } from '../services/printerService';
import { useAuth } from '../hooks/useAuth';
import { hasPermission } from '../utils/roleUtils';
import toast from 'react-hot-toast';

// We'll define columns inside the component to access the handler functions

type ProcessRecord = {
  id: string;
  itemId: string;
  quantity: number;
  washType: string;
  processTypes: string[];
};

type OrderRecordReceiptData = {
  orderId: number;
  customerName: string;
  itemName: string;
  quantity: number;
  washType: string;
  processTypes: string[];
  trackingNumber?: string;
  isRemaining?: boolean;
};

type OrderRow = {
  id: number;
  date: string;
  customerId: string;
  customerName: string;
  quantity: number;
  notes: string;
  records: ProcessRecord[];
  recordsCount: number;
  deliveryDate: string;
  status: string;
  complete: boolean;
  createdAt: string;
  updatedAt: string;
  actions: number;
  [key: string]: string | number | boolean | ProcessRecord[];
};


export default function OrdersPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isConnected, isConnecting, printStatus, connect } = usePrinter();
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingOrder, setEditingOrder] = useState<OrderRow | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedOrder, setSelectedOrder] = useState<OrderRow | null>(null);
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    message: '',
    onConfirm: () => { },
  });

  // Permission checks
  const canEdit = hasPermission(user, 'canEdit');
  const canDelete = hasPermission(user, 'canDelete');

  // Bag printing modal state
  const [bagModal, setBagModal] = useState({
    open: false,
    order: null as OrderRow | null,
    numberOfBags: '',
  });

  // Bag printing progress state
  const [bagPrintingProgress, setBagPrintingProgress] = useState({
    isPrinting: false,
    current: 0,
    total: 0,
  });

  // Order record printing progress state
  const [orderRecordPrintingProgress, setOrderRecordPrintingProgress] = useState({
    isPrinting: false,
    current: 0,
    total: 0,
  });

  // State for dropdown options
  const [customerOptions, setCustomerOptions] = useState<{ value: string; label: string }[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(true);

  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0], // Today's date as default
    customerId: '',
    quantity: 1,
    notes: '',
    deliveryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 weeks from now
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showAdditional, setShowAdditional] = useState(false);

  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch orders from API
  const fetchOrders = useCallback(async () => {
    try {
      const response = await orderService.getOrders({
        page: currentPage,
        limit: pageSize,
        search: search || undefined
      });

      if (response.success) {
        const orderRows: OrderRow[] = response.data.orders.map(order => ({
          id: order.id,
          date: order.date,
          customerId: order.customerId,
          customerName: order.customerName,
          quantity: order.quantity,
          notes: order.notes,
          records: order.records.map(record => ({
            id: record.id.toString(),
            itemId: record.itemId,
            quantity: record.quantity,
            washType: record.washType,
            processTypes: record.processTypes
          })),
          recordsCount: order.recordsCount,
          deliveryDate: order.deliveryDate,
          status: order.status,
          complete: order.complete,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          actions: order.id,
        }));
        setRows(orderRows);

        // Update pagination info
        setPagination({
          currentPage: response.data.pagination?.currentPage || 1,
          totalPages: response.data.pagination?.totalPages || 1,
          totalItems: response.data.pagination?.totalRecords || orderRows.length,
          itemsPerPage: response.data.pagination?.limit || pageSize,
          hasNextPage: (response.data.pagination?.currentPage || 1) < (response.data.pagination?.totalPages || 1),
          hasPrevPage: (response.data.pagination?.currentPage || 1) > 1
        });
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to fetch orders. Please try again.');
    }
  }, [search, currentPage, pageSize]);

  // Fetch dropdown options and orders on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setOptionsLoading(true);

        // Fetch customers with full names
        const customersResponse = await CustomerService.getAllCustomers({
          limit: 100, // Get all customers for dropdown
          isActive: true
        });
        const customerOpts = customersResponse.customers.map(customer => ({
          value: customer.id!.toString(),
          label: `${customer.firstName} ${customer.lastName}`.trim()
        }));
        setCustomerOptions(customerOpts);

        // Fetch orders
        await fetchOrders();

      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load data. Please refresh the page.');
      } finally {
        setOptionsLoading(false);
      }
    };

    fetchData();
  }, [fetchOrders]);

  // Fetch orders when search changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (search !== undefined) {
        setCurrentPage(1); // Reset to first page when search changes
        fetchOrders();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [search, fetchOrders]);

  // Pagination handlers
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when page size changes
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!form.date) newErrors.date = 'Date is required';
    if (!form.customerId) newErrors.customerId = 'Customer is required';
    if (!form.quantity || form.quantity <= 0) newErrors.quantity = 'Quantity must be greater than 0';
    if (!form.deliveryDate) newErrors.deliveryDate = 'Delivery date is required';

    return newErrors;
  };

  const handleOpen = (order?: OrderRow) => {
    if (order) {
      // Edit mode
      setEditingOrder(order);
      setForm({
        date: order.date,
        customerId: order.customerId,
        quantity: order.quantity,
        notes: order.notes,
        deliveryDate: order.deliveryDate,
      });
    } else {
      // Create mode
      setEditingOrder(null);
      setForm({
        date: new Date().toISOString().split('T')[0],
        customerId: '',
        quantity: 1,
        notes: '',
        deliveryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 weeks from now
      });
    }
    setErrors({});
    setShowAdditional(false);
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }));

    // Clear related error when field changes
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleRowClick = (params: GridRowParams) => {
    // Navigate to order records page
    navigate(`/orders/${params.id}/records`);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, order: OrderRow) => {
    setMenuAnchor(event.currentTarget);
    setSelectedOrder(order);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedOrder(null);
  };

  const handleEditClick = () => {
    if (selectedOrder) {
      handleOpen(selectedOrder);
    }
    handleMenuClose();
  };

  const handleDeleteOrder = () => {
    if (!selectedOrder) return;

    setConfirmDialog({
      open: true,
      title: 'Delete Order',
      message: `Are you sure you want to delete order "${selectedOrder.id}"? This action cannot be undone and will also delete all associated records.`,
      onConfirm: async () => {
        try {
          setLoading(true);
          await orderService.deleteOrder(selectedOrder.id);
          setRows(prev => prev.filter(row => row.id !== selectedOrder.id));
          toast.success(`Order ${selectedOrder.id} deleted successfully`);
        } catch (error) {
          console.error('Error deleting order:', error);
          const apiError = error as ErrorResponse;
          toast.error(apiError.message || 'Failed to delete order. Please try again.');
        } finally {
          setLoading(false);
          setConfirmDialog(prev => ({ ...prev, open: false }));
          handleMenuClose();
        }
      },
    });
    handleMenuClose();
  };


  const handlePrintOrder = async (orderRow: OrderRow) => {
    // Check if printer is connected
    if (!isConnected) {
      toast.error('Printer not connected. Please connect your printer first.');
      return;
    }

    try {
      // Set printing state
      setOrderRecordPrintingProgress({
        isPrinting: true,
        current: 0,
        total: 0,
      });

      // Fetch order records details from API
      const response = await orderRecordsService.getOrderRecordsDetails(orderRow.id);

      if (!response.success) {
        throw new Error('Failed to fetch order records details');
      }

      const orderDetails: OrderRecordsDetails = response.data;

      // Prepare receipt data array
      const receiptDataArray: OrderRecordReceiptData[] = [];

      // Add receipts for each order record
      for (const record of orderDetails.orderRecords) {
        receiptDataArray.push({
          orderId: orderDetails.orderId,
          customerName: orderDetails.customerName,
          itemName: record.itemName,
          quantity: record.quantity,
          washType: record.washType,
          processTypes: record.processType.split(', '), // Convert comma-separated string to array
          trackingNumber: record.trackingId,
        });
      }

      // Add receipt for remaining quantity if any
      if (orderDetails.remainingQuantity > 0) {
        receiptDataArray.push({
          orderId: orderDetails.orderId,
          customerName: orderDetails.customerName,
          itemName: 'Remaining Items',
          quantity: orderDetails.remainingQuantity,
          washType: 'Unknown',
          processTypes: ['Unknown'],
          isRemaining: true,
        });
      }

      // Update total count
      setOrderRecordPrintingProgress(prev => ({
        ...prev,
        total: receiptDataArray.length,
      }));

      // Print all order record receipts using the separate service with progress callback
      await orderRecordPrinterService.printMultipleOrderRecords(
        receiptDataArray,
        (current, total) => {
          setOrderRecordPrintingProgress({
            isPrinting: true,
            current,
            total,
          });
        }
      );

      // Reset printing state
      setOrderRecordPrintingProgress({
        isPrinting: false,
        current: 0,
        total: 0,
      });

      toast.success(`${receiptDataArray.length} order record receipt(s) printed successfully!`);
    } catch (error) {
      console.error('Error printing order records:', error);
      toast.error('Failed to print order records. Please check printer connection.');

      // Reset printing state on error
      setOrderRecordPrintingProgress({
        isPrinting: false,
        current: 0,
        total: 0,
      });
    }
  };

  // Bag printing handlers
  const handleBagPrintClick = (orderRow: OrderRow) => {
    setBagModal({
      open: true,
      order: orderRow,
      numberOfBags: '',
    });
  };

  const handleBagModalClose = () => {
    setBagModal({
      open: false,
      order: null,
      numberOfBags: '',
    });
  };

  const handleNumberOfBagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numbers
    if (value === '' || /^\d+$/.test(value)) {
      setBagModal(prev => ({
        ...prev,
        numberOfBags: value,
      }));
    }
  };

  const handlePrintBags = async () => {
    if (!bagModal.order || !bagModal.numberOfBags) {
      toast.error('Please enter the number of bags');
      return;
    }

    const numberOfBags = parseInt(bagModal.numberOfBags);
    if (numberOfBags <= 0) {
      toast.error('Number of bags must be greater than 0');
      return;
    }

    // Check if printer is connected
    if (!isConnected) {
      toast.error('Printer not connected. Please connect your printer first.');
      return;
    }

    try {
      // Set printing state
      setBagPrintingProgress({
        isPrinting: true,
        current: 0,
        total: numberOfBags,
      });

      // Prepare bag data array
      const bagDataArray: BagLabelData[] = [];
      for (let i = 1; i <= numberOfBags; i++) {
        bagDataArray.push({
          orderId: bagModal.order.id,
          customerName: bagModal.order.customerName,
          bagNumber: i,
        });
      }

      // Print all bag labels using the separate service with progress callback
      await bagLabelPrinterService.printMultipleBagLabels(
        bagDataArray,
        (current, total) => {
          setBagPrintingProgress({
            isPrinting: true,
            current,
            total,
          });
        }
      );

      // Reset printing state
      setBagPrintingProgress({
        isPrinting: false,
        current: 0,
        total: 0,
      });

      toast.success(`${numberOfBags} bag label(s) printed successfully!`);
      handleBagModalClose();
    } catch (error) {
      console.error('Error printing bag labels:', error);
      toast.error('Failed to print bag labels. Please check printer connection.');

      // Reset printing state on error
      setBagPrintingProgress({
        isPrinting: false,
        current: 0,
        total: 0,
      });
    }
  };

  // Define columns inside component to access handler functions
  const columns: GridColDef[] = [
    { field: 'date', headerName: 'Date', flex: 0.8, minWidth: 110 },
    { field: 'id', headerName: 'Reference No', flex: 0.8, minWidth: 100, type: 'number' },
    { field: 'customerName', headerName: 'Customer', flex: 1.5, minWidth: 180 },
    {
      field: 'quantity',
      headerName: 'Total Qty',
      flex: 0.8,
      minWidth: 100,
      type: 'number',
      renderCell: (params) => {
        const isComplete = (params.row.status || '').toLowerCase() === 'complete';
        return (
          <span
            className={`px-3 py-1 rounded-xl text-sm font-semibold ${isComplete
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
              }`}
          >
            {params.value}
          </span>
        );
      }
    },
    { field: 'recordsCount', headerName: 'Records', flex: 0.6, minWidth: 80, type: 'number' },
    { field: 'deliveryDate', headerName: 'Delivery Date', flex: 1, minWidth: 120 },
    {
      field: 'status',
      headerName: 'Status',
      flex: 1,
      minWidth: 120,
      renderCell: (params) => {
        const status = params.row.status || 'Pending';
        const getStatusStyle = (status: string) => {
          switch (status.toLowerCase()) {
            case 'complete':
              return 'bg-green-100 text-green-800';
            case 'completed':
              return 'bg-green-100 text-green-800';
            case 'in progress':
              return 'bg-yellow-100 text-yellow-800';
            case 'pending':
              return 'bg-blue-100 text-blue-800';
            case 'confirmed':
              return 'bg-purple-100 text-purple-800';
            case 'processing':
              return 'bg-orange-100 text-orange-800';
            case 'delivered':
              return 'bg-gray-100 text-gray-800';
            default:
              return 'bg-gray-100 text-gray-800';
          }
        };

        return (
          <span
            className={`px-3 py-1 rounded-xl text-sm font-semibold ${getStatusStyle(status)}`}
          >
            {status}
          </span>
        );
      }
    },
    {
      field: 'print',
      headerName: 'Print',
      flex: 0.3,
      minWidth: 60,
      sortable: false,
      renderCell: (params) => {
        const canPrint = isConnected && !orderRecordPrintingProgress.isPrinting;
        return (
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              if (!isConnected) {
                toast.error('Printer not connected. Please connect your printer first.');
                return;
              }
              handlePrintOrder(params.row);
            }}
            size="small"
            sx={{
              color: canPrint ? colors.button.primary : colors.text.muted,
              opacity: canPrint ? 1 : 0.3
            }}
            title={
              !isConnected
                ? "Printer not connected"
                : orderRecordPrintingProgress.isPrinting
                  ? "Printing in progress..."
                  : "Print Order Records"
            }
            disabled={!canPrint}
          >
            <Print />
          </IconButton>
        );
      }
    },
    {
      field: 'bagPrint',
      headerName: 'Bag',
      flex: 0.3,
      minWidth: 60,
      sortable: false,
      renderCell: (params) => {
        const isComplete = (params.row.status || '').toLowerCase() === 'complete';
        const canPrint = isComplete && isConnected;
        return (
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              if (!isConnected) {
                toast.error('Printer not connected. Please connect your printer first.');
                return;
              }
              handleBagPrintClick(params.row);
            }}
            size="small"
            sx={{
              color: canPrint ? colors.button.primary : colors.text.muted,
              opacity: canPrint ? 1 : 0.3
            }}
            title={
              !isComplete
                ? "Order must be complete to print bags"
                : !isConnected
                  ? "Printer not connected"
                  : "Print Bag Labels"
            }
            disabled={!canPrint}
          >
            <Inventory />
          </IconButton>
        );
      }
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 0.5,
      minWidth: 80,
      sortable: false,
      renderCell: (params) => {
        // Only show actions menu if user has edit or delete permissions
        if (!canEdit && !canDelete) {
          return null;
        }

        return (
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              handleMenuOpen(e, params.row);
            }}
            size="small"
            sx={{ color: colors.text.secondary }}
          >
            <MoreVert />
          </IconButton>
        );
      }
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validate();
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      if (editingOrder) {
        // Edit existing order
        const updateData: Partial<CreateOrderRequest> = {
          date: form.date,
          customerId: form.customerId,
          quantity: form.quantity,
          notes: form.notes || undefined,
          deliveryDate: form.deliveryDate,
        };

        const response = await orderService.updateOrder(editingOrder.id, updateData);

        if (response.success) {
          const updatedOrderRow: OrderRow = {
            ...editingOrder,
            date: response.data.date,
            customerId: response.data.customerId,
            customerName: response.data.customerName,
            quantity: response.data.quantity,
            notes: response.data.notes,
            deliveryDate: response.data.deliveryDate,
            status: response.data.status,
            updatedAt: response.data.updatedAt,
          };

          setRows(prev => prev.map(row => row.id === editingOrder.id ? updatedOrderRow : row));
          setOpen(false);
          toast.success(`Order ${response.data.id} updated successfully!`);
        }
      } else {
        // Create new order
        const orderData: CreateOrderRequest = {
          date: form.date,
          customerId: form.customerId,
          quantity: form.quantity,
          notes: form.notes || undefined,
          deliveryDate: form.deliveryDate,
          records: [] // Start with empty records
        };

        const response = await orderService.createOrder(orderData);

        if (response.success) {
          const newOrderRow: OrderRow = {
            id: response.data.id,
            date: response.data.date,
            customerId: response.data.customerId,
            customerName: response.data.customerName,
            quantity: response.data.quantity,
            notes: response.data.notes,
            records: response.data.records.map(record => ({
              id: record.id.toString(),
              itemId: record.itemId,
              quantity: record.quantity,
              washType: record.washType,
              processTypes: record.processTypes
            })),
            recordsCount: response.data.recordsCount,
            deliveryDate: response.data.deliveryDate,
            status: response.data.status,
            complete: response.data.complete,
            createdAt: response.data.createdAt,
            updatedAt: response.data.updatedAt,
            actions: response.data.id,
          };

          setRows(prev => [newOrderRow, ...prev]);
          setOpen(false);
          toast.success(`Order ${response.data.id} created successfully! You can now add process records by clicking on the order.`);
        }
      }

      // Reset form
      setForm({
        date: new Date().toISOString().split('T')[0],
        customerId: '',
        quantity: 1,
        notes: '',
        deliveryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      });
      setEditingOrder(null);

    } catch (error) {
      console.error('Error saving order:', error);

      // Handle API validation errors
      const apiError = error as ErrorResponse;
      if (apiError.errors) {
        setErrors(apiError.errors);
      } else {
        setErrors({ general: apiError.message || 'Failed to save order. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="w-full mx-auto px-1 sm:px-3 md:px-4 py-3">
      <div className="flex flex-col gap-2 sm:gap-3 mb-4">
        <h2 className="text-xl md:text-2xl font-bold" style={{ color: colors.text.primary }}>Orders</h2>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 w-full">
          <div className="flex flex-1 items-center w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search by reference or customer..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-xl focus:outline-none text-sm sm:text-base"
              style={{ borderColor: colors.border.light, maxWidth: 300 }}
            />
          </div>
          <div className="flex items-center gap-4">
            {/* Printer Status */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm font-medium text-gray-700">
                  {isConnected ? 'Printer Connected' : 'Printer Disconnected'}
                </span>
              </div>
              {!isConnected && (
                <PrimaryButton
                  onClick={connect}
                  disabled={isConnecting}
                  style={{ minWidth: 120, fontSize: '12px', padding: '6px 12px' }}
                >
                  {isConnecting ? 'Connecting...' : 'Connect'}
                </PrimaryButton>
              )}
            </div>
            <div className="w-full sm:w-auto mt-1 sm:mt-0">
              <PrimaryButton style={{ minWidth: 140, width: '100%' }} onClick={() => handleOpen()}>
                + Add Order
              </PrimaryButton>
            </div>
          </div>
        </div>
      </div>

      {/* Order Record Printing Progress */}
      {orderRecordPrintingProgress.isPrinting && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-blue-700">
              Printing order record {orderRecordPrintingProgress.current} of {orderRecordPrintingProgress.total}...
            </span>
          </div>
          <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(orderRecordPrintingProgress.current / orderRecordPrintingProgress.total) * 100}%` }}
            ></div>
          </div>
          <p className="text-xs text-blue-600 mt-1">
            Each receipt prints with a 5-second delay for easy removal
          </p>
        </div>
      )}

      <div className="mt-1">
        <PrimaryTable
          columns={columns}
          rows={rows}
          pageSizeOptions={[5, 10, 20, 50]}
          pagination
          paginationMode="server"
          paginationModel={{
            page: pagination.currentPage - 1, // DataGrid uses 0-based indexing
            pageSize: pageSize
          }}
          rowCount={pagination.totalItems}
          onPaginationModelChange={(model) => {
            if (model.pageSize !== pageSize) {
              handlePageSizeChange(model.pageSize);
            }
            if (model.page !== pagination.currentPage - 1) {
              handlePageChange(model.page + 1); // Convert back to 1-based
            }
          }}
          onRowClick={handleRowClick}
          height="auto"
        />
      </div>

      {/* Actions Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        {canEdit && (
          <MenuItem onClick={handleEditClick}>
            Edit Order
          </MenuItem>
        )}
        {canDelete && (
          <MenuItem onClick={handleDeleteOrder} sx={{ color: 'error.main' }}>
            Delete Order
          </MenuItem>
        )}
      </Menu>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
        loading={loading}
      />

      {/* Modal for Add Order */}
      <Modal open={open} onClose={handleClose}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            bgcolor: 'background.paper',
            boxShadow: 24,
            borderRadius: 2,
            p: { xs: 3, sm: 4, md: 5 },
            width: { xs: '95vw', sm: '90vw', md: '85vw', lg: '900px', xl: '1000px' },
            maxWidth: '95vw',
            maxHeight: '95vh',
            overflowY: 'auto',
          }}
        >
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {/* General error message */}
            {errors.general && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="text-sm text-red-800">
                  <strong>Error:</strong> {errors.general}
                </div>
              </div>
            )}

            {/* Simple Order Form Component */}
            <SimpleOrderForm
              form={form}
              errors={errors}
              customerOptions={customerOptions}
              optionsLoading={optionsLoading}
              onChange={handleChange}
              showAdditional={showAdditional}
              onToggleAdditional={() => setShowAdditional(!showAdditional)}
              isEditing={!!editingOrder}
            />

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <PrimaryButton
                type="button"
                onClick={handleClose}
                className="px-6 py-2"
                style={{
                  backgroundColor: colors.secondary[500],
                  color: colors.text.white,
                  border: 'none',
                  borderRadius: '8px',
                }}
                disabled={loading}
              >
                Cancel
              </PrimaryButton>
              <PrimaryButton
                type="submit"
                className="px-6 py-2"
                style={{
                  backgroundColor: colors.primary[500],
                  color: colors.text.white,
                  border: 'none',
                  borderRadius: '8px',
                }}
                disabled={loading}
              >
                {loading ? (editingOrder ? 'Updating...' : 'Creating...') : (editingOrder ? 'Update Order' : 'Create Order')}
              </PrimaryButton>
            </div>
          </form>
        </Box>
      </Modal>

      {/* Bag Printing Modal */}
      <Modal open={bagModal.open} onClose={handleBagModalClose}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            bgcolor: 'background.paper',
            boxShadow: 24,
            borderRadius: 2,
            p: 4,
            width: { xs: '90vw', sm: '400px' },
            maxWidth: '95vw',
          }}
        >
          <div className="flex flex-col gap-4">
            <h3 className="text-xl font-bold text-center" style={{ color: colors.text.primary }}>
              Print Bag Labels
            </h3>

            {bagModal.order && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Order:</strong> {bagModal.order.id}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Customer:</strong> {bagModal.order.customerName}
                </p>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium" style={{ color: colors.text.primary }}>
                Number of Bags:
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={bagModal.numberOfBags}
                onChange={handleNumberOfBagsChange}
                placeholder="Enter number of bags"
                className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ borderColor: colors.border.light }}
                autoFocus
              />
            </div>

            {/* Printer Status in Modal */}
            {!isConnected && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-sm text-red-700">
                    Printer not connected. Please connect your printer first.
                  </span>
                </div>
              </div>
            )}

            {/* Printing Progress */}
            {bagPrintingProgress.isPrinting && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-blue-700">
                    Printing bag {bagPrintingProgress.current} of {bagPrintingProgress.total}...
                  </span>
                </div>
                <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(bagPrintingProgress.current / bagPrintingProgress.total) * 100}%` }}
                  ></div>
                </div>
                <p className="text-xs text-blue-600 mt-1">
                  Each bag prints with a 2-second delay for easy removal
                </p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <PrimaryButton
                onClick={handleBagModalClose}
                style={{
                  backgroundColor: colors.secondary[500],
                  color: colors.text.white,
                  border: 'none',
                  borderRadius: '8px',
                }}
              >
                Cancel
              </PrimaryButton>
              <PrimaryButton
                onClick={handlePrintBags}
                disabled={!bagModal.numberOfBags || parseInt(bagModal.numberOfBags) <= 0 || !isConnected || bagPrintingProgress.isPrinting}
                style={{
                  backgroundColor: bagPrintingProgress.isPrinting ? colors.secondary[500] : colors.primary[500],
                  color: colors.text.white,
                  border: 'none',
                  borderRadius: '8px',
                }}
              >
                {bagPrintingProgress.isPrinting
                  ? `Printing... (${bagPrintingProgress.current}/${bagPrintingProgress.total})`
                  : !isConnected
                    ? 'Connect Printer First'
                    : 'Print Bags'
                }
              </PrimaryButton>
            </div>
          </div>
        </Box>
      </Modal>
    </div>
  );
}
