"use client";
import React, { useState, useEffect } from "react";
import { X, Lock, Eye, EyeOff, Shield, CheckCircle2 } from "lucide-react";
import api from "@/lib/axios";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ChangePasswordModal({
  isOpen,
  onClose,
  onSuccess,
}: ChangePasswordModalProps) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ---------- PASSWORD VALIDATION ---------- */
  const validateNewPassword = (pwd: string) => {
    const errors: string[] = [];

    if (pwd.length < 8) errors.push("Minimal 8 karakter");
    if (!/[A-Z]/.test(pwd)) errors.push("Harus ada huruf besar");
    if (!/\d/.test(pwd)) errors.push("Harus ada angka");

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  const { isValid: newPwdValid, errors: newPwdErrors } = validateNewPassword(newPassword);

  /* ---------- PASSWORD STRENGTH (opsional) ---------- */
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { strength: 0, label: "", color: "" };
    let s = 0;
    if (pwd.length >= 8) s++;
    if (pwd.length >= 12) s++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) s++;
    if (/\d/.test(pwd)) s++;
    if (/[^a-zA-Z0-9]/.test(pwd)) s++;

    if (s <= 1) return { strength: 1, label: "Lemah", color: "bg-red-500" };
    if (s <= 3) return { strength: 2, label: "Sedang", color: "bg-yellow-500" };
    return { strength: 3, label: "Kuat", color: "bg-green-500" };
  };
  const passwordStrength = getPasswordStrength(newPassword);

  /* ---------- RESET FORM ---------- */
  useEffect(() => {
    if (!isOpen) {
      setOldPassword("");
      setNewPassword("");
      setShowOldPassword(false);
      setShowNewPassword(false);
      setError(null);
    }
  }, [isOpen]);

  /* ---------- SUBMIT ---------- */
  const handleSubmit = async () => {
    setError(null);

    // ==== FRONTEND VALIDATION ====
    if (!oldPassword) return setError("Password lama wajib diisi");
    if (!newPassword) return setError("Password baru wajib diisi");
    if (!newPwdValid) {
      setError(`Password tidak memenuhi syarat: ${newPwdErrors.join(", ")}`);
      return;
    }
    if (oldPassword === newPassword) {
      setError("Password baru tidak boleh sama dengan password lama");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post("/auth/change-password", {
        old_password: oldPassword,
        new_password: newPassword,
      });

      // (optional) simulate delay
      // await new Promise(r => setTimeout(r, 800));

      onSuccess();
      onClose();
    } catch (err: unknown) {
      const e = err as {
        response?: { data?: { error?: string; message?: string } };
      };
      const apiMsg = e.response?.data?.error || e.response?.data?.message;

      // ---- khusus old password mismatch ----
      if (apiMsg?.toLowerCase().includes("old password")) {
        setError("Password lama salah");
      } else {
        setError(apiMsg || "Gagal mengubah password");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isSubmitting && newPwdValid) handleSubmit();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl transform animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Ubah Password</h2>
                <p className="text-blue-100 text-sm mt-0.5">
                  Perbarui keamanan akun Anda
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="p-2 hover:bg-white/20 rounded-lg transition disabled:opacity-50 group"
            >
              <X className="w-5 h-5 text-white group-hover:rotate-90 transition-transform duration-200" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Error */}
          {error && (
            <div className="mb-5 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg animate-in slide-in-from-left duration-300">
              <p className="text-sm text-red-800 font-medium">{error}</p>
            </div>
          )}

          {/* Old Password */}
          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Password Lama
            </label>
            <div className="relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors">
                <Lock className="w-5 h-5" />
              </div>
              <input
                type={showOldPassword ? "text" : "password"}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isSubmitting}
                className="w-full pl-11 pr-11 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all disabled:opacity-50 disabled:bg-gray-50"
                placeholder="Masukkan password lama"
              />
              <button
                type="button"
                onClick={() => setShowOldPassword(!showOldPassword)}
                disabled={isSubmitting}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50 transition-colors"
              >
                {showOldPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Password Baru
            </label>
            <div className="relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors">
                <Lock className="w-5 h-5" />
              </div>
              <input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isSubmitting}
                className="w-full pl-11 pr-11 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all disabled:opacity-50 disabled:bg-gray-50"
                placeholder="Masukkan password baru"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                disabled={isSubmitting}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50 transition-colors"
              >
                {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Strength (opsional) */}
            {newPassword && (
              <div className="mt-3 space-y-2 animate-in slide-in-from-top duration-300">
                <div className="flex gap-1.5">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                        passwordStrength.strength >= i ? passwordStrength.color : "bg-gray-200"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs font-medium text-gray-600">
                  Kekuatan:{" "}
                  <span
                    className={
                      passwordStrength.strength === 1
                        ? "text-red-600"
                        : passwordStrength.strength === 2
                        ? "text-yellow-600"
                        : "text-green-600"
                    }
                  >
                    {passwordStrength.label}
                  </span>
                </p>
              </div>
            )}
          </div>

          {/* Persyaratan Password – SEKARANG WAJIB */}
          <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <p className="text-xs font-semibold text-gray-700 mb-2">
              Persyaratan Password (wajib):
            </p>
            <div className="space-y-1.5">
              {/* 8 karakter */}
              <div className="flex items-center gap-2">
                <CheckCircle2
                  className={`w-4 h-4 ${newPassword.length >= 8 ? "text-green-500" : "text-gray-300"}`}
                />
                <span
                  className={`text-xs ${newPassword.length >= 8 ? "text-green-700" : "text-gray-500"}`}
                >
                  Minimal 8 karakter
                </span>
              </div>

              {/* Huruf besar */}
              <div className="flex items-center gap-2">
                <CheckCircle2
                  className={`w-4 h-4 ${/[A-Z]/.test(newPassword) ? "text-green-500" : "text-gray-300"}`}
                />
                <span
                  className={`text-xs ${/[A-Z]/.test(newPassword) ? "text-green-700" : "text-gray-500"}`}
                >
                  Harus ada huruf besar
                </span>
              </div>

              {/* Angka */}
              <div className="flex items-center gap-2">
                <CheckCircle2
                  className={`w-4 h-4 ${/\d/.test(newPassword) ? "text-green-500" : "text-gray-300"}`}
                />
                <span
                  className={`text-xs ${/\d/.test(newPassword) ? "text-green-700" : "text-gray-500"}`}
                >
                  Harus ada angka
                </span>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 transition-all active:scale-95"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || !newPwdValid}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all active:scale-95"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
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
                  Menyimpan...
                </span>
              ) : (
                "Ubah Password"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}