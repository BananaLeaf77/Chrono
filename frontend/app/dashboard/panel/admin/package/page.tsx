"use client";
import React, { useState, useEffect } from "react";
import {
  Package2,
  Plus,
  Edit2,
  Search,
  Music,
  AlertTriangle,
} from "lucide-react";
import { CreateModal, EditModal } from "@/app/dashboard/components/modals";
import api from "@/lib/axios";

// Interface untuk data Package
interface Package {
  id: number;
  name: string;
  quota: number;
  description: string;
  instrument_id: number;
  instrument?: {
    id: number;
    name: string;
  };
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

interface Instrument {
  id: number;
  name: string;
}

// Table content component
const TableContent = ({
  isLoading,
  error,
  filteredPackages,
  openEditModal,
  openDeleteModal,
}: {
  isLoading: boolean;
  error: string | null;
  filteredPackages: Package[];
  openEditModal: (pkg: Package) => void;
  openDeleteModal: (pkg: Package) => void;
}) => {
  if (isLoading) {
    return (
      <tr>
        <td colSpan={6} className="px-6 py-20 text-center text-gray-500">
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
          <p className="mt-4 text-sm">Memuat data paket...</p>
        </td>
      </tr>
    );
  }

  if (error) {
    return (
      <tr>
        <td colSpan={6} className="px-6 py-20 text-center text-red-500">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <p className="text-lg font-semibold">{error}</p>
          <p className="text-sm text-gray-400 mt-1">
            Silakan coba muat ulang halaman
          </p>
        </td>
      </tr>
    );
  }

  if (filteredPackages.length === 0) {
    return (
      <tr>
        <td colSpan={6} className="px-6 py-20 text-center text-gray-500">
          <Package2 className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <p className="text-lg font-semibold">
            Tidak ada paket yang cocok dengan pencarian Anda.
          </p>
          <p className="text-sm text-gray-400 mt-1">
            Coba kata kunci lain atau tambahkan paket baru.
          </p>
        </td>
      </tr>
    );
  }

  return (
    <>
      {filteredPackages.map((pkg, index) => (
        <tr
          key={pkg.id}
          className="hover:bg-purple-50/50 transition duration-150"
        >
          <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-600">
            {index + 1}
          </td>
          <td className="px-4 sm:px-6 py-3 whitespace-nowrap">
            <div className="flex items-center gap-3">
              <span className="text-sm sm:text-base font-semibold text-gray-900">
                {pkg.name}
              </span>
            </div>
          </td>
          <td className="px-4 sm:px-6 py-3 whitespace-nowrap">
            <div className="flex items-center">
              <Music className="w-4 h-4 text-purple-600 mr-2" />
              <span className="text-sm text-gray-600">
                {pkg.instrument?.name || "Tidak ada"}
              </span>
            </div>
          </td>
          <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-sm text-gray-600">
            {pkg.quota} pertemuan
          </td>
          <td className="px-4 sm:px-6 py-3 whitespace-nowrap">
            <div className="max-w-xs truncate text-sm text-gray-500">
              {pkg.description || "-"}
            </div>
          </td>
          <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-right">
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => openEditModal(pkg)}
                className="p-1.5 sm:p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition shadow hover:shadow-lg transform hover:scale-105 active:scale-100"
                title="Edit Paket"
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

const packageService = {
  async getPackages(): Promise<Package[]> {
    try {
      const response = await api.get("/admin/packages");
      return response.data.data || [];
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Unknown error occurred"
      );
    }
  },

  async createPackage(data: Partial<Package>): Promise<Package> {
    try {
      const response = await api.post("/admin/packages", data);
      return response.data.data;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Unknown error occurred"
      );
    }
  },

  async updatePackage(id: number, data: Partial<Package>): Promise<void> {
    try {
      await api.put(`/admin/packages/modify/${id}`, data);
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Unknown error occurred"
      );
    }
  },

  async deletePackage(id: number): Promise<void> {
    try {
      await api.delete(`/admin/packages/${id}`);
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Unknown error occurred"
      );
    }
  },

  async getAllInstruments(): Promise<Instrument[]> {
    try {
      const response = await api.get("/admin/instruments");
      return response.data.data || [];
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Unknown error occurred"
      );
    }
  },
};

