

import { useState, useEffect, useMemo } from 'react';
import { Modal, Box, Typography, FormControlLabel, Checkbox, IconButton } from '@mui/material';
import PrimaryButton from '../components/common/PrimaryButton';
import PrimaryTable from '../components/common/PrimaryTable';
import colors from '../styles/colors';
import toast from 'react-hot-toast';
import CustomerService, { type Customer, type PaginationInfo, type CustomerFetchOptions } from '../services/customerService';

import type { GridColDef } from '@mui/x-data-grid';

const getColumns = (onEdit: (customer: Customer) => void, onDelete: (customer: Customer) => void): GridColDef[] => [
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
                <IconButton
                    size="small"
                    onClick={() => onEdit(params.row as Customer)}
                    sx={{ color: colors.primary[500] }}
                >
                    ✏️
                </IconButton>
                <IconButton
                    size="small"
                    onClick={() => onDelete(params.row as Customer)}
                    sx={{ color: '#ef4444' }}
                >
                    🗑️
                </IconButton>
            </div>
        ),
    },
];

export default function CustomersPage() {
    const [search, setSearch] = useState('');
    const [rows, setRows] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(false);
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
    const [pagination, setPagination] = useState<PaginationInfo>({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 10,
        hasNextPage: false,
        hasPrevPage: false
    });
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

    // Load customers effect - runs when dependencies change
    useEffect(() => {
        const loadCustomers = async () => {
            try {
                setLoading(true);
                const options: CustomerFetchOptions = {
                    ...filters,
                    page: currentPage,
                    limit: pageSize
                };

                const response = await CustomerService.getAllCustomers(options);
                console.log('Loaded customers:', response); // Debug log

                setRows(response.customers);
                setPagination(response.pagination);
            } catch (error) {
                console.error('Failed to load customers:', error);
                // Set empty array on error
                setRows([]);
                setPagination({
                    currentPage: 1,
                    totalPages: 1,
                    totalItems: 0,
                    itemsPerPage: pageSize,
                    hasNextPage: false,
                    hasPrevPage: false
                });
                toast.error('Failed to load customers. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        loadCustomers();
    }, [filters, currentPage, pageSize]);

    // Manual reload function for after create/delete operations
    const reloadCustomers = async () => {
        try {
            setLoading(true);
            const options: CustomerFetchOptions = {
                ...filters,
                page: currentPage,
                limit: pageSize
            };

            const response = await CustomerService.getAllCustomers(options);
            setRows(response.customers);
            setPagination(response.pagination);
        } catch (error) {
            console.error('Failed to reload customers:', error);
            toast.error('Failed to reload customers. Please try again.');
        } finally {
            setLoading(false);
        }
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

        try {
            setLoading(true);
            await CustomerService.deleteCustomer(customerToDelete.id!);
            toast.success(`Customer ${customerToDelete.firstName} ${customerToDelete.lastName} deleted successfully!`);
            setDeleteConfirmOpen(false);
            setCustomerToDelete(null);
            reloadCustomers();
        } catch (error) {
            console.error('Failed to delete customer:', error);
            toast.error('Failed to delete customer. Please try again.');
        } finally {
            setLoading(false);
        }
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

        try {
            setLoading(true);
            setErrors({}); // Clear any previous errors

            if (editMode && selectedCustomer) {
                // Update existing customer
                console.log('Updating customer with data:', form); // Debug log
                const updatedCustomer = await CustomerService.updateCustomer(selectedCustomer.id!, form);
                console.log('Customer updated successfully:', updatedCustomer);

                // Simple success - just show toast and close modal first
                setOpen(false);

                // Use form data as fallback if updatedCustomer doesn't have the data
                const firstName = updatedCustomer.firstName || form.firstName;
                const lastName = updatedCustomer.lastName || form.lastName;
                toast.success(`Customer ${firstName} ${lastName} updated successfully!`);
            } else {
                // Create new customer
                console.log('Creating customer with data:', form); // Debug log
                const newCustomer = await CustomerService.createCustomer(form);
                console.log('Customer created successfully:', newCustomer);

                // Simple success - just show toast and close modal first
                setOpen(false);

                // Use form data as fallback if newCustomer doesn't have the data
                const firstName = newCustomer.firstName || form.firstName;
                const lastName = newCustomer.lastName || form.lastName;
                toast.success(`Customer ${firstName} ${lastName} created successfully!`);
            }

            // Reset form and state
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

            // Reload data after a short delay to prevent any race conditions
            setTimeout(() => {
                reloadCustomers();
            }, 500);

        } catch (error: unknown) {
            console.error(`Failed to ${editMode ? 'update' : 'create'} customer:`, error);
            // Handle validation errors from backend
            if (error && typeof error === 'object' && 'response' in error) {
                const axiosError = error as { response?: { data?: { errors?: Array<{ field: string; message: string }> } } };
                if (axiosError.response?.data?.errors) {
                    const backendErrors: { [key: string]: string } = {};
                    axiosError.response.data.errors.forEach((err: { field: string; message: string }) => {
                        backendErrors[err.field] = err.message;
                    });
                    setErrors(backendErrors);
                    toast.error('Please fix the validation errors and try again.');
                } else {
                    toast.error(`Failed to ${editMode ? 'update' : 'create'} customer. Please try again.`);
                }
            } else {
                toast.error('Network error. Please check your connection and try again.');
            }
        } finally {
            setLoading(false);
            console.log('Form submission completed'); // Debug log
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
                    <div className="w-full sm:w-auto mt-1 sm:mt-0">
                        <PrimaryButton style={{ minWidth: 140, width: '100%' }} onClick={handleOpen}>
                            + Add Customer
                        </PrimaryButton>
                    </div>
                </div>

                {/* Pagination Info */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-2 text-sm" style={{ color: colors.text.secondary }}>
                    <div>
                        Showing {rows.length > 0 ? ((pagination.currentPage - 1) * pagination.itemsPerPage + 1) : 0}-{Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of {pagination.totalItems} customers
                    </div>
                    <div className="flex items-center gap-2">
                        <label>Items per page:</label>
                        <select
                            value={pageSize}
                            onChange={e => handlePageSizeChange(Number(e.target.value))}
                            className="px-2 py-1 border rounded text-sm"
                            style={{ borderColor: colors.border.light }}
                        >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                        </select>
                    </div>
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
                    <>
                        <PrimaryTable
                            columns={getColumns(handleEdit, handleDelete)}
                            rows={rows}
                            pageSizeOptions={[5, 10, 20]}
                        />

                        {/* Custom Pagination Controls */}
                        {pagination.totalPages > 1 && (
                            <div className="flex justify-center items-center gap-2 mt-4">
                                <PrimaryButton
                                    style={{
                                        minWidth: 80,
                                        background: !pagination.hasPrevPage ? colors.primary[100] : colors.primary[500],
                                        color: !pagination.hasPrevPage ? colors.text.secondary : 'white'
                                    }}
                                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                                    disabled={!pagination.hasPrevPage}
                                >
                                    Previous
                                </PrimaryButton>

                                <div className="flex items-center gap-1">
                                    <span style={{ color: colors.text.secondary }}>
                                        Page {pagination.currentPage} of {pagination.totalPages}
                                    </span>
                                </div>

                                <PrimaryButton
                                    style={{
                                        minWidth: 80,
                                        background: !pagination.hasNextPage ? colors.primary[100] : colors.primary[500],
                                        color: !pagination.hasNextPage ? colors.text.secondary : 'white'
                                    }}
                                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                                    disabled={!pagination.hasNextPage}
                                >
                                    Next
                                </PrimaryButton>
                            </div>
                        )}
                    </>
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
