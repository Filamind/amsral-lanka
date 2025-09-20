
import { useState, useEffect, useMemo } from 'react';
import { Modal, Box, Typography, FormControlLabel, Checkbox, IconButton } from '@mui/material';
import type { GridColDef } from '@mui/x-data-grid';
import PrimaryButton from '../components/common/PrimaryButton';
import PrimaryTable from '../components/common/PrimaryTable';
import PrimaryDropdown from '../components/common/PrimaryDropdown';
import PrimaryDatePicker from '../components/common/PrimaryDatePicker';
import colors from '../styles/colors';
import toast from 'react-hot-toast';
import UserService, { type User, type PaginationInfo, type UserFetchOptions, type CreateUserRequest, type UpdateUserRequest } from '../services/userService';
import RoleService, { type RoleOption } from '../services/roleService';
import { formatDisplayText } from '../utils';
import { useAuth } from '../hooks/useAuth';
import { hasPermission } from '../utils/roleUtils';

const getColumns = (onEdit: (user: User) => void, onDelete: (user: User) => void, canEdit: boolean, canDelete: boolean): GridColDef[] => [
    { field: 'id', headerName: 'ID', flex: 0.5, minWidth: 70 },
    { field: 'username', headerName: 'Username', flex: 1, minWidth: 120 },
    { field: 'email', headerName: 'Email', flex: 1.5, minWidth: 200 },
    { field: 'firstName', headerName: 'First Name', flex: 1, minWidth: 120 },
    { field: 'lastName', headerName: 'Last Name', flex: 1, minWidth: 120 },
    {
        field: 'role',
        headerName: 'Role',
        flex: 0.8,
        minWidth: 100,
        renderCell: (params) => {
            const user = params.row as User;
            const roleName = user.role?.name || '';
            return <span>{formatDisplayText(roleName)}</span>;
        }
    },
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
                        onClick={() => onEdit(params.row as User)}
                        sx={{ color: colors.primary[500] }}
                    >
                        ✏️
                    </IconButton>
                )}
                {canDelete && (
                    <IconButton
                        size="small"
                        onClick={() => onDelete(params.row as User)}
                        sx={{ color: '#ef4444' }}
                    >
                        🗑️
                    </IconButton>
                )}
            </div>
        ),
    },
];


