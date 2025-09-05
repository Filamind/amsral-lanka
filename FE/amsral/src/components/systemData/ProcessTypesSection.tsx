import { useState, useEffect, useCallback } from 'react';
import { Modal, Box, Typography, IconButton } from '@mui/material';
import type { GridColDef, GridPaginationModel } from '@mui/x-data-grid';
import toast from 'react-hot-toast';
import PrimaryButton from '../common/PrimaryButton';
import PrimaryTable from '../common/PrimaryTable';
import colors from '../../styles/colors';
import { processTypeService, type ProcessType } from '../../services/processTypeService';

interface ApiError {
    response?: {
        data?: {
            message?: string;
        };
    };
}

const getColumns = (onEdit: (processType: ProcessType) => void, onDelete: (processType: ProcessType) => void): GridColDef[] => [
    { field: 'id', headerName: 'ID', flex: 0.6, minWidth: 80 },
    { field: 'name', headerName: 'Name', flex: 1.5, minWidth: 150 },
    { field: 'code', headerName: 'Code', flex: 1, minWidth: 100 },
    { field: 'description', headerName: 'Description', flex: 2.5, minWidth: 250 },
    {
        field: 'createdAt', headerName: 'Created At', flex: 1.2, minWidth: 140,
        valueFormatter: (value) => {
            if (value) {
                return new Date(value).toLocaleDateString();
            }
            return '';
        }
    },
    {
        field: 'actions',
        headerName: 'Actions',
        flex: 0.8,
        minWidth: 120,
        sortable: false,
        renderCell: (params) => (
            <div className="flex gap-2">
                <IconButton
                    size="small"
                    onClick={() => onEdit(params.row as ProcessType)}
                    sx={{ color: colors.primary[500] }}
                >
                    ✏️
                </IconButton>
                <IconButton
                    size="small"
                    onClick={() => onDelete(params.row as ProcessType)}
                    sx={{ color: '#ef4444' }}
                >
                    🗑️
                </IconButton>
            </div>
        ),
    },
];

