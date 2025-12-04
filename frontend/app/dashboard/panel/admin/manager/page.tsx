"use client";

import React, { useState, useEffect } from "react";
import {
  Edit2,
  Plus,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  Mail,
  Shield,
  Info,
} from "lucide-react";
import api from "@/lib/axios";
import {
  CreateModal,
  EditModal,
  ManagerDetailModal,
} from "@/app/dashboard/components/modals";
import PerPageSelect from "@/app/dashboard/components/SelectPerPage";

interface Manager extends Record<string, unknown> {
  id: string;
  uuid: string;
  name: string;
  email: string;
  phone: string;
  image?: string;
}

const GridContent = ({
  isLoading,
  error,
  filteredManagers,
  openEditModal,
  openManagerDetailModal,
  currentPage,
  itemsPerPage,
}: {
  isLoading: boolean;
  error: string | null;
  filteredManagers: Manager[];
  openEditModal: (manager: Manager) => void;
  openManagerDetailModal: (manager: Manager) => void;
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
          Memuat data manager...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="col-span-full flex flex-col items-center justify-center py-20">
        <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-orange-100 rounded-2xl flex items-center justify-center mb-4">
          <Info className="w-10 h-10 text-red-400" />
        </div>
        <p className="text-lg font-bold text-gray-900">{error}</p>
        <p className="text-sm text-gray-500 mt-1">
          Silakan coba muat ulang halaman
        </p>
      </div>
    );
  }

  if (filteredManagers.length === 0) {
    return (
      <div className="col-span-full flex flex-col items-center justify-center py-20">
        <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-2xl flex items-center justify-center mb-4">
          <Briefcase className="w-10 h-10 text-purple-400" />
        </div>
        <p className="text-lg font-bold text-gray-900">
          Tidak ada manager ditemukan
        </p>
        <p className="text-sm text-gray-500 mt-1">
          Coba kata kunci lain atau tambahkan manager baru
        </p>
      </div>
    );
  }

  return (
    <>
      {filteredManagers.map((manager, index) => (
        <div
          key={manager.uuid}
          onClick={() => openManagerDetailModal(manager)}
          className="group relative bg-white border border-gray-200 rounded-2xl p-4 hover:border-purple-300 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col"
        >
          {/* Background Gradient Accent */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-indigo-50/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
           {/* Action Buttons - Top Right */}
                    <div className="absolute top-3 right-1 z-20 flex gap-2">
                      {/* Edit Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(manager);
                        }}
                        className="p-1.5 bg-white/80 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg text-gray-400 hover:text-blue-600 shadow-sm hover:shadow-md transition-all duration-200 opacity-0 group-hover:opacity-100"
                        title="Edit Teacher"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

          {/* Number Badge */}
          <div className="absolute -top-2 -left-2 w-6 h-6 bg-white border border-purple-100 text-purple-600 rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm z-20 group-hover:text-white group-hover:bg-blue-600">
            {currentPage * itemsPerPage + index + 1}
          </div>

          {/* Content */}
          <div className="relative z-10 h-full flex flex-col">
            <div className="flex gap-4">
              {/* Left: Icon or Image */}
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-md shadow-purple-500/20 group-hover:scale-105 transition-transform duration-300 overflow-hidden">
                  {manager.image || process.env.NEXT_PUBLIC_MANAGER_DEFAULT_AVATAR ? (
                    <img
                      src={manager.image || process.env.NEXT_PUBLIC_MANAGER_DEFAULT_AVATAR}
                      alt={manager.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Shield className="w-6 h-6 text-white" />
                  )}
                </div>
              </div>

              {/* Right: Info Header */}
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-gray-900 leading-tight line-clamp-1 group-hover:text-purple-700 transition-colors mb-1">
                  {manager.name}
                </h3>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Mail className="w-3 h-3" />
                    <span className="truncate">{manager.email}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </>
  );
};

export default function ManagerPage() {
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(8);

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedManager, setSelectedManager] = useState<Manager | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  // Fetch all managers
  const fetchManagers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get("/admin/managers");
      setManagers(response.data?.data || []);
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const error = err as any;
      setError(error.response?.data?.message || "Gagal memuat data manager");
      console.error("Error fetching managers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchManagers();
  }, []);

  // Create manager
  const handleCreate = async (data: Record<string, unknown>) => {
    try {
      setCreateError(null);
      const response = await api.post("/admin/managers", {
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password,
        image: data.image,
      });
      setManagers([...managers, response.data?.data]);
      setIsCreateOpen(false);
      setCreateError(null);
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const error = err as any;
      const message = error.response?.data?.message || "Gagal membuat manager";
      setCreateError(message);
      throw new Error(message);
    }
  };

  // Update manager
  const handleUpdate = async (data: Record<string, unknown>) => {
    try {
      setEditError(null);
      await api.put(`/admin/managers/modify/${selectedManager?.uuid}`, {
        name: data.name,
        email: data.email,
        phone: data.phone,
      });
      
      // Update local state with the new data
      setManagers(
        managers.map((m) =>
          m.uuid === selectedManager?.uuid 
            ? { ...m, name: data.name as string, email: data.email as string, phone: data.phone as string }
            : m
        )
      );
      setIsEditOpen(false);
      setEditError(null);
      setSelectedManager(null);
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const error = err as any;
      const message = error.response?.data?.message || "Gagal update manager";
      setEditError(message);
      throw new Error(message);
    }
  };

  
  const filteredManagers = managers.filter(
    (manager) =>
      manager.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      manager.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredManagers.length / itemsPerPage);
  const paginatedManagers = filteredManagers.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  const createFields = [
    {
      name: "name",
      label: "Nama",
      type: "text",
      required: true,
      placeholder: "Masukkan nama manager",
    },
    {
      name: "email",
      label: "Email",
      type: "email",
      required: true,
      placeholder: "Masukkan email",
    },
    {
      name: "phone",
      label: "Nomor HP",
      type: "tel",
      required: true,
      placeholder: "Masukkan nomor HP",
    },
    {
      name: "password",
      label: "Password",
      type: "password",
      required: true,
      placeholder: "Masukkan password",
    },
    {
      name: "image",
      label: "Foto Profil",
      type: "file",
    },
  ];

  const editFields = [
    {
      name: "name",
      label: "Nama",
      type: "text",
      required: true,
      placeholder: "Masukkan nama manager",
    },
    {
      name: "email",
      label: "Email",
      type: "email",
      required: true,
      placeholder: "Masukkan email",
    },
    {
      name: "phone",
      label: "Nomor HP",
      type: "tel",
      required: true,
      placeholder: "Masukkan nomor HP",
    },
     {
      name: "image",
      label: "Foto Profil",
      type: "file",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 text-gray-800 font-inter">
      <main className="max-w-7xl mx-auto px-2 space-y-4">
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-gray-200">
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
            {/* Icon */}
            <div className="p-3 sm:p-4 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl shadow-lg flex-shrink-0">
              <Briefcase className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
            </div>
            
            {/* Text Content */}
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900">
                Kelola Manager
              </h1>
              <p className="text-gray-600 text-xs sm:text-sm md:text-base leading-relaxed mt-1">
                Kelola data manager dan hak akses mereka
              </p>
            </div>

             {/* Add Button */}
             <button
              onClick={() => {
                setSelectedManager(null);
                setCreateError(null);
                setIsCreateOpen(true);
              }}
              className="mt-4 sm:mt-0 w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Tambah Manager
            </button>
          </div>

          {/* Stats Card */}
          <div className="bg-gradient-to-br from-indigo-600 to-sky-500 rounded-2xl p-3 shadow-2xl relative overflow-hidden mt-4">
            <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-indigo-500/20 rounded-full"></div>
            <div className="absolute right-4 top-4 w-20 h-20 bg-sky-400/10 rounded-full"></div>

            <div className="relative z-10 flex justify-between items-end">
              <div>
                <p className="text-xs sm:text-sm font-semibold text-white/90 mb-2 tracking-wider uppercase">
                  Total Manager
                </p>
                <div className="flex items-center">
                  <p className="text-3xl font-black text-white drop-shadow-md">
                    {managers.length}
                  </p>
                  <span className="ml-2 text-sm sm:text-base md:text-2xl text-white/80">
                    orang
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white/50">
                <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="px-6 sm:px-8 py-8 border border-gray-300 rounded-t-3xl bg-gradient-to-r from-gray-50 to-gray-100/50">
            <div className="space-y-5">
              {/* Title */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">
                    Daftar Manager
                  </h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {filteredManagers.length} manager ditemukan
                  </p>
                </div>
              </div>

              {/* Search & Filter */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Cari nama atau email..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
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
                isLoading={loading}
                error={error}
                filteredManagers={paginatedManagers}
                openEditModal={(manager) => {
                  setSelectedManager(manager);
                  setEditError(null);
                  setIsEditOpen(true);
                }}
                openManagerDetailModal={(manager) => {
                  setSelectedManager(manager);
                  setIsDetailOpen(true);
                }}
                itemsPerPage={itemsPerPage}
                currentPage={currentPage}
              />
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pt-2 border-t border-gray-100 flex justify-between items-center mt-4">
                <p className="text-gray-600 text-sm">
                  Menampilkan {currentPage * itemsPerPage + 1}-
                  {Math.min(
                    (currentPage + 1) * itemsPerPage,
                    filteredManagers.length
                  )}{" "}
                  dari {filteredManagers.length}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                    disabled={currentPage === 0}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="flex items-center gap-2">
                    {Array.from({ length: totalPages }, (_, i) => i).map(
                      (page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-2 rounded-lg transition ${
                            currentPage === page
                              ? "bg-purple-600 text-white font-bold"
                              : "border border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          {page + 1}
                        </button>
                      )
                    )}
                  </div>
                  <button
                    onClick={() =>
                      setCurrentPage(Math.min(totalPages - 1, currentPage + 1))
                    }
                    disabled={currentPage === totalPages - 1}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modals */}
      <CreateModal<Record<string, unknown>>
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          setCreateError(null);
        }}
        onSubmit={handleCreate}
        title="Tambah Manager Baru"
        fields={createFields}
        error={createError}
      />

      <EditModal<Record<string, unknown>>
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setEditError(null);
          setSelectedManager(null);
        }}
        onSubmit={handleUpdate}
        title="Edit Manager"
        initialData={selectedManager || ({} as Record<string, unknown>)}
        fields={editFields}
        error={editError}
      />
      <ManagerDetailModal
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedManager(null);
        }}
        managerDetail={selectedManager}
      />
    </div>
  );
}
