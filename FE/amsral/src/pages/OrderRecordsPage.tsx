import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Typography, IconButton, Menu, MenuItem } from '@mui/material';
import { ArrowBack, MoreVert } from '@mui/icons-material';
import type { GridColDef } from '@mui/x-data-grid';
import PrimaryButton from '../components/common/PrimaryButton';
import PrimaryTable from '../components/common/PrimaryTable';
import PrimaryDropdown from '../components/common/PrimaryDropdown';
import PrimaryNumberInput from '../components/common/PrimaryNumberInput';
import PrimaryMultiSelect from '../components/common/PrimaryMultiSelect';
import ConfirmationDialog from '../components/common/ConfirmationDialog';
import colors from '../styles/colors';
import { type CreateOrderRecordRequest, type UpdateOrderRecordRequest, type ErrorResponse, type WashType, type ProcessType } from '../services/orderService';
import { useAuth } from '../hooks/useAuth';
import { hasPermission } from '../utils/roleUtils';
import { getStatusColor, getStatusLabel, normalizeStatus } from '../utils/statusUtils';
import {
    useOrder,
    useWashingTypes,
    useProcessTypes,
    useAddOrderRecord,
    useUpdateOrderRecord,
    useDeleteOrderRecord,
    type ProcessRecord
} from '../hooks/useOrderRecords';

// ProcessRecord interface is now imported from useOrderRecords hook

