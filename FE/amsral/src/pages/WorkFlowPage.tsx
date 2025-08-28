import { useState } from 'react';
import { Modal, Box, Typography, Tabs, Tab } from '@mui/material';
import type { GridColDef, GridRowParams } from '@mui/x-data-grid';
import PrimaryButton from '../components/common/PrimaryButton';
import PrimaryTable from '../components/common/PrimaryTable';
import PrimaryDropdown from '../components/common/PrimaryDropdown';
import colors from '../styles/colors';

// Types
type ProcessRecord = {
    id: string;
    orderId: number;
    orderRef: string;
    customerName: string;
    item: string;
    quantity: number;
    remainingQuantity: number;
    washType: string;
    processTypes: string[];
    status: string;
};

type MachineAssignment = {
    id: string;
    recordId: string;
    orderRef: string;
    customerName: string;
    item: string;
    assignedBy: string;
    quantity: number;
    washingMachine: string;
    dryingMachine: string;
    assignedAt: string;
    status: string;
};

// Machine options
const washingMachines = Array.from({ length: 8 }, (_, i) => ({
    value: `W${i + 1}`,
    label: `Washing Machine W${i + 1}`
}));

const dryingMachines = Array.from({ length: 9 }, (_, i) => ({
    value: `D${i + 1}`,
    label: `Drying Machine D${i + 1}`
}));

// Employee options (you can replace this with actual API data later)
const employeeOptions = [
    { value: 'EMP001', label: 'John Smith' },
    { value: 'EMP002', label: 'Sarah Johnson' },
    { value: 'EMP003', label: 'Mike Davis' },
    { value: 'EMP004', label: 'Lisa Wilson' },
    { value: 'EMP005', label: 'David Brown' },
    { value: 'EMP006', label: 'Emma Garcia' },
    { value: 'EMP007', label: 'James Martinez' },
    { value: 'EMP008', label: 'Anna Rodriguez' },
];

// Sample data (will be replaced with real data from OrdersPage)
const initialRecords: ProcessRecord[] = [
    {
        id: '1',
        orderId: 1,
        orderRef: 'ORD001',
        customerName: 'John Doe',
        item: 'Product A',
        quantity: 500,
        remainingQuantity: 500,
        washType: 'normal',
        processTypes: ['viscose'],
        status: 'pending',
    },
    {
        id: '2',
        orderId: 1,
        orderRef: 'ORD001',
        customerName: 'John Doe',
        item: 'Product A',
        quantity: 500,
        remainingQuantity: 500,
        washType: 'heavy',
        processTypes: ['viscose', 'rib'],
        status: 'pending',
    },
    {
        id: '3',
        orderId: 2,
        orderRef: 'ORD002',
        customerName: 'Jane Smith',
        item: 'Product B',
        quantity: 750,
        remainingQuantity: 750,
        washType: 'silicon',
        processTypes: ['sand_blast', 'chevron'],
        status: 'pending',
    },
];

const initialAssignments: MachineAssignment[] = [];

// Table columns
const recordsColumns: GridColDef[] = [
    { field: 'orderRef', headerName: 'Order Ref', flex: 1, minWidth: 120 },
    { field: 'customerName', headerName: 'Customer', flex: 1.5, minWidth: 150 },
    { field: 'item', headerName: 'Item', flex: 1.5, minWidth: 150 },
    { field: 'quantity', headerName: 'Total Qty', flex: 0.8, minWidth: 100, type: 'number' },
    { field: 'remainingQuantity', headerName: 'Remaining', flex: 0.8, minWidth: 100, type: 'number' },
    { field: 'washType', headerName: 'Wash Type', flex: 1.2, minWidth: 120 },
    { field: 'processTypes', headerName: 'Processes', flex: 2, minWidth: 200 },
    { field: 'status', headerName: 'Status', flex: 1, minWidth: 120 },
];

