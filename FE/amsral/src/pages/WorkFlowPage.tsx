import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { GridColDef, GridRowParams } from '@mui/x-data-grid';
import PrimaryTable from '../components/common/PrimaryTable';
import colors from '../styles/colors';
import { getStatusColor, getStatusLabel, normalizeStatus } from '../utils/statusUtils';
import {
    useProductionRecords,
} from '../hooks/useProduction';

// ProcessRecord type is now imported from useProduction hook


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
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

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

    // TanStack Query hooks
    const {
        data: productionData,
        isLoading: loading
    } = useProductionRecords({
        page: currentPage,
        limit: pageSize,
        search: recordsSearch || undefined
    });


    // Derived state
    const records = productionData?.records || [];
    const pagination = productionData?.pagination || {
        currentPage: 1,
        totalPages: 1,
        totalRecords: 0,
        limit: pageSize,
    };

    // Search handler with debouncing
    const handleSearchChange = (value: string) => {
        setRecordsSearch(value);
        setCurrentPage(1); // Reset to first page when search changes
    };

    // Pagination handlers
    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
    };

    const handlePageSizeChange = (newPageSize: number) => {
        setPageSize(newPageSize);
        setCurrentPage(1); // Reset to first page when page size changes
    };

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
        processTypes: record.processTypes ? record.processTypes.join(', ') : '',
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
                            onChange={e => handleSearchChange(e.target.value)}
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
                        rowCount={pagination.totalRecords}
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
