"use client";

import React, { useState, useEffect } from "react";
import {
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  Info,
  Package,
  Users,
  Mail,
  Phone,
  MoreVertical,
  UserCircle,
} from "lucide-react";
import api from "@/lib/axios";
import {
  CreateModal,
  DeleteModal,
  StudentDetailModal,
} from "@/app/dashboard/components/modals";
import PerPageSelect from "@/app/dashboard/components/SelectPerPage";

interface Package {
  id: number;
  student_uuid: string;
  package_id: number;
  remaining_quota: number;
  start_date: string;
  end_date: string;
  package: {
    id: number;
    name: string;
    quota: number;
    description: string;
    instrument_id: number;
    instrument: {
      id: number;
      name: string;
    };
  };
}

interface StudentDetail {
  uuid: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  image: string;
  created_at: string;
  updated_at: string;
  student_profile: {
    user_uuid: string;
    packages: Package[];
  };
}

interface Student extends Record<string, unknown> {
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
  filteredStudents,
  openDetailModal,
  openDeleteModal,
  currentPage,
  itemsPerPage,
}: {
  isLoading: boolean;
  error: string | null;
  filteredStudents: Student[];
  openDetailModal: (student: Student) => void;
  openDeleteModal: (student: Student) => void;
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
          Memuat data student...
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

  if (filteredStudents.length === 0) {
    return (
      <div className="col-span-full flex flex-col items-center justify-center py-20">
        <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-2xl flex items-center justify-center mb-4">
          <Users className="w-10 h-10 text-purple-400" />
        </div>
        <p className="text-lg font-bold text-gray-900">
          Tidak ada student ditemukan
        </p>
        <p className="text-sm text-gray-500 mt-1">
          Coba kata kunci lain
        </p>
      </div>
    );
  }

  return (
    <>
      {filteredStudents.map((student, index) => (
        <div
          key={student.uuid}
          className="group relative bg-white border border-gray-200 rounded-2xl p-4 hover:border-purple-300 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col"
        >
          {/* Background Gradient Accent */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-indigo-50/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

          {/* Delete Button - Top Right (Absolute) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              openDeleteModal(student);
            }}
            className="absolute top-3 right-3 z-20 p-1.5 bg-white/80 hover:bg-red-50 border border-gray-200 hover:border-red-200 rounded-lg text-gray-400 hover:text-red-600 shadow-sm hover:shadow-md transition-all duration-200 opacity-0 group-hover:opacity-100"
            title="Hapus Student"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

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
                  {student.image || process.env.NEXT_PUBLIC_DEFAULT_AVATAR ? (
                    <img
                      src={student.image || process.env.NEXT_PUBLIC_DEFAULT_AVATAR}
                      alt={student.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserCircle className="w-6 h-6 text-white" />
                  )}
                </div>
              </div>

              {/* Right: Info Header */}
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-gray-900 leading-tight line-clamp-1 group-hover:text-purple-700 transition-colors mb-1">
                  {student.name}
                </h3>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 group-hover:text-black">
                    <Mail className="w-3 h-3" />
                    <span className="truncate">{student.email}</span>
                  </div>
                  
                </div>
              </div>
            </div>

            {/* Action - Full Width */}
            <div className="flex justify-end">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openDetailModal(student);
                }}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Info className="w-3 h-3" />
                Lihat Detail
              </button>
            </div>
          </div>
        </div>
      ))}
    </>
  );
};

