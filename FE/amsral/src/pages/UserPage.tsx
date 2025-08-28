
import { useState } from 'react';
import { Modal, Box, Typography, FormControlLabel, Checkbox } from '@mui/material';
import type { GridColDef } from '@mui/x-data-grid';
import PrimaryButton from '../components/common/PrimaryButton';
import PrimaryTable from '../components/common/PrimaryTable';
import PrimaryDropdown from '../components/common/PrimaryDropdown';
import colors from '../styles/colors';

const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 80 },
    { field: 'username', headerName: 'Username', width: 200 },
    { field: 'email', headerName: 'Email', width: 250 },
    { field: 'role', headerName: 'Role', width: 120 },
    { field: 'status', headerName: 'Status', width: 100 },
];

const initialRows = [
    { id: 1, username: 'admin', email: 'admin@example.com', role: 'Admin', status: 'Active' },
    { id: 2, username: 'user1', email: 'user1@example.com', role: 'User', status: 'Active' },
    { id: 3, username: 'user2', email: 'user2@example.com', role: 'User', status: 'Inactive' },
];

const roleOptions = [
    { value: 'admin', label: 'Admin' },
    { value: 'finance', label: 'Finance' },
    { value: 'sales', label: 'Sales' },
    { value: 'user', label: 'User' },
];

export default function UserPage() {
    const [search, setSearch] = useState('');
    const [rows, setRows] = useState(initialRows);
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({
        username: '',
        email: '',
        firstName: '',
        lastName: '',
        passwordHash: '',
        phone: '',
        dateOfBirth: '',
        role: '',
        status: 'Active',
        isActive: true,
    });
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const validate = () => {
        const newErrors: { [key: string]: string } = {};
        if (!form.username) newErrors.username = 'Username is required.';
        if (!form.email) newErrors.email = 'Email is required.';
        if (!form.firstName) newErrors.firstName = 'First name is required.';
        if (!form.lastName) newErrors.lastName = 'Last name is required.';
        if (!form.passwordHash) newErrors.passwordHash = 'Password is required.';
        return newErrors;
    };

    const handleOpen = () => {
        setForm({
            username: '',
            email: '',
            firstName: '',
            lastName: '',
            passwordHash: '',
            phone: '',
            dateOfBirth: '',
            role: '',
            status: 'Active',
            isActive: true,
        });
        setErrors({});
        setOpen(true);
    };

    const handleClose = () => setOpen(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const validation = validate();
        if (Object.keys(validation).length > 0) {
            setErrors(validation);
            return;
        }
        setRows(prev => [
            ...prev,
            {
                id: prev.length ? Math.max(...prev.map(r => r.id)) + 1 : 1,
                username: form.username,
                email: form.email,
                role: form.role ? form.role.charAt(0).toUpperCase() + form.role.slice(1) : 'User',
                status: form.isActive ? 'Active' : 'Inactive',
            },
        ]);
        setOpen(false);
    };

    const filteredRows = rows.filter(row =>
        row.username.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="w-full mx-auto px-1 sm:px-3 md:px-4 py-3">
            <div className="flex flex-col gap-2 sm:gap-3 mb-4">
                <h2 className="text-xl md:text-2xl font-bold" style={{ color: colors.text.primary }}>Users</h2>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 w-full">
                    <div className="flex flex-1 items-center w-full sm:w-auto">
                        <input
                            type="text"
                            placeholder="Search by username..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="flex-1 px-3 py-2 border rounded-xl focus:outline-none text-sm sm:text-base"
                            style={{ borderColor: colors.border.light, maxWidth: 300 }}
                        />
                    </div>
                    <div className="w-full sm:w-auto mt-1 sm:mt-0">
                        <PrimaryButton style={{ minWidth: 140, width: '100%' }} onClick={handleOpen}>
                            + Add User
                        </PrimaryButton>
                    </div>
                </div>
            </div>
            <div className="mt-1">
                <PrimaryTable
                    columns={columns}
                    rows={filteredRows}
                    pageSizeOptions={[5, 10, 20]}
                    pagination
                />
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
                        Add User
                    </Typography>
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex flex-col">
                                <label className="block text-sm font-medium mb-2">Username <span className="text-red-500">*</span></label>
                                <input
                                    name="username"
                                    value={form.username}
                                    onChange={handleChange}
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
                                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none text-base ${errors.email ? 'border-red-500' : ''}`}
                                    style={{ borderColor: colors.border.light }}
                                />
                                {errors.email && <span className="text-xs text-red-500 mt-1">{errors.email}</span>}
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
                                <label className="block text-sm font-medium mb-2">Password <span className="text-red-500">*</span></label>
                                <input
                                    name="passwordHash"
                                    type="password"
                                    value={form.passwordHash}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none text-base ${errors.passwordHash ? 'border-red-500' : ''}`}
                                    style={{ borderColor: colors.border.light }}
                                />
                                {errors.passwordHash && <span className="text-xs text-red-500 mt-1">{errors.passwordHash}</span>}
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
                                <label className="block text-sm font-medium mb-2">Date of Birth</label>
                                <input
                                    name="dateOfBirth"
                                    type="date"
                                    value={form.dateOfBirth}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border rounded-xl focus:outline-none text-base"
                                    style={{ borderColor: colors.border.light }}
                                />
                            </div>
                            <div className="flex flex-col">
                                <label className="block text-sm font-medium mb-2">Role</label>
                                <PrimaryDropdown
                                    name="role"
                                    value={form.role}
                                    onChange={handleChange}
                                    options={roleOptions}
                                    placeholder="Select a role"
                                    className="px-4 py-3 text-base"
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
                            <PrimaryButton type="submit" style={{ minWidth: 140 }}>
                                Save User
                            </PrimaryButton>
                        </div>
                    </form>
                </Box>
            </Modal>
        </div>
    );
}
