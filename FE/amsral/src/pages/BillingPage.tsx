import React, { useState } from 'react';
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
import {
    useBillingOrders,
    useInvoices,
    useBillingCustomers,
    useUpdatePaymentStatus,
    type BillingOrderFilters
} from '../hooks/useBilling';
import { type Invoice, type InvoiceFilters } from '../services/billingService';
import toast from 'react-hot-toast';
import InvoiceCreationModal from '../components/modals/InvoiceCreationModal';
import PaymentStatusModal from '../components/modals/PaymentStatusModal';
import colors from '../styles/colors';

const BillingPage: React.FC = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState(0);

    // Local state for UI
    const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
    const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
    const [paymentModal, setPaymentModal] = useState({
        open: false,
        invoice: null as Invoice | null,
    });

    // Filter states
    const [search, setSearch] = useState('');
    const [customerFilter, setCustomerFilter] = useState('');
    const [invoiceStatusFilter, setInvoiceStatusFilter] = useState('');
    const [invoiceCustomerFilter, setInvoiceCustomerFilter] = useState('');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Prepare filters for TanStack Query hooks
    const ordersFilters: BillingOrderFilters = {
        page: currentPage,
        limit: pageSize,
        customerId: customerFilter || undefined,
        search: search || undefined,
    };

    const invoicesFilters: InvoiceFilters = {
        page: currentPage,
        limit: pageSize,
        status: (invoiceStatusFilter as 'draft' | 'sent' | 'paid' | 'overdue') || undefined,
        customerName: invoiceCustomerFilter || undefined,
    };

    // TanStack Query hooks
    const {
        data: ordersData,
        isLoading: ordersLoading
    } = useBillingOrders(ordersFilters);

    const {
        data: invoicesData,
        isLoading: invoicesLoading
    } = useInvoices(invoicesFilters);

    const {
        data: customers = [],
        isLoading: customersLoading
    } = useBillingCustomers();

    // Mutation hooks
    const updatePaymentStatusMutation = useUpdatePaymentStatus();

    // Derived state
    const orders = ordersData?.orders || [];
    const invoices = (invoicesData as { invoices: Invoice[] } | undefined)?.invoices || [];
    const pagination = ordersData?.pagination || (invoicesData as { pagination: { currentPage: number; totalPages: number; totalItems: number; itemsPerPage: number; hasNextPage: boolean; hasPrevPage: boolean } } | undefined)?.pagination || {
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 10,
        hasNextPage: false,
        hasPrevPage: false
    };

    const loading = ordersLoading || invoicesLoading || customersLoading;

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
            // Select all QC or Complete orders with pending billing status (can be invoiced)
            const selectableOrders = orders.filter(order =>
                (order.status === 'QC' || order.status === 'Complete') && order.billingStatus === 'pending'
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
        updatePaymentStatusMutation.mutate(
            {
                invoiceId: invoiceId.toString(),
                paymentAmount,
                paymentDate: new Date().toISOString().split('T')[0],
                paymentMethod: 'Cash'
            },
            {
                onError: (error: Error) => {
                    console.error('Error updating payment:', error);
                    throw error; // Re-throw to let the modal handle the error
                }
            }
        );
    };

    const handleInvoiceCreated = () => {
        setInvoiceModalOpen(false);
        setSelectedOrders([]);
        // TanStack Query will automatically refetch data due to cache invalidation
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
                    (order.status === 'QC' || order.status === 'Complete' || order.status === 'Delivered') && order.billingStatus === 'pending'
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
                    disabled={(params.row.status !== 'QC' && params.row.status !== 'Complete' && params.row.status !== 'Delivered') || params.row.billingStatus !== 'pending'}
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
