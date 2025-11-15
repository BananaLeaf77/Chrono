"use client";

import { useState } from "react";

export default function DashboardAdmin() {
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "settings">("overview");

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>

      <div className="flex gap-4 mb-6">
        <button onClick={() => setActiveTab("overview")}>Overview</button>
        <button onClick={() => setActiveTab("users")}>Users</button>
        <button onClick={() => setActiveTab("settings")}>Settings</button>
      </div>

      <div>
        {activeTab === "overview" && <p>📊 Overview content goes here.</p>}
        {activeTab === "users" && <p>👥 User management content goes here.</p>}
        {activeTab === "settings" && <p>⚙️ Settings content goes here.</p>}
      </div>
    </div>
  );
}