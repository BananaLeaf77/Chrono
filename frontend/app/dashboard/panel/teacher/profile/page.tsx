"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  User,
  Mail,
  Phone,
  Camera,
  Save,
  X,
  BookOpen,
  Upload,
  Key,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import Image from "next/image";
import api from "@/lib/axios";
import CropModal from "@/app/dashboard/components/modals/CropModal";
import ChangePasswordModal from "@/app/dashboard/components/modals/ChangePasswordModal";

interface TeacherProfile {
  uuid: string;
  name: string;
  email: string;
  phone: string;
  image?: string;
  role: string;
  bio?: string;
  instruments?: Array<{ id: number; name: string }>;
  createdAt: string;
  updatedAt: string;
}

export default function TeacherProfilePage() {
  const { user, loading, refreshUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<TeacherProfile | null>(null);
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
    bio: "",
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Auto-clear success message
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Fetch teacher profile
  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.uuid) return;
      try {
        const response = await api.get(`/teacher/profile`);
        if (response.data?.success && response.data?.data) {
          const teacherData = response.data.data;
          setProfile({
            uuid: teacherData.uuid,
            name: teacherData.name,
            email: teacherData.email,
            phone: teacherData.phone || "",
            image: teacherData.image,
            role: teacherData.role,
            bio: teacherData.bio || "",
            instruments: teacherData.instruments || [],
            createdAt: teacherData.createdAt,
            updatedAt: teacherData.updatedAt,
          });
          setFormData({
            name: teacherData.name,
            email: teacherData.email,
            phone: teacherData.phone || "",
            image: teacherData.image || "",
            bio: teacherData.bio || "",
          });
        }
      } catch (err) {
        console.error("Failed to fetch teacher profile:", err);
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
      const response = await api.put(`/teacher/modify`, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        image: formData.image,
        bio: formData.bio,
      });

      if (response.data?.success) {
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                ...formData,
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
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
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
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
                  <p className="text-blue-100">Guru/Instruktur</p>
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
                </div>

                {/* Bio */}
                {profile.bio && (
                  <div>
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-2">
                      <BookOpen className="w-4 h-4" />
                      Biodata
                    </label>
                    <p className="text-gray-700 leading-relaxed">
                      {profile.bio}
                    </p>
                  </div>
                )}

                {/* Instruments */}
                {profile.instruments && profile.instruments.length > 0 && (
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-3">
                      Instrumen yang Diajarkan
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {profile.instruments.map((instrument) => (
                        <span
                          key={instrument.id}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                        >
                          {instrument.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

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

                {/* Bio */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Biodata
                  </label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Ceritakan tentang diri Anda sebagai guru..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition resize-none"
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
      </div>
    </div>
  );
}
