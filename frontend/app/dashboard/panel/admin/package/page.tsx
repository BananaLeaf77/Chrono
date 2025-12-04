"use client";
import React, { useState, useEffect, useMemo } from "react";
import {
  Package2,
  Plus,
  Edit2,
  Search,
  Music,
  AlertTriangle,
} from "lucide-react";
import InstrumenIcon from "@/app/dashboard/components/InstrumenIcon";
import { CreateModal, EditModal, PackageDetailModal } from "@/app/dashboard/components/modals";
import Pagination from "@/app/dashboard/components/pagination";
import PerPageSelect from "@/app/dashboard/components/SelectPerPage";
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

const GridContent = ({
  isLoading,
  error,
  filteredPackages,
  openEditModal,
  openDetailModal,
  currentPage,
  itemsPerPage,
}: {
  isLoading: boolean;
  error: string | null;
  filteredPackages: Package[];
  openEditModal: (pkg: Package) => void;
  openDetailModal: (pkg: Package) => void;
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
          Memuat data paket...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="col-span-full flex flex-col items-center justify-center py-20">
        <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-orange-100 rounded-2xl flex items-center justify-center mb-4">
          <AlertTriangle className="w-10 h-10 text-red-400" />
        </div>
        <p className="text-lg font-bold text-gray-900">{error}</p>
        <p className="text-sm text-gray-500 mt-1">
          Silakan coba muat ulang halaman
        </p>
      </div>
    );
  }

  if (filteredPackages.length === 0) {
    return (
      <div className="col-span-full flex flex-col items-center justify-center py-20">
        <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-2xl flex items-center justify-center mb-4">
          <Package2 className="w-10 h-10 text-purple-400" />
        </div>
        <p className="text-lg font-bold text-gray-900">
          Tidak ada paket yang ditemukan
        </p>
        <p className="text-sm text-gray-500 mt-1">
          Coba kata kunci lain atau tambahkan paket baru
        </p>
      </div>
    );
  }

  return (
    <>
      {filteredPackages.map((pkg, index) => (
        <div
          key={pkg.id}
          className="group relative bg-white border border-gray-200 rounded-2xl p-4 hover:border-purple-300 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col"
        >
          {/* Background Gradient Accent */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-indigo-50/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

          {/* Edit Button - Top Right (Absolute) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              openEditModal(pkg);
            }}
            className="absolute top-3 right-3 z-20 p-1.5 bg-white/80 hover:bg-white border border-gray-200 hover:border-blue-300 rounded-lg text-gray-400 hover:text-blue-600 shadow-sm hover:shadow-md transition-all duration-200 opacity-0 group-hover:opacity-100"
            title="Edit Paket"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>

          {/* Number Badge */}
          <div className="absolute -top-2 -left-2 w-6 h-6 bg-white border border-purple-100 text-purple-600 rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm z-20 group-hover:text-white group-hover:bg-blue-600">
            {currentPage * itemsPerPage + index + 1}
          </div>

          {/* Content */}
          <div className="relative z-10 h-full flex flex-col">
            <div className="flex gap-4">
              {/* Left: Icon */}
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-md shadow-purple-500/20 group-hover:scale-105 transition-transform duration-300">
                  <InstrumenIcon
                    instrumentName={pkg.instrument?.name || ""}
                    className="w-6 h-6 text-white"
                  />
                </div>
              </div>

              {/* Right: Info Header */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider bg-purple-50 px-1.5 py-0.5 rounded-md">
                    {pkg.instrument?.name || "Umum"}
                  </span>
                  <span className="text-[10px] font-medium text-gray-400 group-hover:text-black transition-colors">
                    {pkg.quota} Sesi
                  </span>
                </div>
                <h3 className="text-base font-bold text-gray-900 leading-tight line-clamp-1 group-hover:text-purple-700 transition-colors">
                  {pkg.name}
                </h3>
              </div>
            </div>

            {/* Description & Action - Full Width */}
            <div className="mt-3 pl-1">
              <p className="text-xs text-gray-500 inline leading-relaxed">
                {pkg.description
                  ? pkg.description.split(" ").slice(0, 4).join(" ") + "..."
                  : "Detail paket..."}{" "}
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openDetailModal(pkg);
                }}
                className="text-xs font-medium text-gray-600 hover:text-blue-700 hover:underline inline-flex items-center gap-1"
              >
                Selengkapnya
              </button>
            </div>
          </div>
        </div>
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

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(4);

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

  // --- Fungsi Filter ---
  const filteredPackages = packages.filter(
    (pkg) =>
      pkg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pkg.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pkg.instrument?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalItems = filteredPackages.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const paginatedPackages = useMemo(() => {
    const start = currentPage * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredPackages.slice(start, end);
  }, [filteredPackages, currentPage, itemsPerPage]);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);

  const openDetailModal = (pkg: Package) => {
    setSelectedPackage(pkg);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 text-gray-800 font-inter">
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

      <main className="max-w-7xl mx-auto px-2 space-y-4">
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-gray-200">
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
            {/* Icon */}
            <div className="p-3 sm:p-4 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl shadow-lg flex-shrink-0">
              <Package2 className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
            </div>
            
            {/* Text Content */}
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900">
                Paket Pembelajaran
              </h1>
              <p className="text-gray-600 text-xs sm:text-sm md:text-base leading-relaxed mt-1">
                Kelola paket pembelajaran untuk setiap instrumen musik yang tersedia di platform
              </p>
            </div>
          </div>

          {/* Stats Card */}
          <div className="bg-gradient-to-br from-indigo-600 to-sky-500 rounded-2xl p-3 shadow-2xl relative overflow-hidden mt-4">
            <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-indigo-500/20 rounded-full"></div>
            <div className="absolute right-4 top-4 w-20 h-20 bg-sky-400/10 rounded-full"></div>

            <div className="relative z-10 flex justify-between items-end">
              <div>
                <p className="text-xs sm:text-sm font-semibold text-white/90 mb-2 tracking-wider uppercase">
                  Total Paket Terdaftar
                </p>
                <div className="flex items-center">
                  <p className="text-3xl font-black text-white drop-shadow-md">
                    {packages.length}
                  </p>
                  <span className="ml-2 text-sm sm:text-base md:text-2xl text-white/80">
                    paket
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white/50">
                <Package2 className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
            </div>
          </div>
        </div>
        

        {/* Content Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="px-6 sm:px-8 py-8 border border-gray-300  rounded-t-3xl bg-gradient-to-r from-gray-50 to-gray-100/50">
            <div className="space-y-5">
              {/* Title & Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Kiri: Judul + counter */}
                <div className="flex-1 min-w-0">
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">
                    Daftar Paket
                  </h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {filteredPackages.length} paket tersedia
                  </p>
                </div>

                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="flex items-center justify-center gap-2.5 px-5 py-3 
                 bg-gradient-to-r from-purple-600 to-indigo-600 
                 hover:from-purple-700 hover:to-indigo-700 
                 text-white font-bold rounded-xl 
                 shadow-lg shadow-purple-500/30 
                 hover:shadow-xl hover:scale-105 
                 active:scale-95 
                 transition-all duration-300 
                 whitespace-nowrap
                 min-w-[140px] sm:min-w-0"
                >
                  <Plus className="w-5 h-5" />
                  <span className="hidden xs:inline">Tambah Paket</span>
                  <span className="xs:hidden">Tambah</span>
                </button>
              </div>

              {/* Search & Filter */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Cari nama paket atau instrumen..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(0);
                    }}
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
              <GridContent
                isLoading={isLoading}
                error={error}
                filteredPackages={paginatedPackages}
                openEditModal={openEditModal}
                openDetailModal={openDetailModal}
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

      {/* Detail Modal */}
      <PackageDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedPackage(null);
        }}
        packageData={selectedPackage}
      />
    </div>
  );
}
