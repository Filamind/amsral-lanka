import { useState, useEffect } from 'react';
import { Modal, Box, Typography, IconButton } from '@mui/material';
import type { GridColDef } from '@mui/x-data-grid';
import toast from 'react-hot-toast';
import PrimaryButton from '../common/PrimaryButton';
import PrimaryTable from '../common/PrimaryTable';
import colors from '../../styles/colors';
import { washingTypeService, type WashingType } from '../../services/washingTypeService';

interface ApiError {
    response?: {
        data?: {
            message?: string;
        };
    };
}

const getColumns = (onEdit: (washingType: WashingType) => void, onDelete: (washingType: WashingType) => void): GridColDef[] => [
    { field: 'id', headerName: 'ID', flex: 0.6, minWidth: 80 },
    { field: 'name', headerName: 'Name', flex: 1.5, minWidth: 150 },
    { field: 'code', headerName: 'Code', flex: 1, minWidth: 100 },
    { field: 'description', headerName: 'Description', flex: 2.5, minWidth: 250 },
    { field: 'createdAt', headerName: 'Created At', flex: 1.2, minWidth: 140 },
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
                    onClick={() => onEdit(params.row as WashingType)}
                    sx={{ color: colors.primary[500] }}
                >
                    ✏️
                </IconButton>
                <IconButton
                    size="small"
                    onClick={() => onDelete(params.row as WashingType)}
                    sx={{ color: '#ef4444' }}
                >
                    🗑️
                </IconButton>
            </div>
        ),
    },
];

