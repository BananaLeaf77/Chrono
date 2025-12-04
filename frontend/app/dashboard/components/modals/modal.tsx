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
   <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-2 sm:p-4 z-50">
      <div
        className={`bg-white rounded-xl sm:rounded-2xl border border-gray-300 shadow-2xl w-full ${sizeClasses[size]} transform scale-100 opacity-100 transition-all duration-300 ease-out max-h-[95vh] flex flex-col`}
      >
        {/* Header Modal */}
        <div className="p-4 sm:p-6 border-b border-gray-100 flex justify-between items-center flex-shrink-0">
          <h3
            className={`text-lg sm:text-2xl font-extrabold ${titleTextColor} flex items-center gap-2`}
          >
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 transition rounded-full hover:bg-gray-100 flex-shrink-0"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Isi Modal */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">{children}</div>

        {/* Footer / Aksi Modal */}
        <div className="p-3 sm:p-5 border-t border-gray-100 flex gap-2 sm:gap-3 bg-gray-50 rounded-b-xl sm:rounded-b-2xl flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 text-gray-700 rounded-lg sm:rounded-xl font-semibold hover:bg-gray-200 transition text-sm sm:text-base border border-gray-300"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5 inline mr-1 sm:mr-2" />
            Batal
          </button>
          {actions} 
        </div>
      </div>
    </div>
  );
};

export default Modal;
