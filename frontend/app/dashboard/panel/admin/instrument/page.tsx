"use client";
import React, { useState, useEffect, useMemo } from "react";
import { Music, Plus, Edit2, Search } from "lucide-react";
import InstrumenIcon from "@/app/dashboard/components/InstrumenIcon";
import { CreateModal, EditModal } from "@/app/dashboard/components/modals";
import Pagination from "@/app/dashboard/components/pagination";
import PerPageSelect from "@/app/dashboard/components/SelectPerPage";

import api from "@/lib/axios";

// Table content component to handle different states - GRID CARD VERSION
const TableContent = ({
  isLoading,
  filteredInstruments,
  openEditModal,
  currentPage,
  itemsPerPage,
}: {
  isLoading: boolean;
  filteredInstruments: Instrument[];
  openEditModal: (instrument: Instrument) => void;
  currentPage: number;
  itemsPerPage: number;
}) => {
  if (isLoading) {
    return (
      <div className="col-span-full flex flex-col items-center justify-center py-20">
        <div className="flex items-center justify-center space-x-3">
          <div className="w-3 h-3 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full animate-bounce"></div>
          <div
            className="w-3 h-3 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full animate-bounce"
            style={{ animationDelay: "0.2s" }}
          ></div>
          <div
            className="w-3 h-3 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full animate-bounce"
            style={{ animationDelay: "0.4s" }}
          ></div>
        </div>
        <p className="mt-4 text-sm font-medium text-gray-600">
          Memuat data instrumen...
        </p>
      </div>
    );
  }

  if (filteredInstruments.length === 0) {
    return (
      <div className="col-span-full flex flex-col items-center justify-center py-20">
        <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-2xl flex items-center justify-center mb-4">
          <Music className="w-10 h-10 text-purple-400" />
        </div>
        <p className="text-lg font-bold text-gray-900">
          Tidak ada instrumen yang ditemukan
        </p>
        <p className="text-sm text-gray-500 mt-1">
          Coba kata kunci lain atau tambahkan instrumen baru
        </p>
      </div>
    );
  }

  return (
    <>
      {filteredInstruments.map((instrument, index) => (
        <div
          key={instrument.id}
          className="group relative bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 hover:border-purple-300 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
        >
          {/* Background Gradient Accent */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-50/40 to-indigo-50/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

          {/* Content */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Icon Container */}
              <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <InstrumenIcon
                  instrumentName={instrument.name || ""}
                  className="w-8 h-8 text-white"
                />
              </div>

              {/* Text Content */}
              <div className="flex-1">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 group-hover:text-black">
                  Instrumen
                </p>
                <h3 className="text-lg font-bold text-gray-900 capitalize group-hover:text-purple-600 transition-colors">
                  {instrument.name}
                </h3>
              </div>
            </div>

            <button
              onClick={() => openEditModal(instrument)}
              className="opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300 p-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl text-gray-600 hover:text-purple-600 shadow-sm hover:shadow-md"
              title="Edit Instrumen"
            >
              <Edit2 className="w-4 h-4 text-blue-700" />
            </button>
          </div>

          {/* Number Badge */}
          <div className="absolute -top-3 -left-3 w-8 h-8 bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-lg">
            {currentPage * itemsPerPage + index + 1}
          </div>
        </div>
      ))}
    </>
  );
};

interface ApiErrorResponse {
  success?: boolean;
  message?: string;
  error?: string;
}

interface Instrument extends Record<string, unknown> {
  id: string;
  name: string;
  createdAt: string;
}

// Simulated instrument service for API interactions
const instrumentService = {
  async getInstruments(): Promise<Instrument[]> {
    try {
      const response = await api.get(`/admin/instruments`);
      return response.data.data || [];
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Unknown error occurred"
      );
    }
  },

  async createInstrument(name: string): Promise<Instrument> {
    try {
      const response = await api.post("/admin/instruments", { name });

      // Jika success: false → throw
      if (response.data.success === false) {
        throw new Error(response.data.message || "Gagal menambahkan");
      }

      return response.data.data;
    } catch (error: unknown) {
      console.error("Create instrument error:", error);

      // TYPE GUARD: cek apakah error punya response
      if (error && typeof error === "object" && "response" in error) {
        const err = error as {
          response?: { status?: number; data?: ApiErrorResponse };
        };
        const status = err.response?.status;
        const data = err.response?.data;

        console.log("Response status:", status, "Data:", data);

        // Handle 500 error dengan pesan duplikat
        if (
          status === 500 &&
          (data?.message?.includes("duplikat") ||
            data?.error?.includes("duplikat"))
        ) {
          throw new Error("Nilai duplikat, silakan gunakan yang lain");
        }

        // Handle pesan dari backend
        if (data?.message) {
          throw new Error(data.message);
        }
        if (data?.error) {
          throw new Error(
            typeof data.error === "string"
              ? data.error
              : "Gagal menambahkan instrumen"
          );
        }
      }

      // Fallback
      throw new Error("Gagal menambahkan instrumen");
    }
  },

  async updateInstrument(id: string, name: string): Promise<Instrument> {
    try {
      const response = await api.put(`/admin/instruments/modify/${id}`, {
        name,
      });
      return response.data.data;
    } catch (error: unknown) {
      console.error("Update instrument error:", error);

      const err = error as {
        response?: { status?: number; data?: ApiErrorResponse };
      };
      const status = err.response?.status;
      const data = err.response?.data;

      // Handle 500 error dengan pesan duplikat
      if (
        status === 500 &&
        (data?.message?.includes("duplikat") ||
          data?.error?.includes("duplikat"))
      ) {
        throw new Error("Nilai duplikat, silakan gunakan yang lain");
      }

      // Handle pesan dari backend
      if (data?.message) {
        throw new Error(data.message);
      }
      if (data?.error) {
        throw new Error(
          typeof data.error === "string"
            ? data.error
            : "Gagal mengubah instrumen"
        );
      }

      throw new Error("Gagal mengubah instrumen");
    }
  },
};

