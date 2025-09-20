/* eslint-disable @typescript-eslint/no-explicit-any */

import { DataGrid, type GridColDef, type DataGridProps, type GridRowSelectionModel } from '@mui/x-data-grid';
import Paper from '@mui/material/Paper';
import colors from '../../styles/colors';

interface PrimaryTableProps extends Omit<Partial<DataGridProps>, 'rowSelectionModel' | 'onRowSelectionModelChange' | 'pagination'> {
    columns: GridColDef[];
    rows: any[];
    height?: number | string | 'auto';
    pagination?: boolean | undefined;
    paginationModel?: { page: number; pageSize: number };
    onPaginationModelChange?: (model: { page: number; pageSize: number }) => void;
    rowCount?: number;
    pageSizeOptions?: number[];
    checkboxSelection?: boolean;
    onRowSelectionModelChange?: (newSelection: any) => void;
    rowSelectionModel?: GridRowSelectionModel; 
}

export default function PrimaryTable({
    columns,
    rows,
    height = 400,
    onRowClick,
    pagination = false,
    paginationModel,
    onPaginationModelChange,
    rowCount,
    pageSizeOptions = [5, 10, 25, 50],
    checkboxSelection,
    onRowSelectionModelChange,
    rowSelectionModel,
    ...props
}: PrimaryTableProps) {
    // Calculate dynamic height based on number of rows
    const calculateHeight = () => {
        if (height === 'auto') {
            const headerHeight = 56; // Header height
            const rowHeight = 52; // Row height
            const paginationHeight = pagination ? 52 : 0; // Pagination height only if pagination is enabled
            const padding = 16; // Paper padding
            const minHeight = 200; // Minimum height
            const maxHeight = 800; // Increased maximum height

            const calculatedHeight = headerHeight + (rows.length * rowHeight) + paginationHeight + padding;
            return Math.max(minHeight, Math.min(maxHeight, calculatedHeight));
        }
        return height;
    };

    return (
        <Paper
            sx={{
                height: calculateHeight(),
                width: '100%',
                background: colors.gradients.loginCard,
                boxShadow: 3,
                borderRadius: 3,
                p: 1,
            }}
        >
            <DataGrid
                rows={rows}
                columns={columns}

                {...(pagination && { pagination: true })}
                paginationModel={paginationModel}
                onPaginationModelChange={onPaginationModelChange}
                rowCount={rowCount}
                pageSizeOptions={pageSizeOptions}
                checkboxSelection={checkboxSelection}
                onRowSelectionModelChange={onRowSelectionModelChange}
                rowSelectionModel={rowSelectionModel}
                sx={{
                    border: 0,
                    background: 'transparent',
                    fontSize: { xs: 13, sm: 15 },
                    color: colors.text.primary,
                    '& .MuiDataGrid-columnHeaders': {
                        background: colors.primary[100],
                        color: colors.primary[800],
                        fontWeight: 700,
                        fontSize: 15,
                    },
                    '& .MuiDataGrid-row': {
                        background: 'transparent',
                        cursor: onRowClick ? 'pointer' : 'default',
                        '&:hover': {
                            background: colors.gradients.cardHover,
                        },
                    },
                    '& .MuiDataGrid-cell': {
                        borderColor: colors.border.light,
                    },
                    '& .MuiCheckbox-root': {
                        color: colors.primary[500],
                    },
                }}
                onRowClick={onRowClick}
                {...props}
            />
        </Paper>
    );
}
