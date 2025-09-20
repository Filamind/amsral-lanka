import { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, TextField, Button, Alert, CircularProgress, InputAdornment, IconButton, Tabs, Tab, Paper, Avatar, Chip } from '@mui/material';
import { Person, Lock, Edit, Visibility, VisibilityOff, AccountCircle, Security, PersonPin } from '@mui/icons-material';
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
        <Box sx={{
            p: { xs: 2, sm: 3, md: 4 },
            background: colors.background.secondary,
            minHeight: '100vh'
        }}>
            {/* Header Section */}
            <Box sx={{ mb: 4 }}>
                <Typography
                    variant="h4"
                    sx={{
                        color: colors.text.primary,
                        fontWeight: 700,
                        mb: 1,
                        fontSize: { xs: '1.75rem', sm: '2rem', md: '2.5rem' }
                    }}
                >
                    Profile Settings
                </Typography>
                <Typography
                    variant="body1"
                    sx={{
                        color: colors.text.secondary,
                        fontSize: '1.1rem'
                    }}
                >
                    Manage your account information and security settings
                </Typography>
            </Box>

            {/* User Info Card */}
            <Card sx={{
                mb: 4,
                background: colors.gradients.loginCard,
                border: `1px solid ${colors.border.light}`,
                borderRadius: 3,
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
            }}>
                <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Avatar
                            sx={{
                                width: 80,
                                height: 80,
                                background: colors.gradients.primaryBlue,
                                fontSize: '2rem',
                                fontWeight: 600
                            }}
                        >
                            {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                            <Typography
                                variant="h5"
                                sx={{
                                    color: colors.text.primary,
                                    fontWeight: 600,
                                    mb: 0.5
                                }}
                            >
                                {user?.firstName} {user?.lastName}
                            </Typography>
                            <Typography
                                variant="body1"
                                sx={{
                                    color: colors.text.secondary,
                                    mb: 1
                                }}
                            >
                                @{user?.username}
                            </Typography>
                            <Chip
                                label={user?.role?.name || user?.role || 'User'}
                                sx={{
                                    background: colors.primary[100],
                                    color: colors.primary[700],
                                    fontWeight: 600,
                                    fontSize: '0.875rem'
                                }}
                            />
                        </Box>
                    </Box>
                </CardContent>
            </Card>

            {/* Tab Navigation */}
            <Paper sx={{
                mb: 3,
                borderRadius: 2,
                border: `1px solid ${colors.border.light}`,
                overflow: 'hidden'
            }}>
                <Tabs
                    value={activeTab}
                    onChange={(_, newValue) => setActiveTab(newValue)}
                    variant="fullWidth"
                    sx={{
                        '& .MuiTab-root': {
                            textTransform: 'none',
                            fontWeight: 600,
                            fontSize: '1rem',
                            py: 2,
                            minHeight: 60,
                            color: colors.text.secondary,
                            '&.Mui-selected': {
                                color: colors.primary[600],
                                background: colors.primary[50]
                            }
                        },
                        '& .MuiTabs-indicator': {
                            height: 3,
                            background: colors.gradients.primaryBlue
                        }
                    }}
                >
                    <Tab
                        value="profile"
                        label="Profile Information"
                        icon={<Person />}
                        iconPosition="start"
                    />
                    <Tab
                        value="password"
                        label="Change Password"
                        icon={<Security />}
                        iconPosition="start"
                    />
                    <Tab
                        value="username"
                        label="Change Username"
                        icon={<PersonPin />}
                        iconPosition="start"
                    />
                </Tabs>
            </Paper>

            {/* Profile Information Tab */}
            {activeTab === 'profile' && (
                <Card sx={{
                    width: '100%',
                    background: colors.background.card,
                    border: `1px solid ${colors.border.light}`,
                    borderRadius: 3,
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                }}>
                    <CardContent sx={{ p: 4 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                            <AccountCircle sx={{ color: colors.primary[500], fontSize: 28 }} />
                            <Typography variant="h5" sx={{ color: colors.text.primary, fontWeight: 600 }}>
                                Personal Information
                            </Typography>
                        </Box>

                        <form onSubmit={handleProfileSubmit}>
                            <Box sx={{
                                display: 'grid',
                                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
                                gap: 3,
                                mb: 3
                            }}>
                                <TextField
                                    label="First Name"
                                    value={profileForm.firstName}
                                    onChange={(e) => setProfileForm(prev => ({ ...prev, firstName: e.target.value }))}
                                    error={!!errors.firstName}
                                    helperText={errors.firstName}
                                    fullWidth
                                    required
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 2,
                                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                                borderColor: colors.primary[300]
                                            },
                                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                borderColor: colors.primary[500]
                                            }
                                        }
                                    }}
                                />
                                <TextField
                                    label="Last Name"
                                    value={profileForm.lastName}
                                    onChange={(e) => setProfileForm(prev => ({ ...prev, lastName: e.target.value }))}
                                    error={!!errors.lastName}
                                    helperText={errors.lastName}
                                    fullWidth
                                    required
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 2,
                                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                                borderColor: colors.primary[300]
                                            },
                                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                borderColor: colors.primary[500]
                                            }
                                        }
                                    }}
                                />
                            </Box>

                            <Box sx={{
                                display: 'grid',
                                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
                                gap: 3,
                                mb: 4
                            }}>
                                <TextField
                                    label="Phone Number"
                                    value={profileForm.phone}
                                    onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                                    error={!!errors.phone}
                                    helperText={errors.phone}
                                    fullWidth
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 2,
                                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                                borderColor: colors.primary[300]
                                            },
                                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                borderColor: colors.primary[500]
                                            }
                                        }
                                    }}
                                />
                                <TextField
                                    label="Date of Birth"
                                    type="date"
                                    value={profileForm.dateOfBirth}
                                    onChange={(e) => setProfileForm(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                                    InputLabelProps={{ shrink: true }}
                                    fullWidth
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 2,
                                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                                borderColor: colors.primary[300]
                                            },
                                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                borderColor: colors.primary[500]
                                            }
                                        }
                                    }}
                                />
                            </Box>

                            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <PrimaryButton
                                    type="submit"
                                    loading={loading}
                                    disabled={loading}
                                    sx={{
                                        minWidth: 120,
                                        height: 44,
                                        fontSize: '0.95rem',
                                        fontWeight: 600
                                    }}
                                >
                                    Update Profile
                                </PrimaryButton>
                            </Box>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Change Password Tab */}
            {activeTab === 'password' && (
                <Card sx={{
                    width: '100%',
                    background: colors.background.card,
                    border: `1px solid ${colors.border.light}`,
                    borderRadius: 3,
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                }}>
                    <CardContent sx={{ p: 4 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                            <Security sx={{ color: colors.primary[500], fontSize: 28 }} />
                            <Typography variant="h5" sx={{ color: colors.text.primary, fontWeight: 600 }}>
                                Change Password
                            </Typography>
                        </Box>

                        <Alert
                            severity="info"
                            sx={{
                                mb: 4,
                                borderRadius: 2,
                                background: colors.primary[50],
                                border: `1px solid ${colors.primary[200]}`,
                                '& .MuiAlert-icon': {
                                    color: colors.primary[600]
                                }
                            }}
                        >
                            Your password must be at least 6 characters long for security purposes.
                        </Alert>

                        <form onSubmit={handlePasswordSubmit}>
                            <Box sx={{
                                maxWidth: { xs: '100%', sm: 600, md: 800 }
                            }}>
                                <TextField
                                    label="Current Password"
                                    type={showPasswords.current ? "text" : "password"}
                                    value={passwordForm.currentPassword}
                                    onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                                    error={!!errors.currentPassword}
                                    helperText={errors.currentPassword}
                                    fullWidth
                                    sx={{
                                        mb: 3,
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 2,
                                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                                borderColor: colors.primary[300]
                                            },
                                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                borderColor: colors.primary[500]
                                            }
                                        }
                                    }}
                                    required
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    onClick={() => togglePasswordVisibility('current')}
                                                    edge="end"
                                                    size="small"
                                                    sx={{ color: colors.text.secondary }}
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
                                    sx={{
                                        mb: 3,
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 2,
                                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                                borderColor: colors.primary[300]
                                            },
                                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                borderColor: colors.primary[500]
                                            }
                                        }
                                    }}
                                    required
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    onClick={() => togglePasswordVisibility('new')}
                                                    edge="end"
                                                    size="small"
                                                    sx={{ color: colors.text.secondary }}
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
                                    sx={{
                                        mb: 4,
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 2,
                                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                                borderColor: colors.primary[300]
                                            },
                                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                borderColor: colors.primary[500]
                                            }
                                        }
                                    }}
                                    required
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    onClick={() => togglePasswordVisibility('confirm')}
                                                    edge="end"
                                                    size="small"
                                                    sx={{ color: colors.text.secondary }}
                                                >
                                                    {showPasswords.confirm ? <VisibilityOff /> : <Visibility />}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    }}
                                />

                                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                    <PrimaryButton
                                        type="submit"
                                        loading={loading}
                                        disabled={loading}
                                        sx={{
                                            minWidth: 140,
                                            height: 44,
                                            fontSize: '0.95rem',
                                            fontWeight: 600
                                        }}
                                    >
                                        Change Password
                                    </PrimaryButton>
                                </Box>
                            </Box>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Change Username Tab */}
            {activeTab === 'username' && (
                <Card sx={{
                    width: '100%',
                    background: colors.background.card,
                    border: `1px solid ${colors.border.light}`,
                    borderRadius: 3,
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                }}>
                    <CardContent sx={{ p: 4 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                            <PersonPin sx={{ color: colors.primary[500], fontSize: 28 }} />
                            <Typography variant="h5" sx={{ color: colors.text.primary, fontWeight: 600 }}>
                                Change Username
                            </Typography>
                        </Box>

                        <Alert
                            severity="warning"
                            sx={{
                                mb: 4,
                                borderRadius: 2,
                                background: colors.warning + '15',
                                border: `1px solid ${colors.warning}40`,
                                '& .MuiAlert-icon': {
                                    color: colors.warning
                                }
                            }}
                        >
                            Changing your username will require you to log in again with your new username. Make sure you remember your new username.
                        </Alert>

                        <form onSubmit={handleUsernameSubmit}>
                            <Box sx={{
                                maxWidth: { xs: '100%', sm: 600, md: 800 }
                            }}>
                                <TextField
                                    label="New Username"
                                    value={usernameForm.newUsername}
                                    onChange={(e) => setUsernameForm(prev => ({ ...prev, newUsername: e.target.value }))}
                                    error={!!errors.newUsername}
                                    helperText={errors.newUsername}
                                    fullWidth
                                    sx={{
                                        mb: 4,
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 2,
                                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                                borderColor: colors.primary[300]
                                            },
                                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                borderColor: colors.primary[500]
                                            }
                                        }
                                    }}
                                    required
                                />

                                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                    <PrimaryButton
                                        type="submit"
                                        loading={loading}
                                        disabled={loading}
                                        sx={{
                                            minWidth: 140,
                                            height: 44,
                                            fontSize: '0.95rem',
                                            fontWeight: 600
                                        }}
                                    >
                                        Change Username
                                    </PrimaryButton>
                                </Box>
                            </Box>
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
