import React, { useState, useEffect, useCallback } from 'react';
import {
    IconButton,
    Tooltip,
    Alert,
    CircularProgress,
} from '@mui/material';
import {
    Receipt as ReceiptIcon,
    Check as CheckIcon,
} from '@mui/icons-material';
import type { GridColDef } from '@mui/x-data-grid';
import { useAuth } from '../hooks/useAuth';
import { hasPermission } from '../utils/roleUtils';
import PrimaryButton from '../components/common/PrimaryButton';
import PrimaryTable from '../components/common/PrimaryTable';
import PrimaryDropdown from '../components/common/PrimaryDropdown';
import { orderService } from '../services/orderService';
import { CustomerService, type Customer } from '../services/customerService';
import { BillingService } from '../services/billingService';
import toast from 'react-hot-toast';
import InvoiceCreationModal from '../components/modals/InvoiceCreationModal';
import colors from '../styles/colors';

interface BillingOrder {
    id: number;
    date: string;
    referenceNo: string;
    customerId: string;
    customerName: string;
    quantity: number;
    notes: string | null;
    deliveryDate: string;
    status: 'Pending' | 'Invoiced' | 'Complete' | 'Paid' | 'In Progress' | 'Completed' | 'Confirmed' | 'Processing' | 'Delivered';
    billingStatus: 'pending' | 'invoiced' | 'paid';
    recordsCount: number;
    complete: boolean;
    createdAt: string;
    updatedAt: string;
    records: unknown[];
}

