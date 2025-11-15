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
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
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
      const timer = setTimeout(() => setSuccess(null), 3000);
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat profil...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Profil tidak ditemukan</p>
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
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

        {/* Success Notification */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm font-semibold text-green-800">{success}</p>
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm font-semibold text-red-800">{error}</p>
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center relative">
                  {profile.image ? (
                    <Image
                      src={profile.image}
                      alt={profile.name}
                      fill
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-8 h-8 text-white" />
                  )}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    {profile.name}
                  </h1>
                  <p className="text-blue-100">Murid/Siswa</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowChangePasswordModal(true)}
                  className="px-4 py-2 bg-white/10 text-white rounded-lg font-semibold hover:bg-white/20 transition flex items-center gap-2"
                >
                  <Key className="w-4 h-4" />
                  Ubah Password
                </button>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className={`px-6 py-2 rounded-lg font-semibold transition ${
                    isEditing
                      ? "bg-white text-blue-600 hover:bg-gray-100"
                      : "bg-white/20 text-white hover:bg-white/30"
                  }`}
                >
                  {isEditing ? "Batal" : "Edit"}
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {!isEditing ? (
              // View Mode
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name */}
                  <div>
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-2">
                      <User className="w-4 h-4" />
                      Nama Lengkap
                    </label>
                    <p className="text-lg text-gray-900">{profile.name}</p>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-2">
                      <Mail className="w-4 h-4" />
                      Email
                    </label>
                    <p className="text-lg text-gray-900">{profile.email}</p>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-2">
                      <Phone className="w-4 h-4" />
                      Nomor Telepon
                    </label>
                    <p className="text-lg text-gray-900">
                      {profile.phone || "-"}
                    </p>
                  </div>

                  {/* Join Date */}
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2">
                      Bergabung Sejak
                    </label>
                    <p className="text-lg text-gray-900">
                      {new Date(profile.createdAt).toLocaleDateString("id-ID", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                {/* Image */}
                {profile.image && (
                  <div>
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
                      <Camera className="w-4 h-4" />
                      Foto Profil
                    </label>
                    <div className="w-32 h-32 relative rounded-lg overflow-hidden">
                      <Image
                        src={profile.image}
                        alt={profile.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Edit Mode
              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nama Lengkap *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nomor Telepon
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                  />
                </div>

                {/* Image File Upload */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Foto Profil
                  </label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-blue-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 disabled:opacity-50 transition"
                    >
                      <Upload className="w-4 h-4" />
                      {isUploading ? "Mengunggah..." : "Pilih Gambar"}
                    </button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={isUploading}
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Format: JPG, PNG, GIF, WebP | Ukuran maksimal: 5MB
                  </p>
                </div>

                {/* Preview */}
                {(imagePreview || formData.image) && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Preview Foto
                    </label>
                    <div className="w-32 h-32 relative rounded-lg overflow-hidden">
                      <Image
                        src={imagePreview || formData.image}
                        alt="Preview"
                        fill
                        className="object-cover"
                        onError={() => setError("Gagal memuat preview gambar")}
                      />
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition"
                  >
                    <Save className="w-5 h-5" />
                    {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
                  >
                    <X className="w-5 h-5" />
                    Batal
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Packages Section */}
        {profile.packages && profile.packages.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
              <h2 className="flex items-center gap-2 text-xl font-bold text-white">
                <Package className="w-6 h-6" />
                Paket Pembelajaran Saya
              </h2>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profile.packages.map((pkg) => (
                  <div
                    key={pkg.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-lg text-gray-900">
                        {pkg.name}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${getPackageStatus(
                          pkg
                        )}`}
                      >
                        {Math.round((pkg.used / pkg.quota) * 100)}%
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Quota</span>
                        <span className="font-semibold">
                          {pkg.used} / {pkg.quota} Sesi
                        </span>
                      </div>

                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            pkg.used >= pkg.quota
                              ? "bg-red-500"
                              : pkg.used >= pkg.quota * 0.75
                              ? "bg-yellow-500"
                              : "bg-green-500"
                          }`}
                          style={{
                            width: `${Math.min(
                              (pkg.used / pkg.quota) * 100,
                              100
                            )}%`,
                          }}
                        />
                      </div>

                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Sisa</span>
                        <span className="font-semibold text-blue-600">
                          {Math.max(pkg.remaining, 0)} Sesi
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {(!profile.packages || profile.packages.length === 0) && !isEditing && (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              Belum ada paket pembelajaran
            </p>
            <p className="text-gray-400">
              Hubungi admin untuk berlangganan paket
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
