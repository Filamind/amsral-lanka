

import { useState } from 'react';
import { Modal, Box, Typography, FormControlLabel, Checkbox } from '@mui/material';
import PrimaryButton from '../components/common/PrimaryButton';
import PrimaryTable from '../components/common/PrimaryTable';
import colors from '../styles/colors';

import type { GridColDef } from '@mui/x-data-grid';

const columns: GridColDef[] = [
    { field: 'customerCode', headerName: 'Code', width: 100 },
    { field: 'firstName', headerName: 'First Name', width: 140 },
    { field: 'lastName', headerName: 'Last Name', width: 140 },
    { field: 'phone', headerName: 'Phone', width: 140 },
    { field: 'email', headerName: 'Email', width: 180 },
    { field: 'city', headerName: 'City', width: 120 },
    { field: 'country', headerName: 'Country', width: 120 },
    { field: 'isActive', headerName: 'Active', width: 90, type: 'boolean' as const },
];

type CustomerRow = {
    id: number;
    customerCode: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
    dateOfBirth: string;
    notes: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    [key: string]: string | number | boolean; // index signature for dynamic access
};

const initialRows: CustomerRow[] = [
    {
        id: 1,
        customerCode: 'CUST001',
        firstName: 'John',
        lastName: 'Doe',
        phone: '1234567890',
        email: 'john@example.com',
        address: '123 Main St',
        city: 'Colombo',
        postalCode: '10000',
        country: 'Sri Lanka',
        dateOfBirth: '1990-01-01',
        notes: 'VIP customer',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: 2,
        customerCode: 'CUST002',
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '9876543210',
        email: 'jane@example.com',
        address: '456 Park Ave',
        city: 'Kandy',
        postalCode: '20000',
        country: 'Sri Lanka',
        dateOfBirth: '1985-05-10',
        notes: '',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
];

export default function CustomersPage() {
    const [search, setSearch] = useState('');
    const [rows, setRows] = useState(initialRows);
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({
        customerCode: '',
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        address: '',
        city: '',
        postalCode: '',
        country: '',
        dateOfBirth: '',
        notes: '',
        isActive: true,
    });
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    // For unique validation
    const isUnique = (field: string, value: string) => {
        if (!value) return true;
        return !rows.some(row => String(row[field]) === value);
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

    const handleOpen = () => {
        setForm({
            customerCode: '',
            firstName: '',
            lastName: '',
            phone: '',
            email: '',
            address: '',
            city: '',
            postalCode: '',
            country: '',
            dateOfBirth: '',
            notes: '',
            isActive: true,
        });
        setErrors({});
        setOpen(true);
    };

    const handleClose = () => setOpen(false);

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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const validation = validate();
        if (Object.keys(validation).length > 0) {
            setErrors(validation);
            return;
        }
        const now = new Date().toISOString();
        setRows(prev => [
            ...prev,
            {
                id: prev.length ? Math.max(...prev.map(r => r.id)) + 1 : 1,
                ...form,
                createdAt: now,
                updatedAt: now,
            },
        ]);
        setOpen(false);
    };

    const filteredRows = rows.filter(row =>
        (row.firstName + ' ' + row.lastName).toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="w-full max-w-6xl mx-auto px-2 sm:px-6 md:px-8 py-6">
            <div className="flex flex-col gap-4 sm:gap-6 mb-6">
                <h2 className="text-2xl font-bold" style={{ color: colors.text.primary }}>Customers</h2>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
                    <div className="flex flex-1 items-center w-full sm:w-auto">
                        <input
                            type="text"
                            placeholder="Search by customer name..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="flex-1 px-3 py-2 border rounded-xl focus:outline-none text-sm sm:text-base"
                            style={{ borderColor: colors.border.light, maxWidth: 320 }}
                        />
                    </div>
                    <div className="w-full sm:w-auto mt-2 sm:mt-0">
                        <PrimaryButton style={{ minWidth: 160, width: '100%' }} onClick={handleOpen}>
                            + Add Customer
                        </PrimaryButton>
                    </div>
                </div>
            </div>
            <div className="mt-2">
                <PrimaryTable
                    columns={columns}
                    rows={filteredRows}
                    pageSizeOptions={[5, 10, 20]}
                    pagination
                />
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
                        p: { xs: 2, sm: 4 },
                        width: { xs: '95vw', sm: 480 },
                        maxHeight: '90vh',
                        overflowY: 'auto',
                    }}
                >
                    <Typography variant="h6" fontWeight={700} mb={2} color={colors.text.primary}>
                        Add Customer
                    </Typography>
                    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="flex-1">
                                <label className="block text-sm font-medium mb-1">Customer Code <span className="text-red-500">*</span></label>
                                <input
                                    name="customerCode"
                                    value={form.customerCode}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 border rounded-xl focus:outline-none ${errors.customerCode ? 'border-red-500' : ''}`}
                                    style={{ borderColor: colors.border.light }}
                                />
                                {errors.customerCode && <span className="text-xs text-red-500">{errors.customerCode}</span>}
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm font-medium mb-1">First Name <span className="text-red-500">*</span></label>
                                <input
                                    name="firstName"
                                    value={form.firstName}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 border rounded-xl focus:outline-none ${errors.firstName ? 'border-red-500' : ''}`}
                                    style={{ borderColor: colors.border.light }}
                                />
                                {errors.firstName && <span className="text-xs text-red-500">{errors.firstName}</span>}
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="flex-1">
                                <label className="block text-sm font-medium mb-1">Last Name <span className="text-red-500">*</span></label>
                                <input
                                    name="lastName"
                                    value={form.lastName}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 border rounded-xl focus:outline-none ${errors.lastName ? 'border-red-500' : ''}`}
                                    style={{ borderColor: colors.border.light }}
                                />
                                {errors.lastName && <span className="text-xs text-red-500">{errors.lastName}</span>}
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm font-medium mb-1">Phone <span className="text-red-500">*</span></label>
                                <input
                                    name="phone"
                                    value={form.phone}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 border rounded-xl focus:outline-none ${errors.phone ? 'border-red-500' : ''}`}
                                    style={{ borderColor: colors.border.light }}
                                />
                                {errors.phone && <span className="text-xs text-red-500">{errors.phone}</span>}
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="flex-1">
                                <label className="block text-sm font-medium mb-1">Email</label>
                                <input
                                    name="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 border rounded-xl focus:outline-none ${errors.email ? 'border-red-500' : ''}`}
                                    style={{ borderColor: colors.border.light }}
                                />
                                {errors.email && <span className="text-xs text-red-500">{errors.email}</span>}
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm font-medium mb-1">Address</label>
                                <input
                                    name="address"
                                    value={form.address}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border rounded-xl focus:outline-none"
                                    style={{ borderColor: colors.border.light }}
                                />
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="flex-1">
                                <label className="block text-sm font-medium mb-1">City</label>
                                <input
                                    name="city"
                                    value={form.city}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border rounded-xl focus:outline-none"
                                    style={{ borderColor: colors.border.light }}
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm font-medium mb-1">Postal Code</label>
                                <input
                                    name="postalCode"
                                    value={form.postalCode}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border rounded-xl focus:outline-none"
                                    style={{ borderColor: colors.border.light }}
                                />
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="flex-1">
                                <label className="block text-sm font-medium mb-1">Country</label>
                                <input
                                    name="country"
                                    value={form.country}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border rounded-xl focus:outline-none"
                                    style={{ borderColor: colors.border.light }}
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm font-medium mb-1">Date of Birth</label>
                                <input
                                    name="dateOfBirth"
                                    type="date"
                                    value={form.dateOfBirth}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border rounded-xl focus:outline-none"
                                    style={{ borderColor: colors.border.light }}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Notes</label>
                            <textarea
                                name="notes"
                                value={form.notes}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border rounded-xl focus:outline-none"
                                style={{ borderColor: colors.border.light, minHeight: 48 }}
                            />
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        name="isActive"
                                        checked={form.isActive}
                                        onChange={handleChange}
                                        sx={{ color: colors.primary[500], '&.Mui-checked': { color: colors.primary[500] } }}
                                    />
                                }
                                label={<span className="text-sm">Active</span>}
                            />
                        </div>
                        <div className="flex gap-3 mt-2 justify-end">
                            <PrimaryButton type="button" style={{ minWidth: 100, background: colors.primary[100], color: colors.text.primary }} onClick={handleClose}>
                                Cancel
                            </PrimaryButton>
                            <PrimaryButton type="submit" style={{ minWidth: 120 }}>
                                Save
                            </PrimaryButton>
                        </div>
                    </form>
                </Box>
            </Modal>
        </div>
    );
}
