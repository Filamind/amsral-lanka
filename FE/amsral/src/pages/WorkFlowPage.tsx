import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { GridColDef, GridRowParams } from '@mui/x-data-grid';
import PrimaryTable from '../components/common/PrimaryTable';
import colors from '../styles/colors';
import { orderService } from '../services/orderService';
import { itemService } from '../services/itemService';
import { washingTypeService } from '../services/washingTypeService';
import { processTypeService } from '../services/processTypeService';
import toast from 'react-hot-toast';

// Types
type ProcessRecord = {
    id: string;
    orderId: number;
    orderRef: string;
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
    { field: 'orderId', headerName: 'Order ID', flex: 0.8, minWidth: 100, type: 'number' },
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
        renderCell: (params) => (
            <span
                className={`px-3 py-1 rounded-xl text-sm font-semibold ${params.row.complete
                    ? 'bg-green-100 text-green-800'
                    : params.row.remainingQuantity === 0
                        ? 'bg-blue-100 text-blue-800'
                        : params.row.status === 'in_progress'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                    }`}
            >
                {params.row.complete ? 'Complete' : params.row.remainingQuantity === 0 ? 'Assigned' : params.row.status || 'Pending'}
            </span>
        )
    },
];

// Assignments columns removed - will be handled in separate page

export default function WorkFlowPage() {
    const navigate = useNavigate();
    const [recordsSearch, setRecordsSearch] = useState('');
    const [records, setRecords] = useState<ProcessRecord[]>([]);
    const [loading, setLoading] = useState(true);

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
                        orderRef: record.orderRef || record.referenceNo || `ORD${record.orderId}`,
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
    }, [itemOptions, washTypeOptions, processTypeOptions, currentPage, pageSize, recordsSearch]);

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
            fetchProductionRecords();
        }
    }, [fetchProductionRecords, itemOptions, washTypeOptions, processTypeOptions]);

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
            if (recordsSearch !== undefined) {
                setCurrentPage(1); // Reset to first page when search changes
                fetchProductionRecords();
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [recordsSearch, fetchProductionRecords]);

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
        <div className="w-full mx-auto px-1 sm:px-3 md:px-4 py-3">;
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
                        height="auto"
                    />
                )}
            </div>

        </div>
    );
}
