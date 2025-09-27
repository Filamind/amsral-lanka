import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Typography, IconButton, Menu, MenuItem, Fab, Tooltip } from '@mui/material';
import { ArrowBack, MoreVert, RadioButtonUnchecked, Print, PrintOutlined, PrintDisabled, AssignmentTurnedIn } from '@mui/icons-material';
import type { GridColDef } from '@mui/x-data-grid';
import PrimaryButton from '../components/common/PrimaryButton';
import PrimaryTable from '../components/common/PrimaryTable';
import ConfirmationDialog from '../components/common/ConfirmationDialog';
import CompletionStatusModal from '../components/modals/CompletionStatusModal';
import MachineAssignmentModal from '../components/modals/MachineAssignmentModal';
import colors from '../styles/colors';
import EmployeeService, { type Employee } from '../services/employeeService';
import recordService, { type ProcessRecord, type MachineAssignment } from '../services/recordService';
import machineService, { type Machine } from '../services/machineService';
import { generateAssignmentReceipt, type AssignmentReceiptData } from '../utils/pdfUtils';
import { usePrinter } from '../context/PrinterContext';
import printerService from '../services/printerService';
import { useAuth } from '../hooks/useAuth';
import { hasPermission } from '../utils/roleUtils';
import { getStatusColor, getStatusLabel, normalizeStatus } from '../utils/statusUtils';
import toast from 'react-hot-toast';

// Types are now imported from services

// Machine options will be fetched from API

