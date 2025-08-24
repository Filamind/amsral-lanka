/* eslint-disable @typescript-eslint/no-explicit-any */

import { DataGrid, type GridColDef, type DataGridProps } from '@mui/x-data-grid';
import Paper from '@mui/material/Paper';
import colors from '../../styles/colors';

interface PrimaryTableProps extends Partial<DataGridProps> {
    columns: GridColDef[];
    rows: any[];
    height?: number | string;
}

export default function PrimaryTable({ columns, rows, height = 400, ...props }: PrimaryTableProps) {
    return (
        <Paper
            sx={{
                height,
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
                {...props}
            />
        </Paper>
    );
}
