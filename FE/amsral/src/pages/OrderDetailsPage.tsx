import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Typography, IconButton, Card, CardContent, Chip, LinearProgress, Divider } from '@mui/material';
import { ArrowBack, Assignment, CalendarToday, Person, Inventory, LocalShipping, Description, CheckCircle, Schedule } from '@mui/icons-material';
import type { GridColDef } from '@mui/x-data-grid';
import PrimaryTable from '../components/common/PrimaryTable';
import AssignmentDetailsModal from '../components/modals/AssignmentDetailsModal';
import colors from '../styles/colors';
import { orderService, type OrderDetailsResponse, type OrderDetailsRecord } from '../services/orderService';
import { getStatusColor, getStatusLabel, isCompletedStatus } from '../utils/statusUtils';
import toast from 'react-hot-toast';

export default function OrderDetailsPage() {
    const { orderId } = useParams<{ orderId: string }>();
    const navigate = useNavigate();
    const [orderDetails, setOrderDetails] = useState<OrderDetailsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<OrderDetailsRecord | null>(null);

    // Fetch order details
    useEffect(() => {
        const fetchOrderDetails = async () => {
            if (!orderId) return;

            try {
                setLoading(true);
                const response = await orderService.getOrderDetails(parseInt(orderId));

                if (response.success) {
                    setOrderDetails(response.data);
                }
            } catch (error) {
                console.error('Error fetching order details:', error);
                toast.error('Failed to fetch order details');
            } finally {
                setLoading(false);
            }
        };

        fetchOrderDetails();
    }, [orderId]);


    // Handle open assignment modal
    const handleOpenAssignmentModal = (record: OrderDetailsRecord) => {
        setSelectedRecord(record);
        setAssignmentModalOpen(true);
    };

    // Handle close assignment modal
    const handleCloseAssignmentModal = () => {
        setAssignmentModalOpen(false);
        setSelectedRecord(null);
    };

    // Records table columns
    const recordsColumns: GridColDef[] = [
        {
            field: 'trackingNumber',
            headerName: 'Tracking No',
            flex: 0.8,
            minWidth: 80,
            renderCell: (params) => (
                <span className="font-mono font-semibold text-sm sm:text-base" style={{ color: colors.button.primary }}>
                    {params.value}
                </span>
            )
        },
        {
            field: 'itemName',
            headerName: 'Item Name',
            flex: 1,
            minWidth: 100,
            renderCell: (params) => (
                <span className="text-sm sm:text-base truncate">
                    {params.value || params.row.itemId || 'N/A'}
                </span>
            )
        },
        {
            field: 'quantity',
            headerName: 'Qty',
            flex: 0.6,
            minWidth: 60,
            type: 'number',
            renderCell: (params) => (
                <span className="font-semibold text-sm sm:text-base">{params.value}</span>
            )
        },
        {
            field: 'washType',
            headerName: 'Wash Type',
            flex: 1,
            minWidth: 100,
            renderCell: (params) => (
                <Chip
                    label={params.value}
                    size="small"
                    variant="outlined"
                    className="text-xs sm:text-sm"
                />
            )
        },
        {
            field: 'processTypes',
            headerName: 'Process Types',
            flex: 1.2,
            minWidth: 120,
            renderCell: (params) => (
                <div className="flex flex-wrap gap-1">
                    {params.value.map((type: string, index: number) => (
                        <Chip
                            key={`${params.row.id}-process-${index}`}
                            label={type}
                            size="small"
                            variant="outlined"
                            className="text-xs"
                        />
                    ))}
                </div>
            )
        },
        {
            field: 'status',
            headerName: 'Status',
            flex: 1,
            minWidth: 100,
            renderCell: (params) => {
                const statusColor = getStatusColor(params.value, 'assignment');
                const statusLabel = getStatusLabel(params.value, 'assignment');
                const isCompleted = isCompletedStatus(params.value);

                return (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
                        {isCompleted ? <CheckCircle className="w-3 h-3 mr-1" /> : <Schedule className="w-3 h-3 mr-1" />}
                        {statusLabel}
                    </span>
                );
            }
        },
        {
            field: 'stats',
            headerName: 'Progress',
            flex: 1.2,
            minWidth: 120,
            renderCell: (params) => (
                <div className="w-full">
                    <div className="flex justify-between text-xs sm:text-sm mb-1">
                        <span className="font-semibold">{params.value.completionPercentage}%</span>
                        <span className="text-gray-500">
                            {params.value.assignedQuantity}/{params.value.totalQuantity}
                        </span>
                    </div>
                    <LinearProgress
                        variant="determinate"
                        value={params.value.completionPercentage}
                        sx={{ height: 4, borderRadius: 2 }}
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Assignments: {params.value.totalAssignments}</span>
                        <span>Completed: {params.value.completedAssignments}</span>
                    </div>
                </div>
            )
        },
        {
            field: 'assignments',
            headerName: 'Actions',
            flex: 0.6,
            minWidth: 80,
            sortable: false,
            renderCell: (params) => (
                <IconButton
                    onClick={(e) => {
                        e.stopPropagation();
                        handleOpenAssignmentModal(params.row);
                    }}
                    size="small"
                    sx={{ color: colors.button.primary }}
                >
                    <Assignment className="w-4 h-4" />
                </IconButton>
            )
        },
    ];

    if (loading) {
        return (
            <div className="p-6">
                <Typography>Loading order details...</Typography>
            </div>
        );
    }

    if (!orderDetails) {
        return (
            <div className="p-6">
                <Typography color="error">Order not found</Typography>
            </div>
        );
    }

    const { order, records, overallStats } = orderDetails;

    return (
        <div className="p-3 sm:p-4 md:p-6">
            {/* Header */}
            <div className="flex items-center gap-2 sm:gap-4 mb-4 sm:mb-6">
                <IconButton
                    onClick={() => navigate('/management')}
                    sx={{ color: colors.text.secondary }}
                    size="small"
                >
                    <ArrowBack />
                </IconButton>
                <div className="min-w-0 flex-1">
                    <Typography variant="h4" className="font-bold text-gray-800 text-lg sm:text-xl md:text-2xl">
                        Order Details - {order.id}
                    </Typography>
                    <Typography variant="body1" className="text-gray-600 text-sm sm:text-base truncate">
                        Ref: {order.id} | {order.customerName}
                    </Typography>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
                <Card className="bg-gradient-to-r from-blue-50 to-blue-100">
                    <CardContent className="text-center">
                        <Typography variant="h4" className="font-bold text-blue-600 mb-1">
                            {overallStats.workCompletion.workCompletionPercentage}%
                        </Typography>
                        <Typography variant="body2" className="text-blue-700">
                            Work Complete
                        </Typography>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-r from-green-50 to-green-100">
                    <CardContent className="text-center">
                        <Typography variant="h4" className="font-bold text-green-600 mb-1">
                            {overallStats.assignmentCompleteness.assignmentCompletionPercentage}%
                        </Typography>
                        <Typography variant="body2" className="text-green-700">
                            Assignments Complete
                        </Typography>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-r from-purple-50 to-purple-100">
                    <CardContent className="text-center">
                        <Typography variant="h4" className="font-bold text-purple-600 mb-1">
                            {overallStats.recordsCount}
                        </Typography>
                        <Typography variant="body2" className="text-purple-700">
                            Total Records
                        </Typography>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-r from-orange-50 to-orange-100">
                    <CardContent className="text-center">
                        <Typography variant="h4" className="font-bold text-orange-600 mb-1">
                            {overallStats.totalAssignments}
                        </Typography>
                        <Typography variant="body2" className="text-orange-700">
                            Total Assignments
                        </Typography>
                    </CardContent>
                </Card>
            </div>

            {/* Order Information Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
                {/* Order Details */}
                <div>
                    <Card className="shadow-lg">
                        <CardContent className="p-4 sm:p-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3">
                                <Typography variant="h5" className="font-bold text-gray-800 flex items-center text-lg sm:text-xl">
                                    <Inventory className="mr-2" style={{ color: colors.button.primary }} />
                                    Order Information
                                </Typography>
                                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold ${getStatusColor(order.status, 'order')}`}>
                                    {isCompletedStatus(order.status) ? <CheckCircle className="w-4 h-4 mr-2" /> : <Schedule className="w-4 h-4 mr-2" />}
                                    {getStatusLabel(order.status, 'order')}
                                </span>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                    <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                                            <Typography variant="body2" className="font-bold text-blue-600 text-xs">
                                                REF
                                            </Typography>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <Typography variant="body2" className="text-gray-600 text-xs sm:text-sm">
                                                Reference Number
                                            </Typography>
                                            <Typography variant="h6" className="font-semibold text-gray-800 text-sm sm:text-base truncate">
                                                {order.id}
                                            </Typography>
                                        </div>
                                    </div>

                                    <div className="flex items-center p-3 bg-purple-50 rounded-lg">
                                        <Person className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 mr-3 flex-shrink-0" />
                                        <div className="min-w-0 flex-1">
                                            <Typography variant="body2" className="text-gray-600 text-xs sm:text-sm">
                                                Customer
                                            </Typography>
                                            <Typography variant="h6" className="font-semibold text-gray-800 text-sm sm:text-base truncate">
                                                {order.customerName}
                                            </Typography>
                                        </div>
                                    </div>

                                    <div className="flex items-center p-3 bg-orange-50 rounded-lg">
                                        <Inventory className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 mr-3 flex-shrink-0" />
                                        <div className="min-w-0 flex-1">
                                            <Typography variant="body2" className="text-gray-600 text-xs sm:text-sm">
                                                Quantity
                                            </Typography>
                                            <Typography variant="h6" className="font-semibold text-gray-800 text-sm sm:text-base">
                                                {order.quantity} units
                                            </Typography>
                                        </div>
                                    </div>

                                    <div className="flex items-center p-3 bg-indigo-50 rounded-lg">
                                        <CalendarToday className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 mr-3 flex-shrink-0" />
                                        <div className="min-w-0 flex-1">
                                            <Typography variant="body2" className="text-gray-600 text-xs sm:text-sm">
                                                Order Date
                                            </Typography>
                                            <Typography variant="h6" className="font-semibold text-gray-800 text-sm sm:text-base">
                                                {new Date(order.date).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                })}
                                            </Typography>
                                        </div>
                                    </div>

                                    <div className="flex items-center p-3 bg-teal-50 rounded-lg">
                                        <LocalShipping className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600 mr-3 flex-shrink-0" />
                                        <div className="min-w-0 flex-1">
                                            <Typography variant="body2" className="text-gray-600 text-xs sm:text-sm">
                                                Delivery Date
                                            </Typography>
                                            <Typography variant="h6" className="font-semibold text-gray-800 text-sm sm:text-base">
                                                {new Date(order.deliveryDate).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                })}
                                            </Typography>
                                        </div>
                                    </div>
                                </div>

                                {/* Notes Section */}
                                {order.notes && (
                                    <>
                                        <Divider className="my-4" />
                                        <div className="flex items-start p-3 sm:p-4 bg-gray-50 rounded-lg">
                                            <Description className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 mr-3 mt-0.5 flex-shrink-0" />
                                            <div className="min-w-0 flex-1">
                                                <Typography variant="body2" className="text-gray-600 mb-1 text-xs sm:text-sm">
                                                    Special Instructions
                                                </Typography>
                                                <Typography variant="body1" className="text-gray-800 text-sm sm:text-base">
                                                    {order.notes}
                                                </Typography>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Progress Overview */}
                <div>
                    <Card className="shadow-lg">
                        <CardContent className="p-4 sm:p-6">
                            <Typography variant="h5" className="font-bold text-gray-800 mb-4 sm:mb-6 flex items-center text-lg sm:text-xl">
                                <CheckCircle className="mr-2" style={{ color: colors.button.primary }} />
                                Progress Overview
                            </Typography>

                            {/* Work Completion Progress */}
                            <div className="mb-4 sm:mb-6">
                                <div className="flex justify-between mb-2">
                                    <span className="text-gray-600 text-sm sm:text-base">Work Completion</span>
                                    <span className="font-bold text-lg sm:text-xl">{overallStats.workCompletion.workCompletionPercentage}%</span>
                                </div>
                                <LinearProgress
                                    variant="determinate"
                                    value={overallStats.workCompletion.workCompletionPercentage}
                                    sx={{ height: 10, borderRadius: 5 }}
                                />
                                <div className="text-xs sm:text-sm text-gray-500 mt-2">
                                    {overallStats.workCompletion.completedQuantity}/{overallStats.workCompletion.totalQuantity} units completed
                                </div>
                            </div>

                            {/* Assignment Completion Progress */}
                            <div className="mb-4 sm:mb-6">
                                <div className="flex justify-between mb-2">
                                    <span className="text-gray-600 text-sm sm:text-base">Assignment Completion</span>
                                    <span className="font-bold text-lg sm:text-xl">{overallStats.assignmentCompleteness.assignmentCompletionPercentage}%</span>
                                </div>
                                <LinearProgress
                                    variant="determinate"
                                    value={overallStats.assignmentCompleteness.assignmentCompletionPercentage}
                                    sx={{ height: 10, borderRadius: 5 }}
                                />
                                <div className="text-xs sm:text-sm text-gray-500 mt-2">
                                    {overallStats.assignmentCompleteness.completedAssignments}/{overallStats.assignmentCompleteness.totalAssignments} assignments completed
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 gap-3 sm:gap-4">
                                <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-lg">
                                    <div className="text-xl sm:text-2xl font-bold text-blue-600">{overallStats.recordsCount}</div>
                                    <div className="text-xs sm:text-sm text-blue-700 font-medium">Total Records</div>
                                </div>
                                <div className="text-center p-3 sm:p-4 bg-green-50 rounded-lg">
                                    <div className="text-xl sm:text-2xl font-bold text-green-600">{overallStats.completeRecordsCount}</div>
                                    <div className="text-xs sm:text-sm text-green-700 font-medium">Complete Records</div>
                                </div>
                                <div className="text-center p-3 sm:p-4 bg-yellow-50 rounded-lg">
                                    <div className="text-xl sm:text-2xl font-bold text-yellow-600">{overallStats.assignmentCompleteness.inProgressAssignments}</div>
                                    <div className="text-xs sm:text-sm text-yellow-700 font-medium">In Progress</div>
                                </div>
                                <div className="text-center p-3 sm:p-4 bg-purple-50 rounded-lg">
                                    <div className="text-xl sm:text-2xl font-bold text-purple-600">{overallStats.assignmentCompleteness.completedAssignments}</div>
                                    <div className="text-xs sm:text-sm text-purple-700 font-medium">Completed</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>


            {/* Records Table */}
            <Card>
                <CardContent className="p-4 sm:p-6">
                    <Typography variant="h6" className="font-semibold mb-4 text-lg sm:text-xl">
                        Order Records ({records.length})
                    </Typography>
                    <div className="overflow-x-auto">
                        <PrimaryTable
                            columns={recordsColumns}
                            rows={records}
                            loading={loading}
                            pageSizeOptions={[10, 20, 50, 100]}
                            pagination
                            getRowClassName={(params) =>
                                params.row.complete ? 'opacity-75' : ''
                            }
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Assignment Details Modal */}
            <AssignmentDetailsModal
                open={assignmentModalOpen}
                onClose={handleCloseAssignmentModal}
                record={selectedRecord}
            />
        </div>
    );
}
