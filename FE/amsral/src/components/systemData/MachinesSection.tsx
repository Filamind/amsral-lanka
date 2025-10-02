import { useState, useEffect } from 'react';
import { Modal, Box, Typography, IconButton } from '@mui/material';
import type { GridColDef, GridPaginationModel } from '@mui/x-data-grid';
import toast from 'react-hot-toast';
import PrimaryButton from '../common/PrimaryButton';
import PrimaryTable from '../common/PrimaryTable';
import PrimaryDropdown from '../common/PrimaryDropdown';
import colors from '../../styles/colors';
import {
    useMachines,
    useCreateMachine,
    useUpdateMachine,
    useDeleteMachine
} from '../../hooks/useSystemData';
import { type MachineType } from '../../services/machineTypeService';


const machineTypeOptions = [
    { value: 'Washing', label: 'Washing' },
    { value: 'Drying', label: 'Drying' },
];

const getColumns = (onEdit: (machine: MachineType) => void, onDelete: (machine: MachineType) => void): GridColDef[] => [
    { field: 'id', headerName: 'ID', flex: 0.6, minWidth: 80 },
    { field: 'name', headerName: 'Machine Name', flex: 1.5, minWidth: 150 },
    { field: 'type', headerName: 'Type', flex: 1, minWidth: 100 },
    { field: 'description', headerName: 'Description', flex: 2.5, minWidth: 250 },
    {
        field: 'createdAt', headerName: 'Created At', flex: 1.2, minWidth: 140,
        valueFormatter: (value) => {
            if (value) {
                return new Date(value).toLocaleDateString();
            }
            return '';
        }
    },
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
                    onClick={() => onEdit(params.row as MachineType)}
                    sx={{ color: colors.primary[500] }}
                >
                    ✏️
                </IconButton>
                <IconButton
                    size="small"
                    onClick={() => onDelete(params.row as MachineType)}
                    sx={{ color: '#ef4444' }}
                >
                    🗑️
                </IconButton>
            </div>
        ),
    },
];

