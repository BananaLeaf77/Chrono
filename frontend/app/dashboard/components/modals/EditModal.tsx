"use client";
import React, { useState } from "react";
import { Edit2, Save, Upload, X } from "lucide-react";
import Modal from "./modal";
import Select from "react-select";
import Image from "next/image";
import CropModal from "./CropModal";

interface EditModalProps<T> {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: T) => Promise<void>;
  title: string;
  error: string | null;
  initialData: T;
  fields: {
    name: keyof T;
    label: string;
    type: string;
    placeholder?: string;
    required?: boolean;
    options?: Array<{ value: number | string; label: string }>;
    isMulti?: boolean;
  }[];
}

export function EditModal<T extends Record<string, unknown>>({
  isOpen,
  onClose,
  onSubmit,
  title,
  initialData,
  fields,
  error,
}: EditModalProps<T>) {
  const [formData, setFormData] = useState<T>(initialData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [currentImageField, setCurrentImageField] = useState<keyof T | null>(null);

  React.useEffect(() => {
    setFormData(initialData);
    setImagePreview(null);
  }, [initialData]);

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      await onSubmit(formData);
      setImagePreview(null);
      setCropImage(null);
      setCurrentImageField(null);
      onClose();
    } catch (error) {
      console.error("Error updating data:", error);
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

    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      alert("Format file harus JPG, PNG, GIF, atau WebP");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Ukuran file maksimal 5MB");
      return;
    }

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
      .every((field) => {
        // For file fields in edit mode, don't require if there's existing data
        if (field.type === "file") {
          return true;
        }
        return formData[field.name];
      });
  };

  return (
    <>
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
          setImagePreview(null);
          setCropImage(null);
          setCurrentImageField(null);
          onClose();
        }}
        title={
          <>
            <Edit2 className="w-6 h-6" /> {title}
          </>
        }
        actions={
          <button
            onClick={handleSubmit}
            disabled={!isFormValid() || isSubmitting}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition text-base"
          >
            <Save className="w-5 h-5 inline mr-2" />
            {isSubmitting ? "Menyimpan..." : "Update"}
          </button>
        }
      >
        <div className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          {fields.map((field) => (
            <div key={field.name as string}>
              <label className="block text-sm font-bold text-gray-700 mb-2">
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
                        {imagePreview ? "Ganti Gambar" : "Upload Gambar Baru"}
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
                    {imagePreview
                      ? "Gambar baru akan diupload"
                      : "Opsional - Upload jika ingin mengganti foto"}
                  </p>
                </div>
              ) : field.type === "textarea" ? (
                <textarea
                  value={String(formData[field.name] || "")}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  placeholder={field.placeholder}
                  rows={4}
                  className="w-full px-4 py-3 bg-white text-gray-800 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition resize-y overflow-y-auto"
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
                  className="w-full px-4 py-3 bg-white text-gray-800 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition"
                />
              )}
            </div>
          ))}
        </div>
      </Modal>
    </>
  );
}
