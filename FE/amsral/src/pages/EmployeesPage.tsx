
import { Modal, Box, Typography, FormControlLabel, Checkbox, IconButton } from '@mui/material';
import type { GridColDef } from '@mui/x-data-grid';
import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import PrimaryButton from '../components/common/PrimaryButton';
import PrimaryTable from '../components/common/PrimaryTable';
import PrimaryDatePicker from '../components/common/PrimaryDatePicker';
import colors from '../styles/colors';
import EmployeeService, { type Employee, type PaginationInfo, type EmployeeFetchOptions } from '../services/employeeService';

const getColumns = (onEdit: (employee: Employee) => void, onDelete: (employee: Employee) => void): GridColDef[] => [
    { field: 'id', headerName: 'ID', flex: 0.6, minWidth: 80 },
    { field: 'firstName', headerName: 'First Name', flex: 1, minWidth: 120 },
    { field: 'lastName', headerName: 'Last Name', flex: 1, minWidth: 120 },
    { field: 'phone', headerName: 'Phone', flex: 1.1, minWidth: 130 },
    { field: 'email', headerName: 'Email', flex: 1.5, minWidth: 180 },
    { field: 'hireDate', headerName: 'Hire Date', flex: 1, minWidth: 110 },
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
                    onClick={() => onEdit(params.row as Employee)}
                    sx={{ color: colors.primary[500] }}
                >
                    ✏️
                </IconButton>
                <IconButton
                    size="small"
                    onClick={() => onDelete(params.row as Employee)}
                    sx={{ color: '#ef4444' }}
                >
                    🗑️
                </IconButton>
            </div>
        ),
    },
];

// Using Employee interface from service