const assignmentsColumns: GridColDef[] = [
    { field: 'orderRef', headerName: 'Order Ref', flex: 1, minWidth: 120 },
    { field: 'customerName', headerName: 'Customer', flex: 1.5, minWidth: 150 },
    { field: 'item', headerName: 'Item', flex: 1.5, minWidth: 150 },
    { field: 'assignedBy', headerName: 'Assigned By', flex: 1.2, minWidth: 120 },
    { field: 'quantity', headerName: 'Quantity', flex: 0.8, minWidth: 100, type: 'number' },
    { field: 'washingMachine', headerName: 'Washing Machine', flex: 1.4, minWidth: 140 },
    { field: 'dryingMachine', headerName: 'Drying Machine', flex: 1.4, minWidth: 140 },
    { field: 'assignedAt', headerName: 'Assigned At', flex: 1.5, minWidth: 150 },
    { field: 'status', headerName: 'Status', flex: 1, minWidth: 120 },
];

export default function WorkFlowPage() {
    const [activeTab, setActiveTab] = useState(0);
    const [recordsSearch, setRecordsSearch] = useState('');
    const [assignmentsSearch, setAssignmentsSearch] = useState('');
    const [records, setRecords] = useState(initialRecords);
    const [assignments, setAssignments] = useState(initialAssignments);
    const [open, setOpen] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<ProcessRecord | null>(null);
    const [form, setForm] = useState({
        assignedBy: '',
        quantity: 1,
        washingMachine: '',
        dryingMachine: '',
    });
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    // Validation
    const validate = () => {
        const newErrors: { [key: string]: string } = {};
        if (!form.assignedBy) newErrors.assignedBy = 'Required';
        if (!form.quantity || form.quantity <= 0) newErrors.quantity = 'Quantity must be greater than 0';
        if (selectedRecord && form.quantity > selectedRecord.remainingQuantity) {
            newErrors.quantity = `Cannot exceed remaining quantity (${selectedRecord.remainingQuantity})`;
        }
        if (!form.washingMachine) newErrors.washingMachine = 'Required';
        if (!form.dryingMachine) newErrors.dryingMachine = 'Required';
        return newErrors;
    };

    const handleOpen = (record: ProcessRecord) => {
        setSelectedRecord(record);
        setForm({
            assignedBy: '',
            quantity: Math.min(record.remainingQuantity, 100), // Default to 100 or remaining
            washingMachine: '',
            dryingMachine: '',
        });
        setErrors({});
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setSelectedRecord(null);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setForm(prev => ({
            ...prev,
            [name]: type === 'number' ? Number(value) : value,
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const validation = validate();
        if (Object.keys(validation).length > 0) {
            setErrors(validation);
            return;
        }

        if (!selectedRecord) return;

        const selectedEmployee = employeeOptions.find(employee => employee.value === form.assignedBy);

        const newAssignment: MachineAssignment = {
            id: Date.now().toString(),
            recordId: selectedRecord.id,
            orderRef: selectedRecord.orderRef,
            customerName: selectedRecord.customerName,
            item: selectedRecord.item,
            assignedBy: selectedEmployee?.label || form.assignedBy,
            quantity: form.quantity,
            washingMachine: form.washingMachine,
            dryingMachine: form.dryingMachine,
            assignedAt: new Date().toLocaleString(),
            status: 'In Progress',
        };

        // Update assignments
        setAssignments(prev => [...prev, newAssignment]);

        // Update remaining quantity in records
        setRecords(prev => prev.map(record =>
            record.id === selectedRecord.id
                ? {
                    ...record,
                    remainingQuantity: record.remainingQuantity - form.quantity,
                    status: record.remainingQuantity - form.quantity === 0 ? 'completed' : record.status
                }
                : record
        ));

        setOpen(false);
    };

    // Handle row click to open assignment modal
    const handleRowClick = (params: GridRowParams) => {
        const record = records.find(r => r.id === String(params.id));
        if (record) {
            handleOpen(record);
        }
    };

    // Filter functions
    const filteredRecords = records.filter(record =>
        record.orderRef.toLowerCase().includes(recordsSearch.toLowerCase()) ||
        record.customerName.toLowerCase().includes(recordsSearch.toLowerCase()) ||
        record.item.toLowerCase().includes(recordsSearch.toLowerCase())
    );

    const filteredAssignments = assignments.filter(assignment =>
        assignment.orderRef.toLowerCase().includes(assignmentsSearch.toLowerCase()) ||
        assignment.customerName.toLowerCase().includes(assignmentsSearch.toLowerCase()) ||
        assignment.assignedBy.toLowerCase().includes(assignmentsSearch.toLowerCase()) ||
        assignment.washingMachine.toLowerCase().includes(assignmentsSearch.toLowerCase()) ||
        assignment.dryingMachine.toLowerCase().includes(assignmentsSearch.toLowerCase())
    );

    // Format process types for display
    const recordsWithFormattedProcesses = filteredRecords.map(record => ({
        ...record,
        processTypes: record.processTypes.join(', '),
    }));

    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
    };

    return (
        <div className="w-full mx-auto px-1 sm:px-3 md:px-4 py-3">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: colors.text.primary }}>
                    Production Flow Management
                </h1>
                <p className="text-gray-600">
                    Manage production records and assign work to washing and drying machines
                </p>
            </div>

            {/* Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs
                    value={activeTab}
                    onChange={handleTabChange}
                    sx={{
                        '& .MuiTab-root': {
                            textTransform: 'none',
                            fontWeight: 600,
                            fontSize: '16px',
                            color: colors.text.secondary,
                        },
                        '& .Mui-selected': {
                            color: colors.primary[600] || '#2563eb',
                        },
                        '& .MuiTabs-indicator': {
                            backgroundColor: colors.primary[600] || '#2563eb',
                        },
                    }}
                >
                    <Tab label="Production Records" />
                    <Tab label="Machine Assignments" />
                </Tabs>
            </Box>

            {/* Tab Content */}
            {activeTab === 0 && (
                <div>
                    <div className="flex flex-col gap-2 sm:gap-3 mb-4">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 w-full">
                            <div className="flex flex-1 items-center w-full sm:w-auto">
                                <input
                                    type="text"
                                    placeholder="Search records by order, customer, or item..."
                                    value={recordsSearch}
                                    onChange={e => setRecordsSearch(e.target.value)}
                                    className="flex-1 px-3 py-2 border rounded-xl focus:outline-none text-sm sm:text-base"
                                    style={{ borderColor: colors.border.light, maxWidth: 400 }}
                                />
                            </div>
                            <div className="text-sm text-gray-600">
                                Click any record to assign work to machines
                            </div>
                        </div>
                    </div>
                    <div className="mt-1">
                        <PrimaryTable
                            columns={recordsColumns}
                            rows={recordsWithFormattedProcesses}
                            pageSizeOptions={[10, 20, 50]}
                            pagination
                            onRowClick={handleRowClick}
                        />
                    </div>
                </div>
            )}

            {activeTab === 1 && (
                <div>
                    <div className="flex flex-col gap-2 sm:gap-3 mb-4">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 w-full">
                            <div className="flex flex-1 items-center w-full sm:w-auto">
                                <input
                                    type="text"
                                    placeholder="Search assignments by order, user, or machine..."
                                    value={assignmentsSearch}
                                    onChange={e => setAssignmentsSearch(e.target.value)}
                                    className="flex-1 px-3 py-2 border rounded-xl focus:outline-none text-sm sm:text-base"
                                    style={{ borderColor: colors.border.light, maxWidth: 400 }}
                                />
                            </div>
                            <div className="text-sm text-gray-600">
                                Total assignments: {assignments.length}
                            </div>
                        </div>
                    </div>
                    <div className="mt-1">
                        <PrimaryTable
                            columns={assignmentsColumns}
                            rows={filteredAssignments}
                            pageSizeOptions={[10, 20, 50]}
                            pagination
                        />
                    </div>
                </div>
            )}

            {/* Assignment Modal */}
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
                        width: { xs: '95vw', sm: '90vw', md: '700px' },
                        maxWidth: '95vw',
                        maxHeight: '95vh',
                        overflowY: 'auto',
                    }}
                >
                    <Typography variant="h6" fontWeight={700} mb={2} color={colors.text.primary}>
                        Assign Work to Machines
                    </Typography>

                    {selectedRecord && (
                        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                            <Typography variant="subtitle2" color={colors.text.primary} className="mb-2">
                                Record Details:
                            </Typography>
                            <div className="text-sm text-blue-800">
                                <p><strong>Order:</strong> {selectedRecord.orderRef} - {selectedRecord.customerName}</p>
                                <p><strong>Item:</strong> {selectedRecord.item}</p>
                                <p><strong>Available Quantity:</strong> {selectedRecord.remainingQuantity} of {selectedRecord.quantity}</p>
                                <p><strong>Process:</strong> {selectedRecord.washType} + {selectedRecord.processTypes.join(', ')}</p>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex flex-col">
                                <label className="block text-sm font-medium mb-2">Assigned By <span className="text-red-500">*</span></label>
                                <PrimaryDropdown
                                    name="assignedBy"
                                    value={form.assignedBy}
                                    onChange={handleChange}
                                    options={employeeOptions}
                                    placeholder="Select employee"
                                    error={!!errors.assignedBy}
                                    className="px-4 py-3 text-base"
                                    style={{ borderColor: colors.border.light }}
                                />
                                {errors.assignedBy && <span className="text-xs text-red-500 mt-1">{errors.assignedBy}</span>}
                            </div>

                            <div className="flex flex-col">
                                <label className="block text-sm font-medium mb-2">Quantity <span className="text-red-500">*</span></label>
                                <input
                                    name="quantity"
                                    type="number"
                                    min="1"
                                    max={selectedRecord?.remainingQuantity || 1}
                                    value={form.quantity}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none text-base ${errors.quantity ? 'border-red-500' : ''}`}
                                    style={{ borderColor: colors.border.light }}
                                />
                                {errors.quantity && <span className="text-xs text-red-500 mt-1">{errors.quantity}</span>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex flex-col">
                                <label className="block text-sm font-medium mb-2">Washing Machine <span className="text-red-500">*</span></label>
                                <PrimaryDropdown
                                    name="washingMachine"
                                    value={form.washingMachine}
                                    onChange={handleChange}
                                    options={washingMachines}
                                    placeholder="Select washing machine"
                                    error={!!errors.washingMachine}
                                    className="px-4 py-3 text-base"
                                    style={{ borderColor: colors.border.light }}
                                />
                                {errors.washingMachine && <span className="text-xs text-red-500 mt-1">{errors.washingMachine}</span>}
                            </div>

                            <div className="flex flex-col">
                                <label className="block text-sm font-medium mb-2">Drying Machine <span className="text-red-500">*</span></label>
                                <PrimaryDropdown
                                    name="dryingMachine"
                                    value={form.dryingMachine}
                                    onChange={handleChange}
                                    options={dryingMachines}
                                    placeholder="Select drying machine"
                                    error={!!errors.dryingMachine}
                                    className="px-4 py-3 text-base"
                                    style={{ borderColor: colors.border.light }}
                                />
                                {errors.dryingMachine && <span className="text-xs text-red-500 mt-1">{errors.dryingMachine}</span>}
                            </div>
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
                                Assign to Machines
                            </PrimaryButton>
                        </div>
                    </form>
                </Box>
            </Modal>
        </div>
    );
}
