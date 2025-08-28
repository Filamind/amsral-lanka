
import { Modal, Box, Typography, FormControlLabel, Checkbox } from '@mui/material';
import type { GridColDef } from '@mui/x-data-grid';
import { useState } from 'react';
import PrimaryButton from '../components/common/PrimaryButton';
import PrimaryTable from '../components/common/PrimaryTable';
import colors from '../styles/colors';

const columns: GridColDef[] = [
    { field: 'employeeId', headerName: 'Employee ID', flex: 1, minWidth: 110 },
    { field: 'firstName', headerName: 'First Name', flex: 1, minWidth: 120 },
    { field: 'lastName', headerName: 'Last Name', flex: 1, minWidth: 120 },
    { field: 'phone', headerName: 'Phone', flex: 1.1, minWidth: 130 },
    { field: 'email', headerName: 'Email', flex: 1.5, minWidth: 180 },
    { field: 'hireDate', headerName: 'Hire Date', flex: 1, minWidth: 110 },
    { field: 'isActive', headerName: 'Active', flex: 0.6, minWidth: 80, type: 'boolean' as const },
];

type EmployeeRow = {
    id: number;
    employeeId: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    hireDate: string;
    dateOfBirth: string;
    address: string;
    emergencyContact: string;
    emergencyPhone: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    [key: string]: string | number | boolean;
};

const initialRows: EmployeeRow[] = [
    {
        id: 1,
        employeeId: 'EMP001',
        firstName: 'Alice',
        lastName: 'Brown',
        phone: '1112223333',
        email: 'alice@example.com',
        hireDate: '2023-01-15',
        dateOfBirth: '1990-01-01',
        address: '123 Main St',
        emergencyContact: 'John Brown',
        emergencyPhone: '1111111111',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: 2,
        employeeId: 'EMP002',
        firstName: 'David',
        lastName: 'Green',
        phone: '4445556666',
        email: 'david@example.com',
        hireDate: '2023-03-20',
        dateOfBirth: '1985-05-10',
        address: '456 Park Ave',
        emergencyContact: 'Sarah Green',
        emergencyPhone: '2222222222',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
];

export default function EmployeesPage() {
    const [search, setSearch] = useState('');
    const [rows, setRows] = useState(initialRows);
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({
        employeeId: '',
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        hireDate: '',
        dateOfBirth: '',
        address: '',
        emergencyContact: '',
        emergencyPhone: '',
        isActive: true,
    });
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const isUnique = (field: string, value: string) => {
        if (!value) return true;
        return !rows.some(row => String(row[field]) === value);
    };

    const validate = () => {
        const newErrors: { [key: string]: string } = {};
        if (!form.employeeId) newErrors.employeeId = 'Required';
        else if (!isUnique('employeeId', form.employeeId)) newErrors.employeeId = 'ID must be unique';
        if (!form.firstName) newErrors.firstName = 'Required';
        if (!form.lastName) newErrors.lastName = 'Required';
        if (!form.phone) newErrors.phone = 'Required';
        if (form.email && !isUnique('email', form.email)) newErrors.email = 'Email must be unique';
        return newErrors;
    };

    const handleOpen = () => {
        setForm({
            employeeId: '',
            firstName: '',
            lastName: '',
            phone: '',
            email: '',
            hireDate: '',
            dateOfBirth: '',
            address: '',
            emergencyContact: '',
            emergencyPhone: '',
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
        <div className="w-full mx-auto px-1 sm:px-3 md:px-4 py-3">
            <div className="flex flex-col gap-2 sm:gap-3 mb-4">
                <h2 className="text-xl md:text-2xl font-bold" style={{ color: colors.text.primary }}>Employees</h2>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 w-full">
                    <div className="flex flex-1 items-center w-full sm:w-auto">
                        <input
                            type="text"
                            placeholder="Search by employee name..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="flex-1 px-3 py-2 border rounded-xl focus:outline-none text-sm sm:text-base"
                            style={{ borderColor: colors.border.light, maxWidth: 300 }}
                        />
                    </div>
                    <div className="w-full sm:w-auto mt-1 sm:mt-0">
                        <PrimaryButton style={{ minWidth: 140, width: '100%' }} onClick={handleOpen}>
                            + Add Employee
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
                        Add Employee
                    </Typography>
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="flex flex-col">
                                <label className="block text-sm font-medium mb-2">Employee ID <span className="text-red-500">*</span></label>
                                <input
                                    name="employeeId"
                                    value={form.employeeId}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none text-base ${errors.employeeId ? 'border-red-500' : ''}`}
                                    style={{ borderColor: colors.border.light }}
                                />
                                {errors.employeeId && <span className="text-xs text-red-500 mt-1">{errors.employeeId}</span>}
                            </div>
                            <div className="flex flex-col">
                                <label className="block text-sm font-medium mb-2">Hire Date</label>
                                <input
                                    name="hireDate"
                                    type="date"
                                    value={form.hireDate}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border rounded-xl focus:outline-none text-base"
                                    style={{ borderColor: colors.border.light }}
                                />
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
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex flex-col">
                                <label className="block text-sm font-medium mb-2">Emergency Phone</label>
                                <input
                                    name="emergencyPhone"
                                    value={form.emergencyPhone}
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
                            <PrimaryButton type="submit" style={{ minWidth: 140 }}>
                                Save Employee
                            </PrimaryButton>
                        </div>
                    </form>
                </Box>
            </Modal>
        </div>
    );
}
