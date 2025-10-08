/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom'; // Commented out - navigation disabled as per client request
import { IconButton } from '@mui/material';
import { LocalShipping } from '@mui/icons-material';
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import PrimaryTable from '../components/common/PrimaryTable';
import PrimaryButton from '../components/common/PrimaryButton';
import DeliveryModal from '../components/modals/DeliveryModal';
import colors from '../styles/colors';
import { useManagementOrders, useUpdateDelivery, type ManagementOrderFilters } from '../hooks/useManagement';
import { type ManagementOrder } from '../services/orderService';
import { getStatusColor, getStatusLabel, normalizeStatus } from '../utils/statusUtils';
import { useAuth } from '../hooks/useAuth';
import { hasPermission } from '../utils/roleUtils';


export default function ManagementPage() {
    // const navigate = useNavigate(); // Commented out - navigation disabled as per client request
    const { user } = useAuth();

    // Local state for UI
    const [searchTerm, setSearchTerm] = useState('');
    const [orderIdFilter, setOrderIdFilter] = useState('');
    const [customerNameFilter, setCustomerNameFilter] = useState('');
    const [deliveryModal, setDeliveryModal] = useState({
        open: false,
        order: null as ManagementOrder | null,
    });

    // Pagination state
    const [pageSize, setPageSize] = useState(20); // Default to 20 rows per page
    const [currentPage, setCurrentPage] = useState(1);

    // Permission checks
    const canMarkDelivered = hasPermission(user, 'canMarkDelivered');

    // Prepare filters for TanStack Query hooks
    // Only show orders with status "Complete" or "QC" as per client request
    const orderFilters: ManagementOrderFilters = {
        page: currentPage,
        limit: pageSize,
        orderId: orderIdFilter ? parseInt(orderIdFilter) : undefined,
        customerName: customerNameFilter || undefined,
        status: 'Complete,QC', // Filter to show only Complete or QC orders
    };

    // TanStack Query hooks
    const {
        data: ordersData,
        isLoading: loading,
    } = useManagementOrders(orderFilters);

    // Mutation hooks
    const updateDeliveryMutation = useUpdateDelivery();

    // Derived state
    const orders = ordersData?.orders || [];
    const pagination = ordersData?.pagination || {
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 20,
        hasNextPage: false,
        hasPrevPage: false
    };

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
        { field: 'returnQuantity', headerName: 'Qty', flex: 0.6, minWidth: 60, type: 'number' },
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
            field: 'delivery',
            headerName: 'Delivery',
            flex: 0.5,
            minWidth: 80,
            sortable: false,
            renderCell: (params: GridRenderCellParams) => {
                const isDelivered = (params.row.status || '').toLowerCase() === 'delivered';
                return (
                    <IconButton
                        onClick={(e) => {
                            e.stopPropagation();
                            setDeliveryModal({
                                open: true,
                                order: params.row
                            });
                        }}
                        size="small"
                        sx={{
                            color: isDelivered ? colors.button.primary : colors.text.secondary
                        }}
                        title="Update Delivery Status"
                        disabled={loading}
                    >
                        <LocalShipping />
                    </IconButton>
                );
            }
        }] : []),
    ];

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

    // Handle row click to navigate to order details - Commented out as per client request
    // const handleRowClick = (params: any) => {
    //     navigate(`/management/orders/${params.id}`);
    // };

    // Handle opening delivery modal

    const handleCloseDeliveryModal = () => {
        setDeliveryModal({
            open: false,
            order: null
        });
    };

    const handleUpdateDelivery = async (orderId: number, deliveryCount: number, isDelivered: boolean) => {
        updateDeliveryMutation.mutate(
            { orderId, deliveryCount, isDelivered },
            {
                onSuccess: () => {
                    setDeliveryModal({
                        open: false,
                        order: null
                    });
                },
                onError: (error: Error) => {
                    console.error('Error updating delivery status:', error);
                    throw error; // Re-throw to let the modal handle the error
                }
            }
        );
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
                <h2 className="text-xl md:text-2xl font-bold" style={{ color: colors.text.primary }}>Delivery</h2>
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
                    // onRowClick={handleRowClick} // Commented out - navigation to order details disabled as per client request
                    pageSizeOptions={[10, 20, 50, 100]}
                    pagination
                    paginationMode="server"
                    paginationModel={{
                        page: pagination.currentPage - 1,
                        pageSize: pageSize
                    }}
                    rowCount={(pagination as any).totalRecords || (pagination as any).totalItems || 0}
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

            {/* Delivery Modal */}
            <DeliveryModal
                open={deliveryModal.open}
                onClose={handleCloseDeliveryModal}
                order={deliveryModal.order}
                onUpdate={handleUpdateDelivery}
                loading={loading}
            />
        </div>
    );
}
