import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, Box, Menu, MenuItem, IconButton, Fab, Tooltip } from '@mui/material';
import { MoreVert, Print, /* Inventory, */ PrintOutlined, PrintDisabled } from '@mui/icons-material'; // Inventory commented - used for bag printing
import type { GridColDef, GridRowParams } from '@mui/x-data-grid';
import PrimaryButton from '../components/common/PrimaryButton';
import PrimaryTable from '../components/common/PrimaryTable';
import SimpleOrderForm from '../components/orders/SimpleOrderForm';
import ConfirmationDialog from '../components/common/ConfirmationDialog';
import colors from '../styles/colors';
import { type CreateOrderRequest, type ErrorResponse } from '../services/orderService';
// import { type BagLabelData } from '../utils/pdfUtils'; // Commented - used for bag printing
import { usePrinter } from '../context/PrinterContext';
// import bagLabelPrinterService from '../services/bagLabelPrinterService'; // Commented - used for bag printing
import orderRecordPrinterService from '../services/orderRecordPrinterService';
import orderRecordsService, { type OrderRecordsDetails } from '../services/orderRecordsService';
import type { OrderRecordReceiptData } from '../services/printerService';
import { useAuth } from '../hooks/useAuth';
import { hasPermission } from '../utils/roleUtils';
import { getStatusColor, getStatusLabel, normalizeStatus } from '../utils/statusUtils';
import {
  useOrders,
  useCustomers,
  useItems,
  useCreateOrder,
  useUpdateOrder,
  useDeleteOrder,
  type OrderRow
} from '../hooks/useOrders';
import toast from 'react-hot-toast';

// We'll define columns inside the component to access the handler functions