const BillingPage: React.FC = () => {
    const { user } = useAuth();
    const [orders, setOrders] = useState<BillingOrder[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
    const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);

    // Filter states
    const [search, setSearch] = useState('');
    const [customerFilter, setCustomerFilter] = useState('');
    const [billingStatusFilter, setBillingStatusFilter] = useState('');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 10,
        hasNextPage: false,
        hasPrevPage: false
    });

    // Fetch orders with billing status
    const fetchOrders = useCallback(async () => {
        try {
            setLoading(true);
            const response = await orderService.getOrders({
                page: currentPage,
                limit: pageSize,
                // Remove search from API call - we'll filter on frontend
                // search: search || undefined,
                customerName: customerFilter || undefined,
                // Note: billingStatus filter might not be supported by the API yet
                // billingStatus: billingStatusFilter || undefined,
            });

            if (response.success) {
                // Filter orders by billingStatus and search on the frontend if API doesn't support it
                let filteredOrders = response.data.orders as BillingOrder[];

                if (billingStatusFilter) {
                    filteredOrders = filteredOrders.filter(order =>
                        order.billingStatus === billingStatusFilter
                    );
                }

                // Apply search filter - search by Order ID (displayed as Reference No) and customer name
                if (search && search.trim()) {
                    const searchTerm = search.toLowerCase().trim();
                    console.log('Searching for:', searchTerm);
                    console.log('Orders before search filter:', filteredOrders.length);
                    filteredOrders = filteredOrders.filter(order =>
                        order.id.toString().includes(searchTerm) || // Search by Order ID (Reference No)
                        order.customerName.toLowerCase().includes(searchTerm) // Search by customer name
                    );
                    console.log('Orders after search filter:', filteredOrders.length);
                }

                setOrders(filteredOrders);

                // Update pagination info
                setPagination({
                    currentPage: response.data.pagination?.currentPage || 1,
                    totalPages: response.data.pagination?.totalPages || 1,
                    totalItems: response.data.pagination?.totalRecords || filteredOrders.length,
                    itemsPerPage: response.data.pagination?.limit || pageSize,
                    hasNextPage: (response.data.pagination?.currentPage || 1) < (response.data.pagination?.totalPages || 1),
                    hasPrevPage: (response.data.pagination?.currentPage || 1) > 1
                });
            } else {
                toast.error('Failed to fetch orders');
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
            toast.error('Error fetching orders');
        } finally {
            setLoading(false);
        }
    }, [search, currentPage, pageSize, customerFilter, billingStatusFilter]);

    // Fetch customers for filter dropdown
    const fetchCustomers = useCallback(async () => {
        try {
            const response = await CustomerService.getAllCustomers({
                limit: 100, // Get all customers for dropdown
                isActive: true
            });
            setCustomers(response.customers);
        } catch (error) {
            console.error('Error fetching customers:', error);
        }
    }, []);

    // Fetch data on component mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch customers
                await fetchCustomers();
                // Fetch orders
                await fetchOrders();
            } catch (error) {
                console.error('Error fetching data:', error);
                toast.error('Failed to load data. Please refresh the page.');
            }
        };

        fetchData();
    }, [fetchOrders, fetchCustomers]);

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

    // Fetch orders when filters change
    useEffect(() => {
        setCurrentPage(1); // Reset to first page when filters change
        fetchOrders();
    }, [customerFilter, billingStatusFilter, fetchOrders]);

    // Handle order selection
    const handleOrderSelect = (orderId: number, selected: boolean) => {
        if (selected) {
            setSelectedOrders(prev => [...prev, orderId]);
        } else {
            setSelectedOrders(prev => prev.filter(id => id !== orderId));
        }
    };

    // Handle select all
    const handleSelectAll = (selected: boolean) => {
        if (selected) {
            // Only select orders that are pending (can be invoiced)
            const selectableOrders = orders.filter(order => order.billingStatus === 'pending');
            setSelectedOrders(selectableOrders.map(order => order.id));
        } else {
            setSelectedOrders([]);
        }
    };


    // Pagination handlers
    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
    };

    const handlePageSizeChange = (newPageSize: number) => {
        setPageSize(newPageSize);
        setCurrentPage(1); // Reset to first page when page size changes
    };

    // Handle filters
    const handleClearFilters = () => {
        setSearch('');
        setCustomerFilter('');
        setBillingStatusFilter('');
        setCurrentPage(1);
    };

    const handleCreateInvoice = () => {
        if (selectedOrders.length === 0) {
            toast.error('Please select at least one order to create an invoice');
            return;
        }
        setInvoiceModalOpen(true);
    };

    // Handle marking order as paid
    const handleMarkAsPaid = async (orderId: number) => {
        try {
            const response = await BillingService.updateOrderBillingStatus(orderId, 'paid' as 'pending' | 'invoiced' | 'paid');
            if (response.success) {
                toast.success('Payment status updated successfully');
                fetchOrders(); // Refresh the orders list
            } else {
                toast.error('Failed to update payment status');
            }
        } catch (error) {
            console.error('Error updating payment status:', error);
            toast.error('Error updating payment status');
        }
    };

    const handleInvoiceCreated = () => {
        setInvoiceModalOpen(false);
        setSelectedOrders([]);
        // Refresh orders to update billing status
        setTimeout(() => {
            fetchOrders();
        }, 1000); // Small delay to ensure backend has processed the update
    };

    // Table columns definition
    const columns: GridColDef[] = [
        {
            field: 'select',
            headerName: '',
            width: 50,
            sortable: false,
            renderHeader: () => {
                const selectableOrders = orders.filter(order => order.billingStatus === 'pending');
                const allSelected = selectableOrders.length > 0 && selectableOrders.every(order => selectedOrders.includes(order.id));
                const someSelected = selectedOrders.length > 0 && selectedOrders.length < selectableOrders.length;

                return (
                    <input
                        type="checkbox"
                        checked={allSelected}
                        ref={(input) => {
                            if (input) input.indeterminate = someSelected;
                        }}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        style={{ transform: 'scale(1.2)' }}
                    />
                );
            },
            renderCell: (params) => (
                <input
                    type="checkbox"
                    checked={selectedOrders.includes(params.row.id)}
                    onChange={(e) => handleOrderSelect(params.row.id, e.target.checked)}
                    disabled={params.row.billingStatus !== 'pending'}
                    style={{ transform: 'scale(1.2)' }}
                />
            ),
        },
        { field: 'id', headerName: 'Reference No', flex: 1, minWidth: 120 },
        { field: 'customerName', headerName: 'Customer', flex: 1.5, minWidth: 150 },
        {
            field: 'date',
            headerName: 'Order Date',
            flex: 1,
            minWidth: 120,
            renderCell: (params) => params.row.date ? new Date(params.row.date).toLocaleDateString() : 'N/A'
        },
        { field: 'quantity', headerName: 'Total Qty', flex: 0.8, minWidth: 100, type: 'number' },
        {
            field: 'billingStatus',
            headerName: 'Billing Status',
            flex: 1,
            minWidth: 130,
            renderCell: (params) => {
                const status = params.row.billingStatus || 'pending';
                const getStatusStyle = (status: string) => {
                    switch (status.toLowerCase()) {
                        case 'pending':
                            return 'bg-orange-100 text-orange-800';
                        case 'invoiced':
                            return 'bg-blue-100 text-blue-800';
                        case 'paid':
                            return 'bg-green-100 text-green-800';
                        default:
                            return 'bg-gray-100 text-gray-800';
                    }
                };

                return (
                    <span
                        className={`px-3 py-1 rounded-xl text-sm font-semibold ${getStatusStyle(status)}`}
                    >
                        {status.toUpperCase()}
                    </span>
                );
            }
        },
        {
            field: 'paymentStatus',
            headerName: 'Payment Status',
            flex: 1,
            minWidth: 130,
            sortable: false,
            renderCell: (params) => {
                if (params.row.billingStatus === 'invoiced') {
                    return (
                        <Tooltip title="Mark Payment Received">
                            <IconButton
                                size="small"
                                onClick={() => handleMarkAsPaid(params.row.id)}
                                sx={{ color: colors.success }}
                            >
                                <CheckIcon />
                            </IconButton>
                        </Tooltip>
                    );
                } else if (params.row.billingStatus === 'paid') {
                    return (
                        <span className="px-3 py-1 rounded-xl text-sm font-semibold bg-green-100 text-green-800">
                            PAYMENT RECEIVED
                        </span>
                    );
                } else {
                    return (
                        <span className="text-sm text-gray-500">
                            Create Invoice First
                        </span>
                    );
                }
            }
        },
    ];


    // Check permissions
    const canViewBilling = hasPermission(user, 'canViewBilling');

    if (!canViewBilling) {
        return (
            <div className="w-full mx-auto px-1 sm:px-3 md:px-4 py-3">
                <Alert severity="error">
                    You don't have permission to access the billing section.
                </Alert>
            </div>
        );
    }

    return (
        <div className="w-full mx-auto px-1 sm:px-3 md:px-4 py-3">
            <div className="flex flex-col gap-3 mb-4">
                <h2 className="text-xl md:text-2xl font-bold" style={{ color: colors.text.primary }}>Billing Management</h2>

                {/* Search and Filters Row */}
                <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center">
                    <div className="flex-1 w-full lg:w-auto">
                        <input
                            type="text"
                            placeholder="Search by reference number or customer..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full px-3 py-2 border rounded-xl focus:outline-none text-sm"
                            style={{ borderColor: colors.border.light, maxWidth: 400 }}
                        />
                    </div>

                    <div className="flex flex-wrap gap-2 items-center">
                        <PrimaryDropdown
                            value={customerFilter}
                            onChange={(e) => setCustomerFilter(e.target.value)}
                            options={[
                                { value: '', label: 'All Customers' },
                                ...customers.map(customer => ({
                                    value: `${customer.firstName} ${customer.lastName}`,
                                    label: `${customer.firstName} ${customer.lastName}`
                                }))
                            ]}
                            placeholder="Customer"
                            style={{ minWidth: 140 }}
                        />
                        <PrimaryDropdown
                            value={billingStatusFilter}
                            onChange={(e) => setBillingStatusFilter(e.target.value)}
                            options={[
                                { value: '', label: 'All Status' },
                                { value: 'pending', label: 'Pending' },
                                { value: 'invoiced', label: 'Invoiced' },
                                { value: 'paid', label: 'Paid' }
                            ]}
                            placeholder="Status"
                            style={{ minWidth: 100 }}
                        />
                        <PrimaryButton
                            onClick={handleClearFilters}
                            style={{ minWidth: 70 }}
                        >
                            Clear
                        </PrimaryButton>
                    </div>
                </div>

                {/* Action Button Row */}
                <div className="flex justify-end">
                    <PrimaryButton
                        style={{ minWidth: 180 }}
                        onClick={handleCreateInvoice}
                        disabled={selectedOrders.length === 0}
                    >
                        <ReceiptIcon style={{ marginRight: 8 }} />
                        Create Invoice ({selectedOrders.length})
                    </PrimaryButton>
                </div>
            </div>

            {/* Table Section */}
            <div className="mt-1">
                {loading ? (
                    <div className="flex justify-center items-center py-12">
                        <div className="flex flex-col items-center gap-3">
                            <CircularProgress size={40} />
                            <span className="text-sm text-gray-500">Loading orders...</span>
                        </div>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="flex justify-center items-center py-12">
                        <div className="text-center">
                            <p className="text-gray-500 mb-2">No orders found</p>
                            <p className="text-sm text-gray-400">Try adjusting your search or filters</p>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow-sm border" style={{ borderColor: colors.border.light }}>
                        <PrimaryTable
                            columns={columns}
                            rows={orders}
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
                            height="auto"
                            loading={loading}
                        />
                    </div>
                )}
            </div>


            {/* Invoice Creation Modal */}
            <InvoiceCreationModal
                open={invoiceModalOpen}
                onClose={() => setInvoiceModalOpen(false)}
                selectedOrderIds={selectedOrders}
                orders={orders.filter(order => selectedOrders.includes(order.id)).map(order => ({
                    id: order.id,
                    referenceNo: order.id.toString(), // Use order ID as reference number
                    customerName: order.customerName,
                    date: order.date,
                    quantity: order.quantity,
                    status: order.status
                }))}
                onInvoiceCreated={handleInvoiceCreated}
            />
        </div>
    );
};

export default BillingPage;
