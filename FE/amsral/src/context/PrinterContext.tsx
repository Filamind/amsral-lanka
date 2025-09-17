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

    // Auto-connect on mount if there's a persistent connection
    useEffect(() => {
        const autoConnect = async () => {
            // Check if already connected
            if (printerService.isConnected()) {
                setIsConnected(true);
                return;
            }

            // Check for persistent connection
            if (printerService.hasPersistentConnection()) {
                try {
                    setIsConnecting(true);
                    setPrintStatus('Auto-reconnecting to printer...');

                    const status = await printerService.quickReconnect();
                    setIsConnected(status.connected);

                    if (status.connected) {
                        setPrintStatus('Auto-reconnect successful!');
                        // Clear status after 3 seconds
                        setTimeout(() => setPrintStatus('Ready to print'), 3000);
                    } else {
                        setPrintStatus('Auto-reconnect failed. Click "Connect Printer" to try again.');
                    }
                } catch (error) {
                    console.error('Auto-reconnect error:', error);
                    setPrintStatus('Auto-reconnect failed. Click "Connect Printer" to try again.');
                } finally {
                    setIsConnecting(false);
                }
            }
        };

        autoConnect();

        // Check status every 5 seconds
        const interval = setInterval(checkPrinterStatus, 5000);

        return () => clearInterval(interval);
    }, []);

    const connect = async () => {
        try {
            setIsConnecting(true);
            setPrintStatus('Connecting to printer...');

            const status = await printerService.clearCacheAndConnect();
            setIsConnected(status.connected);

            if (status.connected) {
                setPrintStatus('Printer connected successfully!');
                toast.success('Printer connected!');
                setTimeout(() => setPrintStatus('Ready to print'), 3000);
            } else {
                setPrintStatus(`Connection failed: ${status.error}`);
                toast.error(`Connection failed: ${status.error}`);
            }
        } catch (error) {
            console.error('Connection error:', error);
            setPrintStatus(`Connection error: ${error}`);
            toast.error(`Connection error: ${error}`);
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

    const value: PrinterContextType = {
        isConnected,
        isConnecting,
        printStatus,
        setPrintStatus,
        connect,
        disconnect,
        quickReconnect,
    };

    return (
        <PrinterContext.Provider value={value}>
            {children}
        </PrinterContext.Provider>
    );
};
