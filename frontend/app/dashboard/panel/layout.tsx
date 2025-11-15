"use client";

import DashboardLayout from "../../dashboard/DashboardLayout";
import { AuthProvider } from "@/lib/auth";

export default function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <DashboardLayout>{children}</DashboardLayout>
    </AuthProvider>
  );
}
