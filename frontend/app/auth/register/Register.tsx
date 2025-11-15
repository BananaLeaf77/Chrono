"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  UserPlus,
  User,
  Lock,
  AlertCircle,
  Mail,
  Phone,
} from "lucide-react";
import { motion } from "framer-motion";
import axios from "axios";
import Image from "next/image";
import Link from "next/link";

interface RegisterProps {
  onRegisterSuccess?: () => void;
}

const Register: React.FC<RegisterProps> = ({ onRegisterSuccess }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    telephone: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState<boolean>(false);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    // Validate password
    if (formData.password !== formData.confirmPassword) {
      setError("Kata Sandi Tidak Cocok");
      return;
    }

    // Validate telephone number
    const phoneRegex = /^\d{10,13}$/;
    if (!phoneRegex.test(formData.telephone)) {
      setError("Nomor telepon tidak valid. Harap masukkan 10-13 digit angka");
      return;
    }

    setIsLoading(true);

    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/register`,
        {
          name: formData.name,
          email: formData.email,
          phone: formData.telephone,
          password: formData.password,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (onRegisterSuccess) {
        onRegisterSuccess();
      }

      // Set email in a secure, http-only cookie
      document.cookie = `userEmail=${formData.email}; path=/; max-age=3600; SameSite=Strict`;

      router.push("/auth/otp");
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        if (error.response) {
          // Response error dari server
          const serverError = error.response.data?.error;
          if (typeof serverError === "string") {
            if (serverError.includes("email already exists")) {
              setError(
                "Email ini sudah terdaftar."
              );
            } else if (serverError.includes("telephone already exists")) {
              setError(
                "Nomor telepon ini sudah terdaftar."
              );
            } else {
              setError(serverError || "Pendaftaran gagal. Silakan coba lagi.");
            }
          } else {
            setError("Pendaftaran gagal. Silakan coba lagi.");
          }
        } else if (error.request) {
          // Request dibuat tapi tidak ada response (timeout, network error)
          setError("Server tidak merespon. Periksa koneksi internet Anda.");
        } else {
          // Error dalam membuat request
          setError("Gagal menghubungi server. Silakan coba lagi.");
        }
      } else if (error instanceof Error) {
        setError(`Error: ${error.message}`);
      } else {
        setError("Terjadi kesalahan yang tidak diketahui. Silakan coba lagi.");
      }
      console.error("Registration error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 p-4 relative overflow-hidden">
      <div className="absolute top-10 left-10 w-64 h-64 bg-purple-200/30 rounded-full filter blur-3xl animate-pulse"></div>
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-blue-200/30 rounded-full filter blur-3xl animate-pulse"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl flex flex-col w-full max-w-md overflow-visible relative z-10"
      >
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="p-6"
        >
          <div className="flex justify-center mb-2">
            <div className="absolute top-6 right-6 w-4 h-4 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-bounce"></div>
            <div className="absolute top-20 right-12 w-2 h-2 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full animate-pulse"></div>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="relative group"
            >
              <div className="flex flex-col items-center relative z-10">
                <Link href="/">
                  <Image
                    src="/MadeU.png"
                    alt="MusicMasters Logo"
                    width={50}
                    height={50}
                    className="w-10 h-10 md:w-12 md:h-12 mb-2 "
                    priority={true}
                  />
                </Link>
                <div className="flex items-center">
                  <h1 className="text-sm md:text-lg lg:text-xl font-black tracking-tight">
                    <span className="text-[#1a1464]">MAD</span>
                    <span className="bg-gradient-to-r from-[#f5a623] to-[#f7c948] text-transparent bg-clip-text">
                      EU
                    </span>
                  </h1>
                </div>
              </div>
            </motion.div>
          </div>

          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="text-xl md:text-2xl font-bold mb-3 text-center bg-gradient-to-r from-gray-800 via-purple-800 to-indigo-800 bg-clip-text text-transparent"
          >
            Buat Akun
            <p className="text-gray-500 text-sm mt-2 font-normal">
              Bergabung dengan MadeU dan mulai perjalanan musikmu ✨
            </p>
          </motion.h2>

          <motion.form
            onSubmit={handleSubmit}
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.08 } },
            }}
            className="space-y-5"
          >
            {[
              { name: "name", label: "Nama", icon: <User size={18} /> },
              { name: "email", label: "Email", icon: <Mail size={18} /> },
              {
                name: "telephone",
                label: "Phone Number",
                icon: <Phone size={18} />,
              },
            ].map((field) => (
              <motion.div
                key={field.name}
                variants={{
                  hidden: { opacity: 0, y: 10 },
                  visible: { opacity: 1, y: 0 },
                }}
              >
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-600">
                    {field.icon}
                  </span>
                  <input
                    type={
                      field.name === "email"
                        ? "email"
                        : field.name === "telephone"
                        ? "tel"
                        : "text"
                    }
                    name={field.name}
                    placeholder={field.label}
                    value={formData[field.name as keyof typeof formData]}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-3 py-3 rounded-xl border border-gray-200 bg-white/60 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-500 outline-none text-sm placeholder-gray-400 transition-all duration-300"
                  />
                </div>
              </motion.div>
            ))}

            {/* Password Fields */}
            {[
              {
                id: "password",
                label: "Password",
                state: showPassword,
                setState: setShowPassword,
              },
              {
                id: "confirmPassword",
                label: "Confirm Password",
                state: showConfirmPassword,
                setState: setShowConfirmPassword,
              },
            ].map((pwd) => (
              <motion.div
                key={pwd.id}
                variants={{
                  hidden: { opacity: 0, y: 10 },
                  visible: { opacity: 1, y: 0 },
                }}
              >
                <div className="relative">
                  <Lock
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-600"
                  />
                  <input
                    type={pwd.state ? "text" : "password"}
                    name={pwd.id}
                    placeholder={pwd.label}
                    value={formData[pwd.id as keyof typeof formData]}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 bg-white/60 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-500 outline-none text-sm placeholder-gray-400 transition-all duration-300"
                  />
                  <button
                    type="button"
                    onClick={() => pwd.setState(!pwd.state)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-indigo-600 transition"
                  >
                    {pwd.state ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </motion.div>
            ))}

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600"
              >
                <AlertCircle size={16} />
                {error}
              </motion.div>
            )}

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isLoading}
              className="w-full py-3 rounded-xl text-white font-medium bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-60"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Mendaftar...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <UserPlus size={18} />
                  Daftar Sekarang
                </div>
              )}
            </motion.button>

            {/* Login Link */}
            <p className="text-center text-sm text-gray-600">
              Sudah punya akun?{" "}
              <Link
                href="/auth/login"
                className="text-indigo-600 font-semibold hover:underline"
              >
                Masuk
              </Link>
            </p>
          </motion.form>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Register;
