
import { useState } from 'react';
import { Modal, Box, Typography } from '@mui/material';
import type { GridColDef } from '@mui/x-data-grid';
import PrimaryButton from '../components/common/PrimaryButton';
import PrimaryTable from '../components/common/PrimaryTable';
import PrimaryDropdown from '../components/common/PrimaryDropdown';
import PrimaryMultiSelect from '../components/common/PrimaryMultiSelect';
import colors from '../styles/colors';

const columns: GridColDef[] = [
  { field: 'date', headerName: 'Date', flex: 0.8, minWidth: 110 },
  { field: 'referenceNo', headerName: 'Reference No', flex: 1, minWidth: 130 },
  { field: 'customerName', headerName: 'Customer', flex: 1.5, minWidth: 180 },
  { field: 'item', headerName: 'Item', flex: 1.8, minWidth: 200 },
  { field: 'quantity', headerName: 'Total Qty', flex: 0.8, minWidth: 100, type: 'number' },
  { field: 'recordsCount', headerName: 'Records', flex: 0.6, minWidth: 80, type: 'number' },
  { field: 'deliveryDate', headerName: 'Delivery Date', flex: 1, minWidth: 120 },
  { field: 'status', headerName: 'Status', flex: 1, minWidth: 120 },
];

type ProcessRecord = {
  id: string;
  quantity: number;
  washType: string;
  processTypes: string[];
};

type OrderRow = {
  id: number;
  date: string;
  referenceNo: string;
  customerId: string;
  customerName: string;
  item: string;
  quantity: number;
  notes: string;
  records: ProcessRecord[];
  recordsCount: number;
  deliveryDate: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: string | number | boolean | ProcessRecord[];
};

// Sample customers data (you can replace this with actual API data later)
const customerOptions = [
  { value: 'CUST001', label: 'John Doe' },
  { value: 'CUST002', label: 'Jane Smith' },
  { value: 'CUST003', label: 'Bob Johnson' },
  { value: 'CUST004', label: 'Alice Brown' },
  { value: 'CUST005', label: 'David Wilson' },
];

const statusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

const washTypeOptions = [
  { value: 'normal', label: 'Normal Wash (N/W)' },
  { value: 'heavy', label: 'Heavy Wash (Hy/W)' },
  { value: 'silicon', label: 'Silicon Wash (Sil/W)' },
  { value: 'heavy_silicon', label: 'Heavy Silicon Wash (Hy/Sil/W)' },
  { value: 'enzyme', label: 'Enzyme Wash (En/W)' },
  { value: 'heavy_enzyme', label: 'Heavy Enzyme Wash (Hy/En/W)' },
  { value: 'dark', label: 'Dark Wash (Dk/W)' },
  { value: 'mid', label: 'Mid Wash (Mid/W)' },
  { value: 'light', label: 'Light Wash (Lit/W)' },
  { value: 'sky', label: 'Sky Wash (Sky/W)' },
  { value: 'acid', label: 'Acid Wash (Acid/W)' },
  { value: 'tint', label: 'Tint Wash (Tint/W)' },
  { value: 'chemical', label: 'Chemical Wash (Chem/W)' },
];

const processTypeOptions = [
  { value: 'reese', label: 'Reese' },
  { value: 'sand_blast', label: 'Sand Blast (S/B)' },
  { value: 'viscose', label: 'Viscose (V)' },
  { value: 'chevron', label: 'Chevron (Chev)' },
  { value: 'hand_sand', label: 'Hand Sand (H/S)' },
  { value: 'rib', label: 'Rib' },
  { value: 'tool', label: 'Tool' },
  { value: 'grind', label: 'Grind (Grnd)' },
];

