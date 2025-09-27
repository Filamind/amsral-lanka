import React, { useState, useEffect, useCallback } from 'react';
import {
    IconButton,
    Tooltip,
    Alert,
    CircularProgress,
    Tabs,
    Tab,
    Box,
} from '@mui/material';
import {
    Receipt as ReceiptIcon,
    Payment as PaymentIcon,
} from '@mui/icons-material';
import type { GridColDef } from '@mui/x-data-grid';
import { useAuth } from '../hooks/useAuth';
import { hasPermission } from '../utils/roleUtils';
import PrimaryButton from '../components/common/PrimaryButton';
import PrimaryTable from '../components/common/PrimaryTable';
import PrimaryDropdown from '../components/common/PrimaryDropdown';
import { CustomerService, type Customer } from '../services/customerService';
import { BillingService, type Invoice, type InvoiceFilters } from '../services/billingService';
import toast from 'react-hot-toast';
import InvoiceCreationModal from '../components/modals/InvoiceCreationModal';
import PaymentStatusModal from '../components/modals/PaymentStatusModal';
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
    status: 'Pending' | 'Invoiced' | 'Complete' | 'Paid' | 'In Progress' | 'Completed' | 'Confirmed' | 'Processing' | 'Delivered' | 'QC';
    billingStatus: 'pending' | 'invoiced' | 'paid';
    recordsCount: number;
    complete: boolean;
    createdAt: string;
    updatedAt: string;
    records: unknown[];
    amount?: number;
    paymentAmount?: number; // Actual payment amount received (may be less than invoice amount)
    balance?: number; // Customer balance amount
}

