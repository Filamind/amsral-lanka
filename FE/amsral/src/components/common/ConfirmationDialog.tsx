import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Button,
    Box,
} from '@mui/material';
import { Warning } from '@mui/icons-material';
import colors from '../../styles/colors';

interface ConfirmationDialogProps {
    open: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
    loading?: boolean;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
    open,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    onConfirm,
    onCancel,
    loading = false,
}) => {
    return (
        <Dialog
            open={open}
            onClose={onCancel}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 2,
                },
            }}
        >
            <DialogTitle>
                <Box display="flex" alignItems="center" gap={1}>
                    <Warning color="warning" />
                    {title}
                </Box>
            </DialogTitle>
            <DialogContent>
                <DialogContentText sx={{ fontSize: '1rem', lineHeight: 1.6 }}>
                    {message}
                </DialogContentText>
            </DialogContent>
            <DialogActions sx={{ p: 3, gap: 1 }}>
                <Button
                    onClick={onCancel}
                    disabled={loading}
                    sx={{
                        color: colors.text.secondary,
                        borderColor: colors.border.light,
                        '&:hover': {
                            borderColor: colors.border.medium,
                        },
                    }}
                >
                    {cancelText}
                </Button>
                <Button
                    onClick={onConfirm}
                    disabled={loading}
                    variant="contained"
                    sx={{
                        backgroundColor: colors.error[500],
                        '&:hover': {
                            backgroundColor: colors.error[600],
                        },
                    }}
                >
                    {loading ? 'Processing...' : confirmText}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ConfirmationDialog;
