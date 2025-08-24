import loginBG from "../assets/Images/loginBG.png"
import colors from "../styles/colors"
import logo from "../assets/Images/AL1.png"
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useState } from "react";
import axios from "axios";


function LoginPage() {
    const [showPassword, setShowPassword] = useState(false);

    const LogIn = async (email: string, password: string) => {
        try {
            const response = await axios.post("http://localhost:3000/api/users/login", {
                email,
                password
            }, {
                headers: { 'Content-Type': 'application/json' }
            });

            const data = response.data;
            if (data.success) {
                localStorage.setItem('token', data.token);
            } else {
                alert(data.message);
            }
        } catch (err) {
            console.error(err);
            alert("Network error. Please try again.");
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword((prev) => !prev);
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const username = e.currentTarget.username.value;
        const password = e.currentTarget.password.value;
        LogIn(username, password);
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
                    {/* Login Form */}
                    <form className="w-full" onSubmit={handleSubmit}>
                        <div className="mb-3 sm:mb-4">
                            <label className="block mb-2 text-sm sm:text-base" htmlFor="username" style={{ color: colors.text.secondary }}>
                                Username
                            </label>
                            <input
                                type="text"
                                id="username"
                                className="w-full px-3 py-2 border rounded-xl focus:outline-none text-xs sm:text-sm md:text-base"
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
                                    className="w-full px-3 py-2 border rounded-xl focus:outline-none text-xs sm:text-sm md:text-base pr-10"
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
                            className="
                                w-full px-4 py-2 rounded-lg transition duration-200 cursor-pointer
                                text-sm sm:text-base md:text-lg font-semibold
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
                            Login
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default LoginPage;