const BillingPage: React.FC = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState(0);

    // Orders tab state
    const [orders, setOrders] = useState<BillingOrder[]>([]);
    const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
    const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);

    // Invoices tab state
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [paymentModal, setPaymentModal] = useState({
        open: false,
        invoice: null as Invoice | null,
    });

    // Common state
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);

    // Filter states
    const [search, setSearch] = useState('');
    const [customerFilter, setCustomerFilter] = useState('');

    // Invoice filter states
    const [invoiceStatusFilter, setInvoiceStatusFilter] = useState('');
    const [invoiceCustomerFilter, setInvoiceCustomerFilter] = useState('');

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
    const fetchOrdersData = useCallback(async () => {
        try {
            setLoading(true);
            // Make two API calls to get both QC and Complete orders
            const [qcResponse, completeResponse] = await Promise.all([
                BillingService.getBillingOrders({
                    page: currentPage,
                    limit: pageSize,
                    customerId: customerFilter || undefined,
                    status: 'QC',
                    billingStatus: 'pending',
                }),
                BillingService.getBillingOrders({
                    page: currentPage,
                    limit: pageSize,
                    customerId: customerFilter || undefined,
                    status: 'Complete',
                    billingStatus: 'pending',
                })
            ]);

            if (qcResponse.success && completeResponse.success) {
                // Combine orders from both responses
                const qcOrders = qcResponse.data.orders as BillingOrder[];
                const completeOrders = completeResponse.data.orders as BillingOrder[];
                let filteredOrders = [...qcOrders, ...completeOrders];

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

                // Update pagination info - use combined totals
                const totalItems = (qcResponse.data.pagination?.totalItems || 0) + (completeResponse.data.pagination?.totalItems || 0);
                setPagination({
                    currentPage: currentPage,
                    totalPages: Math.ceil(totalItems / pageSize),
                    totalItems: totalItems,
                    itemsPerPage: pageSize,
                    hasNextPage: currentPage < Math.ceil(totalItems / pageSize),
                    hasPrevPage: currentPage > 1
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
    }, [currentPage, pageSize, customerFilter, search]);

    // Fetch invoices (for Invoices tab)
    const fetchInvoices = useCallback(async () => {
        try {
            setLoading(true);
            const filters: InvoiceFilters = {
                page: currentPage,
                limit: pageSize,
                status: (invoiceStatusFilter as 'draft' | 'sent' | 'paid' | 'overdue') || undefined,
                customerName: invoiceCustomerFilter || undefined,
            };

            const response = await BillingService.getInvoices(filters);

            if (response.success) {
                setInvoices(response.data.invoices);
                setPagination({
                    currentPage: response.data.pagination?.currentPage || 1,
                    totalPages: response.data.pagination?.totalPages || 1,
                    totalItems: response.data.pagination?.totalItems || response.data.invoices.length,
                    itemsPerPage: response.data.pagination?.itemsPerPage || pageSize,
                    hasNextPage: (response.data.pagination?.currentPage || 1) < (response.data.pagination?.totalPages || 1),
                    hasPrevPage: (response.data.pagination?.currentPage || 1) > 1
                });
            }
        } catch (error) {
            console.error('Error fetching invoices:', error);
            toast.error('Failed to fetch invoices');
        } finally {
            setLoading(false);
        }
    }, [currentPage, pageSize, invoiceStatusFilter, invoiceCustomerFilter]);

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

    // Consolidated data fetching - handles all triggers in one useEffect
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch customers
                await fetchCustomers();
                // Fetch data based on active tab
                if (activeTab === 0) {
                    await fetchOrdersData();
                } else {
                    await fetchInvoices();
                }
            } catch (error) {
                console.error('Error fetching data:', error);
                toast.error('Failed to load data. Please refresh the page.');
            }
        };

        // Debounce search changes
        const timeoutId = setTimeout(() => {
            fetchData();
        }, search !== undefined ? 500 : 0);

        return () => clearTimeout(timeoutId);
    }, [activeTab, search, customerFilter, invoiceStatusFilter, invoiceCustomerFilter, fetchOrdersData, fetchInvoices, fetchCustomers]);

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
            // Select all QC orders with pending billing status (can be invoiced)
            const selectableOrders = orders.filter(order =>
                order.status === 'QC' && order.billingStatus === 'pending'
            );
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
        if (activeTab === 0) {
            setCustomerFilter('');
        } else {
            setInvoiceCustomerFilter('');
            setInvoiceStatusFilter('');
        }
        setCurrentPage(1);
    };

    const handleCreateInvoice = () => {
        if (selectedOrders.length === 0) {
            toast.error('Please select at least one order to create an invoice');
            return;
        }
        setInvoiceModalOpen(true);
    };

    // Handle opening payment modal
    const handleOpenPaymentModal = (invoice: Invoice) => {
        setPaymentModal({
            open: true,
            invoice: invoice
        });
    };

    const handleClosePaymentModal = () => {
        setPaymentModal({
            open: false,
            invoice: null
        });
    };

    const handleUpdatePayment = async (invoiceId: number, paymentAmount: number) => {
        try {
            const response = await BillingService.updateInvoicePaymentStatus(invoiceId, true, paymentAmount);
            if (response.success) {
                toast.success('Payment updated successfully');
                fetchInvoices(); // Refresh the invoices list
            } else {
                toast.error('Failed to update payment');
            }
        } catch (error) {
            console.error('Error updating payment:', error);
            toast.error('Error updating payment');
            throw error; // Re-throw to let the modal handle the error
        }
    };

    const handleInvoiceCreated = () => {
        setInvoiceModalOpen(false);
        setSelectedOrders([]);
        // Refresh orders to update billing status
        setTimeout(() => {
            fetchOrdersData();
        }, 1000); // Small delay to ensure backend has processed the update
    };

    // Orders table columns definition
    const ordersColumns: GridColDef[] = [
        {
            field: 'select',
            headerName: '',
            width: 50,
            sortable: false,
            renderHeader: () => {
                const selectableOrders = orders.filter(order =>
                    order.status === 'QC' && order.billingStatus === 'pending'
                );
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
                    disabled={params.row.status !== 'QC' || params.row.billingStatus !== 'pending'}
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
            field: 'balance',
            headerName: 'Customer Balance',
            flex: 1,
            minWidth: 120,
            type: 'number',
            renderCell: (params) => (
                <span style={{
                    fontWeight: 500,
                    color: params.value && params.value > 0 ? '#f57c00' : colors.text.primary
                }}>
                    ${params.value || 0}
                </span>
            )
        },
    ];

    // Invoices table columns definition
    const invoicesColumns: GridColDef[] = [
        { field: 'invoiceNumber', headerName: 'Invoice #', flex: 1, minWidth: 120 },
        { field: 'customerName', headerName: 'Customer', flex: 1.5, minWidth: 150 },
        {
            field: 'createdAt',
            headerName: 'Created Date',
            flex: 1,
            minWidth: 120,
            renderCell: (params) => params.row.createdAt ? new Date(params.row.createdAt).toLocaleDateString() : 'N/A'
        },
        {
            field: 'total',
            headerName: 'Invoice Amount',
            flex: 1,
            minWidth: 120,
            type: 'number',
            renderCell: (params) => (
                <span style={{ fontWeight: 500, color: colors.text.primary }}>
                    ${params.value || 0}
                </span>
            )
        },
        {
            field: 'payment',
            headerName: 'Paid Amount',
            flex: 1,
            minWidth: 120,
            type: 'number',
            renderCell: (params) => {
                const paymentAmount = params.value || 0;
                const invoiceAmount = params.row.total || 0;
                const isPartial = paymentAmount > 0 && paymentAmount < invoiceAmount;
                const isOverpaid = paymentAmount > invoiceAmount;

                return (
                    <span style={{
                        fontWeight: 500,
                        color: isPartial ? '#f57c00' :
                            isOverpaid ? '#17a2b8' :
                                colors.text.primary
                    }}>
                        ${paymentAmount}
                    </span>
                );
            }
        },
        {
            field: 'status',
            headerName: 'Status',
            flex: 1,
            minWidth: 120,
            renderCell: (params) => {
                const status = params.value || 'draft';
                // Map invoice status to appropriate colors
                const getInvoiceStatusColor = (status: string) => {
                    switch (status.toLowerCase()) {
                        case 'draft':
                            return 'bg-gray-100 text-gray-800';
                        case 'sent':
                            return 'bg-blue-100 text-blue-800';
                        case 'paid':
                            return 'bg-green-100 text-green-800';
                        case 'overdue':
                            return 'bg-red-100 text-red-800';
                        default:
                            return 'bg-gray-100 text-gray-800';
                    }
                };

                const getInvoiceStatusLabel = (status: string) => {
                    switch (status.toLowerCase()) {
                        case 'draft':
                            return 'Draft';
                        case 'sent':
                            return 'Sent';
                        case 'paid':
                            return 'Paid';
                        case 'overdue':
                            return 'Overdue';
                        default:
                            return status.toUpperCase();
                    }
                };

                const statusColor = getInvoiceStatusColor(status);
                const statusLabel = getInvoiceStatusLabel(status);

                return (
                    <span
                        className={`px-3 py-1 rounded-xl text-sm font-semibold ${statusColor}`}
                    >
                        {statusLabel}
                    </span>
                );
            }
        },
        {
            field: 'paymentStatus',
            headerName: 'Payment',
            flex: 1,
            minWidth: 130,
            sortable: false,
            renderCell: (params) => {
                if (params.row.status === 'paid') {
                    return (
                        <Tooltip title="Update Payment Status">
                            <IconButton
                                size="small"
                                onClick={() => handleOpenPaymentModal(params.row)}
                                sx={{ color: '#000000' }}
                            >
                                <PaymentIcon />
                            </IconButton>
                        </Tooltip>
                    );
                } else {
                    return (
                        <Tooltip title="Mark as Paid">
                            <IconButton
                                size="small"
                                onClick={() => handleOpenPaymentModal(params.row)}
                                sx={{ color: '#000000' }}
                            >
                                <PaymentIcon />
                            </IconButton>
                        </Tooltip>
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
        <div className="w-full mx-auto px-1 sm:px-3 md:px-4 py-4">
            <div className="flex flex-col gap-6 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <h2 className="text-2xl md:text-3xl font-bold" style={{ color: colors.text.primary }}>
                        Billing Management
                    </h2>
                    {activeTab === 0 && selectedOrders.length > 0 && (
                        <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg border" style={{ borderColor: colors.border.light }}>
                            <span className="text-sm font-medium text-blue-700">
                                {selectedOrders.length} order{selectedOrders.length !== 1 ? 's' : ''} selected
                            </span>
                        </div>
                    )}
                </div>

                {/* Tabs */}
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs
                        value={activeTab}
                        onChange={(_, newValue) => setActiveTab(newValue)}
                        sx={{
                            '& .MuiTab-root': {
                                textTransform: 'none',
                                fontWeight: 500,
                                fontSize: '1rem',
                            }
                        }}
                    >
                        <Tab label="Orders (Create Invoice)" />
                        <Tab label="Invoices (Payment Management)" />
                    </Tabs>
                </Box>

                {/* Search and Filters Section */}
                <div className="bg-white rounded-lg shadow-sm border p-4" style={{ borderColor: colors.border.light }}>
                    <div className="flex flex-col gap-4">
                        {/* Search Bar */}
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Search
                                </label>
                                <input
                                    type="text"
                                    placeholder={activeTab === 0 ? "Search by reference number or customer name..." : "Search by invoice number or customer name..."}
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all duration-200"
                                    style={{ borderColor: colors.border.light }}
                                />
                            </div>
                        </div>

                        {/* Filters Row */}
                        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end">
                            <div className="flex flex-wrap gap-4 flex-1">
                                <div className="min-w-[220px] flex-1 max-w-[300px]">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Customer
                                    </label>
                                    <PrimaryDropdown
                                        value={activeTab === 0 ? customerFilter : invoiceCustomerFilter}
                                        onChange={(e) => activeTab === 0 ? setCustomerFilter(e.target.value) : setInvoiceCustomerFilter(e.target.value)}
                                        options={[
                                            { value: '', label: 'All Customers' },
                                            ...customers.map(customer => ({
                                                value: customer.id?.toString() || '',
                                                label: `${customer.firstName} - ${customer.customerCode || 'N/A'}`
                                            }))
                                        ]}
                                        placeholder="Select Customer"
                                        style={{ width: '100%' }}
                                    />
                                </div>

                                {activeTab === 1 && (
                                    <div className="min-w-[180px] flex-1 max-w-[250px]">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Status
                                        </label>
                                        <PrimaryDropdown
                                            value={invoiceStatusFilter}
                                            onChange={(e) => setInvoiceStatusFilter(e.target.value)}
                                            options={[
                                                { value: '', label: 'All Status' },
                                                { value: 'draft', label: 'Draft' },
                                                { value: 'sent', label: 'Sent' },
                                                { value: 'paid', label: 'Paid' },
                                                { value: 'overdue', label: 'Overdue' }
                                            ]}
                                            placeholder="Select Status"
                                            style={{ width: '100%' }}
                                        />
                                    </div>
                                )}

                                {/* Clear Button - positioned right after filters */}
                                <div className="flex items-end">
                                    <PrimaryButton
                                        onClick={handleClearFilters}
                                        style={{
                                            minWidth: 120,
                                            height: 40,
                                            backgroundColor: colors.background.primary,
                                            border: `1px solid ${colors.border.light}`,
                                            color: colors.text.secondary
                                        }}
                                    >
                                        Clear Filters
                                    </PrimaryButton>
                                </div>
                            </div>

                            {/* Create Invoice Button - positioned separately */}
                            {activeTab === 0 && (
                                <div className="flex items-end">
                                    <PrimaryButton
                                        style={{
                                            minWidth: 280,
                                            height: 40,
                                            backgroundColor: selectedOrders.length > 0 ? colors.primary[500] : colors.border.light,
                                            color: selectedOrders.length > 0 ? 'white' : colors.text.secondary
                                        }}
                                        onClick={handleCreateInvoice}
                                        disabled={selectedOrders.length === 0}
                                    >
                                        <ReceiptIcon style={{ marginRight: 8, fontSize: 18 }} />
                                        Create Invoice ({selectedOrders.length})
                                    </PrimaryButton>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Table Section */}
            <div className="mt-6">
                {loading ? (
                    <div className="flex justify-center items-center py-12">
                        <div className="flex flex-col items-center gap-3">
                            <CircularProgress size={40} />
                            <span className="text-sm text-gray-500">
                                {activeTab === 0 ? 'Loading orders...' : 'Loading invoices...'}
                            </span>
                        </div>
                    </div>
                ) : (activeTab === 0 ? orders.length === 0 : invoices.length === 0) ? (
                    <div className="flex justify-center items-center py-16">
                        <div className="text-center max-w-md">
                            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                                {activeTab === 0 ? (
                                    <ReceiptIcon style={{ fontSize: 32, color: colors.text.secondary }} />
                                ) : (
                                    <PaymentIcon style={{ fontSize: 32, color: colors.text.secondary }} />
                                )}
                            </div>
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">
                                {activeTab === 0 ? 'No orders found' : 'No invoices found'}
                            </h3>
                            <p className="text-sm text-gray-500 mb-4">
                                {activeTab === 0
                                    ? 'No pending orders available for invoicing. Orders need to be in QC or Complete status with pending billing status.'
                                    : 'No invoices match your current filters.'
                                }
                            </p>
                            <button
                                onClick={handleClearFilters}
                                className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                            >
                                Clear filters to see all {activeTab === 0 ? 'orders' : 'invoices'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow-sm border" style={{ borderColor: colors.border.light }}>
                        <PrimaryTable
                            columns={activeTab === 0 ? ordersColumns : invoicesColumns}
                            rows={activeTab === 0 ? orders : invoices}
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
                onInvoiceCreated={handleInvoiceCreated}
            />

            {/* Payment Status Modal */}
            <PaymentStatusModal
                open={paymentModal.open}
                onClose={handleClosePaymentModal}
                order={paymentModal.invoice}
                onUpdate={handleUpdatePayment}
                loading={loading}
            />
        </div>
    );
};

export default BillingPage;
