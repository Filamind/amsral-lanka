import React, { useState } from 'react';
import { Typography, IconButton, Menu, MenuItem, Button } from '@mui/material';
import { MoreVert, Edit, Delete, Refresh, AssignmentTurnedIn, RadioButtonUnchecked } from '@mui/icons-material';
import type { GridColDef } from '@mui/x-data-grid';
import PrimaryTable from '../components/common/PrimaryTable';
import ConfirmationDialog from '../components/common/ConfirmationDialog';
import CompletionStatusModal from '../components/modals/CompletionStatusModal';
import { useAssignments, useUpdateAssignmentCompletion, useDeleteAssignment, type AssignmentRow } from '../hooks/useAssignments';
import type { MachineAssignment } from '../services/recordService';
import colors from '../styles/colors';
import { getStatusColor, getStatusLabel, normalizeStatus } from '../utils/statusUtils';
import toast from 'react-hot-toast';

const CompleteOrderPage: React.FC = () => {
    // State management
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(25);
    const [searchTerm] = useState('');
    const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
    const [selectedAssignment, setSelectedAssignment] = useState<AssignmentRow | null>(null);
    const [confirmDialog, setConfirmDialog] = useState({
        open: false,
        title: '',
        message: '',
        confirmText: 'Confirm',
        onConfirm: () => { },
    });
    const [completionModal, setCompletionModal] = useState({
        open: false,
        assignment: null as AssignmentRow | null,
    });

    // Data fetching
    const { data, isLoading, error, refetch } = useAssignments({
        page: page + 1,
        limit: pageSize,
        search: searchTerm || undefined
    });

    // Mutations
    const updateCompletionMutation = useUpdateAssignmentCompletion();
    const deleteMutation = useDeleteAssignment();

    // Handle menu actions
    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, assignment: AssignmentRow) => {
        setMenuAnchor(event.currentTarget);
        setSelectedAssignment(assignment);
    };

    const handleMenuClose = () => {
        setMenuAnchor(null);
        setSelectedAssignment(null);
    };

    const handleEditClick = () => {
        // For now, just show a toast - edit functionality can be implemented later
        toast('Edit functionality will be implemented');
        handleMenuClose();
    };

    const handleDeleteClick = () => {
        if (selectedAssignment) {
            setConfirmDialog({
                open: true,
                title: 'Delete Assignment',
                message: 'Are you sure you want to delete this assignment? This action cannot be undone.',
                confirmText: 'Delete',
                onConfirm: () => {
                    deleteMutation.mutate({
                        recordId: selectedAssignment.recordId,
                        assignmentId: selectedAssignment.id
                    });
                    setConfirmDialog({ ...confirmDialog, open: false });
                }
            });
        }
        handleMenuClose();
    };


    // Table columns - matching Machine Assignment table structure
    const columns: GridColDef[] = [
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
                    color: (params.value || 0) < params.row.quantity ? '#f57c00' : colors.text.primary,
                    fontWeight: (params.value || 0) < params.row.quantity ? 600 : 'normal'
                }}>
                    {params.value || 0}
                </span>
            )
        },
        { field: 'washingMachine', headerName: 'WM', flex: 0.5, minWidth: 50 },
        { field: 'dryingMachine', headerName: 'DM', flex: 0.5, minWidth: 50 },
        {
            field: 'assignedAt',
            headerName: 'Assigned At',
            flex: 1,
            minWidth: 120,
            renderCell: (params) => (
                <span style={{ color: colors.text.secondary }}>
                    {new Date(params.value).toLocaleDateString()}
                </span>
            )
        },
        {
            field: 'status',
            headerName: 'Status',
            flex: 0.8,
            minWidth: 100,
            renderCell: (params) => {
                const normalizedStatus = normalizeStatus(params.value);
                const statusColor = getStatusColor(normalizedStatus);
                const statusLabel = getStatusLabel(normalizedStatus);

                return (
                    <span
                        className="px-2 py-1 rounded-full text-xs font-semibold"
                        style={{
                            backgroundColor: `${statusColor}20`,
                            color: statusColor,
                            border: `1px solid ${statusColor}40`
                        }}
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
                        color: params.row.complete ? colors.button.primary : colors.text.secondary
                    }}
                    title={params.row.complete ? 'Update completion status' : 'Mark as completed'}
                >
                    {params.row.complete ? <AssignmentTurnedIn /> : <RadioButtonUnchecked />}
                </IconButton>
            )
        },
        {
            field: 'actions',
            headerName: 'Actions',
            flex: 0.3,
            minWidth: 60,
            sortable: false,
            renderCell: (params) => (
                <IconButton
                    onClick={(e) => {
                        e.stopPropagation();
                        handleMenuOpen(e, params.row);
                    }}
                    size="small"
                    sx={{
                        color: colors.text.secondary,
                        padding: '4px'
                    }}
                >
                    <MoreVert fontSize="small" />
                </IconButton>
            )
        }
    ];

    if (error) {
        return (
            <div className="w-full mx-auto px-1 sm:px-3 md:px-4 py-3">
                <div className="flex flex-col items-center justify-center py-8">
                    <Typography variant="h6" color="error" className="mb-4">
                        Failed to load assignments
                    </Typography>
                    <Button onClick={() => refetch()} startIcon={<Refresh />}>
                        Retry
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full mx-auto px-1 sm:px-3 md:px-4 py-3">
            <div className="flex flex-col gap-2 sm:gap-3 mb-4">
                <h2 className="text-xl md:text-2xl font-bold" style={{ color: colors.text.primary }}>
                    Complete Order
                </h2>
                <p className="text-sm sm:text-base" style={{ color: colors.text.secondary }}>
                    Manage and complete machine assignments
                </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <PrimaryTable
                    columns={columns}
                    rows={data?.assignments || []}
                    loading={isLoading}
                    pagination
                    paginationMode="server"
                    paginationModel={{
                        page: page,
                        pageSize: pageSize
                    }}
                    rowCount={data?.pagination.totalRecords || 0}
                    pageSizeOptions={[10, 25, 50, 100]}
                    onPaginationModelChange={(model) => {
                        setPage(model.page);
                        setPageSize(model.pageSize);
                    }}
                    height="auto"
                />
            </div>

            {/* Actions Menu */}
            <Menu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={handleMenuClose}
                PaperProps={{
                    sx: {
                        minWidth: 150,
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    }
                }}
            >
                <MenuItem onClick={handleEditClick}>
                    <Edit fontSize="small" className="mr-2" />
                    Edit
                </MenuItem>
                <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
                    <Delete fontSize="small" className="mr-2" />
                    Delete
                </MenuItem>
            </Menu>

            {/* Confirmation Dialog */}
            <ConfirmationDialog
                open={confirmDialog.open}
                title={confirmDialog.title}
                message={confirmDialog.message}
                confirmText={confirmDialog.confirmText}
                onConfirm={confirmDialog.onConfirm}
                onCancel={() => setConfirmDialog({ ...confirmDialog, open: false })}
            />

            {/* Completion Status Modal */}
            {completionModal.assignment && (
                <CompletionStatusModal
                    open={completionModal.open}
                    onClose={() => setCompletionModal({ ...completionModal, open: false })}
                    assignment={completionModal.assignment as unknown as MachineAssignment}
                    onUpdate={async (_assignmentId, isCompleted, returnQuantity) => {
                        if (completionModal.assignment) {
                            updateCompletionMutation.mutate({
                                recordId: completionModal.assignment.recordId,
                                assignmentId: completionModal.assignment.id,
                                isCompleted,
                                returnQuantity
                            });
                        }
                        setCompletionModal({ ...completionModal, open: false });
                    }}
                />
            )}

        </div>
    );
};

export default CompleteOrderPage;
