"use client";
import React, { useState } from "react";
import { Plus, Save, Upload, X } from "lucide-react";
import Select from "react-select";
import Modal from "./modal";
import Image from "next/image";
import CropModal from "./CropModal";

interface CreateModalProps<T> {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: T) => Promise<void>;
  title: string;
  fields: {
    name: keyof T;
    label: string;
    type: string;
    placeholder?: string;
    required?: boolean;
    options?: Array<{ value: number | string; label: string }>;
    isMulti?: boolean;
  }[];
  error?: string | null;
}

export function CreateModal<T extends Record<string, unknown>>({
  isOpen,
  onClose,
  onSubmit,
  title,
  fields,
  error,
}: CreateModalProps<T>) {
  const [formData, setFormData] = useState<Partial<T>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [currentImageField, setCurrentImageField] = useState<keyof T | null>(null);

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      await onSubmit(formData as T);
      // Hanya reset dan tutup jika berhasil
      setFormData({});
      setImagePreview(null);
      setCropImage(null);
      setCurrentImageField(null);
      onClose();
    } catch (error) {
      // Jangan tutup modal saat error
      console.error("Error submitting form:", error);
      // Error akan ditangani oleh parent component melalui error prop
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof T, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFileChange = async (
    field: keyof T,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      alert("Format file harus JPG, PNG, GIF, atau WebP");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Ukuran file maksimal 5MB");
      return;
    }

    // Show crop modal
    const reader = new FileReader();
    reader.onloadend = () => {
      setCropImage(reader.result as string);
      setCurrentImageField(field);
      setShowCropModal(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = (croppedImageUrl: string) => {
    if (currentImageField) {
      setImagePreview(croppedImageUrl);
      handleChange(currentImageField, croppedImageUrl);
      setShowCropModal(false);
      setCropImage(null);
      setCurrentImageField(null);
    }
  };

  const isFormValid = () => {
    return fields
      .filter((field) => field.required)
      .every((field) => formData[field.name]);
  };

  return (
    <>
      {/* Crop Modal */}
      {cropImage && (
        <CropModal
          imageSrc={cropImage}
          isOpen={showCropModal}
          onClose={() => {
            setShowCropModal(false);
            setCropImage(null);
            setCurrentImageField(null);
          }}
          onCropComplete={handleCropComplete}
        />
      )}

      <Modal
        isOpen={isOpen && !showCropModal}
        onClose={() => {
          setFormData({});
          setImagePreview(null);
          setCropImage(null);
          setCurrentImageField(null);
          onClose();
        }}
        title={
          <>
            <Plus className="w-6 h-6" /> {title}
          </>
        }
        actions={
          <button
            onClick={handleSubmit}
            disabled={!isFormValid() || isSubmitting}
            className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 bg-purple-600 text-white rounded-lg sm:rounded-xl font-bold hover:bg-purple-700 shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition text-sm sm:text-base"
          >
            <Save className="w-4 h-4 sm:w-5 sm:h-5 inline mr-1 sm:mr-2" />
            {isSubmitting ? "Menyimpan..." : "Simpan"}
          </button>
        }
      >
        <div className="space-y-3 sm:space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200">
              <p className="text-xs sm:text-sm text-red-600">{error}</p>
            </div>
          )}
          {fields.map((field) => (
            <div key={field.name as string}>
              <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1.5 sm:mb-2">
                {field.label}
                {field.required && <span className="text-red-500">*</span>}
              </label>
              {field.type === "select" ? (
                <Select
                  options={field.options?.map((opt) => ({
                    value: opt.value,
                    label: opt.label,
                  }))}
                  isMulti={field.isMulti}
                  value={
                    field.isMulti
                      ? field.options?.filter((opt) =>
                          (formData[field.name] as number[])?.includes(
                            opt.value as number
                          )
                        ) || []
                      : field.options?.find(
                          (opt) => opt.value === formData[field.name]
                        ) || null
                  }
                  onChange={(selected) => {
                    if (field.isMulti) {
                      handleChange(
                        field.name,
                        Array.isArray(selected)
                          ? selected.map((s) => s.value)
                          : []
                      );
                    } else {
                      handleChange(
                        field.name,
                        (selected as { value: number | string })?.value ?? ""
                      );
                    }
                  }}
                  placeholder={`Pilih ${field.label}...`}
                  isSearchable
                  isClearable
                  classNamePrefix="react-select"
                  styles={{
                    control: (base) => ({
                      ...base,
                      borderColor: error ? "#ef4444" : "#d1d5db",
                      "&:hover": { borderColor: error ? "#ef4444" : "#a855f7" },
                      borderRadius: "0.75rem",
                      minHeight: "3rem",
                    }),
                  }}
                />
              ) : field.type === "file" ? (
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <label className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-3 bg-white border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition cursor-pointer">
                      <Upload className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                      <span className="text-xs sm:text-sm font-medium text-gray-700">
                        Pilih Gambar
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(field.name, e)}
                        className="hidden"
                      />
                    </label>
                    {imagePreview && (
                      <button
                        type="button"
                        onClick={() => {
                          setImagePreview(null);
                          handleChange(field.name, "");
                        }}
                        className="p-1.5 sm:p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Hapus gambar"
                      >
                        <X className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    )}
                  </div>
                  {imagePreview && (
                    <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-lg overflow-hidden border-2 border-gray-200">
                      <Image
                        src={imagePreview}
                        alt="Preview"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  )}
                  <p className="text-[10px] sm:text-xs text-gray-500">
                    Format: JPG, PNG, GIF, WebP | Ukuran maksimal: 5MB
                  </p>
                </div>
              ) : field.type === "textarea" ? (
                <textarea
                  value={String(formData[field.name] || "")}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  placeholder={field.placeholder}
                  rows={4}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white text-gray-800 text-sm sm:text-base rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none transition resize-y"
                />
              ) : (
                <input
                  type={field.type}
                  value={String(formData[field.name] || "")}
                  onChange={(e) =>
                    handleChange(
                      field.name,
                      field.type === "number"
                        ? Number(e.target.value)
                        : e.target.value
                    )
                  }
                  placeholder={field.placeholder}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white text-gray-800 text-sm sm:text-base rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none transition"
                />
              )}
            </div>
          ))}
        </div>
      </Modal>
    </>
  );
}
