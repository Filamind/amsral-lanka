/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import { orderService, type Order, type CreateOrderRecordRequest, type UpdateOrderRecordRequest, type ErrorResponse } from '../services/orderService';
import { washingTypeService } from '../services/washingTypeService';
import { processTypeService } from '../services/processTypeService';
import { useAuth } from '../hooks/useAuth';
import { hasPermission } from '../utils/roleUtils';
import { getStatusColor, getStatusLabel, normalizeStatus } from '../utils/statusUtils';
import toast from 'react-hot-toast';

interface ProcessRecord {
    id: string;
    orderId?: number;
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
    const { user } = useAuth();
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

    // Permission checks
    const canEdit = hasPermission(user, 'canEdit');
    const canDelete = hasPermission(user, 'canDelete');
    const [selectedRecord, setSelectedRecord] = useState<ProcessRecord | null>(null);

    // New record form
    const [newRecord, setNewRecord] = useState<ProcessRecord>({
        id: '',
        quantity: 1,
        washType: '',
        processTypes: [],
    });

    // Dropdown options
    const [washTypeOptions, setWashTypeOptions] = useState<{ value: string; label: string; name: string; code: string }[]>([]);
    const [processTypeOptions, setProcessTypeOptions] = useState<{ value: string; label: string }[]>([]);
    const [optionsLoading, setOptionsLoading] = useState(true);

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

        if (!record.washType) newErrors.washType = 'Wash type is required';
        if (!record.quantity || record.quantity <= 0) newErrors.quantity = 'Quantity must be greater than 0';
        // Process types are now optional - no validation required

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
                quantity: newRecord.quantity,
                washType: newRecord.washType as any, // Send the ID directly
                processTypes: newRecord.processTypes as any,
                // Let the backend generate the tracking number to avoid conflicts
            };

            const response = await orderService.addOrderRecord(parseInt(orderId), recordData);

            if (response.success) {
                const newProcessRecord: ProcessRecord = {
                    id: response.data.id.toString(),
                    quantity: response.data.quantity,
                    washType: response.data.washType,
                    processTypes: response.data.processTypes,
                    trackingNumber: response.data.trackingNumber, // Include tracking number from response
                };

                setRecords(prev => [...prev, newProcessRecord]);
                setNewRecord({
                    id: '',
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
                    quantity: response.data.quantity,
                    washType: response.data.washType,
                    processTypes: response.data.processTypes,
                };

                setRecords(prev => prev.map(record =>
                    record.id === editingRecord ? updatedProcessRecord : record
                ));

                setNewRecord({
                    id: '',
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
                            <label className="block text-sm font-medium text-gray-700 mb-2">Quantity *</label>
                            <div className="uniform-height-number-input">
                                <PrimaryNumberInput
                                    value={newRecord.quantity}
                                    onChange={(e) => handleRecordChange('quantity', Number(e.target.value))}
                                    label=""
                                    placeholder="Enter quantity"
                                    min={1}
                                    error={!!errors.quantity}
                                    helperText={errors.quantity}
                                    className="px-4 py-4 text-base"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Wash Type *</label>
                            <div className="uniform-height-dropdown">
                                <PrimaryDropdown
                                    name="washType"
                                    value={newRecord.washType}
                                    onChange={(e) => handleRecordChange('washType', e.target.value)}
                                    options={washTypeOptions}
                                    placeholder={optionsLoading ? "Loading wash types..." : "Select wash type"}
                                    error={!!errors.washType}
                                    disabled={optionsLoading}
                                    className="px-4 py-4 text-base"
                                    style={{ borderColor: errors.washType ? '#ef4444' : colors.border.light }}
                                />
                            </div>
                            {errors.washType && <span className="text-xs text-red-500 mt-1 block">{errors.washType}</span>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Process Types </label>
                            <div className="uniform-height-multiselect">
                                <PrimaryMultiSelect
                                    name="processTypes"
                                    value={newRecord.processTypes}
                                    onChange={handleMultiSelectChange('processTypes')}
                                    options={processTypeOptions}
                                    placeholder={optionsLoading ? "Loading process types..." : "Select process types"}
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
                        pageSizeOptions={[10, 20, 50, 100]}
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