export default function ProcessTypesSection() {
    const [search, setSearch] = useState('');
    const [rows, setRows] = useState<ProcessType[]>([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedProcessType, setSelectedProcessType] = useState<ProcessType | null>(null);
    const [form, setForm] = useState({
        name: '',
        code: '',
        description: '',
    });
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [processTypeToDelete, setProcessTypeToDelete] = useState<ProcessType | null>(null);

    // Pagination states
    const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
        page: 0,
        pageSize: 10,
    });
    const [rowCount, setRowCount] = useState(0);

    const fetchProcessTypes = useCallback(async () => {
        try {
            setLoading(true);
            const response = await processTypeService.getProcessTypes({
                page: paginationModel.page + 1,
                limit: paginationModel.pageSize,
                search: search || undefined,
            });

            setRows(response.data.processTypes);
            setRowCount(response.data.pagination.totalRecords);
        } catch (error) {
            console.error('Error fetching process types:', error);
            const errorMessage = (error as ApiError)?.response?.data?.message || 'Failed to fetch process types';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [paginationModel.page, paginationModel.pageSize, search]);

    // Debounced search - only for search term changes
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setPaginationModel(prev => ({ ...prev, page: 0 }));
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [search]);

    useEffect(() => {
        fetchProcessTypes();
    }, [paginationModel, fetchProcessTypes]);

    const handlePaginationModelChange = (newModel: GridPaginationModel) => {
        setPaginationModel(newModel);
    };

    const validate = () => {
        const newErrors: { [key: string]: string } = {};
        if (!form.name.trim()) newErrors.name = 'Process type name is required';
        if (!form.code.trim()) newErrors.code = 'Process code is required';
        if (form.name.length > 100) newErrors.name = 'Process type name must be 100 characters or less';
        if (form.code.length > 20) newErrors.code = 'Process code must be 20 characters or less';
        if (form.description && form.description.length > 500) {
            newErrors.description = 'Description must be 500 characters or less';
        }

        return newErrors;
    };

    const handleEdit = (processType: ProcessType) => {
        setSelectedProcessType(processType);
        setEditMode(true);
        setForm({
            name: processType.name || '',
            code: processType.code || '',
            description: processType.description || '',
        });
        setErrors({});
        setOpen(true);
    };

    const handleDelete = (processType: ProcessType) => {
        setProcessTypeToDelete(processType);
        setDeleteConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (!processTypeToDelete) return;

        try {
            await processTypeService.deleteProcessType(processTypeToDelete.id);
            toast.success('Process type deleted successfully');
            setDeleteConfirmOpen(false);
            setProcessTypeToDelete(null);
            await fetchProcessTypes();
        } catch (error) {
            console.error('Error deleting process type:', error);
            const errorMessage = (error as ApiError)?.response?.data?.message || 'Failed to delete process type';
            toast.error(errorMessage);
        }
    };

    const handleOpen = () => {
        setEditMode(false);
        setSelectedProcessType(null);
        setForm({
            name: '',
            code: '',
            description: '',
        });
        setErrors({});
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setEditMode(false);
        setSelectedProcessType(null);
        setErrors({});
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const validation = validate();
        if (Object.keys(validation).length > 0) {
            setErrors(validation);
            return;
        }

        try {
            const processTypeData = {
                name: form.name,
                code: form.code,
                description: form.description || undefined,
            };

            if (editMode && selectedProcessType) {
                // Update existing process type
                await processTypeService.updateProcessType(selectedProcessType.id, processTypeData);
                toast.success('Process type updated successfully');
            } else {
                // Create new process type
                await processTypeService.createProcessType(processTypeData);
                toast.success('Process type created successfully');
            }

            setOpen(false);
            await fetchProcessTypes();
        } catch (error) {
            console.error('Error saving process type:', error);
            const errorMessage = (error as ApiError)?.response?.data?.message ||
                (editMode ? 'Failed to update process type' : 'Failed to create process type');
            toast.error(errorMessage);
        }
    };

    const filteredRows = rows;

    return (
        <div>
            <div className="flex flex-col gap-2 sm:gap-3 mb-4">
                <h3 className="text-lg md:text-xl font-semibold" style={{ color: colors.text.primary }}>
                    Process Types Management
                </h3>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 w-full">
                    <div className="flex flex-1 items-center w-full sm:w-auto">
                        <input
                            type="text"
                            placeholder="Search process types..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="flex-1 px-3 py-2 border rounded-xl focus:outline-none text-sm sm:text-base"
                            style={{ borderColor: colors.border.light, maxWidth: 300 }}
                        />
                    </div>
                    <div className="w-full sm:w-auto mt-1 sm:mt-0">
                        <PrimaryButton style={{ minWidth: 140, width: '100%' }} onClick={handleOpen}>
                            + Add Process Type
                        </PrimaryButton>
                    </div>
                </div>
            </div>

            <div className="mt-1">
                <PrimaryTable
                    columns={getColumns(handleEdit, handleDelete)}
                    rows={filteredRows}
                    loading={loading}
                    paginationMode="server"
                    rowCount={rowCount}
                    paginationModel={paginationModel}
                    onPaginationModelChange={handlePaginationModelChange}
                    pageSizeOptions={[5, 10, 20, 50]}
                />
            </div>

            {/* Modal for Add/Edit Process Type */}
            <Modal open={open} onClose={handleClose}>
                <Box
                    sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        bgcolor: 'background.paper',
                        boxShadow: 24,
                        borderRadius: 2,
                        p: { xs: 3, sm: 4 },
                        width: { xs: '95vw', sm: '90vw', md: '600px' },
                        maxWidth: '95vw',
                        maxHeight: '95vh',
                        overflowY: 'auto',
                    }}
                >
                    <Typography variant="h6" fontWeight={700} mb={3} color={colors.text.primary}>
                        {editMode ? 'Edit Process Type' : 'Add Process Type'}
                    </Typography>
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex flex-col">
                                <label className="block text-sm font-medium mb-2">
                                    Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    name="name"
                                    value={form.name}
                                    onChange={handleChange}
                                    placeholder="Enter process type name"
                                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none text-base ${errors.name ? 'border-red-500' : ''}`}
                                    style={{ borderColor: errors.name ? '#ef4444' : colors.border.light }}
                                />
                                {errors.name && <span className="text-xs text-red-500 mt-1">{errors.name}</span>}
                            </div>

                            <div className="flex flex-col">
                                <label className="block text-sm font-medium mb-2">
                                    Code <span className="text-red-500">*</span>
                                </label>
                                <input
                                    name="code"
                                    value={form.code}
                                    onChange={handleChange}
                                    placeholder="Enter code (e.g., S/B)"
                                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none text-base ${errors.code ? 'border-red-500' : ''}`}
                                    style={{ borderColor: errors.code ? '#ef4444' : colors.border.light }}
                                />
                                {errors.code && <span className="text-xs text-red-500 mt-1">{errors.code}</span>}
                            </div>
                        </div>

                        <div className="flex flex-col">
                            <label className="block text-sm font-medium mb-2">Description</label>
                            <textarea
                                name="description"
                                value={form.description}
                                onChange={handleChange}
                                rows={4}
                                placeholder="Enter description (optional)"
                                className={`w-full px-4 py-3 border rounded-xl focus:outline-none text-base resize-none ${errors.description ? 'border-red-500' : ''}`}
                                style={{ borderColor: errors.description ? '#ef4444' : colors.border.light }}
                            />
                            {errors.description && <span className="text-xs text-red-500 mt-1">{errors.description}</span>}
                        </div>

                        <div className="flex gap-4 mt-4 justify-end">
                            <PrimaryButton
                                type="button"
                                style={{ minWidth: 120, background: colors.primary[100], color: colors.text.primary }}
                                onClick={handleClose}
                            >
                                Cancel
                            </PrimaryButton>
                            <PrimaryButton type="submit" style={{ minWidth: 140 }}>
                                {editMode ? 'Update Process Type' : 'Save Process Type'}
                            </PrimaryButton>
                        </div>
                    </form>
                </Box>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
                <Box
                    sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        bgcolor: 'background.paper',
                        boxShadow: 24,
                        borderRadius: 2,
                        p: 4,
                        width: { xs: '90vw', sm: '400px' },
                        maxWidth: '95vw',
                    }}
                >
                    <Typography variant="h6" fontWeight={700} mb={2} color={colors.text.primary}>
                        Confirm Delete
                    </Typography>
                    <Typography variant="body1" mb={3} color={colors.text.secondary}>
                        Are you sure you want to delete process type{' '}
                        <strong>{processTypeToDelete?.name} ({processTypeToDelete?.code})</strong>?
                        This action cannot be undone.
                    </Typography>
                    <div className="flex gap-3 justify-end">
                        <PrimaryButton
                            type="button"
                            style={{
                                minWidth: 100,
                                background: colors.primary[100],
                                color: colors.text.primary
                            }}
                            onClick={() => setDeleteConfirmOpen(false)}
                        >
                            Cancel
                        </PrimaryButton>
                        <PrimaryButton
                            type="button"
                            style={{
                                minWidth: 100,
                                background: '#ef4444',
                                color: 'white'
                            }}
                            onClick={confirmDelete}
                        >
                            Delete
                        </PrimaryButton>
                    </div>
                </Box>
            </Modal>
        </div>
    );
}
