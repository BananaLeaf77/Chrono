// app/dashboard/layout.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Menu, ChevronLeft } from "lucide-react";
import Sidebar from "./components/Sidebar";
import Profile from "./components/Profile";
import Image from "next/image";
import { useAuth } from "@/lib/auth";
import { Maname } from "next/font/google";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [accessChecked, setAccessChecked] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, error, logout } = useAuth();

  // Auto collapse sidebar
  useEffect(() => {
    const handleResize = () => setIsCollapsed(window.innerWidth < 1024);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // === OPTIMIZED ROLE-BASED ACCESS CONTROL ===
  const checkRoleAccess = useCallback(
    (
      userRole: "admin" | "teacher" | "student" | "management",
      currentPath: string
    ): boolean => {
      const rolePaths = {
        admin: "/dashboard/panel/admin",
        teacher: "/dashboard/panel/teacher",
        student: "/dashboard/panel/student",
        management: "/dashboard/panel/manager",
      };

      const allowedPath = rolePaths[userRole];

      // Jika di root dashboard, redirect ke panel role
      if (currentPath === "/dashboard") {
        return false; // Perlu redirect
      }

      // Exception: Allow all roles to access /dashboard/panel/setting
      if (currentPath === "/dashboard/panel/setting") {
        return true;
      }

      // Cek apakah path saat ini sesuai dengan role
      return currentPath.startsWith(allowedPath);
    },
    []
  );

  // === ROLE-BASED ACCESS CHECK + REDIRECT ===
  useEffect(() => {
    if (!loading && user) {
      // Cek akses secara synchronous dan langsung redirect jika perlu
      const hasAccess = checkRoleAccess(user.role, pathname);

      if (!hasAccess) {
        // Redirect langsung tanpa jeda
        const rolePaths = {
          admin: "/dashboard/panel/admin",
          teacher: "/dashboard/panel/teacher",
          student: "/dashboard/panel/student",
          management: "/dashboard/panel/manager",
        };
        router.replace(rolePaths[user.role]);
        return;
      }

      // Jika akses valid, set access checked
      setAccessChecked(true);
    }
  }, [loading, user, pathname, router, checkRoleAccess]);

  // === LOADING STATE - Tampilkan seminimal mungkin ===
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm">Memverifikasi akses...</p>
        </div>
      </div>
    );
  }

  // === JIKA USER TIDAK ADA ATAU AKSES DITOLAK ===
  if (!user || error) {
    router.replace("/auth/login");
    return null;
  }

  if (!accessChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-purple-600 mx-auto mb-2"></div>
          <p className="text-gray-600 text-xs">
            Mengalihkan ke dashboard Anda...
          </p>
        </div>
      </div>
    );
  }

  // === RENDER DASHBOARD HANYA JIKA SEMUA VALID ===
  return (
    <div className="relative min-h-screen bg-gray-50 lg:flex">
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-gray-800/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed top-0 left-0 z-40 h-full 
          ${isCollapsed ? "w-20" : "w-64"}
          ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 bg-white border-r border-gray-200 
          transition-all duration-300 flex flex-col 
        `}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <Image
                src="/MadeU.png"
                alt="Logo"
                width={15}
                height={15}
                className="w-5 h-5"
              />
              <h1 className="text-xl font-black tracking-tight">
                <span className="text-[#1a1464]">MAD</span>
                <span className="bg-gradient-to-r from-[#f5a623] to-[#f7c948] text-transparent bg-clip-text">
                  EU
                </span>
              </h1>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 hover:bg-gray-100 rounded-lg hidden lg:block"
          >
            {isCollapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
          </button>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2 hover:bg-gray-100 rounded-lg lg:hidden"
          >
            <ChevronLeft size={20} />
          </button>
        </div>
        <Sidebar
          role={user.role}
          isCollapsed={isCollapsed}
          toggleSidebar={() => setIsCollapsed(!isCollapsed)}
        />
      </div>

      {/* Main Content */}
      <div
        className={`flex-1 flex flex-col ${
          !isCollapsed ? "lg:ml-64" : "lg:ml-20"
        }`}
      >
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg lg:hidden"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2 lg:hidden">
              <Image
                src="/MadeU.png"
                alt="Logo"
                width={15}
                height={15}
                className="w-5 h-5"
              />
              <h1 className="text-lg font-black tracking-tight">
                <span className="text-[#1a1464]">MAD</span>
                <span className="bg-gradient-to-r from-[#f5a623] to-[#f7c948] text-transparent bg-clip-text">
                  EU
                </span>
              </h1>
            </div>
            <div className="hidden lg:flex flex-col lg:flex-row lg:items-center lg:gap-4">
              <h1 className="text-xl font-semibold text-gray-900">
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}{" "}
                Dashboard
              </h1>
              <span className="text-sm text-gray-500">
                {new Date().toLocaleDateString("id-ID", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>
          <Profile user={user} logout={logout} />
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
