import { useState, useEffect } from 'react';
import {
    Box,
    Chip,
    CircularProgress,
    Alert
} from '@mui/material';
import { type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import colors from '../styles/colors';
import PrimaryTable from '../components/common/PrimaryTable';
import QCModal from '../components/modals/QCModal';
import { orderService, type OrderStatus } from '../services/orderService';

// QCModal will be implemented later

interface CompletedOrder {
    id: number;
    customerName: string;
    quantity: number;
    returnQuantity?: number;
    deliveryQuantity?: number;
    date: string;
    deliveryDate: string;
    status: string;
    billingStatus?: string;
    createdAt: string;
    updatedAt: string;
}

export default function QCPage() {
    const [orders, setOrders] = useState<CompletedOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedOrder, setSelectedOrder] = useState<CompletedOrder | null>(null);
    const [qcModalOpen, setQcModalOpen] = useState(false);

    useEffect(() => {
        fetchCompletedOrders();
    }, []);

    const fetchCompletedOrders = async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch orders with completed status filter using URL parameters
            // This will call: GET /api/orders?status=Complete
            const response = await orderService.getManagementOrders({
                status: 'Complete' as OrderStatus
            });

            setOrders(response.data?.orders || []);
        } catch (err) {
            console.error('Error fetching completed orders:', err);
            setError('Failed to fetch completed orders');
        } finally {
            setLoading(false);
        }
    };

    const handleRowClick = (params: { row: CompletedOrder }) => {
        setSelectedOrder(params.row);
        setQcModalOpen(true);
    };

    const handleCloseQCModal = () => {
        setQcModalOpen(false);
        setSelectedOrder(null);
    };

    const handleSaveDamageCounts = async (damageCounts: { [recordId: number]: number }) => {
        try {
            if (!selectedOrder) {
                console.error('No selected order');
                return;
            }

            // Call the API to save damage records
            await orderService.saveDamageRecords(selectedOrder.id, damageCounts);

            console.log('Damage records saved successfully:', damageCounts);

            // Refresh the orders list
            await fetchCompletedOrders();
            setQcModalOpen(false);
            setSelectedOrder(null);
        } catch (err) {
            console.error('Error saving damage counts:', err);
        }
    };


    const columns: GridColDef[] = [
        {
            field: 'id',
            headerName: 'Ref No',
            flex: 0.8,
            minWidth: 80,
            renderCell: (params: GridRenderCellParams) => (
                <span className="font-mono font-semibold text-xs sm:text-sm" style={{ color: colors.button.primary }}>
                    {params.value}
                </span>
            )
        },
        { field: 'customerName', headerName: 'Customer', flex: 1.2, minWidth: 120 },
        { field: 'quantity', headerName: 'Qty', flex: 0.6, minWidth: 60, type: 'number' },
        { field: 'returnQuantity', headerName: 'R.Qty', flex: 0.6, minWidth: 60, type: 'number' },
        { field: 'date', headerName: 'Order Date', flex: 1, minWidth: 100 },
        { field: 'deliveryDate', headerName: 'Delivery Date', flex: 1, minWidth: 100 },
        {
            field: 'status',
            headerName: 'Status',
            flex: 1,
            minWidth: 100,
            renderCell: () => {
                return (
                    <Chip
                        icon={<CheckCircleIcon />}
                        label="Completed"
                        size="small"
                        sx={{
                            backgroundColor: '#10B981',
                            color: 'white',
                            fontWeight: 600,
                            '& .MuiChip-icon': {
                                color: 'white'
                            }
                        }}
                    />
                );
            }
        },
    ];

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">{error}</Alert>
            </Box>
        );
    }

    return (
        <div className="w-full mx-auto px-1 sm:px-3 md:px-4 py-3">
            <div className="flex flex-col gap-2 sm:gap-3 mb-4">
                <h2 className="text-xl md:text-2xl font-bold" style={{ color: colors.text.primary }}>Quality Control</h2>
                <p className="text-sm sm:text-base" style={{ color: colors.text.secondary }}>
                    Review completed orders and record damage counts
                </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <PrimaryTable
                    columns={columns}
                    rows={orders}
                    loading={loading}
                    onRowClick={handleRowClick}
                    pageSizeOptions={[10, 25, 50]}
                    pagination
                    height="auto"
                />
            </div>

            {selectedOrder && (
                <QCModal
                    open={qcModalOpen}
                    onClose={handleCloseQCModal}
                    order={selectedOrder}
                    onSave={handleSaveDamageCounts}
                />
            )}
        </div>
    );
}