export default function UserPage() {
    const { user } = useAuth();
    const [search, setSearch] = useState('');
    const [rows, setRows] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [form, setForm] = useState({
        username: '',
        email: '',
        firstName: '',
        lastName: '',
        password: 'default123',
        phone: '',
        dateOfBirth: '',
        roleId: 1, // Default to Admin role (ID: 1)
        isActive: true,
    });
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [roleOptions, setRoleOptions] = useState<RoleOption[]>([]);
    const [loadingRoles, setLoadingRoles] = useState(false);
    const [rolesLoaded, setRolesLoaded] = useState(false);

    // Memoized role fetching function
    const fetchRoles = useMemo(() => async () => {
        if (rolesLoaded) return; // Don't fetch if already loaded

        setLoadingRoles(true);
        try {
            const roles = await RoleService.getRoleMap();
            setRoleOptions(roles);
            setRolesLoaded(true);
        } catch (error) {
            console.error('Error fetching roles:', error);
            toast.error('Failed to load roles');
            // Fallback to default roles if API fails
            setRoleOptions([
                { value: '1', label: 'Admin' },
                { value: '2', label: 'Manager' },
                { value: '3', label: 'User' }
            ]);
            setRolesLoaded(true);
        } finally {
            setLoadingRoles(false);
        }
    }, [rolesLoaded]);

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
    const [filterState, setFilterState] = useState<UserFetchOptions>({
        isActive: null,
        isDeleted: false,
        search: '',
        role: ''
    });

    // Memoize filters object to prevent unnecessary re-renders
    const filters = useMemo(() => filterState, [filterState]);

    // Load users effect - runs when dependencies change
    useEffect(() => {
        const loadUsers = async () => {
            try {
                setLoading(true);
                const options: UserFetchOptions = {
                    ...filters,
                    page: currentPage,
                    limit: pageSize
                };

                const response = await UserService.getAllUsers(options);
                console.log('Loaded users:', response); // Debug log

                setRows(response.users);
                setPagination(response.pagination);
            } catch (error) {
                console.error('Failed to load users:', error);
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
                toast.error('Failed to load users. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        loadUsers();
    }, [filters, currentPage, pageSize]);

    // Manual reload function for after create/delete operations
    const reloadUsers = async () => {
        try {
            setLoading(true);
            const options: UserFetchOptions = {
                ...filters,
                page: currentPage,
                limit: pageSize
            };

            const response = await UserService.getAllUsers(options);
            setRows(response.users);
            setPagination(response.pagination);
        } catch (error) {
            console.error('Failed to reload users:', error);
            toast.error('Failed to reload users. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Fetch roles on component mount - only once
    useEffect(() => {
        if (!rolesLoaded) {
            fetchRoles();
        }
    }, [fetchRoles, rolesLoaded]);

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

    const handleFilterChange = (newFilters: Partial<UserFetchOptions>) => {
        setFilterState(prev => ({ ...prev, ...newFilters }));
        setCurrentPage(1); // Reset to first page when filters change
    };

    // For unique validation
    const isUnique = (field: string, value: string) => {
        if (!value) return true;
        if (!Array.isArray(rows)) return true; // Safety check
        return !rows.some((row: User) => {
            // Skip validation for the user being edited
            if (editMode && selectedUser && row.id === selectedUser.id) {
                return false;
            }
            if (field === 'username') {
                return row.username === value;
            }
            if (field === 'email') return row.email === value;
            return false;
        });
    };

    const validate = () => {
        const newErrors: { [key: string]: string } = {};

        // Username validation
        if (!form.username) newErrors.username = 'Username is required.';
        else if (!isUnique('username', form.username)) newErrors.username = 'Username must be unique';

        // Email validation only for create mode, not edit mode
        if (!editMode) {
            if (!form.email) newErrors.email = 'Email is required.';
            else if (!isUnique('email', form.email)) newErrors.email = 'Email must be unique';
        }

        if (!form.firstName) newErrors.firstName = 'First name is required.';
        if (!form.lastName) newErrors.lastName = 'Last name is required.';
        if (!editMode && !form.password) newErrors.password = 'Password is required.';
        if (!form.roleId) newErrors.role = 'Role is required.';
        return newErrors;
    };

    // Handler functions for edit and delete
    const handleEdit = (user: User) => {
        console.log('Edit user data:', user); // Debug log
        console.log('User roleId:', user.roleId, 'type:', typeof user.roleId); // Debug roleId
        setSelectedUser(user);
        setEditMode(true);
        setForm({
            username: user.username || '',
            email: user.email || '',
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            password: '', // Don't populate password on edit
            phone: user.phone || '',
            dateOfBirth: user.dateOfBirth || '',
            roleId: user.roleId || 1, // Default to 1 instead of 0
            isActive: user.isActive !== undefined ? user.isActive : true,
        });
        setErrors({});
        setOpen(true);
    };

    const handleDelete = (user: User) => {
        setUserToDelete(user);
        setDeleteConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (!userToDelete) return;

        try {
            setLoading(true);
            await UserService.deleteUser(userToDelete.id!);
            toast.success(`User ${userToDelete.username} deleted successfully!`);
            setDeleteConfirmOpen(false);
            setUserToDelete(null);
            reloadUsers();
        } catch (error) {
            console.error('Failed to delete user:', error);
            toast.error('Failed to delete user. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleOpen = () => {
        setEditMode(false);
        setSelectedUser(null);
        setForm({
            username: '',
            email: '',
            firstName: '',
            lastName: '',
            password: 'default123',
            phone: '',
            dateOfBirth: '',
            roleId: 1, // Default to Admin role (ID: 1)
            isActive: true,
        });
        setErrors({});
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setEditMode(false);
        setSelectedUser(null);
        setErrors({});
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        let checked = false;
        if (type === 'checkbox' && 'checked' in e.target) {
            checked = (e.target as HTMLInputElement).checked;
        }

        setForm(prev => {
            const newForm = {
                ...prev,
                [name]: type === 'checkbox' ? checked : (name === 'roleId' ? parseInt(value) || 0 : value),
            };

            return newForm;
        });
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

            if (editMode && selectedUser) {
                // Update existing user
                console.log('Updating user with data:', form); // Debug log
                console.log('Form roleId type:', typeof form.roleId, 'value:', form.roleId); // Debug roleId
                const updateData: UpdateUserRequest = {
                    username: form.username,
                    firstName: form.firstName,
                    lastName: form.lastName,
                    phone: form.phone,
                    dateOfBirth: form.dateOfBirth,
                    roleId: form.roleId,
                    isActive: form.isActive,
                };
                console.log('Sending update request with:', updateData); // Debug request data
                // Email is not changeable in edit mode
                // Password is not changeable in edit mode

                const updatedUser = await UserService.updateUser(selectedUser.id!, updateData);
                console.log('User updated successfully:', updatedUser);

                // Simple success - just show toast and close modal first
                setOpen(false);

                // Use form data as fallback if updatedUser doesn't have the data
                const username = updatedUser.username || form.username;
                toast.success(`User ${username} updated successfully!`);
            } else {
                // Create new user
                console.log('Creating user with data:', form); // Debug log
                console.log('Form roleId type:', typeof form.roleId, 'value:', form.roleId); // Debug roleId
                const createData: CreateUserRequest = {
                    username: form.username,
                    email: form.email,
                    firstName: form.firstName,
                    lastName: form.lastName,
                    passwordHash: form.password,
                    phone: form.phone,
                    dateOfBirth: form.dateOfBirth,
                    roleId: form.roleId,
                    isActive: form.isActive,
                };
                console.log('Sending create request with:', createData); // Debug request data

                const newUser = await UserService.createUser(createData);
                console.log('User created successfully:', newUser);

                // Simple success - just show toast and close modal first
                setOpen(false);

                // Use form data as fallback if newUser doesn't have the data
                const username = newUser.username || form.username;
                toast.success(`User ${username} created successfully!`);
            }

            // Reset form and state
            setForm({
                username: '',
                email: '',
                firstName: '',
                lastName: '',
                password: 'default123',
                phone: '',
                dateOfBirth: '',
                roleId: 1, // Default to Admin role (ID: 1)
                isActive: true,
            });
            setEditMode(false);
            setSelectedUser(null);

            // Reload data after a short delay to prevent any race conditions
            setTimeout(() => {
                reloadUsers();
            }, 500);

        } catch (error: unknown) {
            console.error(`Failed to ${editMode ? 'update' : 'create'} user:`, error);
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
                    toast.error(`Failed to ${editMode ? 'update' : 'create'} user. Please try again.`);
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
                <h2 className="text-xl md:text-2xl font-bold" style={{ color: colors.text.primary }}>Users</h2>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 w-full">
                    <div className="flex flex-1 items-center gap-3 w-full sm:w-auto">
                        <input
                            type="text"
                            placeholder="Search by username..."
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
                            <option value="all">All Users</option>
                            <option value="active">Active Only</option>
                            <option value="inactive">Inactive Only</option>
                        </select>
                        <select
                            value={filters.role || ''}
                            onChange={e => {
                                handleFilterChange({ role: e.target.value || undefined });
                            }}
                            className="px-3 py-2 border rounded-xl focus:outline-none text-sm sm:text-base"
                            style={{ borderColor: colors.border.light }}
                            disabled={loadingRoles}
                        >
                            <option value="">{loadingRoles ? 'Loading roles...' : 'All Roles'}</option>
                            {roleOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    {hasPermission(user, 'canEdit') && (
                        <div className="w-full sm:w-auto mt-1 sm:mt-0">
                            <PrimaryButton style={{ minWidth: 140, width: '100%' }} onClick={handleOpen}>
                                + Add User
                            </PrimaryButton>
                        </div>
                    )}
                </div>

                {/* Pagination Info */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-2 text-sm" style={{ color: colors.text.secondary }}>
                    <div>
                        Showing {rows.length > 0 ? ((pagination.currentPage - 1) * pagination.itemsPerPage + 1) : 0}-{Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of {pagination.totalItems} users
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
                            Loading users...
                        </div>
                    </div>
                ) : (
                    <PrimaryTable
                        columns={getColumns(handleEdit, handleDelete, hasPermission(user, 'canEdit'), hasPermission(user, 'canDelete'))}
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
                        height="auto"
                    />
                )}
            </div>
            {/* Modal for Add User */}
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
                        width: { xs: '95vw', sm: '95vw', md: '90vw', lg: '850px', xl: '950px' },
                        maxWidth: '95vw',
                        maxHeight: '95vh',
                        overflowY: 'auto',
                    }}
                >
                    <Typography variant="h6" fontWeight={700} mb={2} color={colors.text.primary}>
                        {editMode ? 'Edit User' : 'Add User'}
                    </Typography>
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex flex-col">
                                <label className="block text-sm font-medium mb-2">Username <span className="text-red-500">*</span></label>
                                <input
                                    name="username"
                                    value={form.username}
                                    onChange={handleChange}
                                    placeholder="Enter username"
                                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none text-base ${errors.username ? 'border-red-500' : ''}`}
                                    style={{ borderColor: colors.border.light }}
                                />
                                {errors.username && <span className="text-xs text-red-500 mt-1">{errors.username}</span>}
                            </div>
                            <div className="flex flex-col">
                                <label className="block text-sm font-medium mb-2">Email <span className="text-red-500">*</span></label>
                                <input
                                    name="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    disabled={editMode}
                                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none text-base ${errors.email ? 'border-red-500' : ''} ${editMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                    style={{ borderColor: colors.border.light }}
                                />
                                {errors.email && <span className="text-xs text-red-500 mt-1">{errors.email}</span>}
                                {editMode && <span className="text-xs text-gray-500 mt-1">Email cannot be changed</span>}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex flex-col">
                                <label className="block text-sm font-medium mb-2">Password {!editMode && <span className="text-red-500">*</span>}</label>
                                <input
                                    name="password"
                                    type={editMode ? "password" : "text"}
                                    value={form.password}
                                    onChange={handleChange}
                                    disabled={editMode}
                                    placeholder={editMode ? "Password cannot be changed" : "Default: default123"}
                                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none text-base ${errors.password ? 'border-red-500' : ''} ${editMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                    style={{ borderColor: colors.border.light }}
                                />
                                {errors.password && <span className="text-xs text-red-500 mt-1">{errors.password}</span>}
                                {editMode ? (
                                    <span className="text-xs text-gray-500 mt-1">Password cannot be changed in edit mode</span>
                                ) : (
                                    <span className="text-xs text-gray-500 mt-1">Default password is "default123" - you can change it if needed</span>
                                )}
                            </div>
                            <div className="flex flex-col">
                                <label className="block text-sm font-medium mb-2">Phone</label>
                                <input
                                    name="phone"
                                    value={form.phone}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border rounded-xl focus:outline-none text-base"
                                    style={{ borderColor: colors.border.light }}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex flex-col">
                                <PrimaryDatePicker
                                    name="dateOfBirth"
                                    value={form.dateOfBirth}
                                    onChange={handleChange}
                                    label="Date of Birth"
                                />
                            </div>
                            <div className="flex flex-col">
                                <label className="block text-sm font-medium mb-2">Role</label>
                                <PrimaryDropdown
                                    name="roleId"
                                    value={form.roleId.toString()}
                                    onChange={handleChange}
                                    options={roleOptions}
                                    placeholder={loadingRoles ? "Loading roles..." : "Select a role"}
                                    className="px-4 py-3 text-base"
                                    style={{ borderColor: colors.border.light }}
                                    disabled={loadingRoles}
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
                                {loading ? (editMode ? 'Updating...' : 'Creating...') : (editMode ? 'Update User' : 'Save User')}
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
                        Are you sure you want to delete user{' '}
                        <strong>{userToDelete?.username}</strong>?
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