export default function WashingTypesSection() {
    const [search, setSearch] = useState('');
    const [rows, setRows] = useState<WashingType[]>([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedWashingType, setSelectedWashingType] = useState<WashingType | null>(null);
    const [form, setForm] = useState({
        name: '',
        code: '',
        description: '',
    });
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [washingTypeToDelete, setWashingTypeToDelete] = useState<WashingType | null>(null);

    // Pagination state
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalRecords: 0,
        limit: 10,
    });
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    // Load washing types when dependencies change (with debounce for search)
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            const loadData = async () => {
                try {
                    setLoading(true);
                    const response = await washingTypeService.getWashingTypes({
                        page: currentPage,
                        limit: pageSize,
                        search: search.trim() || undefined
                    });
                    setRows(response.data.washingTypes);
                    setPagination(response.data.pagination);
                } catch (error) {
                    const errorMessage = (error as ApiError)?.response?.data?.message || 'Failed to load washing types';
                    toast.error(errorMessage);
                } finally {
                    setLoading(false);
                }
            };
            loadData();
        }, search ? 300 : 0); // 300ms debounce for search, immediate for page/size changes

        return () => clearTimeout(timeoutId);
    }, [currentPage, pageSize, search]);

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
    };

    const handlePageSizeChange = (newPageSize: number) => {
        setPageSize(newPageSize);
        setCurrentPage(1); // Reset to first page when page size changes
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
        setCurrentPage(1); // Reset to first page when search changes
    };

    const validate = () => {
        const newErrors: { [key: string]: string } = {};
        if (!form.name.trim()) newErrors.name = 'Name is required';
        if (!form.code.trim()) newErrors.code = 'Code is required';
        if (form.name.length > 100) newErrors.name = 'Name must be 100 characters or less';
        if (form.code.length > 20) newErrors.code = 'Code must be 20 characters or less';
        if (form.description && form.description.length > 500) {
            newErrors.description = 'Description must be 500 characters or less';
        }

        // Check for unique code
        const isCodeUnique = !rows.some(row =>
            row.code.toLowerCase() === form.code.toLowerCase() &&
            (!editMode || row.id !== selectedWashingType?.id)
        );
        if (!isCodeUnique) newErrors.code = 'Code must be unique';

        return newErrors;
    };

    const handleEdit = (washingType: WashingType) => {
        setSelectedWashingType(washingType);
        setEditMode(true);
        setForm({
            name: washingType.name || '',
            code: washingType.code || '',
            description: washingType.description || '',
        });
        setErrors({});
        setOpen(true);
    };

    const handleDelete = (washingType: WashingType) => {
        setWashingTypeToDelete(washingType);
        setDeleteConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (!washingTypeToDelete) return;

        try {
            await washingTypeService.deleteWashingType(washingTypeToDelete.id);
            setRows(prev => prev.filter(washingType => washingType.id !== washingTypeToDelete.id));
            setDeleteConfirmOpen(false);
            setWashingTypeToDelete(null);
            toast.success('Washing type deleted successfully');
        } catch (error) {
            const errorMessage = (error as ApiError)?.response?.data?.message || 'Failed to delete washing type';
            toast.error(errorMessage);
        }
    };

    const handleOpen = () => {
        setEditMode(false);
        setSelectedWashingType(null);
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
        setSelectedWashingType(null);
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
            if (editMode && selectedWashingType) {
                // Update existing washing type
                const response = await washingTypeService.updateWashingType(selectedWashingType.id, {
                    name: form.name,
                    code: form.code,
                    description: form.description || undefined,
                });
                setRows(prev => prev.map(washingType =>
                    washingType.id === selectedWashingType.id ? response.data : washingType
                ));
                toast.success('Washing type updated successfully');
            } else {
                // Create new washing type
                const response = await washingTypeService.createWashingType({
                    name: form.name,
                    code: form.code,
                    description: form.description || undefined,
                });
                setRows(prev => [response.data, ...prev]);
                toast.success('Washing type created successfully');
            }

            setOpen(false);
        } catch (error) {
            const errorMessage = (error as ApiError)?.response?.data?.message || 'Failed to save washing type';
            toast.error(errorMessage);
        }
    };

    return (
        <div>
            <div className="flex flex-col gap-2 sm:gap-3 mb-4">
                <h3 className="text-lg md:text-xl font-semibold" style={{ color: colors.text.primary }}>
                    Washing Types Management
                </h3>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 w-full">
                    <div className="flex flex-1 items-center w-full sm:w-auto">
                        <input
                            type="text"
                            placeholder="Search washing types..."
                            value={search}
                            onChange={handleSearchChange}
                            className="flex-1 px-3 py-2 border rounded-xl focus:outline-none text-sm sm:text-base"
                            style={{ borderColor: colors.border.light, maxWidth: 300 }}
                        />
                    </div>
                    <div className="w-full sm:w-auto mt-1 sm:mt-0">
                        <PrimaryButton style={{ minWidth: 140, width: '100%' }} onClick={handleOpen}>
                            + Add Washing Type
                        </PrimaryButton>
                    </div>
                </div>
            </div>

            <div className="mt-1">
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="text-lg" style={{ color: colors.text.secondary }}>
                            Loading washing types...
                        </div>
                    </div>
                ) : (
                    <PrimaryTable
                        columns={getColumns(handleEdit, handleDelete)}
                        rows={rows}
                        pagination
                        paginationMode="server"
                        paginationModel={{
                            page: pagination.currentPage - 1, // DataGrid uses 0-based indexing
                            pageSize: pageSize
                        }}
                        rowCount={pagination.totalRecords}
                        pageSizeOptions={[5, 10, 20, 50]}
                        onPaginationModelChange={(model) => {
                            if (model.pageSize !== pageSize) {
                                handlePageSizeChange(model.pageSize);
                            }
                            if (model.page !== pagination.currentPage - 1) {
                                handlePageChange(model.page + 1); // Convert back to 1-based
                            }
                        }}
                        loading={loading}
                    />
                )}
            </div>

            {/* Modal for Add/Edit Washing Type */}
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
                        {editMode ? 'Edit Washing Type' : 'Add Washing Type'}
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
                                    placeholder="Enter washing type name"
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
                                    placeholder="Enter code (e.g., N/W)"
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
                                {editMode ? 'Update Washing Type' : 'Save Washing Type'}
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
                        Are you sure you want to delete washing type{' '}
                        <strong>{washingTypeToDelete?.name} ({washingTypeToDelete?.code})</strong>?
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
