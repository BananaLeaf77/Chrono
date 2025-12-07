"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MdClass } from "react-icons/md";
import {
  Home,
  ListMusic,
  CalendarDays,
  Users,
  Music2,
  Settings,
  HelpCircle,
  GraduationCap,
  Package,
  School,
  IdCard,
} from "lucide-react";

// Fixed color scheme for menu items (up to 6 items)
const colors = [
  {
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    hoverBg: "hover:bg-blue-50",
    hoverText: "hover:text-blue-600",
    hoverIcon: "group-hover:text-blue-600",
  },
  {
    color: "text-green-600",
    bgColor: "bg-green-50",
    hoverBg: "hover:bg-green-50",
    hoverText: "hover:text-green-600",
    hoverIcon: "group-hover:text-green-600",
  },
  {
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    hoverBg: "hover:bg-purple-50",
    hoverText: "hover:text-purple-600",
    hoverIcon: "group-hover:text-purple-600",
  },
  {
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    hoverBg: "hover:bg-orange-50",
    hoverText: "hover:text-orange-600",
    hoverIcon: "group-hover:text-orange-600",
  },
  {
    color: "text-teal-600",
    bgColor: "bg-teal-50",
    hoverBg: "hover:bg-teal-50",
    hoverText: "hover:text-teal-600",
    hoverIcon: "group-hover:text-teal-600",
  },
  {
    color: "text-red-600",
    bgColor: "bg-red-50",
    hoverBg: "hover:bg-red-50",
    hoverText: "hover:text-red-600",
    hoverIcon: "group-hover:text-red-600",
  },
];

const menuItems = {
  admin: [
    { title: "Dashboard", icon: <Home size={20} />, path: "/dashboard/panel/admin" },
    { title: "Instrumen", icon: <ListMusic size={20} />, path: "/dashboard/panel/admin/instrument" },
    { title: "Guru", icon: <GraduationCap size={20} />, path: "/dashboard/panel/admin/teacher" },
    { title: "Manager", icon: <Users size={20} />, path: "/dashboard/panel/admin/manager" },
    { title: "Murid", icon: <Users size={20} />, path: "/dashboard/panel/admin/student" },
    { title: "Paket", icon: <Package size={20} />, path: "/dashboard/panel/admin/package" },
  ],
  teacher: [
    { title: "Dashboard", icon: <Home size={20} />, path: "/dashboard/panel/teacher" },
    { title: "Jadwal", icon: <CalendarDays size={20} />, path: "/dashboard/panel/teacher/schedule" },
    { title: "Kelas", icon: <MdClass size={20} />, path: "/dashboard/panel/teacher/class" },
  ],
  student: [
    { title: "Dashboard", icon: <Home size={20} />, path: "/dashboard/panel/student" },
    { title: "Kelas Musik", icon: <Music2 size={20} />, path: "/dashboardStudent/schedule" },
    { title: "Kelas Saya", icon: <School size={20} />, path: "/dashboardStudent/courses" },
  ],
  management: [
    { title: "Dashboard", icon: <Home size={20} />, path: "/dashboard/panel/manager" },
    { title: "Data Murid", icon: <IdCard size={20} />, path: "/dashboard/panel/manager/my-student" },
  ],
};

interface SidebarProps {
  role: "admin" | "teacher" | "student" | "management";
  isCollapsed: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ role, isCollapsed }) => {
  const pathname = usePathname();
  const items = menuItems[role];

  return (
    <>
      {/* Navigation Items */}
      <nav className="flex-1 px-3 py-6 space-y-1 font-medium">
        {items.map((item, index) => {
          const isActive = pathname === item.path;
          const color = colors[index % colors.length]; // Cycle through colors if more items
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`
                group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
                ${
                  isActive
                    ? `${color.bgColor} ${color.color} font-medium shadow-sm border border-gray-200`
                    : `text-gray-600 ${color.hoverBg} ${color.hoverText}`
                }
                ${isCollapsed ? "justify-center" : ""}
              `}
            >
              <span
                className={`
                  p-2 rounded-lg transition-colors duration-200
                  ${
                    isActive
                      ? `${color.color} bg-white shadow-sm`
                      : `text-gray-400 ${color.hoverIcon} group-hover:bg-white group-hover:shadow-sm`
                  }
                `}
              >
                {item.icon}
              </span>
              {!isCollapsed && <span className="text-sm">{item.title}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Items */}
      <div className="px-3 py-4 border-t border-gray-200 space-y-1">
        <Link
          href="/dashboard/panel/setting"
          className={`
            flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
            text-gray-700 hover:bg-gray-100 
            ${isCollapsed ? "justify-center" : ""}
          `}
        >
          <Settings size={20} className="text-gray-500" />
          {!isCollapsed && <span className="text-sm">Settings</span>}
        </Link>
        <Link
          href="/help"
          className={`
            flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
            text-gray-700 hover:bg-gray-100
            ${isCollapsed ? "justify-center" : ""}
          `}
        >
          <HelpCircle size={20} className="text-gray-500" />
          {!isCollapsed && <span className="text-sm">Help Center</span>}
        </Link>
      </div>
    </>
  );
};

export default Sidebar;