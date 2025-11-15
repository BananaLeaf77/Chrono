"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Clock, AlertCircle, ArrowLeft, Mail, CheckCircle } from "lucide-react";

type OTPFormProps = {
  email: string;
};

export default function OTPForm({ email }: Readonly<OTPFormProps>) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const isRegisterFlow = pathname?.includes("/auth/register"); // Timer logic
  useEffect(() => {
    if (timer > 0 && !canResend) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else if (timer === 0) {
      setCanResend(true);
    }
  }, [timer, canResend]);

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

  const handleSubmit = async () => {
    setError("");
    const otpString = otp.join("");

    if (otpString.length !== 6) {
      setError("Masukkan kode OTP 6 digit");
      return;
    }

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/verify-otp`,
        {
          method: "POST",
          body: JSON.stringify({ otp: otpString, email }),
          headers: { "Content-Type": "application/json" },
        }
      );
      if (res.ok) {
        setSuccess("Email berhasil diverifikasi! Silakan login.");
        setError("");
        // Clear the email cookie after successful registration verification
        document.cookie =
          "userEmail=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
        // Add delay before redirecting
        setTimeout(() => {
          router.push("/auth/login");
        }, 2000);
      } else {
        const data = await res.json();
        setError(data.message || "Kode OTP salah atau telah kedaluwarsa");
      }
    } catch (err) {
      console.error("Verification error:", err);
      setError("Terjadi kesalahan jaringan. Silakan coba lagi.");
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;

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
          data.message || "Gagal mengirim ulang OTP. Silakan coba lagi."
        );
      }
    } catch (err) {
      console.error("Resend OTP error:", err);
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
          <h1 className="text-2xl font-bold text-gray-800 ">
            Verifikasi Email
          </h1>
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

        {/* OTP Input */}
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
              className="w-full h-12 text-center text-xl font-semibold border-2 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all"
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
            disabled={!canResend}
            className={`text-sm font-semibold ${
              canResend
                ? "cursor-pointer text-green-600 hover:text-green-700"
                : "text-gray-400 cursor-not-allowed"
            }`}
          >
            Kirim Ulang OTP
          </button>
        </div>

        {/* Success Message */}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start space-x-2 p-4 mb-6 bg-green-50 rounded-lg"
          >
            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
            <span className="text-green-600 text-sm">{success}</span>
          </motion.div>
        )}

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start space-x-2 p-4 mb-6 bg-red-50 rounded-lg"
          >
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
            <span className="text-red-600 text-sm">{error}</span>
          </motion.div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition-colors"
        >
          Verifikasi
        </button>
      </div>
    </div>
  );
}
