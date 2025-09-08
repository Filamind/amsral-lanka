import { useState, useEffect } from 'react';
import { Modal, Box } from '@mui/material';
import type { GridColDef } from '@mui/x-data-grid';
import PrimaryButton from '../components/common/PrimaryButton';
import PrimaryTable from '../components/common/PrimaryTable';
import OrderForm from '../components/orders/OrderForm';
import AdditionalInformation from '../components/orders/AdditionalInformation';
import ProcessRecords from '../components/orders/ProcessRecords';
import OrderFormActions from '../components/orders/OrderFormActions';
import colors from '../styles/colors';
import { orderService, type CreateOrderRequest, type ErrorResponse } from '../services/orderService';
import CustomerService from '../services/customerService';
import { itemService } from '../services/itemService';
import { washingTypeService } from '../services/washingTypeService';
import { processTypeService } from '../services/processTypeService';
import toast from 'react-hot-toast';

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
  itemId: string;
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
  item: string; // This will be itemName from API
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
        itemId: 'ITEM001',
        quantity: 500,
        washType: 'normal',
        processTypes: ['viscose']
      },
      {
        id: '2',
        itemId: 'ITEM001',
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
        itemId: 'ITEM002',
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
  const [loading, setLoading] = useState(false);

  // State for dropdown options
  const [customerOptions, setCustomerOptions] = useState<{ value: string; label: string }[]>([]);
  const [itemOptions, setItemOptions] = useState<{ value: string; label: string }[]>([]);
  const [washTypeOptions, setWashTypeOptions] = useState<{ value: string; label: string }[]>([]);
  const [processTypeOptions, setProcessTypeOptions] = useState<{ value: string; label: string }[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(true);

  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0], // Today's date as default
    customerId: '',
    quantity: 1,
    notes: '',
    deliveryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 weeks from now
  });
  const [records, setRecords] = useState<ProcessRecord[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showAdditional, setShowAdditional] = useState(false);

  // Fetch dropdown options on component mount
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setOptionsLoading(true);

        // Fetch customers with full names
        const customersResponse = await CustomerService.getAllCustomers({
          limit: 100, // Get all customers for dropdown
          isActive: true
        });
        const customerOpts = customersResponse.customers.map(customer => ({
          value: customer.id!.toString(),
          label: `${customer.firstName} ${customer.lastName}`.trim()
        }));
        setCustomerOptions(customerOpts);

        // Fetch items
        const itemsResponse = await itemService.getItemsList();
        setItemOptions(itemsResponse.data);

        // Fetch washing types
        const washingTypesResponse = await washingTypeService.getWashingTypes({
          limit: 100 // Get all washing types for dropdown
        });
        const washTypeOpts = washingTypesResponse.data.washingTypes.map(washType => ({
          value: washType.id,
          label: `${washType.name} (${washType.code})`
        }));
        setWashTypeOptions(washTypeOpts);

        // Fetch process types
        const processTypesResponse = await processTypeService.getProcessTypesList();
        // The API returns data with { id, value, label } format which matches our dropdown needs
        const processTypeOpts = processTypesResponse.data.map(item => ({
          value: item.value.toString(),
          label: item.label
        }));
        setProcessTypeOptions(processTypeOpts);

      } catch (error) {
        console.error('Error fetching dropdown options:', error);
        toast.error('Failed to load dropdown options. Please refresh the page.');
      } finally {
        setOptionsLoading(false);
      }
    };

    fetchOptions();
  }, []);

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!form.date) newErrors.date = 'Date is required';
    if (!form.customerId) newErrors.customerId = 'Customer is required';
    if (!form.quantity || form.quantity <= 0) newErrors.quantity = 'Quantity must be greater than 0';

    // Validate total records quantity doesn't exceed order quantity
    const totalRecordsQuantity = getTotalRecordsQuantity();
    if (totalRecordsQuantity > form.quantity) {
      newErrors.records = `Records total quantity (${totalRecordsQuantity}) cannot exceed order quantity (${form.quantity})`;
    }

    // Validate individual records
    records.forEach((record, index) => {
      if (!record.itemId) {
        newErrors[`record_${record.id}_itemId`] = `Record ${index + 1}: Item is required`;
      }
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
      customerId: '',
      quantity: 1,
      notes: '',
      deliveryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 weeks from now
    });
    setRecords([]);
    setErrors({});
    setShowAdditional(false);
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
      itemId: '',
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validate();
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      // Prepare the order data according to API format
      const orderData: CreateOrderRequest = {
        date: form.date,
        customerId: form.customerId,
        quantity: form.quantity,
        notes: form.notes || undefined,
        deliveryDate: form.deliveryDate,
        records: records.map(record => ({
          itemId: record.itemId,
          quantity: record.quantity,
          washType: record.washType,
          processTypes: record.processTypes
        }))
      };

      // Call the API
      const response = await orderService.createOrder(orderData);

      if (response.success) {
        // Add the new order to the local state
        const newOrderRow: OrderRow = {
          id: response.data.id,
          date: response.data.date,
          referenceNo: response.data.referenceNo,
          customerId: response.data.customerId,
          customerName: response.data.customerName,
          item: response.data.itemName,
          quantity: response.data.quantity,
          notes: response.data.notes,
          records: response.data.records.map(record => ({
            id: record.id.toString(),
            itemId: record.itemId,
            quantity: record.quantity,
            washType: record.washType,
            processTypes: record.processTypes
          })),
          recordsCount: response.data.recordsCount,
          deliveryDate: response.data.deliveryDate,
          status: response.data.status,
          createdAt: response.data.createdAt,
          updatedAt: response.data.updatedAt,
        };

        setRows(prev => [newOrderRow, ...prev]);
        setOpen(false);

        // Reset form
        setForm({
          date: new Date().toISOString().split('T')[0],
          customerId: '',
          quantity: 1,
          notes: '',
          deliveryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        });
        setRecords([]);
        setShowAdditional(false);
      }
    } catch (error) {
      console.error('Error creating order:', error);

      // Handle API validation errors
      const apiError = error as ErrorResponse;
      if (apiError.errors) {
        setErrors(apiError.errors);
      } else {
        setErrors({ general: apiError.message || 'Failed to create order. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
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
            p: { xs: 3, sm: 4, md: 5 },
            width: { xs: '95vw', sm: '90vw', md: '85vw', lg: '800px', xl: '900px' },
            maxWidth: '95vw',
            maxHeight: '95vh',
            overflowY: 'auto',
          }}
        >
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {/* General error message */}
            {errors.general && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="text-sm text-red-800">
                  <strong>Error:</strong> {errors.general}
                </div>
              </div>
            )}

            {/* Order Form Component */}
            <OrderForm
              form={{ customerId: form.customerId, quantity: form.quantity }}
              errors={errors}
              customerOptions={customerOptions}
              optionsLoading={optionsLoading}
              onChange={handleChange}
            />

            {/* Additional Information Component */}
            <AdditionalInformation
              form={{ date: form.date, deliveryDate: form.deliveryDate, notes: form.notes }}
              errors={errors}
              showAdditional={showAdditional}
              onChange={handleChange}
              onToggle={() => setShowAdditional(!showAdditional)}
            />

            {/* Process Records Component */}
            <ProcessRecords
              records={records}
              errors={errors}
              itemOptions={itemOptions}
              washTypeOptions={washTypeOptions}
              processTypeOptions={processTypeOptions}
              optionsLoading={optionsLoading}
              onAddRecord={addRecord}
              onRemoveRecord={removeRecord}
              onUpdateRecord={updateRecord}
              onRecordMultiSelectChange={handleRecordMultiSelectChange}
            />

            {/* Form Actions Component */}
            <OrderFormActions
              loading={loading}
              onCancel={handleClose}
              onSubmit={handleSubmit}
            />
          </form>
        </Box>
      </Modal>
    </div>
  );
}