export default function AdminPackageManagement() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
 
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [packageToDelete, setPackageToDelete] = useState<Package | null>(null);

  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [packagesData, instrumentsData] = await Promise.all([
          packageService.getPackages(),
          packageService.getAllInstruments(),
        ]);
        setPackages(packagesData);
        setInstruments(instrumentsData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
        setPackages([]);
        setInstruments([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
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
  const handleAddPackage = async (data: Partial<Package>) => {
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        ...data,
        instrument_id: Number(data.instrument_id),
        quota: Number(data.quota),
      };
      await packageService.createPackage(payload);
      const freshData = await packageService.getPackages();
      setPackages(freshData);
      setSuccess(`Paket "${data.name}" berhasil ditambahkan`);
      setIsAddModalOpen(false);
    } catch (err: unknown) {
      let message = "nama paket sudah digunakan";
      const error = err as {
        response?: { data?: { error?: { code: string; message: string } } };
      };
      if (error?.response?.data?.error?.code === "23505") {
        message = "Data sudah ada, gunakan nilai lain";
      } else if (error?.response?.data?.error?.message) {
        message = error.response.data.error.message;
      }
      setError(message);
      throw new Error(message);
    }
  };

  const handleEditPackage = async (data: Package) => {
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        ...data,
        instrument_id: Number(data.instrument_id),
        quota: Number(data.quota),
      };
      await packageService.updatePackage(data.id, payload);
      const freshData = await packageService.getPackages();
      setPackages(freshData);
      setSuccess(`Paket "${data.name}" berhasil diperbarui`);
      setIsEditModalOpen(false);
      setEditingPackage(null);
    } catch (err: unknown) {
      let message = "Gagal mengubah paket";
      const error = err as {
        response?: { data?: { error?: { code: string; message: string } } };
      };
      if (error?.response?.data?.error?.code === "23505") {
        message = "Data sudah ada, gunakan nilai lain";
      } else if (error?.response?.data?.error?.message) {
        message = error.response.data.error.message;
      }
      setError(message);
      throw new Error(message);
    }
  };


  const openEditModal = (pkg: Package) => {
    setEditingPackage(pkg);
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (pkg: Package) => {
    setPackageToDelete(pkg);
  };

  // --- Fungsi Filter ---
  const filteredPackages = packages.filter(
    (pkg) =>
      pkg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pkg.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pkg.instrument?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            <Package2 className="w-8 h-8 text-purple-600" />
            Manajemen Paket Pembelajaran
          </h1>
          <p className="text-gray-500 mt-1">
            Kelola paket pembelajaran untuk setiap instrumen musik yang
            tersedia.
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
                    TOTAL PAKET
                  </p>
                  <div className="flex items-center">
                    <p className="md:text-4xl text-2xl font-black text-white">
                      {packages.length}
                    </p>
                    <span className="ml-1 text-xl text-white">paket</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Package2 className="w-6 h-6 text-white" />
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
                  Daftar Paket{" "}
                  <span className="text-purple-600">
                    ({filteredPackages.length})
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
                  placeholder="Cari nama paket atau instrumen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white text-gray-800 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none transition duration-150 shadow-sm"
                />
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
                    Nama Paket
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Instrumen
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Kuota
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Deskripsi
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
                  filteredPackages={filteredPackages}
                  openEditModal={openEditModal}
                  openDeleteModal={openDeleteModal}
                />
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Create Modal */}
      <CreateModal<Partial<Package>>
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setError(null);
          setSuccess(null);
        }}
        onSubmit={handleAddPackage}
        title="Tambah Paket Baru"
        error={error}
        fields={[
          {
            name: "name",
            label: "Nama Paket",
            type: "text",
            placeholder: "Masukkan nama paket...",
            required: true,
          },
          {
            name: "instrument_id",
            label: "Instrumen",
            type: "select",
            options: instruments.map((inst) => ({
              value: inst.id,
              label: inst.name,
            })),
            required: true,
          },
          {
            name: "quota",
            label: "Kuota Pertemuan",
            type: "number",
            placeholder: "Masukkan jumlah pertemuan...",
            required: true,
          },
          {
            name: "description",
            label: "Deskripsi",
            type: "textarea",
            placeholder: "Masukkan deskripsi paket...",
          },
        ]}
      />

      {/* Edit Modal */}
      <EditModal<Package>
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingPackage(null);
          setError(null);
          setSuccess(null);
        }}
        onSubmit={handleEditPackage}
        title="Edit Paket"
        error={error}
        initialData={
          editingPackage || {
            id: 0,
            name: "",
            quota: 0,
            description: "",
            instrument_id: 0,
          }
        }
        fields={[
          {
            name: "name",
            label: "Nama Paket",
            type: "text",
            required: true,
          },
          {
            name: "instrument_id",
            label: "Instrumen",
            type: "select",
            options: instruments.map((inst) => ({
              value: inst.id,
              label: inst.name,
            })),
            required: true,
          },
          {
            name: "quota",
            label: "Kuota Pertemuan",
            type: "number",
            required: true,
          },
          {
            name: "description",
            label: "Deskripsi",
            type: "textarea",
          },
        ]}
      />

      
    </div>
  );
}
