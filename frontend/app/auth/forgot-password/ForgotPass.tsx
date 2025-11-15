"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail } from "lucide-react";
import Image from "next/image";

export default function ResetPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async () => {
    setError("");
    if (!validateEmail(email)) {
      setError("Masukkan email yang valid.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/forgot-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }), // Cuma kirim email buat kirim OTP
        }
      );

      if (res.ok) {
        // Set cookie email buat OTP form (bisa dibaca di OTP component)
        document.cookie = `userEmail=${email}; path=/; max-age=900`; // 15 menit expiry

        router.push("/auth/otp/reset");
      } else {
        const data = await res.json();
        const serverError = data.error || data.message;

        // Terjemahkan pesan error dari backend
        if (serverError?.toLowerCase().includes("email not found")) {
          setError("Email tidak ditemukan");
        } else if (serverError?.toLowerCase().includes("failed to send")) {
          setError("Gagal mengirim OTP. Silakan coba lagi");
        } else {
          setError(serverError || "Terjadi kesalahan. Silakan coba lagi");
        }
      }
    } catch (err) {
      console.error("Forgot password error:", err);
      setError("Terjadi kesalahan jaringan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-4 border border-gray-100">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center rounded-2xl mb-4">
              <Image
                src="/MadeU.png"
                alt="MusicMasters Logo"
                width={50}
                height={50}
                className="w-12 h-12 md:w-16 md:h-16 mb-1 "
                priority={true}
              />
            </div>
            <h1 className="text-sm md:text-xl lg:text-2xl font-black tracking-tight mb-2">
              <span className="text-[#1a1464]">MAD</span>
              <span className="bg-gradient-to-r from-[#f5a623] to-[#f7c948] text-transparent bg-clip-text">
                EU
              </span>
            </h1>
            <h1 className="text-xl font-semibold text-gray-900 mb-2 lg:text-2xl">
              Lupa Password
            </h1>
            <p className="text-gray-600">
              Masukkan email untuk mengatur ulang password Anda
            </p>
          </div>
          <div className="space-y-6">
            {/* Email Input */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2 px-2"
              >
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={loading}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none disabled:bg-gray-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-red-600 text-sm flex items-center">
                  <span className="inline-block w-2 h-2 bg-red-600 rounded-full mr-2"></span>
                  {error}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || !email}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:from-indigo-700 hover:to-purple-700 transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin h-5 w-5 mr-2"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Mengirim OTP...
                </span>
              ) : (
                "Kirim OTP Reset"
              )}
            </button>
          </div>

          {/* Footer Link */}
          <div className="mt-6 text-center">
            <a
              href="/auth/login"
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Kembali ke halaman login
            </a>
          </div>
        </div>

        {/* Security Note */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            🔒 Koneksi Anda diamankan dengan enkripsi end-to-end
          </p>
        </div>
      </div>
    </div>
  );
}
