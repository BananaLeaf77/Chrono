"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  User,
  Mail,
  Phone,
  Save,
  X,
  BookOpen,
  Upload,
  Key,
  Edit3,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import Image from "next/image";
import api from "@/lib/axios";
import CropModal from "@/app/dashboard/components/modals/CropModal";
import ChangePasswordModal from "@/app/dashboard/components/modals/ChangePasswordModal";
import InstrumenIcon from "@/app/dashboard/components/InstrumenIcon";

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
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    image: "",
    bio: "",
  });

  // Auto-clear success message
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
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
            bio: teacherData.teacher_profile?.bio || "",
            instruments: teacherData.teacher_profile?.instruments || [],
            createdAt: teacherData.created_at,
            updatedAt: teacherData.updated_at,
          });
          setFormData({
            name: teacherData.name,
            email: teacherData.email,
            phone: teacherData.phone || "",
            image: teacherData.image || "",
            bio: teacherData.teacher_profile?.bio || "",
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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-blue-200"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 animate-spin"></div>
          </div>
          <p className="text-gray-600 font-medium">Memuat profil...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg border border-gray-100">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-600 font-medium">Profil tidak ditemukan</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
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
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl shadow-sm animate-in slide-in-from-top duration-300">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <p className="text-sm font-medium text-green-800">{success}</p>
            </div>
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl shadow-sm animate-in slide-in-from-top duration-300">
            <div className="flex items-center gap-3">
              <X className="w-5 h-5 text-red-600" />
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left Column - Profile Card */}
          <div className="lg:col-span-2">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-sm border border-blue-100 overflow-hidden">
              {/* Avatar Section */}
              <div className="relative bg-gradient-to-br from-blue-500 to-indigo-600 p-8 pb-16">
                <div className="absolute inset-0 bg-black/5"></div>
                <div className="relative text-center">
                  <div className="relative w-28 h-28 mx-auto rounded-full ring-4 ring-white shadow-xl overflow-hidden bg-white/20 backdrop-blur-sm">
                    {profile.image && !imageError ? (
                      <Image
                        src={profile.image}
                        alt={profile.name}
                        fill
                        sizes="112px"
                        className="rounded-full object-cover"
                        unoptimized
                        priority
                        onError={() => setImageError(true)}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-100">
                        {process.env.NEXT_PUBLIC_DEFAULT_AVATAR ? (
                          <Image
                            src={process.env.NEXT_PUBLIC_DEFAULT_AVATAR}
                            alt="Default Avatar"
                            fill
                            sizes="112px"
                            className="rounded-full object-cover"
                            unoptimized
                            priority
                          />
                        ) : (
                          <User className="w-12 h-12 text-slate-400" />
                        )}
                      </div>
                    )}
                  </div>
                  {profile.image && (
                    <button
                      onClick={() => setPreviewImage(profile.image!)}
                      className="absolute inset-0 rounded-full cursor-pointer transition-all"
                    />
                  )}
                  <div className="mt-6">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white/25 backdrop-blur-md text-white text-sm font-semibold rounded-lg hover:bg-white/35 transition-all border border-white/30"
                    >
                      <Upload className="w-4 h-4" />
                      Ganti Foto
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Profile Info */}
              <div className="px-6 pb-6 -mt-8 relative">
                <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
                  <h2 className="text-2xl font-bold text-gray-900 text-center mb-2 break-words">
                    {profile.name}
                  </h2>
                  <p className="text-sm text-gray-600 text-center mb-4 break-all font-medium">
                    {profile.email}
                  </p>

                  <div className="flex items-center justify-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span className="text-sm font-semibold text-blue-700 capitalize">
                      {profile.role}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 space-y-3">
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className={`w-full px-4 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 text-sm ${
                      isEditing
                        ? "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300"
                        : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg"
                    }`}
                  >
                    {isEditing ? (
                      <>
                        <X className="w-4 h-4" />
                        Batal Edit
                      </>
                    ) : (
                      <>
                        <Edit3 className="w-4 h-4" />
                        Edit Profil
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setShowChangePasswordModal(true)}
                    className="w-full px-4 py-3 bg-white border-2 border-blue-300 text-blue-700 rounded-lg font-semibold hover:bg-blue-50 transition-all flex items-center justify-center gap-2 text-sm"
                  >
                    <Key className="w-4 h-4" />
                    Ubah Password
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Details */}
          <div className="lg:col-span-3">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-sm border border-blue-100 overflow-hidden">
              {/* Header */}
              <div className="border-b border-blue-200 px-8 py-6 bg-gradient-to-r from-blue-500 to-indigo-600">
                <h3 className="text-xl font-bold text-white flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <User className="w-5 h-5" />
                  </div>
                  {isEditing ? "Edit Informasi Profil" : "Informasi Profil"}
                </h3>
              </div>

              {/* Content */}
              <div className="p-8 bg-white/50 backdrop-blur-sm">
                {!isEditing ? (
                  // View Mode
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Personal Information */}
                    <div className="space-y-6">
                      <h4 className="font-bold text-gray-900 text-base uppercase tracking-wider pb-4 border-b-2 border-blue-300">
                        Informasi Pribadi
                      </h4>

                      <div className="space-y-5">
                        <div className="group">
                          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 flex items-center gap-2">
                            <div className="p-1.5 bg-blue-100 rounded">
                              <User className="w-3.5 h-3.5 text-blue-600" />
                            </div>
                            Nama Lengkap
                          </label>
                          <div className="px-4 py-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 transition">
                            <p className="text-gray-900 font-semibold">
                              {profile.name}
                            </p>
                          </div>
                        </div>

                        <div className="group">
                          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 flex items-center gap-2">
                            <div className="p-1.5 bg-blue-100 rounded">
                              <Mail className="w-3.5 h-3.5 text-blue-600" />
                            </div>
                            Email
                          </label>
                          <div className="px-4 py-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 transition">
                            <p className="text-gray-900 font-semibold break-all">
                              {profile.email}
                            </p>
                          </div>
                        </div>
                        <div className="group">
                          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 flex items-center gap-2">
                            <div className="p-1.5 bg-blue-100 rounded">
                              <Phone className="w-3.5 h-3.5 text-blue-600" />
                            </div>
                            Nomor Telepon
                          </label>
                          <div className="px-4 py-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 transition">
                            <p className="text-gray-900 font-semibold">
                              {profile.phone || (
                                <span className="text-gray-400 italic">
                                  Belum diisi
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bio Section */}
                    <div className="space-y-6">
                      <h4 className="font-bold text-gray-900 text-base uppercase tracking-wider pb-4 border-b-2 border-blue-300">
                        Tentang Saya
                      </h4>

                      <div className="group">
                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 flex items-center gap-2">
                          <div className="p-1.5 bg-amber-100 rounded">
                            <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                          </div>
                          Biodata
                        </label>
                        <div className="px-4 py-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 transition min-h-[140px]">
                          <p className="text-gray-700 leading-relaxed">
                            {profile.bio || (
                              <span className="text-gray-400 italic">
                                Belum ada biodata
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="pt-2">
                        <h5 className="font-semibold text-gray-900 text-sm uppercase tracking-wide mb-3 pb-2 border-b border-gray-200">
                          Instrumen yang Diajarkan
                        </h5>
                        {profile.instruments &&
                        profile.instruments.length > 0 ? (
                          <div className="flex flex-wrap gap-3">
                            {profile.instruments.map(
                              (instrument: { id: number; name: string }) => (
                                <div
                                  key={instrument.id}
                                  className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 rounded-lg border border-blue-300 text-sm font-semibold hover:from-blue-100 hover:to-indigo-100 transition"
                                >
                                  <InstrumenIcon
                                    instrumentName={instrument.name}
                                    className="w-4 h-4"
                                  />
                                  <span className="capitalize">
                                    {instrument.name}
                                  </span>
                                </div>
                              )
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 italic">
                            Belum ada instrumen
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  // Edit Mode
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Left Column - Basic Info */}
                      <div className="space-y-4">
                        <h4 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">
                          Informasi Dasar
                        </h4>

                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                            <User className="w-4 h-4 text-blue-600" />
                            Nama Lengkap *
                          </label>
                          <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                            placeholder="Masukkan nama lengkap"
                          />
                        </div>

                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                            <Mail className="w-4 h-4 text-blue-600" />
                            Email *
                          </label>
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                            placeholder="email@example.com"
                          />
                        </div>

                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                            <Phone className="w-4 h-4 text-blue-600" />
                            Nomor Telepon
                          </label>
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                            placeholder="+62 812 3456 7890"
                          />
                        </div>
                      </div>

                      {/* Right Column - Bio & Image */}
                      <div className="space-y-4">
                        <h4 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">
                          Informasi Tambahan
                        </h4>

                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-blue-600" />
                            Biodata
                          </label>
                          <textarea
                            name="bio"
                            value={formData.bio}
                            onChange={handleChange}
                            rows={4}
                            placeholder="Ceritakan tentang diri Anda sebagai guru..."
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-none"
                          />
                        </div>

                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                            <Upload className="w-4 h-4 text-blue-600" />
                            Foto Profil
                          </label>
                          <div className="flex gap-3">
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="flex items-center gap-2 px-3 py-2.5 border border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-sm"
                            >
                              <Upload className="w-4 h-4" />
                              Pilih Gambar
                            </button>
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            Format: JPG, PNG, GIF, WebP | Ukuran maksimal: 5MB
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
                      <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                      >
                        {isSaving ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Menyimpan...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
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
                            bio: profile.bio || "",
                          });
                        }}
                        disabled={isSaving}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 disabled:opacity-50 transition-all"
                      >
                        <X className="w-4 h-4" />
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
