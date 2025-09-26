import React from 'react';
import { Box, Typography } from '@mui/material';
import PrimaryButton from '../common/PrimaryButton';
import PrimaryDropdown from '../common/PrimaryDropdown';
import PrimaryMultiSelect from '../common/PrimaryMultiSelect';
import PrimaryNumberInput from '../common/PrimaryNumberInput';
import colors from '../../styles/colors';

interface ProcessRecord {
    id: string;
    quantity: number;
    washType: string;
    processTypes: string[];
}

interface ProcessRecordsProps {
    records: ProcessRecord[];
    errors: { [key: string]: string };
    washTypeOptions: { value: string; label: string }[];
    processTypeOptions: { value: string; label: string }[];
    optionsLoading: boolean;
    onAddRecord: () => void;
    onRemoveRecord: (recordId: string) => void;
    onUpdateRecord: (recordId: string, field: string, value: any) => void;
    onRecordMultiSelectChange: (recordId: string, field: string) => (e: { target: { value: string[] } }) => void;
}

const ProcessRecords: React.FC<ProcessRecordsProps> = ({
    records,
    errors,
    washTypeOptions,
    processTypeOptions,
    optionsLoading,
    onAddRecord,
    onRemoveRecord,
    onUpdateRecord,
    onRecordMultiSelectChange,
}) => {
    return (
        <Box className="border-t pt-4">
            <div className="flex items-center justify-between mb-4">
                <Typography variant="h6" fontWeight={600} color={colors.text.primary}>
                    Process Records
                </Typography>
                <PrimaryButton
                    onClick={onAddRecord}
                    className="px-4 py-2 text-sm"
                    style={{
                        backgroundColor: colors.primary[500],
                        color: colors.text.white,
                        border: 'none',
                        borderRadius: '8px',
                    }}
                >
                    + Add Record
                </PrimaryButton>
            </div>

            {records.length > 0 && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                    <div className="text-sm text-blue-800">
                        <strong>Total Records:</strong> {records.length}
                    </div>
                </div>
            )}

            {records.map((record, index) => (
                <div key={record.id} className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="flex justify-between items-center mb-4">
                        <Typography variant="subtitle1" fontWeight={500} color={colors.text.primary}>
                            Record {index + 1}
                        </Typography>
                        <PrimaryButton
                            onClick={() => onRemoveRecord(record.id)}
                            className="px-3 py-1 text-sm"
                            style={{
                                backgroundColor: colors.error,
                                color: colors.text.white,
                                border: 'none',
                                borderRadius: '6px',
                            }}
                        >
                            Remove
                        </PrimaryButton>
                    </div>

                    <div className="flex items-center gap-4 mb-4">
                        <div className="flex-1">
                            <PrimaryNumberInput
                                value={record.quantity}
                                onChange={(e) => onUpdateRecord(record.id, 'quantity', Number(e.target.value))}
                                label=""
                                placeholder="Enter quantity"
                                min={1}
                                error={!!errors[`record_${record.id}_quantity`]}
                                helperText={errors[`record_${record.id}_quantity`]}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex-1">
                            <PrimaryDropdown
                                name="washType"
                                value={record.washType}
                                onChange={(e) => onUpdateRecord(record.id, 'washType', e.target.value)}
                                options={washTypeOptions}
                                placeholder={optionsLoading ? "Loading wash types..." : "Select wash type"}
                                error={!!errors[`record_${record.id}_washType`]}
                                disabled={optionsLoading}
                                className="px-4 py-3 text-base"
                                style={{ borderColor: errors[`record_${record.id}_washType`] ? '#ef4444' : colors.border.light }}
                            />
                            {errors[`record_${record.id}_washType`] && (
                                <span className="text-xs text-red-500 mt-1 block">{errors[`record_${record.id}_washType`]}</span>
                            )}
                        </div>

                        <div className="flex-1">
                            <PrimaryMultiSelect
                                name="processTypes"
                                value={record.processTypes}
                                onChange={onRecordMultiSelectChange(record.id, 'processTypes')}
                                options={processTypeOptions}
                                placeholder={optionsLoading ? "Loading process types..." : "Select process types"}
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
        </Box>
    );
};

export default ProcessRecords;
