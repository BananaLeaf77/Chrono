"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Clock,
  AlertCircle,
  ArrowLeft,
  Mail,
  CheckCircle,
  Eye,
  EyeOff,
} from "lucide-react";

type OTPFormResetProps = {
  email: string;
};

export default function OTPFormReset({ email }: Readonly<OTPFormResetProps>) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [isOTPVerified, setIsOTPVerified] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Timer logic
  useEffect(() => {
    if (timer > 0 && !canResend && !isOTPVerified) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else if (timer === 0) {
      setCanResend(true);
    }
  }, [timer, canResend, isOTPVerified]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleInputChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value[0];
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value !== "" && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }

    // Auto-show password form when all digits are filled (client-side only)
    if (index === 5 && value !== "") {
      const allOtp = [...newOtp];
      allOtp[5] = value;
      if (allOtp.every((digit) => digit !== "")) {
        setIsOTPVerified(true);
        setSuccess("Lanjutkan dengan mengisi password baru");
        setTimeout(() => setSuccess(""), 3000);
        setError(""); // Clear any previous errors
      }
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && otp[index] === "" && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handlePasswordSubmit = async () => {
    setPasswordError("");
    if (newPassword.length < 8) {
      setPasswordError("Password harus minimal 8 karakter");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Konfirmasi password tidak cocok");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/reset-password`,
        {
          method: "POST",
          body: JSON.stringify({
            email,
            otp: otp.join(""),
            new_password: newPassword,
          }),
          headers: { "Content-Type": "application/json" },
        }
      );

      const data = await res.json();
      if (res.ok) {
        setSuccess(
          "Password berhasil direset! Silakan login dengan password baru."
        );
        setTimeout(() => {
          // Clear cookie jika perlu
          document.cookie =
            "userEmail=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
          router.push("/auth/login"); // <-- Delay 2000ms setelah setSuccess
        }, 2000);
      } else {
        // Jika error terkait OTP, reset ke form OTP
        const otpError =
          (data.error && data.error.toLowerCase().includes("otp")) ||
          (data.message && data.message.toLowerCase().includes("otp"));
        if (otpError) {
          setIsOTPVerified(false);
          setOtp(["", "", "", "", "", ""]); // Reset OTP input
          setNewPassword(""); // Clear password fields
          setConfirmPassword("");
          setError(
            data.error ||
              data.message ||
              "Kode OTP salah atau kedaluwarsa. Silakan masukkan ulang."
          );
          // Focus ke input OTP pertama
          setTimeout(() => {
            const firstInput = document.getElementById("otp-0");
            firstInput?.focus();
          }, 100);
        } else {
          setPasswordError(
            data.message || data.error || "Gagal mengatur ulang password"
          );
        }
      }
    } catch (err) {
      setPasswordError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend || isOTPVerified) return;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/resend-otp`,
        {
          method: "POST",
          body: JSON.stringify({
            email,
          }),
          headers: { "Content-Type": "application/json" },
        }
      );

      const data = await res.json();

      if (res.ok) {
        setTimer(60);
        setCanResend(false);
        setError(""); // Clear any existing errors
        setSuccess("Kode OTP baru telah dikirim ke email Anda");
        // Clear success message after 5 seconds
        setTimeout(() => setSuccess(""), 5000);
      } else {
        setError(
          data.message ||
            data.error ||
            "Gagal mengirim ulang OTP. Silakan coba lagi."
        );
      }
    } catch (err) {
      setError("Terjadi kesalahan jaringan. Silakan coba lagi.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        {/* Header */}
        <div className="flex items-center mb-6">
          <button
            onClick={() => router.back()}
            className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Reset Password</h1>
        </div>

        {/* Email Info */}
        <div className="flex flex-col space-y-1 mb-8">
          <p className="text-gray-600 text-sm">
            Masukkan kode OTP yang dikirim ke:
          </p>
          <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
            <Mail className="w-5 h-5 text-purple-600 mt-0.5" />
            <div>
              <p className="text-gray-900 font-medium break-all">{email}</p>
            </div>
          </div>
        </div>

        {!isOTPVerified ? (
          <>
            {/* OTP Input */}
            <motion.div
              initial={{ opacity: 1 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="grid grid-cols-6 gap-3 mb-6">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleInputChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    disabled={isLoading}
                    className="w-full h-12 text-center text-xl font-semibold border-2 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all disabled:opacity-50"
                  />
                ))}
              </div>

              {/* Timer & Resend */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center text-gray-500">
                  <Clock size={16} className="mr-2" />
                  <span>{formatTime(timer)}</span>
                </div>
                <button
                  onClick={handleResendOTP}
                  disabled={!canResend || isLoading}
                  className={`text-sm font-semibold ${
                    canResend && !isLoading
                      ? "cursor-pointer text-green-600 hover:text-green-700"
                      : "text-gray-400 cursor-not-allowed"
                  }`}
                >
                  Kirim Ulang OTP
                </button>
              </div>
            </motion.div>

            {/* No separate submit button for OTP - auto proceeds */}
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* New Password Input */}
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2 px-1">
                Password Baru
              </label>
              <div className="relative">
                <input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Masukkan password baru"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isLoading}
                  className="w-full pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none disabled:opacity-50 px-2"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  disabled={isLoading}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center disabled:opacity-50"
                >
                  {showNewPassword ? (
                    <EyeOff size={20} className="text-gray-400" />
                  ) : (
                    <Eye size={20} className="text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2 px-1">
                Konfirmasi Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Konfirmasi password baru"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  className="w-full pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none disabled:opacity-50 px-2"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center disabled:opacity-50"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} className="text-gray-400" />
                  ) : (
                    <Eye size={20} className="text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Password Button */}
            <button
              onClick={handlePasswordSubmit}
              disabled={isLoading}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              {isLoading ? "Memproses..." : "Atur Ulang Password"}
            </button>
          </motion.div>
        )}

        {/* Success Message */}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start space-x-2 p-4 bg-green-50 rounded-lg mt-5"
          >
            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
            <span className="text-green-600 text-sm">{success}</span>
          </motion.div>
        )}

        {/* Error Message */}
        {(error || passwordError) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start space-x-2 p-4 mb-6 bg-red-50 rounded-lg"
          >
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
            <span className="text-red-600 text-sm">
              {error || passwordError}
            </span>
          </motion.div>
        )}
      </div>
    </div>
  );
}
