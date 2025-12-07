"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  User,
  Mail,
  Phone,
  Camera,
  Save,
  X,
  Package,
  Upload,
  Key,
  Edit3,
  Shield,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import Image from "next/image";
import api from "@/lib/axios";
import CropModal from "@/app/dashboard/components/modals/CropModal";
import ChangePasswordModal from "@/app/dashboard/components/modals/ChangePasswordModal";

interface StudentPackage {
  id: number;
  name: string;
  quota: number;
  used: number;
  remaining: number;
}

interface StudentProfile {
  uuid: string;
  name: string;
  email: string;
  phone: string;
  image?: string;
  role: string;
  packages?: StudentPackage[];
  createdAt: string;
  updatedAt: string;
}

export default function StudentProfilePage() {
  const { user, loading, refreshUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    image: "",
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Auto-clear success message
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Fetch student profile
  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.uuid) return;
      try {
        const response = await api.get(`/student/profile`);
        if (response.data?.success && response.data?.data) {
          const studentData = response.data.data;
          setProfile({
            uuid: studentData.uuid,
            name: studentData.name,
            email: studentData.email,
            phone: studentData.phone || "",
            image: studentData.image,
            role: studentData.role,
            packages: studentData.packages || [],
            createdAt: studentData.createdAt,
            updatedAt: studentData.updatedAt,
          });
          setFormData({
            name: studentData.name,
            email: studentData.email,
            phone: studentData.phone || "",
            image: studentData.image || "",
          });
        }
      } catch (err) {
        console.error("Failed to fetch student profile:", err);
      }
    };

    loadProfile();
  }, [user?.uuid]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setError("Format file harus JPG, PNG, GIF, atau WebP");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Ukuran file maksimal 5MB");
      return;
    }

    // Show preview and crop modal
    const reader = new FileReader();
    reader.onloadend = () => {
      setCropImage(reader.result as string);
      setShowCropModal(true);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = (croppedImageUrl: string) => {
    setFormData((prev) => ({
      ...prev,
      image: croppedImageUrl,
    }));
    setImagePreview(croppedImageUrl);
    setSuccess("Gambar berhasil diupload");
  };

  const handleSave = async () => {
    setError(null);
    setSuccess(null);
    setIsSaving(true);

    try {
      const response = await api.put(`/student/modify`, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        image: formData.image,
      });
      

      if (response.data?.success) {
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                image: formData.image,
              }
            : null
        );
        setSuccess("Profil berhasil diperbarui");
        setIsEditing(false);

        // Refresh user data in auth context to update navbar avatar
        if (refreshUser) {
          await refreshUser();
        }
      }
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { error?: string; message?: string } };
      };
      setError(
        error.response?.data?.error ||
          error.response?.data?.message ||
          "Gagal memperbarui profil"
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-purple-200"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-600 animate-spin"></div>
          </div>
          <p className="text-gray-600 font-medium">Memuat profil...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-600 font-medium">Profil tidak ditemukan</p>
        </div>
      </div>
    );
  }

  const getPackageStatus = (pkg: StudentPackage) => {
    const percentage = (pkg.used / pkg.quota) * 100;
    if (percentage >= 100) return "bg-red-100 text-red-700";
    if (percentage >= 75) return "bg-yellow-100 text-yellow-700";
    return "bg-green-100 text-green-700";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Crop Modal */}
        {cropImage && (
          <CropModal
            imageSrc={cropImage}
            isOpen={showCropModal}
            onClose={() => {
              setShowCropModal(false);
              setCropImage(null);
            }}
            onCropComplete={handleCropComplete}
          />
        )}

        {/* Change Password Modal */}
        <ChangePasswordModal
          isOpen={showChangePasswordModal}
          onClose={() => setShowChangePasswordModal(false)}
          onSuccess={() => {
            setSuccess("Password berhasil diubah");
            setShowChangePasswordModal(false);
          }}
        />

        {/* Preview Modal */}
        {previewImage && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => setPreviewImage(null)}
          >
            <div className="relative max-w-2xl w-full">
              <Image
                src={previewImage}
                alt="Preview Profil"
                width={800}
                height={800}
                sizes="(max-width: 768px) 100vw, 800px"
                className="rounded-2xl shadow-2xl object-contain"
                unoptimized
              />
              <button
                onClick={() => setPreviewImage(null)}
                className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>
        )}

        {/* Success Notification */}
        {success && (
          <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 rounded-r-xl shadow-lg animate-in slide-in-from-top duration-300">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <p className="text-sm font-semibold text-green-800">{success}</p>
            </div>
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-rose-50 border-l-4 border-red-500 rounded-r-xl shadow-lg animate-in slide-in-from-top duration-300">
            <div className="flex items-center gap-3">
              <X className="w-5 h-5 text-red-600" />
              <p className="text-sm font-semibold text-red-800">{error}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Left Column - Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-purple-100">
              {/* Avatar Section */}
              <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 p-8 pb-16">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="relative">
                  <div className="w-32 h-32 mx-auto rounded-full ring-4 ring-white/30 shadow-2xl overflow-hidden bg-white/20 backdrop-blur-sm relative">
                    {profile.image ? (
                      <Image
                        src={profile.image}
                        alt={profile.name}
                        fill
                        sizes="128px"
                        className="rounded-full object-cover"
                        unoptimized
                        priority
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-16 h-16 text-white" />
                      </div>
                    )}
                  </div>
                  {profile.image && (
                    <button
                      onClick={() => setPreviewImage(profile.image!)}
                      className="absolute inset-0 rounded-full cursor-pointer transition-all"
                    />
                  )}
                </div>
              </div>

              {/* Profile Info */}
              <div className="px-6 pb-6 -mt-8 relative">
                <div className="bg-white rounded-xl p-5 shadow-lg border border-gray-100">
                  <h2 className="text-xl font-bold text-gray-900 text-center mb-1 break-words px-2">
                    {profile.name}
                  </h2>
                  <p className="text-sm text-gray-500 text-center mb-4 break-all px-2">
                    {profile.email}
                  </p>

                  <div className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                    <div className="p-1.5 bg-indigo-100 rounded-lg">
                      <Shield className="w-4 h-4 text-indigo-600" />
                    </div>
                    <span className="text-sm font-bold text-blue-700 capitalize">
                      {profile.role}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-4 space-y-2">
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className={`w-full px-4 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 text-sm sm:text-base ${
                      isEditing
                        ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/30"
                    }`}
                  >
                    {isEditing ? (
                      <>
                        <X className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span className="truncate">Batal Edit</span>
                      </>
                    ) : (
                      <>
                        <Edit3 className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span className="truncate">Edit Profil</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setShowChangePasswordModal(true)}
                    className="w-full px-4 py-3 bg-white border-2 border-blue-200 text-blue-700 rounded-xl font-semibold hover:bg-blue-50 hover:border-blue-300 transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
                  >
                    <Key className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="truncate">Ubah Password</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Details */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-purple-100">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <User className="w-6 h-6" />
                  {isEditing ? "Edit Informasi" : "Informasi Profil"}
                </h3>
              </div>

              {/* Content */}
              <div className="p-6">
                {!isEditing ? (
                  // View Mode
                  <div className="space-y-6">
                    {/* Name */}
                    <div className="group">
                      <label className="text-sm font-semibold text-gray-500 flex items-center gap-2 mb-2">
                        <div className="p-1.5 bg-purple-100 rounded-lg">
                          <User className="w-4 h-4 text-purple-600" />
                        </div>
                        Nama Lengkap
                      </label>
                      <div className="px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl group-hover:bg-gray-100 transition-colors">
                        <p className="text-lg font-medium text-gray-900">
                          {profile.name}
                        </p>
                      </div>
                    </div>

                    {/* Email */}
                    <div className="group">
                      <label className="text-sm font-semibold text-gray-500 flex items-center gap-2 mb-2">
                        <div className="p-1.5 bg-blue-100 rounded-lg">
                          <Mail className="w-4 h-4 text-blue-600" />
                        </div>
                        Email
                      </label>
                      <div className="px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl group-hover:bg-gray-100 transition-colors">
                        <p className="text-lg font-medium text-gray-900 break-all">
                          {profile.email}
                        </p>
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="group">
                      <label className="text-sm font-semibold text-gray-500 flex items-center gap-2 mb-2">
                        <div className="p-1.5 bg-green-100 rounded-lg">
                          <Phone className="w-4 h-4 text-green-600" />
                        </div>
                        Nomor Telepon
                      </label>
                      <div className="px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl group-hover:bg-gray-100 transition-colors">
                        <p className="text-lg font-medium text-gray-900">
                          {profile.phone || (
                            <span className="text-gray-400 italic">
                              Belum diisi
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    
                  </div>
                ) : (
                  // Edit Mode
                  <div className="space-y-5">
                    {/* Name */}
                    <div>
                      <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <User className="w-4 h-4 text-purple-600" />
                        Nama Lengkap *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                        placeholder="Masukkan nama lengkap"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <Mail className="w-4 h-4 text-blue-600" />
                        Email *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                        placeholder="email@example.com"
                      />
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <Phone className="w-4 h-4 text-green-600" />
                        Nomor Telepon
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                        placeholder="+62 812 3456 7890"
                      />
                    </div>

                    {/* Image File Upload */}
                    <div>
                      <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <Camera className="w-4 h-4 text-pink-600" />
                        Foto Profil
                      </label>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-blue-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all"
                        >
                          <Upload className="w-5 h-5" />
                          Pilih Gambar
                        </button>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        Format: JPG, PNG, GIF, WebP | Ukuran maksimal: 5MB
                      </p>
                    </div>


                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t-2 border-gray-100">
                      <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 active:scale-95"
                      >
                        {isSaving ? (
                          <>
                            <svg
                              className="animate-spin h-5 w-5"
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
                            Menyimpan...
                          </>
                        ) : (
                          <>
                            <Save className="w-5 h-5" />
                            Simpan Perubahan
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setFormData({
                            name: profile.name,
                            email: profile.email,
                            phone: profile.phone,
                            image: profile.image || "",
                          });
                        }}
                        disabled={isSaving}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 disabled:opacity-50 transition-all active:scale-95"
                      >
                        <X className="w-5 h-5" />
                        Batal
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
