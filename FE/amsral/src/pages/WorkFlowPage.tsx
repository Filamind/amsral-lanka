import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { GridColDef, GridRowParams } from '@mui/x-data-grid';
import PrimaryTable from '../components/common/PrimaryTable';
import colors from '../styles/colors';
import { orderService } from '../services/orderService';
import { itemService } from '../services/itemService';
import { washingTypeService } from '../services/washingTypeService';
import { processTypeService } from '../services/processTypeService';
import { getStatusColor, getStatusLabel, normalizeStatus } from '../utils/statusUtils';
import toast from 'react-hot-toast';

// Types
type ProcessRecord = {
    id: string;
    orderId: number;
    orderRef: string;
    trackingNumber?: string; // Add tracking number field
    customerName: string;
    item: string;
    itemId?: string;
    quantity: number;
    remainingQuantity: number;
    washType: string;
    processTypes: string[];
    status: string;
    createdAt: string;
    complete: boolean;
};


// MachineAssignment type removed - will be handled in separate page

// Machine and employee options moved to separate record assignments page

// Sample data removed - now using real data from API

// Table columns
const recordsColumns: GridColDef[] = [
    { field: 'createdAt', headerName: 'Date', flex: 0.8, minWidth: 110 },
    { field: 'trackingNumber', headerName: 'Tracking No', flex: 0.8, minWidth: 100 },
    { field: 'item', headerName: 'Item', flex: 1.5, minWidth: 150 },
    {
        field: 'quantity',
        headerName: 'Total Qty',
        flex: 0.8,
        minWidth: 100,
        type: 'number',
        renderCell: (params) => (
            <span
                className={`px-3 py-1 rounded-xl text-sm font-semibold ${params.row.remainingQuantity === 0
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                    }`}
            >
                {params.value}
            </span>
        )
    },
    { field: 'washType', headerName: 'Wash Type', flex: 1.2, minWidth: 120 },
    { field: 'processTypes', headerName: 'Processes', flex: 2, minWidth: 200 },
    {
        field: 'status',
        headerName: 'Status',
        flex: 1,
        minWidth: 120,
        renderCell: (params) => {
            // Determine display status based on completion and assignment
            let displayStatus: string;
            if (params.row.complete) {
                displayStatus = 'Completed';
            } else if (params.row.remainingQuantity === 0) {
                displayStatus = 'Assigned';
            } else {
                displayStatus = normalizeStatus(params.row.status || 'Pending', 'order');
            }

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
];

// Assignments columns removed - will be handled in separate page

export default function WorkFlowPage() {
    const navigate = useNavigate();
    const [recordsSearch, setRecordsSearch] = useState('');
    const [records, setRecords] = useState<ProcessRecord[]>([]);
    const [loading, setLoading] = useState(true);

    // Add CSS styles for row coloring
    const rowStyles = `
        .even-order-row {
            background-color: #dbeafe !important; /* Light blue for even order IDs */
            color: #1e40af !important;
            border-bottom: 1px solid #93c5fd !important; /* Blue border for visibility */
        }
        .even-order-row:hover {
            background-color: #bfdbfe !important; /* Slightly darker light blue on hover */
        }
        .odd-order-row {
            background-color: #f8fafc !important; /* Light background for odd order IDs */
            color: #1e293b !important;
            border-bottom: 1px solid #e2e8f0 !important; /* Light border for consistency */
        }
        .odd-order-row:hover {
            background-color: #e2e8f0 !important; /* Slightly darker light background on hover */
        }
    `;

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
    const [itemOptions, setItemOptions] = useState<{ value: string; label: string }[]>([]);
    const [washTypeOptions, setWashTypeOptions] = useState<{ value: string; label: string }[]>([]);
    const [processTypeOptions, setProcessTypeOptions] = useState<{ value: string; label: string }[]>([]);

    // Fetch production records
    const fetchProductionRecords = useCallback(async () => {
        try {
            setLoading(true);
            const response = await orderService.getAllProductionRecords({
                page: currentPage,
                limit: pageSize,
                search: recordsSearch || undefined
            });

            if (response.success) {
                // Transform records into production records
                const productionRecords: ProcessRecord[] = [];

                // The /orders/records endpoint returns records directly
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const records = (response.data as any).records || [];

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                records.forEach((record: any) => {
                    // Find item name
                    const itemName = itemOptions.find(item => item.value === record.itemId)?.label || 'Unknown Item';

                    // Find wash type name
                    const washTypeName = washTypeOptions.find(wash => wash.value === record.washType)?.label || record.washType;

                    // Find process type names
                    const processTypeNames = record.processTypes.map((pt: string) =>
                        processTypeOptions.find(p => p.value === pt)?.label || pt
                    );

                    productionRecords.push({
                        id: record.id.toString(),
                        orderId: record.orderId,
                        orderRef: `${record.orderId}`,
                        trackingNumber: record.trackingNumber || 'N/A', // Include tracking number from API
                        customerName: record.customerName || 'Unknown Customer',
                        item: itemName,
                        itemId: record.itemId,
                        quantity: record.quantity,
                        remainingQuantity: record.remainingQuantity || 0,
                        washType: washTypeName,
                        processTypes: processTypeNames,
                        status: 'pending',
                        createdAt: record.createdAt ? new Date(record.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                        complete: record.complete || false
                    });
                });

                setRecords(productionRecords);

                // Update pagination info
                setPagination({
                    currentPage: response.data.pagination?.currentPage || 1,
                    totalPages: response.data.pagination?.totalPages || 1,
                    totalItems: response.data.pagination?.totalRecords || productionRecords.length,
                    itemsPerPage: response.data.pagination?.limit || pageSize,
                    hasNextPage: (response.data.pagination?.currentPage || 1) < (response.data.pagination?.totalPages || 1),
                    hasPrevPage: (response.data.pagination?.currentPage || 1) > 1
                });
            }
        } catch (error) {
            console.error('Error fetching production records:', error);
            toast.error('Failed to fetch production records');
        } finally {
            setLoading(false);
        }
    }, [itemOptions, washTypeOptions, processTypeOptions, recordsSearch]);

    // Fetch dropdown options
    const fetchDropdownOptions = useCallback(async () => {
        try {
            // Fetch items
            const itemsResponse = await itemService.getItemsList();
            setItemOptions(itemsResponse.data);

            // Fetch washing types
            const washingTypesResponse = await washingTypeService.getWashingTypes({
                limit: 100
            });
            const washTypeOpts = washingTypesResponse.data.washingTypes.map(washType => ({
                value: washType.id,
                label: `${washType.name} (${washType.code})`
            }));
            setWashTypeOptions(washTypeOpts);

            // Fetch process types
            const processTypesResponse = await processTypeService.getProcessTypesList();
            const processTypeOpts = processTypesResponse.data.map(item => ({
                value: item.value.toString(),
                label: item.label
            }));
            setProcessTypeOptions(processTypeOpts);

            // Employee fetching moved to separate record assignments page

        } catch (error) {
            console.error('Error fetching dropdown options:', error);
            toast.error('Failed to load options');
        }
    }, []);

    // Load data on component mount
    useEffect(() => {
        const loadData = async () => {
            await fetchDropdownOptions();
        };
        loadData();
    }, [fetchDropdownOptions]);

    // Fetch production records when dropdown options are loaded
    useEffect(() => {
        if (itemOptions.length > 0 && washTypeOptions.length > 0 && processTypeOptions.length > 0) {
            // Inline fetch to avoid circular dependency
            const fetchData = async () => {
                try {
                    setLoading(true);
                    const response = await orderService.getAllProductionRecords({
                        page: currentPage,
                        limit: pageSize,
                        search: recordsSearch || undefined
                    });

                    if (response.success) {
                        // Transform records into production records
                        const productionRecords: ProcessRecord[] = [];

                        // The /orders/records endpoint returns records directly
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const records = (response.data as any).records || [];

                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        records.forEach((record: any) => {
                            // Find item name
                            const itemName = itemOptions.find(item => item.value === record.itemId)?.label || 'Unknown Item';

                            // Find wash type name
                            const washTypeName = washTypeOptions.find(wash => wash.value === record.washType)?.label || record.washType;

                            // Find process type names
                            const processTypeNames = record.processTypes.map((pt: string) =>
                                processTypeOptions.find(p => p.value === pt)?.label || pt
                            );

                            productionRecords.push({
                                id: record.id.toString(),
                                orderId: record.orderId,
                                orderRef: `${record.orderId}`,
                                trackingNumber: record.trackingNumber || 'N/A', // Include tracking number from API
                                customerName: record.customerName || 'Unknown Customer',
                                item: itemName,
                                itemId: record.itemId,
                                quantity: record.quantity,
                                remainingQuantity: record.remainingQuantity || 0,
                                washType: washTypeName,
                                processTypes: processTypeNames,
                                status: 'pending',
                                createdAt: record.createdAt ? new Date(record.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                                complete: record.complete || false
                            });
                        });

                        setRecords(productionRecords);

                        // Update pagination info
                        setPagination({
                            currentPage: response.data.pagination?.currentPage || 1,
                            totalPages: response.data.pagination?.totalPages || 1,
                            totalItems: response.data.pagination?.totalRecords || productionRecords.length,
                            itemsPerPage: response.data.pagination?.limit || pageSize,
                            hasNextPage: (response.data.pagination?.currentPage || 1) < (response.data.pagination?.totalPages || 1),
                            hasPrevPage: (response.data.pagination?.currentPage || 1) > 1
                        });
                    }
                } catch (error) {
                    console.error('Error fetching production records:', error);
                    toast.error('Failed to fetch production records');
                } finally {
                    setLoading(false);
                }
            };
            fetchData();
        }
    }, [itemOptions, washTypeOptions, processTypeOptions, currentPage, pageSize, recordsSearch]);


    // Pagination handlers
    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
    };

    const handlePageSizeChange = (newPageSize: number) => {
        setPageSize(newPageSize);
        setCurrentPage(1); // Reset to first page when page size changes
    };

    // Debounced search effect
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (recordsSearch !== undefined && itemOptions.length > 0 && washTypeOptions.length > 0 && processTypeOptions.length > 0) {
                setCurrentPage(1); // Reset to first page when search changes
                // Inline fetch to avoid circular dependency
                const fetchData = async () => {
                    try {
                        setLoading(true);
                        const response = await orderService.getAllProductionRecords({
                            page: 1, // Reset to first page for search
                            limit: pageSize,
                            search: recordsSearch || undefined
                        });

                        if (response.success) {
                            // Transform records into production records
                            const productionRecords: ProcessRecord[] = [];

                            // The /orders/records endpoint returns records directly
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            const records = (response.data as any).records || [];

                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            records.forEach((record: any) => {
                                // Find item name
                                const itemName = itemOptions.find(item => item.value === record.itemId)?.label || 'Unknown Item';

                                // Find wash type name
                                const washTypeName = washTypeOptions.find(wash => wash.value === record.washType)?.label || record.washType;

                                // Find process type names
                                const processTypeNames = record.processTypes.map((pt: string) =>
                                    processTypeOptions.find(p => p.value === pt)?.label || pt
                                );

                                productionRecords.push({
                                    id: record.id.toString(),
                                    orderId: record.orderId,
                                    orderRef: `${record.orderId}`,
                                    trackingNumber: record.trackingNumber || 'N/A', // Include tracking number from API
                                    customerName: record.customerName || 'Unknown Customer',
                                    item: itemName,
                                    itemId: record.itemId,
                                    quantity: record.quantity,
                                    remainingQuantity: record.remainingQuantity || 0,
                                    washType: washTypeName,
                                    processTypes: processTypeNames,
                                    status: 'pending',
                                    createdAt: record.createdAt ? new Date(record.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                                    complete: record.complete || false
                                });
                            });

                            setRecords(productionRecords);

                            // Update pagination info
                            setPagination({
                                currentPage: response.data.pagination?.currentPage || 1,
                                totalPages: response.data.pagination?.totalPages || 1,
                                totalItems: response.data.pagination?.totalRecords || productionRecords.length,
                                itemsPerPage: response.data.pagination?.limit || pageSize,
                                hasNextPage: (response.data.pagination?.currentPage || 1) < (response.data.pagination?.totalPages || 1),
                                hasPrevPage: (response.data.pagination?.currentPage || 1) > 1
                            });
                        }
                    } catch (error) {
                        console.error('Error fetching production records:', error);
                        toast.error('Failed to fetch production records');
                    } finally {
                        setLoading(false);
                    }
                };
                fetchData();
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [recordsSearch, itemOptions, washTypeOptions, processTypeOptions, pageSize]);

    // Handle row click to navigate to record assignments page
    const handleRowClick = (params: GridRowParams) => {
        const record = records.find(r => r.id === String(params.id));
        if (record) {
            navigate(`/production/record/${record.id}`);
        }
    };

    // Format process types for display
    const recordsWithFormattedProcesses = records.map(record => ({
        ...record,
        processTypes: record.processTypes.join(', '),
    }));

    return (
        <div className="w-full mx-auto px-1 sm:px-3 md:px-4 py-3">
            {/* Add CSS styles for row coloring */}
            <style>{rowStyles}</style>

            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: colors.text.primary }}>
                    Production Records
                </h1>
                <p className="text-gray-600">
                    Click any record to manage machine assignments
                </p>
            </div>

            {/* Search and Table */}
            <div className="flex flex-col gap-2 sm:gap-3 mb-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 w-full">
                    <div className="flex flex-1 items-center w-full sm:w-auto">
                        <input
                            type="text"
                            placeholder="Search records by order ID or item..."
                            value={recordsSearch}
                            onChange={e => setRecordsSearch(e.target.value)}
                            className="flex-1 px-3 py-2 border rounded-xl focus:outline-none text-sm sm:text-base"
                            style={{ borderColor: colors.border.light, maxWidth: 400 }}
                        />
                    </div>
                    <div className="text-sm text-gray-600">
                        Click any record to manage assignments
                    </div>
                </div>
            </div>

            <div className="mt-1">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-lg">Loading production records...</div>
                    </div>
                ) : (
                    <PrimaryTable
                        columns={recordsColumns}
                        rows={recordsWithFormattedProcesses}
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
                        onRowClick={handleRowClick}
                        getRowClassName={(params) => {
                            // Even order_id gets dark blue background, odd gets light background
                            return params.row.orderId % 2 === 0 ? 'even-order-row' : 'odd-order-row';
                        }}
                        height="auto"
                    />
                )}
            </div>

        </div>
    );
}