export default function EmployeesPage() {
    const [search, setSearch] = useState('');
    const [rows, setRows] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        hireDate: '',
        dateOfBirth: '',
        address: '',
        emergencyContact: '',
        isActive: true,
    });
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);

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
    const [filterState, setFilterState] = useState<EmployeeFetchOptions>({
        isActive: null,
        isDeleted: false,
        search: ''
    });

    // Memoize filters object to prevent unnecessary re-renders
    const filters = useMemo(() => filterState, [filterState]);

    // Load employees effect - runs when dependencies change
    useEffect(() => {
        const loadEmployees = async () => {
            try {
                setLoading(true);
                const options: EmployeeFetchOptions = {
                    ...filters,
                    page: currentPage,
                    limit: pageSize
                };

                const response = await EmployeeService.getAllEmployees(options);
                console.log('Loaded employees:', response); // Debug log

                setRows(response.employees);
                setPagination(response.pagination);
            } catch (error) {
                console.error('Failed to load employees:', error);
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
                toast.error('Failed to load employees. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        loadEmployees();
    }, [filters, currentPage, pageSize]);

    // Manual reload function for after create/delete operations
    const reloadEmployees = async () => {
        try {
            setLoading(true);
            const options: EmployeeFetchOptions = {
                ...filters,
                page: currentPage,
                limit: pageSize
            };

            const response = await EmployeeService.getAllEmployees(options);
            setRows(response.employees);
            setPagination(response.pagination);
        } catch (error) {
            console.error('Failed to reload employees:', error);
            toast.error('Failed to reload employees. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Debounced search effect - directly update filterState
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setFilterState(prev => ({ ...prev, search: search }));
            setCurrentPage(1); // Reset to first page when search changes
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

    const handleFilterChange = (newFilters: Partial<EmployeeFetchOptions>) => {
        setFilterState(prev => ({ ...prev, ...newFilters }));
        setCurrentPage(1); // Reset to first page when filters change
    };

    const isUnique = (field: string, value: string) => {
        if (!value) return true;
        if (!Array.isArray(rows)) return true; // Safety check
        return !rows.some((row: Employee) => {
            // Skip validation for the employee being edited
            if (editMode && selectedEmployee && row.id === selectedEmployee.id) {
                return false;
            }
            if (field === 'email') return row.email === value;
            return false;
        });
    };

    const validate = () => {
        const newErrors: { [key: string]: string } = {};
        if (!form.firstName) newErrors.firstName = 'Required';
        if (!form.lastName) newErrors.lastName = 'Required';
        if (!form.phone) newErrors.phone = 'Required';
        if (form.email && !isUnique('email', form.email)) newErrors.email = 'Email must be unique';
        return newErrors;
    };

    // Handler functions for edit and delete
    const handleEdit = (employee: Employee) => {
        setSelectedEmployee(employee);
        setEditMode(true);
        setForm({
            firstName: employee.firstName || '',
            lastName: employee.lastName || '',
            phone: employee.phone || '',
            email: employee.email || '',
            hireDate: employee.hireDate || '',
            dateOfBirth: employee.dateOfBirth || '',
            address: employee.address || '',
            emergencyContact: employee.emergencyContact || '',
            isActive: employee.isActive !== undefined ? employee.isActive : true,
        });
        setErrors({});
        setOpen(true);
    };

    const handleDelete = (employee: Employee) => {
        setEmployeeToDelete(employee);
        setDeleteConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (!employeeToDelete) return;

        try {
            setLoading(true);
            await EmployeeService.deleteEmployee(employeeToDelete.id!);
            toast.success(`Employee ${employeeToDelete.firstName} ${employeeToDelete.lastName} deleted successfully!`);
            setDeleteConfirmOpen(false);
            setEmployeeToDelete(null);
            reloadEmployees();
        } catch (error) {
            console.error('Failed to delete employee:', error);
            toast.error('Failed to delete employee. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleOpen = () => {
        setEditMode(false);
        setSelectedEmployee(null);
        setForm({
            firstName: '',
            lastName: '',
            phone: '',
            email: '',
            hireDate: '',
            dateOfBirth: '',
            address: '',
            emergencyContact: '',
            isActive: true,
        });
        setErrors({});
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setEditMode(false);
        setSelectedEmployee(null);
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

            if (editMode && selectedEmployee) {
                // Update existing employee
                console.log('Updating employee with data:', form); // Debug log
                const updatedEmployee = await EmployeeService.updateEmployee(selectedEmployee.id!, form);
                console.log('Employee updated successfully:', updatedEmployee);

                // Simple success - just show toast and close modal first
                setOpen(false);

                // Use form data as fallback if updatedEmployee doesn't have the data
                const firstName = updatedEmployee.firstName || form.firstName;
                const lastName = updatedEmployee.lastName || form.lastName;
                toast.success(`Employee ${firstName} ${lastName} updated successfully!`);
            } else {
                // Create new employee
                console.log('Creating employee with data:', form); // Debug log
                const newEmployee = await EmployeeService.createEmployee(form);
                console.log('Employee created successfully:', newEmployee);
                console.log('Employee firstName:', newEmployee.firstName);
                console.log('Employee lastName:', newEmployee.lastName);

                // Simple success - just show toast and close modal first
                setOpen(false);

                // Use form data as fallback if newEmployee doesn't have the data
                const firstName = newEmployee.firstName || form.firstName;
                const lastName = newEmployee.lastName || form.lastName;
                toast.success(`Employee ${firstName} ${lastName} created successfully!`);
            }

            // Reset form and state
            setForm({
                firstName: '',
                lastName: '',
                phone: '',
                email: '',
                hireDate: '',
                dateOfBirth: '',
                address: '',
                emergencyContact: '',
                isActive: true,
            });
            setEditMode(false);
            setSelectedEmployee(null);

            // Reload data after a short delay to prevent any race conditions
            setTimeout(() => {
                reloadEmployees();
            }, 500);

        } catch (error: unknown) {
            console.error(`Failed to ${editMode ? 'update' : 'create'} employee:`, error);
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
                    toast.error(`Failed to ${editMode ? 'update' : 'create'} employee. Please try again.`);
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
                <h2 className="text-xl md:text-2xl font-bold" style={{ color: colors.text.primary }}>Employees</h2>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 w-full">
                    <div className="flex flex-1 items-center gap-3 w-full sm:w-auto">
                        <input
                            type="text"
                            placeholder="Search by employee name..."
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
                            <option value="all">All Employees</option>
                            <option value="active">Active Only</option>
                            <option value="inactive">Inactive Only</option>
                        </select>
                    </div>
                    <div className="w-full sm:w-auto mt-1 sm:mt-0">
                        <PrimaryButton style={{ minWidth: 140, width: '100%' }} onClick={handleOpen}>
                            + Add Employee
                        </PrimaryButton>
                    </div>
                </div>
            </div>
            <div className="mt-1">
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="text-lg" style={{ color: colors.text.secondary }}>
                            Loading employees...
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
                        rowCount={pagination.totalItems}
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
            {/* Modal for Add Employee */}
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
                        width: { xs: '95vw', sm: '95vw', md: '90vw', lg: '1000px', xl: '1100px' },
                        maxWidth: '95vw',
                        maxHeight: '95vh',
                        overflowY: 'auto',
                    }}
                >
                    <Typography variant="h6" fontWeight={700} mb={2} color={colors.text.primary}>
                        {editMode ? 'Edit Employee' : 'Add Employee'}
                    </Typography>
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                            <div className="flex flex-col">
                                <PrimaryDatePicker
                                    name="hireDate"
                                    value={form.hireDate}
                                    onChange={handleChange}
                                    label="Hire Date"
                                />
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
                                    type="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none text-base ${errors.email ? 'border-red-500' : ''}`}
                                    style={{ borderColor: colors.border.light }}
                                />
                                {errors.email && <span className="text-xs text-red-500 mt-1">{errors.email}</span>}
                            </div>
                            <div className="flex flex-col">
                                <PrimaryDatePicker
                                    name="dateOfBirth"
                                    value={form.dateOfBirth}
                                    onChange={handleChange}
                                    label="Date of Birth"
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
                                <label className="block text-sm font-medium mb-2">Emergency Contact</label>
                                <input
                                    name="emergencyContact"
                                    value={form.emergencyContact}
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
                                {loading
                                    ? (editMode ? 'Updating...' : 'Saving...')
                                    : (editMode ? 'Update Employee' : 'Save Employee')
                                }
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
                        Are you sure you want to delete employee{' '}
                        <strong>{employeeToDelete?.firstName} {employeeToDelete?.lastName}</strong>?
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
