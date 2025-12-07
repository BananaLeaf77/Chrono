"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { User, Settings, LogOut } from "lucide-react";

interface ProfileProps {
  user: {
    name: string;
    email: string;
    role: string;
    avatar?: string;
  };
  logout: () => Promise<void>;
}

const Profile: React.FC<ProfileProps> = ({ user, logout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      // logout() will handle token clearing and redirect
    } catch (error) {
      console.error("Logout failed:", error);
      // The logout function will handle the error case
    }
  };

  const getAvatarUrl = () => {
    if (user.avatar) return user.avatar;

    const role = user.role.toLowerCase();

    if (role === "teacher" && process.env.NEXT_PUBLIC_DEFAULT_AVATAR) {
      return process.env.NEXT_PUBLIC_DEFAULT_AVATAR;
    }

    if (role === "admin" && process.env.NEXT_PUBLIC_ADMIN_DEFAULT_AVATAR) {
      return process.env.NEXT_PUBLIC_ADMIN_DEFAULT_AVATAR;
    }

    if (role === "management" && process.env.NEXT_PUBLIC_MANAGER_DEFAULT_AVATAR) {
      return process.env.NEXT_PUBLIC_MANAGER_DEFAULT_AVATAR;
    }

    return null; 
  };

  const avatarSrc = getAvatarUrl();

  const getProfileRoute = () => {
    switch (user.role.toLowerCase()) {
      case "admin":
        return "/dashboard/panel/admin/profile";
      case "teacher":
        return "/dashboard/panel/teacher/profile";
      case "student":
        return "/dashboard/panel/student/profile";
      case "management":
        return "/dashboard/panel/manager/profile";
      default:
        return "/dashboard/profile";
    }
  };

  return (
    <div className="flex items-center gap-2 md:gap-4">
      {/* Profile Menu */}
      <div className="relative flex items-center">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="flex items-center gap-2 md:gap-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
         <div className="relative w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full overflow-hidden flex items-center justify-center">
            {avatarSrc ? (
              <Image
                src={avatarSrc}
                alt={user.name}
                width={40}
                height={40}
                className="object-cover w-full h-full"
                unoptimized
              />
            ) : (
              <span className="text-white font-bold text-lg">
                {user.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="hidden md:block text-right">
            <p className="text-sm font-medium text-gray-900">{user.name}</p>
            <p className="text-xs text-gray-500 capitalize">{user.role}</p>
          </div>
        </button>

        {isMenuOpen && (
          <div className="absolute right-0 top-full mt-2 w-56 md:w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
            <div className="md:hidden px-4 py-2 border-b border-gray-100">
              <p className="text-sm font-medium text-gray-900">{user.name}</p>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
            <div className="py-1">
              <button
                onClick={() => router.push(getProfileRoute())}
                className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
              >
                <User size={18} />
                <span>View Profile</span>
              </button>
              <button
                onClick={() => router.push("/settings")}
                className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
              >
                <Settings size={18} />
                <span>Settings</span>
              </button>
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3"
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
