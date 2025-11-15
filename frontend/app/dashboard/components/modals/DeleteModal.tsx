"use client";
import React, { useState } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import Modal from "./modal";

interface DeleteModalProps<T> {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  item: T | null;
  itemLabel: keyof T;
  message?: string;
}

export function DeleteModal<T extends Record<string, unknown>>({
  isOpen,
  onClose,
  onConfirm,
  title,
  item,
  itemLabel,
  message,
}: DeleteModalProps<T>) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    try {
      setIsDeleting(true);
      await onConfirm();
      onClose();
    } catch (error) {
      console.error("Error deleting item:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <>
          <Trash2 className="w-6 h-6" /> {title}
        </>
      }
      isDanger={true}
      actions={
        <button
          onClick={handleConfirm}
          disabled={isDeleting}
          className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition text-base"
        >
          <Trash2 className="w-5 h-5 inline mr-2" />
          {isDeleting ? "Menghapus..." : "Ya, Hapus Permanen"}
        </button>
      }
    >
      <div className="flex items-start gap-4 p-4 bg-red-50 border border-red-300 rounded-lg">
        <AlertTriangle className="w-6 h-6 text-red-500 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-gray-900 font-semibold mb-1">Perhatian!</p>
          <p className="text-gray-700">
            {message || (
              <>
                Anda yakin ingin menghapus{" "}
                {item ? `**${item[itemLabel]}**` : ""} ? Aksi ini akan menghapus
                data secara permanen.
              </>
            )}
          </p>
        </div>
      </div>
    </Modal>
  );
}