export default function StudentPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(0); 
  
  const [itemsPerPage, setItemsPerPage] = useState(4); 
  const [packages, setPackages] = useState<Array<{ id: number; name: string }>>(
    []
  );

  // Modal states
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentDetail, setStudentDetail] = useState<StudentDetail | null>(
    null
  );
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch all students
  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get("/admin/students");
      setStudents(response.data?.data || []);
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const error = err as any;
      setError(error.response?.data?.message || "Gagal memuat data student");
      console.error("Error fetching students:", err);
    } finally {
      setLoading(false);
    }
  };

  // get packages
  const fetchPackages = async () => {
    try {
      const res = await api.get("/admin/packages");
      setPackages(res.data?.data || []);
    } catch (err) {
      setError("Gagal memuat daftar paket");
    }
  };

  // Fetch student detail by UUID
  const fetchStudentDetail = async (uuid: string) => {
    try {
      setLoadingDetail(true);
      const response = await api.get(`/admin/students/${uuid}`);
      setStudentDetail(response.data?.data || null);
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const error = err as any;
      setError(error.response?.data?.message || "Gagal memuat detail student");
    } finally {
      setLoadingDetail(false);
    }
  };

  // useEffect
  useEffect(() => {
    const id = Math.random().toString(36).substring(7);
  console.log(`useEffect [${id}] fetchStudents dipanggil - ${new Date().toISOString()}`);
    fetchStudents();
    fetchPackages();
  }, []);

  // Assign package to student
  const handleAssignPackage = async (data: Record<string, unknown>) => {
    try {
      setAssignError(null);
      await api.post("/admin/assign-package", {
        student_uuid: selectedStudent?.uuid,
        package_id: data.package_id,
      });

      setIsAssignOpen(false);
      setAssignError(null);
      setSuccessMessage("Paket berhasil diaktifkan untuk student!");

      // Hide success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);


      // Refresh student detail if detail modal is open
      if (selectedStudent?.uuid) {
        await fetchStudentDetail(selectedStudent.uuid);
        setIsDetailOpen(true);
      }
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const error = err as any;
      const message = error.response?.data?.message || "Gagal assign package";
      setAssignError(message);
      throw new Error(message);
    }
  };

  // Delete student
  const handleDelete = async () => {
    try {
      await api.delete(`/admin/students/${selectedStudent?.uuid}`);
      setStudents(students.filter((s) => s.uuid !== selectedStudent?.uuid));
      setIsDeleteOpen(false);
      setSelectedStudent(null);
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const error = err as any;
      const message = error.response?.data?.message || "Gagal hapus student";
      setError(message);
      throw new Error(message);
    }
  };

  // Filter & Pagination
  const filteredStudents = students
    .filter((student): student is Student => {
      return (
        student != null &&
        typeof student === "object" &&
        "uuid" in student &&
        "name" in student &&
        "email" in student
      );
    })
    .filter((student) => {
      const search = searchTerm.toLowerCase();
      const name = (student.name ?? "").toLowerCase();
      const email = (student.email ?? "").toLowerCase();
      return name.includes(search) || email.includes(search);
    });

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const paginatedStudents = filteredStudents.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  const assignFields = [
    {
      name: "package_id",
      label: "Pilih Paket",
      type: "select",
      required: true,
      options: packages.map((pkg) => ({
        value: pkg.id,
        label: `${pkg.name}`,
      })),
      placeholder: packages.length === 0 ? "Memuat paket..." : "Pilih paket",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 text-gray-800 font-inter">
      {/* Success Message */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 max-w-md animate-in fade-in slide-in-from-top-2">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg">
            <p className="text-green-700 font-semibold">{successMessage}</p>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-2 space-y-4">
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-gray-200">
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
            {/* Icon */}
            <div className="p-3 sm:p-4 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl shadow-lg flex-shrink-0">
              <Users className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
            </div>
            
            {/* Text Content */}
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900">
                Kelola Student
              </h1>
              <p className="text-gray-600 text-xs sm:text-sm md:text-base leading-relaxed mt-1">
                Kelola data student dan paket pembelajaran mereka
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
                  Total Student
                </p>
                <div className="flex items-center">
                  <p className="text-3xl font-black text-white drop-shadow-md">
                    {students.length}
                  </p>
                  <span className="ml-2 text-sm sm:text-base md:text-2xl text-white/80">
                    siswa
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white/50">
                <Users className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
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
                    Daftar Student
                  </h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {filteredStudents.length} student ditemukan
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
                filteredStudents={paginatedStudents}
                openDetailModal={(student) => {
                  setSelectedStudent(student);
                  setIsDetailOpen(true);
                  fetchStudentDetail(student.uuid);
                }}
                openDeleteModal={(student) => {
                  setSelectedStudent(student);
                  setIsDeleteOpen(true);
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
                    filteredStudents.length
                  )}{" "}
                  dari {filteredStudents.length}
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
      <StudentDetailModal
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setStudentDetail(null);
        }}
        studentDetail={studentDetail}
        loading={loadingDetail}
        onAssignPackage={() => {
          setIsDetailOpen(false);
          setAssignError(null);
          setIsAssignOpen(true);
        }}
        showAssignButton={true}
      />

      <CreateModal<Record<string, unknown>>
        isOpen={isAssignOpen}
        onClose={() => {
          setIsAssignOpen(false);
          setAssignError(null);
        }}
        onSubmit={handleAssignPackage}
        title="Aktifkan Paket Murid"
        fields={assignFields}
        error={assignError}
      />

      <DeleteModal<Record<string, unknown>>
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setSelectedStudent(null);
        }}
        onConfirm={handleDelete}
        title="Hapus Student"
        item={selectedStudent}
        itemLabel="name"
      />
    </div>
  );
}
