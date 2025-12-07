import React from "react";
import Image from "next/image";
import { X, Calendar, Package, Music, Info } from "lucide-react";

interface PackageData {
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
    packages: PackageData[];
  };
}

interface StudentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentDetail: StudentDetail | null;
  loading: boolean;
  onAssignPackage?: () => void;
  showAssignButton?: boolean;
}

export function StudentDetailModal({
  isOpen,
  onClose,
  studentDetail,
  loading,
  onAssignPackage,
  showAssignButton = true,
}: StudentDetailModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white rounded-xl sm:rounded-2xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Modal Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center z-10">
          <h2 className="text-lg sm:text-2xl font-bold text-gray-900">Detail Student</h2>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="text-gray-500">Memuat data...</div>
            </div>
          ) : studentDetail ? (
            <>
              {/* Student Info */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl sm:rounded-2xl p-4">
                <div className="flex flex-col items-center text-center gap-0.5">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg flex-shrink-0">
                    {studentDetail.image || process.env.NEXT_PUBLIC_DEFAULT_AVATAR ? (
                      <Image
                        src={studentDetail.image || process.env.NEXT_PUBLIC_DEFAULT_AVATAR || ''}
                        alt={studentDetail.name}
                        width={96}
                        height={96}
                        className="w-full h-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-white text-3xl sm:text-4xl font-bold">
                          {studentDetail.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 break-words">
                      {studentDetail.name}
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600 break-all">{studentDetail.email}</p>
                    <p className="text-sm sm:text-base text-gray-600">{studentDetail.phone}</p>
                  </div>
                </div>
              </div>

              {/* Packages Section */}
              <div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0 mb-4">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900">
                    Paket yang Dimiliki
                  </h3>
                  {showAssignButton && onAssignPackage && (
                    <button
                      onClick={onAssignPackage}
                      className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold text-xs sm:text-sm flex items-center justify-center gap-2"
                    >
                      <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      Aktifkan Paket Baru
                    </button>
                  )}
                </div>

                {studentDetail.student_profile?.packages?.length > 0 ? (
                  <div className="space-y-3 sm:space-y-4">
                    {studentDetail.student_profile.packages.map((pkg) => (
                      <div
                        key={pkg.id}
                        className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition"
                      >
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-0 mb-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-base sm:text-lg font-bold text-gray-900 break-words">
                              {pkg.package.name}
                            </h4>
                            <p className="text-xs sm:text-sm text-gray-600">
                              Instrumen: {pkg.package.instrument.name}
                            </p>
                          </div>
                          <span
                            className={`px-2.5 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold flex-shrink-0 ${
                              pkg.remaining_quota > 0
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {pkg.remaining_quota > 0 ? "Aktif" : "Habis"}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                          <div>
                            <p className="text-gray-600">Sisa Kuota:</p>
                            <p className="font-semibold text-gray-900">
                              {pkg.remaining_quota} / {pkg.package.quota} sesi
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Periode:</p>
                            <p className="font-semibold text-gray-900 flex items-center gap-1 flex-wrap">
                              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                              <span className="break-all">
                                {new Date(pkg.start_date).toLocaleDateString(
                                  "id-ID",
                                  {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  }
                                )}{" "}
                                -{" "}
                                {new Date(pkg.end_date).toLocaleDateString(
                                  "id-ID",
                                  {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  }
                                )}
                              </span>
                            </p>
                          </div>
                        </div>

                        {pkg.package.description && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <p className="text-xs sm:text-sm font-semibold text-gray-700 mb-1">Deskripsi:</p>
                            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                              {pkg.package.description}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <Package className="w-16 h-16 mx-auto text-gray-400 mb-3" />
                    <p className="text-gray-600 mb-4">
                      Student ini belum memiliki paket
                    </p>
                    {showAssignButton && onAssignPackage && (
                      <button
                        onClick={onAssignPackage}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold text-sm inline-flex items-center gap-2"
                      >
                        <Package className="w-4 h-4" />
                        Aktifkan Paket Pertama
                      </button>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-gray-500">
              Data tidak ditemukan
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface PackageDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  packageData: {
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
  } | null;
}

export function PackageDetailModal({
  isOpen,
  onClose,
  packageData,
}: PackageDetailModalProps) {
  if (!isOpen || !packageData) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200 over">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl transform transition-all scale-100 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Package className="w-5 h-5 text-purple-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Detail Paket</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-hidden">
          {/* Main Info */}
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg flex-shrink-0">
              <Music className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 leading-tight">
                {packageData.name}
              </h3>
              <p className="text-purple-600 font-medium mt-1">
                {packageData.instrument?.name || "Instrumen Umum"}
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Kuota Pertemuan
              </p>
              <p className="text-lg font-bold text-gray-900">
                {packageData.quota} Sesi
              </p>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-gray-900 font-semibold">
              <Info className="w-4 h-4 text-gray-500" />
              <h4>Deskripsi Paket</h4>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 text-gray-600 text-sm leading-relaxed">
              {packageData.description || "Tidak ada deskripsi untuk paket ini."}
            </div>
          </div>

          {/* Footer Info */}
          {(packageData.created_at || packageData.updated_at) && (
            <div className="pt-4 border-t border-gray-100 flex flex-col gap-1 text-xs text-gray-400">
              {packageData.created_at && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-3 h-3" />
                  <span>
                    Dibuat:{" "}
                    {new Date(packageData.created_at).toLocaleDateString(
                      "en-US",
                      {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      }
                    )}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-2xl border-t border-gray-100 flex justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}


interface TeacherDetail {
  uuid: string;
  name: string;
  email: string;
  phone: string;
  image?: string;
  teacher_profile?: {
    user_uuid: string;
    bio: string;
    instruments: Array<{ id: number; name: string }>;
  };
}

interface TeacherDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacherDetail: TeacherDetail | null;
}

export function TeacherDetailModal({
  isOpen,
  onClose,
  teacherDetail,
}: TeacherDetailModalProps) {
  if (!isOpen || !teacherDetail) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white rounded-xl sm:rounded-2xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Modal Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center z-10">
          <h2 className="text-lg sm:text-2xl font-bold text-gray-900">Detail Teacher</h2>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Teacher Info */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl sm:rounded-2xl p-4">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg flex-shrink-0">
                {teacherDetail.image || process.env.NEXT_PUBLIC_DEFAULT_AVATAR ? (
                  <Image
                    src={teacherDetail.image || process.env.NEXT_PUBLIC_DEFAULT_AVATAR || ''}
                    alt={teacherDetail.name}
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-white text-3xl sm:text-4xl font-bold">
                      {teacherDetail.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 break-words">
                  {teacherDetail.name}
                </h3>
                <p className="text-sm sm:text-base text-gray-600 break-all">{teacherDetail.email}</p>
                <p className="text-sm sm:text-base text-gray-600">{teacherDetail.phone}</p>
              </div>
            </div>
          </div>

          {/* Bio Section */}
          {teacherDetail.teacher_profile?.bio && (
            <div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3">Bio</h3>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {teacherDetail.teacher_profile.bio}
                </p>
              </div>
            </div>
          )}

          {/* Instruments Section */}
          <div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3">
              Instrumen yang Dikuasai
            </h3>
            {teacherDetail.teacher_profile?.instruments && teacherDetail.teacher_profile.instruments.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {teacherDetail.teacher_profile.instruments.map((inst) => (
                  <div
                    key={inst.id}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 rounded-lg border border-blue-300 text-sm font-semibold"
                  >
                    <Music className="w-4 h-4" />
                    <span className="capitalize">{inst.name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <Music className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-600 text-sm">Belum ada instrumen terdaftar</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


interface ManagerDetail {
  uuid: string;
  name: string;
  email: string;
  phone: string;
  image?: string;
}

interface ManagerDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  managerDetail: ManagerDetail | null;
}

export function ManagerDetailModal({
  isOpen,
  onClose,
  managerDetail,
}: ManagerDetailModalProps) {
  if (!isOpen || !managerDetail) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white rounded-xl sm:rounded-2xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Modal Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center z-10">
          <h2 className="text-lg sm:text-2xl font-bold text-gray-900">Detail Manager</h2>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Teacher Info */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl sm:rounded-2xl p-4">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg flex-shrink-0">
                {managerDetail.image || process.env.NEXT_PUBLIC_MANAGER_DEFAULT_AVATAR ? (
                  <Image
                    src={managerDetail.image || process.env.NEXT_PUBLIC_MANAGER_DEFAULT_AVATAR || ''}
                    alt={managerDetail.name}
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-white text-3xl sm:text-4xl font-bold">
                      {managerDetail.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 break-words">
                  {managerDetail.name}
                </h3>
                <p className="text-sm sm:text-base text-gray-600 break-all">{managerDetail.email}</p>
                <p className="text-sm sm:text-base text-gray-600">{managerDetail.phone}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
