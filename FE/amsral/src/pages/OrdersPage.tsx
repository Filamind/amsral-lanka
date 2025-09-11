import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, Box, Menu, MenuItem, IconButton } from '@mui/material';
import { MoreVert, Print } from '@mui/icons-material';
import type { GridColDef, GridRowParams } from '@mui/x-data-grid';
import PrimaryButton from '../components/common/PrimaryButton';
import PrimaryTable from '../components/common/PrimaryTable';
import SimpleOrderForm from '../components/orders/SimpleOrderForm';
import ConfirmationDialog from '../components/common/ConfirmationDialog';
import colors from '../styles/colors';
import { orderService, type CreateOrderRequest, type ErrorResponse } from '../services/orderService';
import CustomerService from '../services/customerService';
import { generateOrderReceipt, type OrderReceiptData } from '../utils/pdfUtils';
import toast from 'react-hot-toast';

// We'll define columns inside the component to access the handler functions

type ProcessRecord = {
  id: string;
  itemId: string;
  quantity: number;
  washType: string;
  processTypes: string[];
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


  const handlePrintOrder = (orderRow: OrderRow) => {
    try {
      const receiptData: OrderReceiptData = {
        orderId: orderRow.id,
        customerName: orderRow.customerName,
        totalQuantity: orderRow.quantity,
        orderDate: orderRow.date,
        notes: orderRow.notes
      };

      generateOrderReceipt(receiptData);
      toast.success('Order receipt downloaded successfully!');
    } catch (error) {
      console.error('Error generating order receipt:', error);
      toast.error('Failed to generate receipt. Please try again.');
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
      renderCell: (params) => (
        <span
          className={`px-3 py-1 rounded-xl text-sm font-semibold ${params.row.complete
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
            }`}
        >
          {params.value}
        </span>
      )
    },
    { field: 'recordsCount', headerName: 'Records', flex: 0.6, minWidth: 80, type: 'number' },
    { field: 'deliveryDate', headerName: 'Delivery Date', flex: 1, minWidth: 120 },
    {
      field: 'status',
      headerName: 'Status',
      flex: 1,
      minWidth: 120,
      renderCell: (params) => (
        <span
          className={`px-3 py-1 rounded-xl text-sm font-semibold ${params.row.complete
            ? 'bg-green-100 text-green-800'
            : params.row.status === 'in_progress'
              ? 'bg-yellow-100 text-yellow-800'
              : params.row.status === 'pending'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-800'
            }`}
        >
          {params.row.complete ? 'Complete' : params.row.status || 'Pending'}
        </span>
      )
    },
    {
      field: 'print',
      headerName: 'Print',
      flex: 0.3,
      minWidth: 60,
      sortable: false,
      renderCell: (params) => (
        <IconButton
          onClick={(e) => {
            e.stopPropagation();
            handlePrintOrder(params.row);
          }}
          size="small"
          sx={{ color: colors.button.primary }}
          title="Print Order"
        >
          <Print />
        </IconButton>
      )
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 0.5,
      minWidth: 80,
      sortable: false,
      renderCell: (params) => (
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
      )
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
          <div className="w-full sm:w-auto mt-1 sm:mt-0">
            <PrimaryButton style={{ minWidth: 140, width: '100%' }} onClick={() => handleOpen()}>
              + Add Order
            </PrimaryButton>
          </div>
        </div>
      </div>

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
        <MenuItem onClick={handleEditClick}>
          Edit Order
        </MenuItem>
        <MenuItem onClick={handleDeleteOrder} sx={{ color: 'error.main' }}>
          Delete Order
        </MenuItem>
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
    </div>
  );
}
