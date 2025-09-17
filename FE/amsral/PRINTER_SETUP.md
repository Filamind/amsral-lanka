# Thermal Printer Setup Guide

This guide explains how to set up and test the MP80-04 thermal printer with the AMSRAL application.

## Prerequisites

- MP80-04 thermal printer (USB + Bluetooth interface)
- Chrome or Edge browser (Web Serial API support required)
- USB cable for connection

## Setup Instructions

### 1. Hardware Setup

1. Connect the printer to your computer using the USB cable
2. Power on the printer
3. Ensure the printer is in ESC/POS mode (check printer manual)

### 2. Browser Setup

1. Open Chrome or Edge browser
2. Navigate to the AMSRAL application
3. Go to the "Printer Test" tab in the sidebar

### 3. Printer Connection

1. Click "Check USB" to scan for available serial ports
2. Click "Connect" to establish connection with the printer
3. The status should show "Connected" when successful

### 4. Testing

1. **Print Test Page**: Click "Print Test Page" to print a simple test document
2. **Print Sample Receipt**: Click "Print Sample Receipt" to print a sample laundry receipt

## Troubleshooting

### Common Issues

**"Web Serial API not supported"**

- Use Chrome or Edge browser
- Ensure you're using a recent version

**"No serial ports found"**

- Check USB connection
- Try unplugging and reconnecting the printer
- Check if printer drivers are installed

**"Failed to connect to printer"**

- Ensure printer is powered on
- Check USB cable connection
- Try a different USB port
- Verify printer is in ESC/POS mode

**"Print error"**

- Check paper is loaded in the printer
- Ensure printer is not in error state
- Try reconnecting the printer

### Printer Settings

- **Baud Rate**: 9600 (default)
- **Data Bits**: 8
- **Stop Bits**: 1
- **Parity**: None
- **Flow Control**: None

## ESC/POS Commands Used

The printer service uses standard ESC/POS commands:

- `ESC @` - Initialize printer
- `ESC a` - Set text alignment
- `ESC !` - Set text formatting (bold, double height/width)
- `GS V` - Cut paper
- Standard text and line feed commands

## Features

- **USB Connection**: Direct USB serial communication
- **Receipt Printing**: Full receipt with company info, order details, items, and totals
- **Test Page**: Simple test document to verify printer functionality
- **Error Handling**: Comprehensive error messages and status updates
- **Formatting**: Text alignment, bold text, and proper spacing

## Future Enhancements

- Bluetooth printing support
- Custom receipt templates
- Print preview functionality
- Multiple printer support
- Print queue management

## Support

For technical support or issues with the printer integration, please contact the development team.
