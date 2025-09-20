import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import printerService from '../services/printerService';
import toast from 'react-hot-toast';

interface PrinterContextType {
    isConnected: boolean;
    isConnecting: boolean;
    printStatus: string;
    setPrintStatus: (status: string) => void;
    connect: () => Promise<void>;
    disconnect: () => Promise<void>;
    quickReconnect: () => Promise<void>;
    retryConnection: () => Promise<void>;
    testPrint: () => Promise<void>;
}

const PrinterContext = createContext<PrinterContextType | undefined>(undefined);

export const usePrinter = () => {
    const context = useContext(PrinterContext);
    if (!context) {
        throw new Error('usePrinter must be used within a PrinterProvider');
    }
    return context;
};

interface PrinterProviderProps {
    children: ReactNode;
}

export const PrinterProvider: React.FC<PrinterProviderProps> = ({ children }) => {
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [printStatus, setPrintStatus] = useState('Ready to print');

    // Check printer status
    const checkPrinterStatus = () => {
        const connected = printerService.isConnected();
        setIsConnected(connected);
    };

    // Enhanced auto-reconnect with retry mechanism
    const autoReconnectWithRetry = async (maxRetries = 3, baseDelay = 1000) => {
        // Check if Web Serial API is supported
        if (!printerService.isSupported()) {
            console.log('❌ Web Serial API not supported');
            setPrintStatus('Web Serial API not supported. Please use Chrome or Edge browser.');
            toast.error('Web Serial API not supported. Please use Chrome or Edge browser.');
            return false;
        }

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`🔄 Auto-reconnect attempt ${attempt}/${maxRetries}`);
                setPrintStatus(`Auto-reconnecting to printer... (${attempt}/${maxRetries})`);

                // Add progressive delay between retries
                if (attempt > 1) {
                    const delay = baseDelay * Math.pow(2, attempt - 2); // Exponential backoff
                    console.log(`⏳ Waiting ${delay}ms before retry...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }

                const status = await printerService.quickReconnect();

                if (status.connected) {
                    console.log(`✅ Basic connection established on attempt ${attempt}`);

                    // Verify the connection actually works by testing communication
                    const isWorking = await printerService.verifyConnection();

                    if (isWorking) {
                        console.log(`✅ Auto-reconnect successful on attempt ${attempt}`);
                        setIsConnected(true);
                        setPrintStatus('Auto-reconnect successful!');
                        toast.success('Printer auto-reconnected!');
                        setTimeout(() => setPrintStatus('Ready to print'), 3000);
                        return true;
                    } else {
                        console.log(`❌ Connection established but communication failed on attempt ${attempt}`);
                        // Disconnect the non-working connection
                        try {
                            await printerService.disconnect();
                        } catch (e) {
                            console.log('Error disconnecting failed connection:', e);
                        }

                        if (attempt === maxRetries) {
                            setPrintStatus(`Auto-reconnect failed - printer not responding after ${maxRetries} attempts.`);
                            toast.error('Printer connected but not responding. Please check printer and try again.');
                        }
                    }
                } else {
                    console.log(`❌ Auto-reconnect attempt ${attempt} failed:`, status.error);
                    if (attempt === maxRetries) {
                        setPrintStatus(`Auto-reconnect failed after ${maxRetries} attempts. Click printer button to reconnect.`);
                        toast('Printer disconnected. Click the printer button to reconnect.', { icon: 'ℹ️' });
                    }
                }
            } catch (error) {
                console.error(`Auto-reconnect attempt ${attempt} error:`, error);
                if (attempt === maxRetries) {
                    setPrintStatus('Auto-reconnect failed. Click printer button to reconnect.');
                    toast('Printer disconnected. Click the printer button to reconnect.', { icon: 'ℹ️' });
                }
            }
        }
        return false;
    };

    // Auto-connect on mount if there's a persistent connection
    useEffect(() => {
        const autoConnect = async () => {
            console.log('🚀 Auto-connect process started');

            // Check if already connected
            if (printerService.isConnected()) {
                console.log('✅ Printer already connected');
                setIsConnected(true);
                return;
            }

            // Check for persistent connection
            const hasPersistent = printerService.hasPersistentConnection();
            console.log('🔍 Has persistent connection:', hasPersistent);

            if (hasPersistent) {
                console.log('🔄 Found persistent connection, attempting auto-reconnect...');
                setIsConnecting(true);
                setPrintStatus('Auto-reconnecting to printer...');

                const success = await autoReconnectWithRetry();

                if (success) {
                    console.log('✅ Auto-reconnect successful');
                    setIsConnected(true);
                } else {
                    console.log('❌ Auto-reconnect failed');
                    setIsConnected(false);
                }

                setIsConnecting(false);
            } else {
                console.log('ℹ️ No persistent connection found, trying to find existing ports...');

                // Even without persistent connection, try to find and connect to existing ports
                try {
                    const existingPorts = await printerService.getAvailablePorts();
                    if (existingPorts.length > 0) {
                        console.log(`🔍 Found ${existingPorts.length} existing ports, attempting connection...`);
                        setIsConnecting(true);
                        setPrintStatus('Connecting to existing printer...');

                        const success = await autoReconnectWithRetry(2, 500); // 2 retries with shorter delay

                        if (success) {
                            console.log('✅ Connection to existing port successful');
                            setIsConnected(true);
                        } else {
                            console.log('❌ Connection to existing port failed');
                            setIsConnected(false);
                        }

                        setIsConnecting(false);
                    } else {
                        console.log('ℹ️ No existing ports found');
                        setIsConnected(false);
                    }
                } catch (error) {
                    console.log('❌ Error checking existing ports:', error);
                    setIsConnected(false);
                }
            }
        };

        // Add a small delay to ensure the page is fully loaded
        console.log('⏰ Setting up auto-connect with 500ms delay');
        const timeoutId = setTimeout(autoConnect, 500);

        // Check status every 10 seconds (increased from 5 for better performance)
        const interval = setInterval(() => {
            checkPrinterStatus();
        }, 10000);

        return () => {
            clearTimeout(timeoutId);
            clearInterval(interval);
        };
    }, []);

    const connect = async () => {
        try {
            setIsConnecting(true);
            setPrintStatus('Connecting to printer...');

            const status = await printerService.clearCacheAndConnect();

            if (status.connected) {
                console.log('✅ Basic connection established, verifying communication...');
                setPrintStatus('Verifying printer communication...');

                // Verify the connection actually works
                const isWorking = await printerService.verifyConnection();

                if (isWorking) {
                    console.log('✅ Printer connection verified and working');
                    setIsConnected(true);
                    setPrintStatus('Printer connected successfully!');
                    toast.success('Printer connected!');
                    setTimeout(() => setPrintStatus('Ready to print'), 3000);
                } else {
                    console.log('❌ Printer connected but not responding');
                    setIsConnected(false);
                    setPrintStatus('Printer connected but not responding. Please check printer.');
                    toast.error('Printer connected but not responding. Please check printer and try again.');

                    // Disconnect the non-working connection
                    try {
                        await printerService.disconnect();
                    } catch (e) {
                        console.log('Error disconnecting failed connection:', e);
                    }
                }
            } else {
                setIsConnected(false);
                setPrintStatus(`Connection failed: ${status.error}`);
                toast.error(`Connection failed: ${status.error}`);
            }
        } catch (error) {
            console.error('Connection error:', error);
            setPrintStatus(`Connection error: ${error}`);
            toast.error(`Connection error: ${error}`);
            setIsConnected(false);
        } finally {
            setIsConnecting(false);
        }
    };

    const disconnect = async () => {
        try {
            await printerService.disconnect();
            setIsConnected(false);
            setPrintStatus('Printer disconnected');
            toast.success('Printer disconnected!');
            setTimeout(() => setPrintStatus('Ready to print'), 3000);
        } catch (error) {
            console.error('Disconnect error:', error);
            toast.error(`Disconnect failed: ${error}`);
        }
    };

    const quickReconnect = async () => {
        try {
            setIsConnecting(true);
            setPrintStatus('Quick reconnecting...');

            const status = await printerService.quickReconnect();
            setIsConnected(status.connected);

            if (status.connected) {
                setPrintStatus('Quick reconnect successful!');
                setTimeout(() => setPrintStatus('Ready to print'), 3000);
            } else {
                setPrintStatus(`Quick reconnect failed: ${status.error}`);
            }
        } catch (error) {
            console.error('Quick reconnect error:', error);
            setPrintStatus(`Quick reconnect error: ${error}`);
        } finally {
            setIsConnecting(false);
        }
    };

    // Manual retry function for user-initiated reconnection
    const retryConnection = async () => {
        console.log('🔄 Manual retry connection initiated');
        setIsConnecting(true);

        const success = await autoReconnectWithRetry(2, 500); // 2 retries with shorter delay

        if (!success) {
            // If auto-reconnect fails, fall back to manual connection
            setPrintStatus('Auto-reconnect failed. Please select printer manually.');
            toast('Please click the printer button to select your printer manually.', { icon: 'ℹ️' });
        }

        setIsConnecting(false);
    };

    // Test print function
    const testPrint = async () => {
        if (!isConnected) {
            toast.error('Printer not connected. Please connect first.');
            return;
        }

        try {
            setPrintStatus('Testing printer...');
            console.log('🖨️ Starting printer test...');

            const success = await printerService.testPrint();

            if (success) {
                setPrintStatus('Printer test successful!');
                toast.success('Printer test successful! Check your printer.');
                setTimeout(() => setPrintStatus('Ready to print'), 3000);
            } else {
                setPrintStatus('Printer test failed. Check printer connection.');
                toast.error('Printer test failed. Check printer connection.');
            }
        } catch (error) {
            console.error('Printer test error:', error);
            setPrintStatus(`Printer test error: ${error}`);
            toast.error(`Printer test error: ${error}`);
        }
    };

    const value: PrinterContextType = {
        isConnected,
        isConnecting,
        printStatus,
        setPrintStatus,
        connect,
        disconnect,
        quickReconnect,
        retryConnection,
        testPrint,
    };

    return (
        <PrinterContext.Provider value={value}>
            {children}
        </PrinterContext.Provider>
    );
};
