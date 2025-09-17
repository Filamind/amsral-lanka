import React, { useState } from 'react';
import {
    Box,
    Typography,
    Card,
    Stack,
    Chip,
    Alert,
    Button
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import UsbIcon from '@mui/icons-material/Usb';
import RefreshIcon from '@mui/icons-material/Refresh';
import colors from '../styles/colors';
import PrimaryButton from '../components/common/PrimaryButton';
import printerService, { type ReceiptData } from '../services/printerService';

const PrinterTestPage: React.FC = () => {
    const [isPrinting, setIsPrinting] = useState(false);
    const [printStatus, setPrintStatus] = useState<string>('');
    const [printerConnected, setPrinterConnected] = useState<boolean>(false);
    const [autoConnectAttempted, setAutoConnectAttempted] = useState<boolean>(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [hasPreviousConnection, setHasPreviousConnection] = useState(false);

    // Sample receipt data
    const sampleReceipt: ReceiptData = {
        companyName: 'AMSRAL Laundry Service',
        address: '123 Main Street, City, State 12345',
        phone: 'Phone: (555) 123-4567',
        orderNumber: 'ORD-001',
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        customerName: 'John Doe',
        customerPhone: '(555) 987-6543',
        items: [
            { name: 'Shirt - Regular Wash', quantity: 2, price: 5.00 },
            { name: 'Pants - Dry Clean', quantity: 1, price: 8.00 },
            { name: 'Jacket - Express', quantity: 1, price: 12.00 }
        ],
        subtotal: 30.00,
        tax: 2.40,
        total: 32.40
    };


    const connectToPrinter = async () => {
        if (printerConnected) {
            // Disconnect
            try {
                await printerService.disconnect();
                setPrinterConnected(false);
                setPrintStatus('Printer disconnected successfully.');
            } catch (error) {
                setPrintStatus(`Disconnect failed: ${error}`);
            }
        } else {
            // Connect - force new port selection
            setIsConnecting(true);
            setPrintStatus('Opening printer selection dialog...');
            try {
                // Force reset to clear any cached ports
                await printerService.forceReset();

                // Use clearCacheAndConnect to force port selection dialog
                const status = await printerService.clearCacheAndConnect();
                setPrinterConnected(status.connected);
                if (status.connected) {
                    setPrintStatus('Printer connected successfully!');
                } else {
                    setPrintStatus(`Connection failed: ${status.error}`);
                }
            } catch (error) {
                setPrintStatus(`Connection error: ${error}`);
            } finally {
                setIsConnecting(false);
            }
        }
    };

    const printSampleReceipt = async () => {
        if (!printerConnected) {
            setPrintStatus('Please connect to printer first.');
            return;
        }

        setIsPrinting(true);
        setPrintStatus('Printing sample receipt...');

        try {
            await printerService.printReceipt(sampleReceipt);
            setPrintStatus('Sample receipt printed successfully!');
        } catch (error) {
            setPrintStatus(`Print failed: ${error}`);
        } finally {
            setIsPrinting(false);
        }
    };

    const printTestPage = async () => {
        if (!printerConnected) {
            setPrintStatus('Please connect to printer first.');
            return;
        }

        setIsPrinting(true);
        setPrintStatus('Printing test page...');

        try {
            await printerService.printTestPage();
            setPrintStatus('Test page printed successfully!');
        } catch (error) {
            setPrintStatus(`Print failed: ${error}`);
        } finally {
            setIsPrinting(false);
        }
    };

    const sendSimpleTest = async () => {
        if (!printerConnected) {
            setPrintStatus('Please connect to printer first.');
            return;
        }

        setIsPrinting(true);
        setPrintStatus('Sending simple test...');

        try {
            await printerService.sendSimpleTest();
            setPrintStatus('Simple test sent successfully!');
        } catch (error) {
            setPrintStatus(`Test failed: ${error}`);
        } finally {
            setIsPrinting(false);
        }
    };

    const forceReconnect = async () => {
        setPrintStatus('Force reconnecting...');
        try {
            await printerService.forceReset();
            const status = await printerService.connect();
            setPrinterConnected(status.connected);
            if (status.connected) {
                setPrintStatus('Force reconnect successful!');
            } else {
                setPrintStatus(`Force reconnect failed: ${status.error}`);
            }
        } catch (error) {
            setPrintStatus(`Force reconnect error: ${error}`);
        }
    };

    // Auto-connect on page load
    React.useEffect(() => {
        const autoConnect = async () => {
            if (autoConnectAttempted) return;

            setAutoConnectAttempted(true);

            // Check if already connected first
            const currentStatus = printerService.getConnectionStatus();
            if (currentStatus.connected) {
                setPrinterConnected(true);
                setPrintStatus('Printer already connected!');
                return;
            }

            // Check for persistent connection
            if (printerService.hasPersistentConnection()) {
                const persistentInfo = printerService.getPersistentConnectionInfo();
                setHasPreviousConnection(true);
                setPrintStatus(`Found previous connection to ${persistentInfo?.portName}. Attempting quick reconnect...`);

                // Try to auto-reconnect
                try {
                    const status = await printerService.quickReconnect();
                    setPrinterConnected(status.connected);
                    if (status.connected) {
                        setPrintStatus('Auto-reconnect successful! Ready to print.');
                    } else {
                        setPrintStatus(`Auto-reconnect failed: ${status.error}. Click "Quick Reconnect" to try again.`);
                    }
                } catch (error) {
                    setPrintStatus(`Auto-reconnect error: ${error}. Click "Quick Reconnect" to try again.`);
                }
            } else {
                setHasPreviousConnection(false);
                setPrintStatus('No previous printer connection found. Click "Connect Printer" to select a printer.');
            }
        };

        autoConnect();
    }, [autoConnectAttempted]);

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" sx={{ mb: 3, color: colors.primary[700], fontWeight: 700 }}>
                Printer
            </Typography>

            {/* Main Printer Card */}
            <Card sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
                <Typography variant="h6" sx={{ mb: 3, color: colors.primary[600], textAlign: 'center' }}>
                    MP80-04 Thermal Printer
                </Typography>

                {/* Status Display */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 3 }}>
                    <Chip
                        label={printerConnected ? 'Connected' : 'Disconnected'}
                        color={printerConnected ? 'success' : 'error'}
                        size="medium"
                    />
                    {autoConnectAttempted && !printerConnected && (
                        <Chip
                            label="Auto-connect failed"
                            color="warning"
                            size="small"
                            variant="outlined"
                        />
                    )}
                </Box>

                {/* Status Message */}
                {printStatus && (
                    <Alert severity={printerConnected ? 'success' : 'warning'} sx={{ mb: 3 }}>
                        {printStatus}
                    </Alert>
                )}

                {/* Main Action Buttons */}
                <Stack spacing={2}>
                    {!printerConnected ? (
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <PrimaryButton
                                onClick={connectToPrinter}
                                disabled={isPrinting || isConnecting}
                                startIcon={<UsbIcon />}
                                fullWidth
                            >
                                {isConnecting ? 'Selecting Printer...' : 'Connect Printer'}
                            </PrimaryButton>
                            {hasPreviousConnection && (
                                <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column' }}>
                                    <PrimaryButton
                                        onClick={async () => {
                                            setIsConnecting(true);
                                            setPrintStatus('Quick reconnecting to previous printer...');
                                            try {
                                                const status = await printerService.quickReconnect();
                                                setPrinterConnected(status.connected);
                                                if (status.connected) {
                                                    setPrintStatus('Quick reconnect successful! Ready to print.');
                                                } else {
                                                    setPrintStatus(`Quick reconnect failed: ${status.error}`);
                                                }
                                            } catch (error) {
                                                setPrintStatus(`Quick reconnect failed: ${error}`);
                                            } finally {
                                                setIsConnecting(false);
                                            }
                                        }}
                                        disabled={isPrinting || isConnecting}
                                        startIcon={<RefreshIcon />}
                                        fullWidth
                                    >
                                        {isConnecting ? 'Reconnecting...' : 'Quick Reconnect'}
                                    </PrimaryButton>
                                </Box>
                            )}
                        </Box>
                    ) : (
                        <Box sx={{ display: 'flex', gap: 2, flexDirection: 'column' }}>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <PrimaryButton
                                    onClick={printSampleReceipt}
                                    disabled={isPrinting}
                                    startIcon={<PrintIcon />}
                                    fullWidth
                                >
                                    {isPrinting ? 'Printing...' : 'Print Receipt'}
                                </PrimaryButton>
                                <Button
                                    onClick={connectToPrinter}
                                    disabled={isPrinting}
                                    startIcon={<UsbIcon />}
                                    variant="outlined"
                                    size="large"
                                    fullWidth
                                >
                                    Disconnect
                                </Button>
                            </Box>
                            <Button
                                onClick={async () => {
                                    setIsPrinting(true);
                                    setPrintStatus('Testing printer communication...');
                                    try {
                                        await printerService.sendSimpleTest();
                                        setPrintStatus('Printer test completed! Check if anything printed.');
                                    } catch (error) {
                                        setPrintStatus(`Printer test failed: ${error}`);
                                    } finally {
                                        setIsPrinting(false);
                                    }
                                }}
                                disabled={isPrinting}
                                startIcon={<RefreshIcon />}
                                variant="outlined"
                                size="small"
                                fullWidth
                            >
                                {isPrinting ? 'Testing...' : 'Simple Test'}
                            </Button>
                        </Box>
                    )}

                    {/* Advanced Options (Collapsible) */}
                    {printerConnected && (
                        <Box sx={{ mt: 2 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                Advanced Options:
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                <Button
                                    onClick={printTestPage}
                                    disabled={isPrinting}
                                    startIcon={<PrintIcon />}
                                    variant="outlined"
                                    size="small"
                                >
                                    Test Page
                                </Button>
                                <Button
                                    onClick={sendSimpleTest}
                                    disabled={isPrinting}
                                    startIcon={<PrintIcon />}
                                    variant="outlined"
                                    size="small"
                                >
                                    Simple Test
                                </Button>
                                <Button
                                    onClick={async () => {
                                        if (!printerConnected) {
                                            setPrintStatus('Please connect to printer first.');
                                            return;
                                        }
                                        setIsPrinting(true);
                                        setPrintStatus('Testing different baud rates...');
                                        try {
                                            await printerService.tryDifferentBaudRates();
                                            setPrintStatus('Baud rate test completed! Check if anything printed.');
                                        } catch (error) {
                                            setPrintStatus(`Baud rate test failed: ${error}`);
                                        } finally {
                                            setIsPrinting(false);
                                        }
                                    }}
                                    disabled={isPrinting}
                                    startIcon={<PrintIcon />}
                                    variant="outlined"
                                    size="small"
                                >
                                    Test Baud Rates
                                </Button>
                                <Button
                                    onClick={async () => {
                                        if (!printerConnected) {
                                            setPrintStatus('Please connect to printer first.');
                                            return;
                                        }
                                        setIsPrinting(true);
                                        setPrintStatus('Testing different protocols...');
                                        try {
                                            await printerService.tryDifferentProtocols();
                                            setPrintStatus('Protocol test completed! Check if anything printed.');
                                        } catch (error) {
                                            setPrintStatus(`Protocol test failed: ${error}`);
                                        } finally {
                                            setIsPrinting(false);
                                        }
                                    }}
                                    disabled={isPrinting}
                                    startIcon={<PrintIcon />}
                                    variant="outlined"
                                    size="small"
                                >
                                    Test Protocols
                                </Button>
                                <Button
                                    onClick={async () => {
                                        if (!printerConnected) {
                                            setPrintStatus('Please connect to printer first.');
                                            return;
                                        }
                                        setIsPrinting(true);
                                        setPrintStatus('Testing MP80-04 specific settings...');
                                        try {
                                            await printerService.testMP8004();
                                            setPrintStatus('MP80-04 test completed! Check if anything printed.');
                                        } catch (error) {
                                            setPrintStatus(`MP80-04 test failed: ${error}`);
                                        } finally {
                                            setIsPrinting(false);
                                        }
                                    }}
                                    disabled={isPrinting}
                                    startIcon={<PrintIcon />}
                                    variant="outlined"
                                    size="small"
                                    color="secondary"
                                >
                                    Test MP80-04
                                </Button>
                                <Button
                                    onClick={forceReconnect}
                                    disabled={isPrinting}
                                    startIcon={<RefreshIcon />}
                                    variant="outlined"
                                    size="small"
                                    color="warning"
                                >
                                    Reconnect
                                </Button>
                                <Button
                                    onClick={() => {
                                        console.log('🔍 Debug: Checking localStorage...');
                                        const stored = localStorage.getItem('printer_connection_state');
                                        console.log('📦 Stored state:', stored);
                                        if (stored) {
                                            const parsed = JSON.parse(stored);
                                            console.log('📊 Parsed state:', parsed);
                                            console.log('🔍 Port info:', parsed.portInfo);
                                            setPrintStatus(`Debug: Found state - Connected: ${parsed.connected}, Vendor: ${parsed.portInfo?.portVendorId}, Product: ${parsed.portInfo?.portProductId}`);
                                        } else {
                                            setPrintStatus('Debug: No state found in localStorage');
                                        }
                                    }}
                                    variant="outlined"
                                    size="small"
                                    color="info"
                                >
                                    Debug State
                                </Button>
                                <Button
                                    onClick={() => {
                                        localStorage.removeItem('printer_connection_state');
                                        setPrintStatus('Debug: Cleared localStorage state');
                                        console.log('🗑️ Debug: Cleared localStorage state');
                                    }}
                                    variant="outlined"
                                    size="small"
                                    color="error"
                                >
                                    Clear State
                                </Button>
                                <Button
                                    onClick={async () => {
                                        setPrintStatus('Debug: Clearing all ports...');
                                        try {
                                            await printerService.clearAllPorts();
                                            setPrintStatus('Debug: All ports cleared. Try connecting again.');
                                        } catch (error) {
                                            setPrintStatus(`Debug: Error clearing ports: ${error}`);
                                        }
                                    }}
                                    variant="outlined"
                                    size="small"
                                    color="warning"
                                >
                                    Clear Ports
                                </Button>
                            </Box>
                        </Box>
                    )}
                </Stack>
            </Card>

            {/* Quick Help */}
            <Card sx={{ p: 2, mt: 3, maxWidth: 600, mx: 'auto' }}>
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                    <strong>Need help?</strong> Make sure the printer is connected via USB and powered on.
                    Use Chrome or Edge browser for best compatibility.
                    <br />
                    <strong>Note:</strong> Printer connections don't persist across page reloads due to browser security.
                    Use "Quick Reconnect" if you see it, or "Connect Printer" to select manually.
                </Typography>
            </Card>
        </Box>
    );
};

export default PrinterTestPage;