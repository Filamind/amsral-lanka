/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconButton } from '@mui/material';
import { CheckCircle, RadioButtonUnchecked } from '@mui/icons-material';
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import PrimaryTable from '../components/common/PrimaryTable';
import PrimaryButton from '../components/common/PrimaryButton';
import colors from '../styles/colors';
import { orderService, type ManagementOrder, type UpdateOrderRequest, type ErrorResponse } from '../services/orderService';
import { getStatusColor, getStatusLabel, normalizeStatus } from '../utils/statusUtils';
import { useAuth } from '../hooks/useAuth';
import { hasPermission } from '../utils/roleUtils';
import toast from 'react-hot-toast';


export default function ManagementPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [orders, setOrders] = useState<ManagementOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [orderIdFilter, setOrderIdFilter] = useState('');
    const [customerNameFilter, setCustomerNameFilter] = useState('');

    // Permission checks
    const canMarkDelivered = hasPermission(user, 'canMarkDelivered');

    // Pagination state
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 20, // Match default pageSize
        hasNextPage: false,
        hasPrevPage: false
    });
    const [pageSize, setPageSize] = useState(20); // Default to 20 rows per page
    const [currentPage, setCurrentPage] = useState(1);

    // Table columns
    const columns: GridColDef[] = [
        // {
        //     field: 'id',
        //     headerName: 'Order ID',
        //     flex: 0.6,
        //     minWidth: 80,
        //     type: 'number',
        //     renderCell: (params) => (
        //         <span className="font-semibold" style={{ color: colors.button.primary }}>
        //             {params.value}
        //         </span>
        //     )
        // },
        {
            field: 'id',
            headerName: 'Ref No',
            flex: 0.8,
            minWidth: 80,
            renderCell: (params) => (
                <span className="font-mono font-semibold text-xs sm:text-sm" style={{ color: colors.button.primary }}>
                    {params.value}
                </span>
            )
        },
        { field: 'customerName', headerName: 'Customer', flex: 1.2, minWidth: 120 },
        { field: 'quantity', headerName: 'Qty', flex: 0.6, minWidth: 60, type: 'number' },
        { field: 'date', headerName: 'Order Date', flex: 1, minWidth: 100 },
        { field: 'deliveryDate', headerName: 'Delivery Date', flex: 1, minWidth: 100 },
        {
            field: 'status',
            headerName: 'Status',
            flex: 1,
            minWidth: 100,
            renderCell: (params) => {
                const status = params.value || 'Pending';
                const normalizedStatus = normalizeStatus(status, 'order');
                const statusColor = getStatusColor(normalizedStatus, 'order');
                const statusLabel = getStatusLabel(normalizedStatus, 'order');

                return (
                    <span
                        className={`px-2 py-1 rounded-xl text-xs sm:text-sm font-semibold ${statusColor}`}
                    >
                        {statusLabel}
                    </span>
                );
            }
        },
        {
            field: 'billingStatus',
            headerName: 'Billing',
            flex: 1,
            minWidth: 100,
            renderCell: (params) => {
                const status = params.row.billingStatus || 'pending';
                const normalizedStatus = normalizeStatus(status, 'billing');
                const statusColor = getStatusColor(normalizedStatus, 'billing');
                const statusLabel = getStatusLabel(normalizedStatus, 'billing');

                return (
                    <span
                        className={`px-2 py-1 rounded-xl text-xs sm:text-sm font-semibold ${statusColor}`}
                    >
                        {statusLabel}
                    </span>
                );
            }
        },
        { field: 'recordsCount', headerName: 'Records', flex: 0.6, minWidth: 60, type: 'number' },
        ...(canMarkDelivered ? [{
            field: 'delivered',
            headerName: 'Delivered',
            flex: 0.5,
            minWidth: 60,
            sortable: false,
            renderCell: (params: GridRenderCellParams) => {
                const isDelivered = (params.row.status || '').toLowerCase() === 'delivered';
                return (
                    <IconButton
                        onClick={(e) => {
                            e.stopPropagation();
                            handleToggleDelivery(params.row);
                        }}
                        size="small"
                        sx={{
                            color: isDelivered ? colors.button.primary : colors.text.secondary
                        }}
                        title={isDelivered ? 'Mark as Completed' : 'Mark as Delivered'}
                        disabled={loading}
                    >
                        {isDelivered ? <CheckCircle /> : <RadioButtonUnchecked />}
                    </IconButton>
                );
            }
        }] : []),
    ];

    // Fetch orders with filters
    const fetchOrders = useCallback(async () => {
        try {
            setLoading(true);

            const params: any = {
                page: currentPage,
                limit: pageSize
            };

            // Apply filters
            if (orderIdFilter) {
                params.orderId = parseInt(orderIdFilter);
            }
            if (customerNameFilter) {
                params.customerName = customerNameFilter;
            }

            const response = await orderService.getManagementOrders(params);

            if (response.success) {
                setOrders(response.data.orders);
                setPagination({
                    currentPage: response.data.pagination.currentPage,
                    totalPages: response.data.pagination.totalPages,
                    totalItems: response.data.pagination.totalRecords,
                    itemsPerPage: response.data.pagination.limit,
                    hasNextPage: response.data.pagination.currentPage < response.data.pagination.totalPages,
                    hasPrevPage: response.data.pagination.currentPage > 1
                });
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
            toast.error('Failed to fetch orders');
        } finally {
            setLoading(false);
        }
    }, [currentPage, pageSize, orderIdFilter, customerNameFilter]);

    // Handle search with debouncing
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchTerm) {
                // If search term is a number, treat it as order ID
                if (!isNaN(Number(searchTerm))) {
                    setOrderIdFilter(searchTerm);
                    setCustomerNameFilter('');
                } else {
                    // Otherwise treat it as customer name
                    setCustomerNameFilter(searchTerm);
                    setOrderIdFilter('');
                }
            } else {
                setOrderIdFilter('');
                setCustomerNameFilter('');
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [searchTerm]);

    // Fetch orders when filters change
    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    // Handle row click to navigate to order details
    const handleRowClick = (params: any) => {
        navigate(`/management/orders/${params.id}`);
    };

    // Handle delivery toggle
    const handleToggleDelivery = async (order: ManagementOrder) => {
        const isDelivered = (order.status || '').toLowerCase() === 'delivered';

        try {
            setLoading(true);

            // Update order status via API
            const updateData: UpdateOrderRequest = {
                status: isDelivered ? 'Completed' : 'Delivered'
            };

            const response = await orderService.updateOrder(order.id, updateData);

            if (response.success) {
                // Update order in local state
                setOrders(prev => prev.map(row =>
                    row.id === order.id ? { ...row, status: response.data.status } : row
                ));

                toast.success(`Order ${isDelivered ? 'marked as Completed' : 'marked as Delivered'} successfully`);
            }
        } catch (error) {
            console.error('Error updating order status:', error);
            const apiError = error as ErrorResponse;
            toast.error(apiError.message || 'Failed to update order status');
        } finally {
            setLoading(false);
        }
    };



    // Clear all filters
    const handleClearFilters = () => {
        setSearchTerm('');
        setOrderIdFilter('');
        setCustomerNameFilter('');
        setCurrentPage(1);
    };

    return (
        <div className="w-full mx-auto px-2 sm:px-3 md:px-4 py-3">
            <div className="flex flex-col gap-2 sm:gap-3 mb-4">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold" style={{ color: colors.text.primary }}>Order Management</h2>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 w-full">
                    <div className="flex flex-1 items-center w-full sm:w-auto">
                        <input
                            type="text"
                            placeholder="Search by Reference No or customer name..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="flex-1 px-3 py-2 border rounded-xl focus:outline-none text-sm sm:text-base"
                            style={{ borderColor: colors.border.light, maxWidth: 400 }}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <PrimaryButton
                            onClick={handleClearFilters}
                            style={{
                                backgroundColor: colors.secondary[500],
                                color: colors.text.white,
                                border: 'none',
                                borderRadius: '8px',
                                padding: '8px 16px',
                                fontSize: '14px'
                            }}
                        >
                            Clear Filters
                        </PrimaryButton>
                    </div>
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <PrimaryTable
                    columns={columns}
                    rows={orders}
                    loading={loading}
                    onRowClick={handleRowClick}
                    pageSizeOptions={[10, 20, 50, 100]}
                    pagination
                    paginationMode="server"
                    paginationModel={{
                        page: pagination.currentPage - 1,
                        pageSize: pageSize
                    }}
                    rowCount={pagination.totalItems}
                    height="auto" // Dynamic height based on rows
                    onPaginationModelChange={(model) => {
                        // Handle page size change
                        if (model.pageSize !== pageSize) {
                            setPageSize(model.pageSize);
                            setCurrentPage(1);
                        } else {
                            // Handle page change
                            setCurrentPage(model.page + 1);
                        }
                    }}
                    getRowClassName={(params) =>
                        params.row.complete ? 'opacity-75' : ''
                    }
                />
            </div>
        </div>
    );
}
