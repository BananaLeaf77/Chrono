"use client";

import { useState, useEffect } from "react";
import { Users, Search, Info, Edit3, X, Mail, Phone, Music, Sparkles, TrendingUp, Package } from "lucide-react";
import api from "@/lib/axios"

interface PackageData {
  id: number;
  name: string;
  quota: number;
  description: string;
  instrument: {
    name: string;
  };
}

interface StudentPackage {
  id: number;
  student_uuid: string;
  package_id: number;
  remaining_quota: number;
  package: PackageData;
}

interface Student {
  uuid: string;
  name: string;
  email: string;
  phone: string;
  image: string;
  student_profile?: {
    packages: StudentPackage[];
  };
}



export default function MyStudentPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [selectedPackageId, setSelectedPackageId] = useState<number | null>(null);
  const [newQuota, setNewQuota] = useState("");
  const [updateLoading, setUpdateLoading] = useState(false);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await api.get("/manager/students");
      setStudents(response.data?.data || []);
    } catch (err) {
      const error = err as any;
      setError(error.response?.data?.message || "Gagal memuat data siswa");
      console.error("Error fetching students:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleEditClick = (student: Student) => {
    setEditingStudent(student);
    const packages = student.student_profile?.packages || [];
    
    if (packages.length > 0) {
      setSelectedPackageId(packages[0].package_id);
      setNewQuota(packages[0].remaining_quota.toString());
    } else {
      setSelectedPackageId(null);
      setNewQuota("");
    }
  };

  const handleUpdateQuota = async () => {
    if (!editingStudent || !selectedPackageId || !newQuota) return;

    try {
      setUpdateLoading(true);
      await api.put(`/manager/students/${editingStudent.uuid}/packages/${selectedPackageId}/quota`, {
        incoming_quota: parseInt(newQuota),
      });
      
      await fetchStudents();
      setEditingStudent(null);
      setNewQuota("");
    } catch (err) {
      const error = err as any;
      alert(error.response?.data?.message || "Gagal update quota");
    } finally {
      setUpdateLoading(false);
    }
  };

  const filteredStudents = searchTerm
    ? students.filter(
        (s) =>
          s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : students;

  const totalStudents = students.length;
  const totalPackages = students.reduce((acc, s) => acc + (s.student_profile?.packages.length || 0), 0);
  

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 py-8 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Enhanced Header */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-indigo-600/10 rounded-3xl blur-3xl"></div>
          <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl shadow-lg shadow-purple-500/30">
                    <Users className="w-5 h-5 md:w-7 md:h-7 text-white" />
                  </div>
                  <h1 className=" text-lg md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                    Murid
                  </h1>
                </div>
                <p className="text-gray-600 text-sm ml-1">
                  Kelola paket dan kuota siswa dengan mudah
                </p>
              </div>

              {/* Stats Cards */}
              <div className="flex gap-4">
                <div className="bg-gradient-to-br from-purple-100 to-purple-50 rounded-2xl p-4 border border-purple-200/50">
                  <div className="text-xs text-purple-600 font-semibold mb-1">Total Siswa</div>
                  <div className="text-2xl font-bold text-purple-700">{totalStudents}</div>
                </div>
                <div className="bg-gradient-to-br from-indigo-100 to-indigo-50 rounded-2xl p-4 border border-indigo-200/50">
                  <div className="text-xs text-indigo-600 font-semibold mb-1">Paket Aktif</div>
                  <div className="text-2xl font-bold text-indigo-700">{totalPackages}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Search Bar */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-400" />
              <input
                type="text"
                placeholder="Cari nama atau email siswa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-gradient-to-r from-purple-50/50 to-indigo-50/50 border-2 border-purple-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition-all text-sm placeholder:text-gray-400"
              />
            </div>
            <button
              onClick={fetchStudents}
              className="px-6 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all font-semibold text-sm shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 flex items-center gap-2 whitespace-nowrap"
            >
              <Sparkles className="w-4 h-4" />
              Refresh Data
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-purple-200 rounded-full"></div>
              <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin absolute top-0"></div>
            </div>
            <p className="text-gray-500 mt-4 font-medium">Memuat data siswa...</p>
          </div>
        ) : error ? (
          <div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 rounded-2xl p-6 flex items-center gap-4 text-red-700 shadow-lg">
            <div className="p-3 bg-red-100 rounded-xl">
              <Info className="w-6 h-6" />
            </div>
            <div>
              <div className="font-semibold text-lg">Terjadi Kesalahan</div>
              <div className="text-sm text-red-600 mt-1">{error}</div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5">
            {filteredStudents.length === 0 ? (
              <div className="p-20 text-center bg-white/60 backdrop-blur-sm rounded-2xl border-2 border-dashed border-gray-300">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium">
                  {searchTerm ? "Siswa tidak ditemukan" : "Belum ada data siswa"}
                </p>
              </div>
            ) : (
              filteredStudents.map((student, index) => (
                <div
                  key={student.uuid}
                  className="group bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 hover:shadow-2xl transition-all duration-300 overflow-hidden"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="p-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                      {/* Enhanced Profile Section */}
                      <div className="flex items-start gap-4 lg:w-1/3">
                        <div className="relative">
                          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-600 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-lg group-hover:scale-105 transition-transform">
                            {student.image ? (
                              <img
                                src={student.image}
                                alt={student.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-2xl font-bold text-white">
                                {student.name.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white shadow-lg"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 text-lg mb-3 truncate">
                            {student.name}
                          </h3>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                              <Mail className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />
                              <span className="truncate">{student.email}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                              <Phone className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                              <span className="truncate">{student.phone || "-"}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Enhanced Packages Section */}
                      <div className="flex-1 lg:border-l lg:pl-6 border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-xs font-bold text-gray-800 flex items-center gap-2">
                            <div className="p-1.5 bg-purple-100 rounded-lg">
                              <Package className="w-4 h-4 text-purple-600" />
                            </div>
                            Paket Aktif
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-semibold">
                              {student.student_profile?.packages?.length || 0}
                            </span>
                          </h4>
                          <button
                            onClick={() => handleEditClick(student)}
                            className="text-xs font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 px-4 py-2 rounded-xl transition-all flex items-center gap-2 shadow-md hover:shadow-lg group"
                          >
                            <Edit3 className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
                            Update Quota
                          </button>
                        </div>
                        
                        <div className="space-y-3">
                          {student.student_profile?.packages && student.student_profile.packages.length > 0 ? (
                            student.student_profile.packages.map((pkg) => (
                              <div
                                key={pkg.id}
                                className="relative group/card overflow-hidden"
                              >
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-indigo-500/5 opacity-0 group-hover/card:opacity-100 transition-opacity rounded-xl"></div>
                                <div className="relative flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-50/50 rounded-xl border border-gray-200/50 group-hover/card:border-purple-200 transition-all">
                                  <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-white rounded-xl shadow-sm group-hover/card:shadow-md transition-shadow">
                                      <Music className="w-5 h-5 text-purple-600" />
                                    </div>
                                    <div>
                                      <p className="text-xs md:text-sm font-bold text-gray-900 mb-0.5">
                                        {pkg.package.name}
                                      </p>
                                      <p className="text-xs text-gray-500 capitalize flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                                        {pkg.package.instrument.name}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-xs text-gray-500 mb-1.5 font-medium">Sisa Quota</p>
                                    <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm ${
                                      pkg.remaining_quota > 5
                                        ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                                        : pkg.remaining_quota > 0
                                        ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white"
                                        : "bg-gradient-to-r from-red-500 to-pink-500 text-white"
                                    }`}>
                                      {pkg.remaining_quota} Sesi
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-8 bg-gradient-to-r from-gray-50 to-gray-50/50 rounded-xl border-2 border-dashed border-gray-200">
                              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Package className="w-6 h-6 text-gray-400" />
                              </div>
                              <p className="text-sm text-gray-500 font-medium">Tidak ada paket aktif</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Enhanced Edit Modal */}
      {editingStudent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden scale-100 animate-in zoom-in-95 duration-200">
            {/* Modal Header with Gradient */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
              <div className="relative flex justify-between items-center">
                <div>
                  <h3 className="text-xs md:text-xl font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Update Quota
                  </h3>
                  <p className="text-purple-100 text-sm mt-1">Sesuaikan sisa quota siswa</p>
                </div>
                <button 
                  onClick={() => setEditingStudent(null)}
                  className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Student Info Card */}
              <div className="bg-gradient-to-br from-purple-50 via-white to-indigo-50 p-5 rounded-2xl border-2 border-purple-100">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg">
                    <span className="font-bold text-white text-xl">
                      {editingStudent.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="text-base font-bold text-gray-900 mb-1">{editingStudent.name}</div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-purple-700 font-semibold bg-purple-100 px-3 py-1 rounded-full">
                        Student
                      </span>
                      <span className="text-xs text-gray-500">
                        {editingStudent.student_profile?.packages?.length || 0} paket
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Package Select */}
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <Package className="w-4 h-4 text-purple-600" />
                  Pilih Paket
                </label>
                {editingStudent.student_profile?.packages && editingStudent.student_profile.packages.length > 0 ? (
                  <select
                    value={selectedPackageId || ""}
                    onChange={(e) => {
                      const pkgId = Number(e.target.value);
                      setSelectedPackageId(pkgId);
                      const pkg = editingStudent.student_profile?.packages.find(p => p.package_id === pkgId);
                      if (pkg) setNewQuota(pkg.remaining_quota.toString());
                    }}
                    className="w-full px-4 py-3.5 bg-gradient-to-r from-purple-50/50 to-indigo-50/50 border-2 border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition-all text-sm font-medium"
                  >
                    {editingStudent.student_profile.packages.map(pkg => (
                      <option key={pkg.id} value={pkg.package_id}>
                        {pkg.package.name} • Sisa: {pkg.remaining_quota} sesi
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="text-red-600 text-sm bg-red-50 p-4 rounded-xl border-2 border-red-200 flex items-center gap-3">
                    <Info className="w-5 h-5 flex-shrink-0" />
                    <span className="font-medium">Siswa tidak memiliki paket aktif</span>
                  </div>
                )}
              </div>

              {/* Quota Input */}
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  Quota Baru
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={newQuota}
                    onChange={(e) => setNewQuota(e.target.value)}
                    className="w-full pl-4 pr-16 py-4 bg-gradient-to-r from-purple-50/50 to-indigo-50/50 border-2 border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition-all text-base font-bold text-gray-900"
                    placeholder="0"
                  />
                  <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-xs font-bold text-purple-600 bg-purple-100 px-2.5 py-1 rounded-lg">
                    SESI
                  </span>
                </div>
                <div className="mt-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                  <p className="text-xs text-blue-700 flex items-start gap-2 font-medium">
                    <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>Nilai ini akan menggantikan sisa quota yang ada saat ini. Pastikan jumlahnya sudah benar.</span>
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setEditingStudent(null)}
                  className="flex-1 px-5 py-3.5 text-gray-700 font-semibold hover:bg-gray-100 rounded-xl transition-all border-2 border-gray-200"
                >
                  Batal
                </button>
                <button
                  onClick={handleUpdateQuota}
                  disabled={updateLoading || !selectedPackageId}
                  className="flex-1 px-5 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-purple-500/30 hover:shadow-2xl hover:shadow-purple-500/40 flex items-center justify-center gap-2"
                >
                  {updateLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Simpan Perubahan
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}