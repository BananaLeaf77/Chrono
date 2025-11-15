"use client";
import React, { useState, useEffect, useMemo } from "react";
import { Music, Plus, Edit2, Search } from "lucide-react";
import InstrumenIcon from "@/app/dashboard/components/InstrumenIcon";
import { CreateModal, EditModal } from "@/app/dashboard/components/modals";
import Pagination from "@/app/dashboard/components/pagination";

import api from "@/lib/axios";

// Table content component to handle different states
const TableContent = ({
  isLoading,
  error,
  filteredInstruments,
  openEditModal,
  currentPage,
  itemsPerPage,
}: // openDeleteModal,
{
  isLoading: boolean;
  error: string | null;
  filteredInstruments: Instrument[];

  openEditModal: (instrument: Instrument) => void;
  currentPage: number;
  itemsPerPage: number;
  // openDeleteModal: (instrument: Instrument) => void;
}) => {
  if (isLoading) {
    return (
      <tr>
        <td colSpan={5} className="px-6 py-20 text-center text-gray-500">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-4 h-4 bg-purple-600 rounded-full animate-bounce"></div>
            <div
              className="w-4 h-4 bg-purple-600 rounded-full animate-bounce"
              style={{ animationDelay: "0.2s" }}
            ></div>
            <div
              className="w-4 h-4 bg-purple-600 rounded-full animate-bounce"
              style={{ animationDelay: "0.4s" }}
            ></div>
          </div>
          <p className="mt-4 text-sm">Memuat data instrumen...</p>
        </td>
      </tr>
    );
  }

  if (filteredInstruments.length === 0) {
    return (
      <tr>
        <td colSpan={5} className="px-6 py-20 text-center text-gray-500">
          <Music className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <p className="text-lg font-semibold">
            Tidak ada instrumen yang cocok dengan pencarian Anda.
          </p>
          <p className="text-sm text-gray-400 mt-1">
            Coba kata kunci lain atau tambahkan instrumen baru.
          </p>
        </td>
      </tr>
    );
  }

  return (
    <>
      {filteredInstruments.map((instrument, index) => (
        <tr
          key={instrument.id}
          className="hover:bg-purple-50/50 transition duration-150"
        >
          <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-600">
            {currentPage * itemsPerPage + index + 1}
          </td>
          <td className="px-4 sm:px-6 py-3 whitespace-nowrap">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex-shrink-0">
                  <InstrumenIcon
                    instrumentName={instrument.name || ""}
                    className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600"
                  />
                </div>
                <span className="text-sm sm:text-base font-semibold text-gray-900">
                  {instrument.name}
                </span>
              </div>
            </div>
          </td>
          <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-right">
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => openEditModal(instrument)}
                className="p-1.5 sm:p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition shadow hover:shadow-lg transform hover:scale-105 active:scale-100"
                title="Edit Instrumen"
              >
                <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>
          </td>
        </tr>
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
  const [itemsPerPage, setItemsPerPage] = useState(5);
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
    <div className="min-h-screen bg-gray-50 text-gray-800 font-inter">
      {/* SUCCESS NOTIFICATION */}
      {success && (
        <div className="fixed top-4 right-4 z-50 max-w-md animate-in fade-in slide-in-from-top-2">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg
                  className="w-3 h-3 text-white"
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
                <p className="text-sm font-semibold text-green-800">
                  {success}
                </p>
              </div>
              <button
                onClick={() => setSuccess(null)}
                className="text-green-600 hover:text-green-700 flex-shrink-0"
              >
                <svg
                  className="w-4 h-4"
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

      <main className="max-w-7xl mx-auto">
        {/* Judul Halaman */}
        <div className="mb-10 p-6 bg-white rounded-xl shadow-lg border-l-4 border-purple-600">
          <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3">
            <Music className="w-8 h-8 text-purple-600" />
            Manajemen Data Instrumen
          </h1>
          <p className="text-gray-500 mt-1">
            Dasbor admin untuk mengelola daftar instrumen musik yang tersedia.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="gap-4 mb-10">
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 shadow-lg relative overflow-hidden">
            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-purple-400/20 rounded-full"></div>
            <div className="absolute right-8 top-8 w-16 h-16 bg-purple-400/10 rounded-full"></div>

            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-white/90 mb-2 tracking-wider">
                    TOTAL INSTRUMEN
                  </p>
                  <div className="flex items-center">
                    <p className="md:text-4xl text-2xl font-black text-white">
                      {instruments.length}
                    </p>
                    <span className="ml-1 text-xl text-white">alat musik</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Music className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Table Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
          <div className="p-4 sm:p-6 border-b border-gray-100 bg-gray-50/80">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                  Daftar Instrumen{" "}
                  <span className="text-purple-600">
                    ({filteredInstruments.length})
                  </span>
                </h2>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 shadow-lg shadow-purple-300/50 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] active:scale-100"
                >
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">Tambah Baru</span>
                  <span className="sm:hidden">Tambah</span>
                </button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari nama instrumen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white text-gray-800 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none transition duration-150 shadow-sm"
                />
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-600">Show</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(0);
                  }}
                  className="bg-white border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {[5, 10, 50, 100].map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
                <span className="text-gray-600">entries</span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50/80">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    No
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Nama Instrumen
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                <TableContent
                  isLoading={isLoading}
                  error={error}
                  filteredInstruments={paginatedInstruments}
                  openEditModal={openEditModal}
                  itemsPerPage={itemsPerPage}
                  currentPage={currentPage}
                />
              </tbody>
            </table>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              totalItems={totalItems}
            />
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
