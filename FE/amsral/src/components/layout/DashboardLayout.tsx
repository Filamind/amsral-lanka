import { Outlet } from 'react-router-dom';
import Box from '@mui/material/Box';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Sidebar from './SideBar';

const demoTheme = createTheme({
    palette: { mode: 'light' },
    breakpoints: {
        values: { xs: 0, sm: 600, md: 900, lg: 1200, xl: 1536 },
    },
});

function DashboardLayout() {
    return (
        <ThemeProvider theme={demoTheme}>
            <Box sx={{ display: 'flex', height: '100vh' }}>
                <Sidebar />
                <Box sx={{ flex: 1, p: 2, overflow: 'auto' }}>
                    <Outlet /> {/* Renders DashboardPage, OrdersPage, etc. */}
                </Box>
            </Box>
        </ThemeProvider>
    );
}

export default DashboardLayout;