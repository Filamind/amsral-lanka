import { useEffect } from 'react';
import {
    Modal,
    Box,
    Typography,
    IconButton,
    Card,
    CardContent,
    Chip,
    LinearProgress,
    Divider,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper
} from '@mui/material';
import { Close, Person, Inventory, Schedule, CheckCircle } from '@mui/icons-material';
import colors from '../../styles/colors';
import { type OrderDetailsRecord } from '../../services/orderService';

interface AssignmentDetailsModalProps {
    open: boolean;
    onClose: () => void;
    record: OrderDetailsRecord | null;
}

export default function AssignmentDetailsModal({ open, onClose, record }: AssignmentDetailsModalProps) {

    // Handle escape key press
    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && open) {
                onClose();
            }
        };

        if (open) {
            document.addEventListener('keydown', handleEscape);
            return () => document.removeEventListener('keydown', handleEscape);
        }
    }, [open, onClose]);

    if (!record) return null;

    const { assignments, stats } = record;

    return (
        <Modal
            open={open}
            onClose={onClose}
            aria-labelledby="assignment-details-modal"
            disableEscapeKeyDown={false}
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                p: 1
            }}
        >
            <Box
                sx={{
                    width: { xs: '95%', sm: '90%', md: '85%' },
                    maxWidth: '1200px',
                    maxHeight: '95vh',
                    bgcolor: 'background.paper',
                    borderRadius: 2,
                    boxShadow: 24,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                {/* Header */}
                <Box
                    sx={{
                        p: { xs: 1.5, sm: 2 },
                        borderBottom: 1,
                        borderColor: 'divider',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        bgcolor: colors.gradients.primaryBlue,
                        color: 'white',
                        minHeight: '60px'
                    }}
                >
                    <Typography variant="h6" className="font-bold flex items-center text-base sm:text-lg">
                        <Inventory className="mr-2" />
                        Assignment Details - {record.trackingNumber}
                    </Typography>
                    <IconButton
                        onClick={onClose}
                        sx={{
                            color: '#1f2937', // Dark gray color for better contrast
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            '&:hover': {
                                backgroundColor: 'rgba(255, 255, 255, 1)',
                                transform: 'scale(1.1)',
                                color: '#111827' // Even darker on hover
                            },
                            transition: 'all 0.2s ease-in-out',
                            border: '2px solid rgba(255, 255, 255, 0.8)',
                            width: '40px',
                            height: '40px',
                            minWidth: '40px',
                            minHeight: '40px',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
                        }}
                        size="large"
                        title="Close modal"
                    >
                        <Close sx={{
                            fontSize: '24px',
                            fontWeight: 'bold',
                            color: '#1f2937'
                        }} />
                    </IconButton>
                </Box>

                {/* Content */}
                <Box sx={{ p: { xs: 1.5, sm: 2 }, overflow: 'auto', flex: 1 }}>
                    {/* Record Information */}
                    <Card className="mb-3 shadow-sm">
                        <CardContent className="p-3 sm:p-4">
                            <Typography variant="h6" className="font-semibold mb-3 flex items-center text-base sm:text-lg">
                                <Inventory className="mr-2" style={{ color: colors.button.primary }} />
                                Record Information
                            </Typography>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                                <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                                        <Typography variant="body2" className="font-bold text-blue-600 text-xs sm:text-sm">
                                            {record.orderId}
                                        </Typography>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <Typography variant="body2" className="text-gray-600 text-xs sm:text-sm">
                                            Reference Number
                                        </Typography>
                                        <Typography variant="h6" className="font-semibold text-gray-800 text-sm sm:text-base truncate">
                                            {record.orderId}
                                        </Typography>
                                    </div>
                                </div>

                                <div className="flex items-center p-3 bg-indigo-50 rounded-lg">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                                        <Typography variant="body2" className="font-bold text-indigo-600 text-xs sm:text-sm">
                                            {record.trackingNumber}
                                        </Typography>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <Typography variant="body2" className="text-gray-600 text-xs sm:text-sm">
                                            Tracking Number
                                        </Typography>
                                        <Typography variant="h6" className="font-semibold text-gray-800 text-sm sm:text-base truncate">
                                            {record.trackingNumber}
                                        </Typography>
                                    </div>
                                </div>

                                <div className="flex items-center p-3 bg-green-50 rounded-lg">
                                    <Inventory className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 mr-3 flex-shrink-0" />
                                    <div className="min-w-0 flex-1">
                                        <Typography variant="body2" className="text-gray-600 text-xs sm:text-sm">
                                            Item ID
                                        </Typography>
                                        <Typography variant="h6" className="font-semibold text-gray-800 text-sm sm:text-base truncate">
                                            {record.itemId}
                                        </Typography>
                                    </div>
                                </div>

                                <div className="flex items-center p-3 bg-purple-50 rounded-lg">
                                    <Inventory className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 mr-3 flex-shrink-0" />
                                    <div className="min-w-0 flex-1">
                                        <Typography variant="body2" className="text-gray-600 text-xs sm:text-sm">
                                            Quantity
                                        </Typography>
                                        <Typography variant="h6" className="font-semibold text-gray-800 text-sm sm:text-base">
                                            {record.quantity} units
                                        </Typography>
                                    </div>
                                </div>

                                <div className="flex items-center p-3 bg-orange-50 rounded-lg">
                                    <Inventory className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 mr-3 flex-shrink-0" />
                                    <div className="min-w-0 flex-1">
                                        <Typography variant="body2" className="text-gray-600 text-xs sm:text-sm">
                                            Wash Type
                                        </Typography>
                                        <Typography variant="h6" className="font-semibold text-gray-800 text-sm sm:text-base">
                                            {record.washType}
                                        </Typography>
                                    </div>
                                </div>

                                <div className="flex items-start p-3 bg-indigo-50 rounded-lg sm:col-span-2">
                                    <Inventory className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 mr-3 mt-1 flex-shrink-0" />
                                    <div className="min-w-0 flex-1">
                                        <Typography variant="body2" className="text-gray-600 text-xs sm:text-sm mb-2">
                                            Process Types
                                        </Typography>
                                        <div className="flex flex-wrap gap-1">
                                            {record.processTypes.map((type, index) => (
                                                <Chip
                                                    key={`${record.id}-process-${index}`}
                                                    label={type}
                                                    size="small"
                                                    variant="outlined"
                                                    className="text-xs"
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center p-3 bg-teal-50 rounded-lg">
                                    <Chip
                                        icon={record.complete ? <CheckCircle /> : <Schedule />}
                                        label={record.status}
                                        color={
                                            record.status === 'Completed' ? 'success' :
                                                record.status === 'In Progress' ? 'warning' :
                                                    record.status === 'Pending' ? 'info' : 'default'
                                        }
                                        size="small"
                                        className="font-semibold text-xs sm:text-sm"
                                    />
                                </div>
                            </div>

                            {/* Progress Section */}
                            <Divider className="my-3" />
                            <div className="space-y-3">
                                <Typography variant="h6" className="font-semibold text-base sm:text-lg">
                                    Progress Overview
                                </Typography>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                                    <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-lg">
                                        <div className="text-xl sm:text-2xl font-bold text-blue-600">{stats.completionPercentage}%</div>
                                        <div className="text-xs sm:text-sm text-blue-700">Completion</div>
                                    </div>
                                    <div className="text-center p-3 sm:p-4 bg-green-50 rounded-lg">
                                        <div className="text-xl sm:text-2xl font-bold text-green-600">{stats.assignedQuantity}</div>
                                        <div className="text-xs sm:text-sm text-green-700">Assigned</div>
                                    </div>
                                    <div className="text-center p-3 sm:p-4 bg-orange-50 rounded-lg">
                                        <div className="text-xl sm:text-2xl font-bold text-orange-600">{stats.remainingQuantity}</div>
                                        <div className="text-xs sm:text-sm text-orange-700">Remaining</div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div>
                                        <div className="flex justify-between mb-2">
                                            <span className="text-gray-600 text-sm sm:text-base">Work Progress</span>
                                            <span className="font-semibold text-sm sm:text-base">{stats.completionPercentage}%</span>
                                        </div>
                                        <LinearProgress
                                            variant="determinate"
                                            value={stats.completionPercentage}
                                            sx={{ height: 6, borderRadius: 3 }}
                                        />
                                        <div className="text-xs sm:text-sm text-gray-500 mt-1">
                                            {stats.assignedQuantity}/{stats.totalQuantity} units assigned
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Assignments Table */}
                    <Card className="shadow-sm">
                        <CardContent className="p-3 sm:p-4">
                            <Typography variant="h6" className="font-semibold mb-3 flex items-center text-base sm:text-lg">
                                <Person className="mr-2" style={{ color: colors.button.primary }} />
                                Assignments ({assignments.length})
                            </Typography>

                            {assignments.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <TableContainer component={Paper} variant="outlined">
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow sx={{ bgcolor: 'grey.50' }}>
                                                    <TableCell className="font-semibold text-xs sm:text-sm">Tracking No</TableCell>
                                                    <TableCell className="font-semibold text-xs sm:text-sm">Assigned To</TableCell>
                                                    <TableCell className="font-semibold text-xs sm:text-sm">Qty</TableCell>
                                                    <TableCell className="font-semibold text-xs sm:text-sm hidden sm:table-cell">Washing Machine</TableCell>
                                                    <TableCell className="font-semibold text-xs sm:text-sm hidden sm:table-cell">Drying Machine</TableCell>
                                                    <TableCell className="font-semibold text-xs sm:text-sm">Status</TableCell>
                                                    <TableCell className="font-semibold text-xs sm:text-sm hidden md:table-cell">Assigned At</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {assignments.map((assignment) => (
                                                    <TableRow key={assignment.id} hover>
                                                        <TableCell>
                                                            <span className="font-mono font-semibold text-xs sm:text-sm" style={{ color: colors.button.primary }}>
                                                                {assignment.trackingNumber}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell className="font-medium text-xs sm:text-sm truncate max-w-[120px]">
                                                            {assignment.assignedTo}
                                                        </TableCell>
                                                        <TableCell className="text-xs sm:text-sm">{assignment.quantity}</TableCell>
                                                        <TableCell className="text-xs sm:text-sm hidden sm:table-cell">{assignment.washingMachine}</TableCell>
                                                        <TableCell className="text-xs sm:text-sm hidden sm:table-cell">{assignment.dryingMachine}</TableCell>
                                                        <TableCell>
                                                            <Chip
                                                                label={assignment.status}
                                                                color={
                                                                    assignment.status === 'Completed' ? 'success' :
                                                                        assignment.status === 'In Progress' ? 'warning' :
                                                                            assignment.status === 'Pending' ? 'info' : 'default'
                                                                }
                                                                size="small"
                                                                className="text-xs"
                                                            />
                                                        </TableCell>
                                                        <TableCell className="text-xs sm:text-sm hidden md:table-cell">
                                                            {new Date(assignment.assignedAt).toLocaleDateString('en-US', {
                                                                month: 'short',
                                                                day: 'numeric',
                                                                year: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <Person className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                                    <Typography variant="body1">No assignments found</Typography>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </Box>
            </Box>
        </Modal>
    );
}
