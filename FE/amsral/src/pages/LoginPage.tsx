import loginBG from "../assets/Images/loginBG.png"
import colors from "../styles/colors"
import logo from "../assets/Images/AL1.png"
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from 'react-hot-toast';
import { useAuth } from "../hooks/useAuth";


function LoginPage() {
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const { login, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/dashboard');
        }
    }, [isAuthenticated, navigate]);

    // Debug info on page load
    useEffect(() => {
        const debugAttempt = localStorage.getItem('debug_login_attempt');
        const debugError = localStorage.getItem('debug_login_error');
        const debugMessage = localStorage.getItem('debug_error_message');
        const debugFinally = localStorage.getItem('debug_login_finally');

        if (debugAttempt || debugError || debugMessage || debugFinally) {
            console.log('=== DEBUG INFO FROM PREVIOUS SESSION ===');
            if (debugAttempt) console.log('Login attempt:', JSON.parse(debugAttempt));
            if (debugError) console.log('Login error:', JSON.parse(debugError));
            if (debugMessage) console.log('Error message:', debugMessage);
            if (debugFinally) console.log('Finally executed at:', debugFinally);
            console.log('=== END DEBUG INFO ===');

            // Clear debug info
            localStorage.removeItem('debug_login_attempt');
            localStorage.removeItem('debug_login_error');
            localStorage.removeItem('debug_error_message');
            localStorage.removeItem('debug_login_finally');
        }

        // Add global unhandled rejection handler to prevent page reload
        const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
            console.error('Unhandled promise rejection:', event.reason);
            event.preventDefault(); // Prevent default browser behavior (like page reload)
            localStorage.setItem('debug_unhandled_rejection', JSON.stringify({
                timestamp: new Date().toISOString(),
                reason: event.reason?.toString() || 'Unknown error'
            }));
        };

        window.addEventListener('unhandledrejection', handleUnhandledRejection);

        // Cleanup
        return () => {
            window.removeEventListener('unhandledrejection', handleUnhandledRejection);
        };
    }, []);

    const handleLogin = async (email: string, password: string) => {
        let loginPromise: Promise<void> | null = null;

        try {
            setLoading(true);
            setErrorMessage(''); // Clear any previous error
            console.log('Starting login with:', email); // Debug log
            localStorage.setItem('debug_login_attempt', JSON.stringify({
                timestamp: new Date().toISOString(),
                email,
                step: 'starting'
            }));

            // Wrap the login call to ensure we can catch any issues
            loginPromise = login(email, password);
            await loginPromise;

            console.log('Login successful'); // Debug log
            localStorage.setItem('debug_login_result', 'success');
            toast.success('Login successful! Welcome back.');
            // Navigation will happen automatically via useEffect when isAuthenticated becomes true
        } catch (err: unknown) {
            console.error('Login error caught in LoginPage:', err); // Enhanced debug log
            localStorage.setItem('debug_login_error', JSON.stringify({
                timestamp: new Date().toISOString(),
                error: err,
                step: 'error_caught'
            }));

            let displayMessage = '';
            if (err && typeof err === 'object' && 'response' in err) {
                const axiosError = err as { response?: { data?: { message?: string } } };
                displayMessage = axiosError.response?.data?.message || 'Login failed. Please try again.';
            } else if (err && typeof err === 'object' && 'message' in err) {
                displayMessage = (err as { message: string }).message || 'Login failed. Please try again.';
            } else {
                displayMessage = 'Network error. Please try again.';
            }

            console.log('Displaying error message:', displayMessage); // Debug log
            localStorage.setItem('debug_error_message', displayMessage);
            setErrorMessage(displayMessage); // Set error state

            // Use setTimeout to ensure the error message is set before showing toast
            setTimeout(() => {
                toast.error(displayMessage);
                console.log('Toast error called with message:', displayMessage);
            }, 10);

        } finally {
            console.log('Login attempt finished, setting loading to false'); // Debug log
            localStorage.setItem('debug_login_finally', new Date().toISOString());
            setLoading(false);
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword((prev) => !prev);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        // Immediately prevent default to stop any form submission
        e.preventDefault();
        e.stopPropagation();

        try {
            console.log('Form submitted, preventDefault called'); // Debug log

            const formData = new FormData(e.currentTarget);
            const email = formData.get('username') as string;
            const password = formData.get('password') as string;

            console.log('Form data extracted:', { email, password: password ? '***' : 'empty' }); // Debug log

            // Prevent the form from submitting if already loading
            if (loading) {
                console.log('Already loading, preventing duplicate submission'); // Debug log
                return;
            }

            // Call handleLogin and ensure any error is caught
            await handleLogin(email, password).catch((error) => {
                console.error('Uncaught error in handleLogin:', error);
                // Don't re-throw, just log
            });

        } catch (error) {
            console.error('Error in handleSubmit outer catch:', error);
            // Absolutely do not re-throw or let this propagate
            setErrorMessage('An unexpected error occurred. Please try again.');
            setLoading(false);
        }

        // Return false to ensure form doesn't submit
        return false;
    };

    return (
        <div
            className="flex w-full h-screen items-center justify-center bg-cover bg-center px-2 sm:px-0"
            style={{ backgroundImage: `url(${loginBG})` }}
        >
            <div
                className="
                    w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-xl
                    h-auto min-h-[60%] rounded-xl shadow-lg flex items-center justify-center
                    bg-opacity-90
                    p-3 sm:p-6 md:p-8
                "
                style={{ background: colors.gradients.loginCard }}
            >
                <div className="flex flex-col items-center justify-center w-full h-full">
                    <img src={logo} alt='Logo' width={80} height={80} className="mb-3 sm:mb-4" />
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4 text-center" style={{ color: colors.text.primary }}>
                        Login to AMSRAL
                    </h1>

                    {/* Error Message Display */}
                    {errorMessage && (
                        <div className="w-full mb-3 sm:mb-4 p-3 rounded-lg bg-red-100 border border-red-300">
                            <p className="text-red-700 text-sm text-center">{errorMessage}</p>
                        </div>
                    )}

                    {/* Login Form */}
                    <form
                        className="w-full"
                        onSubmit={handleSubmit}
                        noValidate
                        onInvalid={(e) => e.preventDefault()}
                        action="javascript:void(0)"
                    >
                        <div className="mb-3 sm:mb-4">
                            <label className="block mb-2 text-sm sm:text-base" htmlFor="username" style={{ color: colors.text.secondary }}>
                                Email
                            </label>
                            <input
                                type="email"
                                id="username"
                                name="username"
                                required
                                disabled={loading}
                                className="w-full px-3 py-2 border rounded-xl focus:outline-none text-xs sm:text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{
                                    borderColor: colors.border.light
                                }}
                                onFocus={(e) => {
                                    e.currentTarget.style.boxShadow = `0 0 0 2px ${colors.primary[500]}`;
                                    e.currentTarget.style.borderColor = colors.primary[500];
                                }}
                                onBlur={(e) => {
                                    e.currentTarget.style.boxShadow = 'none';
                                    e.currentTarget.style.borderColor = colors.border.light;
                                }}
                                placeholder="Enter your email"
                                autoComplete="username"
                            />
                        </div>
                        <div className="mb-3 sm:mb-4">
                            <label className="block mb-2 text-sm sm:text-base" htmlFor="password" style={{ color: colors.text.secondary }}>
                                Password
                            </label>
                            <div className="flex flex-row relative">
                                <input
                                    id="password"
                                    name="password"
                                    required
                                    disabled={loading}
                                    className="w-full px-3 py-2 border rounded-xl focus:outline-none text-xs sm:text-sm md:text-base pr-10 disabled:opacity-50 disabled:cursor-not-allowed"
                                    style={{
                                        borderColor: colors.border.light
                                    }}
                                    onFocus={(e) => {
                                        e.currentTarget.style.boxShadow = `0 0 0 2px ${colors.primary[500]}`;
                                        e.currentTarget.style.borderColor = colors.primary[500];
                                    }}
                                    onBlur={(e) => {
                                        e.currentTarget.style.boxShadow = 'none';
                                        e.currentTarget.style.borderColor = colors.border.light;
                                    }}
                                    placeholder="Enter your password"
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 cursor-pointer p-1"
                                    onClick={togglePasswordVisibility}
                                    tabIndex={-1}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                                </button>
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="
                                w-full px-4 py-2 rounded-lg transition duration-200 cursor-pointer
                                text-sm sm:text-base md:text-lg font-semibold
                                disabled:opacity-50 disabled:cursor-not-allowed
                            "
                            style={{
                                backgroundColor: colors.button.primary,
                                color: colors.button.text
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = colors.button.primaryHover;
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = colors.button.primary;
                            }}
                        >
                            {loading ? 'Logging in...' : 'Login'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default LoginPage;