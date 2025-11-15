"use client";
import React, { useState } from "react";
import { Edit2, Save } from "lucide-react";
import Modal from "./modal";
import Select from "react-select";

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

  React.useEffect(() => {
    setFormData(initialData);
  }, [initialData]);

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      await onSubmit(formData);
      onClose();
    } catch (error) {
      // Jangan tutup modal saat error
      console.error("Error updating data:", error);
      // Jangan throw di sini, biarkan parent component handle via error prop
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

  const isFormValid = () => {
    return fields
      .filter((field) => field.required)
      .every((field) => formData[field.name]);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
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
                value={
                  field.options?.find(
                    (opt) => opt.value === formData[field.name]
                  ) || null
                }
                onChange={(selected) =>
                  handleChange(field.name, selected?.value ?? "")
                }
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
  );
}
