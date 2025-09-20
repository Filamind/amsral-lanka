import { useState, useEffect } from 'react';
import { Modal, Box, Typography, IconButton } from '@mui/material';
import type { GridColDef } from '@mui/x-data-grid';
import toast from 'react-hot-toast';
import PrimaryButton from '../common/PrimaryButton';
import PrimaryTable from '../common/PrimaryTable';
import colors from '../../styles/colors';
import { itemService, type Item } from '../../services/itemService';

interface ApiError {
    response?: {
        data?: {
            message?: string;
        };
    };
}

const getColumns = (onEdit: (item: Item) => void, onDelete: (item: Item) => void): GridColDef[] => [
    { field: 'id', headerName: 'ID', flex: 0.6, minWidth: 80 },
    { field: 'name', headerName: 'Item Name', flex: 1.5, minWidth: 150 },
    { field: 'code', headerName: 'Code', flex: 0.8, minWidth: 100 },
    { field: 'description', headerName: 'Description', flex: 2, minWidth: 200 },
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
                    onClick={() => onEdit(params.row as Item)}
                    sx={{ color: colors.primary[500] }}
                >
                    ✏️
                </IconButton>
                <IconButton
                    size="small"
                    onClick={() => onDelete(params.row as Item)}
                    sx={{ color: '#ef4444' }}
                >
                    🗑️
                </IconButton>
            </div>
        ),
    },
];

export default function ItemsSection() {
    const [search, setSearch] = useState('');
    const [rows, setRows] = useState<Item[]>([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedItem, setSelectedItem] = useState<Item | null>(null);
    const [form, setForm] = useState({
        name: '',
        code: '',
        description: '',
    });
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<Item | null>(null);

    // Pagination state
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalRecords: 0,
        limit: 10,
    });
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    // Load items when dependencies change (with debounce for search)
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            const loadData = async () => {
                try {
                    setLoading(true);
                    const response = await itemService.getItems(currentPage, pageSize, search.trim() || undefined);
                    setRows(response.data.items);
                    setPagination(response.data.pagination);
                } catch (error) {
                    const errorMessage = (error as ApiError)?.response?.data?.message || 'Failed to load items';
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
        if (!form.name.trim()) newErrors.name = 'Item name is required';
        if (!form.code.trim()) newErrors.code = 'Code is required';
        if (form.name.length > 100) newErrors.name = 'Item name must be 100 characters or less';
        if (form.code.length > 20) newErrors.code = 'Code must be 20 characters or less';
        if (form.description && form.description.length > 500) {
            newErrors.description = 'Description must be 500 characters or less';
        }

        // Check for unique code
        const isCodeUnique = !rows.some(row =>
            row.code.toLowerCase() === form.code.toLowerCase() &&
            (!editMode || row.id !== selectedItem?.id)
        );
        if (!isCodeUnique) newErrors.code = 'Code must be unique';

        return newErrors;
    };

    const handleEdit = (item: Item) => {
        setSelectedItem(item);
        setEditMode(true);
        setForm({
            name: item.name || '',
            code: item.code || '',
            description: item.description || '',
        });
        setErrors({});
        setOpen(true);
    };

    const handleDelete = (item: Item) => {
        setItemToDelete(item);
        setDeleteConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;

        try {
            await itemService.deleteItem(itemToDelete.id);
            setRows(prev => prev.filter(item => item.id !== itemToDelete.id));
            setDeleteConfirmOpen(false);
            setItemToDelete(null);
            toast.success('Item deleted successfully');
        } catch (error) {
            const errorMessage = (error as ApiError)?.response?.data?.message || 'Failed to delete item';
            toast.error(errorMessage);
        }
    };

    const handleOpen = () => {
        setEditMode(false);
        setSelectedItem(null);
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
        setSelectedItem(null);
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
            if (editMode && selectedItem) {
                // Update existing item
                const response = await itemService.updateItem(selectedItem.id, {
                    name: form.name,
                    description: form.description || undefined,
                });
                setRows(prev => prev.map(item =>
                    item.id === selectedItem.id ? response.data : item
                ));
                toast.success('Item updated successfully');
            } else {
                // Create new item
                const response = await itemService.createItem({
                    name: form.name,
                    description: form.description || undefined,
                });
                setRows(prev => [response.data, ...prev]);
                toast.success('Item created successfully');
            }

            setOpen(false);
        } catch (error) {
            const errorMessage = (error as ApiError)?.response?.data?.message || 'Failed to save item';
            toast.error(errorMessage);
        }
    };

    return (
        <div>
            <div className="flex flex-col gap-2 sm:gap-3 mb-4">
                <h3 className="text-lg md:text-xl font-semibold" style={{ color: colors.text.primary }}>
                    Items Management
                </h3>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 w-full">
                    <div className="flex flex-1 items-center w-full sm:w-auto">
                        <input
                            type="text"
                            placeholder="Search items..."
                            value={search}
                            onChange={handleSearchChange}
                            className="flex-1 px-3 py-2 border rounded-xl focus:outline-none text-sm sm:text-base"
                            style={{ borderColor: colors.border.light, maxWidth: 300 }}
                        />
                    </div>
                    <div className="w-full sm:w-auto mt-1 sm:mt-0">
                        <PrimaryButton style={{ minWidth: 140, width: '100%' }} onClick={handleOpen}>
                            + Add Item
                        </PrimaryButton>
                    </div>
                </div>
            </div>

            <div className="mt-1">
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="text-lg" style={{ color: colors.text.secondary }}>
                            Loading items...
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

            {/* Modal for Add/Edit Item */}
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
                        {editMode ? 'Edit Item' : 'Add Item'}
                    </Typography>
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex flex-col">
                                <label className="block text-sm font-medium mb-2">
                                    Item Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    name="name"
                                    value={form.name}
                                    onChange={handleChange}
                                    placeholder="Enter item name"
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
                                    placeholder="Enter code (e.g., ITM001)"
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
                                placeholder="Enter item description (optional)"
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
                                {editMode ? 'Update Item' : 'Save Item'}
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
                        Are you sure you want to delete item{' '}
                        <strong>{itemToDelete?.name} ({itemToDelete?.code})</strong>?
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
