

import { useState, useEffect, useMemo } from 'react';
import { Modal, Box, Typography, FormControlLabel, Checkbox, IconButton } from '@mui/material';
import PrimaryButton from '../components/common/PrimaryButton';
import PrimaryTable from '../components/common/PrimaryTable';
import colors from '../styles/colors';
import toast from 'react-hot-toast';
import {
    useCustomers,
    useCreateCustomer,
    useUpdateCustomer,
    useDeleteCustomer,
    type CustomerFetchOptions,
} from '../hooks/useCustomers';
import { type Customer } from '../services/customerService';
import { useAuth } from '../hooks/useAuth';
import { hasPermission } from '../utils/roleUtils';

import type { GridColDef } from '@mui/x-data-grid';

const getColumns = (onEdit: (customer: Customer) => void, onDelete: (customer: Customer) => void, canEdit: boolean, canDelete: boolean): GridColDef[] => [
    { field: 'customerCode', headerName: 'Code', flex: 0.8, minWidth: 110 },
    { field: 'firstName', headerName: 'First Name', flex: 1, minWidth: 130 },
    { field: 'lastName', headerName: 'Last Name', flex: 1, minWidth: 130 },
    { field: 'phone', headerName: 'Phone', flex: 1, minWidth: 130 },
    { field: 'email', headerName: 'Email', flex: 1.5, minWidth: 200 },
    { field: 'address', headerName: 'Address', flex: 1.2, minWidth: 160 },
    { field: 'mapLink', headerName: 'Map Link', flex: 1, minWidth: 120 },
    { field: 'isActive', headerName: 'Active', flex: 0.6, minWidth: 80, type: 'boolean' as const },
    {
        field: 'actions',
        headerName: 'Actions',
        flex: 0.8,
        minWidth: 120,
        sortable: false,
        renderCell: (params) => (
            <div className="flex gap-2">
                {canEdit && (
                    <IconButton
                        size="small"
                        onClick={() => onEdit(params.row as Customer)}
                        sx={{ color: colors.primary[500] }}
                    >
                        ✏️
                    </IconButton>
                )}
                {canDelete && (
                    <IconButton
                        size="small"
                        onClick={() => onDelete(params.row as Customer)}
                        sx={{ color: '#ef4444' }}
                    >
                        🗑️
                    </IconButton>
                )}
            </div>
        ),
    },
];