export default function AdminInstrumentManagement() {
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const filteredInstruments = instruments.filter((inst) =>
    (inst?.name || "").toLowerCase().includes((searchQuery || "").toLowerCase())
  );
  const [itemsPerPage, setItemsPerPage] = useState(4);
  const totalItems = filteredInstruments.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [editingInstrument, setEditingInstrument] = useState<Instrument | null>(
    null
  );

  useEffect(() => {
    const fetchInstruments = async () => {
      setIsLoading(true);
      try {
        const data = await instrumentService.getInstruments();
        if (Array.isArray(data)) {
          setInstruments(data);
          setError(null);
        } else {
          setInstruments([]);
          setError("Invalid data format received from server");
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load instruments"
        );
        setInstruments([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInstruments();
  }, []);

  // Auto-clear success message after 3 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // --- Fungsi CRUD ---

  const handleAddInstrument = async (data: { name?: string }) => {
    const name = data?.name?.trim();
    if (!name) {
      setError("Nama instrumen tidak boleh kosong");
      throw new Error("Nama instrumen tidak boleh kosong");
    }

    // Validasi hanya huruf (dan spasi), tidak boleh ada angka
    const hasNumber = /\d/.test(name);
    if (hasNumber) {
      setError(
        "Nama instrumen hanya boleh mengandung huruf, tidak boleh ada angka"
      );
      throw new Error(
        "Nama instrumen hanya boleh mengandung huruf, tidak boleh ada angka"
      );
    }

    setError(null); // Clear error saat mulai submit
    setSuccess(null); // Clear success
    setIsLoading(true);
    try {
      await instrumentService.createInstrument(name);
      const freshData = await instrumentService.getInstruments();
      setInstruments(freshData);
      setError(null);
      setSuccess(`Instrumen "${name}" berhasil ditambahkan`); // SUCCESS MESSAGE
      setIsAddModalOpen(false); // TUTUP MODAL SETELAH BERHASIL
    } catch (err: unknown) {
      let message = "Gagal menambahkan instrumen";

      if (err instanceof Error) {
        message = err.message;
      } else if (err && typeof err === "object" && "response" in err) {
        const data = (err as { response?: { data?: ApiErrorResponse } })
          .response?.data;
        if (data?.message?.includes("duplikat")) {
          message = "Nilai duplikat, silakan gunakan yang lain";
        } else if (data?.message) {
          message = data.message;
        }
      }

      setError(message); // TAMPILKAN ERROR DI MODAL
      throw new Error(message); // THROW AGAR MODAL TAHU ADA ERROR
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditInstrument = async (updatedData: Instrument) => {
    const trimmedName = updatedData.name?.trim();
    const instrumentId = updatedData.id;

    if (!trimmedName || !instrumentId) {
      setError("Nama instrumen tidak boleh kosong");
      throw new Error("Nama instrumen tidak boleh kosong");
    }

    // Validasi hanya huruf (dan spasi), tidak boleh ada angka
    const hasNumber = /\d/.test(trimmedName);
    if (hasNumber) {
      setError(
        "Nama instrumen hanya boleh mengandung huruf, tidak boleh ada angka"
      );
      throw new Error(
        "Nama instrumen hanya boleh mengandung huruf, tidak boleh ada angka"
      );
    }

    setError(null); // Clear error saat mulai submit
    setSuccess(null); // Clear success
    setIsLoading(true);

    try {
      await instrumentService.updateInstrument(instrumentId, trimmedName);
      const freshData = await instrumentService.getInstruments();
      setInstruments([...freshData]);
      setError(null);
      setSuccess(`Instrumen berhasil diubah menjadi "${trimmedName}"`); // SUCCESS MESSAGE
      setEditingInstrument(null);
      setIsEditModalOpen(false); // TUTUP MODAL SETELAH BERHASIL
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Gagal mengubah instrumen";
      setError(message); // TAMPILKAN ERROR DI MODAL
      throw new Error(message); // THROW AGAR MODAL TAHU ADA ERROR
    } finally {
      setIsLoading(false);
    }
  };

  const openEditModal = (instrument: Instrument) => {
    setEditingInstrument({ ...instrument });
    setIsEditModalOpen(true);
  };

  const paginatedInstruments = useMemo(() => {
    const start = currentPage * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredInstruments.slice(start, end);
  }, [filteredInstruments, currentPage, itemsPerPage]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 text-gray-800 font-inter">
      {/* SUCCESS NOTIFICATION */}
      {success && (
        <div className="fixed top-4 right-4 z-50 max-w-md animate-in fade-in slide-in-from-top-2">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-300 rounded-2xl p-4 shadow-xl backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-lg">
                <svg
                  className="w-3.5 h-3.5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-green-800">{success}</p>
              </div>
              <button
                onClick={() => setSuccess(null)}
                className="text-green-600 hover:text-green-700 flex-shrink-0 transition"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-2 space-y-4">
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-gray-200">
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
            {/* Icon */}
            <div className="p-3 sm:p-4 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl shadow-lg flex-shrink-0">
              <Music className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
            </div>
            
            {/* Text Content */}
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900">
                Instrumen Musik
              </h1>
              <p className="text-gray-600 text-xs sm:text-sm md:text-base leading-relaxed mt-1">
                Kelola daftar instrumen musik yang tersedia di platform
              </p>
            </div>
          </div>
       
          
          {/* Stats Card (Modern Blue/Indigo) */}
          <div className="bg-gradient-to-br from-indigo-600 to-sky-500 rounded-2xl p-5 sm:p-6 shadow-2xl relative overflow-hidden mt-4">
          <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-indigo-500/20 rounded-full"></div>
          <div className="absolute right-4 top-4 w-20 h-20 bg-sky-400/10 rounded-full"></div>

          <div className="relative z-10 flex justify-between items-end">
            <div>
              <p className="text-xs sm:text-sm font-semibold text-white/90 mb-2 tracking-wider uppercase">
                Total Instrumen Terdaftar
              </p>
              <div className="flex items-center">
                <p className="text-3xl font-black text-white drop-shadow-md">
                  {instruments.length}
                </p>
                <span className="ml-2 text-sm sm:text-base md:text-xl text-white/80">
                  alat musik
                </span>
              </div>
            </div>
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white/50">
              <Music className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
          </div>
        </div>
         </div>

        {/* Content Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-300">
          {/* Header */}
          <div className="px-6 sm:px-8 py-7 border-b rounded-t-2xl border-gray-300 bg-gradient-to-r from-gray-50 to-gray-100/50">
            <div className="space-y-5">
              {/* Title & Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Kiri: Judul + counter */}
                <div className="flex-1 min-w-0">
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">
                    Daftar Instrumen
                  </h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {filteredInstruments.length} instrumen tersedia
                  </p>
                </div>

                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="flex items-center justify-center gap-2.5 px-5 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 
                  hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl 
                  shadow-lg shadow-purple-500/30 hover:shadow-xl hover:scale-105 active:scale-95 
                  transition-all duration-300 whitespace-nowrap min-w-[140px] sm:min-w-0"
                >
                  <Plus className="w-5 h-5" />
                  <span className="hidden xs:inline">Tambah Instrumen</span>
                  <span className="xs:hidden">Tambah</span>
                </button>
              </div>

              {/* Search & Filter */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Cari nama instrumen..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white text-gray-900 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none transition duration-200 shadow-sm placeholder-gray-400"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Tampilkan:
                  </label>
                  <PerPageSelect
                    value={itemsPerPage}
                    onChange={(val) => {
                      setItemsPerPage(val);
                      setCurrentPage(0);
                    }}
                    options={[4, 8, 20, 100]}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Grid Content */}
          <div className="p-6 sm:p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              <TableContent
                isLoading={isLoading}
                filteredInstruments={paginatedInstruments}
                openEditModal={openEditModal}
                itemsPerPage={itemsPerPage}
                currentPage={currentPage}
              />
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pt-2 border-t border-gray-100">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  itemsPerPage={itemsPerPage}
                  totalItems={totalItems}
                />
              </div>
            )}
          </div>
        </div>
      </main>

      {/* --- MODAL TAMBAH (Create) --- */}
      <CreateModal<{ name: string }>
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setError(null);
        }}
        onSubmit={handleAddInstrument}
        title="Tambah Instrumen Baru"
        error={error}
        fields={[
          {
            name: "name",
            label: "Nama Instrumen",
            type: "text",
            placeholder: "Contoh: Guitar, Drum, Trumpet...",
            required: true,
          },
        ]}
      />

      {/* --- MODAL EDIT (Update) --- */}
      <EditModal<Instrument>
        isOpen={isEditModalOpen}
        error={error}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingInstrument(null);
          setError(null); // ← CLEAR ERROR SAAT TUTUP EDIT MODAL
        }}
        onSubmit={handleEditInstrument}
        title="Edit Instrumen"
        initialData={editingInstrument || { id: "", name: "", createdAt: "" }}
        fields={[
          {
            name: "name",
            label: "Nama Instrumen",
            type: "text",
            required: true,
          },
        ]}
      />
    </div>
  );
}
