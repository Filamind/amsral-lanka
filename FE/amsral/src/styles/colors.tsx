export const colors = {
    primary: {
        50: '#f0fafe',   // Very light blue
        100: '#e0f7fe',  // Light blue
        200: '#b3ebfd',  // Lighter blue
        300: '#81d4fa',  // Light blue
        400: '#4fc3f7',  // Medium light blue
        500: '#29b6f6',  // Main primary blue
        600: '#039be5',  // Darker blue
        700: '#0277bd',  // Dark blue
        800: '#01579b',  // Very dark blue
        900: '#01467d',  // Darkest blue
    },
    secondary: {
        50: '#fafafa',   // Almost white
        100: '#f5f5f5',  // Very light gray
        200: '#eeeeee',  // Light gray
        300: '#e0e0e0',  // Medium light gray
        400: '#bdbdbd',  // Medium gray
        500: '#9e9e9e',  // Main secondary gray
        600: '#757575',  // Darker gray
        700: '#616161',  // Dark gray
        800: '#424242',  // Very dark gray
        900: '#212121',  // Darkest gray
    },
    // Text colors
    text: {
        primary: '#1e293b',    // Dark slate for main text
        secondary: '#64748b',   // Medium slate for secondary text
        muted: '#94a3b8',      // Light slate for muted text
        white: '#ffffff',       // White text
        blue: '#0277bd',       // Blue text for links/accents
    },
    // Background colors
    background: {
        primary: '#ffffff',     // White background
        secondary: '#f8fafc',   // Very light blue-gray
        card: '#ffffff',        // Card background
        overlay: 'rgba(30, 41, 59, 0.8)', // Dark overlay
    },
    // Border colors
    border: {
        light: '#e2e8f0',      // Light border
        medium: '#cbd5e1',     // Medium border
        dark: '#94a3b8',       // Dark border
    },
    // Status colors (keeping good contrast)
    success: '#10b981',        // Green
    warning: '#f59e0b',        // Orange
    error: '#ef4444',          // Red
    info: '#29b6f6',           // Light blue (matches primary)

    // Button colors
    button: {
        primary: '#29b6f6',           // Main button color (matches primary.500)
        primaryHover: '#0277bd',      // Button hover color (matches primary.700)
        primaryActive: '#01579b',     // Button active/pressed color (matches primary.800)
        secondary: '#e0e0e0',         // Secondary button color (light gray)
        secondaryHover: '#bdbdbd',    // Secondary button hover
        secondaryActive: '#9e9e9e',   // Secondary button active
        disabled: '#cbd5e1',          // Disabled button color
        text: '#ffffff',              // Button text color
        textSecondary: '#1e293b',     // Secondary button text color
    },

    // Gradients
    gradients: {
        loginCard: 'linear-gradient(to bottom, #e0f7fe, #ffffff)',          // Very subtle blue to white
        primaryBlue: 'linear-gradient(to bottom, #29b6f6, #81d4fa)',       // Primary blue gradient
        secondaryBlue: 'linear-gradient(to bottom, #e0f7fe, #f0fafe)',     // Light blue gradient
        buttonPrimary: 'linear-gradient(to bottom, #29b6f6, #039be5)',     // Button gradient
        cardHover: 'linear-gradient(to bottom, #f0fafe, #e0f7fe)',         // Hover effect
    }
}

export default colors;