const initialRows: OrderRow[] = [
  {
    id: 1,
    date: '2025-08-29',
    referenceNo: 'ORD001',
    customerId: 'CUST001',
    customerName: 'John Doe',
    item: 'Product A',
    quantity: 1000,
    notes: 'Special handling required',
    records: [
      {
        id: '1',
        quantity: 500,
        washType: 'normal',
        processTypes: ['viscose']
      },
      {
        id: '2',
        quantity: 500,
        washType: 'heavy',
        processTypes: ['viscose', 'rib']
      }
    ],
    recordsCount: 2,
    deliveryDate: '2025-09-05',
    status: 'Confirmed',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 2,
    date: '2025-08-28',
    referenceNo: 'ORD002',
    customerId: 'CUST002',
    customerName: 'Jane Smith',
    item: 'Product B',
    quantity: 750,
    notes: 'Rush order',
    records: [
      {
        id: '1',
        quantity: 750,
        washType: 'silicon',
        processTypes: ['sand_blast', 'chevron']
      }
    ],
    recordsCount: 1,
    deliveryDate: '2025-09-10',
    status: 'Processing',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export default function OrdersPage() {
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState(initialRows);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0], // Today's date as default
    referenceNo: '',
    customerId: '',
    item: '',
    quantity: 1,
    notes: '',
    deliveryDate: '',
    status: 'pending',
  });
  const [records, setRecords] = useState<ProcessRecord[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // For unique validation
  const isUnique = (field: string, value: string) => {
    if (!value) return true;
    return !rows.some(row => String(row[field]) === value);
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!form.date) newErrors.date = 'Required';
    if (!form.referenceNo) newErrors.referenceNo = 'Required';
    else if (!isUnique('referenceNo', form.referenceNo)) newErrors.referenceNo = 'Reference number must be unique';
    if (!form.customerId) newErrors.customerId = 'Required';
    if (!form.item) newErrors.item = 'Required';
    if (!form.quantity || form.quantity <= 0) newErrors.quantity = 'Quantity must be greater than 0';

    // Validate total records quantity doesn't exceed order quantity
    const totalRecordsQuantity = getTotalRecordsQuantity();
    if (totalRecordsQuantity > form.quantity) {
      newErrors.records = `Records total quantity (${totalRecordsQuantity}) cannot exceed order quantity (${form.quantity})`;
    }

    // Validate individual records
    records.forEach((record, index) => {
      if (!record.washType) {
        newErrors[`record_${record.id}_washType`] = `Record ${index + 1}: Wash type is required`;
      }
      if (record.quantity <= 0) {
        newErrors[`record_${record.id}_quantity`] = `Record ${index + 1}: Quantity must be greater than 0`;
      }
    });

    return newErrors;
  };

  const handleOpen = () => {
    setForm({
      date: new Date().toISOString().split('T')[0],
      referenceNo: '',
      customerId: '',
      item: '',
      quantity: 1,
      notes: '',
      deliveryDate: '',
      status: 'pending',
    });
    setRecords([]);
    setErrors({});
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }));

    // Clear records error when quantity changes
    if (name === 'quantity') {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.records;
        return newErrors;
      });
    }
  };

  const addRecord = () => {
    const newRecord: ProcessRecord = {
      id: Date.now().toString(),
      quantity: 1,
      washType: '',
      processTypes: [],
    };
    setRecords(prev => [...prev, newRecord]);
  };

  const removeRecord = (recordId: string) => {
    setRecords(prev => prev.filter(record => record.id !== recordId));
  };

  const updateRecord = (recordId: string, field: string, value: string | number | string[]) => {
    setRecords(prev => prev.map(record =>
      record.id === recordId
        ? { ...record, [field]: value }
        : record
    ));

    // Clear related errors when record is updated
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[`record_${recordId}_${field}`];
      delete newErrors.records; // Clear general records error
      return newErrors;
    });
  }; const handleRecordMultiSelectChange = (recordId: string, field: string) => (e: { target: { value: string[] } }) => {
    updateRecord(recordId, field, e.target.value);
  };

  const getTotalRecordsQuantity = () => {
    return records.reduce((total, record) => total + record.quantity, 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validate();
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }

    const selectedCustomer = customerOptions.find(customer => customer.value === form.customerId);
    const now = new Date().toISOString();

    setRows(prev => [
      ...prev,
      {
        id: prev.length ? Math.max(...prev.map(r => r.id)) + 1 : 1,
        date: form.date,
        referenceNo: form.referenceNo,
        customerId: form.customerId,
        customerName: selectedCustomer?.label || '',
        item: form.item,
        quantity: form.quantity,
        notes: form.notes,
        records: records,
        recordsCount: records.length,
        deliveryDate: form.deliveryDate,
        status: form.status.charAt(0).toUpperCase() + form.status.slice(1),
        createdAt: now,
        updatedAt: now,
      },
    ]);
    setOpen(false);
  };

  const filteredRows = rows.filter(row =>
    row.referenceNo.toLowerCase().includes(search.toLowerCase()) ||
    row.customerName.toLowerCase().includes(search.toLowerCase()) ||
    row.item.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full mx-auto px-1 sm:px-3 md:px-4 py-3">
      <div className="flex flex-col gap-2 sm:gap-3 mb-4">
        <h2 className="text-xl md:text-2xl font-bold" style={{ color: colors.text.primary }}>Orders</h2>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 w-full">
          <div className="flex flex-1 items-center w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search by reference, customer, or item..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-xl focus:outline-none text-sm sm:text-base"
              style={{ borderColor: colors.border.light, maxWidth: 300 }}
            />
          </div>
          <div className="w-full sm:w-auto mt-1 sm:mt-0">
            <PrimaryButton style={{ minWidth: 140, width: '100%' }} onClick={handleOpen}>
              + Add Order
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
      {/* Modal for Add Order */}
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
            Add Order
          </Typography>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex flex-col">
                <label className="block text-sm font-medium mb-2">Date <span className="text-red-500">*</span></label>
                <input
                  name="date"
                  type="date"
                  value={form.date}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none text-base ${errors.date ? 'border-red-500' : ''}`}
                  style={{ borderColor: colors.border.light }}
                />
                {errors.date && <span className="text-xs text-red-500 mt-1">{errors.date}</span>}
              </div>
              <div className="flex flex-col">
                <label className="block text-sm font-medium mb-2">Reference No <span className="text-red-500">*</span></label>
                <input
                  name="referenceNo"
                  value={form.referenceNo}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none text-base ${errors.referenceNo ? 'border-red-500' : ''}`}
                  style={{ borderColor: colors.border.light }}
                  placeholder="e.g., ORD001"
                />
                {errors.referenceNo && <span className="text-xs text-red-500 mt-1">{errors.referenceNo}</span>}
              </div>
              <div className="flex flex-col">
                <label className="block text-sm font-medium mb-2">Customer <span className="text-red-500">*</span></label>
                <PrimaryDropdown
                  name="customerId"
                  value={form.customerId}
                  onChange={handleChange}
                  options={customerOptions}
                  placeholder="Select a customer"
                  error={!!errors.customerId}
                  className="px-4 py-3 text-base"
                  style={{ borderColor: colors.border.light }}
                />
                {errors.customerId && <span className="text-xs text-red-500 mt-1">{errors.customerId}</span>}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex flex-col">
                <label className="block text-sm font-medium mb-2">Item <span className="text-red-500">*</span></label>
                <input
                  name="item"
                  value={form.item}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none text-base ${errors.item ? 'border-red-500' : ''}`}
                  style={{ borderColor: colors.border.light }}
                  placeholder="e.g., Product Name"
                />
                {errors.item && <span className="text-xs text-red-500 mt-1">{errors.item}</span>}
              </div>
              <div className="flex flex-col">
                <label className="block text-sm font-medium mb-2">Quantity <span className="text-red-500">*</span></label>
                <input
                  name="quantity"
                  type="number"
                  min="1"
                  value={form.quantity}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none text-base ${errors.quantity ? 'border-red-500' : ''}`}
                  style={{ borderColor: colors.border.light }}
                />
                {errors.quantity && <span className="text-xs text-red-500 mt-1">{errors.quantity}</span>}
              </div>
              <div className="flex flex-col">
                <label className="block text-sm font-medium mb-2">Delivery Date</label>
                <input
                  name="deliveryDate"
                  type="date"
                  value={form.deliveryDate}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border rounded-xl focus:outline-none text-base"
                  style={{ borderColor: colors.border.light }}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label className="block text-sm font-medium mb-2">Status</label>
                <PrimaryDropdown
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  options={statusOptions}
                  placeholder="Select status"
                  className="px-4 py-3 text-base"
                  style={{ borderColor: colors.border.light }}
                />
              </div>
              <div className="flex flex-col">
                <label className="block text-sm font-medium mb-2">Notes</label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-3 border rounded-xl focus:outline-none text-base resize-none"
                  style={{ borderColor: colors.border.light }}
                  placeholder="Enter order notes..."
                />
              </div>
            </div>

            {/* Process Records Section */}
            <div className="mt-6 border-t pt-4">
              <div className="flex justify-between items-center mb-4">
                <Typography variant="h6" fontWeight={600} color={colors.text.primary}>
                  Process Records
                </Typography>
                <PrimaryButton
                  type="button"
                  onClick={addRecord}
                  style={{ minWidth: 140 }}
                >
                  + Add Record
                </PrimaryButton>
              </div>

              {records.length > 0 && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <div className="text-sm text-blue-800">
                    <strong>Total Order Quantity:</strong> {form.quantity} |
                    <strong> Records Total:</strong> {getTotalRecordsQuantity()} |
                    <strong> Remaining:</strong> {form.quantity - getTotalRecordsQuantity()}
                  </div>
                </div>
              )}

              {/* Records validation error */}
              {errors.records && (
                <div className="mb-4 p-3 bg-red-50 rounded-lg">
                  <div className="text-sm text-red-800">
                    <strong>Error:</strong> {errors.records}
                  </div>
                </div>
              )}

              {records.map((record, index) => (
                <div key={record.id} className="border rounded-lg p-4 mb-4 bg-gray-50">
                  <div className="flex justify-between items-center mb-3">
                    <Typography variant="subtitle2" color={colors.text.primary}>
                      Record {index + 1}
                    </Typography>
                    <PrimaryButton
                      type="button"
                      onClick={() => removeRecord(record.id)}
                      style={{
                        minWidth: 80,
                        background: '#ef4444',
                        fontSize: '12px',
                        padding: '6px 12px'
                      }}
                    >
                      Remove
                    </PrimaryButton>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex flex-col">
                      <label className="block text-sm font-medium mb-2">Quantity <span className="text-red-500">*</span></label>
                      <input
                        type="number"
                        min="1"
                        value={record.quantity}
                        onChange={(e) => updateRecord(record.id, 'quantity', Number(e.target.value))}
                        className={`w-full px-4 py-3 border rounded-xl focus:outline-none text-base ${errors[`record_${record.id}_quantity`] ? 'border-red-500' : ''}`}
                        style={{ borderColor: errors[`record_${record.id}_quantity`] ? '#ef4444' : colors.border.light }}
                      />
                      {errors[`record_${record.id}_quantity`] && (
                        <span className="text-xs text-red-500 mt-1">{errors[`record_${record.id}_quantity`]}</span>
                      )}
                    </div>

                    <div className="flex flex-col">
                      <label className="block text-sm font-medium mb-2">Wash Type <span className="text-red-500">*</span></label>
                      <PrimaryDropdown
                        name="washType"
                        value={record.washType}
                        onChange={(e) => updateRecord(record.id, 'washType', e.target.value)}
                        options={washTypeOptions}
                        placeholder="Select wash type"
                        error={!!errors[`record_${record.id}_washType`]}
                        className="px-4 py-3 text-base"
                        style={{ borderColor: errors[`record_${record.id}_washType`] ? '#ef4444' : colors.border.light }}
                      />
                      {errors[`record_${record.id}_washType`] && (
                        <span className="text-xs text-red-500 mt-1">{errors[`record_${record.id}_washType`]}</span>
                      )}
                    </div>

                    <div className="flex flex-col">
                      <label className="block text-sm font-medium mb-2">Process Types</label>
                      <PrimaryMultiSelect
                        name="processTypes"
                        value={record.processTypes}
                        onChange={handleRecordMultiSelectChange(record.id, 'processTypes')}
                        options={processTypeOptions}
                        placeholder="Select process types"
                        className="text-base"
                        style={{ borderColor: colors.border.light }}
                      />
                    </div>
                  </div>
                </div>
              ))}

              {records.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Typography variant="body2">
                    No process records added yet. Click "Add Record" to start.
                  </Typography>
                </div>
              )}
            </div>
            <div className="flex gap-4 mt-4 justify-end">
              <PrimaryButton type="button" style={{ minWidth: 120, background: colors.primary[100], color: colors.text.primary }} onClick={handleClose}>
                Cancel
              </PrimaryButton>
              <PrimaryButton type="submit" style={{ minWidth: 140 }}>
                Save Order
              </PrimaryButton>
            </div>
          </form>
        </Box>
      </Modal>
    </div>
  );
}
