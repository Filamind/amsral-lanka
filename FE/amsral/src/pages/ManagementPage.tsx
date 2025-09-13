/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, IconButton, TextField, InputAdornment } from '@mui/material';
import { Search, FilterList, Print } from '@mui/icons-material';
import type { GridColDef } from '@mui/x-data-grid';
import PrimaryTable from '../components/common/PrimaryTable';
import PrimaryDropdown from '../components/common/PrimaryDropdown';
import PrimaryButton from '../components/common/PrimaryButton';
import colors from '../styles/colors';
import { orderService, type ManagementOrder, type OrderStatus, type OrderSummaryData } from '../services/orderService';
import { generateGatepass, type GatepassData } from '../utils/pdfUtils';
import toast from 'react-hot-toast';


export default function ManagementPage() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState<ManagementOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [orderIdFilter, setOrderIdFilter] = useState('');
    const [customerNameFilter, setCustomerNameFilter] = useState('');

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
            headerName: 'Reference No',
            flex: 1,
            minWidth: 120,
            renderCell: (params) => (
                <span className="font-mono font-semibold" style={{ color: colors.button.primary }}>
                    {params.value}
                </span>
            )
        },
        { field: 'customerName', headerName: 'Customer', flex: 1.2, minWidth: 150 },
        { field: 'quantity', headerName: 'Quantity', flex: 0.8, minWidth: 100, type: 'number' },
        { field: 'date', headerName: 'Order Date', flex: 1, minWidth: 120 },
        { field: 'deliveryDate', headerName: 'Delivery Date', flex: 1, minWidth: 120 },
        {
            field: 'status',
            headerName: 'Status',
            flex: 1,
            minWidth: 120,
            renderCell: (params) => (
                <span
                    className={`px-3 py-1 rounded-xl text-sm font-semibold ${params.value === 'Completed'
                        ? 'bg-green-100 text-green-800'
                        : params.value === 'In Progress'
                            ? 'bg-yellow-100 text-yellow-800'
                            : params.value === 'Pending'
                                ? 'bg-blue-100 text-blue-800'
                                : params.value === 'Confirmed'
                                    ? 'bg-purple-100 text-purple-800'
                                    : params.value === 'Processing'
                                        ? 'bg-orange-100 text-orange-800'
                                        : params.value === 'Delivered'
                                            ? 'bg-gray-100 text-gray-800'
                                            : 'bg-gray-100 text-gray-800'
                        }`}
                >
                    {params.value}
                </span>
            )
        },
        { field: 'recordsCount', headerName: 'Records', flex: 0.6, minWidth: 80, type: 'number' },
        {
            field: 'print',
            headerName: 'Print',
            flex: 0.5,
            minWidth: 80,
            sortable: false,
            renderCell: (params) => (
                <IconButton
                    onClick={(e) => {
                        e.stopPropagation();
                        handlePrintOrder(params.row);
                    }}
                    size="small"
                    sx={{ color: colors.button.primary }}
                >
                    <Print />
                </IconButton>
            )
        },
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

    // Handle print gatepass
    const handlePrintOrder = async (order: ManagementOrder) => {
        try {
            // Fetch order summary data
            const response = await orderService.getOrderSummary(order.id);

            if (response.success) {
                const gatepassData: GatepassData = {
                    id: response.data.id,
                    customerName: response.data.customerName,
                    orderDate: response.data.orderDate,
                    totalQuantity: response.data.totalQuantity,
                    createdDate: response.data.createdDate,
                    referenceNo: response.data.referenceNo,
                    deliveryDate: response.data.deliveryDate,
                    status: response.data.status,
                    notes: response.data.notes,
                    records: response.data.records
                };

                generateGatepass(gatepassData);
                toast.success('Gatepass downloaded successfully!');
            } else {
                toast.error('Failed to fetch order details');
            }
        } catch (error) {
            console.error('Error generating gatepass:', error);
            toast.error('Failed to generate gatepass');
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
        <div className="p-6">
            <div className="mb-6">
                <Typography variant="h4" className="font-bold text-gray-800 mb-2">
                    Order Management
                </Typography>
                <Typography variant="body1" className="text-gray-600">
                    Manage and track all orders with detailed information and status updates.
                </Typography>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex items-center gap-4 mb-4">
                    <FilterList className="text-gray-500" />
                    <Typography variant="h6" className="font-semibold text-gray-700">
                        Filters
                    </Typography>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Search */}
                    <div className="flex flex-col">
                        <label className="block text-sm font-medium mb-2">Search</label>
                        <TextField
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Order ID or Customer Name"
                            size="small"
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Search />
                                    </InputAdornment>
                                ),
                            }}
                            className="w-full"
                        />
                    </div>

                    {/* Clear Filters Button */}
                    <div className="flex items-end">
                        <PrimaryButton
                            onClick={handleClearFilters}
                            variant="outlined"
                            className="w-full"
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
                    pageSizeOptions={[5, 10, 20, 50]}
                    pagination
                    paginationMode="server"
                    paginationModel={{
                        page: pagination.currentPage - 1,
                        pageSize: pageSize
                    }}
                    rowCount={pagination.totalItems}
                    height={600}
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
