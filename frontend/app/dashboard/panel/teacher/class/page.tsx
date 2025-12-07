"use client";

import { useState, useEffect } from "react";
import {
  Calendar,
 Clock,
 Plus,
 Trash2,
 CheckCircle,
 X,
 Users,
 Image as ImageIcon,
 Video,
} from "lucide-react";
import api from "@/lib/axios";
import { toast } from "react-hot-toast";

interface TimeSlot {
  day_of_the_week: string[];
  start_time: string;
  end_time: string;
}

interface AvailableClass {
  id: number;
  teacher_uuid: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  is_booked: boolean;
  created_at: string;
  updated_at: string;
}

interface BookedClass {
  id: number;
  student_uuid: string;
  teacher_uuid: string;
  schedule_id: number;
  package_id?: number;
  instrument_id: number;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: string;
  notes?: string;
  created_at: string;
  student?: {
    name: string;
    email: string;
    image?: string;
  };
  instrument?: {
    id: number;
    name: string;
  };
}

export default function TeacherClassPage() {
  const [activeTab, setActiveTab] = useState<"available" | "booked">("available");
  const [availableClasses, setAvailableClasses] = useState<AvailableClass[]>([]);
  const [bookedClasses, setBookedClasses] = useState<BookedClass[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<BookedClass | null>(null);

  // Ambil jadwal tersedia
  const fetchAvailableClasses = async () => {
    try {
      setLoading(true);
      const response = await api.get("/teacher/schedules");
      if (response.data.success) {
        setAvailableClasses(response.data.data || []);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Gagal mengambil jadwal tersedia");
    } finally {
      setLoading(false);
    }
  };

  // Ambil kelas yang sudah dibooking
  const fetchBookedClasses = async () => {
    try {
      setLoading(true);
      const response = await api.get("/teacher/booked");
      if (response.data.success) {
        setBookedClasses(response.data.data || []);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Gagal mengambil kelas terbooking");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "available") {
      fetchAvailableClasses();
    } else {
      fetchBookedClasses();
    }
  }, [activeTab]);

  // Hapus jadwal tersedia
  const handleDeleteAvailability = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus ketersediaan ini?")) return;

    try {
      const response = await api.delete(`/teacher/delete-available-class/${id}`);
      if (response.data.success) {
        toast.success("Jadwal berhasil dihapus");
        fetchAvailableClasses();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Gagal menghapus jadwal");
    }
  };

  // Format waktu
  const formatTime = (timeString: string) => {
    if (!timeString) return "";
    if (timeString.includes("T")) {
      return timeString.split("T")[1].substring(0, 5);
    }
    return timeString.substring(0, 5);
  };

  // Format tanggal
  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Kelompokkan berdasarkan hari
  const groupedClasses = availableClasses.reduce((acc, cls) => {
    if (!acc[cls.day_of_week]) acc[cls.day_of_week] = [];
    acc[cls.day_of_week].push(cls);
    return acc;
  }, {} as Record<string, AvailableClass[]>);

  const dayOrder = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">
            Manajemen Kelas
          </h1>
          <p className="text-slate-600">
            Atur jadwal ketersediaan dan kelas yang sudah dibooking
          </p>
        </div>

        {/* Tab Navigasi */}
        <div className="flex gap-2 mb-8 bg-white p-2 rounded-xl shadow-sm">
          <button
            onClick={() => setActiveTab("available")}
            className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === "available"
                ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Calendar className="w-5 h-5 inline mr-2" />
            Jadwal Tersedia
          </button>
          <button
            onClick={() => setActiveTab("booked")}
            className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === "booked"
                ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Users className="w-5 h-5 inline mr-2" />
            Kelas Terbooking
          </button>
        </div>

        {/* Konten Tab Jadwal Tersedia */}
        {activeTab === "available" && (
          <div className="space-y-6">
            <div className="flex justify-end">
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-600 shadow-lg shadow-blue-500/30 flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Tambah Jadwal
              </button>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              </div>
            ) : Object.keys(groupedClasses).length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center shadow-lg">
                <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 text-lg">
                  Belum ada jadwal tersedia. Tambahkan ketersediaan pertama Anda!
                </p>
              </div>
            ) : (
              dayOrder
                .filter((day) => groupedClasses[day])
                .map((day) => (
                  <div key={day} className="bg-white rounded-2xl p-6 shadow-lg">
                    <h3 className="text-xl font-bold text-slate-800 mb-4">{day}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {groupedClasses[day].map((cls) => (
                        <div
                          key={cls.id}
                          className={`p-4 rounded-xl border-2 transition-all ${
                            cls.is_booked
                              ? "border-green-200 bg-green-50"
                              : "border-slate-200 bg-slate-50 hover:border-blue-300"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 text-slate-700">
                              <Clock className="w-4 h-4" />
                              <span className="font-semibold">
                                {formatTime(cls.start_time)} - {formatTime(cls.end_time)}
                              </span>
                            </div>
                            {!cls.is_booked && (
                              <button
                                onClick={() => handleDeleteAvailability(cls.id)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {cls.is_booked ? (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                Sudah Dibooking
                              </span>
                            ) : (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                Tersedia
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
            )}
          </div>
        )}

        {/* Konten Tab Kelas Terbooking */}
        {activeTab === "booked" && (
          <div className="space-y-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              </div>
            ) : bookedClasses.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center shadow-lg">
                <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 text-lg">
                  Belum ada kelas yang dibooking
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {bookedClasses.map((booking) => (
                  <div
                    key={booking.id}
                    className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                          {booking.student?.name?.charAt(0) || "S"}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-slate-800">
                            {booking.student?.name || "Siswa"}
                          </h3>
                          <p className="text-sm text-slate-600">
                            {booking.instrument?.name || "Instrumen"}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {booking.status === "confirmed" && (
                          <button
                            onClick={() => {
                              setSelectedBooking(booking);
                              setShowFinishModal(true);
                            }}
                            className="bg-green-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-600 flex items-center gap-2"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Selesaikan Kelas
                          </button>
                        )}
                        <span
                          className={`px-4 py-2 rounded-lg text-sm font-medium ${
                            booking.status === "confirmed"
                              ? "bg-blue-100 text-blue-700"
                              : booking.status === "completed"
                              ? "bg-green-100 text-green-700"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {booking.status === "confirmed"
                            ? "Dikonfirmasi"
                            : booking.status === "completed"
                            ? "Selesai"
                            : booking.status}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(booking.booking_date)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <Clock className="w-4 h-4" />
                        <span>
                          {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                        </span>
                      </div>
                    </div>

                    {booking.notes && (
                      <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                        <p className="text-sm text-slate-600">
                          <strong>Catatan:</strong> {booking.notes}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Tambah Jadwal */}
      {showCreateModal && (
        <CreateAvailabilityModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchAvailableClasses();
          }}
        />
      )}

      {/* Modal Selesaikan Kelas */}
      {showFinishModal && selectedBooking && (
        <FinishClassModal
          booking={selectedBooking}
          onClose={() => {
            setShowFinishModal(false);
            setSelectedBooking(null);
          }}
          onSuccess={() => {
            setShowFinishModal(false);
            setSelectedBooking(null);
            fetchBookedClasses();
          }}
        />
      )}
    </div>
  );
}

// Modal Tambah Jadwal Tersedia
function CreateAvailabilityModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [slots, setSlots] = useState<TimeSlot[]>([
    { day_of_the_week: [], start_time: "", end_time: "" },
  ]);
  const [submitting, setSubmitting] = useState(false);

  const days = ["senin", "selasa", "rabu", "kamis", "jumat", "sabtu", "minggu"];

  const addSlot = () => {
    setSlots([...slots, { day_of_the_week: [], start_time: "", end_time: "" }]);
  };

  const removeSlot = (index: number) => {
    setSlots(slots.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const normalizedSlots = slots.map((slot) => {
        const normalizeTime = (time: string) => {
          if (!time) return "";
          let [hours, minutes] = time.split(":").map(Number);
          if (hours >= 1 && hours < 7) hours += 12; // 01:00 → 13:00
          return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
        };

        return {
          ...slot,
          start_time: normalizeTime(slot.start_time),
          end_time: normalizeTime(slot.end_time),
        };
      });

      const response = await api.post("/teacher/create-available-class", {
        slots_availability: normalizedSlots,
      });

      if (response.data.success) {
        toast.success("Jadwal berhasil ditambahkan");
        onSuccess();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Gagal menambah jadwal");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-800">
            Tambah Jadwal Tersedia
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {slots.map((slot, index) => (
            <div key={index} className="p-4 border-2 border-slate-200 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-800">Slot {index + 1}</h3>
                {slots.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSlot(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Pilih Hari */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Hari *
                </label>
                <div className="flex flex-wrap gap-2">
                  {days.map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => {
                        const updated = slot.day_of_the_week.includes(day)
                          ? slot.day_of_the_week.filter((d) => d !== day)
                          : [...slot.day_of_the_week, day];
                        const newSlots = [...slots];
                        newSlots[index].day_of_the_week = updated;
                        setSlots(newSlots);
                      }}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        slot.day_of_the_week.includes(day)
                          ? "bg-blue-500 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {day.charAt(0).toUpperCase() + day.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Jam Mulai & Selesai */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Jam Mulai *
                  </label>
                  <input
                    type="time"
                    value={slot.start_time}
                    onChange={(e) => {
                      const start = e.target.value;
                      let end = "";
                      if (start) {
                        const [h, m] = start.split(":").map(Number);
                        const d = new Date();
                        d.setHours(h, m);
                        d.setHours(d.getHours() + 1);
                        end = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
                      }
                      const newSlots = [...slots];
                      newSlots[index] = { ...newSlots[index], start_time: start, end_time: end };
                      setSlots(newSlots);
                    }}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Jam Selesai (1 Jam)
                  </label>
                  <input
                    type="time"
                    value={slot.end_time}
                    readOnly
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-100 text-slate-500 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addSlot}
            className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-600 hover:border-blue-500 hover:text-blue-500 flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Tambah Slot Lain
          </button>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 disabled:opacity-50"
            >
              {submitting ? "Menyimpan..." : "Simpan Jadwal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Modal Selesaikan Kelas
function FinishClassModal({
  booking,
  onClose,
  onSuccess,
}: {
  booking: BookedClass;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    package_id: booking.package_id || null,
    date: booking.booking_date.split("T")[0],
    start_time: booking.start_time.substring(0, 5),
    end_time: booking.end_time.substring(0, 5),
    notes: "",
    documentations: [] as string[],
  });
  const [docUrl, setDocUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const normalizeTime = (time: string) => {
        if (!time) return "";
        let [hours, minutes] = time.split(":").map(Number);
        if (hours >= 1 && hours < 7) hours += 12;
        return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
      };

      const payload = {
        instrument_id: booking.instrument_id,
        ...formData,
        start_time: normalizeTime(formData.start_time),
        end_time: normalizeTime(formData.end_time),
      };

      const response = await api.put(`/teacher/finish-class/${booking.id}`, payload);
      if (response.data.success) {
        toast.success("Kelas berhasil diselesaikan");
        onSuccess();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Gagal menyelesaikan kelas");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-800">Selesaikan Kelas</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="p-4 bg-slate-50 rounded-xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {booking.student?.name?.charAt(0) || "S"}
              </div>
              <div>
                <h3 className="font-bold text-slate-800">
                  {booking.student?.name || "Siswa"}
                </h3>
                <p className="text-sm text-slate-600">
                  {booking.instrument?.name || "Instrumen"}
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Tanggal *
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Jam Mulai *
              </label>
              <input
                type="time"
                value={formData.start_time}
                onChange={(e) => {
                  const start = e.target.value;
                  let end = "";
                  if (start) {
                    const [h, m] = start.split(":").map(Number);
                    const d = new Date();
                    d.setHours(h, m);
                    d.setHours(d.getHours() + 1);
                    end = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
                  }
                  setFormData({ ...formData, start_time: start, end_time: end });
                }}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Jam Selesai (1 Jam)
              </label>
              <input
                type="time"
                value={formData.end_time}
                readOnly
                className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-100 text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Catatan Kemajuan *
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={4}
              placeholder="Siswa menunjukkan kemajuan ritme yang baik, sesi berikutnya fokus pada postur tangan..."
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Dokumentasi (Opsional)
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="url"
                value={docUrl}
                onChange={(e) => setDocUrl(e.target.value)}
                placeholder="https://cdn.example.com/photo.jpg"
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => {
                  if (docUrl.trim()) {
                    setFormData({
                      ...formData,
                      documentations: [...formData.documentations, docUrl.trim()],
                    });
                    setDocUrl("");
                  }
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            {formData.documentations.length > 0 && (
              <div className="space-y-2">
                {formData.documentations.map((url, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                    {url.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                      <ImageIcon className="w-4 h-4 text-slate-400" />
                    ) : (
                      <Video className="w-4 h-4 text-slate-400" />
                    )}
                    <span className="flex-1 text-sm text-slate-600 truncate">{url}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          documentations: formData.documentations.filter((_, idx) => idx !== i),
                        });
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-6 py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? "Menyimpan..." : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Selesaikan Kelas
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}