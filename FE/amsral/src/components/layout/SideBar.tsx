import { NavLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PeopleIcon from '@mui/icons-material/People';
import BadgeIcon from '@mui/icons-material/Badge';
import GroupsIcon from '@mui/icons-material/Groups';
import LayersIcon from '@mui/icons-material/Layers';
import SettingsApplicationsIcon from '@mui/icons-material/SettingsApplications';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import StorageIcon from '@mui/icons-material/Storage';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import PersonIcon from '@mui/icons-material/Person';
import toast from 'react-hot-toast';
import colors from '../../styles/colors';
import { useState, useMemo } from 'react';
import type { NavigationItem } from '../../types';
import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getRolePermissions } from '../../utils/roleUtils';

const NAVIGATION: NavigationItem[] = [
    { kind: 'header', title: '' },
    { segment: 'dashboard', title: 'Dashboard', icon: <DashboardIcon /> },
    { segment: 'orders', title: 'Orders', icon: <ShoppingCartIcon /> },
    { segment: 'production', title: 'Production Flow', icon: <SettingsApplicationsIcon /> },
    { segment: 'management', title: 'Management', icon: <ManageAccountsIcon /> },
    { kind: 'divider' },
    { segment: 'users', title: 'Users', icon: <PeopleIcon /> },
    { segment: 'employees', title: 'Employees', icon: <BadgeIcon /> },
    { segment: 'customers', title: 'Customers', icon: <GroupsIcon /> },
    { segment: 'system-data', title: 'System Data', icon: <StorageIcon /> },
];