export default function MachinesSection() {
    // Local state for UI
    const [search, setSearch] = useState('');
    const [open, setOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedMachine, setSelectedMachine] = useState<MachineType | null>(null);
    const [form, setForm] = useState({
        name: '',
        type: '' as string,
        description: '',
    });
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [machineToDelete, setMachineToDelete] = useState<MachineType | null>(null);

    // Pagination states
    const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
        page: 0,
        pageSize: 10,
    });

    // TanStack Query hooks
    const {
        data: machinesData,
        isLoading: loading
    } = useMachines(paginationModel.page + 1, paginationModel.pageSize, search.trim() || undefined);

    // Mutation hooks
    const createMachineMutation = useCreateMachine();
    const updateMachineMutation = useUpdateMachine();
    const deleteMachineMutation = useDeleteMachine();

    // Derived state
    const rows = machinesData?.machines || [];
    const rowCount = machinesData?.pagination.totalRecords || 0;

    // Debounced search effect
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            // TanStack Query will automatically refetch when search changes
        }, search ? 300 : 0); // 300ms debounce for search

        return () => clearTimeout(timeoutId);
    }, [search]);

    const handlePaginationModelChange = (newModel: GridPaginationModel) => {
        setPaginationModel(newModel);
    };

    const validate = () => {
        const newErrors: { [key: string]: string } = {};
        if (!form.name.trim()) newErrors.name = 'Machine name is required';
        if (!form.type) newErrors.type = 'Machine type is required';
        if (form.name.length > 100) newErrors.name = 'Machine name must be 100 characters or less';
        if (form.description && form.description.length > 500) {
            newErrors.description = 'Description must be 500 characters or less';
        }

        return newErrors;
    };

    const handleEdit = (machine: MachineType) => {
        setSelectedMachine(machine);
        setEditMode(true);
        setForm({
            name: machine.name || '',
            type: machine.type || '',
            description: machine.description || '',
        });
        setErrors({});
        setOpen(true);
    };

    const handleDelete = (machine: MachineType) => {
        setMachineToDelete(machine);
        setDeleteConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (!machineToDelete) return;

        deleteMachineMutation.mutate(machineToDelete.id, {
            onSuccess: () => {
                setDeleteConfirmOpen(false);
                setMachineToDelete(null);
            },
            onError: (error: Error) => {
                toast.error(error.message || 'Failed to delete machine');
            }
        });
    };

    const handleOpen = () => {
        setEditMode(false);
        setSelectedMachine(null);
        setForm({
            name: '',
            type: '',
            description: '',
        });
        setErrors({});
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setEditMode(false);
        setSelectedMachine(null);
        setErrors({});
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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

        const machineData = {
            name: form.name,
            type: form.type,
            description: form.description || undefined,
        };

        if (editMode && selectedMachine) {
            // Update existing machine
            updateMachineMutation.mutate(
                { id: selectedMachine.id, data: machineData },
                {
                    onSuccess: () => {
                        setOpen(false);
                        setForm({ name: '', type: '', description: '' });
                        setEditMode(false);
                        setSelectedMachine(null);
                    },
                    onError: (error: Error) => {
                        toast.error(error.message || 'Failed to update machine');
                    }
                }
            );
        } else {
            // Create new machine
            createMachineMutation.mutate(machineData, {
                onSuccess: () => {
                    setOpen(false);
                    setForm({ name: '', type: '', description: '' });
                    setEditMode(false);
                    setSelectedMachine(null);
                },
                onError: (error: Error) => {
                    toast.error(error.message || 'Failed to create machine');
                }
            });
        }
    };

    const filteredRows = rows;

    return (
        <div>
            <div className="flex flex-col gap-2 sm:gap-3 mb-4">
                <h3 className="text-lg md:text-xl font-semibold" style={{ color: colors.text.primary }}>
                    Machines Management
                </h3>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 w-full">
                    <div className="flex flex-1 items-center w-full sm:w-auto">
                        <input
                            type="text"
                            placeholder="Search machines..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="flex-1 px-3 py-2 border rounded-xl focus:outline-none text-sm sm:text-base"
                            style={{ borderColor: colors.border.light, maxWidth: 300 }}
                        />
                    </div>
                    <div className="w-full sm:w-auto mt-1 sm:mt-0">
                        <PrimaryButton style={{ minWidth: 140, width: '100%' }} onClick={handleOpen}>
                            + Add Machine
                        </PrimaryButton>
                    </div>
                </div>
            </div>

            <div className="mt-1">
                <PrimaryTable
                    columns={getColumns(handleEdit, handleDelete)}
                    rows={filteredRows}
                    loading={loading}
                    paginationMode="server"
                    rowCount={rowCount}
                    paginationModel={paginationModel}
                    onPaginationModelChange={handlePaginationModelChange}
                    pageSizeOptions={[5, 10, 20, 50]}
                    height="auto"
                />
            </div>

            {/* Modal for Add/Edit Machine */}
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
                        {editMode ? 'Edit Machine' : 'Add Machine'}
                    </Typography>
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex flex-col">
                                <label className="block text-sm font-medium mb-2">
                                    Machine Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    name="name"
                                    value={form.name}
                                    onChange={handleChange}
                                    placeholder="Enter machine name"
                                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none text-base ${errors.name ? 'border-red-500' : ''}`}
                                    style={{ borderColor: errors.name ? '#ef4444' : colors.border.light }}
                                />
                                {errors.name && <span className="text-xs text-red-500 mt-1">{errors.name}</span>}
                            </div>

                            <div className="flex flex-col">
                                <label className="block text-sm font-medium mb-2">
                                    Machine Type <span className="text-red-500">*</span>
                                </label>
                                <PrimaryDropdown
                                    name="type"
                                    value={form.type}
                                    onChange={handleChange}
                                    options={machineTypeOptions}
                                    placeholder="Select machine type"
                                    error={!!errors.type}
                                    className="px-4 py-3 text-base"
                                    style={{ borderColor: errors.type ? '#ef4444' : colors.border.light }}
                                />
                                {errors.type && <span className="text-xs text-red-500 mt-1">{errors.type}</span>}
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
                                {editMode ? 'Update Machine' : 'Save Machine'}
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
                        Are you sure you want to delete machine{' '}
                        <strong>{machineToDelete?.name}</strong>?
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
