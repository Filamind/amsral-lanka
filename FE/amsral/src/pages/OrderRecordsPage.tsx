/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Typography, IconButton, Menu, MenuItem } from '@mui/material';
import { ArrowBack, MoreVert, Print } from '@mui/icons-material';
import type { GridColDef } from '@mui/x-data-grid';
import PrimaryButton from '../components/common/PrimaryButton';
import PrimaryTable from '../components/common/PrimaryTable';
import PrimaryDropdown from '../components/common/PrimaryDropdown';
import PrimaryNumberInput from '../components/common/PrimaryNumberInput';
import PrimaryMultiSelect from '../components/common/PrimaryMultiSelect';
import ConfirmationDialog from '../components/common/ConfirmationDialog';
import colors from '../styles/colors';
import { orderService, type Order, type CreateOrderRecordRequest, type UpdateOrderRecordRequest, type ErrorResponse } from '../services/orderService';
import { itemService } from '../services/itemService';
import { washingTypeService } from '../services/washingTypeService';
import { processTypeService } from '../services/processTypeService';
import { generateOrderReceipt } from '../utils/pdfUtils';
import toast from 'react-hot-toast';

interface ProcessRecord {
    id: string;
    orderId?: number;
    itemId?: string; // Optional since API doesn't always include it
    quantity: number;
    washType: string;
    processTypes: string[];
    trackingNumber?: string; // Optional, will be included when available
    status?: string;
    isCompleted?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export default function OrderRecordsPage() {
    const { orderId } = useParams<{ orderId: string }>();
    const navigate = useNavigate();
    const [order, setOrder] = useState<Order | null>(null);
    const [records, setRecords] = useState<ProcessRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
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

    // New record form
    const [newRecord, setNewRecord] = useState<ProcessRecord>({
        id: '',
        itemId: '',
        quantity: 1,
        washType: '',
        processTypes: [],
    });

    // Dropdown options
    const [itemOptions, setItemOptions] = useState<{ value: string; label: string }[]>([]);
    const [washTypeOptions, setWashTypeOptions] = useState<{ value: string; label: string; name: string; code: string }[]>([]);
    const [processTypeOptions, setProcessTypeOptions] = useState<{ value: string; label: string }[]>([]);
    const [optionsLoading, setOptionsLoading] = useState(true);

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

    // Errors
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const fetchOrderAndRecords = useCallback(async () => {
        try {
            setLoading(true);
            const response = await orderService.getOrder(parseInt(orderId!));
            if (response.success) {
                setOrder(response.data);
                // Convert API records to our format
                const convertedRecords: ProcessRecord[] = response.data.records.map(record => ({
                    id: record.id.toString(),
                    itemId: record.itemId,
                    quantity: record.quantity,
                    washType: record.washType,
                    processTypes: record.processTypes,
                    trackingNumber: record.trackingNumber, // Include tracking number from API
                }));
                setRecords(convertedRecords);

                // Update pagination info for client-side pagination
                setPagination({
                    currentPage: 1,
                    totalPages: Math.ceil(convertedRecords.length / pageSize),
                    totalItems: convertedRecords.length,
                    itemsPerPage: pageSize,
                    hasNextPage: convertedRecords.length > pageSize,
                    hasPrevPage: false
                });
            }
        } catch (error) {
            console.error('Error fetching order:', error);
            toast.error('Failed to load order details');
            navigate('/orders');
        } finally {
            setLoading(false);
        }
    }, [orderId, navigate]);

    useEffect(() => {
        if (orderId) {
            fetchOrderAndRecords();
            fetchDropdownOptions();
        }
    }, [orderId, fetchOrderAndRecords]);

    const fetchDropdownOptions = async () => {
        try {
            setOptionsLoading(true);

            // Fetch items
            const itemsResponse = await itemService.getItemsList();
            setItemOptions(itemsResponse.data);

            // Fetch washing types
            const washingTypesResponse = await washingTypeService.getWashingTypes({
                limit: 100
            });
            const washTypeOpts = washingTypesResponse.data.washingTypes.map(washType => ({
                value: washType.id, // Use ID as value for API calls
                label: `${washType.name} (${washType.code})`,
                name: washType.name, // Store the name for API calls
                code: washType.code
            }));
            setWashTypeOptions(washTypeOpts);

            // Fetch process types
            const processTypesResponse = await processTypeService.getProcessTypesList();
            const processTypeOpts = processTypesResponse.data.map(item => ({
                value: item.value.toString(),
                label: item.label
            }));
            setProcessTypeOptions(processTypeOpts);

        } catch (error) {
            console.error('Error fetching dropdown options:', error);
            toast.error('Failed to load options');
        } finally {
            setOptionsLoading(false);
        }
    };

    const validateRecord = (record: ProcessRecord): { [key: string]: string } => {
        const newErrors: { [key: string]: string } = {};

        if (!record.itemId) newErrors.itemId = 'Item is required';
        if (!record.washType) newErrors.washType = 'Wash type is required';
        if (!record.quantity || record.quantity <= 0) newErrors.quantity = 'Quantity must be greater than 0';
        if (!record.processTypes || record.processTypes.length === 0) newErrors.processTypes = 'At least one process type is required';

        // Check if total quantity exceeds order quantity
        const otherRecordsTotal = records
            .filter(r => r.id !== record.id)
            .reduce((total, r) => total + r.quantity, 0);

        if (otherRecordsTotal + record.quantity > (order?.quantity || 0)) {
            newErrors.quantity = `Total records quantity (${otherRecordsTotal + record.quantity}) cannot exceed order quantity (${order?.quantity})`;
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

        try {
            setSaving(true);

            const recordData: CreateOrderRecordRequest = {
                orderId: parseInt(orderId),
                itemId: newRecord.itemId || '',
                quantity: newRecord.quantity,
                washType: newRecord.washType as any, // Send the ID directly
                processTypes: newRecord.processTypes as any,
                // Let the backend generate the tracking number to avoid conflicts
            };

            const response = await orderService.addOrderRecord(parseInt(orderId), recordData);

            if (response.success) {
                const newProcessRecord: ProcessRecord = {
                    id: response.data.id.toString(),
                    itemId: response.data.itemId,
                    quantity: response.data.quantity,
                    washType: response.data.washType,
                    processTypes: response.data.processTypes,
                    trackingNumber: response.data.trackingNumber, // Include tracking number from response
                };

                setRecords(prev => [...prev, newProcessRecord]);
                setNewRecord({
                    id: '',
                    itemId: '',
                    quantity: 1,
                    washType: '',
                    processTypes: [],
                });
                setShowAddForm(false);
                setErrors({});
                toast.success(`Record added successfully with tracking number: ${response.data.trackingNumber}`);
            }
        } catch (error) {
            console.error('Error adding record:', error);
            const apiError = error as ErrorResponse;
            toast.error(apiError.message || 'Failed to add record. Please try again.');
        } finally {
            setSaving(false);
        }
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

        try {
            setSaving(true);
            const recordData: UpdateOrderRecordRequest = {
                orderId: parseInt(orderId),
                itemId: newRecord.itemId || '',
                quantity: newRecord.quantity,
                washType: newRecord.washType as any, // Send the ID directly
                processTypes: newRecord.processTypes as any,
            };

            const response = await orderService.updateOrderRecord(
                parseInt(orderId),
                parseInt(editingRecord),
                recordData
            );

            if (response.success) {
                const updatedProcessRecord: ProcessRecord = {
                    id: response.data.id.toString(),
                    itemId: response.data.itemId,
                    quantity: response.data.quantity,
                    washType: response.data.washType,
                    processTypes: response.data.processTypes,
                };

                setRecords(prev => prev.map(record =>
                    record.id === editingRecord ? updatedProcessRecord : record
                ));

                setNewRecord({
                    id: '',
                    itemId: '',
                    quantity: 1,
                    washType: '',
                    processTypes: [],
                });
                setEditingRecord(null);
                setShowAddForm(false);
                setErrors({});
                toast.success('Record updated successfully');
            }
        } catch (error) {
            console.error('Error updating record:', error);
            const apiError = error as ErrorResponse;
            toast.error(apiError.message || 'Failed to update record. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, record: ProcessRecord) => {
        setMenuAnchor(event.currentTarget);
        setSelectedRecord(record);
    };

    const handleMenuClose = () => {
        setMenuAnchor(null);
        setSelectedRecord(null);
    };

    const handlePrintRecord = (record: ProcessRecord) => {
        if (!order) return;

        try {
            const receiptData = {
                orderId: order.id,
                customerName: order.customerName,
                totalQuantity: record.quantity,
                orderDate: order.date,
                notes: order.itemId ? `Item: ${record.itemId}, Wash Type: ${record.washType}, Process Types: ${record.processTypes.join(', ')}` : order.notes
            };

            generateOrderReceipt(receiptData);
            toast.success('Record receipt downloaded successfully!');
        } catch (error) {
            console.error('Error generating record receipt:', error);
            toast.error('Failed to generate receipt. Please try again.');
        }
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
            onConfirm: async () => {
                try {
                    setSaving(true);
                    await orderService.deleteOrderRecord(parseInt(orderId), parseInt(selectedRecord.id));
                    setRecords(prev => prev.filter(r => r.id !== selectedRecord.id));
                    toast.success('Record deleted successfully');
                } catch (error) {
                    console.error('Error deleting record:', error);
                    const apiError = error as ErrorResponse;
                    toast.error(apiError.message || 'Failed to delete record. Please try again.');
                } finally {
                    setSaving(false);
                    setConfirmDialog(prev => ({ ...prev, open: false }));
                    handleMenuClose();
                }
            },
        });
        handleMenuClose();
    };

    const handleCancelEdit = () => {
        setNewRecord({
            id: '',
            itemId: '',
            quantity: 1,
            washType: '',
            processTypes: [],
        });
        setEditingRecord(null);
        setShowAddForm(false);
        setErrors({});
    };

    const handleRecordChange = (field: string, value: any) => {
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

    const getTotalRecordsQuantity = () => {
        return records.reduce((total, record) => total + record.quantity, 0);
    };

    const getRemainingQuantity = () => {
        return (order?.quantity || 0) - getTotalRecordsQuantity();
    };

    // Pagination handlers
    const handlePageChange = (newPage: number) => {
        // Update pagination state for client-side pagination
        setPagination(prev => ({
            ...prev,
            currentPage: newPage,
            hasNextPage: newPage < prev.totalPages,
            hasPrevPage: newPage > 1
        }));
    };

    const handlePageSizeChange = (newPageSize: number) => {
        setPageSize(newPageSize);
        // Update pagination state for client-side pagination
        setPagination(prev => ({
            ...prev,
            currentPage: 1,
            itemsPerPage: newPageSize,
            totalPages: Math.ceil(prev.totalItems / newPageSize),
            hasNextPage: prev.totalItems > newPageSize,
            hasPrevPage: false
        }));
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
        { field: 'itemName', headerName: 'Item', flex: 1.5, minWidth: 200 },
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

                return (
                    <span
                        className={`px-3 py-1 rounded-xl text-sm font-semibold ${isCompleted
                            ? 'bg-green-100 text-green-800'
                            : status === 'in_progress'
                                ? 'bg-yellow-100 text-yellow-800'
                                : status === 'pending'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-gray-100 text-gray-800'
                            }`}
                    >
                        {isCompleted ? 'Complete' : status || 'Pending'}
                    </span>
                );
            }
        },
        {
            field: 'print',
            headerName: 'Print',
            flex: 0.3,
            minWidth: 60,
            sortable: false,
            renderCell: (params) => (
                <IconButton
                    onClick={(e) => {
                        e.stopPropagation();
                        handlePrintRecord(params.row);
                    }}
                    size="small"
                    sx={{ color: colors.button.primary }}
                    title="Print Record"
                >
                    <Print />
                </IconButton>
            )
        },
        {
            field: 'actions',
            headerName: 'Actions',
            flex: 0.5,
            minWidth: 80,
            sortable: false,
            renderCell: (params) => (
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
            )
        },
    ];

    // Convert records to table format
    const tableRows = records.map(record => {
        // Since API doesn't include itemId in records, we'll show a placeholder or try to find it
        const itemName = record.itemId
            ? (itemOptions.find(item => item.value === record.itemId)?.label || 'Unknown Item')
            : 'No Item Specified'; // Show this when itemId is missing from API

        // For wash type display, use the direct value from API since it's already the correct format
        const washTypeName = record.washType || 'Unknown Wash Type';

        const processTypesText = record.processTypes
            .map(pt => processTypeOptions.find(p => p.value === pt)?.label || pt)
            .join(', ');

        return {
            id: record.id,
            trackingNumber: record.trackingNumber || 'N/A', // Add tracking number field
            customerName: order?.customerName || 'N/A',
            itemName,
            quantity: record.quantity,
            washTypeName,
            processTypes: processTypesText,
            status: record.status || 'pending',
            isCompleted: record.isCompleted || false,
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
                    <Typography variant="h6" className="mb-4">
                        {editingRecord ? 'Edit Record' : 'Add New Record'}
                    </Typography>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Item *</label>
                            <PrimaryDropdown
                                name="itemId"
                                value={newRecord.itemId}
                                onChange={(e) => handleRecordChange('itemId', e.target.value)}
                                options={itemOptions}
                                placeholder={optionsLoading ? "Loading items..." : "Select an item"}
                                error={!!errors.itemId}
                                disabled={optionsLoading}
                                className="px-4 py-3 text-base"
                                style={{ borderColor: errors.itemId ? '#ef4444' : colors.border.light }}
                            />
                            {errors.itemId && <span className="text-xs text-red-500 mt-1 block">{errors.itemId}</span>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Quantity *</label>
                            <PrimaryNumberInput
                                value={newRecord.quantity}
                                onChange={(e) => handleRecordChange('quantity', Number(e.target.value))}
                                label=""
                                placeholder="Enter quantity"
                                min={1}
                                error={!!errors.quantity}
                                helperText={errors.quantity}
                                className="text-base"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Wash Type *</label>
                            <PrimaryDropdown
                                name="washType"
                                value={newRecord.washType}
                                onChange={(e) => handleRecordChange('washType', e.target.value)}
                                options={washTypeOptions}
                                placeholder={optionsLoading ? "Loading wash types..." : "Select wash type"}
                                error={!!errors.washType}
                                disabled={optionsLoading}
                                className="px-4 py-3 text-base"
                                style={{ borderColor: errors.washType ? '#ef4444' : colors.border.light }}
                            />
                            {errors.washType && <span className="text-xs text-red-500 mt-1 block">{errors.washType}</span>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Process Types *</label>
                            <PrimaryMultiSelect
                                name="processTypes"
                                value={newRecord.processTypes}
                                onChange={handleMultiSelectChange('processTypes')}
                                options={processTypeOptions}
                                placeholder={optionsLoading ? "Loading process types..." : "Select process types"}
                                className="text-base"
                                style={{ borderColor: colors.border.light }}
                            />
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
                            onClick={() => setShowAddForm(true)}
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
                        pageSizeOptions={[5, 10, 20, 50]}
                        pagination
                        paginationModel={{
                            page: pagination.currentPage - 1, // DataGrid uses 0-based indexing
                            pageSize: pageSize
                        }}
                        onPaginationModelChange={(model) => {
                            if (model.pageSize !== pageSize) {
                                handlePageSizeChange(model.pageSize);
                            }
                            if (model.page !== pagination.currentPage - 1) {
                                handlePageChange(model.page + 1); // Convert back to 1-based
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
                <MenuItem onClick={handleEditRecordClick}>
                    Edit Record
                </MenuItem>
                <MenuItem onClick={handleDeleteRecord} sx={{ color: 'error.main' }}>
                    Delete Record
                </MenuItem>
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
