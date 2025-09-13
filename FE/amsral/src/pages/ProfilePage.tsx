import { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, TextField, Button, Divider, Alert, CircularProgress, InputAdornment, IconButton } from '@mui/material';
import { Person, Lock, Edit, Visibility, VisibilityOff } from '@mui/icons-material';
import PrimaryButton from '../components/common/PrimaryButton';
import ConfirmationDialog from '../components/common/ConfirmationDialog';
import colors from '../styles/colors';
import { useAuth } from '../hooks/useAuth';
import { UserService, type ChangePasswordRequest, type ChangeUsernameRequest, type UpdateProfileRequest } from '../services/userService';
import toast from 'react-hot-toast';

export default function ProfilePage() {
    const { user, updateUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'username'>('profile');

    // Profile form state
    const [profileForm, setProfileForm] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        dateOfBirth: '',
    });

    // Password form state
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    // Username form state
    const [usernameForm, setUsernameForm] = useState({
        newUsername: '',
    });

    // Form errors
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    // Password visibility state
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false,
    });

    // Confirmation dialog state
    const [confirmDialog, setConfirmDialog] = useState({
        open: false,
        title: '',
        message: '',
        onConfirm: () => { },
    });

    // Initialize form with user data
    useEffect(() => {
        if (user) {
            setProfileForm({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                phone: user.phone || '',
                dateOfBirth: user.dateOfBirth || '',
            });
            setUsernameForm({
                newUsername: user.username || '',
            });
        }
    }, [user]);

    // Toggle password visibility
    const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
        setShowPasswords(prev => ({
            ...prev,
            [field]: !prev[field]
        }));
    };

    const validateProfileForm = () => {
        const newErrors: { [key: string]: string } = {};

        if (!profileForm.firstName.trim()) newErrors.firstName = 'First name is required';
        if (!profileForm.lastName.trim()) newErrors.lastName = 'Last name is required';
        if (profileForm.phone && profileForm.phone.length > 20) {
            newErrors.phone = 'Phone number must be 20 characters or less';
        }

        return newErrors;
    };

    const validatePasswordForm = () => {
        const newErrors: { [key: string]: string } = {};

        if (!passwordForm.currentPassword) newErrors.currentPassword = 'Current password is required';
        if (!passwordForm.newPassword) newErrors.newPassword = 'New password is required';
        if (passwordForm.newPassword.length < 6) {
            newErrors.newPassword = 'New password must be at least 6 characters';
        }
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        return newErrors;
    };

    const validateUsernameForm = () => {
        const newErrors: { [key: string]: string } = {};

        if (!usernameForm.newUsername.trim()) newErrors.newUsername = 'Username is required';
        if (usernameForm.newUsername.length < 3) {
            newErrors.newUsername = 'Username must be at least 3 characters';
        }
        if (usernameForm.newUsername.length > 50) {
            newErrors.newUsername = 'Username must be 50 characters or less';
        }

        return newErrors;
    };

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const validation = validateProfileForm();
        if (Object.keys(validation).length > 0) {
            setErrors(validation);
            return;
        }

        if (!user?.id) return;

        setLoading(true);
        setErrors({});

        try {
            const profileData: UpdateProfileRequest = {
                firstName: profileForm.firstName,
                lastName: profileForm.lastName,
                phone: profileForm.phone || undefined,
                dateOfBirth: profileForm.dateOfBirth || undefined,
            };

            const updatedUser = await UserService.updateProfile(user.id, profileData);
            updateUser(updatedUser);
            toast.success('Profile updated successfully!');
        } catch (error: any) {
            console.error('Error updating profile:', error);
            const errorMessage = error?.response?.data?.message || 'Failed to update profile';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const validation = validatePasswordForm();
        if (Object.keys(validation).length > 0) {
            setErrors(validation);
            return;
        }

        if (!user?.id) return;

        setLoading(true);
        setErrors({});

        try {
            const passwordData: ChangePasswordRequest = {
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword,
            };

            await UserService.changePassword(user.id, passwordData);
            toast.success('Password changed successfully!');
            setPasswordForm({
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
            });
        } catch (error: any) {
            console.error('Error changing password:', error);
            const errorMessage = error?.response?.data?.message || 'Failed to change password';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleUsernameSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const validation = validateUsernameForm();
        if (Object.keys(validation).length > 0) {
            setErrors(validation);
            return;
        }

        if (!user?.id) return;

        setConfirmDialog({
            open: true,
            title: 'Change Username',
            message: `Are you sure you want to change your username to "${usernameForm.newUsername}"?`,
            onConfirm: async () => {
                setLoading(true);
                setErrors({});

                try {
                    const usernameData: ChangeUsernameRequest = {
                        newUsername: usernameForm.newUsername,
                    };

                    const updatedUser = await UserService.changeUsername(user.id, usernameData);
                    updateUser(updatedUser);
                    toast.success('Username changed successfully!');
                } catch (error: any) {
                    console.error('Error changing username:', error);
                    const errorMessage = error?.response?.data?.message || 'Failed to change username';
                    toast.error(errorMessage);
                } finally {
                    setLoading(false);
                    setConfirmDialog(prev => ({ ...prev, open: false }));
                }
            },
        });
    };

    if (!user) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" sx={{ mb: 3, color: colors.text.primary, fontWeight: 600 }}>
                Profile Settings
            </Typography>

            {/* Tab Navigation */}
            <Box sx={{ mb: 3, display: 'flex', gap: 1 }}>
                <Button
                    variant={activeTab === 'profile' ? 'contained' : 'outlined'}
                    onClick={() => setActiveTab('profile')}
                    startIcon={<Person />}
                    sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600,
                    }}
                >
                    Profile Information
                </Button>
                <Button
                    variant={activeTab === 'password' ? 'contained' : 'outlined'}
                    onClick={() => setActiveTab('password')}
                    startIcon={<Lock />}
                    sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600,
                    }}
                >
                    Change Password
                </Button>
                <Button
                    variant={activeTab === 'username' ? 'contained' : 'outlined'}
                    onClick={() => setActiveTab('username')}
                    startIcon={<Edit />}
                    sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600,
                    }}
                >
                    Change Username
                </Button>
            </Box>

            {/* Profile Information Tab */}
            {activeTab === 'profile' && (
                <Card sx={{ maxWidth: 600 }}>
                    <CardContent>
                        <Typography variant="h6" sx={{ mb: 3, color: colors.text.primary, fontWeight: 600 }}>
                            Personal Information
                        </Typography>

                        <form onSubmit={handleProfileSubmit}>
                            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
                                <TextField
                                    label="First Name"
                                    value={profileForm.firstName}
                                    onChange={(e) => setProfileForm(prev => ({ ...prev, firstName: e.target.value }))}
                                    error={!!errors.firstName}
                                    helperText={errors.firstName}
                                    fullWidth
                                    required
                                />
                                <TextField
                                    label="Last Name"
                                    value={profileForm.lastName}
                                    onChange={(e) => setProfileForm(prev => ({ ...prev, lastName: e.target.value }))}
                                    error={!!errors.lastName}
                                    helperText={errors.lastName}
                                    fullWidth
                                    required
                                />
                            </Box>

                            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
                                <TextField
                                    label="Phone Number"
                                    value={profileForm.phone}
                                    onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                                    error={!!errors.phone}
                                    helperText={errors.phone}
                                    fullWidth
                                />
                                <TextField
                                    label="Date of Birth"
                                    type="date"
                                    value={profileForm.dateOfBirth}
                                    onChange={(e) => setProfileForm(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                                    InputLabelProps={{ shrink: true }}
                                    fullWidth
                                />
                            </Box>

                            <PrimaryButton
                                type="submit"
                                loading={loading}
                                disabled={loading}
                                sx={{ minWidth: 120 }}
                            >
                                Update Profile
                            </PrimaryButton>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Change Password Tab */}
            {activeTab === 'password' && (
                <Card sx={{ maxWidth: 600 }}>
                    <CardContent>
                        <Typography variant="h6" sx={{ mb: 3, color: colors.text.primary, fontWeight: 600 }}>
                            Change Password
                        </Typography>

                        <Alert severity="info" sx={{ mb: 3 }}>
                            Your password must be at least 6 characters long.
                        </Alert>

                        <form onSubmit={handlePasswordSubmit}>
                            <TextField
                                label="Current Password"
                                type={showPasswords.current ? "text" : "password"}
                                value={passwordForm.currentPassword}
                                onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                                error={!!errors.currentPassword}
                                helperText={errors.currentPassword}
                                fullWidth
                                sx={{ mb: 2 }}
                                required
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                onClick={() => togglePasswordVisibility('current')}
                                                edge="end"
                                                size="small"
                                            >
                                                {showPasswords.current ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />

                            <TextField
                                label="New Password"
                                type={showPasswords.new ? "text" : "password"}
                                value={passwordForm.newPassword}
                                onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                                error={!!errors.newPassword}
                                helperText={errors.newPassword}
                                fullWidth
                                sx={{ mb: 2 }}
                                required
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                onClick={() => togglePasswordVisibility('new')}
                                                edge="end"
                                                size="small"
                                            >
                                                {showPasswords.new ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />

                            <TextField
                                label="Confirm New Password"
                                type={showPasswords.confirm ? "text" : "password"}
                                value={passwordForm.confirmPassword}
                                onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                error={!!errors.confirmPassword}
                                helperText={errors.confirmPassword}
                                fullWidth
                                sx={{ mb: 3 }}
                                required
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                onClick={() => togglePasswordVisibility('confirm')}
                                                edge="end"
                                                size="small"
                                            >
                                                {showPasswords.confirm ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />

                            <PrimaryButton
                                type="submit"
                                loading={loading}
                                disabled={loading}
                                sx={{ minWidth: 120 }}
                            >
                                Change Password
                            </PrimaryButton>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Change Username Tab */}
            {activeTab === 'username' && (
                <Card sx={{ maxWidth: 600 }}>
                    <CardContent>
                        <Typography variant="h6" sx={{ mb: 3, color: colors.text.primary, fontWeight: 600 }}>
                            Change Username
                        </Typography>

                        <Alert severity="warning" sx={{ mb: 3 }}>
                            Changing your username will require you to log in again with your new username.
                        </Alert>

                        <form onSubmit={handleUsernameSubmit}>
                            <TextField
                                label="New Username"
                                value={usernameForm.newUsername}
                                onChange={(e) => setUsernameForm(prev => ({ ...prev, newUsername: e.target.value }))}
                                error={!!errors.newUsername}
                                helperText={errors.newUsername}
                                fullWidth
                                sx={{ mb: 3 }}
                                required
                            />

                            <PrimaryButton
                                type="submit"
                                loading={loading}
                                disabled={loading}
                                sx={{ minWidth: 120 }}
                            >
                                Change Username
                            </PrimaryButton>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Confirmation Dialog */}
            <ConfirmationDialog
                open={confirmDialog.open}
                title={confirmDialog.title}
                message={confirmDialog.message}
                confirmText="Confirm"
                cancelText="Cancel"
                onConfirm={confirmDialog.onConfirm}
                onCancel={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
                loading={loading}
            />
        </Box>
    );
}