export default function CustomersPage() {
    const { user } = useAuth();

    // Local state for UI
    const [search, setSearch] = useState('');
    const [open, setOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [form, setForm] = useState({
        customerCode: '',
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        address: '',
        mapLink: '',
        notes: '',
        isActive: true,
    });
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

    // Pagination state
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    // Filter state - memoized to prevent unnecessary re-renders
    const [filterState, setFilterState] = useState<CustomerFetchOptions>({
        isActive: null,
        isDeleted: false,
        search: ''
    });

    // Memoize filters object to prevent unnecessary re-renders
    const filters = useMemo(() => filterState, [filterState]);

    // Prepare filters for TanStack Query hooks
    const customerFilters: CustomerFetchOptions = {
        ...filters,
        page: currentPage,
        limit: pageSize
    };

    // TanStack Query hooks
    const {
        data: customersData,
        isLoading: loading
    } = useCustomers(customerFilters);

    // Mutation hooks
    const createCustomerMutation = useCreateCustomer();
    const updateCustomerMutation = useUpdateCustomer();
    const deleteCustomerMutation = useDeleteCustomer();

    // Derived state
    const rows = customersData?.customers || [];
    const pagination = customersData?.pagination || {
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 10,
        hasNextPage: false,
        hasPrevPage: false
    };


    // Debounced search effect
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            handleFilterChange({ search: search });
        }, 500); // 500ms debounce

        return () => clearTimeout(timeoutId);
    }, [search]);

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
    };

    const handlePageSizeChange = (newPageSize: number) => {
        setPageSize(newPageSize);
        setCurrentPage(1); // Reset to first page when page size changes
    };

    const handleFilterChange = (newFilters: Partial<CustomerFetchOptions>) => {
        setFilterState(prev => ({ ...prev, ...newFilters }));
        setCurrentPage(1); // Reset to first page when filters change
    };

    // For unique validation
    const isUnique = (field: string, value: string) => {
        if (!value) return true;
        if (!Array.isArray(rows)) return true; // Safety check
        return !rows.some((row: Customer) => {
            // Skip validation for the customer being edited
            if (editMode && selectedCustomer && row.id === selectedCustomer.id) {
                return false;
            }
            if (field === 'customerCode') return row.customerCode === value;
            if (field === 'email') return row.email === value;
            return false;
        });
    };

    const validate = () => {
        const newErrors: { [key: string]: string } = {};
        if (!form.customerCode) newErrors.customerCode = 'Required';
        else if (!isUnique('customerCode', form.customerCode)) newErrors.customerCode = 'Code must be unique';
        if (!form.firstName) newErrors.firstName = 'Required';
        if (!form.lastName) newErrors.lastName = 'Required';
        if (!form.phone) newErrors.phone = 'Required';
        if (form.email && !isUnique('email', form.email)) newErrors.email = 'Email must be unique';
        return newErrors;
    };

    // Handler functions for edit and delete
    const handleEdit = (customer: Customer) => {
        setSelectedCustomer(customer);
        setEditMode(true);
        setForm({
            customerCode: customer.customerCode || '',
            firstName: customer.firstName || '',
            lastName: customer.lastName || '',
            phone: customer.phone || '',
            email: customer.email || '',
            address: customer.address || '',
            mapLink: customer.mapLink || '',
            notes: customer.notes || '',
            isActive: customer.isActive !== undefined ? customer.isActive : true,
        });
        setErrors({});
        setOpen(true);
    };

    const handleDelete = (customer: Customer) => {
        setCustomerToDelete(customer);
        setDeleteConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (!customerToDelete) return;

        deleteCustomerMutation.mutate(customerToDelete.id!, {
            onSuccess: () => {
                setDeleteConfirmOpen(false);
                setCustomerToDelete(null);
            },
            onError: (error: Error) => {
                console.error('Failed to delete customer:', error);
                toast.error(error.message || 'Failed to delete customer. Please try again.');
            }
        });
    };

    const handleOpen = () => {
        setEditMode(false);
        setSelectedCustomer(null);
        setForm({
            customerCode: '',
            firstName: '',
            lastName: '',
            phone: '',
            email: '',
            address: '',
            mapLink: '',
            notes: '',
            isActive: true,
        });
        setErrors({});
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setEditMode(false);
        setSelectedCustomer(null);
        setErrors({});
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        let checked = false;
        if (type === 'checkbox' && 'checked' in e.target) {
            checked = (e.target as HTMLInputElement).checked;
        }
        setForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Form submitted'); // Debug log

        const validation = validate();
        if (Object.keys(validation).length > 0) {
            setErrors(validation);
            return;
        }

        setErrors({}); // Clear any previous errors

        if (editMode && selectedCustomer) {
            // Update existing customer
            updateCustomerMutation.mutate(
                { id: selectedCustomer.id!, data: form },
                {
                    onSuccess: () => {
                        setOpen(false);
                        setForm({
                            customerCode: '',
                            firstName: '',
                            lastName: '',
                            phone: '',
                            email: '',
                            address: '',
                            mapLink: '',
                            notes: '',
                            isActive: true,
                        });
                        setEditMode(false);
                        setSelectedCustomer(null);
                    },
                    onError: (error: Error) => {
                        console.error('Failed to update customer:', error);
                        toast.error(error.message || 'Failed to update customer. Please try again.');
                    }
                }
            );
        } else {
            // Create new customer
            createCustomerMutation.mutate(form, {
                onSuccess: () => {
                    setOpen(false);
                    setForm({
                        customerCode: '',
                        firstName: '',
                        lastName: '',
                        phone: '',
                        email: '',
                        address: '',
                        mapLink: '',
                        notes: '',
                        isActive: true,
                    });
                    setEditMode(false);
                    setSelectedCustomer(null);
                },
                onError: (error: Error) => {
                    console.error('Failed to create customer:', error);
                    toast.error(error.message || 'Failed to create customer. Please try again.');
                }
            });
        }
    };

    const handleSearchChange = (value: string) => {
        setSearch(value);
        // The debounced search effect will handle the API call
    };

    return (
        <div className="w-full mx-auto px-1 sm:px-3 md:px-4 py-3">
            <div className="flex flex-col gap-2 sm:gap-3 mb-4">
                <h2 className="text-xl md:text-2xl font-bold" style={{ color: colors.text.primary }}>Customers</h2>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 w-full">
                    <div className="flex flex-1 items-center gap-3 w-full sm:w-auto">
                        <input
                            type="text"
                            placeholder="Search by customer name..."
                            value={search}
                            onChange={e => handleSearchChange(e.target.value)}
                            className="flex-1 px-3 py-2 border rounded-xl focus:outline-none text-sm sm:text-base"
                            style={{ borderColor: colors.border.light, maxWidth: 300 }}
                        />
                        <select
                            value={filters.isActive === null ? 'all' : filters.isActive ? 'active' : 'inactive'}
                            onChange={e => {
                                const value = e.target.value;
                                handleFilterChange({
                                    isActive: value === 'all' ? null : value === 'active'
                                });
                            }}
                            className="px-3 py-2 border rounded-xl focus:outline-none text-sm sm:text-base"
                            style={{ borderColor: colors.border.light }}
                        >
                            <option value="all">All Customers</option>
                            <option value="active">Active Only</option>
                            <option value="inactive">Inactive Only</option>
                        </select>
                    </div>
                    {hasPermission(user, 'canEdit') && (
                        <div className="w-full sm:w-auto mt-1 sm:mt-0">
                            <PrimaryButton style={{ minWidth: 140, width: '100%' }} onClick={handleOpen}>
                                + Add Customer
                            </PrimaryButton>
                        </div>
                    )}
                </div>

            </div>
            <div className="mt-1">
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="text-lg" style={{ color: colors.text.secondary }}>
                            Loading customers...
                        </div>
                    </div>
                ) : (
                    <PrimaryTable
                        columns={getColumns(handleEdit, handleDelete, hasPermission(user, 'canEdit'), hasPermission(user, 'canDelete'))}
                        rows={rows}
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
                        height="auto"
                    />
                )}
            </div>
            {/* Modal for Add Customer */}
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
                        p: { xs: 2, sm: 3, md: 4 },
                        width: { xs: '95vw', sm: '95vw', md: '90vw', lg: '900px', xl: '1000px' },
                        maxWidth: '95vw',
                        maxHeight: '95vh',
                        overflowY: 'auto',
                    }}
                >
                    <Typography variant="h6" fontWeight={700} mb={2} color={colors.text.primary}>
                        {editMode ? 'Edit Customer' : 'Add Customer'}
                    </Typography>
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="flex flex-col">
                                <label className="block text-sm font-medium mb-2">Customer Code <span className="text-red-500">*</span></label>
                                <input
                                    name="customerCode"
                                    value={form.customerCode}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none text-base ${errors.customerCode ? 'border-red-500' : ''}`}
                                    style={{ borderColor: colors.border.light }}
                                />
                                {errors.customerCode && <span className="text-xs text-red-500 mt-1">{errors.customerCode}</span>}
                            </div>
                            <div className="flex flex-col">
                                <label className="block text-sm font-medium mb-2">First Name <span className="text-red-500">*</span></label>
                                <input
                                    name="firstName"
                                    value={form.firstName}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none text-base ${errors.firstName ? 'border-red-500' : ''}`}
                                    style={{ borderColor: colors.border.light }}
                                />
                                {errors.firstName && <span className="text-xs text-red-500 mt-1">{errors.firstName}</span>}
                            </div>
                            <div className="flex flex-col">
                                <label className="block text-sm font-medium mb-2">Last Name <span className="text-red-500">*</span></label>
                                <input
                                    name="lastName"
                                    value={form.lastName}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none text-base ${errors.lastName ? 'border-red-500' : ''}`}
                                    style={{ borderColor: colors.border.light }}
                                />
                                {errors.lastName && <span className="text-xs text-red-500 mt-1">{errors.lastName}</span>}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="flex flex-col">
                                <label className="block text-sm font-medium mb-2">Phone <span className="text-red-500">*</span></label>
                                <input
                                    name="phone"
                                    value={form.phone}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none text-base ${errors.phone ? 'border-red-500' : ''}`}
                                    style={{ borderColor: colors.border.light }}
                                />
                                {errors.phone && <span className="text-xs text-red-500 mt-1">{errors.phone}</span>}
                            </div>
                            <div className="flex flex-col">
                                <label className="block text-sm font-medium mb-2">Email</label>
                                <input
                                    name="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none text-base ${errors.email ? 'border-red-500' : ''}`}
                                    style={{ borderColor: colors.border.light }}
                                />
                                {errors.email && <span className="text-xs text-red-500 mt-1">{errors.email}</span>}
                            </div>
                            <div className="flex flex-col">
                                <label className="block text-sm font-medium mb-2">Map Link</label>
                                <input
                                    name="mapLink"
                                    value={form.mapLink}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border rounded-xl focus:outline-none text-base"
                                    style={{ borderColor: colors.border.light }}
                                    placeholder="Enter map URL or location link"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex flex-col">
                                <label className="block text-sm font-medium mb-2">Address</label>
                                <input
                                    name="address"
                                    value={form.address}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border rounded-xl focus:outline-none text-base"
                                    style={{ borderColor: colors.border.light }}
                                />
                            </div>
                            <div className="flex flex-col">
                                <label className="block text-sm font-medium mb-2">Notes</label>
                                <input
                                    name="notes"
                                    value={form.notes}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border rounded-xl focus:outline-none text-base"
                                    style={{ borderColor: colors.border.light }}
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        name="isActive"
                                        checked={form.isActive}
                                        onChange={handleChange}
                                        sx={{ color: colors.primary[500], '&.Mui-checked': { color: colors.primary[500] } }}
                                    />
                                }
                                label={<span className="text-base">Active</span>}
                            />
                        </div>
                        <div className="flex gap-4 mt-4 justify-end">
                            <PrimaryButton type="button" style={{ minWidth: 120, background: colors.primary[100], color: colors.text.primary }} onClick={handleClose}>
                                Cancel
                            </PrimaryButton>
                            <PrimaryButton type="submit" style={{ minWidth: 140 }} disabled={loading}>
                                {loading ? (editMode ? 'Updating...' : 'Saving...') : (editMode ? 'Update Customer' : 'Save Customer')}
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
                        Are you sure you want to delete customer{' '}
                        <strong>{customerToDelete?.firstName} {customerToDelete?.lastName}</strong>?
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
                            disabled={loading}
                        >
                            {loading ? 'Deleting...' : 'Delete'}
                        </PrimaryButton>
                    </div>
                </Box>
            </Modal>
        </div>
    );
}
