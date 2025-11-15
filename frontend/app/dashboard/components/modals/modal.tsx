"use client";
import React from "react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children?: React.ReactNode;
  actions?: React.ReactNode;
  isDanger?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  actions,
  isDanger = false,
  size = "md",
}) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
  };

  const titleTextColor = isDanger ? "text-red-700" : "text-purple-700";

  return (
    <div className="fixed inset-0  flex items-center justify-center z-50 p-4 duration-300">
      <div
        className={`bg-white rounded-2xl border border-gray-300 shadow-2xl w-full ${sizeClasses[size]} transform scale-100 opacity-100 transition-all duration-300 ease-out`}
      >
        {/* Header Modal */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3
            className={`text-2xl font-extrabold ${titleTextColor} flex items-center gap-2`}
          >
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 transition rounded-full hover:bg-gray-100"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Isi Modal */}
        <div className="p-6">{children}</div>

        {/* Footer / Aksi Modal */}
        <div className="p-5 border-t border-gray-100 flex gap-3 bg-gray-50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition text-base border border-gray-300"
          >
            <X className="w-5 h-5 inline mr-2" />
            Batal
          </button>
          {actions} 
        </div>
      </div>
    </div>
  );
};

export default Modal;