export default function OrderRecordsPage() {
    const { orderId } = useParams<{ orderId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [searchParams] = useSearchParams();

    // Local state for UI
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingRecord, setEditingRecord] = useState<string | null>(null);
    const [confirmDialog, setConfirmDialog] = useState({
        open: false,
        title: '',
        message: '',
        onConfirm: () => { },
    });
    const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
    const [selectedRecord, setSelectedRecord] = useState<ProcessRecord | null>(null);

    // Permission checks
    const canEdit = hasPermission(user, 'canEdit');
    const canDelete = hasPermission(user, 'canDelete');

    // New record form
    const [newRecord, setNewRecord] = useState<ProcessRecord>({
        id: '',
        quantity: '',
        washType: '',
        processTypes: [],
    });

    // Get remaining quantity from URL parameters
    const remainingQuantityFromUrl = searchParams.get('remainingQuantity');
    const defaultQuantity = remainingQuantityFromUrl ? parseInt(remainingQuantityFromUrl) : 0;

    // Pagination state (removed unused pagination state)
    const [pageSize, setPageSize] = useState(20); // Default to 20 rows per page

    // Errors
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    // TanStack Query hooks
    const {
        data: order,
        isLoading: orderLoading
    } = useOrder(parseInt(orderId!));

    const {
        data: washTypeOptions = [],
        isLoading: washingTypesLoading
    } = useWashingTypes();

    const {
        data: processTypeOptions = [],
        isLoading: processTypesLoading
    } = useProcessTypes();

    // Mutation hooks
    const addRecordMutation = useAddOrderRecord();
    const updateRecordMutation = useUpdateOrderRecord();
    const deleteRecordMutation = useDeleteOrderRecord();

    // Derived state
    const records = order?.records?.map(record => ({
        id: record.id.toString(),
        quantity: record.quantity.toString(),
        washType: record.washType,
        processTypes: record.processTypes,
        trackingNumber: record.trackingNumber,
    })) || [];

    const loading = orderLoading;
    const optionsLoading = washingTypesLoading || processTypesLoading;
    const saving = addRecordMutation.isPending || updateRecordMutation.isPending || deleteRecordMutation.isPending;

    const validateRecord = (record: ProcessRecord): { [key: string]: string } => {
        const newErrors: { [key: string]: string } = {};

        if (!record.washType) newErrors.washType = 'Wash type is required';
        if (!record.quantity || Number(record.quantity) <= 0) newErrors.quantity = 'Quantity must be greater than 0';
        // Process types are now optional - no validation required

        // Check if total quantity exceeds order quantity
        const otherRecordsTotal = records
            .filter(r => r.id !== record.id)
            .reduce((total, r) => total + Number(r.quantity), 0);

        if (otherRecordsTotal + Number(record.quantity) > (order?.quantity || 0)) {
            newErrors.quantity = `Total records quantity (${otherRecordsTotal + Number(record.quantity)}) cannot exceed order quantity (${order?.quantity})`;
        }

        return newErrors;
    };

    const handleAddRecord = async () => {
        const validation = validateRecord(newRecord);
        if (Object.keys(validation).length > 0) {
            setErrors(validation);
            return;
        }

        if (!orderId) return;

        const recordData: CreateOrderRecordRequest = {
            orderId: parseInt(orderId),
            quantity: Number(newRecord.quantity),
            washType: newRecord.washType as WashType, // Type assertion for API compatibility
            processTypes: newRecord.processTypes as ProcessType[], // Type assertion for API compatibility
            // Let the backend generate the tracking number to avoid conflicts
        };

        addRecordMutation.mutate(
            { orderId: parseInt(orderId), recordData },
            {
                onSuccess: () => {
                    setNewRecord({
                        id: '',
                        quantity: '',
                        washType: '',
                        processTypes: [],
                    });
                    setShowAddForm(false);
                    setErrors({});
                },
                onError: (error: ErrorResponse) => {
                    if (error.errors) {
                        setErrors(error.errors);
                    } else {
                        setErrors({ general: error.message || 'Failed to add record. Please try again.' });
                    }
                }
            }
        );
    };

    const handleEditRecord = (recordId: string) => {
        const record = records.find(r => r.id === recordId);
        if (record) {
            // Find the wash type ID from the wash type name (API returns name, but we need ID for dropdown)
            const washTypeOption = washTypeOptions.find(wash => wash.name === record.washType);
            const washTypeId = washTypeOption?.value || record.washType;

            setNewRecord({
                ...record,
                washType: washTypeId // Use the ID for the dropdown
            });
            setEditingRecord(recordId);
            setShowAddForm(true);
        }
    };

    const handleUpdateRecord = async () => {
        if (!editingRecord || !orderId) return;

        const validation = validateRecord(newRecord);
        if (Object.keys(validation).length > 0) {
            setErrors(validation);
            return;
        }

        const recordData: UpdateOrderRecordRequest = {
            orderId: parseInt(orderId),
            quantity: Number(newRecord.quantity),
            washType: newRecord.washType as WashType, // Type assertion for API compatibility
            processTypes: newRecord.processTypes as ProcessType[], // Type assertion for API compatibility
        };

        updateRecordMutation.mutate(
            {
                orderId: parseInt(orderId),
                recordId: parseInt(editingRecord),
                recordData
            },
            {
                onSuccess: () => {
                    setNewRecord({
                        id: '',
                        quantity: '',
                        washType: '',
                        processTypes: [],
                    });
                    setEditingRecord(null);
                    setShowAddForm(false);
                    setErrors({});
                },
                onError: (error: ErrorResponse) => {
                    if (error.errors) {
                        setErrors(error.errors);
                    } else {
                        setErrors({ general: error.message || 'Failed to update record. Please try again.' });
                    }
                }
            }
        );
    };

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, record: ProcessRecord) => {
        setMenuAnchor(event.currentTarget);
        setSelectedRecord(record);
    };

    const handleMenuClose = () => {
        setMenuAnchor(null);
        setSelectedRecord(null);
    };


    const handleEditRecordClick = () => {
        if (selectedRecord) {
            handleEditRecord(selectedRecord.id);
        }
        handleMenuClose();
    };

    const handleDeleteRecord = () => {
        if (!selectedRecord || !orderId) return;

        setConfirmDialog({
            open: true,
            title: 'Delete Record',
            message: `Are you sure you want to delete this record? This action cannot be undone.`,
            onConfirm: () => {
                deleteRecordMutation.mutate(
                    { orderId: parseInt(orderId), recordId: parseInt(selectedRecord.id) },
                    {
                        onSuccess: () => {
                            setConfirmDialog(prev => ({ ...prev, open: false }));
                            handleMenuClose();
                        },
                        onError: () => {
                            setConfirmDialog(prev => ({ ...prev, open: false }));
                            handleMenuClose();
                        }
                    }
                );
            },
        });
        handleMenuClose();
    };

    const handleCancelEdit = () => {
        setNewRecord({
            id: '',
            quantity: '',
            washType: '',
            processTypes: [],
        });
        setEditingRecord(null);
        setShowAddForm(false);
        setErrors({});
    };

    const handleRecordChange = (field: string, value: string | string[]) => {
        setNewRecord(prev => ({ ...prev, [field]: value }));
        // Clear related error
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const handleMultiSelectChange = (field: string) => (e: { target: { value: string[] } }) => {
        handleRecordChange(field, e.target.value);
    };

    // Set default quantity when form is opened
    const handleOpenAddForm = () => {
        setNewRecord({
            id: '',
            quantity: defaultQuantity > 0 ? defaultQuantity.toString() : '',
            washType: '',
            processTypes: [],
        });
        setShowAddForm(true);
    };

    // Initialize form with default quantity when component mounts
    useEffect(() => {
        if (defaultQuantity > 0) {
            setNewRecord(prev => ({
                ...prev,
                quantity: defaultQuantity.toString()
            }));
            // Auto-show the form if there's a remaining quantity
            setShowAddForm(true);
        }
    }, [defaultQuantity]);

    const getTotalRecordsQuantity = () => {
        return records.reduce((total, record) => total + Number(record.quantity), 0);
    };

    const getRemainingQuantity = () => {
        return (order?.quantity || 0) - getTotalRecordsQuantity();
    };

    // Update pagination when records change
    const updatedPagination = {
        currentPage: 1,
        totalPages: Math.ceil(records.length / pageSize),
        totalItems: records.length,
        itemsPerPage: pageSize,
        hasNextPage: records.length > pageSize,
        hasPrevPage: false
    };

    // Pagination handlers (simplified since pagination state was removed)
    const handlePageChange = () => {
        // Page change logic can be added here if needed
    };

    const handlePageSizeChange = (newPageSize: number) => {
        setPageSize(newPageSize);
    };


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
        { field: 'customerName', headerName: 'Customer', flex: 1.2, minWidth: 150 },
        { field: 'quantity', headerName: 'Quantity', flex: 0.8, minWidth: 100, type: 'number' },
        { field: 'washTypeName', headerName: 'Wash Type', flex: 1, minWidth: 150 },
        { field: 'processTypes', headerName: 'Process Types', flex: 2, minWidth: 250 },
        {
            field: 'status',
            headerName: 'Status',
            flex: 1,
            minWidth: 120,
            renderCell: (params) => {
                // Determine status based on record completion or other criteria
                const isCompleted = params.row.isCompleted || false;
                const status = params.row.status || 'pending';

                // Use standardized status handling
                const displayStatus = isCompleted ? 'Completed' : normalizeStatus(status, 'order');
                const statusColor = getStatusColor(displayStatus, 'order');
                const statusLabel = getStatusLabel(displayStatus, 'order');

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

    // Convert records to table format
    const tableRows = records.map(record => {
        // For wash type display, use the direct value from API since it's already the correct format
        const washTypeName = record.washType || 'Unknown Wash Type';

        const processTypesText = record.processTypes ?
            record.processTypes.map(pt => processTypeOptions.find(p => p.value === pt)?.label || pt).join(', ') :
            'None';

        return {
            id: record.id,
            trackingNumber: record.trackingNumber || 'N/A', // Add tracking number field
            customerName: order?.customerName || 'N/A',
            quantity: record.quantity,
            washTypeName,
            processTypes: processTypesText,
            status: 'pending', // Default status since it's not in the API
            isCompleted: false, // Default completion status
            print: record.id, // Add print field for the print button
            actions: record.id,
        };
    });

    if (loading) {
        return (
            <div className="w-full mx-auto px-1 sm:px-3 md:px-4 py-3">
                <div className="flex items-center justify-center h-64">
                    <div className="text-lg">Loading order details...</div>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="w-full mx-auto px-1 sm:px-3 md:px-4 py-3">
                <div className="flex items-center justify-center h-64">
                    <div className="text-lg text-red-500">Order not found</div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full mx-auto px-1 sm:px-3 md:px-4 py-3">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <IconButton
                    onClick={() => navigate('/orders')}
                    className="p-2"
                    style={{ color: colors.text.primary }}
                >
                    <ArrowBack />
                </IconButton>
                <div>
                    <h2 className="text-xl md:text-2xl font-bold" style={{ color: colors.text.primary }}>
                        Order Records -  {order.id}
                    </h2>
                    <p className="text-sm text-gray-600">
                        Customer: {order.customerName} | Total Quantity:
                        <span
                            className={`ml-1 px-2 py-1 rounded text-sm font-semibold ${order.complete
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                                }`}
                        >
                            {order.quantity}
                        </span>
                    </p>
                </div>
            </div>

            {/* Progress Summary */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{records.length}</div>
                        <div className="text-sm text-gray-600">Records Added</div>
                    </div>
                    <div className="text-center">
                        <div
                            className={`text-2xl font-bold ${order.complete
                                ? 'text-green-600'
                                : 'text-red-600'
                                }`}
                        >
                            {getTotalRecordsQuantity()}
                        </div>
                        <div className="text-sm text-gray-600">Quantity Assigned</div>
                    </div>
                    <div className="text-center">
                        <div
                            className={`text-2xl font-bold ${order.complete
                                ? 'text-green-600'
                                : 'text-orange-600'
                                }`}
                        >
                            {getRemainingQuantity()}
                        </div>
                        <div className="text-sm text-gray-600">Remaining</div>
                    </div>
                </div>
            </div>

            {/* Add/Edit Record Form */}
            {showAddForm && (
                <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-white">
                    <style>
                        {`
                            .grid > div {
                                display: flex !important;
                                flex-direction: column !important;
                                align-items: stretch !important;
                                width: 100% !important;
                                margin: 0 !important;
                                padding: 0 !important;
                            }
                            .grid > div > label {
                                margin-bottom: 8px !important;
                                height: 24px !important;
                                display: flex !important;
                                align-items: center !important;
                                line-height: 1 !important;
                            }
                            .uniform-height-dropdown {
                                height: 48px !important;
                                display: flex !important;
                                align-items: center !important;
                                width: 100% !important;
                                margin: 0 !important;
                                padding: 0 !important;
                                position: relative !important;
                                top: 0 !important;
                                left: 0 !important;
                                min-width: 100% !important;
                                max-width: 100% !important;
                            }
                            .uniform-height-multiselect {
                                height: 48px !important;
                                display: flex !important;
                                align-items: center !important;
                                width: 100% !important;
                                margin: 0 !important;
                                padding: 0 !important;
                                margin-left: 0 !important;
                                margin-right: 0 !important;
                                padding-left: 0 !important;
                                padding-right: 0 !important;
                                position: relative !important;
                                top: 0 !important;
                                left: 0 !important;
                                min-width: 100% !important;
                                max-width: 100% !important;
                            }
                            .uniform-height-number-input {
                                height: 48px !important;
                                display: flex !important;
                                align-items: center !important;
                                width: 100% !important;
                                margin: 0 !important;
                                padding: 0 !important;
                                position: relative !important;
                                top: 0 !important;
                                left: 0 !important;
                                min-width: 100% !important;
                                max-width: 100% !important;
                            }
                            .uniform-height-dropdown .MuiSelect-select {
                                padding: 16px 16px !important;
                                height: 48px !important;
                                min-height: 48px !important;
                                display: flex !important;
                                align-items: center !important;
                                box-sizing: border-box !important;
                            }
                            .uniform-height-multiselect .MuiSelect-select {
                                padding: 16px 16px !important;
                                height: 48px !important;
                                min-height: 48px !important;
                                display: flex !important;
                                align-items: center !important;
                                box-sizing: border-box !important;
                                margin: 0 !important;
                                border-radius: 12px !important;
                            }
                            .uniform-height-dropdown .MuiOutlinedInput-root {
                                height: 48px !important;
                                display: flex !important;
                                align-items: center !important;
                                width: 100% !important;
                                min-width: 100% !important;
                                max-width: 100% !important;
                                margin: 0 !important;
                                padding: 0 !important;
                            }
                            .uniform-height-multiselect .MuiOutlinedInput-root {
                                height: 48px !important;
                                display: flex !important;
                                align-items: center !important;
                                margin: 0 !important;
                                padding: 0 !important;
                                margin-left: 0 !important;
                                margin-right: 0 !important;
                                padding-left: 0 !important;
                                padding-right: 0 !important;
                                border-radius: 12px !important;
                                width: 100% !important;
                                min-width: 100% !important;
                                max-width: 100% !important;
                            }
                            .uniform-height-number-input input[type="number"] {
                                padding: 16px 16px !important;
                                height: 48px !important;
                                min-height: 48px !important;
                                max-height: 48px !important;
                                display: flex !important;
                                align-items: center !important;
                                box-sizing: border-box !important;
                                margin: 0 !important;
                                border-radius: 12px !important;
                            }
                            .uniform-height-number-input > div {
                                height: 48px !important;
                                display: flex !important;
                                align-items: center !important;
                                margin: 0 !important;
                                padding: 0 !important;
                                border-radius: 12px !important;
                                width: 100% !important;
                                min-width: 100% !important;
                                max-width: 100% !important;
                            }
                            .uniform-height-number-input > * {
                                margin: 0 !important;
                                padding: 0 !important;
                                width: 100% !important;
                                min-width: 100% !important;
                                max-width: 100% !important;
                            }
                            .uniform-height-dropdown .MuiTypography-root {
                                display: flex !important;
                                align-items: center !important;
                                height: 100% !important;
                            }
                            .uniform-height-multiselect .MuiTypography-root {
                                display: flex !important;
                                align-items: center !important;
                                height: 100% !important;
                            }
                            .uniform-height-multiselect > * {
                                margin: 0 !important;
                                padding: 0 !important;
                                width: 100% !important;
                                min-width: 100% !important;
                                max-width: 100% !important;
                            }
                            .uniform-height-multiselect .MuiFormControl-root {
                                width: 100% !important;
                                min-width: 100% !important;
                                max-width: 100% !important;
                                margin: 0 !important;
                            }
                            .uniform-height-dropdown > * {
                                margin: 0 !important;
                                padding: 0 !important;
                                width: 100% !important;
                                min-width: 100% !important;
                                max-width: 100% !important;
                            }
                            .uniform-height-dropdown .MuiFormControl-root {
                                width: 100% !important;
                                min-width: 100% !important;
                                max-width: 100% !important;
                                margin: 0 !important;
                            }
                        `}
                    </style>
                    <Typography variant="h6" className="mb-4">
                        {editingRecord ? 'Edit Record' : 'Add New Record'}
                    </Typography>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4 items-start">
                        <div>
                            <div className="uniform-height-number-input">
                                <PrimaryNumberInput
                                    value={newRecord.quantity ? Number(newRecord.quantity) : undefined}
                                    onChange={(e) => handleRecordChange('quantity', e.target.value)}
                                    label=""
                                    placeholder="Quantity"
                                    min={1}
                                    error={!!errors.quantity}
                                    helperText={errors.quantity}
                                    className="px-4 py-4 text-base"
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div>
                            <div className="uniform-height-dropdown">
                                <PrimaryDropdown
                                    name="washType"
                                    value={newRecord.washType}
                                    onChange={(e) => handleRecordChange('washType', e.target.value)}
                                    options={washTypeOptions}
                                    placeholder={optionsLoading ? "Loading wash types..." : "Wash Type"}
                                    error={!!errors.washType}
                                    disabled={optionsLoading}
                                    className="px-4 py-4 text-base"
                                    style={{ borderColor: errors.washType ? '#ef4444' : colors.border.light }}
                                />
                            </div>
                            {errors.washType && <span className="text-xs text-red-500 mt-1 block">{errors.washType}</span>}
                        </div>

                        <div>
                            <div className="uniform-height-multiselect">
                                <PrimaryMultiSelect
                                    name="processTypes"
                                    value={newRecord.processTypes}
                                    onChange={handleMultiSelectChange('processTypes')}
                                    options={processTypeOptions}
                                    placeholder={optionsLoading ? "Loading process types..." : "Process Types"}
                                    className="px-4 py-4 text-base"
                                    style={{ borderColor: errors.processTypes ? '#ef4444' : colors.border.light }}
                                />
                            </div>
                            {errors.processTypes && <span className="text-xs text-red-500 mt-1 block">{errors.processTypes}</span>}
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <PrimaryButton
                            onClick={editingRecord ? handleUpdateRecord : handleAddRecord}
                            className="px-4 py-2"
                            style={{ backgroundColor: colors.primary[500], color: colors.text.white }}
                            disabled={saving}
                        >
                            {saving ? 'Saving...' : (editingRecord ? 'Update Record' : 'Add Record')}
                        </PrimaryButton>
                        <PrimaryButton
                            onClick={handleCancelEdit}
                            className="px-4 py-2"
                            style={{ backgroundColor: colors.text.muted, color: colors.text.white }}
                            disabled={saving}
                        >
                            Cancel
                        </PrimaryButton>
                    </div>
                </div>
            )}

            {/* Records Table */}
            <div className="mb-4">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Process Records</h3>
                    {!showAddForm && (
                        <PrimaryButton
                            onClick={handleOpenAddForm}
                            className="px-4 py-2"
                            style={{ backgroundColor: colors.primary[500], color: colors.text.white }}
                        >
                            + Add Record
                        </PrimaryButton>
                    )}
                </div>

                {records.length > 0 ? (
                    <PrimaryTable
                        columns={columns}
                        rows={tableRows}
                        pageSizeOptions={[10, 20, 50, 100]}
                        pagination
                        paginationModel={{
                            page: updatedPagination.currentPage - 1, // DataGrid uses 0-based indexing
                            pageSize: pageSize
                        }}
                        onPaginationModelChange={(model) => {
                            if (model.pageSize !== pageSize) {
                                handlePageSizeChange(model.pageSize);
                            }
                            if (model.page !== updatedPagination.currentPage - 1) {
                                handlePageChange(); // Page change handler
                            }
                        }}
                        onRowClick={() => {
                            // You can add row click functionality here if needed
                        }}
                        height="auto"
                    />
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        <Typography variant="body2">
                            No records added yet. Click "Add Record" to start.
                        </Typography>
                    </div>
                )}
            </div>

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
                {canEdit && (
                    <MenuItem onClick={handleEditRecordClick}>
                        Edit Record
                    </MenuItem>
                )}
                {canDelete && (
                    <MenuItem onClick={handleDeleteRecord} sx={{ color: 'error.main' }}>
                        Delete Record
                    </MenuItem>
                )}
            </Menu>

            {/* Confirmation Dialog */}
            <ConfirmationDialog
                open={confirmDialog.open}
                title={confirmDialog.title}
                message={confirmDialog.message}
                confirmText="Delete"
                cancelText="Cancel"
                onConfirm={confirmDialog.onConfirm}
                onCancel={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
                loading={saving}
            />
        </div>
    );
}
