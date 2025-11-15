"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import api, { setAccessToken } from "../../../lib/axios";
import {
  Eye,
  EyeOff,
  LogIn,
  User,
  Lock,
  AlertCircle,
  Music2,
  Star,
  BookOpen,
  CheckCircle2,
} from "lucide-react";

// Configure axios defaults
api.defaults.withCredentials = true;
// Add request interceptor for debugging
api.interceptors.request.use((request) => {
  console.log("Starting Request:", {
    url: request.url,
    method: request.method,
    data: request.data,
    headers: request.headers,
  });
  return request;
});

// Add response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    console.log("Response:", response);
    return response;
  },
  (error) => {
    if (error.message !== "canceled") {
      console.error("Response Error:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
    }
    return Promise.reject(error);
  }
);
import { motion } from "framer-motion";

import Image from "next/image";
import Link from "next/link";

interface Feature {
  icon: React.ReactNode;
  text: string;
  color: string;
  description: string;
}

const MusicMastersFeatures: React.FC = () => {
  const [currentFeature, setCurrentFeature] = useState<number>(0);

  const features: Feature[] = [
    {
      icon: <Music2 size={24} />,
      text: "Expert Instructors",
      color: "from-purple-400 to-indigo-600",
      description: "Learn from professional musicians with years of experience",
    },
    {
      icon: <Star size={24} />,
      text: "Diverse Courses",
      color: "from-indigo-400 to-purple-600",
      description: "From piano to guitar, find the perfect instrument for you",
    },
    {
      icon: <BookOpen size={24} />,
      text: "Flexible Learning",
      color: "from-purple-400 to-pink-600",
      description: "Choose your preferred schedule and learning pace",
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white p-8 rounded-3xl shadow-2xl shadow-black/50 w-full h-full relative overflow-hidden z-20">
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-xl animate-pulse"></div>
      <div className="absolute bottom-10 left-10 w-20 h-20 bg-white/5 rounded-full blur-lg animate-bounce"></div>

      {/* Logo */}
      <div className="flex flex-col items-center mb-8 relative z-10">
        <Image
          src="/MadeULogo.png"
          alt="MusicMasters Logo"
          width={50}
          height={50}
          className="w-12 h-12 md:w-16 md:h-16 mb-3 "
          priority={true}
        />

        <div className="flex items-center mb-2">
          <Star size={20} className="text-yellow-300 mr-2 animate-pulse" />
          <h1 className="text-xl md:text-3xl lg:text-4xl font-black tracking-tight">
            <span className="text-[#1a1464]">MAD</span>
            <span className="bg-gradient-to-r from-[#f5a623] to-[#f7c948] text-transparent bg-clip-text">
              EU
            </span>
          </h1>
          <Star size={20} className="text-yellow-300 ml-2 animate-pulse" />
        </div>

        <p className="text-center mt-2 opacity-90 max-w-xs text-blue-100">
          Begin Your Musical Journey with Expert Instructors
        </p>
      </div>

      <div className="space-y-6 mb-8">
        {features.map((feature, index) => (
          <div
            key={feature.text}
            className={`flex items-center transition-all duration-500 ${
              index === currentFeature ? "scale-105 opacity-100" : "opacity-70"
            }`}
          >
            <div
              className={`w-12 h-12 bg-gradient-to-br ${
                feature.color
              } rounded-xl flex items-center justify-center mr-4 shadow-lg transition-transform duration-300 ${
                index === currentFeature ? "scale-110 shadow-xl" : ""
              }`}
            >
              {feature.icon}
            </div>
            <div className="flex-1">
              <span className="font-medium block">{feature.text}</span>
              <span className="text-sm opacity-75 text-blue-100">
                {feature.description}
              </span>
            </div>
            {index === currentFeature && (
              <CheckCircle2
                size={20}
                className="text-green-400 animate-pulse"
              />
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-center space-x-2 mb-6">
        {features.map((_, index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentFeature ? "bg-white w-6" : "bg-white/50"
            }`}
          />
        ))}
      </div>

      <div className="border-t border-white/20 pt-6 mt-6">
        <div className="flex items-center justify-center mb-3">
          <div className="w-3 h-3 bg-green-400 rounded-full mr-2 animate-pulse shadow-lg shadow-green-400/50"></div>
          <span className="text-sm font-medium">
            System Status: Operational
          </span>
        </div>

        <p className="text-center text-sm opacity-70">
          © {new Date().getFullYear()} MusicMasters. All rights reserved.
        </p>
      </div>
    </div>
  );
};

interface LoginProps {
  onLoginSuccess?: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {}, 800);
    return () => clearTimeout(timer);
  }, []);

  interface LoginResponse {
    success: boolean;
    message: string;
    access_token: string;
    refresh_token: string;
  }

  interface AxiosErrorResponse {
    response?: {
      data?: {
        msg?: string;
        message?: string;
        error?: string;
        success?: boolean;
      };
      status?: number;
      [key: string]: unknown;
    };
    request?: unknown;
    message?: string;
    [key: string]: unknown;
  }

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // === VALIDASI CLIENT ===
      // Validasi email
      if (!email.trim()) {
        setIsLoading(false);
        return setError("Email wajib diisi");
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setIsLoading(false);
        return setError("Format email tidak valid");
      }

      // Validasi password
      if (!password) {
        setIsLoading(false);
        return setError("Password wajib diisi");
      }
      if (password.length < 8) {
        setIsLoading(false);
        return setError("Password minimal 8 karakter");
      }

      const cleanEmail = email.trim().toLowerCase();

      // === KIRIM KE API ===
      const response = await api.post<LoginResponse>(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
        {
          email: cleanEmail,
          password,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          withCredentials: true,
        }
      );

      // === CEK RESPON ===
      if (!response.data.success || !response.data.access_token) {
        throw new Error(response.data.message || "Login gagal");
      }

      // === SIMPAN TOKEN KE MEMORY (otomatis oleh interceptor, tapi kita pastikan) ===
      setAccessToken(response.data.access_token);

      onLoginSuccess?.();

      
      router.push("/dashboard");
    } catch (error: unknown) {
      const err = error as AxiosErrorResponse;

      let errorMessage = "Terjadi kesalahan. Coba lagi.";

      if (err.response?.data) {
        const data = err.response.data;
        const errorMsg = data.error || data.msg || data.message;

        // Cek pesan error yang lebih spesifik
        if (err.response.status === 401) {
          if (!errorMsg?.toLowerCase().includes("password")) {
            // Jika email valid tapi password salah
            errorMessage =
              "Email atau kata sandi salah. Coba lagi atau Lupa sandi";
          } 
        } else {
          errorMessage =
            errorMsg || `Login gagal (kode: ${err.response.status})`;
        }
      } else if (err.request) {
        errorMessage = "Tidak dapat terhubung ke server";
      } else {
        errorMessage = err.message || "Kesalahan tidak diketahui";
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 p-4 relative overflow-hidden">
      <div className="absolute top-10 left-10 w-72 h-72 bg-purple-200/30 rounded-full filter blur-3xl animate-pulse"></div>
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-200/30  rounded-full filter blur-3xl animate-pulse"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-pink-200/20 to-indigo-200/20 rounded-full filter blur-3xl"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="md:bg-white/90  backdrop-blur-2xl rounded-3xl md:shadow-none md:border-none flex flex-col md:flex-row w-[95%] max-w-6xl overflow-visible relative z-10 gap-6 md:gap-0"
      >
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex-1 p-8 flex flex-col justify-center relative bg-white/90  md:bg-transparent rounded-3xl shadow-2xl shadow-black/50 border border-white/20 md:border-none backdrop-blur-2xl md:backdrop-blur-none z-20"
        >
          <div className="absolute top-6 right-6 w-4 h-4 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-bounce"></div>
          <div className="absolute top-20 right-12 w-2 h-2 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full animate-pulse"></div>

          <div className="flex justify-center mb-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="relative group"
            >
              <Link href="/">
                <Image
                  src="/MadeU.png"
                  alt="MusicMasters Logo"
                  width={50}
                  height={50}
                  className="w-12 h-12 md:w-16 md:h-16 "
                  priority={true}
                />
              </Link>
            </motion.div>
          </div>

          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="text-3xl md:text-4xl font-bold mb-3 text-center bg-gradient-to-r from-gray-800 via-purple-800 to-indigo-800 bg-clip-text text-transparent"
          >
            Welcome Back
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="text-center text-gray-600 text-lg mb-8"
          >
            Login to continue your musical journey
          </motion.p>

          <motion.form
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="space-y-6 relative z-10"
            onSubmit={handleLogin}
          >
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-sm font-medium text-gray-700 flex items-center"
              >
                <User size={16} className="mr-2 text-purple-600" />
                Email Address
              </label>
              <div className="relative group">
                <input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-4 pl-5 border-2 rounded-xl transition-all duration-300 bg-white/80 backdrop-blur-sm outline-none border-gray-300 hover:border-purple-300 dark:hover:border-purple-500 focus:border-purple-500 focus:shadow-lg focus:shadow-purple-500/25 dark:focus:border-purple-400"
                />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 opacity-0 transition-opacity duration-300 -z-10 blur focus-within:opacity-20"></div>
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm font-medium text-gray-700  flex items-center"
              >
                <Lock size={16} className="mr-2 text-purple-600" />
                Password
              </label>
              <div className="relative group">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-4 pl-5 pr-12 border-2 rounded-xl transition-all duration-300 bg-white/80 backdrop-blur-sm outline-none border-gray-300 hover:border-purple-300 dark:hover:border-purple-500 focus:border-purple-500 focus:shadow-lg focus:shadow-purple-500/25 dark:focus:border-purple-400"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400 transition-colors duration-200 hover:scale-110"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>

                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 opacity-0 transition-opacity duration-300 -z-10 blur focus-within:opacity-20"></div>
              </div>
              <div className="mt-2 mb-4 mx-2 font-semibold">
                <Link
                  href="/auth/forgot-password"
                  className="cursor-pointer text-blue-600 hover:text-blue-800 text-xs sm:text-sm transition-colors"
                >
                  Lupa Sandi?
                </Link>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl p-4 bg-rose-50/80 border border-rose-200/30 flex items-start"
              >
                <AlertCircle
                  size={19}
                  className="text-rose-500 mr-3 mt-0.5 flex-shrink-0 opacity-80"
                />
                <p className="text-rose-700 text-sm leading-relaxed font-medium">
                  {error}
                </p>
              </motion.div>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:via-indigo-700 hover:to-blue-700 text-white rounded-xl font-medium transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <LogIn size={20} className="mr-3" />
                  <span>Login</span>
                </>
              )}
            </motion.button>
            <div className="flex justify-center text-sm font-semibold">
              <span className="text-gray-600 mr-1">
                {" "}
                Don&#39;t have an account?
              </span>
              <Link
                href="/auth/register"
                className="cursor-pointer text-blue-600 hover:text-blue-800 text-sm transition-colors"
              >
                Register
              </Link>
            </div>
          </motion.form>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex-1 flex flex-col justify-center items-center rounded-3xl z-20"
        >
          <MusicMastersFeatures />
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Login;
