"use client";

import { useState } from "react";

export default function Dashboard() {
    const [activeTab, setActiveTab] = useState<"overview" | "profile" | "settings">("overview");
    return (
        <div className="div">
        <h1 className="text-2xl font-bold mb-4">User Dashboard</h1>

        <div className="flex gap-4 mb-6">
            <button onClick={() => setActiveTab("overview")}>Overview</button>
            <button onClick={() => setActiveTab("profile")}>Profile</button>
            <button onClick={() => setActiveTab("settings")}>Settings</button>
        </div>

        <div>
            {activeTab === "overview" && <p>📊 Overview content goes here.</p>}
            {activeTab === "profile" && <p>👤 Profile content goes here.</p>}
            {activeTab === "settings" && <p>⚙️ Settings content goes here.</p>}
        </div>
        </div>
    )
}