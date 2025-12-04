"use client";

import { useState, useEffect } from "react";
import { Users, Search, Info, Phone, Mail, Package, TrendingUp, Activity, Sparkles } from "lucide-react";
import api from "@/lib/axios";

interface Student {
  uuid: string;
  name: string;
  email: string;
  phone: string;
  image: string;
  student_profile?: {
    packages?: Array<{
      id: number;
      package: {
        name: string;
      };
      remaining_quota: number;
    }>;
  };
}



export default function DashboardManager() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

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

  const filteredStudents = searchTerm
    ? students.filter(
        (s) =>
          s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : students;

  // Calculate statistics
  const totalStudents = students.length;
  const activeStudents = students.filter(s => (s.student_profile?.packages?.length || 0) > 0).length;
  const totalPackages = students.reduce((acc, s) => acc + (s.student_profile?.packages?.length || 0), 0);
  const totalQuota = students.reduce((acc, s) => {
    const packages = s.student_profile?.packages || [];
    return acc + packages.reduce((sum, p) => sum + p.remaining_quota, 0);
  }, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-4 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Enhanced Header */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-3xl blur-3xl"></div>
          <div className="relative bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl shadow-lg shadow-blue-500/30">
                    <Users className="w-7 h-7 text-white" />
                  </div>
                  <h1 className=" text-sm md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Dashboard Manager
                  </h1>
                </div>
                <p className="text-gray-600 text-sm ml-1">
                  Overview dan statistik siswa aktif
                </p>
              </div>
              <button
                onClick={fetchStudents}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all font-semibold text-sm shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Refresh
              </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 text-white shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <Users className="w-5 h-5" />
                  </div>
                  <TrendingUp className="w-4 h-4 text-blue-200" />
                </div>
                <div className="text-3xl font-bold mb-1">{totalStudents}</div>
                <div className="text-blue-100 text-xs font-medium">Total Siswa</div>
              </div>

              <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-5 text-white shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <Activity className="w-5 h-5" />
                  </div>
                  <TrendingUp className="w-4 h-4 text-green-200" />
                </div>
                <div className="text-3xl font-bold mb-1">{activeStudents}</div>
                <div className="text-green-100 text-xs font-medium">Siswa Aktif</div>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-5 text-white shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <Package className="w-5 h-5" />
                  </div>
                  <TrendingUp className="w-4 h-4 text-purple-200" />
                </div>
                <div className="text-3xl font-bold mb-1">{totalPackages}</div>
                <div className="text-purple-100 text-xs font-medium">Total Paket</div>
              </div>

              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-5 text-white shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <TrendingUp className="w-4 h-4 text-orange-200" />
                </div>
                <div className="text-3xl font-bold mb-1">{totalQuota}</div>
                <div className="text-orange-100 text-xs font-medium">Total Quota</div>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-400" />
            <input
              type="text"
              placeholder="Cari nama atau email siswa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-gradient-to-r from-blue-50/50 to-purple-50/50 border-2 border-blue-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all text-sm placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-200 rounded-full"></div>
              <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0"></div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredStudents.length === 0 ? (
              <div className="col-span-full p-20 text-center bg-white/60 backdrop-blur-sm rounded-2xl border-2 border-dashed border-gray-300">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium">
                  {searchTerm ? "Siswa tidak ditemukan" : "Belum ada data siswa"}
                </p>
              </div>
            ) : (
              filteredStudents.map((student, index) => {
                const packages = student.student_profile?.packages || [];
                const totalQuota = packages.reduce((sum, p) => sum + p.remaining_quota, 0);
                
                return (
                  <div
                    key={student.uuid}
                    className="group bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 hover:shadow-2xl transition-all duration-300 overflow-hidden"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="p-6">
                      {/* Student Info */}
                      <div className="flex items-start gap-4 mb-4">
                        <div className="relative">
                          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-lg group-hover:scale-105 transition-transform">
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
                          {packages.length > 0 && (
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white shadow-lg"></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 text-lg mb-2 truncate group-hover:text-blue-600 transition-colors">
                            {student.name}
                          </h3>
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg">
                              <Mail className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                              <span className="truncate">{student.email}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg">
                              <Phone className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />
                              <span className="truncate">{student.phone || "-"}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Packages Info */}
                      <div className="border-t border-gray-100 pt-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Paket Aktif</span>
                          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                            {packages.length} Paket
                          </span>
                        </div>
                        
                        {packages.length > 0 ? (
                          <div className="space-y-2">
                            {packages.map((pkg) => (
                              <div
                                key={pkg.id}
                                className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100"
                              >
                                <div className="flex items-center gap-2">
                                  <div className="p-1.5 bg-white rounded-lg shadow-sm">
                                    <Package className="w-3.5 h-3.5 text-blue-600" />
                                  </div>
                                  <span className="text-xs font-semibold text-gray-900 truncate max-w-[120px]">
                                    {pkg.package.name}
                                  </span>
                                </div>
                                <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                                  pkg.remaining_quota > 5
                                    ? "bg-green-100 text-green-700"
                                    : pkg.remaining_quota > 0
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-red-100 text-red-700"
                                }`}>
                                  {pkg.remaining_quota}
                                </span>
                              </div>
                            ))}
                            
                            {/* Total Quota */}
                            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl text-white">
                              <span className="text-xs font-bold">Total Quota</span>
                              <span className="text-sm font-bold">{totalQuota} Sesi</span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                            <Package className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                            <p className="text-xs text-gray-400 font-medium">Tidak ada paket aktif</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}