export default function RecordAssignmentsPage() {
    const { recordId } = useParams<{ recordId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { isConnected, isConnecting, connect } = usePrinter();
    const [record, setRecord] = useState<ProcessRecord | null>(null);
    const [assignments, setAssignments] = useState<MachineAssignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);

    // Permission checks
    const canEdit = hasPermission(user, 'canEdit');
    const canDelete = hasPermission(user, 'canDelete');
    const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
    const [selectedAssignment, setSelectedAssignment] = useState<MachineAssignment | null>(null);
    const [confirmDialog, setConfirmDialog] = useState({
        open: false,
        title: '',
        message: '',
        confirmText: 'Confirm',
        onConfirm: () => { },
    });
    const [completionModal, setCompletionModal] = useState({
        open: false,
        assignment: null as MachineAssignment | null,
    });

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

    // Dropdown options
    const [employeeOptions, setEmployeeOptions] = useState<{ value: string; label: string }[]>([]);
    const [washingMachineOptions, setWashingMachineOptions] = useState<{ value: string; label: string }[]>([]);
    const [dryingMachineOptions, setDryingMachineOptions] = useState<{ value: string; label: string }[]>([]);

    // Table columns
    const assignmentsColumns: GridColDef[] = [
        {
            field: 'trackingNumber',
            headerName: 'Tracking No',
            flex: 0.8,
            minWidth: 100,
            renderCell: (params) => (
                <span className="font-mono font-semibold" style={{ color: colors.button.primary }}>
                    {params.row.trackingNumber || 'N/A'}
                </span>
            )
        },
        { field: 'assignedTo', headerName: 'Assign To', flex: 1.2, minWidth: 120 },
        { field: 'quantity', headerName: 'Assigned Qty', flex: 0.8, minWidth: 100, type: 'number' },
        {
            field: 'returnQuantity',
            headerName: 'Return Qty',
            flex: 0.8,
            minWidth: 100,
            type: 'number',
            renderCell: (params) => (
                <span style={{
                    color: params.value < params.row.quantity ? '#f57c00' : colors.text.primary,
                    fontWeight: params.value < params.row.quantity ? 600 : 'normal'
                }}>
                    {params.value || 0}
                </span>
            )
        },
        { field: 'washingMachine', headerName: 'WM', flex: 1, minWidth: 80 },
        { field: 'dryingMachine', headerName: 'DM', flex: 1, minWidth: 80 },
        {
            field: 'assignedAt',
            headerName: 'Assigned At',
            flex: 1.5,
            minWidth: 150,
            renderCell: (params) => {
                const date = new Date(params.value);
                const formattedDate = date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                });
                const formattedTime = date.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                });
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                        <span style={{ fontWeight: 500, color: colors.text.primary }}>
                            {formattedDate}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: colors.text.secondary }}>
                            {formattedTime}
                        </span>
                    </div>
                );
            }
        },
        {
            field: 'status',
            headerName: 'Status',
            flex: 1,
            minWidth: 120,
            renderCell: (params) => {
                const status = params.value || 'Pending';
                const normalizedStatus = normalizeStatus(status, 'assignment');
                const statusColor = getStatusColor(normalizedStatus, 'assignment');
                const statusLabel = getStatusLabel(normalizedStatus, 'assignment');

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
            field: 'completion',
            headerName: 'Complete',
            flex: 0.5,
            minWidth: 80,
            sortable: false,
            renderCell: (params) => (
                <IconButton
                    onClick={(e) => {
                        e.stopPropagation();
                        setCompletionModal({
                            open: true,
                            assignment: params.row
                        });
                    }}
                    size="small"
                    sx={{
                        color: params.row.status === 'Completed' ? colors.button.primary : colors.text.secondary
                    }}
                    title={params.row.status === 'Completed' ? 'Update completion status' : 'Mark as completed'}
                >
                    {params.row.status === 'Completed' ? <AssignmentTurnedIn /> : <RadioButtonUnchecked />}
                </IconButton>
            )
        },
        {
            field: 'print',
            headerName: 'Print',
            flex: 0.5,
            minWidth: 80,
            sortable: false,
            renderCell: (params) => {
                return (
                    <IconButton
                        onClick={(e) => {
                            e.stopPropagation();
                            handlePrintAssignmentDirect(params.row);
                        }}
                        size="small"
                        sx={{
                            color: isConnected ? colors.button.primary : colors.text.muted,
                            opacity: isConnected ? 1 : 0.5
                        }}
                        title={isConnected ? "Print to Thermal Printer" : "Printer not connected"}
                        disabled={!isConnected}
                    >
                        <Print />
                    </IconButton>
                );
            }
        },
        {
            field: 'actions',
            headerName: 'Actions',
            flex: 0.5,
            minWidth: 80,
            sortable: false,
            renderCell: (params) => {
                // Only show actions menu if user has edit or delete permissions
                if (!canEdit && !canDelete) {
                    return null;
                }

                return (
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
                );
            }
        },
    ];


    // Fetch record details and assignments
    const fetchRecordDetails = useCallback(async () => {
        if (!recordId) return;

        try {
            setLoading(true);

            // Fetch record details
            const recordData = await recordService.getRecord(recordId);
            setRecord(recordData);

            // Fetch assignments with pagination
            const assignmentsResponse = await recordService.getRecordAssignments(recordId, {
                page: currentPage,
                limit: pageSize
            });
            setAssignments(assignmentsResponse.data.assignments);

            // Update pagination info
            setPagination({
                currentPage: assignmentsResponse.data.pagination?.currentPage || 1,
                totalPages: assignmentsResponse.data.pagination?.totalPages || 1,
                totalItems: assignmentsResponse.data.pagination?.totalRecords || assignmentsResponse.data.assignments.length,
                itemsPerPage: assignmentsResponse.data.pagination?.limit || pageSize,
                hasNextPage: (assignmentsResponse.data.pagination?.currentPage || 1) < (assignmentsResponse.data.pagination?.totalPages || 1),
                hasPrevPage: (assignmentsResponse.data.pagination?.currentPage || 1) > 1
            });

        } catch (error) {
            console.error('Error fetching record details:', error);
            toast.error('Failed to fetch record details');
        } finally {
            setLoading(false);
        }
    }, [recordId, currentPage, pageSize]);

    // Fetch dropdown options
    const fetchDropdownOptions = useCallback(async () => {
        try {
            // Fetch employees
            const employeesResponse = await EmployeeService.getAllEmployees({
                limit: 100,
                isActive: true
            });
            const employeeOpts = employeesResponse.employees.map((employee: Employee) => ({
                value: employee.id?.toString() || '',
                label: `${employee.firstName} ${employee.lastName}`
            }));
            setEmployeeOptions(employeeOpts);

            // Fetch washing machines
            const washingMachines = await machineService.getWashingMachines();
            const washingMachineOpts = washingMachines.map((machine: Machine) => ({
                value: machine.id,
                label: machine.name
            }));
            setWashingMachineOptions(washingMachineOpts);

            // Fetch drying machines
            const dryingMachines = await machineService.getDryingMachines();
            const dryingMachineOpts = dryingMachines.map((machine: Machine) => ({
                value: machine.id,
                label: machine.name
            }));
            setDryingMachineOptions(dryingMachineOpts);

        } catch (error) {
            console.error('Error fetching dropdown options:', error);
            toast.error('Failed to load options');
        }
    }, []);

    // Load data on component mount
    useEffect(() => {
        const loadData = async () => {
            await fetchDropdownOptions();
            await fetchRecordDetails();
        };
        loadData();
    }, [fetchDropdownOptions, fetchRecordDetails]);

    // Pagination handlers
    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
    };

    const handlePageSizeChange = (newPageSize: number) => {
        setPageSize(newPageSize);
        setCurrentPage(1); // Reset to first page when page size changes
    };

    const handleOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const handleSubmit = async (data: {
        assignedBy: string;
        quantity: number;
        washingMachine?: string;
        dryingMachine?: string;
    }) => {
        if (!record || !recordId) return;

        try {
            setSaving(true);

            // Create assignment via API
            const assignmentData = {
                assignedById: data.assignedBy,
                quantity: data.quantity,
                washingMachine: data.washingMachine || '',
                dryingMachine: data.dryingMachine || '',
                orderId: record.orderId,
                itemId: record.itemId || '',
                recordId: record.id,
            };

            const newAssignment = await recordService.createAssignment(recordId, assignmentData);

            // Update local state
            setAssignments(prev => [...prev, newAssignment]);

            // Refresh record details to get updated remaining quantity
            const updatedRecord = await recordService.getRecord(recordId);
            setRecord(updatedRecord);

            toast.success('Assignment created successfully');
        } catch (error) {
            console.error('Error creating assignment:', error);
            toast.error('Failed to create assignment');
            throw error; // Re-throw to let the modal handle the error state
        } finally {
            setSaving(false);
        }
    };

    // Menu handlers
    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, assignment: MachineAssignment) => {
        setMenuAnchor(event.currentTarget);
        setSelectedAssignment(assignment);
    };

    const handleMenuClose = () => {
        setMenuAnchor(null);
        setSelectedAssignment(null);
    };

    const handleDeleteAssignment = () => {
        if (!selectedAssignment || !record || !recordId) return;

        setConfirmDialog({
            open: true,
            title: 'Delete Assignment',
            message: `Are you sure you want to delete this assignment? This will free up ${selectedAssignment.quantity} units for reassignment.`,
            confirmText: 'Delete',
            onConfirm: async () => {
                try {
                    setSaving(true);

                    // Delete assignment via API
                    await recordService.deleteAssignment(recordId, selectedAssignment.id);

                    // Remove assignment from local state
                    setAssignments(prev => prev.filter(a => a.id !== selectedAssignment.id));

                    // Refresh record details to get updated remaining quantity
                    const updatedRecord = await recordService.getRecord(recordId);
                    setRecord(updatedRecord);

                    toast.success('Assignment deleted successfully');
                } catch (error) {
                    console.error('Error deleting assignment:', error);
                    toast.error('Failed to delete assignment');
                } finally {
                    setSaving(false);
                    setConfirmDialog(prev => ({ ...prev, open: false }));
                    handleMenuClose();
                }
            },
        });
        handleMenuClose();
    };



    const handleCloseCompletionModal = () => {
        setCompletionModal({
            open: false,
            assignment: null
        });
    };

    const handleUpdateCompletion = async (assignmentId: string, isCompleted: boolean, returnQuantity: number) => {
        if (!recordId) return;

        try {
            setSaving(true);
            const updatedAssignment = await recordService.updateAssignmentCompletion(
                recordId,
                assignmentId,
                isCompleted,
                returnQuantity
            );

            // Update assignment in local state
            setAssignments(prev => prev.map(a =>
                a.id === assignmentId ? updatedAssignment : a
            ));

            toast.success(`Assignment ${isCompleted ? 'marked as completed' : 'marked as incomplete'} successfully`);
        } catch (error) {
            console.error('Error updating completion status:', error);
            toast.error('Failed to update completion status');
            throw error; // Re-throw to let the modal handle the error
        } finally {
            setSaving(false);
        }
    };

    const handlePrintAssignment = () => {
        if (!selectedAssignment || !record) return;

        try {
            const receiptData: AssignmentReceiptData = {
                trackingNumber: selectedAssignment.trackingNumber || 'N/A',
                itemName: selectedAssignment.item || 'N/A',
                washType: record.washType || 'N/A',
                processTypes: Array.isArray(record.processTypes) ? record.processTypes : [],
                assignedTo: selectedAssignment.assignedTo || 'N/A',
                quantity: Number(selectedAssignment.quantity) || 0
            };

            generateAssignmentReceipt(receiptData);
            toast.success('Assignment receipt downloaded successfully!');
        } catch (error) {
            console.error('Error printing assignment:', error);
            toast.error('Failed to print assignment');
        }

        handleMenuClose();
    };

    const handlePrintAssignmentDirect = async (assignment: MachineAssignment) => {
        if (!record) return;

        try {
            const receiptData: AssignmentReceiptData = {
                trackingNumber: assignment.trackingNumber || 'N/A',
                itemName: assignment.item || 'N/A',
                washType: record.washType || 'N/A',
                processTypes: Array.isArray(record.processTypes) ? record.processTypes : [],
                assignedTo: assignment.assignedTo || 'N/A',
                quantity: Number(assignment.quantity) || 0
            };

            // Check if printer is connected
            if (!isConnected) {
                toast.error('Printer not connected. Please connect your printer first.');
                return;
            }

            // Print directly to thermal printer
            await printerService.printAssignmentReceipt(receiptData);
            toast.success('Assignment receipt printed successfully!');

        } catch (error) {
            console.error('Error printing assignment:', error);
            toast.error('Failed to print assignment. Please check printer connection.');
        }
    };

    if (loading) {
        return (
            <div className="w-full mx-auto px-1 sm:px-3 md:px-4 py-3">
                <div className="flex items-center justify-center h-64">
                    <div className="text-lg">Loading record details...</div>
                </div>
            </div>
        );
    }

    if (!record) {
        return (
            <div className="w-full mx-auto px-1 sm:px-3 md:px-4 py-3">
                <div className="flex items-center justify-center h-64">
                    <div className="text-lg text-red-600">Record not found</div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full mx-auto px-1 sm:px-3 md:px-4 py-3">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                    <IconButton
                        onClick={() => navigate('/production')}
                        sx={{ color: colors.text.secondary }}
                    >
                        <ArrowBack />
                    </IconButton>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold" style={{ color: colors.text.primary }}>
                            Record Assignments
                        </h1>
                        <p className="text-gray-600">
                            Manage machine assignments for this production record
                        </p>
                    </div>
                </div>

                {/* Record Details */}
                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                    <Typography variant="h6" color={colors.text.primary} className="mb-3">
                        Record Details
                    </Typography>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div>
                            <span className="font-semibold">Order ID:</span> {record.orderId}
                        </div>
                        <div>
                            <span className="font-semibold">Customer:</span> {record.customerName}
                        </div>
                        <div>
                            <span className="font-semibold">Item:</span> {record.item}
                        </div>
                        <div>
                            <span className="font-semibold">Wash Type:</span> {record.washType}
                        </div>
                        <div>
                            <span className="font-semibold">Total Quantity:</span> {record.quantity}
                        </div>
                        <div>
                            <span className="font-semibold">Remaining:</span>
                            <span className={`ml-1 px-2 py-1 rounded text-xs font-semibold ${record.remainingQuantity > 0
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-green-100 text-green-800'
                                }`}>
                                {record.remainingQuantity}
                            </span>
                        </div>
                        <div>
                            <span className="font-semibold">Process Types:</span> {record.processTypes ? record.processTypes.join(', ') : 'None'}
                        </div>
                        <div>
                            <span className="font-semibold">Status:</span>
                            <span className={`ml-1 px-2 py-1 rounded text-xs font-semibold ${getStatusColor(normalizeStatus(record.status, 'order'), 'order')}`}>
                                {getStatusLabel(normalizeStatus(record.status, 'order'), 'order')}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-semibold" style={{ color: colors.text.primary }}>
                        Machine Assignments ({assignments.length})
                    </h2>
                    <p className="text-sm text-gray-600">
                        Total assigned: {record.quantity - record.remainingQuantity} / {record.quantity}
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    {/* Printer Status - Top Right */}
                    {/* <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
                        <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            <span className="text-sm font-medium text-gray-700">
                                {isConnected ? 'Printer Connected' : 'Printer Disconnected'}
                            </span>
                        </div>
                        {!isConnected && (
                            <PrimaryButton
                                onClick={connect}
                                disabled={isConnecting}
                                style={{ minWidth: 120, fontSize: '12px', padding: '6px 12px' }}
                            >
                                {isConnecting ? 'Connecting...' : 'Connect'}
                            </PrimaryButton>
                        )}
                    </div> */}
                    <PrimaryButton
                        onClick={handleOpen}
                        disabled={record.remainingQuantity === 0}
                        style={{ minWidth: 160 }}
                    >
                        Add Assignment
                    </PrimaryButton>
                </div>
            </div>


            {/* Assignments Table */}
            <div className="mt-1">
                <PrimaryTable
                    columns={assignmentsColumns}
                    rows={assignments}
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
                />
            </div>

            {/* Assignment Modal */}
            <MachineAssignmentModal
                open={open}
                onClose={handleClose}
                onSubmit={handleSubmit}
                record={record}
                employeeOptions={employeeOptions}
                washingMachineOptions={washingMachineOptions}
                dryingMachineOptions={dryingMachineOptions}
            />

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
                <MenuItem onClick={handlePrintAssignment}>
                    Download PDF
                </MenuItem>
                <MenuItem onClick={() => {
                    if (selectedAssignment) {
                        handlePrintAssignmentDirect(selectedAssignment);
                    }
                    handleMenuClose();
                }}>
                    Print to Thermal
                </MenuItem>
                {canDelete && (
                    <MenuItem onClick={handleDeleteAssignment} sx={{ color: 'error.main' }}>
                        Delete Assignment
                    </MenuItem>
                )}
            </Menu>

            {/* Confirmation Dialog */}
            <ConfirmationDialog
                open={confirmDialog.open}
                title={confirmDialog.title}
                message={confirmDialog.message}
                confirmText={confirmDialog.confirmText}
                cancelText="Cancel"
                onConfirm={confirmDialog.onConfirm}
                onCancel={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
                loading={saving}
            />

            {/* Completion Status Modal */}
            <CompletionStatusModal
                open={completionModal.open}
                onClose={handleCloseCompletionModal}
                assignment={completionModal.assignment}
                onUpdate={handleUpdateCompletion}
                loading={saving}
            />

            {/* Floating Printer Status Button */}
            <Tooltip title={isConnected ? 'Printer Connected' : 'Printer Disconnected'} arrow>
                <Fab
                    color={isConnected ? 'success' : 'error'}
                    aria-label="printer status"
                    onClick={!isConnected ? connect : undefined}
                    disabled={isConnecting}
                    sx={{
                        position: 'fixed',
                        bottom: { xs: 24, sm: 24, md: 32, lg: 24 },
                        right: { xs: 24, sm: 24, md: 32, lg: 24 },
                        zIndex: 1000,
                        width: { xs: 56, sm: 56, md: 64, lg: 56 },
                        height: { xs: 56, sm: 56, md: 64, lg: 56 },
                        '&:hover': {
                            transform: 'scale(1.1)',
                            transition: 'transform 0.2s ease-in-out',
                        },
                    }}
                >
                    {isConnected ? <PrintOutlined /> : <PrintDisabled />}
                </Fab>
            </Tooltip>
        </div>
    );
}