export default function OrdersPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isConnected, isConnecting, connect } = usePrinter();

  // Local state for UI
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
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

  // Bag printing modal state - Commented out as per client request (may be used in future)
  // const [bagModal, setBagModal] = useState({
  //   open: false,
  //   order: null as OrderRow | null,
  //   numberOfBags: '',
  //   quantity: '',
  // });

  // Bag printing progress state - Commented out as per client request (may be used in future)
  // const [bagPrintingProgress, setBagPrintingProgress] = useState({
  //   isPrinting: false,
  //   current: 0,
  //   total: 0,
  // });

  // Order record printing progress state
  const [orderRecordPrintingProgress, setOrderRecordPrintingProgress] = useState({
    isPrinting: false,
    current: 0,
    total: 0,
  });

  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0], // Today's date as default
    customerId: '',
    itemId: '',
    quantity: '',
    gpNo: '',
    notes: '',
    deliveryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 weeks from now
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showAdditional, setShowAdditional] = useState(false);

  // Pagination state
  const [pageSize, setPageSize] = useState(20); // Default to 20 rows per page
  const [currentPage, setCurrentPage] = useState(1);

  // TanStack Query hooks
  const {
    data: ordersData
  } = useOrders({
    page: currentPage,
    limit: pageSize,
    search: search || undefined,
    excludeDelivered: true
  });

  const {
    data: customerOptions = [],
    isLoading: customersLoading
  } = useCustomers();

  const {
    data: itemOptions = [],
    isLoading: itemsLoading
  } = useItems();

  // Mutation hooks
  const createOrderMutation = useCreateOrder();
  const updateOrderMutation = useUpdateOrder();
  const deleteOrderMutation = useDeleteOrder();

  // Derived state
  const rows = ordersData?.orders || [];
  const pagination = ordersData?.pagination || {
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0,
    limit: pageSize,
  };

  const optionsLoading = customersLoading || itemsLoading;
  const loading = createOrderMutation.isPending || updateOrderMutation.isPending || deleteOrderMutation.isPending;

  // Pagination handlers
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when page size changes
  };

  // Search handler with debouncing
  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCurrentPage(1); // Reset to first page when search changes
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!form.date) newErrors.date = 'Date is required';
    if (!form.customerId) newErrors.customerId = 'Customer is required';
    if (!form.itemId) newErrors.itemId = 'Item is required';
    // Quantity is now optional - only validate if provided
    if (form.quantity && Number(form.quantity) <= 0) newErrors.quantity = 'Quantity must be greater than 0';
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
        itemId: order.itemId || '',
        quantity: order.quantity ? order.quantity.toString() : '',
        gpNo: order.gpNo || '',
        notes: order.notes,
        deliveryDate: order.deliveryDate,
      });
    } else {
      // Create mode
      setEditingOrder(null);
      setForm({
        date: new Date().toISOString().split('T')[0],
        customerId: '',
        itemId: '',
        quantity: '',
        gpNo: '',
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
    const order = params.row;

    // Only allow navigation to records if quantity is greater than 0
    if (!order.quantity || order.quantity <= 0) {
      toast.error('Cannot navigate to records: Order quantity must be greater than 0. Use the actions menu (⋮) to edit the order and add quantity.');
      return;
    }

    // Calculate remaining quantity for this order
    const totalRecordsQuantity = order.records?.reduce((total: number, record: { quantity: number }) => total + Number(record.quantity), 0) || 0;
    const remainingQuantity = order.quantity - totalRecordsQuantity;

    // Navigate to order records page with remaining quantity as URL parameter
    navigate(`/orders/${params.id}/records?remainingQuantity=${remainingQuantity}`);
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
      onConfirm: () => {
        deleteOrderMutation.mutate(selectedOrder.id, {
          onSuccess: () => {
            setConfirmDialog(prev => ({ ...prev, open: false }));
            handleMenuClose();
          },
          onError: () => {
            setConfirmDialog(prev => ({ ...prev, open: false }));
            handleMenuClose();
          }
        });
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
          quantity: record.quantity ?? 0, // Use 0 if quantity is null or undefined
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

  // Bag printing handlers - Commented out as per client request (may be used in future)
  // const handleBagPrintClick = (orderRow: OrderRow) => {
  //   setBagModal({
  //     open: true,
  //     order: orderRow,
  //     numberOfBags: '',
  //     quantity: '',
  //   });
  // };

  // const handleBagModalClose = () => {
  //   setBagModal({
  //     open: false,
  //     order: null,
  //     numberOfBags: '',
  //     quantity: '',
  //   });
  // };

  // const handleNumberOfBagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const value = e.target.value;
  //   // Only allow numbers
  //   if (value === '' || /^\d+$/.test(value)) {
  //     setBagModal(prev => ({
  //       ...prev,
  //       numberOfBags: value,
  //     }));
  //   }
  // };

  // const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const value = e.target.value;
  //   // Only allow numbers
  //   if (value === '' || /^\d+$/.test(value)) {
  //     setBagModal(prev => ({
  //       ...prev,
  //       quantity: value,
  //     }));
  //   }
  // };

  // const handlePrintBags = async () => {
  //   // Check if printer is connected
  //   if (!isConnected) {
  //     toast.error('Printer not connected. Please connect your printer first.');
  //     return;
  //   }

  //   try {
  //     // Set printing state
  //     setBagPrintingProgress({
  //       isPrinting: true,
  //       current: 0,
  //       total: 1,
  //     });

  //     // Prepare single bag receipt data
  //     const bagData: BagLabelData = {
  //       orderId: bagModal.order!.id,
  //       customerName: bagModal.order!.customerName,
  //       bagNumber: 1, // Single receipt
  //       numberOfBags: bagModal.numberOfBags || '',
  //       quantity: bagModal.quantity || '',
  //     };

  //     // Print single bag receipt
  //     await bagLabelPrinterService.printSingleBagReceipt(bagData);

  //     // Reset printing state
  //     setBagPrintingProgress({
  //       isPrinting: false,
  //       current: 0,
  //       total: 0,
  //     });

  //     toast.success('Bag receipt printed successfully!');
  //     handleBagModalClose();
  //   } catch (error) {
  //     console.error('Error printing bag receipt:', error);
  //     toast.error('Failed to print bag receipt. Please check printer connection.');

  //     // Reset printing state on error
  //     setBagPrintingProgress({
  //       isPrinting: false,
  //       current: 0,
  //       total: 0,
  //     });
  //   }
  // };


  // Define columns inside component to access handler functions
  const columns: GridColDef[] = [
    {
      field: 'date',
      headerName: 'Date',
      flex: 0.6,
      minWidth: 90,
      renderCell: (params) => (
        <span className="text-sm lg:text-base" style={{ color: colors.text.secondary }}>
          {new Date(params.value).toLocaleDateString()}
        </span>
      )
    },
    {
      field: 'id',
      headerName: 'Ref No',
      flex: 0.5,
      minWidth: 80,
      type: 'number',
      renderCell: (params) => (
        <span className="font-semibold text-sm lg:text-base" style={{ color: colors.text.primary }}>
          {params.value}
        </span>
      )
    },
    {
      field: 'customerName',
      headerName: 'Customer',
      flex: 1.2,
      minWidth: 150,
      renderCell: (params) => (
        <span className="text-sm lg:text-base" style={{ color: colors.text.primary }}>
          {params.value}
        </span>
      )
    },
    {
      field: 'itemName',
      headerName: 'Item',
      flex: 1.2,
      minWidth: 150,
      renderCell: (params) => (
        <span className="text-sm lg:text-base" style={{ color: colors.text.primary }}>
          {params.value || 'N/A'}
        </span>
      )
    },
    {
      field: 'quantity',
      headerName: 'Total Qty',
      flex: 0.6,
      minWidth: 90,
      type: 'number',
      renderCell: (params) => {
        const quantity = params.value;
        const isComplete = params.row.complete;

        // Show different styling for orders with 0 or no quantity
        if (!quantity || quantity <= 0) {
          return (
            <span className="px-2 py-1 lg:px-3 lg:py-1 rounded-xl text-xs lg:text-sm font-semibold bg-gray-100 text-gray-600">
              {quantity || 'N/A'}
            </span>
          );
        }

        // Normal styling for orders with quantity > 0
        return (
          <span
            className={`px-2 py-1 lg:px-3 lg:py-1 rounded-xl text-xs lg:text-sm font-semibold ${isComplete
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
              }`}
          >
            {quantity}
          </span>
        );
      }
    },
    // {
    //   field: 'recordsCount',
    //   headerName: 'Records',
    //   flex: 0.4,
    //   minWidth: 70,
    //   type: 'number',
    //   renderCell: (params) => (
    //     <span
    //       className="px-2 py-1 rounded-lg text-xs lg:text-sm font-medium"
    //       style={{
    //         backgroundColor: params.value > 0 ? '#dcfce7' : colors.secondary[100],
    //         color: params.value > 0 ? '#166534' : colors.text.muted,
    //       }}
    //     >
    //       {params.value}
    //     </span>
    //   )
    // },
    {
      field: 'deliveryDate',
      headerName: 'Delivery',
      flex: 0.7,
      minWidth: 100,
      renderCell: (params) => (
        <span
          className="text-sm lg:text-base"
          style={{
            color: params.row.overdue ? '#ef4444' : colors.text.secondary,
            fontWeight: params.row.overdue ? 'bold' : 'normal'
          }}
        >
          {new Date(params.value).toLocaleDateString()}
        </span>
      )
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: 0.8,
      minWidth: 100,
      renderCell: (params) => {
        const status = params.row.status || 'Pending';
        const normalizedStatus = normalizeStatus(status, 'order');
        const statusColor = getStatusColor(normalizedStatus, 'order');
        const statusLabel = getStatusLabel(normalizedStatus, 'order');

        return (
          <span
            className={`px-2 py-1 lg:px-3 lg:py-1 rounded-xl text-xs lg:text-sm font-semibold ${statusColor}`}
          >
            {statusLabel}
          </span>
        );
      }
    },
    {
      field: 'print',
      headerName: 'Print',
      flex: 0.25,
      minWidth: 50,
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
              opacity: canPrint ? 1 : 0.3,
              padding: '4px'
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
            <Print fontSize="small" />
          </IconButton>
        );
      }
    },
    // Bag Print - Commented out as per client request (may be used in future)
    // {
    //   field: 'bagPrint',
    //   headerName: 'Bag',
    //   flex: 0.25,
    //   minWidth: 50,
    //   sortable: false,
    //   renderCell: (params) => {
    //     const isComplete = (params.row.status || '').toLowerCase() === 'complete' || (params.row.status || '').toLowerCase() === 'qc';
    //     const canPrint = isComplete && isConnected;
    //     return (
    //       <IconButton
    //         onClick={(e) => {
    //           e.stopPropagation();
    //           if (!isConnected) {
    //             toast.error('Printer not connected. Please connect your printer first.');
    //             return;
    //           }
    //           handleBagPrintClick(params.row);
    //         }}
    //         size="small"
    //         sx={{
    //           color: canPrint ? colors.button.primary : colors.text.muted,
    //           opacity: canPrint ? 1 : 0.3,
    //           padding: '4px'
    //         }}
    //         title={
    //           !isComplete
    //             ? "Order must be complete to print bags"
    //             : !isConnected
    //               ? "Printer not connected"
    //               : "Print Bag Labels"
    //         }
    //         disabled={!canPrint}
    //       >
    //         <Inventory fontSize="small" />
    //       </IconButton>
    //     );
    //   }
    // },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 0.3,
      minWidth: 60,
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
            sx={{
              color: colors.text.secondary,
              padding: '4px'
            }}
          >
            <MoreVert fontSize="small" />
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

    setErrors({});

    if (editingOrder) {
      // Edit existing order
      const updateData: Partial<CreateOrderRequest> = {
        date: form.date,
        customerId: form.customerId,
        itemId: form.itemId,
        quantity: form.quantity ? Number(form.quantity) : undefined, // Only include if provided
        notes: form.notes || undefined,
        deliveryDate: form.deliveryDate,
      };

      updateOrderMutation.mutate(
        { id: editingOrder.id, data: updateData },
        {
          onSuccess: () => {
            setOpen(false);
            setEditingOrder(null);
            // Reset form
            setForm({
              date: new Date().toISOString().split('T')[0],
              customerId: '',
              itemId: '',
              quantity: '',
              gpNo: '',
              notes: '',
              deliveryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            });
          },
          onError: (error: ErrorResponse) => {
            // Handle API validation errors
            if (error.errors) {
              setErrors(error.errors);
            } else {
              setErrors({ general: error.message || 'Failed to save order. Please try again.' });
            }
          }
        }
      );
    } else {
      // Create new order
      const orderData: CreateOrderRequest = {
        date: form.date,
        customerId: form.customerId,
        itemId: form.itemId,
        quantity: form.quantity ? Number(form.quantity) : undefined, // Only include if provided
        gpNo: form.gpNo || undefined,
        notes: form.notes || undefined,
        deliveryDate: form.deliveryDate,
        records: [] // Start with empty records
      };

      createOrderMutation.mutate(orderData, {
        onSuccess: () => {
          setOpen(false);
          setEditingOrder(null);
          // Reset form
          setForm({
            date: new Date().toISOString().split('T')[0],
            customerId: '',
            itemId: '',
            quantity: '',
            gpNo: '',
            notes: '',
            deliveryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          });
        },
        onError: (error: ErrorResponse) => {
          // Handle API validation errors
          if (error.errors) {
            setErrors(error.errors);
          } else {
            setErrors({ general: error.message || 'Failed to save order. Please try again.' });
          }
        }
      });
    }
  };


  return (
    <div className="w-full mx-auto px-1 sm:px-3 md:px-4 lg:px-6 py-3">
      <style>
        {`
          .disabled-row-click {
            opacity: 0.7 !important;
            cursor: not-allowed !important;
            background-color: #f9fafb !important;
          }
          .disabled-row-click:hover {
            background-color: #f3f4f6 !important;
          }
          /* Allow actions menu to work normally */
          .disabled-row-click .MuiIconButton-root {
            cursor: pointer !important;
            opacity: 1 !important;
            pointer-events: auto !important;
          }
          /* Ensure the actions cell is fully functional */
          .disabled-row-click [data-field="actions"] {
            opacity: 1 !important;
            pointer-events: auto !important;
          }
        `}
      </style>
      <div className="flex flex-col gap-2 sm:gap-3 lg:gap-4 mb-4">
        <h2 className="text-xl md:text-2xl lg:text-3xl font-bold" style={{ color: colors.text.primary }}>Orders</h2>
        <div className="flex flex-col sm:flex-row lg:flex-row items-center justify-between gap-2 lg:gap-4 w-full">
          <div className="flex flex-1 items-center w-full sm:w-auto lg:w-auto">
            <input
              type="text"
              placeholder="Search by reference or customer..."
              value={search}
              onChange={e => handleSearchChange(e.target.value)}
              className="flex-1 px-3 py-2 lg:py-3 border rounded-xl focus:outline-none text-sm sm:text-base lg:text-lg"
              style={{ borderColor: colors.border.light, maxWidth: 400 }}
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="w-full sm:w-auto lg:w-auto mt-1 sm:mt-0 lg:mt-0">
              <PrimaryButton
                style={{
                  minWidth: 160,
                  width: '100%',
                  fontSize: '14px',
                  padding: '10px 20px'
                }}
                onClick={() => handleOpen()}
              >
                + Add Order
              </PrimaryButton>
            </div>
          </div>
        </div>
      </div>

      {/* Order Record Printing Progress */}
      {orderRecordPrintingProgress.isPrinting && (
        <div className="mb-4 p-3 md:p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-sm md:text-base font-medium text-blue-700">
              Printing order record {orderRecordPrintingProgress.current} of {orderRecordPrintingProgress.total}...
            </span>
          </div>
          <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(orderRecordPrintingProgress.current / orderRecordPrintingProgress.total) * 100}%` }}
            ></div>
          </div>
          <p className="text-xs md:text-sm text-blue-600 mt-1">
            Each receipt prints with a 5-second delay for easy removal
          </p>
        </div>
      )}

      <div className="mt-1">
        <PrimaryTable
          columns={columns}
          rows={rows}
          pageSizeOptions={[10, 20, 50, 100]}
          pagination
          paginationMode="server"
          paginationModel={{
            page: pagination.currentPage - 1, // DataGrid uses 0-based indexing
            pageSize: pageSize
          }}
          rowCount={pagination.totalRecords}
          onPaginationModelChange={(model) => {
            if (model.pageSize !== pageSize) {
              handlePageSizeChange(model.pageSize);
            }
            if (model.page !== pagination.currentPage - 1) {
              handlePageChange(model.page + 1); // Convert back to 1-based
            }
          }}
          onRowClick={handleRowClick}
          getRowClassName={(params) => {
            // Add disabled styling for rows with 0 or no quantity (but still allow actions menu)
            if (!params.row.quantity || params.row.quantity <= 0) {
              return 'disabled-row-click';
            }
            return '';
          }}
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
            p: { xs: 4, sm: 5, md: 6, lg: 6 },
            width: {
              xs: '95vw',
              sm: '90vw',
              md: '85vw',
              lg: '1200px',
              xl: '1400px'
            },
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
              itemOptions={itemOptions}
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

      {/* Bag Printing Modal - Commented out as per client request (may be used in future) */}
      {/* <Modal open={bagModal.open} onClose={handleBagModalClose}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            bgcolor: 'background.paper',
            boxShadow: 24,
            borderRadius: 2,
            p: { xs: 4, sm: 4, md: 5 },
            width: { xs: '90vw', sm: '400px', md: '450px' },
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
                  <strong>Reference No:</strong> {bagModal.order.id}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Customer:</strong> {bagModal.order.customerName}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Quantity:</strong> {bagModal.order.quantity}
                </p>
              </div>
            )}

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium" style={{ color: colors.text.primary }}>
                  Number of Bags (Optional):
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

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium" style={{ color: colors.text.primary }}>
                  Quantity (Optional):
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={bagModal.quantity}
                  onChange={handleQuantityChange}
                  placeholder="Enter quantity"
                  className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ borderColor: colors.border.light }}
                />
              </div>
            </div>

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

            {bagPrintingProgress.isPrinting && (
              <div className="p-3 md:p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-sm md:text-base text-blue-700">
                    Printing bag {bagPrintingProgress.current} of {bagPrintingProgress.total}...
                  </span>
                </div>
                <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(bagPrintingProgress.current / bagPrintingProgress.total) * 100}%` }}
                  ></div>
                </div>
                <p className="text-xs md:text-sm text-blue-600 mt-1">
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
                disabled={!isConnected || bagPrintingProgress.isPrinting}
                style={{
                  backgroundColor: bagPrintingProgress.isPrinting ? colors.secondary[500] : colors.primary[500],
                  color: colors.text.white,
                  border: 'none',
                  borderRadius: '8px',
                }}
              >
                {bagPrintingProgress.isPrinting
                  ? 'Printing...'
                  : !isConnected
                    ? 'Connect Printer First'
                    : 'Print Receipt'
                }
              </PrimaryButton>
            </div>
          </div>
        </Box>
      </Modal> */}

      {/* Floating Printer Status Button */}
      <Tooltip title={isConnected ? 'Printer Connected' : 'Printer Disconnected'} arrow>
        <Fab
          color={isConnected ? 'success' : 'error'}
          aria-label="printer status"
          onClick={!isConnected ? connect : undefined}
          disabled={isConnecting}
          sx={{
            position: 'fixed',
            bottom: { xs: 24, sm: 24, md: 32, lg: 24 },
            right: { xs: 24, sm: 24, md: 32, lg: 24 },
            zIndex: 1000,
            width: { xs: 56, sm: 56, md: 64, lg: 56 },
            height: { xs: 56, sm: 56, md: 64, lg: 56 },
            '&:hover': {
              transform: 'scale(1.1)',
              transition: 'transform 0.2s ease-in-out',
            },
          }}
        >
          {isConnected ? <PrintOutlined /> : <PrintDisabled />}
        </Fab>
      </Tooltip>
    </div>
  );
}