function SideBarNavigation({ navigation, expanded, onToggle }: { navigation: NavigationItem[]; expanded: boolean; onToggle: () => void }) {
    const { logout, user } = useAuth();

    // Filter navigation items based on user permissions
    const filteredNavigation = useMemo(() => {
        if (!user) return navigation;

        const permissions = getRolePermissions(user);

        return navigation.filter(item => {
            if (item.kind === 'header' || item.kind === 'divider') {
                return true; // Always show headers and dividers
            }

            // Filter based on segment permissions
            switch (item.segment) {
                case 'dashboard':
                    return permissions.canViewDashboard;
                case 'orders':
                    return permissions.canViewOrders;
                case 'production':
                    return permissions.canViewProduction;
                case 'management':
                    return permissions.canViewManagement;
                case 'users':
                    return permissions.canViewUsers;
                case 'employees':
                    return permissions.canViewEmployees;
                case 'customers':
                    return permissions.canViewCustomers;
                case 'system-data':
                    return permissions.canViewSystemData;
                default:
                    return true; // Show unknown segments by default
            }
        });
    }, [navigation, user]);

    const handleLogout = () => {
        toast.success('Logged out successfully. See you soon!');
        logout();
    };

    return (
        <Box
            sx={{
                width: expanded ? { xs: 200, sm: 240 } : 64,
                minWidth: expanded ? { xs: 200, sm: 240 } : 64,
                bgcolor: colors.gradients.primaryBlue,
                color: colors.text.primary,
                p: { xs: 1, sm: 2 },
                height: '100vh',
                boxShadow: 3,
                display: 'flex',
                flexDirection: 'column',
                transition: 'width 0.3s cubic-bezier(.4,2,.6,1), min-width 0.3s cubic-bezier(.4,2,.6,1)',
                position: 'relative',
                zIndex: 10,
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: expanded ? 'space-between' : 'center', mb: 2 }}>
                {expanded && (
                    <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: 1, color: colors.primary[700], ml: 1 }}>
                        AMSRAL
                    </Typography>
                )}
                <IconButton onClick={onToggle} size="small" sx={{ color: colors.primary[700], ml: expanded ? 0 : 1 }}>
                    {expanded ? <MenuOpenIcon /> : <MenuIcon />}
                </IconButton>
            </Box>
            <Box sx={{ flex: 1, overflowY: 'auto' }}>
                {filteredNavigation.map((item, idx) => {
                    if (item.kind === 'header') {
                        return expanded ? (
                            <Typography key={idx} variant="subtitle2" sx={{ mt: 2, mb: 1, color: colors.text.secondary, fontWeight: 600, fontSize: { xs: 13, sm: 15 } }}>
                                {item.title}
                            </Typography>
                        ) : <Box key={idx} sx={{ height: 24 }} />;
                    }
                    if (item.kind === 'divider') {
                        return <Box key={idx} sx={{ borderBottom: 1, borderColor: colors.border.light, my: 1 }} />;
                    }
                    // Normal nav item
                    return (
                        <NavLink
                            key={idx}
                            to={`/${item.segment}`}
                            style={({ isActive }) => ({
                                textDecoration: 'none',
                                color: isActive ? colors.primary[700] : colors.text.primary,
                                fontWeight: isActive ? 700 : 500,
                                background: isActive ? colors.gradients.cardHover : 'none',
                                borderRadius: 8,
                                display: 'block',
                            })}
                        >
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    mb: 1,
                                    px: 1.5,
                                    py: 1,
                                    borderRadius: 2,
                                    transition: 'background 0.2s',
                                    '&:hover': {
                                        background: colors.gradients.cardHover,
                                    },
                                    justifyContent: expanded ? 'flex-start' : 'center',
                                }}
                            >
                                <Box sx={{ color: 'inherit', minWidth: 28, display: 'flex', justifyContent: 'center' }}>
                                    {item.icon}
                                </Box>
                                {expanded && (
                                    <Typography sx={{ ml: 2, fontSize: { xs: 14, sm: 16 }, color: 'inherit', fontWeight: 500 }}>
                                        {item.title}
                                    </Typography>
                                )}
                            </Box>
                        </NavLink>
                    );
                })}
            </Box>

            {/* User info, profile, and logout */}
            <Box sx={{ mt: 'auto', pt: 2, borderTop: 1, borderColor: colors.border.light }}>
                {expanded && user && (
                    <Typography variant="caption" sx={{ color: colors.text.secondary, mb: 1, display: 'block', px: 1.5 }}>
                        Welcome, {user.firstName}
                    </Typography>
                )}

                {/* Profile Link */}
                <NavLink
                    to="/profile"
                    style={({ isActive }) => ({
                        textDecoration: 'none',
                        color: isActive ? colors.primary[700] : colors.text.primary,
                        fontWeight: isActive ? 700 : 500,
                        background: isActive ? colors.gradients.cardHover : 'none',
                        borderRadius: 8,
                        display: 'block',
                    })}
                >
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            mb: 1,
                            px: 1.5,
                            py: 1,
                            borderRadius: 2,
                            transition: 'background 0.2s',
                            '&:hover': {
                                background: colors.gradients.cardHover,
                            },
                            justifyContent: expanded ? 'flex-start' : 'center',
                        }}
                    >
                        <Box sx={{ color: 'inherit', minWidth: 28, display: 'flex', justifyContent: 'center' }}>
                            <PersonIcon />
                        </Box>
                        {expanded && (
                            <Typography sx={{ ml: 2, fontSize: { xs: 14, sm: 16 }, color: 'inherit', fontWeight: 500 }}>
                                Profile
                            </Typography>
                        )}
                    </Box>
                </NavLink>

                {/* Logout */}
                <Box
                    onClick={handleLogout}
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        px: 1.5,
                        py: 1,
                        borderRadius: 2,
                        transition: 'background 0.2s',
                        cursor: 'pointer',
                        '&:hover': {
                            background: colors.gradients.cardHover,
                        },
                        justifyContent: expanded ? 'flex-start' : 'center',
                    }}
                >
                    <Box sx={{ color: colors.text.primary, minWidth: 28, display: 'flex', justifyContent: 'center' }}>
                        <LogoutIcon />
                    </Box>
                    {expanded && (
                        <Typography sx={{ ml: 2, fontSize: { xs: 14, sm: 16 }, color: colors.text.primary, fontWeight: 500 }}>
                            Logout
                        </Typography>
                    )}
                </Box>
            </Box>
        </Box>
    );
}

export default function Sidebar() {
    const [expanded, setExpanded] = useState(true);

    React.useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 640) {
                setExpanded(false);
            } else {
                setExpanded(true);
            }
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return <SideBarNavigation navigation={NAVIGATION} expanded={expanded} onToggle={() => setExpanded((prev) => !prev)} />;
}